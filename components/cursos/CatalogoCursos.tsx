"use client";

/**
 * components/cursos/CatalogoCursos.tsx — El catálogo, con buscador y filtro de coste.
 *
 * POR QUÉ HAY UN BUSCADOR Y NO SOLO LA LISTA ORDENADA. Ordenado por sectores
 * está bien para quien no sabe lo que quiere, pero quien llega buscando
 * "carretillero" o "excel" no viene a explorar: viene a por una cosa concreta y
 * cada scroll de más es una oportunidad de irse. La lupa atiende a ese, y la
 * lista de abajo sigue estando para el que va mirando.
 *
 * POR QUÉ EL FILTRO ES EL COSTE Y NO OTRA COSA. Porque es la primera pregunta
 * de todo el mundo, antes incluso de qué enseña el curso. Y sobre todo porque
 * "gratis" y "subvencionado" NO son lo mismo, aunque en las listas de por ahí
 * se mezclen: gratis es gratis siempre; subvencionado es gratis SI sale
 * convocatoria en tu zona, y si no sale te cuesta hasta 1.800 euros. Meter los
 * dos en el mismo saco es lo que hace que la gente se lleve el disgusto en la
 * matrícula, así que aquí van separados y con las dos cifras a la vista.
 *
 * Busca a la vez en los CURSOS (fichas nuestras, verificadas una a una) y en las
 * PLATAFORMAS (sitios con cientos de cursos ya montados). Son cosas distintas y
 * se muestran separadas a propósito: la ficha te dice cuánto cuesta y si es
 * obligatoria; la plataforma es una puerta a un catálogo que no controlamos.
 *
 * Es componente de cliente porque el filtro tiene que responder según se teclea.
 * Los datos llegan ya calculados desde el servidor: el catálogo es estático, así
 * que no hay ninguna consulta detrás — importante, con el VPS como está.
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, Clock, ExternalLink, Search, X } from "lucide-react";
import {
  NOMBRE_SECTOR, duracionResumida, financiacionDe, costeDetallado,
  NOMBRE_FINANCIACION, EXPLICA_FINANCIACION, COLOR_FINANCIACION,
  type TipoCurso, type SectorCurso, type Financiacion,
} from "@/lib/cursos/tipos";
import type { PlataformaFormacion, ServicioEmpleo } from "@/lib/cursos/plataformas";

interface Props {
  obligatorios: TipoCurso[];
  porSector: { sector: SectorCurso; cursos: TipoCurso[] }[];
  plataformas: PlataformaFormacion[];
  servicio?: ServicioEmpleo;
  /** Base de los enlaces: "/cursos" (pública) o "/app/formacion" (dentro). */
  base: string;
}

type Filtro = "todos" | Financiacion;

/** Quita tildes y baja a minúsculas, para que "ingles" encuentre "inglés". */
function normalizar(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/** El coste, con las dos cifras cuando hay dos. */
function Coste({ t }: { t: TipoCurso }) {
  const { etiqueta, detalle } = costeDetallado(t);
  const color = COLOR_FINANCIACION[financiacionDe(t)];
  return (
    <span className="flex items-baseline gap-1.5 min-w-0">
      <span className="font-semibold whitespace-nowrap" style={{ color }}>{etiqueta}</span>
      {detalle && <span className="truncate" style={{ color: "#64748b" }}>{detalle}</span>}
    </span>
  );
}

function TarjetaCurso({ t, base }: { t: TipoCurso; base: string }) {
  return (
    <Link href={`${base}/${t.slug}`} className="card-game p-4 flex flex-col gap-2" style={{ textDecoration: "none" }}>
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-sm leading-snug" style={{ color: "#f1f5f9" }}>{t.nombre}</h3>
        {t.obligatorioLegal && (
          <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: "rgba(245,158,11,0.12)", color: "#f59e0b" }}>
            Obligatorio
          </span>
        )}
      </div>
      <p className="text-xs leading-relaxed" style={{ color: "#94a3b8" }}>{t.resumen}</p>
      <div className="flex items-center justify-between gap-3 mt-auto pt-1 text-[11px]">
        <Coste t={t} />
        <span className="flex items-center gap-1 shrink-0" style={{ color: "#64748b" }}>
          <Clock size={11} strokeWidth={1.8} />
          {duracionResumida(t)}
        </span>
      </div>
    </Link>
  );
}

function TarjetaPlataforma({ p }: { p: PlataformaFormacion }) {
  return (
    <a href={p.url} target="_blank" rel="noopener noreferrer"
       className="card-game p-4 flex flex-col gap-2" style={{ textDecoration: "none" }}>
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-sm leading-snug" style={{ color: "#f1f5f9" }}>{p.nombre}</h3>
        <ExternalLink size={13} strokeWidth={1.8} className="shrink-0 mt-0.5" style={{ color: "#64748b" }} />
      </div>
      <p className="text-xs leading-relaxed" style={{ color: "#94a3b8" }}>{p.resumen}</p>
      {p.volumen && <p className="text-[11px] font-medium" style={{ color: "#22c55e" }}>{p.volumen}</p>}
      {p.aviso && <p className="text-[11px] leading-relaxed" style={{ color: "#64748b" }}>{p.aviso}</p>}
    </a>
  );
}

