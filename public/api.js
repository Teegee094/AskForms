const IS_DEMO_MODE =
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).get('demo') === '1';

export function isDemoMode() {
  return IS_DEMO_MODE;
}

const DEMO_STORAGE_KEY = 'askforms_studio_demo_v2';

const DEMO_CHANNEL_DEFS = [
  { id: 'email_resend', name: 'Email (Resend)', cost: 'Free (3,000/mo)', description: 'Formatted enquiry emails with 1-click Reply-To.', fields: [{ key: 'to', label: 'Recipient Email', placeholder: 'owner@yourdomain.com.au', type: 'email' }, { key: 'apiKey', label: 'Resend API Key', placeholder: 're_xxxxxxxxx', type: 'password' }] },
  { id: 'ntfy', name: 'ntfy Push', cost: '100% Free & Open Source', description: 'Instant native iOS & Android push alerts via ntfy.sh.', fields: [{ key: 'topic', label: 'ntfy Topic Name', placeholder: 'askforms-mybusiness', type: 'text' }] },
  { id: 'telegram', name: 'Telegram', cost: '100% Free Unlimited', description: 'Instant push alerts to your phone or team group.', fields: [{ key: 'botToken', label: 'Bot Token', placeholder: '123456:ABC-DEF...', type: 'password' }, { key: 'chatId', label: 'Chat ID', placeholder: '-1001234567890', type: 'text' }] },
  { id: 'discord', name: 'Discord', cost: '100% Free Unlimited', description: 'Rich embed enquiry cards posted into your Discord channel.', fields: [{ key: 'webhookUrl', label: 'Channel Webhook URL', placeholder: 'https://discord.com/api/webhooks/...', type: 'url' }] },
  { id: 'slack', name: 'Slack', cost: '100% Free', description: 'Clean enquiry summary cards sent straight into Slack.', fields: [{ key: 'webhookUrl', label: 'Incoming Webhook URL', placeholder: 'https://hooks.slack.com/services/...', type: 'url' }] },
  { id: 'whatsapp', name: 'WhatsApp', cost: 'Free (CallMeBot)', description: 'Direct WhatsApp push alerts to your mobile.', fields: [{ key: 'phone', label: 'Phone (+61...)', placeholder: '+61412345678', type: 'text' }, { key: 'apiKey', label: 'CallMeBot API Key', placeholder: '1234567', type: 'password' }] },
  { id: 'teams', name: 'Microsoft Teams', cost: '100% Free', description: 'Enquiry cards posted directly into Microsoft Teams.', fields: [{ key: 'webhookUrl', label: 'Teams Webhook URL', placeholder: 'https://outlook.office.com/webhook/...', type: 'url' }] },
  { id: 'google_chat', name: 'Google Chat', cost: '100% Free', description: 'Instant notifications into your Google Chat Space.', fields: [{ key: 'webhookUrl', label: 'Space Webhook URL', placeholder: 'https://chat.googleapis.com/v1/spaces/...', type: 'url' }] },
  { id: 'line', name: 'LINE', cost: 'Free Tier (200/mo)', description: 'Direct push notifications to your LINE account.', fields: [{ key: 'channelToken', label: 'Channel Access Token', placeholder: 'LINE Messaging API token', type: 'password' }, { key: 'toId', label: 'User or Group ID', placeholder: 'U4af4980629...', type: 'text' }] },
  { id: 'wechat', name: 'WeChat Work', cost: '100% Free', description: 'Markdown alerts sent to a WeChat Work group robot.', fields: [{ key: 'webhookUrl', label: 'WeCom Robot Webhook URL', placeholder: 'https://qyapi.weixin.qq.com/...', type: 'url' }] },
  { id: 'gotify', name: 'Gotify Push', cost: '100% Free & Open Source', description: 'Self-hosted open-source mobile push notifications.', fields: [{ key: 'serverUrl', label: 'Gotify Server URL', placeholder: 'https://push.yourdomain.com', type: 'url' }, { key: 'appToken', label: 'Application Token', placeholder: 'Axxxxxxxxxx', type: 'password' }] },
  { id: 'custom_webhook', name: 'Custom Webhook', cost: '100% Free', description: 'Send JSON payloads to Make, n8n, Zapier, or any CRM.', fields: [{ key: 'webhookUrl', label: 'Endpoint URL', placeholder: 'https://hook.make.com/...', type: 'url' }] },
];

