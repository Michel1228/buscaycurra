/**
 * Página SEO país+keyword: /trabajar-en/[pais]/[keyword]
 * Ejemplos: /trabajar-en/alemania/programador → ofertas de programador en Alemania
 *           /trabajar-en/francia/camarero → ofertas de camarero en Francia
 */
import { Metadata } from "next";
import { getPool } from "@/lib/db";
import { PAISES, LISTA_PAISES, SLUG_A_CODIGO, formatearSalario } from "@/lib/paises";
import Link from "next/link";
import { Search, MapPin, Banknote, CalendarDays } from "lucide-react";

interface Props {
  params: Promise<{ pais: string; keyword: string }>;
}

export const dynamic = "force-dynamic";

// ─── Keywords populares por país ───────────────────────────────────────────
const POPULAR_KEYWORDS: Record<string, string[]> = {
  ES: ["programador", "camarero", "enfermero", "administrativo", "dependiente", "conductor", "electricista", "mecanico"],
  DE: ["programador", "enfermero", "ingeniero", "camarero", "mecanico", "electricista", "conductor", "dependiente"],
  FR: ["programador", "camarero", "enfermero", "ingeniero", "mecanico", "dependiente", "conductor", "electricista"],
  IT: ["programador", "camarero", "enfermero", "mecanico", "dependiente", "ingeniero", "conductor", "electricista"],
  PT: ["programador", "camarero", "enfermero", "dependiente", "mecanico", "conductor", "electricista", "ingeniero"],
  NL: ["programador", "ingeniero", "enfermero", "camarero", "conductor", "mecanico", "dependiente", "electricista"],
  BE: ["programador", "enfermero", "ingeniero", "camarero", "mecanico", "conductor", "dependiente", "electricista"],
  AT: ["programador", "camarero", "enfermero", "mecanico", "ingeniero", "dependiente", "conductor", "electricista"],
  CH: ["programador", "enfermero", "ingeniero", "camarero", "mecanico", "dependiente", "conductor", "electricista"],
  SE: ["programador", "enfermero", "ingeniero", "camarero", "mecanico", "conductor", "dependiente", "electricista"],
  DK: ["programador", "enfermero", "ingeniero", "camarero", "mecanico", "conductor", "electricista", "dependiente"],
  NO: ["programador", "enfermero", "ingeniero", "camarero", "mecanico", "conductor", "electricista", "dependiente"],
  PL: ["programador", "enfermero", "ingeniero", "camarero", "mecanico", "conductor", "dependiente", "electricista"],
  IE: ["programador", "enfermero", "ingeniero", "camarero", "dependiente", "conductor", "mecanico", "electricista"],
  FI: ["programador", "enfermero", "ingeniero", "camarero", "mecanico", "conductor", "electricista", "dependiente"],
};

// ─── Construir cláusula WHERE por país ─────────────────────────────────────
function buildCountryFilter(codigo: string): { sourceFilter: string; cityFilter: string; params: string[] } {
  const pais = PAISES[codigo];
  if (!pais) return { sourceFilter: "FALSE", cityFilter: "FALSE", params: [] };

  const sourceParam = `EURES_${codigo}`;
  const cityParams = pais.ciudades.slice(0, 10);
  const placeholders = cityParams.map((_, i) => `$${i + 2}`);

  return {
    sourceFilter: `"sourceName" = $1`,
    cityFilter: `"city" ILIKE ANY(ARRAY[${placeholders.map(p => `${p} || '%'`).join(", ")}])`,
    params: [sourceParam, ...cityParams],
  };
}

