/* Rannar Menu service worker: cache only the same-origin application shell and assets. */
const CACHE_VERSION = 'rannar-menu-pwa-v1';
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const ASSET_CACHE = `${CACHE_VERSION}-assets`;
const APP_BASE = self.registration.scope;
const APP_BASE_URL = new URL(APP_BASE);
const OFFLINE_URL = new URL('offline.html', APP_BASE).href;
const SHELL_URLS = [
  APP_BASE,
  new URL('manifest.webmanifest', APP_BASE).href,
  new URL('rannar-menu-logo.svg', APP_BASE).href,
  OFFLINE_URL
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith('rannar-menu-pwa-') && ![SHELL_CACHE, ASSET_CACHE].includes(key))
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const requestUrl = new URL(request.url);
  if (requestUrl.origin !== self.location.origin) return;
  if (!requestUrl.pathname.startsWith(APP_BASE_URL.pathname)) return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response && response.ok) {
          const cache = await caches.open(SHELL_CACHE);
          await cache.put(APP_BASE, response.clone());
        }
        return response;
      } catch {
        return (await caches.match(request))
          || (await caches.match(APP_BASE))
          || (await caches.match(OFFLINE_URL));
      }
    })());
    return;
  }

  if (['script', 'style', 'image', 'font', 'worker'].includes(request.destination)) {
    event.respondWith((async () => {
      const cached = await caches.match(request);
      if (cached) return cached;

      try {
        const response = await fetch(request);
        if (response && response.ok) {
          const cache = await caches.open(ASSET_CACHE);
          await cache.put(request, response.clone());
        }
        return response;
      } catch {
        return caches.match(OFFLINE_URL);
      }
    })());
  }
});
