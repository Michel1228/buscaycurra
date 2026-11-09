/**
 * Página SEO: /empleo — landing de búsqueda de empleo
 * Muestra puestos y ciudades populares con enlaces a búsquedas.
 */
import { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import FondoOleaje from "@/components/FondoOleaje";

export const metadata: Metadata = {
  title: "Ofertas de empleo en España | BuscayCurra",
  description:
    "Encuentra trabajo en España con BuscayCurra. Busca ofertas de empleo por puesto y ciudad. Miles de ofertas activas actualizadas a diario.",
  alternates: { canonical: "https://buscaycurra.es/empleo" },
  openGraph: {
    title: "Ofertas de empleo en España | BuscayCurra",
    description:
      "Encuentra trabajo en España con BuscayCurra. Busca ofertas de empleo por puesto y ciudad. Miles de ofertas activas actualizadas a diario.",
    url: "https://buscaycurra.es/empleo",
    locale: "es_ES",
    type: "website",
    siteName: "BuscayCurra",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Ofertas de empleo en España | BuscayCurra",
      },
    ],
  },
};

const PUESTOS_POPULARES = [
  "camarero", "cocinero", "limpieza", "conductor", "electricista",
  "dependiente", "programador", "enfermero", "administrativo", "mecanico",
  "albanil", "almacen", "soldador", "fontanero", "peluquero",
  "cuidador", "operario", "repartidor", "cajero", "vendedor",
];

const CIUDADES_POPULARES = [
  "madrid", "barcelona", "valencia", "sevilla", "malaga",
  "zaragoza", "murcia", "bilbao", "alicante", "cordoba",
  "valladolid", "vigo", "gijon", "granada", "pamplona",
];

export default function EmpleoPage() {
  return (
    <div className="min-h-screen bg-[#0f1117] text-[#f1f5f9]">
      {/* El fondo de oleaje de toda la aplicación (diseño de neón, 8 nov 2026) */}
      <FondoOleaje />
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">
            Encuentra trabajo en España
          </h1>
          <p className="text-[#94a3b8] text-lg max-w-2xl mx-auto">
            Miles de ofertas de empleo activas actualizadas a diario.
            Busca por puesto y ciudad o deja que nuestra IA Guzzi trabaje por ti.
          </p>
          <div className="mt-6">
            <Link
              href="/app/buscar"
              className="inline-flex items-center gap-2 fondo-lima px-6 py-3 rounded-full font-semibold hover:brightness-105 transition-colors"
            >
              <Search size={16} />Buscar ofertas ahora
            </Link>
          </div>
        </div>

        {/* Puestos populares */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4">Puestos más buscados</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {PUESTOS_POPULARES.map((puesto) => (
              <Link
                key={puesto}
                href={`/empleo/${puesto}/madrid`}
                className="bg-[rgba(12,15,22,0.86)] border border-[rgba(148,163,184,0.18)] rounded-lg px-4 py-3 hover:border-[#22c55e]/30 transition-colors text-sm"
              >
                {puesto.charAt(0).toUpperCase() + puesto.slice(1)}
              </Link>
            ))}
          </div>
        </section>

        {/* Ciudades populares */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4">
            Ciudades con más ofertas
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {CIUDADES_POPULARES.map((ciudad) => (
              <Link
                key={ciudad}
                href={`/empleo/camarero/${ciudad}`}
                className="bg-[rgba(12,15,22,0.86)] border border-[rgba(148,163,184,0.18)] rounded-lg px-4 py-3 hover:border-[#22c55e]/30 transition-colors text-sm"
              >
                {ciudad.charAt(0).toUpperCase() + ciudad.slice(1).replace(/-/g, " ")}
              </Link>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="text-center bg-[rgba(12,15,22,0.86)] border border-[rgba(148,163,184,0.18)] rounded-xl p-8">
          <h2 className="text-2xl font-bold mb-3">
            ¿Buscas trabajo activamente?
          </h2>
          <p className="text-[#94a3b8] mb-6 max-w-lg mx-auto">
            Guzzi, nuestra IA, busca ofertas por ti, escribe una carta para cada empresa
            y envía tus candidaturas. Tú solo apareces a la entrevista.
          </p>
          <Link
            href="/auth/registro"
            className="inline-block fondo-lima px-6 py-3 rounded-full font-semibold hover:brightness-105 transition-colors"
          >
            Probar Guzzi gratis →
          </Link>
        </div>
      </div>
    </div>
  );
}
