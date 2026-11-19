-- AskForms Cloudflare D1 Full Production Schema (SQLite at the Edge)

DROP TABLE IF EXISTS webhook_logs;
DROP TABLE IF EXISTS mail_logs;
DROP TABLE IF EXISTS webhooks;
DROP TABLE IF EXISTS submissions;
DROP TABLE IF EXISTS forms;
DROP TABLE IF EXISTS app_settings;

CREATE TABLE IF NOT EXISTS forms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  client_name TEXT NOT NULL DEFAULT 'Website',
  theme_preset TEXT NOT NULL DEFAULT 'teagee',
  email_recipients TEXT NOT NULL DEFAULT '',
  allowed_origins TEXT NOT NULL DEFAULT '*',
  redirect_url TEXT NOT NULL DEFAULT '',
  enable_honeypot INTEGER NOT NULL DEFAULT 1,
  send_autoresponse INTEGER NOT NULL DEFAULT 0,
  autoresponse_subject TEXT NOT NULL DEFAULT 'We received your enquiry',
  autoresponse_body TEXT NOT NULL DEFAULT 'Thank you for getting in touch. We will review your enquiry and reply shortly.',
  rate_limit_per_hour INTEGER NOT NULL DEFAULT 120,
  is_active INTEGER NOT NULL DEFAULT 1,
  is_archived INTEGER NOT NULL DEFAULT 0,
  fields_json TEXT NOT NULL DEFAULT '[]',
  submit_label TEXT NOT NULL DEFAULT 'Send enquiry',
  multi_step INTEGER NOT NULL DEFAULT 0,
  turnstile_site_key TEXT NOT NULL DEFAULT '',
  turnstile_secret_key TEXT NOT NULL DEFAULT '',
  review_gate_url TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY,
  form_id TEXT NOT NULL,
  data_json TEXT NOT NULL DEFAULT '{}',
  attachments_json TEXT NOT NULL DEFAULT '[]',
  sender_email TEXT DEFAULT '',
  sender_name TEXT DEFAULT '',
  subject TEXT DEFAULT '',
  sender_ip TEXT DEFAULT '127.0.0.1',
  user_agent TEXT DEFAULT '',
  origin TEXT DEFAULT '',
  content_type TEXT DEFAULT 'application/json',
  status TEXT NOT NULL DEFAULT 'new',
  notes TEXT NOT NULL DEFAULT '',
  is_spam INTEGER NOT NULL DEFAULT 0,
  spam_reason TEXT DEFAULT '',
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
  transport TEXT NOT NULL DEFAULT 'local-outbox',
  to_addresses TEXT NOT NULL DEFAULT '',
  cc_addresses TEXT DEFAULT '',
  reply_to TEXT DEFAULT '',
  subject TEXT NOT NULL DEFAULT '',
  html_body TEXT NOT NULL DEFAULT '',
  text_body TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS webhook_logs (
  id TEXT PRIMARY KEY,
  webhook_id TEXT NOT NULL,
  form_id TEXT NOT NULL,
  submission_id TEXT,
  target_url TEXT NOT NULL,
  request_headers TEXT DEFAULT '{}',
  request_body TEXT DEFAULT '{}',
  response_status INTEGER DEFAULT 0,
  response_body TEXT DEFAULT '',
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

INSERT OR IGNORE INTO app_settings (key, value) VALUES
  ('brand_name', 'AskForms'),
  ('website_url', 'https://askforms.app'),
  ('accent_color', '#14383e'),
  ('accent_text_color', '#ffffff'),
  ('bg_color', '#f7fafc'),
  ('font_preset', 'minimal'),
  ('radius_preset', 'balanced');

INSERT OR IGNORE INTO forms (id, name, client_name, theme_preset, email_recipients, submit_label, multi_step, fields_json) VALUES
  ('audit-intake', 'Website Audit Intake', 'Client Reviews', 'teagee', 'hello@askforms.app', 'Request Website Audit', 1, '[{"name":"name","label":"Full name","type":"text","placeholder":"Alex Mercer","required":true,"half":true},{"name":"email","label":"Work email","type":"email","placeholder":"alex@company.com.au","required":true,"half":true},{"name":"website","label":"Current website URL","type":"url","placeholder":"https://company.com.au","required":true,"half":true},{"name":"phone","label":"Phone number","type":"tel","placeholder":"0400 000 000","required":false,"half":true},{"name":"message","label":"What are your main goals for the rebuild?","type":"textarea","placeholder":"Faster mobile enquiries, cleaner quote flow...","required":true,"half":false}]'),
  ('sintiro-contact', 'Growth Strategy Contact', 'Sintiro', 'sintiro', 'hello@sintiro.com.au', 'Book Growth Session', 0, '[{"name":"name","label":"Full name","type":"text","placeholder":"Jordan Taylor","required":true,"half":true},{"name":"email","label":"Email address","type":"email","placeholder":"jordan@company.com.au","required":true,"half":true},{"name":"topic","label":"Focus area","type":"select","options":["Advisory & Strategy","Operating Rhythm","Leadership Alignment"],"required":false,"half":false},{"name":"message","label":"How can we help?","type":"textarea","placeholder":"Tell us about your team and goals...","required":true,"half":false}]'),
  ('centella-enquiry', 'Advisory Consultation', 'Centella', 'centella', 'hello@centella.com.au', 'Send Enquiry', 0, '[{"name":"name","label":"Full name","type":"text","placeholder":"Sam Lee","required":true,"half":true},{"name":"email","label":"Email address","type":"email","placeholder":"sam@organization.com.au","required":true,"half":true},{"name":"message","label":"Enquiry details","type":"textarea","placeholder":"Share a brief overview...","required":true,"half":false}]'),
  ('teagee-brief', 'Studio Project Brief', 'Teagee Labs', 'teagee', 'hello@teageelabs.com', 'Send Project Brief', 1, '[{"name":"name","label":"Your name","type":"text","placeholder":"Taylor Green","required":true,"half":true},{"name":"email","label":"Email address","type":"email","placeholder":"taylor@brand.com.au","required":true,"half":true},{"name":"message","label":"Project scope & timeline","type":"textarea","placeholder":"Website rebuild, custom quote forms, launch target...","required":true,"half":false}]');
