/**
 * /app/formacion/[tipo] — La ficha del curso dentro de la aplicación.
 *
 * Misma ficha que la pública, pero conservando el menú (ver el comentario de
 * ../page.tsx). Aquí no hay JSON-LD ni canonical: /app está detrás del login y
 * Google no lo indexa, así que el SEO se lo queda la versión pública.
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DetalleCurso from "@/components/cursos/DetalleCurso";
import { tipoPorSlug, tiposPorPais } from "@/lib/cursos/tipos";

export function generateStaticParams() {
  return tiposPorPais("ES").map(t => ({ tipo: t.slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ tipo: string }> }
): Promise<Metadata> {
  const { tipo } = await params;
  const t = tipoPorSlug(tipo, "ES");
  return { title: t ? `${t.nombre} | BuscayCurra` : "Curso no encontrado | BuscayCurra" };
}

export default async function FichaCursoApp({ params }: { params: Promise<{ tipo: string }> }) {
  const { tipo } = await params;
  const t = tipoPorSlug(tipo, "ES");
  if (!t) notFound();

  return (
    <div className="min-h-screen pt-16" style={{ background: "#0f1117", color: "#f1f5f9" }}>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <DetalleCurso slug={t.slug} base="/app/formacion" />
      </div>
    </div>
  );
}
