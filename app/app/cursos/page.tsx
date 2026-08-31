/**
 * /app/cursos — Los cursos dentro de la aplicación.
 *
 * POR QUÉ EXISTE ESTA PÁGINA SI YA ESTÁ /cursos. Porque AppNavWrapper solo se
 * pinta en rutas que empiezan por /app (línea 202: `if (!pathname.startsWith("/app")) return null`).
 * Si el menú llevara directamente a /cursos, el usuario identificado perdería
 * la navegación de golpe y se encontraría la cabecera pública, con su "Empieza
 * gratis", que no le dice nada a quien ya tiene cuenta. En la app nativa, donde
 * no hay barra del navegador, eso es quedarse encerrado.
 *
 * La /cursos pública sigue existiendo y es la que indexa Google. El contenido
 * es el mismo componente en las dos, así que no se pueden desincronizar.
 */
import type { Metadata } from "next";
import ListaCursos from "@/components/cursos/ListaCursos";

export const metadata: Metadata = {
  title: "Cursos | BuscayCurra",
};

export default function CursosApp() {
  return (
    <div className="min-h-screen pt-16" style={{ background: "#0f1117", color: "#f1f5f9" }}>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <ListaCursos base="/app/cursos" />
      </div>
    </div>
  );
}
