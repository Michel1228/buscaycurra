"use client";

/**
 * Inicio (/app/bienvenida) — rediseño del 7 nov 2026 con los bocetos de Michel.
 *
 * Une los dos bocetos de Inicio ("Habla con Guzzi" y "¡Hola! Soy Guzzi") en una
 * sola pantalla, con UNA acción principal: hablar con Guzzi. Todo lo que había
 * sigue: el saludo, los primeros pasos, las cuatro cifras, las dos formas de
 * buscar, las ofertas según el CV (y sus avisos sin CV o sin ofertas) y las
 * acciones rápidas.
 *
 * DE DÓNDE SALE CADA CIFRA. Las cuatro de arriba, de /api/dashboard (la misma
 * consulta de siempre). "Lo último que has hecho" son sus propios envíos de la
 * tabla cv_sends (una lectura suya, por su usuario). Nada más: los bocetos
 * traían porcentajes y tendencias que no salen de ningún sitio y aquí no están.
 */
import { useRouter } from "next/navigation";
import { useState, useEffect, type FormEvent } from "react";
import Link from "next/link";
import PrimerDia from "@/components/PrimerDia";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { CORREO_ANOTACION_MANUAL } from "@/lib/cv-sender/anotacion";
import { sueldoCreible } from "@/lib/sueldo-visible";
import { CabeceraPantalla, CifraGrande, GuzziBrillo, Etiqueta, TituloSeccion, AccionRapida, type Tono } from "@/components/neon/Neon";
import LogoEmpresa from "@/components/neon/LogoEmpresa";
import {
  Sparkles, FileText, Search, BarChart3, Target, Mail, Zap, Briefcase, Check,
  ShieldCheck, Send, Wallet, MapPin, ChevronRight, ArrowRight, Clock, PenLine, CalendarClock, History,
} from "lucide-react";

interface DashboardStats {
  ofertasNuevasHoy: number;
  cvsEnviados: number;
  cvsEnviadosHoy: number;
  entrevistasPendientes: number;
  pipelineActivo: number;
}

interface OfertaRec {
  id: string;
  titulo: string;
  empresa: string;
  ubicacion: string;
  salario: string;
  fuente: string;
  url: string;
  sector: string;
}

interface QuickAction {
  icon: string;
  label: string;
  href: string;
  color: string;
}

interface Movimiento {
  id: string;
  company_name: string | null;
  company_email: string | null;
  job_title: string | null;
  status: string | null;
  created_at: string;
}

/** Mapea iconos string → componente Lucide */
function iconoDe(name: string) {
  switch (name) {
    case "SPARKLES": return Sparkles;
    case "MAIL": return Mail;
    case "BARCHART3": return BarChart3;
    case "TARGET": return Target;
    case "FILETEXT": return FileText;
    case "SEARCH": return Search;
    // El respaldo NO puede ser mudo. Este `default` se trago durante meses que
    // la API mandaba emoji en vez de nombres: las cuatro acciones rapidas
    // salian con el mismo rayo y nada avisaba. Ahora, en desarrollo, se queja.
    default:
      if (process.env.NODE_ENV !== "production") {
        console.warn(`[bienvenida] icono desconocido: ${JSON.stringify(name)} — se pinta un rayo por defecto. Los nombres validos son SPARKLES, MAIL, BARCHART3, TARGET, FILETEXT y SEARCH.`);
      }
      return Zap;
  }
}

/** El color de cada acción rápida, por su icono (el de la API es el de antes). */
const TONO_ACCION: Record<string, Tono> = { SPARKLES: "lima", FILETEXT: "ambar", SEARCH: "azul", BARCHART3: "morado", MAIL: "verde", TARGET: "ambar" };
const TONOS_LOGO: Tono[] = ["verde", "azul", "ambar", "morado", "cian", "rosa"];

/** "ADZUNA_ES" → "Adzuna", "EURES_ZAR" → "Careerjet" (error histórico, ver JobCard). */
function fuenteVisible(fuente: string): string {
  if (/^EURES_/i.test(fuente)) return "Careerjet";
  const base = (fuente || "").split("_")[0];
  if (!base || base.toLowerCase() === "buscaycurra") return "";
  return base.length <= 4 && base === base.toUpperCase() ? base : base[0].toUpperCase() + base.slice(1).toLowerCase();
}