// ─── Metadata ──────────────────────────────────────────────────────────────
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { pais: paisParam, keyword } = await params;
  const codigo = SLUG_A_CODIGO[paisParam.toLowerCase()] || paisParam.toUpperCase();
  const pais = PAISES[codigo];
  const keywordFmt = decodeURIComponent(keyword).replace(/-/g, " ");
  const keywordCapitalized = keywordFmt.charAt(0).toUpperCase() + keywordFmt.slice(1);

  if (!pais) return { title: "País no encontrado — BuscayCurra" };

  const title = `Trabajo de ${keywordFmt} en ${pais.nombre} ${pais.bandera} — BuscayCurra`;
  const description = `Encuentra ofertas de empleo de ${keywordFmt} en ${pais.nombreLocal}. Miles de ofertas actualizadas. Salario medio: ${formatearSalario(pais.salarioMedio, codigo)}/mes. Envía tu CV con IA.`;

  return {
    title,
    description,
    keywords: [`trabajar de ${keywordFmt} en ${pais.nombre}`, `empleo ${keywordFmt} ${pais.nombre}`, keywordFmt, pais.nombre],
    openGraph: {
      title,
      description,
      type: "website",
    },
    alternates: {
      canonical: `https://buscaycurra.es/trabajar-en/${paisParam.toLowerCase()}/${keyword.toLowerCase()}`,
    },
  };
}

