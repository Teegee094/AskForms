import crypto from 'node:crypto';
import { getSetting, setSetting } from './db.js';
import { verifyLicenseKey } from './license.js';

const COOKIE_NAME = 'formflow_session';
const OWNER_COOKIE_NAME = 'formflow_owner_session';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const OWNER_SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days for mobile home-screen bookmark

function getSessionSecret() {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  let secret = getSetting('session_secret');
  if (!secret) {
    secret = crypto.randomBytes(32).toString('hex');
    setSetting('session_secret', secret);
  }
  return secret;
}

export function hashPassword(plain) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(plain), salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(plain, stored) {
  if (!stored || !stored.includes(':')) return false;
  const [salt, keyHex] = stored.split(':');
  const derived = crypto.scryptSync(String(plain), salt, 64);
  const storedBuf = Buffer.from(keyHex, 'hex');
  if (derived.length !== storedBuf.length) return false;
  return crypto.timingSafeEqual(derived, storedBuf);
}

export function isAuthEnabled() {
  return true;
}

export function verifyAdminPassword(candidate) {
  const input = String(candidate || '').trim();
  if (!input) return false;

  // 1. Accept any valid cryptographically signed ASK1 single-domain license key
  if (input.startsWith('ASK1.')) {
    const verified = verifyLicenseKey(input);
    if (verified.valid) {
      setSetting('license_key', input);
      setSetting('license_holder', verified.holder);
      setSetting('website_url', `https://${verified.domain}`);
      return true;
    }
    return false;
  }

  // 2. Accept stored custom admin password hash
  const storedHash = getSetting('admin_password_hash');
  if (storedHash && verifyPassword(input, storedHash)) {
    return true;
  }

  // 3. Accept ADMIN_PASSWORD env or default partner password
  const envPass = (process.env.ADMIN_PASSWORD || 'askforms2026').trim();
  const a = Buffer.from(input);
  const b = Buffer.from(envPass);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function createSessionToken() {
  const exp = Date.now() + SESSION_TTL_MS;
  const payload = `admin.${exp}`;
  const sig = crypto.createHmac('sha256', getSessionSecret()).update(payload).digest('hex');
  return `${payload}.${sig}`;
}

export function parseCookies(cookieHeader) {
  const out = {};
  if (!cookieHeader) return out;
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    out[k] = decodeURIComponent(v);
  }
  return out;
}

export function isRequestAuthenticated(req) {
  if (!isAuthEnabled()) return true;
  const cookies = parseCookies(req.headers.cookie || '');
  const token = cookies[COOKIE_NAME];
  if (!token) return false;

  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [role, expStr, sig] = parts;
  const exp = Number(expStr);
  if (role !== 'admin' || !Number.isFinite(exp) || Date.now() > exp) return false;

  const expected = crypto.createHmac('sha256', getSessionSecret()).update(`${role}.${expStr}`).digest('hex');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function buildSessionCookie(token) {
  const maxAge = Math.floor(SESSION_TTL_MS / 1000);
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`;
}

export function buildClearSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

// ============================================================
// OWNER PORTAL (/manage) 6-DIGIT PIN AUTHENTICATION
// ============================================================
export function isOwnerPinEnabled() {
  return Boolean((process.env.OWNER_PIN || '').trim() || getSetting('owner_pin_hash'));
}

export function verifyOwnerPin(pin) {
  const cleanPin = String(pin || '').trim();
  const envPin = (process.env.OWNER_PIN || '').trim();
  if (envPin) {
    const a = Buffer.from(cleanPin);
    const b = Buffer.from(envPin);
    if (a.length === b.length && crypto.timingSafeEqual(a, b)) return true;
  }
  const storedHash = getSetting('owner_pin_hash');
  if (storedHash) {
    return verifyPassword(cleanPin, storedHash);
  }
  return false;
}

export function createOwnerSessionToken() {
  const exp = Date.now() + OWNER_SESSION_TTL_MS;
  const payload = `owner.${exp}`;
  const sig = crypto.createHmac('sha256', getSessionSecret()).update(payload).digest('hex');
  return `${payload}.${sig}`;
}

export function isOwnerAuthenticated(req) {
  if (!isOwnerPinEnabled()) return true;
  if (isRequestAuthenticated(req) && isAuthEnabled()) return true;
  const cookies = parseCookies(req.headers.cookie || '');
  const token = cookies[OWNER_COOKIE_NAME];
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [role, expStr, sig] = parts;
  const exp = Number(expStr);
  if (role !== 'owner' || !Number.isFinite(exp) || Date.now() > exp) return false;
  const expected = crypto.createHmac('sha256', getSessionSecret()).update(`${role}.${expStr}`).digest('hex');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function buildOwnerSessionCookie(token) {
  const maxAge = Math.floor(OWNER_SESSION_TTL_MS / 1000);
  return `${OWNER_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`;
}

export function buildClearOwnerSessionCookie() {
  return `${OWNER_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}
