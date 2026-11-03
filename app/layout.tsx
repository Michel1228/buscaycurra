/**
 * app/layout.tsx — Layout raíz de BuscayCurra
 * La AppNavbar se muestra solo en /app/* via AppNavWrapper (client component).
 */
import type { Metadata, Viewport } from "next";
import "./globals.css";
import CookieBanner from "@/components/CookieBanner";
import PolyfillBanderas from "@/components/PolyfillBanderas";
import ApuntarLlegada from "@/components/ApuntarLlegada";
import AppNavWrapper from "@/components/AppNavWrapper";
import { BodyWrapper } from "@/components/BodyWrapper";
import { NUM_PAISES } from "@/lib/paises";
import { RefreshCw } from "lucide-react";

export const metadata: Metadata = {
  // Banner de Apple en Safari del iPhone: "BuscayCurra — Abrir en la App
  // Store" (18 oct 2026). Llegan ~80 visitas al día desde Google y casi
  // ninguna se convertía en descarga; es el aviso nativo, sin ventanas.
  itunes: { appId: "6775232067" },
  // El titulo lleva las dos formas de la marca: mucha gente la busca separada
  // ("busca y curra") y sin esa variante Google no relaciona las dos consultas.
  title: `BuscayCurra (Busca y Curra) — Agente IA que busca trabajo por ti`,
  description:
    `Deja de enviar CVs al vacío. Guzzi es un agente de IA que busca ofertas, escribe una carta para cada empresa y envía tus candidaturas en ${NUM_PAISES} países, 24/7. Busca trabajo de au pair, live-in nanny, o cualquier sector. Tu agente personal de búsqueda de empleo.`,
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
    "Busca y Curra",
    "busca y curra",
    "buscaycurra app",
    "Guzzi",
    "España",
    "Alemania",
    "Irlanda",
    "Europa",
    "au pair",
    "trabajar como au pair",
    "live in nanny",
    "live-in nanny",
    "niñera interna",
    "nanny profesional",
    "trabajo cuidando niños",
    "trabajar de niñera en el extranjero",
    "carta Dear Family",
    "requisitos au pair",
    "ofertas au pair",
    "ofertas live-in nanny",
  ],
 manifest: "/manifest.json",
 appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "BuscayCurra",
  },
  metadataBase: new URL("https://buscaycurra.es"),
  openGraph: {
    title: "BuscayCurra — El agente IA que busca trabajo por ti",
    description:
      `Guzzi busca ofertas, escribe una carta para cada empresa y envía tus candidaturas en ${NUM_PAISES} países, 24/7. Deja de enviar CVs al vacío. Tu agente personal de búsqueda de empleo.`,
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
        alt: `BuscayCurra — Agente IA que busca trabajo por ti en ${NUM_PAISES} países`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BuscayCurra — Agente IA que busca trabajo por ti",
    description:
      `Guzzi busca ofertas, escribe una carta para cada empresa y envía tus candidaturas en ${NUM_PAISES} países. 24/7.`,
    images: ["/og-image.png"],
  },
  // CANONICAL "./": CADA PÁGINA, LA SUYA (22 oct 2026). Un canonical "/" aquí
  // lo heredaban todas las páginas sin el suyo y le decían a Google "soy una
  // copia de la portada" (auditoría del 3 oct 2026). Sin ninguno, Search
  // Console avisaba "Duplicada: el usuario no ha indicado ninguna versión
  // canónica": /precios, /sobre-nosotros, las legales, las fichas... llegan
  // también con ?ref=, ?desde=anuncio o los de los anuncios. Next resuelve
  // "./" con la ruta de cada página y sin parámetros (resolveRelativeUrl), y
  // las que definen el suyo (portada, cursos, empleo...) lo siguen mandando.
  alternates: { canonical: "./" },
  robots: {
    index: true,
    follow: true,
    "max-image-preview": "large",
    "max-snippet": -1,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: true,
  // Aquí y no en metadata: allí Next lo da por obsoleto y avisaba en cada página
  // servida, 78.390 líneas de registro en un día (3 nov 2026).
  themeColor: "#0f1117",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Se resuelve en el SERVIDOR (aquí process.env sí existe) y se interpola como
  // literal en el <script> inline de abajo. Si se dejara "process.env..." dentro
  // del string del script, el navegador lo ejecutaría tal cual y lanzaría
  // "process is not defined" en TODAS las páginas (process no existe en el cliente).
  const BUILD_ID =
    process.env.NEXT_PUBLIC_BUILD_ID ||
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
    "dev";
  return (
    <html lang="es">
      <head>
        {/* Preconnect Google Fonts para carga async */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" media="print" />
        <noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" /></noscript>
        <link rel="icon" href="/favicon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0f1117" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="BuscayCurra" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        {/* iOS splash screens — apple-touch-startup-image */}
        <link rel="apple-touch-startup-image" media="screen and (device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)" href="/splash-640x1136.png" />
        <link rel="apple-touch-startup-image" media="screen and (device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)" href="/splash-750x1334.png" />
        <link rel="apple-touch-startup-image" media="screen and (device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3)" href="/splash-1242x2208.png" />
        <link rel="apple-touch-startup-image" media="screen and (device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)" href="/splash-1125x2436.png" />
        <link rel="apple-touch-startup-image" media="screen and (device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)" href="/splash-828x1792.png" />
        <link rel="apple-touch-startup-image" media="screen and (device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3)" href="/splash-1242x2688.png" />
        <link rel="apple-touch-startup-image" media="screen and (device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)" href="/splash-1170x2532.png" />
        <link rel="apple-touch-startup-image" media="screen and (device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3)" href="/splash-1284x2778.png" />
        <link rel="apple-touch-startup-image" media="screen and (device-width: 810px) and (device-height: 1080px) and (-webkit-device-pixel-ratio: 2)" href="/splash-1620x2160.png" />
        <link rel="apple-touch-startup-image" media="screen and (device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)" href="/splash-2048x2732.png" />
        <link rel="alternate" hrefLang="es" href="https://buscaycurra.es" />
        <link rel="alternate" hrefLang="x-default" href="https://buscaycurra.es" />
        {/* Verificación de la web en Impact (afiliados de Coursera, 8 oct 2026).
            Impact pide el código en el atributo "value", que no es estándar en
            <meta>; va también en "content" por si su lector mira el habitual.
            No es secreto: es público por definición. Impact genera un código
            nuevo cada vez que se abre su panel; el que vale es el último. */}
        <meta
          name="impact-site-verification"
          content="5475f2f2-412b-4825-a15f-84781f036795"
          {...({ value: "5475f2f2-412b-4825-a15f-84781f036795" } as Record<string, string>)}
        />
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
                `Guzzi es un agente de IA que busca ofertas, escribe una carta para cada empresa y envía tus candidaturas en ${NUM_PAISES} países, 24/7. Tu agente personal de búsqueda de empleo.`,
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
                // La gente busca la marca separada ("busca y curra") tanto o mas
                // que junta. Sin alternateName, Google trata las dos formas como
                // consultas distintas y la web deja de salir con la separada.
                alternateName: ["Busca y Curra", "Busca y curra", "busca y curra", "Buscaycurra"],
                url: "https://buscaycurra.es",
                sameAs: [],
              },
            }),
          }}
        />
        {/* WebSite + SearchAction schema for Google Sitelinks Searchbox */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "BuscayCurra",
              alternateName: ["Busca y Curra", "Busca y curra", "busca y curra"],
              url: "https://buscaycurra.es",
              description:
                `Guzzi es un agente de IA que busca ofertas, escribe una carta para cada empresa y envía tus candidaturas en ${NUM_PAISES} países, 24/7.`,
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate:
                    "https://buscaycurra.es/app/buscar?q={search_term_string}",
                },
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
        {/* ⚡ FORCE UPDATE: comparar BUILD_ID con localStorage antes de que el SW intervenga */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            var BUILD_ID = ${JSON.stringify(BUILD_ID)};
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
          <PolyfillBanderas />
          <ApuntarLlegada />
        </BodyWrapper>
        <div id="pwa-update-banner" style={{ display: "none", position: "fixed", bottom: 0, left: 0, right: 0, background: "#111827", borderTop: "2px solid #22c55e", padding: "12px 16px", zIndex: 9999, textAlign: "center", fontSize: "14px", color: "#f1f5f9" }}>
          <RefreshCw size={16} strokeWidth={2} style={{ display: "inline", marginRight: "6px", verticalAlign: "middle" }} />Nueva versión disponible —{" "}
          <button id="pwa-reload-btn" style={{ background: "#22c55e", color: "#000", border: "none", padding: "6px 16px", borderRadius: "6px", fontWeight: 700, cursor: "pointer", marginLeft: "8px" }}>
            Actualizar ahora
          </button>
        </div>
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            // BUILD_ID from env: NEXT_PUBLIC_BUILD_ID or NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA — forzar detección de nuevos deploys
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
