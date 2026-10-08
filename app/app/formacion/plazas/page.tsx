/**
 * /app/formacion/plazas — Las plazas de cursos dentro de la app, con el menú.
 * Mismo contenido que /cursos/plazas (ver app/app/formacion/page.tsx sobre por
 * qué la ruta interna no se llama "cursos").
 */
import type { Metadata } from "next";
import PaginaPlazas from "@/components/cursos/PaginaPlazas";

export const metadata: Metadata = {
  title: "Plazas de cursos | BuscayCurra",
};

export default async function PlazasApp({ searchParams }: { searchParams: Promise<{ ficha?: string }> }) {
  const { ficha } = await searchParams;
  return (
    <div className="min-h-screen pt-16" style={{ background: "#0f1117", color: "#f1f5f9" }}>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <PaginaPlazas base="/app/formacion" ficha={ficha} />
      </div>
    </div>
  );
}
