"use client";

import { useState, useEffect } from "react";
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
  match?: number;
  distancia?: string;
  emailEmpresa?: string;
}

function colorMatch(pct: number): string {
  if (pct >= 80) return "#22c55e";
  if (pct >= 60) return "#f59e0b";
  if (pct >= 40) return "#e07850";
  return "#64748b";
}

function colorFuente(fuente: string): { bg: string; text: string } {
  const mapa: Record<string, { bg: string; text: string }> = {
    infojobs: { bg: "rgba(59,130,246,0.12)", text: "#60a5fa" },
    linkedin: { bg: "rgba(14,165,233,0.12)", text: "#38bdf8" },
    indeed: { bg: "rgba(168,85,247,0.12)", text: "#c084fc" },
    tecnoempleo: { bg: "rgba(34,197,94,0.12)", text: "#22c55e" },
    sepe: { bg: "rgba(245,158,11,0.12)", text: "#f59e0b" },
  };
  return mapa[fuente.toLowerCase()] || { bg: "rgba(100,116,139,0.12)", text: "#94a3b8" };
}

export default function JobCard({
  id, titulo, empresa, ubicacion, salario, fuente = "Otro",
  url, modalidad, descripcion, match, distancia, emailEmpresa,
}: PropiedadesJobCard) {
  const fc = colorFuente(fuente);
  const matchColor = match !== undefined ? colorMatch(match) : "#64748b";
  const [guardado, setGuardado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [expandida, setExpandida] = useState(false);
  const [descripcionFull, setDescripcionFull] = useState<string | null>(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [estadoEnvio, setEstadoEnvio] = useState<"idle" | "verificando" | "buscando" | "enviando" | "enviado" | "sin_cv" | "error">("idle");

  useEffect(() => {
    async function checkSaved() {
      try {
        const session = (await getSupabaseBrowser().auth.getSession()).data.session;
        if (!session) return;
        const res = await fetch(`/api/jobs/guardar?userId=${session.user.id}`);
        if (res.ok) {
          const data = await res.json() as { guardados: Array<{ job_id: string }> };
          setGuardado(data.guardados.some(g => g.job_id === id));
        }
      } catch { /* ignore */ }
    }
    checkSaved();
  }, [id]);

  async function toggleExpand() {
    if (expandida) { setExpandida(false); return; }
    setExpandida(true);
    if (descripcionFull !== null) return;
    // Intentar cargar descripción completa desde BD (IDs de Jooble son "jooble-xxx")
    if (!id.startsWith("jooble-") && !id.startsWith("gusi-")) {
      setCargandoDetalle(true);
      try {
        const res = await fetch(`/api/jobs/detail?id=${id}`);
        if (res.ok) {
          const data = await res.json() as { oferta?: { descripcion?: string } };
          setDescripcionFull(data.oferta?.descripcion || descripcion || "");
        }
      } catch { /* usa descripcion corta */ }
      finally { setCargandoDetalle(false); }
    } else {
      setDescripcionFull(descripcion || "");
    }
  }

  async function enviarCVAuto() {
    setEstadoEnvio("verificando");
    try {
      const session = (await getSupabaseBrowser().auth.getSession()).data.session;
      if (!session) { alert("Inicia sesión para enviar tu CV"); setEstadoEnvio("idle"); return; }

      const cvRes = await fetch(`/api/gusi/cv?userId=${session.user.id}`);
      const cvData = await cvRes.json() as { cv?: Record<string, unknown> };
      if (!cvData.cv || Object.keys(cvData.cv).length === 0) {
        setEstadoEnvio("sin_cv");
        setTimeout(() => setEstadoEnvio("idle"), 4000);
        return;
      }

      setEstadoEnvio("buscando");
      let email = emailEmpresa || "";
      if (!email && url) {
        try {
          const r = await fetch(`/api/empresas/analizar?url=${encodeURIComponent(url)}`);
          const d = await r.json() as { emailRrhh?: string };
          email = d.emailRrhh || "";
        } catch { /* continuar sin email */ }
      }

      setEstadoEnvio("enviando");
      if (email) {
        const res = await fetch("/api/cv-sender/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: session.user.id, companyName: empresa, companyEmail: email, companyUrl: url || undefined, jobTitle: titulo, useAIPersonalization: true }),
        });
        if (!res.ok) throw new Error("send_failed");
      } else {
        await fetch("/api/cv-sender/registrar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: session.user.id, companyName: empresa, jobTitle: titulo, companyUrl: url || undefined }),
        });
      }
      setEstadoEnvio("enviado");
    } catch {
      setEstadoEnvio("error");
      setTimeout(() => setEstadoEnvio("idle"), 3000);
    }
  }

  async function toggleGuardar() {
    setGuardando(true);
    try {
      const session = (await getSupabaseBrowser().auth.getSession()).data.session;
      if (!session) {
        alert("Inicia sesión para guardar ofertas");
        return;
      }
      const res = await fetch("/api/jobs/guardar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: id, action: guardado ? "unsave" : "save", userId: session.user.id }),
      });
      if (res.ok) {
        const data = await res.json() as { saved: boolean };
        setGuardado(data.saved);
      } else {
        const err = await res.text();
        console.error("Error guardando:", err);
        alert("Error al guardar: " + err);
      }
    } catch (e) { 
      console.error("Excepción:", e);
      alert("Error de conexión");
    }
    finally { setGuardando(false); }
  }

  return (
    <div className="card-game p-4 flex flex-col gap-2.5 group">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-md" style={{ background: fc.bg, color: fc.text }}>{fuente}</span>
          {modalidad && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-md capitalize" style={{ background: "rgba(100,116,139,0.1)", color: "#94a3b8" }}>{modalidad}</span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {match !== undefined && (
            <div className="flex items-center gap-1">
              <div className="w-10 h-1 rounded-full overflow-hidden" style={{ background: "#252836" }}>
                <div className="h-full rounded-full" style={{ width: `${match}%`, background: matchColor }} />
              </div>
              <span className="text-[10px] font-semibold" style={{ color: matchColor }}>{match}%</span>
            </div>
          )}
          <button onClick={toggleGuardar} disabled={guardando}
            className="w-6 h-6 rounded-md flex items-center justify-center text-xs transition hover:scale-110"
            style={{
              background: guardado ? "rgba(239,68,68,0.12)" : "transparent",
              border: guardado ? "1px solid rgba(239,68,68,0.25)" : "1px solid #2d3142",
            }}
            title={guardado ? "Quitar" : "Guardar"}>
            {guardando ? "⏳" : guardado ? "❤️" : "🤍"}
          </button>
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-sm leading-snug" style={{ color: "#f1f5f9" }}>{titulo}</h3>
        <p className="text-[11px] mt-0.5" style={{ color: "#94a3b8" }}>{empresa}</p>
        <div className="flex items-center gap-1 mt-1 text-[11px]" style={{ color: "#64748b" }}>
          <span>📍</span><span>{ubicacion}</span>
        </div>
        {salario && (
          <div className="flex items-center gap-1 mt-0.5 text-[11px] font-medium" style={{ color: "#22c55e" }}>
            <span>💰</span><span>{salario}</span>
          </div>
        )}
        {distancia && (
          <div className="text-[10px] mt-0.5" style={{ color: "#4ade80" }}>{distancia}</div>
        )}
        {emailEmpresa && (
          <div className="flex items-center gap-1 mt-0.5 text-[10px]" style={{ color: "#f59e0b" }}>
            <span>✉️</span><span>{emailEmpresa}</span>
          </div>
        )}
        {descripcion && (
          <div className="mt-1.5">
            <p className="text-[10px] leading-relaxed" style={{ color: "#64748b", display: "-webkit-box", WebkitLineClamp: expandida ? "unset" : 2, WebkitBoxOrient: "vertical", overflow: expandida ? "visible" : "hidden" } as React.CSSProperties}>
              {cargandoDetalle ? "Cargando..." : (expandida && descripcionFull !== null ? descripcionFull : descripcion)}
            </p>
            <button onClick={toggleExpand} className="text-[10px] mt-0.5 transition hover:opacity-80" style={{ color: "#22c55e" }}>
              {expandida ? "Ver menos ▲" : "Ver más ▼"}
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-2 mt-auto flex-wrap">
        {url ? (
          <a href={url} target="_blank" rel="noopener noreferrer"
            className="flex-1 text-center py-2 text-[11px] font-medium rounded-lg transition hover:opacity-80"
            style={{ border: "1px solid rgba(34,197,94,0.2)", color: "#94a3b8" }}>
            Ver oferta ↗
          </a>
        ) : (
          <span
            className="flex-1 text-center py-2 text-[11px] font-medium rounded-lg"
            style={{ border: "1px solid rgba(100,116,139,0.15)", color: "#475569", cursor: "default" }}
            title="URL de oferta no disponible">
            Sin URL
          </span>
        )}
        {url && (
          <a
            href={`/app/empresas?url=${encodeURIComponent(url)}`}
            className="px-3 py-2 text-[11px] font-medium rounded-lg transition hover:opacity-80"
            style={{ border: "1px solid rgba(245,158,11,0.2)", color: "#f59e0b" }}
            title="Ver información de la empresa">
            🏢
          </a>
        )}
        <button
          onClick={() => void enviarCVAuto()}
          disabled={estadoEnvio !== "idle" && estadoEnvio !== "sin_cv" && estadoEnvio !== "error"}
          title={estadoEnvio === "sin_cv" ? "Sube tu CV primero en Guzzi" : undefined}
          className="flex-1 text-center py-2 text-[11px] font-semibold rounded-lg transition hover:opacity-90 btn-game"
          style={estadoEnvio === "enviado" ? { background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)", color: "#22c55e" } :
                 estadoEnvio === "sin_cv" ? { background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)", color: "#f59e0b" } :
                 estadoEnvio === "error" ? { background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#ef4444" } : {}}>
          {estadoEnvio === "idle" ? "Enviar CV" :
           estadoEnvio === "verificando" ? "⏳ Verificando..." :
           estadoEnvio === "buscando" ? "🔍 Buscando email..." :
           estadoEnvio === "enviando" ? "📤 Enviando..." :
           estadoEnvio === "enviado" ? "✅ CV enviado" :
           estadoEnvio === "sin_cv" ? "⚠️ Sube tu CV primero" :
           "❌ Error, reintentar"}
        </button>
      </div>
    </div>
  );
}
