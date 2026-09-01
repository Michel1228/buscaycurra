/**
 * components/cv/PorPais.tsx — El mismo CV no vale para todos los países.
 *
 * ORDEN. Primero la foto, porque es la decisión que más gente se juega sin
 * saberlo y la que ya han tomado al llegar aquí: nuestro editor pone foto por
 * defecto. Después el resto de convenciones, y al final lo del filtro
 * automático, que vale para todos los países y tumba más CV que ninguna otra
 * cosa.
 */
import Link from "next/link";
import { AlertTriangle, ArrowLeft, ArrowRight, Camera, FileText, Globe } from "lucide-react";
import {
  ESTILOS, PARA_TODOS, ETIQUETA_FOTO, COLOR_FOTO, ENLACE_EUROPASS, ACTUALIZADO,
  paisesSinFoto,
} from "@/lib/cv/por-pais";

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mb-9">
      <h2 className="text-base font-bold mb-3" style={{ color: "#f1f5f9" }}>{titulo}</h2>
      {children}
    </section>
  );
}

export default function CVPorPais({ base }: { base: string }) {
  const sinFoto = paisesSinFoto();

  return (
    <>
      <Link href={base} className="inline-flex items-center gap-1.5 text-xs mb-6 hover:opacity-80"
            style={{ color: "#64748b", textDecoration: "none" }}>
        <ArrowLeft size={13} strokeWidth={1.9} />
        Volver a Mi CV
      </Link>

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Globe size={20} strokeWidth={1.8} style={{ color: "#22c55e" }} />
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: "rgba(34,197,94,0.12)", color: "#22c55e" }}>
            15 países
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold mb-3 leading-tight">
          El mismo CV no vale para todos los países
        </h1>
        <p className="text-sm sm:text-base leading-relaxed" style={{ color: "#94a3b8" }}>
          Un currículum español lleva foto. En Alemania eso está bien y no ponerla se nota. En el
          Reino Unido puede ser justo lo que hace que no lo lean. El mismo documento que te ayuda en
          Múnich te tumba en Londres.
        </p>
      </div>

      {/* ── La foto, que es lo que más se juega ── */}
      <div className="rounded-xl p-4 mb-8"
           style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.22)" }}>
        <div className="flex items-center gap-2 mb-2">
          <Camera size={16} strokeWidth={1.9} style={{ color: "#f59e0b" }} />
          <span className="text-sm font-semibold" style={{ color: "#f1f5f9" }}>
            Quita la foto si mandas el CV a estos países
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {sinFoto.map(e => (
            <span key={e.codigo} className="text-[11px] px-2.5 py-1 rounded-full"
                  style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)", color: "#f59e0b" }}>
              {e.bandera} {e.pais}
            </span>
          ))}
        </div>
        <p className="text-xs leading-relaxed" style={{ color: "#94a3b8" }}>
          Allí muchas empresas descartan los currículums con foto para no exponerse a una
          reclamación por discriminación. No es una ley que te obligue a quitarla: es una costumbre
          muy extendida, y por eso conviene hacerle caso.
        </p>
      </div>

      {/* ── País por país ── */}
      <Seccion titulo="País por país">
        <div className="flex flex-col gap-3">
          {ESTILOS.map(e => (
            <div key={e.codigo} className="rounded-xl p-4" style={{ background: "#1e212b", border: "1px solid #2d3142" }}>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-base leading-none">{e.bandera}</span>
                <span className="text-sm font-semibold" style={{ color: "#f1f5f9" }}>{e.pais}</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: `${COLOR_FOTO[e.foto]}1f`, color: COLOR_FOTO[e.foto] }}>
                  {ETIQUETA_FOTO[e.foto]}
                </span>
                <span className="text-[11px]" style={{ color: "#64748b" }}>·</span>
                <span className="text-[11px]" style={{ color: "#64748b" }}>{e.paginas}</span>
              </div>

              <p className="text-xs leading-relaxed mb-2" style={{ color: "#94a3b8" }}>{e.nota}</p>

              {e.nombreLocal && (
                <p className="text-[11px] mb-2" style={{ color: "#64748b" }}>
                  Allí se llama <span style={{ color: "#94a3b8" }}>{e.nombreLocal}</span>
                </p>
              )}

              {e.noPongas.length > 0 && (
                <div className="mb-2">
                  <p className="text-[10px] uppercase tracking-wide font-semibold mb-1" style={{ color: "#f59e0b" }}>
                    No pongas
                  </p>
                  <ul className="flex flex-col gap-0.5">
                    {e.noPongas.map(n => (
                      <li key={n} className="text-[11px] leading-relaxed pl-3 relative" style={{ color: "#94a3b8" }}>
                        <span className="absolute left-0" style={{ color: "#f59e0b" }}>·</span>{n}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {e.siPonen && e.siPonen.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-wide font-semibold mb-1" style={{ color: "#22c55e" }}>
                    Sí se espera
                  </p>
                  <ul className="flex flex-col gap-0.5">
                    {e.siPonen.map(n => (
                      <li key={n} className="text-[11px] leading-relaxed pl-3 relative" style={{ color: "#94a3b8" }}>
                        <span className="absolute left-0" style={{ color: "#22c55e" }}>·</span>{n}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </Seccion>

      {/* ── El filtro automático ── */}
      <Seccion titulo="Y esto vale para todos los países">
        <div className="rounded-xl p-4" style={{ background: "#1e212b", border: "1px solid #2d3142" }}>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={15} strokeWidth={1.9} style={{ color: "#f59e0b" }} />
            <span className="text-sm font-semibold" style={{ color: "#f1f5f9" }}>
              Antes de que lo lea una persona, lo lee un programa
            </span>
          </div>
          <ul className="flex flex-col gap-2">
            {PARA_TODOS.map(t => (
              <li key={t} className="flex gap-2.5 items-start">
                <FileText size={12} strokeWidth={1.9} className="shrink-0 mt-1" style={{ color: "#64748b" }} />
                <span className="text-xs leading-relaxed" style={{ color: "#94a3b8" }}>{t}</span>
              </li>
            ))}
          </ul>
        </div>
      </Seccion>

      <Seccion titulo="El formato europeo, por si te lo piden">
        <a href={ENLACE_EUROPASS.url} target="_blank" rel="noopener noreferrer"
           className="rounded-xl p-4 flex items-center justify-between gap-3 hover:opacity-90"
           style={{ background: "#1e212b", border: "1px solid #2d3142", textDecoration: "none" }}>
          <span className="text-sm" style={{ color: "#f1f5f9" }}>{ENLACE_EUROPASS.titulo}</span>
          <ArrowRight size={14} strokeWidth={1.9} className="shrink-0" style={{ color: "#22c55e" }} />
        </a>
      </Seccion>

      <div className="rounded-xl p-5 mb-8 flex flex-col sm:flex-row sm:items-center gap-3"
           style={{ background: "#1e212b", border: "1px solid #2d3142" }}>
        <Globe size={20} strokeWidth={1.8} className="shrink-0" style={{ color: "#22c55e" }} />
        <div className="flex-1">
          <p className="text-sm font-semibold mb-0.5" style={{ color: "#f1f5f9" }}>
            ¿A qué país lo mandas?
          </p>
          <p className="text-xs" style={{ color: "#94a3b8" }}>
            Dile a Guzzi a dónde envías el CV y te dice qué cambiar antes.
          </p>
        </div>
        <Link href="/app/gusi" className="btn-game text-xs shrink-0 text-center" style={{ textDecoration: "none" }}>
          Hablar con Guzzi
        </Link>
      </div>

      <div className="pt-6" style={{ borderTop: "1px solid #2d3142" }}>
        <div className="flex items-center gap-1.5 mb-2.5">
          <Globe size={12} strokeWidth={1.9} style={{ color: "#64748b" }} />
          <span className="text-[10px] uppercase tracking-wide font-semibold" style={{ color: "#64748b" }}>
            Sobre esta información
          </span>
        </div>
        <p className="text-[11px] leading-relaxed" style={{ color: "#4b5563" }}>
          Revisado en {ACTUALIZADO}. Son <span style={{ color: "#94a3b8" }}>costumbres de cada país</span>,
          no obligaciones legales: ninguna ley te prohíbe poner una foto en el Reino Unido, lo que hay
          es una práctica muy extendida de descartar los CV que la llevan. Si la oferta dice algo
          distinto, manda lo que pida la oferta.
        </p>
      </div>
    </>
  );
}
