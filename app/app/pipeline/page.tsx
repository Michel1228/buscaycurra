"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import Link from "next/link";
import InfoTooltip from "@/components/InfoTooltip";
import { PartyPopper, Inbox, AtSign } from "lucide-react";

type EstadoCandidatura = "enviado" | "visto_empresa" | "en_revision" | "entrevista" | "oferta" | "descartado";

interface Candidatura {
  id: string;
  empresa: string;
  email: string;
  puesto: string;
  estado: EstadoCandidatura;
  fecha: string;
  notas?: string;
  salario?: string;
  contacto?: string;
}

const COLUMNAS: { id: EstadoCandidatura; label: string; color: string; tip: string }[] = [
  { id: "enviado", label: "Enviado", color: "#22c55e", tip: "CV enviado. Acabas de aplicar a esta oferta y estás esperando respuesta." },
  { id: "visto_empresa", label: "Visto por empresa", color: "#f59e0b", tip: "La empresa ha abierto tu candidatura. Suele tardar 1-2 semanas en responder." },
  { id: "en_revision", label: "En revisión", color: "#a855f7", tip: "La empresa está revisando tu candidatura. ¡Buen momento para prepararte con Guzzi!" },
  { id: "entrevista", label: "Entrevista", color: "#3b82f6", tip: "Te han contactado para una entrevista. Prepara respuestas y negocia con datos reales de salarios." },
  { id: "oferta", label: "Oferta", color: "#ec4899", tip: "La empresa te ha hecho una oferta económica. Negocia con datos reales del mercado." },
  { id: "descartado", label: "Descartado", color: "#64748b", tip: "No avanzaste en este proceso. No te desanimes, es normal recibir varios rechazos antes de encontrar trabajo." },
];

