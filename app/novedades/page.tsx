/**
 * /novedades — Lo nuevo de BuscayCurra y las campañas que publicamos.
 *
 * Existe para que la web no envejezca: una página que no cambia nunca deja de
 * visitarse y Google deja de pasar por ella. Cada vez que sale una campaña o se
 * arregla algo que se nota, se añade una entrada en lib/novedades/contenido.ts
 * (ahí están las instrucciones) y aparece aquí, en el mapa del sitio y en el RSS.
 */
import type { Metadata } from "next";
import Link from "next/link";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import { ETIQUETA_TIPO, fechaEnEspanol, novedadesOrdenadas } from "@/lib/novedades/contenido";

export const metadata: Metadata = {
  title: "Novedades de BuscayCurra | BuscayCurra",
  description:
    "Lo que va cambiando en BuscayCurra: mejoras del buscador, novedades de la app y las campañas que publicamos.",
  alternates: {
    canonical: "https://buscaycurra.es/novedades",
    types: { "application/rss+xml": "https://buscaycurra.es/novedades/rss.xml" },
  },
  openGraph: {
    title: "Novedades de BuscayCurra",
    description: "Mejoras del producto y campañas, contadas según van saliendo.",
    url: "https://buscaycurra.es/novedades",
    locale: "es_ES",
    type: "website",
    siteName: "BuscayCurra",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Novedades de BuscayCurra" }],
  },
};

export default function NovedadesIndice() {
  const novedades = novedadesOrdenadas();

  return (
    <div className="min-h-screen" style={{ background: "#0f1117", color: "#f1f5f9" }}>
      <PublicHeader />

      <main className="max-w-2xl mx-auto px-4 py-10 sm:py-14">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Novedades</h1>
        <p className="mt-3 text-sm leading-relaxed" style={{ color: "#94a3b8" }}>
          Lo que va cambiando en BuscayCurra, contado según sale. También puedes seguirlo por{" "}
          <Link href="/novedades/rss.xml" style={{ color: "#22c55e" }}>
            RSS
          </Link>
          .
        </p>

        <ul className="mt-8 space-y-3">
          {novedades.map((n) => (
            <li key={n.slug}>
              <Link href={`/novedades/${n.slug}`} className="card-game p-5 block transition hover:scale-[1.01]">
                <div className="flex items-center gap-2 flex-wrap">
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
                <h2 className="mt-2 font-bold text-sm leading-snug" style={{ color: "#f1f5f9" }}>
                  {n.titulo}
                </h2>
                <p className="mt-1.5 text-xs leading-relaxed" style={{ color: "#94a3b8" }}>
                  {n.resumen}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </main>

      <PublicFooter />
    </div>
  );
}
