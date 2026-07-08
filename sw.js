// Volta service worker — enables installability and basic offline support.
const CACHE = 'volta-v3';
const CORE_ASSETS = [
  './',
  './index.html',
  './styles.css',
  './script.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
];

// On install, pre-cache the core files so the site can open offline.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting())
  );
});

// On activate, clean up any old caches from previous versions.
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Network-first for the live API (always try fresh product data),
// cache-first for everything else (fast loads, offline resilience).
self.addEventListener('fetch', event => {
  const url = event.request.url;

  // Never cache the backend API — always go to network, fail gracefully.
  if (url.includes('/api/') || url.includes('onrender.com') || url.includes('pages.dev')) {
    event.respondWith(fetch(event.request).catch(() => new Response('[]', {
      headers: { 'Content-Type': 'application/json' }
    })));
    return;
  }

  // For everything else: serve from cache if present, otherwise fetch & cache.
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(resp => {
        // Only cache successful same-origin GET responses.
        if (event.request.method === 'GET' && resp.ok && url.startsWith(self.location.origin)) {
          const copy = resp.clone();
          caches.open(CACHE).then(cache => cache.put(event.request, copy));
        }
        return resp;
      }).catch(() => cached);
    })
  );
});
