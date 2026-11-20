import { api, copyText, escapeHtml, formatRelativeTime, formatTimestamp, isDemoMode } from './api.js?v=7';
import { icons } from './icons.js?v=4';

const state = {
  baseUrl: window.location.origin,
  stats: null,
  forms: [],
  workspace: {
    brand_name: 'AskForms',
    website_url: '',
    support_email: '',
    license_holder: 'Self-Hosted',
    logo_url: '',
    accent_color: '#14383e',
    accent_text_color: '#ffffff',
    bg_color: '#f7fafc',
    surface_color: '#ffffff',
    font_preset: 'minimal',
    radius_preset: 'balanced',
    thanks_heading: 'Submission received',
    thanks_body: '',
    email_footer: '',
    email_provider: 'local',
    mail_from: 'forms@yourdomain.com.au',
    has_resend_key: false,
    resend_api_key_preview: '',
    auth_enabled: false,
    auth_from_env: false,
  },
  authenticated: true,
  view: 'forms', // 'forms' | 'form' | 'sandbox' | 'mail' | 'webhooks' | 'workspace' | 'setup'
  clientFilter: 'all',
  formsStatusFilter: 'active', // 'active' | 'archived'
  projectMenuOpen: false,
  collapsedProjects: [],
  selectedFormId: null,
  formTab: 'submissions', // 'submissions' | 'builder' | 'integration' | 'workflows' | 'settings'
  snippetLang: 'popout', // 'popout' | 'embed' | 'html' | 'fetch' | 'react' | 'curl' | 'cloudflare'
  popoutMode: 'drawer', // 'drawer' (Slide-Over Shopping Cart) | 'popover' (Floating Chat Window)
  popoutLabel: 'Get a Quote',
  embedPlatform: 'webflow', // 'webflow' | 'wordpress' | 'squarespace' | 'wix' | 'html'
  builderFields: [],
  builderSubmitLabel: 'Send enquiry',
  builderMultiStep: false,
  builderReviewGateUrl: '',
  embedVersion: 1,
  wfOpen: { validations: false, response: false, actions: true },
  wfEmailEditorOpen: false,
  aiPromptExpanded: false,
  selectedSubIds: [],
  setupStep: 1,
  setupData: {
    brand_name: '',
    website_url: '',
    accent_color: '#095c4f',
    font_preset: 'editorial',
    radius_preset: 'balanced',
    owner_email: '',
    owner_pin: '246810',
    alert_format: 'telegram',
    alert_url: '',
    form_name: 'Website Enquiry',
    template: 'trades',
    multi_step: true,
    review_gate_url: '',
    created_form_id: '',
  },
  subFilter: 'inbox', // 'inbox' | 'spam' | 'all'
  subQuery: '',
  currentForm: null,
  currentWebhooks: [],
  submissions: [],
  selectedSubmission: null,
  drawerRawJson: false,
  mailLogs: [],
  selectedMailId: null,
  mailPreviewMode: 'html', // 'html' | 'text' | 'headers'
  webhookLogs: [],
  expandedWebhookLogId: null,
  sandboxFormId: null,
  sandboxMode: 'json', // 'json' | 'urlencoded' | 'multipart'
  sandboxSimulateBot: false,
  sandboxResult: null,
  channelsDefs: [],
  channelsConfig: {},
  assistantMessages: [
    {
      role: 'assistant',
      text: 'Hi! I am your built-in AskForms assistant (free, no API key required). I can help you:\n• Create a custom pop-out form from plain English\n• Search and query your enquiry inbox\n• Summarise your live form analytics\n\nWhat would you like to do?',
    },
  ],
  assistantDraftForm: null,
  assistantByok: { provider: 'gemini', apiKey: '' },
  partnerIssuedKey: null,
  partnerClients: [],
};

function isPartnerSession() {
  return !isDemoMode() && state.workspace?.session_role === 'partner';
}

function getImpersonatedBy() {
  return !isDemoMode() ? (state.workspace?.impersonated_by || null) : null;
}

const els = {
  app: document.getElementById('app'),
  brandLockup: document.getElementById('brand-lockup'),
  sidebar: document.getElementById('sidebar'),
  sidebarRailToggle: document.getElementById('sidebar-rail-toggle'),
  topbar: document.getElementById('topbar'),
  content: document.getElementById('content'),
  drawerBackdrop: document.getElementById('drawer-backdrop'),
  drawer: document.getElementById('drawer'),
  modalBackdrop: document.getElementById('modal-backdrop'),
  modal: document.getElementById('modal'),
  toastContainer: document.getElementById('toast-container'),
};