/** "Hace 3 h", "Ayer", "Hace 5 días". */
function haceCuanto(fecha: string): string {
  const min = Math.max(0, Math.round((Date.now() - new Date(fecha).getTime()) / 60000));
  if (min < 60) return min <= 1 ? "Ahora" : `Hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `Hace ${h} h`;
  const d = Math.round(h / 24);
  if (d === 1) return "Ayer";
  if (d < 30) return `Hace ${d} días`;
  return new Date(fecha).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

/** Qué fue cada envío, dicho como lo diría una persona. */
function queFue(m: Movimiento): { texto: string; Icono: typeof Send; tono: Tono } {
  const empresa = m.company_name || "una empresa";
  if (m.company_email === CORREO_ANOTACION_MANUAL) return { texto: `Apuntaste tu candidatura en ${empresa}`, Icono: PenLine, tono: "ambar" };
  if (m.status === "pendiente") return { texto: `CV programado para ${empresa}`, Icono: CalendarClock, tono: "azul" };
  if (m.status === "fallido" || m.status === "rebotado") return { texto: `No llegó tu CV a ${empresa}`, Icono: Mail, tono: "rosa" };
  if (m.status === "cancelado") return { texto: `Cancelaste el envío a ${empresa}`, Icono: Mail, tono: "neutro" };
  return { texto: `CV enviado a ${empresa}`, Icono: Send, tono: "verde" };
}

export default function BienvenidaClient() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    ofertasNuevasHoy: 0,
    cvsEnviados: 0,
    cvsEnviadosHoy: 0,
    entrevistasPendientes: 0,
    pipelineActivo: 0,
  });
  const [ofertas, setOfertas] = useState<OfertaRec[]>([]);
  const [estadoRecomendadas, setEstadoRecomendadas] = useState<string>("");
  const [puestosRecomendadas, setPuestosRecomendadas] = useState<string[]>([]);
  const [quickActions, setQuickActions] = useState<QuickAction[]>([]);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [pedido, setPedido] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        const session = (await getSupabaseBrowser().auth.getSession()).data.session;
        if (!session) { router.push("/auth/login"); return; }

        const sb = getSupabaseBrowser();
        // Todo a la vez: el nombre, el panel y lo último que ha hecho.
        const [{ data: perfil }, res, { data: ultimos }] = await Promise.all([
          sb.from("profiles").select("full_name").eq("id", session.user.id).single(),
          fetch("/api/dashboard", { headers: { Authorization: `Bearer ${session.access_token}` } }),
          sb.from("cv_sends")
            .select("id, company_name, company_email, job_title, status, created_at")
            .eq("user_id", session.user.id)
            .order("created_at", { ascending: false })
            .limit(4),
        ]);
        const nombre = perfil?.full_name?.split(" ")[0] || session.user.email?.split("@")[0] || "";
        setUserName(nombre);
        setMovimientos((ultimos as Movimiento[] | null) || []);

        if (res.ok) {
          const data = await res.json();
          setStats(data.stats);
          setOfertas(data.ofertasRecomendadas || []);
          setEstadoRecomendadas(data.estadoRecomendadas || "");
          setPuestosRecomendadas(data.puestosRecomendadas || []);
          setQuickActions(data.quickActions || []);
        }
      } catch (err) {
        console.error("Error cargando dashboard:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, [router]);

  function hablarConGuzzi(e: FormEvent) {
    e.preventDefault();
    const texto = pedido.trim();
    // El texto se deja escrito en el chat; lo manda la persona (GusiChat, ?q=).
    router.push(texto ? `/app/gusi?q=${encodeURIComponent(texto)}` : "/app/gusi");
  }

  if (loading) {
    return (
      // La ruedita usaba una clase de borde que Tailwind no tiene: salía con borde 0
      // y la primera pantalla de quien se acaba de registrar se veía vacía (19 oct 2026).
      <div className="min-h-screen flex flex-col gap-3 items-center justify-center pt-16">
        <div className="animate-spin rounded-full h-10 w-10 border-[3px]" style={{ borderColor: "#2d3142", borderTopColor: "#a3e635" }} />
        <p className="text-sm" style={{ color: "#94a3b8" }}>Preparando tu panel…</p>
      </div>
    );
  }

  // Los mismos atajos que el chat (components/GusiChat.tsx): nombre y mensaje.
  const pedidos = [
    { label: "Buscar trabajo", msg: "Quiero buscar trabajo, ¿me ayudas?" },
    { label: "Au Pair", msg: "Quiero información sobre el programa Au Pair en el extranjero" },
    { label: "Preparar entrevista", msg: "Quiero preparar una entrevista de trabajo" },
    { label: "Emigrar", msg: "Quiero emigrar al extranjero, ¿qué opciones tengo?" },
  ];

  const acciones = quickActions.length > 0 ? quickActions : [
    { icon: "SPARKLES", label: "Hablar con Guzzi", href: "/app/gusi", color: "#22c55e" },
    { icon: "FILETEXT", label: "Mejorar mi CV", href: "/app/curriculum", color: "#f59e0b" },
    { icon: "SEARCH", label: "Buscar ofertas", href: "/app/buscar", color: "#3b82f6" },
    { icon: "BARCHART3", label: "Mi pipeline", href: "/app/pipeline", color: "#a855f7" },
  ];

  return (
    <div className="ui-neon min-h-screen pt-16" style={{ background: "transparent" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-10 space-y-7 sm:space-y-9">

        <CabeceraPantalla
          guzzi
          titulo={`¡Hola${userName ? `, ${userName}` : ""}! Soy`}
          resaltado="Guzzi"
          subtitulo="Tu asistente de empleo con IA. ¿Qué quieres hacer hoy?"
        />

        {/* Los tres pasos del principio. Va ANTES que las estadisticas porque a
            quien acaba de llegar cuatro ceros no le dicen nada: lo que necesita
            es saber por donde se empieza. Desaparece sola al completarlos. */}
        <PrimerDia />

        {/* ── Las cuatro cifras (de /api/dashboard) ── */}
        <section aria-label="Tu resumen de hoy" className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <CifraGrande tono="azul" Icono={Sparkles} valor={stats.ofertasNuevasHoy} etiqueta="Ofertas nuevas hoy" href="/app/buscar" />
          <CifraGrande tono="verde" Icono={Mail} valor={stats.cvsEnviadosHoy} etiqueta="CVs enviados hoy" href="/app/envios" />
          <CifraGrande tono="morado" Icono={BarChart3} valor={stats.pipelineActivo} etiqueta="Pipeline activo" href="/app/pipeline" />
          <CifraGrande tono="ambar" Icono={Target} valor={stats.entrevistasPendientes ?? 0} etiqueta="Entrevistas" href="/app/entrevistas" />
        </section>

        {/* ── Las dos formas de buscar: con Guzzi (la principal) o a mano ── */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5" aria-label="¿Cómo quieres buscar?">
          <div className="cristal tono-lima relative overflow-hidden lg:col-span-7 p-5 sm:p-7 flex flex-col gap-5"
            style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), 0 0 0 1px rgba(163,230,53,0.15), 0 24px 60px -30px rgba(163,230,53,0.7)" }}>
            <div className="flex items-start gap-4">
              <GuzziBrillo size={64} decorativo />
              <div className="min-w-0">
                <h2 className="text-2xl sm:text-[28px] font-extrabold tracking-tight" style={{ color: "#f8fafc" }}>
                  Usar a <span className="texto-neon">Guzzi</span>
                </h2>
                <div className="mt-1"><Etiqueta tono="lima">Recomendado</Etiqueta></div>
              </div>
            </div>
            <ul className="grid gap-2.5 sm:grid-cols-2">
              {["Busca ofertas adaptadas a ti", "Mejora tu CV con IA", "Escribe una carta para cada empresa", "Tú apruebas cada envío"].map((t) => (
                <li key={t} className="flex items-center gap-2.5 text-[15px]" style={{ color: "#e2e8f0" }}>
                  <Check size={18} strokeWidth={2.4} className="shrink-0" style={{ color: "var(--neon)" }} aria-hidden="true" />{t}
                </li>
              ))}
            </ul>
            <form onSubmit={hablarConGuzzi} className="flex flex-col sm:flex-row gap-2.5">
              <label htmlFor="pide-a-guzzi" className="sr-only">Escribe qué necesitas y Guzzi te ayuda</label>
              <input
                id="pide-a-guzzi"
                type="text"
                value={pedido}
                onChange={(e) => setPedido(e.target.value)}
                placeholder="Escribe un mensaje..."
                maxLength={500}
                className="flex-1 min-w-0 min-h-[48px]"
                style={{ borderRadius: 9999, background: "rgba(6,9,11,0.7)", borderColor: "rgba(163,230,53,0.35)" }}
              />
              <button type="submit" className="boton-neon">
                Hablar con Guzzi <ArrowRight size={18} aria-hidden="true" />
              </button>
            </form>
            <div>
              <p className="text-[13px] mb-2" style={{ color: "var(--texto-tenue)" }}>O pulsa uno de los atajos:</p>
              <div className="flex flex-wrap gap-2">
                {pedidos.map((p) => (
                  <Link key={p.label} href={`/app/gusi?q=${encodeURIComponent(p.msg)}`}
                    className="inline-flex items-center min-h-[44px] px-4 rounded-full text-[13px] font-medium transition-colors"
                    style={{ background: "rgba(163,230,53,0.07)", border: "1px solid rgba(163,230,53,0.25)", color: "#dbe7c9" }}>
                    {p.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="cristal tono-azul lg:col-span-5 p-5 sm:p-7 flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <span className="icono-circulo tono-azul" style={{ width: 56, height: 56, borderRadius: 18 }} aria-hidden="true"><Search size={26} /></span>
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight" style={{ color: "#f8fafc" }}>Modo manual</h2>
                <p className="text-[14px]" style={{ color: "#a7b3c6" }}>Control total</p>
              </div>
            </div>
            <ul className="grid gap-1">
              {[
                { Icono: Search, texto: "Busca ofertas tú mismo", href: "/app/buscar", tono: "azul" as Tono },
                { Icono: BarChart3, texto: "Gestiona tu pipeline", href: "/app/pipeline", tono: "morado" as Tono },
                { Icono: Send, texto: "Controla los envíos", href: "/app/envios", tono: "verde" as Tono },
                { Icono: Wallet, texto: "Compara salarios", href: "/app/salarios", tono: "ambar" as Tono },
              ].map(({ Icono, texto, href, tono }) => (
                <li key={href}>
                  <Link href={href} className={`tono-${tono} flex items-center gap-3 min-h-[48px] px-2 -mx-2 rounded-xl hover:bg-white/[0.04]`}>
                    <Icono size={19} style={{ color: "var(--tono-texto)" }} aria-hidden="true" />
                    <span className="flex-1 text-[15px]" style={{ color: "#e2e8f0" }}>{texto}</span>
                    <ChevronRight size={16} className="opacity-50" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
            <Link href="/app/buscar" className="boton-cristal tono-azul w-full mt-auto">Ir al buscador <ArrowRight size={17} aria-hidden="true" /></Link>
          </div>
        </section>

        {/* ── Ofertas según tu CV ── */}
        {/* Sin CV no se recomienda nada al azar: se le pide que lo rellene (17 oct 2026). */}
        {ofertas.length === 0 && estadoRecomendadas === "sin-cv" && (
          <div className="cristal tono-ambar p-5 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
            <div className="flex items-start gap-3">
              <span className="icono-circulo tono-ambar" aria-hidden="true"><Briefcase size={20} /></span>
              <div>
                <h2 className="text-base font-bold" style={{ color: "#f1f5f9" }}>Ofertas según tu CV</h2>
                <p className="text-sm mt-0.5" style={{ color: "#a7b3c6" }}>
                  Pon en tu CV de qué has trabajado y aquí te saldrán ofertas que encajan, cerca de ti.
                </p>
              </div>
            </div>
            <Link href="/app/curriculum" className="boton-neon shrink-0">Rellenar mi CV</Link>
          </div>
        )}

        {/* POR QUÉ SE SUGIERE (22 oct 2026): de qué puestos del CV salen, como en
            el buscador; y si hoy no hay nada de lo suyo cerca, se dice en vez de
            dejar el hueco vacío. */}
        {ofertas.length === 0 && estadoRecomendadas === "sin-ofertas" && (
          <div className="cristal tono-ambar p-5 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
            <div className="flex items-start gap-3">
              <span className="icono-circulo tono-ambar" aria-hidden="true"><Briefcase size={20} /></span>
              <div>
                <h2 className="text-base font-bold" style={{ color: "#f1f5f9" }}>Ofertas según tu CV</h2>
                <p className="text-sm mt-0.5" style={{ color: "#a7b3c6" }}>
                  Ahora no hay ofertas de lo tuyo{puestosRecomendadas.length ? ` (${puestosRecomendadas.join(", ").toLowerCase()})` : ""} cerca de ti. Te avisamos cuando salgan.
                </p>
              </div>
            </div>
            <Link href="/app/buscar" className="boton-cristal tono-ambar shrink-0">Buscar en otra zona</Link>
          </div>
        )}

        {ofertas.length > 0 && (
          <section aria-labelledby="titulo-ofertas-cv">
            <TituloSeccion
              id="titulo-ofertas-cv"
              Icono={Briefcase}
              titulo="Ofertas según tu CV"
              subtitulo={puestosRecomendadas.length > 0
                ? <>De lo que has trabajado ({puestosRecomendadas.join(", ").toLowerCase()}), primero las de tu zona.</>
                : undefined}
              enlace={{ href: "/app/buscar", texto: "Ver todas" }}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
              {ofertas.slice(0, 6).map((oferta, i) => {
                const sueldo = sueldoCreible(oferta.salario);
                const fuente = fuenteVisible(oferta.fuente);
                return (
                  <Link
                    key={oferta.id}
                    href={`/app/ofertas/${encodeURIComponent(oferta.id)}`}
                    className="cristal cristal-enlace tono-neutro flex items-start gap-3.5 p-4"
                  >
                    <LogoEmpresa empresa={oferta.empresa} tono={TONOS_LOGO[i % TONOS_LOGO.length]} size={44} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-semibold leading-snug line-clamp-2" style={{ color: "#f1f5f9" }}>{oferta.titulo}</p>
                      <p className="text-[13px] mt-0.5 truncate" style={{ color: "#a7b3c6" }}>{oferta.empresa}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12px]" style={{ color: "var(--texto-tenue)" }}>
                        <span className="inline-flex items-center gap-1"><MapPin size={13} aria-hidden="true" />{oferta.ubicacion || "Sin ubicación"}</span>
                        {fuente && <span>{fuente}</span>}
                        {sueldo && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full font-semibold"
                            style={{ background: "rgba(163,230,53,0.1)", border: "1px solid rgba(163,230,53,0.3)", color: "#d9f99d" }}>
                            {sueldo}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Acciones rápidas y lo último que ha hecho ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <section className="lg:col-span-8" aria-labelledby="titulo-acciones">
            <TituloSeccion id="titulo-acciones" Icono={Zap} titulo="Acciones rápidas" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {acciones.map((a, i) => (
                <AccionRapida key={a.label} tono={TONO_ACCION[a.icon] || "neutro"} Icono={iconoDe(a.icon)} texto={a.label} href={a.href} destacada={i === 0} />
              ))}
            </div>
          </section>

          <section className="lg:col-span-4" aria-labelledby="titulo-ultimo">
            <TituloSeccion id="titulo-ultimo" Icono={Clock} titulo="Lo último" enlace={movimientos.length ? { href: "/app/envios", texto: "Ver historial" } : undefined} />
            <div className="cristal tono-neutro p-2">
              {movimientos.length === 0 ? (
                <div className="p-3 flex items-center gap-3">
                  <span className="icono-circulo tono-verde" aria-hidden="true"><History size={18} /></span>
                  <p className="text-sm" style={{ color: "#a7b3c6" }}>
                    Aquí verás tus envíos. <Link href="/app/empresas?seccion=envio" className="underline" style={{ color: "#d9f99d" }}>Envía tu primer CV</Link>
                  </p>
                </div>
              ) : (
                <ul>
                  {movimientos.map((m) => {
                    const { texto, Icono, tono } = queFue(m);
                    return (
                      <li key={m.id} className="flex items-center gap-3 px-2.5 py-2.5 rounded-xl">
                        <span className={`icono-circulo tono-${tono}`} style={{ width: 34, height: 34 }} aria-hidden="true"><Icono size={15} /></span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[14px] leading-snug truncate" style={{ color: "#e2e8f0" }}>{texto}</p>
                          {m.job_title && <p className="text-[12px] truncate" style={{ color: "var(--texto-tenue)" }}>{m.job_title}</p>}
                        </div>
                        <span className="text-[12px] shrink-0" style={{ color: "var(--texto-tenue)" }}>{haceCuanto(m.created_at)}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            <p className="flex items-center gap-1.5 mt-3 text-[12px]" style={{ color: "var(--texto-tenue)" }}>
              <ShieldCheck size={14} aria-hidden="true" style={{ color: "var(--neon)" }} /> Ningún CV sale sin que tú lo pidas.
            </p>
          </section>
        </div>

        {/* ── Footer tagline ── */}
        <p className="text-center text-xs" style={{ color: "var(--texto-tenue)" }}>
          BuscayCurra — Buscar trabajo, más fácil
        </p>
      </div>
    </div>
  );
}
