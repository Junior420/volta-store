# Volta Store — Backend

Node.js/Express backend for the Volta storefront. It serves the website, a
products API, order capture, and an admin panel — with all data stored in
simple JSON files (no database server needed).

## Quick start

```bash
cd server
npm install
npm start
```

Then open:

- **Storefront:** http://localhost:3000/
- **Admin panel:** http://localhost:3000/admin — default password `volta2026`

On first boot the server seeds itself with the full catalog (87 products +
25 spec sheets) extracted from the website. After that, everything is managed
from the admin panel and stored in `server/data/` (git-ignored).

Set a real admin password in production:

```bash
ADMIN_PASSWORD=your-secret npm start
```

## Admin panel

- 📱 **Products** — add, edit, delete phones and appliances; mark items out of
  stock (hidden from the site without deleting them). Each product can carry
  a real photo (uploaded from the editor), a discount (original + sale price,
  shown as a strikethrough + "SALE" badge on the site), a per-product detailed
  spec table (key/value rows), and a list of capability tags — all pushed live
  to the storefront, no code changes needed.
- 🛒 **Orders** — every product-specific "WhatsApp" click on the website is
  logged as an inquiry; track each one through new → contacted → completed.

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
| POST   | `/api/uploads`        | Upload a product photo (`multipart/form-data`, field `image`, max 5MB) → `{url}` |
| GET    | `/api/orders/`        | List orders (`?status=` filter)   |
| PATCH  | `/api/orders/:id`     | Update order status               |
| GET    | `/api/stats`          | Dashboard counts                  |

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
  "image_url": null,                  // from POST /api/uploads, or any absolute URL
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

## Deploying (Render)

The repo includes `render.yaml` — create a new **Blueprint** on
[render.com](https://render.com), point it at this repo, and set
`ADMIN_PASSWORD` in the dashboard. The persistent disk keeps your products and
orders across deploys. After deploying, update the URL in
`VOLTA_API_CANDIDATES` in `script.js` if it differs from the current one.

Any other Node host works the same way: `cd server && npm install && npm start`
(set `PORT`, `ADMIN_PASSWORD`, and point `DATA_DIR` at persistent storage).
