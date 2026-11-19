-- Cloudflare D1 Schema for FormFlow (Free Tier SQLite)

CREATE TABLE IF NOT EXISTS forms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  client_name TEXT NOT NULL DEFAULT 'Client',
  email_recipients TEXT NOT NULL DEFAULT '',
  allowed_origins TEXT NOT NULL DEFAULT '*',
  redirect_url TEXT NOT NULL DEFAULT '',
  enable_honeypot INTEGER NOT NULL DEFAULT 1,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY,
  form_id TEXT NOT NULL,
  data_json TEXT NOT NULL,
  sender_email TEXT,
  sender_name TEXT,
  sender_ip TEXT,
  origin TEXT,
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

CREATE INDEX IF NOT EXISTS idx_submissions_form_created ON submissions(form_id, created_at DESC);
