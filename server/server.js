// Volta Store backend — products API, order capture and admin panel.
// Run: npm install && npm start   (from the server/ directory)
const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const db = require('./db');

const UPLOADS_DIR = path.join(db.DATA_DIR, 'uploads');
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'volta2026';
if (!process.env.ADMIN_PASSWORD) {
  console.warn('⚠️  ADMIN_PASSWORD not set — using the default "volta2026". Set it in production!');
}

db.ensureSeeded('products', []);
db.ensureSeeded('specs', {});
db.ensureSeeded('orders', []);

const app = express();

// Security headers. CSP is left off on purpose: the storefront and admin
// panel rely on inline onclick handlers throughout, which a real CSP would
// break; cross-origin-resource-policy is relaxed because the storefront may
// be hosted separately (e.g. GitHub Pages) from this API + its /uploads.
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginEmbedderPolicy: false,
}));

app.use(express.json({ limit: '1mb' }));

// CORS — the storefront may be hosted elsewhere (e.g. GitHub Pages).
app.use((req, res, next) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// Rate limits on endpoints that are either public or could fill the disk.
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false });
const orderLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false });
const uploadLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false });

// Accept both /api/products and /api/products/ (frontend uses trailing slash)
app.use((req, res, next) => {
  if (req.path.length > 1 && req.path.endsWith('/')) {
    req.url = req.path.slice(0, -1) + (req.url.slice(req.path.length) || '');
  }
  next();
});

// ── Auth ──────────────────────────────────────────────────────────
const sessions = new Map(); // token -> expiry timestamp
const SESSION_TTL = 24 * 60 * 60 * 1000;

function requireAdmin(req, res, next) {
  const token = (req.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  const expiry = sessions.get(token);
  if (!expiry || expiry < Date.now()) {
    sessions.delete(token);
    return res.status(401).json({ error: 'Unauthorized. Log in at /admin.' });
  }
  next();
}

app.post('/api/auth/login', loginLimiter, (req, res) => {
  const { password } = req.body || {};
  const ok = typeof password === 'string' &&
    password.length === ADMIN_PASSWORD.length &&
    crypto.timingSafeEqual(Buffer.from(password), Buffer.from(ADMIN_PASSWORD));
  if (!ok) return res.status(401).json({ error: 'Wrong password' });
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, Date.now() + SESSION_TTL);
  res.json({ token, expires_in: SESSION_TTL / 1000 });
});

// ── Public API ────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

