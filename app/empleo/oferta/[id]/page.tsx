import { createClient } from "@supabase/supabase-js";
import { Metadata } from "next";
import Link from "next/link";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data: oferta } = await supabase.from("ofertas").select("titulo, empresa, ubicacion").eq("id", id).single();
  
  if (!oferta) return { title: "Oferta no encontrada | BuscayCurra" };
  
  return {
    title: `${oferta.titulo} en ${oferta.empresa} - ${oferta.ubicacion} | BuscayCurra`,
    description: `Trabajo de ${oferta.titulo} en ${oferta.empresa}, ${oferta.ubicacion}. Envía tu CV automáticamente con IA.`,
  };
}

export default async function OfertaPublicaPage({
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
    title: oferta.titulo,
    description: oferta.descripcion?.slice(0, 5000) || oferta.titulo,
    datePosted: oferta.fecha || oferta.created_at || new Date().toISOString(),
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
            {oferta.titulo}
          </h1>
          <p className="text-base font-medium mb-4" style={{ color: "#22c55e" }}>
            {oferta.empresa}
          </p>

          <div className="flex flex-wrap gap-4 mb-5 text-sm" style={{ color: "#94a3b8" }}>
            <span>📍 {oferta.ubicacion}{oferta.provincia ? `, ${oferta.provincia}` : ""}</span>
            {oferta.salario && <span>💰 {oferta.salario}</span>}
            {oferta.fecha && (
              <span>📅 {new Date(oferta.fecha).toLocaleDateString("es-ES")}</span>
            )}
          </div>

          {oferta.descripcion && (
            <div className="mt-4 pt-4" style={{ borderTop: "1px solid #2d3142" }}>
              <h2 className="text-sm font-semibold mb-3" style={{ color: "#f1f5f9" }}>📋 Descripción</h2>
              <div className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "#94a3b8" }}>
                {oferta.descripcion}
              </div>
            </div>
          )}

          <div className="mt-6 pt-4 flex flex-wrap gap-3" style={{ borderTop: "1px solid #2d3142" }}>
            <a
              href={oferta.url}
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
