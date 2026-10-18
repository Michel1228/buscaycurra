/**
 * /app/formacion/renovar — Las renovaciones dentro de la aplicación.
 *
 * Misma información que la pública, conservando el menú. Ver el comentario de
 * ../page.tsx sobre por qué la ruta interna se llama "formacion" y no "cursos".
 */
import type { Metadata } from "next";
import { ListaRenovaciones } from "@/components/cursos/Renovacion";

export const metadata: Metadata = {
  title: "Renovar tu carné | BuscayCurra",
};

export default function RenovarApp() {
  return (
    <div className="min-h-screen pt-16" style={{ background: "#0f1117", color: "#f1f5f9" }}>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <ListaRenovaciones base="/app/formacion" />
      </div>
    </div>
  );
}
