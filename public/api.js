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
  authStatus: () => request('/api/auth/status'),
  login: (password) => request('/api/auth/login', { method: 'POST', body: JSON.stringify({ password }) }),
  logout: () => request('/api/auth/logout', { method: 'POST' }),
  bootstrap: () => request('/api/bootstrap'),
  updateWorkspace: (payload) => request('/api/workspace', { method: 'PATCH', body: JSON.stringify(payload) }),
  uploadLogo: async (file) => {
    const fd = new FormData();
    fd.append('logo', file);
    const res = await fetch('/api/workspace/logo', { method: 'POST', body: fd });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  },
  clearDemoData: () => request('/api/workspace/clear-demo', { method: 'POST' }),
  activateLicense: (license_key) => request('/api/license/activate', { method: 'POST', body: JSON.stringify({ license_key }) }),
  issueLicense: (domain, holder, activate = true) =>
    request('/api/license/issue', { method: 'POST', body: JSON.stringify({ domain, holder, activate }) }),
  removeLicense: () => request('/api/license/remove', { method: 'POST' }),
  listForms: () => request('/api/forms'),
  getForm: (id) => request(`/api/forms/${encodeURIComponent(id)}`),
  createForm: (payload) => request('/api/forms', { method: 'POST', body: JSON.stringify(payload) }),
  updateForm: (id, payload) => request(`/api/forms/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteForm: (id) => request(`/api/forms/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  listSubmissions: (id, filter = 'inbox', q = '') =>
    request(`/api/forms/${encodeURIComponent(id)}/submissions?filter=${encodeURIComponent(filter)}&q=${encodeURIComponent(q)}`),
  clearSubmissions: (id) => request(`/api/forms/${encodeURIComponent(id)}/submissions`, { method: 'DELETE' }),
  updateSubmission: (subId, payload) =>
    request(`/api/submissions/${encodeURIComponent(subId)}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  toggleSpam: (subId, is_spam) =>
    request(`/api/submissions/${encodeURIComponent(subId)}`, { method: 'PATCH', body: JSON.stringify({ is_spam }) }),
  deleteSubmission: (subId) => request(`/api/submissions/${encodeURIComponent(subId)}`, { method: 'DELETE' }),
  createWebhook: (formId, payload) =>
    request(`/api/forms/${encodeURIComponent(formId)}/webhooks`, { method: 'POST', body: JSON.stringify(payload) }),
  toggleWebhook: (whId, is_active) =>
    request(`/api/webhooks/${encodeURIComponent(whId)}`, { method: 'PATCH', body: JSON.stringify({ is_active }) }),
  testWebhook: (whId) => request(`/api/webhooks/${encodeURIComponent(whId)}/test`, { method: 'POST' }),
  deleteWebhook: (whId) => request(`/api/webhooks/${encodeURIComponent(whId)}`, { method: 'DELETE' }),
  listMailLogs: (formId = '') => request(`/api/mail-logs${formId ? `?formId=${encodeURIComponent(formId)}` : ''}`),
  listWebhookLogs: (formId = '') => request(`/api/webhook-logs${formId ? `?formId=${encodeURIComponent(formId)}` : ''}`),
  getChannels: () => request('/api/channels'),
  saveChannels: (config) => request('/api/channels', { method: 'PUT', body: JSON.stringify({ config }) }),
  testChannel: (channelId, cfg) => request('/api/channels/test', { method: 'POST', body: JSON.stringify({ channelId, cfg }) }),
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
  if (!iso) return '';
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

export function copyText(text, toastFn) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => toastFn('Copied to clipboard'));
  } else {
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    toastFn('Copied to clipboard');
  }
}
