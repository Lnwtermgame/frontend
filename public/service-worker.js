// Service Worker for GameTopUp Push Notifications

const CACHE_NAME = 'gametopup-v1';
const STATIC_ASSETS = [
  '/',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/badge-72x72.png',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received:', event);

  let notificationData = {
    title: 'New Notification',
    body: 'You have a new notification',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: 'default',
    data: {
      url: '/dashboard/notifications'
    }
  };

  // Parse push data
  if (event.data) {
    try {
      const payload = event.data.json();
      if (payload.notification) {
        notificationData = {
          ...notificationData,
          ...payload.notification,
          data: {
            ...notificationData.data,
            ...(payload.notification.data || {})
          }
        };
      }
    } catch (error) {
      console.error('[Service Worker] Failed to parse push data:', error);
    }
  }

  // Show notification
  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body || notificationData.message,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      requireInteraction: notificationData.requireInteraction || false,
      actions: notificationData.actions || [
        {
          action: 'open',
          title: 'Open'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ],
      data: notificationData.data
    })
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked:', event);

  event.notification.close();

  const notificationData = event.notification.data || {};
  const urlToOpen = notificationData.url || '/dashboard/notifications';

  // Handle action buttons
  if (event.action === 'dismiss') {
    return; // Just close the notification
  }

  // Open or focus the app
  event.waitUntil(
    self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url && client.focus) {
          // Navigate to the notification URL
          client.navigate(urlToOpen);
          return client.focus();
        }
      }

      // If no window is open, open a new one
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});

// Message event - handle messages from the main thread
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);

  if (event.data && event.data.type) {
    switch (event.data.type) {
      case 'SKIP_WAITING':
        self.skipWaiting();
        break;

      case 'GET_VERSION':
        event.ports[0].postMessage({ version: CACHE_NAME });
        break;

      default:
        console.log('[Service Worker] Unknown message type:', event.data.type);
    }
  }
});

// Fetch event - network first strategy for API calls, cache first for static assets
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests
  if (!request.url.startsWith(self.location.origin)) {
    return;
  }

  // Handle API requests (network first)
  if (request.url.includes('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful responses
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache
          return caches.match(request);
        })
    );
    return;
  }

  // Handle static assets (cache first)
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached response and update cache in background
        fetch(request).then((response) => {
          if (response.ok) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, response);
            });
          }
        }).catch(() => {
          // Ignore network errors for background update
        });
        return cachedResponse;
      }

      // Not in cache, fetch from network
      return fetch(request).then((response) => {
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      });
    })
  );
});

// Sync event - handle background sync
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Sync event:', event);

  if (event.tag === 'notification-read') {
    // Handle marking notifications as read in background
    event.waitUntil(
      // Implementation would go here if needed
      Promise.resolve()
    );
  }
});

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  console.log('[Service Worker] Periodic sync event:', event);

  if (event.tag === 'check-notifications') {
    // Could be used to fetch new notifications in background
    event.waitUntil(
      Promise.resolve()
    );
  }
});

console.log('[Service Worker] Service worker loaded');
