/**
 * AskForms Zero-Cost Push Notification & Webhook Channels
 * 100% Web-standard fetch() — runs identically on Node 22 and Cloudflare Pages Edge.
 * All channels below have $0/month free tiers or are completely free & open source.
 */

export const NOTIFICATION_CHANNEL_DEFS = [
  {
    id: 'email_resend',
    name: 'Email (Resend)',
    cost: 'Free (3,000/mo)',
    category: 'Email',
    description: 'Formatted enquiry emails with 1-click Reply-To directly to your inbox.',
    fields: [
      { key: 'to', label: 'Recipient Email', placeholder: 'owner@yourdomain.com.au', type: 'email' },
      { key: 'from', label: 'From Address', placeholder: 'AskForms <onboarding@resend.dev>', type: 'text' },
      { key: 'apiKey', label: 'Resend API Key', placeholder: 're_xxxxxxxxx', type: 'password' },
    ],
  },
  {
    id: 'ntfy',
    name: 'ntfy Push',
    cost: '100% Free & Open Source',
    category: 'Mobile Push',
    description: 'Instant native iOS & Android push alerts via ntfy.sh with zero account required.',
    fields: [
      { key: 'topic', label: 'ntfy Topic Name', placeholder: 'askforms-mybusiness-9281', type: 'text' },
      { key: 'serverUrl', label: 'Server URL (optional)', placeholder: 'https://ntfy.sh', type: 'url' },
    ],
  },
  {
    id: 'telegram',
    name: 'Telegram',
    cost: '100% Free Unlimited',
    category: 'Messaging',
    description: 'Instant push alerts to your phone or team group via Telegram Bot.',
    fields: [
      { key: 'botToken', label: 'Bot Token', placeholder: '123456:ABC-DEF1234ghIkl...', type: 'password' },
      { key: 'chatId', label: 'Chat ID', placeholder: '-1001234567890', type: 'text' },
    ],
  },
  {
    id: 'discord',
    name: 'Discord',
    cost: '100% Free Unlimited',
    category: 'Team Chat',
    description: 'Rich embed enquiry cards posted directly into your Discord channel.',
    fields: [
      { key: 'webhookUrl', label: 'Channel Webhook URL', placeholder: 'https://discord.com/api/webhooks/...', type: 'url' },
    ],
  },
  {
    id: 'slack',
    name: 'Slack',
    cost: '100% Free',
    category: 'Team Chat',
    description: 'Clean enquiry summary cards sent straight into any Slack channel.',
    fields: [
      { key: 'webhookUrl', label: 'Incoming Webhook URL', placeholder: 'https://hooks.slack.com/services/...', type: 'url' },
    ],
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    cost: 'Free (CallMeBot)',
    category: 'Messaging',
    description: 'Direct WhatsApp push alerts to your mobile via CallMeBot.',
    fields: [
      { key: 'phone', label: 'Phone (with country code)', placeholder: '+61412345678', type: 'text' },
      { key: 'apiKey', label: 'CallMeBot API Key', placeholder: '1234567', type: 'password' },
    ],
  },
  {
    id: 'teams',
    name: 'Microsoft Teams',
    cost: '100% Free',
    category: 'Team Chat',
    description: 'Enquiry cards posted directly into any Microsoft Teams channel.',
    fields: [
      { key: 'webhookUrl', label: 'Teams Webhook URL', placeholder: 'https://outlook.office.com/webhook/...', type: 'url' },
    ],
  },
  {
    id: 'google_chat',
    name: 'Google Chat',
    cost: '100% Free',
    category: 'Team Chat',
    description: 'Instant notifications into your Google Workspace Chat Space.',
    fields: [
      { key: 'webhookUrl', label: 'Space Webhook URL', placeholder: 'https://chat.googleapis.com/v1/spaces/...', type: 'url' },
    ],
  },
  {
    id: 'line',
    name: 'LINE',
    cost: 'Free Tier (200/mo)',
    category: 'Messaging',
    description: 'Direct push notifications to your LINE account or staff group.',
    fields: [
      { key: 'channelToken', label: 'Channel Access Token', placeholder: 'LINE Messaging API token', type: 'password' },
      { key: 'toId', label: 'User or Group ID', placeholder: 'U4af4980629...', type: 'text' },
    ],
  },
  {
    id: 'wechat',
    name: 'WeChat Work',
    cost: '100% Free',
    category: 'Messaging',
    description: 'Markdown alerts sent directly to a WeChat Work (WeCom) group robot.',
    fields: [
      { key: 'webhookUrl', label: 'WeCom Robot Webhook URL', placeholder: 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=...', type: 'url' },
    ],
  },
  {
    id: 'gotify',
    name: 'Gotify Push',
    cost: '100% Free & Open Source',
    category: 'Mobile Push',
    description: 'Self-hosted open-source mobile push notifications via Gotify.',
    fields: [
      { key: 'serverUrl', label: 'Gotify Server URL', placeholder: 'https://push.yourdomain.com', type: 'url' },
      { key: 'appToken', label: 'Application Token', placeholder: 'Axxxxxxxxxx', type: 'password' },
    ],
  },
  {
    id: 'custom_webhook',
    name: 'Custom Webhook',
    cost: '100% Free',
    category: 'Automation & CRM',
    description: 'Send JSON payloads to Make, n8n, Zapier, ServiceM8, Cliniko, or any CRM.',
    fields: [
      { key: 'webhookUrl', label: 'Endpoint URL', placeholder: 'https://hook.make.com/...', type: 'url' },
    ],
  },
];

export function parseChannelsConfig(rawJson) {
  try {
    const parsed = typeof rawJson === 'string' ? JSON.parse(rawJson) : rawJson;
    if (parsed && typeof parsed === 'object') return parsed;
  } catch {}
  return {};
}

function formatSummaryLines(formName, fields = {}, portalUrl = '') {
  const lines = Object.entries(fields)
    .filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== '')
    .slice(0, 8)
    .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${Array.isArray(v) ? v.join(', ') : v}`);
  if (portalUrl) lines.push(`Owner Portal: ${portalUrl}`);
  return {
    title: `New Enquiry: ${formName || 'Website Form'}`,
    text: lines.join('\n') || 'New form submission received.',
  };
}

export async function dispatchSingleChannel(channelId, cfg, payload) {
  const { formName, senderName, senderEmail, fields, submissionId, portalUrl } = payload;
  const { title, text } = formatSummaryLines(formName, fields, portalUrl);

  try {
    if (channelId === 'email_resend') {
      if (!cfg.apiKey || !cfg.to) return { ok: false, error: 'Missing Resend API key or recipient email.' };
      const htmlRows = Object.entries(fields || {})
        .map(([k, v]) => `<tr><td style="padding:8px 12px;border-bottom:1px solid #edf2f7;font-weight:600;color:#485e65;">${k}</td><td style="padding:8px 12px;border-bottom:1px solid #edf2f7;color:#12262a;">${String(v)}</td></tr>`)
        .join('');
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${cfg.apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: cfg.from || 'AskForms <onboarding@resend.dev>',
          to: [cfg.to],
          reply_to: senderEmail || undefined,
          subject: `${title}${senderName ? ` (${senderName})` : ''}`,
          html: `<div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;padding:20px;"><h2 style="color:#14383e;margin:0 0 12px;">${title}</h2><table style="width:100%;border-collapse:collapse;font-size:14px;">${htmlRows}</table>${portalUrl ? `<p style="margin-top:18px;"><a href="${portalUrl}" style="display:inline-block;padding:10px 18px;border-radius:999px;background:#14383e;color:#fff;text-decoration:none;font-weight:600;">Open Owner Portal</a></p>` : ''}</div>`,
        }),
      });
      return { ok: res.ok, status: res.status };
    }

    if (channelId === 'ntfy') {
      if (!cfg.topic) return { ok: false, error: 'Missing ntfy topic name.' };
      const base = (cfg.serverUrl || 'https://ntfy.sh').replace(/\/$/, '');
      const res = await fetch(`${base}/${encodeURIComponent(cfg.topic.trim())}`, {
        method: 'POST',
        headers: {
          Title: title,
          Priority: 'high',
          Tags: 'inbox_tray',
          ...(portalUrl ? { Click: portalUrl } : {}),
        },
        body: text,
      });
      return { ok: res.ok, status: res.status };
    }

    if (channelId === 'telegram') {
      if (!cfg.botToken || !cfg.chatId) return { ok: false, error: 'Missing Telegram Bot Token or Chat ID.' };
      const res = await fetch(`https://api.telegram.org/bot${encodeURIComponent(cfg.botToken.trim())}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: cfg.chatId.trim(),
          text: `${title}\n\n${text}`,
        }),
      });
      return { ok: res.ok, status: res.status };
    }

    if (channelId === 'discord') {
      if (!cfg.webhookUrl) return { ok: false, error: 'Missing Discord Webhook URL.' };
      const res = await fetch(cfg.webhookUrl.trim(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeds: [
            {
              title,
              description: text,
              color: 0x14383e,
              footer: { text: `AskForms · ${submissionId || 'Live Enquiry'}` },
            },
          ],
        }),
      });
      return { ok: res.ok, status: res.status };
    }

    if (channelId === 'slack') {
      if (!cfg.webhookUrl) return { ok: false, error: 'Missing Slack Webhook URL.' };
      const res = await fetch(cfg.webhookUrl.trim(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: `*${title}*\n${text}` }),
      });
      return { ok: res.ok, status: res.status };
    }

    if (channelId === 'whatsapp') {
      if (!cfg.phone || !cfg.apiKey) return { ok: false, error: 'Missing WhatsApp phone or CallMeBot API key.' };
      const cleanPhone = String(cfg.phone).replace(/[^0-9+]/g, '');
      const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(cleanPhone)}&text=${encodeURIComponent(`${title}\n${text}`)}&apikey=${encodeURIComponent(cfg.apiKey.trim())}`;
      const res = await fetch(url);
      return { ok: res.ok, status: res.status };
    }

    if (channelId === 'teams') {
      if (!cfg.webhookUrl) return { ok: false, error: 'Missing Microsoft Teams Webhook URL.' };
      const res = await fetch(cfg.webhookUrl.trim(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          '@type': 'MessageCard',
          '@context': 'http://schema.org/extensions',
          themeColor: '14383E',
          summary: title,
          sections: [{ activityTitle: title, text: text.replace(/\n/g, '<br/>') }],
        }),
      });
      return { ok: res.ok, status: res.status };
    }

    if (channelId === 'google_chat') {
      if (!cfg.webhookUrl) return { ok: false, error: 'Missing Google Chat Space Webhook URL.' };
      const res = await fetch(cfg.webhookUrl.trim(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: `*${title}*\n${text}` }),
      });
      return { ok: res.ok, status: res.status };
    }

    if (channelId === 'line') {
      if (!cfg.channelToken || !cfg.toId) return { ok: false, error: 'Missing LINE Channel Access Token or User/Group ID.' };
      const res = await fetch('https://api.line.me/v2/bot/message/push', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${cfg.channelToken.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: cfg.toId.trim(),
          messages: [{ type: 'text', text: `${title}\n\n${text}` }],
        }),
      });
      return { ok: res.ok, status: res.status };
    }

    if (channelId === 'wechat') {
      if (!cfg.webhookUrl) return { ok: false, error: 'Missing WeChat Work Robot Webhook URL.' };
      const res = await fetch(cfg.webhookUrl.trim(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          msgtype: 'markdown',
          markdown: { content: `### ${title}\n${text}` },
        }),
      });
      return { ok: res.ok, status: res.status };
    }

    if (channelId === 'gotify') {
      if (!cfg.serverUrl || !cfg.appToken) return { ok: false, error: 'Missing Gotify Server URL or App Token.' };
      const base = cfg.serverUrl.trim().replace(/\/$/, '');
      const res = await fetch(`${base}/message?token=${encodeURIComponent(cfg.appToken.trim())}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, message: text, priority: 6 }),
      });
      return { ok: res.ok, status: res.status };
    }

    if (channelId === 'custom_webhook') {
      if (!cfg.webhookUrl) return { ok: false, error: 'Missing Custom Webhook URL.' };
      const res = await fetch(cfg.webhookUrl.trim(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-AskForms-Event': 'submission.created' },
        body: JSON.stringify({
          event: 'submission.created',
          submissionId,
          formName,
          senderName,
          senderEmail,
          fields,
          portalUrl,
          createdAt: new Date().toISOString(),
        }),
      });
      return { ok: res.ok, status: res.status };
    }

    return { ok: false, error: `Unknown channel: ${channelId}` };
  } catch (err) {
    return { ok: false, error: err.message || 'Network request failed' };
  }
}

export async function dispatchAllEnabledChannels(channelsConfig, payload) {
  const results = [];
  const cfgObj = parseChannelsConfig(channelsConfig);
  const enabledEntries = Object.entries(cfgObj).filter(([, cfg]) => cfg && cfg.enabled);

  await Promise.all(
    enabledEntries.map(async ([channelId, cfg]) => {
      const result = await dispatchSingleChannel(channelId, cfg, payload);
      results.push({ channelId, ...result });
    })
  );

  return results;
}
