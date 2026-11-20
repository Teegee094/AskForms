function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const FONT_PRESETS = {
  editorial: {
    heading: "'Fraunces', Georgia, serif",
    body: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
    tracking: '-0.025em',
  },
  modern: {
    heading: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
    body: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
    tracking: '-0.03em',
  },
  minimal: {
    heading: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    body: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    tracking: '-0.02em',
  },
  classic: {
    heading: "'Newsreader', Georgia, serif",
    body: "'Manrope', -apple-system, BlinkMacSystemFont, sans-serif",
    tracking: '-0.015em',
  },
};

const RADIUS_PRESETS = {
  sharp: { card: '8px', input: '6px', button: '8px' },
  balanced: { card: '14px', input: '10px', button: '999px' },
  soft: { card: '26px', input: '12px', button: '999px' },
};

const GOOGLE_FONTS_LINK =
  'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Manrope:wght@400;500;600;700&family=Newsreader:opsz,wght@6..72,500;6..72,600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap';

function resolveBrandTheme(workspace = {}) {
  const fonts = FONT_PRESETS[workspace.font_preset] || FONT_PRESETS.minimal;
  const radii = RADIUS_PRESETS[workspace.radius_preset] || RADIUS_PRESETS.balanced;
  return {
    label: workspace.brand_name || 'AskForms',
    bg: workspace.bg_color || '#f7fafc',
    surface: workspace.surface_color || '#ffffff',
    border: '#e2e8f0',
    ink: '#14383e',
    muted: '#718096',
    accent: workspace.accent_color || '#14383e',
    accentHover: workspace.accent_color || '#1d4f56',
    accentText: workspace.accent_text_color || '#ffffff',
    headingFont: fonts.heading,
    bodyFont: fonts.body,
    tracking: fonts.tracking,
    cardRadius: radii.card,
    inputRadius: radii.input,
    buttonRadius: radii.button,
    logoUrl: workspace.logo_url || '',
    topBarBg: '',
    topBarText: '',
  };
}

const PRESET_THEMES = {
  teagee: {
    label: 'Editorial',
    bg: '#f7f5f2',
    surface: '#ffffff',
    border: '#e2dcd5',
    ink: '#0d0b0a',
    muted: '#666c73',
    accent: '#095c4f',
    accentHover: '#074a40',
    accentText: '#ffffff',
    topBarBg: '',
    topBarText: '',
    headingFont: "'Fraunces', Georgia, serif",
    bodyFont: "'Manrope', -apple-system, BlinkMacSystemFont, sans-serif",
    cardRadius: '16px',
    inputRadius: '10px',
    buttonRadius: '999px',
    tracking: '-0.025em',
  },
  centella: {
    label: 'Warm Studio',
    bg: '#f1efea',
    surface: '#ffffff',
    border: 'rgba(100, 100, 100, 0.20)',
    ink: '#212121',
    muted: '#727272',
    accent: '#4d403a',
    accentHover: '#27201d',
    accentText: '#ffffff',
    topBarBg: '',
    topBarText: '',
    headingFont: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
    bodyFont: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
    cardRadius: '28px',
    inputRadius: '12px',
    buttonRadius: '999px',
    tracking: '-0.03em',
  },
  sintiro: {
    label: 'Technical',
    bg: '#f8fafc',
    surface: '#ffffff',
    border: '#e2e8f0',
    ink: '#0b1926',
    muted: '#64748b',
    accent: '#35cfef',
    accentHover: '#009ec2',
    accentText: '#0b1926',
    topBarBg: '#07131d',
    topBarText: '#f8fafc',
    headingFont: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
    bodyFont: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
    cardRadius: '14px',
    inputRadius: '10px',
    buttonRadius: '999px',
    tracking: '-0.02em',
  },
};

