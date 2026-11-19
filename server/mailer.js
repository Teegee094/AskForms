import crypto from 'node:crypto';
import { db, getSetting, getWorkspaceConfig } from './db.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function interpolateTemplate(template, fields) {
  return String(template || '').replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (_, key) => {
    const val = fields[key];
    if (Array.isArray(val)) return val.join(', ');
    return val !== undefined && val !== null ? String(val) : '';
  });
}

function formatFieldLabel(key) {
  return key
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function renderNotificationHtml(form, fields, attachments, meta) {
  const ws = getWorkspaceConfig();
  const accent = ws.accent_color || '#095c4f';
  const accentText = ws.accent_text_color || '#ffffff';
  const bg = ws.bg_color || '#f7fafc';
  const surface = ws.surface_color || '#ffffff';
  const brandName = ws.brand_name || 'AskForms';
  const logoImg = ws.logo_url
    ? `<img src="${escapeHtml(ws.logo_url)}" alt="${escapeHtml(brandName)}" style="max-height:28px;max-width:160px;object-fit:contain;margin-bottom:10px;display:block;" />`
    : '';
  const footerLine = ws.email_footer
    ? `<div style="margin-top:8px;color:#6f6a63;">${escapeHtml(ws.email_footer)}</div>`
    : '';

  const phoneVal = fields.phone || fields.Phone || fields.mobile || fields.Mobile || '';
  const emailVal = fields.email || fields.Email || '';
  const quickActionButtons = [
    phoneVal
      ? `<a href="tel:${escapeHtml(String(phoneVal).replace(/[^0-9+]/g, ''))}" style="display:inline-block;padding:10px 18px;border-radius:999px;background:${escapeHtml(accent)};color:${escapeHtml(accentText)};text-decoration:none;font-size:13px;font-weight:600;margin-right:8px;">Call ${escapeHtml(phoneVal)}</a>`
      : '',
    emailVal
      ? `<a href="mailto:${escapeHtml(emailVal)}?subject=${escapeHtml(`Re: ${meta.subject || form.name}`)}" style="display:inline-block;padding:10px 18px;border-radius:999px;background:${phoneVal ? '#ffffff' : escapeHtml(accent)};color:${phoneVal ? '#141210' : escapeHtml(accentText)};border:${phoneVal ? '1px solid #e2dcd5' : '0'};text-decoration:none;font-size:13px;font-weight:600;">Reply by email</a>`
      : '',
  ]
    .filter(Boolean)
    .join('');

  const quickActionBar = quickActionButtons
    ? `<div style="margin-bottom:18px;">${quickActionButtons}</div>`
    : '';
  const rows = Object.entries(fields)
    .map(([key, val]) => {
      const displayVal = Array.isArray(val) ? val.join(', ') : String(val ?? '');
      return `
        <tr>
          <td style="padding:12px 16px;border-bottom:1px solid #ece8e2;width:180px;vertical-align:top;font-size:13px;font-weight:600;color:#6f6a63;">
            ${escapeHtml(formatFieldLabel(key))}
          </td>
          <td style="padding:12px 16px;border-bottom:1px solid #ece8e2;font-size:14px;color:#141210;line-height:1.55;white-space:pre-wrap;">
            ${escapeHtml(displayVal)}
          </td>
        </tr>
      `;
    })
    .join('');

  const attachmentBlock = attachments.length > 0
    ? `
      <div style="margin-top:20px;padding:14px 16px;background:${escapeHtml(bg)};border:1px solid #e2dcd5;border-radius:10px;">
        <div style="font-size:12px;font-weight:600;color:#6f6a63;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:8px;">Attachments</div>
        ${attachments
          .map(
            (att) =>
              `<div style="font-size:13px;color:${escapeHtml(accent)};margin-bottom:4px;">${escapeHtml(att.originalName)} (${Math.max(1, Math.round(att.size / 1024))} KB)</div>`
          )
          .join('')}
      </div>
    `
    : '';

  return `<!doctype html>
<html>
<head><meta charset="utf-8"><title>${escapeHtml(meta.subject)}</title></head>
<body style="margin:0;padding:24px;background:${escapeHtml(bg)};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#141210;">
  <div style="max-width:600px;margin:0 auto;background:${escapeHtml(surface)};border:1px solid #e2dcd5;border-radius:12px;overflow:hidden;">
    <div style="padding:22px 24px;border-bottom:1px solid #ece8e2;background:${escapeHtml(surface)};">
      ${logoImg}
      <div style="font-size:12px;font-weight:600;color:${escapeHtml(accent)};letter-spacing:0.03em;text-transform:uppercase;">${escapeHtml(form.client_name)} · ${escapeHtml(brandName)}</div>
      <h1 style="margin:6px 0 0;font-size:20px;font-weight:600;color:#141210;line-height:1.3;">${escapeHtml(form.name)}</h1>
    </div>
    <div style="padding:20px 24px;">
      ${quickActionBar}
      <table style="width:100%;border-collapse:collapse;border:1px solid #ece8e2;border-radius:8px;">
        <tbody>
          ${rows || '<tr><td style="padding:16px;font-size:14px;color:#6f6a63;">No fields submitted.</td></tr>'}
        </tbody>
      </table>
      ${attachmentBlock}
      <div style="margin-top:20px;padding-top:16px;border-top:1px solid #ece8e2;font-size:12px;color:#6f6a63;line-height:1.6;">
        <div>Submitted: ${escapeHtml(meta.timestamp)}</div>
        <div>Origin: ${escapeHtml(meta.origin || 'Direct POST')} · IP: ${escapeHtml(meta.ip || '127.0.0.1')}</div>
        <div>Submission ID: <code style="font-family:monospace;color:#3f3b37;">${escapeHtml(meta.submissionId)}</code></div>
        ${footerLine}
      </div>
    </div>
  </div>
</body>
</html>`;
}

export function renderNotificationText(form, fields, attachments, meta) {
  const lines = [
    `${form.name} (${form.client_name})`,
    '='.repeat(48),
    '',
  ];

  for (const [key, val] of Object.entries(fields)) {
    const displayVal = Array.isArray(val) ? val.join(', ') : String(val ?? '');
    lines.push(`${formatFieldLabel(key)}: ${displayVal}`);
  }

  if (attachments.length > 0) {
    lines.push('', 'Attachments:');
    for (const att of attachments) {
      lines.push(`- ${att.originalName} (${Math.max(1, Math.round(att.size / 1024))} KB)`);
    }
  }

  lines.push(
    '',
    '-'.repeat(48),
    `Submission ID: ${meta.submissionId}`,
    `Origin: ${meta.origin || 'Direct POST'}`,
    `Timestamp: ${meta.timestamp}`
  );

  return lines.join('\n');
}

async function deliverViaResend({ apiKey, from, to, cc, replyTo, subject, html, text }) {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: to.split(',').map((s) => s.trim()).filter(Boolean),
        cc: cc ? cc.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
        reply_to: replyTo || undefined,
        subject,
        html,
        text,
      }),
    });
    return res.ok ? 'delivered' : `resend-http-${res.status}`;
  } catch {
    return 'delivery-error';
  }
}

