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
  title: "BuscayCurra — La alternativa gratuita a InfoJobs con IA",
  description:
    "Busca trabajo gratis en España con IA. Mejora tu CV automáticamente, envía candidaturas a 50 empresas al día y prepara entrevistas. La alternativa inteligente a InfoJobs.",
  keywords: [
    "alternativa infojobs", "buscar trabajo gratis españa", "enviar cv automaticamente",
    "cv con inteligencia artificial gratis", "buscador empleo españa",
    "infojobs alternativa", "buscar empleo ia", "mejorar cv con ia",
  ],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "BuscayCurra",
  },
  openGraph: {
    title: "BuscayCurra — La alternativa gratuita a InfoJobs con IA",
    description:
      "Busca trabajo gratis con IA. 100k+ ofertas en España, envío automático a empresas y CV profesional en minutos. Mejor que InfoJobs.",
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
