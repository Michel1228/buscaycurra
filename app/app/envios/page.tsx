"use client";

export const dynamic = "force-dynamic";

/**
 * Automatizaciones (/app/envios) — rediseño del 7 nov 2026 (bocetos de Michel).
 *
 * "Automatizaciones" es lo que YA hace la aplicación sola, y nada más: los CV
 * programados en la cola (salen en horario laboral, repartidos), la cámara de
 * Guzzi (foto → empresa → CV) y las alertas de ofertas. El mensaje es el de
 * siempre, candidaturas de calidad y con tu visto bueno; no "envía a más": el
 * boceto decía "Postula a más empleos" y eso es justo lo que nos marcaría como
 * correo masivo.
 *
 * Se conserva todo lo de "Mis envíos": la lista con sus filtros y contadores,
 * cancelar lo programado, quitar de la lista, vaciarla, y el detalle con la
 * carta y el CV que se mandó. Y el contador del plan.
 *
 * Las cifras salen de /api/cv-sender/status (la de siempre) y de
 * /api/jobs/alertas. Antes ponía "{n} envíos en total" contando solo los
 * últimos 20 que devuelve la API: ahora el total es el de verdad.
 */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import Link from "next/link";
import UsageCounter from "@/components/UsageCounter";
import InfoTooltip from "@/components/InfoTooltip";
import MisAlertas from "@/components/MisAlertas";
import { CabeceraPantalla, CifraGrande, TituloSeccion, AccionRapida, IconoCirculo, cifra, type Tono } from "@/components/neon/Neon";
import LogoEmpresa from "@/components/neon/LogoEmpresa";
import {
  Mail, MailCheck, MailX, Eye, MessageCircle, Clock, X, Ban, FileText, Briefcase, Send,
  CalendarClock, Building2, Bell, Camera, MapPin, Users, Bot, ShieldCheck, Search, PenLine,
  CheckCircle2, BarChart3, ArrowRight, ChevronRight, Zap, type LucideIcon,
} from "lucide-react";
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

interface Resumen {
  totalEnviados: number;
  empresasContactadas: number;
  enviadosEsteMes: number;
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
  enviado: "#4ade80", entregado: "#4ade80", visto: "#c084fc", respondido: "#fbbf24",
  pendiente: "#93c5fd", fallido: "#f87171", rebotado: "#f87171", cancelado: "#94a3b8",
};
// "entregado" y "rebotado" los pone el aviso de entrega de Resend (017_cv_sends_entrega):
// antes salían en minúscula, sin color y fuera de los filtros.
// "Visto" lo pone una imagen invisible en el correo que muchos programas
// bloquean o abren solos. Se dice "Visto", como siempre, con un ⓘ al lado que
// lo explica (EXPLICACION_VISTO): es orientativo.
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
const EXPLICACION_VISTO = "Lo sabemos cuando su programa de correo carga las imágenes; algunos lo hacen solos y otros lo bloquean, así que es orientativo.";
const textoEstado = (s: string) => STATUS_TEXTO[s] ?? s.charAt(0).toUpperCase() + s.slice(1);

// Cómo va una candidatura de principio a fin. Cada paso es algo que la
// aplicación hace de verdad (cámara de Guzzi, buscador, Mi CV, carta con IA,
// cola en horario laboral, pipeline).
// Cada paso lleva al sitio de la app donde se hace (12 nov 2026): eran seis
// tarjetas iguales que las que se pulsan y no hacían nada. `filtro` es para
// los que se quedan en esta pantalla: enseña esa parte de la lista de abajo.
const PASOS: { Icono: LucideIcon; tono: Tono; titulo: string; texto: string; href?: string; filtro?: string }[] = [
  { Icono: Camera, tono: "verde", titulo: "Foto o búsqueda", texto: "Una foto al cartel o la tienda, o busca el oficio", href: "/app/gusi?foto=1" },
  { Icono: Building2, tono: "azul", titulo: "La empresa", texto: "Guzzi localiza el negocio y su correo", href: "/app/empresas" },
  { Icono: FileText, tono: "morado", titulo: "Tu CV", texto: "Mejora tu CV con IA", href: "/app/curriculum" },
  { Icono: PenLine, tono: "ambar", titulo: "Su carta", texto: "Con carta escrita por IA para cada una", href: "/app/empresas?seccion=envio" },
  { Icono: CheckCircle2, tono: "lima", titulo: "Tu visto bueno", texto: "Tú apruebas cada envío; sale en horario laboral, repartido", filtro: "pendiente" },
  { Icono: BarChart3, tono: "cian", titulo: "Seguimiento", texto: "A quién, cuándo y si han contestado", href: "/app/pipeline" },
];

