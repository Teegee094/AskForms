function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderManifestJson(workspace = {}) {
  const brand = workspace.brand_name || 'AskForms';
  return JSON.stringify(
    {
      name: `${brand} — Enquiries`,
      short_name: brand.slice(0, 12),
      start_url: '/manage',
      display: 'standalone',
      background_color: workspace.bg_color || '#f7fafc',
      theme_color: workspace.accent_color || '#14383e',
      icons: [
        { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' },
        { src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      ],
    },
    null,
    2
  );
}

export function renderManagePortalPage(workspace = {}) {
  const brand = workspace.brand_name || 'AskForms';
  const accent = workspace.accent_color || '#14383e';
  const accentText = workspace.accent_text_color || '#ffffff';
  const bg = workspace.bg_color || '#f7fafc';
  const surface = workspace.surface_color || '#ffffff';
  const logoHtml = workspace.logo_url
    ? `<img src="${escapeHtml(workspace.logo_url)}" alt="${escapeHtml(brand)}" style="max-height:26px;max-width:144px;object-fit:contain;display:block;" />`
    : `<span class="brand-svg" aria-hidden="true"><svg width="28" height="26" viewBox="0 0 256 240" fill="none"><rect x="0" y="0" width="252" height="32" rx="16" fill="currentColor"/><rect x="0" y="56" width="252" height="32" rx="16" fill="currentColor"/><path d="M16 112H236A16 16 0 0 1 236 144H229.1L204.8 124.8A27 27 0 0 0 161.1 144H16A16 16 0 0 1 16 112Z" fill="currentColor"/><rect x="0" y="168" width="154" height="32" rx="16" fill="currentColor"/><path d="M188 146L236 184L188 222" stroke="currentColor" stroke-width="30" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span class="brand-word">${escapeHtml(brand)}</span>`;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <meta name="theme-color" content="${escapeHtml(accent)}" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-title" content="${escapeHtml(brand)}" />
  <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=2" />
  <link rel="alternate icon" href="/favicon.ico?v=2" />
  <link rel="apple-touch-icon" href="/apple-touch-icon.png?v=2" />
  <link rel="manifest" href="/manifest.json" />
  <title>${escapeHtml(brand)} — Enquiries</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
  <style>
    :root {
      --bg: ${escapeHtml(bg)};
      --surface: ${escapeHtml(surface)};
      --subtle: #f1f5f9;
      --border: #e2e8f0;
      --border-soft: #edf2f7;
      --ink: #14383e;
      --ink-soft: #4a5568;
      --muted: #718096;
      --faint: #a0aec0;
      --accent: ${escapeHtml(accent)};
      --accent-text: ${escapeHtml(accentText)};
      --mint: #4fd1c5;
      --accent-soft: #e6fffa;
      --amber: #f6ad55;
      --success: #22543d;
      --success-soft: #e6fffa;
      --shadow-card: 0 1px 3px rgba(20, 56, 62, 0.04), 0 1px 2px rgba(20, 56, 62, 0.02);
    }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      height: 100%;
      background: var(--bg);
      color: var(--ink);
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 15px;
      line-height: 1.55;
      -webkit-font-smoothing: antialiased;
    }
    html, body, .rail-list, .detail-pane {
      scrollbar-width: none;
      -ms-overflow-style: none;
    }
    html::-webkit-scrollbar,
    body::-webkit-scrollbar,
    .rail-list::-webkit-scrollbar,
    .detail-pane::-webkit-scrollbar {
      display: none;
    }
    @keyframes sheetEnter {
      from { opacity: 0; transform: translateY(5px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .hidden { display: none !important; }
    button, input, textarea { font: inherit; color: inherit; }

    /* ============================================================
       PIN LOCK SCREEN (6 Tactile Digit Boxes)
       ============================================================ */
    .pin-screen {
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 24px;
      background: var(--bg);
    }
    .pin-card {
      width: 100%;
      max-width: 390px;
      background: var(--surface);
      border: 1px solid var(--border-soft);
      border-radius: 14px;
      padding: 36px 30px;
      box-shadow: var(--shadow-card);
      text-align: center;
    }
    .pin-brand {
      display: inline-flex;
      align-items: center;
      gap: 9px;
      margin-bottom: 18px;
    }
    .pin-title {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 22px;
      font-weight: 700;
      letter-spacing: -0.025em;
      margin: 0 0 6px;
    }
    .pin-sub {
      font-size: 13.5px;
      color: var(--muted);
      margin: 0 0 24px;
    }
    .pin-boxes {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 8px;
      margin-bottom: 14px;
    }
    .pin-digit {
      width: 100%;
      height: 50px;
      text-align: center;
      font-family: 'JetBrains Mono', monospace;
      font-size: 20px;
      font-weight: 600;
      border-radius: 8px;
      border: 1px solid var(--border);
      background: var(--subtle);
      color: var(--ink);
      outline: none;
      transition: border-color 0.14s ease, background 0.14s ease;
    }
    .pin-digit:focus {
      background: var(--surface);
      border-color: var(--accent);
      box-shadow: 0 0 0 3px rgba(9, 92, 79, 0.12);
    }
    .pin-error {
      color: #b42318;
      font-size: 13px;
      min-height: 20px;
      margin-bottom: 10px;
    }

    /* ============================================================
       FULL-WIDTH WHITE TOP BAR (Formspree Structure)
       ============================================================ */
    .portal-shell {
      display: flex;
      flex-direction: column;
      height: 100vh;
    }
    .top-header {
      height: 74px;
      flex-shrink: 0;
      background: var(--surface);
      border-bottom: 1px solid var(--border-soft);
      padding: 0 clamp(16px, 2.5vw, 32px);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
    }
    .brand-svg {
      color: var(--accent);
      display: inline-flex;
      align-items: center;
      flex-shrink: 0;
    }
    .brand-word {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 19px;
      font-weight: 700;
      letter-spacing: -0.03em;
    }
    .header-divider {
      width: 1px;
      height: 20px;
      background: var(--border);
      margin: 0 4px;
    }
    .header-context {
      font-size: 13px;
      font-weight: 600;
      color: var(--muted);
    }
    .header-tabs {
      display: flex;
      align-items: center;
      gap: 4px;
      height: 100%;
    }
    .tab-link {
      position: relative;
      height: 74px;
      padding: 0 14px;
      border: 0;
      background: transparent;
      color: var(--muted);
      font-size: 14.5px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 7px;
    }
    .tab-link:hover { color: var(--ink); }
    .tab-link.active { color: var(--accent); }
    .tab-link.active::after {
      content: '';
      position: absolute;
      left: 12px;
      right: 12px;
      bottom: 0;
      height: 2.5px;
      border-radius: 2px 2px 0 0;
      background: var(--mint);
    }
    .tab-badge {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      padding: 1px 6px;
      border-radius: 999px;
      background: var(--subtle);
      color: var(--muted);
    }
    .tab-link.active .tab-badge {
      background: var(--accent-soft);
      color: var(--accent);
    }
    .header-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* ============================================================
       SPLIT-PANE MASTER-DETAIL INBOX
       ============================================================ */
    .split-workspace {
      flex: 1;
      min-height: 0;
      display: grid;
      grid-template-columns: clamp(320px, 28vw, 410px) minmax(0, 1fr);
    }

    /* Left Inbox List Rail */
    .inbox-rail {
      background: var(--surface);
      border-right: 1px solid var(--border-soft);
      display: flex;
      flex-direction: column;
      min-height: 0;
      min-width: 0;
      overflow: hidden;
    }
    .rail-search-wrap {
      padding: 12px 16px;
      border-bottom: 1px solid var(--border-soft);
    }
    .rail-search {
      width: 100%;
      height: 36px;
      padding: 0 12px;
      border-radius: 8px;
      border: 1px solid transparent;
      background: var(--subtle);
      font-size: 13px;
      outline: none;
    }
    .rail-search:focus {
      background: var(--surface);
      border-color: var(--accent);
    }
    .rail-list {
      flex: 1;
      overflow-y: auto;
    }
    .rail-row {
      width: 100%;
      text-align: left;
      border: 0;
      border-bottom: 1px solid var(--border-soft);
      background: transparent;
      padding: 14px 16px;
      display: flex;
      gap: 12px;
      cursor: pointer;
      transition: background 0.1s ease;
    }
    .rail-row:hover { background: #faf9f7; }
    .rail-row.selected { background: var(--accent-soft); }
    .avatar {
      width: 34px;
      height: 34px;
      border-radius: 8px;
      background: var(--subtle);
      color: var(--ink-soft);
      font-size: 12px;
      font-weight: 700;
      display: grid;
      place-items: center;
      flex-shrink: 0;
      margin-top: 2px;
    }
    .rail-row.selected .avatar {
      background: var(--surface);
      color: var(--accent);
    }
    .rail-main { flex: 1; min-width: 0; }
    .rail-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 2px;
    }
    .rail-name {
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
    .unread-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--mint);
      flex-shrink: 0;
    }
    .rail-time {
      font-size: 11.5px;
      color: var(--faint);
      white-space: nowrap;
      flex-shrink: 0;
    }
    .rail-form {
      font-size: 12px;
      font-weight: 500;
      color: var(--muted);
      margin-bottom: 3px;
    }
    .rail-snippet {
      font-size: 12.5px;
      color: var(--ink-soft);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* Right Reading & Action Workspace */
    .detail-pane {
      overflow-y: auto;
      padding: clamp(24px, 3vw, 40px);
      min-width: 0;
      background-color: #eaf1f4;
      background-image:
        radial-gradient(ellipse 640px 360px at 92% 4%, rgba(79, 209, 197, 0.14), transparent 65%),
        radial-gradient(rgba(20, 56, 62, 0.08) 1px, transparent 1px);
      background-size: 100% 100%, 24px 24px;
    }
    .detail-sheet {
      max-width: 840px;
      margin: 0 auto;
      background: var(--surface);
      border: 1px solid var(--border-soft);
      border-radius: 18px;
      box-shadow: var(--shadow-card);
      overflow: hidden;
      animation: sheetEnter 0.18s cubic-bezier(0.22, 1, 0.36, 1) both;
    }
    .detail-header {
      padding: 26px 32px;
      border-bottom: 1px solid var(--border-soft);
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
    }
    .detail-name {
      margin: 0;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: clamp(22px, 2vw, 28px);
      font-weight: 700;
      letter-spacing: -0.03em;
      line-height: 1.2;
    }
    .detail-sub {
      margin-top: 8px;
      font-size: 13.5px;
      color: var(--muted);
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .action-bar {
      padding: 16px 32px;
      border-bottom: 1px solid var(--border-soft);
      background: #f8fafc;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
    }
    .detail-body {
      padding: 28px 32px;
    }
    .message-block {
      font-size: 15.5px;
      line-height: 1.7;
      color: var(--ink);
      white-space: pre-wrap;
      margin: 0 0 26px;
    }
    .fields-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 14px;
      padding: 18px;
      background: var(--subtle);
      border-radius: 8px;
      margin-bottom: 22px;
    }
    .f-label {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--faint);
      margin-bottom: 3px;
    }
    .f-val {
      font-size: 13.5px;
      font-weight: 500;
      color: var(--ink);
      word-break: break-word;
    }
    .photo-grid {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      margin-bottom: 22px;
    }
    .photo-thumb {
      display: block;
      width: 104px;
      height: 104px;
      border-radius: 8px;
      object-fit: cover;
      border: 1px solid var(--border);
    }
    .notes-section {
      border-top: 1px solid var(--border-soft);
      padding-top: 18px;
    }
    .notes-box {
      width: 100%;
      min-height: 76px;
      padding: 10px 12px;
      border-radius: 8px;
      border: 1px solid transparent;
      background: var(--subtle);
      resize: vertical;
      outline: none;
      margin-top: 8px;
    }
    .notes-box:focus {
      background: var(--surface);
      border-color: var(--accent);
    }

    /* Controls */
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 7px;
      height: 42px;
      padding: 0 20px;
      border-radius: 999px;
      border: 1px solid transparent;
      font-size: 13.5px;
      font-weight: 600;
      text-decoration: none;
      cursor: pointer;
    }
    .btn-primary { background: var(--accent); color: var(--accent-text); }
    .btn-primary:hover { opacity: 0.92; }
    .btn-secondary { background: var(--surface); color: var(--ink); border-color: var(--border); box-shadow: var(--shadow-card); }
    .btn-secondary:hover { background: var(--subtle); }
    .seg-control {
      display: inline-flex;
      background: var(--subtle);
      border-radius: 999px;
      padding: 4px;
      gap: 3px;
    }
    .seg-btn {
      border: 0;
      background: transparent;
      color: var(--muted);
      padding: 6px 14px;
      border-radius: 999px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
    }
    .seg-btn.active {
      background: var(--surface);
      color: var(--ink);
      box-shadow: var(--shadow-card);
    }
    .tag {
      display: inline-flex;
      padding: 2px 8px;
      border-radius: 5px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      background: var(--subtle);
      color: var(--ink-soft);
    }
    .tag-new { background: var(--accent-soft); color: var(--accent); }
    .tag-replied { background: var(--success-soft); color: var(--success); }
    .empty-pane {
      height: 100%;
      display: grid;
      place-items: center;
      text-align: center;
      color: var(--muted);
      padding: 36px;
    }
    .mobile-back { display: none; margin-bottom: 14px; }

    /* Mobile & Mid-Width Responsive */
    @media (max-width: 1120px) {
      .split-workspace { grid-template-columns: 310px minmax(0, 1fr); }
      .detail-pane { padding: 20px 22px 40px; }
      .fields-grid { grid-template-columns: 1fr; }
    }
    @media (max-width: 860px) {
      .top-header {
        height: auto;
        padding: 12px 16px 0;
        flex-wrap: wrap;
        row-gap: 4px;
      }
      .header-left { order: 1; }
      .header-right { order: 2; }
      .header-tabs {
        order: 3;
        width: 100%;
        height: 44px;
        justify-content: space-between;
        border-top: 1px solid var(--border-soft);
        margin-top: 8px;
      }
      .tab-link { height: 44px; padding: 0 6px; font-size: 13px; }
      .tab-link.active::after { left: 4px; right: 4px; }
      .header-divider, .header-context { display: none; }
      .split-workspace { grid-template-columns: minmax(0, 1fr); }
      .inbox-rail { border-right: 0; width: 100%; }
      .portal-shell.mobile-detail .inbox-rail { display: none; }
      .portal-shell:not(.mobile-detail) .detail-pane { display: none; }
      .detail-pane { padding: 16px; }
      .detail-header, .action-bar, .detail-body { padding-left: 18px; padding-right: 18px; }
      .fields-grid { grid-template-columns: 1fr; }
      .mobile-back { display: inline-flex; }
    }
  </style>
</head>
<body>
  <section id="pin-view" class="pin-screen hidden">
    <form id="pin-form" class="pin-card">
      <div class="pin-brand">${logoHtml}</div>
      <h1 class="pin-title">Owner Portal</h1>
      <p class="pin-sub">Enter your 6-digit PIN to access website enquiries.</p>
      <div class="pin-boxes" id="pin-boxes">
        <input class="pin-digit" type="password" inputmode="numeric" maxlength="1" autocomplete="off" />
        <input class="pin-digit" type="password" inputmode="numeric" maxlength="1" autocomplete="off" />
        <input class="pin-digit" type="password" inputmode="numeric" maxlength="1" autocomplete="off" />
        <input class="pin-digit" type="password" inputmode="numeric" maxlength="1" autocomplete="off" />
        <input class="pin-digit" type="password" inputmode="numeric" maxlength="1" autocomplete="off" />
        <input class="pin-digit" type="password" inputmode="numeric" maxlength="1" autocomplete="off" />
      </div>
      <div id="pin-error" class="pin-error"></div>
      <button type="submit" class="btn btn-primary" style="width:100%;height:40px;">Unlock Enquiries</button>
    </form>
  </section>

  <section id="portal-view" class="portal-shell hidden">
    <header class="top-header">
      <div class="header-left">
        ${logoHtml}
        <span class="header-divider"></span>
        <span class="header-context">Enquiries</span>
      </div>

      <nav class="header-tabs" role="tablist">
        <button class="tab-link active" data-filter="new">New <span class="tab-badge" id="cnt-new">0</span></button>
        <button class="tab-link" data-filter="replied">Replied <span class="tab-badge" id="cnt-replied">0</span></button>
        <button class="tab-link" data-filter="closed">Closed <span class="tab-badge" id="cnt-closed">0</span></button>
        <button class="tab-link" data-filter="inbox">All <span class="tab-badge" id="cnt-all">0</span></button>
      </nav>

      <div class="header-right">
        <button type="button" id="refresh-btn" class="btn btn-secondary">Refresh</button>
        <button type="button" id="lock-btn" class="btn btn-secondary hidden">Lock</button>
      </div>
    </header>

    <div class="split-workspace">
      <aside class="inbox-rail">
        <div class="rail-search-wrap">
          <input id="search-input" class="rail-search" type="search" placeholder="Search name, email, or message..." />
        </div>
        <div id="rail-list" class="rail-list"></div>
      </aside>

      <main class="detail-pane" id="detail-pane"></main>
    </div>
  </section>

  <script>
    const state = {
      filter: 'new',
      q: '',
      allEnquiries: [],
      selectedId: null,
      pinEnabled: false,
    };

    function esc(v) {
      return String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    function initials(name) {
      const parts = String(name || 'W').trim().split(/\\s+/);
      return ((parts[0]?.[0] || '') + (parts[1]?.[0] || parts[0]?.[1] || '')).toUpperCase() || 'W';
    }

    function parseIso(iso) {
      if (!iso) return new Date();
      const norm = /^\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}/.test(iso) ? iso.replace(' ', 'T') + 'Z' : iso;
      return new Date(norm);
    }

    function relTime(iso) {
      const sec = Math.max(0, Math.round((Date.now() - parseIso(iso).getTime()) / 1000));
      if (sec < 60) return 'Just now';
      const min = Math.round(sec / 60);
      if (min < 60) return min + 'm';
      const hr = Math.round(min / 60);
      if (hr < 24) return hr + 'h';
      return Math.round(hr / 24) + 'd';
    }

    function fullTime(iso) {
      return parseIso(iso).toLocaleString('en-AU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    }

    function getFiltered() {
      const q = state.q.trim().toLowerCase();
      return state.allEnquiries.filter((item) => {
        if (state.filter !== 'inbox' && (item.status || 'new') !== state.filter) return false;
        if (!q) return true;
        return (
          JSON.stringify(item.data || {}).toLowerCase().includes(q) ||
          (item.sender_name || '').toLowerCase().includes(q) ||
          (item.sender_email || '').toLowerCase().includes(q) ||
          (item.form_name || '').toLowerCase().includes(q)
        );
      });
    }

    async function loadAll() {
      const res = await fetch('/api/manage/enquiries?filter=inbox');
      if (res.status === 401) {
        showPin();
        return;
      }
      const data = await res.json();
      state.allEnquiries = data.enquiries || [];
      updateCounts();
      render();
    }

    function updateCounts() {
      const counts = { new: 0, replied: 0, closed: 0, all: state.allEnquiries.length };
      for (const e of state.allEnquiries) {
        const st = e.status || 'new';
        if (counts[st] !== undefined) counts[st]++;
      }
      document.getElementById('cnt-new').textContent = counts.new;
      document.getElementById('cnt-replied').textContent = counts.replied;
      document.getElementById('cnt-closed').textContent = counts.closed;
      document.getElementById('cnt-all').textContent = counts.all;
    }

    function render() {
      const items = getFiltered();
      if (items.length > 0 && !items.some((i) => i.id === state.selectedId)) {
        state.selectedId = items[0].id;
      } else if (items.length === 0) {
        state.selectedId = null;
      }

      const rail = document.getElementById('rail-list');
      if (items.length === 0) {
        rail.innerHTML = '<div class="empty-pane" style="height:260px;"><div><strong style="color:var(--ink);">All caught up</strong><p style="margin:6px 0 0;font-size:13px;">No enquiries in this view.</p></div></div>';
      } else {
        rail.innerHTML = items.map((e) => {
          const name = e.sender_name || e.sender_email || 'Website Visitor';
          const snippet = e.data?.message || Object.values(e.data || {}).find((v) => typeof v === 'string' && v.length > 8) || 'New form submission';
          const isNew = (e.status || 'new') === 'new';
          const selected = e.id === state.selectedId;
          return '<button type="button" class="rail-row ' + (selected ? 'selected' : '') + '" data-select="' + esc(e.id) + '">' +
            '<div class="avatar">' + esc(initials(name)) + '</div>' +
            '<div class="rail-main">' +
              '<div class="rail-top">' +
                '<span class="rail-name">' + (isNew ? '<span class="unread-dot"></span>' : '') + esc(name) + '</span>' +
                '<span class="rail-time">' + relTime(e.created_at) + '</span>' +
              '</div>' +
              '<div class="rail-form">' + esc(e.form_name) + '</div>' +
              '<div class="rail-snippet">' + esc(snippet) + '</div>' +
            '</div>' +
          '</button>';
        }).join('');
      }

      renderDetail(items.find((i) => i.id === state.selectedId) || null);
    }

    function renderDetail(item) {
      const pane = document.getElementById('detail-pane');
      if (!item) {
        pane.innerHTML = '<div class="empty-pane"><div><strong style="color:var(--ink);font-size:15px;">Select an enquiry</strong><p style="margin:6px 0 0;font-size:13px;">Choose a message from the left to view details, call, or reply.</p></div></div>';
        return;
      }

      const name = item.sender_name || item.sender_email || 'Website Visitor';
      const email = item.sender_email || item.data?.email || '';
      const phone = item.data?.phone || item.data?.Phone || item.data?.mobile || '';
      const st = item.status || 'new';
      const primaryMessage = item.data?.message || '';

      const extraFields = Object.entries(item.data || {})
        .filter(([k]) => !['name', 'message'].includes(k.toLowerCase()))
        .map(([k, v]) => '<div><div class="f-label">' + esc(k.replace(/[_-]+/g, ' ')) + '</div><div class="f-val">' + esc(Array.isArray(v) ? v.join(', ') : v) + '</div></div>')
        .join('');

      const photos = (item.attachments || [])
        .map((att) => {
          if ((att.mimeType || '').startsWith('image/')) {
            return '<a href="' + esc(att.url) + '" target="_blank" rel="noopener"><img class="photo-thumb" src="' + esc(att.url) + '" alt="' + esc(att.originalName) + '" /></a>';
          }
          return '<a class="btn btn-secondary" href="' + esc(att.url) + '" target="_blank" rel="noopener">' + esc(att.originalName) + '</a>';
        })
        .join('');

      pane.innerHTML =
        '<button type="button" class="btn btn-secondary mobile-back" id="mobile-back-btn">&larr; Back to inbox</button>' +
        '<article class="detail-sheet">' +
          '<div class="detail-header">' +
            '<div>' +
              '<h1 class="detail-name">' + esc(name) + '</h1>' +
              '<div class="detail-sub">' +
                '<span class="tag ' + (st === 'new' ? 'tag-new' : st === 'replied' ? 'tag-replied' : '') + '">' + esc(st) + '</span>' +
                '<span>' + esc(item.form_name) + '</span>' +
                '<span>·</span>' +
                '<span>' + fullTime(item.created_at) + '</span>' +
              '</div>' +
            '</div>' +
            '<div class="seg-control">' +
              '<button type="button" class="seg-btn ' + (st === 'new' ? 'active' : '') + '" data-status="' + esc(item.id) + '" data-val="new">New</button>' +
              '<button type="button" class="seg-btn ' + (st === 'replied' ? 'active' : '') + '" data-status="' + esc(item.id) + '" data-val="replied">Replied</button>' +
              '<button type="button" class="seg-btn ' + (st === 'closed' ? 'active' : '') + '" data-status="' + esc(item.id) + '" data-val="closed">Closed</button>' +
            '</div>' +
          '</div>' +

          '<div class="action-bar">' +
            '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
              (phone ? '<a class="btn btn-primary" href="tel:' + esc(String(phone).replace(/[^0-9+]/g, '')) + '">Call ' + esc(phone) + '</a>' : '') +
              (email ? '<a class="btn ' + (phone ? 'btn-secondary' : 'btn-primary') + '" href="mailto:' + esc(email) + '?subject=' + encodeURIComponent('Re: ' + (item.form_name || 'Your enquiry')) + '">Reply to ' + esc(email) + '</a>' : '') +
            '</div>' +
            '<span style="font-family:JetBrains Mono,monospace;font-size:11.5px;color:var(--faint);">' + esc(item.id) + '</span>' +
          '</div>' +

          '<div class="detail-body">' +
            (primaryMessage ? '<p class="message-block">' + esc(primaryMessage) + '</p>' : '') +
            (extraFields ? '<div class="fields-grid">' + extraFields + '</div>' : '') +
            (photos ? '<div class="f-label" style="margin-bottom:8px;">Uploaded photos & files</div><div class="photo-grid">' + photos + '</div>' : '') +
            '<div class="notes-section">' +
              '<div style="display:flex;align-items:center;justify-content:space-between;">' +
                '<span class="f-label" style="margin:0;">Internal team notes</span>' +
                '<button type="button" class="btn btn-secondary" style="height:28px;padding:0 11px;font-size:12px;" data-save-note="' + esc(item.id) + '">Save note</button>' +
              '</div>' +
              '<textarea id="detail-notes" class="notes-box" placeholder="Add follow-up notes, quote price, or callback time...">' + esc(item.notes || '') + '</textarea>' +
            '</div>' +
          '</div>' +
        '</article>';
    }

    function showPin() {
      document.getElementById('pin-view').classList.remove('hidden');
      document.getElementById('portal-view').classList.add('hidden');
      document.querySelector('.pin-digit')?.focus();
    }

    function showPortal() {
      document.getElementById('pin-view').classList.add('hidden');
      document.getElementById('portal-view').classList.remove('hidden');
      document.getElementById('lock-btn').classList.toggle('hidden', !state.pinEnabled);
    }

    // 6-digit PIN box auto-advance & paste
    const pinInputs = Array.from(document.querySelectorAll('.pin-digit'));
    pinInputs.forEach((inp, idx) => {
      inp.addEventListener('input', () => {
        inp.value = inp.value.replace(/[^0-9]/g, '').slice(-1);
        if (inp.value && idx < 5) pinInputs[idx + 1].focus();
        const code = pinInputs.map((i) => i.value).join('');
        if (code.length === 6) document.getElementById('pin-form').requestSubmit();
      });
      inp.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !inp.value && idx > 0) pinInputs[idx - 1].focus();
      });
      inp.addEventListener('paste', (e) => {
        const text = (e.clipboardData?.getData('text') || '').replace(/[^0-9]/g, '').slice(0, 6);
        if (text.length > 0) {
          e.preventDefault();
          text.split('').forEach((ch, i) => { if (pinInputs[i]) pinInputs[i].value = ch; });
          if (text.length === 6) document.getElementById('pin-form').requestSubmit();
        }
      });
    });

    document.getElementById('pin-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const pin = pinInputs.map((i) => i.value).join('');
      const errEl = document.getElementById('pin-error');
      errEl.textContent = '';
      const res = await fetch('/api/manage/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      if (res.ok) {
        pinInputs.forEach((i) => { i.value = ''; });
        showPortal();
        await loadAll();
      } else {
        errEl.textContent = 'Incorrect PIN. Please try again.';
        pinInputs.forEach((i) => { i.value = ''; });
        pinInputs[0].focus();
      }
    });

    document.addEventListener('click', async (e) => {
      const fBtn = e.target.closest('[data-filter]');
      if (fBtn) {
        state.filter = fBtn.dataset.filter;
        document.querySelectorAll('[data-filter]').forEach((b) => b.classList.toggle('active', b === fBtn));
        document.getElementById('portal-view').classList.remove('mobile-detail');
        render();
        return;
      }

      const row = e.target.closest('[data-select]');
      if (row) {
        state.selectedId = row.dataset.select;
        document.getElementById('portal-view').classList.add('mobile-detail');
        render();
        return;
      }

      if (e.target.id === 'mobile-back-btn') {
        document.getElementById('portal-view').classList.remove('mobile-detail');
        return;
      }

      const stBtn = e.target.closest('[data-status]');
      if (stBtn) {
        const id = stBtn.dataset.status;
        const val = stBtn.dataset.val;
        await fetch('/api/manage/enquiries/' + encodeURIComponent(id), {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: val }),
        });
        const target = state.allEnquiries.find((x) => x.id === id);
        if (target) target.status = val;
        updateCounts();
        render();
        return;
      }

      const noteBtn = e.target.closest('[data-save-note]');
      if (noteBtn) {
        const id = noteBtn.dataset.saveNote;
        const notes = document.getElementById('detail-notes')?.value || '';
        noteBtn.textContent = 'Saved';
        await fetch('/api/manage/enquiries/' + encodeURIComponent(id), {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notes }),
        });
        const target = state.allEnquiries.find((x) => x.id === id);
        if (target) target.notes = notes;
        setTimeout(() => { noteBtn.textContent = 'Save note'; }, 1200);
        return;
      }

      if (e.target.id === 'refresh-btn') await loadAll();
      if (e.target.id === 'lock-btn') {
        await fetch('/api/manage/logout', { method: 'POST' });
        showPin();
      }
    });

    document.getElementById('search-input').addEventListener('input', (e) => {
      state.q = e.target.value;
      render();
    });

    (async () => {
      const status = await fetch('/api/manage/status').then((r) => r.json());
      state.pinEnabled = status.pinEnabled;
      if (!status.authenticated) {
        showPin();
      } else {
        showPortal();
        await loadAll();
      }
    })();
  </script>
</body>
</html>`;
}
