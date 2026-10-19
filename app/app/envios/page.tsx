"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import Link from "next/link";
import UsageCounter from "@/components/UsageCounter";
import { Mail, MailCheck, MailX, Eye, MessageCircle, Clock, X, Ban, FileText, Briefcase, MapPin, Phone, Send } from "lucide-react";
import { formatLocalDate } from "@/lib/timezone";

interface Envio {
  id: string;
  company_name: string;
  company_email: string;
  job_title?: string;
  status: string;
  sent_at?: string;
  created_at: string;
  cover_letter?: string;
  cv_snapshot?: string;
}

function StatusIcon({ status, size = 24 }: { status: string; size?: number }) {
  switch (status) {
    case "enviado": return <Mail size={size} />;
    case "entregado": return <MailCheck size={size} />;
    case "rebotado": return <MailX size={size} />;
    case "visto": return <Eye size={size} />;
    case "respondido": return <MessageCircle size={size} />;
    case "pendiente": return <Clock size={size} />;
    case "fallido": return <X size={size} />;
    case "cancelado": return <Ban size={size} />;
    default: return <Send size={size} />;
  }
}
const STATUS_COLOR: Record<string, string> = {
  enviado: "#22c55e", entregado: "#22c55e", visto: "#a855f7", respondido: "#f59e0b",
  pendiente: "#64748b", fallido: "#ef4444", rebotado: "#ef4444", cancelado: "#64748b",
};
// "entregado" y "rebotado" los pone el aviso de entrega de Resend (017_cv_sends_entrega):
// antes salían en minúscula, sin color y fuera de los filtros.
const STATUS_TEXTO: Record<string, string> = {
  pendiente: "Programado", enviado: "Enviado", entregado: "Entregado", visto: "Visto",
  respondido: "Respondido", fallido: "Falló", rebotado: "No llegó", cancelado: "Cancelado",
};
/** Cada filtro y los estados que recoge: "Enviado" incluye los ya entregados. */
const FILTROS: { id: string; estados: string[] }[] = [
  { id: "todos", estados: [] },
  { id: "pendiente", estados: ["pendiente"] },
  { id: "enviado", estados: ["enviado", "entregado"] },
  { id: "visto", estados: ["visto"] },
  { id: "respondido", estados: ["respondido"] },
  { id: "fallido", estados: ["fallido", "rebotado"] },
];
const textoEstado = (s: string) => STATUS_TEXTO[s] ?? s.charAt(0).toUpperCase() + s.slice(1);

