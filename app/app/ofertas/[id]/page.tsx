import { getPool } from "@/lib/db";
import OfertaDetalleClient, { type OfertaDetalle } from "./OfertaDetalleClient";
import { Search } from "lucide-react";

function generarJobPostingSchema(oferta: OfertaDetalle) {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: oferta.titulo,
    description: oferta.descripcion?.slice(0, 5000) || oferta.titulo,
    datePosted: oferta.fecha || new Date().toISOString(),
    hiringOrganization: {
      "@type": "Organization",
      name: oferta.empresa,
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: oferta.ubicacion || "España",
        addressRegion: oferta.provincia || "",
        addressCountry: "ES",
      },
    },
  };

  if (oferta.salario && oferta.salario !== "Ver en oferta") {
    const salarioNum = parseInt(oferta.salario.replace(/[^0-9]/g, ""), 10);
    if (salarioNum > 0) {
      schema.baseSalary = {
        "@type": "MonetaryAmount",
        currency: "EUR",
        value: {
          "@type": "QuantitativeValue",
          value: salarioNum,
          unitText: oferta.salario.includes("/año") || oferta.salario.includes("year") ? "YEAR"
            : oferta.salario.includes("/mes") || oferta.salario.includes("month") ? "MONTH"
            : oferta.salario.includes("/hora") || oferta.salario.includes("hour") ? "HOUR"
            : "YEAR",
        },
      };
    }
  }

  schema.employmentType = "FULL_TIME";
  return schema;
}

export default async function DetalleOfertaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const pool = getPool();
  
  // Buscar en la DB local (2M+ ofertas reales), no en Supabase (17K obsoletas)
  const result = await pool.query(
    `SELECT "id", "title", "company", "city", "sourceUrl", "sourceName", 
            "description", "salary", "sector", "createdAt"
     FROM "JobListing" WHERE "id" = $1`,
    [id]
  );

  const row = result.rows[0];

  if (!row) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="flex justify-center mb-4"><Search size={48} strokeWidth={1.2} style={{ color: "#94a3b8" }} /></div>
        <p className="text-lg font-semibold" style={{ color: "#f1f5f9" }}>
          Oferta no encontrada
        </p>
        <p className="text-sm mt-2" style={{ color: "#64748b" }}>
          Esta oferta ya no está disponible o el enlace no es válido.
        </p>
        <a
          href="/app/buscar"
          className="mt-6 inline-block btn-game text-sm px-5 py-2.5 rounded-lg">
          ← Volver a buscar
        </a>
      </div>
    );
  }

  const ofertaData: OfertaDetalle = {
    id: row.id,
    titulo: row.title || "Sin título",
    empresa: row.company || "Empresa",
    ubicacion: row.city || "España",
    provincia: undefined,
    salario: row.salary || "Ver en oferta",
    descripcion: row.description || "",
    fuente: row.sourceName || "Desconocida",
    url: row.sourceUrl || "",
    email_empresa: undefined,
    sector: row.sector || "OTRO",
    fecha: row.createdAt || new Date().toISOString(),
  };

  const jobPostingSchema = generarJobPostingSchema(ofertaData);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jobPostingSchema) }}
      />
      <OfertaDetalleClient oferta={ofertaData} />
    </>
  );
}