export function dispatchSubmissionEmails({ form, submissionId, fields, attachments, directives, meta }) {
  const createdLogs = [];
  const toAddresses = (form.email_recipients || '').trim();
  const timestamp = meta.timestamp || new Date().toISOString();
  const ws = getWorkspaceConfig();
  const resendKey = getSetting('resend_api_key', process.env.RESEND_API_KEY || '');
  const useResend = ws.email_provider === 'resend' && Boolean(resendKey);
  const transport = useResend ? 'resend-api' : 'local-outbox';

  if (toAddresses) {
    const rawSubject = directives.subject || `New submission: ${form.name}`;
    const subject = interpolateTemplate(rawSubject, fields).trim() || `New submission: ${form.name}`;
    const replyTo = directives.replyTo || fields.email || '';
    const cc = directives.cc || '';

    const htmlBody = renderNotificationHtml(form, fields, attachments, {
      ...meta,
      subject,
      submissionId,
      timestamp,
    });
    const textBody = renderNotificationText(form, fields, attachments, {
      ...meta,
      subject,
      submissionId,
      timestamp,
    });

    const mailId = `mail_${crypto.randomBytes(6).toString('hex')}`;

    db.prepare(`
      INSERT INTO mail_logs (
        id, form_id, submission_id, kind, to_addresses, cc_addresses, reply_to, subject, html_body, text_body, status, transport, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      mailId,
      form.id,
      submissionId,
      'notification',
      toAddresses,
      cc,
      replyTo,
      subject,
      htmlBody,
      textBody,
      useResend ? 'queued' : 'delivered',
      transport,
      timestamp
    );

    if (useResend) {
      deliverViaResend({
        apiKey: resendKey,
        from: `${ws.brand_name} <${ws.mail_from}>`,
        to: toAddresses,
        cc,
        replyTo,
        subject,
        html: htmlBody,
        text: textBody,
      }).then((status) => {
        db.prepare('UPDATE mail_logs SET status = ? WHERE id = ?').run(status, mailId);
      });
    }

    createdLogs.push({ id: mailId, kind: 'notification', to: toAddresses, subject, transport });
  }

  const submitterEmail = directives.replyTo || fields.email;
  if (form.send_autoresponse && submitterEmail && String(submitterEmail).includes('@')) {
    const autoSubject = interpolateTemplate(form.autoresponse_subject || 'We received your message', fields);
    const autoBody = interpolateTemplate(form.autoresponse_body || 'Thank you for your submission.', fields);
    const autoHtml = `<!doctype html>
<html>
<head><meta charset="utf-8"><title>${escapeHtml(autoSubject)}</title></head>
<body style="margin:0;padding:24px;background:#f7f5f2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#141210;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e2dcd5;border-radius:12px;padding:28px;">
    <div style="font-size:12px;font-weight:600;color:${escapeHtml(ws.accent_color || '#095c4f')};text-transform:uppercase;letter-spacing:0.04em;">${escapeHtml(form.client_name)}</div>
    <h1 style="margin:8px 0 16px;font-size:20px;font-weight:600;color:#141210;">${escapeHtml(autoSubject)}</h1>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.65;color:#3f3b37;white-space:pre-wrap;">${escapeHtml(autoBody)}</p>
    <div style="padding-top:16px;border-top:1px solid #ece8e2;font-size:12px;color:#6f6a63;">
      Reference: ${escapeHtml(submissionId)}
    </div>
  </div>
</body>
</html>`;

    const autoId = `mail_${crypto.randomBytes(6).toString('hex')}`;
    const replyAddr = toAddresses.split(',')[0]?.trim() || '';
    db.prepare(`
      INSERT INTO mail_logs (
        id, form_id, submission_id, kind, to_addresses, cc_addresses, reply_to, subject, html_body, text_body, status, transport, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      autoId,
      form.id,
      submissionId,
      'auto-reply',
      String(submitterEmail),
      '',
      replyAddr,
      autoSubject,
      autoHtml,
      autoBody,
      useResend ? 'queued' : 'delivered',
      transport,
      timestamp
    );

    if (useResend) {
      deliverViaResend({
        apiKey: resendKey,
        from: `${ws.brand_name} <${ws.mail_from}>`,
        to: String(submitterEmail),
        cc: '',
        replyTo: replyAddr,
        subject: autoSubject,
        html: autoHtml,
        text: autoBody,
      }).then((status) => {
        db.prepare('UPDATE mail_logs SET status = ? WHERE id = ?').run(status, autoId);
      });
    }

    createdLogs.push({ id: autoId, kind: 'auto-reply', to: String(submitterEmail), subject: autoSubject, transport });
  }

  return createdLogs;
}
