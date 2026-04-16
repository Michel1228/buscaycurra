"use client";

/**
 * CVSenderDashboard.tsx — Panel de control del sistema de envíos automáticos de CV
 *
 * Muestra al usuario:
 *   - Límite diario restante (ej: "3/5 CVs enviados hoy")
 *   - Lista de envíos pendientes con posición en la cola
 *   - Historial de CVs enviados con fecha y empresa
 *   - Estadísticas visuales (total, esta semana, este mes)
 *   - Botón para cancelar envíos pendientes
 *
 * Colores de marca BuscayCurra:
 *   - Azul principal: #2563EB
 *   - Naranja acento: #F97316
 */

import { useEffect, useState, useCallback } from "react";

// ─── Tipos ───────────────────────────────────────────────────────────────────

/** Un envío pendiente en la cola */
interface PendingJob {
  id: string;
  companyName: string;
  scheduledFor: string;
  scheduledForFormatted: string;
  priority: "normal" | "prioritario";
  state: string;
}

/** Un envío en el historial */
interface HistoryRecord {
  id: string;
  companyName: string;
  companyEmail: string;
  jobTitle?: string;
  status: "pendiente" | "enviado" | "fallido" | "cancelado";
  sentAt?: string;
  createdAt?: string;
}

/** Estadísticas del usuario */
interface UserStats {
  totalEnviados: number;
  empresasContactadas: number;
  enviadosEstaSemana: number;
  enviadosEsteMes: number;
  enviadosHoy: number;
}

/** Información del límite de envíos */
interface RateLimitInfo {
  enviadosHoy: number;
  limiteHoy: number;
  enviadosEsteMes: number;
  limiteMes: number;
  cvsRestantesHoy: number;
  puedeEnviar: boolean;
}

/** Props del componente */
interface CVSenderDashboardProps {
  userId: string;
  userPlan?: "free" | "pro" | "empresa";
}

// ─── Colores de estado ────────────────────────────────────────────────────────

/** Devuelve las clases de color según el estado del envío */
function getStatusColor(status: string): string {
  switch (status) {
    case "enviado":
      return "bg-green-100 text-green-700";
    case "pendiente":
      return "bg-blue-100 text-blue-700";
    case "fallido":
      return "bg-red-100 text-red-700";
    case "cancelado":
      return "bg-gray-100 text-gray-500";
    default:
      return "bg-gray-100 text-gray-500";
  }
}

/** Devuelve el emoji según el estado */
function getStatusEmoji(status: string): string {
  switch (status) {
    case "enviado": return "✅";
    case "pendiente": return "⏳";
    case "fallido": return "❌";
    case "cancelado": return "🚫";
    default: return "📄";
  }
}

// ─── Componente Principal ─────────────────────────────────────────────────────

