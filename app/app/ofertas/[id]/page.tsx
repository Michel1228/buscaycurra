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
            "description", "salary", "sector", "createdAt", "country",
            "contactEmail", "contactEmailConfianza"
     FROM "JobListing" WHERE "id" = $1`,
    [id]
  );

  const row = result.rows[0];

  if (!row) {
    // NO ES UN CALLEJON SIN SALIDA.
    //
    // Que una oferta desaparezca es normal y va a seguir pasando: retiramos
    // 195.217 caducadas y las empresas cierran sus procesos. El centinela midio
    // que 8 de cada 142 ofertas enlazadas desde notificaciones ya no existen.
    //
    // Pero llegar aqui desde una notificacion tuya y encontrarte un "no
    // encontrada" con un boton de volver es lo mismo que perder al usuario. Se
    // aprovecha para enseñarle algo que si puede usar.
    const alternativas = await pool.query(
      `SELECT id, title, company, city
         FROM "JobListing"
        WHERE "isActive" AND ("expiresAt" > NOW() OR "expiresAt" IS NULL)
        ORDER BY "createdAt" DESC
        LIMIT 4`
    ).catch(() => ({ rows: [] as Array<{ id: string; title: string; company: string; city: string }> }));

    return (
      <div className="max-w-3xl mx-auto px-4 pt-20 pb-10">
        <div className="text-center">
          <div className="flex justify-center mb-4"><Search size={48} strokeWidth={1.2} style={{ color: "#94a3b8" }} /></div>
          <p className="text-lg font-semibold" style={{ color: "#f1f5f9" }}>
            Esta oferta ya no está
          </p>
          <p className="text-sm mt-2" style={{ color: "#64748b" }}>
            La empresa la ha retirado o ha caducado. Pasa a menudo: las ofertas
            duran poco.
          </p>
        </div>

        {alternativas.rows.length > 0 && (
          <div className="mt-8">
            <p className="text-sm font-medium mb-3" style={{ color: "#94a3b8" }}>
              Ofertas recién publicadas
            </p>
            <div className="grid gap-2">
              {alternativas.rows.map((o) => (
                <a
                  key={o.id}
                  href={`/app/ofertas/${encodeURIComponent(o.id)}`}
                  className="rounded-xl p-4 transition hover:opacity-80"
                  style={{ background: "#1e212b", border: "1px solid #2d3142" }}>
                  <p className="text-sm font-medium" style={{ color: "#f1f5f9" }}>{o.title}</p>
                  <p className="text-xs mt-1" style={{ color: "#94a3b8" }}>
                    {o.company}{o.city ? ` · ${o.city}` : ""}
                  </p>
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="text-center">
          <a
            href="/app/buscar"
            className="mt-8 inline-block btn-game text-sm px-5 py-2.5 rounded-lg">
            Buscar otras ofertas
          </a>
        </div>
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
    email_empresa: row.contactEmail || undefined,
    email_confianza: row.contactEmailConfianza || undefined,
    sector: row.sector || "OTRO",
    fecha: row.createdAt || new Date().toISOString(),
    country: row.country || undefined,
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
