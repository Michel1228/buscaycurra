/**
 * Página SEO: /trabajar-en — landing de guías para trabajar en el extranjero
 */
import { Metadata } from "next";
import Link from "next/link";
import { LISTA_PAISES, NUM_PAISES } from "@/lib/paises";
import PublicFooter from "@/components/PublicFooter";
import FondoOleaje from "@/components/FondoOleaje";

export const metadata: Metadata = {
  title: "Trabajar en el extranjero — Guías por país | BuscayCurra",
  description:
    `Guías completas para trabajar en el extranjero: visados, alojamiento, salarios y ofertas de empleo en ${NUM_PAISES} países. Todo lo que necesitas para emigrar.`,
  alternates: { canonical: "https://buscaycurra.es/trabajar-en" },
  openGraph: {
    title: "Trabajar en el extranjero — Guías por país | BuscayCurra",
    description:
      `Guías completas para trabajar en el extranjero: visados, alojamiento, salarios y ofertas de empleo en ${NUM_PAISES} países. Todo lo que necesitas para emigrar.`,
    url: "https://buscaycurra.es/trabajar-en",
    locale: "es_ES",
    type: "website",
    siteName: "BuscayCurra",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: `Trabajar en el extranjero — Guías por país en ${NUM_PAISES} países | BuscayCurra`,
      },
    ],
  },
};

const PAISES = LISTA_PAISES.map((pais) => ({
  codigo: pais.codigo.toLowerCase(),
  nombre: pais.nombre,
  bandera: pais.bandera,
  salario: `${pais.salarioMedio.toLocaleString("es-ES")} ${pais.simboloMoneda}`,
  ofertas: "disponibles",
}));

export default function TrabajarEnPage() {
  return (
    <div className="min-h-screen bg-[#0f1117] text-[#f1f5f9]">
      {/* El fondo de oleaje de toda la aplicación (diseño de neón, 8 nov 2026) */}
      <FondoOleaje />
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">Trabajar en el extranjero
          </h1>
          <p className="text-[#94a3b8] text-lg max-w-2xl mx-auto">
            {`Guías completas para trabajar fuera de España: requisitos de visado,
            alojamiento, salarios medios y ofertas de empleo actualizadas en ${NUM_PAISES} países.`}
          </p>
          <div className="mt-6 flex gap-3 justify-center flex-wrap">
            <Link
              href="/app/emigrar"
              className="inline-block fondo-lima px-6 py-3 rounded-full font-semibold hover:brightness-105 transition-colors"
            >Guía para emigrar →
            </Link>
            <Link
              href="/app/buscar"
              className="inline-block bg-[rgba(12,15,22,0.86)] border border-[rgba(148,163,184,0.18)] text-white px-6 py-3 rounded-lg font-medium hover:border-[#22c55e]/30 transition-colors"
            >Buscar ofertas
            </Link>
          </div>
        </div>

        {/* Grid de países */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {PAISES.map((pais) => (
            <Link
              key={pais.codigo}
              href={`/trabajar-en/${pais.codigo}`}
              className="bg-[rgba(12,15,22,0.86)] border border-[rgba(148,163,184,0.18)] rounded-xl p-5 hover:border-[#22c55e]/30 transition-all hover:bg-[#1a1d28] group"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{pais.bandera}</span>
                <h2 className="text-lg font-semibold group-hover:text-[#22c55e] transition-colors">
                  {pais.nombre}
                </h2>
              </div>
              <div className="flex gap-4 text-sm text-[#94a3b8]">
                <span>{pais.salario}/mes</span>
                <span>{pais.ofertas} ofertas</span>
              </div>
            </Link>
          ))}
        </div>

        {/* Por qué BuscayCurra */}
        <div className="text-center bg-[rgba(12,15,22,0.86)] border border-[rgba(148,163,184,0.18)] rounded-xl p-8">
          <h2 className="text-2xl font-bold mb-3">
            ¿Por qué BuscayCurra para trabajar fuera?
          </h2>
          <div className="grid sm:grid-cols-3 gap-6 mt-6 text-left">
            <div>
              <div className="text-2xl mb-2">🤖</div>
              <h3 className="font-semibold mb-1">Guzzi 24/7</h3>
              <p className="text-sm text-[#94a3b8]">
                {`IA que busca ofertas, escribe una carta para cada empresa y envía tus candidaturas en ${NUM_PAISES} países.`}
              </p>
            </div>
            <div>
              <div className="text-2xl mb-2">📋</div>
              <h3 className="font-semibold mb-1">Guías por país</h3>
              <p className="text-sm text-[#94a3b8]">
                Visados, alojamiento, au pair y programas especiales para cada destino.
              </p>
            </div>
            <div>
              <div className="text-2xl mb-2">💰</div>
              <h3 className="font-semibold mb-1">Comparador salarial</h3>
              <p className="text-sm text-[#94a3b8]">
                Compara salarios, impuestos y coste de vida entre países antes de emigrar.
              </p>
            </div>
          </div>
          <div className="mt-8">
            <Link
              href="/auth/registro"
              className="inline-block fondo-lima px-8 py-3 rounded-full font-semibold hover:brightness-105 transition-colors"
            >
              Empezar gratis →
            </Link>
          </div>
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}