function isAdmin(req) {
  const token = (req.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  const expiry = sessions.get(token);
  return !!expiry && expiry >= Date.now();
}

app.get('/api/products', (req, res) => {
  let items = db.read('products');
  if (!(req.query.all && isAdmin(req))) items = items.filter(p => p.in_stock !== false);
  const { type, category, q } = req.query;
  if (type) items = items.filter(p => p.product_type === type);
  if (category) items = items.filter(p => p.category === category);
  if (q) {
    const needle = String(q).toLowerCase();
    items = items.filter(p =>
      [p.name, p.brand, p.short_description, p.specs].filter(Boolean).join(' ').toLowerCase().includes(needle));
  }
  res.json(items);
});

app.get('/api/products/:id', (req, res) => {
  const item = db.read('products').find(p => p.id === Number(req.params.id));
  if (!item) return res.status(404).json({ error: 'Product not found' });
  res.json(item);
});

app.get('/api/specs', (req, res) => res.json(db.read('specs')));

function priceAmount(priceDisplay) {
  const digits = String(priceDisplay || '').replace(/[^\d]/g, '');
  return digits ? Number(digits) : 0;
}

// Customers (or the site itself) can record an order/inquiry here. When it
// references a real product we snapshot its price/category so completed
// orders can be totaled up later in /api/analytics — prices change over
// time, so the order must keep what it was worth *at the time of inquiry*.
app.post('/api/orders', orderLimiter, (req, res) => {
  const { customer_name, phone, product_id, product_name, message } = req.body || {};
  if (!product_name && !product_id && !message) {
    return res.status(400).json({ error: 'Provide at least product_id, product_name or message' });
  }
  const product = product_id != null ? db.read('products').find(p => p.id === Number(product_id)) : null;
  const orders = db.read('orders');
  const now = new Date().toISOString();
  const order = {
    id: db.nextId(orders),
    customer_name: String(customer_name || '').slice(0, 120) || null,
    phone: String(phone || '').slice(0, 40) || null,
    product_id: product_id != null ? Number(product_id) : null,
    product_name: String((product && product.name) || product_name || '').slice(0, 200) || null,
    category: product ? product.category : null,
    price_display: product ? product.price_display : null,
    price_amount: product ? priceAmount(product.price_display) : 0,
    message: String(message || '').slice(0, 1000) || null,
    status: 'new',
    created_at: now,
    updated_at: now,
  };
  orders.push(order);
  db.write('orders', orders);
  res.status(201).json(order);
});

// ── Admin API ─────────────────────────────────────────────────────

// Detailed specs is a flat string->string map (e.g. {"Display":"6.1\" OLED"}).
// Capabilities is a short list of feature tags (e.g. ["5G","MagSafe"]).
function cleanDetailedSpecs(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const out = {};
  for (const [key, val] of Object.entries(value)) {
    const k = String(key).trim().slice(0, 40);
    const v = String(val).trim().slice(0, 120);
    if (k && v) out[k] = v;
    if (Object.keys(out).length >= 30) break;
  }
  return Object.keys(out).length ? out : null;
}

function cleanCapabilities(value) {
  if (!Array.isArray(value)) return null;
  const out = value.map(v => String(v).trim().slice(0, 40)).filter(Boolean).slice(0, 20);
  return out.length ? out : null;
}

function buildProductFields(b) {
  return {
    product_type: b.product_type === 'appliance' ? 'appliance' : 'phone',
    category: b.category || null,
    condition: b.condition || null,
    name: String(b.name),
    short_description: b.short_description || null,
    brand: b.brand || null,
    specs: b.specs || null,
    icon_emoji: b.icon_emoji || null,
    badge: b.badge || null,
    price_display: String(b.price_display),
    original_price_display: b.original_price_display ? String(b.original_price_display) : null,
    image_url: b.image_url || null,
    detailed_specs: cleanDetailedSpecs(b.detailed_specs),
    capabilities: cleanCapabilities(b.capabilities),
    spec_key: b.spec_key || null,
    in_stock: b.in_stock !== false,
  };
}

app.post('/api/products', requireAdmin, (req, res) => {
  const b = req.body || {};
  if (!b.name || !b.product_type || !b.price_display) {
    return res.status(400).json({ error: 'name, product_type and price_display are required' });
  }
  const products = db.read('products');
  const product = { id: db.nextId(products), ...buildProductFields(b) };
  products.push(product);
  db.write('products', products);
  res.status(201).json(product);
});

app.put('/api/products/:id', requireAdmin, (req, res) => {
  const products = db.read('products');
  const idx = products.findIndex(p => p.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Product not found' });
  const allowed = ['product_type', 'category', 'condition', 'name', 'short_description',
    'brand', 'specs', 'icon_emoji', 'badge', 'price_display', 'original_price_display',
    'image_url', 'detailed_specs', 'capabilities', 'spec_key', 'in_stock'];
  const merged = { ...products[idx], ...req.body };
  const fields = buildProductFields(merged);
  for (const key of allowed) {
    products[idx][key] = fields[key];
  }
  db.write('products', products);
  res.json(products[idx]);
});

app.delete('/api/products/:id', requireAdmin, (req, res) => {
  const products = db.read('products');
  const idx = products.findIndex(p => p.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Product not found' });
  const [removed] = products.splice(idx, 1);
  db.write('products', products);
  res.json(removed);
});

// ── Product image uploads ────────────────────────────────────────
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOADS_DIR),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase().replace(/[^a-z0-9.]/g, '');
      cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!/^image\/(png|jpe?g|webp|gif)$/.test(file.mimetype)) return cb(new Error('Only image files are allowed'));
    cb(null, true);
  },
});

app.post('/api/uploads', requireAdmin, uploadLimiter, (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'No image file provided (field name: image)' });
    res.status(201).json({ url: `/uploads/${req.file.filename}` });
  });
});

app.get('/api/orders', requireAdmin, (req, res) => {
  const orders = db.read('orders').slice().reverse(); // newest first
  res.json(req.query.status ? orders.filter(o => o.status === req.query.status) : orders);
});

