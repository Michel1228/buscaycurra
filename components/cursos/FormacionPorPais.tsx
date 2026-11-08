"use client";

/**
 * components/cursos/FormacionPorPais.tsx — "¿Te vas a trabajar a otro país?"
 *
 * Hasta el 8 oct 2026 la página de cursos solo enseñaba el servicio de empleo
 * de España: los de los otros países estaban escritos pero no salían en ningún
 * sitio (y el de Reino Unido, con el código mal puesto, ni eso). Aquí se elige
 * el país y sale su servicio oficial de formación y, si lo tenemos, lo que te
 * piden allí en lugar de los cursos de aquí.
 *
 * Los datos llegan ya preparados desde el servidor (ListaCursos): nada de
 * consultas, la lista es fija.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, Globe } from "lucide-react";

export interface PaisFormacion {
  codigo: string;
  nombre: string;
  bandera: string;
  servicio?: { nombre: string; url: string; queHacer: string };
  equivalencias: { cursoSlug: string; curso: string; nombre: string; nota: string }[];
  /** Curso oficial de idioma para recién llegados (lib/cursos/idioma-inmigrantes.ts). */
  idioma?: {
    nombre: string; idioma: string; gratis: "si" | "no" | "depende"; siEresDeLaUE: string;
    siNoEresDeLaUE?: string; coste?: string; comoApuntarse: string; url: string;
    fuentes: { titulo: string; url: string }[];
  };
}

const ETIQUETA_GRATIS: Record<"si" | "no" | "depende", { texto: string; color: string }> = {
  si: { texto: "Gratis", color: "#22c55e" },
  no: { texto: "De pago o no para todos", color: "#f59e0b" },
  depende: { texto: "Depende de tu caso", color: "#3b82f6" },
};

const CLAVE = "bc_cursos_pais_destino";

