/**
 * Service Worker para BuscayCurra PWA
 * v7 — Cache versionada por BUILD_ID, network-first estricto
 * BUILD_ID: __BUILD_ID__
 */
const CACHE_NAME = "buscaycurra-__BUILD_ID__";

// ── Instalar: skipWaiting inmediato ──
self.addEventListener("install", () => {
  self.skipWaiting();
});

// ── Activar: limpiar caches viejas, tomar control ──
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Mensaje SKIP_WAITING del banner ──
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// ── Fetch: network-first con bypass de HTTP cache ──
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // No interceptar APIs ni terceros
  if (url.pathname.startsWith("/api/") || url.origin !== self.location.origin) {
    return;
  }

  // Navegación HTML → network-first SIN HTTP cache
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request, { cache: "no-cache" })
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((c) => c.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Recursos estáticos (JS, CSS, imágenes, fuentes) → network-first
  const isStatic = /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff2?|ttf|webp|mp3|wav)$/.test(url.pathname);
  if (isStatic) {
    event.respondWith(
      fetch(request, { cache: "no-cache" })
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((c) => c.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Otros → network-first
  event.respondWith(
    fetch(request, { cache: "no-cache" })
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((c) => c.put(request, clone));
        return response;
      })
      .catch(() => caches.match(request))
  );
});

// ── Push notifications ──
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
  const url = event.notification.data?.url || "/app";
  event.waitUntil(self.clients.openWindow(url));
});