app.patch('/api/orders/:id', requireAdmin, (req, res) => {
  const orders = db.read('orders');
  const order = orders.find(o => o.id === Number(req.params.id));
  if (!order) return res.status(404).json({ error: 'Order not found' });
  const status = req.body && req.body.status;
  if (!['new', 'contacted', 'completed', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: 'status must be one of: new, contacted, completed, cancelled' });
  }
  order.status = status;
  order.updated_at = new Date().toISOString();
  db.write('orders', orders);
  res.json(order);
});

app.get('/api/analytics', requireAdmin, (req, res) => {
  const days = Math.min(90, Math.max(7, Number(req.query.days) || 14));
  const orders = db.read('orders');
  const completed = orders.filter(o => o.status === 'completed');

  const revenueTotal = completed.reduce((sum, o) => sum + (o.price_amount || 0), 0);
  const cancelledCount = orders.filter(o => o.status === 'cancelled').length;
  const resolved = completed.length + cancelledCount;

  // Day buckets for the requested range, oldest first, zero-filled so the
  // chart always has a continuous x-axis even on days with no sales.
  const dayKey = iso => iso.slice(0, 10);
  const buckets = new Map();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    buckets.set(d.toISOString().slice(0, 10), { date: d.toISOString().slice(0, 10), revenue: 0, count: 0 });
  }
  completed.forEach(o => {
    const key = dayKey(o.updated_at || o.created_at);
    const bucket = buckets.get(key);
    if (bucket) { bucket.revenue += o.price_amount || 0; bucket.count += 1; }
  });

  function topBy(keyFn) {
    const groups = new Map();
    completed.forEach(o => {
      const key = keyFn(o);
      if (!key) return;
      const g = groups.get(key) || { key, revenue: 0, count: 0 };
      g.revenue += o.price_amount || 0;
      g.count += 1;
      groups.set(key, g);
    });
    return [...groups.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }

  res.json({
    range_days: days,
    revenue_total: revenueTotal,
    orders_total: orders.length,
    orders_new: orders.filter(o => o.status === 'new').length,
    orders_contacted: orders.filter(o => o.status === 'contacted').length,
    orders_completed: completed.length,
    orders_cancelled: cancelledCount,
    conversion_rate: orders.length ? completed.length / orders.length : 0,
    win_rate: resolved ? completed.length / resolved : 0,
    avg_order_value: completed.length ? revenueTotal / completed.length : 0,
    revenue_by_day: [...buckets.values()],
    top_products: topBy(o => o.product_name).map(g => ({ name: g.key, revenue: g.revenue, count: g.count })),
    top_categories: topBy(o => o.category).map(g => ({ category: g.key, revenue: g.revenue, count: g.count })),
  });
});

app.get('/api/stats', requireAdmin, (req, res) => {
  const products = db.read('products');
  const orders = db.read('orders');
  res.json({
    products_total: products.length,
    products_in_stock: products.filter(p => p.in_stock !== false).length,
    phones: products.filter(p => p.product_type === 'phone').length,
    appliances: products.filter(p => p.product_type === 'appliance').length,
    orders_total: orders.length,
    orders_new: orders.filter(o => o.status === 'new').length,
  });
});

// The JSON database lives on a single disk with no automatic backups —
// this gives the admin an on-demand export they can save off-platform.
app.get('/api/admin/backup', requireAdmin, (req, res) => {
  const backup = {
    exported_at: new Date().toISOString(),
    products: db.read('products'),
    specs: db.read('specs'),
    orders: db.read('orders'),
  };
  res.set('Content-Disposition', `attachment; filename="volta-backup-${Date.now()}.json"`);
  res.json(backup);
});

// ── Static files ──────────────────────────────────────────────────
app.use('/uploads', express.static(UPLOADS_DIR));
app.use('/admin', express.static(path.join(__dirname, 'admin')));
app.use(express.static(path.join(__dirname, '..'), { index: 'index.html' }));

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

app.listen(PORT, () => {
  console.log(`⚡ Volta backend running on http://localhost:${PORT}`);
  console.log(`   Storefront: http://localhost:${PORT}/  ·  Admin: http://localhost:${PORT}/admin`);
});