// ─── Página ────────────────────────────────────────────────────────────────
export default async function TrabajarEnKeywordPage({ params }: Props) {
  const { pais: paisParam, keyword } = await params;
  const codigo = SLUG_A_CODIGO[paisParam.toLowerCase()] || paisParam.toUpperCase();
  const pais = PAISES[codigo];

  if (!pais) {
    return (
      <main style={{ background: "#0f1117" }} className="min-h-screen flex items-center justify-center">
        <p style={{ color: "#f1f5f9" }} className="text-lg">País no encontrado</p>
      </main>
    );
  }

  const keywordFmt = decodeURIComponent(keyword).replace(/-/g, " ");
  const keywordCapitalized = keywordFmt.charAt(0).toUpperCase() + keywordFmt.slice(1);

  const pool = getPool();
  const { sourceFilter, cityFilter, params: filterParams } = buildCountryFilter(codigo);

  // Buscar ofertas reales filtrando por país (EURES + ciudades) y keyword
  const query = `
    SELECT "id", "title", "company", "city", "salary", "sourceUrl", "sourceName", "createdAt"
    FROM "JobListing"
    WHERE "isActive" = true
      AND (${sourceFilter} OR ${cityFilter})
      AND ("title" ILIKE $${filterParams.length + 1} OR "description" ILIKE $${filterParams.length + 1})
    ORDER BY "createdAt" DESC
    LIMIT 20
  `;

  const allParams = [...filterParams, `%${keywordFmt}%`];
  const result = await pool.query(query, allParams);
  const ofertas = result.rows;

  // Países alternativos para hreflang
  const hreflangTags = LISTA_PAISES.map((p) => ({
    codigo: p.codigo.toLowerCase(),
    idioma: p.idioma,
    url: `https://buscaycurra.es/trabajar-en/${p.codigo.toLowerCase()}/${keyword.toLowerCase()}`,
  }));

  return (
    <main style={{ background: "#0f1117", color: "#f1f5f9" }} className="min-h-screen">
      {/* hreflang tags */}
      {hreflangTags.map((h) => (
        <link key={h.codigo} rel="alternate" hrefLang={h.idioma} href={h.url} />
      ))}

      {/* Hero */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
        <span className="text-4xl mb-3 block">{pais.bandera}</span>
        <h1 className="text-3xl sm:text-4xl font-bold mb-3">
          Trabajo de {keywordCapitalized} en {pais.nombre}
        </h1>
        <p className="text-lg" style={{ color: "#94a3b8", maxWidth: "42rem", margin: "0 auto" }}>
          {ofertas.length > 0
            ? `${ofertas.length}+ ofertas activas de ${keywordFmt} en ${pais.nombreLocal}. Salario medio: ${formatearSalario(pais.salarioMedio, codigo)}/mes.`
            : `Encuentra ofertas de ${keywordFmt} en ${pais.nombreLocal}. BuscayCurra te conecta con empresas europeas. Salario medio: ${formatearSalario(pais.salarioMedio, codigo)}/mes.`
          }
        </p>
        <Link
          href={`/app/buscar?keyword=${encodeURIComponent(keywordFmt)}&pais=${codigo}`}
          className="inline-block mt-6 px-6 py-3 rounded-xl font-semibold transition-colors"
          style={{ background: "#22c55e", color: "#000" }}
        >
          <Search size={14} className="inline mr-1.5" />Buscar ofertas de {keywordFmt} en {pais.nombre}
        </Link>
      </section>

      {/* Ofertas reales */}
      {ofertas.length > 0 && (
        <section className="py-8 px-4 sm:px-6 max-w-5xl mx-auto">
          <h2 className="text-xl font-bold mb-4">
            Ofertas de {keywordCapitalized} en {pais.nombre} {pais.bandera}
          </h2>
          <div className="space-y-3">
            {ofertas.map((oferta: any) => (
              <Link
                key={oferta.id}
                href={`/empleo/oferta/${oferta.id}`}
                className="block rounded-xl p-4 transition-colors hover:border-[#22c55e]/40"
                style={{ background: "#1e212b", border: "1px solid #2d3142" }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h3 className="font-semibold" style={{ color: "#f1f5f9" }}>
                      {oferta.title || keywordCapitalized}
                    </h3>
                    <p style={{ color: "#22c55e" }} className="text-sm font-medium">
                      {oferta.company || "Empresa"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs" style={{ color: "#94a3b8" }}>
                    <span className="flex items-center gap-1"><MapPin size={11} strokeWidth={1.8} />{oferta.city || pais.nombre}</span>
                    {oferta.salary && <span className="flex items-center gap-1"><Banknote size={11} strokeWidth={1.8} />{oferta.salary}</span>}
                    {oferta.createdAt && (
                      <span className="flex items-center gap-1"><CalendarDays size={11} strokeWidth={1.8} />{new Date(oferta.createdAt).toLocaleDateString("es-ES")}</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Stats del país */}
      <section className="py-10 px-4 sm:px-6 max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Salario mínimo", value: formatearSalario(pais.salarioMinimo, codigo) },
            { label: "Salario medio", value: formatearSalario(pais.salarioMedio, codigo) },
            { label: "Moneda", value: `${pais.simboloMoneda} ${pais.moneda}` },
            { label: "Ciudades", value: String(pais.ciudades.length) },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl p-4 text-center"
              style={{ background: "#1a1d2e", border: "1px solid #2d3142" }}
            >
              <p className="text-xl font-bold" style={{ color: "#22c55e" }}>{stat.value}</p>
              <p className="text-xs mt-1" style={{ color: "#64748b" }}>{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Otras keywords populares en este país */}
      <section className="py-10 px-4 sm:px-6 max-w-5xl mx-auto">
        <h2 className="text-xl font-bold mb-4">Más empleos en {pais.nombre}</h2>
        <div className="flex flex-wrap gap-2">
          {(POPULAR_KEYWORDS[codigo] || POPULAR_KEYWORDS["ES"])
            .filter((kw) => kw !== keywordFmt.toLowerCase())
            .map((kw) => (
              <Link
                key={kw}
                href={`/trabajar-en/${paisParam.toLowerCase()}/${kw}`}
                className="rounded-full px-4 py-1.5 text-sm transition-colors"
                style={{
                  background: "#1e212b",
                  border: "1px solid #2d3142",
                  color: "#94a3b8",
                }}
              >
                {kw}
              </Link>
            ))}
        </div>
      </section>

      {/* Otros países para esta keyword */}
      <section className="py-10 px-4 sm:px-6 max-w-5xl mx-auto border-t" style={{ borderColor: "#2d3142" }}>
        <h2 className="text-xl font-bold mb-4">
          Trabajo de {keywordCapitalized} en otros países
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {LISTA_PAISES.filter((p) => p.codigo !== codigo).map((p) => (
            <Link
              key={p.codigo}
              href={`/trabajar-en/${p.codigo.toLowerCase()}/${keyword.toLowerCase()}`}
              className="rounded-lg px-4 py-2.5 text-sm flex items-center gap-2 transition-colors"
              style={{
                background: "#1e212b",
                border: "1px solid #2d3142",
                color: "#e2e8f0",
              }}
            >
              <span>{p.bandera}</span>
              <span>{p.nombre}</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
