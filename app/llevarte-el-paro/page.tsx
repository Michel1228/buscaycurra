/**
 * /llevarte-el-paro — Página pública sobre exportar la prestación.
 *
 * No se llama /emigrar porque ya existe /app/emigrar, y tener las dos es la
 * colisión que tumbó las páginas de cursos. Ver el comentario de
 * app/derechos-au-pair/page.tsx.
 *
 * Pública porque "cobrar el paro en otro país" lo busca gente que todavía no se
 * ha registrado y que está decidiendo si se va o no.
 */
import type { Metadata } from "next";
import PublicHeader from "@/components/PublicHeader";
import ParoEuropeo from "@/components/emigrar/ParoEuropeo";

export const metadata: Metadata = {
  title: "Cobrar el paro español en otro país de la UE: formulario U2 | BuscayCurra",
  description:
    "Puedes seguir cobrando tu prestación hasta seis meses mientras buscas trabajo en otro país europeo. Requisitos, el formulario U2 y los dos plazos que lo tiran todo si los fallas.",
  alternates: { canonical: "https://buscaycurra.es/llevarte-el-paro" },
  openGraph: {
    title: "Si te vas a buscar trabajo fuera, puedes llevarte el paro",
    description:
      "Hasta seis meses cobrando tu prestación española mientras buscas trabajo en otro país de la UE. Con los plazos que casi nadie conoce.",
    url: "https://buscaycurra.es/llevarte-el-paro",
    locale: "es_ES",
    type: "article",
    siteName: "BuscayCurra",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Llevarte el paro a otro país" }],
  },
};

export default function LlevarteElParoPublico() {
  return (
    <div className="min-h-screen" style={{ background: "#0f1117", color: "#f1f5f9" }}>
      <PublicHeader />
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
        <ParoEuropeo base="/app/emigrar" />
      </div>
    </div>
  );
}
