/**
 * Página SEO país+keyword: /trabajar-en/[pais]/[keyword]
 * Ejemplos: /trabajar-en/alemania/programador → ofertas de programador en Alemania
 *           /trabajar-en/francia/camarero → ofertas de camarero en Francia
 */
import { Metadata } from "next";
import { getPool } from "@/lib/db";
import { PAISES, LISTA_PAISES, SLUG_A_CODIGO, formatearSalario } from "@/lib/paises";
import Link from "next/link";
import FondoOleaje from "@/components/FondoOleaje";

interface Props {
  params: Promise<{ pais: string; keyword: string }>;
}

// MISMA LECCION QUE LA PORTADA, QUE YA LA APRENDIO EN SU DIA.
//
// Esto era force-dynamic: cada visita ejecutaba un COUNT sobre "JobListing"
// (2,3 millones de filas). Medido con EXPLAIN ANALYZE para Alemania: 1,5 s solo
// la consulta, leyendo 177.559 buffers, con el bitmap desbordado a modo lossy y
// recomprobando 1.098.986 filas para contar 397.616. Con el 85% de CPU robada
// que tiene este servidor, la pagina tardaba 15 SEGUNDOS en responder en frio.
//
// Y son 52 paginas asi (26 paises por slug y por codigo), todas publicas y
// todas de las que llegan por Google. La portada ya paso por esto: force-dynamic
// le daba 5-16 s y pantalla negra al arrancar en iOS, que costo un rechazo de
// Apple (2.1a).
//
// El recuento de ofertas de un pais no necesita estar al segundo: es una cifra
// de escaparate. Con revalidate se sirve de cache y se recalcula solo una vez
// por hora.
export const revalidate = 3600;

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
      // Minúsculas ANTES de codificar: "b%C3%BCrokaufmann".toLowerCase() daba
      // "b%c3%bc…", distinta de la del mapa del sitio (22 oct 2026).
      canonical: `https://buscaycurra.es/trabajar-en/${paisParam.toLowerCase()}/${encodeURIComponent(decodeURIComponent(keyword).toLowerCase())}`,
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

  // OFERTAS DEL PAÍS POR TÍTULO, CON ÍNDICE.
  //
  // Antes el país se deducía con "fuente EURES del país O alguna de sus diez
  // ciudades" y el oficio se buscaba también en la descripción. Con esos OR
  // ningún índice servía: se recorría la tabla hasta los 15 s del límite y la
  // página daba error 500. Comprobado el 30 sep 2026 en 11 de 60 URLs del mapa
  // del sitio, y son 156 de sus 196 URLs: lo que Google venía a rastrear se
  // encontraba roto. Ahora la columna country (con índice) y el título (índice
  // trigram): entre 0,1 y 0,7 s. Y si la base falla, la página sale sin
  // ofertas en vez de con un error.
  let ofertas: Array<{ id: string; title: string; company: string; city: string; salary: string; sourceUrl: string; sourceName: string; createdAt: Date }> = [];
  try {
    const result = await getPool().query(
      `SELECT "id", "title", "company", "city", "salary", "sourceUrl", "sourceName", "createdAt"
       FROM "JobListing"
       WHERE "isActive" = true
         AND LOWER(country) = $1
         AND "title" ILIKE $2
       ORDER BY "createdAt" DESC
       LIMIT 20`,
      [codigo.toLowerCase(), `%${keywordFmt}%`]
    );
    ofertas = result.rows;
  } catch (e) {
    console.error(`[trabajar-en] ${codigo}/${keywordFmt}:`, (e as Error).message);
  }

  // Países alternativos para hreflang
  const hreflangTags = LISTA_PAISES.map((p) => ({
    codigo: p.codigo.toLowerCase(),
    idioma: p.idioma,
    url: `https://buscaycurra.es/trabajar-en/${p.codigo.toLowerCase()}/${encodeURIComponent(decodeURIComponent(keyword).toLowerCase())}`,
  }));

  return (
    <main style={{ background: "#0f1117", color: "#f1f5f9" }} className="min-h-screen">
      {/* El fondo de oleaje de toda la aplicación (diseño de neón, 8 nov 2026) */}
      <FondoOleaje />
      {/* hreflang tags */}
      {hreflangTags.map((h) => (
        <link key={h.codigo} rel="alternate" hrefLang={h.idioma} href={h.url} />
      ))}

      {/* Hero */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
        <span className="text-4xl mb-3 block">{pais.bandera}</span>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-3">
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
          style={{ background: "linear-gradient(180deg, #d9f99d, #a3e635 55%, #84cc16)", color: "#0b1406" }}
        >Buscar ofertas de {keywordFmt} en {pais.nombre}
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
                style={{ background: "rgba(12,15,22,0.86)", border: "1px solid rgba(148,163,184,0.18)" }}
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
                    <span>{oferta.city || pais.nombre}</span>
                    {oferta.salary && <span>{oferta.salary}</span>}
                    {oferta.createdAt && (
                      <span>📅 {new Date(oferta.createdAt).toLocaleDateString("es-ES")}</span>
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
              style={{ background: "rgba(12,15,22,0.86)", border: "1px solid rgba(148,163,184,0.18)" }}
            >
              <p className="text-xl font-bold" style={{ color: "#22c55e" }}>{stat.value}</p>
              <p className="text-xs mt-1" style={{ color: "#8b98ad" }}>{stat.label}</p>
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
                  background: "rgba(12,15,22,0.86)",
                  border: "1px solid rgba(148,163,184,0.18)",
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
              href={`/trabajar-en/${p.codigo.toLowerCase()}/${encodeURIComponent(decodeURIComponent(keyword).toLowerCase())}`}
              className="rounded-lg px-4 py-2.5 text-sm flex items-center gap-2 transition-colors"
              style={{
                background: "rgba(12,15,22,0.86)",
                border: "1px solid rgba(148,163,184,0.18)",
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
