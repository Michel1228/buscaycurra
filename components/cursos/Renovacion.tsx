/**
 * components/cursos/Renovacion.tsx — Cómo se renueva un carné que ya tienes.
 *
 * En casillas cortas y no en párrafos: quien llega aquí tiene el carné a punto
 * de caducar y quiere tres cosas, cada cuánto, qué hacer y dónde. Lo de "cada
 * cuánto" va en grande porque es lo primero que se busca.
 *
 * Se pinta en tres sitios: dentro de la ficha del curso (/cursos/[tipo] y
 * /app/formacion/[tipo]), en la página pública /cursos/[tipo]/renovar, que es
 * la que busca Google, y en el índice de renovaciones.
 */
import Link from "next/link";
import { ArrowLeft, ExternalLink, RefreshCw } from "lucide-react";
import { tiposConRenovacion, type Renovacion, type TipoCurso } from "@/lib/cursos/tipos";

export function CasillasRenovacion({ r }: { r: Renovacion }) {
  return (
    <>
      <div className="flex items-center gap-2 mb-3">
        <RefreshCw size={16} strokeWidth={2} style={{ color: "#22c55e" }} />
        <span className="text-lg font-bold" style={{ color: "#22c55e" }}>{r.cada}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {r.casillas.map(c => (
          <div key={c.titulo} className="rounded-xl p-3.5" style={{ background: "#1e212b", border: "1px solid #2d3142" }}>
            <p className="text-[10px] uppercase tracking-wide font-semibold mb-1" style={{ color: "#64748b" }}>
              {c.titulo}
            </p>
            <p className="text-xs leading-relaxed" style={{ color: "#cbd5e1" }}>{c.texto}</p>
          </div>
        ))}
      </div>

      {r.donde && (
        <a
          href={r.donde.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2.5 rounded-xl px-3.5 py-3 flex items-center justify-between gap-2 hover:opacity-90"
          style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)", textDecoration: "none" }}
        >
          <span className="text-xs font-semibold" style={{ color: "#22c55e" }}>Dónde: {r.donde.nombre}</span>
          <ExternalLink size={13} strokeWidth={1.9} className="shrink-0" style={{ color: "#22c55e" }} />
        </a>
      )}

      <p className="text-[11px] leading-relaxed mt-2.5" style={{ color: "#64748b" }}>
        Fuente:{" "}
        {r.fuentes.map((f, i) => (
          <span key={f.url}>
            {i > 0 && " · "}
            <a href={f.url} target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: "#64748b" }}>
              {f.titulo}
            </a>
          </span>
        ))}
      </p>
    </>
  );
}

/** Lo que se renueva: la homologación en soldadura, el propio carné en el resto. */
export function queSeRenueva(t: TipoCurso): string {
  return t.renovacion?.que ?? t.nombre;
}

/**
 * El índice: todos los carnés que caducan. Desde la web pública lleva a la
 * página de renovación de cada uno; dentro de la app, al bloque de la ficha.
 */
export function ListaRenovaciones({ base }: { base: string }) {
  const tipos = tiposConRenovacion("ES");
  const dentroDeLaApp = base.startsWith("/app");

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

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <RefreshCw size={20} strokeWidth={1.8} style={{ color: "#22c55e" }} />
          <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#22c55e" }}>Renovaciones</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold mb-3 leading-tight">¿Se te caduca el carné?</h1>
        <p className="text-sm leading-relaxed" style={{ color: "#94a3b8" }}>
          Cada cuánto hay que renovarlo y qué te piden. Con la fuente oficial de cada dato.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2.5 mb-6">
        {tipos.map(t => (
          <Link
            key={t.slug}
            href={dentroDeLaApp ? `${base}/${t.slug}#renovacion` : `${base}/${t.slug}/renovar`}
            className="rounded-xl p-3 flex flex-col justify-between gap-1.5 hover:opacity-90"
            style={{ background: "#1e212b", border: "1px solid #2d3142", textDecoration: "none" }}
          >
            <p className="text-xs font-semibold leading-snug" style={{ color: "#f1f5f9" }}>{queSeRenueva(t)}</p>
            <p className="text-sm font-bold" style={{ color: "#22c55e" }}>{t.renovacion!.cada}</p>
          </Link>
        ))}
      </div>

      <p className="text-xs leading-relaxed" style={{ color: "#64748b" }}>
        ¿No está el tuyo? Solo ponemos los plazos que hemos podido confirmar en una fuente oficial.
        Si un título no caduca, aquí no sale.
      </p>
    </>
  );
}
