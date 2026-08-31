/**
 * components/cursos/ListaCursos.tsx — El listado de cursos, sin envoltorio.
 *
 * Vive aparte porque se pinta en DOS sitios con marcos distintos:
 *   /cursos      → página pública, con PublicHeader. Es la que ve Google.
 *   /app/formacion  → dentro de la app, con el menú de siempre.
 *
 * Si fueran dos páginas copiadas, la segunda se quedaría atrás a la primera
 * que alguien tocara una. El prop `base` es lo único que cambia: a dónde
 * apuntan los enlaces de cada ficha.
 */
import Link from "next/link";
import { AlertCircle, Clock, Euro, GraduationCap } from "lucide-react";
import {
  tiposPorPais, ordenarPorUrgencia, sectoresConCursos, tiposPorSector,
  NOMBRE_SECTOR, precioResumido, duracionResumida, type TipoCurso,
} from "@/lib/cursos/tipos";

function TarjetaCurso({ t, base }: { t: TipoCurso; base: string }) {
  const gratis = t.precio.min === 0;
  return (
    <Link href={`${base}/${t.slug}`} className="card-game p-4 flex flex-col gap-2 group" style={{ textDecoration: "none" }}>
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
      <div className="flex items-center gap-3 mt-auto pt-1 text-[11px]" style={{ color: "#64748b" }}>
        <span className="flex items-center gap-1">
          <Euro size={11} strokeWidth={1.8} />
          <span style={{ color: gratis ? "#22c55e" : "#64748b" }}>{precioResumido(t)}</span>
        </span>
        <span className="flex items-center gap-1">
          <Clock size={11} strokeWidth={1.8} />
          {duracionResumida(t)}
        </span>
      </div>
    </Link>
  );
}

export default function ListaCursos({ base }: { base: string }) {
  const todos = tiposPorPais("ES");
  const obligatorios = ordenarPorUrgencia(todos.filter(t => t.familia === "obligatorio"));
  const sectores = sectoresConCursos("ES");

  return (
    <>
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-3">
          <GraduationCap size={22} strokeWidth={1.8} style={{ color: "#22c55e" }} />
          <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#22c55e" }}>Formación</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold mb-3 leading-tight">
          El curso que te piden para el trabajo que quieres
        </h1>
        <p className="text-sm sm:text-base leading-relaxed" style={{ color: "#94a3b8" }}>
          Cuánto cuesta de verdad, cuánto dura y dónde sacarlo gratis.
          Sin rodeos y con la fuente oficial de cada dato.
        </p>
      </div>

      {obligatorios.length > 0 && (
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
            {obligatorios.map(t => <TarjetaCurso key={t.slug} t={t} base={base} />)}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-base font-bold mb-1" style={{ color: "#f1f5f9" }}>
          Para que te cojan a ti y no a otro
        </h2>
        <p className="text-xs mb-5" style={{ color: "#94a3b8" }}>
          No son obligatorios, pero marcan la diferencia cuando hay varios candidatos.
        </p>
        {sectores.map(sector => {
          const deMejora = ordenarPorUrgencia(tiposPorSector(sector, "ES").filter(t => t.familia === "mejora"));
          if (deMejora.length === 0) return null;
          return (
            <div key={sector} className="mb-7">
              <h3 className="text-[11px] font-semibold uppercase tracking-wide mb-3" style={{ color: "#64748b" }}>
                {NOMBRE_SECTOR[sector]}
              </h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {deMejora.map(t => <TarjetaCurso key={t.slug} t={t} base={base} />)}
              </div>
            </div>
          );
        })}
      </section>

      <div className="mt-10 rounded-xl p-4 text-xs leading-relaxed"
           style={{ background: "#1e212b", border: "1px solid #2d3142", color: "#94a3b8" }}>
        Vamos ampliando el catálogo poco a poco. Cada ficha lleva abajo las fuentes
        oficiales de donde sale cada dato, para que puedas comprobarlo tú mismo.{" "}
        <Link href="/app/gusi" style={{ color: "#22c55e" }}>Si no encuentras el tuyo, pregúntale a Guzzi</Link>.
      </div>
    </>
  );
}
