import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadEnv } from './env.js';
loadEnv();

import {
  buildClearOwnerSessionCookie,
  buildClearSessionCookie,
  buildOwnerSessionCookie,
  buildSessionCookie,
  createOwnerSessionToken,
  createSessionToken,
  hashPassword,
  isAuthEnabled,
  isOwnerAuthenticated,
  isOwnerPinEnabled,
  isRequestAuthenticated,
  verifyAdminPassword,
  verifyOwnerPin,
} from './auth.js';
import {
  db,
  DEFAULT_ENQUIRY_FIELDS,
  deleteSetting,
  getFormWithCounts,
  getGlobalStats,
  getWorkspaceConfig,
  listFormsWithCounts,
  parseFormFields,
  setSetting,
  UPLOADS_DIR,
} from './db.js';
import { handleIngestOptions, handleIngestPost } from './ingest.js';
import { renderManagePortalPage, renderManifestJson } from './manage-page.js';
import { issueLicenseKey, normalizeDomain, verifyLicenseKey } from './license.js';
import { parseMultipart } from './multipart.js';
import { renderClientDemoPage, renderEmbedPage, renderThanksPage } from './pages.js';
import { renderCommercialSitePage } from './site-page.js';
import { seedIfEmpty } from './seed.js';
import { dispatchWebhooks } from './webhooks.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(__dirname, '../public');

const PORT = Number(process.env.PORT || 3840);
const HOST = process.env.HOST || '127.0.0.1';
const BASE_URL = (process.env.PUBLIC_URL || `http://localhost:${PORT}`).replace(/\/$/, '');

