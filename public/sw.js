// Service Worker for Apex Workout Tracker PWA
const CACHE_NAME = 'apex-lift-cache-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      const scopeUrl = self.registration.scope;
      const urlsToCache = [
        scopeUrl,
        new URL('manifest.json', scopeUrl).href,
        new URL('icons/icon-192.svg', scopeUrl).href,
        new URL('icons/icon-512.svg', scopeUrl).href,
      ];
      await Promise.allSettled(
        urlsToCache.map((url) =>
          cache.add(url).catch((err) => console.warn('Cache failed for:', url, err))
        )
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          if (event.request.mode === 'navigate') {
            return caches.match(self.registration.scope);
          }
          return cachedResponse;
        });

      return cachedResponse || fetchPromise;
    })
  );
});
