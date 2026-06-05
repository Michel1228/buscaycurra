/**
 * Página SEO: /trabajar-en — landing de guías para trabajar en el extranjero
 */
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Trabajar en el extranjero — Guías por país | BuscayCurra",
  description:
    "Guías completas para trabajar en el extranjero: visados, alojamiento, salarios y ofertas de empleo en 18 países. Todo lo que necesitas para emigrar.",
  alternates: { canonical: "https://buscaycurra.es/trabajar-en" },
};

const PAISES = [
  { codigo: "es", nombre: "España", bandera: "🇪🇸", salario: "2.100 €", ofertas: "80.000+" },
  { codigo: "de", nombre: "Alemania", bandera: "🇩🇪", salario: "3.700 €", ofertas: "150.000+" },
  { codigo: "fr", nombre: "Francia", bandera: "🇫🇷", salario: "2.900 €", ofertas: "12.000+" },
  { codigo: "uk", nombre: "Reino Unido", bandera: "🇬🇧", salario: "2.800 £", ofertas: "32.000+" },
  { codigo: "it", nombre: "Italia", bandera: "🇮🇹", salario: "2.100 €", ofertas: "8.700+" },
  { codigo: "nl", nombre: "Países Bajos", bandera: "🇳🇱", salario: "3.300 €", ofertas: "8.300+" },
  { codigo: "pt", nombre: "Portugal", bandera: "🇵🇹", salario: "1.500 €", ofertas: "3.100+" },
  { codigo: "ie", nombre: "Irlanda", bandera: "🇮🇪", salario: "3.400 €", ofertas: "7.900+" },
  { codigo: "be", nombre: "Bélgica", bandera: "🇧🇪", salario: "3.100 €", ofertas: "3.500+" },
  { codigo: "at", nombre: "Austria", bandera: "🇦🇹", salario: "2.900 €", ofertas: "1.700+" },
  { codigo: "se", nombre: "Suecia", bandera: "🇸🇪", salario: "3.100 €", ofertas: "2.600+" },
  { codigo: "dk", nombre: "Dinamarca", bandera: "🇩🇰", salario: "3.500 €", ofertas: "900+" },
  { codigo: "fi", nombre: "Finlandia", bandera: "🇫🇮", salario: "3.000 €", ofertas: "--" },
  { codigo: "no", nombre: "Noruega", bandera: "🇳🇴", salario: "3.800 €", ofertas: "500+" },
  { codigo: "pl", nombre: "Polonia", bandera: "🇵🇱", salario: "1.600 €", ofertas: "3.600+" },
  { codigo: "ch", nombre: "Suiza", bandera: "🇨🇭", salario: "5.500 CHF", ofertas: "900+" },
  { codigo: "us", nombre: "Estados Unidos", bandera: "🇺🇸", salario: "4.200 $", ofertas: "48.000+" },
  { codigo: "au", nombre: "Australia", bandera: "🇦🇺", salario: "4.800 A$", ofertas: "19.000+" },
];

export default function TrabajarEnPage() {
  return (
    <div className="min-h-screen bg-[#0f1117] text-[#f1f5f9]">
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">
            🌍 Trabajar en el extranjero
          </h1>
          <p className="text-[#94a3b8] text-lg max-w-2xl mx-auto">
            Guías completas para trabajar fuera de España: requisitos de visado,
            alojamiento, salarios medios y ofertas de empleo actualizadas en 18 países.
          </p>
          <div className="mt-6 flex gap-3 justify-center flex-wrap">
            <Link
              href="/app/emigrar"
              className="inline-block bg-[#22c55e] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#16a34a] transition-colors"
            >
              🌍 Guía para emigrar →
            </Link>
            <Link
              href="/app/buscar"
              className="inline-block bg-[#1e212b] border border-[#2d3142] text-white px-6 py-3 rounded-lg font-medium hover:border-[#22c55e]/30 transition-colors"
            >
              🔍 Buscar ofertas
            </Link>
          </div>
        </div>

        {/* Grid de países */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {PAISES.map((pais) => (
            <Link
              key={pais.codigo}
              href={`/trabajar-en/${pais.codigo}`}
              className="bg-[#1e212b] border border-[#2d3142] rounded-xl p-5 hover:border-[#22c55e]/30 transition-all hover:bg-[#1a1d28] group"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{pais.bandera}</span>
                <h2 className="text-lg font-semibold group-hover:text-[#22c55e] transition-colors">
                  {pais.nombre}
                </h2>
              </div>
              <div className="flex gap-4 text-sm text-[#94a3b8]">
                <span>💰 {pais.salario}/mes</span>
                <span>📋 {pais.ofertas} ofertas</span>
              </div>
            </Link>
          ))}
        </div>

        {/* Por qué BuscayCurra */}
        <div className="text-center bg-[#1e212b] border border-[#2d3142] rounded-xl p-8">
          <h2 className="text-2xl font-bold mb-3">
            ¿Por qué BuscayCurra para trabajar fuera?
          </h2>
          <div className="grid sm:grid-cols-3 gap-6 mt-6 text-left">
            <div>
              <div className="text-2xl mb-2">🤖</div>
              <h3 className="font-semibold mb-1">Guzzi 24/7</h3>
              <p className="text-sm text-[#94a3b8]">
                IA que busca ofertas, adapta tu CV y envía candidaturas automáticamente en 20+ países.
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
              className="inline-block bg-[#22c55e] text-white px-8 py-3 rounded-lg font-medium hover:bg-[#16a34a] transition-colors"
            >
              🐛 Empezar gratis →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
