/**
 * Perfil público del candidato — Estilo Instaffo
 * /talento/[id] — Visible para empresas y recruiters
 */

import { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Candidato — BuscayCurra Talent`,
    description: "Perfil profesional en BuscayCurra. Conecta con empresas que buscan tu talento.",
    robots: "noindex",
  };
}

export default async function TalentoPage({ params }: Props) {
  const { id } = await params;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: cv } = await supabase
    .from("cvs")
    .select("nombre_completo, titulo, experiencia, educacion, habilidades, idiomas, ciudad, visibilidad_publica")
    .eq("user_id", id)
    .single();

  if (!cv || !cv.visibilidad_publica) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0f1117" }}>
        <div className="text-center p-10">
          <p className="text-5xl mb-4">🔒</p>
          <h1 className="text-xl font-bold mb-2" style={{ color: "#f1f5f9" }}>Perfil no disponible</h1>
          <p className="text-sm" style={{ color: "#64748b" }}>Este candidato no tiene su perfil público activado.</p>
          <Link href="/" className="inline-block mt-4 text-sm" style={{ color: "#22c55e" }}>← Volver al inicio</Link>
        </div>
      </div>
    );
  }

  const habilidades = (cv.habilidades || "").split(/[,;]/).filter(Boolean).map((h: string) => h.trim());

  return (
    <div className="min-h-screen" style={{ background: "#0f1117" }}>
      <div className="py-16 px-4" style={{ background: "linear-gradient(135deg, #1a1d28, #0f1117)" }}>
        <div className="max-w-3xl mx-auto text-center">
          <div className="w-24 h-24 rounded-full flex items-center justify-center text-4xl mx-auto mb-4"
            style={{ background: "linear-gradient(135deg, rgba(34,197,94,0.2), rgba(59,130,246,0.2))", border: "2px solid rgba(34,197,94,0.3)" }}>
            👤
          </div>
          <h1 className="text-3xl font-bold mb-1" style={{ color: "#f1f5f9" }}>{cv.nombre_completo || "Candidato"}</h1>
          <p className="text-lg mb-3" style={{ color: "#22c55e" }}>{cv.titulo || "Profesional"}</p>
          <p className="text-sm" style={{ color: "#94a3b8" }}>📍 {cv.ciudad || "España"}</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Habilidades */}
        {habilidades.length > 0 && (
          <div className="p-5 rounded-xl" style={{ background: "#161922", border: "1px solid #252836" }}>
            <h2 className="text-sm font-semibold mb-3" style={{ color: "#f1f5f9" }}>🛠️ Habilidades</h2>
            <div className="flex flex-wrap gap-2">
              {habilidades.map((h: string) => (
                <span key={h} className="px-3 py-1.5 rounded-lg text-xs"
                  style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.15)", color: "#22c55e" }}>
                  {h}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Experiencia */}
        {cv.experiencia && (
          <div className="p-5 rounded-xl" style={{ background: "#161922", border: "1px solid #252836" }}>
            <h2 className="text-sm font-semibold mb-3" style={{ color: "#f1f5f9" }}>💼 Experiencia</h2>
            <p className="text-sm whitespace-pre-wrap" style={{ color: "#94a3b8" }}>{cv.experiencia}</p>
          </div>
        )}

        {/* Educación */}
        {cv.educacion && (
          <div className="p-5 rounded-xl" style={{ background: "#161922", border: "1px solid #252836" }}>
            <h2 className="text-sm font-semibold mb-3" style={{ color: "#f1f5f9" }}>🎓 Formación</h2>
            <p className="text-sm whitespace-pre-wrap" style={{ color: "#94a3b8" }}>{cv.educacion}</p>
          </div>
        )}

        {/* Idiomas */}
        {cv.idiomas && (
          <div className="p-5 rounded-xl" style={{ background: "#161922", border: "1px solid #252836" }}>
            <h2 className="text-sm font-semibold mb-3" style={{ color: "#f1f5f9" }}>🌍 Idiomas</h2>
            <p className="text-sm" style={{ color: "#94a3b8" }}>{cv.idiomas}</p>
          </div>
        )}

        {/* CTA para empresas */}
        <div className="p-6 rounded-xl text-center" style={{ background: "linear-gradient(135deg, rgba(34,197,94,0.08), rgba(59,130,246,0.04))", border: "1px solid rgba(34,197,94,0.2)" }}>
          <p className="text-sm font-semibold mb-2" style={{ color: "#f1f5f9" }}>¿Eres recruiter?</p>
          <p className="text-xs mb-4" style={{ color: "#94a3b8" }}>Contacta con este candidato a través de BuscayCurra</p>
          <Link href={`/contactar?talento=${id}`}
            className="inline-block px-6 py-3 rounded-xl text-sm font-semibold"
            style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "#fff" }}>
            Contactar candidato →
          </Link>
        </div>
      </div>
    </div>
  );
}
