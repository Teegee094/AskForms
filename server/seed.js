import crypto from 'node:crypto';
import { db } from './db.js';
import { renderNotificationHtml, renderNotificationText } from './mailer.js';

function hoursAgo(hours) {
  return new Date(Date.now() - hours * 3600 * 1000).toISOString();
}

export function seedIfEmpty(baseUrl = 'http://localhost:3840') {
  const existing = db.prepare('SELECT COUNT(*) AS c FROM forms').get().c;
  if (existing > 0) return;

  const initialForms = [
    {
      id: 'audit-intake',
      name: 'Website Audit Intake',
      client_name: 'Client Reviews',
      theme_preset: 'teagee',
      email_recipients: 'reviews@teageelabs.com, ops@sintiro.com.au',
      allowed_origins: '*',
      redirect_url: '',
      enable_honeypot: 1,
      send_autoresponse: 1,
      autoresponse_subject: 'Website audit request received',
      autoresponse_body: 'Hi {{ name }},\n\nWe have logged your website review request for {{ website }}. Our team will inspect your forms, page speed, and tracking setup and follow up within two business days.',
      rate_limit_per_hour: 120,
      is_active: 1,
      created_at: hoursAgo(240),
    },
    {
      id: 'sintiro-contact',
      name: 'Growth Strategy Contact',
      client_name: 'Sintiro',
      theme_preset: 'sintiro',
      email_recipients: 'hello@sintiro.com.au',
      allowed_origins: 'sintiro.com.au, www.sintiro.com.au',
      redirect_url: '',
      enable_honeypot: 1,
      send_autoresponse: 1,
      autoresponse_subject: 'Thanks for contacting Sintiro',
      autoresponse_body: 'Hi {{ name }},\n\nThanks for reaching out. A strategist will review your note and get back to you shortly.',
      rate_limit_per_hour: 90,
      is_active: 1,
      created_at: hoursAgo(210),
    },
    {
      id: 'centella-enquiry',
      name: 'Advisory Consultation',
      client_name: 'Centella',
      theme_preset: 'centella',
      email_recipients: 'enquiries@centella.com.au',
      allowed_origins: 'centella.com.au, www.centella.com.au',
      redirect_url: '',
      enable_honeypot: 1,
      send_autoresponse: 0,
      autoresponse_subject: 'Consultation inquiry received',
      autoresponse_body: 'Thank you for reaching out to Centella. We will be in touch shortly.',
      rate_limit_per_hour: 60,
      is_active: 1,
      created_at: hoursAgo(180),
    },
    {
      id: 'teagee-brief',
      name: 'Studio Project Brief',
      client_name: 'Teagee Labs',
      theme_preset: 'teagee',
      email_recipients: 'studio@teageelabs.com',
      allowed_origins: 'teageelabs.com, www.teageelabs.com',
      redirect_url: '',
      enable_honeypot: 1,
      send_autoresponse: 1,
      autoresponse_subject: 'Project brief logged — Teagee Labs',
      autoresponse_body: 'Hi {{ name }},\n\nYour project brief has been received. We review new studio inquiries every Monday and Thursday.',
      rate_limit_per_hour: 60,
      is_active: 1,
      created_at: hoursAgo(150),
    },
  ];

  const insertForm = db.prepare(`
    INSERT INTO forms (
      id, name, client_name, theme_preset, email_recipients, allowed_origins, redirect_url,
      enable_honeypot, send_autoresponse, autoresponse_subject, autoresponse_body,
      rate_limit_per_hour, is_active, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const f of initialForms) {
    insertForm.run(
      f.id, f.name, f.client_name, f.theme_preset, f.email_recipients, f.allowed_origins, f.redirect_url,
      f.enable_honeypot, f.send_autoresponse, f.autoresponse_subject, f.autoresponse_body,
      f.rate_limit_per_hour, f.is_active, f.created_at
    );
  }

  // Seed default webhook on audit-intake pointing to the local test sink
  const webhookId = 'wh_local_sink_01';
  const webhookSecret = 'ff_sec_9a4c7e12d83f4b01';
  db.prepare(`
    INSERT INTO webhooks (id, form_id, label, target_url, secret_key, is_active, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    webhookId,
    'audit-intake',
    'Local Review Webhook Sink',
    `${baseUrl}/api/webhook-sink`,
    webhookSecret,
    1,
    hoursAgo(235)
  );

  db.prepare(`
    INSERT INTO webhooks (id, form_id, label, target_url, secret_key, is_active, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    'wh_sintiro_crm_02',
    'sintiro-contact',
    'CRM Lead Sink (Local)',
    `${baseUrl}/api/webhook-sink`,
    'ff_sec_sintiro_72c8a1',
    1,
    hoursAgo(200)
  );

  const seedSubmissions = [
    {
      id: 'sub_7c41a9e2b103',
      form_id: 'audit-intake',
      data: {
        name: 'Claire Henderson',
        email: 'claire@northshorearchitects.com.au',
        website: 'https://northshorearchitects.com.au',
        topic: 'Conversion & Forms',
        current_stack: 'Webflow + Formspree Free',
        message: 'We are hitting monthly form limits on our project inquiry page and want to move submissions onto our own server before our Q1 redesign.',
      },
      origin: 'https://teageelabs.com',
      ip: '203.14.88.42',
      ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/129.0.0.0 Safari/537.36',
      is_spam: 0,
      spam_reason: null,
      created_at: hoursAgo(2.5),
    },
    {
      id: 'sub_4e92d0c7f811',
      form_id: 'audit-intake',
      data: {
        name: 'Daniel Kowalski',
        email: 'dkowalski@harbourhealth.com.au',
        website: 'https://harbourhealth.com.au',
        topic: 'Technical Architecture',
        current_stack: 'Static Astro on Cloudflare Pages',
        message: 'Patient callback requests cannot pass through US SaaS form vendors under our privacy review. Looking to self-host an open-source form backend in Sydney.',
      },
      origin: 'https://sintiro.com.au',
      ip: '118.210.44.19',
      ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0.0.0 Safari/537.36',
      is_spam: 0,
      spam_reason: null,
      created_at: hoursAgo(11),
    },
    {
      id: 'sub_9f03b2a4d551',
      form_id: 'audit-intake',
      data: {
        name: 'SEO Boost Agency',
        email: 'promo@backlinks-fast-99.biz',
        website: 'http://cheap-backlinks.example',
        message: 'Guaranteed #1 Google rankings in 48 hours! Click now for instant traffic package.',
      },
      origin: 'Direct POST',
      ip: '185.220.101.64',
      ua: 'python-requests/2.31.0',
      is_spam: 1,
      spam_reason: 'Honeypot (_gotcha) filled with "yes-subscribe-all"',
      created_at: hoursAgo(18),
    },
    {
      id: 'sub_1a88c5e3f904',
      form_id: 'sintiro-contact',
      data: {
        name: 'Marcus Reid',
        email: 'm.reid@veridianlogistics.com.au',
        company: 'Veridian Logistics',
        budget: '$15k - $30k / quarter',
        message: 'Looking for a fractional marketing team to overhaul our B2B demand funnel and HubSpot routing ahead of our Melbourne expansion.',
      },
      origin: 'https://sintiro.com.au',
      ip: '101.187.22.90',
      ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15',
      is_spam: 0,
      spam_reason: null,
      created_at: hoursAgo(5),
    },
    {
      id: 'sub_6b29e7d1a402',
      form_id: 'centella-enquiry',
      data: {
        name: 'Hannah Bellamy',
        email: 'hannah@bellamygroup.com.au',
        organisation: 'Bellamy Advisory',
        service: 'Operational Workflow Review',
        message: 'Interested in discussing a 6-week engagement covering client onboarding workflows and website conversion touchpoints.',
      },
      origin: 'https://centella.com.au',
      ip: '124.149.77.15',
      ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edg/129.0.0.0',
      is_spam: 0,
      spam_reason: null,
      created_at: hoursAgo(27),
    },
    {
      id: 'sub_8d54f1c2e780',
      form_id: 'teagee-brief',
      data: {
        name: 'Liam O\'Connor',
        email: 'liam@kestrelcraft.co',
        website: 'https://kestrelcraft.co',
        timeline: 'Next 6 weeks',
        message: 'Need a calm, fast static marketing site with self-hosted inquiry forms and clean Notion/Slack webhook notifications.',
      },
      origin: 'https://teageelabs.com',
      ip: '49.195.102.31',
      ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/130.0.0.0',
      is_spam: 0,
      spam_reason: null,
      created_at: hoursAgo(39),
    },
  ];

  const insertSub = db.prepare(`
    INSERT INTO submissions (
      id, form_id, data_json, attachments_json, sender_email, sender_name, subject,
      sender_ip, user_agent, origin, content_type, is_spam, spam_reason, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMail = db.prepare(`
    INSERT INTO mail_logs (
      id, form_id, submission_id, kind, to_addresses, cc_addresses, reply_to, subject,
      html_body, text_body, status, transport, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertWebhookLog = db.prepare(`
    INSERT INTO webhook_logs (
      id, webhook_id, form_id, submission_id, target_url,
      request_headers_json, request_body_json, response_status, response_body, duration_ms, success, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const formMap = Object.fromEntries(initialForms.map((f) => [f.id, f]));

  for (const s of seedSubmissions) {
    const form = formMap[s.form_id];
    const subject = `${form.name} — ${s.data.name}`;

    insertSub.run(
      s.id,
      s.form_id,
      JSON.stringify(s.data),
      '[]',
      s.data.email || null,
      s.data.name || null,
      subject,
      s.ip,
      s.ua,
      s.origin,
      'application/json',
      s.is_spam,
      s.spam_reason,
      s.created_at
    );

    if (!s.is_spam) {
      const html = renderNotificationHtml(form, s.data, [], {
        subject,
        submissionId: s.id,
        origin: s.origin,
        ip: s.ip,
        timestamp: s.created_at,
      });
      const text = renderNotificationText(form, s.data, [], {
        subject,
        submissionId: s.id,
        origin: s.origin,
        ip: s.ip,
        timestamp: s.created_at,
      });

      insertMail.run(
        `mail_${crypto.randomBytes(5).toString('hex')}`,
        form.id,
        s.id,
        'notification',
        form.email_recipients,
        '',
        s.data.email || '',
        subject,
        html,
        text,
        'delivered',
        'local-outbox',
        s.created_at
      );

      if (s.form_id === 'audit-intake') {
        const bodyObj = {
          event: 'submission.created',
          timestamp: s.created_at,
          form: { id: form.id, name: form.name, client: form.client_name },
          submission: { id: s.id, data: s.data, attachments: [], meta: { ip: s.ip, origin: s.origin } },
        };
        const bodyStr = JSON.stringify(bodyObj);
        const sig = crypto.createHmac('sha256', webhookSecret).update(bodyStr).digest('hex');

        insertWebhookLog.run(
          `whlog_${crypto.randomBytes(5).toString('hex')}`,
          webhookId,
          form.id,
          s.id,
          `${baseUrl}/api/webhook-sink`,
          JSON.stringify({
            'Content-Type': 'application/json',
            'X-FormFlow-Event': 'submission.created',
            'X-FormFlow-Signature': `sha256=${sig}`,
          }),
          bodyStr,
          200,
          JSON.stringify({ received: true, verified: true }),
          14,
          1,
          s.created_at
        );
      }
    }
  }
}
