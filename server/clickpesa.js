// ClickPesa payment integration — generates hosted checkout links (M-Pesa,
// Tigo Pesa, Airtel Money, cards) and verifies incoming webhook payloads.
// Docs: https://docs.clickpesa.com/
const crypto = require('crypto');

const BASE_URL = process.env.CLICKPESA_BASE_URL || 'https://api.clickpesa.com';
const CLIENT_ID = process.env.CLICKPESA_CLIENT_ID || '';
const API_KEY = process.env.CLICKPESA_API_KEY || '';
const CHECKSUM_KEY = process.env.CLICKPESA_CHECKSUM_KEY || '';

function isConfigured() {
  return Boolean(CLIENT_ID && API_KEY);
}

// Recursively sort object keys alphabetically — required so the checksum is
// stable regardless of the order fields were assembled in.
function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    const sorted = {};
    for (const key of Object.keys(value).sort()) sorted[key] = canonicalize(value[key]);
    return sorted;
  }
  return value;
}

function computeChecksum(payload, secret = CHECKSUM_KEY) {
  const { checksum, checksumMethod, ...rest } = payload;
  const canonical = JSON.stringify(canonicalize(rest));
  return crypto.createHmac('sha256', secret).update(canonical).digest('hex');
}

function verifyChecksum(payload, secret = CHECKSUM_KEY) {
  if (!secret) return false;
  const given = payload.checksum;
  if (!given || typeof given !== 'string') return false;
  const expected = computeChecksum(payload, secret);
  const a = Buffer.from(given, 'hex');
  const b = Buffer.from(expected, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

let cachedToken = null; // { token, expiresAt }

async function getToken() {
  if (!isConfigured()) throw new Error('ClickPesa is not configured — set CLICKPESA_CLIENT_ID and CLICKPESA_API_KEY');
  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.token;

  const res = await fetch(`${BASE_URL}/third-parties/generate-token`, {
    method: 'POST',
    headers: { 'client-id': CLIENT_ID, 'api-key': API_KEY },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.token) throw new Error(data.message || `ClickPesa auth failed (HTTP ${res.status})`);

  // Tokens are valid for 1 hour; refresh a few minutes early to be safe.
  cachedToken = { token: data.token, expiresAt: Date.now() + 55 * 60 * 1000 };
  return cachedToken.token;
}

async function createCheckoutLink({ totalPrice, orderReference, orderCurrency = 'TZS', customerName, customerPhone, customerEmail, description, callbackUrl }) {
  const token = await getToken();
  const body = { totalPrice: String(totalPrice), orderReference, orderCurrency, customerName, customerPhone, customerEmail, description, callbackUrl };
  Object.keys(body).forEach(k => { if (body[k] == null || body[k] === '') delete body[k]; });
  if (CHECKSUM_KEY) body.checksum = computeChecksum(body);

  const res = await fetch(`${BASE_URL}/third-parties/checkout-link/generate-checkout-url`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.checkoutLink) throw new Error(data.message || `ClickPesa checkout link failed (HTTP ${res.status})`);
  return { checkoutLink: data.checkoutLink, clientId: data.clientId };
}

module.exports = { isConfigured, computeChecksum, verifyChecksum, createCheckoutLink };
