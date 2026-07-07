// D1 data access — Volta Store on Cloudflare. Direct SQL rather than the
// whole-collection JSON approach the Node/Mongo versions use, since D1 is
// relational and this keeps queries cheap (D1 free tier: 5M rows read/day,
// 100K rows written/day — plenty for a small store, but no reason to waste it
// reading every row on every request).

function rowToProduct(row) {
  if (!row) return null;
  return {
    id: row.id,
    product_type: row.product_type,
    category: row.category,
    condition: row.condition,
    name: row.name,
    short_description: row.short_description,
    brand: row.brand,
    specs: row.specs,
    icon_emoji: row.icon_emoji,
    badge: row.badge,
    price_display: row.price_display,
    original_price_display: row.original_price_display,
    image_url: row.image_url,
    detailed_specs: row.detailed_specs ? JSON.parse(row.detailed_specs) : null,
    capabilities: row.capabilities ? JSON.parse(row.capabilities) : null,
    spec_key: row.spec_key,
    in_stock: !!row.in_stock,
  };
}

function rowToOrder(row) {
  if (!row) return null;
  return {
    id: row.id,
    customer_name: row.customer_name,
    phone: row.phone,
    product_id: row.product_id,
    product_name: row.product_name,
    category: row.category,
    price_display: row.price_display,
    price_amount: row.price_amount,
    message: row.message,
    status: row.status,
    payment_status: row.payment_status,
    payment_method: row.payment_method,
    payment_link: row.payment_link,
    payment_order_reference: row.payment_order_reference,
    payment_reference: row.payment_reference,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

// ── Products ──
export async function listProducts(db, { all, type, category, q } = {}) {
  const clauses = [];
  const args = [];
  if (!all) clauses.push('in_stock = 1');
  if (type) { clauses.push('product_type = ?'); args.push(type); }
  if (category) { clauses.push('category = ?'); args.push(category); }
  if (q) {
    clauses.push('(lower(name) LIKE ? OR lower(brand) LIKE ? OR lower(short_description) LIKE ? OR lower(specs) LIKE ?)');
    const needle = `%${String(q).toLowerCase()}%`;
    args.push(needle, needle, needle, needle);
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const { results } = await db.prepare(`SELECT * FROM products ${where} ORDER BY id`).bind(...args).all();
  return results.map(rowToProduct);
}

export async function getProduct(db, id) {
  const row = await db.prepare('SELECT * FROM products WHERE id = ?').bind(id).first();
  return rowToProduct(row);
}

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

function productFields(b) {
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
    in_stock: b.in_stock !== false ? 1 : 0,
  };
}

export async function createProduct(db, body) {
  const f = productFields(body);
  const res = await db.prepare(`
    INSERT INTO products (product_type, category, condition, name, short_description, brand, specs,
      icon_emoji, badge, price_display, original_price_display, image_url, detailed_specs, capabilities, spec_key, in_stock)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).bind(
    f.product_type, f.category, f.condition, f.name, f.short_description, f.brand, f.specs,
    f.icon_emoji, f.badge, f.price_display, f.original_price_display, f.image_url,
    f.detailed_specs ? JSON.stringify(f.detailed_specs) : null,
    f.capabilities ? JSON.stringify(f.capabilities) : null,
    f.spec_key, f.in_stock,
  ).run();
  return getProduct(db, res.meta.last_row_id);
}

export async function updateProduct(db, id, body) {
  const existing = await getProduct(db, id);
  if (!existing) return null;
  const f = productFields({ ...existing, ...body });
  await db.prepare(`
    UPDATE products SET product_type=?, category=?, condition=?, name=?, short_description=?, brand=?, specs=?,
      icon_emoji=?, badge=?, price_display=?, original_price_display=?, image_url=?, detailed_specs=?, capabilities=?, spec_key=?, in_stock=?
    WHERE id=?
  `).bind(
    f.product_type, f.category, f.condition, f.name, f.short_description, f.brand, f.specs,
    f.icon_emoji, f.badge, f.price_display, f.original_price_display, f.image_url,
    f.detailed_specs ? JSON.stringify(f.detailed_specs) : null,
    f.capabilities ? JSON.stringify(f.capabilities) : null,
    f.spec_key, f.in_stock, id,
  ).run();
  return getProduct(db, id);
}

export async function deleteProduct(db, id) {
  const existing = await getProduct(db, id);
  if (!existing) return null;
  await db.prepare('DELETE FROM products WHERE id = ?').bind(id).run();
  return existing;
}

// ── Specs ──
export async function getAllSpecs(db) {
  const { results } = await db.prepare('SELECT spec_key, data FROM specs').all();
  const out = {};
  for (const row of results) out[row.spec_key] = JSON.parse(row.data);
  return out;
}

// ── Orders ──
function priceAmount(priceDisplay) {
  const digits = String(priceDisplay || '').replace(/[^\d]/g, '');
  return digits ? Number(digits) : 0;
}

export async function createOrder(db, { customer_name, phone, product_id, product_name, message }) {
  const product = product_id != null ? await getProduct(db, Number(product_id)) : null;
  const now = new Date().toISOString();
  const fields = {
    customer_name: String(customer_name || '').slice(0, 120) || null,
    phone: String(phone || '').slice(0, 40) || null,
    product_id: product_id != null ? Number(product_id) : null,
    product_name: String((product && product.name) || product_name || '').slice(0, 200) || null,
    category: product ? product.category : null,
    price_display: product ? product.price_display : null,
    price_amount: product ? priceAmount(product.price_display) : 0,
    message: String(message || '').slice(0, 1000) || null,
  };
  const res = await db.prepare(`
    INSERT INTO orders (customer_name, phone, product_id, product_name, category, price_display, price_amount,
      message, status, payment_status, created_at, updated_at)
    VALUES (?,?,?,?,?,?,?,?,'new','unpaid',?,?)
  `).bind(
    fields.customer_name, fields.phone, fields.product_id, fields.product_name, fields.category,
    fields.price_display, fields.price_amount, fields.message, now, now,
  ).run();
  return getOrder(db, res.meta.last_row_id);
}

export async function getOrder(db, id) {
  const row = await db.prepare('SELECT * FROM orders WHERE id = ?').bind(id).first();
  return rowToOrder(row);
}

export async function listOrders(db, { status } = {}) {
  const where = status ? 'WHERE status = ?' : '';
  const args = status ? [status] : [];
  const { results } = await db.prepare(`SELECT * FROM orders ${where} ORDER BY id DESC`).bind(...args).all();
  return results.map(rowToOrder);
}

const ORDER_STATUSES = ['new', 'contacted', 'completed', 'cancelled'];
export async function updateOrderStatus(db, id, status) {
  if (!ORDER_STATUSES.includes(status)) throw new Error(`status must be one of: ${ORDER_STATUSES.join(', ')}`);
  const existing = await getOrder(db, id);
  if (!existing) return null;
  await db.prepare('UPDATE orders SET status=?, updated_at=? WHERE id=?')
    .bind(status, new Date().toISOString(), id).run();
  return getOrder(db, id);
}

const PAYMENT_METHODS = ['cash', 'mobile_money', 'bank_transfer'];
export async function markOrderPaidManually(db, id, method) {
  if (!PAYMENT_METHODS.includes(method)) throw new Error(`method must be one of: ${PAYMENT_METHODS.join(', ')}`);
  const existing = await getOrder(db, id);
  if (!existing) return null;
  const status = existing.status === 'completed' ? existing.status : 'completed';
  await db.prepare('UPDATE orders SET payment_status=?, payment_method=?, status=?, updated_at=? WHERE id=?')
    .bind('paid', method, status, new Date().toISOString(), id).run();
  return getOrder(db, id);
}

export async function setOrderPaymentLink(db, id, { orderReference, checkoutLink }) {
  await db.prepare('UPDATE orders SET payment_status=?, payment_link=?, payment_order_reference=?, updated_at=? WHERE id=?')
    .bind('link_sent', checkoutLink, orderReference, new Date().toISOString(), id).run();
  return getOrder(db, id);
}

export async function applyPaymentWebhook(db, { orderReference, status, paymentReference }) {
  const row = await db.prepare('SELECT * FROM orders WHERE payment_order_reference = ?').bind(orderReference).first();
  if (!row) return null;
  const statusMap = { SUCCESS: 'paid', FAILED: 'failed', CANCELED: 'failed', PROCESSING: 'link_sent' };
  const paymentStatus = statusMap[status] || row.payment_status;
  const paymentMethod = paymentStatus === 'paid' ? 'clickpesa' : row.payment_method;
  const orderStatus = paymentStatus === 'paid' ? 'completed' : row.status;
  await db.prepare('UPDATE orders SET payment_status=?, payment_method=?, payment_reference=?, status=?, updated_at=? WHERE id=?')
    .bind(paymentStatus, paymentMethod, paymentReference || row.payment_reference, orderStatus, new Date().toISOString(), row.id)
    .run();
  return getOrder(db, row.id);
}

// ── Analytics ──
export async function getAnalytics(db, days) {
  const range = Math.min(90, Math.max(7, Number(days) || 14));
  const { results: allOrders } = await db.prepare('SELECT * FROM orders').all();
  const orders = allOrders.map(rowToOrder);
  const completed = orders.filter(o => o.status === 'completed');
  const cancelledCount = orders.filter(o => o.status === 'cancelled').length;
  const resolved = completed.length + cancelledCount;
  const revenueTotal = completed.reduce((sum, o) => sum + (o.price_amount || 0), 0);

  const buckets = new Map();
  for (let i = range - 1; i >= 0; i--) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    buckets.set(key, { date: key, revenue: 0, count: 0 });
  }
  completed.forEach(o => {
    const key = (o.updated_at || o.created_at).slice(0, 10);
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

  return {
    range_days: range,
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
    payment_methods: topBy(o => o.payment_method).map(g => ({ method: g.key, revenue: g.revenue, count: g.count })),
  };
}

export async function getStats(db) {
  const products = await listProducts(db, { all: true });
  const orders = await listOrders(db);
  return {
    products_total: products.length,
    products_in_stock: products.filter(p => p.in_stock !== false).length,
    phones: products.filter(p => p.product_type === 'phone').length,
    appliances: products.filter(p => p.product_type === 'appliance').length,
    orders_total: orders.length,
    orders_new: orders.filter(o => o.status === 'new').length,
  };
}

export async function getBackup(db) {
  return {
    exported_at: new Date().toISOString(),
    products: await listProducts(db, { all: true }),
    specs: await getAllSpecs(db),
    orders: await listOrders(db),
  };
}

// ── Rate limiting (D1-backed sliding window) ──
export async function checkRateLimit(db, key, limit, windowMs) {
  const now = Date.now();
  const row = await db.prepare('SELECT count, window_start FROM rate_limits WHERE rl_key = ?').bind(key).first();
  if (!row || now - row.window_start > windowMs) {
    await db.prepare('INSERT INTO rate_limits (rl_key, count, window_start) VALUES (?,1,?) ON CONFLICT(rl_key) DO UPDATE SET count=1, window_start=?')
      .bind(key, now, now).run();
    return true;
  }
  if (row.count >= limit) return false;
  await db.prepare('UPDATE rate_limits SET count = count + 1 WHERE rl_key = ?').bind(key).run();
  return true;
}
