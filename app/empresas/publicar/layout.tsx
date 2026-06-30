import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Publicar Oferta de Trabajo Gratis — BuscayCurra",
  description:
    "Publica tu oferta de empleo gratis en BuscayCurra. Llega a miles de candidatos cualificados con CVs optimizados por IA. Sin coste, sin permanencia.",
  openGraph: {
    title: "Publicar Oferta de Trabajo — BuscayCurra",
    description:
      "Publica ofertas de empleo gratis y recibe candidatos con CVs mejorados por IA. Sin intermediarios.",
    url: "https://buscaycurra.es/empresas/publicar",
    type: "website",
  },
};

export default function PublicarLayout({ children }: { children: React.ReactNode }) {
  return children;
}
