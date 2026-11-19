import { issueLicenseKey, verifyLicenseKey } from '../server/license.js';

const args = process.argv.slice(2);
let domain = '';
let holder = '';

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg.startsWith('--domain=')) domain = arg.slice('--domain='.length);
  else if (arg === '--domain' && args[i + 1]) domain = args[++i];
  else if (arg.startsWith('--holder=')) holder = arg.slice('--holder='.length);
  else if ((arg === '--holder' || arg === '--client') && args[i + 1]) holder = args[++i];
  else if (!arg.startsWith('--') && !domain) domain = arg;
}

if (!domain) {
  console.log('Usage: npm run issue-license -- --domain="clientdomain.com.au" --holder="Client Business Name"');
  process.exit(1);
}

try {
  const { key, payload } = issueLicenseKey({ domain, holder });
  const check = verifyLicenseKey(key);
  console.log('\n============================================================');
  console.log('  AskForms — Single-Domain Lifetime License Key Issued');
  console.log('============================================================');
  console.log(`  Locked Domain : ${payload.domain} (+ www.${payload.domain})`);
  console.log(`  License Holder: ${payload.holder}`);
  console.log(`  License ID    : ${payload.id}`);
  console.log(`  Verified      : ${check.valid ? 'YES (Ed25519 Signature Valid)' : 'NO'}`);
  console.log('------------------------------------------------------------');
  console.log(`  LICENSE KEY:\n\n  ${key}\n`);
  console.log('============================================================\n');
} catch (err) {
  console.error('Error issuing license key:', err.message);
  process.exit(1);
}
