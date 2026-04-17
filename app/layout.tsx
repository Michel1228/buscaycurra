/**
 * app/layout.tsx — Layout raíz de BuscayCurra
 * La AppNavbar se muestra solo en /app/* via AppNavWrapper (client component).
 */

import type { Metadata } from "next";
import "./globals.css";
import CookieBanner from "@/components/CookieBanner";
import AppNavWrapper from "@/components/AppNavWrapper";
import SplashWrapper from "@/components/SplashWrapper";
import GusiChat from "@/components/GusiChat";
import BosqueAmbiente from "@/components/BosqueAmbiente";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <SplashWrapper />
        <AppNavWrapper />
        {children}
        <CookieBanner />
        <BosqueAmbiente />
        <GusiChat />
      </body>
    </html>
  );
}
