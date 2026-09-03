/**
 * Página SEO dinámica: /empleo/[puesto]/[ciudad]
 * Genera miles de páginas indexables para Google.
 * Ejemplo: /empleo/camarero/madrid
 */

import { Metadata } from "next";
import { getPool } from "@/lib/db";
import Link from "next/link";
import { DollarSign, Search } from "lucide-react";

// ─── Lista de puestos populares para pre-renderizar ─────────────────────────
const PUESTOS_POPULARES = [
  "camarero", "cocinero", "limpieza", "conductor", "electricista",
  "dependiente", "programador", "enfermero", "administrativo", "mecanico",
  "albanil", "almacen", "soldador", "fontanero", "peluquero",
  "cuidador", "operario", "repartidor", "cajero", "vendedor",
  "auxiliar", "mozo", "camarera", "recepcionista", "chofer",
  "peón", "encargado", "gerente", "diseñador", "analista",
];

const CIUDADES_POPULARES = [
  "madrid", "barcelona", "valencia", "sevilla", "malaga",
  "zaragoza", "murcia", "palma", "las-palmas", "bilbao",
  "alicante", "cordoba", "valladolid", "vigo", "gijon",
  "hospitalet", "vitoria", "la-coruna", "granada", "elche",
  "oviedo", "badalona", "cartagena", "terrassa", "jerez",
  "sabadell", "mostoles", "alcalá", "pamplona", "fuenlabrada",
];

// POR QUE ESTA PAGINA TARDA, Y DONDE ESTA EL TIEMPO DE VERDAD.
//
// Medido, no supuesto. Generar una de estas cuesta unos 8,5 segundos, y la
// primera sospecha —el `description ILIKE`, que obliga a mirar el texto entero
// del anuncio— resulto ser FALSA. Con EXPLAIN ANALYZE contra produccion:
//
//   contar con puesto y ciudad ......  492 ms
//   listar 50 con puesto y ciudad ...  598 ms
//   contar solo por ciudad ..........  526 ms   (respaldo)
//   listar 50 solo por ciudad .......  475 ms   (respaldo)
//
// O sea unos 2 segundos de base de datos como mucho, y usando indices. Los
// otros 6,5 son Next.js montando la pagina por primera vez, en un servidor con
// el 85% de la CPU robada por el hipervisor. Un indice sobre `description` no
// habria arreglado nada: el problema no estaba ahi.
//
// Asi que lo que se hace es quitar ese coste del camino del usuario:
//
//   · Las combinaciones que de verdad traen visitas se generan AL COMPILAR, de
//     modo que quien llega se encuentra el HTML hecho. Son 80, no las 900
//     posibles: 900 serian media hora de compilacion.
//   · El resto se sigue generando bajo demanda la primera vez (dynamicParams).
//   · Y una vez generada, un dia de cache. Sin revalidate se quedaban
//     congeladas hasta el siguiente despliegue, ensenando ofertas de hace meses
//     bajo un titulo que dice "N ofertas encontradas".
export const revalidate = 86400;
export const dynamicParams = true;
export function generateStaticParams() {
  // Producto cruzado de los diez puestos y las ocho ciudades con mas busquedas.
  // El trafico de este tipo de paginas se concentra muchisimo en la cabeza, asi
  // que cubrir ochenta combinaciones cubre casi todas las visitas reales.
  const puestos = PUESTOS_POPULARES.slice(0, 10);
  const ciudades = CIUDADES_POPULARES.slice(0, 8);
  return puestos.flatMap(puesto => ciudades.map(ciudad => ({ puesto, ciudad })));
}

// ─── Metadata dinámica ──────────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ puesto: string; ciudad: string }>;
}): Promise<Metadata> {
  const { puesto, ciudad } = await params;
  const puestoFmt = decodeURIComponent(puesto).replace(/-/g, " ");
  const ciudadFmt = decodeURIComponent(ciudad).replace(/-/g, " ");

  const titulo = `Empleo de ${puestoFmt} en ${ciudadFmt} | BuscayCurra`;
  const descripcion = `Encuentra trabajo de ${puestoFmt} en ${ciudadFmt}. Miles de ofertas actualizadas. Envía tu CV automáticamente con IA.`;

  return {
    title: titulo,
    description: descripcion,
    keywords: [`${puestoFmt} ${ciudadFmt}`, "empleo", "trabajo", ciudadFmt, puestoFmt],
    openGraph: {
      title: titulo,
      description: descripcion,
      locale: "es_ES",
      type: "website",
    },
    alternates: {
      canonical: `https://buscaycurra.es/empleo/${puesto}/${ciudad}`,
    },
  };
}

