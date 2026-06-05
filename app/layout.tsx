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
import PushRegister from "@/components/PushRegister";

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
        <meta name="theme-color" content="#7ed56f" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="BuscayCurra" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icon-512.png" />
      </head>
      <body>
        <SplashWrapper />
        <AppNavWrapper />
        {children}
        <CookieBanner />
        <BosqueAmbiente />
        <GusiChat />
        <PushRegister />
      </body>
    </html>
  );
}
