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
    icon: '/icon-192.png',
    badge: '/icon-72.png',
    data: { url: data.url || '/app' },
    vibrate: [100, 50, 100],
    requireInteraction: false,
    tag: data.tag || 'buscaycurra-notif',
    actions: data.actions || [],
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Clic en la notificación push → abrir la app en la URL correcta
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/app';
  const origin = self.location.origin;
  const targetUrl = url.startsWith('http') ? url : origin + url;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Si ya hay una ventana de la app abierta, navegar a la URL dentro de ella
      for (const client of clientList) {
        if (client.url.startsWith(origin) && 'focus' in client) {
          return client.focus().then((c) => {
            if ('navigate' in c) return c.navigate(targetUrl);
          }).catch(() => self.clients.openWindow(targetUrl));
        }
      }
      // Sin ventana abierta → abrir nueva
      return self.clients.openWindow(targetUrl);
    })
  );
});
