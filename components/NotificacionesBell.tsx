"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

interface Notificacion {
  id: string;
  tipo: string;
  titulo: string;
  mensaje: string;
  datos: Record<string, string>;
  leida: boolean;
  created_at: string;
}

const ICONOS: Record<string, string> = {
  respuesta_empresa: "💬",
  cv_enviado: "📧",
  cv_visto: "👀",
  recordatorio: "⏰",
  info: "ℹ️",
  nuevo_empleo: "🔔",
};

const COLORES: Record<string, string> = {
  respuesta_empresa: "#60d090",
  cv_enviado: "#7ed56f",
  cv_visto: "#a070d0",
  recordatorio: "#f0c040",
  info: "#b0a890",
  nuevo_empleo: "#e07850",
};

function getNotifUrl(n: Notificacion): string {
  switch (n.tipo) {
    case "respuesta_empresa":
    case "cv_visto":
    case "cv_enviado":
    case "recordatorio":
      return "/app/envios?tab=envios";
    case "nuevo_empleo":
      return n.datos?.keyword
        ? `/app/buscar?keyword=${encodeURIComponent(n.datos.keyword)}`
        : "/app/buscar";
    default:
      return "/app";
  }
}

export default function NotificacionesBell() {
  const router = useRouter();
  const [notifs, setNotifs] = useState<Notificacion[]>([]);
  const [sinLeer, setSinLeer] = useState(0);
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const tokenRef = useRef<string>("");

  // Carga inicial + suscripción Supabase Realtime
  useEffect(() => {
    async function init() {
      const { data: { session } } = await getSupabaseBrowser().auth.getSession();
      if (!session) return;
      const user = session.user;
      tokenRef.current = session.access_token;
      setUserId(user.id);

      // Carga inicial desde API
      try {
        const res = await fetch("/api/notifications", {
          headers: { "Authorization": `Bearer ${session.access_token}` },
        });
        const data = await res.json();
        setNotifs(data.notificaciones || []);
        setSinLeer(data.sinLeer || 0);
      } catch {
        setNotifs([]);
        setSinLeer(0);
      }

      // Suscripción en tiempo real — llega al instante sin polling
      const canal = getSupabaseBrowser()
        .channel(`notifs-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notificaciones",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const nueva = payload.new as Notificacion;
            setNotifs((prev) => [nueva, ...prev].slice(0, 50));
            setSinLeer((prev) => prev + 1);

            // Notificación nativa del navegador si hay permiso
            if (typeof Notification !== "undefined" && Notification.permission === "granted") {
              new Notification(nueva.titulo, {
                body: nueva.mensaje,
                icon: "/qr-buscaycurra.png",
              });
            }
          }
        )
        .subscribe();

      return () => { canal.unsubscribe(); };
    }

    init();
  }, []);

  // Cerrar panel al clicar fuera
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  async function handleClickNotif(n: Notificacion) {
    // 1. Marcar como leída (optimistic)
    if (!n.leida) {
      setNotifs((prev) => prev.map((x) => x.id === n.id ? { ...x, leida: true } : x));
      setSinLeer((prev) => Math.max(0, prev - 1));
      fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${tokenRef.current}` },
        body: JSON.stringify({ notifId: n.id }),
      }).catch(() => {});
    }
    // 2. Cerrar panel
    setOpen(false);
    // 3. Navegar dentro de la app
    router.push(getNotifUrl(n));
  }

  async function marcarTodas() {
    if (!userId) return;
    setNotifs((prev) => prev.map((n) => ({ ...n, leida: true })));
    setSinLeer(0);
    fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${tokenRef.current}` },
      body: JSON.stringify({ userId, marcarTodas: true }),
    }).catch(() => {});
  }

  function formatTiempo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "ahora";
    if (mins < 60) return `hace ${mins}min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `hace ${hours}h`;
    return `hace ${Math.floor(hours / 24)}d`;
  }

  return (
    <div className="relative" ref={panelRef}>
      {/* Botón campana */}
      <button
        onClick={() => setOpen(!open)}
        className="relative w-10 h-10 rounded-xl flex items-center justify-center transition hover:scale-105"
        style={{
          background: open ? "rgba(126,213,111,0.15)" : "rgba(42,42,30,0.6)",
          border: `1px solid ${open ? "rgba(126,213,111,0.3)" : "#3d3c30"}`,
        }}
        aria-label="Notificaciones"
      >
        <span className="text-lg">🔔</span>
        {sinLeer > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center text-[10px] font-bold animate-pulse"
            style={{ background: "#ef4444", color: "#fff" }}
          >
            {sinLeer > 9 ? "9+" : sinLeer}
          </span>
        )}
      </button>

      {/* Panel desplegable */}
      {open && (
        <div
          className="absolute right-0 top-12 w-80 max-h-96 overflow-y-auto rounded-2xl shadow-2xl z-50"
          style={{
            background: "#1e1e14",
            border: "1px solid #3d3c30",
            boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
          }}
        >
          {/* Cabecera */}
          <div
            className="sticky top-0 px-4 py-3 flex items-center justify-between"
            style={{ background: "#1e1e14", borderBottom: "1px solid #2a2a1e" }}
          >
            <span className="font-bold text-sm" style={{ color: "#f0ebe0" }}>
              Notificaciones
            </span>
            {sinLeer > 0 && (
              <button
                onClick={marcarTodas}
                className="text-xs hover:underline"
                style={{ color: "#7ed56f" }}
              >
                Marcar todas
              </button>
            )}
          </div>

          {/* Lista */}
          {notifs.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <p className="text-3xl mb-2">🔕</p>
              <p className="text-sm" style={{ color: "#706a58" }}>Sin notificaciones</p>
              <p className="text-xs mt-1" style={{ color: "#504a3a" }}>
                Te avisaremos cuando una empresa responda
              </p>
            </div>
          ) : (
            <div>
              {notifs.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleClickNotif(n)}
                  className="w-full px-4 py-3 text-left flex items-start gap-3 transition hover:opacity-80"
                  style={{
                    background: n.leida ? "transparent" : "rgba(126,213,111,0.04)",
                    borderBottom: "1px solid #2a2a1e",
                  }}
                >
                  <span className="text-xl mt-0.5 shrink-0">
                    {ICONOS[n.tipo] || "📌"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xs font-bold truncate"
                        style={{ color: n.leida ? "#706a58" : (COLORES[n.tipo] || "#f0ebe0") }}
                      >
                        {n.titulo}
                      </span>
                      {!n.leida && (
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: "#7ed56f" }} />
                      )}
                    </div>
                    {n.mensaje && (
                      <p
                        className="text-[11px] mt-0.5 line-clamp-2"
                        style={{ color: n.leida ? "#504a3a" : "#b0a890" }}
                      >
                        {n.mensaje}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px]" style={{ color: "#504a3a" }}>
                        {formatTiempo(n.created_at)}
                      </span>
                      {!n.leida && (
                        <span className="text-[10px]" style={{ color: "#7ed56f" }}>
                          Toca para ver →
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
