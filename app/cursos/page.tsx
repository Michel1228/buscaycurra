/**
 * /cursos — Página pública de formación. Es la que ve Google.
 *
 * El contenido vive en components/cursos/ListaCursos.tsx porque se pinta igual
 * dentro de la app (/app/formacion), donde el usuario ya está identificado y lleva
 * su menú. Aquí solo se le pone el marco público y los metadatos de SEO.
 */
import type { Metadata } from "next";
import PublicHeader from "@/components/PublicHeader";
import ListaCursos from "@/components/cursos/ListaCursos";

export const metadata: Metadata = {
  title: "Cursos para trabajar: gratis, subvencionados y obligatorios | BuscayCurra",
  description:
    "Qué curso necesitas para el trabajo que buscas: manipulador de alimentos, carretillero, PRL, TPC y más. Cuánto cuesta, cuánto dura y dónde sacarlo gratis.",
  alternates: { canonical: "https://buscaycurra.es/cursos" },
  openGraph: {
    title: "Cursos para trabajar: gratis, subvencionados y obligatorios",
    description:
      "Qué curso necesitas para el trabajo que buscas. Cuánto cuesta, cuánto dura y dónde sacarlo gratis.",
    url: "https://buscaycurra.es/cursos",
    locale: "es_ES",
    type: "website",
    siteName: "BuscayCurra",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Cursos para trabajar | BuscayCurra" }],
  },
};

export default function CursosPublico() {
  return (
    <div className="min-h-screen" style={{ background: "#0f1117", color: "#f1f5f9" }}>
      <PublicHeader />
      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        <ListaCursos base="/cursos" />
      </div>
    </div>
  );
}