function createDefaultDemoStore() {
  const now = new Date().toISOString();
  return {
    workspace: {
      brand_name: 'AskForms',
      website_url: 'https://harbourplumbing.com.au',
      support_email: 'hello@harbourplumbing.com.au',
      license_holder: 'Interactive Demo Mode',
      logo_url: '',
      accent_color: '#14383e',
      accent_text_color: '#ffffff',
      bg_color: '#f7fafc',
      surface_color: '#ffffff',
      font_preset: 'minimal',
      radius_preset: 'balanced',
      thanks_heading: 'Enquiry received',
      thanks_body: 'Thanks for reaching out. Our team will get back to you shortly.',
      email_footer: 'Sent via AskForms',
      email_provider: 'local',
      mail_from: 'forms@harbourplumbing.com.au',
      auth_enabled: false,
      license: {
        isLicensed: true,
        licensedDomain: 'harbourplumbing.com.au',
        holder: 'Interactive Demo Workspace',
        message: 'Interactive Studio Demo (changes stay in your browser)',
      },
    },
    forms: [
      {
        id: 'template-quote',
        name: 'Fast Quote Request',
        client_name: 'Trades & Services',
        theme_preset: 'teagee',
        email_recipients: 'quotes@harbourplumbing.com.au',
        allowed_origins: '*',
        redirect_url: '',
        enable_honeypot: 1,
        send_autoresponse: 1,
        is_active: 1,
        is_archived: 0,
        submit_label: 'Send Quote Request',
        multi_step: 1,
        review_gate_url: '',
        fields: [
          { name: 'service_type', label: 'What do you need a quote for?', type: 'select', required: true, options: ['Emergency Repair', 'New Installation', 'Routine Maintenance'] },
          { name: 'suburb', label: 'Suburb or Postcode', type: 'text', required: true, placeholder: 'Surry Hills 2010' },
          { name: 'name', label: 'Your Name', type: 'text', required: true, placeholder: 'Alex Mercer' },
          { name: 'phone', label: 'Mobile Number', type: 'tel', required: true, placeholder: '0412 345 678' },
          { name: 'email', label: 'Email Address', type: 'email', required: true, placeholder: 'alex@example.com.au' },
          { name: 'message', label: 'Job Details', type: 'textarea', required: true, placeholder: 'Describe the job...' },
        ],
      },
      {
        id: 'template-appointment',
        name: 'Appointment Booking',
        client_name: 'Appointments',
        theme_preset: 'teagee',
        email_recipients: 'bookings@harbourplumbing.com.au',
        allowed_origins: '*',
        redirect_url: '',
        enable_honeypot: 1,
        send_autoresponse: 1,
        is_active: 1,
        is_archived: 0,
        submit_label: 'Request Appointment',
        multi_step: 1,
        review_gate_url: '',
        fields: [
          { name: 'appointment_type', label: 'Consultation Type', type: 'select', required: true, options: ['Initial Assessment', 'Standard Consultation', 'Discovery Call'] },
          { name: 'preferred_day', label: 'Preferred Day', type: 'select', required: true, options: ['Next Available', 'Monday or Tuesday', 'Wednesday or Thursday'] },
          { name: 'name', label: 'Full Name', type: 'text', required: true, placeholder: 'Sarah Jenkins' },
          { name: 'email', label: 'Email Address', type: 'email', required: true, placeholder: 'sarah@example.com.au' },
          { name: 'phone', label: 'Mobile Number', type: 'tel', required: true, placeholder: '0400 123 456' },
        ],
      },
    ],
    submissions: [
      {
        id: 'sub_demo_1',
        form_id: 'template-quote',
        form_name: 'Fast Quote Request',
        sender_name: 'Tom Callahan',
        sender_email: 'tom@callahanbuild.com.au',
        subject: 'Fast Quote Request',
        origin: 'https://harbourplumbing.com.au',
        is_spam: 0,
        status: 'new',
        notes: 'Urgent callback requested.',
        created_at: now,
        data: { service_type: 'Emergency Repair', suburb: 'Surry Hills 2010', phone: '0418 294 110', message: 'Hot water system leaking in ground floor laundry, need a quote today.' },
        attachments: [],
      },
      {
        id: 'sub_demo_2',
        form_id: 'template-appointment',
        form_name: 'Appointment Booking',
        sender_name: 'Sarah Jenkins',
        sender_email: 'sarah.j@example.com.au',
        subject: 'Appointment Booking',
        origin: 'https://harbourplumbing.com.au',
        is_spam: 0,
        status: 'replied',
        notes: 'Booked for Wednesday 9am.',
        created_at: now,
        data: { appointment_type: 'Initial Assessment', preferred_day: 'Wednesday or Thursday', phone: '0402 881 334', message: 'Looking for an initial site assessment next week.' },
        attachments: [],
      },
    ],
    channelsConfig: {
      ntfy: { enabled: true, topic: 'askforms-demo-alerts' },
    },
  };
}

