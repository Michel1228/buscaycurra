// next.config.ts — Configuración principal de Next.js para BuscayCurra

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  compress: true,
  productionBrowserSourceMaps: false,
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  async headers() {
    return [
      // Security headers — aplican a todas las rutas
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://ojesordjedovnpyxspxi.supabase.co https://api.stripe.com https://*.supabase.co wss://*.supabase.co https://api.revenuecat.com; frame-src 'self' https://js.stripe.com; object-src 'none'; base-uri 'self'; form-action 'self';" },
        ],
      },
      // El resto de páginas HTML — nunca cachear; evita interfaz obsoleta en móvil/PWA
      {
        source: '/((?!_next/static|_next/image|favicon|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store, must-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
        ],
      },
      // API routes — extra explicit no-store
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
        ],
      },
      // Páginas públicas de SEO: SÍ se cachean.
      //
      // VA AL FINAL A PROPÓSITO. Cuando varias reglas coinciden con la misma
      // ruta, Next.js aplica todas y para una cabecera repetida gana la última.
      // Puesto antes de la regla de "no-store" de arriba, esta no tenía ningún
      // efecto: la home seguía saliendo con no-store, que le dice a Google que
      // el contenido es efímero y baja la frecuencia con que lo rastrea.
      {
        source: '/',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400' },
        ],
      },
      {
        source: '/:path(precios|empleo|descargar|sobre-nosotros|soporte|empresas|terminos|privacidad|cookies|aviso-legal)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400' },
        ],
      },
      {
        source: '/:seccion(trabajar-en|empleo|empresa|talento)/:resto*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400' },
        ],
      },
      // Los sitemaps: los pide Google, no una persona, y generarlos cuesta una
      // consulta sobre 2,2 millones de filas en un servidor de dos nucleos. La
      // regla general de arriba les estaba poniendo no-store, asi que cada
      // rastreo los recalculaba enteros. Una hora de cache es de sobra: las
      // ofertas nuevas entran igual en el siguiente rastreo.
      {
        source: '/:mapa(sitemap.xml|sitemap-ofertas.xml)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400' },
        ],
      },
    ];
  },
  // Paquetes server-only con módulos nativos o que conectan a Redis.
  // Next.js los excluye del bundle webpack y los toma directamente de node_modules.
  serverExternalPackages: [
    'bullmq',
    'ioredis',
    'ws',
    'nodemailer',
    'canvas',
  ],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: '*.supabase.com' },
    ],
  },
};

export default nextConfig;
