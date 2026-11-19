import crypto from 'node:crypto';
import { db, getWorkspaceConfig } from './db.js';
import { parseMultipart } from './multipart.js';
import { dispatchSubmissionEmails, interpolateTemplate } from './mailer.js';
import { getShowcaseTemplate } from './templates.js';
import { dispatchWebhooks } from './webhooks.js';

const SPECIAL_KEYS = new Set([
  '_gotcha',
  '_next',
  '_replyto',
  '_subject',
  '_cc',
  '_format',
  '_language',
  'cf-turnstile-response',
]);

// Sliding window in-memory rate limiter per (formId + IP)
const rateBuckets = new Map();

function checkRateLimit(formId, ip, maxPerHour) {
  const limit = Math.max(1, Number(maxPerHour) || 120);
  const key = `${formId}:${ip}`;
  const now = Date.now();
  const windowMs = 60 * 60 * 1000;
  const timestamps = (rateBuckets.get(key) || []).filter((ts) => now - ts < windowMs);

  if (timestamps.length >= limit) {
    return { allowed: false, limit, remaining: 0 };
  }

  timestamps.push(now);
  rateBuckets.set(key, timestamps);
  return { allowed: true, limit, remaining: Math.max(0, limit - timestamps.length) };
}

function getHostname(urlStr) {
  if (!urlStr) return '';
  try {
    return new URL(urlStr).hostname.toLowerCase();
  } catch {
    return '';
  }
}

function isOriginAllowed(allowedOrigins, requestOrigin, referer) {
  const configured = (allowedOrigins || '*').trim();
  if (!configured || configured === '*') return true;

  const source = requestOrigin || referer;
  if (!source) return true; // Direct server-to-server / cURL requests

  const host = getHostname(source);
  if (!host) return false;
  if (host === 'localhost' || host === '127.0.0.1') return true;

  const rules = configured
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  return rules.some((rule) => {
    const cleanRule = rule.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    return host === cleanRule || host.endsWith(`.${cleanRule}`);
  });
}

