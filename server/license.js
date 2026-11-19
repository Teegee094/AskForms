import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * AskForms Embedded Ed25519 Public Verification Key.
 * Only the holder of `.keys/askforms-private.pem` (or ASKFORMS_MASTER_PRIVATE_KEY)
 * can mint valid `ASK1.<payload>.<signature>` single-domain license keys.
 */
export const ASKFORMS_PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAdbXFhP7gpxVx7jJPVwTJZnnwBPKJjJPe3aAGkK+MdB4=
-----END PUBLIC KEY-----`;

export const PREVIEW_SUBMISSION_LIMIT = 10;

export function normalizeDomain(input) {
  let str = String(input || '').trim().toLowerCase();
  if (!str) return '';
  try {
    if (str.includes('://')) {
      str = new URL(str).hostname.toLowerCase();
    } else {
      str = str.split('/')[0].split(':')[0].trim();
    }
  } catch {
    str = str.replace(/^https?:\/\//, '').split('/')[0].split(':')[0].trim();
  }
  return str.replace(/^www\./, '').replace(/\.$/, '');
}

export function isLocalOrPreviewHost(hostname) {
  const h = normalizeDomain(hostname);
  if (!h) return true;
  if (h === 'localhost' || h === '127.0.0.1' || h === '0.0.0.0' || h === '::1') return true;
  if (h === 'askforms.app' || h.endsWith('.askforms.app')) return true;
  return false;
}

export function doesHostMatchLicensedDomain(requestHostOrUrl, licensedDomain) {
  const reqHost = normalizeDomain(requestHostOrUrl);
  const target = normalizeDomain(licensedDomain);
  if (!target) return false;
  if (!reqHost || isLocalOrPreviewHost(reqHost)) return true;
  return reqHost === target || reqHost.endsWith(`.${target}`);
}

/**
 * Verify a cryptographic AskForms single-domain license key (`ASK1.<payload>.<sig>`).
 */
export function verifyLicenseKey(keyString) {
  const raw = String(keyString || '').trim();
  if (!raw) {
    return { valid: false, reason: 'No license key configured.' };
  }
  const parts = raw.split('.');
  const prefix = parts[0];
  if (parts.length !== 3 || (prefix !== 'ASK1' && prefix !== 'ASKP1')) {
    return { valid: false, reason: 'Invalid key format (expected ASK1 or ASKP1 key).' };
  }
  const [, payloadB64, sigB64] = parts;
  try {
    const isVerified = crypto.verify(
      null,
      Buffer.from(`${prefix}.${payloadB64}`, 'utf8'),
      ASKFORMS_PUBLIC_KEY_PEM,
      Buffer.from(sigB64, 'base64url')
    );
    if (!isVerified) {
      return { valid: false, reason: 'Cryptographic signature verification failed.' };
    }
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    const domain = normalizeDomain(payload.domain);
    if (!domain) {
      return { valid: false, reason: 'License key is missing a target domain.' };
    }
    return {
      valid: true,
      keyType: prefix === 'ASKP1' ? 'partner' : 'client',
      licenseId: payload.id || 'ask-lic',
      domain,
      holder: payload.holder || domain,
      plan: payload.plan || (prefix === 'ASKP1' ? 'partner-reseller' : 'lifetime-single-site'),
      issuedAt: payload.issued_at || null,
    };
  } catch (err) {
    return { valid: false, reason: `Malformed license key: ${err.message}` };
  }
}

/**
 * Issue a signed `ASK1.<payload>.<sig>` key for a single domain using the private key.
 * Only available when `.keys/askforms-private.pem` or `ASKFORMS_MASTER_PRIVATE_KEY` is present.
 */
export function issueLicenseKey({ domain, holder = '', plan = 'lifetime-single-site', type = 'client' }) {
  const cleanDomain = normalizeDomain(domain);
  if (!cleanDomain || !cleanDomain.includes('.')) {
    throw new Error('Please enter a valid website domain (e.g. harbourplumbing.com.au).');
  }

  let privateKeyPem = process.env.ASKFORMS_MASTER_PRIVATE_KEY || '';
  if (!privateKeyPem) {
    const keyPath = path.resolve(__dirname, '../.keys/askforms-private.pem');
    if (fs.existsSync(keyPath)) {
      privateKeyPem = fs.readFileSync(keyPath, 'utf8');
    }
  }
  if (!privateKeyPem) {
    throw new Error('Master private signing key not available on this instance.');
  }

  const isPartner = type === 'partner' || plan === 'partner-reseller';
  const prefix = isPartner ? 'ASKP1' : 'ASK1';

  const payload = {
    id: `${isPartner ? 'prt' : 'lic'}_${crypto.randomBytes(5).toString('hex')}`,
    domain: cleanDomain,
    holder: String(holder || cleanDomain).trim(),
    plan: isPartner ? 'partner-reseller' : plan,
    role: isPartner ? 'partner' : 'client',
    issued_at: new Date().toISOString().slice(0, 10),
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const signature = crypto.sign(null, Buffer.from(`${prefix}.${payloadB64}`, 'utf8'), privateKeyPem);
  const sigB64 = signature.toString('base64url');

  return {
    key: `${prefix}.${payloadB64}.${sigB64}`,
    payload,
  };
}

/**
 * Evaluate current workspace license status + strict 1-Key-1-Domain enforcement.
 */
export function evaluateLicenseStatus(rawKey, totalSubmissions = 0, requestOriginOrReferer = '') {
  const used = Math.max(0, Number(totalSubmissions) || 0);
  const remaining = Math.max(0, PREVIEW_SUBMISSION_LIMIT - used);
  const verified = verifyLicenseKey(rawKey);

  if (!verified.valid) {
    return {
      status: 'preview', // 'preview' | 'active' | 'domain_mismatch'
      isLicensed: false,
      domainMismatch: false,
      isPreviewLocked: used >= PREVIEW_SUBMISSION_LIMIT,
      previewLimit: PREVIEW_SUBMISSION_LIMIT,
      previewUsed: used,
      previewRemaining: remaining,
      licensedDomain: null,
      holder: null,
      licenseId: null,
      issuedAt: null,
      message:
        used >= PREVIEW_SUBMISSION_LIMIT
          ? `Preview limit reached (${PREVIEW_SUBMISSION_LIMIT}/${PREVIEW_SUBMISSION_LIMIT} test enquiries). Activate a domain license key to unlock unlimited enquiries.`
          : `Live Preview Mode (${remaining} of ${PREVIEW_SUBMISSION_LIMIT} test enquiries remaining).`,
    };
  }

  const reqHost = normalizeDomain(requestOriginOrReferer);
  const domainMatches = doesHostMatchLicensedDomain(reqHost, verified.domain);

  if (!domainMatches) {
    return {
      status: 'domain_mismatch',
      isLicensed: false,
      domainMismatch: true,
      isPreviewLocked: true,
      previewLimit: PREVIEW_SUBMISSION_LIMIT,
      previewUsed: used,
      previewRemaining: 0,
      licensedDomain: verified.domain,
      requestDomain: reqHost,
      holder: verified.holder,
      licenseId: verified.licenseId,
      issuedAt: verified.issuedAt,
      message: `License key is bound exclusively to ${verified.domain} and cannot be used on ${reqHost} (1 Key = 1 Website).`,
    };
  }

  return {
    status: 'active',
    isLicensed: true,
    domainMismatch: false,
    isPreviewLocked: false,
    previewLimit: PREVIEW_SUBMISSION_LIMIT,
    previewUsed: used,
    previewRemaining: null,
    licensedDomain: verified.domain,
    holder: verified.holder,
    licenseId: verified.licenseId,
    issuedAt: verified.issuedAt,
    message: `Lifetime Single-Site License active for ${verified.domain}`,
  };
}
