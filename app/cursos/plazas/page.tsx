/**
 * /cursos/plazas — Plazas reales de cursos gratis, con fecha. Pública.
 *
 * "plazas" es un segmento fijo y gana a /cursos/[tipo]; no hay ninguna ficha
 * con ese slug ni debe haberla.
 */
import type { Metadata } from "next";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import PaginaPlazas from "@/components/cursos/PaginaPlazas";

export const metadata: Metadata = {
  title: "Cursos gratis para desempleados y trabajadores con fecha | BuscayCurra",
  description:
    "Plazas de cursos gratuitos que empiezan pronto, con fecha, horario y centro: carretillero, inglés, atención sociosanitaria, soldadura, ofimática y más.",
  alternates: { canonical: "https://buscaycurra.es/cursos/plazas" },
  openGraph: {
    title: "Cursos gratis que empiezan pronto",
    description: "Plazas de cursos gratuitos de los servicios públicos de empleo, con fecha y centro.",
    url: "https://buscaycurra.es/cursos/plazas",
    locale: "es_ES",
    type: "website",
    siteName: "BuscayCurra",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Cursos gratis | BuscayCurra" }],
  },
};

export default async function PlazasPublico({ searchParams }: { searchParams: Promise<{ ficha?: string }> }) {
  const { ficha } = await searchParams;
  return (
    <div className="min-h-screen" style={{ background: "#0f1117", color: "#f1f5f9" }}>
      <PublicHeader />
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
        <PaginaPlazas base="/cursos" ficha={ficha} />
      </div>
      <PublicFooter />
    </div>
  );
}
