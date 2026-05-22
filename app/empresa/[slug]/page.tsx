/**
 * Página pública de empresa — Company Profile (estilo Welcome to the Jungle)
 * /empresa/[slug] — Accesible sin login. SEO optimizado.
 * Muestra: cultura, ofertas activas, datos, reviews.
 */

import { Metadata } from "next";
import { getPool } from "@/lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const nombre = decodeURIComponent(slug).replace(/-/g, " ");
  return {
    title: `${nombre} — Ofertas de empleo | BuscayCurra`,
    description: `Trabaja en ${nombre}. Descubre su cultura, ofertas activas y opiniones de empleados. Envía tu CV con IA.`,
    openGraph: { title: `${nombre} — Ofertas de empleo`, locale: "es_ES", type: "website" },
  };
}

export default async function EmpresaPage({ params }: Props) {
  const { slug } = await params;
  const nombre = decodeURIComponent(slug).replace(/-/g, " ");
  
  const pool = getPool();
  
  // Ofertas activas de esta empresa
  const { rows: ofertas } = await pool.query(
    `SELECT id, title, city, salary, description, "sourceUrl", "scrapedAt"
     FROM "JobListing"
     WHERE "isActive" = true AND company ILIKE $1
     ORDER BY "scrapedAt" DESC LIMIT 20`,
    [`%${nombre}%`]
  );
  
  // Stats
  const { rows: [stats] } = await pool.query(
    `SELECT COUNT(*) as total, COUNT(DISTINCT city) as ciudades
     FROM "JobListing"
     WHERE "isActive" = true AND company ILIKE $1`,
    [`%${nombre}%`]
  );
  
  // Ciudades donde contrata
  const { rows: ciudades } = await pool.query(
    `SELECT city, COUNT(*) as n FROM "JobListing"
     WHERE "isActive" = true AND company ILIKE $1 AND city != ''
     GROUP BY city ORDER BY n DESC LIMIT 8`,
    [`%${nombre}%`]
  );
  
  // Salarios
  const { rows: [salario] } = await pool.query(
    `SELECT 
       COUNT(CASE WHEN salary ~ '[0-9]' THEN 1 END) as con_salario,
       AVG(CASE WHEN salary ~ '[0-9]+' THEN (regexp_match(salary, '[0-9]+(?:[.,][0-9]+)?'))[1]::numeric ELSE NULL END) as media
     FROM "JobListing"
     WHERE "isActive" = true AND company ILIKE $1`,
    [`%${nombre}%`]
  );
  
  const total = parseInt(stats?.total || "0");
  const numCiudades = parseInt(stats?.ciudades || "0");
  const salarioMedio = salario?.media ? Math.round(Number(salario.media)) : null;

  return (
    <div className="min-h-screen" style={{ background: "#0f1117" }}>
      {/* Header */}
      <div className="py-16 px-4" style={{ background: "linear-gradient(135deg, #1a1d28, #0f1117)" }}>
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4"
            style={{ background: "linear-gradient(135deg, rgba(34,197,94,0.15), rgba(59,130,246,0.15))", border: "1px solid rgba(34,197,94,0.2)" }}>
            🏢
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3" style={{ color: "#f1f5f9" }}>
            {nombre}
          </h1>
          <p className="text-sm" style={{ color: "#94a3b8" }}>
            {total} ofertas activas · {numCiudades} ciudades · 
            {salarioMedio ? ` Salario medio ~${salarioMedio}€` : " Salario no publicado"}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Ofertas activas", value: total.toLocaleString("es-ES"), icon: "📋" },
            { label: "Ciudades", value: numCiudades.toString(), icon: "📍" },
            { label: "Salario medio", value: salarioMedio ? `${salarioMedio}€` : "—", icon: "💰" },
            { label: "Ofertas con salario", value: salario?.con_salario || "0", icon: "📊" },
          ].map(s => (
            <div key={s.label} className="p-4 rounded-xl text-center" style={{ background: "#161922", border: "1px solid #252836" }}>
              <p className="text-2xl mb-1">{s.icon}</p>
              <p className="text-lg font-bold" style={{ color: "#f1f5f9" }}>{s.value}</p>
              <p className="text-[10px]" style={{ color: "#64748b" }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Ciudades */}
        {ciudades.length > 0 && (
          <div className="p-5 rounded-xl" style={{ background: "#161922", border: "1px solid #252836" }}>
            <h2 className="text-sm font-semibold mb-3" style={{ color: "#f1f5f9" }}>📍 Ciudades donde contrata</h2>
            <div className="flex flex-wrap gap-2">
              {ciudades.map((c: any) => (
                <span key={c.city} className="px-3 py-1.5 rounded-lg text-xs"
                  style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.12)", color: "#22c55e" }}>
                  {c.city} ({c.n})
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Ofertas */}
        <div>
          <h2 className="text-lg font-bold mb-4" style={{ color: "#f1f5f9" }}>
            💼 Ofertas de empleo en {nombre}
          </h2>
          {ofertas.length > 0 ? (
            <div className="space-y-3">
              {ofertas.map((o: any) => (
                <Link key={o.id} href={`/empleo/oferta/${o.id}`}
                  className="block p-4 rounded-xl transition hover:opacity-90"
                  style={{ background: "#161922", border: "1px solid #252836" }}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm" style={{ color: "#f1f5f9" }}>{o.title}</h3>
                      <p className="text-xs mt-1" style={{ color: "#94a3b8" }}>📍 {o.city || "Varias"}</p>
                      {o.salary && <p className="text-xs font-medium mt-1" style={{ color: "#22c55e" }}>💰 {o.salary}</p>}
                    </div>
                    <span className="text-xs px-3 py-1.5 rounded-lg flex-shrink-0"
                      style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e" }}>
                      Ver →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-10 text-center rounded-xl" style={{ background: "#161922", border: "1px solid #252836" }}>
              <p className="text-3xl mb-2">🔍</p>
              <p className="text-sm" style={{ color: "#64748b" }}>No hay ofertas activas ahora. Vuelve pronto.</p>
            </div>
          )}
        </div>

        {/* JobPosting Schema */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": nombre,
          "description": `${nombre} — ${total} ofertas de empleo activas en BuscayCurra`,
          "url": `https://buscaycurra.es/empresa/${slug}`,
          "numberOfEmployees": { "@type": "QuantitativeValue", "value": total > 100 ? "101-500" : "1-100" }
        })}} />
      </div>
    </div>
  );
}
