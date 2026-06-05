"use client";

/**
 * JobCard — Tarjeta de oferta con % de compatibilidad
 * Tema oscuro "Bosque Encantado"
 * Badge de fuente, barra de match, botón enviar CV
 */

import Link from "next/link";

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
  return "#706a58";
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

export default function JobCard({
  titulo, empresa, ubicacion, salario, fuente = "Otro",
  url, modalidad, descripcion, match, distancia, emailEmpresa,
}: PropiedadesJobCard) {
  const fc = colorFuente(fuente);
  const matchColor = match !== undefined ? colorMatch(match) : "#706a58";

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
            <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: "#2a2a1e" }}>
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
        <div className="flex items-center gap-1 mt-1.5 text-xs" style={{ color: "#706a58" }}>
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
          <p className="text-[11px] mt-2 line-clamp-2 leading-relaxed" style={{ color: "#706a58" }}>{descripcion}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-auto">
        <a href={url} target="_blank" rel="noopener noreferrer"
          className="flex-1 text-center py-2.5 text-xs font-medium rounded-xl transition hover:opacity-80"
          style={{ border: "1.5px solid rgba(126,213,111,0.2)", color: "#b0a890" }}>
          Ver oferta
        </a>
        <Link href={`/app/envios?empresa=${encodeURIComponent(empresa)}${emailEmpresa ? `&email=${encodeURIComponent(emailEmpresa)}` : ""}${titulo ? `&puesto=${encodeURIComponent(titulo)}` : ""}${url ? `&web=${encodeURIComponent(url)}` : ""}`}
          className="flex-1 text-center py-2.5 text-xs font-bold rounded-xl transition hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #7ed56f, #5cb848)", color: "#1a1a12" }}>
          📧 Enviar CV
        </Link>
      </div>
    </div>
  );
}
