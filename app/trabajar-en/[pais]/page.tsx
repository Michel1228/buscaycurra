import { Metadata } from "next";
import { PAISES, LISTA_PAISES, SLUG_A_CODIGO, formatearSalario, convertirSalario } from "@/lib/paises";
import { getPool } from "@/lib/db";
import { getPrimerosPasos } from "@/lib/primeros-pasos";
import Link from "next/link";

export const dynamic = "force-dynamic";

// Países con hreflang para inyectar en <head>
function HreflangTags({ currentCode, path }: { currentCode: string; path: string }) {
  return (
    <>
      {LISTA_PAISES.map((p) => (
        <link
          key={p.codigo}
          rel="alternate"
          hrefLang={p.idioma}
          href={`https://buscaycurra.es/${path}${p.codigo.toLowerCase()}`}
        />
      ))}
      <link rel="alternate" hrefLang="x-default" href={`https://buscaycurra.es/${path}`} />
    </>
  );
}

interface Props {
  params: Promise<{ pais: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { pais: paisParam } = await params;
  // Primero buscar por slug (ej: "estados-unidos"), luego por código (ej: "us")
  const codigo = SLUG_A_CODIGO[paisParam.toLowerCase()] || paisParam.toUpperCase();
  const pais = PAISES[codigo];
  if (!pais) return { title: "País no encontrado — BuscayCurra" };

  return {
    title: `Trabajar en ${pais.nombre} — Ofertas de empleo para españoles ${pais.bandera}`,
    description: `Encuentra trabajo en ${pais.nombre}. ${pais.salarioMedio.toLocaleString()} ${pais.simboloMoneda}/mes de media. Ofertas en ${pais.ciudades.slice(0, 3).join(", ")}. BuscayCurra te ayuda a encontrar empleo en ${pais.nombreLocal}.`,
    openGraph: {
      title: `Trabajar en ${pais.nombre} 🇪🇺 — BuscayCurra`,
      description: `Salario medio: ${formatearSalario(pais.salarioMedio, codigo)}/mes. Ofertas en ${pais.ciudades.slice(0, 4).join(", ")}.`,
    },
  };
}

export async function generateStaticParams() {
  // Generar URLs con slug amigable (ej: /trabajar-en/estados-unidos)
  // y con código ISO (ej: /trabajar-en/us) para compatibilidad
  const slugs = LISTA_PAISES.map((p) => ({ pais: p.slug }));
  const codes = LISTA_PAISES.map((p) => ({ pais: p.codigo.toLowerCase() }));
  return [...slugs, ...codes];
}

export default async function TrabajarEnPaisPage({ params }: Props) {
  const { pais: paisParam } = await params;
  // Primero buscar por slug (ej: "estados-unidos"), luego por código (ej: "us")
  const codigo = SLUG_A_CODIGO[paisParam.toLowerCase()] || paisParam.toUpperCase();
  const pais = PAISES[codigo];

  // Obtener ofertas reales de este país de la BD
  let totalOfertas = 0;
  try {
    const pool = getPool();
    const countRes = await pool.query(
      `SELECT COUNT(*) FROM "JobListing" WHERE "isActive" = true AND "country" = $1`,
      [codigo]
    );
    totalOfertas = parseInt(countRes.rows[0].count);
  } catch (err) { console.error("[trabajar-en] Error DB:", (err as Error).message); }

  const primerosPasos = getPrimerosPasos(codigo);

  if (!pais) {
    return (
      <main className="min-h-screen bg-[#0f1117] flex items-center justify-center">
        <p className="text-white text-lg">País no encontrado</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0f1117] text-[#f1f5f9]">
      <HreflangTags currentCode={codigo} path="trabajar-en/" />
      {/* Hero */}
      <section className="relative py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
        <span className="text-5xl mb-4 block">{pais.bandera}</span>
        <h1 className="text-3xl sm:text-4xl font-bold mb-3">
          Trabajar en {pais.nombre}
        </h1>
        <p className="text-lg text-[#94a3b8] max-w-2xl mx-auto">
          Encuentra ofertas de empleo en {pais.nombreLocal} con BuscayCurra.
          Miles de ofertas actualizadas para hispanohablantes que quieren trabajar en Europa.
        </p>
        <Link
          href={`/app/buscar?pais=${codigo}`}
          className="inline-block mt-6 px-6 py-3 bg-[#22c55e] hover:bg-[#1ea34d] text-black font-semibold rounded-xl transition-colors"
        >
          🔍 Buscar ofertas en {pais.nombre}
        </Link>
      </section>

      {/* Stats */}
      <section className="py-12 px-4 sm:px-6 max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#1a1d2e] border border-[#2d3142] rounded-xl p-5 text-center">
            <p className="text-2xl font-bold text-[#22c55e]">{totalOfertas.toLocaleString()}</p>
            <p className="text-xs text-[#64748b] mt-1">Ofertas activas</p>
          </div>
          <div className="bg-[#1a1d2e] border border-[#2d3142] rounded-xl p-5 text-center">
            <p className="text-2xl font-bold text-[#22c55e]">{formatearSalario(pais.salarioMedio, codigo)}</p>
            <p className="text-xs text-[#64748b] mt-1">Salario medio/mes</p>
          </div>
          <div className="bg-[#1a1d2e] border border-[#2d3142] rounded-xl p-5 text-center">
            <p className="text-2xl font-bold text-[#22c55e]">{pais.moneda}</p>
            <p className="text-xs text-[#64748b] mt-1">Moneda local</p>
          </div>
          <div className="bg-[#1a1d2e] border border-[#2d3142] rounded-xl p-5 text-center">
            <p className="text-2xl font-bold text-[#22c55e]">{pais.ciudades.length}</p>
            <p className="text-xs text-[#64748b] mt-1">Ciudades principales</p>
          </div>
        </div>
      </section>

      {/* Ciudades */}
      <section className="py-10 px-4 sm:px-6 max-w-5xl mx-auto">
        <h2 className="text-xl font-bold mb-4">Principales ciudades</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {pais.ciudades.map((ciudad) => (
            <Link
              key={ciudad}
              href={`/app/buscar?ubicacion=${encodeURIComponent(ciudad)}&pais=${codigo}`}
              className="bg-[#1e212b] border border-[#2d3142] hover:border-[#22c55e]/40 rounded-lg px-4 py-3 text-sm text-[#e2e8f0] transition-colors"
            >
              📍 {ciudad}
            </Link>
          ))}
        </div>
      </section>

      {/* Keywords laborales */}
      <section className="py-10 px-4 sm:px-6 max-w-5xl mx-auto">
        <h2 className="text-xl font-bold mb-4">Búsquedas más demandadas</h2>
        <div className="flex flex-wrap gap-2">
          {pais.keywordsLaborales.map((kw) => (
            <Link
              key={kw}
              href={`/app/buscar?keyword=${encodeURIComponent(kw)}&pais=${codigo}`}
              className="bg-[#1e212b] border border-[#2d3142] hover:border-[#22c55e]/40 rounded-full px-4 py-1.5 text-sm text-[#94a3b8] transition-colors"
            >
              {kw}
            </Link>
          ))}
        </div>
      </section>

      {/* Ventajas de BuscayCurra para trabajar en Europa */}
      <section className="py-12 px-4 sm:px-6 max-w-5xl mx-auto">
        <h2 className="text-xl font-bold mb-6">Por qué usar BuscayCurra para trabajar en Europa</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { icon: "🤖", title: "Agente 24/7", desc: "Guzzi busca y envía tus CVs automáticamente a ofertas en toda Europa mientras duermes." },
            { icon: "📧", title: "Envío masivo", desc: "Envía tu CV a decenas de ofertas en un solo click. Sin formularios repetitivos." },
            { icon: "🌍", title: "19 países", desc: "Ofertas en España, EEUU, Canadá, Australia, Reino Unido, Alemania, Suiza y +12 países más." },
            { icon: "💬", title: "Guzzi multilingüe", desc: "Tu asistente habla español y te ayuda con ofertas en cualquier idioma europeo." },
            { icon: "💰", title: "Comparador de salarios", desc: `Calcula tu sueldo neto en cada país con la calculadora de impuestos.` },
            { icon: "📊", title: "Skill Gap Analysis", desc: "Compara tu CV con los requisitos de la oferta y recibe recomendaciones." },
          ].map((item) => (
            <div key={item.title} className="bg-[#1a1d2e] border border-[#2d3142] rounded-xl p-5 flex gap-4">
              <span className="text-2xl flex-shrink-0">{item.icon}</span>
              <div>
                <h3 className="font-semibold text-[#e2e8f0]">{item.title}</h3>
                <p className="text-sm text-[#94a3b8] mt-1">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Primeros pasos en el país */}
      {primerosPasos && (
        <section className="py-12 px-4 sm:px-6 max-w-5xl mx-auto border-t border-[#2d3142]">
          <h2 className="text-xl font-bold mb-2">📦 Primeros pasos en {pais.nombre}</h2>
          <p className="text-sm text-[#94a3b8] mb-8">Todo lo que necesitas saber para aterrizar: au pair, alojamiento y visados.</p>

          <div className="grid sm:grid-cols-2 gap-6">
            {/* Au Pair */}
            {primerosPasos.auPair.disponible && (
              <div className="bg-[#1a1d2e] border border-[#2d3142] rounded-xl p-6">
                <h3 className="font-semibold text-[#e2e8f0] mb-3 flex items-center gap-2">
                  <span className="text-xl">🧒</span> Programa Au Pair
                </h3>
                <p className="text-sm text-[#94a3b8] mb-3">{primerosPasos.auPair.requisitos}</p>
                <div className="space-y-1.5">
                  {primerosPasos.auPair.plataformas.map((p) => (
                    <a key={p.nombre} href={p.url} target="_blank" rel="noopener"
                      className="block text-sm text-[#22c55e] hover:underline">
                      {p.nombre} → {p.descripcion}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Alojamiento */}
            <div className="bg-[#1a1d2e] border border-[#2d3142] rounded-xl p-6">
              <h3 className="font-semibold text-[#e2e8f0] mb-3 flex items-center gap-2">
                <span className="text-xl">🏠</span> Alojamiento temporal
              </h3>
              <div className="space-y-1.5 mb-3">
                {primerosPasos.alojamiento.plataformas.map((p) => (
                  <a key={p.nombre} href={p.url} target="_blank" rel="noopener"
                    className="block text-sm text-[#22c55e] hover:underline">
                    {p.nombre} → {p.descripcion}
                  </a>
                ))}
              </div>
              <p className="text-xs text-[#64748b] mt-3 border-t border-[#2d3142] pt-3">💡 {primerosPasos.alojamiento.consejo}</p>
            </div>

            {/* Visado */}
            <div className="bg-[#1a1d2e] border border-[#2d3142] rounded-xl p-6 sm:col-span-2">
              <h3 className="font-semibold text-[#e2e8f0] mb-3 flex items-center gap-2">
                <span className="text-xl">📋</span> Requisitos legales
              </h3>
              <p className="text-sm text-[#94a3b8] mb-3">{primerosPasos.visado.descripcion}</p>
              {primerosPasos.visado.enlaceOficial && (
                <a href={primerosPasos.visado.enlaceOficial} target="_blank" rel="noopener"
                  className="text-sm text-[#22c55e] hover:underline">
                  → Web oficial de inmigración
                </a>
              )}
            </div>

            {/* Programas extra */}
            {primerosPasos.programasExtra && primerosPasos.programasExtra.length > 0 && (
              <div className="bg-[#1a1d2e] border border-[#2d3142] rounded-xl p-6 sm:col-span-2">
                <h3 className="font-semibold text-[#e2e8f0] mb-3 flex items-center gap-2">
                  <span className="text-xl">🌟</span> Otros programas
                </h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {primerosPasos.programasExtra.map((p) => (
                    <a key={p.nombre} href={p.url} target="_blank" rel="noopener"
                      className="bg-[#252839] rounded-lg p-3 hover:border-[#22c55e]/30 border border-transparent transition-colors">
                      <span className="text-sm font-medium text-[#e2e8f0] block">{p.nombre}</span>
                      <span className="text-xs text-[#94a3b8]">{p.descripcion}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Otros países */}
      <section className="py-12 px-4 sm:px-6 max-w-5xl mx-auto border-t border-[#2d3142]">
        <h2 className="text-xl font-bold mb-4">También puedes trabajar en...</h2>
        <div className="flex flex-wrap gap-3">
          {LISTA_PAISES.filter((p) => p.codigo !== codigo).map((p) => (
            <Link
              key={p.codigo}
              href={`/trabajar-en/${p.codigo.toLowerCase()}`}
              className="bg-[#1e212b] border border-[#2d3142] hover:border-[#22c55e]/40 rounded-lg px-4 py-2.5 text-sm transition-colors flex items-center gap-2"
            >
              <span>{p.bandera}</span>
              <span className="text-[#e2e8f0]">{p.nombre}</span>
              <span className="text-[#64748b] text-xs">{p.simboloMoneda}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="py-12 px-4 sm:px-6 max-w-3xl mx-auto text-center">
        <div className="bg-gradient-to-r from-[#22c55e]/10 to-[#0ea5e9]/10 border border-[#22c55e]/20 rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-3">
            ¿Listo para trabajar en {pais.nombre}? {pais.bandera}
          </h2>
          <p className="text-[#94a3b8] mb-6">
            Regístrate gratis en BuscayCurra, sube tu CV y deja que Guzzi 🐛 encuentre las mejores ofertas para ti en {pais.nombreLocal}.
          </p>
          <Link
            href="/auth/registro"
            className="inline-block px-8 py-3 bg-[#22c55e] hover:bg-[#1ea34d] text-black font-bold rounded-xl transition-colors"
          >
            🚀 Crear cuenta gratis
          </Link>
        </div>
      </section>
    </main>
  );
}
