// BuscayCurra — Service Worker
// Maneja notificaciones push y navegación al hacer clic

// PÁGINA DE MANTENIMIENTO (17 oct 2026). El servidor estuvo 29 minutos
// apagado por un parche de Hostinger y el navegador enseñaba su propio error.
// Ahora, a quien ya ha entrado alguna vez, le sale /mantenimiento.html, que se
// guarda aquí al instalar y se recarga sola cuando volvemos.
const CACHE_MANTENIMIENTO = 'mantenimiento-v1';
const PAGINA_MANTENIMIENTO = '/mantenimiento.html';

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_MANTENIMIENTO)
      .then((c) => c.add(new Request(PAGINA_MANTENIMIENTO, { cache: 'reload' })))
      .catch(() => { /* sin la página, el navegador enseña su error como antes */ })
  );
});
self.addEventListener('activate', (e) => e.waitUntil(Promise.all([
  self.clients.claim(),
  caches.keys().then((ks) => Promise.all(
    ks.filter((k) => k.startsWith('mantenimiento-') && k !== CACHE_MANTENIMIENTO).map((k) => caches.delete(k))
  )),
])));

// Solo al abrir una página, y solo si la red falla o el servidor no está
// (502-504 mientras se despliega). Mientras el servidor conteste, nada sale
// de caché: la página que se ve es siempre la de verdad.
self.addEventListener('fetch', (event) => {
  if (event.request.mode !== 'navigate') return;
  const mantenimiento = () => caches.match(PAGINA_MANTENIMIENTO);
  event.respondWith(
    fetch(event.request)
      .then((r) => (r.status >= 502 && r.status <= 504 ? mantenimiento().then((m) => m || r) : r))
      .catch(() => mantenimiento().then((m) => m || Response.error()))
  );
});

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
