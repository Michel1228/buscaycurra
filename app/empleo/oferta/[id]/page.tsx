import { getPool } from "@/lib/db";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Search, MapPin, DollarSign, Calendar, ClipboardList } from "lucide-react";
import { empresaParaGoogle, jobPostingDe } from "@/lib/seo/job-posting";
import { servicioOficial } from "@/lib/job-search/fuente-oficial";

/** "Camarero en Bar Pepe - Bilbao", o sin la parte que falte (empresa, ciudad). */
function tituloDe(row: { title: string; company: string | null; city: string | null }): string {
  const empresa = empresaParaGoogle(row.company);
  return `${row.title}${empresa ? ` en ${empresa}` : ""}${row.city ? ` - ${row.city}` : ""}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const pool = getPool();
  const result = await pool.query(
    `SELECT "title", "company", "city", "sourceName", "expiresAt" FROM "JobListing" WHERE "id" = $1`,
    [id]
  );
  const row = result.rows[0];

  if (!row) return { title: "Oferta no encontrada | BuscayCurra" };

  // LAS OFERTAS CADUCADAS NO DEBEN ESTAR EN GOOGLE.
  //
  // Aquí no se miraba `expiresAt` en absoluto: una oferta de hace medio año
  // seguía devolviendo 200 y sin noindex, o sea que Google la indexaba y
  // mandaba gente a un puesto que ya no existe. Con 1,8 millones de ofertas
  // caducadas en la base, eso no es un despiste: es la mayor parte de lo que
  // el robots.txt le ofrece rastrear.
  //
  // follow sí, index no: los enlaces de la página siguen valiendo para que
  // Google llegue al buscador y a las páginas de país, que son las que de
  // verdad interesa posicionar.
  const caducada = row.expiresAt != null && new Date(row.expiresAt) < new Date();

  // Las de Lanbide o SEF Murcia no dicen la empresa: "X en  - Bilbao" era lo
  // que salía en Google. Se nombra solo lo que se sabe.
  const titulo = tituloDe(row);
  const oficial = servicioOficial(row.sourceName);

  return {
    title: caducada
      ? `${titulo} (oferta cerrada) | BuscayCurra`
      : `${titulo} | BuscayCurra`,
    description: caducada
      ? `Esta oferta de ${titulo} ya no está disponible. Busca ofertas parecidas en BuscayCurra.`
      : oficial
        ? `Trabajo de ${titulo}, publicada por ${oficial.nombre}. Se solicita en su web oficial.`
        : `Trabajo de ${titulo}. Envía tu CV automáticamente con IA.`,
    ...(caducada && { robots: { index: false, follow: true } }),
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
            "description", "salary", "sector", "createdAt", "expiresAt",
            "country", "province"
     FROM "JobListing" WHERE "id" = $1`,
    [id]
  );

  const row = result.rows[0];

  // UN 404 DE VERDAD, no una página que dice "no encontrada" devolviendo 200.
  // Eso es un soft 404, y Google lo trata como señal de sitio descuidado:
  // rastrea, ve contenido de error con código de éxito, y baja la confianza en
  // el resto. notFound() sirve el 404 real y la página de error del sitio.
  if (!row) notFound();

  const caducada = row.expiresAt != null && new Date(row.expiresAt) < new Date();

  // Sin empresa real no se marca como JobPosting: ver lib/seo/job-posting.ts.
  const jobPostingSchema = jobPostingDe(row);
  const empresa = empresaParaGoogle(row.company);
  // Lanbide y SEF Murcia: se solicitan en su web, no mandando el CV por correo.
  const oficial = servicioOficial(row.sourceName);

  return (
    <div className="min-h-screen" style={{ background: "#0f1117" }}>
      {jobPostingSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jobPostingSchema) }}
        />
      )}
      
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/" className="text-xs mb-6 inline-block hover:underline" style={{ color: "#64748b" }}>
          ← BuscayCurra
        </Link>

        {/* Si la oferta ya venció, se dice ANTES de que la lea entera. Llegar
            desde Google a un puesto cerrado y enterarte al final es la peor
            manera de conocer la aplicación. Se ofrece la salida útil: ofertas
            iguales que sí están abiertas. */}
        {caducada && (
          <div className="rounded-xl p-4 mb-4" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.3)" }}>
            <p className="text-sm font-semibold mb-1" style={{ color: "#f59e0b" }}>
              Esta oferta ya está cerrada
            </p>
            <p className="text-xs mb-3" style={{ color: "#94a3b8" }}>
              La empresa la retiró. Te dejamos abajo la búsqueda del mismo puesto con las que siguen abiertas.
            </p>
            <Link
              href={`/app/buscar?keyword=${encodeURIComponent(row.title || "")}&location=${encodeURIComponent(row.city || "")}`}
              className="text-xs px-4 py-2 rounded-lg font-medium inline-block"
              style={{ background: "#22c55e", color: "#0f1117" }}>
              Ver ofertas abiertas de {row.title}
            </Link>
          </div>
        )}

        <div className="rounded-xl p-6" style={{ background: "#1e212b", border: "1px solid #2d3142" }}>
          <h1 className="text-xl font-bold mb-2" style={{ color: "#f1f5f9" }}>
            {row.title}
          </h1>
          <p className="text-base font-medium mb-4" style={{ color: "#22c55e" }}>
            {empresa ?? (oficial ? `Publicada por ${oficial.nombre}` : "Empresa sin especificar")}
          </p>

          <div className="flex flex-wrap gap-4 mb-5 text-sm" style={{ color: "#94a3b8" }}>
            <span>{row.city}</span>
            {row.salary && <span>{row.salary}</span>}
            {row.createdAt && (
              <span>📅 {new Date(row.createdAt).toLocaleDateString("es-ES")}</span>
            )}
          </div>

          {row.description && (
            <div className="mt-4 pt-4" style={{ borderTop: "1px solid #2d3142" }}>
              <h2 className="text-sm font-semibold mb-3" style={{ color: "#f1f5f9" }}>Descripción</h2>
              <div className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "#94a3b8" }}>
                {row.description}
              </div>
            </div>
          )}

          <div className="mt-6 pt-4 flex flex-wrap gap-3" style={{ borderTop: "1px solid #2d3142" }}>
            <Link
              href={`/app/buscar?keyword=${encodeURIComponent(row.title || "")}&location=${encodeURIComponent(row.city || "")}`}
              className="text-sm px-5 py-2.5 rounded-lg font-medium"
              style={{ background: "transparent", color: "#64748b", border: "1px solid #2d3142" }}>
              Buscar similares en BuscayCurra
            </Link>
            {oficial && row.sourceUrl ? (
              <a
                href={row.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-game text-sm px-5 py-2.5 rounded-lg font-semibold">
                Inscribirme en {oficial.corto}
              </a>
            ) : (
              <Link
                href={`/auth/registro`}
                className="btn-game text-sm px-5 py-2.5 rounded-lg font-semibold">
                Enviar CV con IA
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
