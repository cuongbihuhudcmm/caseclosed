const CACHE_NAME = 'caseclosed-shell-v5';
const APP_SHELL = [
  './',
  './index.html',
  './site.webmanifest',
  './apple-touch-icon.png',
  './icon-192.png',
  './icon-512.png',
  './vendor/nes.min.css',
  './fonts/vt323.css',
  './fonts/pxiKyp0ihIEF2isQFJXGdg.woff2',
  './fonts/pxiKyp0ihIEF2isRFJXGdg.woff2',
  './fonts/pxiKyp0ihIEF2isfFJU.woff2',
  './THEME.mp3',
  './doorclose.mp3'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.allSettled(APP_SHELL.map(async (url) => {
      const res = await fetch(new Request(url, { cache: 'reload' }));
      if (!res.ok) throw new Error('precache ' + url);
      await cache.put(url, res);
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE_NAME && k.startsWith('caseclosed-')).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(CACHE_NAME);
        cache.put('./index.html', fresh.clone());
        return fresh;
      } catch (e) {
        const cached = await caches.match('./index.html', { ignoreSearch: true });
        return cached || Response.error();
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(req, { ignoreSearch: true });
    if (cached) return cached;
    try {
      const fresh = await fetch(req);
      if (fresh && fresh.ok) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(req, fresh.clone());
      }
      return fresh;
    } catch (e) {
      return Response.error();
    }
  })());
});
