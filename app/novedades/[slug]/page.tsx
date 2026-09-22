/**
 * /novedades/[slug] — Una novedad o campaña.
 *
 * Estática, como las guías: se genera al compilar y no gasta nada al servirla.
 * Lleva JSON-LD de tipo Article para que Google la entienda como publicación
 * con fecha, que es lo que hace que salga en «lo más reciente».
 */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import VideoNovedad from "@/components/novedades/VideoNovedad";
import {
  ETIQUETA_TIPO,
  NOVEDADES,
  fechaEnEspanol,
  novedadPorSlug,
} from "@/lib/novedades/contenido";

export function generateStaticParams() {
  return NOVEDADES.map((n) => ({ slug: n.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const n = novedadPorSlug(slug);
  if (!n) return { title: "Novedad no encontrada | BuscayCurra" };

  const url = `https://buscaycurra.es/novedades/${n.slug}`;
  return {
    title: `${n.titulo} | BuscayCurra`,
    description: n.resumen,
    alternates: { canonical: url },
    openGraph: {
      title: n.titulo,
      description: n.resumen,
      url,
      locale: "es_ES",
      type: "article",
      publishedTime: n.fecha,
      siteName: "BuscayCurra",
      images: [{ url: n.imagen || "/og-image.png", width: 1200, height: 630, alt: n.titulo }],
    },
  };
}

export default async function PaginaNovedad({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const n = novedadPorSlug(slug);
  if (!n) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: n.titulo,
    description: n.resumen,
    datePublished: n.fecha,
    dateModified: n.fecha,
    inLanguage: "es-ES",
    author: { "@type": "Organization", name: "BuscayCurra" },
    publisher: { "@type": "Organization", name: "BuscayCurra" },
    mainEntityOfPage: `https://buscaycurra.es/novedades/${n.slug}`,
  };

  return (
    <div className="min-h-screen" style={{ background: "#0f1117", color: "#f1f5f9" }}>
      <PublicHeader />

      <article className="max-w-2xl mx-auto px-4 py-10 sm:py-14">
        <Link href="/novedades" className="text-xs" style={{ color: "#64748b" }}>
          ← Todas las novedades
        </Link>

        <div className="mt-4 flex items-center gap-2 flex-wrap">
          <span
            className="text-[10px] px-1.5 py-0.5 rounded"
            style={{ background: "rgba(34,197,94,0.10)", color: "#22c55e" }}
          >
            {ETIQUETA_TIPO[n.tipo]}
          </span>
          <time className="text-[11px]" style={{ color: "#64748b" }} dateTime={n.fecha}>
            {fechaEnEspanol(n.fecha)}
          </time>
        </div>

        <h1 className="mt-2 text-xl sm:text-2xl font-bold leading-tight tracking-tight">
          {n.titulo}
        </h1>

        {n.video && <VideoNovedad url={n.video.url} titulo={n.video.titulo} />}

        {n.imagen && !n.video && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={n.imagen}
            alt={n.titulo}
            className="mt-6 rounded-xl w-full"
            style={{ border: "1px solid #2d3142" }}
          />
        )}

        <div className="mt-6 space-y-4">
          {n.cuerpo.map((p) => (
            <p key={p.slice(0, 40)} className="text-sm leading-relaxed" style={{ color: "#94a3b8" }}>
              {p}
            </p>
          ))}
        </div>

        {n.enlaces && n.enlaces.length > 0 && (
          <ul className="mt-8 space-y-2">
            {n.enlaces.map((e) => (
              <li key={e.href}>
                {e.href.startsWith("http") ? (
                  <a href={e.href} target="_blank" rel="noopener noreferrer" className="text-sm" style={{ color: "#22c55e" }}>
                    {e.texto} →
                  </a>
                ) : (
                  <Link href={e.href} className="text-sm" style={{ color: "#22c55e" }}>
                    {e.texto} →
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </article>

      <PublicFooter />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
}