function loadDemoStore() {
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  const store = createDefaultDemoStore();
  saveDemoStore(store);
  return store;
}

function saveDemoStore(store) {
  try {
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(store));
  } catch {}
}

function demoFormsWithCounts(store) {
  return store.forms.map((f) => {
    const subs = store.submissions.filter((s) => s.form_id === f.id);
    const valid = subs.filter((s) => !s.is_spam);
    const spam = subs.filter((s) => s.is_spam);
    return {
      ...f,
      submission_count: valid.length,
      spam_count: spam.length,
      last_submission_at: subs[0]?.created_at || null,
      active_webhooks: 0,
    };
  });
}

function demoStats(store) {
  return {
    activeForms: store.forms.filter((f) => f.is_active && !f.is_archived).length,
    archivedForms: store.forms.filter((f) => f.is_archived).length,
    totalForms: store.forms.length,
    validSubmissions: store.submissions.filter((s) => !s.is_spam).length,
    spamBlocked: store.submissions.filter((s) => s.is_spam).length,
    emailsSent: 2,
    webhookTotal: 0,
    webhookOk: 0,
    deliveryRate: 100,
  };
}

function demoAssistantReply(message, store) {
  const lower = String(message || '').toLowerCase();
  if (/analytic|stat|metric|how many|count|performance|top form|spam|summary|report/i.test(lower)) {
    const forms = demoFormsWithCounts(store);
    const st = demoStats(store);
    return {
      intent: 'analytics',
      reply: `Demo Workspace Analytics:\n\n• Active forms: ${st.activeForms}\n• Total enquiries captured: ${st.validSubmissions}\n• Spam bots blocked: ${st.spamBlocked}\n\nBreakdown:\n` + forms.map((f) => `• ${f.name}: ${f.submission_count} enquiries`).join('\n'),
    };
  }
  if (/inbox|enquir|submission|lead|unread|find|search|urgent|recent|latest/i.test(lower) && !/create|build|make|new form|design/i.test(lower)) {
    const matches = store.submissions.filter((s) => !s.is_spam);
    return {
      intent: 'inbox',
      reply: `Found ${matches.length} enquiries in your demo inbox:\n\n` + matches.map((s) => `• ${s.sender_name} (${s.form_name}) [${s.status}]: "${s.data?.message || ''}"`).join('\n'),
    };
  }
  const fields = [
    { name: 'topic', label: 'What can we help with?', type: 'select', required: true, options: ['Quote Request', 'Booking Enquiry', 'General Question'] },
  ];
  if (/suburb|postcode|location|address/i.test(lower)) fields.push({ name: 'suburb', label: 'Suburb or Postcode', type: 'text', required: true, placeholder: 'Surry Hills 2010' });
  if (/roof/i.test(lower)) fields.push({ name: 'roof_type', label: 'Roof Type', type: 'select', required: true, options: ['Colorbond / Metal', 'Tile', 'Flat Roof'] });
  if (/solar/i.test(lower)) fields.push({ name: 'has_solar', label: 'Solar Panels Installed?', type: 'select', required: false, options: ['Yes', 'No'] });
  if (/date|day|time|appoint|book/i.test(lower)) fields.push({ name: 'preferred_date', label: 'Preferred Day & Time', type: 'select', required: true, options: ['Next Available', 'Weekday Morning', 'Weekday Afternoon'] });
  if (/budget|price/i.test(lower)) fields.push({ name: 'budget', label: 'Approximate Budget', type: 'select', required: false, options: ['Under $2,000', '$2,000 to $5,000', '$5,000+'] });
  fields.push(
    { name: 'name', label: 'Full Name', type: 'text', required: true, placeholder: 'Alex Mercer' },
    { name: 'email', label: 'Email Address', type: 'email', required: true, placeholder: 'alex@example.com.au' },
    { name: 'phone', label: 'Mobile Number', type: 'tel', required: true, placeholder: '0412 345 678' },
    { name: 'message', label: 'Details', type: 'textarea', required: true, placeholder: 'Tell us more...' }
  );
  const title = /roof/i.test(lower) ? 'Roofing Quote Form' : /appoint|clinic|physio/i.test(lower) ? 'Clinic Appointment Form' : /event|table|wedding/i.test(lower) ? 'Event Booking Form' : 'Custom Enquiry Form';
  const draftForm = {
    id: 'custom-' + Math.random().toString(36).slice(2, 6),
    name: title,
    client_name: 'Custom Forms',
    submit_label: 'Send Enquiry',
    multi_step: fields.length >= 6 ? 1 : 0,
    fields,
  };
  return {
    intent: 'create_form',
    draftForm,
    reply: `I designed "${draftForm.name}" with ${fields.length} custom fields:\n\n` + fields.map((f) => `• ${f.label} (${f.type})`).join('\n') + `\n\nClick "Create Form Now" below to add it to your demo workspace!`,
  };
}

