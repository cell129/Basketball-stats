const CACHE_NAME = 'basketball-stat-tracker-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/logo.svg',
  '/index.tsx',
  '/App.tsx',
  '/components/GameLog.tsx',
  '/components/PlayerSummary.tsx',
  '/components/StatControls.tsx',
  '/components/GameHistory.tsx',
  '/components/Scoreboard.tsx',
  '/services/geminiService.ts',
  '/types.ts',
  '/utils/statCalculations.ts',
  'https://cdn.tailwindcss.com'
];

// Install a service worker
self.addEventListener('install', event => {
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Cache and return requests
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

// Update a service worker
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});