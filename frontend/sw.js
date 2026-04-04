/**
 * Service Worker for Digital Library
 * Enables offline support and intelligent caching
 */

const CACHE_NAME = 'digital-library-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/login.html',
  '/register.html',
  '/admin.html',
  '/user.html',
  '/styles.css',
  '/auth.js',
  '/user.js',
  '/admin.js'
];

/**
 * Install event: Cache critical files
 */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Digital Library: Cache installed');
        return cache.addAll(urlsToCache).catch(error => {
          console.warn('Some files could not be cached:', error);
        });
      })
  );
  // Skip waiting to activate new service worker immediately
  self.skipWaiting();
});

/**
 * Activate event: Clean up old caches
 */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Digital Library: Old cache deleted:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Claim clients immediately
  self.clients.claim();
});

/**
 * Fetch event: Serve from cache, fallback to network
 * Strategy: Cache first for static assets, Network first for API calls
 */
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Strategy 1: Cache first for static assets
  if (isCacheableAsset(url.pathname)) {
    event.respondWith(
      caches.match(request)
        .then(response => {
          // Return cached version if available
          if (response) {
            return response;
          }
          
          // Otherwise fetch from network
          return fetch(request)
            .then(response => {
              // Cache successful responses
              if (response && response.status === 200) {
                const responseToCache = response.clone();
                caches.open(CACHE_NAME).then(cache => {
                  cache.put(request, responseToCache);
                });
              }
              return response;
            })
            .catch(() => {
              // Return offline page if available
              return caches.match('/index.html');
            });
        })
    );
  }
  // Strategy 2: Network first for API calls
  else if (url.pathname.includes('/api/')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Cache successful API responses
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // Return cached response if network fails
          return caches.match(request);
        })
    );
  }
});

/**
 * Determine if URL is a cacheable static asset
 */
const isCacheableAsset = (pathname) => {
  const cacheableExtensions = [
    '.html', '.css', '.js', '.json',
    '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico',
    '.woff', '.woff2', '.ttf', '.eot'
  ];
  
  return cacheableExtensions.some(ext => pathname.endsWith(ext));
};

/**
 * Handle messages from clients
 */
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
