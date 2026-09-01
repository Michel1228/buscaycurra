"use client";

/**
 * Mis cursos — lo que cada uno lleva hecho.
 *
 * EL EQUIVALENTE DE "GUARDADOS" Y EL PIPELINE, PERO PARA FORMACIÓN. Antes esto
 * no existía: preparabas la solicitud del carretillero un martes, cerrabas la
 * pestaña, y el jueves no había forma de recuperar la carta. Para las ofertas
 * de trabajo eso lleva resuelto desde siempre; para los cursos no había nada.
 *
 * Lo que se enseña de cada curso, en este orden y por este motivo:
 *   · Por dónde va       — para poder mirar la lista y ver qué tienes a medias.
 *   · Los papeles        — con casilla, porque el problema real no es el curso:
 *                          es llegar al último día de plazo sin el DARDE.
 *   · La carta guardada  — lo más caro de regenerar y lo que se lleva puesto a
 *                          la matrícula.
 *   · Sus notas          — el sitio para "llamé al centro, me dijeron que en
 *                          septiembre".
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Check, ChevronDown, ChevronUp, Copy, FileText, GraduationCap, Loader2, Trash2,
} from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { papelesDeCurso, type Papel } from "@/lib/cursos/papeles";
import { tipoPorSlug } from "@/lib/cursos/tipos";

interface Progreso {
  curso_slug: string;
  curso_nombre: string | null;
  estado: string;
  carta: string | null;
  documentos: string[] | null;
  documentos_hechos: string[] | null;
  notas: string | null;
  updated_at: string;
}

const ESTADOS: { id: string; etiqueta: string; color: string }[] = [
  { id: "guardado",  etiqueta: "Guardado",    color: "#64748b" },
  { id: "preparado", etiqueta: "Preparado",   color: "#3b82f6" },
  { id: "inscrito",  etiqueta: "Inscrito",    color: "#a855f7" },
  { id: "haciendo",  etiqueta: "Haciéndolo",  color: "#f59e0b" },
  { id: "terminado", etiqueta: "Terminado",   color: "#22c55e" },
];

function colorDe(estado: string) {
  return ESTADOS.find(e => e.id === estado)?.color ?? "#64748b";
}

export default function MisCursosContent() {
  const [cursos, setCursos] = useState<Progreso[] | null>(null);
  const [abierto, setAbierto] = useState<string | null>(null);
  const [copiado, setCopiado] = useState<string | null>(null);
  const [guardando, setGuardando] = useState<string | null>(null);

  async function cabecera(): Promise<HeadersInit> {
    const { data } = await getSupabaseBrowser().auth.getSession();
    const token = data.session?.access_token;
    return token
      ? { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
      : { "Content-Type": "application/json" };
  }

  async function cargar() {
    try {
      const res = await fetch("/api/cursos/progreso", { headers: await cabecera() });
      const j = await res.json();
      setCursos(j.cursos ?? []);
    } catch {
      setCursos([]);
    }
  }

  useEffect(() => { cargar(); }, []);

  async function actualizar(slug: string, cambios: Record<string, unknown>) {
    setGuardando(slug);
    // Optimista: la lista responde al momento y si falla se recarga del
    // servidor. Esperar a la red para pintar una casilla se nota mucho.
    setCursos(prev => prev?.map(c => {
      if (c.curso_slug !== slug) return c;
      const copia = { ...c };
      if (typeof cambios.estado === "string") copia.estado = cambios.estado;
      if (Array.isArray(cambios.documentosHechos)) copia.documentos_hechos = cambios.documentosHechos as string[];
      if (typeof cambios.notas === "string") copia.notas = cambios.notas;
      return copia;
    }) ?? null);

    try {
      const res = await fetch("/api/cursos/progreso", {
        method: "POST",
        headers: await cabecera(),
        body: JSON.stringify({ slug, ...cambios }),
      });
      if (!res.ok) await cargar();
    } catch {
      await cargar();
    } finally {
      setGuardando(null);
    }
  }

  async function quitar(slug: string) {
    setCursos(prev => prev?.filter(c => c.curso_slug !== slug) ?? null);
    try {
      await fetch(`/api/cursos/progreso?slug=${encodeURIComponent(slug)}`, {
        method: "DELETE",
        headers: await cabecera(),
      });
    } catch { await cargar(); }
  }

  async function copiar(slug: string, texto: string) {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(slug);
      setTimeout(() => setCopiado(null), 2000);
    } catch { /* algunos navegadores lo bloquean sin gesto directo */ }
  }

  if (cursos === null) {
    return (
      <div className="flex items-center gap-2 py-12 justify-center">
        <Loader2 size={18} className="animate-spin" style={{ color: "#64748b" }} />
        <span className="text-sm" style={{ color: "#64748b" }}>Cargando tus cursos…</span>
      </div>
    );
  }

  if (cursos.length === 0) {
    return (
      <div className="rounded-xl p-6 text-center" style={{ background: "#1e212b", border: "1px solid #2d3142" }}>
        <GraduationCap size={26} strokeWidth={1.6} className="mx-auto mb-3" style={{ color: "#64748b" }} />
        <p className="text-sm font-semibold mb-1" style={{ color: "#f1f5f9" }}>
          Todavía no tienes ningún curso guardado
        </p>
        <p className="text-xs leading-relaxed mb-4" style={{ color: "#94a3b8" }}>
          Cuando prepares la solicitud de un curso, la carta y la lista de papeles se te guardan aquí
          para que no tengas que volver a empezar.
        </p>
        <Link href="/app/formacion" className="btn-game text-xs" style={{ textDecoration: "none" }}>
          Ver los cursos
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {cursos.map(c => {
        const tipo = tipoPorSlug(c.curso_slug, "ES");
        const papeles: Papel[] = tipo
          ? papelesDeCurso({
              obligatorioLegal: tipo.obligatorioLegal,
              sector: tipo.sector,
              documentosExtra: tipo.documentosExtra,
            })
          : [];
        const hechos = new Set(c.documentos_hechos ?? []);
        const docs = c.documentos ?? [];
        const estaAbierto = abierto === c.curso_slug;

        return (
          <div key={c.curso_slug} className="card-game p-4">

            {/* ── Cabecera de la tarjeta ── */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="min-w-0">
                <Link href={`/app/formacion/${c.curso_slug}`}
                      className="text-sm font-semibold hover:opacity-80"
                      style={{ color: "#f1f5f9", textDecoration: "none" }}>
                  {c.curso_nombre || c.curso_slug}
                </Link>
                {docs.length > 0 && (
                  <p className="text-[11px] mt-0.5" style={{ color: "#64748b" }}>
                    {hechos.size} de {docs.length} papeles conseguidos
                  </p>
                )}
              </div>
              <button
                onClick={() => quitar(c.curso_slug)}
                aria-label={`Quitar ${c.curso_nombre || c.curso_slug} de mi lista`}
                className="shrink-0 p-1.5 rounded-lg"
                style={{ color: "#64748b" }}
              >
                <Trash2 size={14} strokeWidth={1.8} />
              </button>
            </div>

            {/* ── Por dónde va ── */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {ESTADOS.map(e => {
                const activo = c.estado === e.id;
                return (
                  <button
                    key={e.id}
                    onClick={() => actualizar(c.curso_slug, { estado: e.id })}
                    aria-pressed={activo}
                    className="text-[11px] font-medium px-2.5 py-1 rounded-full"
                    style={{
                      background: activo ? `${e.color}22` : "transparent",
                      border: `1px solid ${activo ? e.color : "#2d3142"}`,
                      color: activo ? e.color : "#64748b",
                    }}
                  >
                    {e.etiqueta}
                  </button>
                );
              })}
              {guardando === c.curso_slug && (
                <Loader2 size={13} className="animate-spin self-center" style={{ color: "#64748b" }} />
              )}
            </div>

            <button
              onClick={() => setAbierto(estaAbierto ? null : c.curso_slug)}
              className="w-full flex items-center justify-between gap-2 text-xs py-1.5"
              style={{ color: "#94a3b8" }}
            >
              <span>{estaAbierto ? "Ocultar" : "Ver papeles, carta y notas"}</span>
              {estaAbierto
                ? <ChevronUp size={14} strokeWidth={1.9} />
                : <ChevronDown size={14} strokeWidth={1.9} />}
            </button>

            {estaAbierto && (
              <div className="mt-3 pt-3 flex flex-col gap-5" style={{ borderTop: "1px solid #2d3142" }}>

                {/* ── Papeles, con casilla ── */}
                {docs.length > 0 && (
                  <div>
                    <p className="text-[11px] uppercase tracking-wide font-semibold mb-2" style={{ color: "#64748b" }}>
                      Lo que te van a pedir
                    </p>
                    <div className="flex flex-col gap-1.5">
                      {docs.map(d => {
                        const hecho = hechos.has(d);
                        return (
                          <button
                            key={d}
                            onClick={() => {
                              const nuevos = hecho
                                ? [...hechos].filter(x => x !== d)
                                : [...hechos, d];
                              actualizar(c.curso_slug, { documentosHechos: nuevos });
                            }}
                            className="flex gap-2.5 items-start text-left"
                          >
                            <span
                              aria-hidden
                              className="shrink-0 w-4 h-4 rounded flex items-center justify-center mt-0.5"
                              style={{
                                background: hecho ? "#22c55e" : "transparent",
                                border: `1px solid ${hecho ? "#22c55e" : "#2d3142"}`,
                              }}
                            >
                              {hecho && <Check size={11} strokeWidth={3} style={{ color: "#0f1117" }} />}
                            </span>
                            <span
                              className="text-xs leading-relaxed"
                              style={{
                                color: hecho ? "#64748b" : "#94a3b8",
                                textDecoration: hecho ? "line-through" : "none",
                              }}
                            >
                              {d}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── Dónde se sacan ── */}
                {papeles.length > 0 && (
                  <div>
                    <p className="text-[11px] uppercase tracking-wide font-semibold mb-2" style={{ color: "#64748b" }}>
                      Dónde se sacan
                    </p>
                    <div className="flex flex-col gap-2">
                      {papeles.map(p => (
                        <a key={p.id} href={p.url} target="_blank" rel="noopener noreferrer"
                           className="rounded-lg p-3 block"
                           style={{ background: "#161922", border: "1px solid #2d3142", textDecoration: "none" }}>
                          <div className="flex items-center justify-between gap-2 mb-0.5">
                            <span className="text-xs font-semibold" style={{ color: "#22c55e" }}>{p.nombre}</span>
                            {p.gratuito && (
                              <span className="text-[10px] shrink-0" style={{ color: "#64748b" }}>gratis</span>
                            )}
                          </div>
                          <p className="text-[11px] leading-relaxed" style={{ color: "#94a3b8" }}>{p.donde}</p>
                          {p.truco && (
                            <p className="text-[11px] leading-relaxed mt-1" style={{ color: "#f59e0b" }}>{p.truco}</p>
                          )}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── La carta ── */}
                {c.carta && (
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <p className="text-[11px] uppercase tracking-wide font-semibold" style={{ color: "#64748b" }}>
                        Tu carta de solicitud
                      </p>
                      <button
                        onClick={() => copiar(c.curso_slug, c.carta!)}
                        className="text-[11px] flex items-center gap-1 px-2 py-1 rounded-lg"
                        style={{ border: "1px solid #2d3142", color: copiado === c.curso_slug ? "#22c55e" : "#94a3b8" }}
                      >
                        {copiado === c.curso_slug
                          ? <><Check size={11} strokeWidth={2.5} /> Copiada</>
                          : <><Copy size={11} strokeWidth={1.9} /> Copiar</>}
                      </button>
                    </div>
                    <div className="rounded-lg p-3 text-xs leading-relaxed whitespace-pre-wrap"
                         style={{ background: "#161922", border: "1px solid #2d3142", color: "#94a3b8" }}>
                      {c.carta}
                    </div>
                  </div>
                )}

                {/* ── Sus notas ── */}
                <div>
                  <p className="text-[11px] uppercase tracking-wide font-semibold mb-2" style={{ color: "#64748b" }}>
                    Tus notas
                  </p>
                  <textarea
                    defaultValue={c.notas ?? ""}
                    onBlur={e => {
                      if (e.target.value !== (c.notas ?? "")) {
                        actualizar(c.curso_slug, { notas: e.target.value });
                      }
                    }}
                    placeholder="Llamé al centro, me dijeron que en septiembre…"
                    rows={3}
                    className="w-full rounded-lg p-3 text-xs outline-none resize-y"
                    style={{ background: "#161922", border: "1px solid #2d3142", color: "#f1f5f9" }}
                  />
                </div>

                {!c.carta && (
                  <Link href={`/app/formacion/${c.curso_slug}`}
                        className="btn-game text-xs text-center" style={{ textDecoration: "none" }}>
                    <FileText size={12} strokeWidth={1.9} className="inline mr-1.5" />
                    Prepararme la solicitud
                  </Link>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