export default function FormacionPorPais({ paises, base }: { paises: PaisFormacion[]; base: string }) {
  const [codigo, setCodigo] = useState("");

  useEffect(() => {
    try { setCodigo(localStorage.getItem(CLAVE) ?? ""); } catch { /* sin almacenamiento */ }
  }, []);

  function elegir(c: string) {
    setCodigo(c);
    try { if (c) localStorage.setItem(CLAVE, c); else localStorage.removeItem(CLAVE); } catch { /* sin almacenamiento */ }
  }

  const pais = paises.find(p => p.codigo === codigo);

  return (
    <section className="mb-10">
      <div className="flex items-start gap-2.5 mb-1">
        <Globe size={17} strokeWidth={1.9} className="shrink-0 mt-0.5" style={{ color: "#3b82f6" }} />
        <div>
          <h2 className="text-base font-bold" style={{ color: "#f1f5f9" }}>¿Te vas a trabajar a otro país?</h2>
          <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "#94a3b8" }}>
            Elige el país y te decimos su curso oficial de idioma para quien llega, dónde está su formación
            oficial y qué te piden allí en lugar de los cursos de aquí.
          </p>
        </div>
      </div>

      <select
        value={codigo}
        onChange={e => elegir(e.target.value)}
        aria-label="País al que te vas"
        className="mt-4 mb-4 rounded-lg py-2 px-3 text-sm outline-none w-full sm:w-auto"
        style={{ background: "#151821", border: "1px solid rgba(148,163,184,0.18)", color: "#f1f5f9" }}
      >
        <option value="">Elige un país…</option>
        {paises.map(p => (
          <option key={p.codigo} value={p.codigo}>{p.bandera} {p.nombre}</option>
        ))}
      </select>

      {pais && (
        <div className="flex flex-col gap-3">
          {pais.servicio ? (
            <a href={pais.servicio.url} target="_blank" rel="noopener noreferrer"
               className="card-game p-4 flex flex-col gap-1.5" style={{ textDecoration: "none" }}>
              <div className="flex items-start justify-between gap-2">
                <span className="font-semibold text-sm" style={{ color: "#22c55e" }}>
                  {pais.bandera} {pais.servicio.nombre}
                </span>
                <ExternalLink size={13} strokeWidth={1.8} className="shrink-0 mt-0.5" style={{ color: "#8b98ad" }} />
              </div>
              <p className="text-xs leading-relaxed" style={{ color: "#94a3b8" }}>{pais.servicio.queHacer}</p>
            </a>
          ) : (
            <p className="text-xs" style={{ color: "#94a3b8" }}>
              Todavía no tenemos el servicio oficial de {pais.nombre}. Pregúntale a Guzzi y te orienta.
            </p>
          )}

          {pais.idioma && (
            <div className="rounded-xl p-4" style={{ background: "rgba(12,15,22,0.86)", border: "1px solid rgba(148,163,184,0.18)" }}>
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <p className="text-sm font-semibold" style={{ color: "#f1f5f9" }}>
                  Curso oficial de {pais.idioma.idioma}: {pais.idioma.nombre}
                </p>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                      style={{ background: `${ETIQUETA_GRATIS[pais.idioma.gratis].color}1f`, color: ETIQUETA_GRATIS[pais.idioma.gratis].color }}>
                  {ETIQUETA_GRATIS[pais.idioma.gratis].texto}
                </span>
              </div>
              <p className="text-xs leading-relaxed mb-2" style={{ color: "#94a3b8" }}>
                <strong style={{ color: "#f1f5f9" }}>Si eres de la UE: </strong>{pais.idioma.siEresDeLaUE}
              </p>
              {pais.idioma.siNoEresDeLaUE && (
                <p className="text-xs leading-relaxed mb-2" style={{ color: "#94a3b8" }}>
                  <strong style={{ color: "#f1f5f9" }}>Si no eres de la UE: </strong>{pais.idioma.siNoEresDeLaUE}
                </p>
              )}
              {pais.idioma.coste && (
                <p className="text-xs mb-2" style={{ color: "#94a3b8" }}>
                  <strong style={{ color: "#f1f5f9" }}>Cuánto cuesta: </strong>{pais.idioma.coste}
                </p>
              )}
              <p className="text-xs mb-3" style={{ color: "#94a3b8" }}>
                <strong style={{ color: "#f1f5f9" }}>Cómo apuntarte: </strong>{pais.idioma.comoApuntarse}
              </p>
              <a href={pais.idioma.url} target="_blank" rel="noopener noreferrer"
                 className="inline-flex items-center gap-1.5 text-xs font-semibold hover:underline" style={{ color: "#22c55e" }}>
                Página oficial <ExternalLink size={11} strokeWidth={2} />
              </a>
              <p className="text-[10px] mt-2" style={{ color: "#4b5563" }}>
                Fuente: {pais.idioma.fuentes.map(f => f.titulo).join(" · ")}. Comprobado en octubre de 2026.
              </p>
            </div>
          )}

          {pais.equivalencias.length > 0 && (
            <div className="rounded-xl p-4" style={{ background: "rgba(12,15,22,0.86)", border: "1px solid rgba(148,163,184,0.18)" }}>
              <p className="text-[11px] uppercase tracking-wide font-semibold mb-2.5" style={{ color: "#8b98ad" }}>
                Lo que te piden allí
              </p>
              <ul className="flex flex-col gap-2.5">
                {pais.equivalencias.map(eq => (
                  <li key={eq.cursoSlug} className="text-xs leading-relaxed" style={{ color: "#94a3b8" }}>
                    <Link href={`${base}/${eq.cursoSlug}`} className="font-semibold hover:underline" style={{ color: "#f1f5f9" }}>
                      {eq.curso}
                    </Link>
                    {" → "}
                    <span style={{ color: "#3b82f6", fontWeight: 600 }}>{eq.nombre}</span>
                    <br />
                    {eq.nota}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
