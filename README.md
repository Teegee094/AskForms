# FormFlow

A self-contained, white-labelable form backend sold as a one-off solution for businesses to self-host alongside their website. Drop-in compatible with Formspree endpoints (`POST /f/:formId`) with zero recurring SaaS fees and 100% data ownership.

## Highlights

- **Built-in Admin Security**: Zero-dependency `scrypt` password hashing + signed `HttpOnly` session cookies (`ADMIN_PASSWORD` or configurable inside **Brand & Hosting**).
- **Instant White-Labeling**: Customize brand name, accent colour, and hosted `/thanks` confirmation page straight from the dashboard — updates UI, notification emails, and confirmation screens live.
- **Formspree-Compatible Ingestion**: Supports `application/json`, `application/x-www-form-urlencoded`, and `multipart/form-data` uploads, plus `_gotcha`, `_replyto`, `_subject` (`{{ field }}`), `_next`, and `_cc`.
- **External Notifications**: Live email delivery via **Resend HTTP API** (or local **Mail Outbox** preview), plus native outbound webhook formatters for **Slack**, **Discord**, **Microsoft Teams**, and **HMAC-SHA256 JSON** (Make, Zapier, n8n, custom CRMs).
- **Zero Dependencies**: Runs directly on Node.js 22 native SQLite (`node:sqlite`) — no external database server or npm install required.
- **Flexible Hosting**: Ships with `docker-compose.yml` for self-hosted servers and a `cloudflare/` kit for Cloudflare Pages Free Tier (`D1` + `Pages Functions` with `context.waitUntil()`).

## Local Demo Mode

Requires Node.js `22.5+`.

```bash
npm start
```

Open `http://localhost:3840`.

## Packaging for Customer Handoff

See [HANDOFF.md](./HANDOFF.md) for the customer onboarding & deployment manual. To strip demo data before packaging or launching a fresh customer install:

```bash
npm run init-client
# Set SEED_DEMO=false and ADMIN_PASSWORD in .env, then:
npm start
```

## License

Commercial Self-Hosted License — see [LICENSE](./LICENSE).
