"use client";

/**
 * /empresas/candidatos — Los candidatos que una empresa verificada puede ver.
 *
 * 23 nov 2026 (Michel): con el diseño de la app y sin bloques de texto. Cada
 * candidato es una tarjeta con su inicial, su puntuación grande y un botón; la
 * búsqueda va en una sola tarjeta. Ver components/empresas/AreaContratacion.tsx.
 */
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { BadgeCheck, Briefcase, Building2, Lock, Mail, MapPin, MessagesSquare, Phone, Search, Unlock, Users } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { LIMITES_EMPRESA } from "@/lib/plan-limits";
import { CifraGrande, Etiqueta } from "@/components/neon/Neon";
import { AvatarPersona, AvisoContratacion, MarcoContratacion } from "@/components/empresas/AreaContratacion";

interface Candidato {
  id: string;
  nombre: string;
  ciudad: string;
  puesto: string;
  aptitudes: string[];
  /** Solo de los que la empresa ya ha abierto (lib/empresas/cuenta.ts). */
  email: string | null;
  telefono: string | null;
  abierto?: boolean;
  /** Cartas de recomendación confirmadas por quien las firmó. */
  referencias: number;
  /** Puntuación por hechos comprobables (lib/empresas/reglas.ts); solo para empresas verificadas. */
  puntuacion: number | null;
  nivel: string | null;
  updatedAt: string;
}

interface Cupo { usados: number; maximo: number }
interface Alcance { tipo: "empresa" | "ett" | "agencia"; sectores: string[]; razonSocial: string }

const NOMBRE_SECTOR: Record<string, string> = {
  hosteleria: "Hostelería", almacen: "Almacén y logística", limpieza: "Limpieza", construccion: "Obra y oficios",
  transporte: "Transporte y reparto", cuidados: "Cuidado de personas", comercio: "Comercio", salud: "Salud",
  tecnologia: "Tecnología", otro: "Otros sectores",
};

const SECTORES = [
  "Hostelería", "Construcción", "Logística", "Comercio", "Tecnología",
  "Sanidad", "Limpieza", "Administración", "Industria", "Educación",
];

