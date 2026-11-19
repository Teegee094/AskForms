import { renderManagePortalPage, renderManifestJson } from '../server/manage-page.js';
import { renderClientDemoPage, renderEmbedPage, renderThanksPage } from '../server/pages.js';
import { renderCommercialSitePage } from '../server/site-page.js';

const DEFAULT_FIELDS = [
  { name: 'name', label: 'Full name', type: 'text', placeholder: 'Alex Mercer', required: true, half: true },
  { name: 'email', label: 'Email address', type: 'email', placeholder: 'alex@company.com.au', required: true, half: true },
  { name: 'phone', label: 'Phone number', type: 'tel', placeholder: '0400 000 000', required: false, half: true },
  { name: 'topic', label: 'Enquiry type', type: 'select', options: ['General Enquiry', 'Request a Quote', 'Book a Consultation', 'Support'], required: false, half: true },
  { name: 'message', label: 'How can we help?', type: 'textarea', placeholder: 'Tell us a little about what you need...', required: true, half: false },
];

const PREVIEW_LIMIT = 10;

function jsonResp(status, data, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...extraHeaders,
    },
  });
}

function htmlResp(status, html) {
  return new Response(html, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Accept, Content-Type, X-Requested-With',
    Vary: 'Origin',
  };
}

function normalizeDomain(input) {
  let str = String(input || '').trim().toLowerCase();
  if (!str) return '';
  try {
    if (str.includes('://')) str = new URL(str).hostname.toLowerCase();
    else str = str.split('/')[0].split(':')[0].trim();
  } catch {
    str = str.replace(/^https?:\/\//, '').split('/')[0].split(':')[0].trim();
  }
  return str.replace(/^www\./, '').replace(/\.$/, '');
}

function parseB64UrlJson(b64) {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4);
  const std = (b64 + pad).replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(atob(std));
}

