// Admin sessions — stored in Workers KV instead of an in-memory Map (Workers
// isolates are stateless/ephemeral per-request, so nothing can live in
// process memory across requests the way it did in the Node version). KV's
// native per-key TTL maps naturally onto session expiry.

const SESSION_TTL_SECONDS = 24 * 60 * 60; // 24h, same as the Node version

function toHex(buffer) {
  return [...new Uint8Array(buffer)].map(b => b.toString(16).padStart(2, '0')).join('');
}

export function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return toHex(bytes);
}

async function timingSafeStringEqual(a, b) {
  // Web Crypto has no direct timingSafeEqual for strings; hash both with a
  // per-request random key via HMAC so a constant-time compare of the
  // digests is meaningful, then compare digests in constant time.
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const key = crypto.getRandomValues(new Uint8Array(32));
  const cryptoKey = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const [digestA, digestB] = await Promise.all([
    crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(a)),
    crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(b)),
  ]);
  const bufA = new Uint8Array(digestA), bufB = new Uint8Array(digestB);
  if (a.length !== b.length) return false; // lengths leak nothing sensitive here
  let diff = 0;
  for (let i = 0; i < bufA.length; i++) diff |= bufA[i] ^ bufB[i];
  return diff === 0;
}

export async function login(env, password) {
  const adminPassword = env.ADMIN_PASSWORD || 'volta2026';
  const ok = await timingSafeStringEqual(String(password || ''), adminPassword);
  if (!ok) return null;
  const token = randomToken();
  await env.SESSIONS.put(`session:${token}`, '1', { expirationTtl: SESSION_TTL_SECONDS });
  return { token, expires_in: SESSION_TTL_SECONDS };
}

function bearerToken(request) {
  const header = request.headers.get('Authorization') || '';
  return header.replace(/^Bearer\s+/i, '');
}

export async function isAdminRequest(env, request) {
  const token = bearerToken(request);
  if (!token) return false;
  const value = await env.SESSIONS.get(`session:${token}`);
  return value != null;
}
