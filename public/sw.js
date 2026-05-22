// BuscayCurra — Service Worker
// Maneja notificaciones push y navegación al hacer clic

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

// Recibir notificación push del servidor
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'BuscayCurra';
  const options = {
    body: data.body || '',
    icon: '/qr-buscaycurra.png',
    badge: '/qr-buscaycurra.png',
    data: { url: data.url || '/app' },
    vibrate: [100, 50, 100],
    requireInteraction: false,
    tag: data.tag || 'buscaycurra-notif',
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Clic en la notificación push → abrir la app en la URL correcta
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/app';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          if ('navigate' in client) client.navigate(url);
          return;
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
