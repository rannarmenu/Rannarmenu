/* Rannar Menu service worker: cache only the same-origin application shell and assets. */
const CACHE_VERSION = 'rannar-menu-pwa-v2-local-mira';
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const ASSET_CACHE = `${CACHE_VERSION}-assets`;
const APP_BASE = self.registration.scope;
const APP_BASE_URL = new URL(APP_BASE);
const OFFLINE_URL = new URL('offline.html', APP_BASE).href;
const SHELL_URLS = [
  APP_BASE,
  new URL('manifest.webmanifest', APP_BASE).href,
  new URL('rannar-menu-logo.svg', APP_BASE).href,
  new URL('pwa-icon-192.svg', APP_BASE).href,
  new URL('pwa-icon-512.svg', APP_BASE).href,
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
      // This one-time migration forces any already-open app tabs onto the new local-Mira bundle.
      .then(async () => {
        if (CACHE_VERSION !== 'rannar-menu-pwa-v2-local-mira') return;
        const openClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        openClients
          .filter((client) => {
            try {
              const url = new URL(client.url);
              return url.origin === APP_BASE_URL.origin && url.pathname.startsWith(APP_BASE_URL.pathname);
            } catch {
              return false;
            }
          })
          // Start the navigation but do not await it inside activate; that avoids blocking activation.
          .forEach((client) => { client.navigate(client.url).catch(() => null); });
      })
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
        // Do not return an HTML page as a script, stylesheet, or image response.
        return new Response('', { status: 503, statusText: 'Offline' });
      }
    })());
  }
});
