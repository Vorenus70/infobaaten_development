const CACHE_NAME = 'infobaaten-dev-v8';
const urlsToCache = [
  '/infobaaten_development/',
  '/infobaaten_development/index.html',
  '/infobaaten_development/style.css',
  '/infobaaten_development/script.js',
  'https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // For HTML pages – STRICT cache-first (never go to network unless cache fails)
  if (url.pathname === '/infobaaten_development/' || url.pathname === '/infobaaten_development/index.html') {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) {
          console.log('📦 Serving CACHED HTML (version from install)');
          return cached;
        }
        console.log('🌐 No cache – fetching from network');
        return fetch(event.request);
      })
    );
    return;
  }
  
  // For all other assets – cache-first with background update
  event.respondWith(
    caches.match(event.request).then(cached => {
      const fetchPromise = fetch(event.request).then(networkResponse => {
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, networkResponse.clone());
        });
        return networkResponse;
      });
      return cached || fetchPromise;
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(name => {
          if (name !== CACHE_NAME) {
            console.log('🗑️ Deleting old cache:', name);
            return caches.delete(name);
          }
        })
      );
    }).then(() => {
      return self.clients.matchAll({ type: 'window' }).then(clients => {
        clients.forEach(client => {
          client.navigate(client.url);
        });
      });
    }).then(() => {
      return self.clients.claim();
    })
  );
});
