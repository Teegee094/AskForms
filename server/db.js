import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { evaluateLicenseStatus } from './license.js';

const DATA_DIR = path.resolve(process.env.DATA_DIR || './data');
export const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
export const DB_PATH = path.join(DATA_DIR, 'formflow.db');

fs.mkdirSync(UPLOADS_DIR, { recursive: true });

export const db = new DatabaseSync(DB_PATH);

db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

db.exec(`
  CREATE TABLE IF NOT EXISTS forms (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    client_name TEXT NOT NULL DEFAULT 'Internal',
    theme_preset TEXT NOT NULL DEFAULT 'teagee',
    email_recipients TEXT NOT NULL DEFAULT '',
    allowed_origins TEXT NOT NULL DEFAULT '*',
    redirect_url TEXT NOT NULL DEFAULT '',
    enable_honeypot INTEGER NOT NULL DEFAULT 1,
    send_autoresponse INTEGER NOT NULL DEFAULT 0,
    autoresponse_subject TEXT NOT NULL DEFAULT 'We received your message',
    autoresponse_body TEXT NOT NULL DEFAULT 'Thank you for getting in touch. A member of our team will review your submission and reply shortly.',
    rate_limit_per_hour INTEGER NOT NULL DEFAULT 120,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS submissions (
    id TEXT PRIMARY KEY,
    form_id TEXT NOT NULL,
    data_json TEXT NOT NULL,
    attachments_json TEXT NOT NULL DEFAULT '[]',
    sender_email TEXT,
    sender_name TEXT,
    subject TEXT,
    sender_ip TEXT,
    user_agent TEXT,
    origin TEXT,
    content_type TEXT,
    is_spam INTEGER NOT NULL DEFAULT 0,
    spam_reason TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS webhooks (
    id TEXT PRIMARY KEY,
    form_id TEXT NOT NULL,
    label TEXT NOT NULL DEFAULT 'Webhook',
    target_url TEXT NOT NULL,
    format TEXT NOT NULL DEFAULT 'generic',
    secret_key TEXT NOT NULL DEFAULT '',
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS mail_logs (
    id TEXT PRIMARY KEY,
    form_id TEXT NOT NULL,
    submission_id TEXT,
    kind TEXT NOT NULL DEFAULT 'notification',
    to_addresses TEXT NOT NULL,
    cc_addresses TEXT NOT NULL DEFAULT '',
    reply_to TEXT NOT NULL DEFAULT '',
    subject TEXT NOT NULL,
    html_body TEXT NOT NULL,
    text_body TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'delivered',
    transport TEXT NOT NULL DEFAULT 'local-outbox',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS webhook_logs (
    id TEXT PRIMARY KEY,
    webhook_id TEXT,
    form_id TEXT NOT NULL,
    submission_id TEXT,
    target_url TEXT NOT NULL,
    request_headers_json TEXT NOT NULL DEFAULT '{}',
    request_body_json TEXT NOT NULL DEFAULT '{}',
    response_status INTEGER,
    response_body TEXT,
    duration_ms INTEGER NOT NULL DEFAULT 0,
    success INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_submissions_form_created ON submissions(form_id, created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_mail_logs_created ON mail_logs(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_webhook_logs_created ON webhook_logs(created_at DESC);
`);

// Safe migrations for existing databases
const safeMigrations = [
  `ALTER TABLE webhooks ADD COLUMN format TEXT NOT NULL DEFAULT 'generic'`,
  `ALTER TABLE forms ADD COLUMN fields_json TEXT NOT NULL DEFAULT '[]'`,
  `ALTER TABLE forms ADD COLUMN submit_label TEXT NOT NULL DEFAULT 'Send enquiry'`,
  `ALTER TABLE forms ADD COLUMN multi_step INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE forms ADD COLUMN turnstile_site_key TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE forms ADD COLUMN turnstile_secret_key TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE forms ADD COLUMN review_gate_url TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE submissions ADD COLUMN status TEXT NOT NULL DEFAULT 'new'`,
  `ALTER TABLE submissions ADD COLUMN notes TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE forms ADD COLUMN is_archived INTEGER NOT NULL DEFAULT 0`,
];

