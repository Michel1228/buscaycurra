/**
 * app/layout.tsx — Layout raíz de BuscayCurra
 *
 * Define el HTML base, los metadatos de SEO y los estilos globales.
 * Incluye la Navbar solo en rutas dentro de /app/* (panel del usuario).
 * Las rutas públicas (landing, auth) no muestran la Navbar.
 * Colores de marca: azul #2563EB y naranja #F97316.
 */

import type { Metadata } from "next";
import "./globals.css";
import NavbarWrapper from "@/components/NavbarWrapper";

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
        {/*
         * NavbarWrapper decide si mostrar la Navbar o no
         * según la ruta actual. En /app/* la muestra; fuera, no.
         */}
        <NavbarWrapper />
        {children}
      </body>
    </html>
  );
}
