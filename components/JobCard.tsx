"use client";

/**
 * JobCard — Tarjeta de oferta con % de compatibilidad
 * Tema oscuro "Bosque Encantado"
 * Badge de fuente, barra de match, botón enviar CV (envío directo inline)
 */

import { useState } from "react";
import Link from "next/link";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

export interface PropiedadesJobCard {
  id: string;
  titulo: string;
  empresa: string;
  ubicacion: string;
  salario?: string;
  fuente?: string;
  url: string;
  modalidad?: "presencial" | "remoto" | "hibrido";
  descripcion?: string;
  match?: number; // 0-100 % de compatibilidad
  distancia?: string; // "🏠 Tu ciudad" | "📍 15km" etc.
  emailEmpresa?: string; // email RRHH si disponible
}

function colorMatch(pct: number): string {
  if (pct >= 80) return "#7ed56f";
  if (pct >= 60) return "#f0c040";
  if (pct >= 40) return "#e07850";
  return "#9a9378";
}

function colorFuente(fuente: string): { bg: string; text: string } {
  const mapa: Record<string, { bg: string; text: string }> = {
    infojobs: { bg: "rgba(59,130,246,0.12)", text: "#60a5fa" },
    linkedin: { bg: "rgba(14,165,233,0.12)", text: "#38bdf8" },
    indeed: { bg: "rgba(168,85,247,0.12)", text: "#c084fc" },
    tecnoempleo: { bg: "rgba(126,213,111,0.12)", text: "#7ed56f" },
    sepe: { bg: "rgba(240,192,64,0.12)", text: "#f0c040" },
  };
  return mapa[fuente.toLowerCase()] || { bg: "rgba(112,106,88,0.12)", text: "#b0a890" };
}

// Extrae dominio de la URL de la oferta para construir email fallback
function buildFallbackEmail(url: string): string {
  try {
    const domain = new URL(url).hostname.replace(/^www\./, "");
    const jobBoards = ["adzuna", "jooble", "careerjet", "infojobs", "jobviewtrack", "indeed", "linkedin", "monster", "tecnoempleo"];
    if (jobBoards.some(b => domain.includes(b))) return "";
    return `empleo@${domain}`;
  } catch {
    return "";
  }
}

export default function JobCard({
  id, titulo, empresa, ubicacion, salario, fuente = "Otro",
  url, modalidad, descripcion, match, distancia, emailEmpresa,
}: PropiedadesJobCard) {
  const fc = colorFuente(fuente);
  const matchColor = match !== undefined ? colorMatch(match) : "#9a9378";

  const [enviando, setEnviando] = useState(false);
  const [estadoEnvio, setEstadoEnvio] = useState<"idle" | "ok" | "sin-email">("idle");

  async function enviarCV(e: React.MouseEvent) {
    e.preventDefault();
    if (enviando || estadoEnvio === "ok") return;
    setEnviando(true);

    try {
      const supabase = getSupabaseBrowser();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { window.location.href = "/auth/login"; return; }

      // Resolver email: prop → extract API → fallback de dominio
      let email = emailEmpresa || "";
      if (!email) {
        try {
          const r = await fetch("/api/company/extract", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: empresa }),
            signal: AbortSignal.timeout(6000),
          });
          const d = await r.json() as { empresas?: Array<{ emailRrhh?: string }>; emailRrhh?: string };
          email = d.empresas?.[0]?.emailRrhh || d.emailRrhh || "";
        } catch { /* ignorar */ }
      }
      if (!email) email = buildFallbackEmail(url);

      if (!email) {
        setEstadoEnvio("sin-email");
        setTimeout(() => setEstadoEnvio("idle"), 4000);
        return;
      }

      const res = await fetch("/api/cv-sender/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          companyName: empresa,
          companyEmail: email,
          companyUrl: url,
          jobTitle: titulo,
        }),
      });

      if (res.ok) {
        setEstadoEnvio("ok");
        setTimeout(() => setEstadoEnvio("idle"), 4000);
      } else {
        const err = await res.json().catch(() => ({})) as { error?: string };
        alert(err.error || "Error al enviar CV");
      }
    } catch {
      alert("Error de conexión al enviar CV");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="card-game p-5 flex flex-col gap-3 group hover:scale-[1.01] transition-transform">
      {/* Header: fuente + match + modalidad */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
            style={{ background: fc.bg, color: fc.text }}>{fuente}</span>
          {modalidad && (
            <span className="text-[11px] font-medium px-2.5 py-1 rounded-full capitalize"
              style={{ background: "rgba(112,106,88,0.1)", color: "#b0a890" }}>{modalidad}</span>
          )}
        </div>
        {match !== undefined && (
          <div className="flex items-center gap-2">
            <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: "#2a2a1e" }} role="progressbar" aria-valuenow={match} aria-valuemin={0} aria-valuemax={100} aria-label={`${match}% de compatibilidad`}>
              <div className="h-full rounded-full transition-all" style={{ width: `${match}%`, background: matchColor }} />
            </div>
            <span className="text-xs font-bold" style={{ color: matchColor }}>{match}%</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div>
        <h3 className="font-bold text-sm leading-snug" style={{ color: "#f0ebe0" }}>{titulo}</h3>
        <p className="text-xs mt-1" style={{ color: "#b0a890" }}>{empresa}</p>
        <div className="flex items-center gap-1 mt-1.5 text-xs" style={{ color: "#9a9378" }}>
          <span>📍</span><span>{ubicacion}</span>
        </div>
        {salario && (
          <div className="flex items-center gap-1 mt-1 text-xs font-semibold" style={{ color: "#7ed56f" }}>
            <span>💰</span><span>{salario}</span>
          </div>
        )}
        {distancia && (
          <div className="flex items-center gap-1 mt-1 text-[11px]" style={{ color: "#a8e6a1" }}>
            <span>{distancia}</span>
          </div>
        )}
        {emailEmpresa && (
          <div className="flex items-center gap-1 mt-1 text-[11px]" style={{ color: "#f0c040" }}>
            <span>✉️</span><span>{emailEmpresa}</span>
          </div>
        )}
        {descripcion && (
          <p className="text-[11px] mt-2 line-clamp-2 leading-relaxed" style={{ color: "#9a9378" }}>{descripcion}</p>
        )}
      </div>

      {/* Aviso sin email */}
      {estadoEnvio === "sin-email" && (
        <p className="text-[11px] text-center" style={{ color: "#f0c040" }}>
          Sin email aún. 📌 Guarda esta oferta y te avisamos cuando lo encontremos.
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-auto">
        <Link href={`/app/ofertas/${encodeURIComponent(id)}`}
          className="flex-1 text-center py-2.5 text-xs font-medium rounded-xl transition hover:opacity-80"
          style={{ border: "1.5px solid rgba(126,213,111,0.2)", color: "#b0a890" }}>
          Ver oferta
        </Link>
        <button
          onClick={enviarCV}
          disabled={enviando}
          className="flex-1 text-center py-2.5 text-xs font-bold rounded-xl transition hover:opacity-90 disabled:opacity-60"
          style={{
            background: estadoEnvio === "ok"
              ? "linear-gradient(135deg, #22c55e, #16a34a)"
              : "linear-gradient(135deg, #7ed56f, #5cb848)",
            color: "#1a1a12",
          }}>
          {enviando
            ? "⏳ Enviando..."
            : estadoEnvio === "ok"
              ? "✅ Enviado"
              : "📧 Enviar CV"}
        </button>
      </div>
    </div>
  );
}