async function request(path, options = {}) {
  const res = await fetch(path, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || data.errors?.[0]?.message || `HTTP ${res.status}`);
  }
  return data;
}

export const api = {
  authStatus: async () => {
    if (IS_DEMO_MODE) {
      const store = loadDemoStore();
      return { authEnabled: false, authenticated: true, demoMode: true, workspace: store.workspace };
    }
    return request('/api/auth/status');
  },
  login: (password, domain = '') => request('/api/auth/login', { method: 'POST', body: JSON.stringify({ password, domain }) }),
  logout: () => (IS_DEMO_MODE ? Promise.resolve({ ok: true }) : request('/api/auth/logout', { method: 'POST' })),
  bootstrap: async () => {
    if (IS_DEMO_MODE) {
      const store = loadDemoStore();
      return { baseUrl: window.location.origin, stats: demoStats(store), forms: demoFormsWithCounts(store), workspace: store.workspace };
    }
    return request('/api/bootstrap');
  },
  updateWorkspace: async (payload) => {
    if (IS_DEMO_MODE) {
      const store = loadDemoStore();
      store.workspace = { ...store.workspace, ...payload };
      saveDemoStore(store);
      return { workspace: store.workspace };
    }
    return request('/api/workspace', { method: 'PATCH', body: JSON.stringify(payload) });
  },
  uploadLogo: async (file) => {
    if (IS_DEMO_MODE) {
      const url = URL.createObjectURL(file);
      const store = loadDemoStore();
      store.workspace.logo_url = url;
      saveDemoStore(store);
      return { logo_url: url, workspace: store.workspace };
    }
    const fd = new FormData();
    fd.append('logo', file);
    const res = await fetch('/api/workspace/logo', { method: 'POST', body: fd });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  },
  clearDemoData: () => (IS_DEMO_MODE ? Promise.resolve({ ok: true }) : request('/api/workspace/clear-demo', { method: 'POST' })),
  activateLicense: (license_key) => request('/api/license/activate', { method: 'POST', body: JSON.stringify({ license_key }) }),
  issueLicense: (domain, holder, activate = true) =>
    request('/api/license/issue', { method: 'POST', body: JSON.stringify({ domain, holder, activate }) }),
  removeLicense: () => request('/api/license/remove', { method: 'POST' }),
  listForms: async () => {
    if (IS_DEMO_MODE) return { forms: demoFormsWithCounts(loadDemoStore()) };
    return request('/api/forms');
  },
  getForm: async (id) => {
    if (IS_DEMO_MODE) {
      const store = loadDemoStore();
      const f = demoFormsWithCounts(store).find((item) => item.id === id) || demoFormsWithCounts(store)[0];
      return { form: f, webhooks: [] };
    }
    return request(`/api/forms/${encodeURIComponent(id)}`);
  },
  createForm: async (payload) => {
    if (IS_DEMO_MODE) {
      const store = loadDemoStore();
      const name = String(payload.name || 'Custom Form').trim();
      const id = payload.id || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') + '-' + Math.random().toString(36).slice(2, 5);
      const created = {
        id,
        name,
        client_name: payload.client_name || 'Website',
        theme_preset: payload.theme_preset || 'teagee',
        email_recipients: payload.email_recipients || '',
        allowed_origins: payload.allowed_origins || '*',
        redirect_url: '',
        enable_honeypot: 1,
        send_autoresponse: 1,
        is_active: 1,
        is_archived: 0,
        submit_label: payload.submit_label || 'Send Enquiry',
        multi_step: payload.multi_step ? 1 : 0,
        review_gate_url: '',
        fields: Array.isArray(payload.fields) && payload.fields.length > 0 ? payload.fields : store.forms[0].fields,
      };
      store.forms.unshift(created);
      saveDemoStore(store);
      return { form: { ...created, submission_count: 0, spam_count: 0, active_webhooks: 0 } };
    }
    return request('/api/forms', { method: 'POST', body: JSON.stringify(payload) });
  },
  updateForm: async (id, payload) => {
    if (IS_DEMO_MODE) {
      const store = loadDemoStore();
      store.forms = store.forms.map((f) => (f.id === id ? { ...f, ...payload } : f));
      saveDemoStore(store);
      const updated = demoFormsWithCounts(store).find((f) => f.id === id);
      return { form: updated };
    }
    return request(`/api/forms/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(payload) });
  },
  deleteForm: async (id) => {
    if (IS_DEMO_MODE) {
      const store = loadDemoStore();
      store.forms = store.forms.filter((f) => f.id !== id);
      saveDemoStore(store);
      return { deleted: true };
    }
    return request(`/api/forms/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },
  listSubmissions: async (id, filter = 'inbox', q = '') => {
    if (IS_DEMO_MODE) {
      const store = loadDemoStore();
      const list = store.submissions.filter((s) => s.form_id === id && (filter === 'spam' ? s.is_spam : !s.is_spam));
      return { submissions: list };
    }
    return request(`/api/forms/${encodeURIComponent(id)}/submissions?filter=${encodeURIComponent(filter)}&q=${encodeURIComponent(q)}`);
  },
  clearSubmissions: (id) => (IS_DEMO_MODE ? Promise.resolve({ ok: true }) : request(`/api/forms/${encodeURIComponent(id)}/submissions`, { method: 'DELETE' })),
  updateSubmission: (subId, payload) =>
    IS_DEMO_MODE ? Promise.resolve({ ok: true }) : request(`/api/submissions/${encodeURIComponent(subId)}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  toggleSpam: (subId, is_spam) =>
    IS_DEMO_MODE ? Promise.resolve({ ok: true }) : request(`/api/submissions/${encodeURIComponent(subId)}`, { method: 'PATCH', body: JSON.stringify({ is_spam }) }),
  deleteSubmission: (subId) => (IS_DEMO_MODE ? Promise.resolve({ ok: true }) : request(`/api/submissions/${encodeURIComponent(subId)}`, { method: 'DELETE' })),
  createWebhook: (formId, payload) =>
    IS_DEMO_MODE ? Promise.resolve({ ok: true }) : request(`/api/forms/${encodeURIComponent(formId)}/webhooks`, { method: 'POST', body: JSON.stringify(payload) }),
  toggleWebhook: (whId, is_active) =>
    IS_DEMO_MODE ? Promise.resolve({ ok: true }) : request(`/api/webhooks/${encodeURIComponent(whId)}`, { method: 'PATCH', body: JSON.stringify({ is_active }) }),
  testWebhook: (whId) => (IS_DEMO_MODE ? Promise.resolve({ ok: true }) : request(`/api/webhooks/${encodeURIComponent(whId)}/test`, { method: 'POST' })),
  deleteWebhook: (whId) => (IS_DEMO_MODE ? Promise.resolve({ ok: true }) : request(`/api/webhooks/${encodeURIComponent(whId)}`, { method: 'DELETE' })),
  listMailLogs: (formId = '') => (IS_DEMO_MODE ? Promise.resolve({ logs: [] }) : request(`/api/mail-logs${formId ? `?formId=${encodeURIComponent(formId)}` : ''}`)),
  listWebhookLogs: (formId = '') => (IS_DEMO_MODE ? Promise.resolve({ logs: [] }) : request(`/api/webhook-logs${formId ? `?formId=${encodeURIComponent(formId)}` : ''}`)),
  getChannels: async () => {
    if (IS_DEMO_MODE) {
      const store = loadDemoStore();
      return { definitions: DEMO_CHANNEL_DEFS, config: store.channelsConfig || {} };
    }
    return request('/api/channels');
  },
  saveChannels: async (config) => {
    if (IS_DEMO_MODE) {
      const store = loadDemoStore();
      store.channelsConfig = config;
      saveDemoStore(store);
      return { saved: true, config };
    }
    return request('/api/channels', { method: 'PUT', body: JSON.stringify({ config }) });
  },
  testChannel: async (channelId, cfg) => {
    if (IS_DEMO_MODE) return { ok: true, demo: true };
    return request('/api/channels/test', { method: 'POST', body: JSON.stringify({ channelId, cfg }) });
  },
  askAssistant: async (message, byok = {}) => {
    if (IS_DEMO_MODE) {
      return demoAssistantReply(message, loadDemoStore());
    }
    return request('/api/assistant', { method: 'POST', body: JSON.stringify({ message, byok }) });
  },
  listPartnerClients: () => request('/api/partner/clients'),
  createPartnerClient: (domain, holder) =>
    request('/api/partner/clients', { method: 'POST', body: JSON.stringify({ domain, holder }) }),
  impersonateClient: (domain, holder) =>
    request('/api/partner/impersonate', { method: 'POST', body: JSON.stringify({ domain, holder }) }),
  exitImpersonation: () =>
    request('/api/partner/exit-impersonation', { method: 'POST' }),
};

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function parseDate(iso) {
  if (!iso) return null;
  const normalized =
    typeof iso === 'string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(iso)
      ? `${iso.replace(' ', 'T')}Z`
      : iso;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatRelativeTime(iso) {
  if (!iso) return 'Never';
  const date = parseDate(iso);
  if (!date) return iso;
  const diffSec = Math.max(0, Math.round((Date.now() - date.getTime()) / 1000));
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  return date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatTimestamp(iso) {
  if (!iso) return 'Never';
  const date = parseDate(iso);
  if (!date) return iso;
  return date.toLocaleString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export async function copyText(text, showToast) {
  try {
    await navigator.clipboard.writeText(text);
    if (showToast) showToast('Copied to clipboard');
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    if (showToast) showToast('Copied to clipboard');
  }
}
