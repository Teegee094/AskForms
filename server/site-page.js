function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderCommercialSitePage(workspace = {}, defaultFormId = 'audit-intake', baseUrl = '') {
  const lic = workspace.license || {};
  const envObj = typeof process !== 'undefined' && process.env ? process.env : {};
  const priceAud = workspace.price_aud || envObj.LICENSE_PRICE_AUD || '149';
  const stripeCheckoutUrl = workspace.stripe_checkout_url || envObj.STRIPE_CHECKOUT_URL || '';

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>AskForms (askforms.app) — Pop-Out Website Enquiry Engine & Single-Site License</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=2" />
  <link rel="alternate icon" href="/favicon.ico?v=2" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
  <style>
    :root {
      --petrol: #14383e;
      --petrol-deep: #0e2a2f;
      --petrol-mid: #1d4f56;
      --mint: #4fd1c5;
      --mint-hover: #38c2b5;
      --mint-soft: #e6fffa;
      --amber: #f6ad55;
      --canvas: #eaf1f4;
      --surface: #ffffff;
      --ink: #14383e;
      --muted: #5a6f7a;
      --border: #d5e2e7;
    }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      color: var(--ink);
      background-color: var(--canvas);
      background-image:
        radial-gradient(ellipse 800px 440px at 90% 0%, rgba(79, 209, 197, 0.18), transparent 65%),
        radial-gradient(rgba(20, 56, 62, 0.085) 1px, transparent 1px);
      background-size: 100% 100%, 24px 24px;
      line-height: 1.55;
      -webkit-font-smoothing: antialiased;
      scrollbar-width: none;
    }
    html::-webkit-scrollbar, body::-webkit-scrollbar { display: none; }
    a { color: inherit; text-decoration: none; }
    button, input { font: inherit; }
    .mono { font-family: 'JetBrains Mono', monospace; }

    .nav {
      height: 76px;
      background: rgba(255, 255, 255, 0.94);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border);
      padding: 0 clamp(20px, 4vw, 48px);
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: sticky;
      top: 0;
      z-index: 20;
    }
    .brand {
      display: inline-flex;
      align-items: center;
      gap: 11px;
      font-size: 22px;
      font-weight: 800;
      letter-spacing: -0.035em;
      color: var(--petrol);
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 48px clamp(20px, 4vw, 48px) 84px;
    }
    .hero {
      background:
        radial-gradient(circle at 95% 10%, rgba(79, 209, 197, 0.22), transparent 55%),
        linear-gradient(140deg, var(--petrol-deep) 0%, var(--petrol) 60%, var(--petrol-mid) 100%);
      color: #ffffff;
      border-radius: 26px;
      padding: clamp(32px, 5vw, 56px);
      box-shadow: 0 24px 56px -16px rgba(14, 42, 47, 0.35);
      display: grid;
      grid-template-columns: 1.15fr 0.85fr;
      gap: 40px;
      align-items: center;
      margin-bottom: 36px;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 6px 14px;
      border-radius: 999px;
      background: rgba(79, 209, 197, 0.16);
      color: var(--mint);
      font-size: 12.5px;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      margin-bottom: 18px;
    }
    .hero h1 {
      margin: 0 0 16px;
      font-size: clamp(32px, 3.6vw, 48px);
      font-weight: 800;
      letter-spacing: -0.04em;
      line-height: 1.1;
    }
    .hero p {
      margin: 0 0 26px;
      font-size: 16.5px;
      color: rgba(230, 255, 250, 0.82);
      max-width: 540px;
    }
    .btn-row { display: flex; gap: 12px; flex-wrap: wrap; }
    .btn {
      height: 46px;
      padding: 0 24px;
      border-radius: 999px;
      border: 1px solid transparent;
      font-size: 14.5px;
      font-weight: 700;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 9px;
      cursor: pointer;
      transition: transform 0.15s ease, background 0.15s ease, opacity 0.15s ease;
    }
    .btn:hover { transform: translateY(-1px); }
    .btn-mint { background: var(--mint); color: var(--petrol-deep); }
    .btn-mint:hover { background: var(--mint-hover); }
    .btn-ghost-light { background: rgba(255, 255, 255, 0.12); color: #ffffff; border-color: rgba(255, 255, 255, 0.2); }
    .btn-ghost-light:hover { background: rgba(255, 255, 255, 0.2); }
    .btn-petrol { background: var(--petrol); color: #ffffff; }
    .btn-secondary { background: var(--surface); color: var(--ink); border-color: var(--border); }

    .checkout-card {
      background: var(--surface);
      color: var(--ink);
      border-radius: 20px;
      padding: 28px;
      box-shadow: 0 16px 40px rgba(10, 30, 34, 0.24);
    }
    .price-row {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 12px;
      padding-bottom: 16px;
      margin-bottom: 18px;
      border-bottom: 1px solid #e4edf1;
    }
    .price-tag { font-size: 34px; font-weight: 800; letter-spacing: -0.04em; color: var(--petrol); }
    .price-sub { font-size: 13px; font-weight: 600; color: var(--muted); }
    .field { margin-bottom: 14px; }
    .label { display: block; font-size: 13px; font-weight: 700; margin-bottom: 6px; color: var(--ink); }
    .input {
      width: 100%;
      height: 44px;
      padding: 0 14px;
      border-radius: 10px;
      border: 1px solid var(--border);
      font-size: 14px;
      outline: none;
    }
    .input:focus { border-color: var(--petrol); box-shadow: 0 0 0 3px rgba(79, 209, 197, 0.25); }

    .grid-3 {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 22px;
      margin-bottom: 32px;
    }
    .card {
      background: var(--surface);
      border: 1px solid rgba(20, 56, 62, 0.08);
      border-radius: 18px;
      padding: 26px;
      box-shadow: 0 2px 8px rgba(20, 56, 62, 0.04);
    }
    .card h3 { margin: 0 0 8px; font-size: 17px; font-weight: 700; letter-spacing: -0.02em; }
    .card p { margin: 0; font-size: 14px; color: var(--muted); }
    .result-box {
      display: none;
      margin-top: 16px;
      padding: 14px;
      border-radius: 12px;
      background: var(--mint-soft);
      border: 1px solid #b2f5ea;
      font-size: 13px;
    }
    .result-box.visible { display: block; }
    .key-pre {
      margin: 8px 0;
      padding: 10px 12px;
      border-radius: 8px;
      background: var(--petrol);
      color: var(--mint);
      font-family: 'JetBrains Mono', monospace;
      font-size: 11.5px;
      word-break: break-all;
      white-space: pre-wrap;
    }
    @media (max-width: 920px) {
      .hero, .grid-3 { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <header class="nav">
    <a href="/" class="brand">
      <svg width="30" height="28" viewBox="0 0 256 240" fill="none" aria-hidden="true">
        <rect x="0" y="0" width="252" height="32" rx="16" fill="currentColor"/>
        <rect x="0" y="56" width="252" height="32" rx="16" fill="currentColor"/>
        <path d="M16 112H236A16 16 0 0 1 236 144H229.1L204.8 124.8A27 27 0 0 0 161.1 144H16A16 16 0 0 1 16 112Z" fill="currentColor"/>
        <rect x="0" y="168" width="154" height="32" rx="16" fill="currentColor"/>
        <path d="M188 146L236 184L188 222" stroke="currentColor" stroke-width="30" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <span>AskForms</span>
    </a>
    <div class="btn-row">
      <a class="btn btn-secondary" style="height:40px;padding:0 18px;font-size:13.5px;" href="/">Designer Console</a>
      <a class="btn btn-petrol" style="height:40px;padding:0 18px;font-size:13.5px;" href="/manage">Owner Portal</a>
    </div>
  </header>

  <main class="container">
    <section class="hero">
      <div>
        <span class="badge">askforms.app · Single-Domain Lifetime License</span>
        <h1>Pop-out enquiry forms that feel built into your website.</h1>
        <p>
          Drop a single script onto any Webflow, WordPress, Squarespace, Shopify, or custom website to add a slide-over enquiry drawer and a mobile Daily Ops portal — with zero monthly subscription fees.
        </p>
        <div class="btn-row">
          <button type="button" class="btn btn-mint" id="try-drawer-btn">Try Slide-Over Drawer Live</button>
          <button type="button" class="btn btn-ghost-light" id="try-chat-btn">Try Floating Chat Window</button>
        </div>
        <div style="margin-top:22px;font-size:13px;color:rgba(230,255,250,0.72);">
          Currently on this workspace:
          <strong style="color:#ffffff;">
            ${lic.isLicensed ? `Licensed to ${escapeHtml(lic.licensedDomain)}` : `Live Preview Mode (${lic.previewRemaining ?? 5} test enquiries left)`}
          </strong>
        </div>
      </div>

      <div class="checkout-card">
        <div class="price-row">
          <div>
            <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--muted);">One-Off Site License</div>
            <div class="price-tag">$${escapeHtml(priceAud)} <span style="font-size:15px;font-weight:600;color:var(--muted);">AUD once-off</span></div>
          </div>
          <span class="badge" style="background:var(--mint-soft);color:var(--petrol);margin:0;">1 Key = 1 Domain</span>
        </div>

        <form id="issue-key-form">
          <div class="field">
            <label class="label" for="lic-domain">Client Website Domain (locked to this site)</label>
            <input class="input mono" id="lic-domain" name="domain" placeholder="harbourplumbing.com.au" value="${escapeHtml(lic.licensedDomain || workspace.website_url || '')}" required />
          </div>
          <div class="field">
            <label class="label" for="lic-holder">Client Business Name</label>
            <input class="input" id="lic-holder" name="holder" placeholder="Harbour Plumbing Co" value="${escapeHtml(lic.holder || '')}" required />
          </div>
          ${
            stripeCheckoutUrl
              ? `<a class="btn btn-petrol" style="width:100%;margin-top:6px;" href="${escapeHtml(stripeCheckoutUrl)}" target="_blank" rel="noopener">Purchase Single-Domain Key &rarr;</a>`
              : `<button type="submit" class="btn btn-petrol" style="width:100%;margin-top:6px;">Generate &amp; Activate Domain License Key</button>`
          }
        </form>

        <div id="issued-result" class="result-box">
          <strong>Domain License Activated!</strong>
          <div style="margin-top:4px;color:var(--muted);">Locked exclusively to <span class="mono" id="res-domain"></span></div>
          <pre class="key-pre" id="res-key"></pre>
          <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
            <a href="/?tab=workspace" style="font-weight:700;color:var(--petrol);text-decoration:underline;">Return to Console &rarr;</a>
            <button type="button" class="btn btn-secondary" style="height:32px;padding:0 12px;font-size:12px;" id="copy-key-btn">Copy Key</button>
          </div>
        </div>
      </div>
    </section>

    <section class="grid-3">
      <div class="card">
        <h3>1. Test Live on Their Site First</h3>
        <p>Connect the pop-out drawer to any client staging or live website during your pitch. Includes 5 live test enquiries in Preview Mode before requiring activation.</p>
      </div>
      <div class="card">
        <h3>2. Cryptographic 1-Domain Lock</h3>
        <p>Each Ed25519-signed <span class="mono">ASK1</span> license key is mathematically bound to a single client domain (<span class="mono">client.com.au</span>) and cannot be reused on other sites.</p>
      </div>
      <div class="card">
        <h3>3. Zero Monthly Fees Forever</h3>
        <p>Runs on Cloudflare Pages &amp; D1 Free Tier (100,000 requests/day) or any Node 22 host with a mobile 6-digit PIN Owner Portal at <span class="mono">/manage</span>.</p>
      </div>
    </section>
  </main>

  <script src="/widget.js" data-form="${escapeHtml(defaultFormId)}" data-mode="drawer" data-label="Try Live Enquiry" data-title="Live AskForms Popout Demo" data-accent="#14383e" defer></script>
  <script>
    document.getElementById('try-drawer-btn')?.addEventListener('click', () => {
      window.AskForms?.open({ mode: 'drawer', title: 'Slide-Over Enquiry Drawer' });
    });
    document.getElementById('try-chat-btn')?.addEventListener('click', () => {
      window.AskForms?.open({ mode: 'popover', title: 'Floating Chat Enquiry' });
    });

    const form = document.getElementById('issue-key-form');
    const resBox = document.getElementById('issued-result');
    const resDomain = document.getElementById('res-domain');
    const resKey = document.getElementById('res-key');
    let latestKey = '';

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const res = await fetch('/api/license/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: fd.get('domain'),
          holder: fd.get('holder'),
          activate: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Could not issue key');
        return;
      }
      latestKey = data.key;
      resDomain.textContent = data.payload.domain;
      resKey.textContent = data.key;
      resBox.classList.add('visible');
    });

    document.getElementById('copy-key-btn')?.addEventListener('click', () => {
      if (latestKey) {
        navigator.clipboard.writeText(latestKey);
        document.getElementById('copy-key-btn').textContent = 'Copied!';
      }
    });
  </script>
</body>
</html>`;
}
