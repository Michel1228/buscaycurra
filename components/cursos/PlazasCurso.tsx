"use client";

/**
 * components/cursos/PlazasCurso.tsx — Plazas reales de cursos gratis, con fecha.
 *
 * Dos usos:
 *   · dentro de una ficha (ficha="carretillero", compacto): las 5 próximas y un
 *     enlace a verlas todas. Si no hay ninguna, no se pinta nada: la ficha ya
 *     explica dónde buscar, y un recuadro vacío solo resta.
 *   · página completa (/cursos/plazas): buscador por texto, provincia y modalidad.
 *
 * Los datos vienen de /api/cursos/plazas, que lee lo que publican los servicios
 * públicos de empleo. Se dice siempre de dónde sale cada plaza y qué
 * comunidades cubrimos: quien vive en Sevilla tiene que saber que no es que no
 * haya cursos, es que su comunidad no los publica como datos, y dónde mirar.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, Clock, ExternalLink, Mail, MapPin, Monitor, Phone, Search } from "lucide-react";

interface Plaza {
  id: string;
  titulo: string;
  provinciaNombre: string | null;
  municipio: string | null;
  centro: string | null;
  direccion: string | null;
  telefono: string | null;
  email: string | null;
  web: string | null;
  url: string;
  inicio: string;
  fin: string | null;
  horas: number | null;
  modalidad: string | null;
  dirigido: string | null;
  certificado: boolean | null;
  fuenteNombre: string;
  atribucion: string | null;
}

interface Respuesta {
  total: number;
  plazas: Plaza[];
  provincias: { provincia: string; nombre: string; n: number }[];
  cobertura: string[];
  porEmpezar: number;
}

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

function fechaCorta(iso: string | null): string {
  if (!iso) return "";
  const [a, m, d] = iso.split("-").map(Number);
  const esteAnio = new Date().getFullYear() === a;
  return `${d} ${MESES[m - 1]}${esteAnio ? "" : ` ${a}`}`;
}

const NOMBRE_MODALIDAD: Record<string, string> = {
  presencial: "Presencial", online: "Online", mixta: "Mixta",
};

const NOMBRE_DIRIGIDO: Record<string, string> = {
  desempleados: "Para personas en paro",
  ocupados: "Para personas con trabajo",
  todos: "En paro o con trabajo",
};

const CLAVE_PROVINCIA = "bc_plazas_provincia";

function leerProvincia(): string {
  try { return localStorage.getItem(CLAVE_PROVINCIA) ?? ""; } catch { return ""; }
}
function guardarProvincia(v: string) {
  try { if (v) localStorage.setItem(CLAVE_PROVINCIA, v); else localStorage.removeItem(CLAVE_PROVINCIA); } catch { /* sin almacenamiento */ }
}

function TarjetaPlaza({ p }: { p: Plaza }) {
  const lugar = p.modalidad === "online"
    ? "Online"
    : [p.municipio, p.provinciaNombre && p.provinciaNombre.toLowerCase() !== (p.municipio ?? "").toLowerCase() ? p.provinciaNombre : null]
        .filter(Boolean).join(", ");
  return (
    <article className="rounded-xl p-4 flex flex-col gap-2.5" style={{ background: "#1e212b", border: "1px solid #2d3142" }}>
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold leading-snug" style={{ color: "#f1f5f9" }}>{p.titulo}</h3>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
              style={{ background: "rgba(34,197,94,0.12)", color: "#22c55e" }}>
          Gratis
        </span>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs" style={{ color: "#94a3b8" }}>
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays size={12} strokeWidth={1.9} />
          Empieza el {fechaCorta(p.inicio)}{p.fin ? ` · acaba el ${fechaCorta(p.fin)}` : ""}
        </span>
        {p.horas && (
          <span className="inline-flex items-center gap-1.5">
            <Clock size={12} strokeWidth={1.9} /> {p.horas} h
          </span>
        )}
        {lugar && (
          <span className="inline-flex items-center gap-1.5">
            {p.modalidad === "online" ? <Monitor size={12} strokeWidth={1.9} /> : <MapPin size={12} strokeWidth={1.9} />}
            {lugar}
            {p.modalidad && p.modalidad !== "online" && p.modalidad !== "presencial" ? ` · ${NOMBRE_MODALIDAD[p.modalidad]}` : ""}
          </span>
        )}
      </div>

      {(p.dirigido || p.certificado) && (
        <div className="flex flex-wrap gap-1.5">
          {p.dirigido && NOMBRE_DIRIGIDO[p.dirigido] && (
            <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "#151821", border: "1px solid #2d3142", color: "#94a3b8" }}>
              {NOMBRE_DIRIGIDO[p.dirigido]}
            </span>
          )}
          {p.certificado && (
            <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(59,130,246,0.1)", color: "#60a5fa" }}>
              Certificado de profesionalidad
            </span>
          )}
        </div>
      )}

      {p.centro && (
        <p className="text-[11px] leading-relaxed" style={{ color: "#64748b" }}>
          {p.centro}{p.direccion && p.modalidad !== "online" ? ` · ${p.direccion}` : ""}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <a href={p.url} target="_blank" rel="noopener noreferrer"
           className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg hover:opacity-90"
           style={{ background: "#22c55e", color: "#0f1117", textDecoration: "none" }}>
          Apuntarse en {p.fuenteNombre} <ExternalLink size={11} strokeWidth={2.2} />
        </a>
        {p.telefono && (
          <a href={`tel:${p.telefono}`} className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg hover:opacity-90"
             style={{ background: "#151821", border: "1px solid #2d3142", color: "#94a3b8", textDecoration: "none" }}>
            <Phone size={11} strokeWidth={2} /> {p.telefono}
          </a>
        )}
        {p.email && (
          <a href={`mailto:${p.email}`} className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg hover:opacity-90"
             style={{ background: "#151821", border: "1px solid #2d3142", color: "#94a3b8", textDecoration: "none" }}>
            <Mail size={11} strokeWidth={2} /> Escribir al centro
          </a>
        )}
      </div>
    </article>
  );
}

