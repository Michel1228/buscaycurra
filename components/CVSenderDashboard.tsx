"use client";

/**
 * CVSenderDashboard.tsx — Panel de envíos automáticos de CV
 * Tema: Bosque Encantado (oscuro)
 */

import { useEffect, useState, useCallback } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

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
}
interface UserStats {
  totalEnviados: number;
  enviadosEstaSemana: number;
  enviadosEsteMes: number;
  empresasContactadas: number;
}
interface RateLimitInfo {
  enviadosHoy: number;
  limiteHoy: number | null;
  cvsRestantesHoy: number | null;
  puedeEnviar: boolean;
}
interface CVSenderDashboardProps {
  userId: string;
  userPlan?: "free" | "basico" | "pro" | "empresa";
}

function statusStyle(s: string) {
  if (s === "enviado") return { bg: "rgba(34,197,94,0.12)", color: "#22c55e" };
  if (s === "pendiente") return { bg: "rgba(245,158,11,0.12)", color: "#f59e0b" };
  if (s === "fallido") return { bg: "rgba(239,68,68,0.12)", color: "#ef4444" };
  return { bg: "rgba(100,116,139,0.12)", color: "#94a3b8" };
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

  const loadData = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const { data: { session } } = await getSupabaseBrowser().auth.getSession();
      const token = session?.access_token ?? "";
      const res = await fetch("/api/cv-sender/status", {
        headers: { "Authorization": `Bearer ${token}` }
      });
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

  // BUG-03: no arrancar polling hasta tener userId
  useEffect(() => {
    if (!userId) return;
    void loadData();
    const iv = setInterval(() => void loadData(), 30_000);
    return () => clearInterval(iv);
  }, [loadData, userId]);

  const cancelJob = async (jobId: string) => {
    if (!confirm("¿Cancelar este envío?")) return;
    setCancellingId(jobId);
    try {
      // BUG-01: enviar Bearer token
      const { data: { session } } = await getSupabaseBrowser().auth.getSession();
      const token = session?.access_token ?? "";
      const res = await fetch("/api/cv-sender/cancel", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ jobId }),
      });
      const data = await res.json() as { success?: boolean; error?: string; message?: string };
      if (data.success) {
        setPendingJobs(prev => prev.filter(j => j.id !== jobId));
        void loadData(); // refrescar
      } else {
        // BUG-02: mostrar error al usuario
        setError(data.error ?? data.message ?? "No se pudo cancelar el envío");
      }
    } catch (err) {
      setError((err as Error).message);
    } finally { setCancellingId(null); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 mx-auto mb-3"
            style={{ border: "4px solid #2d3142", borderTopColor: "#22c55e" }} />
          <p className="text-sm" style={{ color: "#94a3b8" }}>Cargando tus envíos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card-game p-6 text-center">
        <p className="font-medium" style={{ color: "#ef4444" }}>❌ {error}</p>
        <button onClick={() => void loadData()} className="mt-3 text-sm" style={{ color: "#22c55e" }}>Reintentar</button>
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* Rate limit */}
      {rateLimit && (
        <div className="card-game p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm" style={{ color: "#f1f5f9" }}>Límite diario</h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
              style={{ background: "rgba(34,197,94,0.12)", color: "#22c55e" }}>
              Plan {userPlan}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2.5 rounded-full" style={{ background: "#1e212b" }}>
              <div className="h-full rounded-full transition-all duration-500"
                style={{
                  width: rateLimit.limiteHoy === null ? "5%" : `${Math.min(100, (rateLimit.enviadosHoy / (rateLimit.limiteHoy || 1)) * 100)}%`,
                  background: (rateLimit.cvsRestantesHoy !== null && rateLimit.cvsRestantesHoy === 0) ? "#ef4444" : "#22c55e",
                }} />
            </div>
            <span className="text-sm font-bold" style={{ color: "#f1f5f9" }}>
              {rateLimit.enviadosHoy}/{(rateLimit.limiteHoy === null || rateLimit.limiteHoy === Infinity) ? "∞" : rateLimit.limiteHoy}
            </span>
          </div>
          <p className="text-xs mt-2" style={{ color: "#94a3b8" }}>
            {(rateLimit.cvsRestantesHoy === null || rateLimit.cvsRestantesHoy > 0)
              ? (rateLimit.cvsRestantesHoy === null ? "Sin límite — Plan Empresa" : `${rateLimit.cvsRestantesHoy} CVs restantes hoy`)
              : "Límite alcanzado. Se reinicia a las 00:00."}
          </p>
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { val: stats.totalEnviados, label: "Total enviados", color: "#22c55e" },
            { val: stats.enviadosEstaSemana, label: "Esta semana", color: "#f59e0b" },
            { val: stats.enviadosEsteMes, label: "Este mes", color: "#3b82f6" },
            { val: stats.empresasContactadas, label: "Empresas", color: "#a855f7" },
          ].map((s, i) => (
            <div key={i} className="card-game p-4 text-center">
              <p className="text-2xl font-bold" style={{ color: s.color }}>{s.val}</p>
              <p className="text-[10px] mt-1" style={{ color: "#94a3b8" }}>{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Pending */}
      <div className="card-game overflow-hidden">
        <div className="px-5 py-4 flex items-center justify-between"
          style={{ borderBottom: "1px solid #2d3142" }}>
          <h3 className="font-bold text-sm" style={{ color: "#f1f5f9" }}>
            ⏳ Pendientes
            {pendingJobs.length > 0 && (
              <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full font-bold"
                style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b" }}>
                {pendingJobs.length}
              </span>
            )}
          </h3>
          <button onClick={() => void loadData()} className="text-xs" style={{ color: "#22c55e" }}>🔄</button>
        </div>
        {pendingJobs.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm" style={{ color: "#64748b" }}>No tienes envíos pendientes</p>
          </div>
        ) : (
          <ul>
            {pendingJobs.map((job, i) => (
              <li key={job.id} className="px-5 py-3.5 flex items-center gap-3 transition"
                style={{ borderBottom: i < pendingJobs.length - 1 ? "1px solid #2d3142" : "none" }}>
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b" }}>{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate" style={{ color: "#f1f5f9" }}>{job.companyName}</p>
                  <p className="text-[10px]" style={{ color: "#94a3b8" }}>📅 {job.scheduledForFormatted}</p>
                </div>
                {job.priority === "prioritario" && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                    style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b" }}>⚡</span>
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
        <div className="px-5 py-4" style={{ borderBottom: "1px solid #2d3142" }}>
          <h3 className="font-bold text-sm" style={{ color: "#f1f5f9" }}>📋 Historial</h3>
        </div>
        {history.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm" style={{ color: "#64748b" }}>Aún no has enviado ningún CV</p>
          </div>
        ) : (
          <ul>
            {history.map((rec, i) => {
              const st = statusStyle(rec.status);
              return (
                <li key={rec.id} className="px-5 py-3.5 flex items-center gap-3 transition"
                  style={{ borderBottom: i < history.length - 1 ? "1px solid #2d3142" : "none" }}>
                  <span className="text-lg">{statusEmoji(rec.status)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate" style={{ color: "#f1f5f9" }}>{rec.companyName}</p>
                    {rec.jobTitle && <p className="text-[10px] truncate" style={{ color: "#94a3b8" }}>💼 {rec.jobTitle}</p>}
                    {rec.sentAt && (
                      <p className="text-[10px]" style={{ color: "#64748b" }}>
                        {new Date(rec.sentAt).toLocaleDateString("es-ES", {
                          day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
                        })}
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                    style={{ background: st.bg, color: st.color }}>
                    {rec.status.charAt(0).toUpperCase() + rec.status.slice(1)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
