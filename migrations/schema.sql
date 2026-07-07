-- Volta Store — D1 schema (Cloudflare Pages deployment)
-- Mirrors the field shapes used by server/db.js (the Render/MongoDB version)
-- so script.js and admin/index.html need no changes.

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_type TEXT NOT NULL,
  category TEXT,
  condition TEXT,
  name TEXT NOT NULL,
  short_description TEXT,
  brand TEXT,
  specs TEXT,
  icon_emoji TEXT,
  badge TEXT,
  price_display TEXT NOT NULL,
  original_price_display TEXT,
  image_url TEXT,
  detailed_specs TEXT,   -- JSON object, string
  capabilities TEXT,     -- JSON array, string
  spec_key TEXT,
  in_stock INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS specs (
  spec_key TEXT PRIMARY KEY,
  data TEXT NOT NULL -- JSON: {"specs":{...},"caps":[...]}
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_name TEXT,
  phone TEXT,
  product_id INTEGER,
  product_name TEXT,
  category TEXT,
  price_display TEXT,
  price_amount INTEGER NOT NULL DEFAULT 0,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  payment_status TEXT NOT NULL DEFAULT 'unpaid',
  payment_method TEXT,
  payment_link TEXT,
  payment_order_reference TEXT,
  payment_reference TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Sliding-window rate limiting (login/orders/uploads/payment-links/webhooks).
-- D1's free tier gives 100K writes/day, comfortably enough for this — KV's
-- free tier (1K writes/day) would not be.
CREATE TABLE IF NOT EXISTS rate_limits (
  rl_key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  window_start INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_in_stock ON products(in_stock);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_order_reference ON orders(payment_order_reference);