for (const sql of safeMigrations) {
  try {
    db.exec(sql);
  } catch {
    // Column already exists
  }
}

export const DEFAULT_ENQUIRY_FIELDS = [
  { name: 'name', label: 'Full name', type: 'text', placeholder: 'Alex Mercer', required: true, half: true },
  { name: 'email', label: 'Email address', type: 'email', placeholder: 'alex@company.com.au', required: true, half: true },
  { name: 'phone', label: 'Phone number', type: 'tel', placeholder: '0400 000 000', required: false, half: true },
  {
    name: 'topic',
    label: 'Enquiry type',
    type: 'select',
    options: ['General Enquiry', 'Request a Quote', 'Book a Consultation', 'Support'],
    required: false,
    half: true,
  },
  { name: 'message', label: 'How can we help?', type: 'textarea', placeholder: 'Tell us a little about what you need...', required: true, half: false },
];

export function parseFormFields(form) {
  try {
    const parsed = JSON.parse(form?.fields_json || '[]');
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {
    // fallback below
  }
  return DEFAULT_ENQUIRY_FIELDS;
}

export function getSetting(key, fallback = '') {
  const row = db.prepare('SELECT value FROM app_settings WHERE key = ?').get(key);
  return row ? row.value : fallback;
}

export function setSetting(key, value) {
  db.prepare(`
    INSERT INTO app_settings (key, value) VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `).run(key, String(value ?? ''));
}

export function deleteSetting(key) {
  db.prepare('DELETE FROM app_settings WHERE key = ?').run(key);
}

// Auto-migrate default brand name to AskForms and ensure default petrol accent if still on legacy QA grey
try {
  const existingBrand = db.prepare(`SELECT value FROM app_settings WHERE key = 'brand_name'`).get();
  if (existingBrand && (existingBrand.value === 'FormsFlow' || existingBrand.value === 'FormFlow')) {
    db.prepare(`UPDATE app_settings SET value = 'AskForms' WHERE key = 'brand_name'`).run();
  }
  const existingAccent = db.prepare(`SELECT value FROM app_settings WHERE key = 'accent_color'`).get();
  if (existingAccent && existingAccent.value === '#718096') {
    db.prepare(`UPDATE app_settings SET value = '#14383e' WHERE key = 'accent_color'`).run();
  }
} catch {}

export function getWorkspaceConfig(requestOriginOrReferer = '') {
  const resendKey = getSetting('resend_api_key', process.env.RESEND_API_KEY || '');
  const licenseKey = getSetting('license_key', process.env.ASKFORMS_LICENSE_KEY || '');
  const validSubmissions = db.prepare('SELECT COUNT(*) AS c FROM submissions WHERE is_spam = 0').get().c;
  const license = evaluateLicenseStatus(licenseKey, validSubmissions, requestOriginOrReferer);

  return {
    brand_name: getSetting('brand_name', process.env.BRAND_NAME || 'AskForms'),
    website_url: getSetting('website_url', process.env.BRAND_WEBSITE_URL || ''),
    support_email: getSetting('support_email', process.env.SUPPORT_EMAIL || ''),
    license_holder: license.isLicensed ? license.holder : getSetting('license_holder', process.env.LICENSE_HOLDER || 'Preview Mode'),
    license_key_preview: licenseKey ? `${licenseKey.slice(0, 14)}••••${licenseKey.slice(-8)}` : '',
    has_license_key: Boolean(licenseKey),
    license,
    logo_url: getSetting('logo_url', process.env.BRAND_LOGO_URL || ''),
    accent_color: getSetting('accent_color', process.env.BRAND_ACCENT || '#14383e'),
    accent_text_color: getSetting('accent_text_color', process.env.BRAND_ACCENT_TEXT || '#ffffff'),
    bg_color: getSetting('bg_color', process.env.BRAND_BG || '#f7fafc'),
    surface_color: getSetting('surface_color', process.env.BRAND_SURFACE || '#ffffff'),
    font_preset: getSetting('font_preset', process.env.BRAND_FONT || 'minimal'),
    radius_preset: getSetting('radius_preset', process.env.BRAND_RADIUS || 'balanced'),
    thanks_heading: getSetting('thanks_heading', 'Submission received'),
    thanks_body: getSetting(
      'thanks_body',
      'Thank you for getting in touch. Your message has been recorded and our team will respond shortly.'
    ),
    email_footer: getSetting('email_footer', ''),
    client_view: getSetting('client_view', String(process.env.CLIENT_MODE || 'false')) === 'true',
    email_provider: getSetting('email_provider', resendKey ? 'resend' : 'local'),
    mail_from: getSetting('mail_from', process.env.MAIL_FROM || 'forms@yourdomain.com.au'),
    has_resend_key: Boolean(resendKey),
    resend_api_key_preview: resendKey ? `${resendKey.slice(0, 7)}••••${resendKey.slice(-4)}` : '',
    auth_enabled: Boolean((process.env.ADMIN_PASSWORD || '').trim() || getSetting('admin_password_hash')),
    auth_from_env: Boolean((process.env.ADMIN_PASSWORD || '').trim()),
    owner_pin_enabled: Boolean((process.env.OWNER_PIN || '').trim() || getSetting('owner_pin_hash')),
    setup_completed: getSetting('setup_completed', 'false') === 'true',
  };
}

export function getFormWithCounts(formId) {
  const form = db.prepare(`
    SELECT
      f.*,
      (SELECT COUNT(*) FROM submissions s WHERE s.form_id = f.id AND s.is_spam = 0) AS submission_count,
      (SELECT COUNT(*) FROM submissions s WHERE s.form_id = f.id AND s.is_spam = 1) AS spam_count,
      (SELECT MAX(s.created_at) FROM submissions s WHERE s.form_id = f.id) AS last_submission_at,
      (SELECT COUNT(*) FROM webhooks w WHERE w.form_id = f.id AND w.is_active = 1) AS active_webhooks
    FROM forms f
    WHERE f.id = ?
  `).get(formId);
  return form || null;
}

export function listFormsWithCounts() {
  return db.prepare(`
    SELECT
      f.*,
      (SELECT COUNT(*) FROM submissions s WHERE s.form_id = f.id AND s.is_spam = 0) AS submission_count,
      (SELECT COUNT(*) FROM submissions s WHERE s.form_id = f.id AND s.is_spam = 1) AS spam_count,
      (SELECT MAX(s.created_at) FROM submissions s WHERE s.form_id = f.id) AS last_submission_at,
      (SELECT COUNT(*) FROM webhooks w WHERE w.form_id = f.id AND w.is_active = 1) AS active_webhooks
    FROM forms f
    ORDER BY f.created_at ASC
  `).all();
}

export function getGlobalStats() {
  const activeForms = db.prepare('SELECT COUNT(*) AS c FROM forms WHERE is_active = 1 AND COALESCE(is_archived, 0) = 0').get().c;
  const archivedForms = db.prepare('SELECT COUNT(*) AS c FROM forms WHERE COALESCE(is_archived, 0) = 1').get().c;
  const totalForms = db.prepare('SELECT COUNT(*) AS c FROM forms').get().c;
  const validSubmissions = db.prepare('SELECT COUNT(*) AS c FROM submissions WHERE is_spam = 0').get().c;
  const spamBlocked = db.prepare('SELECT COUNT(*) AS c FROM submissions WHERE is_spam = 1').get().c;
  const emailsSent = db.prepare('SELECT COUNT(*) AS c FROM mail_logs').get().c;
  const webhookTotal = db.prepare('SELECT COUNT(*) AS c FROM webhook_logs').get().c;
  const webhookOk = db.prepare('SELECT COUNT(*) AS c FROM webhook_logs WHERE success = 1').get().c;

  return {
    activeForms,
    archivedForms,
    totalForms,
    validSubmissions,
    spamBlocked,
    emailsSent,
    webhookTotal,
    webhookOk,
    deliveryRate: webhookTotal > 0 ? Math.round((webhookOk / webhookTotal) * 100) : 100,
  };
}
