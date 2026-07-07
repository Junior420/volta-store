// ClickPesa payment integration for the Cloudflare Workers runtime — same
// contract as server/clickpesa.js (Node), but using the Web Crypto API
// (crypto.subtle) instead of Node's `crypto` module, since that's what's
// natively available at the edge without extra compat flags.
// Docs: https://docs.clickpesa.com/

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    const sorted = {};
    for (const key of Object.keys(value).sort()) sorted[key] = canonicalize(value[key]);
    return sorted;
  }
  return value;
}

function toHex(buffer) {
  return [...new Uint8Array(buffer)].map(b => b.toString(16).padStart(2, '0')).join('');
}

async function hmacSha256Hex(message, secret) {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return toHex(sig);
}

export async function computeChecksum(payload, secret) {
  const { checksum, checksumMethod, ...rest } = payload;
  const canonical = JSON.stringify(canonicalize(rest));
  return hmacSha256Hex(canonical, secret);
}

function timingSafeEqualHex(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function verifyChecksum(payload, secret) {
  if (!secret) return false;
  const given = payload.checksum;
  if (!given || typeof given !== 'string') return false;
  const expected = await computeChecksum(payload, secret);
  return timingSafeEqualHex(given, expected);
}

export function isConfigured(env) {
  return Boolean(env.CLICKPESA_CLIENT_ID && env.CLICKPESA_API_KEY);
}

// Workers isolates are short-lived and not shared across requests reliably,
// so we don't bother caching the token in memory (unlike the Node version) —
// each payment-link request just fetches a fresh one. ClickPesa's token
// endpoint is cheap and this happens at most a few times a day for this store.
async function getToken(env) {
  const baseUrl = env.CLICKPESA_BASE_URL || 'https://api.clickpesa.com';
  const res = await fetch(`${baseUrl}/third-parties/generate-token`, {
    method: 'POST',
    headers: { 'client-id': env.CLICKPESA_CLIENT_ID, 'api-key': env.CLICKPESA_API_KEY },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.token) throw new Error(data.message || `ClickPesa auth failed (HTTP ${res.status})`);
  return data.token;
}

export async function createCheckoutLink(env, { totalPrice, orderReference, orderCurrency = 'TZS', customerName, customerPhone, customerEmail, description, callbackUrl }) {
  const baseUrl = env.CLICKPESA_BASE_URL || 'https://api.clickpesa.com';
  const token = await getToken(env);
  const body = { totalPrice: String(totalPrice), orderReference, orderCurrency, customerName, customerPhone, customerEmail, description, callbackUrl };
  Object.keys(body).forEach(k => { if (body[k] == null || body[k] === '') delete body[k]; });
  if (env.CLICKPESA_CHECKSUM_KEY) body.checksum = await computeChecksum(body, env.CLICKPESA_CHECKSUM_KEY);

  const res = await fetch(`${baseUrl}/third-parties/checkout-link/generate-checkout-url`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.checkoutLink) throw new Error(data.message || `ClickPesa checkout link failed (HTTP ${res.status})`);
  return { checkoutLink: data.checkoutLink, clientId: data.clientId };
}