const FONT_TOKENS = {
  minimal: {
    display: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    sans: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  classic: {
    display: "'Merriweather', Georgia, serif",
    sans: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  modern: {
    display: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    sans: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  editorial: {
    display: "'Merriweather', Georgia, serif",
    sans: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },
};

const RADIUS_TOKENS = {
  sharp: { md: '8px', lg: '12px', btn: '8px' },
  balanced: { md: '16px', lg: '22px', btn: '9999px' },
  soft: { md: '24px', lg: '32px', btn: '9999px' },
};

function contrastTextForHex(hex) {
  const clean = String(hex || '').replace('#', '');
  if (clean.length !== 6) return '#ffffff';
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.62 ? '#0b1926' : '#ffffff';
}

function applyWorkspaceBranding(override = null) {
  const ws = override || state.workspace || {};
  const accent = ws.accent_color || '#14383e';
  const accentText = ws.accent_text_color || contrastTextForHex(accent);
  const bg = ws.bg_color || '#f7fafc';
  const surface = ws.surface_color || '#ffffff';
  const fonts = FONT_TOKENS[ws.font_preset] || FONT_TOKENS.minimal;
  const radii = RADIUS_TOKENS[ws.radius_preset] || RADIUS_TOKENS.balanced;

  const root = document.documentElement.style;
  root.setProperty('--accent', accent);
  root.setProperty('--accent-hover', accent);
  root.setProperty('--accent-text', accentText);
  root.setProperty('--bg-canvas', bg);
  root.setProperty('--bg-surface', surface);
  root.setProperty('--font-display', fonts.display);
  root.setProperty('--font-sans', fonts.sans);
  root.setProperty('--radius-md', radii.md);
  root.setProperty('--radius-lg', radii.lg);
  root.setProperty('--radius-btn', radii.btn);

  document.title = ws.brand_name || 'AskForms';
}

function applyDraftBranding() {
  const accent = document.getElementById('ws-accent')?.value?.trim() || state.workspace.accent_color;
  const bg = document.getElementById('ws-bg')?.value?.trim() || state.workspace.bg_color;
  const font = document.getElementById('ws-font')?.value || state.workspace.font_preset;
  const radius = document.getElementById('ws-radius')?.value || state.workspace.radius_preset;
  const brand = document.getElementById('ws-brand')?.value?.trim() || state.workspace.brand_name;

  applyWorkspaceBranding({
    ...state.workspace,
    brand_name: brand,
    accent_color: /^#[0-9a-fA-F]{6}$/.test(accent) ? accent : state.workspace.accent_color,
    accent_text_color: contrastTextForHex(/^#[0-9a-fA-F]{6}$/.test(accent) ? accent : state.workspace.accent_color),
    bg_color: /^#[0-9a-fA-F]{6}$/.test(bg) ? bg : state.workspace.bg_color,
    font_preset: font,
    radius_preset: radius,
  });
}

function showToast(message) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = message;
  els.toastContainer.appendChild(el);
  setTimeout(() => el.remove(), 2800);
}

async function refreshBootstrap() {
  const data = await api.bootstrap();
  state.baseUrl = data.baseUrl || window.location.origin;
  state.stats = data.stats;
  state.forms = data.forms;
  if (data.workspace) {
    state.workspace = data.workspace;
    applyWorkspaceBranding();
  }
  if (!state.sandboxFormId && state.forms.length > 0) {
    state.sandboxFormId = state.forms[0].id;
  }
  if (isPartnerSession()) {
    try {
      const res = await api.listPartnerClients();
      state.partnerClients = res.clients || [];
    } catch {
      state.partnerClients = [];
    }
  } else {
    state.partnerClients = [];
  }
}

async function openForm(formId, tab = null) {
  state.view = 'form';
  state.selectedFormId = formId;
  state.formTab = tab || (isPartnerSession() ? 'builder' : 'submissions');
  if (isPartnerSession() && state.formTab === 'submissions') {
    state.formTab = 'builder';
  }
  state.subQuery = '';
  state.selectedSubmission = null;
  closeDrawer();

  const url = new URL(window.location.href);
  url.searchParams.set('form', formId);
  window.history.replaceState({}, '', url);

  await loadFormDetail(formId);
  render();
}

async function loadFormDetail(formId) {
  const [detail, subs] = await Promise.all([
    api.getForm(formId),
    api.listSubmissions(formId, state.subFilter, state.subQuery),
  ]);
  state.currentForm = detail.form;
  state.builderFields = JSON.parse(JSON.stringify(detail.form.fields || []));
  state.builderSubmitLabel = detail.form.submit_label || 'Send enquiry';
  state.builderMultiStep = Boolean(detail.form.multi_step);
  state.builderReviewGateUrl = detail.form.review_gate_url || '';
  state.currentWebhooks = detail.webhooks;
  state.submissions = subs.submissions;
}

async function switchView(view) {
  state.view = view;
  closeDrawer();
  const url = new URL(window.location.href);
  url.searchParams.delete('form');
  window.history.replaceState({}, '', url);

  await refreshBootstrap();

  if (view === 'mail') {
    const res = await api.listMailLogs();
    state.mailLogs = res.logs;
    if (!state.selectedMailId && res.logs.length > 0) {
      state.selectedMailId = res.logs[0].id;
    }
  } else if (view === 'webhooks') {
    const res = await api.listWebhookLogs();
    state.webhookLogs = res.logs;
  } else if (view === 'channels') {
    const res = await api.getChannels();
    state.channelsDefs = res.definitions || [];
    state.channelsConfig = res.config || {};
  }

  render();
}

// ============================================================
// RENDERING: FORMSPREE-STYLE HEADER + COLLAPSIBLE PROJECT TREE SIDEBAR
// ============================================================
function renderTopbar() {
  const ws = state.workspace || {};
  const partner = isPartnerSession();
  const impersonatedBy = getImpersonatedBy();

  if (els.brandLockup) {
    els.brandLockup.innerHTML = ws.logo_url
      ? `<img class="brand-logo-img" src="${escapeHtml(ws.logo_url)}" alt="${escapeHtml(ws.brand_name || 'AskForms')}" />`
      : `${icons.brand}<span class="brand-name">${escapeHtml(ws.brand_name || 'AskForms')}</span>`;
  }

  if (partner) {
    els.topbar.innerHTML = `
      <div class="header-left" aria-hidden="true"></div>

      <div class="header-right">
        <nav class="header-nav" aria-label="Partner Primary">
          <button class="header-nav-link ${state.view === 'partner-clients' ? 'active' : ''}" data-nav="partner-clients">Clients &amp; Keys</button>
          <button class="header-nav-link ${state.view === 'forms' || state.view === 'form' ? 'active' : ''}" data-nav="forms">Client Forms</button>
          <button class="header-nav-link ${state.view === 'assistant' ? 'active' : ''}" data-nav="assistant">AI Form Builder</button>
        </nav>
        <span class="tag tag-accent" style="white-space:nowrap;">Partner · ${escapeHtml(ws.license_holder || ws.brand_name || 'Agency')}</span>
        <button class="btn btn-ghost btn-sm" style="padding:0 10px;" data-action="logout" title="Sign out">${icons.lock}</button>
      </div>
    `;
    return;
  }

  if (isDemoMode()) {
    els.topbar.innerHTML = `
      <div class="header-left" aria-hidden="true"></div>

      <div class="header-right">
        <nav class="header-nav" aria-label="Preview Primary">
          <button class="header-nav-link ${state.view === 'forms' || state.view === 'form' ? 'active' : ''}" data-nav="forms">Forms</button>
          <button class="header-nav-link ${state.view === 'assistant' ? 'active' : ''}" data-nav="assistant">AI Assistant</button>
          <button class="header-nav-link ${state.view === 'channels' ? 'active' : ''}" data-nav="channels">Notifications</button>
          <button class="header-nav-link ${state.view === 'workspace' ? 'active' : ''}" data-nav="workspace">Brand</button>
        </nav>
        <button type="button" class="btn btn-ghost btn-sm" data-action="reset-demo-studio" title="Clear preview session">Reset</button>
        <a class="btn btn-primary btn-sm" href="/#pricing">Buy License · $149</a>
      </div>
    `;
    return;
  }

  els.topbar.innerHTML = `
    <div class="header-left" aria-hidden="true"></div>

    <div class="header-right">
      <nav class="header-nav" aria-label="Primary">
        <button class="header-nav-link ${state.view === 'forms' || state.view === 'form' ? 'active' : ''}" data-nav="forms">Forms</button>
        <button class="header-nav-link ${state.view === 'assistant' ? 'active' : ''}" data-nav="assistant">AI Assistant</button>
        <button class="header-nav-link ${state.view === 'channels' ? 'active' : ''}" data-nav="channels">Notifications</button>
        <button class="header-nav-link ${state.view === 'mail' || state.view === 'webhooks' ? 'active' : ''}" data-nav="mail">Activity</button>
        <button class="header-nav-link ${state.view === 'workspace' || state.view === 'setup' ? 'active' : ''}" data-nav="workspace">Brand</button>
      </nav>
      ${
        impersonatedBy
          ? `<button type="button" class="btn btn-secondary btn-sm" data-action="exit-impersonation" style="white-space:nowrap;">← Partner Portal</button>
             <a class="btn btn-primary btn-sm" href="/manage" target="_blank" rel="noopener">Owner Inbox</a>`
          : `<a class="btn btn-primary btn-sm" href="/manage" target="_blank" rel="noopener">Owner Inbox</a>
             <button class="btn btn-ghost btn-sm" style="padding:0 10px;" data-action="logout" title="Sign out">${icons.lock}</button>`
      }
    </div>
  `;
}

function renderSidebar() {
  const partner = isPartnerSession();
  const showArchived = state.formsStatusFilter === 'archived';
  const unarchivedForms = state.forms.filter((f) => Boolean(f.is_archived) === showArchived);
  const visibleForms =
    state.clientFilter === 'all'
      ? unarchivedForms
      : unarchivedForms.filter((f) => f.client_name === state.clientFilter);

  const groups = new Map();
  if (partner && !showArchived) {
    for (const c of state.partnerClients || []) {
      const label = c.holder || c.domain;
      if (label && !groups.has(label)) groups.set(label, []);
    }
  }
  for (const f of visibleForms) {
    const key = f.client_name || 'Default Project';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(f);
  }

  const groupHtml =
    groups.size === 0
      ? `<div class="empty-project-slot" data-action="open-create-modal">
          <span>Click</span>
          <span class="empty-plus-circle">${icons.plus}</span>
          <span>to create a form</span>
        </div>`
      : Array.from(groups.entries())
          .map(
            ([projectName, items]) => {
              const isCollapsed = (state.collapsedProjects || []).includes(projectName);
              const hasActive = state.view === 'form' && items.some((f) => f.id === state.selectedFormId);
              return `
            <div class="project-group ${isCollapsed ? 'collapsed' : ''} ${hasActive ? 'has-active' : ''}" data-project-group="${escapeHtml(projectName)}">
              <button type="button" class="project-group-header" data-toggle-project="${escapeHtml(projectName)}" aria-expanded="${isCollapsed ? 'false' : 'true'}">
                <span class="project-group-left">
                  <span class="project-group-name">${escapeHtml(projectName)}</span>
                </span>
                <span class="project-group-right">
                  <span class="project-caret">${icons.chevron}</span>
                </span>
              </button>
              <ul class="project-forms">
                ${
                  items.length === 0
                    ? `<li><button class="tree-form-btn" data-new-form-for="${escapeHtml(projectName)}" style="color:var(--ink-muted);font-style:italic;"><span class="tree-form-left">+ Add first form</span></button></li>`
                    : items
                        .map(
                          (f) => `
                          <li>
                            <button class="tree-form-btn ${state.view === 'form' && state.selectedFormId === f.id ? 'active' : ''}" data-open-form="${escapeHtml(f.id)}">
                              <span class="tree-form-left">
                                <span class="form-dot ${f.is_active && !f.is_archived ? '' : 'paused'}"></span>
                                <span class="tree-form-name">${escapeHtml(f.name)}</span>
                              </span>
                              ${partner ? '' : `<span class="tree-count">${f.submission_count}</span>`}
                            </button>
                          </li>
                        `
                        )
                        .join('')
                }
              </ul>
            </div>
          `;
            }
          )
          .join('');

  els.sidebar.innerHTML = `
    <div class="sidebar-inner">
      <div class="sidebar-brand-top" aria-hidden="true"></div>
      <div class="sidebar-cta-wrap">
        <button class="sidebar-add-primary" data-action="${partner ? 'go-partner-clients' : 'open-create-modal'}">
          ${icons.plus} ${partner ? 'New Client / Key' : 'Add New'}
        </button>
      </div>

      <div class="sidebar-mobile-nav">
        ${
          partner
            ? `<button class="tree-form-btn ${state.view === 'partner-clients' ? 'active' : ''}" data-nav="partner-clients">Clients &amp; Keys</button>
               <button class="tree-form-btn ${state.view === 'forms' ? 'active' : ''}" data-nav="forms">Client Forms</button>
               <button class="tree-form-btn ${state.view === 'assistant' ? 'active' : ''}" data-nav="assistant">AI Form Builder</button>`
            : isDemoMode()
            ? `<button class="tree-form-btn ${state.view === 'forms' ? 'active' : ''}" data-nav="forms">Forms</button>
               <button class="tree-form-btn ${state.view === 'assistant' ? 'active' : ''}" data-nav="assistant">AI Assistant</button>
               <button class="tree-form-btn ${state.view === 'channels' ? 'active' : ''}" data-nav="channels">Notifications</button>
               <button class="tree-form-btn ${state.view === 'workspace' ? 'active' : ''}" data-nav="workspace">Brand</button>`
            : `<button class="tree-form-btn ${state.view === 'forms' ? 'active' : ''}" data-nav="forms">Forms</button>
               <button class="tree-form-btn ${state.view === 'assistant' ? 'active' : ''}" data-nav="assistant">AI Assistant</button>
               <button class="tree-form-btn ${state.view === 'channels' ? 'active' : ''}" data-nav="channels">Notifications</button>
               <button class="tree-form-btn ${state.view === 'mail' || state.view === 'webhooks' ? 'active' : ''}" data-nav="mail">Activity</button>
               <button class="tree-form-btn ${state.view === 'workspace' || state.view === 'setup' ? 'active' : ''}" data-nav="workspace">Brand</button>`
        }
      </div>

      <div class="sidebar-tree">
        ${groupHtml}
      </div>

      ${
        partner
          ? `<div class="sidebar-footer">
               <div class="sidebar-footer-links">
                 <button class="sidebar-text-link" data-action="open-create-modal">${icons.plus} New Form</button>
               </div>
             </div>`
          : isDemoMode()
          ? ''
          : `<div class="sidebar-footer">
               <div class="sidebar-footer-links">
                 <button class="sidebar-text-link" data-nav="setup">${icons.wizard} Setup Wizard</button>
                 <button class="sidebar-text-link" data-action="open-deploy-modal">${icons.deploy} Deploy</button>
               </div>
             </div>`
      }
    </div>
  `;
}

// ============================================================
// VIEW: FORMS OVERVIEW (Formspree Two-Column Overview Pattern)
// ============================================================
function buildSparkline(count, seedStr) {
  const seed = Array.from(seedStr || 'a').reduce((a, c) => a + c.charCodeAt(0), 0);
  const bars = [0, 1, 2, 3, 4, 5, 6].map((i) => {
    if (count === 0) return { h: 3, lit: false };
    const val = ((seed + i * 7) % 5) + 1;
    const isPeak = i === 6 || (count > 1 && i === 4);
    const h = isPeak ? Math.min(20, 8 + count * 4) : Math.max(4, val * 2 + (count > 2 ? 3 : 0));
    return { h, lit: isPeak || count > 2 };
  });
  return `<div class="sparkline" title="Recent enquiry activity">${bars
    .map((b) => `<span class="spark-bar ${b.lit ? 'lit' : ''}" style="height:${b.h}px;"></span>`)
    .join('')}</div>`;
}

function renderFormsOverview() {
  const s = state.stats || { activeForms: 0, archivedForms: 0, validSubmissions: 0, spamBlocked: 0, deliveryRate: 100 };
  const activeList = state.forms.filter((f) => !f.is_archived);
  const archivedList = state.forms.filter((f) => Boolean(f.is_archived));
  const showArchived = state.formsStatusFilter === 'archived';
  const baseForms = showArchived ? archivedList : activeList;

  const clients = Array.from(new Set(baseForms.map((f) => f.client_name).filter(Boolean)));
  if (state.clientFilter !== 'all' && !clients.includes(state.clientFilter)) {
    state.clientFilter = 'all';
  }
  const visibleForms =
    state.clientFilter === 'all'
      ? baseForms
      : baseForms.filter((f) => f.client_name === state.clientFilter);

  const projectTitle = state.clientFilter === 'all' ? 'All Projects' : state.clientFilter;
  const projectMenuHtml = `<div class="heading-menu" role="listbox" aria-label="Switch project">
    <button type="button" class="heading-menu-item ${state.clientFilter === 'all' ? 'active' : ''}" data-select-project="all">
      <span>All Projects</span>
      <span class="cell-mono">${baseForms.length}</span>
    </button>
    ${clients.length > 0 ? '<div class="heading-menu-divider"></div>' : ''}
    ${clients
      .map((c) => {
        const count = baseForms.filter((f) => f.client_name === c).length;
        return `<button type="button" class="heading-menu-item ${state.clientFilter === c ? 'active' : ''}" data-select-project="${escapeHtml(c)}">
          <span>${escapeHtml(c)}</span>
          <span class="cell-mono">${count}</span>
        </button>`;
      })
      .join('')}
  </div>`;

  const cards = visibleForms
    .map((f) => {
      const endpointPath = `/f/${f.id}`;
      const fullEndpoint = `${state.baseUrl}${endpointPath}`;
      const isArchived = Boolean(f.is_archived);
      return `
        <article class="form-showcase-card" data-open-form="${escapeHtml(f.id)}">
          <div class="fsc-top">
            <div style="min-width:0;">
              <div class="fsc-client">${escapeHtml(f.client_name)}</div>
              <h3 class="fsc-title">${escapeHtml(f.name)}</h3>
            </div>
            <span class="tag ${isArchived ? 'tag-warning' : f.is_active ? 'tag-accent' : 'tag-warning'}">${isArchived ? 'Archived' : f.is_active ? 'Active' : 'Paused'}</span>
          </div>

          <div class="fsc-stats-row">
            <div>
              <div class="fsc-count">${f.submission_count}</div>
              <div class="fsc-count-label">
                ${f.submission_count === 1 ? 'enquiry' : 'enquiries'}${f.spam_count > 0 ? ` · ${f.spam_count} spam` : ''} · ${formatRelativeTime(f.last_submission_at)}
              </div>
            </div>
            ${buildSparkline(f.submission_count, f.id)}
          </div>

          <div class="fsc-footer">
            <button type="button" class="endpoint-pill" style="height:34px;padding:0 12px;" data-stop-copy="${escapeHtml(fullEndpoint)}" title="Copy full endpoint URL">
              <span>${escapeHtml(endpointPath)}</span>
              ${icons.copy}
            </button>
            <div style="display:flex;align-items:center;gap:6px;">
              <button type="button" class="btn btn-secondary btn-sm" style="height:34px;padding:0 12px;" data-test-popout="${escapeHtml(f.id)}" title="Test live Popout widget">
                ${icons.popout} Popout
              </button>
              <button type="button" class="btn btn-ghost btn-sm" style="height:34px;padding:0 9px;" data-archive-form="${escapeHtml(f.id)}" data-target-archive="${isArchived ? '0' : '1'}" title="${isArchived ? 'Restore form from archive' : 'Move form to archive'}">
                ${isArchived ? icons.restore : icons.archive}
              </button>
              <button type="button" class="btn btn-ghost btn-sm" style="height:34px;padding:0 9px;color:var(--danger);" data-delete-form="${escapeHtml(f.id)}" title="Delete form">
                ${icons.trash}
              </button>
            </div>
          </div>
        </article>
      `;
    })
    .join('');

  const demo = isDemoMode();
  const partner = isPartnerSession();

  els.content.innerHTML = `
    <div class="page-band">
      <div class="page-band-inner">
        <div class="page-band-top">
          <div class="project-heading-wrap ${state.projectMenuOpen ? 'open' : ''}">
            <button type="button" class="heading-switcher" data-action="toggle-project-menu" aria-haspopup="listbox" aria-expanded="${state.projectMenuOpen ? 'true' : 'false'}" title="Switch project">
              <h1 class="page-band-title">${escapeHtml(projectTitle)}</h1>
              <span class="heading-switcher-caret">${icons.chevron}</span>
            </button>
            ${projectMenuHtml}
          </div>
          <div class="toolbar-group">
            <div class="filter-pills">
              <button type="button" class="filter-pill ${!showArchived ? 'active' : ''}" data-forms-status="active">Active (${activeList.length})</button>
              <button type="button" class="filter-pill ${showArchived ? 'active' : ''}" data-forms-status="archived">Archived (${archivedList.length})</button>
            </div>
            ${demo || partner ? '' : `<button class="btn btn-secondary" data-nav="setup">Setup Wizard</button>`}
            <button class="btn btn-primary" data-action="open-create-modal">${icons.plus} New Form</button>
          </div>
        </div>
      </div>
    </div>

    <div class="content-inner">
      <div class="content-container view-animate">
        <section class="hero-summary-band">
          <div class="hero-metrics">
            <div>
              <div class="hero-metric-label">Active Forms</div>
              <div class="hero-metric-val">${activeList.length}</div>
            </div>
            <div>
              <div class="hero-metric-label">Enquiries</div>
              <div class="hero-metric-val">${s.validSubmissions}</div>
            </div>
            <div>
              <div class="hero-metric-label">Spam Shielded</div>
              <div class="hero-metric-val">${s.spamBlocked}</div>
            </div>
          </div>
          <div class="hero-actions">
            ${
              demo || partner
                ? `<button class="btn btn-mint" data-action="open-create-modal">${icons.plus} Create Form</button>`
                : `<a class="btn btn-mint" href="/manage" target="_blank" rel="noopener">Open Owner Portal ${icons.external}</a>`
            }
            <button class="btn btn-hero-ghost" data-nav="assistant">${icons.sparkles || icons.plus} Build with AI</button>
          </div>
        </section>

        ${
          visibleForms.length === 0
            ? `<div class="card"><div class="empty-state">
                <div class="empty-state-title">${showArchived ? 'No archived forms' : 'No forms created yet'}</div>
                <p>${showArchived ? 'Forms you archive will appear here so you can restore or permanently delete them anytime.' : 'Create your first website enquiry form from a template or describe what you need to the AI Assistant.'}</p>
                <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
                  ${
                    showArchived
                      ? `<button class="btn btn-secondary" data-forms-status="active">Back to Active Forms</button>`
                      : `<button class="btn btn-primary" data-action="open-create-modal">${icons.plus} Create Form</button>
                         <button class="btn btn-secondary" data-nav="assistant">Build with AI</button>`
                  }
                </div>
              </div></div>`
            : `<section class="forms-card-grid">${cards}</section>`
        }

        ${
          demo || partner
            ? ''
            : `<section class="utility-strip">
                <button type="button" class="utility-card" data-nav="mail" style="text-align:left;">
                  <div>
                    <div class="fsc-client" style="margin-bottom:3px;">Notifications</div>
                    <div class="cell-primary" style="font-size:15px;">Mail Outbox</div>
                  </div>
                  <span class="tag tag-accent">${s.emailsSent || 0}</span>
                </button>
                <button type="button" class="utility-card" data-nav="webhooks" style="text-align:left;">
                  <div>
                    <div class="fsc-client" style="margin-bottom:3px;">Integrations</div>
                    <div class="cell-primary" style="font-size:15px;">Webhook Logs</div>
                  </div>
                  <span class="tag">${s.webhookTotal || 0}</span>
                </button>
                <a class="utility-card" href="/api/workspace/backup.json">
                  <div>
                    <div class="fsc-client" style="margin-bottom:3px;">Data Ownership</div>
                    <div class="cell-primary" style="font-size:15px;">Export Full Backup</div>
                  </div>
                  <span style="color:var(--ink-muted);">${icons.download}</span>
                </a>
              </section>`
        }
      </div>
    </div>
  `;
}

// ============================================================
// VIEW: FORM WORKSPACE (Formspree Clean Band + Underline Tabs)
// ============================================================
function renderFormWorkspace() {
  const f = state.currentForm;
  if (!f) return;
  const endpoint = `${state.baseUrl}/f/${f.id}`;
  const partner = isPartnerSession();
  if (partner && state.formTab === 'submissions') {
    state.formTab = 'builder';
  }

  let bodyHtml = '';
  if (state.formTab === 'submissions' && !partner) bodyHtml = renderFormSubmissionsTab(f);
  else if (state.formTab === 'builder') bodyHtml = renderFormBuilderTab(f);
  else if (state.formTab === 'integration') bodyHtml = renderFormIntegrationTab(f);
  else if (state.formTab === 'workflows') bodyHtml = renderFormWorkflowsTab(f);
  else if (state.formTab === 'settings') bodyHtml = renderFormSettingsTab(f);

  els.content.innerHTML = `
    <div class="page-band has-tabs">
      <div class="page-band-inner">
        <div class="page-band-top">
          <h1 class="page-band-title">${escapeHtml(f.name)}</h1>
          <div class="toolbar-group">
            <button class="btn btn-secondary" data-copy="${escapeHtml(`${state.baseUrl}/embed/${f.id}`)}" title="Copy shareable form link">
              ${icons.copy} Copy Link
            </button>
            <button type="button" class="btn btn-secondary" data-archive-form="${escapeHtml(f.id)}" data-target-archive="${f.is_archived ? '0' : '1'}">
              ${f.is_archived ? `${icons.restore} Restore` : `${icons.archive} Archive`}
            </button>
            <button type="button" class="btn btn-primary" data-test-popout="${escapeHtml(f.id)}">
              ${icons.popout} Test Form
            </button>
          </div>
        </div>

        <div class="underline-tabs" role="tablist">
          ${
            partner
              ? ''
              : `<button class="underline-tab ${state.formTab === 'submissions' ? 'active' : ''}" data-form-tab="submissions">
                   Enquiries <span class="tab-count">${f.submission_count}</span>
                 </button>`
          }
          <button class="underline-tab ${state.formTab === 'builder' ? 'active' : ''}" data-form-tab="builder">
            Form Builder
          </button>
          <button class="underline-tab ${state.formTab === 'integration' ? 'active' : ''}" data-form-tab="integration">
            Embed & Code
          </button>
          <button class="underline-tab ${state.formTab === 'workflows' ? 'active' : ''}" data-form-tab="workflows">
            Workflows
          </button>
          <button class="underline-tab ${state.formTab === 'settings' ? 'active' : ''}" data-form-tab="settings">
            Settings
          </button>
        </div>
      </div>
    </div>

    <div class="content-inner">
      <div class="content-container view-animate">
        ${bodyHtml}
      </div>
    </div>
  `;
}

const ENQUIRY_TEMPLATES = {
  trades: {
    label: 'Trades & Quote',
    submitLabel: 'Request a quote',
    multiStep: true,
    fields: [
      { name: 'name', label: 'Full name', type: 'text', placeholder: 'Alex Mercer', required: true, half: true },
      { name: 'phone', label: 'Phone number', type: 'tel', placeholder: '0400 000 000', required: true, half: true },
      { name: 'email', label: 'Email address', type: 'email', placeholder: 'alex@example.com.au', required: true, half: true },
      { name: 'suburb', label: 'Suburb / Postcode', type: 'text', placeholder: 'Newtown 2042', required: true, half: true },
      { name: 'service', label: 'Service needed', type: 'select', options: ['General Repair', 'Installation', 'Urgent Callout', 'Quote / Inspection'], required: true, half: false },
      { name: 'message', label: 'Job details', type: 'textarea', placeholder: 'Briefly describe the issue or scope...', required: true, half: false },
      { name: 'photo', label: 'Upload a photo (optional)', type: 'file', required: false, half: false },
    ],
  },
  general: {
    label: 'Local Contact',
    submitLabel: 'Send enquiry',
    multiStep: false,
    fields: [
      { name: 'name', label: 'Full name', type: 'text', placeholder: 'Alex Mercer', required: true, half: true },
      { name: 'email', label: 'Email address', type: 'email', placeholder: 'alex@company.com.au', required: true, half: true },
      { name: 'phone', label: 'Phone number', type: 'tel', placeholder: '0400 000 000', required: false, half: true },
      { name: 'topic', label: 'Enquiry type', type: 'select', options: ['General Enquiry', 'Request a Quote', 'Book a Consultation', 'Support'], required: false, half: true },
      { name: 'message', label: 'How can we help?', type: 'textarea', placeholder: 'Tell us a little about what you need...', required: true, half: false },
    ],
  },
  callback: {
    label: 'Callback',
    submitLabel: 'Request a callback',
    multiStep: false,
    fields: [
      { name: 'name', label: 'Your name', type: 'text', placeholder: 'Sam Taylor', required: true, half: true },
      { name: 'phone', label: 'Phone number', type: 'tel', placeholder: '0400 000 000', required: true, half: true },
      { name: 'best_time', label: 'Best time to call', type: 'select', options: ['Morning (8am – 12pm)', 'Afternoon (12pm – 5pm)', 'Anytime today'], required: false, half: false },
    ],
  },
  feedback: {
    label: 'Review Gate',
    submitLabel: 'Send private feedback',
    multiStep: false,
    fields: [
      { name: 'name', label: 'Your name (optional)', type: 'text', placeholder: 'Jordan Lee', required: false, half: true },
      { name: 'email', label: 'Email (if you want a reply)', type: 'email', placeholder: 'jordan@example.com.au', required: false, half: true },
      { name: 'message', label: 'How can we make this right?', type: 'textarea', placeholder: 'Share details directly with the owner...', required: true, half: false },
    ],
  },
};

function renderFormBuilderTab(f) {
  const fields = state.builderFields || [];

  const fieldCards = fields
    .map(
      (field, idx) => `
      <div class="builder-field-row" data-field-idx="${idx}">
        <div class="builder-row-grid">
          <input class="input" data-bf-prop="label" data-bf-idx="${idx}" value="${escapeHtml(field.label || '')}" placeholder="Field label" />
          <select class="select" data-bf-prop="type" data-bf-idx="${idx}">
            <option value="text" ${field.type === 'text' ? 'selected' : ''}>Short text</option>
            <option value="email" ${field.type === 'email' ? 'selected' : ''}>Email</option>
            <option value="tel" ${field.type === 'tel' ? 'selected' : ''}>Phone</option>
            <option value="url" ${field.type === 'url' ? 'selected' : ''}>Website URL</option>
            <option value="select" ${field.type === 'select' ? 'selected' : ''}>Dropdown</option>
            <option value="checklist" ${field.type === 'checklist' ? 'selected' : ''}>Checklist (tick multiple)</option>
            <option value="checkbox" ${field.type === 'checkbox' ? 'selected' : ''}>Single checkbox</option>
            <option value="textarea" ${field.type === 'textarea' ? 'selected' : ''}>Long text</option>
            <option value="date" ${field.type === 'date' ? 'selected' : ''}>Date</option>
            <option value="file" ${field.type === 'file' ? 'selected' : ''}>File upload</option>
          </select>
          <div style="display:flex;gap:4px;">
            <button type="button" class="btn btn-ghost btn-sm" style="padding:0 7px;" data-bf-move="${idx}" data-dir="-1" ${idx === 0 ? 'disabled' : ''} title="Move up">&uarr;</button>
            <button type="button" class="btn btn-ghost btn-sm" style="padding:0 7px;" data-bf-move="${idx}" data-dir="1" ${idx === fields.length - 1 ? 'disabled' : ''} title="Move down">&darr;</button>
            <button type="button" class="btn btn-ghost btn-sm" style="padding:0 7px;color:var(--danger);" data-bf-remove="${idx}" title="Remove">${icons.trash}</button>
          </div>
        </div>

        ${
          field.type === 'select' || field.type === 'checklist'
            ? `<input class="input" data-bf-prop="options" data-bf-idx="${idx}" value="${escapeHtml(Array.isArray(field.options) ? field.options.join(', ') : (field.options || ''))}" placeholder="Comma-separated choices, e.g. Sales, Support, Quote" />`
            : field.type !== 'file' && field.type !== 'date' && field.type !== 'checkbox'
            ? `<input class="input" data-bf-prop="placeholder" data-bf-idx="${idx}" value="${escapeHtml(field.placeholder || '')}" placeholder="Example hint text (optional)" />`
            : ''
        }

        <div class="builder-row-meta">
          <div style="display:flex;align-items:center;gap:14px;font-size:12.5px;color:var(--ink-secondary);">
            <label style="display:inline-flex;align-items:center;gap:6px;cursor:pointer;">
              <input type="checkbox" data-bf-prop="required" data-bf-idx="${idx}" ${field.required ? 'checked' : ''} /> Required
            </label>
            <label style="display:inline-flex;align-items:center;gap:6px;cursor:pointer;">
              <input type="checkbox" data-bf-prop="half" data-bf-idx="${idx}" ${field.half ? 'checked' : ''} /> Half width
            </label>
          </div>
          <span class="cell-mono" style="font-size:11px;">name="${escapeHtml(field.name)}"</span>
        </div>
      </div>
    `
    )
    .join('');

  return `
    <div class="split-grid">
      <div class="card card-padded">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:14px;flex-wrap:wrap;">
          <h2 class="section-title" style="margin:0;">Enquiry fields</h2>
          <div class="filter-pills">
            ${Object.entries(ENQUIRY_TEMPLATES)
              .map(([key, tpl]) => `<button type="button" class="filter-pill" data-apply-template="${key}">${tpl.label}</button>`)
              .join('')}
          </div>
        </div>

        <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:16px;">
          ${fieldCards}
        </div>

        <div class="field-group" style="margin-bottom:14px;">
          <label class="field-label" for="bf-submit-label">Submit button label</label>
          <input class="input" id="bf-submit-label" value="${escapeHtml(state.builderSubmitLabel)}" placeholder="Send enquiry" />
        </div>

        <div class="toggle-row" style="border-top:1px solid var(--border-subtle);padding:12px 0;">
          <div>
            <div class="cell-primary" style="font-size:13px;">Multi-step quote flow</div>
            <div class="cell-secondary">Splits longer forms into 2 progressive steps to lift completion.</div>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" id="bf-multi-step" ${state.builderMultiStep ? 'checked' : ''} />
            <span class="toggle-track"></span>
          </label>
        </div>

        <div class="field-group" style="margin-top:12px;margin-bottom:16px;">
          <label class="field-label" for="bf-review-url">Smart Review Gate — Google Review URL (optional)</label>
          <input class="input" id="bf-review-url" type="url" value="${escapeHtml(state.builderReviewGateUrl)}" placeholder="https://g.page/r/your-business/review" />
          <div class="field-hint">When set, visitors rate 1–5 stars first: 4–5 stars go to Google Reviews; 1–3 stars open this private feedback form.</div>
        </div>

        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;">
          <button type="button" class="btn btn-secondary btn-sm" data-bf-add="1">${icons.plus} Add field</button>
          <button type="button" class="btn btn-primary btn-sm" data-bf-save="1">Save & update embed</button>
        </div>
      </div>

      <div class="card card-padded" style="position:sticky;top:84px;">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px;">
          <h2 class="section-title" style="margin:0;">Live embedded form</h2>
          <div class="toolbar-group">
            <a class="btn btn-secondary btn-sm" href="/embed/${encodeURIComponent(f.id)}" target="_blank" rel="noopener">Open Embed ${icons.external}</a>
            <button type="button" class="btn btn-secondary btn-sm" data-form-tab="integration">Get Embed Code</button>
          </div>
        </div>
        <div style="background:var(--bg-canvas);border:1px solid var(--border);border-radius:var(--radius-md);padding:12px;">
          <iframe class="embed-preview-frame" src="/embed/${encodeURIComponent(f.id)}?v=${state.embedVersion}" title="Embedded enquiry form preview"></iframe>
        </div>
      </div>
    </div>
  `;
}

function renderFormSubmissionsTab(f) {
  const selectedSet = new Set(state.selectedSubIds || []);
  const allVisibleIds = state.submissions.map((s) => s.id);
  const allSelected = allVisibleIds.length > 0 && allVisibleIds.every((id) => selectedSet.has(id));

  const rows = state.submissions
    .map((sub) => {
      const sender = sub.sender_name || sub.sender_email || 'Anonymous';
      const subEmail = sub.sender_name && sub.sender_email ? sub.sender_email : sub.origin || '';
      const preview =
        sub.data?.message ||
        Object.entries(sub.data || {})
          .filter(([k]) => !['name', 'email'].includes(k))
          .map(([k, v]) => `${k}: ${v}`)
          .join(' · ') ||
        '—';

      const statusMap = {
        new: { label: 'New', cls: 'tag-accent' },
        replied: { label: 'Replied', cls: 'tag-success' },
        closed: { label: 'Closed', cls: '' },
      };
      const st = statusMap[sub.status] || statusMap.new;
      const checked = selectedSet.has(sub.id);

      return `
        <tr class="clickable" data-open-sub="${escapeHtml(sub.id)}">
          <td style="width:40px;padding-right:4px;" data-stop-prop="1">
            <input type="checkbox" class="sub-check" data-sub-check="${escapeHtml(sub.id)}" ${checked ? 'checked' : ''} aria-label="Select enquiry" />
          </td>
          <td>
            <div class="cell-primary">${escapeHtml(sender)}</div>
            <div class="cell-secondary">${escapeHtml(subEmail)}</div>
          </td>
          <td class="col-hide-sm"><div class="cell-preview">${escapeHtml(preview)}</div></td>
          <td style="white-space:nowrap;">
            ${sub.is_spam ? '<span class="tag tag-danger">Spam</span>' : `<span class="tag ${st.cls}">${st.label}</span>`}
            ${sub.attachments?.length ? `<span class="tag" style="margin-left:4px;">${icons.paperclip} ${sub.attachments.length}</span>` : ''}
          </td>
          <td class="cell-secondary" style="white-space:nowrap;">${formatRelativeTime(sub.created_at)}</td>
        </tr>
      `;
    })
    .join('');

  return `
    <div class="card">
      <div class="toolbar">
        <div class="toolbar-group">
          <div class="filter-pills">
            <button class="filter-pill ${state.subFilter === 'inbox' ? 'active' : ''}" data-sub-filter="inbox">Inbox (${f.submission_count})</button>
            <button class="filter-pill ${state.subFilter === 'spam' ? 'active' : ''}" data-sub-filter="spam">Spam (${f.spam_count})</button>
            <button class="filter-pill ${state.subFilter === 'all' ? 'active' : ''}" data-sub-filter="all">All</button>
          </div>
          <input
            type="search"
            class="input search-input"
            id="sub-search"
            placeholder="Search enquiries..."
            value="${escapeHtml(state.subQuery)}"
          />
        </div>
        <div class="toolbar-group">
          <a class="btn btn-secondary btn-sm" href="/api/forms/${encodeURIComponent(f.id)}/export.csv${state.subFilter !== 'inbox' ? '?spam=1' : ''}">${icons.download} CSV</a>
          <a class="btn btn-secondary btn-sm" href="/api/forms/${encodeURIComponent(f.id)}/export.json${state.subFilter !== 'inbox' ? '?spam=1' : ''}">${icons.download} JSON</a>
        </div>
      </div>

      ${
        selectedSet.size > 0
          ? `<div class="bulk-bar">
              <strong>${selectedSet.size} selected</strong>
              <div class="toolbar-group">
                <button type="button" class="btn btn-secondary btn-sm" data-bulk-action="replied">Mark Replied</button>
                <button type="button" class="btn btn-secondary btn-sm" data-bulk-action="closed">Mark Closed</button>
                <button type="button" class="btn btn-secondary btn-sm" data-bulk-action="spam">Move to Spam</button>
                <button type="button" class="btn btn-danger btn-sm" data-bulk-action="delete">Delete</button>
              </div>
            </div>`
          : ''
      }

      ${
        state.submissions.length === 0
          ? `<div class="empty-state">
              <div class="empty-state-title">No ${state.subFilter === 'spam' ? 'spam' : 'enquiries'} yet</div>
              <p>Try submitting your form right now or add it to your website.</p>
              <button class="btn btn-primary btn-sm" data-test-popout="${escapeHtml(f.id)}">${icons.popout} Test Form</button>
            </div>`
          : `<div class="table-wrap">
              <table class="data-table">
                <thead>
                  <tr>
                    <th style="width:40px;padding-right:4px;">
                      <input type="checkbox" id="sub-select-all" ${allSelected ? 'checked' : ''} aria-label="Select all enquiries" />
                    </th>
                    <th>Sender</th>
                    <th class="col-hide-sm">Enquiry preview</th>
                    <th>Status</th>
                    <th>Received</th>
                  </tr>
                </thead>
                <tbody>${rows}</tbody>
              </table>
            </div>
            <div style="padding:11px 20px;border-top:1px solid var(--border-subtle);display:flex;align-items:center;justify-content:space-between;font-size:12px;color:var(--ink-muted);">
              <span>Showing ${state.submissions.length} ${state.submissions.length === 1 ? 'enquiry' : 'enquiries'}</span>
              <a href="/manage" target="_blank" style="color:var(--accent);font-weight:600;">Open mobile Owner Portal &rarr;</a>
            </div>`
      }
    </div>
  `;
}

function getIntegrationSnippet(f, lang) {
  const endpoint = `${state.baseUrl}/f/${f.id}`;
  const embedUrl = `${state.baseUrl}/embed/${f.id}`;
  const widgetUrl = `${state.baseUrl}/widget.js`;
  const fields = Array.isArray(f.fields) && f.fields.length > 0 ? f.fields : [];
  const label = state.popoutLabel || f.submit_label || 'Get a Quote';
  const accent = state.workspace?.accent_color || '#14383e';

  if (lang === 'popout') {
    return `<!-- 1. Drop once before </body> on any site (Webflow, WordPress, Squarespace, Shopify, HTML) -->
<!-- Zero setup required: renders a ${state.popoutMode === 'popover' ? 'Floating Chat Window' : 'Slide-Over Cart Drawer'} + floating launcher button -->
<script
  src="${widgetUrl}"
  data-form="${f.id}"
  data-mode="${state.popoutMode}"
  data-label="${label}"
  data-title="${f.name}"
  data-accent="${accent}"
  defer
></script>

<!-- 2. Optional: Any existing button or link on their site can also trigger the popout -->
<a href="#askforms-${f.id}">${label}</a>`;
  }

  if (lang === 'embed') {
    return `<!-- Drop onto any website (Webflow, Squarespace, WordPress, Shopify, HTML) -->
<iframe
  id="formflow-${f.id}"
  src="${embedUrl}"
  title="${f.name}"
  style="width:100%;min-height:480px;border:0;background:transparent;"
  loading="lazy"
></iframe>
<script>
  window.addEventListener('message', function (e) {
    if (e.data && e.data.type === 'formflow:resize' && e.data.formId === '${f.id}') {
      document.getElementById('formflow-${f.id}').style.height = (e.data.height + 16) + 'px';
    }
  });
</script>`;
  }

  if (lang === 'html') {
    const fieldLines = fields
      .map((fld) => {
        const req = fld.required ? ' required' : '';
        if (fld.type === 'textarea') {
          return `  <label for="${fld.name}">${fld.label}</label>\n  <textarea id="${fld.name}" name="${fld.name}"${req}></textarea>`;
        }
        if (fld.type === 'select') {
          const opts = (Array.isArray(fld.options) ? fld.options : String(fld.options || '').split(','))
            .map((o) => `    <option value="${String(o).trim()}">${String(o).trim()}</option>`)
            .join('\n');
          return `  <label for="${fld.name}">${fld.label}</label>\n  <select id="${fld.name}" name="${fld.name}"${req}>\n${opts}\n  </select>`;
        }
        return `  <label for="${fld.name}">${fld.label}</label>\n  <input id="${fld.name}" type="${fld.type || 'text'}" name="${fld.name}"${req} />`;
      })
      .join('\n\n');

    return `<form action="${endpoint}" method="POST">
  <!-- Honeypot spam trap -->
  <input type="text" name="_gotcha" style="display:none !important" tabindex="-1" autocomplete="off" />
  <input type="hidden" name="_subject" value="${f.name} — {{ name }}" />

${fieldLines}

  <button type="submit">${f.submit_label || 'Send enquiry'}</button>
</form>`;
  }

  if (lang === 'fetch') {
    return `const form = document.querySelector('#contact-form');

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const response = await fetch('${endpoint}', {
    method: 'POST',
    headers: { 'Accept': 'application/json' },
    body: new FormData(form),
  });

  const result = await response.json();
  if (result.ok) {
    form.reset();
  }
});`;
  }

  if (lang === 'react') {
    return `async function handleSubmit(e) {
  e.preventDefault();
  const res = await fetch('${endpoint}', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: formData.name,
      email: formData.email,
      message: formData.message,
      _gotcha: formData.honeypot,
    }),
  });
  const data = await res.json();
  if (data.ok) setSubmitted(true);
}`;
  }

  if (lang === 'cloudflare') {
    return `// Drop into functions/f/[formId].js inside any Cloudflare Pages static site
// Free tier: 100k req/day + background webhook notification via waitUntil()
export async function onRequestPost(context) {
  const { request, env, params } = context;
  const fd = await request.formData();
  if (fd.get('_gotcha')) return Response.json({ ok: true }); // Honeypot

  const data = Object.fromEntries(fd.entries());
  context.waitUntil(
    fetch(env.WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ form: params.formId, data }),
    })
  );

  return Response.redirect(data._next || '/thanks', 303);
}`;
  }

  return `curl -X POST ${endpoint} \\
  -H "Accept: application/json" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Alex Mercer",
    "email": "alex@client.com.au",
    "message": "Testing AskForms ingestion endpoint",
    "_subject": "${f.name} — {{ name }}"
  }'`;
}

function buildAiAssistantPrompt(f) {
  const endpoint = `${state.baseUrl}/f/${f.id}`;
  const fieldList = (f.fields || [])
    .map((fld) => `- ${fld.name} (${fld.type}${fld.required ? ', required' : ''}): "${fld.label}"`)
    .join('\n');

  return `Wire up the "${f.name}" enquiry form on this website to AskForms:
- Endpoint: POST ${endpoint}
- Include a hidden CSS honeypot field: <input type="text" name="_gotcha" style="display:none !important" tabindex="-1" autocomplete="off" />
- Include <input type="hidden" name="_subject" value="${f.name} — {{ name }}" />
- Submit via fetch() with header { "Accept": "application/json" } and show inline loading + confirmation states on { ok: true }.
- Fields to render:
${fieldList || '- name (text, required)\n- email (email, required)\n- message (textarea, required)'}`;
}

function renderFormIntegrationTab(f) {
  const endpoint = `${state.baseUrl}/f/${f.id}`;
  const snippet = getIntegrationSnippet(f, state.snippetLang);
  const aiPrompt = buildAiAssistantPrompt(f);

  return `
    <div class="split-grid-wide">
      <div style="display:flex;flex-direction:column;gap:22px;min-width:0;">
        <div class="card">
          <div class="card-section-header">
            <h2 class="card-section-label">Form Endpoint & Popout Preview</h2>
            <div class="toolbar-group">
              <button type="button" class="btn btn-primary btn-sm" data-test-popout="${escapeHtml(f.id)}" data-test-mode="drawer">${icons.popout} Test Slide-Over Drawer</button>
              <button type="button" class="btn btn-secondary btn-sm" data-test-popout="${escapeHtml(f.id)}" data-test-mode="popover">Test Chat Popout</button>
              <a class="btn btn-secondary btn-sm" href="/embed/${encodeURIComponent(f.id)}" target="_blank" rel="noopener">Inline ${icons.external}</a>
            </div>
          </div>
          <div class="card-padded">
            <div class="endpoint-box">
              <span><strong style="color:var(--accent);font-weight:700;">POST</strong> ${escapeHtml(endpoint)}</span>
              <button class="btn btn-secondary btn-sm" data-copy="${escapeHtml(endpoint)}">${icons.copy} Copy</button>
            </div>
            <div class="field-hint" style="margin-top:10px;">Zero-setup popout widget works on any website with a single <span class="mono">&lt;script&gt;</span> tag, or point any HTML <span class="mono">&lt;form&gt;</span> / <span class="mono">fetch()</span> directly to this URL.</div>
          </div>
        </div>

        <div class="card">
          <div class="card-section-header">
            <h2 class="card-section-label">Embed & Code Examples</h2>
            <button class="btn btn-secondary btn-sm" data-copy-snippet="1">${icons.copy} Copy snippet</button>
          </div>
          <div class="card-padded">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:14px;">
              <div class="filter-pills">
                <button class="filter-pill ${state.snippetLang === 'popout' ? 'active' : ''}" data-snippet="popout">Popout (Cart / Chat)</button>
                <button class="filter-pill ${state.snippetLang === 'embed' ? 'active' : ''}" data-snippet="embed">Inline Iframe</button>
                <button class="filter-pill ${state.snippetLang === 'html' ? 'active' : ''}" data-snippet="html">HTML</button>
                <button class="filter-pill ${state.snippetLang === 'fetch' ? 'active' : ''}" data-snippet="fetch">AJAX Fetch</button>
                <button class="filter-pill ${state.snippetLang === 'react' ? 'active' : ''}" data-snippet="react">React</button>
                <button class="filter-pill ${state.snippetLang === 'curl' ? 'active' : ''}" data-snippet="curl">cURL</button>
                <button class="filter-pill ${state.snippetLang === 'cloudflare' ? 'active' : ''}" data-snippet="cloudflare">Cloudflare</button>
              </div>
              ${
                state.snippetLang === 'popout'
                  ? `<div class="filter-pills">
                      <button type="button" class="filter-pill ${state.popoutMode === 'drawer' ? 'active' : ''}" data-popout-mode="drawer">Slide-Over Drawer</button>
                      <button type="button" class="filter-pill ${state.popoutMode === 'popover' ? 'active' : ''}" data-popout-mode="popover">Chat Window</button>
                    </div>`
                  : ''
              }
            </div>
            <pre class="code-block" id="integration-code">${escapeHtml(snippet)}</pre>
          </div>
        </div>
      </div>

      <div style="display:flex;flex-direction:column;gap:22px;min-width:0;">
        <div class="ai-prompt-card">
          <div class="ai-prompt-head">
            <span style="font-size:12.5px;font-weight:600;color:#e6fffa;">AI coding assistant prompt</span>
            <div class="toolbar-group">
              <button type="button" class="btn btn-sm" style="height:32px;padding:0 12px;background:rgba(255,255,255,0.1);color:#e6fffa;" data-action="toggle-ai-prompt">${state.aiPromptExpanded ? 'Collapse' : 'Expand'}</button>
              <button type="button" class="btn btn-sm" style="height:32px;padding:0 12px;background:var(--brand-mint);color:var(--brand-petrol-deep);font-weight:700;" data-copy="${escapeHtml(aiPrompt)}">${icons.copy} Copy</button>
            </div>
          </div>
          <pre class="ai-prompt-pre ${state.aiPromptExpanded ? 'expanded' : ''}">${escapeHtml(aiPrompt)}</pre>
        </div>

        <div class="card">
          <div class="card-section-header">
            <h2 class="card-section-label">Supported Directives</h2>
          </div>
          <div class="kv-list" style="margin:0;border:0;border-radius:0;">
            <div class="kv-row">
              <div class="cell-mono" style="color:var(--ink-primary);font-weight:600;margin-bottom:2px;">_gotcha</div>
              <div class="cell-secondary">Hidden honeypot spam trap; populated requests are silently quarantined.</div>
            </div>
            <div class="kv-row">
              <div class="cell-mono" style="color:var(--ink-primary);font-weight:600;margin-bottom:2px;">_replyto / email</div>
              <div class="cell-secondary">Sets Reply-To on owner alerts and sends customer auto-replies.</div>
            </div>
            <div class="kv-row">
              <div class="cell-mono" style="color:var(--ink-primary);font-weight:600;margin-bottom:2px;">_subject</div>
              <div class="cell-secondary">Custom subject with interpolation, e.g. <span class="mono">{{ name }}</span>.</div>
            </div>
            <div class="kv-row">
              <div class="cell-mono" style="color:var(--ink-primary);font-weight:600;margin-bottom:2px;">_next &amp; _cc</div>
              <div class="cell-secondary">Custom post-submit redirect URL and comma-separated CC recipients.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

const ACTION_CATALOG = [
  { group: 'Instant Mobile & Team Alerts', items: [
    { key: 'telegram', label: 'Telegram Bot', desc: 'Instant phone alert to owner chat', placeholder: 'https://api.telegram.org/bot<TOKEN>/sendMessage?chat_id=<ID>' },
    { key: 'slack', label: 'Slack Channel', desc: 'Formatted Block Kit lead message', placeholder: 'https://hooks.slack.com/services/...' },
    { key: 'discord', label: 'Discord Channel', desc: 'Rich embed notification card', placeholder: 'https://discord.com/api/webhooks/...' },
    { key: 'teams', label: 'Microsoft Teams', desc: 'MessageCard into Teams channel', placeholder: 'https://outlook.office.com/webhook/...' },
  ]},
  { group: 'Automation, CRM & Webhooks', items: [
    { key: 'generic', label: 'Make.com / Zapier / n8n', desc: 'Signed JSON envelope (HMAC-SHA256)', placeholder: 'https://hook.eu1.make.com/...' },
    { key: 'generic', label: 'Custom CRM Webhook', desc: 'HubSpot, Pipedrive, Xero or API', placeholder: 'https://api.yourcrm.com/webhooks/formflow' },
    { key: 'sink', label: 'Local Test Sink', desc: 'Inspect live signed delivery locally', placeholder: '/api/webhook-sink' },
  ]},
];

function renderFormWorkflowsTab(f) {
  const formatLabels = {
    generic: 'JSON',
    slack: 'Slack',
    discord: 'Discord',
    teams: 'Teams',
    telegram: 'Telegram',
  };

  const fields = Array.isArray(f.fields) ? f.fields : [];
  const validationRules = fields.filter((fld) => fld.required || fld.type === 'email' || fld.type === 'url');

  const hookCards = state.currentWebhooks
    .map(
      (wh) => `
      <div class="wf-action-card">
        <div class="wf-action-row">
          <div style="display:flex;align-items:center;gap:12px;min-width:0;">
            <span class="wf-action-icon">${icons.webhook}</span>
            <div style="min-width:0;">
              <div style="display:flex;align-items:center;gap:7px;flex-wrap:wrap;">
                <span class="cell-primary">${escapeHtml(wh.label)}</span>
                <span class="tag">${formatLabels[wh.format] || 'JSON'}</span>
                <span class="tag ${wh.is_active ? 'tag-success' : 'tag-warning'}">${wh.is_active ? 'Active' : 'Paused'}</span>
              </div>
              <div class="cell-mono" style="font-size:11.5px;color:var(--ink-muted);margin-top:2px;word-break:break-all;">${escapeHtml(wh.target_url)}</div>
            </div>
          </div>
          <div class="toolbar-group" style="flex-shrink:0;">
            <button class="btn btn-secondary btn-sm" data-test-wh="${escapeHtml(wh.id)}">Ping</button>
            <button class="btn btn-ghost btn-sm" data-toggle-wh="${escapeHtml(wh.id)}" data-wh-active="${wh.is_active ? '1' : '0'}">${wh.is_active ? 'Pause' : 'Enable'}</button>
            <button class="btn btn-ghost btn-sm" style="color:var(--danger);padding:0 7px;" data-delete-wh="${escapeHtml(wh.id)}" aria-label="Disconnect webhook">${icons.trash}</button>
          </div>
        </div>
      </div>
    `
    )
    .join('');

  return `
    <div class="workflow-shell">
      <h2 class="workflow-trigger-title">Form Submitted</h2>

      <div class="workflow-stepper">
        <!-- Step 1: Validations & Shield -->
        <div class="wf-step ${state.wfOpen.validations ? 'open' : ''}">
          <div class="wf-rail"><span class="wf-node"></span><span class="wf-line"></span></div>
          <div class="wf-card">
            <button type="button" class="wf-card-head" data-wf-toggle="validations">
              <span class="wf-head-left">
                <span class="wf-icon-badge">${icons.layers}</span>
                <span class="wf-title">Validations & Spam Shield <span class="wf-optional">(optional)</span></span>
              </span>
              <span style="display:inline-flex;align-items:center;gap:8px;">
                ${f.enable_honeypot ? '<span class="tag tag-accent">Honeypot</span>' : ''}
                ${f.turnstile_site_key ? '<span class="tag tag-success">Turnstile</span>' : ''}
                <span class="wf-chevron">${icons.chevron}</span>
              </span>
            </button>
            <div class="wf-body">
              <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
                <span class="cell-secondary" style="font-size:13px;">Active field checks enforced before dispatching notifications or webhooks.</span>
                <button type="button" class="btn btn-secondary btn-sm" data-form-tab="builder">Edit Fields</button>
              </div>
              <div class="wf-rule-grid">
                ${validationRules
                  .map(
                    (fld) => `
                    <div class="wf-rule-card">
                      <div style="display:flex;align-items:center;justify-content:space-between;">
                        <strong class="mono" style="font-size:12.5px;">${escapeHtml(fld.name)}</strong>
                        <span class="tag">${escapeHtml(fld.type)}${fld.required ? ' · required' : ''}</span>
                      </div>
                      <div class="cell-secondary" style="font-size:12px;">Used by Form Builder${fld.type === 'email' ? ' & Email Reply-To' : ''}</div>
                    </div>
                  `
                  )
                  .join('')}
              </div>
            </div>
          </div>
        </div>

        <!-- Step 2: Response -->
        <div class="wf-step ${state.wfOpen.response ? 'open' : ''}">
          <div class="wf-rail"><span class="wf-node"></span><span class="wf-line"></span></div>
          <div class="wf-card">
            <button type="button" class="wf-card-head" data-wf-toggle="response">
              <span class="wf-head-left">
                <span class="wf-icon-badge">${icons.globe}</span>
                <span class="wf-title">Response</span>
              </span>
              <span style="display:inline-flex;align-items:center;gap:8px;">
                ${f.review_gate_url ? '<span class="tag tag-accent">Review Gate</span>' : ''}
                <span class="wf-chevron">${icons.chevron}</span>
              </span>
            </button>
            <div class="wf-body">
              <div class="wf-branch-card">
                <span class="tag tag-danger" style="margin-bottom:8px;">If validation fails</span>
                <div class="cell-primary" style="font-size:13.5px;">Return inline validation error</div>
                <div class="cell-secondary">Returns HTTP 400 JSON for AJAX/Embed submissions, or a clean error page with a Back link for standard HTML forms.</div>
              </div>
              <div class="wf-branch-card">
                <span class="tag tag-success" style="margin-bottom:10px;">If submission succeeds</span>
                <form id="wf-redirect-form" style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
                  <input class="input" name="redirect_url" value="${escapeHtml(f.redirect_url || '')}" placeholder="${escapeHtml(state.baseUrl)}/thanks (default hosted confirmation)" style="flex:1;min-width:220px;" />
                  <button type="submit" class="btn btn-primary btn-sm">Save</button>
                </form>
                ${
                  f.review_gate_url
                    ? `<div class="field-hint" style="margin-top:8px;">Smart Review Gate active: 4–5 star visitors redirect to <span class="mono">${escapeHtml(f.review_gate_url)}</span>.</div>`
                    : ''
                }
              </div>
            </div>
          </div>
        </div>

        <!-- Step 3: Actions -->
        <div class="wf-step ${state.wfOpen.actions ? 'open' : ''}">
          <div class="wf-rail"><span class="wf-node"></span><span class="wf-line"></span></div>
          <div class="wf-card">
            <button type="button" class="wf-card-head" data-wf-toggle="actions">
              <span class="wf-head-left">
                <span class="wf-icon-badge">${icons.webhook}</span>
                <span class="wf-title">Actions</span>
              </span>
              <span style="display:inline-flex;align-items:center;gap:8px;">
                <span class="tag">${(f.email_recipients ? 1 : 0) + state.currentWebhooks.length} connected</span>
                <span class="wf-chevron">${icons.chevron}</span>
              </span>
            </button>
            <div class="wf-body">
              <!-- Active Email Plugin Card with Inline Gear Editor -->
              <div class="wf-action-card">
                <div class="wf-action-row">
                  <div style="display:flex;align-items:center;gap:12px;min-width:0;">
                    <span class="wf-action-icon">${icons.mail}</span>
                    <div style="min-width:0;">
                      <div class="cell-primary">Email ${escapeHtml(f.email_recipients || '(not configured)')}</div>
                      <div class="cell-secondary">Sends instant notification with one-tap Call & Reply buttons${f.send_autoresponse ? ' · Auto-reply enabled' : ''}</div>
                    </div>
                  </div>
                  <div class="toolbar-group">
                    <button type="button" class="btn btn-ghost btn-sm" data-nav="mail">Outbox</button>
                    <button type="button" class="btn btn-secondary btn-sm" style="padding:0 9px;" data-action="toggle-wf-email" title="Configure email action">${icons.gear}</button>
                  </div>
                </div>
                ${
                  state.wfEmailEditorOpen
                    ? `<form id="wf-email-form" class="wf-action-editor">
                        <div class="field-group">
                          <label class="field-label" for="wf-recipients">Send notifications to</label>
                          <input class="input" id="wf-recipients" name="email_recipients" value="${escapeHtml(f.email_recipients)}" placeholder="owner@business.com.au" />
                        </div>
                        <div class="toggle-row" style="padding:10px 0;">
                          <div>
                            <div class="cell-primary" style="font-size:13px;">Send customer auto-reply receipt</div>
                            <div class="cell-secondary">Automatically confirms receipt to the visitor's email address.</div>
                          </div>
                          <label class="toggle-switch">
                            <input type="checkbox" name="send_autoresponse" ${f.send_autoresponse ? 'checked' : ''} />
                            <span class="toggle-track"></span>
                          </label>
                        </div>
                        <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:12px;">
                          <button type="button" class="btn btn-secondary btn-sm" data-action="toggle-wf-email">Done</button>
                          <button type="submit" class="btn btn-primary btn-sm">Save email action</button>
                        </div>
                      </form>`
                    : ''
                }
              </div>

              ${hookCards}

              <!-- Categorized Integration Catalog Teaser -->
              <div class="wf-catalog-teaser">
                <div class="catalog-dots">
                  <span class="catalog-chip">Telegram</span>
                  <span class="catalog-chip">Slack</span>
                  <span class="catalog-chip">Microsoft Teams</span>
                  <span class="catalog-chip">Discord</span>
                  <span class="catalog-chip">Make / Zapier</span>
                  <span class="catalog-chip">CRM Webhook</span>
                </div>
                <div class="cell-secondary" style="margin-bottom:14px;">Route enquiries straight to your phone, team chat, or CRM with signed HMAC webhooks.</div>
                <button type="button" class="btn btn-primary btn-sm" data-action="open-action-catalog">${icons.plus} Add Action</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function openActionCatalogModal(preset = null) {
  els.modal.classList.remove('hidden');
  els.modalBackdrop.classList.remove('hidden');

  if (preset) {
    const isSink = preset.key === 'sink';
    els.modal.innerHTML = `
      <div class="drawer-header">
        <strong>Connect ${escapeHtml(preset.label)}</strong>
        <button class="btn btn-ghost btn-sm" data-action="close-modal" aria-label="Close">${icons.close}</button>
      </div>
      <form id="add-webhook-form" class="modal-body">
        <input type="hidden" name="format" value="${escapeHtml(isSink ? 'generic' : preset.key)}" />
        <div class="field-group">
          <label class="field-label" for="wh-label">Action label</label>
          <input class="input" id="wh-label" name="label" value="${escapeHtml(preset.label)}" required />
        </div>
        <div class="field-group">
          <label class="field-label" for="wh-url">Endpoint URL</label>
          <input class="input mono" id="wh-url" name="target_url" type="url" value="${escapeHtml(isSink ? `${state.baseUrl}/api/webhook-sink` : '')}" placeholder="${escapeHtml(preset.placeholder)}" required />
          <div class="field-hint">Signed automatically with <span class="mono">X-FormFlow-Signature: sha256=...</span>.</div>
        </div>
        <div style="display:flex;justify-content:space-between;margin-top:18px;">
          <button type="button" class="btn btn-secondary btn-sm" data-action="open-action-catalog">Back to catalog</button>
          <button type="submit" class="btn btn-primary btn-sm">Connect action</button>
        </div>
      </form>
    `;
    document.getElementById('wh-url')?.focus();
    return;
  }

  els.modal.innerHTML = `
    <div class="drawer-header">
      <strong>Add an action</strong>
      <button class="btn btn-ghost btn-sm" data-action="close-modal" aria-label="Close">${icons.close}</button>
    </div>
    <div class="modal-body">
      ${ACTION_CATALOG.map(
        (cat) => `
        <div class="kv-key" style="margin-bottom:8px;">${escapeHtml(cat.group)}</div>
        <div class="catalog-grid">
          ${cat.items
            .map(
              (item) => `
              <button type="button" class="catalog-item-btn" data-pick-action="${escapeHtml(item.key)}" data-pick-label="${escapeHtml(item.label)}" data-pick-ph="${escapeHtml(item.placeholder)}">
                <div>
                  <div class="cell-primary" style="font-size:13px;">${escapeHtml(item.label)}</div>
                  <div class="cell-secondary" style="font-size:11.5px;">${escapeHtml(item.desc)}</div>
                </div>
                <span style="color:var(--accent);">${icons.plus}</span>
              </button>
            `
            )
            .join('')}
        </div>
      `
      ).join('')}
    </div>
  `;
}

function renderFormSettingsTab(f) {
  return `
    <form id="form-settings-form" style="display:flex;flex-direction:column;gap:20px;">
      <div class="card card-padded">
        <h2 class="section-title">General</h2>
        <div class="form-grid-2">
          <div class="field-group">
            <label class="field-label" for="set-name">Form name</label>
            <input class="input" id="set-name" name="name" value="${escapeHtml(f.name)}" required />
          </div>
          <div class="field-group">
            <label class="field-label" for="set-client">Client / Group</label>
            <input class="input" id="set-client" name="client_name" value="${escapeHtml(f.client_name)}" />
          </div>
        </div>

        <div class="form-grid-2">
          <div class="field-group" style="margin-bottom:0;">
            <label class="field-label" for="set-recipients">Send enquiries to (Email)</label>
            <input class="input" id="set-recipients" name="email_recipients" value="${escapeHtml(f.email_recipients)}" placeholder="hello@yourbusiness.com.au" />
            <div class="field-hint">Separate multiple emails with a comma.</div>
          </div>
          <div class="field-group" style="margin-bottom:0;">
            <label class="field-label" for="set-redirect">Thank-you page URL (optional)</label>
            <input class="input" id="set-redirect" name="redirect_url" value="${escapeHtml(f.redirect_url)}" placeholder="Leave blank for default confirmation" />
          </div>
        </div>
      </div>

      <div class="card card-padded">
        <h2 class="section-title">Spam protection &amp; status</h2>

        <div class="toggle-row" style="padding-top:0;">
          <div>
            <div class="cell-primary">Automatic spam protection</div>
            <div class="cell-secondary">Silently blocks spam bots without adding puzzles for real visitors.</div>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" name="enable_honeypot" ${f.enable_honeypot ? 'checked' : ''} />
            <span class="toggle-track"></span>
          </label>
        </div>

        <div class="toggle-row">
          <div>
            <div class="cell-primary">Form active</div>
            <div class="cell-secondary">Turn off to temporarily pause incoming enquiries on this form.</div>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" name="is_active" ${f.is_active ? 'checked' : ''} />
            <span class="toggle-track"></span>
          </label>
        </div>

        <details style="margin-top:14px;padding-top:12px;border-top:1px solid var(--border-subtle);">
          <summary style="cursor:pointer;font-size:13px;font-weight:600;color:var(--ink-secondary);">Advanced security options (optional)</summary>
          <div style="margin-top:14px;">
            <div class="form-grid-2">
              <div class="field-group">
                <label class="field-label" for="set-origins">Restrict to website domains</label>
                <input class="input mono" id="set-origins" name="allowed_origins" value="${escapeHtml(f.allowed_origins || '*')}" placeholder="* (all domains)" />
              </div>
              <div class="field-group">
                <label class="field-label" for="set-rate">Max submissions per hour</label>
                <input class="input" id="set-rate" name="rate_limit_per_hour" type="number" min="1" value="${escapeHtml(f.rate_limit_per_hour || 60)}" />
              </div>
            </div>
            <div class="form-grid-2">
              <div class="field-group" style="margin-bottom:0;">
                <label class="field-label" for="set-ts-site">Cloudflare Turnstile Site Key</label>
                <input class="input mono" id="set-ts-site" name="turnstile_site_key" value="${escapeHtml(f.turnstile_site_key || '')}" placeholder="Optional" />
              </div>
              <div class="field-group" style="margin-bottom:0;">
                <label class="field-label" for="set-ts-secret">Cloudflare Turnstile Secret Key</label>
                <input class="input mono" id="set-ts-secret" name="turnstile_secret_key" type="password" value="${escapeHtml(f.turnstile_secret_key || '')}" placeholder="Optional" autocomplete="new-password" />
              </div>
            </div>
          </div>
        </details>
      </div>

      <div class="card card-padded">
        <h2 class="section-title">Auto-responder</h2>
        <div class="toggle-row" style="padding-top:0;">
          <div>
            <div class="cell-primary">Send confirmation receipt to submitter</div>
            <div class="cell-secondary">Uses the submitted email or _replyto field.</div>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" name="send_autoresponse" ${f.send_autoresponse ? 'checked' : ''} />
            <span class="toggle-track"></span>
          </label>
        </div>

        <div class="field-group" style="margin-top:16px;">
          <label class="field-label" for="set-auto-subj">Subject</label>
          <input class="input" id="set-auto-subj" name="autoresponse_subject" value="${escapeHtml(f.autoresponse_subject)}" />
        </div>
        <div class="field-group" style="margin-bottom:0;">
          <label class="field-label" for="set-auto-body">Message</label>
          <textarea class="textarea" id="set-auto-body" name="autoresponse_body">${escapeHtml(f.autoresponse_body)}</textarea>
        </div>
      </div>

      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
        <div class="toolbar-group">
          <button type="button" class="btn btn-secondary btn-sm" data-archive-form="${escapeHtml(f.id)}" data-target-archive="${f.is_archived ? '0' : '1'}">${f.is_archived ? `${icons.restore} Restore form` : `${icons.archive} Archive form`}</button>
          <button type="button" class="btn btn-danger btn-sm" data-clear-subs="${escapeHtml(f.id)}">Clear submissions</button>
          <button type="button" class="btn btn-danger btn-sm" data-delete-form="${escapeHtml(f.id)}">${icons.trash} Delete form</button>
        </div>
        <button type="submit" class="btn btn-primary">Save settings</button>
      </div>
    </form>
  `;
}

// ============================================================
// VIEW: LIVE SANDBOX
// ============================================================
function renderSandboxView() {
  const targetForm = state.forms.find((f) => f.id === state.sandboxFormId) || state.forms[0];
  const endpoint = targetForm ? `${state.baseUrl}/f/${targetForm.id}` : '';
  const res = state.sandboxResult;

  els.content.innerHTML = `
    <div class="page-band">
      <div class="page-band-inner">
        <div class="page-band-top">
          <h1 class="page-band-title">Live Sandbox</h1>
          <div class="toolbar-group">
            ${
              targetForm
                ? `<button class="endpoint-pill" data-copy="${escapeHtml(endpoint)}" title="Copy endpoint URL">
                    <span class="endpoint-method">POST</span>
                    <span>/f/${escapeHtml(targetForm.id)}</span>
                    ${icons.copy}
                  </button>
                  <button class="btn btn-secondary" data-open-form="${escapeHtml(targetForm.id)}">Open Form</button>`
                : `<button class="btn btn-primary" data-action="open-create-modal">${icons.plus} New Form</button>`
            }
          </div>
        </div>
      </div>
    </div>

    <div class="content-inner">
      <div class="content-container view-animate">
        <div class="split-grid">
      <div class="card card-padded">
        <form id="sandbox-form">
          <div class="form-grid-2">
            <div class="field-group">
              <label class="field-label" for="sb-form">Target endpoint</label>
              <select class="select" id="sb-form" name="formId">
                ${state.forms
                  .map(
                    (f) => `<option value="${escapeHtml(f.id)}" ${f.id === targetForm?.id ? 'selected' : ''}>${escapeHtml(f.name)} (/f/${escapeHtml(f.id)})</option>`
                  )
                  .join('')}
              </select>
            </div>
            <div class="field-group">
              <label class="field-label" for="sb-mode">Content encoding</label>
              <select class="select" id="sb-mode" name="mode">
                <option value="json" ${state.sandboxMode === 'json' ? 'selected' : ''}>application/json</option>
                <option value="urlencoded" ${state.sandboxMode === 'urlencoded' ? 'selected' : ''}>application/x-www-form-urlencoded</option>
                <option value="multipart" ${state.sandboxMode === 'multipart' ? 'selected' : ''}>multipart/form-data (with file)</option>
              </select>
            </div>
          </div>

          <div class="form-grid-2">
            <div class="field-group">
              <label class="field-label" for="sb-name">name</label>
              <input class="input" id="sb-name" name="name" value="Jordan Taylor" required />
            </div>
            <div class="field-group">
              <label class="field-label" for="sb-email">email</label>
              <input class="input" id="sb-email" name="email" type="email" value="jordan@client-review.com.au" required />
            </div>
          </div>

          <div class="form-grid-2">
            <div class="field-group">
              <label class="field-label" for="sb-website">website</label>
              <input class="input" id="sb-website" name="website" value="https://client-review.com.au" />
            </div>
            <div class="field-group">
              <label class="field-label" for="sb-subject">_subject (directive)</label>
              <input class="input mono" id="sb-subject" name="_subject" value="Review Request — {{ name }}" />
            </div>
          </div>

          <div class="field-group">
            <label class="field-label" for="sb-message">message</label>
            <textarea class="textarea" id="sb-message" name="message">Testing live ingestion, SQLite storage, notification email rendering, and HMAC webhook delivery.</textarea>
          </div>

          ${
            state.sandboxMode === 'multipart'
              ? `<div class="field-group">
                  <label class="field-label" for="sb-file">attachment (file upload)</label>
                  <input class="input" id="sb-file" name="attachment" type="file" />
                </div>`
              : ''
          }

          <div class="toggle-row" style="margin-bottom:18px;border-top:1px solid var(--border-subtle);">
            <div>
              <div class="cell-primary">Simulate spam bot</div>
              <div class="cell-secondary">Populates hidden <span class="mono">_gotcha</span> field to verify honeypot interception.</div>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" id="sb-bot" ${state.sandboxSimulateBot ? 'checked' : ''} />
              <span class="toggle-track"></span>
            </label>
          </div>

          <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
            <span class="cell-mono">POST /f/${escapeHtml(targetForm?.id || '')}</span>
            <button type="submit" class="btn btn-primary">${icons.send} Dispatch request</button>
          </div>
        </form>
      </div>

      <div class="card card-padded">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:16px;">
          <h2 class="section-title" style="margin:0;">Pipeline inspector</h2>
          ${
            res
              ? `<span class="tag ${res.status >= 200 && res.status < 300 ? 'tag-success' : 'tag-danger'}">HTTP ${res.status} · ${res.durationMs}ms</span>`
              : '<span class="tag">Idle</span>'
          }
        </div>

        ${
          !res
            ? `<div class="empty-state" style="padding:36px 12px;">
                <div class="empty-state-title">Ready to send</div>
                <p>Dispatch a live POST request to inspect pipeline stages, rate-limit headers, and the JSON response.</p>
              </div>`
            : `
              <div style="margin-bottom:18px;">
                <div class="kv-key" style="margin-bottom:8px;">Execution trace</div>
                <ul class="trace-list">
                  ${(res.body?.trace || [])
                    .map(
                      (t) => `
                      <li class="trace-item">
                        <div>
                          <strong style="text-transform:uppercase;font-size:11px;letter-spacing:0.04em;">${escapeHtml(t.step)}</strong>
                          <div style="color:var(--ink-secondary);margin-top:2px;">${escapeHtml(t.detail)}</div>
                        </div>
                        <span class="tag ${t.status === 'passed' ? 'tag-success' : t.status === 'intercepted' ? 'tag-danger' : 'tag-warning'}">${escapeHtml(t.status)}</span>
                      </li>
                    `
                    )
                    .join('')}
                </ul>
              </div>

              <div style="margin-bottom:16px;">
                <div class="kv-key" style="margin-bottom:6px;">Response headers</div>
                <pre class="code-block code-block-wrap" style="padding:12px 14px;">${escapeHtml(
                  Object.entries(res.headers || {})
                    .map(([k, v]) => `${k}: ${v}`)
                    .join('\n')
                )}</pre>
              </div>

              <div style="margin-bottom:16px;">
                <div class="kv-key" style="margin-bottom:6px;">Response body</div>
                <pre class="code-block code-block-wrap" style="padding:12px 14px;">${escapeHtml(JSON.stringify(res.body, null, 2))}</pre>
              </div>

              <div style="display:flex;gap:8px;flex-wrap:wrap;">
                <button class="btn btn-secondary btn-sm" data-open-form="${escapeHtml(res.formId)}">View in Inbox</button>
                <button class="btn btn-secondary btn-sm" data-nav="mail">Inspect Email</button>
                <button class="btn btn-secondary btn-sm" data-nav="webhooks">Inspect Webhooks</button>
              </div>
            `
        }
      </div>
    </div>
      </div>
    </div>
  `;
}

// ============================================================
// VIEW: MAIL OUTBOX (Unified Activity Page Band)
// ============================================================
function renderMailOutboxView() {
  const logs = state.mailLogs || [];
  const s = state.stats || {};
  const selected = logs.find((m) => m.id === state.selectedMailId) || logs[0] || null;
  if (selected && state.selectedMailId !== selected.id) {
    state.selectedMailId = selected.id;
  }

  els.content.innerHTML = `
    <div class="page-band has-tabs">
      <div class="page-band-inner">
        <div class="page-band-top">
          <h1 class="page-band-title">Activity</h1>
          <div class="toolbar-group">
            <button class="btn btn-primary" data-action="open-create-modal">${icons.plus} New Form</button>
          </div>
        </div>

        <div class="underline-tabs" role="tablist">
          <button class="underline-tab active" data-nav="mail">
            Mail Outbox <span class="tab-count">${logs.length}</span>
          </button>
          <button class="underline-tab" data-nav="webhooks">
            Webhook Logs <span class="tab-count">${s.webhookTotal ?? (state.webhookLogs || []).length}</span>
          </button>
        </div>
      </div>
    </div>

    <div class="content-inner">
      <div class="content-container view-animate">
        ${
          logs.length === 0
            ? `<div class="card"><div class="empty-state"><div class="empty-state-title">No emails dispatched yet</div><p>Submit a form in the Sandbox to inspect the rendered notification email.</p></div></div>`
            : `
              <div class="mail-layout">
                <div class="mail-list">
                  ${logs
                    .map(
                      (m) => `
                      <button class="mail-item ${selected?.id === m.id ? 'active' : ''}" data-select-mail="${escapeHtml(m.id)}">
                        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:4px;">
                          <span class="tag ${m.kind === 'auto-reply' ? 'tag-accent' : ''}" style="font-size:11px;padding:1px 8px;">${escapeHtml(m.kind)}</span>
                          <span class="cell-secondary" style="font-size:11.5px;">${formatRelativeTime(m.created_at)}</span>
                        </div>
                        <div class="cell-primary" style="font-size:13.5px;margin-bottom:2px;">${escapeHtml(m.subject)}</div>
                        <div class="cell-secondary" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">To: ${escapeHtml(m.to_addresses)}</div>
                      </button>
                    `
                    )
                    .join('')}
                </div>

                <div class="mail-preview">
                  ${
                    selected
                      ? `
                        <div class="mail-meta-header">
                          <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:10px;">
                            <strong style="font-size:15px;">${escapeHtml(selected.subject)}</strong>
                            <div class="filter-pills">
                              <button class="filter-pill ${state.mailPreviewMode === 'html' ? 'active' : ''}" data-mail-mode="html">HTML</button>
                              <button class="filter-pill ${state.mailPreviewMode === 'text' ? 'active' : ''}" data-mail-mode="text">Plain Text</button>
                              <button class="filter-pill ${state.mailPreviewMode === 'headers' ? 'active' : ''}" data-mail-mode="headers">Headers</button>
                            </div>
                          </div>
                          <div class="cell-secondary" style="line-height:1.6;">
                            <div><strong>To:</strong> ${escapeHtml(selected.to_addresses)}</div>
                            ${selected.reply_to ? `<div><strong>Reply-To:</strong> ${escapeHtml(selected.reply_to)}</div>` : ''}
                            ${selected.cc_addresses ? `<div><strong>CC:</strong> ${escapeHtml(selected.cc_addresses)}</div>` : ''}
                            <div><strong>Form:</strong> ${escapeHtml(selected.form_name)} · ${formatTimestamp(selected.created_at)}</div>
                          </div>
                        </div>

                        ${
                          state.mailPreviewMode === 'html'
                            ? `<iframe class="mail-iframe" id="mail-iframe" sandbox="allow-same-origin"></iframe>`
                            : state.mailPreviewMode === 'text'
                            ? `<div style="padding:20px;"><pre class="code-block">${escapeHtml(selected.text_body)}</pre></div>`
                            : `<div style="padding:20px;"><pre class="code-block">${escapeHtml(
                                [
                                  `Message-ID: <${selected.id}@formflow.local>`,
                                  `Transport: ${selected.transport}`,
                                  `To: ${selected.to_addresses}`,
                                  selected.cc_addresses ? `Cc: ${selected.cc_addresses}` : null,
                                  selected.reply_to ? `Reply-To: ${selected.reply_to}` : null,
                                  `Subject: ${selected.subject}`,
                                  `X-FormFlow-Form: ${selected.form_id}`,
                                  `X-FormFlow-Submission: ${selected.submission_id || 'n/a'}`,
                                  `Date: ${selected.created_at}`,
                                ]
                                  .filter(Boolean)
                                  .join('\n')
                              )}</pre></div>`
                        }
                      `
                      : ''
                  }
                </div>
              </div>
            `
        }
      </div>
    </div>
  `;

  if (selected && state.mailPreviewMode === 'html') {
    const iframe = document.getElementById('mail-iframe');
    if (iframe) {
      iframe.srcdoc = selected.html_body;
    }
  }
}

// ============================================================
// VIEW: WEBHOOK LOGS (Unified Activity Page Band)
// ============================================================
function renderWebhookLogsView() {
  const logs = state.webhookLogs || [];
  const s = state.stats || {};

  const rows = logs
    .map((log) => {
      const expanded = state.expandedWebhookLogId === log.id;
      return `
        <tr class="clickable" data-expand-whlog="${escapeHtml(log.id)}">
          <td>
            <span class="tag ${log.success ? 'tag-success' : 'tag-danger'}">${log.response_status || 'ERR'}</span>
          </td>
          <td>
            <div class="cell-primary">${escapeHtml(log.form_name)}</div>
            <div class="cell-mono" style="margin-top:2px;">${escapeHtml(log.target_url)}</div>
          </td>
          <td class="cell-mono">${log.duration_ms}ms</td>
          <td class="cell-secondary">${formatRelativeTime(log.created_at)}</td>
        </tr>
        ${
          expanded
            ? `<tr>
                <td colspan="4" style="background:var(--bg-subtle);padding:16px 18px;">
                  <div class="form-grid-2">
                    <div>
                      <div class="kv-key" style="margin-bottom:6px;">Request headers & HMAC</div>
                      <pre class="code-block code-block-wrap" style="padding:12px;">${escapeHtml(JSON.stringify(log.request_headers, null, 2))}</pre>
                    </div>
                    <div>
                      <div class="kv-key" style="margin-bottom:6px;">Response body</div>
                      <pre class="code-block code-block-wrap" style="padding:12px;">${escapeHtml(log.response_body || '(empty)')}</pre>
                    </div>
                  </div>
                  <div style="margin-top:14px;">
                    <div class="kv-key" style="margin-bottom:6px;">Dispatched JSON payload</div>
                    <pre class="code-block code-block-wrap" style="padding:12px;">${escapeHtml(JSON.stringify(log.request_body, null, 2))}</pre>
                  </div>
                </td>
              </tr>`
            : ''
        }
      `;
    })
    .join('');

  els.content.innerHTML = `
    <div class="page-band has-tabs">
      <div class="page-band-inner">
        <div class="page-band-top">
          <h1 class="page-band-title">Activity</h1>
          <div class="toolbar-group">
            <button class="btn btn-primary" data-action="open-create-modal">${icons.plus} New Form</button>
          </div>
        </div>

        <div class="underline-tabs" role="tablist">
          <button class="underline-tab" data-nav="mail">
            Mail Outbox <span class="tab-count">${s.emailsSent ?? (state.mailLogs || []).length}</span>
          </button>
          <button class="underline-tab active" data-nav="webhooks">
            Webhook Logs <span class="tab-count">${logs.length}</span>
          </button>
        </div>
      </div>
    </div>

    <div class="content-inner">
      <div class="content-container view-animate">
        <div class="card">
          ${
            logs.length === 0
              ? `<div class="empty-state"><div class="empty-state-title">No webhook deliveries recorded</div><p>Add a webhook under any form's Workflows tab and send a test ping or submission.</p></div>`
              : `<div class="table-wrap">
                  <table class="data-table">
                    <thead>
                      <tr>
                        <th>Status</th>
                        <th>Form & Target URL</th>
                        <th>Latency</th>
                        <th>Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                  </table>
                </div>`
          }
        </div>
      </div>
    </div>
  `;
}

// ============================================================
// SUBMISSION DETAIL DRAWER
// ============================================================
function openSubmissionDrawer(subId) {
  const sub = state.submissions.find((s) => s.id === subId);
  if (!sub) return;
  state.selectedSubmission = sub;
  state.drawerRawJson = false;
  renderDrawer();
}

function closeDrawer() {
  state.selectedSubmission = null;
  els.drawer.classList.add('hidden');
  els.drawerBackdrop.classList.add('hidden');
  els.drawer.setAttribute('aria-hidden', 'true');
}

function renderDrawer() {
  const sub = state.selectedSubmission;
  if (!sub) return;

  els.drawer.classList.remove('hidden');
  els.drawerBackdrop.classList.remove('hidden');
  els.drawer.setAttribute('aria-hidden', 'false');

  const fieldRows = Object.entries(sub.data || {})
    .map(
      ([k, v]) => `
      <div class="kv-row">
        <div class="kv-key">${escapeHtml(k)}</div>
        <div class="kv-val">${escapeHtml(Array.isArray(v) ? v.join(', ') : v)}</div>
      </div>
    `
    )
    .join('');

  const attachmentRows =
    sub.attachments?.length > 0
      ? `
      <div class="kv-key" style="margin-bottom:8px;">Attachments & site photos</div>
      <div class="kv-list">
        ${sub.attachments
          .map(
            (att) => `
          <div class="kv-row" style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
            <div style="display:flex;align-items:center;gap:12px;min-width:0;">
              ${
                (att.mimeType || '').startsWith('image/')
                  ? `<img src="${escapeHtml(att.url)}" alt="${escapeHtml(att.originalName)}" style="width:48px;height:48px;border-radius:8px;object-fit:cover;border:1px solid var(--border);flex-shrink:0;" />`
                  : ''
              }
              <div style="min-width:0;">
                <div class="cell-primary" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(att.originalName)}</div>
                <div class="cell-secondary">${escapeHtml(att.mimeType)} · ${Math.max(1, Math.round(att.size / 1024))} KB</div>
              </div>
            </div>
            <a class="btn btn-secondary btn-sm" href="${escapeHtml(att.url)}" target="_blank" rel="noopener">Open</a>
          </div>
        `
          )
          .join('')}
      </div>`
      : '';

  els.drawer.innerHTML = `
    <div class="drawer-header">
      <div>
        <div style="display:flex;align-items:center;gap:8px;">
          <strong>${escapeHtml(sub.sender_name || sub.sender_email || 'Submission')}</strong>
          <span class="tag ${sub.is_spam ? 'tag-danger' : 'tag-success'}">${sub.is_spam ? 'Spam' : 'Inbox'}</span>
        </div>
        <div class="cell-mono" style="margin-top:3px;">${escapeHtml(sub.id)}</div>
      </div>
      <button class="btn btn-ghost btn-sm" data-action="close-drawer" aria-label="Close">${icons.close}</button>
    </div>

    <div class="drawer-body">
      ${
        sub.spam_reason
          ? `<div class="card card-padded" style="padding:14px 16px;margin-bottom:18px;background:var(--danger-soft);border-color:#f0cbc8;color:var(--danger);font-size:13px;">
              <strong>Spam trigger:</strong> ${escapeHtml(sub.spam_reason)}
            </div>`
          : ''
      }

      ${
        !sub.is_spam
          ? `<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:18px;padding:12px 14px;background:var(--bg-subtle);border:1px solid var(--border);border-radius:var(--radius-sm);">
              <span class="kv-key" style="margin:0;">Enquiry status</span>
              <div class="filter-pills">
                <button type="button" class="filter-pill ${(sub.status || 'new') === 'new' ? 'active' : ''}" data-sub-status="${escapeHtml(sub.id)}" data-status-val="new">New</button>
                <button type="button" class="filter-pill ${sub.status === 'replied' ? 'active' : ''}" data-sub-status="${escapeHtml(sub.id)}" data-status-val="replied">Replied</button>
                <button type="button" class="filter-pill ${sub.status === 'closed' ? 'active' : ''}" data-sub-status="${escapeHtml(sub.id)}" data-status-val="closed">Closed</button>
              </div>
            </div>`
          : ''
      }

      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
        <div class="kv-key" style="margin:0;">Enquiry details</div>
        <button class="btn btn-ghost btn-sm" data-action="toggle-drawer-json">${state.drawerRawJson ? 'Structured view' : 'Raw JSON'}</button>
      </div>

      ${
        state.drawerRawJson
          ? `<pre class="code-block" style="margin-bottom:20px;">${escapeHtml(JSON.stringify(sub.data, null, 2))}</pre>`
          : `<div class="kv-list">${fieldRows || '<div class="kv-row">No fields recorded.</div>'}</div>`
      }

      ${attachmentRows}

      <div class="field-group" style="margin-bottom:20px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
          <label class="kv-key" for="drawer-note-input" style="margin:0;">Internal notes</label>
          <button type="button" class="btn btn-secondary btn-sm" style="height:26px;padding:0 10px;font-size:11.5px;" data-save-note="${escapeHtml(sub.id)}">Save note</button>
        </div>
        <textarea class="textarea" id="drawer-note-input" style="min-height:70px;" placeholder="Add follow-up notes for your team...">${escapeHtml(sub.notes || '')}</textarea>
      </div>

      <div class="kv-key" style="margin-bottom:8px;">Request metadata</div>
      <div class="kv-list" style="margin-bottom:0;">
        <div class="kv-row"><div class="kv-key">Received</div><div class="kv-val">${formatTimestamp(sub.created_at)}</div></div>
        <div class="kv-row"><div class="kv-key">Origin</div><div class="kv-val">${escapeHtml(sub.origin || 'Direct POST')}</div></div>
        <div class="kv-row"><div class="kv-key">Client IP</div><div class="kv-val mono">${escapeHtml(sub.sender_ip || '127.0.0.1')}</div></div>
        <div class="kv-row"><div class="kv-key">Content-Type</div><div class="kv-val mono">${escapeHtml(sub.content_type || 'unknown')}</div></div>
        <div class="kv-row"><div class="kv-key">User-Agent</div><div class="kv-val" style="font-size:12.5px;color:var(--ink-secondary);">${escapeHtml(sub.user_agent || '—')}</div></div>
      </div>
    </div>

    <div class="drawer-footer">
      <div class="toolbar-group">
        ${
          sub.sender_email
            ? `<a class="btn btn-primary btn-sm" href="mailto:${encodeURIComponent(sub.sender_email)}?subject=${encodeURIComponent(`Re: ${sub.subject || 'Your enquiry'}`)}">${icons.mail} Reply</a>`
            : ''
        }
        ${
          sub.data?.phone
            ? `<a class="btn btn-secondary btn-sm" href="tel:${encodeURIComponent(String(sub.data.phone))}">Call</a>`
            : ''
        }
        <button class="btn btn-secondary btn-sm" data-drawer-spam="${escapeHtml(sub.id)}" data-target-spam="${sub.is_spam ? '0' : '1'}">
          ${icons.shield} ${sub.is_spam ? 'Restore' : 'Spam'}
        </button>
      </div>
      <button class="btn btn-danger btn-sm" data-drawer-delete="${escapeHtml(sub.id)}">
        ${icons.trash} Delete
      </button>
    </div>
  `;
}

// ============================================================
// CREATE FORM MODAL
// ============================================================
function openCreateModal(defaultClientName = '') {
  els.modal.classList.remove('hidden');
  els.modalBackdrop.classList.remove('hidden');
  const partner = isPartnerSession();

  els.modal.innerHTML = `
    <div class="drawer-header">
      <strong>Create a new form</strong>
      <button class="btn btn-ghost btn-sm" data-action="close-modal" aria-label="Close">${icons.close}</button>
    </div>
    <form id="create-form-modal" class="modal-body">
      <div class="field-group">
        <label class="field-label" for="new-name">Form name</label>
        <input class="input" id="new-name" name="name" placeholder="e.g. Quote Request or Contact Us" required />
      </div>

      ${
        partner || defaultClientName
          ? `<div class="field-group">
               <label class="field-label" for="new-client">Client business name</label>
               <input class="input" id="new-client" name="client_name" value="${escapeHtml(defaultClientName)}" placeholder="e.g. Harbour Plumbing Co" />
             </div>`
          : `<input type="hidden" name="client_name" value="${escapeHtml(state.workspace?.brand_name || 'Website')}" />`
      }

      <div class="field-group">
        <label class="field-label" for="new-recipients">Send enquiries to (Email)</label>
        <input class="input" id="new-recipients" name="email_recipients" type="email" placeholder="hello@yourbusiness.com.au" />
      </div>

      <div class="field-group">
        <label class="field-label" for="new-template">Starting fields</label>
        <select class="select" id="new-template" name="template">
          <option value="general">General Contact (Name, Email, Phone, Message)</option>
          <option value="trades">Quote Request (Service Dropdown, Suburb, Photo Upload)</option>
          <option value="callback">Quick Callback (Name, Phone, Best Time Dropdown)</option>
          <option value="blank">Blank Form (build your own fields from scratch)</option>
        </select>
        <div class="field-hint">You can add or edit dropdowns, checklists, text fields, and uploads on the next screen.</div>
      </div>

      <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:20px;">
        <button type="button" class="btn btn-secondary" data-action="close-modal">Cancel</button>
        <button type="submit" class="btn btn-primary">Create Form &amp; Edit Fields</button>
      </div>
    </form>
  `;

  document.getElementById('new-name')?.focus();
}

function openDeployModal() {
  els.modal.classList.remove('hidden');
  els.modalBackdrop.classList.remove('hidden');

  const cfCmd = `npx wrangler d1 create formflow\nnpx wrangler d1 execute formflow --file=./cloudflare/migrations/0001_init.sql\nnpx wrangler pages deploy public`;
  const dockerCmd = `docker compose up -d`;

  els.modal.innerHTML = `
    <div class="drawer-header">
      <strong>Client deployment targets</strong>
      <button class="btn btn-ghost btn-sm" data-action="close-modal" aria-label="Close">${icons.close}</button>
    </div>
    <div class="modal-body" style="display:flex;flex-direction:column;gap:18px;">
      <div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
          <strong style="font-size:14px;">Cloudflare Pages (Free Tier)</strong>
          <span class="tag tag-accent">100k req/day · D1 SQLite</span>
        </div>
        <pre class="code-block code-block-wrap" style="padding:12px 14px;">${escapeHtml(cfCmd)}</pre>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;">
          <span class="cell-secondary">Starter files included in <span class="mono">cloudflare/</span></span>
          <button class="btn btn-secondary btn-sm" data-copy="${escapeHtml(cfCmd)}">${icons.copy} Copy</button>
        </div>
      </div>

      <div style="border-top:1px solid var(--border-subtle);padding-top:16px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
          <strong style="font-size:14px;">Self-Hosted Docker / Node 22</strong>
          <span class="tag">Zero external deps</span>
        </div>
        <pre class="code-block" style="padding:12px 14px;">${escapeHtml(dockerCmd)}</pre>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;">
          <span class="cell-secondary">Persists SQLite DB & uploads in <span class="mono">/data</span></span>
          <button class="btn btn-secondary btn-sm" data-copy="${escapeHtml(dockerCmd)}">${icons.copy} Copy</button>
        </div>
      </div>
    </div>
  `;
}

function closeModal() {
  els.modal.classList.add('hidden');
  els.modalBackdrop.classList.add('hidden');
}

// ============================================================
// VIEW: BRAND & HOSTING (CUSTOMER WHITE-LABEL & HANDOFF)
// ============================================================
function renderWorkspaceView() {
  const ws = state.workspace || {};
  const accentSwatches = [
    { hex: '#14383e', label: 'Deep Petrol' },
    { hex: '#1d4f56', label: 'Ocean Teal' },
    { hex: '#4fd1c5', label: 'Mint Turquoise' },
    { hex: '#f6ad55', label: 'Warm Amber' },
    { hex: '#718096', label: 'Slate Grey' },
    { hex: '#1e3a5f', label: 'Cobalt Ink' },
  ];
  const bgSwatches = [
    { hex: '#f7fafc', label: 'Off-White' },
    { hex: '#ffffff', label: 'Pure White' },
    { hex: '#f1f5f9', label: 'Cool Slate' },
    { hex: '#f5f4f0', label: 'Warm Alabaster' },
  ];

  const firstFormId = state.forms[0]?.id || '';
  const hasDemoForms = state.forms.some((f) => ['audit-intake', 'sintiro-contact', 'centella-enquiry', 'teagee-brief'].includes(f.id));
  const isCustomBrand = Boolean(ws.brand_name && ws.brand_name !== 'AskForms') || Boolean(ws.website_url);
  const isEmailLive = ws.email_provider === 'resend' && ws.has_resend_key;
  const readyCount = [isCustomBrand, isEmailLive, Boolean(ws.owner_pin_enabled && ws.auth_enabled), !hasDemoForms].filter(Boolean).length;

  els.content.innerHTML = `
    <div class="page-band has-tabs">
      <div class="page-band-inner">
        <div class="page-band-top">
          <h1 class="page-band-title">Brand & Setup</h1>
          <div class="toolbar-group">
            <button type="button" class="btn btn-secondary" data-action="export-brand-kit">${icons.download} Brand Kit</button>
            <label class="btn btn-secondary" style="cursor:pointer;">
              Import
              <input type="file" id="import-brand-input" accept="application/json,.json" style="display:none;" />
            </label>
            <a class="btn btn-secondary" href="/api/workspace/backup.json">${icons.download} Full Backup</a>
          </div>
        </div>

        <div class="underline-tabs" role="tablist">
          <button class="underline-tab active" data-nav="workspace">Brand & Hosting</button>
          <button class="underline-tab" data-nav="setup">Setup Wizard</button>
        </div>
      </div>
    </div>

    <div class="content-inner">
      <div class="content-container view-animate">
        <div class="card card-padded" style="margin-bottom:22px;">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;margin-bottom:16px;">
            <h2 class="section-title" style="margin:0;">First-Client Production Readiness</h2>
            <div class="toolbar-group">
              <span class="tag ${readyCount === 4 ? 'tag-success' : 'tag-accent'}">${readyCount} of 4 Ready</span>
              ${hasDemoForms ? `<button type="button" class="btn btn-secondary btn-sm" data-action="clear-demo-data">${icons.trash} Clear Demo Forms</button>` : ''}
              <button type="button" class="btn btn-primary btn-sm" data-nav="setup">${icons.wizard} Run 4-Step Client Wizard</button>
            </div>
          </div>
          <div class="utility-strip">
            <div class="wf-rule-card">
              <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
                <span class="cell-primary" style="font-size:13.5px;">1. Client Brand & Domain</span>
                <span class="tag ${isCustomBrand ? 'tag-success' : 'tag-warning'}">${isCustomBrand ? 'Configured' : 'Default'}</span>
              </div>
              <div class="cell-secondary" style="font-size:12px;">Set client name, logo, accent colour, and <span class="mono">PUBLIC_URL</span> for embed links.</div>
            </div>
            <div class="wf-rule-card">
              <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
                <span class="cell-primary" style="font-size:13.5px;">2. Live Email Delivery</span>
                <span class="tag ${isEmailLive ? 'tag-success' : 'tag-warning'}">${isEmailLive ? 'Resend Live' : 'Local Preview'}</span>
              </div>
              <div class="cell-secondary" style="font-size:12px;">Switch provider to <strong>Resend HTTP API</strong> and paste your free <span class="mono">re_...</span> key below.</div>
            </div>
            <div class="wf-rule-card">
              <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
                <span class="cell-primary" style="font-size:13.5px;">3. Security & Owner PIN</span>
                <span class="tag ${ws.owner_pin_enabled && ws.auth_enabled ? 'tag-success' : 'tag-warning'}">${ws.owner_pin_enabled && ws.auth_enabled ? 'Locked' : 'Open Setup'}</span>
              </div>
              <div class="cell-secondary" style="font-size:12px;">Set a 6-digit Owner PIN for <span class="mono">/manage</span> and an Admin Password for <span class="mono">/</span>.</div>
            </div>
            <div class="wf-rule-card">
              <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
                <span class="cell-primary" style="font-size:13.5px;">4. Demo Forms Cleanup</span>
                <span class="tag ${!hasDemoForms ? 'tag-success' : 'tag-warning'}">${!hasDemoForms ? 'Clean' : '4 Demo Forms'}</span>
              </div>
              <div class="cell-secondary" style="font-size:12px;">Archive, delete, or click <strong>Clear Demo Forms</strong> before handing off to your client.</div>
            </div>
          </div>
        </div>

        <div class="card card-padded" style="margin-bottom:22px;">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;margin-bottom:14px;">
            <div>
              <h2 class="section-title" style="margin:0;">Single-Domain License &amp; Activation (1 Key = 1 Website)</h2>
              <div class="cell-secondary">
                ${
                  ws.license?.isLicensed
                    ? `Verified Ed25519 Lifetime License · Locked exclusively to <strong>${escapeHtml(ws.license.licensedDomain)}</strong> (${escapeHtml(ws.license.holder)})`
                    : `Live Preview Mode active (${ws.license?.previewRemaining ?? 5} of ${ws.license?.previewLimit ?? 10} test enquiries remaining). Enter a signed ASK1 key to lock to your client's production domain.`
                }
              </div>
            </div>
            <div class="toolbar-group">
              <span class="tag ${ws.license?.isLicensed ? 'tag-success' : 'tag-warning'}">
                ${ws.license?.isLicensed ? `Licensed · ${escapeHtml(ws.license.licensedDomain)}` : 'Preview Mode'}
              </span>
              <a class="btn btn-secondary btn-sm" href="/site" target="_blank" rel="noopener">askforms.app Landing &amp; Key Generator ${icons.external}</a>
            </div>
          </div>
          <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
            <input class="input mono" id="ws-license-key-input" placeholder="${ws.has_license_key ? `Active (${escapeHtml(ws.license_key_preview)}) — paste new ASK1 key to replace` : 'Paste single-domain license key (ASK1.eyJ...)'}" style="flex:1;min-width:260px;" />
            <button type="button" class="btn btn-primary btn-sm" data-action="activate-license">Activate Domain Key</button>
            ${ws.has_license_key ? `<button type="button" class="btn btn-ghost btn-sm" data-action="remove-license">Switch to Preview Mode</button>` : ''}
          </div>
        </div>

        ${
          !isDemoMode()
            ? `<div class="card card-padded" style="margin-bottom:22px;">
                <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:12px;">
                  <div>
                    <h2 class="section-title" style="margin:0;">Partner &amp; Admin Key Generator ($0 Cost)</h2>
                    <div class="cell-secondary">Generate domain-locked client keys for your own sites or partner clients at $0 cost without overwriting this workspace.</div>
                  </div>
                  <span class="tag tag-accent">Partner Only</span>
                </div>
                <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
                  <input class="input mono" id="partner-key-domain" placeholder="clientwebsite.com.au" style="flex:1;min-width:200px;" />
                  <input class="input" id="partner-key-holder" placeholder="Client Business Name" style="flex:1;min-width:200px;" />
                  <button type="button" class="btn btn-primary btn-sm" data-action="partner-mint-key">Generate Client Key ($0)</button>
                </div>
                ${
                  state.partnerIssuedKey
                    ? `<div style="margin-top:14px;padding:12px 14px;border-radius:10px;background:var(--accent-soft);border:1px solid var(--border-subtle);">
                        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px;">
                          <strong style="font-size:13px;color:var(--text-primary);">Client Key Minted for ${escapeHtml(state.partnerIssuedKey.domain)}</strong>
                          <button type="button" class="btn btn-secondary btn-sm" data-copy="${escapeHtml(state.partnerIssuedKey.key)}">Copy Key</button>
                        </div>
                        <pre class="mono" style="margin:0;font-size:11.5px;white-space:pre-wrap;word-break:break-all;color:var(--text-primary);">${escapeHtml(state.partnerIssuedKey.key)}</pre>
                      </div>`
                    : ''
                }
              </div>`
            : ''
        }

        <form id="workspace-settings-form" style="display:flex;flex-direction:column;gap:22px;">
      <div class="split-grid">
        <div class="card card-padded">
          <h2 class="section-title">Brand identity</h2>
          <div class="form-grid-2">
            <div class="field-group">
              <label class="field-label" for="ws-brand">Brand name</label>
              <input class="input" id="ws-brand" name="brand_name" value="${escapeHtml(ws.brand_name)}" required />
            </div>
            <div class="field-group">
              <label class="field-label" for="ws-holder">License holder</label>
              <input class="input" id="ws-holder" name="license_holder" value="${escapeHtml(ws.license_holder)}" placeholder="Client Business Pty Ltd" />
            </div>
          </div>

          <div class="form-grid-2">
            <div class="field-group">
              <label class="field-label" for="ws-website">Website URL</label>
              <input class="input" id="ws-website" name="website_url" type="url" value="${escapeHtml(ws.website_url)}" placeholder="https://yourcompany.com.au" />
            </div>
            <div class="field-group">
              <label class="field-label" for="ws-support">Support email</label>
              <input class="input" id="ws-support" name="support_email" type="email" value="${escapeHtml(ws.support_email)}" placeholder="hello@yourcompany.com.au" />
            </div>
          </div>

          <div class="field-group">
            <label class="field-label">Brand logo</label>
            <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
              <label class="btn btn-secondary btn-sm" style="cursor:pointer;">
                Upload SVG / PNG
                <input type="file" id="ws-logo-file" accept="image/svg+xml,image/png,image/jpeg,image/webp" style="display:none;" />
              </label>
              <a class="btn btn-secondary btn-sm" href="/brand/askforms-logo.svg" download="askforms-logo.svg">${icons.download} Export Logo (.svg)</a>
              <a class="btn btn-secondary btn-sm" href="/brand/askforms-mark.svg" download="askforms-mark.svg">${icons.download} Export Mark (.svg)</a>
              <input class="input" id="ws-logo-url" name="logo_url" value="${escapeHtml(ws.logo_url)}" placeholder="Or paste logo URL (/uploads/...)" style="flex:1;min-width:160px;" />
              ${
                ws.logo_url
                  ? `<button type="button" class="btn btn-ghost btn-sm" data-action="remove-logo">Remove</button>`
                  : ''
              }
            </div>
          </div>

          <div class="field-group">
            <label class="field-label" for="ws-accent">Primary accent colour</label>
            <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
              <input type="color" class="color-picker-native" id="ws-accent-picker" value="${escapeHtml(ws.accent_color || '#095c4f')}" aria-label="Pick accent colour" />
              <div class="swatch-row">
                ${accentSwatches
                  .map(
                    (sw) => `<button type="button" class="swatch-btn ${ws.accent_color?.toLowerCase() === sw.hex ? 'active' : ''}" style="background:${sw.hex};" data-swatch="${sw.hex}" title="${sw.label}" aria-label="${sw.label}"></button>`
                  )
                  .join('')}
              </div>
              <input class="input mono" id="ws-accent" name="accent_color" value="${escapeHtml(ws.accent_color || '#095c4f')}" style="width:110px;" pattern="^#[0-9a-fA-F]{6}$" />
            </div>
          </div>

          <div class="field-group">
            <label class="field-label" for="ws-bg">Page background colour</label>
            <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
              <input type="color" class="color-picker-native" id="ws-bg-picker" value="${escapeHtml(ws.bg_color || '#f7f5f2')}" aria-label="Pick background colour" />
              <div class="swatch-row">
                ${bgSwatches
                  .map(
                    (sw) => `<button type="button" class="swatch-btn swatch-btn-light ${ws.bg_color?.toLowerCase() === sw.hex ? 'active' : ''}" style="background:${sw.hex};" data-bg-swatch="${sw.hex}" title="${sw.label}" aria-label="${sw.label}"></button>`
                  )
                  .join('')}
              </div>
              <input class="input mono" id="ws-bg" name="bg_color" value="${escapeHtml(ws.bg_color || '#f7f5f2')}" style="width:110px;" pattern="^#[0-9a-fA-F]{6}$" />
            </div>
          </div>

          <div class="form-grid-2">
            <div class="field-group" style="margin-bottom:0;">
              <label class="field-label" for="ws-font">Typography pairing</label>
              <select class="select" id="ws-font" name="font_preset">
                <option value="minimal" ${ws.font_preset === 'minimal' ? 'selected' : ''}>Minimal (Inter)</option>
                <option value="editorial" ${ws.font_preset === 'editorial' ? 'selected' : ''}>Editorial (Merriweather + Inter)</option>
                <option value="modern" ${ws.font_preset === 'modern' ? 'selected' : ''}>Modern (Inter Clean)</option>
                <option value="classic" ${ws.font_preset === 'classic' ? 'selected' : ''}>Classic (Merriweather Serif)</option>
              </select>
            </div>
            <div class="field-group" style="margin-bottom:0;">
              <label class="field-label" for="ws-radius">Corners & buttons</label>
              <select class="select" id="ws-radius" name="radius_preset">
                <option value="balanced" ${ws.radius_preset === 'balanced' ? 'selected' : ''}>Balanced (12px · Pill buttons)</option>
                <option value="soft" ${ws.radius_preset === 'soft' ? 'selected' : ''}>Soft Studio (26px · Pill buttons)</option>
                <option value="sharp" ${ws.radius_preset === 'sharp' ? 'selected' : ''}>Architectural (8px · Square buttons)</option>
              </select>
            </div>
          </div>
        </div>

        <div class="card card-padded" style="position:sticky;top:84px;">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:14px;">
            <h2 class="section-title" style="margin:0;">Live brand preview</h2>
            <div class="toolbar-group">
              ${
                firstFormId
                  ? `<a class="btn btn-secondary btn-sm" href="/demo/${encodeURIComponent(firstFormId)}?theme=brand" target="_blank" rel="noopener">Hosted Form ${icons.external}</a>`
                  : ''
              }
              <a class="btn btn-secondary btn-sm" href="/thanks" target="_blank" rel="noopener">/thanks ${icons.external}</a>
            </div>
          </div>

          <div class="brand-preview-stage" id="brand-preview-stage">
            <div class="brand-preview-card">
              <div id="preview-logo-slot" style="margin-bottom:12px;">
                ${
                  ws.logo_url
                    ? `<img src="${escapeHtml(ws.logo_url)}" alt="" style="max-height:26px;max-width:140px;object-fit:contain;display:block;" />`
                    : `<span class="cell-secondary" style="text-transform:uppercase;letter-spacing:0.05em;font-weight:600;color:var(--accent);">${escapeHtml(ws.brand_name || 'AskForms')}</span>`
                }
              </div>
              <div id="preview-title" style="font-family:var(--font-display);font-size:22px;font-weight:500;letter-spacing:-0.02em;margin-bottom:14px;">Contact us</div>
              <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:16px;">
                <div style="height:34px;border:1px solid var(--border);border-radius:var(--radius-sm);background:var(--bg-surface);padding:0 10px;display:flex;align-items:center;font-size:12.5px;color:var(--ink-faint);">alex@client.com.au</div>
                <div style="height:56px;border:1px solid var(--border);border-radius:var(--radius-sm);background:var(--bg-surface);padding:8px 10px;font-size:12.5px;color:var(--ink-faint);">Tell us about your project...</div>
              </div>
              <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;">
                <span class="btn btn-primary btn-sm" style="pointer-events:none;">Send inquiry</span>
                <span class="cell-mono" style="font-size:11px;">POST /f/contact</span>
              </div>
            </div>
          </div>

          <div style="margin-top:18px;">
            <div class="field-group">
              <label class="field-label" for="ws-thanks-h">Hosted /thanks heading</label>
              <input class="input" id="ws-thanks-h" name="thanks_heading" value="${escapeHtml(ws.thanks_heading)}" />
            </div>
            <div class="field-group">
              <label class="field-label" for="ws-thanks-b">Hosted /thanks message</label>
              <input class="input" id="ws-thanks-b" name="thanks_body" value="${escapeHtml(ws.thanks_body)}" />
            </div>
            <div class="field-group" style="margin-bottom:0;">
              <label class="field-label" for="ws-email-footer">Email footer line</label>
              <input class="input" id="ws-email-footer" name="email_footer" value="${escapeHtml(ws.email_footer)}" placeholder="Northshore Architects · Sydney NSW" />
            </div>
          </div>
        </div>
      </div>

      <div class="card card-padded">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px;">
          <h2 class="section-title" style="margin:0;">Outbound email transport</h2>
          <span class="tag ${ws.email_provider === 'resend' && ws.has_resend_key ? 'tag-success' : ''}">
            ${ws.email_provider === 'resend' && ws.has_resend_key ? 'Live via Resend API' : 'Local Outbox Preview'}
          </span>
        </div>

        <div class="form-grid-2">
          <div class="field-group">
            <label class="field-label" for="ws-provider">Provider</label>
            <select class="select" id="ws-provider" name="email_provider">
              <option value="local" ${ws.email_provider === 'local' ? 'selected' : ''}>Local Mail Outbox (Preview only)</option>
              <option value="resend" ${ws.email_provider === 'resend' ? 'selected' : ''}>Resend HTTP API (Live delivery)</option>
            </select>
          </div>
          <div class="field-group">
            <label class="field-label" for="ws-from">Sender address (From)</label>
            <input class="input" id="ws-from" name="mail_from" value="${escapeHtml(ws.mail_from)}" placeholder="forms@yourdomain.com.au" />
          </div>
        </div>

        <div class="field-group" style="margin-bottom:0;">
          <label class="field-label" for="ws-resend">Resend API key</label>
          <input class="input mono" id="ws-resend" name="resend_api_key" type="password" placeholder="${ws.has_resend_key ? `Saved (${ws.resend_api_key_preview}) — enter new key to replace` : 're_xxxxxxxxx'}" autocomplete="new-password" />
          <div class="field-hint">Resend includes 3,000 free emails/month and works over HTTPS on any host or Cloudflare Pages without SMTP ports.</div>
        </div>
      </div>

      <div class="card card-padded">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px;">
          <h2 class="section-title" style="margin:0;">Dashboard & Owner Portal security</h2>
          <div class="toolbar-group">
            <span class="tag ${ws.owner_pin_enabled ? 'tag-success' : ''}">${ws.owner_pin_enabled ? 'Owner PIN Active' : 'No Owner PIN'}</span>
            <span class="tag ${ws.auth_enabled ? 'tag-success' : 'tag-warning'}">${ws.auth_enabled ? 'Admin Locked' : 'Admin Open'}</span>
          </div>
        </div>

        <div class="form-grid-2">
          <div class="field-group" style="margin-bottom:0;">
            <label class="field-label" for="ws-pass">${ws.auth_enabled ? 'Change designer admin password' : 'Designer admin password'}</label>
            <input class="input" id="ws-pass" name="new_admin_password" type="password" minlength="6" placeholder="${ws.auth_from_env ? 'Controlled via ADMIN_PASSWORD env' : 'Minimum 6 characters'}" ${ws.auth_from_env ? 'disabled' : ''} autocomplete="new-password" />
            <div class="field-hint">Protects the full Designer Console (<span class="mono">/</span>).</div>
          </div>
          <div class="field-group" style="margin-bottom:0;">
            <label class="field-label" for="ws-owner-pin">Owner Portal 6-digit PIN (<span class="mono">/manage</span>)</label>
            <input class="input mono" id="ws-owner-pin" name="new_owner_pin" type="password" inputmode="numeric" maxlength="6" placeholder="${ws.owner_pin_enabled ? 'PIN saved — enter 6 digits to change' : 'e.g. 246810'}" autocomplete="new-password" />
            <div class="field-hint">Simple phone PIN for the client's <a href="/manage" target="_blank" style="text-decoration:underline;">/manage</a> Daily Ops portal.</div>
          </div>
        </div>
        ${
          (ws.auth_enabled && !ws.auth_from_env) || ws.owner_pin_enabled
            ? `<div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap;">
                ${ws.auth_enabled && !ws.auth_from_env ? '<button type="button" class="btn btn-secondary btn-sm" data-action="disable-auth">Remove admin password</button>' : ''}
                ${ws.owner_pin_enabled ? '<button type="button" class="btn btn-secondary btn-sm" data-action="disable-owner-pin">Remove owner PIN</button>' : ''}
              </div>`
            : ''
        }
      </div>

      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
        <button type="button" class="btn btn-danger btn-sm" data-action="clear-demo-data">
          ${icons.trash} Clear demo data for client handoff
        </button>
        <button type="submit" class="btn btn-primary">Save brand & hosting settings</button>
      </div>
        </form>
      </div>
    </div>
  `;
}

// ============================================================
// VIEW: 4-STEP DESIGNER SETUP WIZARD (/setup)
// ============================================================
const PLATFORM_INSTRUCTIONS = {
  webflow: 'In Webflow Designer, drag an Embed element onto your Contact or Quote section and paste this code.',
  wordpress: 'In WordPress (Gutenberg, Elementor, or Bricks), add a Custom HTML block and paste this code.',
  squarespace: 'In Squarespace, add a Code Block (HTML mode) on your contact page and paste this code.',
  wix: 'In Wix Studio or Editor, add an Embed HTML element and paste this code.',
  html: 'Paste directly inside any <section> on your static HTML, Astro, or Cloudflare Pages site.',
};

function renderSetupWizardView() {
  const step = state.setupStep;
  const d = state.setupData;
  const ws = state.workspace || {};
  const formId = d.created_form_id || state.forms[0]?.id || 'contact';
  const activeAccent = d.accent_color || ws.accent_color || '#14383e';
  const embedSnippet = `<!-- Zero-setup AskForms Slide-Over Drawer & Floating Launcher -->\n<script src="${state.baseUrl}/widget.js" data-form="${formId}" data-mode="${state.popoutMode}" data-label="Get a Quote" data-title="${d.form_name || 'Website Enquiry'}" data-accent="${activeAccent}" defer></script>\n<!-- Optional: link any existing button on their site to #askforms-${formId} -->`;

  const steps = ['1. Brand', '2. Alerts & PIN', '3. Form', '4. Handoff'];
  const activeBrand = d.brand_name || ws.brand_name || 'AskForms';
  const tplLabel = ENQUIRY_TEMPLATES[d.template]?.label || 'Trades & Quote';

  els.content.innerHTML = `
    <div class="page-band has-tabs">
      <div class="page-band-inner">
        <div class="page-band-top">
          <h1 class="page-band-title">Brand & Setup</h1>
          <div class="toolbar-group">
            <button type="button" class="btn btn-secondary" data-action="export-brand-kit">${icons.download} Brand Kit</button>
            <label class="btn btn-secondary" style="cursor:pointer;">
              Import
              <input type="file" id="import-brand-input" accept="application/json,.json" style="display:none;" />
            </label>
            <a class="btn btn-secondary" href="/api/workspace/backup.json">${icons.download} Full Backup</a>
          </div>
        </div>

        <div class="underline-tabs" role="tablist">
          <button class="underline-tab" data-nav="workspace">Brand & Hosting</button>
          <button class="underline-tab active" data-nav="setup">Setup Wizard</button>
        </div>
      </div>
    </div>

    <div class="content-inner">
      <div class="content-container view-animate">
        <div class="split-grid-wide">
          <div class="card card-padded">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:22px;padding-bottom:18px;border-bottom:1px solid var(--border-subtle);">
              <h2 class="section-title" style="margin:0;">4-Step Client Setup</h2>
              <div class="filter-pills">
                ${steps
                  .map(
                    (label, idx) =>
                      `<button type="button" class="filter-pill ${step === idx + 1 ? 'active' : ''}" data-setup-step="${idx + 1}">${label}</button>`
                  )
                  .join('')}
              </div>
            </div>
      ${
        step === 1
          ? `
            <div class="form-grid-2">
              <div class="field-group">
                <label class="field-label" for="wiz-brand">Client business name</label>
                <input class="input" id="wiz-brand" value="${escapeHtml(d.brand_name || ws.brand_name)}" placeholder="Harbour Plumbing Co" />
              </div>
              <div class="field-group">
                <label class="field-label" for="wiz-url">Client website URL</label>
                <input class="input" id="wiz-url" type="url" value="${escapeHtml(d.website_url || ws.website_url)}" placeholder="https://harbourplumbing.com.au" />
              </div>
            </div>
            <div class="form-grid-3" style="margin-bottom:22px;">
              <div class="field-group" style="margin-bottom:0;">
                <label class="field-label" for="wiz-accent">Brand accent colour</label>
                <div style="display:flex;gap:8px;align-items:center;">
                  <input type="color" class="color-picker-native" id="wiz-accent-pick" value="${escapeHtml(activeAccent)}" />
                  <input class="input mono" id="wiz-accent" value="${escapeHtml(activeAccent)}" />
                </div>
              </div>
              <div class="field-group" style="margin-bottom:0;">
                <label class="field-label" for="wiz-font">Typography</label>
                <select class="select" id="wiz-font">
                  <option value="minimal" ${(d.font_preset || ws.font_preset) === 'minimal' ? 'selected' : ''}>Minimal (Inter)</option>
                  <option value="editorial" ${(d.font_preset || ws.font_preset) === 'editorial' ? 'selected' : ''}>Editorial (Merriweather + Inter)</option>
                  <option value="modern" ${(d.font_preset || ws.font_preset) === 'modern' ? 'selected' : ''}>Modern (Inter Clean)</option>
                  <option value="classic" ${(d.font_preset || ws.font_preset) === 'classic' ? 'selected' : ''}>Classic (Merriweather Serif)</option>
                </select>
              </div>
              <div class="field-group" style="margin-bottom:0;">
                <label class="field-label" for="wiz-radius">Corners</label>
                <select class="select" id="wiz-radius">
                  <option value="balanced" ${(d.radius_preset || ws.radius_preset) === 'balanced' ? 'selected' : ''}>Balanced (Pill)</option>
                  <option value="soft" ${(d.radius_preset || ws.radius_preset) === 'soft' ? 'selected' : ''}>Soft Studio</option>
                  <option value="sharp" ${(d.radius_preset || ws.radius_preset) === 'sharp' ? 'selected' : ''}>Architectural</option>
                </select>
              </div>
            </div>
            <div style="display:flex;justify-content:flex-end;">
              <button type="button" class="btn btn-primary" data-wizard-next="2">Continue to Alerts & PIN</button>
            </div>
          `
          : step === 2
          ? `
            <div class="form-grid-2">
              <div class="field-group">
                <label class="field-label" for="wiz-email">Owner notification email</label>
                <input class="input" id="wiz-email" type="email" value="${escapeHtml(d.owner_email)}" placeholder="owner@harbourplumbing.com.au" />
              </div>
              <div class="field-group">
                <label class="field-label" for="wiz-pin">6-digit Owner Portal PIN (<span class="mono">/manage</span>)</label>
                <input class="input mono" id="wiz-pin" maxlength="6" inputmode="numeric" value="${escapeHtml(d.owner_pin)}" placeholder="246810" />
                <div class="field-hint">Gives the client mobile access to enquiries without seeing technical settings.</div>
              </div>
            </div>
            <div class="form-grid-2">
              <div class="field-group">
                <label class="field-label" for="wiz-alert-fmt">Instant mobile alert channel (optional)</label>
                <select class="select" id="wiz-alert-fmt">
                  <option value="telegram" ${d.alert_format === 'telegram' ? 'selected' : ''}>Telegram Bot</option>
                  <option value="slack" ${d.alert_format === 'slack' ? 'selected' : ''}>Slack Channel</option>
                  <option value="teams" ${d.alert_format === 'teams' ? 'selected' : ''}>Microsoft Teams</option>
                  <option value="generic" ${d.alert_format === 'generic' ? 'selected' : ''}>Make / Zapier / CRM Webhook</option>
                </select>
              </div>
              <div class="field-group">
                <label class="field-label" for="wiz-alert-url">Webhook / Bot endpoint URL (optional)</label>
                <input class="input" id="wiz-alert-url" type="url" value="${escapeHtml(d.alert_url)}" placeholder="https://api.telegram.org/bot.../sendMessage?chat_id=..." />
              </div>
            </div>
            <div style="display:flex;justify-content:space-between;">
              <button type="button" class="btn btn-secondary" data-setup-step="1">Back</button>
              <button type="button" class="btn btn-primary" data-wizard-next="3">Continue to Enquiry Form</button>
            </div>
          `
          : step === 3
          ? `
            <div class="form-grid-2">
              <div class="field-group">
                <label class="field-label" for="wiz-fname">Form title</label>
                <input class="input" id="wiz-fname" value="${escapeHtml(d.form_name)}" placeholder="Request a Quote" />
              </div>
              <div class="field-group">
                <label class="field-label" for="wiz-tpl">SMB form template</label>
                <select class="select" id="wiz-tpl">
                  <option value="trades" ${d.template === 'trades' ? 'selected' : ''}>Trades & Quote (with Photo Upload)</option>
                  <option value="general" ${d.template === 'general' ? 'selected' : ''}>Local Business Contact</option>
                  <option value="callback" ${d.template === 'callback' ? 'selected' : ''}>Quick Callback Request (3 fields)</option>
                  <option value="feedback" ${d.template === 'feedback' ? 'selected' : ''}>Private Feedback / Google Review Gate</option>
                </select>
              </div>
            </div>
            <div class="toggle-row" style="border-top:1px solid var(--border-subtle);margin-bottom:14px;">
              <div>
                <div class="cell-primary">Multi-step quote flow</div>
                <div class="cell-secondary">Splits fields into 2 clean steps to lower form abandonment on mobile.</div>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" id="wiz-multistep" ${d.multi_step ? 'checked' : ''} />
                <span class="toggle-track"></span>
              </label>
            </div>
            <div class="field-group">
              <label class="field-label" for="wiz-review">Google Business Review URL (optional — enables 1–5 star Review Gate)</label>
              <input class="input" id="wiz-review" type="url" value="${escapeHtml(d.review_gate_url)}" placeholder="https://g.page/r/your-client/review" />
            </div>
            <div style="display:flex;justify-content:space-between;">
              <button type="button" class="btn btn-secondary" data-setup-step="2">Back</button>
              <button type="button" class="btn btn-primary" data-wizard-finish="1">Provision client setup</button>
            </div>
          `
          : `
            <div style="margin-bottom:14px;">
              <div class="filter-pills">
                ${Object.keys(PLATFORM_INSTRUCTIONS)
                  .map((p) => {
                    const names = { webflow: 'Webflow', wordpress: 'WordPress', squarespace: 'Squarespace', wix: 'Wix', html: 'Custom HTML' };
                    return `<button type="button" class="filter-pill ${state.embedPlatform === p ? 'active' : ''}" data-embed-platform="${p}">${names[p] || p}</button>`;
                  })
                  .join('')}
              </div>
            </div>
            <p class="cell-secondary" style="margin:0 0 12px;font-size:13px;">${escapeHtml(PLATFORM_INSTRUCTIONS[state.embedPlatform])}</p>
            <pre class="code-block code-block-wrap" style="margin-bottom:14px;">${escapeHtml(embedSnippet)}</pre>
            <div style="display:flex;gap:10px;margin-bottom:22px;flex-wrap:wrap;">
              <button type="button" class="btn btn-primary btn-sm" data-copy="${escapeHtml(embedSnippet)}">${icons.copy} Copy popout script</button>
              <button type="button" class="btn btn-secondary btn-sm" data-test-popout="${escapeHtml(formId)}" data-test-mode="drawer">${icons.popout} Test Slide-Over Drawer</button>
              <button type="button" class="btn btn-secondary btn-sm" data-test-popout="${escapeHtml(formId)}" data-test-mode="popover">Test Chat Window</button>
            </div>

            <div class="kv-list" style="margin-bottom:18px;">
              <div class="kv-row" style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
                <div>
                  <div class="kv-key">Client phone bookmark (Owner Daily Ops Portal)</div>
                  <div class="kv-val mono">${escapeHtml(state.baseUrl)}/manage</div>
                </div>
                <div class="toolbar-group">
                  <button type="button" class="btn btn-secondary btn-sm" data-copy="${escapeHtml(state.baseUrl)}/manage">${icons.copy} Copy link</button>
                  <a class="btn btn-dark btn-sm" href="/manage" target="_blank" rel="noopener">Open /manage ${icons.external}</a>
                </div>
              </div>
            </div>

            <div style="display:flex;justify-content:space-between;">
              <button type="button" class="btn btn-secondary" data-setup-step="3">Back</button>
              <button type="button" class="btn btn-primary" data-open-form="${escapeHtml(formId)}">Open form workspace</button>
            </div>
          `
      }
          </div>

          <div class="card-petrol card-padded" style="position:sticky;top:104px;">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:16px;">
              <h2 class="section-title" style="margin:0;">Handoff Summary</h2>
              <span class="tag tag-accent">Step ${step} of 4</span>
            </div>
            <div class="kv-list" style="margin-bottom:18px;">
              <div class="kv-row" style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
                <div>
                  <div class="kv-key">Client brand</div>
                  <div class="kv-val" style="font-weight:600;">${escapeHtml(activeBrand)}</div>
                </div>
                <span style="width:24px;height:24px;border-radius:50%;background:${escapeHtml(activeAccent)};border:2px solid rgba(255,255,255,0.28);flex-shrink:0;" title="${escapeHtml(activeAccent)}"></span>
              </div>
              <div class="kv-row">
                <div class="kv-key">Owner alerts</div>
                <div class="kv-val">${escapeHtml(d.owner_email || 'Pending configuration')}</div>
              </div>
              <div class="kv-row">
                <div class="kv-key">Daily Ops PIN</div>
                <div class="kv-val mono">${d.owner_pin ? '•••••• (6-digit active)' : 'Not set'}</div>
              </div>
              <div class="kv-row">
                <div class="kv-key">Primary form</div>
                <div class="kv-val">${escapeHtml(d.form_name || 'Website Enquiry')} · ${escapeHtml(tplLabel)}</div>
              </div>
            </div>
            <div style="display:flex;flex-direction:column;gap:10px;">
              <a class="btn btn-mint" href="/manage" target="_blank" rel="noopener" style="width:100%;">Preview Owner Portal ${icons.external}</a>
              <button type="button" class="btn btn-hero-ghost" data-action="open-deploy-modal" style="width:100%;">${icons.deploy} Deployment Commands</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ============================================================
// LOGIN SCREEN (WHEN ADMIN PASSWORD IS ACTIVE)
// ============================================================
function syncSidebarToggleState() {
  if (!els.sidebarRailToggle) return;
  const expanded = window.innerWidth > 1120
    ? !els.app.classList.contains('sidebar-collapsed')
    : els.app.classList.contains('sidebar-open');
  els.sidebarRailToggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
  els.sidebarRailToggle.setAttribute('aria-label', expanded ? 'Collapse sidebar' : 'Expand sidebar');
  els.sidebarRailToggle.setAttribute('title', expanded ? 'Collapse sidebar ([)' : 'Expand sidebar ([)');
}

function toggleSidebarPane() {
  if (window.innerWidth > 1120) {
    const collapsed = els.app.classList.toggle('sidebar-collapsed');
    try {
      localStorage.setItem('formsflow_sidebar_collapsed', collapsed ? '1' : '0');
    } catch {}
  } else {
    els.app.classList.toggle('sidebar-open');
  }
  syncSidebarToggleState();
}

function launchLivePopoutPreview(formId, mode = 'drawer') {
  const form = state.forms.find((f) => f.id === formId) || state.currentForm;
  const title = form?.name || 'Website Enquiry';
  if (window.AskForms) {
    window.AskForms.open({ formId, mode, title });
    return;
  }
  const script = document.createElement('script');
  script.src = `/widget.js?v=${Date.now()}`;
  script.setAttribute('data-form', formId);
  script.setAttribute('data-mode', mode);
  script.setAttribute('data-launcher', 'false');
  script.setAttribute('data-label', form?.submit_label || 'Get a Quote');
  script.setAttribute('data-title', title);
  script.setAttribute('data-accent', state.workspace?.accent_color || '#14383e');
  script.onload = () => {
    if (window.AskForms) {
      window.AskForms.open({ formId, mode, title });
    }
  };
  document.body.appendChild(script);
}

function renderAssistantView() {
  const msgs = state.assistantMessages || [];
  const draft = state.assistantDraftForm;

  els.content.innerHTML = `
    <div class="page-band">
      <div class="page-band-inner">
        <div class="page-band-top">
          <h1 class="page-band-title">AI Assistant</h1>
          <div class="toolbar-group">
            <button type="button" class="btn btn-secondary btn-sm" data-action="open-ai-settings">AI &amp; MCP Settings</button>
            <button type="button" class="btn btn-ghost btn-sm" data-action="assistant-clear">Clear</button>
          </div>
        </div>
      </div>
    </div>

    <div class="content-inner">
      <div class="content-container view-animate" style="max-width:780px;">
        <div class="card" style="display:flex;flex-direction:column;height:calc(100vh - 230px);min-height:460px;overflow:hidden;">
        <div id="assistant-chat-log" style="flex:1;overflow-y:auto;padding:22px;display:flex;flex-direction:column;gap:12px;">
          ${msgs
            .map(
              (m) => `
              <div style="align-self:${m.role === 'user' ? 'flex-end' : 'flex-start'};max-width:82%;padding:12px 16px;border-radius:${m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px'};font-size:14px;line-height:1.58;white-space:pre-wrap;background:${m.role === 'user' ? 'var(--accent)' : 'var(--bg-subtle)'};color:${m.role === 'user' ? '#ffffff' : 'var(--text-primary)'};">${escapeHtml(m.text)}</div>
            `
            )
            .join('')}

          ${
            draft
              ? `<div style="align-self:flex-start;width:100%;max-width:82%;padding:14px 16px;border-radius:14px;background:var(--accent-soft);border:1px solid var(--border-subtle);display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
                  <div>
                    <strong style="font-size:14px;color:var(--text-primary);">${escapeHtml(draft.name)}</strong>
                    <div class="cell-secondary">${draft.fields.length} fields · ${draft.multi_step ? '2-Step Layout' : 'Single-Step Layout'}</div>
                  </div>
                  <button type="button" class="btn btn-primary btn-sm" data-action="assistant-create-draft">Create Form</button>
                </div>`
              : ''
          }
        </div>

        <div style="padding:14px 18px;border-top:1px solid var(--border-subtle);background:var(--bg-surface);">
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;">
            <button type="button" class="btn btn-secondary btn-sm" style="height:28px;font-size:12px;padding:0 12px;" data-assistant-prompt="Create a 2-step roofing quote form asking for suburb, roof type, solar panels, urgency, and phone">Roofing Quote Form</button>
            <button type="button" class="btn btn-secondary btn-sm" style="height:28px;font-size:12px;padding:0 12px;" data-assistant-prompt="Create a clinic appointment booking form with preferred day, time, and NDIS number">Clinic Booking Form</button>
            <button type="button" class="btn btn-secondary btn-sm" style="height:28px;font-size:12px;padding:0 12px;" data-assistant-prompt="Give me live form analytics">Form Analytics</button>
            <button type="button" class="btn btn-secondary btn-sm" style="height:28px;font-size:12px;padding:0 12px;" data-assistant-prompt="Show unread enquiries in my inbox">Unread Enquiries</button>
          </div>
          <form id="assistant-chat-form" style="display:flex;gap:8px;">
            <input class="input" id="assistant-input" name="message" placeholder="Ask me to build a form, search your inbox, or show analytics..." required style="flex:1;" />
            <button type="submit" class="btn btn-primary btn-sm">Send</button>
          </form>
        </div>
      </div>
      </div>
    </div>
  `;
}

function openAiSettingsModal() {
  const mcpUrl = `${state.baseUrl}/api/mcp`;
  const mcpSnippet = JSON.stringify(
    {
      mcpServers: {
        askforms: {
          url: mcpUrl,
          headers: { Authorization: 'Bearer YOUR_LICENSE_KEY' },
        },
      },
    },
    null,
    2
  );

  openModal(`
    <div class="modal-header">
      <h2 class="modal-title">AI &amp; MCP Settings</h2>
      <button class="btn-icon" data-action="close-modal" aria-label="Close">${icons.x}</button>
    </div>
    <div class="modal-body" style="display:flex;flex-direction:column;gap:18px;">
      <div>
        <h3 style="margin:0 0 6px;font-size:14.5px;font-weight:700;">Connect Your Own AI (MCP Server)</h3>
        <p class="cell-secondary" style="margin:0 0 10px;">Plug AskForms into Claude Desktop, ChatGPT, or Cursor using your own AI subscription.</p>
        <div style="display:flex;gap:8px;margin-bottom:10px;">
          <input class="input mono" value="${escapeHtml(mcpUrl)}" readonly style="flex:1;font-size:12px;" />
          <button type="button" class="btn btn-secondary btn-sm" data-copy="${escapeHtml(mcpUrl)}">Copy URL</button>
        </div>
        <pre class="mono" style="margin:0;padding:12px;border-radius:10px;background:#0c262b;color:#4fd1c5;font-size:11.5px;overflow-x:auto;">${escapeHtml(mcpSnippet)}</pre>
      </div>
      <div style="border-top:1px solid var(--border-subtle);padding-top:16px;">
        <h3 style="margin:0 0 6px;font-size:14.5px;font-weight:700;">Optional: Bring Your Own API Key</h3>
        <p class="cell-secondary" style="margin:0 0 10px;">Not required. Paste a Gemini (free tier) or OpenAI key only if you want full LLM responses.</p>
        <div class="form-grid-2">
          <div class="field-group" style="margin:0;">
            <label class="field-label" for="byok-provider">Provider</label>
            <select class="select" id="byok-provider">
              <option value="gemini" ${state.assistantByok.provider === 'gemini' ? 'selected' : ''}>Google Gemini (Free)</option>
              <option value="openai" ${state.assistantByok.provider === 'openai' ? 'selected' : ''}>OpenAI</option>
            </select>
          </div>
          <div class="field-group" style="margin:0;">
            <label class="field-label" for="byok-key">API Key</label>
            <input class="input mono" id="byok-key" type="password" placeholder="AIza... or sk-..." value="${escapeHtml(state.assistantByok.apiKey || '')}" />
          </div>
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn btn-primary btn-sm" data-action="save-ai-settings">Save</button>
    </div>
  `);
}

function renderChannelsView() {
  const defs = state.channelsDefs || [];
  const cfg = state.channelsConfig || {};
  const enabledCount = Object.values(cfg).filter((c) => c && c.enabled).length;

  const cardsHtml = defs
    .map((ch) => {
      const chCfg = cfg[ch.id] || {};
      const isOn = Boolean(chCfg.enabled);
      const fieldsHtml = (ch.fields || [])
        .map(
          (f) => `
            <div class="field-group" style="margin-bottom:10px;">
              <label class="field-label">${escapeHtml(f.label)}</label>
              <input
                class="input"
                type="${escapeHtml(f.type || 'text')}"
                data-ch-field="${escapeHtml(ch.id)}"
                data-field-key="${escapeHtml(f.key)}"
                placeholder="${escapeHtml(f.placeholder || '')}"
                value="${escapeHtml(chCfg[f.key] || '')}"
              />
            </div>
          `
        )
        .join('');

      return `
        <article class="card card-padded" style="display:flex;flex-direction:column;justify-content:space-between;gap:14px;">
          <div>
            <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:8px;">
              <div>
                <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                  <strong style="font-size:15.5px;color:var(--text-primary);">${escapeHtml(ch.name)}</strong>
                  <span class="tag tag-accent" style="font-size:11px;">${escapeHtml(ch.cost)}</span>
                </div>
                <div style="font-size:12.5px;color:var(--text-secondary);margin-top:4px;">${escapeHtml(ch.description)}</div>
              </div>
              <label class="switch" title="Toggle ${escapeHtml(ch.name)}">
                <input type="checkbox" data-ch-toggle="${escapeHtml(ch.id)}" ${isOn ? 'checked' : ''} />
                <span class="switch-slider"></span>
              </label>
            </div>

            <div class="${isOn ? '' : 'hidden'}" data-ch-body="${escapeHtml(ch.id)}" style="margin-top:14px;padding-top:14px;border-top:1px solid var(--border-subtle);">
              ${fieldsHtml}
              <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px;">
                <button type="button" class="btn btn-secondary btn-sm" data-action="test-channel" data-channel-id="${escapeHtml(ch.id)}">Send Test Alert</button>
                <button type="button" class="btn btn-primary btn-sm" data-action="save-channels">Save</button>
              </div>
            </div>
          </div>
        </article>
      `;
    })
    .join('');

  els.content.innerHTML = `
    <div class="page-band">
      <div class="page-band-inner">
        <div class="page-band-top">
          <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
            <h1 class="page-band-title">Notifications &amp; Webhooks</h1>
            <span class="tag tag-accent">${enabledCount} Active</span>
          </div>
          <div class="toolbar-group">
            <button type="button" class="btn btn-primary btn-sm" data-action="save-channels">Save All Channels</button>
          </div>
        </div>
      </div>
    </div>

    <div class="content-inner">
      <div class="content-container view-animate">
        <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(min(100%, 340px), 1fr));gap:20px;">
          ${cardsHtml}
        </div>
      </div>
    </div>
  `;
}

function renderLoginScreen(errorMessage = '') {
  const ws = state.workspace || {};
  els.brandLockup?.classList.add('hidden');
  els.sidebar.classList.add('hidden');
  els.sidebarRailToggle?.classList.add('hidden');
  els.topbar.classList.add('hidden');
  els.content.style.padding = '0';
  els.content.style.maxWidth = 'none';

  els.content.innerHTML = `
    <div class="auth-screen">
      <form id="login-form" class="auth-card">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:24px;">
          <span class="brand-mark">${icons.brand}</span>
          <span class="brand-name">AskForms</span>
        </div>
        <h1 class="page-title" style="font-size:22px;margin-bottom:20px;">Sign in</h1>
        ${
          errorMessage
            ? `<div class="card" style="padding:10px 12px;margin-bottom:16px;background:var(--danger-soft);border-color:#f0cbc8;color:var(--danger);font-size:13px;">${escapeHtml(errorMessage)}</div>`
            : ''
        }
        <div class="field-group">
          <label class="field-label" for="login-domain">Domain</label>
          <input class="input mono" id="login-domain" name="domain" type="text" placeholder="yourdomain.com.au" autofocus autocomplete="username" />
        </div>
        <div class="field-group">
          <label class="field-label" for="login-password">License Key</label>
          <input class="input mono" id="login-password" name="password" type="password" placeholder="ASK1..." required autocomplete="current-password" />
        </div>
        <button type="submit" class="btn btn-primary" style="width:100%;margin-top:6px;">Sign In</button>
      </form>
    </div>
  `;
}

function renderPartnerClientsView() {
  const ws = state.workspace || {};
  const clients = state.partnerClients || [];
  const issued = state.partnerIssuedKey;

  const clientCardsHtml =
    clients.length === 0
      ? `<div class="card card-padded" style="text-align:center;padding:40px 24px;">
           <div style="font-size:15px;font-weight:700;color:var(--ink-primary);margin-bottom:6px;">No client accounts yet</div>
           <div class="cell-secondary">Create your first client account above to mint a free ASK1 client key and starter form.</div>
         </div>`
      : `<div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(340px, 1fr));gap:16px;">
          ${clients
            .map((c) => {
              const clientForms = state.forms.filter(
                (f) => !f.is_archived && String(f.client_name || '').toLowerCase() === String(c.holder || c.domain).toLowerCase()
              );
              const formCount = clientForms.length || c.form_count || 0;
              return `
                <article class="card card-padded" style="display:flex;flex-direction:column;justify-content:space-between;gap:14px;">
                  <div>
                    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;">
                      <div>
                        <div style="font-size:16px;font-weight:700;color:var(--ink-primary);">${escapeHtml(c.holder || c.domain)}</div>
                        <div class="mono" style="font-size:12.5px;color:var(--ink-muted);margin-top:2px;">${escapeHtml(c.domain)}</div>
                      </div>
                      <span class="tag tag-accent" style="white-space:nowrap;">${formCount} ${formCount === 1 ? 'Form' : 'Forms'}</span>
                    </div>

                    ${
                      c.license_key
                        ? `<div style="margin-top:12px;padding:9px 11px;border-radius:10px;background:var(--bg-canvas);border:1px solid var(--border-subtle);display:flex;align-items:center;justify-content:space-between;gap:8px;">
                             <code class="mono" style="font-size:11.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--ink-secondary);">${escapeHtml(c.license_key)}</code>
                             <button type="button" class="btn btn-ghost btn-sm" style="flex-shrink:0;" data-copy="${escapeHtml(c.license_key)}">${icons.copy} Copy Key</button>
                           </div>`
                        : ''
                    }
                  </div>

                  <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding-top:12px;border-top:1px solid var(--border-subtle);">
                    <button type="button" class="btn btn-secondary btn-sm" data-new-form-for="${escapeHtml(c.holder || c.domain)}" style="white-space:nowrap;">
                      ${icons.plus} New Form
                    </button>
                    <button type="button" class="btn btn-primary btn-sm" data-impersonate-domain="${escapeHtml(c.domain)}" data-impersonate-holder="${escapeHtml(c.holder || c.domain)}" style="white-space:nowrap;">
                      Login as Client →
                    </button>
                  </div>
                </article>
              `;
            })
            .join('')}
        </div>`;

  els.content.innerHTML = `
    <div class="page-band">
      <div class="page-band-inner">
        <div class="page-band-top">
          <div>
            <h1 class="page-band-title">Partner Clients &amp; Keys</h1>
            <p class="cell-secondary" style="margin:4px 0 0;">Mint client license keys at $0 cost, generate live forms for their websites, or log in as any client to manage their deployment.</p>
          </div>
          <div class="toolbar-group">
            <button type="button" class="btn btn-secondary" data-action="open-create-modal">${icons.plus} New Form</button>
          </div>
        </div>
      </div>
    </div>

    <div class="content-inner">
      <div class="content-container view-animate" style="display:flex;flex-direction:column;gap:22px;">
        <section class="card card-padded">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px;flex-wrap:wrap;">
            <div>
              <h2 class="section-title" style="margin:0;">Create Client Account &amp; Mint Key ($0)</h2>
              <p class="cell-secondary" style="margin:3px 0 0;">Creates a client account, mints an official ASK1 single-site license key, and provisions a starter form.</p>
            </div>
            <span class="tag tag-accent">Reseller Partner · ${escapeHtml(ws.license_holder || 'Agency')}</span>
          </div>

          <form id="partner-create-client-form" class="form-grid-3" style="align-items:end;gap:12px;">
            <div class="field-group" style="margin:0;">
              <label class="field-label" for="partner-client-holder">Client Business Name</label>
              <input class="input" id="partner-client-holder" name="holder" placeholder="Harbour Plumbing Co" required />
            </div>
            <div class="field-group" style="margin:0;">
              <label class="field-label" for="partner-client-domain">Client Website Domain</label>
              <input class="input mono" id="partner-client-domain" name="domain" placeholder="harbourplumbing.com.au" required />
            </div>
            <div>
              <button type="submit" class="btn btn-primary" style="width:100%;white-space:nowrap;">Create Account &amp; Mint Key</button>
            </div>
          </form>

          ${
            issued
              ? `<div style="margin-top:16px;padding:14px 16px;border-radius:12px;background:var(--bg-canvas);border:1px solid var(--border-subtle);">
                   <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px;flex-wrap:wrap;">
                     <strong style="font-size:13.5px;">Client key ready for ${escapeHtml(issued.holder)} (${escapeHtml(issued.domain)})</strong>
                     <button type="button" class="btn btn-primary btn-sm" data-copy="${escapeHtml(issued.key)}">${icons.copy} Copy ASK1 Key</button>
                   </div>
                   <code class="mono" style="display:block;font-size:11.5px;word-break:break-all;color:var(--ink-secondary);">${escapeHtml(issued.key)}</code>
                 </div>`
              : ''
          }
        </section>

        <section>
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
            <h2 class="section-title" style="margin:0;">Client Accounts (${clients.length})</h2>
          </div>
          ${clientCardsHtml}
        </section>
      </div>
    </div>
  `;
}

// ============================================================
// MASTER RENDER
// ============================================================
let lastRouteKey = '';

function render() {
  if (!state.authenticated) {
    renderLoginScreen();
    return;
  }

  const nextRouteKey = `${state.view}:${state.selectedFormId || ''}:${state.formTab}:${state.clientFilter}:${state.setupStep}`;
  const shouldAnimate = nextRouteKey !== lastRouteKey;
  lastRouteKey = nextRouteKey;

  els.brandLockup?.classList.remove('hidden');
  els.sidebar.classList.remove('hidden');
  els.sidebarRailToggle?.classList.remove('hidden');
  els.topbar.classList.remove('hidden');
  els.content.style.padding = '';
  els.content.style.maxWidth = '';
  els.content.className = 'content';
  syncSidebarToggleState();

  renderTopbar();
  renderSidebar();

  if (state.view === 'partner-clients') renderPartnerClientsView();
  else if (state.view === 'forms') renderFormsOverview();
  else if (state.view === 'form') renderFormWorkspace();
  else if (state.view === 'assistant') renderAssistantView();
  else if (state.view === 'channels') renderChannelsView();
  else if (state.view === 'sandbox') renderSandboxView();
  else if (state.view === 'mail') renderMailOutboxView();
  else if (state.view === 'webhooks') renderWebhookLogsView();
  else if (state.view === 'workspace') renderWorkspaceView();
  else if (state.view === 'setup') renderSetupWizardView();

  if (!shouldAnimate) {
    els.content.querySelector('.content-container.view-animate')?.classList.remove('view-animate');
  }
}

// ============================================================
// GLOBAL EVENT DELEGATION
// ============================================================
document.addEventListener('click', async (e) => {
  const target = e.target;

  if (target.closest('[data-stop-prop]')) {
    e.stopPropagation();
    return;
  }

  const stopCopyBtn = target.closest('[data-stop-copy]');
  if (stopCopyBtn) {
    e.stopPropagation();
    copyText(stopCopyBtn.dataset.stopCopy, showToast);
    return;
  }

  const copyBtn = target.closest('[data-copy]');
  if (copyBtn) {
    copyText(copyBtn.dataset.copy, showToast);
    return;
  }

  if (target.closest('[data-copy-snippet]')) {
    const code = document.getElementById('integration-code')?.textContent || '';
    copyText(code, showToast);
    return;
  }

  if (state.projectMenuOpen && !target.closest('.project-heading-wrap')) {
    state.projectMenuOpen = false;
    const wrap = document.querySelector('.project-heading-wrap');
    wrap?.classList.remove('open');
    wrap?.querySelector('.heading-switcher')?.setAttribute('aria-expanded', 'false');
  }

  if (target.closest('[data-action="open-ai-settings"]')) {
    openAiSettingsModal();
    return;
  }

  if (target.closest('[data-action="save-ai-settings"]')) {
    state.assistantByok.provider = document.getElementById('byok-provider')?.value || 'gemini';
    state.assistantByok.apiKey = document.getElementById('byok-key')?.value?.trim() || '';
    closeModal();
    showToast('AI settings saved');
    return;
  }

  if (target.closest('[data-action="reset-demo-studio"]')) {
    try {
      sessionStorage.removeItem('askforms_demo_session_v3');
      localStorage.removeItem('askforms_studio_demo_v2');
      localStorage.removeItem('askforms_studio_demo_v1');
    } catch {}
    window.location.reload();
    return;
  }

  if (target.closest('[data-action="go-partner-clients"]')) {
    els.app.classList.remove('sidebar-open');
    await switchView('partner-clients');
    document.getElementById('partner-client-holder')?.focus();
    return;
  }

  const newFormForBtn = target.closest('[data-new-form-for]');
  if (newFormForBtn) {
    openCreateModal(newFormForBtn.dataset.newFormFor || '');
    return;
  }

  const impersonateBtn = target.closest('[data-impersonate-domain]');
  if (impersonateBtn) {
    const domain = impersonateBtn.dataset.impersonateDomain;
    const holder = impersonateBtn.dataset.impersonateHolder || domain;
    try {
      await api.impersonateClient(domain, holder);
      state.selectedFormId = null;
      state.clientFilter = 'all';
      await refreshBootstrap();
      state.view = 'forms';
      render();
      showToast(`Signed in as ${holder}`);
    } catch (err) {
      showToast(err.message);
    }
    return;
  }

  if (target.closest('[data-action="exit-impersonation"]')) {
    try {
      await api.exitImpersonation();
      state.selectedFormId = null;
      state.clientFilter = 'all';
      await refreshBootstrap();
      state.view = 'partner-clients';
      render();
      showToast('Returned to Partner Portal');
    } catch (err) {
      showToast(err.message);
    }
    return;
  }

  if (target.closest('[data-action="partner-mint-key"]')) {
    const domain = document.getElementById('partner-key-domain')?.value?.trim() || '';
    const holder = document.getElementById('partner-key-holder')?.value?.trim() || domain;
    if (!domain) {
      showToast('Enter a client domain first');
      return;
    }
    try {
      const res = await api.issueLicense(domain, holder, false);
      state.partnerIssuedKey = { domain: res.payload.domain, holder: res.payload.holder, key: res.key };
      render();
      showToast(`Client key minted for ${res.payload.domain}`);
    } catch (err) {
      showToast(err.message);
    }
    return;
  }

  const quickPromptBtn = target.closest('[data-assistant-prompt]');
  if (quickPromptBtn) {
    const prompt = quickPromptBtn.getAttribute('data-assistant-prompt');
    const inp = document.getElementById('assistant-input');
    if (inp) inp.value = prompt;
    document.getElementById('assistant-chat-form')?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    return;
  }

  if (target.closest('[data-action="assistant-clear"]')) {
    state.assistantMessages = state.assistantMessages.slice(0, 1);
    state.assistantDraftForm = null;
    render();
    return;
  }

  if (target.closest('[data-action="assistant-create-draft"]')) {
    const draft = state.assistantDraftForm;
    if (!draft) return;
    try {
      const { form: created } = await api.createForm({
        name: draft.name,
        client_name: draft.client_name,
        fields: draft.fields,
        submit_label: draft.submit_label,
        multi_step: draft.multi_step,
      });
      state.assistantDraftForm = null;
      await refreshBootstrap();
      await openForm(created.id, 'builder');
      showToast(`Created "${created.name}"`);
    } catch (err) {
      showToast(err.message);
    }
    return;
  }

  const saveChannelsBtn = target.closest('[data-action="save-channels"]');
  if (saveChannelsBtn) {
    try {
      await api.saveChannels(state.channelsConfig);
      showToast('Notification channels saved');
    } catch (err) {
      showToast(err.message);
    }
    return;
  }

  const testChannelBtn = target.closest('[data-action="test-channel"]');
  if (testChannelBtn) {
    const chId = testChannelBtn.dataset.channelId;
    const orig = testChannelBtn.textContent;
    testChannelBtn.disabled = true;
    testChannelBtn.textContent = 'Sending...';
    try {
      await api.saveChannels(state.channelsConfig);
      await api.testChannel(chId, state.channelsConfig[chId] || {});
      showToast('Test alert delivered!');
    } catch (err) {
      showToast(err.message || 'Test alert failed');
    } finally {
      testChannelBtn.disabled = false;
      testChannelBtn.textContent = orig;
    }
    return;
  }

  const toggleProjMenuBtn = target.closest('[data-action="toggle-project-menu"]');
  if (toggleProjMenuBtn) {
    state.projectMenuOpen = !state.projectMenuOpen;
    const wrap = toggleProjMenuBtn.closest('.project-heading-wrap');
    wrap?.classList.toggle('open', state.projectMenuOpen);
    toggleProjMenuBtn.setAttribute('aria-expanded', state.projectMenuOpen ? 'true' : 'false');
    return;
  }

  const selectProjBtn = target.closest('[data-select-project]');
  if (selectProjBtn) {
    state.clientFilter = selectProjBtn.dataset.selectProject;
    state.projectMenuOpen = false;
    render();
    return;
  }

  const toggleSidebarBtn = target.closest('[data-action="toggle-sidebar"]');
  if (toggleSidebarBtn) {
    toggleSidebarPane();
    return;
  }

  if (target.id === 'sidebar-backdrop') {
    els.app.classList.remove('sidebar-open');
    syncSidebarToggleState();
    return;
  }

  if (target.closest('[data-action="go-forms"]')) {
    els.app.classList.remove('sidebar-open');
    await switchView(isPartnerSession() ? 'partner-clients' : 'forms');
    return;
  }

  if (target.closest('[data-action="open-create-modal"]')) {
    openCreateModal();
    return;
  }

  if (target.closest('[data-action="open-deploy-modal"]')) {
    openDeployModal();
    return;
  }

  if (target.closest('[data-action="logout"]')) {
    await api.logout();
    state.authenticated = false;
    renderLoginScreen();
    return;
  }

  const swatchBtn = target.closest('[data-swatch]');
  if (swatchBtn) {
    const hex = swatchBtn.dataset.swatch;
    const input = document.getElementById('ws-accent');
    const picker = document.getElementById('ws-accent-picker');
    if (input) input.value = hex;
    if (picker) picker.value = hex;
    document.querySelectorAll('[data-swatch]').forEach((b) => b.classList.toggle('active', b === swatchBtn));
    applyDraftBranding();
    return;
  }

  const bgSwatchBtn = target.closest('[data-bg-swatch]');
  if (bgSwatchBtn) {
    const hex = bgSwatchBtn.dataset.bgSwatch;
    const input = document.getElementById('ws-bg');
    const picker = document.getElementById('ws-bg-picker');
    if (input) input.value = hex;
    if (picker) picker.value = hex;
    document.querySelectorAll('[data-bg-swatch]').forEach((b) => b.classList.toggle('active', b === bgSwatchBtn));
    applyDraftBranding();
    return;
  }

  if (target.closest('[data-action="remove-logo"]')) {
    const { workspace } = await api.updateWorkspace({ logo_url: '' });
    state.workspace = workspace;
    applyWorkspaceBranding();
    render();
    showToast('Logo removed');
    return;
  }

  if (target.closest('[data-action="export-brand-kit"]')) {
    const ws = state.workspace;
    const kit = {
      brand_name: ws.brand_name,
      website_url: ws.website_url,
      support_email: ws.support_email,
      license_holder: ws.license_holder,
      logo_url: ws.logo_url,
      accent_color: ws.accent_color,
      accent_text_color: ws.accent_text_color,
      bg_color: ws.bg_color,
      surface_color: ws.surface_color,
      font_preset: ws.font_preset,
      radius_preset: ws.radius_preset,
      thanks_heading: ws.thanks_heading,
      thanks_body: ws.thanks_body,
      email_footer: ws.email_footer,
    };
    const blob = new Blob([JSON.stringify(kit, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(ws.brand_name || 'brand').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-brand-kit.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Brand kit exported');
    return;
  }

  if (target.closest('[data-action="activate-license"]')) {
    const keyInput = document.getElementById('ws-license-key-input');
    const rawKey = keyInput?.value?.trim() || '';
    if (!rawKey) {
      showToast('Paste an ASK1... license key first');
      return;
    }
    try {
      const { verified, workspace } = await api.activateLicense(rawKey);
      state.workspace = workspace;
      render();
      showToast(`Activated lifetime license for ${verified.domain}`);
    } catch (err) {
      showToast(err.message);
    }
    return;
  }

  if (target.closest('[data-action="remove-license"]')) {
    const { workspace } = await api.removeLicense();
    state.workspace = workspace;
    render();
    showToast('Returned workspace to Live Preview Mode');
    return;
  }

  if (target.closest('[data-action="disable-auth"]')) {
    const res = await api.updateWorkspace({ disable_admin_password: true });
    state.workspace = res.workspace;
    render();
    showToast('Designer admin password removed');
    return;
  }

  if (target.closest('[data-action="disable-owner-pin"]')) {
    const res = await api.updateWorkspace({ disable_owner_pin: true });
    state.workspace = res.workspace;
    render();
    showToast('Owner Portal PIN removed');
    return;
  }

  const setupStepBtn = target.closest('[data-setup-step]');
  if (setupStepBtn) {
    state.setupStep = Number(setupStepBtn.dataset.setupStep);
    render();
    return;
  }

  const embedPlatBtn = target.closest('[data-embed-platform]');
  if (embedPlatBtn) {
    state.embedPlatform = embedPlatBtn.dataset.embedPlatform;
    render();
    return;
  }

  const wizNextBtn = target.closest('[data-wizard-next]');
  if (wizNextBtn) {
    const next = Number(wizNextBtn.dataset.wizardNext);
    if (state.setupStep === 1) {
      state.setupData.brand_name = document.getElementById('wiz-brand')?.value?.trim() || state.workspace.brand_name;
      state.setupData.website_url = document.getElementById('wiz-url')?.value?.trim() || '';
      state.setupData.accent_color = document.getElementById('wiz-accent')?.value?.trim() || '#095c4f';
      state.setupData.font_preset = document.getElementById('wiz-font')?.value || 'editorial';
      state.setupData.radius_preset = document.getElementById('wiz-radius')?.value || 'balanced';
    } else if (state.setupStep === 2) {
      state.setupData.owner_email = document.getElementById('wiz-email')?.value?.trim() || '';
      state.setupData.owner_pin = document.getElementById('wiz-pin')?.value?.trim() || '';
      state.setupData.alert_format = document.getElementById('wiz-alert-fmt')?.value || 'telegram';
      state.setupData.alert_url = document.getElementById('wiz-alert-url')?.value?.trim() || '';
    }
    state.setupStep = next;
    render();
    return;
  }

  if (target.closest('[data-wizard-finish]')) {
    state.setupData.form_name = document.getElementById('wiz-fname')?.value?.trim() || 'Website Enquiry';
    state.setupData.template = document.getElementById('wiz-tpl')?.value || 'trades';
    state.setupData.multi_step = Boolean(document.getElementById('wiz-multistep')?.checked);
    state.setupData.review_gate_url = document.getElementById('wiz-review')?.value?.trim() || '';

    const d = state.setupData;
    const tpl = ENQUIRY_TEMPLATES[d.template] || ENQUIRY_TEMPLATES.trades;
    try {
      const wsPayload = {
        brand_name: d.brand_name || state.workspace.brand_name,
        website_url: d.website_url,
        accent_color: d.accent_color,
        accent_text_color: contrastTextForHex(d.accent_color),
        font_preset: d.font_preset,
        radius_preset: d.radius_preset,
        setup_completed: true,
      };
      if (/^\d{6}$/.test(d.owner_pin || '')) {
        wsPayload.new_owner_pin = d.owner_pin;
      }
      const { workspace } = await api.updateWorkspace(wsPayload);
      state.workspace = workspace;
      applyWorkspaceBranding();

      const { form: created } = await api.createForm({
        name: d.form_name,
        client_name: d.brand_name || 'Website',
        email_recipients: d.owner_email,
        fields: tpl.fields,
        submit_label: tpl.submitLabel,
        multi_step: d.multi_step,
        review_gate_url: d.review_gate_url,
      });

      if (d.alert_url) {
        await api.createWebhook(created.id, {
          label: `${d.alert_format.toUpperCase()} Instant Alert`,
          target_url: d.alert_url,
          format: d.alert_format,
        });
      }

      state.setupData.created_form_id = created.id;
      await refreshBootstrap();
      state.setupStep = 4;
      render();
      showToast('Client workspace & enquiry form provisioned');
    } catch (err) {
      showToast(err.message);
    }
    return;
  }

  if (target.closest('[data-action="clear-demo-data"]')) {
    if (!window.confirm('Clear all forms, submissions, and logs to prepare a blank customer workspace?')) return;
    await api.clearDemoData();
    state.selectedFormId = null;
    await switchView('forms');
    showToast('Workspace cleared — ready for customer setup');
    return;
  }

  if (target.closest('[data-action="toggle-ai-prompt"]')) {
    state.aiPromptExpanded = !state.aiPromptExpanded;
    render();
    return;
  }

  const wfToggleBtn = target.closest('[data-wf-toggle]');
  if (wfToggleBtn) {
    const key = wfToggleBtn.dataset.wfToggle;
    state.wfOpen[key] = !state.wfOpen[key];
    render();
    return;
  }

  if (target.closest('[data-action="toggle-wf-email"]')) {
    state.wfEmailEditorOpen = !state.wfEmailEditorOpen;
    render();
    return;
  }

  if (target.closest('[data-action="open-action-catalog"]')) {
    openActionCatalogModal();
    return;
  }

  const pickActBtn = target.closest('[data-pick-action]');
  if (pickActBtn) {
    openActionCatalogModal({
      key: pickActBtn.dataset.pickAction,
      label: pickActBtn.dataset.pickLabel,
      placeholder: pickActBtn.dataset.pickPh,
    });
    return;
  }

  const bulkBtn = target.closest('[data-bulk-action]');
  if (bulkBtn) {
    const action = bulkBtn.dataset.bulkAction;
    const ids = [...(state.selectedSubIds || [])];
    if (ids.length === 0) return;
    if (action === 'delete' && !window.confirm(`Delete ${ids.length} selected enquiry(ies)?`)) return;
    await Promise.all(
      ids.map((id) => {
        if (action === 'delete') return api.deleteSubmission(id);
        if (action === 'spam') return api.toggleSpam(id, true);
        return api.updateSubmission(id, { status: action });
      })
    );
    state.selectedSubIds = [];
    await refreshBootstrap();
    await loadFormDetail(state.selectedFormId);
    render();
    showToast(`Updated ${ids.length} enquiry(ies)`);
    return;
  }

  const toggleProj = target.closest('[data-toggle-project]');
  if (toggleProj) {
    const projName = toggleProj.dataset.toggleProject;
    const grp = toggleProj.closest('.project-group');
    const collapsed = grp?.classList.toggle('collapsed');
    toggleProj.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
    const set = new Set(state.collapsedProjects || []);
    if (collapsed) set.add(projName);
    else set.delete(projName);
    state.collapsedProjects = Array.from(set);
    return;
  }

  const clientFilterBtn = target.closest('[data-client-filter]');
  if (clientFilterBtn) {
    state.clientFilter = clientFilterBtn.dataset.clientFilter;
    render();
    return;
  }

  if (target.closest('[data-action="close-modal"]') || target === els.modalBackdrop) {
    closeModal();
    return;
  }

  if (target.closest('[data-action="close-drawer"]') || target === els.drawerBackdrop) {
    closeDrawer();
    return;
  }

  if (target.closest('[data-action="toggle-drawer-json"]')) {
    state.drawerRawJson = !state.drawerRawJson;
    renderDrawer();
    return;
  }

  const testPopoutBtn = target.closest('[data-test-popout]');
  if (testPopoutBtn) {
    e.stopPropagation();
    const formId = testPopoutBtn.dataset.testPopout;
    const mode = testPopoutBtn.dataset.testMode || state.popoutMode || 'drawer';
    launchLivePopoutPreview(formId, mode);
    return;
  }

  const archiveFormBtn = target.closest('[data-archive-form]');
  if (archiveFormBtn) {
    e.stopPropagation();
    const formId = archiveFormBtn.dataset.archiveForm;
    const toArchived = archiveFormBtn.dataset.targetArchive === '1';
    await api.updateForm(formId, { is_archived: toArchived, is_active: !toArchived });
    await refreshBootstrap();
    if (state.view === 'form' && state.selectedFormId === formId) {
      await loadFormDetail(formId);
    }
    render();
    showToast(toArchived ? 'Form moved to Archive' : 'Form restored to Active');
    return;
  }

  const deleteFormBtn = target.closest('[data-delete-form]');
  if (deleteFormBtn) {
    e.stopPropagation();
    if (!window.confirm('Permanently delete this form and all its submissions?')) return;
    await api.deleteForm(deleteFormBtn.dataset.deleteForm);
    state.selectedFormId = null;
    await switchView('forms');
    showToast('Form deleted');
    return;
  }

  const formsStatusBtn = target.closest('[data-forms-status]');
  if (formsStatusBtn) {
    state.formsStatusFilter = formsStatusBtn.dataset.formsStatus;
    render();
    return;
  }

  const popoutModeBtn = target.closest('[data-popout-mode]');
  if (popoutModeBtn) {
    state.popoutMode = popoutModeBtn.dataset.popoutMode;
    render();
    return;
  }

  const navBtn = target.closest('[data-nav]');
  if (navBtn) {
    els.app.classList.remove('sidebar-open');
    await switchView(navBtn.dataset.nav);
    return;
  }

  const openFormEl = target.closest('[data-open-form]');
  if (openFormEl) {
    els.app.classList.remove('sidebar-open');
    await openForm(openFormEl.dataset.openForm);
    return;
  }

  const testFormBtn = target.closest('[data-test-form]');
  if (testFormBtn) {
    state.sandboxFormId = testFormBtn.dataset.testForm;
    state.sandboxResult = null;
    await switchView('sandbox');
    return;
  }

  const formTabBtn = target.closest('[data-form-tab]');
  if (formTabBtn) {
    state.formTab = formTabBtn.dataset.formTab;
    render();
    return;
  }

  const snippetBtn = target.closest('[data-snippet]');
  if (snippetBtn) {
    state.snippetLang = snippetBtn.dataset.snippet;
    render();
    return;
  }

  const subFilterBtn = target.closest('[data-sub-filter]');
  if (subFilterBtn) {
    state.subFilter = subFilterBtn.dataset.subFilter;
    await loadFormDetail(state.selectedFormId);
    render();
    return;
  }

  const applyTplBtn = target.closest('[data-apply-template]');
  if (applyTplBtn) {
    const tpl = ENQUIRY_TEMPLATES[applyTplBtn.dataset.applyTemplate];
    if (tpl) {
      state.builderFields = JSON.parse(JSON.stringify(tpl.fields));
      state.builderSubmitLabel = tpl.submitLabel;
      state.builderMultiStep = Boolean(tpl.multiStep);
      render();
      showToast(`Loaded "${tpl.label}" fields — click Save to apply`);
    }
    return;
  }

  if (target.closest('[data-bf-add]')) {
    const idx = state.builderFields.length + 1;
    state.builderFields.push({
      name: `field_${idx}`,
      label: `New field ${idx}`,
      type: 'text',
      placeholder: '',
      required: false,
      half: false,
    });
    render();
    return;
  }

  const bfRemoveBtn = target.closest('[data-bf-remove]');
  if (bfRemoveBtn) {
    const idx = Number(bfRemoveBtn.dataset.bfRemove);
    state.builderFields.splice(idx, 1);
    render();
    return;
  }

  const bfMoveBtn = target.closest('[data-bf-move]');
  if (bfMoveBtn) {
    const idx = Number(bfMoveBtn.dataset.bfMove);
    const dir = Number(bfMoveBtn.dataset.dir);
    const nextIdx = idx + dir;
    if (nextIdx >= 0 && nextIdx < state.builderFields.length) {
      const [moved] = state.builderFields.splice(idx, 1);
      state.builderFields.splice(nextIdx, 0, moved);
      render();
    }
    return;
  }

  if (target.closest('[data-bf-save]')) {
    const cleaned = state.builderFields
      .filter((f) => (f.label || '').trim())
      .map((f, i) => {
        const slug = String(f.label || `field_${i + 1}`)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '_')
          .replace(/^_+|_+$/g, '') || `field_${i + 1}`;
        const out = {
          name: ['name', 'email', 'phone', 'message'].includes(f.name) ? f.name : slug,
          label: String(f.label).trim(),
          type: f.type || 'text',
          placeholder: String(f.placeholder || ''),
          required: Boolean(f.required),
          half: Boolean(f.half),
        };
        if (out.type === 'select') {
          out.options = Array.isArray(f.options)
            ? f.options
            : String(f.options || 'Option 1, Option 2')
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean);
        }
        return out;
      });
    const submitLabel = document.getElementById('bf-submit-label')?.value?.trim() || 'Send enquiry';
    const multiStep = Boolean(document.getElementById('bf-multi-step')?.checked);
    const reviewGateUrl = document.getElementById('bf-review-url')?.value?.trim() || '';
    const { form: updated } = await api.updateForm(state.selectedFormId, {
      fields: cleaned,
      submit_label: submitLabel,
      multi_step: multiStep,
      review_gate_url: reviewGateUrl,
    });
    state.currentForm = updated;
    state.builderFields = JSON.parse(JSON.stringify(updated.fields || []));
    state.builderSubmitLabel = updated.submit_label || submitLabel;
    state.builderMultiStep = Boolean(updated.multi_step);
    state.builderReviewGateUrl = updated.review_gate_url || '';
    state.embedVersion += 1;
    render();
    showToast('Enquiry form fields saved');
    return;
  }

  const subStatusBtn = target.closest('[data-sub-status]');
  if (subStatusBtn) {
    const subId = subStatusBtn.dataset.subStatus;
    const status = subStatusBtn.dataset.statusVal;
    await api.updateSubmission(subId, { status });
    if (state.selectedSubmission && state.selectedSubmission.id === subId) {
      state.selectedSubmission.status = status;
    }
    await loadFormDetail(state.selectedFormId);
    render();
    renderDrawer();
    showToast(`Marked as ${status}`);
    return;
  }

  const saveNoteBtn = target.closest('[data-save-note]');
  if (saveNoteBtn) {
    const subId = saveNoteBtn.dataset.saveNote;
    const notes = document.getElementById('drawer-note-input')?.value || '';
    await api.updateSubmission(subId, { notes });
    if (state.selectedSubmission && state.selectedSubmission.id === subId) {
      state.selectedSubmission.notes = notes;
    }
    await loadFormDetail(state.selectedFormId);
    showToast('Note saved');
    return;
  }

  const openSubRow = target.closest('[data-open-sub]');
  if (openSubRow) {
    openSubmissionDrawer(openSubRow.dataset.openSub);
    return;
  }

  const drawerSpamBtn = target.closest('[data-drawer-spam]');
  if (drawerSpamBtn) {
    const isSpam = drawerSpamBtn.dataset.targetSpam === '1';
    await api.toggleSpam(drawerSpamBtn.dataset.drawerSpam, isSpam);
    await refreshBootstrap();
    await loadFormDetail(state.selectedFormId);
    closeDrawer();
    render();
    showToast(isSpam ? 'Moved to Spam' : 'Restored to Inbox');
    return;
  }

  const drawerDelBtn = target.closest('[data-drawer-delete]');
  if (drawerDelBtn) {
    await api.deleteSubmission(drawerDelBtn.dataset.drawerDelete);
    await refreshBootstrap();
    await loadFormDetail(state.selectedFormId);
    closeDrawer();
    render();
    showToast('Submission deleted');
    return;
  }

  const addSinkBtn = target.closest('[data-add-local-sink]');
  if (addSinkBtn) {
    await api.createWebhook(addSinkBtn.dataset.addLocalSink, {
      label: 'Local Webhook Inspector',
      target_url: `${state.baseUrl}/api/webhook-sink`,
    });
    await refreshBootstrap();
    await loadFormDetail(state.selectedFormId);
    render();
    showToast('Local test webhook added');
    return;
  }

  const testWhBtn = target.closest('[data-test-wh]');
  if (testWhBtn) {
    testWhBtn.disabled = true;
    try {
      const { result } = await api.testWebhook(testWhBtn.dataset.testWh);
      await refreshBootstrap();
      showToast(result?.success ? `Webhook delivered (HTTP ${result.status} in ${result.durationMs}ms)` : `Webhook failed (${result?.status || 'network error'})`);
    } finally {
      testWhBtn.disabled = false;
      renderSidebar();
    }
    return;
  }

  const toggleWhBtn = target.closest('[data-toggle-wh]');
  if (toggleWhBtn) {
    const nextActive = toggleWhBtn.dataset.whActive !== '1';
    await api.toggleWebhook(toggleWhBtn.dataset.toggleWh, nextActive);
    await loadFormDetail(state.selectedFormId);
    render();
    showToast(nextActive ? 'Webhook enabled' : 'Webhook paused');
    return;
  }

  const deleteWhBtn = target.closest('[data-delete-wh]');
  if (deleteWhBtn) {
    await api.deleteWebhook(deleteWhBtn.dataset.deleteWh);
    await refreshBootstrap();
    await loadFormDetail(state.selectedFormId);
    render();
    showToast('Webhook removed');
    return;
  }

  const clearSubsBtn = target.closest('[data-clear-subs]');
  if (clearSubsBtn) {
    if (!window.confirm('Delete all submissions for this form?')) return;
    await api.clearSubmissions(clearSubsBtn.dataset.clearSubs);
    await refreshBootstrap();
    await loadFormDetail(state.selectedFormId);
    render();
    showToast('Submissions cleared');
    return;
  }

  const selectMailBtn = target.closest('[data-select-mail]');
  if (selectMailBtn) {
    state.selectedMailId = selectMailBtn.dataset.selectMail;
    render();
    return;
  }

  const mailModeBtn = target.closest('[data-mail-mode]');
  if (mailModeBtn) {
    state.mailPreviewMode = mailModeBtn.dataset.mailMode;
    render();
    return;
  }

  const expandWhLogRow = target.closest('[data-expand-whlog]');
  if (expandWhLogRow) {
    const id = expandWhLogRow.dataset.expandWhlog;
    state.expandedWebhookLogId = state.expandedWebhookLogId === id ? null : id;
    render();
    return;
  }
});

// Search & sandbox reactive controls
let searchTimer = null;
document.addEventListener('input', (e) => {
  if (e.target.id === 'bf-submit-label') {
    state.builderSubmitLabel = e.target.value;
    return;
  }
  if (e.target.id === 'bf-review-url') {
    state.builderReviewGateUrl = e.target.value;
    return;
  }
  if (e.target.dataset?.bfProp) {
    const idx = Number(e.target.dataset.bfIdx);
    const prop = e.target.dataset.bfProp;
    const item = state.builderFields[idx];
    if (item && (prop === 'label' || prop === 'placeholder' || prop === 'options')) {
      item[prop] = e.target.value;
    }
    return;
  }
  if (e.target.id === 'ws-brand') {
    const slot = document.getElementById('preview-logo-slot');
    if (slot && !state.workspace.logo_url) {
      slot.innerHTML = `<span class="cell-secondary" style="text-transform:uppercase;letter-spacing:0.05em;font-weight:600;color:var(--accent);">${escapeHtml(e.target.value || 'AskForms')}</span>`;
    }
    return;
  }
  if (e.target.id === 'ws-accent' && /^#[0-9a-fA-F]{6}$/.test(e.target.value)) {
    const picker = document.getElementById('ws-accent-picker');
    if (picker) picker.value = e.target.value;
    applyDraftBranding();
    return;
  }
  if (e.target.id === 'ws-bg' && /^#[0-9a-fA-F]{6}$/.test(e.target.value)) {
    const picker = document.getElementById('ws-bg-picker');
    if (picker) picker.value = e.target.value;
    applyDraftBranding();
    return;
  }
  if (e.target.id === 'sub-search') {
    state.subQuery = e.target.value;
    clearTimeout(searchTimer);
    searchTimer = setTimeout(async () => {
      if (state.selectedFormId) {
        const res = await api.listSubmissions(state.selectedFormId, state.subFilter, state.subQuery);
        state.submissions = res.submissions;
        render();
        const input = document.getElementById('sub-search');
        if (input) {
          input.focus();
          input.setSelectionRange(input.value.length, input.value.length);
        }
      }
    }, 180);
  }
});

document.addEventListener('change', async (e) => {
  if (e.target.dataset?.bfProp) {
    const idx = Number(e.target.dataset.bfIdx);
    const prop = e.target.dataset.bfProp;
    const item = state.builderFields[idx];
    if (!item) return;
    if (prop === 'required' || prop === 'half') {
      item[prop] = e.target.checked;
    } else if (prop === 'type') {
      item.type = e.target.value;
      if (item.type === 'select' && (!item.options || item.options.length === 0)) {
        item.options = ['General Enquiry', 'Quote Request', 'Support'];
      }
      render();
    }
    return;
  }
  if (e.target.id === 'sub-select-all') {
    state.selectedSubIds = e.target.checked ? state.submissions.map((s) => s.id) : [];
    render();
    return;
  }
  if (e.target.dataset?.subCheck) {
    const id = e.target.dataset.subCheck;
    const set = new Set(state.selectedSubIds || []);
    if (e.target.checked) set.add(id);
    else set.delete(id);
    state.selectedSubIds = Array.from(set);
    render();
    return;
  }
  if (e.target.matches('[data-ch-toggle]')) {
    const chId = e.target.getAttribute('data-ch-toggle');
    if (!state.channelsConfig[chId]) state.channelsConfig[chId] = {};
    state.channelsConfig[chId].enabled = e.target.checked;
    api.saveChannels(state.channelsConfig).catch(() => {});
    render();
    return;
  }
  if (e.target.matches('[data-ch-field]')) {
    const chId = e.target.getAttribute('data-ch-field');
    const key = e.target.getAttribute('data-field-key');
    if (!state.channelsConfig[chId]) state.channelsConfig[chId] = { enabled: true };
    state.channelsConfig[chId][key] = e.target.value;
    return;
  }
  if (e.target.id === 'header-client-switcher') {
    state.clientFilter = e.target.value;
    if (state.view === 'form') {
      state.view = 'forms';
    }
    render();
    return;
  }
  if (e.target.id === 'bf-multi-step') {
    state.builderMultiStep = e.target.checked;
    return;
  }
  if (e.target.id === 'wiz-accent-pick') {
    const inp = document.getElementById('wiz-accent');
    if (inp) inp.value = e.target.value;
    return;
  }
  if (e.target.id === 'sb-form') {
    state.sandboxFormId = e.target.value;
    render();
  } else if (e.target.id === 'sb-mode') {
    state.sandboxMode = e.target.value;
    render();
  } else if (e.target.id === 'sb-bot') {
    state.sandboxSimulateBot = e.target.checked;
  } else if (e.target.id === 'ws-accent-picker') {
    const hex = e.target.value;
    const input = document.getElementById('ws-accent');
    if (input) input.value = hex;
    applyDraftBranding();
  } else if (e.target.id === 'ws-bg-picker') {
    const hex = e.target.value;
    const input = document.getElementById('ws-bg');
    if (input) input.value = hex;
    applyDraftBranding();
  } else if (e.target.id === 'ws-font' || e.target.id === 'ws-radius') {
    applyDraftBranding();
  } else if (e.target.id === 'ws-logo-file') {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { workspace } = await api.uploadLogo(file);
      state.workspace = workspace;
      applyWorkspaceBranding();
      render();
      showToast('Brand logo uploaded');
    } catch (err) {
      showToast(err.message);
    }
  } else if (e.target.id === 'import-brand-input') {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      const { workspace } = await api.updateWorkspace(parsed);
      state.workspace = workspace;
      applyWorkspaceBranding();
      render();
      showToast('Brand kit imported');
    } catch {
      showToast('Invalid brand kit JSON file');
    }
  }
});

// Form submissions
document.addEventListener('submit', async (e) => {
  const form = e.target;

  if (form.id === 'assistant-chat-form') {
    e.preventDefault();
    const inp = document.getElementById('assistant-input');
    const msg = (inp?.value || '').trim();
    if (!msg) return;
    state.assistantByok.provider = document.getElementById('byok-provider')?.value || 'gemini';
    state.assistantByok.apiKey = document.getElementById('byok-key')?.value?.trim() || '';
    state.assistantMessages.push({ role: 'user', text: msg });
    if (inp) inp.value = '';
    render();
    try {
      const res = await api.askAssistant(msg, state.assistantByok);
      state.assistantMessages.push({ role: 'assistant', text: res.reply || 'Done.' });
      state.assistantDraftForm = res.draftForm || null;
      render();
      const log = document.getElementById('assistant-chat-log');
      if (log) log.scrollTop = log.scrollHeight;
    } catch (err) {
      state.assistantMessages.push({ role: 'assistant', text: 'Error: ' + err.message });
      render();
    }
    return;
  }

  if (form.id === 'partner-create-client-form') {
    e.preventDefault();
    const fd = new FormData(form);
    const holder = String(fd.get('holder') || '').trim();
    const domain = String(fd.get('domain') || '').trim();
    if (!domain) {
      showToast('Enter a client website domain');
      return;
    }
    try {
      const res = await api.createPartnerClient(domain, holder || domain);
      state.partnerIssuedKey = {
        domain: res.client?.domain || domain,
        holder: res.client?.holder || holder || domain,
        key: res.key || res.client?.license_key || '',
      };
      await refreshBootstrap();
      render();
      showToast(`Created account & minted key for ${state.partnerIssuedKey.holder}`);
    } catch (err) {
      showToast(err.message);
    }
    return;
  }

  if (form.id === 'login-form') {
    e.preventDefault();
    const fd = new FormData(form);
    const domainVal = String(document.getElementById('login-domain')?.value || fd.get('domain') || '').trim();
    const keyVal = String(document.getElementById('login-password')?.value || fd.get('password') || '').trim();
    try {
      await api.login(keyVal, domainVal);
      state.authenticated = true;
      await refreshBootstrap();
      state.view = isPartnerSession() ? 'partner-clients' : 'forms';
      render();
    } catch (err) {
      renderLoginScreen(err.message);
    }
    return;
  }

  if (form.id === 'workspace-settings-form') {
    e.preventDefault();
    const fd = new FormData(form);
    const accent = String(fd.get('accent_color') || '#095c4f').trim();
    try {
      const { workspace } = await api.updateWorkspace({
        brand_name: fd.get('brand_name'),
        website_url: fd.get('website_url'),
        support_email: fd.get('support_email'),
        license_holder: fd.get('license_holder'),
        logo_url: fd.get('logo_url'),
        accent_color: accent,
        accent_text_color: contrastTextForHex(accent),
        bg_color: fd.get('bg_color'),
        font_preset: fd.get('font_preset'),
        radius_preset: fd.get('radius_preset'),
        thanks_heading: fd.get('thanks_heading'),
        thanks_body: fd.get('thanks_body'),
        email_footer: fd.get('email_footer'),
        email_provider: fd.get('email_provider'),
        mail_from: fd.get('mail_from'),
        resend_api_key: fd.get('resend_api_key') || undefined,
        new_admin_password: fd.get('new_admin_password') || undefined,
        new_owner_pin: fd.get('new_owner_pin') || undefined,
      });
      state.workspace = workspace;
      applyWorkspaceBranding();
      render();
      showToast('Brand & hosting settings saved');
    } catch (err) {
      showToast(err.message);
    }
    return;
  }

  if (form.id === 'create-form-modal') {
    e.preventDefault();
    const fd = new FormData(form);
    const tplKey = String(fd.get('template') || 'general');
    const tpl = ENQUIRY_TEMPLATES[tplKey];
    const starterFields =
      tplKey === 'blank'
        ? [{ name: 'name', label: 'Full name', type: 'text', placeholder: 'Your name', required: true, half: false }]
        : tpl?.fields || ENQUIRY_TEMPLATES.general.fields;
    try {
      const { form: created } = await api.createForm({
        name: fd.get('name'),
        client_name: fd.get('client_name') || state.workspace?.brand_name || 'Website',
        email_recipients: fd.get('email_recipients') || '',
        allowed_origins: '*',
        fields: starterFields,
        submit_label: tpl?.submitLabel || 'Send Enquiry',
        multi_step: Boolean(tpl?.multiStep),
      });
      closeModal();
      await refreshBootstrap();
      await openForm(created.id, 'builder');
      showToast(`Created "${created.name}"`);
    } catch (err) {
      showToast(err.message);
    }
    return;
  }

  if (form.id === 'wf-redirect-form') {
    e.preventDefault();
    const fd = new FormData(form);
    await api.updateForm(state.selectedFormId, { redirect_url: fd.get('redirect_url') || '' });
    await loadFormDetail(state.selectedFormId);
    render();
    showToast('Redirect response saved');
    return;
  }

  if (form.id === 'wf-email-form') {
    e.preventDefault();
    const fd = new FormData(form);
    await api.updateForm(state.selectedFormId, {
      email_recipients: fd.get('email_recipients') || '',
      send_autoresponse: fd.get('send_autoresponse') === 'on',
    });
    state.wfEmailEditorOpen = false;
    await loadFormDetail(state.selectedFormId);
    render();
    showToast('Email action updated');
    return;
  }

  if (form.id === 'add-webhook-form') {
    e.preventDefault();
    const fd = new FormData(form);
    try {
      await api.createWebhook(state.selectedFormId, {
        label: fd.get('label'),
        target_url: fd.get('target_url'),
        format: fd.get('format') || 'generic',
      });
      closeModal();
      await refreshBootstrap();
      await loadFormDetail(state.selectedFormId);
      render();
      showToast('Action connected');
    } catch (err) {
      showToast(err.message);
    }
    return;
  }

  if (form.id === 'form-settings-form') {
    e.preventDefault();
    const fd = new FormData(form);
    try {
      await api.updateForm(state.selectedFormId, {
        name: fd.get('name'),
        client_name: fd.get('client_name'),
        email_recipients: fd.get('email_recipients'),
        redirect_url: fd.get('redirect_url'),
        rate_limit_per_hour: Number(fd.get('rate_limit_per_hour') || 60),
        allowed_origins: fd.get('allowed_origins') || '*',
        turnstile_site_key: fd.get('turnstile_site_key') || '',
        turnstile_secret_key: fd.get('turnstile_secret_key') || '',
        enable_honeypot: fd.get('enable_honeypot') === 'on',
        is_active: fd.get('is_active') === 'on',
        send_autoresponse: fd.get('send_autoresponse') === 'on',
        autoresponse_subject: fd.get('autoresponse_subject'),
        autoresponse_body: fd.get('autoresponse_body'),
      });
      await refreshBootstrap();
      await loadFormDetail(state.selectedFormId);
      render();
      showToast('Settings saved');
    } catch (err) {
      showToast(err.message);
    }
    return;
  }

  if (form.id === 'sandbox-form') {
    e.preventDefault();
    const fd = new FormData(form);
    const formId = fd.get('formId');
    const mode = fd.get('mode');
    const endpoint = `/f/${encodeURIComponent(formId)}`;

    const payloadFields = {
      name: fd.get('name'),
      email: fd.get('email'),
      website: fd.get('website'),
      message: fd.get('message'),
      _subject: fd.get('_subject'),
    };
    if (state.sandboxSimulateBot) {
      payloadFields._gotcha = 'bot-filled-honeypot-trap';
    }

    const started = performance.now();
    let res;
    if (mode === 'json') {
      res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payloadFields),
      });
    } else if (mode === 'urlencoded') {
      const params = new URLSearchParams();
      Object.entries(payloadFields).forEach(([k, v]) => {
        if (v !== null && v !== undefined) params.append(k, String(v));
      });
      res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });
    } else {
      const multipart = new FormData();
      Object.entries(payloadFields).forEach(([k, v]) => {
        if (v !== null && v !== undefined) multipart.append(k, String(v));
      });
      const fileInput = document.getElementById('sb-file');
      if (fileInput?.files?.[0]) {
        multipart.append('attachment', fileInput.files[0]);
      }
      res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: multipart,
      });
    }

    const durationMs = Math.round(performance.now() - started);
    const body = await res.json().catch(() => ({}));
    const headers = {};
    for (const key of ['content-type', 'x-ratelimit-limit', 'x-ratelimit-remaining', 'access-control-allow-origin']) {
      const val = res.headers.get(key);
      if (val) headers[key] = val;
    }

    state.sandboxResult = {
      formId,
      status: res.status,
      durationMs,
      headers,
      body,
    };

    await refreshBootstrap();
    render();
    showToast(body.spam ? 'Bot intercepted by _gotcha honeypot' : 'Submission captured and dispatched');
  }
});

// Live input sync for Notification Channel fields
document.addEventListener('input', (e) => {
  if (e.target.matches('[data-ch-field]')) {
    const chId = e.target.getAttribute('data-ch-field');
    const key = e.target.getAttribute('data-field-key');
    if (!state.channelsConfig[chId]) state.channelsConfig[chId] = { enabled: true };
    state.channelsConfig[chId][key] = e.target.value;
  }
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (state.projectMenuOpen) {
      state.projectMenuOpen = false;
      const wrap = document.querySelector('.project-heading-wrap');
      wrap?.classList.remove('open');
      wrap?.querySelector('.heading-switcher')?.setAttribute('aria-expanded', 'false');
    }
    closeDrawer();
    closeModal();
  } else if (e.key === '[' && !e.metaKey && !e.ctrlKey && !e.altKey) {
    const tag = document.activeElement?.tagName;
    if (tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT' && state.authenticated) {
      toggleSidebarPane();
    }
  }
});

window.addEventListener('resize', () => {
  if (window.innerWidth > 1120) {
    els.app.classList.remove('sidebar-open');
  }
  syncSidebarToggleState();
});

// ============================================================
// INIT
// ============================================================
async function init() {
  try {
    if (localStorage.getItem('formsflow_sidebar_collapsed') === '1') {
      els.app.classList.add('sidebar-collapsed');
    }
  } catch {}

  const auth = await api.authStatus();
  if (auth.workspace) {
    state.workspace = auth.workspace;
    applyWorkspaceBranding();
  }
  state.authenticated = auth.authenticated;
  if (!state.authenticated) {
    renderLoginScreen();
    return;
  }

  await refreshBootstrap();
  if (window.location.pathname === '/setup') {
    state.view = 'setup';
    render();
    return;
  }
  const params = new URLSearchParams(window.location.search);
  const requestedView = params.get('view');
  const requestedForm = params.get('form');
  if (requestedView === 'assistant') {
    state.view = 'assistant';
    render();
  } else if (requestedForm && state.forms.some((f) => f.id === requestedForm)) {
    await openForm(requestedForm);
  } else {
    if (isPartnerSession()) {
      state.view = 'partner-clients';
    }
    render();
  }
}

init().catch((err) => {
  console.error(err);
  els.content.innerHTML = `<div class="card card-padded">Unable to initialize AskForms: ${escapeHtml(err.message)}</div>`;
});
