import { createClient } from "@supabase/supabase-js";
import OfertaDetalleClient, { type OfertaDetalle } from "./OfertaDetalleClient";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

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

  // Salario si existe
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

  // Employment type
  schema.employmentType = "FULL_TIME";

  return schema;
}

export default async function DetalleOfertaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: oferta } = await supabase
    .from("ofertas")
    .select("*")
    .eq("id", id)
    .single();

  if (!oferta) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-4xl mb-4">🔍</p>
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
    id: oferta.id,
    titulo: oferta.titulo,
    empresa: oferta.empresa,
    ubicacion: oferta.ubicacion,
    provincia: oferta.provincia,
    salario: oferta.salario,
    descripcion: oferta.descripcion,
    fuente: oferta.fuente,
    url: oferta.url,
    email_empresa: oferta.email_empresa,
    sector: oferta.sector,
    fecha: oferta.fecha,
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
