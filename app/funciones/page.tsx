/**
 * /funciones — Todo lo que hace BuscayCurra, en una página.
 *
 * Estática y pública. La portada vende la idea; esto es la lista entera para
 * quien se lo está pensando y para quien llega buscando una cosa concreta
 * ("comparador de salarios", "simulador de entrevista").
 */
import type { Metadata } from "next";
import Link from "next/link";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import { GRUPOS_FUNCIONES, NUM_FUNCIONES } from "@/lib/funciones";

export const metadata: Metadata = {
  title: `Todo lo que hace BuscayCurra: ${NUM_FUNCIONES} funciones | BuscayCurra`,
  description:
    "Enviar el CV a empresas sin oferta publicada, ETTs cerca de ti, buscador de empleo en 26 países, revisión ATS del CV, simulador de entrevista, comparador de salarios y guías por país.",
  alternates: { canonical: "https://buscaycurra.es/funciones" },
  openGraph: {
    title: "Todo lo que hace BuscayCurra",
    description:
      "La lista completa: envíos de CV, ETTs, buscador en 26 países, CV con revisión ATS, entrevistas y salarios.",
    url: "https://buscaycurra.es/funciones",
    locale: "es_ES",
    type: "website",
    siteName: "BuscayCurra",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Funciones de BuscayCurra" }],
  },
};

export default function FuncionesPage() {
  return (
    <div className="min-h-screen" style={{ background: "#0f1117", color: "#f1f5f9" }}>
      <PublicHeader />

      <main className="max-w-3xl mx-auto px-4 py-10 sm:py-14">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Todo lo que hace BuscayCurra
        </h1>
        <p className="mt-3 text-sm leading-relaxed" style={{ color: "#94a3b8" }}>
          {NUM_FUNCIONES} cosas que puedes hacer con una cuenta gratuita o de pago. Cada una está
          en la aplicación hoy: si algo se retira, desaparece de esta lista el mismo día.
        </p>

        <div className="mt-10 space-y-10">
          {GRUPOS_FUNCIONES.map((grupo) => (
            <section key={grupo.titulo}>
              <h2 className="text-lg font-bold tracking-tight">{grupo.titulo}</h2>
              <p className="mt-1 text-xs leading-relaxed" style={{ color: "#64748b" }}>
                {grupo.resumen}
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {grupo.funciones.map((f) => (
                  <div key={f.titulo} className="card-game p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-sm" style={{ color: "#f1f5f9" }}>
                        {f.titulo}
                      </h3>
                      {f.dePago && (
                        <span
                          className="shrink-0 text-[10px] px-1.5 py-0.5 rounded"
                          style={{ background: "rgba(245,158,11,0.10)", color: "#f59e0b" }}
                        >
                          De pago
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed" style={{ color: "#94a3b8" }}>
                      {f.descripcion}
                    </p>
                    {f.guia && (
                      <Link href={f.guia} className="mt-2.5 inline-block text-[11px]" style={{ color: "#22c55e" }}>
                        Cómo se usa →
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <section
          className="mt-12 rounded-xl p-5"
          style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.18)" }}
        >
          <h2 className="font-bold text-sm" style={{ color: "#22c55e" }}>
            Lo que cuesta
          </h2>
          <p className="mt-2 text-xs leading-relaxed" style={{ color: "#94a3b8" }}>
            La cuenta gratuita no caduca y permite mandar CV todos los días. Los planes de pago
            empiezan en 2,99 € al mes, sin permanencia, y lo que suben sobre todo es cuántos
            envíos puedes hacer.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/auth/registro"
              className="px-4 py-2 rounded-lg text-xs font-semibold"
              style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "#fff" }}
            >
              Empezar gratis
            </Link>
            <Link
              href="/precios"
              className="px-4 py-2 rounded-lg text-xs font-semibold"
              style={{ background: "#1e212b", border: "1px solid #2d3142", color: "#94a3b8" }}
            >
              Ver precios
            </Link>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
