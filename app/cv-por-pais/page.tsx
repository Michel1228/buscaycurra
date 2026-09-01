/**
 * /cv-por-pais — Página pública sobre las diferencias de CV entre países.
 *
 * No se llama /curriculum porque existe /app/curriculum, y tener las dos es la
 * colisión que tumbó las páginas de cursos.
 *
 * Pública porque "¿se pone foto en el CV en Reino Unido?" lo busca muchísima
 * gente que aún no se ha registrado en nada.
 */
import type { Metadata } from "next";
import PublicHeader from "@/components/PublicHeader";
import CVPorPais from "@/components/cv/PorPais";

export const metadata: Metadata = {
  title: "¿Foto en el CV? Cómo cambia el currículum en cada país | BuscayCurra",
  description:
    "En Alemania la foto se espera; en Reino Unido, Irlanda, Países Bajos y Estados Unidos puede hacer que descarten tu CV. Guía país por país: foto, extensión y qué datos no poner.",
  alternates: { canonical: "https://buscaycurra.es/cv-por-pais" },
  openGraph: {
    title: "El mismo CV no vale para todos los países",
    description:
      "El currículum que te ayuda en Múnich te tumba en Londres. Foto, extensión y datos personales, país por país.",
    url: "https://buscaycurra.es/cv-por-pais",
    locale: "es_ES",
    type: "article",
    siteName: "BuscayCurra",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "El CV cambia según el país" }],
  },
};

export default function CVPorPaisPublico() {
  return (
    <div className="min-h-screen" style={{ background: "#0f1117", color: "#f1f5f9" }}>
      <PublicHeader />
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
        <CVPorPais base="/app/curriculum" />
      </div>
    </div>
  );
}
