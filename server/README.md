# Volta Store — Backend

Node.js/Express backend for the Volta storefront. It serves the website, a
products API, order capture, and an admin panel — with all data stored in
MongoDB (a free Atlas cluster works fine, no paid hosting required).

## Quick start

Needs a MongoDB connection string — see **Database setup** below for a real
Atlas cluster, or for quick local development without an Atlas account:

```bash
cd server
npm install
npm run dev:db        # starts a throwaway local MongoDB, prints a connection string
# in another terminal:
MONGODB_URI="mongodb://127.0.0.1:27117/volta" npm start
```

Then open:

- **Storefront:** http://localhost:3000/
- **Admin panel:** http://localhost:3000/admin — default password `volta2026`

On first boot the server seeds the database with the full catalog (87
products + 25 spec sheets) extracted from the website. After that, everything
is managed from the admin panel.

Set a real admin password in production:

```bash
ADMIN_PASSWORD=your-secret MONGODB_URI="..." npm start
```

## Database setup (MongoDB Atlas, free)

1. Sign up at [mongodb.com/cloud/atlas/register](https://www.mongodb.com/cloud/atlas/register) — no credit card required
2. Create a cluster: choose the **M0 Free** tier, any region close to you
3. **Database Access** (left sidebar) → **Add New Database User** → username/password auth, save the password somewhere safe
4. **Network Access** (left sidebar) → **Add IP Address** → **Allow Access from Anywhere** (`0.0.0.0/0`) — needed since Render's outbound IP isn't fixed on the free plan
5. Back on the cluster page → **Connect** → **Drivers** → copy the connection string, looks like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Replace `<username>`/`<password>` with the values from step 3 — that whole string is your `MONGODB_URI`

No disk, no separate database server to run, and it survives every restart/redeploy.

## Admin panel

- 📱 **Products** — add, edit, delete phones and appliances; mark items out of
  stock (hidden from the site without deleting them). Each product can carry
  a real photo (uploaded from the editor), a discount (original + sale price,
  shown as a strikethrough + "SALE" badge on the site), a per-product detailed
  spec table (key/value rows), and a list of capability tags — all pushed live
  to the storefront, no code changes needed.
- 🛒 **Orders** — every product-specific "WhatsApp" click on the website is
  logged as an inquiry; track each one through new → contacted → completed.
  Marking an order **completed** snapshots the product's price as a confirmed
  sale — that's what feeds the Analytics tab.
- 📊 **Analytics** — total revenue, average order value, conversion rate,
  revenue by day (7/14/30/90-day ranges, with a table-view toggle), and top
  products/categories by revenue. Only counts completed orders, so it stays
  accurate even as prices change over time.
- ⬇ **Backup** — MongoDB Atlas keeps its own backups, but the Backup button in
  the header also downloads a full JSON snapshot on demand, for an extra
  off-platform copy.
- 💳 **Payments** — the sales flow stays WhatsApp-first (customer inquires,
  you negotiate and confirm there). Two ways to record payment:
  - **Mark paid via…** dropdown in the Orders tab (cash / mobile money / bank
    transfer) — for when you collect payment yourself, no external account
    needed. Marks the order paid and completed immediately.
  - **Send link** — generates a real [ClickPesa](https://clickpesa.com)
    checkout link (M-Pesa, Tigo Pesa, Airtel Money, cards) for that order's
    price, to paste into the WhatsApp chat. Payment status updates
    automatically via webhook once the customer pays. Optional — only appears
    functional once ClickPesa is configured (see below).

  The Analytics tab breaks revenue down by payment method either way.

  Requires a ClickPesa merchant account (sign up at clickpesa.com — business
  KYC, bank account). Once you have one, set these env vars:

  ```bash
  CLICKPESA_CLIENT_ID=...       # from your ClickPesa dashboard → app settings
  CLICKPESA_API_KEY=...
  CLICKPESA_CHECKSUM_KEY=...    # optional but strongly recommended — verifies webhooks are really from ClickPesa
  PUBLIC_BASE_URL=...           # your public server URL, so ClickPesa can call back /api/payments/webhook
  ```

  On Render, `PUBLIC_BASE_URL` is auto-detected from Render's own
  `RENDER_EXTERNAL_URL` — you only need to set the three `CLICKPESA_*` values
  in the dashboard (already stubbed into `render.yaml`). Until these are set,
  the "Send link" button returns a clear "not configured" error instead of
  failing silently.

## API

Public:

| Method | Path                  | Description                                    |
|--------|-----------------------|------------------------------------------------|
| GET    | `/api/health`         | Health check                                    |
| GET    | `/api/products/`      | All in-stock products (`?type=`, `?category=`, `?q=` filters) |
| GET    | `/api/products/:id`   | One product                                     |
| GET    | `/api/specs/`         | Phone spec sheets keyed by `spec_key`           |
| POST   | `/api/orders/`        | Record an order/inquiry                         |

Admin (send `Authorization: Bearer <token>` from `POST /api/auth/login`):

| Method | Path                  | Description                       |
|--------|-----------------------|-----------------------------------|
| POST   | `/api/auth/login`     | `{password}` → `{token}`          |
| GET    | `/api/products/?all=1`| Includes out-of-stock products    |
| POST   | `/api/products/`      | Create product                    |
| PUT    | `/api/products/:id`   | Update product                    |
| DELETE | `/api/products/:id`   | Delete product                    |
| POST   | `/api/uploads`        | Upload a product photo (`multipart/form-data`, field `image`, max 600KB) → `{url}` (a `data:` URL, stored directly on the product — no file storage needed) |
| GET    | `/api/orders/`        | List orders (`?status=` filter)   |
| PATCH  | `/api/orders/:id`     | Update order status               |
| GET    | `/api/stats`          | Dashboard counts                  |
| GET    | `/api/analytics`      | Revenue/conversion stats (`?days=7\|14\|30\|90`) |
| GET    | `/api/admin/backup`   | Full JSON export of products/specs/orders |
| POST   | `/api/orders/:id/payment-link` | Generate a ClickPesa checkout link for that order |
| PATCH  | `/api/orders/:id/payment` | Manually mark an order paid (`{method: cash\|mobile_money\|bank_transfer}`) |

Unauthenticated (called by ClickPesa, verified via checksum instead of a login):

| Method | Path                     | Description                     |
|--------|--------------------------|----------------------------------|
| POST   | `/api/payments/webhook`  | Payment status updates from ClickPesa |

Rate limits: 10 login attempts / 15 min, 20 order submissions / hour, 30
uploads / hour, 30 payment links / hour, 120 webhook deliveries / hour — all per IP.

Product shape (matches what the frontend's `syncLiveProducts()` expects):

```json
{
  "id": 1,
  "product_type": "phone",            // or "appliance"
  "category": "iphone",               // brand key or appliance category
  "condition": "used",                // phones only
  "name": "iPhone 11 64GB",
  "short_description": "Used · Dual SIM · Black",
  "price_display": "TZS 510,000",
  "original_price_display": null,     // set to show a strikethrough discount price
  "image_url": null,                  // a data: URL from POST /api/uploads, or any absolute URL
  "detailed_specs": null,             // {"Display":"6.1\" OLED", ...} shown in the specs modal
  "capabilities": null,               // ["5G","MagSafe",...] shown as tags
  "spec_key": "iPhone 11",            // phones: fallback specs if detailed_specs is unset
  "brand": "Hisense",                 // appliances only
  "specs": "4K UHD · VIDAA OS",       // appliances only
  "icon_emoji": "📺",                 // appliances only
  "badge": "📦 New",                  // appliances only
  "in_stock": true
}
```

## How the frontend connects

`script.js` tries `/api` on the same origin first (i.e. when the site is served
by this server), then falls back to the hosted backend URL in
`VOLTA_API_CANDIDATES`. If no backend responds, the site still works using its
built-in catalog — so the GitHub Pages static deployment never breaks.

## Deploying (Render, free tier)

The repo includes `render.yaml`, set to Render's **Free** instance type — no
payment method needed, since storage now lives in MongoDB Atlas instead of a
paid persistent disk.

1. Set up MongoDB Atlas first (see **Database setup** above) and have your
   `MONGODB_URI` ready
2. Create a new **Blueprint** on [render.com](https://render.com), point it
   at this repo
3. Fill in the env vars it asks for: `ADMIN_PASSWORD` (a real one) and
   `MONGODB_URI` (from step 1) — leave `CLICKPESA_*` blank for now
4. Deploy. First build takes a few minutes

After deploying, update the URL in `VOLTA_API_CANDIDATES` in `script.js` if
it differs from the current one.

Any other Node host works the same way: `cd server && npm install && npm start`
(set `PORT`, `ADMIN_PASSWORD`, `MONGODB_URI`).