export default function EnviosPage() {
  const router = useRouter();
  const [envios, setEnvios] = useState<Envio[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<string>("todos");
  const [detalle, setDetalle] = useState<Envio | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await getSupabaseBrowser().auth.getSession();
      if (!session) { router.push("/auth/login"); return; }

      const res = await fetch("/api/cv-sender/status", {
        headers: { "Authorization": `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const historial: Envio[] = (data.history || []).map((h: Record<string, string>) => ({
          id: h.id,
          company_name: h.companyName,
          company_email: h.companyEmail,
          job_title: h.jobTitle,
          status: h.status,
          sent_at: h.sentAt,
          created_at: h.createdAt,
          cover_letter: h.coverLetter || "",
          cv_snapshot: h.cvSnapshot || "",
        }));
        // Pending jobs también
        const pending: Envio[] = (data.pendingJobs || []).map((p: Record<string, string>) => ({
          id: p.id,
          company_name: p.companyName,
          company_email: "",
          job_title: undefined,
          status: "pendiente",
          sent_at: undefined,
          created_at: p.scheduledFor,
        }));
        setEnvios([...pending, ...historial]);
      }
      setLoading(false);
    }
    load();
  }, [router]);

  const estadosDe = (f: string) => FILTROS.find(x => x.id === f)?.estados ?? [f];
  const filtrados = filtro === "todos" ? envios : envios.filter(e => estadosDe(filtro).includes(e.status));
  const contadores = Object.fromEntries(FILTROS.map(f => [f.id, envios.filter(e => estadosDe(f.id).includes(e.status)).length]));

  async function cancelarEnvio(id: string) {
    const { data: { session } } = await getSupabaseBrowser().auth.getSession();
    if (!session) return;
    const res = await fetch("/api/cv-sender/cancel", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session.access_token}` },
      body: JSON.stringify({ jobId: id }),
    });
    if (res.ok) {
      setEnvios(prev => prev.map(e => e.id === id ? { ...e, status: "cancelado" } : e));
    }
  }

  async function eliminarEnvio(id: string) {
    const { data: { session } } = await getSupabaseBrowser().auth.getSession();
    if (!session) return;
    const res = await fetch("/api/cv-sender/delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session.access_token}` },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setEnvios(prev => prev.filter(e => e.id !== id));
    }
  }

  async function eliminarTodos() {
    if (!confirm("¿Vaciar la lista? Los CV ya enviados no se anulan: solo dejan de salir aquí.")) return;
    const { data: { session } } = await getSupabaseBrowser().auth.getSession();
    if (!session) return;
    const res = await fetch("/api/cv-sender/delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session.access_token}` },
      body: JSON.stringify({ all: true }),
    });
    if (res.ok) setEnvios([]);
  }

  return (
    <div className="min-h-screen pt-16 pb-10 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Mis envíos de CV</h1>
            <p className="text-sm text-slate-400">
              {envios.length} envíos en total ·{" "}
              <Link href="/app/empresas" className="text-green-400 underline">Enviar nuevo CV →</Link>
            </p>
          </div>
        </div>

        {/* Contador de uso del plan */}
        <div className="mb-4 -mx-1">
          <UsageCounter compact />
        </div>

        {/* Filtros */}
        <div className="flex gap-2 flex-wrap mb-5">
          {FILTROS.map(({ id: f }) => (
            <button key={f} onClick={() => setFiltro(f)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition"
              style={{
                background: filtro === f ? "#22c55e" : "rgba(255,255,255,0.06)",
                color: filtro === f ? "#0a0a0a" : "#94a3b8",
                border: `1px solid ${filtro === f ? "#22c55e" : "rgba(255,255,255,0.1)"}`,
              }}>
              <StatusIcon status={f} size={12} />
              {f === "todos" ? "Todos" : textoEstado(f)}
              {f !== "todos" && contadores[f] ? ` (${contadores[f]})` : ""}
            </button>
          ))}
        </div>

        {/* Lista */}
        {loading ? (
          <div className="text-center py-16 text-slate-500">Cargando...</div>
        ) : filtrados.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <div className="flex justify-center mb-3"><Mail size={40} className="opacity-40" /></div>
            <p>No hay envíos con este filtro.</p>
            <Link href="/app/empresas" className="mt-4 inline-block px-4 py-2 bg-green-500 text-black rounded-lg text-sm font-semibold">
              Enviar mi primer CV →
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {filtrados.map(envio => (
              <div key={envio.id} onClick={() => setDetalle(envio)}
                className="rounded-xl p-4 flex items-center gap-4 cursor-pointer hover:opacity-80 transition"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <span className="shrink-0 flex items-center" style={{ color: STATUS_COLOR[envio.status] || "#94a3b8" }}><StatusIcon status={envio.status} size={22} /></span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white truncate">{envio.company_name}</p>
                  {envio.job_title && <p className="flex items-center gap-1 text-xs text-slate-400 truncate"><Briefcase size={11} />{envio.job_title}</p>}
                  {envio.company_email && <p className="flex items-center gap-1 text-xs text-slate-500 truncate"><Mail size={11} />{envio.company_email}</p>}
                  <p className="text-xs text-slate-600 mt-0.5">
                    {formatLocalDate(envio.sent_at || envio.created_at)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                    style={{ background: `${STATUS_COLOR[envio.status] ?? "#94a3b8"}22`, color: STATUS_COLOR[envio.status] ?? "#94a3b8" }}>
                    {textoEstado(envio.status)}
                  </span>
                  <div className="flex gap-1">
                    {envio.status === "pendiente" && (
                      <button onClick={() => cancelarEnvio(envio.id)}
                        className="px-2 py-0.5 rounded-full text-[10px] font-semibold transition hover:opacity-80"
                        style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)", color: "#ef4444" }}>
                        Cancelar
                      </button>
                    )}
                    <button onClick={() => eliminarEnvio(envio.id)}
                      className="px-2 py-0.5 rounded-full text-[10px] font-semibold transition hover:opacity-80"
                      style={{ background: "rgba(100,116,139,0.12)", border: "1px solid rgba(100,116,139,0.25)", color: "#64748b" }}
                      title="Eliminar de la lista">
                      <X size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {/* Vaciar la lista: abajo y discreto. Arriba, en rojo, era lo primero que se veía. */}
            <div className="pt-4 text-center">
              <button onClick={eliminarTodos} className="text-xs underline hover:opacity-80" style={{ color: "#64748b" }}>
                Vaciar la lista de envíos
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal detalle de envío */}
      {detalle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }}
          onClick={() => setDetalle(null)}>
          <div className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl p-6" style={{ background: "#1e212b", border: "1px solid #2d3142" }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">{detalle.company_name}</h2>
              <button onClick={() => setDetalle(null)} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>

            <div className="space-y-3 text-sm mb-4">
              {detalle.job_title && (
                <div><span className="text-slate-400">Puesto:</span> <span className="text-white">{detalle.job_title}</span></div>
              )}
              <div><span className="text-slate-400">Email:</span> <span className="text-white">{detalle.company_email}</span></div>
              <div><span className="text-slate-400">Estado:</span> <span className="font-semibold" style={{ color: STATUS_COLOR[detalle.status] }}>{textoEstado(detalle.status)}</span></div>
              <div><span className="text-slate-400">Fecha:</span> <span className="text-white">
                {formatLocalDate(detalle.sent_at || detalle.created_at, "ES", { month: "long" })}
              </span></div>
            </div>

            {detalle.cover_letter && (
              <div className="mb-4">
                <h3 className="flex items-center gap-1.5 text-sm font-semibold text-green-400 mb-2"><FileText size={14} /> Carta de presentación</h3>
                <div className="rounded-xl p-4 text-sm text-slate-300 whitespace-pre-line" style={{ background: "#0f1117", border: "1px solid #2d3142" }}>
                  {detalle.cover_letter}
                </div>
              </div>
            )}

            {detalle.cv_snapshot && (() => {
              try {
                const cv = JSON.parse(detalle.cv_snapshot);
                return (
                  <div>
                    <h3 className="text-sm font-semibold text-green-400 mb-2">CV enviado</h3>
                    <div className="rounded-xl p-4 text-sm space-y-2" style={{ background: "#0f1117", border: "1px solid #2d3142" }}>
                      {cv.nombre && <p className="text-white font-semibold">{cv.nombre} {cv.apellidos || ""}</p>}
                      {cv.ciudad && <p className="text-slate-400">{cv.ciudad}{cv.provincia ? `, ${cv.provincia}` : ""}</p>}
                      {cv.telefono && <p className="text-slate-400">📞 {cv.telefono}</p>}
                      {cv.email && <p className="text-slate-400">{cv.email}</p>}
                      {cv.perfil && <p className="text-slate-300 mt-2 italic">"{cv.perfil}"</p>}
                    </div>
                  </div>
                );
              } catch { return null; }
            })()}

            {!detalle.cover_letter && !detalle.cv_snapshot && (
              <p className="text-slate-500 text-sm text-center py-4">Este envío no tiene detalle guardado (se envió antes de esta actualización).</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
