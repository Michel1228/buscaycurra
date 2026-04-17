/**
 * app/layout.tsx — Layout raíz de BuscayCurra
 *
 * Define el HTML base, los metadatos de SEO y los estilos globales.
 * Incluye la Navbar solo en rutas dentro de /app/* (panel del usuario).
 * Las rutas públicas (landing, auth) no muestran la Navbar.
 * Paleta "La Metamorfosis": verde neón #00ff88 sobre negro #0a0a0a.
 */

import type { Metadata } from "next";
import "./globals.css";
import NavbarWrapper from "@/components/NavbarWrapper";
// Banner de consentimiento de cookies (RGPD) — aparece en todas las páginas
import CookieBanner from "@/components/CookieBanner";
// Splash Screen de metamorfosis — solo aparece en la primera visita
import SplashWrapper from "@/components/SplashWrapper";

// ─── Metadatos de SEO ─────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: "BuscayCurra — Encuentra trabajo con IA",
  description:
    "Encuentra trabajo más rápido con inteligencia artificial. Mejora tu CV, busca ofertas en toda España y envía tu candidatura automáticamente.",
  keywords: ["buscar trabajo", "empleo", "CV", "inteligencia artificial", "España"],
  openGraph: {
    title: "BuscayCurra — Encuentra trabajo con IA",
    description:
      "Encuentra trabajo más rápido con inteligencia artificial. Mejora tu CV y envía candidaturas automáticamente.",
    locale: "es_ES",
    type: "website",
  },
};

// ─── Layout Raíz ─────────────────────────────────────────────────────────────

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        {/* Splash Screen de metamorfosis — solo primera visita */}
        <SplashWrapper />
        {/*
         * NavbarWrapper decide si mostrar la Navbar o no
         * según la ruta actual. En /app/* la muestra; fuera, no.
         */}
        <NavbarWrapper />
        {children}
        {/* Banner de cookies — se muestra a usuarios nuevos que no han dado consentimiento */}
        <CookieBanner />
      </body>
    </html>
  );
}
