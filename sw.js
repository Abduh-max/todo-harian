// sw.js - Service Worker untuk To-Do List Harian

const CACHE_NAME = 'todo-harian-v1';
const ASSETS_TO_CACHE = [
  '/todo-harian/',
  '/todo-harian/index.html',
  '/todo-harian/manifest.json',
  '/todo-harian/icon-192.png',
  '/todo-harian/icon-512.png'
];

// Install event: cache semua asset
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching assets...');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event: hapus cache lama
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Menghapus cache lama:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
    .then(() => self.clients.claim())
  );
});

// Fetch event: serve dari cache dulu, fallback ke network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Jika ada di cache, kembalikan
        if (cachedResponse) {
          return cachedResponse;
        }
        // Jika tidak, ambil dari network
        return fetch(event.request)
          .then(response => {
            // Cek apakah response valid
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            // Clone response untuk disimpan ke cache
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            return response;
          })
          .catch(() => {
            // Fallback jika offline dan tidak ada cache
            // Untuk request HTML, tampilkan pesan offline
            if (event.request.headers.get('accept').includes('text/html')) {
              return new Response(
                '<html><body><h1>Offline</h1><p>Silakan konek ke internet untuk mengakses halaman ini.</p></body></html>',
                { headers: { 'Content-Type': 'text/html' } }
              );
            }
          });
      })
  );
});
