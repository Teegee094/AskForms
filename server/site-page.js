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
    .map(
      (tpl, idx) => `
        <article class="tpl-card reveal" style="transition-delay:${(idx % 3) * 70}ms;">
          <div>
            <span class="tpl-category-pill">${escapeHtml(tpl.category)}</span>
            <h3 class="tpl-title">${escapeHtml(tpl.name)}</h3>
            <p class="tpl-desc">${escapeHtml(tpl.tagline)}</p>
          </div>
          <div class="tpl-actions">
            <button type="button" class="btn-tpl-primary" data-launch-template="${escapeHtml(tpl.id)}" data-launch-mode="drawer" data-launch-title="${escapeHtml(tpl.name)}">
              Preview Form
            </button>
            <button type="button" class="btn-tpl-secondary" data-launch-template="${escapeHtml(tpl.id)}" data-launch-mode="popover" data-launch-title="${escapeHtml(tpl.name)}">
              Chat View
            </button>
          </div>
        </article>
      `
    )
    .join('');

  return `<!doctype html>
<html lang="en-AU">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>AskForms | Own Your Website Forms Outright ($${escapeHtml(priceAud)} Once-Off)</title>
  <meta name="description" content="Stop paying monthly subscriptions for website forms. Own a customisable pop-out form system and private Owner Portal baked directly into your website." />
  <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=2" />
  <link rel="alternate icon" href="/favicon.ico?v=2" />
  <link rel="apple-touch-icon" href="/apple-touch-icon.png?v=2" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
  <style>
    :root {
      --white: #ffffff;
      --canvas: #f4f7f8;
      --surface-soft: #eaf0f2;
      --petrol: #14383e;
      --petrol-deep: #0c262b;
      --petrol-mid: #1d4e56;
      --mint: #4fd1c5;
      --mint-hover: #38c2b5;
      --mint-soft: #e6fffa;
      --ink: #12262a;
      --ink-secondary: #485e65;
      --muted: #6c8289;
      --faint: #94a7ae;
      --border: rgba(20, 56, 62, 0.11);
      --border-soft: #e6eef1;
      --border-strong: rgba(20, 56, 62, 0.22);
      --container-max: 1320px;
      --radius-hero: 44px;
      --radius-card-lg: 28px;
      --radius-card-md: 22px;
      --radius-pill: 999px;
      --ease-out: cubic-bezier(0.22, 1, 0.36, 1);
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
    button, input, select, textarea { font: inherit; color: inherit; }
    button, a[class*="btn"], a[class*="pill"] {
      white-space: nowrap;
    }
    .mono { font-family: 'JetBrains Mono', monospace; }
    .container {
      max-width: var(--container-max);
      margin: 0 auto;
      padding: 0 clamp(18px, 3.5vw, 44px);
    }

    /* SUBTLE ANIMATIONS */
    @keyframes heroGlow {
      0%, 100% { transform: translate(0, 0) scale(1); }
      50% { transform: translate(-18px, 14px) scale(1.06); }
    }
    @keyframes fadeSlideIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes checkoutPulse {
      0% { box-shadow: 0 0 0 0 rgba(79, 209, 197, 0.65); }
      70% { box-shadow: 0 0 0 18px rgba(79, 209, 197, 0); }
      100% { box-shadow: 0 0 0 0 rgba(79, 209, 197, 0); }
    }
    .reveal {
      opacity: 0;
      transform: translateY(18px);
      transition: opacity 0.6s var(--ease-out), transform 0.6s var(--ease-out);
    }
    .reveal.is-visible {
      opacity: 1;
      transform: translateY(0);
    }
    .swap-anim {
      animation: fadeSlideIn 0.24s var(--ease-out) both;
    }
    .pulse-highlight {
      animation: checkoutPulse 1.1s var(--ease-out);
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

    /* 2. STICKY DETACHED PILL NAVBAR */
    .site-header {
      position: sticky;
      top: 12px;
      z-index: 40;
      padding: 12px 0;
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
      padding: 8px 24px 8px 16px;
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
      height: 42px;
      padding: 0 18px;
      border-radius: var(--radius-pill);
      background: rgba(244, 247, 248, 0.92);
      backdrop-filter: blur(14px);
      border: 1px solid var(--border);
      font-size: 13.5px;
      font-weight: 500;
      color: var(--petrol);
      cursor: pointer;
      transition: background 0.18s ease, transform 0.18s var(--ease-out);
    }
    .nav-secondary-pill:hover { background: var(--surface-soft); transform: translateY(-1px); }
    .nav-primary-pill {
      display: inline-flex;
      align-items: center;
      height: 42px;
      padding: 0 20px;
      border-radius: var(--radius-pill);
      background: var(--petrol);
      color: var(--white);
      border: 0;
      font-size: 13.5px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.18s ease, transform 0.18s var(--ease-out);
    }
    .nav-primary-pill:hover { background: var(--petrol-mid); transform: translateY(-1px); }

    /* 3. HERO FRAME */
    .hero-section {
      padding: 8px 0 40px;
    }
    .hero-frame {
      position: relative;
      overflow: hidden;
      background: linear-gradient(135deg, var(--petrol-deep) 0%, var(--petrol) 58%, var(--petrol-mid) 100%);
      border-radius: var(--radius-hero);
      padding: clamp(32px, 4.8vw, 62px);
      color: var(--white);
      display: grid;
      grid-template-columns: 1.08fr 0.92fr;
      gap: clamp(28px, 4vw, 52px);
      align-items: center;
      box-shadow: 0 28px 64px -20px rgba(12, 38, 43, 0.32);
    }
    .hero-ambient-orb {
      position: absolute;
      top: -120px;
      right: -80px;
      width: 520px;
      height: 520px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(79, 209, 197, 0.24) 0%, transparent 68%);
      pointer-events: none;
      animation: heroGlow 9s ease-in-out infinite;
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
      margin-bottom: 20px;
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
      margin: 0 0 16px;
      font-size: clamp(34px, 3.9vw, 52px);
      font-weight: 500;
      letter-spacing: -0.035em;
      line-height: 1.08;
    }
    .hero-subtitle {
      margin: 0 0 26px;
      font-size: clamp(15.5px, 1.25vw, 18px);
      font-weight: 300;
      color: rgba(240, 253, 250, 0.84);
      max-width: 54ch;
      line-height: 1.6;
    }
    .hero-cta-group {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
      margin-bottom: 24px;
    }
    .btn-hero-primary {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      height: 48px;
      padding: 0 24px;
      border-radius: var(--radius-pill);
      background: var(--mint);
      color: var(--petrol-deep);
      font-size: 14.5px;
      font-weight: 600;
      border: none;
      cursor: pointer;
      transition: background 0.18s ease, transform 0.18s var(--ease-out);
    }
    .btn-hero-primary:hover { background: var(--mint-hover); transform: translateY(-1px); }
    .btn-hero-secondary {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      height: 48px;
      padding: 0 22px;
      border-radius: var(--radius-pill);
      background: rgba(255, 255, 255, 0.12);
      color: var(--white);
      border: 1px solid rgba(255, 255, 255, 0.24);
      font-size: 14.5px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.18s ease, transform 0.18s var(--ease-out);
    }
    .btn-hero-secondary:hover { background: rgba(255, 255, 255, 0.2); transform: translateY(-1px); }
    .hero-reassurance {
      display: flex;
      gap: 20px;
      flex-wrap: wrap;
      font-size: 13px;
      color: rgba(230, 255, 250, 0.78);
    }

    /* RIGHT HERO INTERACTIVE SHOWCASE CARD */
    .hero-showcase {
      position: relative;
      z-index: 2;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(18px);
      border: 1px solid rgba(255, 255, 255, 0.18);
      border-radius: var(--radius-card-lg);
      padding: 24px;
    }
    .hero-scene-pills {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
      margin-bottom: 16px;
    }
    .hero-scene-btn {
      height: 32px;
      padding: 0 14px;
      border-radius: var(--radius-pill);
      border: 1px solid rgba(255, 255, 255, 0.22);
      background: rgba(255, 255, 255, 0.08);
      color: rgba(255, 255, 255, 0.86);
      font-size: 12.5px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.16s ease;
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
      border-radius: 20px;
      padding: 22px;
      box-shadow: 0 18px 40px -14px rgba(0, 0, 0, 0.3);
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
      margin: 0 0 6px;
      color: var(--petrol);
    }
    .showcase-copy {
      font-size: 13.5px;
      color: var(--ink-secondary);
      margin: 0 0 14px;
    }
    .showcase-field-preview {
      display: grid;
      gap: 7px;
      margin-bottom: 16px;
    }
    .showcase-fake-input {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 9px 13px;
      border-radius: 10px;
      background: var(--canvas);
      border: 1px solid var(--border);
      font-size: 12.5px;
      color: var(--ink-secondary);
    }
    .showcase-actions {
      display: flex;
      gap: 8px;
    }

    /* COMMON SECTION HEADINGS */
    .section-block {
      padding: 80px 0;
    }
    .section-block.alt-bg {
      background: var(--canvas);
    }
    .section-header {
      max-width: 660px;
      margin-bottom: 40px;
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
      margin-bottom: 12px;
    }
    .section-h2 {
      margin: 0 0 12px;
      font-size: clamp(28px, 2.9vw, 40px);
      font-weight: 500;
      letter-spacing: -0.03em;
      line-height: 1.15;
      color: var(--ink);
    }
    .section-subtitle {
      margin: 0;
      font-size: 16px;
      font-weight: 400;
      color: var(--ink-secondary);
      line-height: 1.6;
    }

    /* 4. CUSTOMISABLE EXAMPLES GRID (CLEAN, UNCROWDED) */
    .custom-banner {
      background: var(--canvas);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 20px 26px;
      margin-bottom: 26px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      flex-wrap: wrap;
    }
    .custom-banner-pills {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .custom-pill {
      font-size: 12.5px;
      font-weight: 500;
      padding: 5px 12px;
      border-radius: var(--radius-pill);
      background: var(--white);
      border: 1px solid var(--border);
      color: var(--petrol);
    }
    .templates-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 20px;
    }
    .tpl-card {
      background: var(--white);
      border: 1px solid var(--border);
      border-radius: var(--radius-card-md);
      padding: 26px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 20px;
      transition: transform 0.22s var(--ease-out), box-shadow 0.22s var(--ease-out), border-color 0.22s ease;
    }
    .tpl-card:hover {
      transform: translateY(-3px);
      border-color: var(--border-strong);
      box-shadow: 0 18px 36px -16px rgba(20, 56, 62, 0.12);
    }
    .tpl-category-pill {
      display: inline-block;
      font-size: 11.5px;
      font-weight: 600;
      color: var(--petrol);
      background: var(--surface-soft);
      padding: 4px 11px;
      border-radius: var(--radius-pill);
      margin-bottom: 12px;
    }
    .tpl-title {
      margin: 0 0 6px;
      font-size: 19px;
      font-weight: 600;
      letter-spacing: -0.02em;
      color: var(--ink);
    }
    .tpl-desc {
      margin: 0;
      font-size: 14px;
      color: var(--ink-secondary);
      line-height: 1.55;
    }
    .tpl-actions {
      display: flex;
      gap: 8px;
    }
    .btn-tpl-primary {
      height: 40px;
      padding: 0 18px;
      border-radius: var(--radius-pill);
      border: none;
      background: var(--petrol);
      color: var(--white);
      font-size: 13.5px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.16s ease, transform 0.16s var(--ease-out);
    }
    .btn-tpl-primary:hover { background: var(--petrol-mid); transform: translateY(-1px); }
    .btn-tpl-secondary {
      height: 40px;
      padding: 0 16px;
      border-radius: var(--radius-pill);
      border: 1px solid var(--border);
      background: var(--white);
      color: var(--petrol);
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.16s ease;
    }
    .btn-tpl-secondary:hover { background: var(--canvas); }

    /* 5. TRUE-TO-NATURE OWNER PORTAL PREVIEW (EXACT REPLICA OF /manage) */
    .op-window {
      background: var(--white);
      border: 1px solid var(--border-strong);
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 28px 64px -22px rgba(20, 56, 62, 0.18);
      display: flex;
      flex-direction: column;
      height: 620px;
    }
    .op-topbar {
      height: 68px;
      flex-shrink: 0;
      background: var(--white);
      border-bottom: 1px solid var(--border-soft);
      padding: 0 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }
    .op-brand-left {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 17px;
      font-weight: 700;
      color: var(--petrol);
    }
    .op-divider {
      width: 1px;
      height: 18px;
      background: var(--border);
      margin: 0 4px;
    }
    .op-context {
      font-size: 13px;
      font-weight: 600;
      color: var(--muted);
    }
    .op-tabs {
      display: flex;
      align-items: center;
      gap: 4px;
      height: 100%;
    }
    .op-tab {
      position: relative;
      height: 68px;
      padding: 0 14px;
      border: 0;
      background: transparent;
      color: var(--muted);
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 7px;
    }
    .op-tab:hover { color: var(--ink); }
    .op-tab.active { color: var(--petrol); }
    .op-tab.active::after {
      content: '';
      position: absolute;
      left: 12px;
      right: 12px;
      bottom: 0;
      height: 2.5px;
      border-radius: 2px 2px 0 0;
      background: var(--mint);
    }
    .op-tab-badge {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      padding: 1px 7px;
      border-radius: 999px;
      background: #f1f5f9;
      color: var(--muted);
    }
    .op-tab.active .op-tab-badge {
      background: var(--mint-soft);
      color: var(--petrol);
    }
    .op-split {
      flex: 1;
      min-height: 0;
      display: grid;
      grid-template-columns: 350px minmax(0, 1fr);
    }
    .op-rail {
      background: var(--white);
      border-right: 1px solid var(--border-soft);
      display: flex;
      flex-direction: column;
      min-height: 0;
    }
    .op-search-wrap {
      padding: 12px 16px;
      border-bottom: 1px solid var(--border-soft);
    }
    .op-search {
      width: 100%;
      height: 36px;
      padding: 0 12px;
      border-radius: 8px;
      border: 1px solid transparent;
      background: #f1f5f9;
      font-size: 13px;
      outline: none;
    }
    .op-search:focus {
      background: var(--white);
      border-color: var(--petrol);
    }
    .op-rail-list {
      flex: 1;
      overflow-y: auto;
      scrollbar-width: none;
    }
    .op-rail-list::-webkit-scrollbar { display: none; }
    .op-row {
      width: 100%;
      text-align: left;
      border: 0;
      border-bottom: 1px solid var(--border-soft);
      background: transparent;
      padding: 14px 16px;
      display: flex;
      gap: 12px;
      cursor: pointer;
      transition: background 0.12s ease;
    }
    .op-row:hover { background: #f8fafb; }
    .op-row.selected { background: var(--mint-soft); }
    .op-avatar {
      width: 34px;
      height: 34px;
      border-radius: 8px;
      background: #f1f5f9;
      color: var(--ink-secondary);
      font-size: 12px;
      font-weight: 700;
      display: grid;
      place-items: center;
      flex-shrink: 0;
      margin-top: 2px;
    }
    .op-row.selected .op-avatar {
      background: var(--white);
      color: var(--petrol);
    }
    .op-row-main { flex: 1; min-width: 0; }
    .op-row-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 2px;
    }
    .op-row-name {
      font-size: 13.5px;
      font-weight: 700;
      color: var(--ink);
      display: inline-flex;
      align-items: center;
      gap: 6px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .op-unread-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--mint);
      flex-shrink: 0;
    }
    .op-row-time {
      font-size: 11.5px;
      color: var(--faint);
      flex-shrink: 0;
    }
    .op-row-form {
      font-size: 12px;
      font-weight: 500;
      color: var(--muted);
      margin-bottom: 3px;
    }
    .op-row-snippet {
      font-size: 12.5px;
      color: var(--ink-secondary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .op-detail-pane {
      overflow-y: auto;
      padding: 26px 30px;
      min-width: 0;
      background-color: #eaf1f4;
      background-image:
        radial-gradient(ellipse 640px 360px at 92% 4%, rgba(79, 209, 197, 0.14), transparent 65%),
        radial-gradient(rgba(20, 56, 62, 0.08) 1px, transparent 1px);
      background-size: 100% 100%, 24px 24px;
      scrollbar-width: none;
    }
    .op-detail-pane::-webkit-scrollbar { display: none; }
    .op-sheet {
      background: var(--white);
      border: 1px solid var(--border-soft);
      border-radius: 18px;
      box-shadow: 0 2px 6px rgba(20, 56, 62, 0.05);
      overflow: hidden;
    }
    .op-sheet-head {
      padding: 22px 26px;
      border-bottom: 1px solid var(--border-soft);
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
    }
    .op-sheet-name {
      margin: 0;
      font-size: 22px;
      font-weight: 700;
      letter-spacing: -0.025em;
    }
    .op-sheet-sub {
      margin-top: 6px;
      font-size: 13px;
      color: var(--muted);
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .op-tag {
      display: inline-flex;
      padding: 2px 8px;
      border-radius: 5px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      background: #f1f5f9;
      color: var(--ink-secondary);
    }
    .op-tag-new { background: var(--mint-soft); color: var(--petrol); }
    .op-tag-replied { background: #e6fffa; color: #22543d; }
    .op-seg {
      display: inline-flex;
      background: #f1f5f9;
      border-radius: 999px;
      padding: 3px;
      gap: 2px;
    }
    .op-seg-btn {
      border: 0;
      background: transparent;
      color: var(--muted);
      padding: 5px 13px;
      border-radius: 999px;
      font-size: 12.5px;
      font-weight: 600;
      cursor: pointer;
    }
    .op-seg-btn.active {
      background: var(--white);
      color: var(--ink);
      box-shadow: 0 1px 2px rgba(20, 56, 62, 0.08);
    }
    .op-action-bar {
      padding: 14px 26px;
      border-bottom: 1px solid var(--border-soft);
      background: #f8fafc;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
    }
    .op-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      height: 36px;
      padding: 0 16px;
      border-radius: 999px;
      border: 1px solid var(--border);
      background: var(--white);
      color: var(--petrol);
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.14s ease;
    }
    .op-btn:hover { background: #f1f5f9; }
    .op-btn-primary {
      background: var(--petrol);
      color: var(--white);
      border-color: var(--petrol);
    }
    .op-btn-primary:hover { background: var(--petrol-mid); }
    .op-sheet-body {
      padding: 22px 26px;
    }
    .op-msg {
      margin: 0 0 20px;
      font-size: 15px;
      line-height: 1.65;
      color: var(--ink);
    }
    .op-fields-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
      padding: 16px;
      background: #f4f7f8;
      border-radius: 10px;
      margin-bottom: 18px;
    }
    .op-f-label {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--faint);
      margin-bottom: 2px;
    }
    .op-f-val {
      font-size: 13.5px;
      font-weight: 500;
      color: var(--ink);
    }
    .op-notes-wrap {
      border-top: 1px solid var(--border-soft);
      padding-top: 16px;
    }
    .op-notes-textarea {
      width: 100%;
      min-height: 68px;
      padding: 10px 12px;
      border-radius: 8px;
      border: 1px solid var(--border);
      background: #f8fafc;
      font-size: 13.5px;
      resize: vertical;
      outline: none;
      margin-top: 8px;
    }
    .op-notes-textarea:focus {
      background: var(--white);
      border-color: var(--petrol);
    }

    /* 6. HOW IT WORKS (3 STAGES) */
    .steps-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 22px;
    }
    .step-card {
      background: var(--canvas);
      border: 1px solid var(--border);
      border-radius: var(--radius-card-md);
      padding: 30px;
    }
    .step-num {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      height: 30px;
      padding: 0 12px;
      border-radius: var(--radius-pill);
      background: var(--petrol);
      color: var(--mint);
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 16px;
    }
    .step-card h3 {
      margin: 0 0 8px;
      font-size: 20px;
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
      gap: 22px;
      align-items: stretch;
    }
    .offer-card {
      background: var(--white);
      border: 1px solid var(--border);
      border-radius: var(--radius-card-lg);
      padding: 34px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 22px;
    }
    .offer-card.featured {
      background: linear-gradient(145deg, var(--petrol-deep) 0%, var(--petrol) 100%);
      color: var(--white);
      border-color: var(--petrol);
      box-shadow: 0 28px 60px -18px rgba(12, 38, 43, 0.32);
    }
    .offer-pill {
      display: inline-block;
      font-size: 12px;
      font-weight: 600;
      padding: 4px 12px;
      border-radius: var(--radius-pill);
      background: var(--surface-soft);
      color: var(--petrol);
      margin-bottom: 12px;
    }
    .offer-card.featured .offer-pill {
      background: var(--mint);
      color: var(--petrol-deep);
    }
    .offer-title {
      margin: 0 0 6px;
      font-size: 23px;
      font-weight: 600;
      letter-spacing: -0.025em;
    }
    .offer-price-row {
      display: flex;
      align-items: baseline;
      gap: 8px;
      margin: 10px 0 16px;
    }
    .offer-price {
      font-size: 44px;
      font-weight: 600;
      letter-spacing: -0.04em;
      line-height: 1;
    }
    .offer-price-note {
      font-size: 13.5px;
      color: var(--muted);
    }
    .offer-card.featured .offer-price-note {
      color: rgba(230, 255, 250, 0.78);
    }
    .offer-features {
      list-style: none;
      padding: 0;
      margin: 0 0 18px;
      display: grid;
      gap: 9px;
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
      border-radius: 18px;
      padding: 18px;
    }
    .checkout-field {
      margin-bottom: 10px;
    }
    .checkout-label {
      display: block;
      font-size: 12px;
      font-weight: 500;
      color: rgba(230, 255, 250, 0.88);
      margin-bottom: 4px;
    }
    .checkout-input {
      width: 100%;
      height: 42px;
      padding: 0 13px;
      border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.24);
      background: rgba(12, 38, 43, 0.65);
      color: var(--white);
      font-size: 14px;
      outline: none;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
    }
    .checkout-input::placeholder { color: rgba(255, 255, 255, 0.45); }
    .checkout-input:focus {
      border-color: var(--mint);
      box-shadow: 0 0 0 3px rgba(79, 209, 197, 0.25);
    }

    .result-box {
      display: none;
      margin-top: 12px;
      padding: 14px;
      border-radius: 12px;
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
      gap: 18px;
    }
    .faq-card {
      background: var(--white);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 24px;
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
      padding: 40px 0;
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
      .hero-frame, .templates-grid, .steps-grid, .pricing-grid, .faq-grid {
        grid-template-columns: 1fr;
      }
      .op-split {
        grid-template-columns: 1fr;
      }
      .op-window {
        height: auto;
      }
      .op-rail {
        max-height: 260px;
        border-right: 0;
        border-bottom: 1px solid var(--border-soft);
      }
      .nav-links { display: none; }
    }
  </style>
</head>
<body>

  <!-- 1. TOP ANNOUNCEMENT BAR -->
  <div class="announcement-bar">
    <div class="announcement-inner">
      <span>Stop paying monthly subscriptions for website forms. Own your enquiry system outright for <strong>$${escapeHtml(priceAud)} AUD once-off</strong>.</span>
      <a href="#examples" class="announcement-link">See Live Examples</a>
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
          <li><a href="#examples" class="nav-link">How It’s Used</a></li>
          <li><a href="#owner-portal" class="nav-link">Owner Portal</a></li>
          <li><a href="#how-it-works" class="nav-link">How Ownership Works</a></li>
          <li><a href="#pricing" class="nav-link">Pricing</a></li>
          <li><a href="#faq" class="nav-link">FAQ</a></li>
        </ul>
      </div>

      <div class="nav-right-cluster">
        <button type="button" class="nav-secondary-pill" data-launch-template="template-quote" data-launch-mode="drawer" data-launch-title="Fast Quote Request">
          Try Live Form
        </button>
        <button type="button" class="nav-primary-pill" data-scroll-checkout>
          Buy License
        </button>
      </div>
    </nav>
  </header>

  <!-- 3. HERO SECTION -->
  <main id="top">
    <section class="hero-section">
      <div class="container">
        <div class="hero-frame">
          <div class="hero-ambient-orb" aria-hidden="true"></div>

          <div>
            <div class="hero-eyebrow-pills">
              <span class="hero-eyebrow-badge">Zero Subscriptions</span>
              <span>Built Directly Into Your Website</span>
            </div>

            <h1 class="hero-title">
              Own your website forms outright. No monthly fees.
            </h1>

            <p class="hero-subtitle">
              Most form builders charge a recurring subscription forever just to forward enquiries to your email. AskForms is a one-off purchase that bakes custom pop-out forms and a private owner inbox directly into your website.
            </p>

            <div class="hero-cta-group">
              <a href="#examples" class="btn-hero-primary">
                See Live Examples
              </a>
              <button type="button" class="btn-hero-secondary" data-scroll-checkout>
                Buy License · $${escapeHtml(priceAud)}
              </button>
            </div>

            <div class="hero-reassurance">
              <span>✓ $${escapeHtml(priceAud)} AUD once-off</span>
              <span>✓ 100% customisable fields and brand colours</span>
              <span>✓ Hosted on your own website</span>
            </div>
          </div>

          <!-- Right Interactive Industry Switcher -->
          <div class="hero-showcase" aria-label="Interactive Pop-Out Form Examples">
            <div class="hero-scene-pills" role="tablist">
              <button type="button" class="hero-scene-btn active" data-hero-scene="quote">Trade Quotes</button>
              <button type="button" class="hero-scene-btn" data-hero-scene="appointment">Appointments</button>
              <button type="button" class="hero-scene-btn" data-hero-scene="booking">Venue Bookings</button>
            </div>

            <div class="showcase-card-inner" id="hero-scene-card">
              <div class="showcase-eyebrow" id="hs-eyebrow">Slide-Over Drawer · Trades &amp; Services</div>
              <h2 class="showcase-heading" id="hs-title">Fast Quote Request</h2>
              <p class="showcase-copy" id="hs-copy">
                Slides out smoothly over your page when a visitor clicks your quote button, keeping them on your website from start to finish.
              </p>
              <div class="showcase-field-preview" id="hs-fields">
                <div class="showcase-fake-input"><span>What do you need a quote for?</span><span>Emergency Repair ▾</span></div>
                <div class="showcase-fake-input"><span>Suburb or Postcode</span><span>Surry Hills 2010</span></div>
                <div class="showcase-fake-input"><span>Mobile Number</span><span>0412 345 678</span></div>
              </div>
              <div class="showcase-actions">
                <button type="button" class="btn-tpl-primary" id="hs-launch-drawer" data-launch-template="template-quote" data-launch-mode="drawer" data-launch-title="Fast Quote Request">
                  Open Slide-Over
                </button>
                <button type="button" class="btn-tpl-secondary" id="hs-launch-chat" data-launch-template="template-quote" data-launch-mode="popover" data-launch-title="Fast Quote Request">
                  Chat View
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 4. FULLY CUSTOMISABLE + HOW BUSINESSES USE ASKFORMS -->
    <section class="section-block" id="examples">
      <div class="container">
        <div class="section-header reveal">
          <span class="section-eyebrow">Fully Customisable</span>
          <h2 class="section-h2">Tailor every field to your business. Here is how others use it.</h2>
          <p class="section-subtitle">
            Build any form from scratch or start with a proven layout. Customize questions, dropdowns, file uploads, and brand colours to match your website.
          </p>
        </div>

        <div class="custom-banner reveal">
          <div>
            <strong style="font-size:15px;color:var(--petrol);">Every form adapts to your brand and workflow</strong>
            <div style="font-size:13.5px;color:var(--ink-secondary);margin-top:2px;">Mix and match any field type or style inside your visual form builder.</div>
          </div>
          <div class="custom-banner-pills">
            <span class="custom-pill">Custom Questions &amp; Dropdowns</span>
            <span class="custom-pill">Photo &amp; File Uploads</span>
            <span class="custom-pill">1-Step or 2-Step Layouts</span>
            <span class="custom-pill">Your Brand Colours &amp; Logo</span>
          </div>
        </div>

        <div class="templates-grid">
          ${templateCardsHtml}
        </div>
      </div>
    </section>

    <!-- 5. 100% TRUE-TO-NATURE OWNER PORTAL PREVIEW -->
    <section class="section-block alt-bg" id="owner-portal">
      <div class="container">
        <div class="section-header reveal">
          <span class="section-eyebrow">Included Owner Portal</span>
          <h2 class="section-h2">A dedicated enquiry inbox for you or your client</h2>
          <p class="section-subtitle">
            Every enquiry lands in your private Owner Portal. Test any form example above and your submission will appear live in the inbox below.
          </p>
        </div>

        <!-- Authentic Split-Pane Owner Portal Replica -->
        <div class="op-window reveal" aria-label="Interactive Owner Portal Preview">
          <header class="op-topbar">
            <div class="op-brand-left">
              <svg width="24" height="22" viewBox="0 0 256 240" fill="none" aria-hidden="true">
                <rect x="0" y="0" width="252" height="32" rx="16" fill="currentColor"/>
                <rect x="0" y="56" width="252" height="32" rx="16" fill="currentColor"/>
                <path d="M16 112H236A16 16 0 0 1 236 144H229.1L204.8 124.8A27 27 0 0 0 161.1 144H16A16 16 0 0 1 16 112Z" fill="currentColor"/>
                <rect x="0" y="168" width="154" height="32" rx="16" fill="currentColor"/>
                <path d="M188 146L236 184L188 222" stroke="currentColor" stroke-width="30" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span>AskForms</span>
              <span class="op-divider"></span>
              <span class="op-context">Enquiries</span>
            </div>

            <nav class="op-tabs" role="tablist">
              <button type="button" class="op-tab active" data-op-filter="new">New <span class="op-tab-badge" id="op-cnt-new">2</span></button>
              <button type="button" class="op-tab" data-op-filter="replied">Replied <span class="op-tab-badge" id="op-cnt-replied">1</span></button>
              <button type="button" class="op-tab" data-op-filter="closed">Closed <span class="op-tab-badge" id="op-cnt-closed">0</span></button>
              <button type="button" class="op-tab" data-op-filter="all">All <span class="op-tab-badge" id="op-cnt-all">3</span></button>
            </nav>

            <div style="display:flex;align-items:center;gap:8px;">
              <button type="button" class="op-btn op-btn-primary" data-launch-template="template-quote" data-launch-mode="drawer" data-launch-title="Fast Quote Request">
                Test a Form
              </button>
              <button type="button" class="op-btn" id="op-reset-btn">
                Reset
              </button>
            </div>
          </header>

          <div class="op-split">
            <aside class="op-rail">
              <div class="op-search-wrap">
                <input id="op-search-input" class="op-search" type="search" placeholder="Search name, email, or message..." />
              </div>
              <div id="op-rail-list" class="op-rail-list"></div>
            </aside>

            <main class="op-detail-pane" id="op-detail-pane"></main>
          </div>
        </div>
      </div>
    </section>

    <!-- 6. HOW OWNERSHIP WORKS -->
    <section class="section-block" id="how-it-works">
      <div class="container">
        <div class="section-header reveal">
          <span class="section-eyebrow">How Ownership Works</span>
          <h2 class="section-h2">Baked into your website in three simple steps</h2>
          <p class="section-subtitle">
            No third-party branding and no ongoing subscription bills. You own the software on your own domain.
          </p>
        </div>

        <div class="steps-grid">
          <div class="step-card reveal">
            <span class="step-num">Step 1</span>
            <h3>License Your Website</h3>
            <p>
              Enter your website domain at checkout for a one-off $${escapeHtml(priceAud)} AUD payment. Your license key is issued immediately for that website.
            </p>
          </div>

          <div class="step-card reveal" style="transition-delay:80ms;">
            <span class="step-num">Step 2</span>
            <h3>Connect to Your Domain</h3>
            <p>
              Install your private AskForms workspace on your own domain and customize your questions, brand colours, and email notifications.
            </p>
          </div>

          <div class="step-card reveal" style="transition-delay:160ms;">
            <span class="step-num">Step 3</span>
            <h3>Link Any Button on Your Site</h3>
            <p>
              Connect your existing quote, booking, or contact buttons so they open the slide-over drawer and send every enquiry straight to your Owner Portal.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- 7. PRICING & DIRECT STRIPE CHECKOUT -->
    <section class="section-block alt-bg" id="pricing">
      <div class="container">
        <div class="section-header reveal">
          <span class="section-eyebrow">Simple Pricing</span>
          <h2 class="section-h2">Pay once per website. Own it forever.</h2>
          <p class="section-subtitle">
            Replace $35 to $50/month form subscriptions with a single purchase that includes unlimited forms, full customisation, and your private Owner Portal.
          </p>
        </div>

        <div class="pricing-grid">
          <!-- Tier 1: Live Site Trial -->
          <article class="offer-card reveal">
            <div>
              <span class="offer-pill">Try Before You Buy</span>
              <h3 class="offer-title">Live Preview Mode</h3>
              <div class="offer-price-row">
                <span class="offer-price">$0</span>
                <span class="offer-price-note">First 5 test enquiries</span>
              </div>
              <p style="font-size:14px;color:var(--ink-secondary);margin:0 0 18px;">
                Set up your forms and test the slide-over drawer on your website before activating your lifetime license key.
              </p>
              <ul class="offer-features">
                <li><span>✓</span><span>Full form customisation and brand styling</span></li>
                <li><span>✓</span><span>Test 5 real enquiries on your website</span></li>
                <li><span>✓</span><span>Activate your domain key when ready to launch</span></li>
              </ul>
            </div>
            <button type="button" class="btn-tpl-secondary" style="width:100%;height:44px;" data-launch-template="template-quote" data-launch-mode="drawer" data-launch-title="Fast Quote Request">
              Try Live Form
            </button>
          </article>

          <!-- Tier 2: Featured Single-Domain Lifetime License -->
          <article class="offer-card featured reveal" id="checkout-card" style="transition-delay:80ms;">
            <div>
              <span class="offer-pill">Single-Website License</span>
              <h3 class="offer-title">Lifetime Website License</h3>
              <div class="offer-price-row">
                <span class="offer-price">$${escapeHtml(priceAud)}</span>
                <span class="offer-price-note">AUD once-off · No subscription</span>
              </div>
              <ul class="offer-features">
                <li><span>✓</span><span>Licensed for <strong>1 production website domain</strong></span></li>
                <li><span>✓</span><span>Unlimited custom forms and unlimited enquiries</span></li>
                <li><span>✓</span><span>Includes Form Builder and mobile Owner Portal</span></li>
              </ul>

              <div class="checkout-box" id="checkout-box-inner">
                <form id="issue-key-form">
                  <div class="checkout-field">
                    <label class="checkout-label" for="lic-domain">Website Domain to License</label>
                    <input class="checkout-input mono" id="lic-domain" name="domain" placeholder="harbourplumbing.com.au" required />
                  </div>
                  <div class="checkout-field">
                    <label class="checkout-label" for="lic-holder">Business or Client Name</label>
                    <input class="checkout-input" id="lic-holder" name="holder" placeholder="Harbour Plumbing Co" required />
                  </div>
                  <button type="submit" class="btn-hero-primary" style="width:100%;height:44px;margin-top:6px;" id="stripe-buy-btn">
                    Buy License · $${escapeHtml(priceAud)} AUD
                  </button>
                </form>

                <div id="issued-result" class="result-box">
                  <div style="font-weight:700;color:var(--petrol);">Payment Verified. Your License Key is Ready:</div>
                  <div style="margin-top:2px;color:var(--ink-secondary);font-size:12px;">Active for <span class="mono" id="res-domain"></span></div>
                  <pre class="key-pre" id="res-key"></pre>
                  <button type="button" class="btn-tpl-primary" style="width:100%;height:36px;font-size:12.5px;" id="copy-key-btn">Copy Key</button>
                </div>
              </div>
            </div>
          </article>

          <!-- Tier 3: Web Designers & Agencies -->
          <article class="offer-card reveal" style="transition-delay:160ms;">
            <div>
              <span class="offer-pill">For Web Agencies</span>
              <h3 class="offer-title">Client Website Rollouts</h3>
              <div class="offer-price-row">
                <span class="offer-price" style="font-size:34px;">Per Site</span>
                <span class="offer-price-note">1 license per client domain</span>
              </div>
              <p style="font-size:14px;color:var(--ink-secondary);margin:0 0 18px;">
                Build custom pop-out forms into client websites and hand them a clean mobile Owner Portal without a monthly bill.
              </p>
              <ul class="offer-features">
                <li><span>✓</span><span>Demo live on client staging sites for free</span></li>
                <li><span>✓</span><span>Purchase a single-domain key on launch day</span></li>
                <li><span>✓</span><span>Give clients their own 6-digit PIN Owner Portal</span></li>
              </ul>
            </div>
            <button type="button" class="btn-tpl-secondary" style="width:100%;height:44px;" data-scroll-checkout="client">
              License a Client Site
            </button>
          </article>
        </div>
      </div>
    </section>

    <!-- 8. COMMON QUESTIONS -->
    <section class="section-block" id="faq">
      <div class="container">
        <div class="section-header reveal">
          <span class="section-eyebrow">Common Questions</span>
          <h2 class="section-h2">Straightforward answers</h2>
        </div>

        <div class="faq-grid">
          <div class="faq-card reveal">
            <h3>Are there really no monthly subscription fees?</h3>
            <p>
              None at all. You pay $${escapeHtml(priceAud)} AUD once for your website domain and own your form system and Owner Portal outright, with unlimited forms and enquiries.
            </p>
          </div>
          <div class="faq-card reveal" style="transition-delay:70ms;">
            <h3>Can I customize every field and colour?</h3>
            <p>
              Yes. The examples above are just starting points. You can add or remove any question, change dropdown choices, enable photo uploads, and match your exact brand colours.
            </p>
          </div>
          <div class="faq-card reveal">
            <h3>How does the single-website license work?</h3>
            <p>
              Each license key is registered to one website domain (for example, yourbusiness.com.au). You can create as many forms as you want across that website.
            </p>
          </div>
          <div class="faq-card reveal" style="transition-delay:70ms;">
            <h3>Does it work with my existing website platform?</h3>
            <p>
              Yes. AskForms works with WordPress, Webflow, Squarespace, Shopify, Wix, and custom websites. Any existing quote or contact button can trigger the slide-over drawer.
            </p>
          </div>
        </div>
      </div>
    </section>
  </main>

  <footer class="site-footer">
    <div class="container footer-inner">
      <div>
        <strong style="color:var(--petrol);">AskForms</strong> · Pop-Out Website Forms You Own Outright · © 2026 AskForms
      </div>
      <div class="footer-links">
        <a href="#examples">Examples</a>
        <a href="#owner-portal">Owner Portal</a>
        <a href="#how-it-works">How It Works</a>
        <a href="#pricing">Pricing</a>
        <a href="/app">Partner Studio</a>
      </div>
    </div>
  </footer>

  <script src="/widget.js" data-form="template-quote" data-mode="drawer" data-label="Try Live Form" data-title="Fast Quote Request" data-accent="#14383e" defer></script>
  <script>
    // 0. Scroll-Reveal Observer
    const revealEls = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              io.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12 }
      );
      revealEls.forEach((el) => io.observe(el));
    } else {
      revealEls.forEach((el) => el.classList.add('is-visible'));
    }

    // 1. Scroll & Focus Checkout Box ("Buy License" / "License a Client Site")
    document.addEventListener('click', (e) => {
      const scrollBtn = e.target.closest('[data-scroll-checkout]');
      if (scrollBtn) {
        e.preventDefault();
        const mode = scrollBtn.getAttribute('data-scroll-checkout');
        const card = document.getElementById('checkout-card');
        const box = document.getElementById('checkout-box-inner');
        const domainInput = document.getElementById('lic-domain');
        const holderInput = document.getElementById('lic-holder');
        if (mode === 'client' && domainInput && holderInput) {
          domainInput.placeholder = 'clientwebsite.com.au';
          holderInput.placeholder = 'Client Business Name';
        }
        card?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (box) {
          box.classList.remove('pulse-highlight');
          void box.offsetWidth;
          box.classList.add('pulse-highlight');
        }
        setTimeout(() => domainInput?.focus(), 420);
        return;
      }

      const btn = e.target.closest('[data-launch-template]');
      if (!btn) return;
      const formId = btn.getAttribute('data-launch-template');
      const mode = btn.getAttribute('data-launch-mode') || 'drawer';
      const title = btn.getAttribute('data-launch-title') || 'Live Enquiry';
      window.AskForms?.open({ formId, mode, title });
    });

    // 2. Hero Interactive Industry Switcher with Smooth Cross-Fade
    const HERO_SCENES = {
      quote: {
        eyebrow: 'Slide-Over Drawer · Trades & Services',
        title: 'Fast Quote Request',
        copy: 'Slides out smoothly over your page when a visitor clicks your quote button, keeping them on your website from start to finish.',
        fields: [
          ['What do you need a quote for?', 'Emergency Repair ▾'],
          ['Suburb or Postcode', 'Surry Hills 2010'],
          ['Mobile Number', '0412 345 678'],
        ],
        formId: 'template-quote',
      },
      appointment: {
        eyebrow: 'Slide-Over Drawer · Health & Clinics',
        title: 'Appointment Booking',
        copy: 'Lets patients or clients choose a consultation type and preferred day and time window in seconds.',
        fields: [
          ['Consultation Type', 'Initial Assessment (45 mins) ▾'],
          ['Preferred Day & Time', 'Monday or Tuesday · Morning ▾'],
          ['Client Name & Mobile', 'Sarah Jenkins · 0400 123 456'],
        ],
        formId: 'template-appointment',
      },
      booking: {
        eyebrow: 'Slide-Over Drawer · Hospitality & Venues',
        title: 'Table & Event Booking',
        copy: 'Captures group table reservations, private dining enquiries, guest counts, and dietary requirements.',
        fields: [
          ['Booking Type', 'Group Table (6 to 14 Guests) ▾'],
          ['Guests & Preferred Date', '12 guests · Friday 7:00 PM'],
          ['Dietary or Occasion Notes', 'Birthday dinner, 2 GF guests'],
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
        const card = document.getElementById('hero-scene-card');
        if (card) {
          card.classList.remove('swap-anim');
          void card.offsetWidth;
          card.classList.add('swap-anim');
        }
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

    // 3. 100% Authentic Split-Pane Owner Portal Preview
    const STORAGE_KEY = 'askforms_owner_portal_preview_v2';
    const DEFAULT_ENQUIRIES = [
      {
        id: 'enq_1042',
        form_name: 'Fast Quote Request',
        sender_name: 'Tom Callahan',
        sender_email: 'tom@callahanbuild.com.au',
        phone: '0418 294 110',
        status: 'new',
        time_rel: '12m',
        time_full: 'Today, 2:15 pm',
        message: 'Hot water system leaking in ground floor laundry, need a quote for replacement.',
        fields: {
          'Service Needed': 'Emergency Repair',
          'Suburb or Postcode': 'Surry Hills 2010',
          'Urgency': 'Urgent (Today or Tomorrow)',
          'Mobile Number': '0418 294 110',
        },
        notes: 'Called Tom, sending technician tomorrow at 8:30am.',
        isUserTest: false,
      },
      {
        id: 'enq_1041',
        form_name: 'Appointment Booking',
        sender_name: 'Sarah Jenkins',
        sender_email: 'sarah.j@example.com.au',
        phone: '0402 881 334',
        status: 'new',
        time_rel: '1h',
        time_full: 'Today, 1:05 pm',
        message: 'Lower back stiffness after running, referred by Dr. Patel.',
        fields: {
          'Consultation Type': 'Initial Assessment (45 mins)',
          'Client Status': 'New Client',
          'Preferred Day': 'Wednesday or Thursday',
          'Preferred Time': 'Morning (8am to 11am)',
        },
        notes: '',
        isUserTest: false,
      },
      {
        id: 'enq_1039',
        form_name: 'Table & Event Booking',
        sender_name: 'Chloe Vance',
        sender_email: 'chloe@vancecreative.com.au',
        phone: '0433 222 111',
        status: 'replied',
        time_rel: '1d',
        time_full: 'Yesterday, 4:40 pm',
        message: 'End-of-year team dinner, 2 vegetarian and 1 gluten-free guest.',
        fields: {
          'Booking Type': 'Private Dining Room (15 to 60 Guests)',
          'Number of Guests': '22 guests',
          'Preferred Date': 'Friday 24 Nov, 7:00 PM',
          'Mobile Number': '0433 222 111',
        },
        notes: 'Sent private dining menu and deposit invoice.',
        isUserTest: false,
      },
    ];

    const opState = {
      filter: 'new',
      q: '',
      selectedId: 'enq_1042',
    };

    function esc(v) {
      return String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function initials(name) {
      const parts = String(name || 'W').trim().split(/\\s+/);
      return ((parts[0]?.[0] || '') + (parts[1]?.[0] || parts[0]?.[1] || '')).toUpperCase() || 'W';
    }

    function loadEnquiries() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
      return DEFAULT_ENQUIRIES;
    }

    function saveEnquiries(list) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      } catch {}
    }

    function renderOwnerPortal() {
      const all = loadEnquiries();
      const counts = { new: 0, replied: 0, closed: 0, all: all.length };
      all.forEach((item) => {
        if (counts[item.status] !== undefined) counts[item.status]++;
      });
      document.getElementById('op-cnt-new').textContent = counts.new;
      document.getElementById('op-cnt-replied').textContent = counts.replied;
      document.getElementById('op-cnt-closed').textContent = counts.closed;
      document.getElementById('op-cnt-all').textContent = counts.all;

      const q = opState.q.trim().toLowerCase();
      const filtered = all.filter((item) => {
        if (opState.filter !== 'all' && item.status !== opState.filter) return false;
        if (!q) return true;
        return (
          item.sender_name.toLowerCase().includes(q) ||
          item.sender_email.toLowerCase().includes(q) ||
          item.form_name.toLowerCase().includes(q) ||
          (item.message || '').toLowerCase().includes(q)
        );
      });

      if (filtered.length > 0 && !filtered.some((i) => i.id === opState.selectedId)) {
        opState.selectedId = filtered[0].id;
      } else if (filtered.length === 0) {
        opState.selectedId = null;
      }

      const railEl = document.getElementById('op-rail-list');
      if (filtered.length === 0) {
        railEl.innerHTML = '<div style="padding:36px 20px;text-align:center;color:var(--muted);font-size:13.5px;">No enquiries in this tab.</div>';
      } else {
        railEl.innerHTML = filtered
          .map((item) => {
            const isSelected = item.id === opState.selectedId;
            const isNew = item.status === 'new';
            return (
              '<button type="button" class="op-row ' + (isSelected ? 'selected' : '') + '" data-op-select="' + esc(item.id) + '">' +
                '<div class="op-avatar">' + esc(initials(item.sender_name)) + '</div>' +
                '<div class="op-row-main">' +
                  '<div class="op-row-top">' +
                    '<span class="op-row-name">' +
                      (isNew ? '<span class="op-unread-dot"></span>' : '') +
                      esc(item.sender_name) +
                    '</span>' +
                    '<span class="op-row-time">' + esc(item.time_rel) + '</span>' +
                  '</div>' +
                  '<div class="op-row-form">' +
                    esc(item.form_name) +
                    (item.isUserTest ? ' · <strong style="color:var(--petrol);">Your Test</strong>' : '') +
                  '</div>' +
                  '<div class="op-row-snippet">' + esc(item.message || 'Submitted enquiry') + '</div>' +
                '</div>' +
              '</button>'
            );
          })
          .join('');
      }

      const activeItem = filtered.find((i) => i.id === opState.selectedId) || null;
      const detailEl = document.getElementById('op-detail-pane');
      if (!activeItem) {
        detailEl.innerHTML = '<div style="height:100%;display:grid;place-items:center;color:var(--muted);font-size:14px;">Select an enquiry from the left list to view details.</div>';
        return;
      }

      const fieldCells = Object.entries(activeItem.fields || {})
        .map(
          ([k, v]) =>
            '<div><div class="op-f-label">' + esc(k) + '</div><div class="op-f-val">' + esc(v) + '</div></div>'
        )
        .join('');

      detailEl.innerHTML =
        '<article class="op-sheet swap-anim">' +
          '<div class="op-sheet-head">' +
            '<div>' +
              '<h3 class="op-sheet-name">' + esc(activeItem.sender_name) + '</h3>' +
              '<div class="op-sheet-sub">' +
                '<span class="op-tag ' + (activeItem.status === 'new' ? 'op-tag-new' : activeItem.status === 'replied' ? 'op-tag-replied' : '') + '">' + esc(activeItem.status) + '</span>' +
                (activeItem.isUserTest ? '<span class="op-tag op-tag-new">Your Live Test</span>' : '') +
                '<span>' + esc(activeItem.form_name) + '</span>' +
                '<span>·</span>' +
                '<span>' + esc(activeItem.time_full) + '</span>' +
              '</div>' +
            '</div>' +
            '<div class="op-seg">' +
              '<button type="button" class="op-seg-btn ' + (activeItem.status === 'new' ? 'active' : '') + '" data-op-status="' + esc(activeItem.id) + '" data-val="new">New</button>' +
              '<button type="button" class="op-seg-btn ' + (activeItem.status === 'replied' ? 'active' : '') + '" data-op-status="' + esc(activeItem.id) + '" data-val="replied">Replied</button>' +
              '<button type="button" class="op-seg-btn ' + (activeItem.status === 'closed' ? 'active' : '') + '" data-op-status="' + esc(activeItem.id) + '" data-val="closed">Closed</button>' +
            '</div>' +
          '</div>' +
          '<div class="op-action-bar">' +
            '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
              (activeItem.phone ? '<a class="op-btn op-btn-primary" href="tel:' + esc(activeItem.phone.replace(/[^0-9+]/g, '')) + '">Call ' + esc(activeItem.phone) + '</a>' : '') +
              '<a class="op-btn ' + (activeItem.phone ? '' : 'op-btn-primary') + '" href="mailto:' + esc(activeItem.sender_email) + '?subject=' + encodeURIComponent('Re: ' + activeItem.form_name) + '">Reply by Email</a>' +
            '</div>' +
            '<span class="mono" style="font-size:11.5px;color:var(--faint);">' + esc(activeItem.sender_email) + '</span>' +
          '</div>' +
          '<div class="op-sheet-body">' +
            (activeItem.message ? '<p class="op-msg">' + esc(activeItem.message) + '</p>' : '') +
            (fieldCells ? '<div class="op-fields-grid">' + fieldCells + '</div>' : '') +
            '<div class="op-notes-wrap">' +
              '<div style="display:flex;align-items:center;justify-content:space-between;">' +
                '<span class="op-f-label" style="margin:0;">Internal Team Notes</span>' +
                '<button type="button" class="op-btn" style="height:28px;padding:0 12px;font-size:12px;" data-op-save-note="' + esc(activeItem.id) + '">Save Note</button>' +
              '</div>' +
              '<textarea id="op-note-box" class="op-notes-textarea" placeholder="Add follow-up notes, quote price, or callback time...">' + esc(activeItem.notes || '') + '</textarea>' +
            '</div>' +
          '</div>' +
        '</article>';
    }

    document.querySelectorAll('[data-op-filter]').forEach((tab) => {
      tab.addEventListener('click', () => {
        opState.filter = tab.getAttribute('data-op-filter');
        document.querySelectorAll('[data-op-filter]').forEach((b) => b.classList.toggle('active', b === tab));
        renderOwnerPortal();
      });
    });

    document.getElementById('op-search-input')?.addEventListener('input', (e) => {
      opState.q = e.target.value || '';
      renderOwnerPortal();
    });

    document.getElementById('op-rail-list')?.addEventListener('click', (e) => {
      const row = e.target.closest('[data-op-select]');
      if (!row) return;
      opState.selectedId = row.getAttribute('data-op-select');
      renderOwnerPortal();
    });

    document.getElementById('op-detail-pane')?.addEventListener('click', (e) => {
      const stBtn = e.target.closest('[data-op-status]');
      if (stBtn) {
        const id = stBtn.getAttribute('data-op-status');
        const nextVal = stBtn.getAttribute('data-val');
        const list = loadEnquiries().map((item) => (item.id === id ? { ...item, status: nextVal } : item));
        saveEnquiries(list);
        renderOwnerPortal();
        return;
      }

      const noteBtn = e.target.closest('[data-op-save-note]');
      if (noteBtn) {
        const id = noteBtn.getAttribute('data-op-save-note');
        const val = document.getElementById('op-note-box')?.value || '';
        const list = loadEnquiries().map((item) => (item.id === id ? { ...item, notes: val } : item));
        saveEnquiries(list);
        noteBtn.textContent = 'Saved';
        setTimeout(() => {
          noteBtn.textContent = 'Save Note';
        }, 1200);
      }
    });

    document.getElementById('op-reset-btn')?.addEventListener('click', () => {
      saveEnquiries(DEFAULT_ENQUIRIES);
      opState.filter = 'new';
      opState.q = '';
      opState.selectedId = 'enq_1042';
      const sInput = document.getElementById('op-search-input');
      if (sInput) sInput.value = '';
      document.querySelectorAll('[data-op-filter]').forEach((b) => b.classList.toggle('active', b.getAttribute('data-op-filter') === 'new'));
      renderOwnerPortal();
    });

    // Listen for live test submissions from any pop-out example form
    window.addEventListener('message', (e) => {
      if (!e.data || typeof e.data !== 'object') return;
      if (e.data.type === 'askforms:submitted') {
        const f = e.data.fields || {};
        const name = f.name || 'Website Visitor';
        const email = f.email || 'visitor@example.com.au';
        const phone = f.phone || '';
        const message = f.message || f.details || f.description || f.project_summary || f.dietary_notes || f.notes || 'Submitted live test enquiry.';
        const formattedFields = {};
        Object.entries(f).forEach(([k, v]) => {
          if (!['name', 'email', 'message', 'details', 'description', 'project_summary'].includes(k) && v) {
            const label = k.replace(/_/g, ' ').replace(/\\b\\w/g, (c) => c.toUpperCase());
            formattedFields[label] = v;
          }
        });

        const newId = e.data.submissionId || ('enq_' + Date.now().toString().slice(-4));
        const list = loadEnquiries();
        list.unshift({
          id: newId,
          form_name: e.data.formName || 'Website Enquiry',
          sender_name: name,
          sender_email: email,
          phone,
          status: 'new',
          time_rel: 'Just now',
          time_full: 'Just now',
          message,
          fields: formattedFields,
          notes: '',
          isUserTest: true,
        });
        saveEnquiries(list);
        opState.filter = 'new';
        opState.selectedId = newId;
        document.querySelectorAll('[data-op-filter]').forEach((b) => b.classList.toggle('active', b.getAttribute('data-op-filter') === 'new'));
        renderOwnerPortal();
      } else if (e.data.type === 'askforms:open-portal-preview') {
        window.AskForms?.close();
        document.getElementById('owner-portal')?.scrollIntoView({ behavior: 'smooth' });
      }
    });

    renderOwnerPortal();

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
      stripeBtn.textContent = 'Opening Stripe...';
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
        stripeBtn.textContent = 'Buy License · $${escapeHtml(priceAud)} AUD';
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
