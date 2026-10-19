# Local Deployment & Operations Guide — Mitior 2.0 (Mitior OS / mOS)

**Version**: 2.0.0  
**Architecture**: Local-First SPA (React 19 + Vite 6 + Tailwind CSS v4) + Express Node Server (`server.ts`) + JSON Persistence (`server_db.json`)

---

## 1. Prerequisites

- **Node.js**: v20.x or v22.x LTS (verified on macOS / Linux / Windows)
- **npm**: v10+
- **Port**: `3000` (configurable via `PORT` environment variable)

---

## 2. Quick-Start Installation & Launch

```bash
# 1. Install dependencies
npm install

# 2. Verify TypeScript compilation and automated test suite
npm run lint
npm test

# 3. Run in development mode (Express + Vite HMR on http://localhost:3000)
npm run dev

# 4. Build and run production bundle
npm run build
npm start
```

---

## 3. Environment Variables (`.env`)

Create a `.env` file in the root directory (or copy `.env.example` if present). All external integrations degrade gracefully to local developer sandboxes when keys are omitted:

| Variable | Required | Default | Description |
| :--- | :---: | :--- | :--- |
| `PORT` | No | `3000` | HTTP server port |
| `MITIOR_DB_PATH` | No | `./server_db.json` | File path for persistent server JSON database |
| `GEMINI_API_KEY` | No | — | Optional Gemini API key |
| `MPESA_CONSUMER_KEY` | No | Sandbox Simulator | Safaricom Daraja API Consumer Key |
| `MPESA_CONSUMER_SECRET` | No | Sandbox Simulator | Safaricom Daraja API Consumer Secret |
| `MPESA_SHORTCODE` | No | `174379` | Lipa Na M-Pesa Business Shortcode |
| `MPESA_PASSKEY` | No | Sandbox Passkey | Lipa Na M-Pesa Online Passkey |
| `MPESA_CALLBACK_SECRET` | No | `simulate-secret-token` | Webhook verification secret |
| `STRIPE_SECRET_KEY` | No | Local Card Sandbox | Optional Stripe Secret Key |

---

## 4. Pre-Seeded Executive Accounts

For immediate local verification and executive sandbox testing:

- **Default CEO Enterprise Account**:
  - **Email**: `ryan@mitior.co`
  - **Password**: `password123`
  - **Tier**: `Enterprise Local App`
- **Creator Fundi Enterprise Account**:
  - **Email**: `zejithefundi@gmail.com`
  - **Password**: `password123`
  - **Tier**: `Enterprise Local App`

---

## 5. Verification Script

Run the automated installation and health verification script at any time:

```bash
bash scripts/verify-installation.sh
```

---

## 6. Ubuntu VM Production Deployment (`102.164.62.65`)

- **Primary HTTPS FQDN**: `https://mitior.102.164.62.65.sslip.io`
- **Secondary HTTPS FQDN**: `https://mitior-os.102-164-62-65.nip.io`
- **Direct IP**: `http://102.164.62.65`
- **Application Directory**: `/opt/mitior`
- **Systemd Service**: `/etc/systemd/system/mitior.service` (`NODE_ENV=production PORT=3000 /usr/bin/node /opt/mitior/dist/server.cjs`)
- **Reverse Proxy & Auto-TLS**: Caddy 2 (`/etc/caddy/Caddyfile`) with automatic Let's Encrypt HTTPS certificates.

### Updating the Production VM from GitHub:
```bash
cd /opt/mitior && git pull origin main && npm ci && npm run build && sudo systemctl restart mitior.service
```