// ─── Página principal ───────────────────────────────────────────────────────
export default async function EmpleoPage({
  params,
}: {
  params: Promise<{ puesto: string; ciudad: string }>;
}) {
  const { puesto, ciudad } = await params;
  const puestoFmt = decodeURIComponent(puesto).replace(/-/g, " ");
  const ciudadFmt = decodeURIComponent(ciudad).replace(/-/g, " ");

  // Buscar ofertas en la BD
  let ofertas: Array<{
    id: string;
    title: string;
    company: string;
    city: string;
    salary: string;
    description: string;
    sourceUrl: string;
  }> = [];
  let total = 0;

  try {
    const pool = getPool();
    const kw = `%${puestoFmt}%`;
    const loc = `%${ciudadFmt}%`;

    // Contar y listar son independientes: no hace falta esperar a que termine
    // una para lanzar la otra. Iban en fila y cada una tarda medio segundo, asi
    // que solo por ponerlas en paralelo se ahorra medio segundo en cada
    // generacion. Lo mismo abajo con las de respaldo.
    const [countRes, result] = await Promise.all([
      pool.query(
        `SELECT COUNT(*) FROM "JobListing" WHERE "isActive" = true AND (title ILIKE $1 OR description ILIKE $1) AND (city ILIKE $2 OR province ILIKE $2)`,
        [kw, loc]
      ),
      pool.query(
        `SELECT id, title, company, city, salary, description, "sourceUrl"
         FROM "JobListing"
         WHERE "isActive" = true AND (title ILIKE $1 OR description ILIKE $1) AND (city ILIKE $2 OR province ILIKE $2)
         ORDER BY "scrapedAt" DESC
         LIMIT 50`,
        [kw, loc]
      ),
    ]);
    total = parseInt(countRes.rows[0].count);
    ofertas = result.rows;

    // Si no hay resultados, mostrar todas las ofertas de esa ciudad
    if (ofertas.length === 0) {
      const [fallbackResult, fallbackCount] = await Promise.all([
        pool.query(
          `SELECT id, title, company, city, salary, description, "sourceUrl"
           FROM "JobListing"
           WHERE "isActive" = true AND (city ILIKE $1 OR province ILIKE $1)
           ORDER BY "scrapedAt" DESC
           LIMIT 50`,
          [loc]
        ),
        pool.query(
          `SELECT COUNT(*) FROM "JobListing" WHERE "isActive" = true AND (city ILIKE $1 OR province ILIKE $1)`,
          [loc]
        ),
      ]);
      ofertas = fallbackResult.rows;
      total = parseInt(fallbackCount.rows[0].count);
    }
  } catch (e) {
    console.error("[EmpleoPage] Error:", (e as Error).message);
  }

  // Puestos relacionados
  const puestosRelacionados = [
    "camarero", "cocinero", "limpieza", "conductor", "electricista",
    "dependiente", "programador", "enfermero", "administrativo",
  ].filter(p => p !== puesto).slice(0, 6);

  // Ciudades cercanas
  const ciudadesCercanas = [
    "madrid", "barcelona", "valencia", "sevilla", "zaragoza",
    "bilbao", "malaga", "murcia", "valladolid", "alicante",
  ].filter(c => c !== ciudad).slice(0, 6);

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg, #0f1a0a, #1a1a12)" }}>
      {/* Header SEO */}
      <div className="py-12 px-4" style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.18)" }}>
        <div className="max-w-4xl mx-auto">
          <nav className="text-xs mb-4" style={{ color: "#64748b" }}>
            <Link href="/">Inicio</Link> → <Link href="/app/buscar">Empleo</Link> → {puestoFmt} → {ciudadFmt}
          </nav>
          <h1 className="text-3xl md:text-4xl font-bold mb-3" style={{ color: "#22c55e" }}>
            Trabajo de {puestoFmt} en {ciudadFmt}
          </h1>
          <p className="text-base" style={{ color: "#94a3b8" }}>
            {total.toLocaleString("es-ES")} ofertas encontradas. 
            Encuentra tu próximo empleo con BuscayCurra.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* CTA principal */}
        <div className="card-game p-6 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-bold text-lg" style={{ color: "#f1f5f9" }}>
              ¿Quieres que Guzzi busque por ti?
            </p>
            <p className="text-sm" style={{ color: "#64748b" }}>
              Envía tu CV automáticamente a empresas de {ciudadFmt}
            </p>
          </div>
          <Link href={`/app/buscar?keyword=${encodeURIComponent(puestoFmt)}&location=${encodeURIComponent(ciudadFmt)}`}
            className="btn-game whitespace-nowrap">
            Buscar con Guzzi →
          </Link>
        </div>

        {/* Ofertas */}
        {ofertas.length > 0 ? (
          <div className="space-y-4 mb-10">
            <h2 className="text-xl font-bold" style={{ color: "#f1f5f9" }}>
              Ofertas destacadas
            </h2>
            {ofertas.map((o) => (
              <div key={o.id} className="card-game p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm" style={{ color: "#f1f5f9" }}>{o.title}</h3>
                    <p className="text-xs mt-1" style={{ color: "#94a3b8" }}>{o.company || "Empresa"} · {o.city}</p>
                    {o.salary && (
                      <p className="text-xs font-semibold mt-1 flex items-center gap-1" style={{ color: "#22c55e" }}><DollarSign size={11} />{o.salary}</p>
                    )}
                    {o.description && (
                      <p className="text-xs mt-2 line-clamp-2" style={{ color: "#64748b" }}>{o.description.slice(0, 150)}...</p>
                    )}
                  </div>
                  <Link href={`/app/buscar?keyword=${encodeURIComponent(puestoFmt)}&location=${encodeURIComponent(ciudadFmt)}`}
                    className="shrink-0 px-4 py-2 rounded-xl text-xs font-semibold transition hover:opacity-80"
                    style={{ background: "linear-gradient(135deg, #22c55e, #5cb848)", color: "#1a1a12" }}>
                    Buscar ahora
                  </Link>
                </div>
              </div>
            ))}
            <div className="text-center py-4">
              <Link href={`/app/buscar?keyword=${encodeURIComponent(puestoFmt)}&location=${encodeURIComponent(ciudadFmt)}`}
                className="btn-game-outline">
                Ver todas las ofertas →
              </Link>
            </div>
          </div>
        ) : (
          <div className="card-game p-10 text-center mb-10">
            <Search size={40} className="mx-auto mb-3" style={{ color: "#64748b" }} />
            <p className="font-semibold" style={{ color: "#f1f5f9" }}>No hay ofertas en este momento</p>
            <p className="text-sm mt-1" style={{ color: "#64748b" }}>
              Prueba con términos similares o deja que Guzzi busque por ti
            </p>
            <Link href={`/app/buscar?keyword=${encodeURIComponent(puestoFmt)}&location=${encodeURIComponent(ciudadFmt)}`}
              className="btn-game inline-block mt-4">
              Buscar con Guzzi
            </Link>
          </div>
        )}

        {/* Puestos relacionados */}
        <div className="mb-8">
          <h3 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: "#64748b" }}>
            Empleos similares en {ciudadFmt}
          </h3>
          <div className="flex flex-wrap gap-2">
            {puestosRelacionados.map(p => (
              <Link key={p} href={`/empleo/${p}/${ciudad}`}
                className="px-3 py-1.5 rounded-lg text-xs transition hover:opacity-80"
                style={{ background: "rgba(126,213,111,0.08)", border: "1px solid rgba(126,213,111,0.15)", color: "#22c55e" }}>
                {p} en {ciudadFmt}
              </Link>
            ))}
          </div>
        </div>

        {/* Ciudades cercanas */}
        <div className="mb-8">
          <h3 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: "#64748b" }}>
            {puestoFmt} en otras ciudades
          </h3>
          <div className="flex flex-wrap gap-2">
            {ciudadesCercanas.map(c => (
              <Link key={c} href={`/empleo/${puesto}/${c}`}
                className="px-3 py-1.5 rounded-lg text-xs transition hover:opacity-80"
                style={{ background: "rgba(240,192,64,0.08)", border: "1px solid rgba(240,192,64,0.15)", color: "#f0c040" }}>
                {puestoFmt} en {c.replace(/-/g, " ")}
              </Link>
            ))}
          </div>
        </div>

        {/* FAQ Schema para SEO */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": `¿Cuánto gana un ${puestoFmt} en ${ciudadFmt}?`,
              "acceptedAnswer": {
                "@type": "Answer",
                "text": `El salario de un ${puestoFmt} en ${ciudadFmt} varía según experiencia y empresa. Consulta las ofertas activas en BuscayCurra para ver rangos actualizados.`
              }
            },
            {
              "@type": "Question",
              "name": `¿Dónde encontrar trabajo de ${puestoFmt} en ${ciudadFmt}?`,
              "acceptedAnswer": {
                "@type": "Answer",
                "text": `En BuscayCurra encontrarás miles de ofertas de ${puestoFmt} en ${ciudadFmt}. Nuestro asistente Guzzi puede enviar tu CV automáticamente a las empresas.`
              }
            }
          ]
        })}} />
      </div>
    </div>
  );
}