export default function CatalogoCursos({ obligatorios, porSector, plataformas, servicio, base }: Props) {
  const [q, setQ] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");

  const consulta = normalizar(q.trim());
  const buscando = consulta.length >= 2;

  // Todo el texto de cada curso en una sola cadena, para no repetir el filtro.
  const indexados = useMemo(() => {
    const todos = [...obligatorios, ...porSector.flatMap(s => s.cursos)];
    return todos.map(t => ({
      t,
      texto: normalizar([
        t.nombre, t.resumen, t.queEs, t.paraQueSirve,
        NOMBRE_SECTOR[t.sector], t.normativa ?? "", ...t.puestos,
      ].join(" ")),
    }));
  }, [obligatorios, porSector]);

  const plataformasIndexadas = useMemo(
    () => plataformas.map(p => ({
      p,
      texto: normalizar([p.nombre, p.resumen, ...p.temas, ...p.idiomas].join(" ")),
    })),
    [plataformas]
  );

  // Cuántos hay de cada tipo de coste. Va en la pastilla: un filtro que no dice
  // cuántos resultados tiene obliga a probarlo para descubrir que está vacío.
  const cuentas = useMemo(() => {
    const c: Record<Filtro, number> = { todos: indexados.length, gratis: 0, subvencionado: 0, pago: 0 };
    for (const { t } of indexados) c[financiacionDe(t)]++;
    return c;
  }, [indexados]);

  const pasaFiltro = (t: TipoCurso) => filtro === "todos" || financiacionDe(t) === filtro;

  const cursosEncontrados = buscando
    ? indexados.filter(c => c.texto.includes(consulta) && pasaFiltro(c.t)).map(c => c.t)
    : [];
  const plataformasEncontradas = buscando
    ? plataformasIndexadas.filter(p => p.texto.includes(consulta)).map(p => p.p)
    : [];
  const nadaEncontrado = buscando && cursosEncontrados.length === 0 && plataformasEncontradas.length === 0;

  const obligatoriosVisibles = obligatorios.filter(pasaFiltro);
  const sectoresVisibles = porSector
    .map(s => ({ sector: s.sector, cursos: s.cursos.filter(pasaFiltro) }))
    .filter(s => s.cursos.length > 0);

  const FILTROS: Filtro[] = ["todos", "gratis", "subvencionado", "pago"];

  return (
    <>
      {/* ── La lupa ── */}
      <div className="mb-4">
        <div className="relative">
          <Search size={16} strokeWidth={1.9}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: "#64748b" }} />
          <input
            type="search"
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Busca tu curso: carretillero, inglés, excel, limpieza…"
            aria-label="Buscar curso"
            className="w-full rounded-xl py-3 pl-10 pr-10 text-sm outline-none"
            style={{ background: "#1e212b", border: "1px solid #2d3142", color: "#f1f5f9" }}
          />
          {q && (
            <button onClick={() => setQ("")} aria-label="Borrar búsqueda"
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full"
                    style={{ color: "#64748b" }}>
              <X size={14} strokeWidth={2} />
            </button>
          )}
        </div>
      </div>

      {/* ── Filtro por coste ── */}
      <div className="mb-2 flex flex-wrap gap-2" role="group" aria-label="Filtrar por coste">
        {FILTROS.map(f => {
          const activo = filtro === f;
          const color = f === "todos" ? "#94a3b8" : COLOR_FINANCIACION[f];
          const etiqueta = f === "todos" ? "Todos" : NOMBRE_FINANCIACION[f];
          return (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              aria-pressed={activo}
              className="text-xs font-medium px-3 py-1.5 rounded-full transition-colors"
              style={{
                background: activo ? `${color}1f` : "#1e212b",
                border: `1px solid ${activo ? color : "#2d3142"}`,
                color: activo ? color : "#94a3b8",
              }}
            >
              {etiqueta}
              <span className="ml-1.5" style={{ color: activo ? color : "#64748b" }}>{cuentas[f]}</span>
            </button>
          );
        })}
      </div>

      {/* La diferencia entre gratis y subvencionado dicha con todas las letras:
          es justo lo que la gente no sabe y donde se lleva el disgusto. */}
      <p className="text-[11px] mb-8 leading-relaxed" style={{ color: "#64748b" }}>
        {filtro === "todos"
          ? "Gratis es gratis siempre. Subvencionado es gratis si sale convocatoria en tu zona; si no, lo pagas tú."
          : EXPLICA_FINANCIACION[filtro]}
      </p>

      {/* ── Resultados de búsqueda ── */}
      {buscando && (
        <section className="mb-10">
          {cursosEncontrados.length > 0 && (
            <>
              <h2 className="text-[11px] font-semibold uppercase tracking-wide mb-3" style={{ color: "#64748b" }}>
                {cursosEncontrados.length}{" "}
                {cursosEncontrados.length === 1 ? "curso nuestro" : "cursos nuestros"}
              </h2>
              <div className="grid sm:grid-cols-2 gap-3 mb-7">
                {cursosEncontrados.map(t => <TarjetaCurso key={t.slug} t={t} base={base} />)}
              </div>
            </>
          )}

          {plataformasEncontradas.length > 0 && (
            <>
              <h2 className="text-[11px] font-semibold uppercase tracking-wide mb-3" style={{ color: "#64748b" }}>
                Sitios donde buscarlo
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {plataformasEncontradas.map(p => <TarjetaPlataforma key={p.id} p={p} />)}
              </div>
            </>
          )}

          {nadaEncontrado && (
            <div className="rounded-xl p-5 text-center" style={{ background: "#1e212b", border: "1px solid #2d3142" }}>
              <p className="text-sm font-semibold mb-1" style={{ color: "#f1f5f9" }}>
                No tenemos ficha de eso todavía
              </p>
              <p className="text-xs leading-relaxed mb-4" style={{ color: "#94a3b8" }}>
                Vamos ampliando el catálogo poco a poco y no queremos publicar nada sin comprobarlo antes.
                Pero Guzzi conoce el resto: dile qué curso buscas y en qué país estás.
              </p>
              <Link href="/app/gusi" className="btn-game text-xs" style={{ textDecoration: "none" }}>
                Preguntar a Guzzi
              </Link>
            </div>
          )}
        </section>
      )}

      {/* ── Catálogo completo (se oculta mientras se busca) ── */}
      {!buscando && (
        <>
          {obligatoriosVisibles.length > 0 && (
            <section className="mb-12">
              <div className="flex items-start gap-2.5 mb-1">
                <AlertCircle size={17} strokeWidth={1.9} className="shrink-0 mt-0.5" style={{ color: "#f59e0b" }} />
                <div>
                  <h2 className="text-base font-bold" style={{ color: "#f1f5f9" }}>Sin esto no te contratan</h2>
                  <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>
                    Los pide la ley o el convenio. Es lo primero que te van a preguntar.
                  </p>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3 mt-4">
                {obligatoriosVisibles.map(t => <TarjetaCurso key={t.slug} t={t} base={base} />)}
              </div>
            </section>
          )}

          {sectoresVisibles.length > 0 && (
            <section className="mb-12">
              <h2 className="text-base font-bold mb-1" style={{ color: "#f1f5f9" }}>
                Para que te cojan a ti y no a otro
              </h2>
              <p className="text-xs mb-5" style={{ color: "#94a3b8" }}>
                No son obligatorios, pero marcan la diferencia cuando hay varios candidatos.
              </p>
              {sectoresVisibles.map(({ sector, cursos: delSector }) => (
                <div key={sector} className="mb-7">
                  <h3 className="text-[11px] font-semibold uppercase tracking-wide mb-3" style={{ color: "#64748b" }}>
                    {NOMBRE_SECTOR[sector]}
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {delSector.map(t => <TarjetaCurso key={t.slug} t={t} base={base} />)}
                  </div>
                </div>
              ))}
            </section>
          )}

          {obligatoriosVisibles.length === 0 && sectoresVisibles.length === 0 && (
            <div className="rounded-xl p-5 mb-10 text-center" style={{ background: "#1e212b", border: "1px solid #2d3142" }}>
              <p className="text-sm" style={{ color: "#94a3b8" }}>
                Todavía no tenemos ninguna ficha de ese tipo. Prueba con otro filtro o mira las plataformas de abajo.
              </p>
            </div>
          )}

          {/* ── Miles de cursos que no son nuestros pero son gratis ── */}
          <section className="mb-10">
            <h2 className="text-base font-bold mb-1" style={{ color: "#f1f5f9" }}>
              Miles de cursos gratis, en cualquier país
            </h2>
            <p className="text-xs mb-5 leading-relaxed" style={{ color: "#94a3b8" }}>
              Estos no los damos nosotros: son plataformas abiertas que hemos comprobado una a una.
              Sirven estés donde estés, porque son online.
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              {plataformas.map(p => <TarjetaPlataforma key={p.id} p={p} />)}
            </div>
          </section>

          {servicio && (
            <section className="mb-10">
              <h2 className="text-base font-bold mb-1" style={{ color: "#f1f5f9" }}>
                Lo subvencionado de tu país
              </h2>
              <p className="text-xs mb-4 leading-relaxed" style={{ color: "#94a3b8" }}>
                Los cursos presenciales y gratuitos los da el servicio público de empleo, y cambian según
                la zona y el mes. Esta es la puerta oficial:
              </p>
              <a href={servicio.url} target="_blank" rel="noopener noreferrer"
                 className="card-game p-4 flex flex-col gap-1.5" style={{ textDecoration: "none" }}>
                <div className="flex items-start justify-between gap-2">
                  <span className="font-semibold text-sm" style={{ color: "#22c55e" }}>{servicio.nombre}</span>
                  <ExternalLink size={13} strokeWidth={1.8} className="shrink-0 mt-0.5" style={{ color: "#64748b" }} />
                </div>
                <p className="text-xs leading-relaxed" style={{ color: "#94a3b8" }}>{servicio.queHacer}</p>
              </a>
            </section>
          )}
        </>
      )}
    </>
  );
}
