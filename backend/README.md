# Volta Store Backend

FastAPI + PostgreSQL backend for the Volta Store front end (`../index.html` / `../script.js`).

## What it provides

- **Products API** — matches the contract `script.js`'s `syncLiveProducts()` already expects
  (`GET /api/products/` returning `product_type`, `category`, `condition`, `short_description`,
  `price_display`, `spec_key`, `icon_emoji`, `brand`, `specs`, `badge`). Seeded on first boot from
  the existing `products`/`appliances` arrays in `script.js`.
- **Auth** — customer registration/login and an admin account, JWT bearer tokens.
- **Cart** — per-user cart (add/update/remove/clear items).
- **Orders** — checkout from the cart, order history, and admin order management (list all /
  update status).

## Data model

A single `products` table holds both phones and appliances, discriminated by `product_type`
(`phone` | `appliance`), so the existing frontend sync code needs no changes. Phone-only fields
(`condition`, `short_description`, `spec_key`) and appliance-only fields (`icon_emoji`, `brand`,
`specs`, `badge`) are nullable columns on the same row.

## Running locally with Docker

```bash
cd backend
cp .env.example .env   # edit JWT_SECRET / ADMIN_PASSWORD
docker compose up --build
```

The API is then at `http://localhost:8000`, docs at `http://localhost:8000/docs`.

## Running locally without Docker

Requires a local PostgreSQL (or leave `DATABASE_URL` unset to fall back to a local SQLite file,
fine for quick testing but not for production).

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
export DATABASE_URL=postgresql+psycopg2://volta:volta@localhost:5432/volta
export JWT_SECRET=dev-secret
uvicorn app.main:app --reload
```

## Deploying

Any host that can run a Docker container + Postgres works (Render, Railway, Fly.io — the same
kind of service already hosting `https://volta-backend-94tq.onrender.com` referenced in
`script.js`). Set the environment variables from `.env.example` in the host's dashboard, point
`DATABASE_URL` at the managed Postgres instance, then point `VOLTA_API` in `script.js` at the
deployed URL.

## Key endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/products/` | none | list active products/appliances |
| GET | `/api/products/{id}` | none | get one product |
| POST/PUT/DELETE | `/api/products/{id}` | admin | manage catalog |
| POST | `/api/auth/register` | none | create account |
| POST | `/api/auth/login` | none | get JWT |
| GET | `/api/auth/me` | user | current profile |
| GET/POST | `/api/cart/` `/api/cart/items` | user | manage cart |
| POST | `/api/orders/` | user | checkout current cart |
| GET | `/api/orders/` | user | my order history |
| GET | `/api/orders/admin/all` | admin | all orders |
| PATCH | `/api/orders/admin/{id}/status` | admin | update order status |

Admin credentials are seeded from `ADMIN_EMAIL` / `ADMIN_PASSWORD` on first boot — log in via
`POST /api/auth/login` to get a token, then pass `Authorization: Bearer <token>` on admin routes.
