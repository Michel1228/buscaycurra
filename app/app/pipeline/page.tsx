"use client";

export const dynamic = "force-dynamic";

/**
 * Pipeline y analítica (/app/pipeline) — rediseño del 7 nov 2026 (bocetos de Michel).
 *
 * Todo sale de SUS candidaturas (tabla cv_sends, la misma lectura de siempre).
 * El boceto traía "42 % de respuesta", "3,8 días de media", "+12 %", sectores y
 * una comparativa salarial: nada de eso lo guardamos, así que no sale. En su
 * lugar, lo que sí se puede contar: cuántas por semana, cómo van, cuántas han
 * avanzado y cuáles llevan una semana sin noticias.
 *
 * Se conserva todo lo que hacía: arrastrar entre columnas (ratón), tocar una
 * tarjeta para moverla (móvil), notas/salario/contacto, apuntar una candidatura
 * a mano (no gasta cupo), filtrar por las cifras y la celebración al llegar
 * una oferta.
 */
import { useState, useEffect, useMemo } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import Link from "next/link";
import InfoTooltip from "@/components/InfoTooltip";
import {
  PartyPopper, Inbox, AtSign, Send, Eye, Hourglass, CalendarCheck, Trophy, XCircle,
  BarChart3, Plus, ChevronDown, ChevronUp, Clock, MessageCircle, Wallet, Mic, ArrowRight, TrendingUp, X,
  type LucideIcon,
} from "lucide-react";
import { CORREO_ANOTACION_MANUAL } from "@/lib/cv-sender/anotacion";
import { CabeceraPantalla, GuzziBrillo, TituloSeccion, IconoCirculo, cifra, type Tono } from "@/components/neon/Neon";
import LogoEmpresa from "@/components/neon/LogoEmpresa";

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

// "Visto" lo pone una imagen invisible en el correo, y muchos programas de
// correo la bloquean o la abren solos: no es seguro, y la columna lo dice.
const COLUMNAS: { id: EstadoCandidatura; label: string; tono: Tono; Icono: LucideIcon; tip: string }[] = [
  { id: "enviado", label: "Enviado", tono: "verde", Icono: Send, tip: "CV enviado. Acabas de aplicar a esta oferta y estás esperando respuesta." },
  { id: "visto_empresa", label: "Quizá visto", tono: "morado", Icono: Eye, tip: "Se pone sola si el correo parece abierto, pero no es seguro: lo detecta una imagen invisible que muchos programas de correo bloquean o abren solos. También puedes moverla tú." },
  { id: "en_revision", label: "En revisión", tono: "cian", Icono: Hourglass, tip: "La empresa está revisando tu candidatura. ¡Buen momento para prepararte con Guzzi!" },
  { id: "entrevista", label: "Entrevista", tono: "ambar", Icono: CalendarCheck, tip: "Te han contactado para una entrevista. Prepara respuestas y negocia con datos reales de salarios." },
  { id: "oferta", label: "Oferta", tono: "lima", Icono: Trophy, tip: "La empresa te ha hecho una oferta económica. Negocia con datos reales del mercado." },
  { id: "descartado", label: "Descartado", tono: "neutro", Icono: XCircle, tip: "No avanzaste en este proceso. No te desanimes, es normal recibir varios rechazos antes de encontrar trabajo." },
];
const CUANTAS_A_LA_VISTA = 4;