// Lo que la cola hace para que los CV lleguen y nadie nos tome por correo
// masivo (lib/cv-sender/scheduler.ts, direccion-segura.ts y el plan).
const CUIDADOS = [
  "Nunca a la misma empresa dos veces en 15 días",
  "Solo en días laborables y en horario de oficina, repartidos",
  "No se manda a correos que rebotan o que no reciben correo",
  "Un tope de envíos al día según tu plan",
];

export default function EnviosPage() {
  const router = useRouter();
  const [envios, setEnvios] = useState<Envio[]>([]);
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [programados, setProgramados] = useState(0);
  const [alertas, setAlertas] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<string>("todos");
  /** Enseña esa parte de «Lo que he enviado» y baja hasta la lista. */
  const verEnLista = (f: string) => {
    setFiltro(f);
    document.getElementById("lista-envios")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const [detalle, setDetalle] = useState<Envio | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await getSupabaseBrowser().auth.getSession();
      if (!session) { router.push("/auth/login"); return; }

      const [res, resAlertas] = await Promise.all([
        fetch("/api/cv-sender/status", { headers: { "Authorization": `Bearer ${session.access_token}` } }),
        fetch("/api/jobs/alertas", { headers: { "Authorization": `Bearer ${session.access_token}` } }).catch(() => null),
      ]);
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
        setProgramados(pending.length);
        if (data.stats) setResumen(data.stats);
      }
      if (resAlertas?.ok) {
        const d = await resAlertas.json() as { alertas?: unknown[] };
        setAlertas(d.alertas?.length ?? 0);
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
      setProgramados(n => Math.max(0, n - 1));
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
    <div className="ui-neon min-h-screen pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-10 space-y-7 sm:space-y-9">

        <CabeceraPantalla
          guzzi
          antetitulo="Automatizaciones"
          titulo="Mis envíos"
          resaltado="de CV"
          subtitulo={
            <>
              {resumen ? `${cifra(resumen.totalEnviados)} envíos en total` : `${envios.length} envíos`} ·{" "}
              <Link href="/app/empresas" className="underline" style={{ color: "#d9f99d" }}>Enviar nuevo CV →</Link>
            </>
          }
        />

        {/* ── Cifras ── */}
        <section aria-label="Resumen de tus envíos" className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <CifraGrande tono="azul" Icono={CalendarClock} valor={loading ? "…" : programados} etiqueta="Programados" nota="Salen en horario laboral" onClick={() => verEnLista("pendiente")} />
          <CifraGrande tono="verde" Icono={Send} valor={resumen ? resumen.enviadosEsteMes : "…"} etiqueta="Enviados este mes" onClick={() => verEnLista("enviado")} />
          <CifraGrande tono="morado" Icono={Building2} valor={resumen ? resumen.empresasContactadas : "…"} etiqueta="Empresas contactadas" href="/app/pipeline" />
          <CifraGrande tono="ambar" Icono={Bell} valor={alertas ?? "…"} etiqueta="Alertas activas" href="#alertas" />
        </section>

        {/* ── Enviar el CV (la acción principal) y cómo se cuida cada envío ── */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5" aria-label="Enviar tu CV">
          <div className="cristal tono-lima relative overflow-hidden lg:col-span-7 p-5 sm:p-7 flex flex-col gap-5"
            style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), 0 0 0 1px rgba(163,230,53,0.15), 0 24px 60px -30px rgba(163,230,53,0.7)" }}>
            <div className="flex items-start gap-4">
              <span className="icono-circulo tono-lima" style={{ width: 56, height: 56, borderRadius: 18 }} aria-hidden="true"><Mail size={26} /></span>
              <div className="min-w-0">
                <h2 className="text-2xl sm:text-[28px] font-extrabold tracking-tight" style={{ color: "#f8fafc" }}>
                  Enviar mi <span className="texto-neon">CV</span>
                </h2>
                <p className="text-[14px] mt-0.5" style={{ color: "#a7b3c6" }}>Con carta escrita por IA para cada una</p>
              </div>
            </div>
            <ul className="grid gap-2.5 sm:grid-cols-2">
              {[
                "Guzzi, cuando tú se lo pides",
                "Una carta escrita para cada empresa",
                "Llega en horario laboral, repartido",
                "Ves cada envío y si ha llegado",
              ].map((t) => (
                <li key={t} className="flex items-center gap-2.5 text-[15px]" style={{ color: "#e2e8f0" }}>
                  <CheckCircle2 size={18} strokeWidth={2.2} className="shrink-0" style={{ color: "var(--neon)" }} aria-hidden="true" />{t}
                </li>
              ))}
            </ul>
            <div className="flex flex-col sm:flex-row gap-3 mt-auto">
              <Link href="/app/empresas?seccion=envio" className="boton-neon sm:flex-1">
                Enviar mi CV <ArrowRight size={18} aria-hidden="true" />
              </Link>
              {/* La cámara está en el chat de Guzzi: llega con el botón iluminado. */}
              <Link href="/app/gusi?foto=1" className="boton-cristal tono-lima sm:flex-1">
                <Camera size={18} aria-hidden="true" /> Foto de un cartel o tienda
              </Link>
            </div>
          </div>

          <div className="cristal tono-verde lg:col-span-5 p-5 sm:p-7">
            <div className="flex items-center gap-3 mb-4">
              <IconoCirculo Icono={ShieldCheck} tono="verde" />
              <h2 className="text-lg font-bold" style={{ color: "#f8fafc" }}>Cómo cuidamos tus envíos</h2>
            </div>
            <ul className="space-y-3">
              {CUIDADOS.map((c) => (
                <li key={c} className="flex items-start gap-2.5 text-[14px] leading-snug" style={{ color: "#dbe3ee" }}>
                  <CheckCircle2 size={17} className="shrink-0 mt-0.5" style={{ color: "#86efac" }} aria-hidden="true" />{c}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── Cómo va una candidatura ── */}
        <section aria-labelledby="titulo-pasos">
          <TituloSeccion id="titulo-pasos" Icono={Zap} titulo="Cómo funciona" />
          <ol className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            {PASOS.map((p, i) => {
              const clases = `cristal cristal-enlace tono-${p.tono} relative p-4 flex flex-col items-start gap-2.5 w-full h-full text-left`;
              const dentro = (
                <>
                  <span className="flex items-center gap-2">
                    <IconoCirculo Icono={p.Icono} tono={p.tono} size={40} />
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[12px] font-bold"
                      style={{ background: "rgba(var(--tono),0.2)", color: "var(--tono-texto)" }} aria-hidden="true">{i + 1}</span>
                  </span>
                  <span className="block text-[15px] font-bold leading-tight" style={{ color: "#f1f5f9" }}>{p.titulo}</span>
                  <span className="block text-[12.5px] leading-snug" style={{ color: "#a7b3c6" }}>{p.texto}</span>
                  <ChevronRight size={15} className="absolute top-3 right-3 opacity-60" aria-hidden="true" />
                </>
              );
              return (
                <li key={p.titulo}>
                  {p.href
                    ? <Link href={p.href} className={clases}>{dentro}</Link>
                    : <button type="button" onClick={() => verEnLista(p.filtro!)} className={clases}>{dentro}</button>}
                </li>
              );
            })}
          </ol>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ── Lo que has enviado (la lista de siempre) ── */}
          <section id="lista-envios" className="lg:col-span-8 min-w-0 scroll-mt-20" aria-labelledby="titulo-lista">
            <TituloSeccion id="titulo-lista" Icono={Send} titulo="Lo que he enviado" />

            {/* Filtros */}
            <div className="flex gap-2 flex-wrap items-center mb-4" role="group" aria-label="Filtrar envíos">
              {FILTROS.map(({ id: f }) => (
                <button key={f} onClick={() => setFiltro(f)}
                  aria-pressed={filtro === f}
                  className="flex items-center gap-1.5 min-h-[40px] px-3.5 rounded-full text-[13px] font-semibold transition"
                  style={{
                    background: filtro === f ? "linear-gradient(180deg,#d9f99d,#a3e635)" : "rgba(255,255,255,0.05)",
                    color: filtro === f ? "#0b1406" : "#cbd5e1",
                    border: `1px solid ${filtro === f ? "#a3e635" : "rgba(255,255,255,0.1)"}`,
                  }}>
                  <StatusIcon status={f} size={13} />
                  {f === "todos" ? "Todos" : textoEstado(f)}
                  {f !== "todos" && contadores[f] ? ` (${contadores[f]})` : ""}
                </button>
              ))}
              <span className="inline-flex items-center gap-1 text-[12px]" style={{ color: "var(--texto-tenue)" }}>
                «Visto» <InfoTooltip text={EXPLICACION_VISTO} position="bottom" />
              </span>
            </div>

            {/* Lista */}
            {loading ? (
              <div className="cristal tono-neutro text-center py-16" style={{ color: "#a7b3c6" }}>Cargando...</div>
            ) : filtrados.length === 0 ? (
              <div className="cristal tono-neutro text-center py-14 px-4" style={{ color: "#a7b3c6" }}>
                <div className="flex justify-center mb-3"><Mail size={40} className="opacity-50" /></div>
                <p>{envios.length === 0 ? "Todavía no has enviado ningún CV." : "No hay envíos con este filtro."}</p>
                <Link href="/app/empresas" className="boton-neon mt-5">
                  Enviar mi primer CV →
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {filtrados.map(envio => (
                  <div key={envio.id}
                    className="cristal tono-neutro flex items-center gap-3 sm:gap-4 p-3 sm:p-4">
                    <button type="button" onClick={() => setDetalle(envio)} className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0 text-left"
                      aria-label={`Ver el envío a ${envio.company_name}`}>
                      <LogoEmpresa empresa={envio.company_name} correo={envio.company_email} tono="neutro" size={40} />
                      <span className="flex-1 min-w-0">
                        <span className="block font-semibold truncate" style={{ color: "#f1f5f9" }}>{envio.company_name}</span>
                        {envio.job_title && <span className="flex items-center gap-1 text-[13px] truncate" style={{ color: "#a7b3c6" }}><Briefcase size={12} aria-hidden="true" />{envio.job_title}</span>}
                        {envio.company_email && <span className="flex items-center gap-1 text-[12px] truncate" style={{ color: "var(--texto-tenue)" }}><Mail size={11} aria-hidden="true" />{envio.company_email}</span>}
                        <span className="block text-[12px] mt-0.5" style={{ color: "var(--texto-tenue)" }}>
                          {formatLocalDate(envio.sent_at || envio.created_at)}
                        </span>
                      </span>
                    </button>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className="inline-flex items-center gap-1">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[12px] font-bold"
                          style={{ background: `${STATUS_COLOR[envio.status] ?? "#94a3b8"}22`, color: STATUS_COLOR[envio.status] ?? "#94a3b8" }}>
                          <StatusIcon status={envio.status} size={12} />
                          {textoEstado(envio.status)}
                        </span>
                        {envio.status === "visto" && <InfoTooltip text={EXPLICACION_VISTO} position="left" />}
                      </span>
                      <div className="flex gap-1">
                        {envio.status === "pendiente" && (
                          <button onClick={() => cancelarEnvio(envio.id)}
                            className="min-h-[32px] px-3 rounded-full text-[12px] font-semibold transition hover:opacity-80"
                            style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }}>
                            Cancelar
                          </button>
                        )}
                        <button onClick={() => eliminarEnvio(envio.id)}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-full transition hover:opacity-80"
                          style={{ background: "rgba(148,163,184,0.12)", border: "1px solid rgba(148,163,184,0.25)", color: "#a7b3c6" }}
                          title="Eliminar de la lista" aria-label={`Quitar de la lista el envío a ${envio.company_name}`}>
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {/* Vaciar la lista: abajo y discreto. Arriba, en rojo, era lo primero que se veía. */}
                <div className="pt-4 text-center">
                  <button onClick={eliminarTodos} className="text-xs underline hover:opacity-80 min-h-[36px]" style={{ color: "var(--texto-tenue)" }}>
                    Vaciar la lista de envíos
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* ── El plan y las alertas ── */}
          <aside className="lg:col-span-4 space-y-5">
            {/* Lo que te queda hoy; al pulsarlo, tu plan. */}
            <Link href="/app/perfil?tab=plan" className="cristal cristal-enlace tono-neutro block p-2" aria-label="Lo que te queda hoy en tu plan. Ver mi plan">
              <UsageCounter compact />
              <span className="flex items-center justify-end gap-1 px-3 pt-1.5 pb-1 text-[12px] font-semibold" style={{ color: "var(--neon-claro)" }}>
                Ver mi plan <ChevronRight size={14} aria-hidden="true" />
              </span>
            </Link>
            {/* Las alertas de ofertas (el mismo componente que en el perfil). */}
            <div id="alertas" className="scroll-mt-20">
              <MisAlertas />
            </div>
          </aside>
        </div>

        {/* ── Acciones rápidas (las secciones de "Buscar y enviar CV") ── */}
        <section aria-labelledby="titulo-acciones-envios">
          <TituloSeccion id="titulo-acciones-envios" Icono={Zap} titulo="Acciones rápidas" />
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            <AccionRapida tono="verde" Icono={MapPin} texto="Negocios de tu zona" href="/app/empresas?seccion=zona" />
            <AccionRapida tono="azul" Icono={Search} texto="Buscar una empresa" href="/app/empresas?seccion=buscar" />
            <AccionRapida tono="morado" Icono={Users} texto="ETTs y agencias" href="/app/empresas?seccion=ett" />
            <AccionRapida tono="lima" Icono={Bot} texto="Que lo haga Guzzi" href="/app/gusi" />
          </div>
        </section>
      </div>

      {/* Modal detalle de envío */}
      {detalle && (
        <div className="fixed inset-0 z-[55] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }}
          onClick={() => setDetalle(null)}>
          <div className="ui-neon cristal tono-lima w-full max-w-lg max-h-[85vh] overflow-y-auto p-6" style={{ background: "rgba(10,13,19,0.98)" }}
            onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="titulo-detalle-envio">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3 min-w-0">
                <LogoEmpresa empresa={detalle.company_name} correo={detalle.company_email} tono="lima" size={40} />
                <h2 id="titulo-detalle-envio" className="text-lg font-bold truncate" style={{ color: "#f8fafc" }}>{detalle.company_name}</h2>
              </div>
              <button onClick={() => setDetalle(null)} className="inline-flex items-center justify-center w-10 h-10 rounded-full shrink-0" style={{ color: "#a7b3c6" }} aria-label="Cerrar"><X size={18} /></button>
            </div>

            <div className="space-y-3 text-sm mb-4">
              {detalle.job_title && (
                <div><span style={{ color: "#a7b3c6" }}>Puesto:</span> <span style={{ color: "#f1f5f9" }}>{detalle.job_title}</span></div>
              )}
              <div><span style={{ color: "#a7b3c6" }}>Email:</span> <span style={{ color: "#f1f5f9" }}>{detalle.company_email}</span></div>
              <div><span style={{ color: "#a7b3c6" }}>Estado:</span> <span className="font-semibold" style={{ color: STATUS_COLOR[detalle.status] }}>{textoEstado(detalle.status)}</span></div>
              <div><span style={{ color: "#a7b3c6" }}>Fecha:</span> <span style={{ color: "#f1f5f9" }}>
                {formatLocalDate(detalle.sent_at || detalle.created_at, "ES", { month: "long" })}
              </span></div>
            </div>

            {detalle.cover_letter && (
              <div className="mb-4">
                <h3 className="flex items-center gap-1.5 text-sm font-semibold mb-2" style={{ color: "#d9f99d" }}><FileText size={14} /> Carta de presentación</h3>
                <div className="rounded-xl p-4 text-sm whitespace-pre-line" style={{ background: "rgba(6,9,11,0.8)", border: "1px solid rgba(148,163,184,0.18)", color: "#cbd5e1" }}>
                  {detalle.cover_letter}
                </div>
              </div>
            )}

            {detalle.cv_snapshot && (() => {
              try {
                const cv = JSON.parse(detalle.cv_snapshot);
                return (
                  <div>
                    <h3 className="text-sm font-semibold mb-2" style={{ color: "#d9f99d" }}>CV enviado</h3>
                    <div className="rounded-xl p-4 text-sm space-y-2" style={{ background: "rgba(6,9,11,0.8)", border: "1px solid rgba(148,163,184,0.18)" }}>
                      {cv.nombre && <p className="font-semibold" style={{ color: "#f1f5f9" }}>{cv.nombre} {cv.apellidos || ""}</p>}
                      {cv.ciudad && <p style={{ color: "#a7b3c6" }}>{cv.ciudad}{cv.provincia ? `, ${cv.provincia}` : ""}</p>}
                      {cv.telefono && <p style={{ color: "#a7b3c6" }}>📞 {cv.telefono}</p>}
                      {cv.email && <p style={{ color: "#a7b3c6" }}>{cv.email}</p>}
                      {cv.perfil && <p className="mt-2 italic" style={{ color: "#cbd5e1" }}>"{cv.perfil}"</p>}
                    </div>
                  </div>
                );
              } catch { return null; }
            })()}

            {!detalle.cover_letter && !detalle.cv_snapshot && (
              <p className="text-sm text-center py-4" style={{ color: "var(--texto-tenue)" }}>Este envío no tiene detalle guardado (se envió antes de esta actualización).</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
