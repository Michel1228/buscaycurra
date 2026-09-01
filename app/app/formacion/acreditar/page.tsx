/**
 * /app/formacion/acreditar — El PEAC dentro de la aplicación.
 *
 * Misma información que la pública, conservando el menú. Ver el comentario de
 * ../page.tsx sobre por qué la ruta interna se llama "formacion" y no "cursos".
 */
import type { Metadata } from "next";
import Acreditacion from "@/components/cursos/Acreditacion";

export const metadata: Metadata = {
  title: "Acreditar tu experiencia | BuscayCurra",
};

export default function AcreditarApp() {
  return (
    <div className="min-h-screen pt-16" style={{ background: "#0f1117", color: "#f1f5f9" }}>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Acreditacion base="/app/formacion" />
      </div>
    </div>
  );
}
