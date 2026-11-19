/**
 * Cloudflare Pages Function — Drop-in Formspree-compatible endpoint
 * Route: POST /f/:formId (works on Cloudflare Pages Free Tier)
 *
 * Supports:
 * - Zero-DB Relay Mode (uses env.WEBHOOK_URL + optional env.RESEND_API_KEY)
 * - Full D1 Mode (persists submissions & loads per-form webhooks from env.DB)
 * - Non-blocking background webhook fan-out via context.waitUntil()
 */

const SPECIAL_KEYS = new Set(['_gotcha', '_next', '_replyto', '_subject', '_cc', '_format']);

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Accept, Content-Type, X-Requested-With',
    Vary: 'Origin',
  };
}

async function signHmacSha256(secret, payload) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function buildPayload(format, formId, submissionId, fields, meta) {
  const pairs = Object.entries(fields).map(([k, v]) => ({
    label: k.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    value: Array.isArray(v) ? v.join(', ') : String(v ?? ''),
  }));

  if (format === 'slack') {
    return {
      text: `New form submission (${formId})`,
      blocks: [
        { type: 'header', text: { type: 'plain_text', text: `FormFlow · ${formId}` } },
        {
          type: 'section',
          fields: pairs.slice(0, 8).map((p) => ({ type: 'mrkdwn', text: `*${p.label}*\n${p.value || '—'}` })),
        },
      ],
    };
  }

  if (format === 'discord') {
    return {
      content: `New submission on **${formId}**`,
      embeds: [
        {
          title: formId,
          color: 613455,
          fields: pairs.slice(0, 10).map((p) => ({ name: p.label, value: p.value || '—', inline: p.value.length < 48 })),
          footer: { text: `FormFlow · ${submissionId}` },
          timestamp: meta.timestamp,
        },
      ],
    };
  }

  return {
    event: 'submission.created',
    timestamp: meta.timestamp,
    form: { id: formId },
    submission: { id: submissionId, data: fields, meta },
  };
}

export async function onRequestOptions({ request }) {
  return new Response(null, { status: 204, headers: corsHeaders(request.headers.get('Origin')) });
}

export async function onRequestPost(context) {
  const { request, env, params } = context;
  const formId = params.formId;
  const origin = request.headers.get('Origin') || request.headers.get('Referer') || '';
  const accept = request.headers.get('Accept') || '';
  const contentType = request.headers.get('Content-Type') || '';
  const wantsJson = accept.includes('application/json') || contentType.includes('application/json');

  let raw = {};
  if (contentType.includes('application/json')) {
    raw = await request.json().catch(() => ({}));
  } else {
    const fd = await request.formData();
    for (const [k, v] of fd.entries()) {
      if (typeof v === 'string') raw[k] = v;
    }
  }

  const gotcha = String(raw._gotcha || '').trim();
  const nextUrl = String(raw._next || '').trim();
  const fields = Object.fromEntries(Object.entries(raw).filter(([k]) => !SPECIAL_KEYS.has(k)));
  const submissionId = `sub_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;
  const meta = {
    ip: request.headers.get('CF-Connecting-IP') || 'unknown',
    origin: origin || 'Direct POST',
    timestamp: new Date().toISOString(),
  };

  const isSpam = gotcha.length > 0;

  // Optional D1 persistence if bound
  if (env.DB) {
    await env.DB.prepare(
      `INSERT INTO submissions (id, form_id, data_json, sender_email, sender_name, sender_ip, origin, is_spam, spam_reason, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        submissionId,
        formId,
        JSON.stringify(fields),
        fields.email || raw._replyto || null,
        fields.name || null,
        meta.ip,
        meta.origin,
        isSpam ? 1 : 0,
        isSpam ? 'Honeypot (_gotcha) populated' : null,
        meta.timestamp
      )
      .run()
      .catch(() => {});
  }

  // Non-blocking external webhook + optional Resend email fan-out
  if (!isSpam) {
    const tasks = [];

    if (env.WEBHOOK_URL) {
      const format = env.WEBHOOK_FORMAT || 'generic';
      const bodyStr = JSON.stringify(buildPayload(format, formId, submissionId, fields, meta));
      const headers = {
        'Content-Type': 'application/json',
        'X-FormFlow-Event': 'submission.created',
        'X-FormFlow-Format': format,
      };
      tasks.push(
        (async () => {
          if (env.WEBHOOK_SECRET) {
            headers['X-FormFlow-Signature'] = `sha256=${await signHmacSha256(env.WEBHOOK_SECRET, bodyStr)}`;
          }
          await fetch(env.WEBHOOK_URL, { method: 'POST', headers, body: bodyStr });
        })()
      );
    }

    if (env.RESEND_API_KEY && env.NOTIFY_EMAIL) {
      const text = Object.entries(fields)
        .map(([k, v]) => `${k}: ${v}`)
        .join('\n');
      tasks.push(
        fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: env.SMTP_FROM || 'FormFlow <onboarding@resend.dev>',
            to: env.NOTIFY_EMAIL.split(',').map((s) => s.trim()),
            reply_to: raw._replyto || fields.email || undefined,
            subject: raw._subject || `New submission: ${formId}`,
            text,
          }),
        })
      );
    }

    if (tasks.length > 0) {
      context.waitUntil(Promise.allSettled(tasks));
    }
  }

  if (wantsJson) {
    return new Response(JSON.stringify({ ok: true, id: submissionId, spam: isSpam }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
    });
  }

  const redirectTarget = nextUrl && /^https?:\/\/|^\//.test(nextUrl) ? nextUrl : '/thanks';
  return Response.redirect(redirectTarget, 303);
}
