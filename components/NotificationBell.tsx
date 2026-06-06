"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

interface Notif {
  id: string;
  tipo: string;
  titulo: string;
  mensaje: string;
  leida: boolean;
  created_at: string;
  datos?: Record<string, string>;
}

const TIPO_ICON: Record<string, string> = {
  // Pipeline notifications
  cv_enviado: "📧",
  cv_visto: "👀",
  cv_visto_por_empresa: "👁️",
  en_revision: "🔍",
  respuesta_empresa: "💼",
  movido_a_entrevista: "🎯",
  oferta_recibida: "🎉",
  contratado: "🏆",
  rechazado: "📭",
  // Ofertas
  nuevas_ofertas: "🆕",
  alerta_empleo: "🔔",
  oferta_recomendada: "💡",
  // Sistema
  recordatorio: "⏰",
  bienvenida: "👋",
  plan: "💎",
  default: "📢",
};

const TIPO_NAV: Record<string, string> = {
  cv_enviado: "/app/envios",
  cv_visto: "/app/pipeline",
  cv_visto_por_empresa: "/app/pipeline",
  en_revision: "/app/pipeline",
  respuesta_empresa: "/app/pipeline",
  movido_a_entrevista: "/app/pipeline",
  oferta_recibida: "/app/pipeline",
  contratado: "/app/pipeline",
  rechazado: "/app/pipeline",
  nuevas_ofertas: "/app/notificaciones",
  alerta_empleo: "/app/notificaciones",
  oferta_recomendada: "/app/notificaciones",
  recordatorio: "/app/gusi",
  bienvenida: "/app/bienvenida",
  plan: "/app/perfil?tab=plan",
};

