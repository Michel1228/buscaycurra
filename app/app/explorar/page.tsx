"use client";

/**
 * Ofertas (/app/explorar) — la puerta de "Buscar y enviar CV" (7 nov 2026).
 *
 * Es el boceto "Explorar" de Michel con lo que de verdad tenemos detrás:
 *  - el buscador, con los mismos autorrellenos de oficio y ciudad que
 *    /app/buscar (lib/sugerencias.ts), que lleva allí la búsqueda;
 *  - los accesos a cada parte de buscar y enviar CV (negocios de la zona,
 *    buscar una empresa, ETTs, salarios, au pair);
 *  - tres destacados: las ofertas según tu CV, emigrar (el globo morado que
 *    le gustó a Michel) y los cursos;
 *  - las herramientas: Guzzi, Mi CV, enviar el CV, entrevistas y guardados.
 *
 * Fuera lo que el boceto traía sin nada detrás: "Empresas top", "Nuevas
 * tendencias", "Sectores en crecimiento" y "Ver todo el explorador". Ninguna
 * cifra de aquí se calcula al entrar: el número de países es NUM_PAISES y las
 * ofertas activas, el recuento de lib/datos-reales.ts (con su fecha). Sin
 * consultas a la base: esta pantalla no pesa nada en el servidor.
 */
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search, MapPin, Building2, Wallet, Users, Baby, Sparkles, Globe2, GraduationCap, ArrowRight,
  FileText, Mail, Mic, Bookmark, Compass, Star, Wrench, ChevronRight, BarChart3, Briefcase,
  type LucideIcon,
} from "lucide-react";
import { useSugerencias } from "@/components/Sugerencias";
import { ciudadesDe, puestosDe } from "@/lib/sugerencias";
import { dondeEstoy } from "@/lib/origen/donde-estoy";
import { NUM_PAISES } from "@/lib/paises";
import { DATOS } from "@/lib/datos-reales";
import { CabeceraPantalla, TituloSeccion, IconoCirculo, GuzziBrillo, Etiqueta, type Tono } from "@/components/neon/Neon";

// Los accesos, con los nombres y frases de NavTrabajo y del menú.
const PUERTAS: { tono: Tono; Icono: LucideIcon; titulo: string; texto: string; href: string }[] = [
  { tono: "azul", Icono: MapPin, titulo: "Negocios de tu zona", texto: "Bares, talleres y tiendas cerca de ti", href: "/app/empresas?seccion=zona" },
  { tono: "morado", Icono: Building2, titulo: "Buscar una empresa", texto: "Por su nombre, aunque sea el bar de al lado", href: "/app/empresas?seccion=buscar" },
  { tono: "verde", Icono: Wallet, titulo: "Salarios", texto: "Comparador de salarios", href: "/app/salarios" },
  { tono: "ambar", Icono: Users, titulo: "ETTs y agencias", texto: "Las que colocan gente en tu provincia", href: "/app/empresas?seccion=ett" },
  { tono: "cian", Icono: Baby, titulo: "Au Pair y Nanny", texto: "Perfil y ofertas Au Pair y Live-in Nanny", href: "/app/au-pair" },
];

const HERRAMIENTAS: { tono: Tono; Icono: LucideIcon | null; titulo: string; texto: string; href: string }[] = [
  { tono: "lima", Icono: null, titulo: "Guzzi", texto: "Tu asistente de empleo con IA", href: "/app/gusi" },
  { tono: "ambar", Icono: FileText, titulo: "Mi CV", texto: "Mejora tu CV con IA", href: "/app/curriculum" },
  { tono: "morado", Icono: Mail, titulo: "Enviar mi CV", texto: "Con carta escrita por IA para cada una", href: "/app/empresas?seccion=envio" },
  { tono: "azul", Icono: Mic, titulo: "Entrevistas", texto: "Simulador de entrevistas", href: "/app/entrevistas" },
  { tono: "verde", Icono: Bookmark, titulo: "Guardados", texto: "Ofertas guardadas", href: "/app/guardados" },
];

