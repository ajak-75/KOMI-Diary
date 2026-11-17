/* KOMI's K-Culture Diary — service worker (offline-first shell) */
const CACHE = 'komidiary-v24';
const SHELL = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.webmanifest',
  './icon.svg',
  './img/komi-diary-logo.png',
  './icons/favicon-32.png',
  './icons/apple-touch-icon.png',
  './img/komi-avatar.jpg',
  './img/momo-avatar.jpg',
  './img/momo-shop-banner.jpg',
  './img/myeongdong.jpg',
  './img/bukchon.jpg',
  './img/nami.jpg',
  './img/dancheong-flower.svg',
  './img/dancheong-1.png',
  './img/dancheong-2.png',
  './img/dancheong-3.png',
  './img/dancheong-4.png',
  './img/dancheong-5.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      /* cache: 'reload' so a fresh deploy is fetched from the network, not the HTTP cache */
      .then((c) => c.addAll(SHELL.map((u) => new Request(u, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    const oldKeys = keys.filter((k) => k !== CACHE);
    await Promise.all(oldKeys.map((k) => caches.delete(k)));
    await self.clients.claim();
    /* An update rather than a first install: reload open tabs once, so a visitor
       whose browser still held the previous version sees the new first page on
       this very refresh instead of the next one. */
    if (oldKeys.length) {
      const wins = await self.clients.matchAll({ type: 'window' });
      wins.forEach((c) => { try { c.navigate(c.url); } catch (err) {} });
    }
  })());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  /* Documents and code: network first, so a new deploy reaches visitors immediately.
     The cache copy is kept for offline use. */
  const isCode = req.mode === 'navigate'
    || url.pathname.endsWith('/')
    || /\.(?:html|js|css|webmanifest|svg)$/.test(url.pathname);

  if (isCode) {
    e.respondWith(
      fetch(new Request(req, { cache: 'no-store' }))
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => {
          if (hit) return hit;
          if (req.mode === 'navigate') return caches.match('./index.html');
          return Response.error();
        }))
    );
    return;
  }

  /* Images and other assets: cache first, refreshed in the background. */
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      }).catch(() => Response.error());
    })
  );
});
