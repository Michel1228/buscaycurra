import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Emigrar al Extranjero — Guía Completa por Países | BuscayCurra",
  description:
    "Guía completa para emigrar y trabajar en el extranjero: visados, alojamiento, salarios, requisitos y ofertas de empleo en 24 países. Información actualizada por país.",
  openGraph: {
    title: "Emigrar al Extranjero — Guía por Países | BuscayCurra",
    description:
      "Toda la información para trabajar fuera de España: visados, alojamiento, salarios y ofertas en 24 países.",
  },
};

export default function EmigrarLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