/** Globo de puntos (decorativo): una esfera vista de frente con su anillo. */
function GloboDePuntos() {
  const puntos = useMemo(() => {
    const p: { x: number; y: number; r: number; o: number; tierra: boolean }[] = [];
    const giro = 0.6, inclinacion = 0.35;
    for (let lat = -80; lat <= 80; lat += 5) {
      for (let lon = -180; lon < 180; lon += 5) {
        const la = (lat * Math.PI) / 180, lo = (lon * Math.PI) / 180 + giro;
        // Esfera girada un poco hacia nosotros, vista de frente.
        const x0 = Math.cos(la) * Math.sin(lo), y0 = Math.sin(la), z0 = Math.cos(la) * Math.cos(lo);
        const y = y0 * Math.cos(inclinacion) - z0 * Math.sin(inclinacion);
        const z = y0 * Math.sin(inclinacion) + z0 * Math.cos(inclinacion);
        if (z <= 0.02) continue;
        // "Tierra" y "mar" sin mapa: manchas suaves para que se lea como un
        // planeta y no como una bola uniforme. Es decoración, no geografía.
        const tierra = Math.sin(lat * 0.08 + 1.1) + Math.cos(lon * 0.045 - 0.5) + 0.8 * Math.sin((lat - lon) * 0.035) > 0.45;
        p.push({ x: 100 + 80 * x0, y: 100 - 80 * y, r: (tierra ? 0.75 : 0.45) + (tierra ? 1.05 : 0.35) * z, o: (tierra ? 0.35 : 0.08) + (tierra ? 0.65 : 0.2) * z, tierra });
      }
    }
    return p;
  }, []);
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full" aria-hidden="true">
      <defs>
        <radialGradient id="globo-brillo" cx="38%" cy="32%" r="70%">
          <stop offset="0" stopColor="#c084fc" stopOpacity="0.45" />
          <stop offset="0.6" stopColor="#7c3aed" stopOpacity="0.16" />
          <stop offset="1" stopColor="#4c1d95" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="100" r="86" fill="url(#globo-brillo)" />
      <circle cx="100" cy="100" r="81" fill="none" stroke="#c084fc" strokeOpacity="0.4" strokeWidth="0.8" />
      {puntos.map((d, i) => <circle key={i} cx={d.x.toFixed(1)} cy={d.y.toFixed(1)} r={d.r.toFixed(2)} fill={d.tierra ? "#f3e8ff" : "#c4b5fd"} opacity={d.o.toFixed(2)} />)}
      <ellipse cx="100" cy="114" rx="99" ry="22" fill="none" stroke="#d8b4fe" strokeOpacity="0.6" strokeWidth="1.2" transform="rotate(-14 100 114)" />
    </svg>
  );
}

/** Barras que suben (decorativo), para los cursos. */
function BarrasQueSuben() {
  return (
    <div className="flex items-end gap-2 h-full" aria-hidden="true">
      {[32, 46, 58, 74, 96].map((h, i) => (
        <span key={i} className="w-5 sm:w-6 rounded-t-md" style={{
          height: `${h}%`,
          background: "linear-gradient(180deg, rgba(153,246,228,0.95), rgba(45,212,191,0.35))",
          boxShadow: "0 0 18px -2px rgba(45,212,191,0.6), inset 0 1px 0 rgba(255,255,255,0.5)",
        }} />
      ))}
    </div>
  );
}

/** Dos cristales con un maletín (decorativo), para las ofertas según el CV. */
function CristalesConMaletin() {
  return (
    <div className="relative w-full h-full" aria-hidden="true">
      <span className="absolute right-10 top-4 w-24 h-28 rounded-2xl" style={{ transform: "rotate(-12deg)", background: "linear-gradient(150deg, rgba(217,249,157,0.25), rgba(163,230,53,0.05))", border: "1px solid rgba(217,249,157,0.35)" }} />
      <span className="absolute right-2 top-8 w-28 h-32 rounded-2xl flex items-center justify-center" style={{ transform: "rotate(8deg)", background: "linear-gradient(150deg, rgba(190,242,100,0.35), rgba(34,197,94,0.08))", border: "1px solid rgba(217,249,157,0.55)", boxShadow: "0 0 40px -6px rgba(163,230,53,0.7)" }}>
        <Briefcase size={44} strokeWidth={1.6} style={{ color: "#ecfccb" }} />
      </span>
    </div>
  );
}

/** Los tres cristales de la cabecera (decorativo). */
function CristalesCabecera() {
  const panel = (tono: string, Icono: LucideIcon, giro: string, extra: string) => (
    <span className={`absolute w-36 h-40 rounded-[28px] flex items-center justify-center ${extra}`}
      style={{ transform: giro, background: `linear-gradient(150deg, rgba(${tono},0.35), rgba(${tono},0.06))`, border: `1px solid rgba(${tono},0.55)`, boxShadow: `0 0 50px -10px rgba(${tono},0.8)` }}>
      <Icono size={56} strokeWidth={1.4} style={{ color: "#f5f3ff", opacity: 0.9 }} />
    </span>
  );
  return (
    <div className="relative w-[420px] h-[220px]" aria-hidden="true">
      {panel("163,230,53", BarChart3, "rotate(-14deg)", "left-0 top-10")}
      {panel("168,85,247", Globe2, "rotate(-4deg)", "left-[120px] top-0")}
      {panel("132,204,22", Briefcase, "rotate(10deg)", "left-[250px] top-14")}
    </div>
  );
}

