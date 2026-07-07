import { Hono } from 'hono';
import { cors } from 'hono/cors';
import * as db from './db.js';
import * as auth from './auth.js';
import * as clickpesa from './clickpesa.js';

const app = new Hono();

// CORS — the storefront may be hosted elsewhere (e.g. GitHub Pages), same as
// the Node version.
app.use('/api/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Accept both /api/products and /api/products/ (frontend uses trailing slash).
app.use('*', async (c, next) => {
  const url = new URL(c.req.url);
  if (url.pathname.length > 1 && url.pathname.endsWith('/')) {
    url.pathname = url.pathname.slice(0, -1);
    return app.fetch(new Request(url, c.req.raw), c.env, c.executionCtx);
  }
  await next();
});

function clientIp(c) {
  return c.req.header('CF-Connecting-IP') || 'unknown';
}

async function rateLimited(c, bucket, limit, windowMs) {
  const allowed = await db.checkRateLimit(c.env.DB, `${bucket}:${clientIp(c)}`, limit, windowMs);
  return !allowed;
}

async function requireAdmin(c, next) {
  if (!(await auth.isAdminRequest(c.env, c.req.raw))) {
    return c.json({ error: 'Unauthorized. Log in at /admin.' }, 401);
  }
  await next();
}

// ── Auth ──
app.post('/api/auth/login', async (c) => {
  if (await rateLimited(c, 'login', 10, 15 * 60 * 1000)) {
    return c.json({ error: 'Too many attempts, try again later' }, 429);
  }
  const body = await c.req.json().catch(() => ({}));
  const session = await auth.login(c.env, body.password);
  if (!session) return c.json({ error: 'Wrong password' }, 401);
  return c.json(session);
});

// ── Public API ──
app.get('/api/health', (c) => c.json({ status: 'ok', time: new Date().toISOString() }));

app.get('/api/products', async (c) => {
  const isAdmin = await auth.isAdminRequest(c.env, c.req.raw);
  const q = c.req.query();
  const items = await db.listProducts(c.env.DB, {
    all: q.all && isAdmin,
    type: q.type,
    category: q.category,
    q: q.q,
  });
  return c.json(items);
});

app.get('/api/products/:id', async (c) => {
  const item = await db.getProduct(c.env.DB, Number(c.req.param('id')));
  if (!item) return c.json({ error: 'Product not found' }, 404);
  return c.json(item);
});

app.get('/api/specs', async (c) => c.json(await db.getAllSpecs(c.env.DB)));

app.post('/api/orders', async (c) => {
  if (await rateLimited(c, 'orders', 20, 60 * 60 * 1000)) {
    return c.json({ error: 'Too many requests, try again later' }, 429);
  }
  const body = await c.req.json().catch(() => ({}));
  const { customer_name, phone, product_id, product_name, message } = body;
  if (!product_name && !product_id && !message) {
    return c.json({ error: 'Provide at least product_id, product_name or message' }, 400);
  }
  const order = await db.createOrder(c.env.DB, { customer_name, phone, product_id, product_name, message });
  return c.json(order, 201);
});

// ── Admin: products ──
app.post('/api/products', requireAdmin, async (c) => {
  const body = await c.req.json().catch(() => ({}));
  if (!body.name || !body.product_type || !body.price_display) {
    return c.json({ error: 'name, product_type and price_display are required' }, 400);
  }
  const product = await db.createProduct(c.env.DB, body);
  return c.json(product, 201);
});

app.put('/api/products/:id', requireAdmin, async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const product = await db.updateProduct(c.env.DB, Number(c.req.param('id')), body);
  if (!product) return c.json({ error: 'Product not found' }, 404);
  return c.json(product);
});

app.delete('/api/products/:id', requireAdmin, async (c) => {
  const removed = await db.deleteProduct(c.env.DB, Number(c.req.param('id')));
  if (!removed) return c.json({ error: 'Product not found' }, 404);
  return c.json(removed);
});

