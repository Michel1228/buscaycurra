/**
 * components/cursos/PaginaPlazas.tsx — La página de plazas, sin envoltorio.
 *
 * Igual que ListaCursos y DetalleCurso: se pinta en /cursos/plazas (pública,
 * para Google) y en /app/formacion/plazas (dentro de la app, con el menú).
 */
import Link from "next/link";
import { ArrowLeft, CalendarDays, X } from "lucide-react";
import PlazasCurso from "@/components/cursos/PlazasCurso";
import AvisoCurso from "@/components/cursos/AvisoCurso";
import { tipoPorSlug } from "@/lib/cursos/tipos";
import { etiquetaPlazas } from "@/lib/cursos/plazas/emparejar";

export default function PaginaPlazas({ base, ficha }: { base: string; ficha?: string }) {
  const tipo = ficha ? tipoPorSlug(ficha, "ES") : undefined;

  return (
    <>
      <Link
        href={tipo ? `${base}/${tipo.slug}` : base}
        className="inline-flex items-center gap-1.5 text-xs mb-6 hover:opacity-80"
        style={{ color: "#8b98ad", textDecoration: "none" }}
      >
        <ArrowLeft size={13} strokeWidth={1.9} />
        {tipo ? `Volver a ${tipo.nombre}` : "Todos los cursos"}
      </Link>

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <CalendarDays size={20} strokeWidth={1.8} style={{ color: "#22c55e" }} />
          <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#22c55e" }}>Plazas gratis</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-3 leading-tight">
          {tipo ? `Plazas gratis de ${etiquetaPlazas(tipo.slug, tipo.nombre)}` : "Cursos gratis que empiezan pronto"}
        </h1>
        <p className="text-sm leading-relaxed" style={{ color: "#94a3b8" }}>
          Con fecha, horario y centro. Los organizan los servicios públicos de empleo y son gratuitos;
          muchos piden estar apuntado al paro, y otros son para gente que ya trabaja.
        </p>
      </div>

      {tipo && (
        <Link
          href={`${base}/plazas`}
          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full mb-4 hover:opacity-80"
          style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", color: "#22c55e", textDecoration: "none" }}
        >
          Solo {etiquetaPlazas(tipo.slug, tipo.nombre)} <X size={12} strokeWidth={2.2} />
        </Link>
      )}

      <PlazasCurso ficha={tipo?.slug} base={base} />

      {/* Quien mira plazas de un curso es quien más quiere que le avisen:
          aquí también se puede encender el aviso, siempre a mano. */}
      {tipo && <AvisoCurso slug={tipo.slug} nombre={tipo.nombre} />}
    </>
  );
}
