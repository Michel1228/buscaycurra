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
  const [estadoEnvio, setEstadoEnvio] = useState<"idle" | "verificando" | "buscando" | "generando" | "preview" | "enviando" | "enviado" | "sin_cv" | "error">("idle");
  const [cartaPreview, setCartaPreview] = useState<string | null>(null);
  const [cartaSubject, setCartaSubject] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");

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
    if (!id.startsWith("jooble-") && !id.startsWith("gusi-")) {
      setCargandoDetalle(true);
      try {
        const res = await fetch(`/api/jobs/detail?id=${id}`);
        if (res.ok) {
          const data = await res.json() as { oferta?: { descripcion?: string } };
          setDescripcionFull(data.oferta?.descripcion || descripcion || "");
        }
      } catch { }
      finally { setCargandoDetalle(false); }
    } else {
      setDescripcionFull(descripcion || "");
    }
  }

  async function enviarCVAuto() {
    setEstadoEnvio("verificando");
    setErrorMsg("");
    try {
      const session = (await getSupabaseBrowser().auth.getSession()).data.session;
      if (!session) { alert("Inicia sesión para enviar tu CV"); setEstadoEnvio("idle"); return; }

      const uid = session.user.id;

      // 1. Verificar CV
      const cvRes = await fetch(`/api/gusi/cv?userId=${uid}`);
      const cvData = await cvRes.json() as { cv?: Record<string, unknown> };
      if (!cvData.cv || Object.keys(cvData.cv).length === 0) {
        setEstadoEnvio("sin_cv");
        setErrorMsg("No tienes CV. Créalo en Guzzi primero 🐛");
        // No auto-reset: mantener mensaje visible hasta que el usuario actúe
        return;
      }

      // 2. Generar carta de presentación
      setEstadoEnvio("generando");
      const prevRes = await fetch("/api/cv-sender/preview-carta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: uid, companyName: empresa, jobTitle: titulo }),
      });

      if (!prevRes.ok) {
        const err = await prevRes.json().catch(() => ({})) as { error?: string };
        throw new Error((err as { error?: string }).error || "Error generando carta");
      }

      const prevData = await prevRes.json() as { carta?: string; subject?: string; error?: string };
      if (prevData.error) throw new Error(prevData.error);

      // 3. Mostrar preview
      setCartaPreview(prevData.carta || "");
      setCartaSubject(prevData.subject || "");
      setEstadoEnvio("preview");
    } catch (err) {
      setEstadoEnvio("error");
      setErrorMsg((err as Error).message || "Error al preparar envío");
      setTimeout(() => setEstadoEnvio("idle"), 4000);
    }
  }

  async function confirmarEnvio() {
    if (estadoEnvio !== "preview") return;
    setEstadoEnvio("enviando");
    setErrorMsg("");
    try {
      const session = (await getSupabaseBrowser().auth.getSession()).data.session;
      if (!session) throw new Error("Sesión expirada");

      const uid = session.user.id;
      let email = emailEmpresa || "";

      // Buscar email si no viene en la oferta
      if (!email && url) {
        try {
          setEstadoEnvio("buscando");
          const r = await fetch(`/api/empresas/analizar?url=${encodeURIComponent(url)}`);
          const d = await r.json() as { emailRrhh?: string };
          email = d.emailRrhh || "";
        } catch { /* continuar sin email */ }
      }

      if (email) {
        const res = await fetch("/api/cv-sender/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: uid, companyName: empresa, companyEmail: email, companyUrl: url || undefined, jobTitle: titulo, useAIPersonalization: true }),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({})) as { error?: string };
          throw new Error((errData as { error?: string }).error || "Error del servidor");
        }
      } else {
        // Sin email: registrar envío manual
        const regRes = await fetch("/api/cv-sender/registrar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: uid, companyName: empresa, jobTitle: titulo, companyUrl: url || undefined }),
        });
        if (!regRes.ok) throw new Error("Error registrando envío");
      }

      setEstadoEnvio("enviado");
      setCartaPreview(null);
      setTimeout(() => setEstadoEnvio("idle"), 4000);
    } catch (err) {
      setEstadoEnvio("error");
      setErrorMsg((err as Error).message || "Error al enviar");
      setTimeout(() => setEstadoEnvio("idle"), 4000);
    }
  }

  function cancelarEnvio() {
    setEstadoEnvio("idle");
    setCartaPreview(null);
    setErrorMsg("");
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
      }
    } catch (e) {
      console.error("Excepción:", e);
    }
    finally { setGuardando(false); }
  }

  return (
    <>
      {/* Modal de preview de carta */}
      {estadoEnvio === "preview" && cartaPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }} onClick={cancelarEnvio}>
          <div className="w-full max-w-md rounded-xl max-h-[85vh] overflow-y-auto" style={{ background: "#1e212b", border: "1px solid #2d3142" }} onClick={e => e.stopPropagation()}>
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm" style={{ color: "#f1f5f9" }}>📝 Carta de presentación</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-md" style={{ background: "rgba(34,197,94,0.12)", color: "#22c55e" }}>
                  IA generada
                </span>
              </div>

              <div className="text-[11px]" style={{ color: "#94a3b8" }}>
                <span className="font-medium" style={{ color: "#f1f5f9" }}>Para:</span> {empresa}
                {titulo && <span> — {titulo}</span>}
              </div>

              {/* Carta */}
              <div className="rounded-lg p-4 text-xs leading-relaxed whitespace-pre-line" style={{ background: "#111827", border: "1px solid #2d3142", color: "#cbd5e1" }}>
                {cartaPreview}
              </div>

              {errorMsg && (
                <div className="text-[11px] px-3 py-2 rounded-lg" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
                  {errorMsg}
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={cancelarEnvio}
                  className="flex-1 py-2.5 text-[12px] font-medium rounded-lg transition"
                  style={{ border: "1px solid #2d3142", color: "#94a3b8" }}>
                  Cancelar
                </button>
                <button
                  onClick={() => void confirmarEnvio()}
                  disabled={false}
                  className="flex-1 py-2.5 text-[12px] font-semibold rounded-lg transition btn-game">✅ Enviar CV con esta carta
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* JobCard normal */}
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
          {url ? (
            <a href={url} target="_blank" rel="noopener noreferrer" className="block">
              <h3 className="font-semibold text-sm leading-snug transition hover:underline" style={{ color: "#f1f5f9" }}>{titulo}</h3>
            </a>
          ) : (
            <h3 className="font-semibold text-sm leading-snug" style={{ color: "#f1f5f9" }}>{titulo}</h3>
          )}

          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-xs" style={{ color: "#475569" }}>🏢</span>
            <span className="text-xs font-semibold" style={{ color: empresa && empresa !== "Ver en oferta" ? "#e2e8f0" : "#475569" }}>
              {empresa && empresa !== "Ver en oferta" ? empresa : "Empresa confidencial"}
            </span>
          </div>

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
            <div className="mt-2">
              {!expandida ? (
                <p className="text-[11px] leading-relaxed" style={{ color: "#64748b", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" } as React.CSSProperties}>
                  {descripcion}
                </p>
              ) : (
                <div className="rounded-lg p-3 mt-1" style={{ background: "rgba(15,17,23,0.8)", border: "1px solid #2d3142" }}>
                  <p className="text-xs leading-relaxed whitespace-pre-line" style={{ color: "#cbd5e1" }}>
                    {cargandoDetalle ? "Cargando descripción completa..." : (descripcionFull ?? descripcion)}
                  </p>
                </div>
              )}
              <button onClick={toggleExpand} className="text-[11px] mt-1.5 font-medium transition hover:opacity-80" style={{ color: "#22c55e" }}>
                {expandida ? "Ver menos ▲" : "Ver más ▼"}
              </button>
            </div>
          )}
        </div>

        {/* Mensaje de error */}
        {errorMsg && estadoEnvio !== "preview" && (
          <div className="text-[10px] px-3 py-1.5 rounded-lg" style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444" }}>
            {errorMsg}
          </div>
        )}

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
            ref={(el) => {
              if (el && !(el as HTMLButtonElement & { _bcvListener?: boolean })._bcvListener) {
                (el as HTMLButtonElement & { _bcvListener?: boolean })._bcvListener = true;
                el.addEventListener("click", (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  void enviarCVAuto();
                });
              }
            }}
            disabled={estadoEnvio !== "idle" && estadoEnvio !== "sin_cv" && estadoEnvio !== "error"}
            title={estadoEnvio === "sin_cv" ? "Sube tu CV primero en Guzzi" : undefined}
            className="flex-1 text-center py-2 text-[11px] font-semibold rounded-lg transition hover:opacity-90 btn-game"
            style={estadoEnvio === "enviado" ? { background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)", color: "#22c55e" } :
                   estadoEnvio === "sin_cv" ? { background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)", color: "#f59e0b" } :
                   estadoEnvio === "error" ? { background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#ef4444" } : {}}>
            {estadoEnvio === "idle" ? "Enviar CV" :
             estadoEnvio === "verificando" ? "⏳ Verificando CV..." :
             estadoEnvio === "generando" ? "🤖 Generando carta..." :
             estadoEnvio === "buscando" ? "🔍 Buscando email..." :
             estadoEnvio === "preview" ? "📝 Viendo carta..." :
             estadoEnvio === "enviando" ? "📤 Enviando..." :
             estadoEnvio === "enviado" ? "✅ CV enviado" :
             estadoEnvio === "sin_cv" ? "⚠️ Sube tu CV primero" :
             "❌ Error, reintentar"}
          </button>
        </div>
      </div>
    </>
  );
}
