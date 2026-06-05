"use client";

import { useState, useEffect, useCallback } from "react";
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

interface Oferta {
  id: string;
  titulo: string;
  empresa: string;
  ubicacion: string;
  salario: string;
  fuente: string;
  url: string;
  fecha: string;
  descripcion: string;
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

  // Estado expandido por notificación
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [ofertasPorNotif, setOfertasPorNotif] = useState<Record<number, Oferta[]>>({});
  const [cargandoOfertas, setCargandoOfertas] = useState<Set<number>>(new Set());
  const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set());
  const [enviando, setEnviando] = useState<Set<string>>(new Set());
  const [enviadosHoy, setEnviadosHoy] = useState(0);
  const [limiteDiario, setLimiteDiario] = useState(2); // default free
  const [userIdState, setUserId] = useState("");
  const [errorEnvio, setErrorEnvio] = useState("");
  const [envioExito, setEnvioExito] = useState("");

  useEffect(() => {
    cargar();
  }, []);

  async function cargar() {
    try {
      const supabase = getSupabaseBrowser();
      const session = (await supabase.auth.getSession()).data.session;
      if (!session) { router.push("/auth/login"); return; }
      const uid = session.user.id;
      setUserId(uid);

      // Cargar notificaciones
      const res = await fetch(`/api/notifications?userId=${uid}`);
      if (!res.ok) throw new Error("Error cargando");
      const data = (await res.json()) as { notificaciones: Notif[] };
      setNotifs(data.notificaciones || []);

      // Cargar envíos de hoy y plan
      const enviosRes = await fetch(`/api/cv-sender/envios-hoy?userId=${uid}`);
      if (enviosRes.ok) {
        const enviosData = (await enviosRes.json()) as { enviados: number; limite: number };
        setEnviadosHoy(enviosData.enviados || 0);
        setLimiteDiario(enviosData.limite || 2);
      }
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
      setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, leida: true } : n)));
    } catch {
      /* ignore */
    }
  }

  async function marcarTodas() {
    try {
      const session = (await getSupabaseBrowser().auth.getSession()).data.session;
      if (!session) return;
      for (const n of notifs.filter((n) => !n.leida)) {
        await fetch("/api/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: session.user.id, notifId: n.id }),
        });
      }
      setNotifs((prev) => prev.map((n) => ({ ...n, leida: true })));
    } catch {
      /* ignore */
    }
  }

  function getNotifUrl(n: Notif): string | null {
    const datos = n.datos || {};
    // alerta_empleo NO redirige — se expande inline
    if (n.tipo === "nuevas_ofertas" || n.tipo === "alerta_empleo") {
      return null; // Se expande, no navega
    }
    if (datos.job_id) return `/app/ofertas/${encodeURIComponent(datos.job_id)}`;
    if (n.tipo === "cv_enviado") return "/app/envios";
    if (n.tipo === "respuesta_empresa" || n.tipo === "cv_visto") return "/app/pipeline";
    if (n.tipo === "recordatorio") return "/app/gusi";
    return null;
  }

  const isAlertaEmpleo = (n: Notif) =>
    n.tipo === "alerta_empleo" || n.tipo === "nuevas_ofertas";

  async function toggleExpand(n: Notif) {
    if (!n.leida) await marcarLeida(n.id);

    const notifId = n.id;

    if (expandedIds.has(notifId)) {
      // Collapse
      const newSet = new Set(expandedIds);
      newSet.delete(notifId);
      setExpandedIds(newSet);
      return;
    }

    if (ofertasPorNotif[notifId]) {
      // Ya cargadas, solo expandir
      setExpandedIds(new Set([...expandedIds, notifId]));
      return;
    }

    // Fetch jobs
    setCargandoOfertas(new Set([...cargandoOfertas, notifId]));
    const datos = n.datos || {};
    const keyword = datos.keyword || "";
    const location = datos.location || "";

    try {
      const params = new URLSearchParams();
      if (keyword) params.set("keyword", keyword);
      if (location) params.set("location", location);
      params.set("limit", "50");

      const res = await fetch(`/api/jobs/search?${params.toString()}`);
      if (!res.ok) throw new Error("Error buscando ofertas");
      const data = (await res.json()) as { ofertas: Oferta[] };

      setOfertasPorNotif((prev) => ({ ...prev, [notifId]: data.ofertas || [] }));
      setExpandedIds(new Set([...expandedIds, notifId]));
    } catch (err) {
      console.error("Error expandiendo alerta:", err);
    } finally {
      const newSet = new Set(cargandoOfertas);
      newSet.delete(notifId);
      setCargandoOfertas(newSet);
    }
  }

  function toggleSelect(jobId: string) {
    setSelectedJobs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(jobId)) newSet.delete(jobId);
      else newSet.add(jobId);
      return newSet;
    });
  }

  async function enviarCV(job: Oferta) {
    if (enviadosHoy >= limiteDiario) {
      setErrorEnvio(`Límite diario alcanzado (${limiteDiario} envíos). Mejora tu plan para más.`);
      setTimeout(() => setErrorEnvio(""), 5000);
      return;
    }
    if (!userIdState) return;

    setEnviando(new Set([...enviando, job.id]));
    setErrorEnvio("");

    try {
      const res = await fetch("/api/cv-sender/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userIdState,
          jobId: job.id,
          jobTitle: job.titulo,
          company: job.empresa,
          sourceUrl: job.url,
        }),
      });

      if (!res.ok) {
        const errData = (await res.json()) as { error?: string };
        throw new Error(errData.error || "Error al enviar");
      }

      setEnviadosHoy((prev) => prev + 1);
      setEnvioExito(`✅ CV enviado a ${job.empresa}`);
      setTimeout(() => setEnvioExito(""), 4000);
    } catch (err) {
      setErrorEnvio((err as Error).message);
      setTimeout(() => setErrorEnvio(""), 5000);
    } finally {
      const newSet = new Set(enviando);
      newSet.delete(job.id);
      setEnviando(newSet);
    }
  }

  async function enviarSeleccionados(notifId: number) {
    const ofertas = ofertasPorNotif[notifId] || [];
    const seleccionadas = ofertas.filter((o) => selectedJobs.has(o.id));

    if (seleccionadas.length === 0) {
      setErrorEnvio("Selecciona al menos una oferta");
      setTimeout(() => setErrorEnvio(""), 4000);
      return;
    }

    const disponibles = limiteDiario - enviadosHoy;
    if (disponibles <= 0) {
      setErrorEnvio(`Límite diario alcanzado (${limiteDiario} envíos)`);
      setTimeout(() => setErrorEnvio(""), 4000);
      return;
    }

    const aEnviar = seleccionadas.slice(0, disponibles);

    for (const job of aEnviar) {
      await enviarCV(job);
      // Pequeña pausa entre envíos
      await new Promise((r) => setTimeout(r, 300));
    }

    setSelectedJobs(new Set());
  }

  async function handleClick(n: Notif) {
    if (isAlertaEmpleo(n)) {
      await toggleExpand(n);
      return;
    }
    if (!n.leida) await marcarLeida(n.id);
    const url = getNotifUrl(n);
    if (url) router.push(url);
  }

  const filtradas = filtro === "no_leidas" ? notifs.filter((n) => !n.leida) : notifs;
  const sinLeer = notifs.filter((n) => !n.leida).length;

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
      <div
        className="min-h-screen pt-16 flex items-center justify-center"
        style={{ background: "#0f1117" }}
      >
        <div
          className="animate-spin rounded-full h-8 w-8"
          style={{ border: "3px solid #2d3142", borderTopColor: "#22c55e" }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16" style={{ background: "#0f1117" }}>
      <div
        className="py-8 px-4"
        style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}
      >
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold" style={{ color: "#fff" }}>
                Notificaciones
              </h1>
              <p className="text-xs mt-1 opacity-80" style={{ color: "#fff" }}>
                {notifs.length} notificación{notifs.length !== 1 ? "es" : ""} · {sinLeer} sin leer
                {" · "}
                {enviadosHoy}/{limiteDiario} envíos hoy
              </p>
            </div>
            {sinLeer > 0 && (
              <button
                onClick={marcarTodas}
                className="text-[11px] px-3 py-1.5 rounded-lg font-medium"
                style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }}
              >
                Marcar todas leídas
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4">
        {/* Mensajes de error/éxito */}
        {errorEnvio && (
          <div
            className="rounded-xl px-4 py-3 text-sm mb-3"
            style={{
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.2)",
              color: "#ef4444",
            }}
          >
            {errorEnvio}
          </div>
        )}
        {envioExito && (
          <div
            className="rounded-xl px-4 py-3 text-sm mb-3"
            style={{
              background: "rgba(34,197,94,0.1)",
              border: "1px solid rgba(34,197,94,0.2)",
              color: "#22c55e",
            }}
          >
            {envioExito}
          </div>
        )}

        {/* Filtros */}
        <div className="flex gap-2 mb-4">
          {(["todas", "no_leidas"] as const).map(
            (f) => (
              <button
                key={f}
                onClick={() => setFiltro(f)}
                className="text-[11px] px-4 py-2 rounded-lg font-medium transition"
                style={{
                  background: filtro === f ? "rgba(34,197,94,0.12)" : "#1e212b",
                  border:
                    filtro === f
                      ? "1px solid rgba(34,197,94,0.3)"
                      : "1px solid #2d3142",
                  color: filtro === f ? "#22c55e" : "#94a3b8",
                }}
              >
                {f === "todas" ? "📋 Todas" : `🔵 No leídas (${sinLeer})`}
              </button>
            )
          )}
        </div>

        {error && (
          <div
            className="rounded-xl px-4 py-3 text-sm mb-4"
            style={{
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.2)",
              color: "#ef4444",
            }}
          >
            {error}
          </div>
        )}

        {filtradas.length === 0 ? (
          <div className="card-game p-10 text-center">
            <p className="text-4xl mb-3">🔕</p>
            <p className="font-semibold text-sm" style={{ color: "#f1f5f9" }}>
              {filtro === "no_leidas"
                ? "No tienes notificaciones pendientes"
                : "No tienes notificaciones"}
            </p>
            <p className="text-xs mt-1" style={{ color: "#64748b" }}>
              Las alertas de empleo y confirmaciones de envío aparecerán aquí
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtradas.map((n) => {
              const isAlerta = isAlertaEmpleo(n);
              const expanded = expandedIds.has(n.id);
              const ofertas = ofertasPorNotif[n.id] || [];
              const loading = cargandoOfertas.has(n.id);
              const totalOfertas = n.datos?.total
                ? parseInt(n.datos.total)
                : ofertas.length;

              return (
                <div key={n.id}>
                  {/* Notificación principal */}
                  <div
                    onClick={() => handleClick(n)}
                    className="card-game p-4 transition cursor-pointer hover:border-green-500/20"
                    style={{
                      borderLeft: n.leida
                        ? "3px solid #2d3142"
                        : "3px solid #22c55e",
                      opacity: n.leida ? 0.7 : 1,
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-lg mt-0.5">
                        {ICONOS[n.tipo] || "📌"}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4
                            className="text-xs font-semibold"
                            style={{
                              color: n.leida ? "#94a3b8" : "#f1f5f9",
                            }}
                          >
                            {n.titulo}
                          </h4>
                          <span
                            className="text-[10px] shrink-0"
                            style={{ color: "#475569" }}
                          >
                            {formatearFecha(n.created_at)}
                          </span>
                        </div>
                        <p
                          className="text-[11px] mt-1 leading-relaxed"
                          style={{ color: "#64748b" }}
                        >
                          {n.mensaje}
                        </p>
                        {isAlerta && (
                          <div className="flex items-center gap-2 mt-2">
                            <span
                              className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                              style={{
                                background: "rgba(34,197,94,0.1)",
                                color: "#22c55e",
                              }}
                            >
                              {expanded ? "▲ Ocultar" : "▼ Ver ofertas"}
                              {totalOfertas > 0 && ` (${totalOfertas})`}
                            </span>
                            {!expanded && totalOfertas > 0 && (
                              <span
                                className="text-[10px]"
                                style={{ color: "#475569" }}
                              >
                                {n.datos?.keyword
                                  ? `"${n.datos.keyword}"`
                                  : ""}
                                {n.datos?.location
                                  ? ` en ${n.datos.location}`
                                  : ""}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      {!n.leida && (
                        <div
                          className="w-2 h-2 rounded-full shrink-0 mt-1.5"
                          style={{ background: "#22c55e" }}
                        />
                      )}
                    </div>
                  </div>

                  {/* Ofertas expandidas */}
                  {expanded && isAlerta && (
                    <div
                      className="mt-2 ml-4 border-l-2 pl-4 py-2 space-y-2"
                      style={{ borderColor: "rgba(34,197,94,0.15)" }}
                    >
                      {loading ? (
                        <div className="flex items-center gap-2 py-4">
                          <div
                            className="animate-spin rounded-full h-4 w-4"
                            style={{
                              border: "2px solid #2d3142",
                              borderTopColor: "#22c55e",
                            }}
                          />
                          <span
                            className="text-[11px]"
                            style={{ color: "#64748b" }}
                          >
                            Buscando ofertas...
                          </span>
                        </div>
                      ) : ofertas.length === 0 ? (
                        <p
                          className="text-[11px] py-2"
                          style={{ color: "#64748b" }}
                        >
                          No se encontraron ofertas para esta alerta.
                        </p>
                      ) : (
                        <>
                          {/* Barra de acciones */}
                          <div className="flex items-center justify-between mb-2">
                            <span
                              className="text-[10px]"
                              style={{ color: "#64748b" }}
                            >
                              {ofertas.length} oferta
                              {ofertas.length !== 1 ? "s" : ""}
                              {selectedJobs.size > 0 &&
                                ` · ${selectedJobs.size} seleccionada${selectedJobs.size !== 1 ? "s" : ""}`}
                            </span>
                            <div className="flex gap-2">
                              {selectedJobs.size > 0 && (
                                <button
                                  onClick={() => enviarSeleccionados(n.id)}
                                  disabled={enviadosHoy >= limiteDiario}
                                  className="text-[10px] px-3 py-1.5 rounded-lg font-semibold transition"
                                  style={{
                                    background:
                                      enviadosHoy >= limiteDiario
                                        ? "#1e212b"
                                        : "linear-gradient(135deg, #22c55e, #16a34a)",
                                    color:
                                      enviadosHoy >= limiteDiario
                                        ? "#64748b"
                                        : "#fff",
                                    opacity:
                                      enviadosHoy >= limiteDiario ? 0.5 : 1,
                                  }}
                                >
                                  Enviar {selectedJobs.size} CV
                                  {selectedJobs.size > 1 ? "s" : ""}
                                </button>
                              )}
                              <button
                                onClick={() =>
                                  setSelectedJobs(
                                    new Set(ofertas.map((o) => o.id))
                                  )
                                }
                                className="text-[10px] px-2 py-1.5 rounded-lg font-medium transition"
                                style={{
                                  background: "#1e212b",
                                  border: "1px solid #2d3142",
                                  color: "#94a3b8",
                                }}
                              >
                                Seleccionar todas
                              </button>
                            </div>
                          </div>

                          {/* Lista de ofertas */}
                          {ofertas.map((o) => {
                            const selected = selectedJobs.has(o.id);
                            const sending = enviando.has(o.id);
                            return (
                              <div
                                key={o.id}
                                className="card-game p-3 flex items-start gap-3 transition"
                                style={{
                                  borderColor: selected
                                    ? "rgba(34,197,94,0.4)"
                                    : "#2d3142",
                                  background: selected
                                    ? "rgba(34,197,94,0.04)"
                                    : "#1e212b",
                                }}
                              >
                                {/* Checkbox */}
                                <button
                                  onClick={() => toggleSelect(o.id)}
                                  className="shrink-0 mt-1 w-4 h-4 rounded border-2 flex items-center justify-center transition"
                                  style={{
                                    borderColor: selected
                                      ? "#22c55e"
                                      : "#2d3142",
                                    background: selected
                                      ? "#22c55e"
                                      : "transparent",
                                  }}
                                >
                                  {selected && (
                                    <span
                                      className="text-[9px] font-bold"
                                      style={{ color: "#0f1117" }}
                                    >
                                      ✓
                                    </span>
                                  )}
                                </button>

                                {/* Info */}
                                <div
                                  className="flex-1 min-w-0 cursor-pointer"
                                  onClick={() =>
                                    router.push(
                                      `/app/ofertas/${encodeURIComponent(o.id)}`
                                    )
                                  }
                                >
                                  <h5
                                    className="text-[11px] font-semibold truncate"
                                    style={{ color: "#f1f5f9" }}
                                  >
                                    {o.titulo}
                                  </h5>
                                  <p
                                    className="text-[10px] mt-0.5"
                                    style={{ color: "#94a3b8" }}
                                  >
                                    {o.empresa}
                                    {o.ubicacion ? ` · ${o.ubicacion}` : ""}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    {o.salario &&
                                      o.salario !== "Ver en oferta" && (
                                        <span
                                          className="text-[9px] px-1.5 py-0.5 rounded font-medium"
                                          style={{
                                            background:
                                              "rgba(34,197,94,0.08)",
                                            color: "#22c55e",
                                          }}
                                        >
                                          {o.salario}
                                        </span>
                                      )}
                                    <span
                                      className="text-[9px]"
                                      style={{ color: "#334155" }}
                                    >
                                      {o.fuente}
                                    </span>
                                  </div>
                                </div>

                                {/* Botón enviar individual */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    enviarCV(o);
                                  }}
                                  disabled={
                                    enviadosHoy >= limiteDiario || sending
                                  }
                                  className="shrink-0 text-[10px] px-3 py-1.5 rounded-lg font-semibold transition"
                                  style={{
                                    background:
                                      enviadosHoy >= limiteDiario || sending
                                        ? "#1e212b"
                                        : "rgba(34,197,94,0.1)",
                                    border:
                                      enviadosHoy >= limiteDiario || sending
                                        ? "1px solid #2d3142"
                                        : "1px solid rgba(34,197,94,0.3)",
                                    color:
                                      enviadosHoy >= limiteDiario || sending
                                        ? "#475569"
                                        : "#22c55e",
                                  }}
                                >
                                  {sending ? (
                                    <div
                                      className="animate-spin rounded-full h-3 w-3 inline-block"
                                      style={{
                                        border: "2px solid #2d3142",
                                        borderTopColor: "#22c55e",
                                      }}
                                    />
                                  ) : (
                                    "Enviar CV"
                                  )}
                                </button>
                              </div>
                            );
                          })}
                        </>
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
