import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Precios — BuscayCurra | Desde 2,99€/mes",
  description: "Planes de BuscayCurra desde 2,99€/mes. Envía CVs automáticamente con IA, accede a 400.000+ ofertas y encuentra trabajo antes que nadie. Sin permanencia.",
  openGraph: {
    title: "Planes BuscayCurra — Desde 2,99€/mes",
    description: "Envía CVs con IA a 200 empresas al mes por menos que un café. Sin permanencia. Cancela cuando quieras.",
    url: "https://buscaycurra.es/precios",
    type: "website",
  },
};

export default function PreciosLayout({ children }: { children: React.ReactNode }) {
  return children;
}
