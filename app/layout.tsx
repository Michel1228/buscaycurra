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
  manifest: "/manifest.json",
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
        <meta name="theme-color" content="#7ed56f" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="BuscayCurra" />
        <link rel="apple-touch-icon" href="/qr-buscaycurra.png" />
      </head>
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
