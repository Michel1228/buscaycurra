/**
 * components/cursos/DetalleCurso.tsx — La ficha de un curso, sin envoltorio.
 *
 * Igual que ListaCursos: la misma ficha se pinta en /cursos/[tipo] (pública, la
 * que indexa Google) y en /app/formacion/[tipo] (dentro de la app, con el menú).
 * `base` decide a dónde vuelve el enlace de "Todos los cursos" y nada más.
 *
 * Devuelve null si el slug no existe; quien la llama decide si eso es un 404.
 */
import Link from "next/link";
import { AlertCircle, ArrowLeft, Clock, Euro, Globe, RefreshCw, Sparkles } from "lucide-react";
import PrepararSolicitud from "@/components/PrepararSolicitud";
import { tipoPorSlug, NOMBRE_SECTOR, precioResumido, duracionResumida, type TipoCurso } from "@/lib/cursos/tipos";
import { PAISES } from "@/lib/paises";

function Dato({ icono, etiqueta, valor, destacado }: {
  icono: React.ReactNode; etiqueta: string; valor: string; destacado?: boolean;
}) {
  return (
    <div className="rounded-xl p-3" style={{ background: "#1e212b", border: "1px solid #2d3142" }}>
      <div className="flex items-center gap-1.5 mb-1" style={{ color: "#64748b" }}>
        {icono}
        <span className="text-[10px] uppercase tracking-wide font-semibold">{etiqueta}</span>
      </div>
      <p className="text-sm font-bold" style={{ color: destacado ? "#22c55e" : "#f1f5f9" }}>{valor}</p>
    </div>
  );
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-base font-bold mb-3" style={{ color: "#f1f5f9" }}>{titulo}</h2>
      {children}
    </section>
  );
}

/**
 * Schema.org Course. Sin `provider` a propósito: esta ficha describe el TIPO de
 * curso, no una convocatoria concreta de un centro. Inventarse un proveedor
 * para forzar el resultado enriquecido de Google sería declarar algo falso.
 */
export function jsonLdCurso(t: TipoCurso) {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: t.nombre,
    description: t.queEs,
    teaches: t.paraQueSirve,
    timeRequired: `PT${t.duracionHoras.max}H`,
    inLanguage: "es-ES",
    ...(t.obligatorioLegal && t.normativa
      ? { occupationalCredentialAwarded: `${t.nombre} (${t.normativa})` }
      : {}),
  };
}

