# Deploying Volta Store to Cloudflare Pages

This deploys the same storefront + admin panel + API as `server/` (Render),
but on Cloudflare's genuinely free tier — no disk, no payment method, no
Starter plan. Static files (`index.html`, `script.js`, `admin/`) are served
directly by Pages; `functions/` runs the API on Cloudflare Workers, backed by
D1 (database), R2 (product photos), and KV (admin login sessions).

## What you need to create, in order

Each of these is a separate resource in the Cloudflare dashboard — create
them first, then wire them together in the last step.

### 1. D1 database

**Workers & Pages → D1 SQL Database → Create Database**
- Name: `volta`
- Create

Once created, open it and go to its **Console** tab. Paste in the full
contents of [`migrations/schema.sql`](migrations/schema.sql) and click
**Execute**. Then do the same with
[`migrations/seed.sql`](migrations/seed.sql) — this loads the same 87
products and 25 spec sheets the Render version ships with.

### 2. R2 bucket

**R2 Object Storage → Create bucket**
- Name: `volta-uploads`
- Create

(R2's free tier — 10GB storage, no egress fees — needs no payment method for
usage within the free limits, but Cloudflare may still ask you to "enable R2"
once per account, which can require adding a card on file even to stay on the
free tier. If that happens and you'd rather not, product photo uploads just
won't work until you do — everything else still functions.)

### 3. KV namespace

**Workers & Pages → KV → Create a namespace**
- Name: `volta-sessions`
- Create

### 4. The Pages project itself

**Workers & Pages → Create application → Pages → Connect to Git**
- Select the `volta-store` repository (this one), authorize if asked
- Production branch: `main`
- Build command: **leave blank**
- Build output directory: `.`
- Save and Deploy (it'll deploy once now — it won't work yet, that's expected, the bindings aren't wired up)

### 5. Bind D1, R2, and KV to the Pages project

Go to the Pages project → **Settings → Bindings → Add**, three times:

| Type | Variable name | Resource |
|---|---|---|
| D1 database | `DB` | `volta` |
| R2 bucket | `UPLOADS` | `volta-uploads` |
| KV namespace | `SESSIONS` | `volta-sessions` |

The **Variable name** must match exactly (`DB`, `UPLOADS`, `SESSIONS`) — the
code reads `env.DB`, `env.UPLOADS`, `env.SESSIONS` specifically.

### 6. Environment variables

Same Settings page → **Environment variables**:

| Name | Value |
|---|---|
| `ADMIN_PASSWORD` | a real password you choose |

Optional, add later once you have a ClickPesa account (see `server/README.md`
for what these do):

| Name | Value |
|---|---|
| `CLICKPESA_CLIENT_ID` | from ClickPesa dashboard |
| `CLICKPESA_API_KEY` | from ClickPesa dashboard |
| `CLICKPESA_CHECKSUM_KEY` | from ClickPesa dashboard |
| `PUBLIC_BASE_URL` | your `*.pages.dev` URL (or custom domain) — needed so ClickPesa can call back `/api/payments/webhook` |

### 7. Redeploy

Bindings and env vars only take effect on a **new** deployment — go to the
Pages project's **Deployments** tab → the three-dot menu on the latest one →
**Retry deployment** (or just push any commit to `main`).

## Verifying it worked

Once deployed, your `*.pages.dev` URL should behave exactly like the Render
deployment:

- `/` — the storefront
- `/admin` — the admin panel (log in with the `ADMIN_PASSWORD` you set)
- `/api/health` — `{"status":"ok",...}`
- `/api/products/` — the 87 seeded products

## Local development

```bash
npm install
npm run db:migrate:local   # applies migrations/schema.sql to a local D1
npm run db:seed:local      # loads migrations/seed.sql
npm run dev                # wrangler pages dev, http://localhost:8788
```

Create a `.dev.vars` file (git-ignored) for local secrets:

```
ADMIN_PASSWORD=devpassword
CLICKPESA_BASE_URL=http://localhost:4001   # only if testing against a mock
CLICKPESA_CLIENT_ID=...
CLICKPESA_API_KEY=...
CLICKPESA_CHECKSUM_KEY=...
PUBLIC_BASE_URL=http://localhost:8788
```

## How this differs from `server/` (Render)

Same API contract (`script.js` and `admin/index.html` are unchanged), same
routes, same field shapes — only the storage layer changed:

| | Render (`server/`) | Cloudflare (this) |
|---|---|---|
| Database | MongoDB Atlas | D1 (SQLite) |
| Product photos | `data:` URLs in Mongo | R2 object storage |
| Admin sessions | in-memory `Map` | KV (has native TTL) |
| Rate limiting | `express-rate-limit` (in-memory) | D1-backed sliding window |
| Runtime | long-running Node/Express process | stateless edge Worker per-request |

`server/` is left in the repo untouched — both deployment paths keep working
independently.