function Cobertura({ cobertura }: { cobertura: string[] }) {
  if (cobertura.length === 0) return null;
  return (
    <p className="text-[11px] leading-relaxed" style={{ color: "#64748b" }}>
      De momento tenemos las plazas de {cobertura.join(", ").replace(/, ([^,]*)$/, " y $1")}: son las comunidades
      que publican sus cursos como datos abiertos. Si vives en otra, búscalos en el{" "}
      <a href="https://experienciafundae.es/buscador" target="_blank" rel="noopener noreferrer"
         className="underline" style={{ color: "#94a3b8" }}>buscador oficial de FUNDAE</a>{" "}
      o en tu servicio de empleo autonómico.
    </p>
  );
}

export default function PlazasCurso({ ficha, nombre, compacto = false, base = "/cursos" }: {
  ficha?: string;
  nombre?: string;
  compacto?: boolean;
  /** "/cursos" o "/app/formacion": a dónde lleva "ver todas". */
  base?: string;
}) {
  const [q, setQ] = useState("");
  const [qAplicada, setQAplicada] = useState("");
  const [provincia, setProvincia] = useState("");
  const [modalidad, setModalidad] = useState("");
  const [datos, setDatos] = useState<Respuesta | null>(null);
  const [plazas, setPlazas] = useState<Plaza[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => { setProvincia(leerProvincia()); }, []);

  // La URL de la página completa puede traer ?ficha= o ?q= (desde la ficha o desde Guzzi).
  useEffect(() => {
    if (compacto) return;
    try {
      const sp = new URLSearchParams(window.location.search);
      const texto = sp.get("q");
      if (texto) { setQ(texto); setQAplicada(texto); }
    } catch { /* sin URL */ }
  }, [compacto]);

  const limite = compacto ? 5 : 20;

  function url(desde: number) {
    const sp = new URLSearchParams();
    if (ficha) sp.set("ficha", ficha);
    if (provincia) sp.set("provincia", provincia);
    if (modalidad) sp.set("modalidad", modalidad);
    if (qAplicada.trim().length >= 2) sp.set("q", qAplicada.trim());
    sp.set("limite", String(limite));
    sp.set("desde", String(desde));
    return `/api/cursos/plazas?${sp}`;
  }

  useEffect(() => {
    let vivo = true;
    setCargando(true);
    setError(false);
    fetch(url(0))
      .then(r => r.json())
      .then((d: Respuesta) => { if (vivo) { setDatos(d); setPlazas(d.plazas ?? []); } })
      .catch(() => { if (vivo) setError(true); })
      .finally(() => { if (vivo) setCargando(false); });
    return () => { vivo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ficha, provincia, modalidad, qAplicada]);

  function masPlazas() {
    fetch(url(plazas.length))
      .then(r => r.json())
      .then((d: Respuesta) => setPlazas(prev => [...prev, ...(d.plazas ?? [])]))
      .catch(() => setError(true));
  }

  function cambiarProvincia(v: string) {
    setProvincia(v);
    guardarProvincia(v);
  }

  // En la ficha, si no hay ninguna plaza en ningún sitio, no se pinta nada.
  if (compacto && !cargando && (!datos || (datos.total === 0 && !provincia))) return null;

  const enlaceTodas = `${base}/plazas${ficha ? `?ficha=${encodeURIComponent(ficha)}` : ""}`;

  const selectorProvincia = datos && datos.provincias.length > 0 && (
    <select
      value={provincia}
      onChange={e => cambiarProvincia(e.target.value)}
      aria-label="Provincia"
      className="rounded-lg py-2 px-3 text-xs outline-none"
      style={{ background: "#151821", border: "1px solid #2d3142", color: "#f1f5f9" }}
    >
      <option value="">Todas las provincias</option>
      {datos.provincias.map(p => (
        <option key={p.provincia} value={p.provincia}>{p.nombre} ({p.n})</option>
      ))}
      {provincia && !datos.provincias.some(p => p.provincia === provincia) && (
        <option value={provincia}>Mi provincia (sin plazas ahora)</option>
      )}
    </select>
  );

  if (compacto) {
    return (
      <section className="mb-8">
        <div className="flex flex-wrap items-end justify-between gap-2 mb-3">
          <div>
            <h2 className="text-base font-bold" style={{ color: "#f1f5f9" }}>
              Plazas gratis con fecha{nombre ? ` de ${nombre}` : ""}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>
              Cursos que empiezan pronto, publicados por los servicios públicos de empleo.
            </p>
          </div>
          {selectorProvincia}
        </div>
        {cargando && <p className="text-xs" style={{ color: "#64748b" }}>Buscando plazas…</p>}
        {!cargando && plazas.length === 0 && (
          <p className="text-xs mb-3" style={{ color: "#94a3b8" }}>
            Ahora mismo no hay plazas de este curso en esa provincia. Prueba con todas las provincias.
          </p>
        )}
        <div className="flex flex-col gap-3 mb-3">
          {plazas.map(p => <TarjetaPlaza key={p.id} p={p} />)}
        </div>
        {datos && datos.total > plazas.length && (
          <Link href={enlaceTodas} className="text-xs font-semibold hover:underline" style={{ color: "#22c55e" }}>
            Ver las {datos.total} plazas →
          </Link>
        )}
        <div className="mt-3"><Cobertura cobertura={datos?.cobertura ?? []} /></div>
      </section>
    );
  }

  return (
    <>
      <form
        className="flex flex-col sm:flex-row gap-2 mb-3"
        onSubmit={e => { e.preventDefault(); setQAplicada(q); }}
      >
        <div className="relative flex-1">
          <Search size={15} strokeWidth={1.9} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#64748b" }} />
          <input
            type="search"
            value={q}
            onChange={e => setQ(e.target.value)}
            onBlur={() => setQAplicada(q)}
            placeholder="Soldadura, inglés, carretillas, cocina…"
            aria-label="Buscar plaza por nombre del curso"
            className="input-con-icono w-full rounded-lg py-2.5 pr-3 text-sm outline-none"
            style={{ background: "#1e212b", border: "1px solid #2d3142", color: "#f1f5f9" }}
          />
        </div>
        <button type="submit" className="btn-game text-xs px-4">Buscar</button>
      </form>

      <div className="flex flex-wrap gap-2 mb-4">
        {selectorProvincia}
        <select
          value={modalidad}
          onChange={e => setModalidad(e.target.value)}
          aria-label="Modalidad"
          className="rounded-lg py-2 px-3 text-xs outline-none"
          style={{ background: "#151821", border: "1px solid #2d3142", color: "#f1f5f9" }}
        >
          <option value="">Presencial y online</option>
          <option value="presencial">Solo presencial</option>
          <option value="online">Solo online</option>
          <option value="mixta">Mixta</option>
        </select>
      </div>

      <div className="mb-5"><Cobertura cobertura={datos?.cobertura ?? []} /></div>

      {error && (
        <p className="text-sm mb-4" style={{ color: "#ef4444" }}>
          No hemos podido cargar las plazas. Vuelve a intentarlo en un momento.
        </p>
      )}
      {cargando && <p className="text-sm" style={{ color: "#64748b" }}>Buscando plazas…</p>}
      {!cargando && datos && (
        <p className="text-[11px] font-semibold uppercase tracking-wide mb-3" style={{ color: "#64748b" }}>
          {datos.total === 1 ? "1 plaza" : `${datos.total.toLocaleString("es-ES")} plazas`} por empezar
        </p>
      )}
      {!cargando && datos?.total === 0 && (
        <div className="rounded-xl p-5 text-center mb-6" style={{ background: "#1e212b", border: "1px solid #2d3142" }}>
          <p className="text-sm font-semibold mb-1" style={{ color: "#f1f5f9" }}>No hay plazas con esos filtros</p>
          <p className="text-xs" style={{ color: "#94a3b8" }}>Quita algún filtro o prueba con otra palabra.</p>
        </div>
      )}

      <div className="flex flex-col gap-3 mb-6">
        {plazas.map(p => <TarjetaPlaza key={p.id} p={p} />)}
      </div>

      {datos && datos.total > plazas.length && (
        <div className="text-center mb-8">
          <button onClick={masPlazas} className="text-xs font-semibold px-4 py-2 rounded-lg"
                  style={{ background: "#1e212b", border: "1px solid #2d3142", color: "#f1f5f9" }}>
            Ver más plazas
          </button>
        </div>
      )}

      <p className="text-[11px] leading-relaxed pt-5" style={{ color: "#4b5563", borderTop: "1px solid #2d3142" }}>
        Datos abiertos de Lanbide (Servicio Vasco de Empleo), Servicio Regional de Empleo y Formación de la
        Región de Murcia, Servei Públic d&apos;Ocupació de Catalunya, Consorci per a la Formació Contínua de
        Catalunya y Servicio Navarro de Empleo. Se actualizan cada día. La inscripción, las fechas y los
        requisitos los fija cada servicio: confírmalos en su web antes de apuntarte.
      </p>
    </>
  );
}
