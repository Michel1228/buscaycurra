import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reviews de Empresas — BuscayCurra",
  description: "Lee y comparte opiniones reales de quienes han trabajado o aplicado a empresas. Toma decisiones informadas sobre dónde trabajar.",
  openGraph: {
    title: "Reviews de Empresas — BuscayCurra",
    description: "Opiniones reales de empleados y candidatos sobre empresas.",
    url: "https://buscaycurra.es/app/reviews",
    type: "website",
  },
};

export default function ReviewsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