// ── Admin: uploads (R2) ──
app.post('/api/uploads', requireAdmin, async (c) => {
  if (await rateLimited(c, 'uploads', 30, 60 * 60 * 1000)) {
    return c.json({ error: 'Too many uploads, try again later' }, 429);
  }
  const form = await c.req.formData().catch(() => null);
  const file = form && form.get('image');
  if (!file || typeof file === 'string') {
    return c.json({ error: 'No image file provided (field name: image)' }, 400);
  }
  if (!/^image\/(png|jpe?g|webp|gif)$/.test(file.type)) {
    return c.json({ error: 'Only image files are allowed' }, 400);
  }
  if (file.size > 5 * 1024 * 1024) {
    return c.json({ error: 'Image must be 5MB or smaller' }, 400);
  }
  const ext = (file.name.match(/\.[a-zA-Z0-9]+$/) || [''])[0].toLowerCase().replace(/[^a-z0-9.]/g, '');
  const key = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}${ext}`;
  await c.env.UPLOADS.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } });
  return c.json({ url: `/uploads/${key}` }, 201);
});

app.get('/uploads/:key', async (c) => {
  const object = await c.env.UPLOADS.get(c.req.param('key'));
  if (!object) return c.notFound();
  return new Response(object.body, {
    headers: {
      'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
});

// ── Admin: orders ──
app.get('/api/orders', requireAdmin, async (c) => {
  const status = c.req.query('status');
  return c.json(await db.listOrders(c.env.DB, { status }));
});

app.patch('/api/orders/:id', requireAdmin, async (c) => {
  const body = await c.req.json().catch(() => ({}));
  try {
    const order = await db.updateOrderStatus(c.env.DB, Number(c.req.param('id')), body.status);
    if (!order) return c.json({ error: 'Order not found' }, 404);
    return c.json(order);
  } catch (err) {
    return c.json({ error: err.message }, 400);
  }
});

app.patch('/api/orders/:id/payment', requireAdmin, async (c) => {
  const body = await c.req.json().catch(() => ({}));
  try {
    const order = await db.markOrderPaidManually(c.env.DB, Number(c.req.param('id')), body.method);
    if (!order) return c.json({ error: 'Order not found' }, 404);
    return c.json(order);
  } catch (err) {
    return c.json({ error: err.message }, 400);
  }
});

// ── Payments (ClickPesa) ──
app.post('/api/orders/:id/payment-link', requireAdmin, async (c) => {
  if (!clickpesa.isConfigured(c.env)) {
    return c.json({ error: 'ClickPesa is not configured on this server yet (missing CLICKPESA_CLIENT_ID/API_KEY)' }, 503);
  }
  if (await rateLimited(c, 'payment-link', 30, 60 * 60 * 1000)) {
    return c.json({ error: 'Too many requests, try again later' }, 429);
  }
  const id = Number(c.req.param('id'));
  const order = await db.getOrder(c.env.DB, id);
  if (!order) return c.json({ error: 'Order not found' }, 404);
  if (!order.price_amount) return c.json({ error: 'This order has no price to charge (it has no linked product)' }, 400);

  const publicBaseUrl = c.env.PUBLIC_BASE_URL || new URL(c.req.url).origin;
  const orderReference = `VOLTA${order.id}-${Date.now().toString(36).toUpperCase()}`;
  try {
    const { checkoutLink } = await clickpesa.createCheckoutLink(c.env, {
      totalPrice: order.price_amount,
      orderReference,
      orderCurrency: 'TZS',
      customerName: order.customer_name || undefined,
      customerPhone: order.phone ? order.phone.replace(/[^\d]/g, '') : undefined,
      description: order.product_name || undefined,
      callbackUrl: `${publicBaseUrl}/api/payments/webhook`,
    });
    const updated = await db.setOrderPaymentLink(c.env.DB, id, { orderReference, checkoutLink });
    return c.json(updated, 201);
  } catch (err) {
    return c.json({ error: 'ClickPesa error: ' + err.message }, 502);
  }
});

app.post('/api/payments/webhook', async (c) => {
  if (await rateLimited(c, 'webhook', 120, 60 * 60 * 1000)) {
    return c.json({ error: 'Too many requests' }, 429);
  }
  const body = await c.req.json().catch(() => ({}));
  const payload = body.data || body || {};
  if (clickpesa.isConfigured(c.env) && c.env.CLICKPESA_CHECKSUM_KEY) {
    const valid = await clickpesa.verifyChecksum(payload, c.env.CLICKPESA_CHECKSUM_KEY);
    if (!valid) return c.json({ error: 'Invalid checksum' }, 401);
  }
  const order = await db.applyPaymentWebhook(c.env.DB, {
    orderReference: payload.orderReference,
    status: payload.status,
    paymentReference: payload.paymentReference,
  });
  if (!order) return c.json({ error: 'No matching order for this orderReference' }, 404);
  return c.body(null, 200);
});

// ── Admin: analytics, stats, backup ──
app.get('/api/analytics', requireAdmin, async (c) => c.json(await db.getAnalytics(c.env.DB, c.req.query('days'))));
app.get('/api/stats', requireAdmin, async (c) => c.json(await db.getStats(c.env.DB)));
app.get('/api/admin/backup', requireAdmin, async (c) => {
  const backup = await db.getBackup(c.env.DB);
  return c.json(backup, 200, {
    'Content-Disposition': `attachment; filename="volta-backup-${Date.now()}.json"`,
  });
});

app.notFound((c) => {
  if (new URL(c.req.url).pathname.startsWith('/api')) return c.json({ error: 'Not found' }, 404);
  return c.text('Not found', 404);
});

export default app;