export default function CVSenderDashboard({ userId, userPlan = "free" }: CVSenderDashboardProps) {
  // Estado del componente
  const [pendingJobs, setPendingJobs] = useState<PendingJob[]>([]);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingJobId, setCancellingJobId] = useState<string | null>(null);

  // ── Cargar datos del servidor ──────────────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/cv-sender/status?userId=${encodeURIComponent(userId)}`);
      const data = await response.json() as {
        success?: boolean;
        error?: string;
        pendingJobs?: PendingJob[];
        history?: HistoryRecord[];
        stats?: UserStats;
        rateLimitInfo?: RateLimitInfo;
      };

      if (!response.ok || data.error) {
        throw new Error(data.error ?? "Error cargando los datos");
      }

      setPendingJobs(data.pendingJobs ?? []);
      setHistory(data.history ?? []);
      setStats(data.stats ?? null);
      setRateLimitInfo(data.rateLimitInfo ?? null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Cargar datos al montar el componente
  useEffect(() => {
    void loadData();

    // Actualizar cada 30 segundos automáticamente
    const interval = setInterval(() => void loadData(), 30_000);
    return () => clearInterval(interval);
  }, [loadData]);

  // ── Cancelar un envío pendiente ────────────────────────────────────────
  const handleCancelJob = async (jobId: string) => {
    if (!confirm("¿Seguro que quieres cancelar este envío?")) return;

    setCancellingJobId(jobId);
    try {
      const response = await fetch("/api/cv-sender/cancel", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, userId }),
      });

      const data = await response.json() as { success?: boolean; message?: string; error?: string };

      if (data.success) {
        // Actualizar la lista localmente sin recargar
        setPendingJobs((prev) => prev.filter((j) => j.id !== jobId));
        alert("✅ Envío cancelado correctamente");
      } else {
        alert(`❌ ${data.message ?? data.error ?? "No se pudo cancelar el envío"}`);
      }
    } catch {
      alert("❌ Error de conexión al cancelar el envío");
    } finally {
      setCancellingJobId(null);
    }
  };

  // ── Renderizado ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Cargando tus envíos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-600 font-medium">❌ {error}</p>
        <button
          onClick={() => void loadData()}
          className="mt-3 text-sm text-blue-600 hover:underline"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── Indicador de límite diario ────────────────────────────────── */}
      {rateLimitInfo && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800">Límite diario de envíos</h3>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium capitalize">
              Plan {userPlan}
            </span>
          </div>

          {/* Barra de progreso del límite diario */}
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, (rateLimitInfo.enviadosHoy / (rateLimitInfo.limiteHoy || 1)) * 100)}%`,
                  background: rateLimitInfo.cvsRestantesHoy === 0 ? "#EF4444" : "#2563EB",
                }}
              />
            </div>
            <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">
              {rateLimitInfo.enviadosHoy}/{rateLimitInfo.limiteHoy === Infinity ? "∞" : rateLimitInfo.limiteHoy}
            </span>
          </div>

          <p className="text-xs text-gray-500 mt-2">
            {rateLimitInfo.cvsRestantesHoy > 0
              ? `Te quedan ${rateLimitInfo.cvsRestantesHoy} CVs para enviar hoy`
              : "Has alcanzado el límite diario. El contador se reinicia a las 00:00."}
          </p>
        </div>
      )}

      {/* ── Estadísticas ──────────────────────────────────────────────── */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Total enviados */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center shadow-sm">
            <p className="text-3xl font-bold text-blue-600">{stats.totalEnviados}</p>
            <p className="text-xs text-gray-500 mt-1">Total enviados</p>
          </div>

          {/* Esta semana */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center shadow-sm">
            <p className="text-3xl font-bold text-orange-500">{stats.enviadosEstaSemana}</p>
            <p className="text-xs text-gray-500 mt-1">Esta semana</p>
          </div>

          {/* Este mes */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center shadow-sm">
            <p className="text-3xl font-bold text-blue-600">{stats.enviadosEsteMes}</p>
            <p className="text-xs text-gray-500 mt-1">Este mes</p>
          </div>

          {/* Empresas contactadas */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center shadow-sm">
            <p className="text-3xl font-bold text-orange-500">{stats.empresasContactadas}</p>
            <p className="text-xs text-gray-500 mt-1">Empresas contactadas</p>
          </div>
        </div>
      )}

      {/* ── Envíos pendientes en la cola ──────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">
            Envíos pendientes
            {pendingJobs.length > 0 && (
              <span className="ml-2 bg-blue-100 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full">
                {pendingJobs.length}
              </span>
            )}
          </h3>
          <button
            onClick={() => void loadData()}
            className="text-xs text-blue-600 hover:underline"
          >
            🔄 Actualizar
          </button>
        </div>

        {pendingJobs.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-gray-400 text-sm">No tienes envíos pendientes</p>
            <p className="text-gray-400 text-xs mt-1">¡Programa tu primer envío!</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {pendingJobs.map((job, index) => (
              <li key={job.id} className="px-5 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                {/* Posición en la cola */}
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </div>

                {/* Info del envío */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate">{job.companyName}</p>
                  <p className="text-xs text-gray-500">
                    📅 {job.scheduledForFormatted}
                  </p>
                </div>

                {/* Badge de prioridad */}
                {job.priority === "prioritario" && (
                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium">
                    ⚡ Prioritario
                  </span>
                )}

                {/* Botón cancelar */}
                <button
                  onClick={() => void handleCancelJob(job.id)}
                  disabled={cancellingJobId === job.id}
                  className="flex-shrink-0 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                  aria-label={`Cancelar envío a ${job.companyName}`}
                >
                  {cancellingJobId === job.id ? "..." : "Cancelar"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── Historial de envíos ───────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Historial de envíos</h3>
        </div>

        {history.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-gray-400 text-sm">Aún no has enviado ningún CV</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {history.map((record) => (
              <li key={record.id} className="px-5 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                {/* Emoji de estado */}
                <span className="text-xl">{getStatusEmoji(record.status)}</span>

                {/* Info del envío */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate">{record.companyName}</p>
                  {record.jobTitle && (
                    <p className="text-xs text-gray-500 truncate">💼 {record.jobTitle}</p>
                  )}
                  {record.sentAt && (
                    <p className="text-xs text-gray-400">
                      {new Date(record.sentAt).toLocaleDateString("es-ES", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  )}
                </div>

                {/* Badge de estado */}
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getStatusColor(record.status)}`}>
                  {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

    </div>
  );
}