export default function ExplorarPage() {
  const router = useRouter();
  const [keyword, setKeyword] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [pais, setPais] = useState("ES");
  const [residencia, setResidencia] = useState<string | null>(null);

  // El país de las sugerencias, como en el buscador: el que eligió, si no
  // donde está, si no España.
  useEffect(() => {
    const aqui = dondeEstoy();
    setResidencia(aqui);
    setPais(localStorage.getItem("bc_pais") || aqui || "ES");
  }, []);

  const opcionesCiudad = useMemo(() => ciudadesDe(pais || residencia), [pais, residencia]);
  const opcionesPuesto = useMemo(() => puestosDe(pais, residencia), [pais, residencia]);
  const sugPuesto = useSugerencias({ id: "sugerencias-explorar-puesto", valor: keyword, opciones: opcionesPuesto, onElegir: setKeyword });
  const sugCiudad = useSugerencias({ id: "sugerencias-explorar-ciudad", valor: ubicacion, opciones: opcionesCiudad, onElegir: setUbicacion });

  function buscar(e: FormEvent) {
    e.preventDefault();
    const p = new URLSearchParams();
    if (keyword.trim()) p.set("keyword", keyword.trim());
    if (ubicacion.trim()) p.set("location", ubicacion.trim());
    router.push(`/app/buscar${p.toString() ? `?${p}` : ""}`);
  }

  return (
    <div className="ui-neon min-h-screen pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-10 space-y-8 sm:space-y-10">

        {/* ── Cabecera y buscador ── */}
        <div className="relative">
          <div className="hidden xl:block absolute right-0 -top-4"><CristalesCabecera /></div>
          <div className="xl:pr-[440px]">
          <CabeceraPantalla
            Icono={Compass}
            titulo="Buscar trabajo y"
            resaltado="enviar tu CV"
            subtitulo="Las ofertas publicadas y, además, las empresas de tu zona a las que escribir aunque no hayan publicado nada."
          />
          </div>
          <form onSubmit={buscar} className="relative mt-6 xl:max-w-[760px] cristal tono-lima p-2 sm:rounded-full flex flex-col sm:flex-row gap-2"
            role="search" aria-label="Buscar ofertas">
            <div className="relative flex-1 min-w-0">
              <label className="sr-only" htmlFor="explorar-puesto">Palabra clave</label>
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10" style={{ color: "#a7b3c6" }} aria-hidden="true" />
              <input id="explorar-puesto" type="search" value={keyword} onChange={(e) => setKeyword(e.target.value)}
                {...sugPuesto.propsCampo}
                placeholder="¿Qué trabajo buscas?"
                className="input-con-icono w-full min-h-[48px]"
                style={{ borderRadius: 9999, background: "rgba(6,9,11,0.6)", borderColor: "transparent" }} />
              {sugPuesto.lista}
            </div>
            <div className="relative sm:w-60">
              <label className="sr-only" htmlFor="explorar-ciudad">Ubicación</label>
              <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10" style={{ color: "#a7b3c6" }} aria-hidden="true" />
              <input id="explorar-ciudad" type="search" value={ubicacion} onChange={(e) => setUbicacion(e.target.value)}
                {...sugCiudad.propsCampo}
                placeholder="¿Dónde? (o déjalo vacío)"
                className="input-con-icono w-full min-h-[48px]"
                style={{ borderRadius: 9999, background: "rgba(6,9,11,0.6)", borderColor: "transparent" }} />
              {sugCiudad.lista}
            </div>
            <button type="submit" className="boton-neon">
              Buscar <ArrowRight size={18} aria-hidden="true" />
            </button>
          </form>
          <p className="relative mt-3 text-[13px]" style={{ color: "var(--texto-tenue)" }}>
            {DATOS.ofertasActivasTexto} de ofertas activas en {NUM_PAISES} países.
          </p>
        </div>

        {/* ── Las puertas ── */}
        <nav aria-label="Dónde buscar" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {PUERTAS.map((p) => (
            <Link key={p.href} href={p.href} className={`cristal cristal-enlace tono-${p.tono} flex items-center gap-3 p-4 min-h-[88px]`}>
              <IconoCirculo Icono={p.Icono} tono={p.tono} size={48} />
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-bold leading-tight" style={{ color: "#f8fafc" }}>{p.titulo}</span>
                <span className="block text-[12.5px] mt-1 leading-snug" style={{ color: "#a7b3c6" }}>{p.texto}</span>
              </span>
              <ChevronRight size={18} className="shrink-0 opacity-60" aria-hidden="true" />
            </Link>
          ))}
        </nav>

        {/* ── Destacados ── */}
        <section aria-labelledby="titulo-destacados">
          <TituloSeccion id="titulo-destacados" Icono={Star} titulo="Destacados para ti" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Ofertas según tu CV */}
            <div className="cristal tono-lima relative overflow-hidden p-5 sm:p-6 min-h-[220px] flex flex-col"
              style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), 0 0 0 1px rgba(163,230,53,0.2), 0 24px 60px -30px rgba(163,230,53,0.8)" }}>
              <div className="absolute right-0 top-0 w-48 h-44 opacity-90"><CristalesConMaletin /></div>
              <div className="relative max-w-[60%] sm:max-w-[65%]">
                <Etiqueta tono="lima"><Sparkles size={12} aria-hidden="true" /> Para ti</Etiqueta>
                <h3 className="mt-3 text-[22px] font-extrabold leading-tight" style={{ color: "#f8fafc" }}>
                  Ofertas según <span className="texto-neon">tu CV</span>
                </h3>
                <p className="mt-2 text-[14px] leading-snug" style={{ color: "#cbd5e1" }}>De lo que has trabajado, primero las de tu zona.</p>
              </div>
              <Link href="/app/buscar" className="boton-neon relative mt-auto self-start">Ver ofertas <ArrowRight size={17} aria-hidden="true" /></Link>
            </div>

            {/* Emigrar: el globo morado del boceto */}
            <div className="cristal tono-morado relative overflow-hidden p-5 sm:p-6 min-h-[220px] flex flex-col"
              style={{ background: "linear-gradient(150deg, rgba(168,85,247,0.28), rgba(76,29,149,0.18) 45%, rgba(12,15,22,0.9))", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), 0 24px 60px -30px rgba(168,85,247,0.9)" }}>
              <div className="absolute -right-8 -bottom-8 w-52 h-52 sm:w-56 sm:h-56"><GloboDePuntos /></div>
              <div className="relative max-w-[58%]">
                <Etiqueta tono="morado"><Globe2 size={12} aria-hidden="true" /> {NUM_PAISES} países</Etiqueta>
                <h3 className="mt-3 text-[22px] font-extrabold leading-tight" style={{ color: "#f8fafc" }}>
                  Emigrar al <span style={{ color: "#d8b4fe", textShadow: "0 0 22px rgba(192,132,252,0.55)" }}>extranjero</span>
                </h3>
                <p className="mt-2 text-[14px] leading-snug" style={{ color: "#ddd6fe" }}>Visados, alojamiento, programas au pair y más. Guía completa por país.</p>
              </div>
              <Link href="/app/emigrar" className="boton-cristal tono-morado relative mt-auto self-start" style={{ background: "rgba(76,29,149,0.45)" }}>
                Ver la guía <ArrowRight size={17} aria-hidden="true" />
              </Link>
            </div>

            {/* Cursos y carnets */}
            <div className="cristal tono-cian relative overflow-hidden p-5 sm:p-6 min-h-[220px] flex flex-col">
              <div className="absolute right-5 bottom-0 h-36"><BarrasQueSuben /></div>
              <div className="relative max-w-[62%]">
                <Etiqueta tono="cian"><GraduationCap size={12} aria-hidden="true" /> Formación</Etiqueta>
                <h3 className="mt-3 text-[22px] font-extrabold leading-tight" style={{ color: "#f8fafc" }}>
                  Cursos y <span style={{ color: "#99f6e4", textShadow: "0 0 22px rgba(45,212,191,0.55)" }}>carnets</span>
                </h3>
                <p className="mt-2 text-[14px] leading-snug" style={{ color: "#ccfbf1" }}>Cuánto cuestan y dónde sacarlos gratis.</p>
              </div>
              <Link href="/app/formacion" className="boton-cristal tono-cian relative mt-auto self-start">Ver cursos <ArrowRight size={17} aria-hidden="true" /></Link>
            </div>
          </div>
        </section>

        {/* ── Herramientas ── */}
        <section aria-labelledby="titulo-herramientas">
          <TituloSeccion id="titulo-herramientas" Icono={Wrench} titulo="Herramientas" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {HERRAMIENTAS.map((h) => (
              <Link key={h.href} href={h.href}
                className={`cristal cristal-enlace tono-${h.tono} flex items-center gap-3 p-4 min-h-[84px]`}
                style={h.Icono ? undefined : { boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), 0 0 0 1px rgba(163,230,53,0.25), 0 18px 40px -22px rgba(163,230,53,0.8)" }}>
                {h.Icono ? <IconoCirculo Icono={h.Icono} tono={h.tono} size={44} /> : <GuzziBrillo size={44} decorativo />}
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-bold" style={{ color: "#f8fafc" }}>{h.titulo}</span>
                  <span className="block text-[12.5px] leading-snug mt-0.5" style={{ color: "#a7b3c6" }}>{h.texto}</span>
                </span>
                <ChevronRight size={18} className="shrink-0 opacity-60" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
