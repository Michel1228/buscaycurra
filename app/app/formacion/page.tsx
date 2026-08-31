/**
 * /app/formacion — Los cursos dentro de la aplicación.
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
 *
 * POR QUE SE LLAMA /app/formacion Y NO /app/cursos. Se llamo /app/cursos y
 * rompio la web publica. Teniendo a la vez /cursos/[tipo] y /app/cursos/[tipo],
 * ambas prerenderizadas con generateStaticParams y los MISMOS slugs, el build
 * del servidor escribio la version de la app encima de la publica: /cursos y
 * /cursos/carretillero salieron en produccion sin cabecera publica, con el
 * titulo corto de la app y SIN el JSON-LD de Course, que es justo lo unico por
 * lo que esas paginas existen. En local salia bien, asi que no se ve hasta que
 * se despliega. Mientras la ruta interna no comparta nombre con una publica, no
 * hay ambiguedad posible. No la renombres a "cursos".
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
        <ListaCursos base="/app/formacion" />
      </div>
    </div>
  );
}
