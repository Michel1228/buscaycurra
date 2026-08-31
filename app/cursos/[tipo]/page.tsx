/**
 * /cursos/[tipo] — Ficha pública de un tipo de curso.
 *
 * Esta página funciona AUNQUE NO TENGAMOS NI UNA PLAZA que ofrecer, y eso es
 * deliberado: los datos abiertos del SEPE solo cubren algunas comunidades, así
 * que alguien de Pamplona no va a encontrar convocatoria de carretillero. Pero
 * sí necesita saber qué es, cuánto cuesta, cuánto dura y por dónde empezar. Eso
 * ya le sirve.
 *
 * La ficha en sí está en components/cursos/DetalleCurso.tsx: la comparte con
 * /app/formacion/[tipo], que es la misma información con el menú de la app.
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PublicHeader from "@/components/PublicHeader";
import DetalleCurso, { jsonLdCurso } from "@/components/cursos/DetalleCurso";
import { tipoPorSlug, tiposPorPais, precioResumido, duracionResumida } from "@/lib/cursos/tipos";

export function generateStaticParams() {
  return tiposPorPais("ES").map(t => ({ tipo: t.slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ tipo: string }> }
): Promise<Metadata> {
  const { tipo } = await params;
  const t = tipoPorSlug(tipo, "ES");
  if (!t) return { title: "Curso no encontrado | BuscayCurra" };

  const titulo = `${t.nombre}: precio, duración y dónde sacarlo gratis | BuscayCurra`;
  const desc = `${t.resumen} ${t.obligatorioLegal ? `Obligatorio por ${t.normativa}.` : ""} ${duracionResumida(t)}, ${precioResumido(t).toLowerCase()}.`.trim();

  return {
    title: titulo,
    description: desc.slice(0, 160),
    alternates: { canonical: `https://buscaycurra.es/cursos/${t.slug}` },
    openGraph: {
      title: titulo,
      description: desc.slice(0, 160),
      url: `https://buscaycurra.es/cursos/${t.slug}`,
      locale: "es_ES",
      type: "article",
      siteName: "BuscayCurra",
      images: [{ url: "/og-image.png", width: 1200, height: 630, alt: t.nombre }],
    },
  };
}

export default async function FichaCursoPublica({ params }: { params: Promise<{ tipo: string }> }) {
  const { tipo } = await params;
  const t = tipoPorSlug(tipo, "ES");
  if (!t) notFound();

  return (
    <div className="min-h-screen" style={{ background: "#0f1117", color: "#f1f5f9" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdCurso(t)) }}
      />
      <PublicHeader />
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
        <DetalleCurso slug={t.slug} base="/cursos" />
      </div>
    </div>
  );
}
