/**
 * /guias/[slug] — Una guía de uso.
 *
 * Estática: generateStaticParams las deja prerenderizadas al compilar, así que
 * no gastan base de datos ni CPU cuando alguien entra. Era la condición para
 * ponerlas en el mismo dominio que la aplicación sin restarle velocidad.
 *
 * Lleva JSON-LD de tipo HowTo para que Google entienda que es un paso a paso.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import { IconoGuia } from "@/components/guias/IconoGuia";
import { GUIAS, guiaPorSlug } from "@/lib/guias/contenido";

export function generateStaticParams() {
  return GUIAS.map((g) => ({ slug: g.slug }));
}

// En Next 15 los params llegan como promesa, igual que en /empleo/[puesto]/[ciudad].
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const guia = guiaPorSlug(slug);
  if (!guia) return { title: "Guía no encontrada | BuscayCurra" };

  const url = `https://buscaycurra.es/guias/${guia.slug}`;
  return {
    title: `${guia.titulo} | BuscayCurra`,
    description: guia.resumen,
    alternates: { canonical: url },
    openGraph: {
      title: guia.titulo,
      description: guia.resumen,
      url,
      locale: "es_ES",
      type: "article",
      siteName: "BuscayCurra",
      images: [{ url: "/og-image.png", width: 1200, height: 630, alt: guia.titulo }],
    },
  };
}

export default async function PaginaGuia({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guia = guiaPorSlug(slug);
  if (!guia) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: guia.titulo,
    description: guia.resumen,
    step: guia.pasos.map((p, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: p.titulo,
      text: p.detalle,
    })),
  };

  return (
    <div className="min-h-screen" style={{ background: "#0f1117", color: "#f1f5f9" }}>
      <PublicHeader />

      <article className="max-w-2xl mx-auto px-4 py-10 sm:py-14">
        <Link href="/guias" className="text-xs" style={{ color: "#64748b" }}>
          ← Todas las guías
        </Link>

        <header className="mt-4 flex items-start gap-3">
          <IconoGuia nombre={guia.icono} size={22} />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold leading-tight tracking-tight">
              {guia.titulo}
            </h1>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: "#94a3b8" }}>
              {guia.resumen}
            </p>
          </div>
        </header>

        <p
          className="mt-5 rounded-lg p-3 text-xs leading-relaxed"
          style={{ background: "#1e212b", border: "1px solid #2d3142", color: "#94a3b8" }}
        >
          {guia.paraQuien}
        </p>

        <ol className="mt-8 space-y-5">
          {guia.pasos.map((p, i) => (
            <li key={p.titulo} className="flex gap-3">
              <span
                className="shrink-0 flex items-center justify-center rounded-full text-xs font-bold"
                style={{ width: 26, height: 26, background: "rgba(34,197,94,0.12)", color: "#22c55e" }}
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <div className="min-w-0">
                <h2 className="font-semibold text-sm" style={{ color: "#f1f5f9" }}>
                  {p.titulo}
                </h2>
                <p className="mt-1 text-sm leading-relaxed" style={{ color: "#94a3b8" }}>
                  {p.detalle}
                </p>
              </div>
            </li>
          ))}
        </ol>

        {guia.avisos && guia.avisos.length > 0 && (
          <section className="mt-9">
            <h2 className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#64748b" }}>
              Conviene saber
            </h2>
            <ul className="mt-3 space-y-2">
              {guia.avisos.map((a) => (
                <li key={a} className="text-sm leading-relaxed pl-4 relative" style={{ color: "#94a3b8" }}>
                  <span className="absolute left-0" style={{ color: "#22c55e" }}>
                    ·
                  </span>
                  {a}
                </li>
              ))}
            </ul>
          </section>
        )}

        <div
          className="mt-10 rounded-xl p-5"
          style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.18)" }}
        >
          <p className="text-sm font-semibold" style={{ color: "#22c55e" }}>
            Para hacerlo hace falta una cuenta, y es gratis.
          </p>
          <p className="mt-1.5 text-xs leading-relaxed" style={{ color: "#94a3b8" }}>
            Sin tarjeta y sin permanencia. Puedes probarlo hoy mismo con tu CV.
          </p>
          <Link
            href="/auth/registro"
            className="inline-block mt-4 px-4 py-2 rounded-lg text-xs font-semibold"
            style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "#fff" }}
          >
            Crear cuenta gratis
          </Link>
        </div>

        {guia.siguiente && guia.siguiente.length > 0 && (
          <nav className="mt-9">
            <h2 className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#64748b" }}>
              Sigue por aquí
            </h2>
            <ul className="mt-3 space-y-2">
              {guia.siguiente.map((s) => (
                <li key={s.href}>
                  <Link href={s.href} className="text-sm" style={{ color: "#22c55e" }}>
                    {s.texto} →
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </article>

      <PublicFooter />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
