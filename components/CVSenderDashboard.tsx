"use client";

/**
 * CVSenderDashboard.tsx — Panel de envíos automáticos de CV
 * Tema: Bosque Encantado (oscuro)
 */

import { useEffect, useState, useCallback } from "react";

interface PendingJob {
  id: string;
  companyName: string;
  scheduledForFormatted: string;
  priority: string;
}
interface HistoryRecord {
  id: string;
  companyName: string;
  companyEmail: string;
  jobTitle?: string;
  status: string;
  sentAt?: string;
  respuesta?: "positiva" | "negativa" | "entrevista";
}
interface UserStats {
  totalEnviados: number;
  enviadosEstaSemana: number;
  enviadosEsteMes: number;
  empresasContactadas: number;
}
interface RateLimitInfo {
  enviadosHoy: number;
  limiteHoy: number;
  cvsRestantesHoy: number;
  puedeEnviar: boolean;
}
interface CVSenderDashboardProps {
  userId: string;
  userPlan?: "free" | "basico" | "pro" | "empresa";
}

function statusStyle(s: string) {
  if (s === "enviado") return { bg: "rgba(126,213,111,0.12)", color: "#7ed56f" };
  if (s === "pendiente") return { bg: "rgba(240,192,64,0.12)", color: "#f0c040" };
  if (s === "fallido") return { bg: "rgba(239,68,68,0.12)", color: "#f87171" };
  return { bg: "rgba(61,60,48,0.3)", color: "#706a58" };
}
function statusEmoji(s: string) {
  if (s === "enviado") return "✅";
  if (s === "pendiente") return "⏳";
  if (s === "fallido") return "❌";
  if (s === "cancelado") return "🚫";
  return "📄";
}

