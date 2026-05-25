/**
 * app/layout.tsx — Layout raíz de BuscayCurra
 * La AppNavbar se muestra solo en /app/* via AppNavWrapper (client component).
 */
import type { Metadata } from "next";
import "./globals.css";
import CookieBanner from "@/components/CookieBanner";
import AppNavWrapper from "@/components/AppNavWrapper";
import { BodyWrapper } from "@/components/BodyWrapper";

export const metadata: Metadata = {
  title: "BuscayCurra — Encuentra trabajo con IA",
  description:
    "Encuentra trabajo más rápido con inteligencia artificial. Mejora tu CV, busca ofertas en toda España y envía tu candidatura automáticamente.",
  keywords: ["buscar trabajo", "empleo", "CV", "inteligencia artificial", "España"],
  manifest: "/manifest.json",
  themeColor: "#7ed56f",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "BuscayCurra",
  },
  openGraph: {
    title: "BuscayCurra — Encuentra trabajo con IA",
    description:
      "Encuentra trabajo más rápido con inteligencia artificial. Mejora tu CV y envía candidaturas automáticamente.",
    locale: "es_ES",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#7ed56f" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="BuscayCurra" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body>
        <BodyWrapper>
          <AppNavWrapper />
          {children}
          <CookieBanner />
        </BodyWrapper>
        <div id="pwa-update-banner" style={{ display: "none", position: "fixed", bottom: 0, left: 0, right: 0, background: "#111827", borderTop: "2px solid #22c55e", padding: "12px 16px", zIndex: 9999, textAlign: "center", fontSize: "14px", color: "#f1f5f9" }}>
          🔄 Nueva versión disponible —{" "}
          <button id="pwa-reload-btn" style={{ background: "#22c55e", color: "#000", border: "none", padding: "6px 16px", borderRadius: "6px", fontWeight: 700, cursor: "pointer", marginLeft: "8px" }}>
            Actualizar ahora
          </button>
        </div>
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            // BUILD_ID: __BUILD_ID__ — forzar detección de nuevos deploys
            if ('serviceWorker' in navigator) {
              let refreshing = false;
              var banner = document.getElementById('pwa-update-banner');
              var reloadBtn = document.getElementById('pwa-reload-btn');

              // Cuando un nuevo SW toma el control, recargar automáticamente
              navigator.serviceWorker.addEventListener('controllerchange', function() {
                if (refreshing) return;
                refreshing = true;
                window.location.reload();
              });

              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(function(registration) {
                  console.log('[PWA] SW registrado, scope:', registration.scope);

                  // Si ya hay un SW esperando, mostrar banner
                  if (registration.waiting) {
                    showBanner();
                  }

                  // Detectar nuevo SW instalándose
                  registration.addEventListener('updatefound', function() {
                    var newWorker = registration.installing;
                    if (!newWorker) return;
                    newWorker.addEventListener('statechange', function() {
                      if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        // Nuevo SW instalado pero esperando — mostrar banner
                        showBanner();
                      }
                    });
                  });
                }).catch(function(err) {
                  console.log('[PWA] Error SW:', err);
                });

                // Re-check cada 30 min para detectar actualizaciones
                setInterval(function() {
                  if (!navigator.onLine) return;
                  navigator.serviceWorker.getRegistration().then(function(reg) {
                    if (reg) reg.update();
                  });
                }, 30 * 60 * 1000);
              });

              function showBanner() {
                if (!banner) return;
                banner.style.display = 'block';
                if (!reloadBtn) return;
                reloadBtn.onclick = function() {
                  navigator.serviceWorker.getRegistration().then(function(reg) {
                    if (!reg || !reg.waiting) {
                      window.location.reload();
                      return;
                    }
                    reg.waiting.postMessage('SKIP_WAITING');
                  });
                };
              }
            }
          })();
        `}} />
      </body>
    </html>
  );
}
