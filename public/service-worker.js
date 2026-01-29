// Service Worker for Push Notifications
self.addEventListener('push', event => {
  const data = event.data.json();
  const options = {
    body: data.message,
    icon: '/images/notification-icon.png', // Update with your notification icon
    badge: '/images/notification-badge.png', // Update with your notification badge
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  // Navigate to URL when notification is clicked
  if (event.notification.data && event.notification.data.url) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});

// Skip waiting on install
self.addEventListener('install', event => {
  self.skipWaiting();
});

// Claim clients on activate
self.addEventListener('activate', event => {
  event.waitUntil(clients.claim());
}); 