/**
 * Service Worker para BuscayCurra PWA
 * Cache-first para assets estáticos, network-first para APIs
 */

const CACHE_NAME = "buscaycurra-v3";
const STATIC_ASSETS = [
  "/",
  "/app",
  "/app/buscar",
  "/app/envios",
  "/app/perfil",
  "/app/guardados",
  "/app/gusi",
  "/precios",
];

// Instalación: precachear assets críticos
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activación: limpiar caches antiguas
self.addEventListener("activate", (event) => {
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

// Fetch: estrategia de cache
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // No interceptar requests de API ni de terceros
  if (url.pathname.startsWith("/api/") || url.origin !== self.location.origin) {
    return;
  }

  // Cache-first para assets estáticos
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        // Refrescar en background
        fetch(request)
          .then((response) => {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, response.clone());
            });
          })
          .catch(() => {});
        return cached;
      }

      return fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, clone);
          });
          return response;
        })
        .catch(() => {
          // Fallback offline para navegación
          if (request.mode === "navigate") {
            return caches.match("/app");
          }
          return new Response("Offline", { status: 503 });
        });
    })
  );
});

// Push notifications (para alertas de empleo)
self.addEventListener("push", (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body || "Nuevas ofertas de empleo disponibles",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: data.tag || "job-alert",
    requireInteraction: false,
    data: data.url ? { url: data.url } : undefined,
  };

  event.waitUntil(
    self.registration.showNotification(
      data.title || "BuscayCurra",
      options
    )
  );
});

// Click en notificación
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/app/buscar";
  event.waitUntil(
    self.clients.openWindow(url)
  );
});
