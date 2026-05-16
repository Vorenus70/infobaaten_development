const CACHE_NAME = 'infobaaten-dev-v3';  // ← INCREMENT THIS
const urlsToCache = [
  '/infobaaten_development/',
  '/infobaaten_development/index.html',
  '/infobaaten_development/style.css',
  '/infobaaten_development/script.js',
  'https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js'
];

// Install – cache files and force activation
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())  // ← Forces waiting service worker to activate
  );
});

// Fetch – network first, fallback to cache
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .catch(() => caches.match(event.request))
  );
});

// Activate – clean old caches and take control immediately
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(name => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    }).then(() => {
      // ← Take control of all open clients immediately
      return self.clients.claim();
    })
  );
});
