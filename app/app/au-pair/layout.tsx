import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Au Pair y Live-in Nanny en el Extranjero — Requisitos, Costes y Ofertas | BuscayCurra",
  description:
    "Encuentra trabajo como au pair o live-in nanny en el extranjero. Comparativa de requisitos legales por país (edad, salario, visado), calculadora de costes para familias, y miles de ofertas con email de contacto. Au Pair (intercambio cultural) y Live-in Nanny (empleo profesional). Todo en español.",
  keywords: [
    "au pair", "trabajar como au pair", "requisitos au pair", "salario au pair",
    "au pair España", "au pair Alemania", "au pair Francia", "au pair Reino Unido",
    "au pair Irlanda", "au pair Dinamarca", "coste au pair", "calculadora au pair",
    "comparativa au pair países", "visado au pair", "Dear Family Letter",
    "ofertas au pair", "trabajo cuidando niños", "nanny Europa",
    "live in nanny", "live-in nanny", "niñera interna", "nanny profesional",
    "trabajo niñera extranjero", "live-in caregiver", "nanny live-in",
    "ofertas live-in nanny", "salario niñera interna", "trabajar de niñera en Europa",
  ],
  openGraph: {
    title: "Au Pair y Live-in Nanny en el Extranjero — Requisitos, Costes y Ofertas | BuscayCurra",
    description:
      "Tabla comparativa de 11 países con requisitos legales, calculadora de coste total para familias, y miles de ofertas au pair y live-in nanny activas.",
    type: "website",
    locale: "es_ES",
    siteName: "BuscayCurra",
  },
  twitter: {
    card: "summary_large_image",
    title: "Au Pair y Live-in Nanny en el Extranjero | BuscayCurra",
    description:
      "¿Quieres ser au pair o live-in nanny? Compara edad, salario, visado y costes de 11 países europeos en una sola tabla. Gratis.",
  },
  alternates: {
    canonical: "https://buscaycurra.es/app/au-pair",
  },
};

export default function AuPairLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