export default function DetalleCurso({ slug, base }: { slug: string; base: string }) {
  const t = tipoPorSlug(slug, "ES");
  if (!t) return null;

  const gratis = t.precio.min === 0;

  return (
    <>
      <Link
        href={base}
        className="inline-flex items-center gap-1.5 text-xs mb-6 hover:opacity-80"
        style={{ color: "#64748b", textDecoration: "none" }}
      >
        <ArrowLeft size={13} strokeWidth={1.9} />
        Todos los cursos
      </Link>

      {/* ── Cabecera ── */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: "rgba(59,130,246,0.12)", color: "#3b82f6" }}
          >
            {NOMBRE_SECTOR[t.sector]}
          </span>
          {t.obligatorioLegal && (
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: "rgba(245,158,11,0.12)", color: "#f59e0b" }}
            >
              Obligatorio por ley
            </span>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold mb-3 leading-tight">{t.nombre}</h1>
        <p className="text-sm leading-relaxed" style={{ color: "#94a3b8" }}>{t.resumen}</p>
      </div>

      {/* ── Los tres datos que todo el mundo busca primero ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
        <Dato
          icono={<Euro size={12} strokeWidth={1.9} />}
          etiqueta="Cuánto cuesta"
          valor={precioResumido(t)}
          destacado={gratis}
        />
        <Dato
          icono={<Clock size={12} strokeWidth={1.9} />}
          etiqueta="Cuánto dura"
          valor={duracionResumida(t)}
        />
        {t.validezAnios && (
          <Dato
            icono={<RefreshCw size={12} strokeWidth={1.9} />}
            etiqueta="Se renueva"
            valor={`Cada ${t.validezAnios} años`}
          />
        )}
      </div>

      {t.precio.nota && (
        <p className="text-xs mb-8 -mt-4" style={{ color: "#64748b" }}>{t.precio.nota}</p>
      )}

      <Seccion titulo="Qué es">
        <p className="text-sm leading-relaxed" style={{ color: "#94a3b8" }}>{t.queEs}</p>
      </Seccion>

      <Seccion titulo="Para qué te sirve">
        <p className="text-sm leading-relaxed mb-4" style={{ color: "#94a3b8" }}>{t.paraQueSirve}</p>
        <p className="text-[11px] uppercase tracking-wide font-semibold mb-2" style={{ color: "#64748b" }}>
          Puestos que lo piden
        </p>
        <div className="flex flex-wrap gap-1.5">
          {t.puestos.map(p => (
            <Link
              key={p}
              href={`/app/buscar?keyword=${encodeURIComponent(p)}`}
              className="text-[11px] px-2.5 py-1 rounded-full hover:opacity-80"
              style={{ background: "#1e212b", border: "1px solid #2d3142", color: "#94a3b8", textDecoration: "none" }}
            >
              {p}
            </Link>
          ))}
        </div>
      </Seccion>

      {/* ── Dónde sacarlo gratis: es lo que más valor aporta ── */}
      {t.opcionesGratuitas.length > 0 && (
        <Seccion titulo="Dónde puedes hacerlo gratis">
          <div className="flex flex-col gap-3">
            {t.opcionesGratuitas.map(o => (
              <a
                key={o.nombre}
                href={o.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl p-4 block hover:opacity-90"
                style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)", textDecoration: "none" }}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-sm font-semibold" style={{ color: "#22c55e" }}>{o.nombre}</span>
                  {o.certificado && (
                    <span className="text-[10px] shrink-0" style={{ color: "#64748b" }}>con certificado</span>
                  )}
                </div>
                <p className="text-xs leading-relaxed" style={{ color: "#94a3b8" }}>{o.descripcion}</p>
              </a>
            ))}
          </div>
        </Seccion>
      )}

      <Seccion titulo="Cómo sacarlo, paso a paso">
        <ol className="flex flex-col gap-3">
          {t.comoSacarlo.map((paso, i) => (
            <li key={i} className="flex gap-3">
              <span
                className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5"
                style={{ background: "rgba(34,197,94,0.12)", color: "#22c55e" }}
              >
                {i + 1}
              </span>
              <span className="text-sm leading-relaxed" style={{ color: "#94a3b8" }}>{paso}</span>
            </li>
          ))}
        </ol>
      </Seccion>

      {t.notaValidez && (
        <div
          className="rounded-xl p-4 mb-8 flex gap-2.5"
          style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.18)" }}
        >
          <AlertCircle size={15} strokeWidth={1.9} className="shrink-0 mt-0.5" style={{ color: "#f59e0b" }} />
          <p className="text-xs leading-relaxed" style={{ color: "#94a3b8" }}>{t.notaValidez}</p>
        </div>
      )}

      {/* ── Equivalencias: esto no lo tiene nadie más en español ── */}
      {t.equivalenteEn && t.equivalenteEn.length > 0 && (
        <Seccion titulo="Si te vas a trabajar fuera">
          <p className="text-sm leading-relaxed mb-4" style={{ color: "#94a3b8" }}>
            El título español no siempre vale en otro país. Esto es lo que te van a pedir allí:
          </p>
          <div className="flex flex-col gap-2.5">
            {t.equivalenteEn.map(eq => {
              const pais = PAISES[eq.pais];
              return (
                <div
                  key={eq.pais}
                  className="rounded-xl p-3.5"
                  style={{ background: "#1e212b", border: "1px solid #2d3142" }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base leading-none">{pais?.bandera ?? "🌍"}</span>
                    <span className="text-xs font-semibold" style={{ color: "#f1f5f9" }}>
                      {pais?.nombre ?? eq.pais}
                    </span>
                    <span className="text-xs" style={{ color: "#64748b" }}>·</span>
                    <span className="text-xs font-medium" style={{ color: "#3b82f6" }}>{eq.nombre}</span>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: "#94a3b8" }}>{eq.nota}</p>
                </div>
              );
            })}
          </div>
        </Seccion>
      )}

      {/* ── Lo que nos mete dentro del proceso, no solo informando ── */}
      <PrepararSolicitud slug={t.slug} nombre={t.nombre} />

      {/* ── Y una vez lo tenga, el trabajo ── */}
      <div
        className="rounded-xl p-5 mb-8 flex flex-col sm:flex-row sm:items-center gap-3"
        style={{ background: "#1e212b", border: "1px solid #2d3142" }}
      >
        <Sparkles size={20} strokeWidth={1.8} className="shrink-0" style={{ color: "#22c55e" }} />
        <div className="flex-1">
          <p className="text-sm font-semibold mb-0.5" style={{ color: "#f1f5f9" }}>
            ¿Y qué trabajo pido con esto?
          </p>
          <p className="text-xs" style={{ color: "#94a3b8" }}>
            Guzzi te busca ofertas donde lo estén pidiendo y te manda el CV.
          </p>
        </div>
        <Link href="/app/gusi" className="btn-game text-xs shrink-0 text-center" style={{ textDecoration: "none" }}>
          Hablar con Guzzi
        </Link>
      </div>

      {/* ── Fuentes: cada dato de arriba sale de aquí ── */}
      <div className="pt-6" style={{ borderTop: "1px solid #2d3142" }}>
        <div className="flex items-center gap-1.5 mb-2.5">
          <Globe size={12} strokeWidth={1.9} style={{ color: "#64748b" }} />
          <span className="text-[10px] uppercase tracking-wide font-semibold" style={{ color: "#64748b" }}>
            De dónde sale esta información
          </span>
        </div>
        <ul className="flex flex-col gap-1.5 mb-3">
          {t.fuentes.map(f => (
            <li key={f.url}>
              <a
                href={f.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs hover:underline"
                style={{ color: "#64748b" }}
              >
                {f.titulo}
              </a>
            </li>
          ))}
        </ul>
        <p className="text-[11px]" style={{ color: "#4b5563" }}>
          Revisado en {t.actualizado}. Los precios son orientativos y cambian según el centro;
          comprueba siempre las condiciones antes de matricularte.
        </p>
      </div>
    </>
  );
}
