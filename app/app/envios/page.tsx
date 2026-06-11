"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import Link from "next/link";
import { Mail, Eye, MessageSquare, Clock, XCircle, Ban, FileText, Briefcase, AtSign, Calendar, Inbox, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Envio {
  id: string;
  company_name: string;
  company_email: string;
  job_title?: string;
  status: string;
  sent_at?: string;
  created_at: string;
}

const STATUS_ICON: Record<string, LucideIcon> = {
  enviado: Mail, visto: Eye, respondido: MessageSquare,
  pendiente: Clock, fallido: XCircle, cancelado: Ban,
};
const STATUS_COLOR: Record<string, string> = {
  enviado: "#22c55e", visto: "#a855f7", respondido: "#f59e0b",
  pendiente: "#64748b", fallido: "#ef4444", cancelado: "#64748b",
};

export default function EnviosPage() {
  const router = useRouter();
  const [envios, setEnvios] = useState<Envio[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<string>("todos");

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

  const filtrados = filtro === "todos" ? envios : envios.filter(e => e.status === filtro);
  const contadores = envios.reduce((acc, e) => ({ ...acc, [e.status]: (acc[e.status] || 0) + 1 }), {} as Record<string, number>);

  async function cancelarEnvio(id: string) {
    const { data: { session } } = await getSupabaseBrowser().auth.getSession();
    if (!session) return;
    const res = await fetch("/api/cv-sender/cancel", {
      method: "POST",
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
    if (!confirm("¿Eliminar todos los envíos de la lista?")) return;
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
          {envios.length > 0 && (
            <button
              onClick={eliminarTodos}
              className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition hover:opacity-80"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444" }}>
              Limpiar todo
            </button>
          )}
        </div>

        {/* Filtros */}
        <div className="flex gap-2 flex-wrap mb-5">
          {["todos", "pendiente", "enviado", "visto", "respondido", "fallido"].map(f => (
            <button key={f} onClick={() => setFiltro(f)}
              className="px-3 py-1 rounded-full text-xs font-semibold transition"
              style={{
                background: filtro === f ? "#22c55e" : "rgba(255,255,255,0.06)",
                color: filtro === f ? "#0a0a0a" : "#94a3b8",
                border: `1px solid ${filtro === f ? "#22c55e" : "rgba(255,255,255,0.1)"}`,
              }}>
              {(() => { const Icon = STATUS_ICON[f] || FileText; return <Icon size={12} strokeWidth={1.8} className="inline mr-1" />; })()} {f.charAt(0).toUpperCase() + f.slice(1)}
              {contadores[f] ? ` (${contadores[f]})` : ""}
            </button>
          ))}
        </div>

        {/* Lista */}
        {loading ? (
          <div className="text-center py-16 text-slate-500">Cargando...</div>
        ) : filtrados.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <Inbox size={40} strokeWidth={1.2} className="mx-auto mb-3" style={{ color: "#475569" }} />
            <p>No hay envíos con este filtro.</p>
            <Link href="/app/empresas" className="mt-4 inline-block px-4 py-2 bg-green-500 text-black rounded-lg text-sm font-semibold">
              Enviar mi primer CV →
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {filtrados.map(envio => (
              <div key={envio.id} className="rounded-xl p-4 flex items-center gap-4"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                {(() => { const Icon = STATUS_ICON[envio.status] || FileText; return <Icon size={22} strokeWidth={1.4} className="shrink-0" style={{ color: STATUS_COLOR[envio.status] || "#64748b" }} />; })()}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white truncate">{envio.company_name}</p>
                  {envio.job_title && <p className="flex items-center gap-1 text-xs text-slate-400 truncate"><Briefcase size={10} strokeWidth={1.6} className="shrink-0" />{envio.job_title}</p>}
                  {envio.company_email && <p className="flex items-center gap-1 text-xs text-slate-500 truncate"><AtSign size={10} strokeWidth={1.6} className="shrink-0" />{envio.company_email}</p>}
                  <p className="flex items-center gap-1 text-xs text-slate-600 mt-0.5">
                    {envio.sent_at
                      ? new Date(envio.sent_at).toLocaleString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
                      : envio.created_at
                        ? <><Calendar size={10} strokeWidth={1.6} className="shrink-0" />{new Date(envio.created_at).toLocaleString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</>
                        : null}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                    style={{ background: `${STATUS_COLOR[envio.status]}22`, color: STATUS_COLOR[envio.status] }}>
                    {envio.status}
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
                      <X size={11} strokeWidth={2} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