function toB64Url(str) {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function parseKeyPayload(rawKey) {
  const raw = String(rawKey || '').trim();
  if (!raw.startsWith('ASK1.')) return null;
  const parts = raw.split('.');
  if (parts.length !== 3) return null;
  try {
    const payload = parseB64UrlJson(parts[1]);
    if (!payload.domain) return null;
    return {
      valid: true,
      licenseId: payload.id || 'ask-lic',
      domain: normalizeDomain(payload.domain),
      holder: payload.holder || payload.domain,
      plan: payload.plan || 'lifetime-single-site',
      issuedAt: payload.issued_at || null,
    };
  } catch {
    return null;
  }
}

async function getWorkspace(db, reqOrigin = '') {
  const { results } = await db.prepare('SELECT key, value FROM app_settings').all();
  const map = {};
  for (const r of results || []) map[r.key] = r.value;

  const subRow = await db.prepare('SELECT COUNT(*) AS c FROM submissions WHERE is_spam = 0').first();
  const used = Number(subRow?.c || 0);
  const remaining = Math.max(0, PREVIEW_LIMIT - used);
  const rawKey = map.license_key || '';
  const verified = parseKeyPayload(rawKey);
  const reqHost = normalizeDomain(reqOrigin);

  let license;
  if (!verified) {
    license = {
      status: 'preview',
      isLicensed: false,
      domainMismatch: false,
      isPreviewLocked: used >= PREVIEW_LIMIT,
      previewLimit: PREVIEW_LIMIT,
      previewUsed: used,
      previewRemaining: remaining,
      licensedDomain: null,
      holder: null,
      message: `Live Preview Mode (${remaining} of ${PREVIEW_LIMIT} test enquiries remaining).`,
    };
  } else {
    const isLocalOrSelf = !reqHost || reqHost === 'localhost' || reqHost === '127.0.0.1' || reqHost === 'askforms.app' || reqHost.endsWith('.askforms.app') || reqHost.endsWith('.pages.dev');
    const matches = isLocalOrSelf || reqHost === verified.domain || reqHost.endsWith(`.${verified.domain}`);
    if (!matches) {
      license = {
        status: 'domain_mismatch',
        isLicensed: false,
        domainMismatch: true,
        isPreviewLocked: true,
        licensedDomain: verified.domain,
        requestDomain: reqHost,
        holder: verified.holder,
        message: `License key is bound exclusively to ${verified.domain} and cannot be used on ${reqHost}.`,
      };
    } else {
      license = {
        status: 'active',
        isLicensed: true,
        domainMismatch: false,
        isPreviewLocked: false,
        licensedDomain: verified.domain,
        holder: verified.holder,
        licenseId: verified.licenseId,
        issuedAt: verified.issuedAt,
        message: `Lifetime Single-Site License active for ${verified.domain}`,
      };
    }
  }

  return {
    brand_name: map.brand_name || 'AskForms',
    website_url: map.website_url || 'https://askforms.app',
    support_email: map.support_email || '',
    license_holder: license.isLicensed ? license.holder : (map.license_holder || 'Preview Mode'),
    license_key_preview: rawKey ? `${rawKey.slice(0, 14)}••••${rawKey.slice(-8)}` : '',
    has_license_key: Boolean(rawKey),
    license,
    logo_url: map.logo_url || '',
    accent_color: map.accent_color || '#14383e',
    accent_text_color: map.accent_text_color || '#ffffff',
    bg_color: map.bg_color || '#f7fafc',
    surface_color: map.surface_color || '#ffffff',
    font_preset: map.font_preset || 'minimal',
    radius_preset: map.radius_preset || 'balanced',
    thanks_heading: map.thanks_heading || 'Submission received',
    thanks_body: map.thanks_body || 'Thank you for getting in touch. Your message has been recorded and our team will respond shortly.',
    email_footer: map.email_footer || '',
    email_provider: map.email_provider || 'local',
    mail_from: map.mail_from || 'forms@askforms.app',
    has_resend_key: Boolean(map.resend_api_key),
    resend_api_key_preview: map.resend_api_key ? `${map.resend_api_key.slice(0, 7)}••••` : '',
    auth_enabled: false,
    auth_from_env: false,
    owner_pin_enabled: false,
    setup_completed: map.setup_completed === 'true',
  };
}

async function setSetting(db, key, val) {
  await db
    .prepare('INSERT INTO app_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')
    .bind(key, String(val ?? ''))
    .run();
}

function parseFields(form) {
  try {
    const parsed = JSON.parse(form?.fields_json || '[]');
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {}
  return DEFAULT_FIELDS;
}

async function listFormsWithCounts(db) {
  const { results } = await db
    .prepare(`
      SELECT
        f.*,
        (SELECT COUNT(*) FROM submissions s WHERE s.form_id = f.id AND s.is_spam = 0) AS submission_count,
        (SELECT COUNT(*) FROM submissions s WHERE s.form_id = f.id AND s.is_spam = 1) AS spam_count,
        (SELECT MAX(s.created_at) FROM submissions s WHERE s.form_id = f.id) AS last_submission_at,
        (SELECT COUNT(*) FROM webhooks w WHERE w.form_id = f.id AND w.is_active = 1) AS active_webhooks
      FROM forms f
      ORDER BY f.created_at ASC
    `)
    .all();
  return results || [];
}

async function getFormWithCounts(db, formId) {
  return await db
    .prepare(`
      SELECT
        f.*,
        (SELECT COUNT(*) FROM submissions s WHERE s.form_id = f.id AND s.is_spam = 0) AS submission_count,
        (SELECT COUNT(*) FROM submissions s WHERE s.form_id = f.id AND s.is_spam = 1) AS spam_count,
        (SELECT MAX(s.created_at) FROM submissions s WHERE s.form_id = f.id) AS last_submission_at,
        (SELECT COUNT(*) FROM webhooks w WHERE w.form_id = f.id AND w.is_active = 1) AS active_webhooks
      FROM forms f
      WHERE f.id = ?
    `)
    .bind(formId)
    .first();
}

async function getStats(db) {
  const activeForms = (await db.prepare('SELECT COUNT(*) AS c FROM forms WHERE is_active = 1 AND COALESCE(is_archived, 0) = 0').first())?.c || 0;
  const archivedForms = (await db.prepare('SELECT COUNT(*) AS c FROM forms WHERE COALESCE(is_archived, 0) = 1').first())?.c || 0;
  const totalForms = (await db.prepare('SELECT COUNT(*) AS c FROM forms').first())?.c || 0;
  const validSubmissions = (await db.prepare('SELECT COUNT(*) AS c FROM submissions WHERE is_spam = 0').first())?.c || 0;
  const spamBlocked = (await db.prepare('SELECT COUNT(*) AS c FROM submissions WHERE is_spam = 1').first())?.c || 0;
  const emailsSent = (await db.prepare('SELECT COUNT(*) AS c FROM mail_logs').first())?.c || 0;
  const webhookTotal = (await db.prepare('SELECT COUNT(*) AS c FROM webhook_logs').first())?.c || 0;
  return {
    activeForms,
    archivedForms,
    totalForms,
    validSubmissions,
    spamBlocked,
    emailsSent,
    webhookTotal,
    webhookOk: webhookTotal,
    deliveryRate: 100,
  };
}

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;
  const method = request.method.toUpperCase();
  const baseUrl = url.origin;
  const db = env.DB;

  if (!db) {
    return next();
  }

  // Standalone HTML Pages
  if (pathname === '/manage' && method === 'GET') {
    return htmlResp(200, renderManagePortalPage(await getWorkspace(db)));
  }

  if (pathname === '/site' && method === 'GET') {
    const first = await db.prepare('SELECT id FROM forms ORDER BY created_at ASC LIMIT 1').first();
    return htmlResp(200, renderCommercialSitePage(await getWorkspace(db), first?.id || 'audit-intake', baseUrl));
  }

  if (pathname === '/manifest.json' && method === 'GET') {
    return new Response(renderManifestJson(await getWorkspace(db)), {
      status: 200,
      headers: { 'Content-Type': 'application/manifest+json; charset=utf-8' },
    });
  }

  if (pathname === '/thanks' && method === 'GET') {
    const formId = url.searchParams.get('form');
    const form = formId ? await db.prepare('SELECT * FROM forms WHERE id = ?').bind(formId).first() : null;
    return htmlResp(200, renderThanksPage(form, await getWorkspace(db)));
  }

  const embedMatch = pathname.match(/^\/embed\/([a-zA-Z0-9_-]+)\/?$/);
  if (embedMatch && method === 'GET') {
    const form = await db.prepare('SELECT * FROM forms WHERE id = ?').bind(embedMatch[1]).first();
    if (!form) return new Response('Form not found', { status: 404 });
    const reqSource = request.headers.get('Origin') || request.headers.get('Referer') || '';
    return htmlResp(200, renderEmbedPage(form, parseFields(form), baseUrl, await getWorkspace(db, reqSource)));
  }

  const demoMatch = pathname.match(/^\/demo\/([a-zA-Z0-9_-]+)\/?$/);
  if (demoMatch && method === 'GET') {
    const form = await db.prepare('SELECT * FROM forms WHERE id = ?').bind(demoMatch[1]).first();
    if (!form) return new Response('Form not found', { status: 404 });
    const theme = url.searchParams.get('theme') || form.theme_preset || 'teagee';
    return htmlResp(200, renderClientDemoPage(form, theme, baseUrl, await getWorkspace(db)));
  }

  // Form Ingestion: POST /f/:formId
  const ingestMatch = pathname.match(/^\/f\/([a-zA-Z0-9_-]+)\/?$/);
  if (ingestMatch) {
    const formId = ingestMatch[1];
    const origin = request.headers.get('Origin') || '';
    const referer = request.headers.get('Referer') || '';
    if (method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }
    if (method !== 'POST') {
      return jsonResp(405, { error: 'Use POST' }, corsHeaders(origin));
    }
    const form = await db.prepare('SELECT * FROM forms WHERE id = ?').bind(formId).first();
    if (!form) return jsonResp(404, { ok: false, error: 'Form not found' }, corsHeaders(origin));
    if (!form.is_active) return jsonResp(403, { ok: false, error: 'Form paused' }, corsHeaders(origin));

    const ws = await getWorkspace(db, origin || referer);
    if (ws.license?.domainMismatch) {
      return jsonResp(403, { ok: false, error: ws.license.message }, corsHeaders(origin));
    }
    if (!ws.license?.isLicensed && ws.license?.isPreviewLocked) {
      return jsonResp(402, { ok: false, error: ws.license.message }, corsHeaders(origin));
    }

    const ct = request.headers.get('Content-Type') || '';
    const raw = {};
    if (ct.includes('application/json')) {
      Object.assign(raw, await request.json().catch(() => ({})));
    } else {
      const fd = await request.formData();
      for (const [k, v] of fd.entries()) {
        if (typeof v === 'string') raw[k] = v;
      }
    }

    const isSpam = Boolean(form.enable_honeypot && raw._gotcha && String(raw._gotcha).trim() !== '');
    const fields = {};
    for (const [k, v] of Object.entries(raw)) {
      if (!['_gotcha', '_next', '_replyto', '_subject', '_cc'].includes(k)) fields[k] = v;
    }

    const subId = `sub_${crypto.randomUUID().slice(0, 10)}`;
    const nowIso = new Date().toISOString();
    await db
      .prepare(`
        INSERT INTO submissions (id, form_id, data_json, sender_email, sender_name, subject, origin, content_type, is_spam, spam_reason, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        subId,
        formId,
        JSON.stringify(fields),
        String(raw._replyto || fields.email || ''),
        String(fields.name || ''),
        String(raw._subject || `${form.name} Enquiry`),
        origin || referer || 'Direct POST',
        ct || 'application/json',
        isSpam ? 1 : 0,
        isSpam ? 'Honeypot _gotcha triggered' : '',
        nowIso
      )
      .run();

    const trace = [
      { step: 'license', status: 'passed', detail: ws.license?.message || 'OK' },
      { step: 'honeypot', status: isSpam ? 'intercepted' : 'passed', detail: isSpam ? 'Bot trapped by _gotcha' : 'Clean submission' },
      { step: 'sqlite', status: 'passed', detail: `Stored as ${subId}` },
    ];

    const accept = request.headers.get('Accept') || '';
    if (accept.includes('application/json') || ct.includes('application/json')) {
      return jsonResp(200, { ok: true, submissionId: subId, spam: isSpam, next: raw._next || form.redirect_url || '/thanks', trace }, corsHeaders(origin));
    }
    return Response.redirect(`${baseUrl}${raw._next || form.redirect_url || `/thanks?form=${formId}`}`, 303);
  }

  // REST API Routes (/api/*)
  if (pathname === '/api/auth/status' && method === 'GET') {
    return jsonResp(200, { authEnabled: false, authenticated: true, workspace: await getWorkspace(db) });
  }

  if (pathname === '/api/manage/status' && method === 'GET') {
    return jsonResp(200, { pinEnabled: false, authenticated: true });
  }

  if (pathname === '/api/manage/enquiries' && method === 'GET') {
    const filter = url.searchParams.get('filter') || 'new';
    let rows;
    if (['new', 'replied', 'closed'].includes(filter)) {
      rows = (await db.prepare('SELECT s.*, f.name AS form_name FROM submissions s JOIN forms f ON f.id = s.form_id WHERE s.is_spam = 0 AND s.status = ? ORDER BY s.created_at DESC LIMIT 200').bind(filter).all()).results || [];
    } else {
      rows = (await db.prepare('SELECT s.*, f.name AS form_name FROM submissions s JOIN forms f ON f.id = s.form_id WHERE s.is_spam = 0 ORDER BY s.created_at DESC LIMIT 200').all()).results || [];
    }
    return jsonResp(200, {
      enquiries: rows.map((r) => ({ ...r, data: JSON.parse(r.data_json || '{}'), attachments: JSON.parse(r.attachments_json || '[]') })),
    });
  }

  const manageSubMatch = pathname.match(/^\/api\/manage\/enquiries\/([a-zA-Z0-9_-]+)$/);
  if (manageSubMatch && method === 'PATCH') {
    const body = await request.json().catch(() => ({}));
    await db.prepare('UPDATE submissions SET status = COALESCE(?, status), notes = COALESCE(?, notes) WHERE id = ?').bind(body.status || null, body.notes ?? null, manageSubMatch[1]).run();
    return jsonResp(200, { updated: true });
  }

  if (pathname === '/api/bootstrap' && method === 'GET') {
    return jsonResp(200, {
      baseUrl,
      stats: await getStats(db),
      forms: await listFormsWithCounts(db),
      workspace: await getWorkspace(db),
    });
  }

  if (pathname === '/api/workspace' && method === 'GET') {
    return jsonResp(200, { workspace: await getWorkspace(db) });
  }

  if (pathname === '/api/workspace' && method === 'PATCH') {
    const body = await request.json().catch(() => ({}));
    for (const k of ['brand_name', 'website_url', 'support_email', 'license_holder', 'logo_url', 'accent_color', 'accent_text_color', 'bg_color', 'font_preset', 'radius_preset', 'thanks_heading', 'thanks_body', 'email_footer', 'email_provider', 'mail_from', 'resend_api_key']) {
      if (body[k] !== undefined) await setSetting(db, k, body[k]);
    }
    return jsonResp(200, { workspace: await getWorkspace(db) });
  }

  if (pathname === '/api/license/activate' && method === 'POST') {
    const body = await request.json().catch(() => ({}));
    const verified = parseKeyPayload(body.license_key);
    if (!verified) return jsonResp(400, { error: 'Invalid ASK1 license key.' });
    await setSetting(db, 'license_key', String(body.license_key).trim());
    await setSetting(db, 'license_holder', verified.holder);
    await setSetting(db, 'website_url', `https://${verified.domain}`);
    return jsonResp(200, { activated: true, verified, workspace: await getWorkspace(db) });
  }

  if (pathname === '/api/license/issue' && method === 'POST') {
    const body = await request.json().catch(() => ({}));
    const cleanDomain = normalizeDomain(body.domain);
    if (!cleanDomain || !cleanDomain.includes('.')) {
      return jsonResp(400, { error: 'Enter a valid domain (e.g. harbourplumbing.com.au)' });
    }
    const payload = {
      id: `lic_${crypto.randomUUID().slice(0, 10)}`,
      domain: cleanDomain,
      holder: String(body.holder || cleanDomain).trim(),
      plan: 'lifetime-single-site',
      issued_at: new Date().toISOString().slice(0, 10),
    };
    const key = `ASK1.${toB64Url(JSON.stringify(payload))}.${toB64Url(crypto.randomUUID())}`;
    if (body.activate !== false) {
      await setSetting(db, 'license_key', key);
      await setSetting(db, 'license_holder', payload.holder);
      await setSetting(db, 'website_url', `https://${payload.domain}`);
    }
    return jsonResp(200, { key, payload, workspace: await getWorkspace(db) });
  }

  if (pathname === '/api/license/remove' && method === 'POST') {
    await db.prepare("DELETE FROM app_settings WHERE key = 'license_key'").run();
    return jsonResp(200, { removed: true, workspace: await getWorkspace(db) });
  }

  if (pathname === '/api/license/checkout' && method === 'POST') {
    const body = await request.json().catch(() => ({}));
    const cleanDomain = normalizeDomain(body.domain);
    const holder = String(body.holder || cleanDomain).trim();
    if (!cleanDomain || !cleanDomain.includes('.')) {
      return jsonResp(400, { error: 'Enter a valid domain (e.g. harbourplumbing.com.au)' });
    }
    const stripeKey = env.STRIPE_API_KEY || '';
    if (!stripeKey) {
      return jsonResp(400, { error: 'STRIPE_API_KEY is not configured.' });
    }
    const priceAud = Number(env.LICENSE_PRICE_AUD || 149);
    const params = new URLSearchParams({
      mode: 'payment',
      'managed_payments[enabled]': 'false',
      success_url: `${baseUrl}/site?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/site?domain=${encodeURIComponent(cleanDomain)}`,
      'line_items[0][price_data][currency]': 'aud',
      'line_items[0][price_data][unit_amount]': String(Math.round(priceAud * 100)),
      'line_items[0][price_data][product_data][name]': `AskForms — Single-Domain Lifetime License (${cleanDomain})`,
      'line_items[0][price_data][product_data][description]': `Lifetime single-website license locked to ${cleanDomain} (${holder})`,
      'line_items[0][quantity]': '1',
      'metadata[domain]': cleanDomain,
      'metadata[holder]': holder,
    });

    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });
    const session = await stripeRes.json();
    if (!stripeRes.ok || !session.url) {
      return jsonResp(400, { error: session?.error?.message || 'Unable to create Stripe Checkout session.' });
    }
    return jsonResp(200, {
      checkoutUrl: session.url,
      sessionId: session.id,
      domain: cleanDomain,
    });
  }

  if (pathname === '/api/license/verify-session' && method === 'GET') {
    const sessionId = (url.searchParams.get('session_id') || '').trim();
    const stripeKey = env.STRIPE_API_KEY || '';
    if (!sessionId || !stripeKey) {
      return jsonResp(400, { error: 'Missing session_id or Stripe configuration.' });
    }
    const stripeRes = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, {
      headers: { Authorization: `Bearer ${stripeKey}` },
    });
    const session = await stripeRes.json();
    if (!stripeRes.ok) {
      return jsonResp(400, { error: session?.error?.message || 'Unable to verify Stripe session.' });
    }
    if (session.payment_status !== 'paid') {
      return jsonResp(402, { paid: false, status: session.payment_status });
    }
    const cleanDomain = normalizeDomain(session.metadata?.domain || '');
    const holder = String(session.metadata?.holder || cleanDomain).trim();
    const payload = {
      id: `lic_${crypto.randomUUID().slice(0, 10)}`,
      domain: cleanDomain,
      holder,
      plan: 'lifetime-single-site',
      issued_at: new Date().toISOString().slice(0, 10),
    };
    const key = `ASK1.${toB64Url(JSON.stringify(payload))}.${toB64Url(crypto.randomUUID())}`;
    await setSetting(db, 'license_key', key);
    await setSetting(db, 'license_holder', payload.holder);
    await setSetting(db, 'website_url', `https://${payload.domain}`);
    return jsonResp(200, {
      paid: true,
      key,
      payload,
      workspace: await getWorkspace(db),
    });
  }

  if (pathname === '/api/forms' && method === 'GET') {
    return jsonResp(200, { forms: await listFormsWithCounts(db) });
  }

  if (pathname === '/api/forms' && method === 'POST') {
    const body = await request.json().catch(() => ({}));
    const name = String(body.name || 'Website Enquiry').trim();
    const id = (body.id || name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || `form-${Date.now()}`;
    const fields = Array.isArray(body.fields) && body.fields.length > 0 ? body.fields : DEFAULT_FIELDS;
    await db
      .prepare(`
        INSERT INTO forms (id, name, client_name, theme_preset, email_recipients, allowed_origins, fields_json, submit_label, multi_step, review_gate_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(id, name, body.client_name || 'Website', body.theme_preset || 'teagee', body.email_recipients || '', body.allowed_origins || '*', JSON.stringify(fields), body.submit_label || 'Send enquiry', body.multi_step ? 1 : 0, body.review_gate_url || '')
      .run();
    const created = await getFormWithCounts(db, id);
    return jsonResp(201, { form: { ...created, fields: parseFields(created) } });
  }

  const formMatch = pathname.match(/^\/api\/forms\/([a-zA-Z0-9_-]+)$/);
  if (formMatch) {
    const formId = formMatch[1];
    const form = await getFormWithCounts(db, formId);
    if (!form) return jsonResp(404, { error: 'Form not found' });
    if (method === 'GET') {
      const webhooks = (await db.prepare('SELECT * FROM webhooks WHERE form_id = ? ORDER BY created_at DESC').bind(formId).all()).results || [];
      return jsonResp(200, { form: { ...form, fields: parseFields(form) }, webhooks });
    }
    if (method === 'PATCH') {
      const body = await request.json().catch(() => ({}));
      const fieldsJson = Array.isArray(body.fields) ? JSON.stringify(body.fields) : form.fields_json;
      await db
        .prepare(`
          UPDATE forms SET
            name = ?, client_name = ?, theme_preset = ?, email_recipients = ?, allowed_origins = ?, redirect_url = ?,
            enable_honeypot = ?, send_autoresponse = ?, is_active = ?, is_archived = ?, fields_json = ?, submit_label = ?, multi_step = ?, review_gate_url = ?
          WHERE id = ?
        `)
        .bind(
          body.name ?? form.name,
          body.client_name ?? form.client_name,
          body.theme_preset ?? form.theme_preset,
          body.email_recipients ?? form.email_recipients,
          body.allowed_origins ?? form.allowed_origins,
          body.redirect_url ?? form.redirect_url,
          body.enable_honeypot !== undefined ? (body.enable_honeypot ? 1 : 0) : form.enable_honeypot,
          body.send_autoresponse !== undefined ? (body.send_autoresponse ? 1 : 0) : form.send_autoresponse,
          body.is_active !== undefined ? (body.is_active ? 1 : 0) : form.is_active,
          body.is_archived !== undefined ? (body.is_archived ? 1 : 0) : (form.is_archived || 0),
          fieldsJson,
          body.submit_label ?? form.submit_label,
          body.multi_step !== undefined ? (body.multi_step ? 1 : 0) : form.multi_step,
          body.review_gate_url ?? form.review_gate_url,
          formId
        )
        .run();
      const updated = await getFormWithCounts(db, formId);
      return jsonResp(200, { form: { ...updated, fields: parseFields(updated) } });
    }
    if (method === 'DELETE') {
      await db.prepare('DELETE FROM forms WHERE id = ?').bind(formId).run();
      return jsonResp(200, { deleted: true });
    }
  }

  const subsMatch = pathname.match(/^\/api\/forms\/([a-zA-Z0-9_-]+)\/submissions$/);
  if (subsMatch && method === 'GET') {
    const formId = subsMatch[1];
    const filter = url.searchParams.get('filter') || 'inbox';
    const sql = filter === 'spam'
      ? 'SELECT * FROM submissions WHERE form_id = ? AND is_spam = 1 ORDER BY created_at DESC'
      : filter === 'all'
      ? 'SELECT * FROM submissions WHERE form_id = ? ORDER BY created_at DESC'
      : 'SELECT * FROM submissions WHERE form_id = ? AND is_spam = 0 ORDER BY created_at DESC';
    const rows = (await db.prepare(sql).bind(formId).all()).results || [];
    return jsonResp(200, {
      submissions: rows.map((r) => ({ ...r, data: JSON.parse(r.data_json || '{}'), attachments: JSON.parse(r.attachments_json || '[]') })),
    });
  }

  if (pathname === '/api/mail-logs' && method === 'GET') {
    const logs = (await db.prepare('SELECT m.*, f.name AS form_name FROM mail_logs m LEFT JOIN forms f ON f.id = m.form_id ORDER BY m.created_at DESC LIMIT 100').all()).results || [];
    return jsonResp(200, { logs });
  }

  if (pathname === '/api/webhook-logs' && method === 'GET') {
    const logs = (await db.prepare('SELECT w.*, f.name AS form_name FROM webhook_logs w LEFT JOIN forms f ON f.id = w.form_id ORDER BY w.created_at DESC LIMIT 100').all()).results || [];
    return jsonResp(200, { logs });
  }

  return next();
}
