import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Au Pair en Europa — Comparativa Legal, Calculadora de Costes y Ofertas | BuscayCurra",
  description:
    "Encuentra trabajo como au pair en Europa. Comparativa de requisitos legales por país (edad, salario, visado), calculadora de costes para familias, y 2,263 ofertas au pair con email de contacto. Todo en español.",
  keywords: [
    "au pair", "trabajar como au pair", "requisitos au pair", "salario au pair",
    "au pair España", "au pair Alemania", "au pair Francia", "au pair Reino Unido",
    "au pair Irlanda", "au pair Dinamarca", "coste au pair", "calculadora au pair",
    "comparativa au pair países", "visado au pair", "Dear Family Letter",
    "ofertas au pair", "trabajo cuidando niños", "nanny Europa"
  ],
  openGraph: {
    title: "Au Pair en Europa — Requisitos, Costes y Ofertas | BuscayCurra",
    description:
      "Tabla comparativa de 11 países con requisitos legales, calculadora de coste total para familias, y 2,263 ofertas au pair activas.",
    type: "website",
    locale: "es_ES",
    siteName: "BuscayCurra",
  },
  twitter: {
    card: "summary_large_image",
    title: "Au Pair en Europa — Requisitos por País | BuscayCurra",
    description:
      "¿Quieres ser au pair? Compara edad, salario, visado y costes de 11 países europeos en una sola tabla. Gratis.",
  },
  alternates: {
    canonical: "https://buscaycurra.es/app/au-pair",
  },
};

export default function AuPairLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
