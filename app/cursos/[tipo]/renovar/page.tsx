/**
 * /cursos/[tipo]/renovar — Cómo se renueva un carné que ya tienes.
 *
 * Es la página que tiene que encontrar quien busca "renovar carné de
 * carretillero" o "renovar la TIP": gente que ya trabaja de esto y tiene el
 * carné a punto de caducar. Solo existe para las fichas con la renovación
 * confirmada en una fuente; para el resto, 404.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Search } from "lucide-react";
import PublicHeader from "@/components/PublicHeader";
import { CasillasRenovacion, queSeRenueva } from "@/components/cursos/Renovacion";
import MiCarne from "@/components/cursos/MiCarne";
import { tipoPorSlug, tiposConRenovacion } from "@/lib/cursos/tipos";

export function generateStaticParams() {
  return tiposConRenovacion("ES").map(t => ({ tipo: t.slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ tipo: string }> }
): Promise<Metadata> {
  const { tipo } = await params;
  const t = tipoPorSlug(tipo, "ES");
  if (!t?.renovacion) return { title: "Página no encontrada | BuscayCurra" };

  const titulo = `${queSeRenueva(t)}: renovación, plazos y papeles | BuscayCurra`;
  const desc = `Se renueva ${t.renovacion.cada.toLowerCase()}. ${t.renovacion.casillas[0].texto}`.slice(0, 160);
  const url = `https://buscaycurra.es/cursos/${t.slug}/renovar`;

  return {
    title: titulo,
    description: desc,
    alternates: { canonical: url },
    openGraph: {
      title: titulo,
      description: desc,
      url,
      locale: "es_ES",
      type: "article",
      siteName: "BuscayCurra",
      images: [{ url: "/og-image.png", width: 1200, height: 630, alt: queSeRenueva(t) }],
    },
  };
}

export default async function RenovarCarne({ params }: { params: Promise<{ tipo: string }> }) {
  const { tipo } = await params;
  const t = tipoPorSlug(tipo, "ES");
  if (!t?.renovacion) notFound();

  const puesto = t.puestos[0];

  return (
    <div className="min-h-screen" style={{ background: "#0f1117", color: "#f1f5f9" }}>
      <PublicHeader />
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
        <Link
          href="/cursos/renovar"
          className="inline-flex items-center gap-1.5 text-xs mb-6 hover:opacity-80"
          style={{ color: "#8b98ad", textDecoration: "none" }}
        >
          <ArrowLeft size={13} strokeWidth={1.9} />
          Todas las renovaciones
        </Link>

        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-2 leading-tight">{queSeRenueva(t)}: cómo se renueva</h1>
        <p className="text-sm leading-relaxed mb-6" style={{ color: "#94a3b8" }}>
          Cada cuánto caduca, qué te piden y dónde se hace.
        </p>

        <section className="mb-8">
          <CasillasRenovacion r={t.renovacion} />
          <MiCarne slug={t.slug} nombre={queSeRenueva(t)} anios={t.validezAnios ?? null} dentroDeLaApp={false} />
        </section>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href={`/app/buscar?keyword=${encodeURIComponent(puesto)}`}
            className="rounded-xl p-4 flex items-center gap-3 hover:opacity-90"
            style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.3)", textDecoration: "none" }}
          >
            <Search size={17} strokeWidth={1.9} className="shrink-0" style={{ color: "#22c55e" }} />
            <span className="text-sm font-semibold" style={{ color: "#22c55e" }}>Ver ofertas de {puesto}</span>
          </Link>
          <Link
            href={`/cursos/${t.slug}`}
            className="rounded-xl p-4 block hover:opacity-90"
            style={{ background: "rgba(12,15,22,0.86)", border: "1px solid rgba(148,163,184,0.18)", textDecoration: "none" }}
          >
            <p className="text-sm font-semibold" style={{ color: "#f1f5f9" }}>¿Aún no lo tienes?</p>
            <p className="text-xs" style={{ color: "#94a3b8" }}>Cuánto cuesta y dónde sacarlo gratis</p>
          </Link>
        </div>

        <p className="text-[11px] mt-8" style={{ color: "#4b5563" }}>
          Revisado en {t.actualizado}. Comprueba siempre los plazos en la fuente antes de hacer el trámite.
        </p>
      </div>
    </div>
  );
}
