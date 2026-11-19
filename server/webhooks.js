import crypto from 'node:crypto';
import { db } from './db.js';

function formatFieldPairs(fields) {
  return Object.entries(fields || {}).map(([key, value]) => ({
    label: key.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    value: Array.isArray(value) ? value.join(', ') : String(value ?? ''),
  }));
}

export function buildWebhookPayload(format, { form, submissionId, fields, attachments, meta }) {
  const pairs = formatFieldPairs(fields);
  const summary = pairs
    .slice(0, 6)
    .map((p) => `${p.label}: ${p.value}`)
    .join('\n');

  if (format === 'slack') {
    return {
      text: `New submission on ${form.name} (${form.client_name})`,
      blocks: [
        {
          type: 'header',
          text: { type: 'plain_text', text: `${form.name} — ${form.client_name}` },
        },
        {
          type: 'section',
          fields: pairs.slice(0, 8).map((p) => ({
            type: 'mrkdwn',
            text: `*${p.label}*\n${p.value || '—'}`,
          })),
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `ID: \`${submissionId}\` · Origin: ${meta?.origin || 'Direct POST'}`,
            },
          ],
        },
      ],
    };
  }

  if (format === 'discord') {
    return {
      content: `New submission on **${form.name}** (${form.client_name})`,
      embeds: [
        {
          title: form.name,
          color: 613455, // #095c4f botanical teal
          fields: pairs.slice(0, 10).map((p) => ({
            name: p.label,
            value: p.value.slice(0, 1000) || '—',
            inline: p.value.length < 48,
          })),
          footer: { text: `FormFlow · ${submissionId}` },
          timestamp: new Date().toISOString(),
        },
      ],
    };
  }

  if (format === 'telegram') {
    const lines = [
      `New enquiry: ${form.name} (${form.client_name})`,
      '',
      ...pairs.slice(0, 10).map((p) => `${p.label}: ${p.value || '—'}`),
      '',
      `Ref: ${submissionId}`,
    ];
    return {
      text: lines.join('\n'),
      disable_web_page_preview: true,
    };
  }

  if (format === 'teams') {
    return {
      '@type': 'MessageCard',
      '@context': 'http://schema.org/extensions',
      themeColor: '095c4f',
      summary: `New submission on ${form.name}`,
      sections: [
        {
          activityTitle: `${form.name} (${form.client_name})`,
          activitySubtitle: `Submission ${submissionId}`,
          facts: pairs.slice(0, 10).map((p) => ({ name: p.label, value: p.value || '—' })),
          text: summary,
        },
      ],
    };
  }

  // Default: Signed FormFlow JSON envelope (Make, Zapier, n8n, custom APIs)
  return {
    event: 'submission.created',
    timestamp: new Date().toISOString(),
    form: {
      id: form.id,
      name: form.name,
      client: form.client_name,
    },
    submission: {
      id: submissionId,
      data: fields,
      attachments,
      meta,
    },
  };
}

export async function dispatchWebhooks({ form, submissionId, fields, attachments, meta, targetWebhook = null }) {
  const webhooks = targetWebhook
    ? [targetWebhook]
    : db.prepare('SELECT * FROM webhooks WHERE form_id = ? AND is_active = 1').all(form.id);

  if (webhooks.length === 0) return [];

  const results = [];

  for (const hook of webhooks) {
    const format = hook.format || 'generic';
    const payload = buildWebhookPayload(format, { form, submissionId, fields, attachments, meta });

    const bodyStr = JSON.stringify(payload);
    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'FormFlow-Webhook/1.0',
      'X-FormFlow-Event': 'submission.created',
      'X-FormFlow-Format': format,
      'X-FormFlow-Delivery': `dlv_${crypto.randomBytes(6).toString('hex')}`,
    };

    if (hook.secret_key) {
      const sig = crypto
        .createHmac('sha256', hook.secret_key)
        .update(bodyStr)
        .digest('hex');
      headers['X-FormFlow-Signature'] = `sha256=${sig}`;
    }

    const started = Date.now();
    let responseStatus = 0;
    let responseBody = '';
    let success = 0;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(hook.target_url, {
        method: 'POST',
        headers,
        body: bodyStr,
        signal: controller.signal,
      });
      clearTimeout(timeout);
      responseStatus = res.status;
      responseBody = (await res.text()).slice(0, 2000);
      success = res.ok ? 1 : 0;
    } catch (err) {
      responseStatus = 0;
      responseBody = err?.message || 'Network error';
      success = 0;
    }

    const durationMs = Date.now() - started;
    const logId = `whlog_${crypto.randomBytes(6).toString('hex')}`;

    db.prepare(`
      INSERT INTO webhook_logs (
        id, webhook_id, form_id, submission_id, target_url,
        request_headers_json, request_body_json, response_status, response_body, duration_ms, success, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      logId,
      hook.id,
      form.id,
      submissionId,
      hook.target_url,
      JSON.stringify(headers),
      bodyStr,
      responseStatus,
      responseBody,
      durationMs,
      success,
      new Date().toISOString()
    );

    results.push({
      id: logId,
      webhookId: hook.id,
      label: hook.label,
      format,
      targetUrl: hook.target_url,
      status: responseStatus,
      durationMs,
      success: Boolean(success),
    });
  }

  return results;
}