export default function NotificationBell({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [sinLeer, setSinLeer] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const tokenRef = useRef<string>("");
  const router = useRouter();

  // Obtener y mantener el token de sesión actualizado
  useEffect(() => {
    getSupabaseBrowser().auth.getSession().then(({ data: { session } }) => {
      if (session?.access_token) tokenRef.current = session.access_token;
    });
    const { data: { subscription } } = getSupabaseBrowser().auth.onAuthStateChange(
      (_e, session) => { if (session?.access_token) tokenRef.current = session.access_token; }
    );
    return () => subscription.unsubscribe();
  }, []);

  function getNotifUrl(n: Notif): string | null {
    const datos = n.datos || {};

    // Alertas de empleo: SIEMPRE a la página de notificaciones (expansión inline)
    if (n.tipo === "nuevas_ofertas" || n.tipo === "alerta_empleo") {
      return "/app/notificaciones";
    }

    // Si hay job_id, ir al detalle de oferta (para otros tipos: cv_enviado, cv_visto...)
    if (datos.job_id) return `/app/ofertas/${encodeURIComponent(datos.job_id)}`;

    // Usar el mapa de tipos
    if (TIPO_NAV[n.tipo]) return TIPO_NAV[n.tipo];

    return null;
  }

  useEffect(() => {
    if (!userId) return;
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 60000);
    return () => clearInterval(interval);
  }, [userId]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function fetchNotifs() {
    if (!tokenRef.current) {
      // Token aún no cargado — reintentar obteniendo sesión
      const { data: { session } } = await getSupabaseBrowser().auth.getSession();
      if (session?.access_token) tokenRef.current = session.access_token;
      else return;
    }
    try {
      const res = await fetch("/api/notifications", {
        headers: { "Authorization": `Bearer ${tokenRef.current}` },
      });
      if (!res.ok) return;
      const data = await res.json() as { notificaciones: Notif[]; sinLeer: number };
      setNotifs(data.notificaciones || []);
      setSinLeer(data.sinLeer || 0);
    } catch {}
  }

  async function marcarTodasLeidas() {
    if (!userId || !tokenRef.current) return;
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${tokenRef.current}` },
        body: JSON.stringify({ userId, marcarTodas: true }),
      });
      setNotifs((prev) => prev.map((n) => ({ ...n, leida: true })));
      setSinLeer(0);
    } catch {}
  }

  async function marcarLeida(id: string) {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${tokenRef.current}` },
        body: JSON.stringify({ notifId: id }),
      });
      setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, leida: true } : n));
      setSinLeer((prev) => Math.max(0, prev - 1));
    } catch {}
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "ahora";
    if (mins < 60) return `hace ${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `hace ${hrs}h`;
    return `hace ${Math.floor(hrs / 24)}d`;
  }

  // Calcular el color del badge según el tipo de notificación no leída
  const badgeColor = (() => {
    if (sinLeer === 0) return "#64748b";
    const hasEntrevista = notifs.some(n => !n.leida && (n.tipo === "movido_a_entrevista" || n.tipo === "respuesta_empresa"));
    if (hasEntrevista) return "#a855f7";
    const hasOferta = notifs.some(n => !n.leida && n.tipo === "oferta_recibida");
    if (hasOferta) return "#22c55e";
    return "#f59e0b";
  })();

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => { setOpen(!open); if (!open && sinLeer > 0) marcarTodasLeidas(); }}
        title="Notificaciones"
        className="relative flex items-center justify-center w-9 h-9 rounded-lg transition"
        style={{ color: sinLeer > 0 ? badgeColor : "#64748b" }}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {sinLeer > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full text-[9px] font-bold flex items-center justify-center px-1"
            style={{ background: badgeColor, color: "#0f1117" }}>
            {sinLeer > 99 ? "99+" : sinLeer}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed sm:absolute top-14 sm:top-11 left-2 right-2 sm:left-auto sm:right-0 sm:w-80 rounded-xl shadow-2xl z-50 overflow-hidden"
          style={{ background: "#1e212b", border: "1px solid #2d3142" }}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: "1px solid #2d3142" }}>
            <p className="text-xs font-semibold" style={{ color: "#f1f5f9" }}>Notificaciones</p>
            {sinLeer > 0 && (
              <button onClick={marcarTodasLeidas} className="text-[10px]" style={{ color: "#22c55e" }}>
                Marcar todas leídas
              </button>
            )}
          </div>

          {/* Lista */}
          <div className="max-h-80 overflow-y-auto">
            {notifs.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-2xl mb-2">🔔</p>
                <p className="text-xs" style={{ color: "#475569" }}>Sin notificaciones</p>
                <p className="text-[10px] mt-1" style={{ color: "#334155" }}>
                  Te avisaremos cuando Guzzi envíe tu CV o haya nuevas ofertas.
                </p>
              </div>
            ) : (
              notifs.map((n) => (
                <div key={n.id}
                  onClick={() => {
                    if (!n.leida) marcarLeida(n.id);
                    const url = getNotifUrl(n);
                    if (!url) return;
                    setOpen(false);
                    router.push(url);
                  }}
                  className="flex gap-3 px-4 py-3 cursor-pointer transition hover:bg-[#252836]"
                  style={{ borderBottom: "1px solid rgba(45,49,66,0.5)", opacity: n.leida ? 0.6 : 1 }}>
                  <span className="text-base flex-shrink-0 mt-0.5">
                    {TIPO_ICON[n.tipo] ?? TIPO_ICON.default}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate" style={{ color: "#f1f5f9" }}>{n.titulo}</p>
                    {n.mensaje && (
                      <p className="text-[10px] mt-0.5 line-clamp-2" style={{ color: "#64748b" }}>{n.mensaje}</p>
                    )}
                    <p className="text-[9px] mt-1" style={{ color: "#334155" }}>{timeAgo(n.created_at)}</p>
                  </div>
                  {!n.leida && (
                    <div className="flex-shrink-0 w-2 h-2 rounded-full mt-1.5" style={{ background: "#f59e0b" }} />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 flex items-center justify-between" style={{ borderTop: "1px solid #2d3142" }}>
            <Link href="/app/notificaciones" onClick={() => setOpen(false)}
              className="text-[10px]" style={{ color: "#475569" }}>
              Ver todas →
            </Link>
            <Link href="/app/perfil" onClick={() => setOpen(false)}
              className="text-[10px]" style={{ color: "#475569" }}>
              ⚙ Configurar
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