function diasDesde(fecha: string): number {
  const diff = Date.now() - new Date(fecha).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/** El lunes de la semana de una fecha, a las 00:00. */
function lunesDe(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
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
  const [desplegadas, setDesplegadas] = useState<Record<string, boolean>>({});

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
            email: e.company_email === CORREO_ANOTACION_MANUAL ? "" : (e.company_email || ""),
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
      // SE COMPRUEBA EL ERROR. Supabase no lanza excepcion cuando falla:
      // devuelve { error }, asi que el catch de abajo no salta nunca. Sin esto,
      // la pantalla daba las notas por guardadas y al recargar habian
      // desaparecido — paso de verdad cuando la migracion 013b dejo la tabla
      // sin permisos para el rol de usuarios (403 permission denied).
      const { error } = await getSupabaseBrowser().from("cv_sends").update({
        error_message: JSON.stringify({ pipeline_estado: currentEstado, notas: notasEdit, salario: salarioEdit, contacto: contactoEdit })
      }).eq("id", candidaturaEdit.id);

      if (error) {
        console.error("[pipeline] no se guardaron las notas:", error.message);
        alert("No se han podido guardar las notas. Inténtalo de nuevo en un momento.");
        return;
      }

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
      // UNA ANOTACIÓN NO ES UN ENVÍO. Se guardaba como "enviado" y gastaba el
      // cupo del plan: tres candidaturas apuntadas a mano dejaban a un usuario
      // gratis sin poder mandar ni un CV ese día, y salían en el historial de
      // envíos con el correo inventado (auditoría del 3 oct 2026). "cancelado"
      // es el estado que la tabla admite y que no cuenta para el cupo; la
      // columna del tablero va en pipeline_estado y la marca de anotación es
      // CORREO_ANOTACION_MANUAL.
      const { data, error } = await getSupabaseBrowser().from("cv_sends").insert({
        user_id: session.user.id,
        company_name: nueva.empresa.trim(),
        company_email: CORREO_ANOTACION_MANUAL,
        job_title: nueva.puesto.trim() || null,
        status: "cancelado",
        error_message: JSON.stringify({ pipeline_estado: "enviado", ...(nueva.notas.trim() ? { notas: nueva.notas.trim() } : {}) }),
      }).select().single();
      if (error || !data) {
        console.error("[pipeline] no se creó la candidatura:", error?.message);
        alert("No se ha podido guardar la candidatura. Inténtalo de nuevo en un momento.");
        return;
      }
      if (data) {
        setCandidaturas(prev => [{
          id: data.id,
          empresa: data.company_name,
          email: "",
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

  function abrirCandidatura(item: Candidatura) {
    setCandidaturaEdit(item); setNotasEdit(item.notas || ""); setSalarioEdit(item.salario || ""); setContactoEdit(item.contacto || ""); setModalAbierto(true);
  }

  // ── Lo que se cuenta, todo de sus candidaturas ──
  const analitica = useMemo(() => {
    const porColumna = Object.fromEntries(COLUMNAS.map(c => [c.id, candidaturas.filter(x => x.estado === c.id).length])) as Record<EstadoCandidatura, number>;
    const lunesActual = lunesDe(new Date());
    const semanas = Array.from({ length: 8 }, (_, i) => {
      const inicio = new Date(lunesActual);
      inicio.setDate(inicio.getDate() - 7 * (7 - i));
      const fin = new Date(inicio);
      fin.setDate(fin.getDate() + 7);
      const n = candidaturas.filter(c => { const f = new Date(c.fecha); return f >= inicio && f < fin; }).length;
      return { inicio, n };
    });
    const avanzadas = porColumna.en_revision + porColumna.entrevista + porColumna.oferta;
    const sinNoticias = candidaturas.filter(c => c.estado === "enviado" && diasDesde(c.fecha) > 7);
    return { porColumna, semanas, avanzadas, sinNoticias };
  }, [candidaturas]);

  if (cargando) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8" style={{ border: "3px solid #2d3142", borderTopColor: "#a3e635" }} />
      </div>
    );
  }

  const stats = {
    total: candidaturas.length,
    activas: candidaturas.filter(c => c.estado !== "descartado" && c.estado !== "oferta").length,
    entrevistas: candidaturas.filter(c => c.estado === "entrevista").length,
    ofertas: candidaturas.filter(c => c.estado === "oferta").length,
  };

  const statCards: { label: string; valor: number; tono: Tono; Icono: LucideIcon; filtro: string | null; tooltip: string }[] = [
    { label: "Total", valor: stats.total, tono: "azul", Icono: Send, filtro: null, tooltip: "Todas las candidaturas" },
    { label: "En proceso", valor: stats.activas, tono: "verde", Icono: Hourglass, filtro: "activas", tooltip: "Candidaturas sin respuesta final" },
    { label: "Entrevistas", valor: stats.entrevistas, tono: "morado", Icono: CalendarCheck, filtro: "entrevista", tooltip: "Con entrevista programada" },
    { label: "Ofertas", valor: stats.ofertas, tono: "ambar", Icono: Trophy, filtro: "oferta", tooltip: "Ofertas recibidas" },
  ];

  const maxSemana = Math.max(1, ...analitica.semanas.map(s => s.n));
  const totalSemanas = analitica.semanas.reduce((a, s) => a + s.n, 0);
  // El anillo de "cómo van": un trozo por columna, con su color.
  const COLOR_TONO: Record<Tono, string> = { verde: "#22c55e", morado: "#a855f7", cian: "#2dd4bf", ambar: "#f59e0b", lima: "#a3e635", neutro: "#64748b", azul: "#3b82f6", rosa: "#ec4899" };
  let acumulado = 0;
  const anillo = COLUMNAS.map(c => {
    const pct = stats.total ? (analitica.porColumna[c.id] / stats.total) * 100 : 0;
    const trozo = `${COLOR_TONO[c.tono]} ${acumulado}% ${acumulado + pct}%`;
    acumulado += pct;
    return trozo;
  }).join(", ");

  // Lo que Guzzi te propone, solo si hay motivo en tus datos.
  const consejos: { Icono: LucideIcon; tono: Tono; titulo: string; texto: string; href: string }[] = [];
  if (analitica.sinNoticias.length > 0) {
    const primera = analitica.sinNoticias[0];
    consejos.push({
      Icono: MessageCircle, tono: "verde",
      titulo: `${analitica.sinNoticias.length} sin noticias desde hace más de una semana`,
      texto: `Un correo corto de seguimiento ayuda. Guzzi te lo escribe, empezando por ${primera.empresa}.`,
      href: `/app/gusi?q=${encodeURIComponent(`Escríbeme un correo corto de seguimiento para mi candidatura de ${primera.puesto} en ${primera.empresa}`)}`,
    });
  }
  if (stats.entrevistas > 0) {
    consejos.push({ Icono: Mic, tono: "morado", titulo: `${stats.entrevistas === 1 ? "Tienes una entrevista" : `Tienes ${stats.entrevistas} entrevistas`}`, texto: "Ensáyala antes con el simulador: preguntas reales y respuesta por voz.", href: "/app/entrevistas" });
  }
  if (stats.ofertas > 0) {
    consejos.push({ Icono: Wallet, tono: "ambar", titulo: "Antes de aceptar, compara el sueldo", texto: "Mira cuánto se cobra por ese puesto en tu provincia.", href: "/app/salarios" });
  }
  if (consejos.length === 0) {
    consejos.push({ Icono: TrendingUp, tono: "azul", titulo: "Más candidaturas, mejor elegidas", texto: "Ofertas según tu CV, cerca de ti, con carta para cada empresa.", href: "/app/buscar" });
  }

  return (
    <div className="ui-neon min-h-screen pt-16">
      {celebracion && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl text-sm font-bold shadow-2xl"
          role="status"
          style={{ background: "linear-gradient(180deg,#d9f99d,#a3e635)", color: "#0b1406", animation: "fade-in 0.3s ease" }}>
          <PartyPopper size={16} strokeWidth={1.8} className="inline mr-1.5" />¡Oferta recibida! Negocia con datos reales de salarios.
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-10 space-y-7 sm:space-y-9">
        <CabeceraPantalla Icono={BarChart3} titulo="Pipeline de" resaltado="candidaturas">
          <div className="relative mt-4 flex flex-wrap items-center gap-3">
            <button onClick={() => setModalNueva(true)} className="boton-cristal tono-lima">
              <Plus size={17} aria-hidden="true" /> Nueva candidatura
            </button>
            {/* El drag nativo (draggable/onDragStart) no funciona con gestos tactiles en
                iOS/Android — solo es de raton. La app movil carga esta misma web, asi que
                para ese publico la unica via real es tocar la tarjeta y usar "Mover a
                columna" del modal. El texto lo menciona para que no se queden intentando
                arrastrar con el dedo sin saber que hay alternativa. */}
            <p className="text-[13px]" style={{ color: "var(--texto-tenue)" }}>Arrastra las tarjetas entre columnas, o toca una tarjeta para moverla</p>
          </div>
        </CabeceraPantalla>

        {/* ── Cifras: también son filtros ── */}
        <section aria-label="Tus candidaturas" className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {statCards.map(s => {
            const activo = filtroActivo === s.filtro;
            return (
              <button
                key={s.label}
                onClick={() => setFiltroActivo(activo ? null : s.filtro)}
                title={s.tooltip}
                aria-pressed={activo}
                className={`cristal cristal-enlace tono-${s.tono} flex flex-col items-start gap-3 sm:flex-row sm:items-center p-4 min-h-[96px] text-left`}
                style={{ opacity: filtroActivo && !activo ? 0.55 : 1, borderColor: activo ? "rgba(var(--tono),0.8)" : undefined }}
              >
                <IconoCirculo Icono={s.Icono} tono={s.tono} size={40} />
                <span className="min-w-0 flex-1">
                  <span className="block text-[26px] sm:text-[30px] font-extrabold leading-none tabular-nums" style={{ color: "var(--tono-texto)" }}>{cifra(s.valor)}</span>
                  <span className="block mt-1.5 text-[13px]" style={{ color: "#cbd5e1" }}>{s.label}</span>
                  {s.filtro === "entrevista" && s.valor === 0 && (
                    <span className="block text-[11px] mt-0.5" style={{ color: "var(--texto-tenue)" }}>0 entrevistas</span>
                  )}
                </span>
              </button>
            );
          })}
        </section>

        {candidaturas.length === 0 ? (
          <div className="cristal tono-lima p-10 text-center">
            <Inbox size={40} strokeWidth={1.2} className="mx-auto mb-3" style={{ color: "#a7b3c6" }} />
            <p className="font-semibold" style={{ color: "#f1f5f9" }}>Aún no tienes candidaturas</p>
            <p className="text-sm mt-1 mb-5" style={{ color: "#a7b3c6" }}>Empieza enviando tu CV a empresas</p>
            <Link href="/app/empresas" className="boton-neon">Enviar CV</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            <div className="xl:col-span-9 space-y-7 sm:space-y-9 min-w-0">
              {/* ── El tablero ── */}
              <section aria-labelledby="titulo-tablero">
                <h2 id="titulo-tablero" className="sr-only">Columnas del pipeline</h2>
                {filtroActivo && (
                  <div className="mb-3 flex items-center gap-2">
                    <span className="text-[13px]" style={{ color: "#a7b3c6" }}>
                      Filtrando: <strong style={{ color: "#d9f99d" }}>{statCards.find(s => s.filtro === filtroActivo)?.label}</strong>
                    </span>
                    <button onClick={() => setFiltroActivo(null)} className="inline-flex items-center gap-1 min-h-[36px] text-[12px] px-3 rounded-full" style={{ background: "rgba(255,255,255,0.06)", color: "#cbd5e1" }}>
                      <X size={13} aria-hidden="true" /> Quitar filtro
                    </button>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-3">
                  {COLUMNAS.map(col => {
                    const items = filtroActivo === "activas"
                      ? candidaturas.filter(c => c.estado === col.id && c.estado !== "descartado" && c.estado !== "oferta")
                      : filtroActivo
                        ? candidaturas.filter(c => c.estado === col.id && c.estado === filtroActivo)
                        : candidaturas.filter(c => c.estado === col.id);
                    const abierta = !!desplegadas[col.id];
                    const visibles = abierta ? items : items.slice(0, CUANTAS_A_LA_VISTA);
                    return (
                      <div key={col.id} className={`cristal tono-${col.tono} p-3 flex flex-col`} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, col.id)}>
                        <div className="flex items-center gap-2 px-1 pb-2.5">
                          <col.Icono size={18} style={{ color: "var(--tono-texto)" }} aria-hidden="true" />
                          <span className="text-[15px] font-bold" style={{ color: "#f1f5f9" }}>{col.label}</span>
                          <InfoTooltip text={col.tip} position="bottom" />
                          <span className="ml-auto text-xl font-extrabold tabular-nums" style={{ color: "var(--tono-texto)" }}>{items.length}</span>
                        </div>
                        <div className="space-y-2 min-h-[56px] flex-1">
                          {items.length === 0 && (
                            <p className="text-[12px] px-1 py-3" style={{ color: "var(--texto-tenue)" }}>Nada aquí todavía.</p>
                          )}
                          {visibles.map(item => {
                            const dias = diasDesde(item.fecha);
                            const necesitaAtencion = dias > 2 && item.estado !== "descartado" && item.estado !== "oferta";
                            return (
                              <button key={item.id} draggable onDragStart={() => handleDragStart(item.id)}
                                type="button"
                                className="relative w-full text-left flex items-start gap-2.5 p-2.5 rounded-xl cursor-grab active:cursor-grabbing transition-colors"
                                style={{ background: "rgba(255,255,255,0.035)", border: "1px solid rgba(255,255,255,0.06)" }}
                                onClick={() => abrirCandidatura(item)}>
                                {/* Aviso: sin cambios en más de 48 h */}
                                {necesitaAtencion && (
                                  <span className="absolute -top-1.5 -right-1.5 z-10 px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                                    style={{ background: "#ef4444", color: "#fff", boxShadow: "0 0 8px rgba(239,68,68,0.4)" }}>
                                    Hace {dias}d
                                  </span>
                                )}
                                <LogoEmpresa empresa={item.empresa} correo={item.email} tono={col.tono} size={32} />
                                <span className="min-w-0 flex-1">
                                  <span className="block text-[13px] font-semibold leading-snug line-clamp-2" style={{ color: "#f1f5f9" }}>{item.puesto}</span>
                                  <span className="block text-[12px] truncate" style={{ color: "#a7b3c6" }}>{item.empresa}</span>
                                  {item.email && (
                                    <span className="flex items-center gap-0.5 text-[11px] mt-0.5 truncate" style={{ color: "var(--texto-tenue)" }}><AtSign size={10} strokeWidth={1.6} className="shrink-0" aria-hidden="true" />{item.email}</span>
                                  )}
                                  <span className="flex items-center gap-2 mt-1 text-[11px]">
                                    <span style={{ color: "var(--texto-tenue)" }}>{new Date(item.fecha).toLocaleDateString("es-ES")}</span>
                                    <span style={{ color: dias <= 1 ? "#86efac" : dias <= 3 ? "#fcd34d" : "var(--texto-tenue)" }}>{dias === 0 ? "Hoy" : `+${dias}d`}</span>
                                  </span>
                                </span>
                              </button>
                            );
                          })}
                        </div>
                        {items.length > CUANTAS_A_LA_VISTA && (
                          <button type="button" onClick={() => setDesplegadas(d => ({ ...d, [col.id]: !abierta }))}
                            className="mt-2 inline-flex items-center justify-center gap-1 min-h-[40px] rounded-xl text-[13px] font-semibold"
                            style={{ color: "var(--tono-texto)" }} aria-expanded={abierta}>
                            {abierta ? <>Ver menos <ChevronUp size={15} aria-hidden="true" /></> : <>Ver todas ({items.length}) <ChevronDown size={15} aria-hidden="true" /></>}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* ── Analítica: solo lo que se puede contar ── */}
              <section aria-labelledby="titulo-analitica">
                <TituloSeccion id="titulo-analitica" Icono={BarChart3} titulo="Cómo va tu búsqueda" subtitulo="Contado con tus candidaturas." />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="cristal tono-verde p-4 lg:col-span-2">
                    <p className="text-[14px] font-semibold flex items-center gap-2" style={{ color: "#f1f5f9" }}><Send size={16} style={{ color: "var(--tono-texto)" }} aria-hidden="true" /> Candidaturas por semana</p>
                    <p className="mt-1 text-[28px] font-extrabold leading-none tabular-nums" style={{ color: "var(--tono-texto)" }}>{cifra(totalSemanas)} <span className="text-[13px] font-medium" style={{ color: "var(--texto-tenue)" }}>en 8 semanas</span></p>
                    <div className="mt-3 h-28 flex items-end gap-1.5" role="img" aria-label={`Candidaturas por semana: ${analitica.semanas.map(s => s.n).join(", ")}`}>
                      {analitica.semanas.map((s, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                          <span className="text-[10px] tabular-nums" style={{ color: "var(--texto-tenue)" }}>{s.n || ""}</span>
                          <div className="w-full rounded-t-md" style={{
                            height: `${Math.max(4, (s.n / maxSemana) * 100)}%`,
                            background: s.n ? "linear-gradient(180deg, #d9f99d, #22c55e)" : "rgba(148,163,184,0.15)",
                            boxShadow: s.n ? "0 0 14px -2px rgba(163,230,53,0.55)" : "none",
                          }} />
                        </div>
                      ))}
                    </div>
                    <div className="mt-1.5 flex gap-1.5 text-[10px]" style={{ color: "var(--texto-tenue)" }} aria-hidden="true">
                      {analitica.semanas.map((s, i) => (
                        <span key={i} className="flex-1 text-center">{i % 2 === 1 || i === 7 ? s.inicio.toLocaleDateString("es-ES", { day: "numeric", month: "short" }).replace(".", "") : ""}</span>
                      ))}
                    </div>
                  </div>

                  <div className="cristal tono-morado p-4">
                    <p className="text-[14px] font-semibold" style={{ color: "#f1f5f9" }}>Cómo van</p>
                    <div className="mt-3 flex flex-wrap items-center gap-4">
                      <div className="relative shrink-0 rounded-full" style={{ width: 96, height: 96, background: `conic-gradient(${anillo})` }}
                        role="img" aria-label={COLUMNAS.map(c => `${c.label}: ${analitica.porColumna[c.id]}`).join(", ")}>
                        <div className="absolute inset-[12px] rounded-full flex flex-col items-center justify-center" style={{ background: "#0c0f16" }}>
                          <span className="text-xl font-extrabold tabular-nums" style={{ color: "#f1f5f9" }}>{cifra(stats.total)}</span>
                          <span className="text-[10px]" style={{ color: "var(--texto-tenue)" }}>en total</span>
                        </div>
                      </div>
                      <ul className="text-[12px] space-y-1 min-w-[120px] flex-1">
                        {COLUMNAS.filter(c => analitica.porColumna[c.id] > 0).map(c => (
                          <li key={c.id} className="flex items-center gap-1.5" style={{ color: "#cbd5e1" }}>
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: COLOR_TONO[c.tono] }} aria-hidden="true" />
                            <span className="truncate">{c.label}</span><span className="ml-auto pl-2 tabular-nums">{analitica.porColumna[c.id]}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="cristal tono-ambar p-4 flex flex-col">
                    <p className="text-[14px] font-semibold flex items-center gap-2" style={{ color: "#f1f5f9" }}><TrendingUp size={16} style={{ color: "var(--tono-texto)" }} aria-hidden="true" /> Han avanzado</p>
                    <p className="mt-2 text-[28px] font-extrabold leading-none tabular-nums" style={{ color: "var(--tono-texto)" }}>
                      {cifra(analitica.avanzadas)} <span className="text-[14px] font-medium" style={{ color: "#a7b3c6" }}>de {cifra(stats.total)}</span>
                    </p>
                    <p className="text-[12px] mt-1.5" style={{ color: "var(--texto-tenue)" }}>En revisión, entrevista u oferta.</p>
                    <div className="mt-auto pt-3 flex items-center gap-2 text-[12px]" style={{ color: "#cbd5e1" }}>
                      <Clock size={14} aria-hidden="true" style={{ color: "var(--tono-texto)" }} />
                      {analitica.sinNoticias.length
                        ? <>{analitica.sinNoticias.length} sin noticias hace más de 7 días</>
                        : <>Ninguna lleva más de 7 días sin moverse</>}
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* ── Guzzi te recomienda: solo con motivo en tus datos ── */}
            <aside className="xl:col-span-3" aria-labelledby="titulo-guzzi-recomienda">
              <div className="cristal tono-lima p-5 xl:sticky xl:top-20 space-y-4"
                style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), 0 0 0 1px rgba(163,230,53,0.15), 0 24px 60px -30px rgba(163,230,53,0.7)" }}>
                <div className="flex items-center gap-3">
                  <GuzziBrillo size={56} decorativo />
                  <div>
                    <h2 id="titulo-guzzi-recomienda" className="text-lg font-extrabold leading-tight" style={{ color: "#f8fafc" }}>
                      Lo que <span className="texto-neon">Guzzi</span> te propone
                    </h2>
                    <p className="text-[12px]" style={{ color: "#a7b3c6" }}>Según cómo van tus candidaturas.</p>
                  </div>
                </div>
                <ul className="space-y-2">
                  {consejos.map(c => (
                    <li key={c.titulo}>
                      <Link href={c.href} className={`tono-${c.tono} flex items-start gap-3 p-3 rounded-2xl transition-colors hover:bg-white/[0.05]`}
                        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(var(--tono),0.25)" }}>
                        <IconoCirculo Icono={c.Icono} tono={c.tono} size={36} />
                        <span className="min-w-0 flex-1">
                          <span className="block text-[14px] font-semibold leading-snug" style={{ color: "#f1f5f9" }}>{c.titulo}</span>
                          <span className="block text-[12px] mt-0.5 leading-snug" style={{ color: "#a7b3c6" }}>{c.texto}</span>
                        </span>
                        <ArrowRight size={16} className="shrink-0 mt-1 opacity-60" aria-hidden="true" />
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link href="/app/gusi" className="boton-neon w-full">Hablar con Guzzi <ArrowRight size={17} aria-hidden="true" /></Link>
              </div>
            </aside>
          </div>
        )}
      </div>

      {modalAbierto && candidaturaEdit && (
        <div className="fixed inset-0 z-[55] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.65)" }} onClick={() => setModalAbierto(false)}>
          <div className="ui-neon cristal tono-lima w-full max-w-sm p-5 space-y-3" style={{ background: "rgba(10,13,19,0.98)" }} onClick={e => e.stopPropagation()}
            role="dialog" aria-modal="true" aria-labelledby="titulo-candidatura">
            <div className="flex items-start gap-3">
              <LogoEmpresa empresa={candidaturaEdit.empresa} correo={candidaturaEdit.email} tono="lima" size={40} />
              <div className="min-w-0">
                <h3 id="titulo-candidatura" className="font-semibold text-[15px]" style={{ color: "#f1f5f9" }}>{candidaturaEdit.puesto}</h3>
                <p className="text-[13px]" style={{ color: "#a7b3c6" }}>{candidaturaEdit.empresa}</p>
              </div>
            </div>
            {candidaturaEdit.email && (
              <p className="flex items-center gap-1 text-[12px]" style={{ color: "#fcd34d" }}><AtSign size={11} strokeWidth={1.6} className="shrink-0" />{candidaturaEdit.email}</p>
            )}
            <div className="space-y-1.5">
              <p className="text-[12px]" style={{ color: "#a7b3c6" }}>
                <span className="font-medium">Estado:</span> {COLUMNAS.find(c => c.id === candidaturaEdit.estado)?.label}
              </p>
              <p className="text-[12px]" style={{ color: "#a7b3c6" }}>
                <span className="font-medium">Fecha:</span> {new Date(candidaturaEdit.fecha).toLocaleDateString("es-ES")}
                <span className="ml-2" style={{ color: "var(--texto-tenue)" }}>(+{diasDesde(candidaturaEdit.fecha)} días)</span>
              </p>
            </div>

            {/* Salario y contacto */}
            <div className="flex gap-2">
              <div className="flex-1">
                <label htmlFor="cand-salario" className="text-[11px] font-semibold block mb-1" style={{ color: "#a7b3c6" }}>Salario ofrecido</label>
                <input
                  id="cand-salario"
                  value={salarioEdit}
                  onChange={e => setSalarioEdit(e.target.value)}
                  placeholder="ej. 28.000€/año"
                  className="w-full px-3 py-2 rounded-lg text-xs"
                />
              </div>
              <div className="flex-1">
                <label htmlFor="cand-contacto" className="text-[11px] font-semibold block mb-1" style={{ color: "#a7b3c6" }}>Contacto RRHH</label>
                <input
                  id="cand-contacto"
                  value={contactoEdit}
                  onChange={e => setContactoEdit(e.target.value)}
                  placeholder="Nombre o teléfono"
                  className="w-full px-3 py-2 rounded-lg text-xs"
                />
              </div>
            </div>

            {/* Notas editables */}
            <div>
              <label htmlFor="cand-notas" className="text-[11px] font-semibold block mb-1" style={{ color: "#a7b3c6" }}>Notas / Recruiter / Teléfono</label>
              <textarea
                id="cand-notas"
                rows={3}
                value={notasEdit}
                onChange={e => setNotasEdit(e.target.value)}
                placeholder="Nombre del recruiter, teléfono, resultado entrevista..."
                className="w-full px-3 py-2 rounded-lg text-xs resize-none"
              />
            </div>

            {/* Mover a columna */}
            <div>
              <p className="text-[11px] font-semibold mb-1.5" style={{ color: "#a7b3c6" }}>Mover a</p>
              <div className="flex gap-2 flex-wrap">
                {COLUMNAS.filter(c => c.id !== candidaturaEdit.estado).map(c => (
                  <button key={c.id} onClick={() => { moverCandidatura(candidaturaEdit.id, c.id); setModalAbierto(false); }}
                    className={`tono-${c.tono} inline-flex items-center gap-1 min-h-[36px] px-3 rounded-full text-[12px] font-medium transition`}
                    style={{ background: "rgba(var(--tono),0.1)", border: "1px solid rgba(var(--tono),0.3)", color: "var(--tono-texto)" }}>
                    → {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={guardarNotas} disabled={guardandoNotas}
                className="boton-neon flex-1 disabled:opacity-50" style={{ minHeight: 44 }}>
                {guardandoNotas ? "Guardando..." : "Guardar notas"}
              </button>
              <button onClick={() => setModalAbierto(false)} className="boton-cristal tono-neutro">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal nueva candidatura */}
      {modalNueva && (
        <div className="fixed inset-0 z-[55] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.65)" }} onClick={() => setModalNueva(false)}>
          <div className="ui-neon cristal tono-lima w-full max-w-sm p-5 space-y-3" style={{ background: "rgba(10,13,19,0.98)" }} onClick={e => e.stopPropagation()}
            role="dialog" aria-modal="true" aria-labelledby="titulo-nueva">
            <h3 id="titulo-nueva" className="font-semibold text-[15px]" style={{ color: "#f1f5f9" }}>Nueva candidatura</h3>
            <p className="text-[12px]" style={{ color: "#a7b3c6" }}>Para apuntar las que has hecho por tu cuenta. No gasta envíos.</p>
            <label className="sr-only" htmlFor="nueva-empresa">Empresa</label>
            <input
              id="nueva-empresa"
              placeholder="Empresa *"
              value={nueva.empresa}
              onChange={e => setNueva(p => ({ ...p, empresa: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-lg text-sm"
            />
            <label className="sr-only" htmlFor="nueva-puesto">Puesto</label>
            <input
              id="nueva-puesto"
              placeholder="Puesto (opcional)"
              value={nueva.puesto}
              onChange={e => setNueva(p => ({ ...p, puesto: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-lg text-sm"
            />
            <label className="sr-only" htmlFor="nueva-notas">Notas</label>
            <textarea
              id="nueva-notas"
              placeholder="Notas (recruiter, teléfono...)"
              value={nueva.notas}
              onChange={e => setNueva(p => ({ ...p, notas: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 rounded-lg text-sm resize-none"
            />
            <div className="flex gap-2">
              <button onClick={crearCandidatura} disabled={guardandoNueva || !nueva.empresa.trim()}
                className="boton-neon flex-1 disabled:opacity-50" style={{ minHeight: 44 }}>
                {guardandoNueva ? "Guardando..." : "Añadir candidatura"}
              </button>
              <button onClick={() => setModalNueva(false)} className="boton-cristal tono-neutro">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
