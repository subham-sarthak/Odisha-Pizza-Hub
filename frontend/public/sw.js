const CACHE_NAME = 'odisha-pizza-v2-' + Date.now();
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/src/main.jsx',
  '/src/App.jsx',
  '/src/styles.css'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - NETWORK FIRST for development (always fresh content)
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // API requests - network only, never cache
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
    );
    return;
  }

  // For development: ALWAYS fetch from network first (no stale cache)
  event.respondWith(
    fetch(event.request, { cache: 'no-store' })
      .then((response) => {
        // Don't cache during development
        return response;
      })
      .catch(() => {
        // Fallback to cache only if network fails
        return caches.match(event.request);
      })
  );
});

// Push notification event
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Odisha Pizza Hub';
  const options = {
    body: data.body || 'New update from Odisha Pizza Hub',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    data: data.url || '/',
    actions: [
      { action: 'open', title: 'Open', icon: '/icon-192.png' },
      { action: 'close', title: 'Close', icon: '/icon-192.png' }
    ]
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow(event.notification.data || '/')
    );
  }
});
