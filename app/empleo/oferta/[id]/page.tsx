import { getPool } from "@/lib/db";
import { Metadata } from "next";
import Link from "next/link";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const pool = getPool();
  const result = await pool.query(
    `SELECT "title", "company", "city" FROM "JobListing" WHERE "id" = $1`,
    [id]
  );
  const row = result.rows[0];
  
  if (!row) return { title: "Oferta no encontrada | BuscayCurra" };
  
  return {
    title: `${row.title} en ${row.company} - ${row.city} | BuscayCurra`,
    description: `Trabajo de ${row.title} en ${row.company}, ${row.city}. Envía tu CV automáticamente con IA.`,
  };
}

export default async function OfertaPublicaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pool = getPool();

  const result = await pool.query(
    `SELECT "id", "title", "company", "city", "sourceUrl", "sourceName",
            "description", "salary", "sector", "createdAt"
     FROM "JobListing" WHERE "id" = $1`,
    [id]
  );

  const row = result.rows[0];

  if (!row) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0f1117" }}>
        <div className="text-center">
          <p className="text-4xl mb-4">🔍</p>
          <p className="text-lg font-semibold" style={{ color: "#f1f5f9" }}>Oferta no encontrada</p>
          <Link href="/" className="mt-4 inline-block text-sm" style={{ color: "#22c55e" }}>← Ir a BuscayCurra</Link>
        </div>
      </div>
    );
  }

  const jobPostingSchema = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: row.title,
    description: row.description?.slice(0, 5000) || row.title,
    datePosted: row.createdAt || new Date().toISOString(),
    hiringOrganization: {
      "@type": "Organization",
      name: row.company,
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: row.city || "España",
        addressRegion: "",
        addressCountry: "ES",
      },
    },
  };

  return (
    <div className="min-h-screen" style={{ background: "#0f1117" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jobPostingSchema) }}
      />
      
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/" className="text-xs mb-6 inline-block hover:underline" style={{ color: "#64748b" }}>
          ← BuscayCurra
        </Link>

        <div className="rounded-xl p-6" style={{ background: "#1e212b", border: "1px solid #2d3142" }}>
          <h1 className="text-xl font-bold mb-2" style={{ color: "#f1f5f9" }}>
            {row.title}
          </h1>
          <p className="text-base font-medium mb-4" style={{ color: "#22c55e" }}>
            {row.company}
          </p>

          <div className="flex flex-wrap gap-4 mb-5 text-sm" style={{ color: "#94a3b8" }}>
            <span>📍 {row.city}</span>
            {row.salary && <span>💰 {row.salary}</span>}
            {row.createdAt && (
              <span>📅 {new Date(row.createdAt).toLocaleDateString("es-ES")}</span>
            )}
          </div>

          {row.description && (
            <div className="mt-4 pt-4" style={{ borderTop: "1px solid #2d3142" }}>
              <h2 className="text-sm font-semibold mb-3" style={{ color: "#f1f5f9" }}>📋 Descripción</h2>
              <div className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "#94a3b8" }}>
                {row.description}
              </div>
            </div>
          )}

          <div className="mt-6 pt-4 flex flex-wrap gap-3" style={{ borderTop: "1px solid #2d3142" }}>
            <a
              href={row.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm px-5 py-2.5 rounded-lg font-medium"
              style={{ background: "transparent", color: "#64748b", border: "1px solid #2d3142" }}>
              Ver oferta original →
            </a>
            <Link
              href={`/auth/registro`}
              className="btn-game text-sm px-5 py-2.5 rounded-lg font-semibold">
              🐛 Enviar CV con IA
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
