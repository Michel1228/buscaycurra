"use client";

import { useState, useEffect, useRef } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import { Bell, Briefcase, Upload, Pin, BellOff, ClipboardList, ChevronDown, ChevronUp, ExternalLink, Send } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Notif {
  id: string;
  user_id: string;
  tipo: string;
  titulo: string;
  mensaje: string;
  leida: boolean;
  datos?: Record<string, string>;
  created_at: string;
}

interface Oferta {
  id: string;
  titulo: string;
  empresa: string;
  ubicacion: string;
  salario: string;
  fuente: string;
  url: string;
}

const ICONOS: Record<string, LucideIcon> = {
  cv_enviado: Upload,
  nueva_oferta: Bell,
  nuevo_empleo: Bell,
  alerta_empleo: Briefcase,
  nuevas_ofertas: Briefcase,
};

export default function NotificacionesPage() {
  const router = useRouter();
  const tokenRef = useRef("");
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState<"todas" | "no_leidas">("todas");
  const [error, setError] = useState("");

  // Expand state
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [ofertasPorNotif, setOfertasPorNotif] = useState<Record<string, Oferta[]>>({});
  const [cargandoOfertas, setCargandoOfertas] = useState<Set<string>>(new Set());

  // Envío de CV
  const [enviando, setEnviando] = useState<Set<string>>(new Set());
  const [enviadosHoy, setEnviadosHoy] = useState(0);
  const [limiteDiario, setLimiteDiario] = useState(3);
  const [toast, setToast] = useState("");
  const [toastError, setToastError] = useState("");

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    try {
      const supabase = getSupabaseBrowser();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/auth/login"); return; }
      tokenRef.current = session.access_token;

      const [notifRes, enviosRes] = await Promise.all([
        fetch("/api/notifications", { headers: { Authorization: `Bearer ${session.access_token}` } }),
        fetch(`/api/cv-sender/envios-hoy?userId=${session.user.id}`, { headers: { Authorization: `Bearer ${session.access_token}` } }),
      ]);

      if (!notifRes.ok) throw new Error("Error cargando notificaciones");
      const data = (await notifRes.json()) as { notificaciones: Notif[] };
      setNotifs(data.notificaciones || []);

      if (enviosRes.ok) {
        const ev = (await enviosRes.json()) as { enviados: number; limite: number };
        setEnviadosHoy(ev.enviados || 0);
        setLimiteDiario(ev.limite || 3);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCargando(false);
    }
  }

  async function marcarLeida(id: string) {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenRef.current}` },
        body: JSON.stringify({ notifId: id }),
      });
      setNotifs(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n));
    } catch { /* ignore */ }
  }

  async function marcarTodas() {
    try {
      for (const n of notifs.filter(n => !n.leida)) {
        await fetch("/api/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenRef.current}` },
          body: JSON.stringify({ notifId: n.id }),
        });
      }
      setNotifs(prev => prev.map(n => ({ ...n, leida: true })));
    } catch { /* ignore */ }
  }

  const isAlerta = (n: Notif) => n.tipo === "alerta_empleo" || n.tipo === "nuevas_ofertas";

  function getNonAlertaUrl(n: Notif): string | null {
    const datos = n.datos || {};
    if (datos.job_id) return `/app/ofertas/${encodeURIComponent(datos.job_id)}`;
    if (n.tipo === "nuevo_empleo") {
      const p = new URLSearchParams();
      if (datos.keyword) p.set("keyword", datos.keyword);
      if (datos.location) p.set("location", datos.location);
      return `/app/buscar?${p.toString()}`;
    }
    if (n.tipo === "cv_enviado") return "/app/envios";
    if (n.tipo === "respuesta_empresa" || n.tipo === "cv_visto") return "/app/pipeline";
    if (n.tipo === "recordatorio") return "/app/gusi";
    return null;
  }

  async function toggleExpand(n: Notif) {
    if (!n.leida) await marcarLeida(n.id);

    if (expandedIds.has(n.id)) {
      setExpandedIds(prev => { const s = new Set(prev); s.delete(n.id); return s; });
      return;
    }

    // Si ya tenemos las ofertas cargadas, solo expandir
    if (ofertasPorNotif[n.id]) {
      setExpandedIds(prev => new Set([...prev, n.id]));
      return;
    }

    // Cargar las ofertas específicas de esta notificación
    setCargandoOfertas(prev => new Set([...prev, n.id]));
    const datos = n.datos || {};

    try {
      let ofertas: Oferta[] = [];

      if (datos.job_ids) {
        // Ofertas exactas guardadas al crear la notificación
        const res = await fetch(`/api/jobs/by-ids?ids=${encodeURIComponent(datos.job_ids)}`);
        if (res.ok) {
          const d = (await res.json()) as { ofertas: Oferta[] };
          ofertas = d.ofertas || [];
        }
      }

      // Fallback: buscar por keyword si no hay job_ids o no devolvió nada
      if (ofertas.length === 0 && (datos.keyword || datos.location)) {
        const p = new URLSearchParams();
        if (datos.keyword) p.set("keyword", datos.keyword);
        if (datos.location) p.set("location", datos.location);
        p.set("limit", datos.total || "3");
        const res = await fetch(`/api/jobs/search?${p.toString()}`);
        if (res.ok) {
          const d = (await res.json()) as { ofertas: Oferta[] };
          ofertas = (d.ofertas || []).slice(0, parseInt(datos.total || "3", 10));
        }
      }

      setOfertasPorNotif(prev => ({ ...prev, [n.id]: ofertas }));
      setExpandedIds(prev => new Set([...prev, n.id]));
    } catch (err) {
      console.error("[notificaciones] Error cargando ofertas:", err);
    } finally {
      setCargandoOfertas(prev => { const s = new Set(prev); s.delete(n.id); return s; });
    }
  }

  async function enviarCV(oferta: Oferta) {
    if (enviadosHoy >= limiteDiario) {
      setToastError(`Límite diario alcanzado (${limiteDiario} envíos). Mejora tu plan para más.`);
      setTimeout(() => setToastError(""), 5000);
      return;
    }

    // Extraer email de la URL de la oferta
    let email = "";
    if (oferta.url) {
      try {
        const domain = new URL(oferta.url).hostname.replace(/^www\./, "");
        const boards = ["adzuna", "jooble", "careerjet", "infojobs", "indeed", "linkedin", "monster"];
        if (!boards.some(b => domain.includes(b))) email = `empleo@${domain}`;
      } catch { /* ignore */ }
    }
    if (!email) {
      setToastError("No hay email disponible para esta oferta.");
      setTimeout(() => setToastError(""), 4000);
      return;
    }

    setEnviando(prev => new Set([...prev, oferta.id]));
    try {
      const res = await fetch("/api/cv-sender/send", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenRef.current}` },
        body: JSON.stringify({
          companyName: oferta.empresa,
          companyEmail: email,
          companyUrl: oferta.url,
          jobTitle: oferta.titulo,
          strategy: "ahora",
        }),
      });
      if (!res.ok) {
        const e = (await res.json()) as { error?: string };
        throw new Error(e.error || "Error al enviar");
      }
      setEnviadosHoy(prev => prev + 1);
      setToast(`CV enviado a ${oferta.empresa}`);
      setTimeout(() => setToast(""), 4000);
    } catch (err) {
      setToastError((err as Error).message);
      setTimeout(() => setToastError(""), 5000);
    } finally {
      setEnviando(prev => { const s = new Set(prev); s.delete(oferta.id); return s; });
    }
  }

  async function handleClick(n: Notif) {
    if (isAlerta(n)) {
      await toggleExpand(n);
      return;
    }
    if (!n.leida) await marcarLeida(n.id);
    const url = getNonAlertaUrl(n);
    if (url) router.push(url);
  }

  const filtradas = filtro === "no_leidas" ? notifs.filter(n => !n.leida) : notifs;
  const sinLeer = notifs.filter(n => !n.leida).length;

  const formatFecha = (fecha: string) => {
    const mins = Math.floor((Date.now() - new Date(fecha).getTime()) / 60000);
    if (mins < 1) return "Ahora";
    if (mins < 60) return `Hace ${mins} min`;
    const h = Math.floor(mins / 60);
    if (h < 24) return `Hace ${h}h`;
    return `Hace ${Math.floor(h / 24)}d`;
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
      {/* Cabecera */}
      <div className="py-8 px-4" style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}>
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: "#fff" }}>Notificaciones</h1>
            <p className="text-xs mt-1 opacity-80" style={{ color: "#fff" }}>
              {notifs.length} notificación{notifs.length !== 1 ? "es" : ""} · {sinLeer} sin leer · {enviadosHoy}/{limiteDiario} envíos hoy
            </p>
          </div>
          {sinLeer > 0 && (
            <button onClick={marcarTodas} className="text-[11px] px-3 py-1.5 rounded-lg font-medium"
              style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }}>
              Marcar todas leídas
            </button>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4">
        {/* Toasts */}
        {toast && (
          <div className="rounded-xl px-4 py-3 text-sm mb-3" style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", color: "#22c55e" }}>
            {toast}
          </div>
        )}
        {toastError && (
          <div className="rounded-xl px-4 py-3 text-sm mb-3" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444" }}>
            {toastError}
          </div>
        )}

        {/* Filtros */}
        <div className="flex gap-2 mb-4">
          {(["todas", "no_leidas"] as const).map(f => (
            <button key={f} onClick={() => setFiltro(f)} className="text-[11px] px-4 py-2 rounded-lg font-medium transition"
              style={{
                background: filtro === f ? "rgba(34,197,94,0.12)" : "#1e212b",
                border: filtro === f ? "1px solid rgba(34,197,94,0.3)" : "1px solid #2d3142",
                color: filtro === f ? "#22c55e" : "#94a3b8",
              }}>
              {f === "todas" ? <><ClipboardList size={12} strokeWidth={1.8} className="inline mr-1" />Todas</> : `No leídas (${sinLeer})`}
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
            <div className="flex justify-center mb-3"><BellOff size={40} strokeWidth={1.2} style={{ color: "#94a3b8" }} /></div>
            <p className="font-semibold text-sm" style={{ color: "#f1f5f9" }}>
              {filtro === "no_leidas" ? "No tienes notificaciones pendientes" : "No tienes notificaciones"}
            </p>
            <p className="text-xs mt-1" style={{ color: "#64748b" }}>Las alertas de empleo aparecerán aquí</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtradas.map(n => {
              const Icon = ICONOS[n.tipo] ?? Pin;
              const expanded = expandedIds.has(n.id);
              const ofertas = ofertasPorNotif[n.id] || [];
              const loadingOfertas = cargandoOfertas.has(n.id);
              const alerta = isAlerta(n);
              const datos = n.datos || {};

              return (
                <div key={n.id}>
                  {/* Cabecera de notificación */}
                  <div
                    onClick={() => handleClick(n)}
                    className="card-game p-4 transition cursor-pointer hover:border-green-500/20"
                    style={{
                      borderLeft: n.leida ? "3px solid #2d3142" : "3px solid #22c55e",
                      opacity: n.leida ? 0.7 : 1,
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <Icon size={18} strokeWidth={1.8} className="mt-0.5 shrink-0"
                        style={{ color: n.leida ? "#64748b" : "#22c55e" }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-xs font-semibold" style={{ color: n.leida ? "#94a3b8" : "#f1f5f9" }}>
                            {n.titulo}
                          </h4>
                          <span className="text-[10px] shrink-0" style={{ color: "#6b7280" }}>
                            {formatFecha(n.created_at)}
                          </span>
                        </div>
                        <p className="text-[11px] mt-1 leading-relaxed" style={{ color: "#64748b" }}>
                          {n.mensaje}
                        </p>
                        {alerta && (
                          <div className="flex items-center gap-1.5 mt-2">
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1"
                              style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e" }}>
                              {expanded
                                ? <><ChevronUp size={10} />Ocultar ofertas</>
                                : <><ChevronDown size={10} />Ver {datos.total || ""} oferta{parseInt(datos.total || "1") !== 1 ? "s" : ""}</>}
                            </span>
                            {datos.keyword && (
                              <span className="text-[10px]" style={{ color: "#6b7280" }}>
                                "{datos.keyword}"{datos.location ? ` · ${datos.location}` : ""}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      {!n.leida && (
                        <div className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ background: "#22c55e" }} />
                      )}
                    </div>
                  </div>

                  {/* Ofertas expandidas */}
                  {expanded && alerta && (
                    <div className="mt-1 ml-4 border-l-2 pl-4 pb-2 space-y-2" style={{ borderColor: "rgba(34,197,94,0.15)" }}>
                      {loadingOfertas ? (
                        <div className="flex items-center gap-2 py-4">
                          <div className="animate-spin rounded-full h-4 w-4"
                            style={{ border: "2px solid #2d3142", borderTopColor: "#22c55e" }} />
                          <span className="text-[11px]" style={{ color: "#64748b" }}>Cargando ofertas...</span>
                        </div>
                      ) : ofertas.length === 0 ? (
                        <p className="text-[11px] py-3" style={{ color: "#64748b" }}>
                          Las ofertas ya no están disponibles. Prueba a buscar en el buscador.
                        </p>
                      ) : (
                        ofertas.map(o => {
                          const sending = enviando.has(o.id);
                          const limitado = enviadosHoy >= limiteDiario;
                          return (
                            <div key={o.id} className="card-game p-3" style={{ background: "#1a1d27" }}>
                              <div className="flex items-start gap-3">
                                <div className="flex-1 min-w-0">
                                  <h5 className="text-[12px] font-semibold truncate" style={{ color: "#f1f5f9" }}>
                                    {o.titulo}
                                  </h5>
                                  <p className="text-[11px] mt-0.5" style={{ color: "#94a3b8" }}>
                                    {o.empresa}{o.ubicacion ? ` · ${o.ubicacion}` : ""}
                                  </p>
                                  {o.salario && o.salario !== "Ver en oferta" && (
                                    <span className="inline-block text-[10px] px-1.5 py-0.5 rounded mt-1 font-medium"
                                      style={{ background: "rgba(34,197,94,0.08)", color: "#22c55e" }}>
                                      {o.salario}
                                    </span>
                                  )}
                                </div>
                                <div className="flex flex-col gap-1.5 shrink-0">
                                  {/* Ver oferta */}
                                  <button
                                    onClick={() => router.push(`/app/ofertas/${encodeURIComponent(o.id)}`)}
                                    className="text-[10px] px-2.5 py-1.5 rounded-lg font-medium flex items-center gap-1 transition"
                                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid #2d3142", color: "#94a3b8" }}
                                  >
                                    <ExternalLink size={10} />Ver
                                  </button>
                                  {/* Enviar CV */}
                                  <button
                                    onClick={() => enviarCV(o)}
                                    disabled={limitado || sending}
                                    className="text-[10px] px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1 transition disabled:opacity-40"
                                    style={{
                                      background: limitado || sending ? "#1e212b" : "rgba(34,197,94,0.12)",
                                      border: `1px solid ${limitado || sending ? "#2d3142" : "rgba(34,197,94,0.3)"}`,
                                      color: limitado || sending ? "#64748b" : "#22c55e",
                                    }}
                                  >
                                    {sending
                                      ? <div className="animate-spin rounded-full h-3 w-3" style={{ border: "2px solid #2d3142", borderTopColor: "#22c55e" }} />
                                      : <><Send size={9} />CV</>}
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
