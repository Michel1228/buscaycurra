     1|/**
     2| * app/layout.tsx — Layout raíz de BuscayCurra
     3| * La AppNavbar se muestra solo en /app/* via AppNavWrapper (client component).
     4| */
     5|import type { Metadata } from "next";
     6|import "./globals.css";
     7|import CookieBanner from "@/components/CookieBanner";
     8|import AppNavWrapper from "@/components/AppNavWrapper";
     9|import { BodyWrapper } from "@/components/BodyWrapper";
import { NUM_PAISES } from "@/lib/paises";
    10|
    11|export const metadata: Metadata = {
    12|  title: "BuscayCurra — Agente IA que busca trabajo por ti | ${NUM_PAISES} países",
    13|  description:
    14|    "Deja de enviar CVs al vacío. Guzzi es el primer agente IA que busca, adapta y envía candidaturas por ti en ${NUM_PAISES} países, 24/7. La alternativa real a InfoJobs, LinkedIn e Indeed.",
    15|  keywords: [
    16|    "buscar trabajo",
    17|    "empleo",
    18|    "CV",
    19|    "inteligencia artificial",
    20|    "agente IA",
    21|    "trabajar en el extranjero",
    22|    "emigrar",
    23|    "empleo internacional",
    24|    "ofertas de trabajo",
    25|    "BuscayCurra",
    26|    "Guzzi",
    27|    "España",
    28|    "Alemania",
    29|    "Irlanda",
    30|    "Europa",
    31|  ],
    32| manifest: "/manifest.json",
    33|  themeColor: "#0f1117",
    34| appleWebApp: {
    35|    capable: true,
    36|    statusBarStyle: "black-translucent",
    37|    title: "BuscayCurra",
    38|  },
    39|  metadataBase: new URL("https://buscaycurra.es"),
    40|  openGraph: {
    41|    title: "BuscayCurra — El agente IA que busca trabajo por ti",
    42|    description:
    43|      "Guzzi busca, adapta y envía candidaturas por ti en ${NUM_PAISES} países, 24/7. Deja de enviar CVs al vacío. La alternativa a InfoJobs y LinkedIn.",
    44|    url: "https://buscaycurra.es",
    45|    locale: "es_ES",
    46|    type: "website",
    47|    siteName: "BuscayCurra",
    48|    alternateLocale: ["en_US"],
    49|    images: [
    50|      {
    51|        url: "/og-image.png",
    52|        width: 1200,
    53|        height: 630,
    54|        alt: "BuscayCurra — Agente IA que busca trabajo por ti en ${NUM_PAISES} países",
    55|      },
    56|    ],
    57|  },
    58|  twitter: {
    59|    card: "summary_large_image",
    60|    title: "BuscayCurra — Agente IA que busca trabajo por ti",
    61|    description:
    62|      "Guzzi busca, adapta y envía candidaturas por ti en ${NUM_PAISES} países. 24/7. Sin que muevas un dedo.",
    63|    images: ["/og-image.png"],
    64|  },
    65|  alternates: {
    66|    canonical: "https://buscaycurra.es",
    67|    languages: {
    68|      es: "https://buscaycurra.es",
    69|      en: "https://buscaycurra.es/en",
    70|    },
    71|  },
    72|  robots: {
    73|    index: true,
    74|    follow: true,
    75|    "max-image-preview": "large",
    76|    "max-snippet": -1,
    77|  },
    78|};
    79|
    80|export default function RootLayout({
    81|  children,
    82|}: Readonly<{
    83|  children: React.ReactNode;
    84|}>) {
    85|  return (
    86|    <html lang="es">
    87|      <head>
    88|        <link rel="manifest" href="/manifest.json" />
    89|        <meta name="theme-color" content="#0f1117" />
    90|        <meta name="apple-mobile-web-app-capable" content="yes" />
    91|        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    92|        <meta name="apple-mobile-web-app-title" content="BuscayCurra" />
    93|        <link rel="apple-touch-icon" href="/icon-192.png" />
    94|        <link rel="canonical" href="https://buscaycurra.es" />
    95|        <link rel="alternate" hrefLang="es" href="https://buscaycurra.es" />
    96|        <link rel="alternate" hrefLang="en" href="https://buscaycurra.es/en" />
    97|        <link rel="alternate" hrefLang="x-default" href="https://buscaycurra.es" />
    98|      </head>
    99|      <body>
   100|        {/* Structured data for Google rich results */}
   101|        <script
   102|          type="application/ld+json"
   103|          dangerouslySetInnerHTML={{
   104|            __html: JSON.stringify({
   105|              "@context": "https://schema.org",
   106|              "@type": "WebApplication",
   107|              name: "BuscayCurra",
   108|              url: "https://buscaycurra.es",
   109|              description:
   110|                "Guzzi es el primer agente IA que busca, adapta y envía candidaturas por ti en ${NUM_PAISES} países, 24/7. La alternativa real a InfoJobs, LinkedIn e Indeed.",
   111|              applicationCategory: "BusinessApplication",
   112|              operatingSystem: "Web, Android, iOS",
   113|              offers: {
   114|                "@type": "Offer",
   115|                price: "0",
   116|                priceCurrency: "EUR",
   117|              },
   118|              author: {
   119|                "@type": "Organization",
   120|                name: "BuscayCurra",
   121|                url: "https://buscaycurra.es",
   122|                sameAs: [],
   123|              },
   124|            }),
   125|          }}
   126|        />
   127|        {/* ⚡ FORCE UPDATE: comparar BUILD_ID con localStorage antes de que el SW intervenga */}
   128|        <script dangerouslySetInnerHTML={{ __html: `
   129|          (function() {
   130|            var BUILD_ID = '__BUILD_ID__';
   131|            var stored = localStorage.getItem('bc_build_id');
   132|            if (stored && stored !== BUILD_ID) {
   133|              // Nuevo deploy detectado — limpiar TODO y recargar
   134|              localStorage.setItem('bc_build_id', BUILD_ID);
   135|              // Desregistrar todos los service workers
   136|              if ('serviceWorker' in navigator) {
   137|                navigator.serviceWorker.getRegistrations().then(function(regs) {
   138|                  regs.forEach(function(r) { r.unregister(); });
   139|                  // Limpiar todas las caches
   140|                  if ('caches' in window) {
   141|                    caches.keys().then(function(keys) {
   142|                      keys.forEach(function(k) { caches.delete(k); });
   143|                    });
   144|                  }
   145|                  // Recargar sin cache
   146|                  setTimeout(function() { window.location.reload(true); }, 300);
   147|                });
   148|              }
   149|            } else if (!stored) {
   150|              localStorage.setItem('bc_build_id', BUILD_ID);
   151|            }
   152|          })();
   153|        `}} />
   154|        <BodyWrapper>
   155|          <AppNavWrapper />
   156|          {children}
   157|          <CookieBanner />
   158|        </BodyWrapper>
   159|        <div id="pwa-update-banner" style={{ display: "none", position: "fixed", bottom: 0, left: 0, right: 0, background: "#111827", borderTop: "2px solid #22c55e", padding: "12px 16px", zIndex: 9999, textAlign: "center", fontSize: "14px", color: "#f1f5f9" }}>
   160|          🔄 Nueva versión disponible —{" "}
   161|          <button id="pwa-reload-btn" style={{ background: "#22c55e", color: "#000", border: "none", padding: "6px 16px", borderRadius: "6px", fontWeight: 700, cursor: "pointer", marginLeft: "8px" }}>
   162|            Actualizar ahora
   163|          </button>
   164|        </div>
   165|        <script dangerouslySetInnerHTML={{ __html: `
   166|          (function() {
   167|            // BUILD_ID: __BUILD_ID__ — forzar detección de nuevos deploys
   168|            if ('serviceWorker' in navigator) {
   169|              let refreshing = false;
   170|              var banner = document.getElementById('pwa-update-banner');
   171|              var reloadBtn = document.getElementById('pwa-reload-btn');
   172|
   173|              // Cuando un nuevo SW toma el control, recargar automáticamente
   174|              navigator.serviceWorker.addEventListener('controllerchange', function() {
   175|                if (refreshing) return;
   176|                refreshing = true;
   177|                window.location.reload();
   178|              });
   179|
   180|              window.addEventListener('load', function() {
   181|                navigator.serviceWorker.register('/sw.js').then(function(registration) {
   182|                  console.log('[PWA] SW registrado, scope:', registration.scope);
   183|
   184|                  // Si ya hay un SW esperando, mostrar banner
   185|                  if (registration.waiting) {
   186|                    showBanner();
   187|                  }
   188|
   189|                  // Detectar nuevo SW instalándose
   190|                  registration.addEventListener('updatefound', function() {
   191|                    var newWorker = registration.installing;
   192|                    if (!newWorker) return;
   193|                    newWorker.addEventListener('statechange', function() {
   194|                      if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
   195|                        // Nuevo SW instalado pero esperando — mostrar banner
   196|                        showBanner();
   197|                      }
   198|                    });
   199|                  });
   200|                }).catch(function(err) {
   201|                  console.log('[PWA] Error SW:', err);
   202|                });
   203|
   204|                // Re-check cada 30 min para detectar actualizaciones
   205|                setInterval(function() {
   206|                  if (!navigator.onLine) return;
   207|                  navigator.serviceWorker.getRegistration().then(function(reg) {
   208|                    if (reg) reg.update();
   209|                  });
   210|                }, 30 * 60 * 1000);
   211|              });
   212|
   213|              function showBanner() {
   214|                if (!banner) return;
   215|                banner.style.display = 'block';
   216|                if (!reloadBtn) return;
   217|                reloadBtn.onclick = function() {
   218|                  navigator.serviceWorker.getRegistration().then(function(reg) {
   219|                    if (!reg || !reg.waiting) {
   220|                      window.location.reload();
   221|                      return;
   222|                    }
   223|                    reg.waiting.postMessage('SKIP_WAITING');
   224|                  });
   225|                };
   226|              }
   227|            }
   228|          })();
   229|        `}} />
   230|      </body>
   231|    </html>
   232|  );
   233|}
   234|