# AskForms — Customer Handoff & Self-Hosting Guide

AskForms is a self-contained form & enquiry engine built to run alongside your website with zero monthly subscription fees and complete ownership of your customer enquiries.

---

## 1. Quick Deployment (3 Minutes)

### Option A: Docker (VPS, DigitalOcean, Hetzner, Railway, Render, Fly.io)
1. Copy the environment template:
   ```bash
   cp .env.example .env
   ```
2. Edit `.env` and set your public domain and dashboard password:
   ```env
   PUBLIC_URL=https://forms.yourdomain.com.au
   ADMIN_PASSWORD=choose-a-strong-password
   SEED_DEMO=false
   ```
3. Start the container:
   ```bash
   docker compose up -d
   ```
4. Point your DNS (`forms.yourdomain.com.au`) to your server with HTTPS (Caddy, Nginx, or Cloudflare Proxy).

### Option B: Node.js 22+ Direct
```bash
cp .env.example .env
# Edit .env with your PUBLIC_URL and ADMIN_PASSWORD
npm start
```

### Option C: Cloudflare Pages (Free Tier — \$0/month)
Starter configuration is included in `cloudflare/`:
```bash
npx wrangler d1 create formflow
npx wrangler d1 execute formflow --file=./cloudflare/migrations/0001_init.sql
npx wrangler pages deploy public
```
Configure secrets via `npx wrangler pages secret put WEBHOOK_URL` (and optionally `WEBHOOK_SECRET`, `RESEND_API_KEY`, `NOTIFY_EMAIL`).

---

## 2. First-Time Setup Checklist

1. Sign in at your FormFlow URL using your `ADMIN_PASSWORD`.
2. Open **Brand & Hosting** in the sidebar:
   - Set your **Brand Name**, **Accent Colour**, and **Hosted `/thanks` message**.
   - Optionally connect **Resend** (free up to 3,000 emails/month) for live email delivery from your domain.
3. Create your first form endpoint under **Forms → + New form**:
   - Restrict **Allowed origins** to your website domain (e.g. `yourdomain.com.au, www.yourdomain.com.au`).
   - Keep **Honeypot (`_gotcha`)** enabled.
4. Under the form's **Workflows** tab, add any external webhooks:
   - **Slack**, **Discord**, or **Microsoft Teams** channel notifications
   - **Make.com**, **Zapier**, **n8n**, or your CRM (HubSpot, Pipedrive, Xero) using signed JSON (`X-FormFlow-Signature: sha256=...`).

---

## 3. Connecting Your Website Forms

Open your form's **Integration** tab and copy the snippet for **HTML**, **AJAX Fetch**, or **React**. Every standard HTML form works out of the box:

```html
<form action="https://forms.yourdomain.com.au/f/contact" method="POST">
  <input type="text" name="_gotcha" style="display:none !important" tabindex="-1" autocomplete="off" />
  <input type="hidden" name="_subject" value="Website Inquiry — {{ name }}" />
  <input type="hidden" name="_next" value="https://yourdomain.com.au/thank-you" />

  <input type="text" name="name" required />
  <input type="email" name="email" required />
  <textarea name="message" required></textarea>

  <button type="submit">Send</button>
</form>
```

---

## 4. Backups & Data Ownership

- All forms, submissions, and logs live in a single SQLite file at `data/formflow.db` (and uploaded attachments in `data/uploads/`).
- Download a complete JSON snapshot at any time from **Brand & Hosting → Export Backup**.