export function renderThanksPage(form, workspace = {}) {
  const t = resolveBrandTheme(workspace);
  const brandName = workspace.brand_name || 'AskForms';
  const formName = form ? form.name : brandName;
  const heading = workspace.thanks_heading || 'Submission received';
  const body =
    workspace.thanks_body ||
    `Your response for ${formName} has been recorded. Our team will review it and reply shortly.`;
  const returnHref = workspace.website_url || 'javascript:history.back()';
  const returnLabel = workspace.website_url ? `Return to ${brandName}` : 'Return to website';
  const logoHtml = t.logoUrl
    ? `<img src="${escapeHtml(t.logoUrl)}" alt="${escapeHtml(brandName)}" style="max-height:32px;max-width:180px;object-fit:contain;margin-bottom:20px;display:block;" />`
    : `<div class="check" aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      </div>`;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=2" />
  <link rel="alternate icon" href="/favicon.ico?v=2" />
  <title>${escapeHtml(heading)} — ${escapeHtml(brandName)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="${GOOGLE_FONTS_LINK}" rel="stylesheet" />
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 24px;
      background: ${escapeHtml(t.bg)};
      color: ${escapeHtml(t.ink)};
      font-family: ${t.bodyFont};
    }
    .card {
      width: 100%;
      max-width: 480px;
      background: ${escapeHtml(t.surface)};
      border: 1px solid ${escapeHtml(t.border)};
      border-radius: ${t.cardRadius};
      padding: 36px;
    }
    .check {
      width: 40px;
      height: 40px;
      border-radius: 999px;
      background: #f1efea;
      color: ${escapeHtml(t.accent)};
      display: grid;
      place-items: center;
      margin-bottom: 20px;
    }
    .eyebrow {
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: ${escapeHtml(t.muted)};
      margin-bottom: 6px;
    }
    h1 {
      margin: 0 0 12px;
      font-family: ${t.headingFont};
      font-size: 28px;
      font-weight: 500;
      letter-spacing: ${t.tracking};
      line-height: 1.2;
    }
    p {
      margin: 0 0 28px;
      font-size: 15px;
      line-height: 1.6;
      color: #49443f;
    }
    .actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }
    a.btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 11px 22px;
      border-radius: ${t.buttonRadius};
      font-size: 14px;
      font-weight: 600;
      text-decoration: none;
      transition: opacity 0.15s ease;
    }
    .btn-primary {
      background: ${escapeHtml(t.accent)};
      color: ${escapeHtml(t.accentText)};
    }
    .btn-primary:hover { opacity: 0.9; }
    .btn-secondary {
      background: ${escapeHtml(t.surface)};
      color: ${escapeHtml(t.ink)};
      border: 1px solid ${escapeHtml(t.border)};
    }
    .btn-secondary:hover { background: #f6f5f3; }
    .support {
      margin-top: 22px;
      padding-top: 16px;
      border-top: 1px solid #ece8e2;
      font-size: 12.5px;
      color: ${escapeHtml(t.muted)};
    }
    .support a { color: ${escapeHtml(t.accent)}; text-decoration: none; font-weight: 500; }
  </style>
</head>
<body>
  <main class="card">
    ${logoHtml}
    <div class="eyebrow">${escapeHtml(brandName)}</div>
    <h1>${escapeHtml(heading)}</h1>
    <p>${escapeHtml(body)}</p>
    <div class="actions">
      <a class="btn btn-primary" href="${escapeHtml(returnHref)}">${escapeHtml(returnLabel)}</a>
      <a class="btn btn-secondary" href="/?form=${encodeURIComponent(form ? form.id : '')}">Open Dashboard</a>
    </div>
    ${
      workspace.support_email
        ? `<div class="support">Questions? Contact <a href="mailto:${escapeHtml(workspace.support_email)}">${escapeHtml(workspace.support_email)}</a></div>`
        : ''
    }
  </main>
</body>
</html>`;
}

function renderDynamicFieldInputs(fields) {
  const safeFields = Array.isArray(fields) && fields.length > 0 ? fields : [];
  let html = '';
  let i = 0;

  const renderControl = (f) => {
    const id = `ff_${escapeHtml(f.name)}`;
    const name = escapeHtml(f.name);
    const label = escapeHtml(f.label || f.name);
    const req = f.required ? 'required' : '';
    const ph = escapeHtml(f.placeholder || '');

    if (f.type === 'textarea') {
      return `<div class="field"><label for="${id}">${label}${f.required ? ' *' : ''}</label><textarea id="${id}" name="${name}" placeholder="${ph}" ${req}></textarea></div>`;
    }
    if (f.type === 'select') {
      const opts = (Array.isArray(f.options) ? f.options : String(f.options || '').split(','))
        .map((o) => String(o).trim())
        .filter(Boolean)
        .map((o) => `<option value="${escapeHtml(o)}">${escapeHtml(o)}</option>`)
        .join('');
      return `<div class="field"><label for="${id}">${label}${f.required ? ' *' : ''}</label><select id="${id}" name="${name}" ${req}>${opts}</select></div>`;
    }
    if (f.type === 'checklist') {
      const opts = (Array.isArray(f.options) ? f.options : String(f.options || '').split(','))
        .map((o) => String(o).trim())
        .filter(Boolean)
        .map(
          (o) =>
            `<label style="display:flex;align-items:center;gap:8px;font-weight:500;margin:6px 0;cursor:pointer;"><input type="checkbox" name="${name}" value="${escapeHtml(o)}" style="width:16px;height:16px;accent-color:currentColor;" /> <span>${escapeHtml(o)}</span></label>`
        )
        .join('');
      return `<div class="field"><label>${label}${f.required ? ' *' : ''}</label><div>${opts}</div></div>`;
    }
    if (f.type === 'checkbox') {
      return `<div class="field"><label style="display:flex;align-items:center;gap:8px;font-weight:500;cursor:pointer;"><input id="${id}" type="checkbox" name="${name}" value="Yes" ${req} style="width:16px;height:16px;" /> <span>${label}${f.required ? ' *' : ''}</span></label></div>`;
    }
    if (f.type === 'file') {
      return `<div class="field"><label for="${id}">${label}${f.required ? ' *' : ''}</label><input id="${id}" name="${name}" type="file" ${req} /></div>`;
    }
    const inputType = ['text', 'email', 'tel', 'url', 'number', 'date'].includes(f.type) ? f.type : 'text';
    return `<div class="field"><label for="${id}">${label}${f.required ? ' *' : ''}</label><input id="${id}" name="${name}" type="${inputType}" placeholder="${ph}" ${req} /></div>`;
  };

  while (i < safeFields.length) {
    const curr = safeFields[i];
    const next = safeFields[i + 1];
    if (curr.half && next && next.half) {
      html += `<div class="grid">${renderControl(curr)}${renderControl(next)}</div>`;
      i += 2;
    } else {
      html += renderControl(curr);
      i += 1;
    }
  }
  return html;
}

export function renderEmbedPage(form, fields, baseUrl, workspace = {}) {
  const theme = resolveBrandTheme(workspace);
  const actionUrl = `${baseUrl}/f/${encodeURIComponent(form.id)}`;
  const submitLabel = form.submit_label || 'Send enquiry';
  const thanksHeading = workspace.thanks_heading || 'Enquiry received';
  const thanksBody = workspace.thanks_body || 'Thank you for getting in touch. We will reply shortly.';
  const isMultiStep = Boolean(form.multi_step) && fields.length > 2;
  const reviewGateUrl = (form.review_gate_url || '').trim();
  const turnstileKey = (form.turnstile_site_key || '').trim();

  // Split fields cleanly into 2 progressive steps when multi_step is enabled
  let formFieldsHtml = '';
  if (isMultiStep) {
    const splitAt = Math.ceil(fields.length / 2);
    const step1 = fields.slice(0, splitAt);
    const step2 = fields.slice(splitAt);
    formFieldsHtml = `
      <div class="step-progress"><span id="step-label">Step 1 of 2</span><div class="step-bar"><div id="step-fill" class="step-fill" style="width:50%;"></div></div></div>
      <div class="step-pane" data-step="1">
        ${renderDynamicFieldInputs(step1)}
        <div class="step-actions">
          <button type="button" class="btn-primary" id="step-next">Continue</button>
        </div>
      </div>
      <div class="step-pane hidden" data-step="2">
        ${renderDynamicFieldInputs(step2)}
        ${turnstileKey ? `<div class="cf-turnstile" data-sitekey="${escapeHtml(turnstileKey)}" style="margin-bottom:14px;"></div>` : ''}
        <div class="step-actions">
          <button type="button" class="btn-secondary" id="step-back">Back</button>
          <button type="submit" class="btn-primary" id="embed-submit">${escapeHtml(submitLabel)}</button>
        </div>
      </div>
    `;
  } else {
    formFieldsHtml = `
      ${renderDynamicFieldInputs(fields)}
      ${turnstileKey ? `<div class="cf-turnstile" data-sitekey="${escapeHtml(turnstileKey)}" style="margin-bottom:14px;"></div>` : ''}
      <button type="submit" class="btn-primary" id="embed-submit">${escapeHtml(submitLabel)}</button>
    `;
  }

  const reviewGateHtml = reviewGateUrl
    ? `
      <div id="review-gate" class="review-gate">
        <div class="gate-eyebrow">${escapeHtml(workspace.brand_name || form.client_name)}</div>
        <h2 class="done-title" style="margin-bottom:6px;">How was your experience?</h2>
        <p class="done-body" style="margin-bottom:18px;">Tap a rating below to share your feedback.</p>
        <div class="star-row" role="group" aria-label="Rate from 1 to 5 stars">
          ${[1, 2, 3, 4, 5]
            .map(
              (n) =>
                `<button type="button" class="star-btn" data-star="${n}" aria-label="${n} stars"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></button>`
            )
            .join('')}
        </div>
      </div>
      <div id="review-positive" class="done-state">
        <h2 class="done-title">Thank you for the great rating</h2>
        <p class="done-body">We would appreciate a quick review on Google — it helps other local customers find us.</p>
        <a class="btn-primary" style="display:inline-flex;align-items:center;text-decoration:none;" href="${escapeHtml(reviewGateUrl)}" target="_blank" rel="noopener">Leave a Google Review</a>
      </div>
    `
    : '';

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=2" />
  <link rel="alternate icon" href="/favicon.ico?v=2" />
  <title>${escapeHtml(form.name)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="${GOOGLE_FONTS_LINK}" rel="stylesheet" />
  ${turnstileKey ? '<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>' : ''}
  <style>
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      background: transparent;
      color: ${theme.ink};
      font-family: ${theme.bodyFont};
    }
    .hidden { display: none !important; }
    .embed-wrap { padding: 4px; }
    .card {
      background: ${theme.surface};
      border: 1px solid ${theme.border};
      border-radius: ${theme.cardRadius};
      padding: 28px;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
    }
    @media (max-width: 520px) {
      .grid { grid-template-columns: 1fr; }
      .card { padding: 20px; }
    }
    .field { margin-bottom: 14px; }
    label {
      display: block;
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 6px;
      color: ${theme.ink};
    }
    input[type="text"],
    input[type="email"],
    input[type="tel"],
    input[type="url"],
    input[type="number"],
    input[type="date"],
    select,
    textarea {
      width: 100%;
      padding: 10px 13px;
      border-radius: ${theme.inputRadius};
      border: 1px solid ${theme.border};
      background: ${theme.surface};
      color: ${theme.ink};
      font: inherit;
      font-size: 14px;
      outline: none;
    }
    input:focus, select:focus, textarea:focus { border-color: ${theme.accent}; }
    textarea { min-height: 108px; resize: vertical; }
    .btn-primary {
      margin-top: 6px;
      padding: 11px 24px;
      border: 0;
      border-radius: ${theme.buttonRadius};
      background: ${theme.accent};
      color: ${theme.accentText};
      font: inherit;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-secondary {
      margin-top: 6px;
      padding: 11px 20px;
      border: 1px solid ${theme.border};
      border-radius: ${theme.buttonRadius};
      background: ${theme.surface};
      color: ${theme.ink};
      font: inherit;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-primary:hover { opacity: 0.9; }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .step-progress {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      margin-bottom: 18px;
      font-size: 12px;
      font-weight: 600;
      color: ${theme.muted};
    }
    .step-bar {
      flex: 1;
      height: 5px;
      border-radius: 999px;
      background: #ece8e2;
      overflow: hidden;
    }
    .step-fill {
      height: 100%;
      background: ${theme.accent};
      transition: width 0.2s ease;
    }
    .step-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .gate-eyebrow {
      font-size: 11.5px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: ${theme.muted};
      margin-bottom: 6px;
    }
    .star-row {
      display: flex;
      gap: 8px;
    }
    .star-btn {
      width: 46px;
      height: 46px;
      border-radius: 12px;
      border: 1px solid ${theme.border};
      background: ${theme.surface};
      color: ${theme.muted};
      display: grid;
      place-items: center;
      cursor: pointer;
      transition: border-color 0.14s ease, color 0.14s ease;
    }
    .star-btn:hover, .star-btn.lit {
      border-color: ${theme.accent};
      color: ${theme.accent};
    }
    .star-btn.lit svg { fill: currentColor; }
    .done-state {
      display: none;
      padding: 12px 4px;
    }
    .done-state.visible { display: block; }
    .done-title {
      margin: 0 0 8px;
      font-family: ${theme.headingFont};
      font-size: 24px;
      font-weight: 500;
      letter-spacing: ${theme.tracking};
    }
    .done-body {
      margin: 0 0 18px;
      font-size: 14.5px;
      line-height: 1.6;
      color: ${theme.muted};
    }
    .error-msg {
      display: none;
      margin-top: 12px;
      font-size: 13px;
      color: #b42318;
    }
  </style>
</head>
<body>
  <div class="embed-wrap">
    <div class="card">
      ${reviewGateHtml}
      <form id="embed-form" class="${reviewGateUrl ? 'hidden' : ''}" action="${escapeHtml(actionUrl)}" method="POST" enctype="multipart/form-data">
        <input type="text" name="_gotcha" style="display:none !important" tabindex="-1" autocomplete="off" />
        <input type="hidden" name="_subject" value="${escapeHtml(form.name)} — {{ name }}" />
        <input type="hidden" id="rating-hidden" name="rating" value="" />
        ${formFieldsHtml}
        <div id="embed-error" class="error-msg"></div>
      </form>
      <div id="embed-done" class="done-state" role="status">
        <h2 class="done-title">${escapeHtml(thanksHeading)}</h2>
        <p class="done-body">${escapeHtml(thanksBody)}</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          ${
            String(form.id || '').startsWith('template-')
              ? `<button type="button" id="embed-view-portal" class="btn-primary" style="margin-top:0;padding:9px 16px;font-size:13px;">See in Owner Portal Preview &rarr;</button>`
              : ''
          }
          <button type="button" id="embed-reset" class="btn-secondary" style="margin-top:0;padding:8px 16px;font-size:13px;">Send another enquiry</button>
        </div>
      </div>
      ${
        String(form.id || '').startsWith('template-')
          ? ''
          : workspace?.license?.domainMismatch
          ? `<div style="margin-top:14px;padding:10px 12px;border-radius:10px;background:#fff5f5;border:1px solid #fed7d7;color:#c53030;font-size:12px;font-weight:600;display:flex;align-items:center;justify-content:space-between;gap:8px;">
              <span>${escapeHtml(workspace.license.message)}</span>
              <a href="/#pricing" target="_blank" rel="noopener" style="color:#c53030;text-decoration:underline;white-space:nowrap;">Get Key &rarr;</a>
            </div>`
          : !workspace?.license?.isLicensed
          ? `<div style="margin-top:14px;padding:9px 12px;border-radius:10px;background:#f1f5f9;border:1px solid #e2e8f0;color:#3e525c;font-size:12px;display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;">
              <span><strong>AskForms Preview Mode</strong> · ${workspace?.license?.previewRemaining ?? 5} test enquiries left</span>
              <a href="/#pricing" target="_blank" rel="noopener" style="color:${theme.accent};font-weight:700;text-decoration:none;white-space:nowrap;">Activate Domain Key &rarr;</a>
            </div>`
          : ''
      }
    </div>
  </div>
  <script>
    function postHeight() {
      if (window.parent !== window) {
        window.parent.postMessage({ type: 'formflow:resize', formId: ${JSON.stringify(form.id)}, height: document.body.scrollHeight }, '*');
      }
    }
    window.addEventListener('load', postHeight);
    window.addEventListener('resize', postHeight);

    const form = document.getElementById('embed-form');
    const btn = document.getElementById('embed-submit');
    const done = document.getElementById('embed-done');
    const errEl = document.getElementById('embed-error');

    // Multi-step progression
    const step1 = document.querySelector('[data-step="1"]');
    const step2 = document.querySelector('[data-step="2"]');
    const stepNext = document.getElementById('step-next');
    const stepBack = document.getElementById('step-back');
    if (stepNext && step1 && step2) {
      stepNext.addEventListener('click', () => {
        const inputs = step1.querySelectorAll('input, select, textarea');
        for (const el of inputs) {
          if (!el.reportValidity()) return;
        }
        step1.classList.add('hidden');
        step2.classList.remove('hidden');
        document.getElementById('step-label').textContent = 'Step 2 of 2';
        document.getElementById('step-fill').style.width = '100%';
        postHeight();
      });
      stepBack.addEventListener('click', () => {
        step2.classList.add('hidden');
        step1.classList.remove('hidden');
        document.getElementById('step-label').textContent = 'Step 1 of 2';
        document.getElementById('step-fill').style.width = '50%';
        postHeight();
      });
    }

    // Smart 1-5 Star Review Gate
    const stars = document.querySelectorAll('[data-star]');
    if (stars.length > 0) {
      stars.forEach((s) => {
        s.addEventListener('click', () => {
          const val = Number(s.dataset.star);
          stars.forEach((b) => b.classList.toggle('lit', Number(b.dataset.star) <= val));
          const gate = document.getElementById('review-gate');
          if (val >= 4) {
            gate.classList.add('hidden');
            document.getElementById('review-positive').classList.add('visible');
          } else {
            gate.classList.add('hidden');
            document.getElementById('rating-hidden').value = val + ' / 5 stars (Private feedback)';
            form.classList.remove('hidden');
          }
          postHeight();
        });
      });
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errEl.style.display = 'none';
      btn.disabled = true;
      const orig = btn.textContent;
      btn.textContent = 'Sending...';
      try {
        const fd = new FormData(form);
        const submittedFields = {};
        for (const [k, v] of fd.entries()) {
          if (typeof v === 'string' && !k.startsWith('_') && k !== 'rating') {
            submittedFields[k] = v;
          }
        }
        const res = await fetch(form.action, {
          method: 'POST',
          headers: { 'Accept': 'application/json' },
          body: fd,
        });
        const data = await res.json();
        if (data.ok) {
          if (window.parent !== window) {
            window.parent.postMessage({
              type: 'askforms:submitted',
              formId: ${JSON.stringify(form.id)},
              formName: ${JSON.stringify(form.name)},
              submissionId: data.submissionId || ('sub_' + Date.now()),
              fields: submittedFields,
              createdAt: new Date().toISOString(),
            }, '*');
          }
          form.classList.add('hidden');
          done.classList.add('visible');
          form.reset();
          postHeight();
        } else {
          errEl.textContent = data.errors?.[0]?.message || 'Unable to send enquiry.';
          errEl.style.display = 'block';
        }
      } catch {
        errEl.textContent = 'Network error. Please try again.';
        errEl.style.display = 'block';
      } finally {
        btn.disabled = false;
        btn.textContent = orig;
      }
    });

    document.getElementById('embed-view-portal')?.addEventListener('click', () => {
      if (window.parent !== window) {
        window.parent.postMessage({ type: 'askforms:open-portal-preview' }, '*');
      }
    });

    document.getElementById('embed-reset').addEventListener('click', () => {
      done.classList.remove('visible');
      form.classList.remove('hidden');
      if (step1 && step2) {
        step2.classList.add('hidden');
        step1.classList.remove('hidden');
        document.getElementById('step-label').textContent = 'Step 1 of 2';
        document.getElementById('step-fill').style.width = '50%';
      }
      postHeight();
    });
  </script>
</body>
</html>`;
}