export default function CandidatosPage() {
  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [cargando, setCargando] = useState(true);
  const [esEmpresa, setEsEmpresa] = useState(false);
  const [cupo, setCupo] = useState<Cupo | null>(null);
  const [alcance, setAlcance] = useState<Alcance | null>(null);
  // Sin sesión la API responde 401: no es que no haya candidatos, es que hay que entrar.
  const [necesitaEntrar, setNecesitaEntrar] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [ciudad, setCiudad] = useState("");
  const [keyword, setKeyword] = useState("");
  const [pagina, setPagina] = useState(1);
  const [busquedaActiva, setBusquedaActiva] = useState({ ciudad: "", keyword: "" });
  // Lo de las entrevistas, para las cifras de arriba y el aviso de la pestaña.
  const [entrevistas, setEntrevistas] = useState<{ invitados: number; porValorar: number } | null>(null);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await getSupabaseBrowser().auth.getSession();
      if (!session) return;
      setUserId(session.user.id);
      const r = await fetch("/api/empresas/entrevistas", { headers: { Authorization: `Bearer ${session.access_token}` } }).catch(() => null);
      if (!r?.ok) return;
      const j = await r.json().catch(() => ({})) as { invitaciones?: { respuestas: unknown; nota: number | null }[] };
      const inv = j.invitaciones || [];
      setEntrevistas({ invitados: inv.length, porValorar: inv.filter((i) => i.respuestas && i.nota === null).length });
    }
    init();
  }, []);

  const cargar = useCallback(async (p = 1) => {
    setCargando(true);
    try {
      const params = new URLSearchParams({ page: String(p) });
      if (busquedaActiva.ciudad) params.set("ciudad", busquedaActiva.ciudad);
      if (busquedaActiva.keyword) params.set("q", busquedaActiva.keyword);
      if (userId) params.set("userId", userId);
      const res = await fetch(`/api/empresas/candidatos?${params}`);
      setNecesitaEntrar(res.status === 401);
      const data = await res.json() as { candidatos: Candidato[]; esEmpresa: boolean; cupo?: { candidatos: Cupo } | null; alcance?: Alcance | null };
      setCandidatos(data.candidatos || []);
      setEsEmpresa(data.esEmpresa || false);
      setCupo(data.cupo?.candidatos ?? null);
      setAlcance(data.alcance ?? null);
      setPagina(p);
    } catch { /* silencioso */ }
    finally { setCargando(false); }
  }, [busquedaActiva, userId]);

  useEffect(() => { cargar(1); }, [cargar]);

  function buscar() {
    setBusquedaActiva({ ciudad, keyword });
  }

  if (!cargando && necesitaEntrar) {
    return <AvisoContratacion titulo="Entra para ver candidatos" texto="Con la cuenta de tu empresa."
      enlace="/auth/login?redirect=%2Fempresas%2Fcandidatos" boton="Entrar" secundario={{ href: "/empresas/alta", texto: "Dar de alta mi empresa" }} />;
  }

  const lleno = !!cupo && cupo.usados >= cupo.maximo;

  return (
    <MarcoContratacion seccion="candidatos" titulo="Candidatos" Icono={Users} empresa={alcance?.razonSocial} porValorar={entrevistas?.porValorar ?? 0}>

      {/* Las cifras de la empresa: lo abierto este mes y lo que espera en Entrevistas. */}
      {esEmpresa && cupo && (
        <section className="grid grid-cols-2 gap-3" aria-label="Este mes">
          <CifraGrande tono={lleno ? "ambar" : "cian"} Icono={Unlock} valor={`${cupo.usados}/${cupo.maximo}`} etiqueta="Abiertos este mes" href="/empresas/equipo" />
          <CifraGrande tono={entrevistas?.porValorar ? "ambar" : "morado"} Icono={MessagesSquare}
            valor={entrevistas?.porValorar ? entrevistas.porValorar : entrevistas?.invitados ?? 0}
            etiqueta={entrevistas?.porValorar ? "Respuestas por valorar" : "Invitados a entrevista"} href="/empresas/entrevistas" />
        </section>
      )}

      {/* Quien no es empresa verificada ve perfiles sin nombre. */}
      {!esEmpresa && !cargando && (
        <div className="cristal tono-cian p-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <span className="icono-circulo" style={{ width: 48, height: 48 }} aria-hidden="true"><Lock size={22} /></span>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-bold" style={{ color: "#f1f5f9" }}>Perfiles sin nombre</p>
            <p className="text-[13px]" style={{ color: "#a7b3c6" }}>Las empresas verificadas ven nombre, contacto y CV. Gratis.</p>
          </div>
          <Link href="/empresas/alta" className="boton-neon shrink-0"><Building2 size={18} aria-hidden="true" /> Dar de alta mi empresa</Link>
        </div>
      )}

      {/* La búsqueda, en una sola tarjeta. */}
      <section className="cristal tono-cian p-4 sm:p-5 space-y-3" aria-label="Buscar candidatos">
        <div className="grid sm:grid-cols-[1fr_1.4fr_auto] gap-2.5">
          <label className="relative block">
            <span className="sr-only">Ciudad</span>
            <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#99f6e4" }} aria-hidden="true" />
            <input type="search" value={ciudad} onChange={(e) => setCiudad(e.target.value)} onKeyDown={(e) => e.key === "Enter" && buscar()}
              placeholder="Ciudad" className="input-con-icono w-full" />
          </label>
          <label className="relative block">
            <span className="sr-only">Perfil</span>
            <Briefcase size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#99f6e4" }} aria-hidden="true" />
            <input type="search" value={keyword} onChange={(e) => setKeyword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && buscar()}
              placeholder="Perfil: camarero, carretillero…" className="input-con-icono w-full" />
          </label>
          <button type="button" onClick={buscar} className="boton-neon"><Search size={18} aria-hidden="true" /> Buscar</button>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" style={{ scrollbarWidth: "none" }}>
          {SECTORES.map((s) => {
            const activo = busquedaActiva.keyword === s;
            return (
              <button key={s} type="button" aria-pressed={activo}
                onClick={() => { setKeyword(activo ? "" : s); setBusquedaActiva((prev) => ({ ...prev, keyword: activo ? "" : s })); }}
                className="shrink-0 text-[13px] font-semibold px-3.5 min-h-[36px] rounded-full transition-colors"
                style={activo
                  ? { background: "rgba(45,212,191,0.18)", color: "#99f6e4", border: "1px solid rgba(45,212,191,0.55)" }
                  : { background: "rgba(255,255,255,0.03)", color: "#a7b3c6", border: "1px solid rgba(148,163,184,0.2)" }}>
                {s}
              </button>
            );
          })}
        </div>
        {esEmpresa && alcance && (
          <div className="flex flex-wrap items-center gap-1.5">
            {alcance.tipo === "empresa"
              ? alcance.sectores.map((s) => <Etiqueta key={s} tono="cian">{NOMBRE_SECTOR[s] || s}</Etiqueta>)
              : <Etiqueta tono="cian">{alcance.tipo === "ett" ? "ETT" : "Agencia de colocación"}: todos los sectores</Etiqueta>}
            <span className="text-[12px] ml-1" style={{ color: "var(--texto-tenue)" }}>Primero, los de más puntuación</span>
          </div>
        )}
      </section>

      {/* Los candidatos */}
      {cargando ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="cristal p-5 animate-pulse space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full" style={{ background: "rgba(148,163,184,0.15)" }} />
                <div className="flex-1 space-y-2">
                  <div className="h-3 rounded" style={{ background: "rgba(148,163,184,0.15)", width: "60%" }} />
                  <div className="h-2.5 rounded" style={{ background: "rgba(148,163,184,0.1)", width: "40%" }} />
                </div>
              </div>
              <div className="h-9 rounded-full" style={{ background: "rgba(148,163,184,0.08)" }} />
            </div>
          ))}
        </div>
      ) : candidatos.length === 0 ? (
        <div className="cristal p-8 text-center flex flex-col items-center gap-2">
          <span className="icono-circulo tono-neutro" style={{ width: 52, height: 52 }} aria-hidden="true"><Search size={24} /></span>
          <p className="text-[15px] font-bold" style={{ color: "#f1f5f9" }}>Sin resultados</p>
          <p className="text-[13px]" style={{ color: "#a7b3c6" }}>Prueba con otra ciudad o perfil.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {candidatos.map((c) => (
            <article key={c.id} className="cristal tono-neutro p-4 sm:p-5 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <AvatarPersona id={c.id} nombre={c.nombre} />
                <div className="flex-1 min-w-0">
                  <h2 className="text-[16px] font-bold leading-tight truncate" style={{ color: "#f8fafc" }}>{c.nombre}</h2>
                  {c.ciudad && <p className="flex items-center gap-1 text-[12.5px] mt-0.5 truncate" style={{ color: "#a7b3c6" }}><MapPin size={12} aria-hidden="true" />{c.ciudad}</p>}
                </div>
                {c.puntuacion !== null && (
                  <div className="text-right shrink-0" title="Por hechos comprobables: cartas de recomendación confirmadas, CV completo y al día. Sin IA.">
                    <p className="text-[26px] font-extrabold leading-none tabular-nums" style={{ color: "#99f6e4" }}>{c.puntuacion}</p>
                    <p className="text-[10.5px] mt-0.5" style={{ color: "var(--texto-tenue)" }}>de 100</p>
                  </div>
                )}
              </div>

              {c.puesto && <p className="text-[13.5px] font-semibold line-clamp-2" style={{ color: "#dbe3ee" }}>{c.puesto}</p>}

              <div className="flex flex-wrap gap-1.5">
                {c.nivel && <Etiqueta tono="cian">{c.nivel}</Etiqueta>}
                {c.referencias > 0 && (
                  <Etiqueta tono="verde"><BadgeCheck size={12} aria-hidden="true" />{c.referencias > 1 ? `${c.referencias} referencias verificadas` : "Referencia verificada"}</Etiqueta>
                )}
                {c.aptitudes.slice(0, 3).map((a, i) => <Etiqueta key={i} tono="neutro">{a}</Etiqueta>)}
              </div>

              {/* Enlaces <a> y no <Link>: Next precarga los <Link>, y abrir un
                  CV gasta cupo del mes. Así solo cuenta el que se abre. */}
              <div className="mt-auto pt-1 space-y-2">
                {esEmpresa && c.abierto ? (
                  <>
                    {(c.email || c.telefono) && (
                      <div className="grid grid-cols-2 gap-2">
                        {c.email && <a href={`mailto:${c.email}`} className="boton-cristal tono-cian text-[13px] px-3"><Mail size={15} aria-hidden="true" />Escribir</a>}
                        {c.telefono && <a href={`tel:${c.telefono}`} className="boton-cristal tono-cian text-[13px] px-3"><Phone size={15} aria-hidden="true" />Llamar</a>}
                      </div>
                    )}
                    <a href={`/talento/${c.id}`} className="boton-neon w-full">Ver CV · Invitar</a>
                  </>
                ) : esEmpresa ? (
                  lleno ? (
                    <p className="text-[12.5px] text-center py-2" style={{ color: "#fcd34d" }}>Cupo del mes completo. Se renueva el día 1.</p>
                  ) : (
                    <>
                      <a href={`/talento/${c.id}`} className="boton-cristal tono-cian w-full"><Unlock size={16} aria-hidden="true" />Abrir CV y contacto</a>
                      <p className="text-[11.5px] text-center" style={{ color: "var(--texto-tenue)" }}>Usa 1 de los {cupo?.maximo ?? LIMITES_EMPRESA.candidatosMes} del mes</p>
                    </>
                  )
                ) : (
                  <Link href="/empresas/alta" className="boton-cristal tono-cian w-full"><Lock size={15} aria-hidden="true" />Ver contacto</Link>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Paginación */}
      {!cargando && (pagina > 1 || candidatos.length === 24) && (
        <div className="flex justify-center gap-3">
          {pagina > 1 && <button type="button" onClick={() => cargar(pagina - 1)} className="boton-cristal tono-neutro">← Anterior</button>}
          {candidatos.length === 24 && <button type="button" onClick={() => cargar(pagina + 1)} className="boton-cristal tono-neutro">Siguiente →</button>}
        </div>
      )}
    </MarcoContratacion>
  );
}