function readRawBody(req, maxBytes = 15 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;

    req.on('data', (chunk) => {
      total += chunk.length;
      if (total > maxBytes) {
        reject(new Error('Payload exceeds maximum size limit (15 MB)'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function applyCorsHeaders(res, origin) {
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Accept, Content-Type, X-Requested-With');
  res.setHeader('Vary', 'Origin');
}

export function handleIngestOptions(req, res) {
  applyCorsHeaders(res, req.headers.origin);
  res.writeHead(204);
  res.end();
}

export async function handleIngestPost(req, res, formId, baseUrl) {
  const origin = req.headers.origin || '';
  const referer = req.headers.referer || '';
  const accept = req.headers.accept || '';
  const wantsJson =
    accept.includes('application/json') ||
    req.headers['x-requested-with'] === 'XMLHttpRequest' ||
    (req.headers['content-type'] || '').includes('application/json');

  applyCorsHeaders(res, origin);

  const showcaseTpl = getShowcaseTemplate(formId);
  if (showcaseTpl) {
    await readRawBody(req).catch(() => {});
    const subId = `demo_${crypto.randomBytes(4).toString('hex')}`;
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ ok: true, isDemoTemplate: true, submissionId: subId }));
    return;
  }

  const trace = [];
  const form = db.prepare('SELECT * FROM forms WHERE id = ?').get(formId);

  if (!form) {
    return sendError(res, wantsJson, 404, 'Form endpoint not found.');
  }

  if (!form.is_active) {
    return sendError(res, wantsJson, 403, 'This form is currently paused.');
  }

  // Enforce 1-Key-1-Domain License & Live Preview Trial Limit
  const ws = getWorkspaceConfig(origin || referer);
  const lic = ws.license;
  if (lic?.domainMismatch) {
    trace.push({ step: 'license', status: 'blocked', detail: lic.message });
    return sendError(res, wantsJson, 403, lic.message, trace);
  }
  if (!lic?.isLicensed && lic?.isPreviewLocked) {
    trace.push({ step: 'license', status: 'locked', detail: lic.message });
    return sendError(res, wantsJson, 402, lic.message, trace);
  }
  trace.push({
    step: 'license',
    status: 'passed',
    detail: lic?.isLicensed
      ? `Verified single-domain license (${lic.licensedDomain})`
      : `Live Preview Mode (${lic?.previewRemaining ?? 1} test enquiries remaining)`,
  });

  // 1. CORS / Allowed Origin validation
  if (!isOriginAllowed(form.allowed_origins, origin, referer)) {
    return sendError(res, wantsJson, 403, `Origin "${origin || referer}" is not whitelisted for this form.`);
  }
  trace.push({ step: 'origin', status: 'passed', detail: form.allowed_origins === '*' ? 'Open CORS (*)' : `Matched ${form.allowed_origins}` });

  // 2. IP Rate limit check
  const clientIp =
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    '127.0.0.1';

  const rate = checkRateLimit(form.id, clientIp, form.rate_limit_per_hour);
  res.setHeader('X-RateLimit-Limit', String(rate.limit));
  res.setHeader('X-RateLimit-Remaining', String(rate.remaining));

  if (!rate.allowed) {
    return sendError(res, wantsJson, 429, 'Rate limit exceeded. Please try again later.');
  }
  trace.push({ step: 'rate_limit', status: 'passed', detail: `${rate.remaining}/${rate.limit} remaining this hour` });

  // 3. Parse request body (JSON, URL-encoded, or Multipart)
  let rawFields = {};
  let attachments = [];
  const contentType = req.headers['content-type'] || 'application/x-www-form-urlencoded';

  try {
    const rawBuffer = await readRawBody(req);
    if (contentType.includes('application/json')) {
      const parsed = JSON.parse(rawBuffer.toString('utf8') || '{}');
      rawFields = parsed && typeof parsed === 'object' ? parsed : {};
    } else if (contentType.includes('multipart/form-data')) {
      const parsed = parseMultipart(rawBuffer, contentType);
      rawFields = parsed.fields;
      attachments = parsed.attachments;
    } else {
      const params = new URLSearchParams(rawBuffer.toString('utf8'));
      for (const [k, v] of params.entries()) {
        if (Object.prototype.hasOwnProperty.call(rawFields, k)) {
          rawFields[k] = Array.isArray(rawFields[k]) ? [...rawFields[k], v] : [rawFields[k], v];
        } else {
          rawFields[k] = v;
        }
      }
    }
  } catch (err) {
    return sendError(res, wantsJson, 400, err.message || 'Unable to parse submission payload.');
  }

  // 4. Extract Formspree-compatible directives & user fields
  const directives = {
    gotcha: String(rawFields._gotcha || '').trim(),
    next: String(rawFields._next || '').trim(),
    replyTo: String(rawFields._replyto || '').trim(),
    subject: String(rawFields._subject || '').trim(),
    cc: String(rawFields._cc || '').trim(),
    format: String(rawFields._format || 'html').trim(),
  };

  const cleanFields = {};
  for (const [key, val] of Object.entries(rawFields)) {
    if (!SPECIAL_KEYS.has(key)) {
      cleanFields[key] = val;
    }
  }

  const senderEmail =
    directives.replyTo ||
    cleanFields.email ||
    cleanFields.Email ||
    cleanFields.work_email ||
    null;

  const senderName =
    cleanFields.name ||
    cleanFields.full_name ||
    cleanFields.Name ||
    cleanFields.first_name ||
    null;

  const resolvedSubject = interpolateTemplate(
    directives.subject || `New submission: ${form.name}`,
    cleanFields
  ).trim();

  // 4B. Optional Cloudflare Turnstile verification
  const turnstileSecret = (form.turnstile_secret_key || '').trim();
  if (turnstileSecret) {
    const token = String(rawFields['cf-turnstile-response'] || '').trim();
    if (!token) {
      return sendError(res, wantsJson, 400, 'Please complete the human verification check.');
    }
    try {
      const verifyBody = new URLSearchParams({
        secret: turnstileSecret,
        response: token,
        remoteip: clientIp,
      });
      const vRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        body: verifyBody,
      });
      const vData = await vRes.json().catch(() => ({ success: false }));
      if (!vData.success) {
        return sendError(res, wantsJson, 403, 'Human verification failed. Please try again.');
      }
      trace.push({ step: 'turnstile', status: 'passed', detail: 'Cloudflare Turnstile verified' });
    } catch {
      trace.push({ step: 'turnstile', status: 'warning', detail: 'Turnstile unreachable in local mode' });
    }
  }

  // 5. Honeypot check (_gotcha)
  const isHoneypotTripped = Boolean(form.enable_honeypot && directives.gotcha.length > 0);
  const submissionId = `sub_${crypto.randomBytes(6).toString('hex')}`;
  const nowIso = new Date().toISOString();

  db.prepare(`
    INSERT INTO submissions (
      id, form_id, data_json, attachments_json, sender_email, sender_name, subject,
      sender_ip, user_agent, origin, content_type, is_spam, spam_reason, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    submissionId,
    form.id,
    JSON.stringify(cleanFields),
    JSON.stringify(attachments),
    senderEmail ? String(senderEmail) : null,
    senderName ? String(senderName) : null,
    resolvedSubject,
    clientIp,
    req.headers['user-agent'] || '',
    origin || referer || 'Direct POST',
    contentType.split(';')[0],
    isHoneypotTripped ? 1 : 0,
    isHoneypotTripped ? `Honeypot (_gotcha) filled with "${directives.gotcha.slice(0, 40)}"` : null,
    nowIso
  );

  let mailLogs = [];
  let webhookResults = [];

  if (isHoneypotTripped) {
    // Classic Formspree anti-bot behavior: silently log as spam, skip notifications/webhooks,
    // and return an ordinary success response so bots do not adapt.
    trace.push({ step: 'honeypot', status: 'intercepted', detail: 'Field _gotcha was populated — flagged as spam; email & webhooks suppressed.' });
  } else {
    trace.push({ step: 'honeypot', status: 'passed', detail: '_gotcha empty' });
    trace.push({ step: 'storage', status: 'passed', detail: `Persisted ${submissionId} to SQLite` });

    const meta = {
      ip: clientIp,
      origin: origin || referer || 'Direct POST',
      userAgent: req.headers['user-agent'] || '',
      timestamp: nowIso,
    };

    mailLogs = dispatchSubmissionEmails({
      form,
      submissionId,
      fields: cleanFields,
      attachments,
      directives,
      meta,
    });

    if (mailLogs.length > 0) {
      trace.push({ step: 'mailer', status: 'passed', detail: `Dispatched ${mailLogs.length} email(s) to Mail Outbox` });
    }

    webhookResults = await dispatchWebhooks({
      form,
      submissionId,
      fields: cleanFields,
      attachments,
      meta,
    });

    if (webhookResults.length > 0) {
      const okCount = webhookResults.filter((w) => w.success).length;
      trace.push({ step: 'webhooks', status: okCount === webhookResults.length ? 'passed' : 'warning', detail: `${okCount}/${webhookResults.length} webhook(s) delivered` });
    }
  }

  // 6. Content negotiation: JSON response vs HTML 303 redirect
  if (wantsJson) {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(
      JSON.stringify({
        ok: true,
        id: submissionId,
        next: resolveRedirect(directives.next, form.redirect_url, baseUrl, form.id),
        spam: isHoneypotTripped,
        emails: mailLogs,
        webhooks: webhookResults,
        trace,
      })
    );
    return;
  }

  const redirectTo = resolveRedirect(directives.next, form.redirect_url, baseUrl, form.id);
  res.writeHead(303, { Location: redirectTo });
  res.end();
}

function resolveRedirect(directiveNext, formDefaultRedirect, baseUrl, formId) {
  const candidate = directiveNext || formDefaultRedirect;
  if (candidate) {
    if (candidate.startsWith('/')) return candidate;
    try {
      const parsed = new URL(candidate);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        return parsed.toString();
      }
    } catch {
      // Fallback to hosted thank-you page if invalid URL
    }
  }
  return `${baseUrl}/thanks?form=${encodeURIComponent(formId)}`;
}

function sendError(res, wantsJson, statusCode, message) {
  if (wantsJson) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ ok: false, errors: [{ message }] }));
    return;
  }
  res.writeHead(statusCode, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`<!doctype html>
<html><head><meta charset="utf-8"><title>Submission Error</title></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f7f5f2;color:#141210;padding:48px 20px;">
  <div style="max-width:480px;margin:0 auto;background:#fff;border:1px solid #e2dcd5;border-radius:12px;padding:32px;">
    <h1 style="margin:0 0 12px;font-size:20px;">Unable to process submission</h1>
    <p style="margin:0 0 20px;color:#49443f;line-height:1.55;">${message}</p>
    <a href="javascript:history.back()" style="display:inline-block;padding:10px 20px;border-radius:999px;background:#095c4f;color:#fff;text-decoration:none;font-size:14px;font-weight:600;">Go back</a>
  </div>
</body></html>`);
}