export default function CVSenderDashboard({ userId, userPlan = "free" }: CVSenderDashboardProps) {
  const [pendingJobs, setPendingJobs] = useState<PendingJob[]>([]);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [rateLimit, setRateLimit] = useState<RateLimitInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [respuestaId, setRespuestaId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const res = await fetch(`/api/cv-sender/status?userId=${encodeURIComponent(userId)}`);
      const data = await res.json() as {
        success?: boolean; error?: string;
        pendingJobs?: PendingJob[]; history?: HistoryRecord[];
        stats?: UserStats; rateLimitInfo?: RateLimitInfo;
      };
      if (!res.ok || data.error) throw new Error(data.error ?? "Error cargando datos");
      setPendingJobs(data.pendingJobs ?? []);
      setHistory(data.history ?? []);
      setStats(data.stats ?? null);
      setRateLimit(data.rateLimitInfo ?? null);
    } catch (err) { setError((err as Error).message); }
    finally { setLoading(false); }
  }, [userId]);

  useEffect(() => {
    void loadData();
    const iv = setInterval(() => void loadData(), 30_000);
    return () => clearInterval(iv);
  }, [loadData]);

  const registrarRespuesta = (id: string, tipo: "positiva" | "negativa" | "entrevista") => {
    setHistory(prev => prev.map(r => r.id === id ? { ...r, respuesta: tipo } : r));
    setRespuestaId(null);
  };

  const cancelJob = async (jobId: string) => {
    if (!confirm("¿Cancelar este envío?")) return;
    setCancellingId(jobId);
    try {
      const res = await fetch("/api/cv-sender/cancel", {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, userId }),
      });
      const data = await res.json() as { success?: boolean; error?: string };
      if (data.success) {
        setPendingJobs(prev => prev.filter(j => j.id !== jobId));
      }
    } catch {} finally { setCancellingId(null); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 mx-auto mb-3"
            style={{ border: "4px solid #3d3c30", borderTopColor: "#7ed56f" }} />
          <p className="text-sm" style={{ color: "#706a58" }}>Cargando tus envíos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card-game p-6 text-center">
        <p className="font-medium" style={{ color: "#f87171" }}>❌ {error}</p>
        <button onClick={() => void loadData()} className="mt-3 text-sm" style={{ color: "#7ed56f" }}>Reintentar</button>
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* Rate limit */}
      {rateLimit && (
        <div className="card-game p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm" style={{ color: "#f0ebe0" }}>Límite diario</h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
              style={{ background: "rgba(126,213,111,0.12)", color: "#7ed56f" }}>
              Plan {userPlan}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2.5 rounded-full" style={{ background: "#2a2a1e" }}>
              <div className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, (rateLimit.enviadosHoy / (rateLimit.limiteHoy || 1)) * 100)}%`,
                  background: rateLimit.cvsRestantesHoy === 0 ? "#f87171" : "#7ed56f",
                }} />
            </div>
            <span className="text-sm font-bold" style={{ color: "#f0ebe0" }}>
              {rateLimit.enviadosHoy}/{rateLimit.limiteHoy === Infinity ? "∞" : rateLimit.limiteHoy}
            </span>
          </div>
          <p className="text-xs mt-2" style={{ color: "#706a58" }}>
            {rateLimit.cvsRestantesHoy > 0
              ? `${rateLimit.cvsRestantesHoy} CVs restantes hoy`
              : "Límite alcanzado. Se reinicia a las 00:00."}
          </p>
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { val: stats.totalEnviados, label: "Total enviados", color: "#7ed56f" },
            { val: stats.enviadosEstaSemana, label: "Esta semana", color: "#f0c040" },
            { val: stats.enviadosEsteMes, label: "Este mes", color: "#7ed56f" },
            { val: stats.empresasContactadas, label: "Empresas", color: "#f0c040" },
          ].map((s, i) => (
            <div key={i} className="card-game p-4 text-center">
              <p className="text-2xl font-bold" style={{ color: s.color }}>{s.val}</p>
              <p className="text-[10px] mt-1" style={{ color: "#706a58" }}>{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Pending */}
      <div className="card-game overflow-hidden">
        <div className="px-5 py-4 flex items-center justify-between"
          style={{ borderBottom: "1px solid #3d3c30" }}>
          <h3 className="font-bold text-sm" style={{ color: "#f0ebe0" }}>
            ⏳ Pendientes
            {pendingJobs.length > 0 && (
              <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full font-bold"
                style={{ background: "rgba(240,192,64,0.15)", color: "#f0c040" }}>
                {pendingJobs.length}
              </span>
            )}
          </h3>
          <button onClick={() => void loadData()} className="text-xs" style={{ color: "#7ed56f" }}>🔄</button>
        </div>
        {pendingJobs.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm" style={{ color: "#504a3a" }}>No tienes envíos pendientes</p>
          </div>
        ) : (
          <ul>
            {pendingJobs.map((job, i) => (
              <li key={job.id} className="px-5 py-3.5 flex items-center gap-3 transition"
                style={{ borderBottom: i < pendingJobs.length - 1 ? "1px solid rgba(61,60,48,0.3)" : "none" }}>
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: "rgba(240,192,64,0.15)", color: "#f0c040" }}>{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate" style={{ color: "#f0ebe0" }}>{job.companyName}</p>
                  <p className="text-[10px]" style={{ color: "#706a58" }}>📅 {job.scheduledForFormatted}</p>
                </div>
                {job.priority === "prioritario" && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                    style={{ background: "rgba(240,192,64,0.15)", color: "#f0c040" }}>⚡</span>
                )}
                <button onClick={() => void cancelJob(job.id)} disabled={cancellingId === job.id}
                  className="text-[10px] px-2 py-1 rounded-lg transition"
                  style={{ color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" }}>
                  {cancellingId === job.id ? "..." : "Cancelar"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* History */}
      <div className="card-game overflow-hidden">
        <div className="px-5 py-4" style={{ borderBottom: "1px solid #3d3c30" }}>
          <h3 className="font-bold text-sm" style={{ color: "#f0ebe0" }}>📋 Historial</h3>
        </div>
        {history.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm" style={{ color: "#504a3a" }}>Aún no has enviado ningún CV</p>
          </div>
        ) : (
          <ul>
            {history.map((rec, i) => {
              const st = statusStyle(rec.status);
              const respuestaColor = rec.respuesta === "entrevista" ? "#f0c040"
                : rec.respuesta === "positiva" ? "#7ed56f"
                : rec.respuesta === "negativa" ? "#f87171" : undefined;
              const respuestaLabel = rec.respuesta === "entrevista" ? "🎯 Entrevista"
                : rec.respuesta === "positiva" ? "✅ Respuesta positiva"
                : rec.respuesta === "negativa" ? "❌ Sin interés" : undefined;
              return (
                <li key={rec.id} style={{ borderBottom: i < history.length - 1 ? "1px solid rgba(61,60,48,0.3)" : "none" }}>
                  <div className="px-5 py-3.5 flex items-center gap-3">
                    <span className="text-lg">{statusEmoji(rec.status)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate" style={{ color: "#f0ebe0" }}>{rec.companyName}</p>
                      {rec.jobTitle && <p className="text-[10px] truncate" style={{ color: "#706a58" }}>💼 {rec.jobTitle}</p>}
                      {rec.sentAt && (
                        <p className="text-[10px]" style={{ color: "#504a3a" }}>
                          {new Date(rec.sentAt).toLocaleDateString("es-ES", {
                            day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
                          })}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                        style={{ background: st.bg, color: st.color }}>
                        {rec.status.charAt(0).toUpperCase() + rec.status.slice(1)}
                      </span>
                      {rec.status === "enviado" && !rec.respuesta && (
                        <button onClick={() => setRespuestaId(respuestaId === rec.id ? null : rec.id)}
                          className="text-[9px] px-2 py-0.5 rounded-full"
                          style={{ border: "1px solid rgba(61,60,48,0.5)", color: "#706a58" }}>
                          ¿Contestaron?
                        </button>
                      )}
                      {rec.respuesta && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                          style={{ background: "rgba(0,0,0,0.2)", color: respuestaColor }}>
                          {respuestaLabel}
                        </span>
                      )}
                    </div>
                  </div>
                  {respuestaId === rec.id && (
                    <div className="px-5 pb-3 flex gap-2">
                      {([
                        { tipo: "entrevista" as const, label: "🎯 Me llamaron", color: "#f0c040" },
                        { tipo: "positiva" as const, label: "✅ Respuesta positiva", color: "#7ed56f" },
                        { tipo: "negativa" as const, label: "❌ Sin interés", color: "#f87171" },
                      ]).map(o => (
                        <button key={o.tipo} onClick={() => registrarRespuesta(rec.id, o.tipo)}
                          className="text-[10px] px-2.5 py-1 rounded-lg font-medium"
                          style={{ border: `1px solid ${o.color}30`, color: o.color, background: `${o.color}10` }}>
                          {o.label}
                        </button>
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
