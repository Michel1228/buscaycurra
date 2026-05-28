"use client";

import { useState, useEffect } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";

interface Notif {
  id: number;
  user_id: string;
  tipo: string;
  titulo: string;
  mensaje: string;
  leida: boolean;
  datos?: Record<string, string>;
  created_at: string;
}

const ICONOS: Record<string, string> = {
  cv_enviado: "📤",
  nueva_oferta: "🔔",
  alerta_empleo: "💼",
  entrevista: "🎯",
  bienvenida: "👋",
  sistema: "ℹ️",
};

export default function NotificacionesPage() {
  const router = useRouter();
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState<"todas" | "no_leidas">("todas");
  const [error, setError] = useState("");

  useEffect(() => {
    cargar();
  }, []);

  async function cargar() {
    try {
      const session = (await getSupabaseBrowser().auth.getSession()).data.session;
      if (!session) { router.push("/auth/login"); return; }

      const res = await fetch(`/api/notifications?userId=${session.user.id}`);
      if (!res.ok) throw new Error("Error cargando");
      const data = await res.json() as { notificaciones: Notif[] };
      setNotifs(data.notificaciones || []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCargando(false);
    }
  }

  async function marcarLeida(id: number) {
    try {
      const session = (await getSupabaseBrowser().auth.getSession()).data.session;
      if (!session) return;
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: session.user.id, notifId: id }),
      });
      setNotifs(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n));
    } catch { /* ignore */ }
  }

  async function marcarTodas() {
    try {
      const session = (await getSupabaseBrowser().auth.getSession()).data.session;
      if (!session) return;
      for (const n of notifs.filter(n => !n.leida)) {
        await fetch("/api/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: session.user.id, notifId: n.id }),
        });
      }
      setNotifs(prev => prev.map(n => ({ ...n, leida: true })));
    } catch { /* ignore */ }
  }

  function getNotifUrl(n: Notif): string | null {
    const datos = n.datos || {};
    // Si es alerta de empleo con múltiples ofertas, ir a búsqueda, NO a una sola oferta
    if (n.tipo === "nuevas_ofertas" || n.tipo === "alerta_empleo") {
      const kw = datos.keyword || datos.location || "";
      const loc = datos.location || "";
      return `/app/buscar?keyword=${encodeURIComponent(kw)}&location=${encodeURIComponent(loc)}`;
    }
    if (datos.job_id) return `/app/ofertas/${encodeURIComponent(datos.job_id)}`;
    if (n.tipo === "cv_enviado") return "/app/envios";
    return null;
  }

  async function handleClick(n: Notif) {
    if (!n.leida) await marcarLeida(n.id);
    const url = getNotifUrl(n);
    if (url) router.push(url);
  }

  const filtradas = filtro === "no_leidas" ? notifs.filter(n => !n.leida) : notifs;
  const sinLeer = notifs.filter(n => !n.leida).length;
  const formatearFecha = (fecha: string) => {
    const d = new Date(fecha);
    const ahora = new Date();
    const diffMs = ahora.getTime() - d.getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "Ahora";
    if (mins < 60) return `Hace ${mins} min`;
    const horas = Math.floor(mins / 60);
    if (horas < 24) return `Hace ${horas}h`;
    const dias = Math.floor(horas / 24);
    return `Hace ${dias}d`;
  };

  if (cargando) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center" style={{ background: "#0f1117" }}>
        <div className="animate-spin rounded-full h-8 w-8" style={{ border: "3px solid #2d3142", borderTopColor: "#22c55e" }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16" style={{ background: "#0f1117" }}>
      <div className="py-8 px-4" style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold" style={{ color: "#fff" }}>Notificaciones</h1>
              <p className="text-xs mt-1 opacity-80" style={{ color: "#fff" }}>
                {notifs.length} notificación{notifs.length !== 1 ? "es" : ""} · {sinLeer} sin leer
              </p>
            </div>
            {sinLeer > 0 && (
              <button
                onClick={marcarTodas}
                className="text-[11px] px-3 py-1.5 rounded-lg font-medium"
                style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }}>
                Marcar todas leídas
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4">
        {/* Filtros */}
        <div className="flex gap-2 mb-4">
          {(["todas", "no_leidas"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className="text-[11px] px-4 py-2 rounded-lg font-medium transition"
              style={{
                background: filtro === f ? "rgba(34,197,94,0.12)" : "#1e212b",
                border: filtro === f ? "1px solid rgba(34,197,94,0.3)" : "1px solid #2d3142",
                color: filtro === f ? "#22c55e" : "#94a3b8",
              }}>
              {f === "todas" ? "📋 Todas" : `🔵 No leídas (${sinLeer})`}
            </button>
          ))}
        </div>

        {error && (
          <div className="rounded-xl px-4 py-3 text-sm mb-4" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444" }}>
            {error}
          </div>
        )}

        {filtradas.length === 0 ? (
          <div className="card-game p-10 text-center">
            <p className="text-4xl mb-3">🔕</p>
            <p className="font-semibold text-sm" style={{ color: "#f1f5f9" }}>
              {filtro === "no_leidas" ? "No tienes notificaciones pendientes" : "No tienes notificaciones"}
            </p>
            <p className="text-xs mt-1" style={{ color: "#64748b" }}>
              Las alertas de empleo y confirmaciones de envío aparecerán aquí
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtradas.map(n => (
              <div
                key={n.id}
                onClick={() => handleClick(n)}
                className="card-game p-4 transition cursor-pointer hover:border-green-500/20"
                style={{
                  borderLeft: n.leida ? "3px solid #2d3142" : "3px solid #22c55e",
                  opacity: n.leida ? 0.7 : 1,
                }}>
                <div className="flex items-start gap-3">
                  <span className="text-lg mt-0.5">{ICONOS[n.tipo] || "📌"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-semibold" style={{ color: n.leida ? "#94a3b8" : "#f1f5f9" }}>
                        {n.titulo}
                      </h4>
                      <span className="text-[10px] shrink-0" style={{ color: "#475569" }}>
                        {formatearFecha(n.created_at)}
                      </span>
                    </div>
                    <p className="text-[11px] mt-1 leading-relaxed" style={{ color: "#64748b" }}>
                      {n.mensaje}
                    </p>
                  </div>
                  {!n.leida && (
                    <div className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ background: "#22c55e" }} />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