function diasDesde(fecha: string): number {
  const diff = Date.now() - new Date(fecha).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export default function PipelinePage() {
  const router = useRouter();
  const [candidaturas, setCandidaturas] = useState<Candidatura[]>([]);
  const [cargando, setCargando] = useState(true);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [candidaturaEdit, setCandidaturaEdit] = useState<Candidatura | null>(null);
  const [notasEdit, setNotasEdit] = useState("");
  const [salarioEdit, setSalarioEdit] = useState("");
  const [contactoEdit, setContactoEdit] = useState("");
  const [guardandoNotas, setGuardandoNotas] = useState(false);
  const [modalNueva, setModalNueva] = useState(false);
  const [nueva, setNueva] = useState({ empresa: "", puesto: "", notas: "" });
  const [guardandoNueva, setGuardandoNueva] = useState(false);
  const [celebracion, setCelebracion] = useState(false);
  const [filtroActivo, setFiltroActivo] = useState<string | null>(null);

  useEffect(() => {
    async function cargar() {
      try {
        const session = (await getSupabaseBrowser().auth.getSession()).data.session;
        if (!session) { router.push("/auth/login"); return; }

        const { data: envios } = await getSupabaseBrowser()
          .from("cv_sends")
          .select("id, company_name, company_email, job_title, status, created_at, error_message")
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false });

        const mapped: Candidatura[] = (envios || []).map((e: Record<string, string>) => {
          let pipelineEstado: EstadoCandidatura = mapEstado(e.status);
          let notas = "";
          if (e.error_message) {
            try {
              const parsed = JSON.parse(e.error_message);
              if (parsed.pipeline_estado) pipelineEstado = parsed.pipeline_estado as EstadoCandidatura;
              notas = parsed.notas || "";
            } catch {
              notas = e.error_message;
            }
          }
          return {
            id: e.id,
            empresa: e.company_name || "Empresa desconocida",
            email: e.company_email || "",
            puesto: e.job_title || "Candidatura espontánea",
            estado: pipelineEstado,
            fecha: e.created_at,
            notas,
            salario: (() => { try { return JSON.parse(e.error_message)?.salario || ""; } catch { return ""; } })(),
            contacto: (() => { try { return JSON.parse(e.error_message)?.contacto || ""; } catch { return ""; } })(),
          };
        });

        setCandidaturas(mapped);
      } catch (error) {
        console.error("Error cargando pipeline:", error);
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, [router]);

  async function guardarNotas() {
    if (!candidaturaEdit) return;
    setGuardandoNotas(true);
    try {
      const session = (await getSupabaseBrowser().auth.getSession()).data.session;
      if (!session) return;
      // Leer el estado actual de candidaturas, no el capturado al abrir el modal
      const currentEstado = candidaturas.find(c => c.id === candidaturaEdit.id)?.estado || candidaturaEdit.estado;
      await getSupabaseBrowser().from("cv_sends").update({
        error_message: JSON.stringify({ pipeline_estado: currentEstado, notas: notasEdit, salario: salarioEdit, contacto: contactoEdit })
      }).eq("id", candidaturaEdit.id);
      setCandidaturas(prev => prev.map(c => c.id === candidaturaEdit.id ? { ...c, notas: notasEdit, salario: salarioEdit, contacto: contactoEdit } : c));
      setModalAbierto(false);
    } catch (e) {
      console.error("Error guardando notas:", e);
    } finally {
      setGuardandoNotas(false);
    }
  }

  async function crearCandidatura() {
    if (!nueva.empresa.trim()) return;
    setGuardandoNueva(true);
    try {
      const session = (await getSupabaseBrowser().auth.getSession()).data.session;
      if (!session) return;
      const { data } = await getSupabaseBrowser().from("cv_sends").insert({
        user_id: session.user.id,
        company_name: nueva.empresa.trim(),
        company_email: "manual@buscaycurra.es",
        job_title: nueva.puesto.trim() || null,
        status: "enviado",
        error_message: nueva.notas.trim()
          ? JSON.stringify({ pipeline_estado: "enviado", notas: nueva.notas.trim() })
          : null,
      }).select().single();
      if (data) {
        setCandidaturas(prev => [{
          id: data.id,
          empresa: data.company_name,
          email: data.company_email || "",
          puesto: data.job_title || "Candidatura espontánea",
          estado: "enviado",
          fecha: data.created_at,
          notas: nueva.notas.trim() || undefined,
        }, ...prev]);
      }
      setNueva({ empresa: "", puesto: "", notas: "" });
      setModalNueva(false);
    } catch (e) {
      console.error("Error creando candidatura:", e);
    } finally {
      setGuardandoNueva(false);
    }
  }

  function mapEstado(estado: string): EstadoCandidatura {
    const map: Record<string, EstadoCandidatura> = {
      enviado: "enviado",
      pendiente: "enviado",
      visto: "visto_empresa",
      visto_empresa: "visto_empresa",
      en_revision: "en_revision",
      revision: "en_revision",
      respuesta: "entrevista",
      entrevista: "entrevista",
      oferta: "oferta",
      rechazado: "descartado",
      descartado: "descartado",
      contratado: "oferta",
    };
    return map[estado] || "enviado";
  }

  async function moverCandidatura(id: string, nuevoEstado: EstadoCandidatura) {
    setCandidaturas(prev => prev.map(c => c.id === id ? { ...c, estado: nuevoEstado } : c));
    try {
      const session = (await getSupabaseBrowser().auth.getSession()).data.session;
      if (!session) return;
      // Leer el JSON actual de error_message para preservar salario y contacto
      const cand = candidaturas.find(c => c.id === id);
      let existingData: Record<string, unknown> = {};
      try {
        const { data: row } = await getSupabaseBrowser()
          .from("cv_sends")
          .select("error_message")
          .eq("id", id)
          .single();
        if (row?.error_message) {
          existingData = JSON.parse(row.error_message);
        }
      } catch { /* si falla la lectura, usamos objeto vacío */ }
      await getSupabaseBrowser().from("cv_sends").update({
        error_message: JSON.stringify({
          ...existingData,
          pipeline_estado: nuevoEstado,
          notas: cand?.notas || (existingData.notas as string) || "",
        })
      }).eq("id", id);
      if (nuevoEstado === "oferta") {
        setCelebracion(true);
        setTimeout(() => setCelebracion(false), 4000);
      }
    } catch (e) {
      console.error("Error actualizando estado:", e);
    }
  }

  function handleDragStart(id: string) { setDraggingId(id); }
  function handleDragOver(e: React.DragEvent) { e.preventDefault(); }
  function handleDrop(e: React.DragEvent, estado: EstadoCandidatura) {
    e.preventDefault();
    if (draggingId) { moverCandidatura(draggingId, estado); setDraggingId(null); }
  }

  if (cargando) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center" style={{ background: "#0f1117" }}>
        <div className="animate-spin rounded-full h-8 w-8" style={{ border: "3px solid #2d3142", borderTopColor: "#22c55e" }} />
      </div>
    );
  }

  const stats = {
    total: candidaturas.length,
    activas: candidaturas.filter(c => c.estado !== "descartado" && c.estado !== "oferta").length,
    entrevistas: candidaturas.filter(c => c.estado === "entrevista").length,
    ofertas: candidaturas.filter(c => c.estado === "oferta").length,
  };

  const statCards = [
    { label: "Total", valor: stats.total, color: "#22c55e", filtro: null, tooltip: "Todas las candidaturas" },
    { label: "En proceso", valor: stats.activas, color: "#f59e0b", filtro: "activas", tooltip: "Candidaturas sin respuesta final" },
    { label: "Entrevistas", valor: stats.entrevistas, color: "#a855f7", filtro: "entrevista", tooltip: "Con entrevista programada" },
    { label: "Ofertas", valor: stats.ofertas, color: "#3b82f6", filtro: "oferta", tooltip: "Ofertas recibidas" },
  ];

  return (
    <div className="min-h-screen pt-16" style={{ background: "#0f1117" }}>
      {celebracion && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl text-sm font-bold shadow-2xl"
          style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "#fff", animation: "fade-in 0.3s ease" }}>
          <PartyPopper size={16} strokeWidth={1.8} className="inline mr-1.5" />¡Oferta recibida! Negocia con datos reales de salarios.
        </div>
      )}
      <div className="py-8 px-4" style={{ background: "linear-gradient(135deg, rgba(168,85,247,0.08), rgba(59,130,246,0.05))" }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold" style={{ color: "#f1f5f9" }}>Pipeline de candidaturas</h1>
              <p className="text-xs mt-1" style={{ color: "#64748b" }}>Arrastra las tarjetas entre columnas para actualizar el estado</p>
            </div>
            <button onClick={() => setModalNueva(true)}
              className="px-4 py-2 text-xs font-semibold rounded-xl transition hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "#fff" }}>
              + Nueva candidatura
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            {statCards.map(s => {
              const activo = filtroActivo === s.filtro;
              return (
                <button
                  key={s.label}
                  onClick={() => setFiltroActivo(activo ? null : s.filtro)}
                  title={s.tooltip}
                  className="card-game p-3 text-center transition hover:scale-[1.03] cursor-pointer"
                  style={{ border: activo ? `1.5px solid ${s.color}` : undefined, opacity: filtroActivo && !activo ? 0.5 : 1 }}
                >
                  <p className="text-xl font-bold" style={{ color: s.color }}>{s.valor}</p>
                  <p className="text-[10px]" style={{ color: "#64748b" }}>{s.label}</p>
                  {s.filtro === "entrevista" && s.valor === 0 && (
                    <p className="text-[9px] mt-0.5" style={{ color: "#475569" }}>0 entrevistas</p>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {candidaturas.length === 0 ? (
          <div className="card-game p-10 text-center">
            <Inbox size={40} strokeWidth={1.2} className="mx-auto mb-3" style={{ color: "#475569" }} />
            <p className="font-semibold text-sm" style={{ color: "#f1f5f9" }}>Aún no tienes candidaturas</p>
            <p className="text-xs mt-1 mb-4" style={{ color: "#64748b" }}>Empieza enviando tu CV a empresas</p>
            <Link href="/app/empresas" className="btn-game text-xs">Enviar CV</Link>
          </div>
        ) : (
          <>
          {filtroActivo && (
            <div className="mb-3 flex items-center gap-2">
              <span className="text-xs" style={{ color: "#94a3b8" }}>
                Filtrando: <strong style={{ color: "#22c55e" }}>{statCards.find(s => s.filtro === filtroActivo)?.label}</strong>
              </span>
              <button onClick={() => setFiltroActivo(null)} className="text-[11px] px-2 py-0.5 rounded-lg" style={{ background: "#2d3142", color: "#94a3b8" }}>
                × Quitar filtro
              </button>
            </div>
          )}
          <div className="flex gap-3 overflow-x-auto pb-4" style={{ scrollbarWidth: "thin" }}>
            {COLUMNAS.map(col => {
              const todosItems = candidaturas.filter(c => c.estado === col.id);
              const items = filtroActivo === "activas"
                ? candidaturas.filter(c => c.estado === col.id && c.estado !== "descartado" && c.estado !== "oferta")
                : filtroActivo
                  ? candidaturas.filter(c => c.estado === col.id && c.estado === filtroActivo)
                  : todosItems;
              const _ = todosItems; // evitar lint unused
              return (
                <div key={col.id} className="flex-shrink-0 w-64" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, col.id)}>
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <div className="w-2 h-2 rounded-full" style={{ background: col.color }} />
                    <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: col.color }}>{col.label}</span>
                    <InfoTooltip text={col.tip} position="bottom" />
                    <span className="text-[10px] ml-auto" style={{ color: "#475569" }}>{items.length}</span>
                  </div>
                  <div className="space-y-2 min-h-[80px]">
                    {items.map(item => {
                      const dias = diasDesde(item.fecha);
                      const necesitaAtencion = dias > 2 && item.estado !== "descartado" && item.estado !== "oferta";
                      return (
                        <div key={item.id} draggable onDragStart={() => handleDragStart(item.id)}
                          className="card-game p-3 cursor-grab active:cursor-grabbing hover:scale-[1.02] transition-transform relative"
                          style={{ borderLeft: `3px solid ${col.color}` }}
                          onClick={() => { setCandidaturaEdit(item); setNotasEdit(item.notas || ""); setSalarioEdit(item.salario || ""); setContactoEdit(item.contacto || ""); setModalAbierto(true); }}>
                          {/* Badge de notificación: sin cambios en más de 48h */}
                          {necesitaAtencion && (
                            <div className="absolute -top-1.5 -right-1.5 z-10">
                              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold"
                                style={{ background: "#ef4444", color: "#fff", boxShadow: "0 0 8px rgba(239,68,68,0.4)" }}>
                                Hace {dias}d
                              </span>
                            </div>
                          )}
                          <p className="text-xs font-semibold truncate" style={{ color: "#f1f5f9" }}>{item.puesto}</p>
                          <p className="text-[11px] mt-0.5" style={{ color: "#64748b" }}>{item.empresa}</p>
                          {item.email && (
                            <p className="flex items-center gap-0.5 text-[10px] mt-0.5 truncate" style={{ color: "#475569" }}><AtSign size={9} strokeWidth={1.6} className="shrink-0" />{item.email}</p>
                          )}
                          <div className="flex items-center gap-2 mt-1.5">
                            <p className="text-[10px]" style={{ color: "#475569" }}>{new Date(item.fecha).toLocaleDateString("es-ES")}</p>
                            <p className="text-[10px]" style={{ color: dias <= 1 ? "#22c55e" : dias <= 3 ? "#f59e0b" : "#64748b" }}>
                              {dias === 0 ? "Hoy" : `+${dias}d`}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          </>
        )}
      </main>

      {modalAbierto && candidaturaEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }} onClick={() => setModalAbierto(false)}>
          <div className="w-full max-w-sm rounded-xl p-5 space-y-3" style={{ background: "#1e212b", border: "1px solid #2d3142" }} onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-sm" style={{ color: "#f1f5f9" }}>{candidaturaEdit.puesto}</h3>
            <p className="text-xs" style={{ color: "#94a3b8" }}>{candidaturaEdit.empresa}</p>
            {candidaturaEdit.email && (
              <p className="flex items-center gap-1 text-[11px]" style={{ color: "#f59e0b" }}><AtSign size={10} strokeWidth={1.6} className="shrink-0" />{candidaturaEdit.email}</p>
            )}
            <div className="space-y-1.5">
              <p className="text-[11px]" style={{ color: "#64748b" }}>
                <span className="font-medium">Estado:</span> {COLUMNAS.find(c => c.id === candidaturaEdit.estado)?.label}
              </p>
              <p className="text-[11px]" style={{ color: "#64748b" }}>
                <span className="font-medium">Fecha:</span> {new Date(candidaturaEdit.fecha).toLocaleDateString("es-ES")}
                <span className="ml-2" style={{ color: "#475569" }}>(+{diasDesde(candidaturaEdit.fecha)} días)</span>
              </p>
            </div>

            {/* Salario y contacto */}
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-[11px] font-semibold block mb-1" style={{ color: "#94a3b8" }}>Salario ofrecido</label>
                <input
                  value={salarioEdit}
                  onChange={e => setSalarioEdit(e.target.value)}
                  placeholder="ej. 28.000€/año"
                  className="w-full px-3 py-2 rounded-lg text-xs"
                  style={{ background: "#0f1117", border: "1px solid #2d3142", color: "#f1f5f9" }}
                />
              </div>
              <div className="flex-1">
                <label className="text-[11px] font-semibold block mb-1" style={{ color: "#94a3b8" }}>Contacto RRHH</label>
                <input
                  value={contactoEdit}
                  onChange={e => setContactoEdit(e.target.value)}
                  placeholder="Nombre o teléfono"
                  className="w-full px-3 py-2 rounded-lg text-xs"
                  style={{ background: "#0f1117", border: "1px solid #2d3142", color: "#f1f5f9" }}
                />
              </div>
            </div>

            {/* Notas editables */}
            <div>
              <label className="text-[11px] font-semibold block mb-1" style={{ color: "#94a3b8" }}>Notas / Recruiter / Teléfono</label>
              <textarea
                rows={3}
                value={notasEdit}
                onChange={e => setNotasEdit(e.target.value)}
                placeholder="Nombre del recruiter, teléfono, resultado entrevista..."
                className="w-full px-3 py-2 rounded-lg text-xs resize-none"
                style={{ background: "#0f1117", border: "1px solid #2d3142", color: "#f1f5f9" }}
              />
            </div>

            {/* Mover a columna */}
            <div className="flex gap-2 flex-wrap">
              {COLUMNAS.filter(c => c.id !== candidaturaEdit.estado).map(c => (
                <button key={c.id} onClick={() => { moverCandidatura(candidaturaEdit.id, c.id); setModalAbierto(false); }}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-medium transition"
                  style={{ background: `${c.color}12`, border: `1px solid ${c.color}25`, color: c.color }}>
                  → {c.label}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button onClick={guardarNotas} disabled={guardandoNotas}
                className="flex-1 py-2 rounded-lg text-[11px] font-semibold transition disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "#fff" }}>
                {guardandoNotas ? "Guardando..." : "Guardar notas"}
              </button>
              <button onClick={() => setModalAbierto(false)} className="px-4 py-2 rounded-lg text-[11px]" style={{ border: "1px solid #2d3142", color: "#64748b" }}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal nueva candidatura */}
      {modalNueva && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }} onClick={() => setModalNueva(false)}>
          <div className="w-full max-w-sm rounded-xl p-5 space-y-3" style={{ background: "#1e212b", border: "1px solid #2d3142" }} onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-sm" style={{ color: "#f1f5f9" }}>Nueva candidatura</h3>
            <label className="sr-only" htmlFor="nueva-empresa">Empresa</label>
            <input
              id="nueva-empresa"
              placeholder="Empresa *"
              value={nueva.empresa}
              onChange={e => setNueva(p => ({ ...p, empresa: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-lg text-sm"
              style={{ background: "#0f1117", border: "1px solid #2d3142", color: "#f1f5f9" }}
            />
            <label className="sr-only" htmlFor="nueva-puesto">Puesto</label>
            <input
              id="nueva-puesto"
              placeholder="Puesto (opcional)"
              value={nueva.puesto}
              onChange={e => setNueva(p => ({ ...p, puesto: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-lg text-sm"
              style={{ background: "#0f1117", border: "1px solid #2d3142", color: "#f1f5f9" }}
            />
            <label className="sr-only" htmlFor="nueva-notas">Notas</label>
            <textarea
              id="nueva-notas"
              placeholder="Notas (recruiter, teléfono...)"
              value={nueva.notas}
              onChange={e => setNueva(p => ({ ...p, notas: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 rounded-lg text-sm resize-none"
              style={{ background: "#0f1117", border: "1px solid #2d3142", color: "#f1f5f9" }}
            />
            <div className="flex gap-2">
              <button onClick={crearCandidatura} disabled={guardandoNueva || !nueva.empresa.trim()}
                className="flex-1 py-2.5 rounded-lg text-xs font-semibold transition disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "#fff" }}>
                {guardandoNueva ? "Guardando..." : "Añadir candidatura"}
              </button>
              <button onClick={() => setModalNueva(false)} className="px-4 rounded-lg text-xs" style={{ border: "1px solid #2d3142", color: "#64748b" }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
