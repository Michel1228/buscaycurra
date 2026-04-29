"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import Link from "next/link";

type EstadoCandidatura = "aplicado" | "en_revision" | "entrevista" | "oferta" | "rechazado" | "contratado";

interface Candidatura {
  id: string;
  empresa: string;
  puesto: string;
  estado: EstadoCandidatura;
  fecha: string;
  notas?: string;
  salario?: string;
  contacto?: string;
}

const COLUMNAS: { id: EstadoCandidatura; label: string; color: string }[] = [
  { id: "aplicado", label: "Aplicado", color: "#22c55e" },
  { id: "en_revision", label: "En revisión", color: "#f59e0b" },
  { id: "entrevista", label: "Entrevista", color: "#a855f7" },
  { id: "oferta", label: "Oferta", color: "#3b82f6" },
  { id: "contratado", label: "Contratado", color: "#ec4899" },
  { id: "rechazado", label: "Rechazado", color: "#64748b" },
];

export default function PipelinePage() {
  const router = useRouter();
  const [candidaturas, setCandidaturas] = useState<Candidatura[]>([]);
  const [cargando, setCargando] = useState(true);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [candidaturaEdit, setCandidaturaEdit] = useState<Candidatura | null>(null);

  useEffect(() => {
    async function cargar() {
      try {
        const session = (await getSupabaseBrowser().auth.getSession()).data.session;
        if (!session) { router.push("/auth/login"); return; }

        const { data: envios } = await getSupabaseBrowser()
          .from("cv_sends")
          .select("id, empresa, puesto, estado, creado_en, notas")
          .eq("user_id", session.user.id)
          .order("creado_en", { ascending: false });

        const mapped: Candidatura[] = (envios || []).map((e: Record<string, string>) => ({
          id: e.id,
          empresa: e.empresa,
          puesto: e.puesto || "Candidatura espontánea",
          estado: mapEstado(e.estado),
          fecha: e.creado_en,
          notas: e.notas,
        }));

        setCandidaturas(mapped);
      } catch (error) {
        console.error("Error cargando pipeline:", error);
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, [router]);

  function mapEstado(estado: string): EstadoCandidatura {
    const map: Record<string, EstadoCandidatura> = {
      enviado: "aplicado",
      pendiente: "aplicado",
      visto: "en_revision",
      respuesta: "entrevista",
    };
    return map[estado] || "aplicado";
  }

  async function moverCandidatura(id: string, nuevoEstado: EstadoCandidatura) {
    setCandidaturas(prev => prev.map(c => c.id === id ? { ...c, estado: nuevoEstado } : c));
    try {
      const session = (await getSupabaseBrowser().auth.getSession()).data.session;
      if (!session) return;
      const estadoDb = nuevoEstado === "aplicado" ? "enviado" :
        nuevoEstado === "en_revision" ? "visto" :
        nuevoEstado === "entrevista" ? "respuesta" : "enviado";
      await getSupabaseBrowser().from("cv_sends").update({ estado: estadoDb }).eq("id", id);
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
    activas: candidaturas.filter(c => c.estado !== "rechazado" && c.estado !== "contratado").length,
    entrevistas: candidaturas.filter(c => c.estado === "entrevista").length,
    ofertas: candidaturas.filter(c => c.estado === "oferta").length,
  };

  return (
    <div className="min-h-screen pt-16" style={{ background: "#0f1117" }}>
      <div className="py-8 px-4" style={{ background: "linear-gradient(135deg, rgba(168,85,247,0.08), rgba(59,130,246,0.05))" }}>
        <div className="max-w-6xl mx-auto">
          <h1 className="text-xl font-bold" style={{ color: "#f1f5f9" }}>Pipeline de candidaturas</h1>
          <p className="text-xs mt-1" style={{ color: "#64748b" }}>Arrastra las tarjetas entre columnas</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            {[
              { label: "Total", valor: stats.total, color: "#22c55e" },
              { label: "Activas", valor: stats.activas, color: "#f59e0b" },
              { label: "Entrevistas", valor: stats.entrevistas, color: "#a855f7" },
              { label: "Ofertas", valor: stats.ofertas, color: "#3b82f6" },
            ].map(s => (
              <div key={s.label} className="card-game p-3 text-center">
                <p className="text-xl font-bold" style={{ color: s.color }}>{s.valor}</p>
                <p className="text-[10px]" style={{ color: "#64748b" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {candidaturas.length === 0 ? (
          <div className="card-game p-10 text-center">
            <p className="text-4xl mb-3">📭</p>
            <p className="font-semibold text-sm" style={{ color: "#f1f5f9" }}>Aún no tienes candidaturas</p>
            <p className="text-xs mt-1 mb-4" style={{ color: "#64748b" }}>Empieza enviando tu CV a empresas</p>
            <Link href="/app/envios" className="btn-game text-xs">Enviar CV</Link>
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-4" style={{ scrollbarWidth: "thin" }}>
            {COLUMNAS.map(col => {
              const items = candidaturas.filter(c => c.estado === col.id);
              return (
                <div key={col.id} className="flex-shrink-0 w-60" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, col.id)}>
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <div className="w-2 h-2 rounded-full" style={{ background: col.color }} />
                    <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: col.color }}>{col.label}</span>
                    <span className="text-[10px] ml-auto" style={{ color: "#475569" }}>{items.length}</span>
                  </div>
                  <div className="space-y-2 min-h-[80px]">
                    {items.map(item => (
                      <div key={item.id} draggable onDragStart={() => handleDragStart(item.id)}
                        className="card-game p-3 cursor-grab active:cursor-grabbing hover:scale-[1.02] transition-transform"
                        style={{ borderLeft: `3px solid ${col.color}` }}
                        onClick={() => { setCandidaturaEdit(item); setModalAbierto(true); }}>
                        <p className="text-xs font-semibold truncate" style={{ color: "#f1f5f9" }}>{item.puesto}</p>
                        <p className="text-[11px] mt-0.5" style={{ color: "#64748b" }}>{item.empresa}</p>
                        <p className="text-[10px] mt-1" style={{ color: "#475569" }}>{new Date(item.fecha).toLocaleDateString("es-ES")}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {modalAbierto && candidaturaEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }} onClick={() => setModalAbierto(false)}>
          <div className="w-full max-w-sm rounded-xl p-5 space-y-3" style={{ background: "#1e212b", border: "1px solid #2d3142" }} onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-sm" style={{ color: "#f1f5f9" }}>{candidaturaEdit.puesto}</h3>
            <p className="text-xs" style={{ color: "#94a3b8" }}>{candidaturaEdit.empresa}</p>
            <div className="space-y-1.5">
              <p className="text-[11px]" style={{ color: "#64748b" }}><span className="font-medium">Estado:</span> {COLUMNAS.find(c => c.id === candidaturaEdit.estado)?.label}</p>
              <p className="text-[11px]" style={{ color: "#64748b" }}><span className="font-medium">Fecha:</span> {new Date(candidaturaEdit.fecha).toLocaleDateString("es-ES")}</p>
              {candidaturaEdit.notas && <p className="text-[11px]" style={{ color: "#64748b" }}><span className="font-medium">Notas:</span> {candidaturaEdit.notas}</p>}
            </div>
            <div className="flex gap-2 flex-wrap">
              {COLUMNAS.filter(c => c.id !== candidaturaEdit.estado && c.id !== "rechazado").map(c => (
                <button key={c.id} onClick={() => { moverCandidatura(candidaturaEdit.id, c.id); setModalAbierto(false); }}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-medium transition"
                  style={{ background: `${c.color}12`, border: `1px solid ${c.color}25`, color: c.color }}>
                  Mover a {c.label}
                </button>
              ))}
            </div>
            <button onClick={() => setModalAbierto(false)} className="w-full py-2 rounded-lg text-[11px]" style={{ border: "1px solid #2d3142", color: "#64748b" }}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}
