/**
 * /app/formacion/mis-cursos — Lo que llevas hecho con tus cursos.
 *
 * Solo dentro de la app: es información personal, no hay versión pública que
 * indexar. Por eso aquí no hay gemela en /cursos.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, GraduationCap } from "lucide-react";
import MisCursosContent from "./Content";

export const metadata: Metadata = {
  title: "Mis cursos | BuscayCurra",
};

export default function MisCursosPage() {
  return (
    <div className="min-h-screen pt-16" style={{ background: "#0f1117", color: "#f1f5f9" }}>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link href="/app/formacion"
              className="inline-flex items-center gap-1.5 text-xs mb-6 hover:opacity-80"
              style={{ color: "#64748b", textDecoration: "none" }}>
          <ArrowLeft size={13} strokeWidth={1.9} />
          Todos los cursos
        </Link>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <GraduationCap size={20} strokeWidth={1.8} style={{ color: "#22c55e" }} />
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#22c55e" }}>
              Mis cursos
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-3 leading-tight">
            Lo que llevas hecho
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: "#94a3b8" }}>
            Tus cartas de solicitud, los papeles que te faltan y por dónde vas con cada curso.
            Todo guardado, para que no tengas que volver a empezar.
          </p>
        </div>

        <MisCursosContent />
      </div>
    </div>
  );
}
