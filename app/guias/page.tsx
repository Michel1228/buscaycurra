/**
 * /guias — Índice de las guías de uso. La puerta de entrada de la web oficial.
 *
 * Pública y estática: la gente que busca "cómo mandar el currículum a una
 * empresa" o "ETTs en Tudela" no tiene cuenta todavía, así que esto no puede
 * vivir detrás del login como el centro de ayuda de /app/ayuda.
 */
import type { Metadata } from "next";
import Link from "next/link";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import { GUIAS } from "@/lib/guias/contenido";
import { IconoGuia } from "@/components/guias/IconoGuia";

export const metadata: Metadata = {
  title: "Guías de uso de BuscayCurra: cómo sacarle partido | BuscayCurra",
  description:
    "Cómo mandar tu CV a una empresa que no ha publicado oferta, encontrar las ETTs de tu zona aunque vivas en un pueblo, preparar el CV y buscar trabajo fuera. Paso a paso.",
  alternates: { canonical: "https://buscaycurra.es/guias" },
  openGraph: {
    title: "Guías de BuscayCurra",
    description:
      "Paso a paso para mandar el CV a empresas, encontrar ETTs cerca de ti y preparar tu candidatura.",
    url: "https://buscaycurra.es/guias",
    locale: "es_ES",
    type: "website",
    siteName: "BuscayCurra",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Guías de BuscayCurra" }],
  },
};

export default function GuiasIndice() {
  return (
    <div className="min-h-screen" style={{ background: "#0f1117", color: "#f1f5f9" }}>
      <PublicHeader />

      <main className="max-w-3xl mx-auto px-4 py-10 sm:py-14">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Guías de BuscayCurra
        </h1>
        <p className="mt-3 text-sm leading-relaxed" style={{ color: "#94a3b8" }}>
          Lo que hace la aplicación y cómo se usa, explicado paso a paso. Sin cuenta y sin
          rodeos: si solo vas a leer una, que sea la de{" "}
          <Link href="/guias/enviar-cv-a-empresas" style={{ color: "#22c55e" }}>
            mandar el CV a una empresa
          </Link>
          , que es lo que más puestos consigue.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {GUIAS.map((g) => (
            <Link
              key={g.slug}
              href={`/guias/${g.slug}`}
              className="card-game p-5 transition hover:scale-[1.01]"
              style={{ display: "block" }}
            >
              <div className="flex items-start gap-3">
                <IconoGuia nombre={g.icono} />
                <div className="min-w-0">
                  <h2 className="font-bold text-sm leading-snug" style={{ color: "#f1f5f9" }}>
                    {g.titulo}
                  </h2>
                  <p className="mt-1.5 text-xs leading-relaxed" style={{ color: "#94a3b8" }}>
                    {g.resumen}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <section
          className="mt-10 rounded-xl p-5"
          style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.18)" }}
        >
          <h2 className="font-bold text-sm" style={{ color: "#22c55e" }}>
            ¿Por dónde empiezo?
          </h2>
          <p className="mt-2 text-xs leading-relaxed" style={{ color: "#94a3b8" }}>
            Crea la cuenta (es gratis y sin tarjeta), sube tu CV una vez y manda los tres
            primeros envíos del día a empresas de tu zona. Eso ya te pone por delante de
            quien solo contesta ofertas publicadas.
          </p>
          <Link
            href="/auth/registro"
            className="inline-block mt-4 px-4 py-2 rounded-lg text-xs font-semibold"
            style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "#fff" }}
          >
            Empezar gratis
          </Link>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
