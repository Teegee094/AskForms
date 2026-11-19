import { SHOWCASE_TEMPLATES } from './templates.js';

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderCommercialSitePage(workspace = {}, defaultFormId = 'template-quote', baseUrl = '') {
  const envObj = typeof process !== 'undefined' && process.env ? process.env : {};
  const priceAud = workspace.price_aud || envObj.LICENSE_PRICE_AUD || '149';
  const templates = Object.values(SHOWCASE_TEMPLATES);

  const templateCardsHtml = templates
    .map((tpl) => {
      const previewChips = tpl.fields.slice(0, 4).map((f) => `<span class="tpl-chip">${escapeHtml(f.label)}</span>`).join('');
      return `
        <article class="tpl-card">
          <div>
            <div class="tpl-meta-row">
              <span class="tpl-category-pill">${escapeHtml(tpl.category)}</span>
              ${tpl.multi_step ? `<span class="tpl-step-badge">2-Step Flow</span>` : `<span class="tpl-step-badge">Single Step</span>`}
            </div>
            <h3 class="tpl-title">${escapeHtml(tpl.name)}</h3>
            <p class="tpl-desc">${escapeHtml(tpl.tagline)}</p>
            <div class="tpl-chips-wrap">
              ${previewChips}
            </div>
          </div>
          <div class="tpl-actions">
            <button type="button" class="btn-tpl-primary" data-launch-template="${escapeHtml(tpl.id)}" data-launch-mode="drawer" data-launch-title="${escapeHtml(tpl.name)}">
              Try Slide-Over Drawer &rarr;
            </button>
            <button type="button" class="btn-tpl-secondary" data-launch-template="${escapeHtml(tpl.id)}" data-launch-mode="popover" data-launch-title="${escapeHtml(tpl.name)}" title="Open as floating chat window">
              Chat Window
            </button>
          </div>
        </article>
      `;
    })
    .join('');

  return `<!doctype html>
<html lang="en-AU">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>AskForms — Pop-Out Website Forms &amp; Mobile Owner Portal ($${escapeHtml(priceAud)} Once-Off)</title>
  <meta name="description" content="Turn any website button into a slide-over enquiry drawer with a mobile Owner Portal for 1-tap replies. Self-hosted on your domain for a single $${escapeHtml(priceAud)} AUD once-off license." />
  <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=2" />
  <link rel="alternate icon" href="/favicon.ico?v=2" />
  <link rel="apple-touch-icon" href="/apple-touch-icon.png?v=2" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
  <style>
    :root {
      --white: #ffffff;
      --canvas: #f4f7f8;
      --surface-soft: #eaf0f2;
      --surface-stage: #dde7eb;
      --petrol: #14383e;
      --petrol-deep: #0c262b;
      --petrol-mid: #1d4e56;
      --mint: #4fd1c5;
      --mint-hover: #38c2b5;
      --mint-soft: #e6fffa;
      --ink: #12262a;
      --ink-secondary: #485e65;
      --muted: #6c8289;
      --border: rgba(20, 56, 62, 0.12);
      --border-strong: rgba(20, 56, 62, 0.2);
      --container-max: 1340px;
      --radius-hero: 48px;
      --radius-card-lg: 32px;
      --radius-card-md: 24px;
      --radius-pill: 999px;
    }

    *, *::before, *::after { box-sizing: border-box; }
    html {
      scroll-behavior: smooth;
      scrollbar-width: none;
    }
    html::-webkit-scrollbar, body::-webkit-scrollbar { display: none; }
    body {
      margin: 0;
      padding: 0;
      font-family: 'Geist', -apple-system, BlinkMacSystemFont, sans-serif;
      color: var(--ink);
      background: var(--white);
      line-height: 1.55;
      -webkit-font-smoothing: antialiased;
    }
    a { color: inherit; text-decoration: none; }
    button, input, select, textarea { font: inherit; }
    .mono { font-family: 'JetBrains Mono', monospace; }
    .container {
      max-width: var(--container-max);
      margin: 0 auto;
      padding: 0 clamp(18px, 3.5vw, 44px);
    }

    /* 1. TOP ANNOUNCEMENT BAR */
    .announcement-bar {
      background: var(--petrol-deep);
      color: rgba(255, 255, 255, 0.9);
      font-size: 13px;
      padding: 10px 16px;
      text-align: center;
    }
    .announcement-inner {
      max-width: var(--container-max);
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .announcement-inner strong { color: var(--mint); font-weight: 600; }
    .announcement-link {
      color: var(--white);
      font-weight: 600;
      text-decoration: underline;
      text-underline-offset: 3px;
    }

    /* 2. STICKY DETACHED PILL NAVBAR (Centella Signature Pattern) */
    .site-header {
      position: sticky;
      top: 14px;
      z-index: 40;
      padding: 14px 0;
    }
    .nav-container {
      max-width: var(--container-max);
      margin: 0 auto;
      padding: 0 clamp(18px, 3.5vw, 44px);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }
    .nav-left-pill {
      display: inline-flex;
      align-items: center;
      gap: 28px;
      background: rgba(244, 247, 248, 0.92);
      backdrop-filter: blur(14px);
      border: 1px solid var(--border);
      padding: 8px 22px 8px 16px;
      border-radius: var(--radius-pill);
      box-shadow: 0 8px 24px -8px rgba(18, 38, 42, 0.08);
    }
    .brand-logo {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      font-size: 19px;
      font-weight: 700;
      letter-spacing: -0.03em;
      color: var(--petrol);
    }
    .nav-links {
      display: flex;
      align-items: center;
      gap: 22px;
      list-style: none;
      margin: 0;
      padding: 0;
    }
    .nav-link {
      font-size: 14px;
      font-weight: 500;
      color: var(--ink-secondary);
      transition: color 0.15s ease;
    }
    .nav-link:hover { color: var(--petrol); }

    .nav-right-cluster {
      display: inline-flex;
      align-items: center;
      gap: 10px;
    }
    .nav-secondary-pill {
      display: inline-flex;
      align-items: center;
      height: 44px;
      padding: 0 20px;
      border-radius: var(--radius-pill);
      background: rgba(244, 247, 248, 0.92);
      backdrop-filter: blur(14px);
      border: 1px solid var(--border);
      font-size: 14px;
      font-weight: 500;
      color: var(--petrol);
      cursor: pointer;
      transition: background 0.15s ease;
    }
    .nav-secondary-pill:hover { background: var(--surface-soft); }
    .nav-primary-pill {
      display: inline-flex;
      align-items: center;
      height: 44px;
      padding: 0 22px;
      border-radius: var(--radius-pill);
      background: var(--petrol);
      color: var(--white);
      font-size: 14px;
      font-weight: 600;
      transition: background 0.15s ease, transform 0.15s ease;
    }
    .nav-primary-pill:hover { background: var(--petrol-mid); transform: translateY(-1px); }

    /* 3. HERO FRAME */
    .hero-section {
      padding: 10px 0 44px;
    }
    .hero-frame {
      background:
        radial-gradient(ellipse 760px 520px at 90% 12%, rgba(79, 209, 197, 0.22), transparent 65%),
        linear-gradient(135deg, var(--petrol-deep) 0%, var(--petrol) 58%, var(--petrol-mid) 100%);
      border-radius: var(--radius-hero);
      padding: clamp(32px, 5vw, 64px);
      color: var(--white);
      display: grid;
      grid-template-columns: 1.08fr 0.92fr;
      gap: clamp(28px, 4vw, 56px);
      align-items: center;
      box-shadow: 0 28px 64px -20px rgba(12, 38, 43, 0.35);
    }
    .hero-eyebrow-pills {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 5px 14px 5px 6px;
      border-radius: var(--radius-pill);
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.15);
      font-size: 13px;
      color: rgba(255, 255, 255, 0.9);
      margin-bottom: 22px;
    }
    .hero-eyebrow-badge {
      background: var(--mint);
      color: var(--petrol-deep);
      font-weight: 700;
      font-size: 11.5px;
      padding: 3px 10px;
      border-radius: var(--radius-pill);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .hero-title {
      margin: 0 0 18px;
      font-size: clamp(34px, 4vw, 54px);
      font-weight: 500;
      letter-spacing: -0.035em;
      line-height: 1.08;
    }
    .hero-subtitle {
      margin: 0 0 28px;
      font-size: clamp(16px, 1.35vw, 18.5px);
      font-weight: 300;
      color: rgba(240, 253, 250, 0.84);
      max-width: 56ch;
      line-height: 1.6;
    }
    .hero-cta-group {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
      margin-bottom: 26px;
    }
    .btn-hero-primary {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      height: 50px;
      padding: 0 26px;
      border-radius: var(--radius-pill);
      background: var(--mint);
      color: var(--petrol-deep);
      font-size: 15px;
      font-weight: 600;
      border: none;
      cursor: pointer;
      transition: background 0.15s ease, transform 0.15s ease;
    }
    .btn-hero-primary:hover { background: var(--mint-hover); transform: translateY(-1px); }
    .btn-hero-secondary {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      height: 50px;
      padding: 0 24px;
      border-radius: var(--radius-pill);
      background: rgba(255, 255, 255, 0.12);
      color: var(--white);
      border: 1px solid rgba(255, 255, 255, 0.24);
      font-size: 15px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.15s ease;
    }
    .btn-hero-secondary:hover { background: rgba(255, 255, 255, 0.2); }
    .hero-reassurance {
      display: flex;
      gap: 20px;
      flex-wrap: wrap;
      font-size: 13.5px;
      color: rgba(230, 255, 250, 0.78);
    }

    /* RIGHT HERO INTERACTIVE SHOWCASE CARD */
    .hero-showcase {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(18px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: var(--radius-card-lg);
      padding: 26px;
    }
    .hero-scene-pills {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 18px;
    }
    .hero-scene-btn {
      height: 34px;
      padding: 0 14px;
      border-radius: var(--radius-pill);
      border: 1px solid rgba(255, 255, 255, 0.22);
      background: rgba(255, 255, 255, 0.08);
      color: rgba(255, 255, 255, 0.84);
      font-size: 12.5px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .hero-scene-btn.active {
      background: var(--white);
      color: var(--petrol-deep);
      border-color: var(--white);
      font-weight: 600;
    }
    .showcase-card-inner {
      background: var(--white);
      color: var(--ink);
      border-radius: 22px;
      padding: 22px;
      box-shadow: 0 18px 40px -14px rgba(0, 0, 0, 0.35);
    }
    .showcase-eyebrow {
      font-size: 11.5px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--muted);
      margin-bottom: 4px;
    }
    .showcase-heading {
      font-size: 20px;
      font-weight: 600;
      letter-spacing: -0.02em;
      margin: 0 0 8px;
      color: var(--petrol);
    }
    .showcase-copy {
      font-size: 13.5px;
      color: var(--ink-secondary);
      margin: 0 0 16px;
    }
    .showcase-field-preview {
      display: grid;
      gap: 8px;
      margin-bottom: 18px;
    }
    .showcase-fake-input {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 14px;
      border-radius: 12px;
      background: var(--canvas);
      border: 1px solid var(--border);
      font-size: 13px;
      color: var(--ink-secondary);
    }
    .showcase-actions {
      display: flex;
      gap: 8px;
    }

    /* COMMON SECTION HEADINGS */
    .section-block {
      padding: 84px 0;
    }
    .section-block.alt-bg {
      background: var(--canvas);
    }
    .section-header {
      max-width: 680px;
      margin-bottom: 44px;
    }
    .section-eyebrow {
      display: inline-block;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--petrol-mid);
      background: var(--surface-soft);
      padding: 5px 14px;
      border-radius: var(--radius-pill);
      margin-bottom: 14px;
    }
    .section-h2 {
      margin: 0 0 14px;
      font-size: clamp(28px, 3vw, 42px);
      font-weight: 500;
      letter-spacing: -0.03em;
      line-height: 1.14;
      color: var(--ink);
    }
    .section-subtitle {
      margin: 0;
      font-size: 16.5px;
      font-weight: 400;
      color: var(--ink-secondary);
      line-height: 1.6;
    }

    /* 4. TEMPLATE LIBRARY GRID */
    .templates-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 22px;
    }
    .tpl-card {
      background: var(--white);
      border: 1px solid var(--border);
      border-radius: var(--radius-card-md);
      padding: 28px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 22px;
      transition: transform 0.16s ease, box-shadow 0.16s ease, border-color 0.16s ease;
    }
    .tpl-card:hover {
      transform: translateY(-2px);
      border-color: var(--border-strong);
      box-shadow: 0 18px 38px -16px rgba(20, 56, 62, 0.12);
    }
    .tpl-meta-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 14px;
    }
    .tpl-category-pill {
      font-size: 12px;
      font-weight: 600;
      color: var(--petrol);
      background: var(--surface-soft);
      padding: 4px 12px;
      border-radius: var(--radius-pill);
    }
    .tpl-step-badge {
      font-size: 11.5px;
      font-weight: 500;
      color: var(--muted);
    }
    .tpl-title {
      margin: 0 0 8px;
      font-size: 20px;
      font-weight: 600;
      letter-spacing: -0.02em;
      color: var(--ink);
    }
    .tpl-desc {
      margin: 0 0 16px;
      font-size: 14px;
      color: var(--ink-secondary);
    }
    .tpl-chips-wrap {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .tpl-chip {
      font-size: 12px;
      padding: 4px 10px;
      border-radius: 8px;
      background: var(--canvas);
      color: var(--ink-secondary);
      border: 1px solid rgba(20, 56, 62, 0.07);
    }
    .tpl-actions {
      display: flex;
      gap: 8px;
      padding-top: 6px;
    }
    .btn-tpl-primary {
      flex: 1;
      height: 42px;
      border-radius: var(--radius-pill);
      border: none;
      background: var(--petrol);
      color: var(--white);
      font-size: 13.5px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s ease;
    }
    .btn-tpl-primary:hover { background: var(--petrol-mid); }
    .btn-tpl-secondary {
      height: 42px;
      padding: 0 16px;
      border-radius: var(--radius-pill);
      border: 1px solid var(--border);
      background: var(--white);
      color: var(--petrol);
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
    }
    .btn-tpl-secondary:hover { background: var(--canvas); }

    /* 5. INTERACTIVE MOBILE OWNER PORTAL SANDBOX */
    .portal-sandbox-frame {
      background: var(--surface-soft);
      border: 1px solid var(--border);
      border-radius: var(--radius-card-lg);
      padding: clamp(24px, 4vw, 44px);
      display: grid;
      grid-template-columns: 0.9fr 1.1fr;
      gap: 36px;
      align-items: start;
    }
    .portal-device {
      background: var(--white);
      border: 1px solid var(--border-strong);
      border-radius: 26px;
      overflow: hidden;
      box-shadow: 0 24px 48px -18px rgba(20, 56, 62, 0.16);
    }
    .portal-device-top {
      background: var(--petrol);
      color: var(--white);
      padding: 18px 22px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }
    .portal-tabs {
      display: flex;
      gap: 6px;
      padding: 12px 18px;
      background: var(--canvas);
      border-bottom: 1px solid var(--border);
    }
    .portal-tab-btn {
      height: 32px;
      padding: 0 14px;
      border-radius: var(--radius-pill);
      border: 1px solid transparent;
      background: transparent;
      color: var(--ink-secondary);
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
    }
    .portal-tab-btn.active {
      background: var(--white);
      color: var(--petrol);
      border-color: var(--border);
      font-weight: 600;
    }
    .portal-list {
      padding: 16px 18px;
      display: grid;
      gap: 12px;
      max-height: 460px;
      overflow-y: auto;
    }
    .portal-item {
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 16px;
      background: var(--white);
    }
    .portal-item.is-user-test {
      background: #f2fbf9;
      border-color: #9ae6b4;
    }
    .portal-item-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 6px;
    }
    .portal-badge-live {
      font-size: 11px;
      font-weight: 700;
      padding: 2px 9px;
      border-radius: var(--radius-pill);
      background: var(--mint-soft);
      color: var(--petrol);
    }
    .portal-quick-actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid var(--border);
    }
    .portal-act-btn {
      height: 32px;
      padding: 0 12px;
      border-radius: 8px;
      border: 1px solid var(--border);
      background: var(--canvas);
      color: var(--petrol);
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
    }
    .portal-act-btn.primary {
      background: var(--petrol);
      color: var(--white);
      border-color: var(--petrol);
    }

    /* 6. HOW SELF-HOSTING WORKS (3 STAGES) */
    .steps-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 24px;
    }
    .step-card {
      background: var(--canvas);
      border: 1px solid var(--border);
      border-radius: var(--radius-card-md);
      padding: 32px;
    }
    .step-num {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      height: 32px;
      padding: 0 12px;
      border-radius: var(--radius-pill);
      background: var(--petrol);
      color: var(--mint);
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 18px;
    }
    .step-card h3 {
      margin: 0 0 10px;
      font-size: 21px;
      font-weight: 600;
      letter-spacing: -0.02em;
    }
    .step-card p {
      margin: 0;
      font-size: 14.5px;
      color: var(--ink-secondary);
      line-height: 1.6;
    }

    /* 7. PRICING & STRIPE CHECKOUT */
    .pricing-grid {
      display: grid;
      grid-template-columns: 0.9fr 1.2fr 0.9fr;
      gap: 24px;
      align-items: stretch;
    }
    .offer-card {
      background: var(--white);
      border: 1px solid var(--border);
      border-radius: var(--radius-card-lg);
      padding: 36px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 24px;
    }
    .offer-card.featured {
      background: linear-gradient(145deg, var(--petrol-deep) 0%, var(--petrol) 100%);
      color: var(--white);
      border-color: var(--petrol);
      box-shadow: 0 28px 60px -18px rgba(12, 38, 43, 0.35);
    }
    .offer-pill {
      display: inline-block;
      font-size: 12px;
      font-weight: 600;
      padding: 4px 12px;
      border-radius: var(--radius-pill);
      background: var(--surface-soft);
      color: var(--petrol);
      margin-bottom: 14px;
    }
    .offer-card.featured .offer-pill {
      background: var(--mint);
      color: var(--petrol-deep);
    }
    .offer-title {
      margin: 0 0 8px;
      font-size: 24px;
      font-weight: 600;
      letter-spacing: -0.025em;
    }
    .offer-price-row {
      display: flex;
      align-items: baseline;
      gap: 8px;
      margin: 12px 0 16px;
    }
    .offer-price {
      font-size: 46px;
      font-weight: 600;
      letter-spacing: -0.04em;
      line-height: 1;
    }
    .offer-price-note {
      font-size: 14px;
      color: var(--muted);
    }
    .offer-card.featured .offer-price-note {
      color: rgba(230, 255, 250, 0.76);
    }
    .offer-features {
      list-style: none;
      padding: 0;
      margin: 0 0 20px;
      display: grid;
      gap: 10px;
      font-size: 14px;
    }
    .offer-features li {
      display: flex;
      align-items: flex-start;
      gap: 10px;
    }
    .checkout-box {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.18);
      border-radius: 20px;
      padding: 20px;
    }
    .checkout-field {
      margin-bottom: 12px;
    }
    .checkout-label {
      display: block;
      font-size: 12px;
      font-weight: 500;
      color: rgba(230, 255, 250, 0.86);
      margin-bottom: 5px;
    }
    .checkout-input {
      width: 100%;
      height: 44px;
      padding: 0 14px;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.24);
      background: rgba(12, 38, 43, 0.65);
      color: var(--white);
      font-size: 14px;
      outline: none;
    }
    .checkout-input::placeholder { color: rgba(255, 255, 255, 0.45); }
    .checkout-input:focus { border-color: var(--mint); }

    .result-box {
      display: none;
      margin-top: 14px;
      padding: 16px;
      border-radius: 14px;
      background: var(--white);
      color: var(--ink);
      font-size: 13px;
    }
    .result-box.visible { display: block; }
    .key-pre {
      margin: 8px 0;
      padding: 10px 12px;
      border-radius: 8px;
      background: var(--petrol-deep);
      color: var(--mint);
      font-family: 'JetBrains Mono', monospace;
      font-size: 11.5px;
      word-break: break-all;
      white-space: pre-wrap;
    }

    /* 8. FAQ & FOOTER */
    .faq-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 20px;
    }
    .faq-card {
      background: var(--white);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 26px;
    }
    .faq-card h3 {
      margin: 0 0 8px;
      font-size: 17px;
      font-weight: 600;
      letter-spacing: -0.015em;
    }
    .faq-card p {
      margin: 0;
      font-size: 14px;
      color: var(--ink-secondary);
      line-height: 1.6;
    }

    .site-footer {
      background: var(--canvas);
      border-top: 1px solid var(--border);
      padding: 44px 0;
      font-size: 13.5px;
      color: var(--muted);
    }
    .footer-inner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      flex-wrap: wrap;
    }
    .footer-links {
      display: flex;
      gap: 20px;
      flex-wrap: wrap;
    }
    .footer-links a:hover { color: var(--petrol); text-decoration: underline; }

    @media (max-width: 1024px) {
      .hero-frame, .templates-grid, .portal-sandbox-frame, .steps-grid, .pricing-grid, .faq-grid {
        grid-template-columns: 1fr;
      }
      .nav-links { display: none; }
    }
  </style>
</head>
<body>

  <!-- 1. TOP ANNOUNCEMENT BAR -->
  <div class="announcement-bar">
    <div class="announcement-inner">
      <span>Replace $40/mo form subscriptions with a pop-out enquiry drawer &amp; mobile owner portal you own outright — <strong>$${escapeHtml(priceAud)} AUD once-off</strong></span>
      <a href="#templates" class="announcement-link">Test Live Templates &rarr;</a>
    </div>
  </div>

  <!-- 2. STICKY DETACHED PILL NAVBAR -->
  <header class="site-header">
    <nav class="nav-container" aria-label="Primary Navigation">
      <div class="nav-left-pill">
        <a href="#top" class="brand-logo">
          <svg width="26" height="24" viewBox="0 0 256 240" fill="none" aria-hidden="true">
            <rect x="0" y="0" width="252" height="32" rx="16" fill="currentColor"/>
            <rect x="0" y="56" width="252" height="32" rx="16" fill="currentColor"/>
            <path d="M16 112H236A16 16 0 0 1 236 144H229.1L204.8 124.8A27 27 0 0 0 161.1 144H16A16 16 0 0 1 16 112Z" fill="currentColor"/>
            <rect x="0" y="168" width="154" height="32" rx="16" fill="currentColor"/>
            <path d="M188 146L236 184L188 222" stroke="currentColor" stroke-width="30" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>AskForms</span>
        </a>
        <ul class="nav-links">
          <li><a href="#templates" class="nav-link">Form Templates</a></li>
          <li><a href="#owner-portal" class="nav-link">Owner Portal Preview</a></li>
          <li><a href="#how-it-works" class="nav-link">How Ownership Works</a></li>
          <li><a href="#pricing" class="nav-link">Pricing</a></li>
          <li><a href="#faq" class="nav-link">FAQ</a></li>
        </ul>
      </div>

      <div class="nav-right-cluster">
        <button type="button" class="nav-secondary-pill" data-launch-template="template-quote" data-launch-mode="drawer" data-launch-title="Request a Fast Quote">
          Try Live Pop-Out
        </button>
        <a href="#pricing" class="nav-primary-pill">
          Buy Site License — $${escapeHtml(priceAud)}
        </a>
      </div>
    </nav>
  </header>

  <!-- 3. HERO SECTION -->
  <main id="top">
    <section class="hero-section">
      <div class="container">
        <div class="hero-frame">
          <div>
            <div class="hero-eyebrow-pills">
              <span class="hero-eyebrow-badge">Once-Off License</span>
              <span>Self-Hosted Pop-Out Enquiry Engine</span>
            </div>

            <h1 class="hero-title">
              Pop-out website forms that feel built into your site.
            </h1>

            <p class="hero-subtitle">
              Turn any “Get a Quote” or “Book an Appointment” button into a slide-over drawer or floating chat window—paired with a simple mobile Owner Portal for 1-tap replies. Pay once, host on your own domain, and keep 100% control.
            </p>

            <div class="hero-cta-group">
              <a href="#templates" class="btn-hero-primary">
                Explore Live Form Templates
              </a>
              <a href="#pricing" class="btn-hero-secondary">
                Purchase Site License ($${escapeHtml(priceAud)} AUD)
              </a>
            </div>

            <div class="hero-reassurance">
              <span>✓ $${escapeHtml(priceAud)} AUD once-off — zero monthly fees</span>
              <span>✓ Self-hosted on your domain</span>
              <span>✓ 1 license key per website</span>
            </div>
          </div>

          <!-- Right Interactive Industry Template Switcher -->
          <div class="hero-showcase" aria-label="Interactive Pop-Out Template Switcher">
            <div class="hero-scene-pills" role="tablist">
              <button type="button" class="hero-scene-btn active" data-hero-scene="quote">Trades &amp; Quotes</button>
              <button type="button" class="hero-scene-btn" data-hero-scene="appointment">Clinic Appointments</button>
              <button type="button" class="hero-scene-btn" data-hero-scene="booking">Venue &amp; Table Bookings</button>
            </div>

            <div class="showcase-card-inner" id="hero-scene-card">
              <div class="showcase-eyebrow" id="hs-eyebrow">2-Step Slide-Over Drawer · Trades &amp; Services</div>
              <h2 class="showcase-heading" id="hs-title">Request a Fast Quote</h2>
              <p class="showcase-copy" id="hs-copy">
                Opens smoothly over the right edge of your website when a visitor clicks “Get a Quote”—without navigating them away from the page they are reading.
              </p>
              <div class="showcase-field-preview" id="hs-fields">
                <div class="showcase-fake-input"><span>1. What do you need a quote for?</span><span>Emergency Repair ▾</span></div>
                <div class="showcase-fake-input"><span>2. Suburb or Postcode</span><span>Surry Hills 2010</span></div>
                <div class="showcase-fake-input"><span>3. Mobile Number (for SMS quote)</span><span>0412 345 678</span></div>
              </div>
              <div class="showcase-actions">
                <button type="button" class="btn-tpl-primary" id="hs-launch-drawer" data-launch-template="template-quote" data-launch-mode="drawer" data-launch-title="Request a Fast Quote">
                  Open Slide-Over Drawer Live &rarr;
                </button>
                <button type="button" class="btn-tpl-secondary" id="hs-launch-chat" data-launch-template="template-quote" data-launch-mode="popover" data-launch-title="Request a Fast Quote">
                  Floating Chat
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 4. INTERACTIVE TEMPLATE LIBRARY -->
    <section class="section-block" id="templates">
      <div class="container">
        <div class="section-header">
          <span class="section-eyebrow">Ready-To-Use Templates</span>
          <h2 class="section-h2">Built for quotes, appointments, bookings, and client intake</h2>
          <p class="section-subtitle">
            Click any template below to launch the actual pop-out form right on this page. Every template is included with your license and can be customized to match your brand colors and fields.
          </p>
        </div>

        <div class="templates-grid">
          ${templateCardsHtml}
        </div>
      </div>
    </section>

    <!-- 5. INTERACTIVE MOBILE OWNER PORTAL PREVIEW (Session-Recognized Sandbox) -->
    <section class="section-block alt-bg" id="owner-portal">
      <div class="container">
        <div class="portal-sandbox-frame">
          <div>
            <span class="section-eyebrow">Interactive Owner Portal Preview</span>
            <h2 class="section-h2">See what the business owner receives on their phone</h2>
            <p class="section-subtitle" style="margin-bottom:20px;">
              When you self-host AskForms on your domain, your client or team gets a clean, PIN-protected Daily Operations Portal at <span class="mono">/manage</span>—designed to be bookmarked on their phone home screen.
            </p>
            <div style="background:var(--white);border:1px solid var(--border);border-radius:18px;padding:20px;margin-bottom:20px;">
              <div style="font-weight:600;font-size:15px;margin-bottom:6px;color:var(--petrol);">How this live trial preview works:</div>
              <p style="margin:0;font-size:13.5px;color:var(--ink-secondary);line-height:1.55;">
                Submit a test enquiry in any pop-out template above. Your browser session captures your test submission privately in your browser and routes it directly into the live Owner Portal simulator on the right—so you can test 1-tap calling, replying, and status tracking immediately.
              </p>
            </div>
            <div style="display:flex;gap:10px;flex-wrap:wrap;">
              <button type="button" class="btn-tpl-primary" style="flex:0 0 auto;padding:0 22px;" data-launch-template="template-quote" data-launch-mode="drawer" data-launch-title="Request a Fast Quote">
                Submit a Test Quote Now &rarr;
              </button>
              <button type="button" class="btn-tpl-secondary" id="reset-demo-portal-btn">
                Reset Sample Inbox
              </button>
            </div>
          </div>

          <!-- Interactive Owner Portal Simulator -->
          <div class="portal-device" aria-label="Interactive Owner Portal Simulator">
            <div class="portal-device-top">
              <div>
                <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:var(--mint);font-weight:600;">Mobile Owner Portal (/manage)</div>
                <div style="font-size:16px;font-weight:600;">Daily Enquiries Inbox</div>
              </div>
              <span style="font-size:12px;background:rgba(255,255,255,0.12);padding:4px 10px;border-radius:999px;" id="portal-count-pill">3 enquiries</span>
            </div>

            <div class="portal-tabs" role="tablist">
              <button type="button" class="portal-tab-btn active" data-portal-filter="all">All</button>
              <button type="button" class="portal-tab-btn" data-portal-filter="new">New</button>
              <button type="button" class="portal-tab-btn" data-portal-filter="replied">Replied</button>
              <button type="button" class="portal-tab-btn" data-portal-filter="closed">Closed</button>
            </div>

            <div class="portal-list" id="portal-demo-list"></div>
          </div>
        </div>
      </div>
    </section>

    <!-- 6. HOW SELF-HOSTING & LICENSING WORKS -->
    <section class="section-block" id="how-it-works">
      <div class="container">
        <div class="section-header">
          <span class="section-eyebrow">How Ownership Works</span>
          <h2 class="section-h2">Self-hosted on your domain. Locked to one website per key.</h2>
          <p class="section-subtitle">
            No shared third-party dashboard and no monthly SaaS bills. When you purchase a license, you deploy your own private AskForms instance on your domain.
          </p>
        </div>

        <div class="steps-grid">
          <div class="step-card">
            <span class="step-num">Stage 1</span>
            <h3>Purchase Your 1-Domain Key</h3>
            <p>
              Enter your website domain (e.g. <span class="mono">harbourplumbing.com.au</span>) at checkout. Stripe issues your signed <span class="mono">ASK1</span> license key bound exclusively to that domain.
            </p>
          </div>

          <div class="step-card">
            <span class="step-num">Stage 2</span>
            <h3>Deploy to Your Own Host</h3>
            <p>
              Connect the AskForms repository to your own free Cloudflare Pages + D1 account (or Node server) at <span class="mono">forms.yourdomain.com.au</span> and activate your <span class="mono">ASK1</span> key inside your private <span class="mono">/app</span> studio.
            </p>
          </div>

          <div class="step-card">
            <span class="step-num">Stage 3</span>
            <h3>Drop One Script on Your Site</h3>
            <p>
              Paste one <span class="mono">&lt;script&gt;</span> tag onto WordPress, Webflow, Squarespace, Shopify, or HTML. Any quote or booking button opens the slide-over drawer and delivers leads to <span class="mono">/manage</span>.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- 7. PRICING & DIRECT STRIPE CHECKOUT -->
    <section class="section-block alt-bg" id="pricing">
      <div class="container">
        <div class="section-header">
          <span class="section-eyebrow">Transparent Pricing</span>
          <h2 class="section-h2">Pay once per website. Own it forever.</h2>
          <p class="section-subtitle">
            Every license includes all 6 pop-out form templates, the visual Form Studio (<span class="mono">/app</span>), and the mobile 6-digit PIN Owner Portal (<span class="mono">/manage</span>).
          </p>
        </div>

        <div class="pricing-grid">
          <!-- Tier 1: Live Trial -->
          <article class="offer-card">
            <div>
              <span class="offer-pill">Before You Buy</span>
              <h3 class="offer-title">Live Preview Mode</h3>
              <div class="offer-price-row">
                <span class="offer-price">$0</span>
                <span class="offer-price-note">Up to 5 live test enquiries</span>
              </div>
              <p style="font-size:14px;color:var(--ink-secondary);margin:0 0 18px;">
                Connect the pop-out drawer to a staging or client site during your build to verify styling and email routing before activating a domain key.
              </p>
              <ul class="offer-features">
                <li><span>✓</span><span>Test all 6 pop-out drawer &amp; floating window templates</span></li>
                <li><span>✓</span><span>Includes 5 live test submissions on any staging URL</span></li>
                <li><span>✓</span><span>Unlock unlimited enquiries anytime with an <span class="mono">ASK1</span> key</span></li>
              </ul>
            </div>
            <button type="button" class="btn-tpl-secondary" style="width:100%;height:46px;" data-launch-template="template-quote" data-launch-mode="drawer" data-launch-title="Request a Fast Quote">
              Test Live Pop-Out Drawer &rarr;
            </button>
          </article>

          <!-- Tier 2: Featured Single-Domain Lifetime License -->
          <article class="offer-card featured">
            <div>
              <span class="offer-pill">Single-Website License · 1 Key = 1 Domain</span>
              <h3 class="offer-title">Lifetime Domain License</h3>
              <div class="offer-price-row">
                <span class="offer-price">$${escapeHtml(priceAud)}</span>
                <span class="offer-price-note">AUD once-off · Zero monthly fees</span>
              </div>
              <ul class="offer-features">
                <li><span>✓</span><span>Cryptographically locked to <strong>1 production website domain</strong></span></li>
                <li><span>✓</span><span>Unlimited forms, unlimited enquiries &amp; spam protection</span></li>
                <li><span>✓</span><span>Self-hosted Form Studio (<span class="mono">/app</span>) &amp; Mobile Owner Portal (<span class="mono">/manage</span>)</span></li>
              </ul>

              <div class="checkout-box">
                <form id="issue-key-form">
                  <div class="checkout-field">
                    <label class="checkout-label" for="lic-domain">Website Domain to License</label>
                    <input class="checkout-input mono" id="lic-domain" name="domain" placeholder="harbourplumbing.com.au" required />
                  </div>
                  <div class="checkout-field">
                    <label class="checkout-label" for="lic-holder">Business or Client Name</label>
                    <input class="checkout-input" id="lic-holder" name="holder" placeholder="Harbour Plumbing Co" required />
                  </div>
                  <button type="submit" class="btn-hero-primary" style="width:100%;height:46px;margin-top:6px;" id="stripe-buy-btn">
                    Purchase Single-Domain License ($${escapeHtml(priceAud)} AUD) &rarr;
                  </button>
                </form>

                <div id="issued-result" class="result-box">
                  <div style="font-weight:700;color:var(--petrol);">Payment Verified — Your Domain Key is Ready</div>
                  <div style="margin-top:2px;color:var(--ink-secondary);font-size:12px;">Locked to <span class="mono" id="res-domain"></span></div>
                  <pre class="key-pre" id="res-key"></pre>
                  <button type="button" class="btn-tpl-primary" style="width:100%;height:36px;font-size:12.5px;" id="copy-key-btn">Copy License Key</button>
                </div>
              </div>
            </div>
          </article>

          <!-- Tier 3: Agency & Partner Rollout -->
          <article class="offer-card">
            <div>
              <span class="offer-pill">For Web Agencies</span>
              <h3 class="offer-title">Partner Client Sites</h3>
              <div class="offer-price-row">
                <span class="offer-price" style="font-size:36px;">Per Site</span>
                <span class="offer-price-note">1 key per client domain</span>
              </div>
              <p style="font-size:14px;color:var(--ink-secondary);margin:0 0 18px;">
                Deliver a polished enquiry drawer and mobile Owner Portal on every client build without handing them an ongoing monthly form bill.
              </p>
              <ul class="offer-features">
                <li><span>✓</span><span>Set up and test on client staging in Preview Mode first</span></li>
                <li><span>✓</span><span>Activate the client’s domain key at launch</span></li>
                <li><span>✓</span><span>Hand over the 6-digit PIN <span class="mono">/manage</span> portal to the business owner</span></li>
              </ul>
            </div>
            <button type="button" class="btn-tpl-secondary" style="width:100%;height:46px;" onclick="document.getElementById('lic-domain')?.focus()">
              License a Client Domain &rarr;
            </button>
          </article>
        </div>
      </div>
    </section>

    <!-- 8. COMMON QUESTIONS -->
    <section class="section-block" id="faq">
      <div class="container">
        <div class="section-header">
          <span class="section-eyebrow">Common Questions</span>
          <h2 class="section-h2">Everything you need to know</h2>
        </div>

        <div class="faq-grid">
          <div class="faq-card">
            <h3>Is AskForms self-hosted when I purchase?</h3>
            <p>
              Yes. When you purchase a license, you deploy AskForms on your own Cloudflare Pages + D1 account (which is free for up to 100,000 requests/day) or any Node.js host on your own domain. Your Form Studio (<span class="mono">/app</span>) and Owner Portal (<span class="mono">/manage</span>) belong solely to your deployment.
            </p>
          </div>
          <div class="faq-card">
            <h3>How does the 1-domain license key work?</h3>
            <p>
              At checkout, you enter the website domain where the forms will be used (e.g. <span class="mono">client.com.au</span>). Your <span class="mono">ASK1</span> license key is cryptographically signed for that domain and unlocks unlimited enquiries on <span class="mono">client.com.au</span> and <span class="mono">www.client.com.au</span>.
            </p>
          </div>
          <div class="faq-card">
            <h3>Can I test it on a website before buying a key?</h3>
            <p>
              Yes. An unactivated deployment runs in Live Preview Mode, allowing up to 5 real test enquiries on your staging or live site so you can confirm everything works before purchasing your domain key.
            </p>
          </div>
          <div class="faq-card">
            <h3>Does the pop-out work on WordPress, Webflow, or Squarespace?</h3>
            <p>
              Yes. You add a single <span class="mono">&lt;script&gt;</span> tag to your site header or footer. Any link or button pointing to <span class="mono">#askforms</span> automatically opens the slide-over drawer or floating window.
            </p>
          </div>
        </div>
      </div>
    </section>
  </main>

  <footer class="site-footer">
    <div class="container footer-inner">
      <div>
        <strong style="color:var(--petrol);">AskForms</strong> · Self-Hosted Pop-Out Enquiry Engine · © 2026 AskForms (<span class="mono">askforms.app</span>)
      </div>
      <div class="footer-links">
        <a href="#templates">Templates</a>
        <a href="#owner-portal">Owner Portal Preview</a>
        <a href="#how-it-works">How It Works</a>
        <a href="#pricing">Pricing</a>
        <a href="/app">Partner Studio</a>
      </div>
    </div>
  </footer>

  <script src="/widget.js" data-form="template-quote" data-mode="drawer" data-label="Try Live Form" data-title="Request a Fast Quote" data-accent="#14383e" defer></script>
  <script>
    // 1. Launch any template in Slide-Over Drawer or Floating Chat Window
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-launch-template]');
      if (!btn) return;
      const formId = btn.getAttribute('data-launch-template');
      const mode = btn.getAttribute('data-launch-mode') || 'drawer';
      const title = btn.getAttribute('data-launch-title') || 'Live Enquiry';
      window.AskForms?.open({ formId, mode, title });
    });

    // 2. Hero Interactive Industry Switcher
    const HERO_SCENES = {
      quote: {
        eyebrow: '2-Step Slide-Over Drawer · Trades & Services',
        title: 'Request a Fast Quote',
        copy: 'Opens smoothly over the right edge of your website when a visitor clicks “Get a Quote”—without navigating them away from the page they are reading.',
        fields: [
          ['1. What do you need a quote for?', 'Emergency Repair ▾'],
          ['2. Suburb or Postcode', 'Surry Hills 2010'],
          ['3. Mobile Number (for SMS quote)', '0412 345 678'],
        ],
        formId: 'template-quote',
      },
      appointment: {
        eyebrow: '2-Step Slide-Over Drawer · Clinics & Consultancies',
        title: 'Book an Appointment',
        copy: 'Captures service type, new vs. returning client status, and preferred day & time window in seconds.',
        fields: [
          ['1. Consultation or Service Type', 'Initial Assessment (45 mins) ▾'],
          ['2. Preferred Day & Time Window', 'Monday / Tuesday · Morning ▾'],
          ['3. Client Name & Mobile', 'Sarah Jenkins · 0400 123 456'],
        ],
        formId: 'template-appointment',
      },
      booking: {
        eyebrow: '2-Step Slide-Over Drawer · Hospitality & Venues',
        title: 'Table, Function & Event Booking',
        copy: 'Lets guests request group tables, private dining, or event packages with guest counts and dietary notes.',
        fields: [
          ['1. Booking Type', 'Group Table Reservation (6–14 Guests) ▾'],
          ['2. Guests & Preferred Date', '12 guests · Friday 7:00 PM'],
          ['3. Dietary or Occasion Notes', 'Birthday dinner, 2 GF guests'],
        ],
        formId: 'template-booking',
      },
    };

    document.querySelectorAll('[data-hero-scene]').forEach((tab) => {
      tab.addEventListener('click', () => {
        const key = tab.getAttribute('data-hero-scene');
        const scene = HERO_SCENES[key];
        if (!scene) return;
        document.querySelectorAll('[data-hero-scene]').forEach((b) => b.classList.toggle('active', b === tab));
        document.getElementById('hs-eyebrow').textContent = scene.eyebrow;
        document.getElementById('hs-title').textContent = scene.title;
        document.getElementById('hs-copy').textContent = scene.copy;
        document.getElementById('hs-fields').innerHTML = scene.fields
          .map(([l, r]) => '<div class="showcase-fake-input"><span>' + l + '</span><span>' + r + '</span></div>')
          .join('');
        const dBtn = document.getElementById('hs-launch-drawer');
        const cBtn = document.getElementById('hs-launch-chat');
        dBtn.setAttribute('data-launch-template', scene.formId);
        dBtn.setAttribute('data-launch-title', scene.title);
        cBtn.setAttribute('data-launch-template', scene.formId);
        cBtn.setAttribute('data-launch-title', scene.title);
      });
    });

    // 3. Browser-Session Recognized Interactive Owner Portal Sandbox
    const STORAGE_KEY = 'askforms_trial_enquiries_v1';
    const DEFAULT_SAMPLE_ENQUIRIES = [
      {
        id: 'sample_1',
        formName: 'Request a Fast Quote',
        name: 'Tom Callahan',
        email: 'tom@callahanbuild.com.au',
        phone: '0418 294 110',
        summary: 'Emergency Repair · Surry Hills 2010 · Urgent (Today / Tomorrow)',
        detail: 'Hot water system leaking in ground floor laundry, need a quote for replacement.',
        status: 'new',
        time: '12 mins ago',
        isUserTest: false,
      },
      {
        id: 'sample_2',
        formName: 'Book an Appointment',
        name: 'Sarah Jenkins',
        email: 'sarah.j@example.com.au',
        phone: '0402 881 334',
        summary: 'Initial Assessment (45 mins) · New Client · Wednesday Morning',
        detail: 'Lower back stiffness after running, referred by Dr. Patel.',
        status: 'new',
        time: '1 hour ago',
        isUserTest: false,
      },
      {
        id: 'sample_3',
        formName: 'Table, Function & Event Booking',
        name: 'Chloe Vance',
        email: 'chloe@vancecreative.com.au',
        phone: '0433 222 111',
        summary: 'Private Dining (15–60 Guests) · 22 Guests · Friday 24 Nov, 7:00 PM',
        detail: 'End-of-year team dinner, 2 vegetarian and 1 gluten-free guest.',
        status: 'replied',
        time: 'Yesterday',
        isUserTest: false,
      },
    ];

    let portalFilter = 'all';

    function loadPortalItems() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
      return DEFAULT_SAMPLE_ENQUIRIES;
    }

    function savePortalItems(items) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      } catch {}
    }

    function renderPortalSandbox() {
      const items = loadPortalItems();
      const visible = portalFilter === 'all' ? items : items.filter((i) => i.status === portalFilter);
      const countEl = document.getElementById('portal-count-pill');
      if (countEl) countEl.textContent = items.length + (items.length === 1 ? ' enquiry' : ' enquiries');

      const listEl = document.getElementById('portal-demo-list');
      if (!listEl) return;

      if (visible.length === 0) {
        listEl.innerHTML = '<div style="padding:28px;text-align:center;color:var(--muted);font-size:13.5px;">No enquiries in this status tab.</div>';
        return;
      }

      listEl.innerHTML = visible
        .map((item) => {
          const statusLabel = item.status === 'new' ? 'New' : item.status === 'replied' ? 'Replied' : 'Closed';
          return (
            '<div class="portal-item ' + (item.isUserTest ? 'is-user-test' : '') + '">' +
              '<div class="portal-item-head">' +
                '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">' +
                  '<strong style="font-size:15px;color:var(--ink);">' + item.name + '</strong>' +
                  '<span style="font-size:12px;color:var(--muted);">· ' + item.formName + '</span>' +
                  (item.isUserTest ? '<span class="portal-badge-live">Your Live Test Enquiry</span>' : '') +
                '</div>' +
                '<span style="font-size:11.5px;font-weight:600;color:var(--petrol);">' + statusLabel + ' · ' + item.time + '</span>' +
              '</div>' +
              '<div style="font-size:13px;font-weight:500;color:var(--petrol);margin-bottom:4px;">' + item.summary + '</div>' +
              '<div style="font-size:13px;color:var(--ink-secondary);">' + item.detail + '</div>' +
              '<div class="portal-quick-actions">' +
                '<a class="portal-act-btn primary" href="mailto:' + item.email + '?subject=Re: ' + encodeURIComponent(item.formName) + '">1-Tap Email Reply</a>' +
                (item.phone ? '<a class="portal-act-btn" href="tel:' + item.phone + '">Call ' + item.phone + '</a>' : '') +
                (item.status !== 'replied'
                  ? '<button type="button" class="portal-act-btn" data-portal-status="' + item.id + '" data-next-status="replied">Mark Replied</button>'
                  : '<button type="button" class="portal-act-btn" data-portal-status="' + item.id + '" data-next-status="closed">Mark Closed</button>') +
              '</div>' +
            '</div>'
          );
        })
        .join('');
    }

    document.querySelectorAll('[data-portal-filter]').forEach((btn) => {
      btn.addEventListener('click', () => {
        portalFilter = btn.getAttribute('data-portal-filter');
        document.querySelectorAll('[data-portal-filter]').forEach((b) => b.classList.toggle('active', b === btn));
        renderPortalSandbox();
      });
    });

    document.getElementById('portal-demo-list')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-portal-status]');
      if (!btn) return;
      const id = btn.getAttribute('data-portal-status');
      const nextStatus = btn.getAttribute('data-next-status');
      const items = loadPortalItems().map((item) => (item.id === id ? { ...item, status: nextStatus } : item));
      savePortalItems(items);
      renderPortalSandbox();
    });

    document.getElementById('reset-demo-portal-btn')?.addEventListener('click', () => {
      savePortalItems(DEFAULT_SAMPLE_ENQUIRIES);
      portalFilter = 'all';
      document.querySelectorAll('[data-portal-filter]').forEach((b) => b.classList.toggle('active', b.getAttribute('data-portal-filter') === 'all'));
      renderPortalSandbox();
    });

    // Listen for live test submissions from the Pop-Out Drawer iframe
    window.addEventListener('message', (e) => {
      if (!e.data || typeof e.data !== 'object') return;
      if (e.data.type === 'askforms:submitted') {
        const f = e.data.fields || {};
        const name = f.name || 'Website Visitor';
        const email = f.email || 'visitor@example.com.au';
        const phone = f.phone || '';
        const otherValues = Object.entries(f)
          .filter(([k]) => !['name', 'email', 'phone'].includes(k))
          .map(([, v]) => v)
          .filter(Boolean);
        const summary = otherValues.slice(0, 3).join(' · ') || 'Live template test submission';
        const detail = otherValues.slice(3).join(' — ') || ('Submitted via ' + (e.data.formName || 'Pop-Out Form'));

        const items = loadPortalItems();
        items.unshift({
          id: e.data.submissionId || ('test_' + Date.now()),
          formName: e.data.formName || 'Pop-Out Enquiry',
          name,
          email,
          phone,
          summary,
          detail,
          status: 'new',
          time: 'Just now',
          isUserTest: true,
        });
        savePortalItems(items);
        renderPortalSandbox();
      } else if (e.data.type === 'askforms:open-portal-preview') {
        window.AskForms?.close();
        document.getElementById('owner-portal')?.scrollIntoView({ behavior: 'smooth' });
      }
    });

    renderPortalSandbox();

    // 4. Live Stripe Checkout & Post-Purchase License Verification
    const form = document.getElementById('issue-key-form');
    const stripeBtn = document.getElementById('stripe-buy-btn');
    const resBox = document.getElementById('issued-result');
    const resDomain = document.getElementById('res-domain');
    const resKey = document.getElementById('res-key');
    let latestKey = '';

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      const fd = new FormData(form);
      stripeBtn.disabled = true;
      stripeBtn.textContent = 'Redirecting to Stripe Checkout...';
      try {
        const res = await fetch('/api/license/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            domain: fd.get('domain'),
            holder: fd.get('holder'),
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.checkoutUrl) {
          throw new Error(data.error || 'Unable to start Stripe Checkout');
        }
        window.location.href = data.checkoutUrl;
      } catch (err) {
        alert(err.message);
        stripeBtn.disabled = false;
        stripeBtn.textContent = 'Purchase Single-Domain License ($${escapeHtml(priceAud)} AUD) →';
      }
    });

    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    if (sessionId) {
      fetch('/api/license/verify-session?session_id=' + encodeURIComponent(sessionId))
        .then((r) => r.json())
        .then((data) => {
          if (data.key && data.payload) {
            latestKey = data.key;
            resDomain.textContent = data.payload.domain;
            resKey.textContent = data.key;
            resBox.classList.add('visible');
            document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
          }
        })
        .catch(() => {});
    }

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
