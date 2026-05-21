/**
 * Service Worker para BuscayCurra PWA
 * v5 — Network-first para HTML, cache para assets estáticos
 */
const CACHE_NAME = "buscaycurra-v5";
const ASSETS_CACHE = "buscaycurra-assets-v5";

// Activar inmediatamente, no esperar a que se cierren pestañas viejas
self.skipWaiting();
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter(k => k !== CACHE_NAME && k !== ASSETS_CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // No interceptar APIs ni terceros
  if (url.pathname.startsWith("/api/") || url.origin !== self.location.origin) {
    return;
  }

  // Recursos estáticos (JS, CSS, imágenes, fuentes) → cache-first
  const isStatic = /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff2?|ttf|webp|mp3|wav)$/.test(url.pathname);
  if (isStatic) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then((r) => {
        const clone = r.clone();
        caches.open(ASSETS_CACHE).then((c) => c.put(request, clone));
        return r;
      }))
    );
    return;
  }

  // Navegación HTML → network-first (siempre pedir versión fresca)
  if (request.mode === "navigate" || request.destination === "document") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((c) => c.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request)) // fallback offline
    );
    return;
  }

  // Otros (manifest, etc.) → network-first
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

// Push notifications
self.addEventListener("push", (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || "BuscayCurra", {
      body: data.body || "Nuevas ofertas de empleo disponibles",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: data.tag || "job-alert",
      requireInteraction: false,
      data: data.url ? { url: data.url } : undefined,
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/app/buscar";
  event.waitUntil(self.clients.openWindow(url));
});