export function renderClientDemoPage(form, fields, themeKey, baseUrl, workspace = {}) {
  const brandTheme = resolveBrandTheme(workspace);
  const allThemes = {
    brand: brandTheme,
    ...PRESET_THEMES,
  };
  const activeKey = allThemes[themeKey] ? themeKey : 'brand';
  const theme = allThemes[activeKey];
  const actionUrl = `${baseUrl}/f/${encodeURIComponent(form.id)}`;
  const displayBrand = activeKey === 'brand' ? (workspace.brand_name || form.client_name) : form.client_name;

  const themeLinks = Object.entries(allThemes)
    .map(([key, t]) => {
      const isActive = key === activeKey;
      const label = key === 'brand' ? 'Your Brand' : t.label;
      return `<a href="/demo/${encodeURIComponent(form.id)}?theme=${key}" class="pill ${isActive ? 'active' : ''}">${escapeHtml(label)}</a>`;
    })
    .join('');

  const logoBlock =
    activeKey === 'brand' && brandTheme.logoUrl
      ? `<img src="${escapeHtml(brandTheme.logoUrl)}" alt="${escapeHtml(displayBrand)}" style="max-height:30px;max-width:170px;object-fit:contain;margin-bottom:14px;display:block;" />`
      : '';

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=2" />
  <link rel="alternate icon" href="/favicon.ico?v=2" />
  <title>${escapeHtml(form.name)} — ${escapeHtml(displayBrand)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="${GOOGLE_FONTS_LINK}" rel="stylesheet" />
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      background: ${theme.bg};
      color: ${theme.ink};
      font-family: ${theme.bodyFont};
      padding: 0 0 64px;
    }
    ${
      theme.topBarBg
        ? `.partner-bar {
            background: ${theme.topBarBg};
            color: ${theme.topBarText};
            padding: 10px 20px;
            font-size: 12px;
            font-weight: 500;
            text-align: center;
          }`
        : ''
    }
    .wrap {
      padding: 28px 20px 0;
    }
    .topbar {
      max-width: 680px;
      margin: 0 auto 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
    }
    .back-link {
      font-size: 13px;
      font-weight: 600;
      color: ${theme.muted};
      text-decoration: none;
    }
    .back-link:hover { color: ${theme.ink}; }
    .switcher {
      display: inline-flex;
      background: ${theme.surface};
      border: 1px solid ${theme.border};
      padding: 4px;
      border-radius: 999px;
      gap: 4px;
      flex-wrap: wrap;
    }
    .pill {
      padding: 6px 13px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 600;
      color: ${theme.muted};
      text-decoration: none;
      border: 0;
      background: transparent;
      cursor: pointer;
    }
    .pill.active {
      background: ${theme.accent};
      color: ${theme.accentText};
    }
    .card {
      max-width: 680px;
      margin: 0 auto;
      background: ${theme.surface};
      border: 1px solid ${theme.border};
      border-radius: ${theme.cardRadius};
      padding: 40px;
    }
    .card-top {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 28px;
      flex-wrap: wrap;
    }
    .eyebrow {
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: ${theme.muted};
      margin-bottom: 6px;
    }
    h1 {
      margin: 0;
      font-family: ${theme.headingFont};
      font-size: 30px;
      font-weight: 600;
      letter-spacing: ${theme.tracking};
      line-height: 1.15;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    @media (max-width: 560px) {
      .grid { grid-template-columns: 1fr; }
      .card { padding: 28px 22px; }
    }
    .field { margin-bottom: 18px; }
    label {
      display: block;
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 7px;
      color: ${theme.ink};
    }
    input[type="text"],
    input[type="email"],
    input[type="url"],
    select,
    textarea {
      width: 100%;
      padding: 11px 14px;
      border-radius: ${theme.inputRadius};
      border: 1px solid ${theme.border};
      background: ${theme.surface};
      color: ${theme.ink};
      font: inherit;
      font-size: 14px;
      outline: none;
      transition: border-color 0.15s ease;
    }
    input:focus, select:focus, textarea:focus {
      border-color: ${theme.accent};
    }
    textarea { min-height: 120px; resize: vertical; }
    .footer-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
      margin-top: 24px;
    }
    button[type="submit"] {
      padding: 12px 26px;
      border: 0;
      border-radius: ${theme.buttonRadius};
      background: ${theme.accent};
      color: ${theme.accentText};
      font: inherit;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      transition: opacity 0.15s ease;
    }
    button[type="submit"]:hover { opacity: 0.9; }
    button[type="submit"]:disabled { opacity: 0.6; cursor: not-allowed; }
    .endpoint-note {
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      color: ${theme.muted};
    }
    .inline-status {
      margin-top: 20px;
      padding: 14px 16px;
      border-radius: 10px;
      border: 1px solid #c5dfd3;
      background: #edf5f1;
      color: #095c4f;
      font-size: 13.5px;
      display: none;
    }
    .inline-status.visible { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
    .inline-status a { color: #095c4f; font-weight: 600; text-decoration: underline; }
  </style>
</head>
<body>
  ${theme.topBarBg ? `<div class="partner-bar">${escapeHtml(displayBrand)}</div>` : ''}
  <div class="wrap">
    <div class="topbar">
      <a class="back-link" href="/?form=${encodeURIComponent(form.id)}">&larr; Back to Dashboard</a>
      <div class="switcher" aria-label="Theme preview">${themeLinks}</div>
    </div>
    <main class="card">
      ${logoBlock}
      <div class="card-top">
        <div>
          <div class="eyebrow">${escapeHtml(displayBrand)}</div>
          <h1>${escapeHtml(form.name)}</h1>
        </div>
        <div class="switcher" aria-label="Submit mode">
          <button type="button" class="pill active" data-mode="ajax">AJAX</button>
          <button type="button" class="pill" data-mode="html">HTML POST</button>
        </div>
      </div>

      <form id="demo-form" action="${escapeHtml(actionUrl)}" method="POST" enctype="multipart/form-data">
        <input type="text" name="_gotcha" style="display:none !important" tabindex="-1" autocomplete="off" />
        <input type="hidden" name="_subject" value="${escapeHtml(form.name)} — {{ name }}" />
        ${renderDynamicFieldInputs(fields)}
        <div class="footer-row">
          <button type="submit" id="submit-btn">${escapeHtml(form.submit_label || 'Send enquiry')}</button>
          <span class="endpoint-note">POST /f/${escapeHtml(form.id)}</span>
        </div>

        <div id="inline-status" class="inline-status" role="status">
          <span id="status-text"></span>
          <a href="/?form=${encodeURIComponent(form.id)}">Inspect in Dashboard</a>
        </div>
      </form>
    </main>
  </div>

  <script>
    let submitMode = 'ajax';
    const modeButtons = document.querySelectorAll('[data-mode]');
    modeButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        submitMode = btn.dataset.mode;
        modeButtons.forEach((b) => b.classList.toggle('active', b === btn));
      });
    });

    const form = document.getElementById('demo-form');
    const submitBtn = document.getElementById('submit-btn');
    const statusBox = document.getElementById('inline-status');
    const statusText = document.getElementById('status-text');

    form.addEventListener('submit', async (e) => {
      if (submitMode === 'html') return;
      e.preventDefault();
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';
      try {
        const res = await fetch(form.action, {
          method: 'POST',
          headers: { 'Accept': 'application/json' },
          body: new FormData(form),
        });
        const data = await res.json();
        if (data.ok) {
          statusText.textContent = 'Received (' + data.id + ') — dispatched to inbox & webhooks.';
          statusBox.classList.add('visible');
          form.reset();
        } else {
          statusText.textContent = data.errors?.[0]?.message || 'Submission rejected.';
          statusBox.classList.add('visible');
        }
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send inquiry';
      }
    });
  </script>
</body>
</html>`;
}