if (String(process.env.SEED_DEMO || 'true').toLowerCase() !== 'false') {
  seedIfEmpty(BASE_URL);
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain; charset=utf-8',
  '.csv': 'text/csv; charset=utf-8',
};

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 2 * 1024 * 1024) {
        reject(new Error('Body too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      if (!raw.trim()) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

function slugifyId(input) {
  const cleaned = String(input || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return cleaned || `f_${crypto.randomBytes(4).toString('hex')}`;
}

function csvEscape(value) {
  const str = String(value ?? '');
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function serveFile(res, filePath, fallbackName = null) {
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const mime = MIME_TYPES[ext] || 'application/octet-stream';
  const headers = { 'Content-Type': mime };
  if (fallbackName) {
    headers['Content-Disposition'] = `inline; filename="${fallbackName.replace(/"/g, '')}"`;
  }
  res.writeHead(200, headers);
  fs.createReadStream(filePath).pipe(res);
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', BASE_URL);
    const pathname = url.pathname;
    const method = (req.method || 'GET').toUpperCase();

    // ---------------------------------------------------------
    // 1. PUBLIC FORMSPREE-COMPATIBLE INGESTION: /f/:formId
    // ---------------------------------------------------------
    const ingestMatch = pathname.match(/^\/f\/([a-zA-Z0-9_-]+)\/?$/);
    if (ingestMatch) {
      const formId = ingestMatch[1];
      if (method === 'OPTIONS') {
        return handleIngestOptions(req, res);
      }
      if (method === 'POST') {
        return await handleIngestPost(req, res, formId, BASE_URL);
      }
      return sendJson(res, 405, { error: 'Use POST to submit data to this endpoint.' });
    }

    // ---------------------------------------------------------
    // 2. STANDALONE CLIENT PAGES: /manage, /manifest.json, /thanks, /embed/:id, /demo/:id
    // ---------------------------------------------------------
    if (pathname === '/manage' && method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(renderManagePortalPage(getWorkspaceConfig()));
      return;
    }

    if ((pathname === '/' || pathname === '/site') && method === 'GET') {
      const firstForm = db.prepare('SELECT id FROM forms ORDER BY created_at ASC LIMIT 1').get();
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(renderCommercialSitePage(getWorkspaceConfig(), firstForm?.id || 'audit-intake', BASE_URL));
      return;
    }

    if (pathname === '/manifest.json' && method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/manifest+json; charset=utf-8' });
      res.end(renderManifestJson(getWorkspaceConfig()));
      return;
    }

    if (pathname === '/thanks' && method === 'GET') {
      const formId = url.searchParams.get('form');
      const form = formId ? db.prepare('SELECT * FROM forms WHERE id = ?').get(formId) : null;
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(renderThanksPage(form, getWorkspaceConfig()));
      return;
    }

    const embedMatch = pathname.match(/^\/embed\/([a-zA-Z0-9_-]+)\/?$/);
    if (embedMatch && method === 'GET') {
      const form = db.prepare('SELECT * FROM forms WHERE id = ?').get(embedMatch[1]);
      if (!form) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Form not found');
        return;
      }
      const reqSource = req.headers.origin || req.headers.referer || '';
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(renderEmbedPage(form, parseFormFields(form), BASE_URL, getWorkspaceConfig(reqSource)));
      return;
    }

    const demoMatch = pathname.match(/^\/demo\/([a-zA-Z0-9_-]+)\/?$/);
    if (demoMatch && method === 'GET') {
      const form = db.prepare('SELECT * FROM forms WHERE id = ?').get(demoMatch[1]);
      if (!form) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Form not found');
        return;
      }
      const theme = url.searchParams.get('theme') || 'brand';
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(renderClientDemoPage(form, parseFormFields(form), theme, BASE_URL, getWorkspaceConfig()));
      return;
    }

    // ---------------------------------------------------------
    // 3. UPLOADED ATTACHMENTS: /uploads/:filename
    // ---------------------------------------------------------
    if (pathname.startsWith('/uploads/') && method === 'GET') {
      const requested = path.basename(pathname.slice('/uploads/'.length));
      const fullPath = path.join(UPLOADS_DIR, requested);
      return serveFile(res, fullPath, requested);
    }

    // ---------------------------------------------------------
    // 4. BUILT-IN LOCAL WEBHOOK SINK (for live webhook testing)
    // ---------------------------------------------------------
    if (pathname === '/api/webhook-sink' && method === 'POST') {
      const body = await readJsonBody(req).catch(() => ({}));
      return sendJson(res, 200, {
        received: true,
        event: req.headers['x-formflow-event'] || 'submission.created',
        signaturePresent: Boolean(req.headers['x-formflow-signature']),
        submissionId: body?.submission?.id || null,
        receivedAt: new Date().toISOString(),
      });
    }

    // ---------------------------------------------------------
    // 4B. AUTHENTICATION ROUTES (Public)
    // ---------------------------------------------------------
    if (pathname === '/api/auth/status' && method === 'GET') {
      return sendJson(res, 200, {
        authEnabled: isAuthEnabled(),
        authenticated: isRequestAuthenticated(req),
        workspace: getWorkspaceConfig(),
      });
    }

    if (pathname === '/api/auth/login' && method === 'POST') {
      const body = await readJsonBody(req);
      if (!isAuthEnabled() || verifyAdminPassword(body.password)) {
        const token = createSessionToken();
        res.writeHead(200, {
          'Content-Type': 'application/json; charset=utf-8',
          'Set-Cookie': buildSessionCookie(token),
        });
        res.end(JSON.stringify({ ok: true }));
        return;
      }
      return sendJson(res, 401, { error: 'Incorrect administrator password.' });
    }

    if (pathname === '/api/auth/logout' && method === 'POST') {
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Set-Cookie': buildClearSessionCookie(),
      });
      res.end(JSON.stringify({ ok: true }));
      return;
    }

    // ---------------------------------------------------------
    // 4C. OWNER PORTAL (/manage) API — 6-Digit PIN Gated
    // ---------------------------------------------------------
    if (pathname === '/api/manage/status' && method === 'GET') {
      return sendJson(res, 200, {
        pinEnabled: isOwnerPinEnabled(),
        authenticated: isOwnerAuthenticated(req),
      });
    }

    if (pathname === '/api/manage/login' && method === 'POST') {
      const body = await readJsonBody(req);
      if (!isOwnerPinEnabled() || verifyOwnerPin(body.pin)) {
        res.writeHead(200, {
          'Content-Type': 'application/json; charset=utf-8',
          'Set-Cookie': buildOwnerSessionCookie(createOwnerSessionToken()),
        });
        res.end(JSON.stringify({ ok: true }));
        return;
      }
      return sendJson(res, 401, { error: 'Incorrect PIN.' });
    }

    if (pathname === '/api/manage/logout' && method === 'POST') {
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Set-Cookie': buildClearOwnerSessionCookie(),
      });
      res.end(JSON.stringify({ ok: true }));
      return;
    }

    if (pathname === '/api/manage/enquiries' && method === 'GET') {
      if (!isOwnerAuthenticated(req)) {
        return sendJson(res, 401, { error: 'PIN required.' });
      }
      const filter = url.searchParams.get('filter') || 'new';
      const search = (url.searchParams.get('q') || '').trim().toLowerCase();
      let rows;
      if (['new', 'replied', 'closed'].includes(filter)) {
        rows = db
          .prepare(`
            SELECT s.*, f.name AS form_name
            FROM submissions s
            JOIN forms f ON f.id = s.form_id
            WHERE s.is_spam = 0 AND s.status = ?
            ORDER BY s.created_at DESC
            LIMIT 200
          `)
          .all(filter);
      } else {
        rows = db
          .prepare(`
            SELECT s.*, f.name AS form_name
            FROM submissions s
            JOIN forms f ON f.id = s.form_id
            WHERE s.is_spam = 0
            ORDER BY s.created_at DESC
            LIMIT 200
          `)
          .all();
      }
      const enquiries = rows
        .map((r) => ({
          ...r,
          data: JSON.parse(r.data_json || '{}'),
          attachments: JSON.parse(r.attachments_json || '[]'),
        }))
        .filter((item) => {
          if (!search) return true;
          return (
            JSON.stringify(item.data).toLowerCase().includes(search) ||
            (item.sender_name || '').toLowerCase().includes(search) ||
            (item.sender_email || '').toLowerCase().includes(search) ||
            (item.form_name || '').toLowerCase().includes(search)
          );
        });
      return sendJson(res, 200, { enquiries });
    }

    const manageSubMatch = pathname.match(/^\/api\/manage\/enquiries\/([a-zA-Z0-9_-]+)$/);
    if (manageSubMatch && method === 'PATCH') {
      if (!isOwnerAuthenticated(req)) {
        return sendJson(res, 401, { error: 'PIN required.' });
      }
      const subId = manageSubMatch[1];
      const existing = db.prepare('SELECT * FROM submissions WHERE id = ?').get(subId);
      if (!existing) return sendJson(res, 404, { error: 'Enquiry not found.' });
      const body = await readJsonBody(req);
      const status = body.status && ['new', 'replied', 'closed'].includes(body.status) ? body.status : (existing.status || 'new');
      const notes = body.notes !== undefined ? String(body.notes) : (existing.notes || '');
      db.prepare('UPDATE submissions SET status = ?, notes = ? WHERE id = ?').run(status, notes, subId);
      return sendJson(res, 200, { updated: true, status, notes });
    }

    // ---------------------------------------------------------
    // 4D. PUBLIC STRIPE CHECKOUT & LICENSE PURCHASE (/site)
    // ---------------------------------------------------------
    if (pathname === '/api/license/checkout' && method === 'POST') {
      const body = await readJsonBody(req);
      const cleanDomain = normalizeDomain(body.domain);
      const holder = String(body.holder || cleanDomain).trim();
      if (!cleanDomain || !cleanDomain.includes('.')) {
        return sendJson(res, 400, { error: 'Enter a valid domain (e.g. harbourplumbing.com.au)' });
      }
      const stripeKey = process.env.STRIPE_API_KEY || '';
      if (!stripeKey) {
        return sendJson(res, 400, { error: 'STRIPE_API_KEY is not configured on this server.' });
      }
      const priceAud = Number(process.env.LICENSE_PRICE_AUD || 149);
      const params = new URLSearchParams({
        mode: 'payment',
        'managed_payments[enabled]': 'false',
        success_url: `${BASE_URL}/?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${BASE_URL}/?domain=${encodeURIComponent(cleanDomain)}`,
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
        return sendJson(res, 400, { error: session?.error?.message || 'Unable to create Stripe Checkout session.' });
      }
      return sendJson(res, 200, {
        checkoutUrl: session.url,
        sessionId: session.id,
        domain: cleanDomain,
      });
    }

    if (pathname === '/api/license/verify-session' && method === 'GET') {
      const sessionId = (url.searchParams.get('session_id') || '').trim();
      const stripeKey = process.env.STRIPE_API_KEY || '';
      if (!sessionId || !stripeKey) {
        return sendJson(res, 400, { error: 'Missing session_id or Stripe configuration.' });
      }
      const stripeRes = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, {
        headers: { Authorization: `Bearer ${stripeKey}` },
      });
      const session = await stripeRes.json();
      if (!stripeRes.ok) {
        return sendJson(res, 400, { error: session?.error?.message || 'Unable to verify Stripe session.' });
      }
      if (session.payment_status !== 'paid') {
        return sendJson(res, 402, { paid: false, status: session.payment_status });
      }
      const cleanDomain = normalizeDomain(session.metadata?.domain || '');
      const holder = String(session.metadata?.holder || cleanDomain).trim();
      const { key, payload } = issueLicenseKey({ domain: cleanDomain, holder });
      setSetting('license_key', key);
      setSetting('license_holder', payload.holder);
      setSetting('website_url', `https://${payload.domain}`);
      return sendJson(res, 200, {
        paid: true,
        key,
        payload,
        workspace: getWorkspaceConfig(),
      });
    }

    // Gate all admin API routes when ADMIN_PASSWORD is active
    if (pathname.startsWith('/api/') && !isRequestAuthenticated(req)) {
      return sendJson(res, 401, { error: 'Authentication required.', authRequired: true });
    }

    // ---------------------------------------------------------
    // 5. DASHBOARD REST API
    // ---------------------------------------------------------
    if (pathname === '/api/bootstrap' && method === 'GET') {
      return sendJson(res, 200, {
        baseUrl: BASE_URL,
        stats: getGlobalStats(),
        forms: listFormsWithCounts(),
        workspace: getWorkspaceConfig(),
      });
    }

    if (pathname === '/api/workspace' && method === 'GET') {
      return sendJson(res, 200, { workspace: getWorkspaceConfig() });
    }

    if (pathname === '/api/license/activate' && method === 'POST') {
      const body = await readJsonBody(req);
      const rawKey = String(body.license_key || '').trim();
      const verified = verifyLicenseKey(rawKey);
      if (!verified.valid) {
        return sendJson(res, 400, { error: verified.reason });
      }
      setSetting('license_key', rawKey);
      setSetting('license_holder', verified.holder);
      setSetting('website_url', `https://${verified.domain}`);
      return sendJson(res, 200, {
        activated: true,
        verified,
        workspace: getWorkspaceConfig(),
      });
    }

    if (pathname === '/api/license/issue' && method === 'POST') {
      const body = await readJsonBody(req);
      try {
        const { key, payload } = issueLicenseKey({
          domain: body.domain,
          holder: body.holder,
        });
        if (body.activate !== false) {
          setSetting('license_key', key);
          setSetting('license_holder', payload.holder);
          setSetting('website_url', `https://${payload.domain}`);
        }
        return sendJson(res, 200, {
          key,
          payload,
          workspace: getWorkspaceConfig(),
        });
      } catch (err) {
        return sendJson(res, 400, { error: err.message });
      }
    }

    if (pathname === '/api/license/remove' && method === 'POST') {
      deleteSetting('license_key');
      return sendJson(res, 200, {
        removed: true,
        workspace: getWorkspaceConfig(),
      });
    }

    if (pathname === '/api/workspace/logo' && method === 'POST') {
      const contentType = req.headers['content-type'] || '';
      if (!contentType.includes('multipart/form-data')) {
        return sendJson(res, 400, { error: 'Expected multipart/form-data upload.' });
      }
      const chunks = [];
      let total = 0;
      for await (const chunk of req) {
        total += chunk.length;
        if (total > 3 * 1024 * 1024) return sendJson(res, 413, { error: 'Logo must be under 3 MB.' });
        chunks.push(chunk);
      }
      const { attachments } = parseMultipart(Buffer.concat(chunks), contentType);
      const file = attachments[0];
      if (!file) return sendJson(res, 400, { error: 'No logo file received.' });
      setSetting('logo_url', file.url);
      return sendJson(res, 200, { logo_url: file.url, workspace: getWorkspaceConfig() });
    }

    if (pathname === '/api/workspace' && method === 'PATCH') {
      const body = await readJsonBody(req);
      const hexRe = /^#[0-9a-fA-F]{6}$/;
      if (body.brand_name !== undefined) setSetting('brand_name', String(body.brand_name).trim() || 'AskForms');
      if (body.website_url !== undefined) setSetting('website_url', String(body.website_url).trim());
      if (body.support_email !== undefined) setSetting('support_email', String(body.support_email).trim());
      if (body.license_holder !== undefined) setSetting('license_holder', String(body.license_holder).trim() || 'Self-Hosted Edition');
      if (body.logo_url !== undefined) setSetting('logo_url', String(body.logo_url).trim());
      if (body.accent_color !== undefined && hexRe.test(String(body.accent_color).trim())) {
        setSetting('accent_color', String(body.accent_color).trim());
      }
      if (body.accent_text_color !== undefined && hexRe.test(String(body.accent_text_color).trim())) {
        setSetting('accent_text_color', String(body.accent_text_color).trim());
      }
      if (body.bg_color !== undefined && hexRe.test(String(body.bg_color).trim())) {
        setSetting('bg_color', String(body.bg_color).trim());
      }
      if (body.surface_color !== undefined && hexRe.test(String(body.surface_color).trim())) {
        setSetting('surface_color', String(body.surface_color).trim());
      }
      if (body.font_preset !== undefined && ['editorial', 'modern', 'minimal', 'classic'].includes(body.font_preset)) {
        setSetting('font_preset', body.font_preset);
      }
      if (body.radius_preset !== undefined && ['sharp', 'balanced', 'soft'].includes(body.radius_preset)) {
        setSetting('radius_preset', body.radius_preset);
      }
      if (body.thanks_heading !== undefined) setSetting('thanks_heading', String(body.thanks_heading).trim() || 'Submission received');
      if (body.thanks_body !== undefined) setSetting('thanks_body', String(body.thanks_body).trim());
      if (body.email_footer !== undefined) setSetting('email_footer', String(body.email_footer).trim());
      if (body.client_view !== undefined) setSetting('client_view', body.client_view ? 'true' : 'false');
      if (body.email_provider !== undefined && ['local', 'resend'].includes(body.email_provider)) {
        setSetting('email_provider', body.email_provider);
      }
      if (body.mail_from !== undefined) setSetting('mail_from', String(body.mail_from).trim() || 'forms@yourdomain.com.au');
      if (body.resend_api_key !== undefined && String(body.resend_api_key).trim() !== '') {
        setSetting('resend_api_key', String(body.resend_api_key).trim());
      }
      if (body.clear_resend_key) {
        deleteSetting('resend_api_key');
      }

      let extraCookie = null;
      if (body.new_admin_password !== undefined && String(body.new_admin_password).trim() !== '') {
        const pw = String(body.new_admin_password).trim();
        if (pw.length < 6) return sendJson(res, 400, { error: 'Admin password must be at least 6 characters.' });
        setSetting('admin_password_hash', hashPassword(pw));
        extraCookie = buildSessionCookie(createSessionToken());
      }
      if (body.disable_admin_password && !(process.env.ADMIN_PASSWORD || '').trim()) {
        deleteSetting('admin_password_hash');
      }
      if (body.new_owner_pin !== undefined && String(body.new_owner_pin).trim() !== '') {
        const pin = String(body.new_owner_pin).trim();
        if (!/^\d{6}$/.test(pin)) return sendJson(res, 400, { error: 'Owner PIN must be exactly 6 digits.' });
        setSetting('owner_pin_hash', hashPassword(pin));
      }
      if (body.disable_owner_pin && !(process.env.OWNER_PIN || '').trim()) {
        deleteSetting('owner_pin_hash');
      }
      if (body.setup_completed !== undefined) {
        setSetting('setup_completed', body.setup_completed ? 'true' : 'false');
      }

      const headers = { 'Content-Type': 'application/json; charset=utf-8' };
      if (extraCookie) headers['Set-Cookie'] = extraCookie;
      res.writeHead(200, headers);
      res.end(JSON.stringify({ workspace: getWorkspaceConfig() }));
      return;
    }

    if (pathname === '/api/workspace/clear-demo' && method === 'POST') {
      db.exec('DELETE FROM webhook_logs; DELETE FROM mail_logs; DELETE FROM webhooks; DELETE FROM submissions; DELETE FROM forms;');
      return sendJson(res, 200, { cleared: true });
    }

    if (pathname === '/api/workspace/backup.json' && method === 'GET') {
      const snapshot = {
        exported_at: new Date().toISOString(),
        workspace: getWorkspaceConfig(),
        forms: db.prepare('SELECT * FROM forms').all(),
        webhooks: db.prepare('SELECT * FROM webhooks').all(),
        submissions: db.prepare('SELECT * FROM submissions').all().map((s) => ({
          ...s,
          data: JSON.parse(s.data_json || '{}'),
          attachments: JSON.parse(s.attachments_json || '[]'),
        })),
      };
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="formflow-backup-${new Date().toISOString().slice(0, 10)}.json"`,
      });
      res.end(JSON.stringify(snapshot, null, 2));
      return;
    }

    if (pathname === '/api/forms' && method === 'GET') {
      return sendJson(res, 200, { forms: listFormsWithCounts(), stats: getGlobalStats() });
    }

    if (pathname === '/api/forms' && method === 'POST') {
      const body = await readJsonBody(req);
      const name = String(body.name || '').trim();
      if (!name) return sendJson(res, 400, { error: 'Form name is required.' });

      let id = body.id ? slugifyId(body.id) : slugifyId(name);
      const exists = db.prepare('SELECT id FROM forms WHERE id = ?').get(id);
      if (exists) {
        id = `${id}-${crypto.randomBytes(2).toString('hex')}`;
      }

      const initialFields = Array.isArray(body.fields) && body.fields.length > 0 ? body.fields : DEFAULT_ENQUIRY_FIELDS;

      db.prepare(`
        INSERT INTO forms (
          id, name, client_name, theme_preset, email_recipients, allowed_origins, redirect_url,
          enable_honeypot, send_autoresponse, autoresponse_subject, autoresponse_body,
          rate_limit_per_hour, is_active, fields_json, submit_label,
          multi_step, turnstile_site_key, turnstile_secret_key, review_gate_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        name,
        String(body.client_name || 'Website').trim() || 'Website',
        String(body.theme_preset || 'teagee'),
        String(body.email_recipients || '').trim(),
        String(body.allowed_origins || '*').trim() || '*',
        String(body.redirect_url || '').trim(),
        body.enable_honeypot === false ? 0 : 1,
        body.send_autoresponse ? 1 : 0,
        String(body.autoresponse_subject || 'We received your enquiry').trim(),
        String(body.autoresponse_body || 'Thank you for getting in touch. We will review your enquiry and reply shortly.').trim(),
        Math.max(1, Number(body.rate_limit_per_hour) || 120),
        JSON.stringify(initialFields),
        String(body.submit_label || 'Send enquiry').trim() || 'Send enquiry',
        body.multi_step ? 1 : 0,
        String(body.turnstile_site_key || '').trim(),
        String(body.turnstile_secret_key || '').trim(),
        String(body.review_gate_url || '').trim()
      );

      const createdForm = getFormWithCounts(id);
      return sendJson(res, 201, { form: { ...createdForm, fields: parseFormFields(createdForm) } });
    }

    // Single Form routes: /api/forms/:id
    const formMatch = pathname.match(/^\/api\/forms\/([a-zA-Z0-9_-]+)$/);
    if (formMatch) {
      const formId = formMatch[1];
      const form = getFormWithCounts(formId);
      if (!form) return sendJson(res, 404, { error: 'Form not found.' });

      if (method === 'GET') {
        const webhooks = db
          .prepare('SELECT * FROM webhooks WHERE form_id = ? ORDER BY created_at DESC')
          .all(formId);
        return sendJson(res, 200, { form: { ...form, fields: parseFormFields(form) }, webhooks });
      }

      if (method === 'PATCH') {
        const body = await readJsonBody(req);
        const fieldsJson = Array.isArray(body.fields) ? JSON.stringify(body.fields) : (form.fields_json || '[]');
        const submitLabel = body.submit_label !== undefined ? String(body.submit_label).trim() || 'Send enquiry' : (form.submit_label || 'Send enquiry');

        db.prepare(`
          UPDATE forms SET
            name = ?,
            client_name = ?,
            theme_preset = ?,
            email_recipients = ?,
            allowed_origins = ?,
            redirect_url = ?,
            enable_honeypot = ?,
            send_autoresponse = ?,
            autoresponse_subject = ?,
            autoresponse_body = ?,
            rate_limit_per_hour = ?,
            is_active = ?,
            is_archived = ?,
            fields_json = ?,
            submit_label = ?,
            multi_step = ?,
            turnstile_site_key = ?,
            turnstile_secret_key = ?,
            review_gate_url = ?
          WHERE id = ?
        `).run(
          body.name !== undefined ? String(body.name).trim() || form.name : form.name,
          body.client_name !== undefined ? String(body.client_name).trim() || 'Website' : form.client_name,
          body.theme_preset !== undefined ? String(body.theme_preset) : form.theme_preset,
          body.email_recipients !== undefined ? String(body.email_recipients).trim() : form.email_recipients,
          body.allowed_origins !== undefined ? String(body.allowed_origins).trim() || '*' : form.allowed_origins,
          body.redirect_url !== undefined ? String(body.redirect_url).trim() : form.redirect_url,
          body.enable_honeypot !== undefined ? (body.enable_honeypot ? 1 : 0) : form.enable_honeypot,
          body.send_autoresponse !== undefined ? (body.send_autoresponse ? 1 : 0) : form.send_autoresponse,
          body.autoresponse_subject !== undefined ? String(body.autoresponse_subject).trim() : form.autoresponse_subject,
          body.autoresponse_body !== undefined ? String(body.autoresponse_body).trim() : form.autoresponse_body,
          body.rate_limit_per_hour !== undefined ? Math.max(1, Number(body.rate_limit_per_hour) || 120) : form.rate_limit_per_hour,
          body.is_active !== undefined ? (body.is_active ? 1 : 0) : form.is_active,
          body.is_archived !== undefined ? (body.is_archived ? 1 : 0) : (form.is_archived || 0),
          fieldsJson,
          submitLabel,
          body.multi_step !== undefined ? (body.multi_step ? 1 : 0) : (form.multi_step || 0),
          body.turnstile_site_key !== undefined ? String(body.turnstile_site_key).trim() : (form.turnstile_site_key || ''),
          body.turnstile_secret_key !== undefined ? String(body.turnstile_secret_key).trim() : (form.turnstile_secret_key || ''),
          body.review_gate_url !== undefined ? String(body.review_gate_url).trim() : (form.review_gate_url || ''),
          formId
        );
        const updated = getFormWithCounts(formId);
        return sendJson(res, 200, { form: { ...updated, fields: parseFormFields(updated) } });
      }

      if (method === 'DELETE') {
        db.prepare('DELETE FROM forms WHERE id = ?').run(formId);
        return sendJson(res, 200, { deleted: true });
      }
    }

    // Form Submissions: /api/forms/:id/submissions
    const subsMatch = pathname.match(/^\/api\/forms\/([a-zA-Z0-9_-]+)\/submissions$/);
    if (subsMatch && method === 'GET') {
      const formId = subsMatch[1];
      const filter = url.searchParams.get('filter') || 'inbox'; // inbox | spam | all
      const search = (url.searchParams.get('q') || '').trim().toLowerCase();

      let rows;
      if (filter === 'spam') {
        rows = db.prepare('SELECT * FROM submissions WHERE form_id = ? AND is_spam = 1 ORDER BY created_at DESC').all(formId);
      } else if (filter === 'all') {
        rows = db.prepare('SELECT * FROM submissions WHERE form_id = ? ORDER BY created_at DESC').all(formId);
      } else {
        rows = db.prepare('SELECT * FROM submissions WHERE form_id = ? AND is_spam = 0 ORDER BY created_at DESC').all(formId);
      }

      const mapped = rows
        .map((row) => ({
          ...row,
          data: JSON.parse(row.data_json || '{}'),
          attachments: JSON.parse(row.attachments_json || '[]'),
        }))
        .filter((item) => {
          if (!search) return true;
          return (
            JSON.stringify(item.data).toLowerCase().includes(search) ||
            (item.sender_email || '').toLowerCase().includes(search) ||
            (item.sender_name || '').toLowerCase().includes(search) ||
            (item.id || '').toLowerCase().includes(search)
          );
        });

      return sendJson(res, 200, { submissions: mapped });
    }

    if (subsMatch && method === 'DELETE') {
      db.prepare('DELETE FROM submissions WHERE form_id = ?').run(subsMatch[1]);
      return sendJson(res, 200, { cleared: true });
    }

    // Export CSV / JSON: /api/forms/:id/export.(csv|json)
    const exportMatch = pathname.match(/^\/api\/forms\/([a-zA-Z0-9_-]+)\/export\.(csv|json)$/);
    if (exportMatch && method === 'GET') {
      const [, formId, format] = exportMatch;
      const includeSpam = url.searchParams.get('spam') === '1';
      const rows = includeSpam
        ? db.prepare('SELECT * FROM submissions WHERE form_id = ? ORDER BY created_at DESC').all(formId)
        : db.prepare('SELECT * FROM submissions WHERE form_id = ? AND is_spam = 0 ORDER BY created_at DESC').all(formId);

      const items = rows.map((r) => ({
        id: r.id,
        created_at: r.created_at,
        is_spam: Boolean(r.is_spam),
        origin: r.origin,
        sender_ip: r.sender_ip,
        ...JSON.parse(r.data_json || '{}'),
      }));

      if (format === 'json') {
        res.writeHead(200, {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': `attachment; filename="${formId}-submissions.json"`,
        });
        res.end(JSON.stringify(items, null, 2));
        return;
      }

      const keySet = new Set(['id', 'created_at', 'origin', 'sender_ip']);
      for (const item of items) {
        Object.keys(item).forEach((k) => keySet.add(k));
      }
      const headers = Array.from(keySet);
      const csvLines = [headers.map(csvEscape).join(',')];
      for (const item of items) {
        csvLines.push(headers.map((h) => csvEscape(item[h])).join(','));
      }

      res.writeHead(200, {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${formId}-submissions.csv"`,
      });
      res.end(csvLines.join('\r\n'));
      return;
    }

    // Single Submission actions: /api/submissions/:id
    const singleSubMatch = pathname.match(/^\/api\/submissions\/([a-zA-Z0-9_-]+)$/);
    if (singleSubMatch) {
      const subId = singleSubMatch[1];
      if (method === 'PATCH') {
        const body = await readJsonBody(req);
        const existing = db.prepare('SELECT * FROM submissions WHERE id = ?').get(subId);
        if (!existing) return sendJson(res, 404, { error: 'Enquiry not found.' });

        const isSpam = body.is_spam !== undefined ? (body.is_spam ? 1 : 0) : existing.is_spam;
        const reason =
          body.is_spam !== undefined
            ? isSpam
              ? (body.spam_reason || 'Marked as spam manually')
              : null
            : existing.spam_reason;
        const status =
          body.status && ['new', 'replied', 'closed'].includes(body.status)
            ? body.status
            : existing.status || 'new';
        const notes = body.notes !== undefined ? String(body.notes) : (existing.notes || '');

        db.prepare('UPDATE submissions SET is_spam = ?, spam_reason = ?, status = ?, notes = ? WHERE id = ?').run(
          isSpam,
          reason,
          status,
          notes,
          subId
        );
        return sendJson(res, 200, { updated: true, is_spam: Boolean(isSpam), status, notes });
      }
      if (method === 'DELETE') {
        db.prepare('DELETE FROM submissions WHERE id = ?').run(subId);
        return sendJson(res, 200, { deleted: true });
      }
    }

    // Form Webhooks: /api/forms/:id/webhooks
    const whMatch = pathname.match(/^\/api\/forms\/([a-zA-Z0-9_-]+)\/webhooks$/);
    if (whMatch) {
      const formId = whMatch[1];
      if (method === 'GET') {
        const webhooks = db.prepare('SELECT * FROM webhooks WHERE form_id = ? ORDER BY created_at DESC').all(formId);
        return sendJson(res, 200, { webhooks });
      }
      if (method === 'POST') {
        const body = await readJsonBody(req);
        const targetUrl = String(body.target_url || '').trim();
        if (!targetUrl) return sendJson(res, 400, { error: 'Target URL is required.' });

        const id = `wh_${crypto.randomBytes(6).toString('hex')}`;
        const format = ['generic', 'slack', 'discord', 'teams', 'telegram'].includes(body.format) ? body.format : 'generic';
        const secret = body.secret_key !== undefined
          ? String(body.secret_key).trim()
          : `ff_sec_${crypto.randomBytes(8).toString('hex')}`;

        db.prepare(`
          INSERT INTO webhooks (id, form_id, label, target_url, format, secret_key, is_active)
          VALUES (?, ?, ?, ?, ?, ?, 1)
        `).run(id, formId, String(body.label || 'Webhook').trim() || 'Webhook', targetUrl, format, secret);

        const created = db.prepare('SELECT * FROM webhooks WHERE id = ?').get(id);
        return sendJson(res, 201, { webhook: created });
      }
    }

    // Single Webhook actions: /api/webhooks/:id and /api/webhooks/:id/test
    const whTestMatch = pathname.match(/^\/api\/webhooks\/([a-zA-Z0-9_-]+)\/test$/);
    if (whTestMatch && method === 'POST') {
      const hook = db.prepare('SELECT * FROM webhooks WHERE id = ?').get(whTestMatch[1]);
      if (!hook) return sendJson(res, 404, { error: 'Webhook not found.' });
      const form = db.prepare('SELECT * FROM forms WHERE id = ?').get(hook.form_id);
      const results = await dispatchWebhooks({
        form,
        submissionId: `test_${crypto.randomBytes(4).toString('hex')}`,
        fields: {
          name: 'Test Ping',
          email: 'test@formflow.local',
          message: 'Manual webhook connectivity verification from FormFlow.',
        },
        attachments: [],
        meta: { origin: BASE_URL, ip: '127.0.0.1', timestamp: new Date().toISOString() },
        targetWebhook: hook,
      });
      return sendJson(res, 200, { result: results[0] || null });
    }

    const whSingleMatch = pathname.match(/^\/api\/webhooks\/([a-zA-Z0-9_-]+)$/);
    if (whSingleMatch) {
      const whId = whSingleMatch[1];
      if (method === 'PATCH') {
        const body = await readJsonBody(req);
        db.prepare('UPDATE webhooks SET is_active = ? WHERE id = ?').run(body.is_active ? 1 : 0, whId);
        return sendJson(res, 200, { updated: true });
      }
      if (method === 'DELETE') {
        db.prepare('DELETE FROM webhooks WHERE id = ?').run(whId);
        return sendJson(res, 200, { deleted: true });
      }
    }

    // Mail Outbox Logs
    if (pathname === '/api/mail-logs' && method === 'GET') {
      const formId = url.searchParams.get('formId');
      const rows = formId
        ? db.prepare(`
            SELECT m.*, f.name AS form_name, f.client_name
            FROM mail_logs m
            JOIN forms f ON f.id = m.form_id
            WHERE m.form_id = ?
            ORDER BY m.created_at DESC
            LIMIT 100
          `).all(formId)
        : db.prepare(`
            SELECT m.*, f.name AS form_name, f.client_name
            FROM mail_logs m
            JOIN forms f ON f.id = m.form_id
            ORDER BY m.created_at DESC
            LIMIT 100
          `).all();
      return sendJson(res, 200, { logs: rows });
    }

    // Webhook Delivery Logs
    if (pathname === '/api/webhook-logs' && method === 'GET') {
      const formId = url.searchParams.get('formId');
      const rows = formId
        ? db.prepare(`
            SELECT l.*, f.name AS form_name
            FROM webhook_logs l
            JOIN forms f ON f.id = l.form_id
            WHERE l.form_id = ?
            ORDER BY l.created_at DESC
            LIMIT 100
          `).all(formId)
        : db.prepare(`
            SELECT l.*, f.name AS form_name
            FROM webhook_logs l
            JOIN forms f ON f.id = l.form_id
            ORDER BY l.created_at DESC
            LIMIT 100
          `).all();

      const parsed = rows.map((r) => ({
        ...r,
        request_headers: JSON.parse(r.request_headers_json || '{}'),
        request_body: JSON.parse(r.request_body_json || '{}'),
      }));
      return sendJson(res, 200, { logs: parsed });
    }

    // ---------------------------------------------------------
    // 6. STATIC FRONTEND FILES (SPA at /app and /setup)
    // ---------------------------------------------------------
    if (method === 'GET') {
      const safePath = path.normalize(pathname === '/app' || pathname === '/setup' ? '/app.html' : pathname).replace(/^(\.\.[/\\])+/, '');
      const candidate = path.join(PUBLIC_DIR, safePath);
      if (candidate.startsWith(PUBLIC_DIR) && fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        return serveFile(res, candidate);
      }
      return serveFile(res, path.join(PUBLIC_DIR, 'app.html'));
    }

    sendJson(res, 404, { error: 'Route not found.' });
  } catch (err) {
    console.error('[FormFlow Error]', err);
    sendJson(res, 500, { error: 'Internal server error.' });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`AskForms running at ${BASE_URL}`);
});
