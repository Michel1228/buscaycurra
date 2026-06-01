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
  title: "BuscayCurra — Agente IA que busca trabajo por ti | 20+ países",
  description:
    "Deja de enviar CVs al vacío. Guzzi es el primer agente IA que busca, adapta y envía candidaturas por ti en 20+ países, 24/7. La alternativa real a InfoJobs, LinkedIn e Indeed.",
  keywords: [
    "buscar trabajo",
    "empleo",
    "CV",
    "inteligencia artificial",
    "agente IA",
    "trabajar en el extranjero",
    "emigrar",
    "empleo internacional",
    "ofertas de trabajo",
    "BuscayCurra",
    "Guzzi",
    "España",
    "Alemania",
    "Irlanda",
    "Europa",
  ],
 manifest: "/manifest.json",
  themeColor: "#0f1117",
 appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "BuscayCurra",
  },
  metadataBase: new URL("https://buscaycurra.es"),
  openGraph: {
    title: "BuscayCurra — El agente IA que busca trabajo por ti",
    description:
      "Guzzi busca, adapta y envía candidaturas por ti en 20+ países, 24/7. Deja de enviar CVs al vacío. La alternativa a InfoJobs y LinkedIn.",
    url: "https://buscaycurra.es",
    locale: "es_ES",
    type: "website",
    siteName: "BuscayCurra",
    alternateLocale: ["en_US"],
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "BuscayCurra — Agente IA que busca trabajo por ti en 20+ países",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BuscayCurra — Agente IA que busca trabajo por ti",
    description:
      "Guzzi busca, adapta y envía candidaturas por ti en 20+ países. 24/7. Sin que muevas un dedo.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "https://buscaycurra.es",
    languages: {
      es: "https://buscaycurra.es",
      en: "https://buscaycurra.es/en",
    },
  },
  robots: {
    index: true,
    follow: true,
    "max-image-preview": "large",
    "max-snippet": -1,
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
        <meta name="theme-color" content="#0f1117" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="BuscayCurra" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="canonical" href="https://buscaycurra.es" />
        <link rel="alternate" hrefLang="es" href="https://buscaycurra.es" />
        <link rel="alternate" hrefLang="en" href="https://buscaycurra.es/en" />
        <link rel="alternate" hrefLang="x-default" href="https://buscaycurra.es" />
      </head>
      <body>
        {/* Structured data for Google rich results */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "BuscayCurra",
              url: "https://buscaycurra.es",
              description:
                "Guzzi es el primer agente IA que busca, adapta y envía candidaturas por ti en 20+ países, 24/7. La alternativa real a InfoJobs, LinkedIn e Indeed.",
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web, Android, iOS",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "EUR",
              },
              author: {
                "@type": "Organization",
                name: "BuscayCurra",
                url: "https://buscaycurra.es",
                sameAs: [],
              },
            }),
          }}
        />
        {/* ⚡ FORCE UPDATE: comparar BUILD_ID con localStorage antes de que el SW intervenga */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            var BUILD_ID = '__BUILD_ID__';
            var stored = localStorage.getItem('bc_build_id');
            if (stored && stored !== BUILD_ID) {
              // Nuevo deploy detectado — limpiar TODO y recargar
              localStorage.setItem('bc_build_id', BUILD_ID);
              // Desregistrar todos los service workers
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(function(regs) {
                  regs.forEach(function(r) { r.unregister(); });
                  // Limpiar todas las caches
                  if ('caches' in window) {
                    caches.keys().then(function(keys) {
                      keys.forEach(function(k) { caches.delete(k); });
                    });
                  }
                  // Recargar sin cache
                  setTimeout(function() { window.location.reload(true); }, 300);
                });
              }
            } else if (!stored) {
              localStorage.setItem('bc_build_id', BUILD_ID);
            }
          })();
        `}} />
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
