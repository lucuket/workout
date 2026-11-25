// Service Worker for ApexLift Workout Tracker PWA
const CACHE_NAME = 'apex-lift-cache-v2';

const APP_ROUTES = [
  '',
  'workout/',
  'routines/',
  'exercises/',
  'progress/',
  'history/',
  'settings/',
  'manifest.json',
  'icons/icon-192.svg',
  'icons/icon-512.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      const scopeUrl = self.registration.scope;
      const urlsToCache = APP_ROUTES.map((route) => new URL(route, scopeUrl).href);
      await Promise.allSettled(
        urlsToCache.map((url) =>
          cache.add(url).catch((err) => console.warn('Precache skipped for:', url, err))
        )
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
          return Promise.resolve();
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith('http')) return;

  const url = new URL(event.request.url);
  // Only cache same-origin app assets; let Supabase and external APIs go straight to network
  if (url.origin !== self.location.origin) return;

  // Network-first for HTML navigations so users get fresh builds online and cached pages offline
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          const cached = await caches.match(event.request);
          if (cached) return cached;
          const fallback = await caches.match(self.registration.scope);
          return fallback || Response.error();
        })
    );
    return;
  }

  // Stale-while-revalidate for static assets (JS chunks, CSS, icons, manifest)
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
        .catch(() => cachedResponse || Response.error());

      return cachedResponse || fetchPromise;
    })
  );
});
