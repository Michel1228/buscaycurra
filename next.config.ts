// next.config.ts — Configuración principal de Next.js para BuscayCurra

import type { NextConfig } from "next";

// ─── Cabeceras de seguridad ────────────────────────────────────────────────────
// Estas cabeceras mitigan XSS, clickjacking, sniffing de MIME y filtraciones
// de referrer. Se aplican a todas las rutas.

const securityHeaders = [
  // Evita que el navegador "adivine" el MIME type y ejecute como script un
  // fichero servido como texto.
  { key: "X-Content-Type-Options", value: "nosniff" },

  // Clickjacking: ninguna página externa puede embeber BuscayCurra en iframe.
  { key: "X-Frame-Options", value: "DENY" },

  // Fuerza HTTPS durante 2 años (con preload y subdominios).
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },

  // Limita la información que se envía en la cabecera Referer.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },

  // Bloquea APIs del navegador que no se usan (cámara, micro, geolocalización).
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(self)",
  },

  // Content Security Policy. Permisivo por ahora para evitar romper Stripe,
  // Supabase y tracking — endurecer más adelante una vez verificados todos
  // los orígenes que utiliza la app.
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://*.supabase.co",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co https://api.stripe.com https://*.stripe.com",
      "frame-src https://js.stripe.com https://hooks.stripe.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  // Habilitar React estricto para detectar problemas en desarrollo
  reactStrictMode: true,

  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
