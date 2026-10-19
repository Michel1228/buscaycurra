/**
 * lib/guzzi/plazas-cursos.ts — "Curso de carretillero en Bilbao" → plazas reales.
 *
 * Antes, cualquier pregunta de cursos la contestaba el modelo de memoria: la
 * ficha general y poco más. Ahora, si se reconoce el curso (por las mismas
 * reglas que emparejan las plazas con las fichas) se contesta con plazas de
 * verdad, con fecha y centro, sacadas de curso_plaza.
 *
 * Solo responde cuando tiene algo cierto que decir. Si no reconoce el curso,
 * devuelve null y sigue el flujo de siempre. Si reconoce curso y provincia pero
 * no hay plazas ahí, lo dice y manda a FUNDAE, en vez de dejar que el modelo
 * se invente una academia.
 */
import { etiquetaPlazas, fichasDePlaza, normalizarTitulo } from "@/lib/cursos/plazas/emparejar";
import { nombreProvincia } from "@/lib/cursos/plazas/provincias";
import { tipoPorSlug } from "@/lib/cursos/tipos";

// provinciaEnTexto vive en lib/cursos/plazas/provincias.ts: el buscador de plazas
// la usa también en el navegador, y este fichero arrastra la base de datos.
import { provinciaEnTexto } from "@/lib/cursos/plazas/provincias";
export { provinciaEnTexto };

/** Ficha que se pide en el mensaje (la primera que encaje), o null. */
export function fichaEnTexto(texto: string): string | null {
  return fichasDePlaza(texto)[0] ?? null;
}

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
function fechaLarga(iso: string): string {
  const [, m, d] = iso.split("-").map(Number);
  return `${d} de ${MESES[m - 1]}`;
}

export async function respuestaPlazasCurso(texto: string): Promise<string | null> {
  const ficha = fichaEnTexto(texto);
  if (!ficha) return null;
  const tipo = tipoPorSlug(ficha, "ES");
  if (!tipo) return null;
  const provincia = provinciaEnTexto(texto);

  const { buscarPlazas } = await import("@/lib/cursos/plazas/db");
  let resultado;
  try {
    resultado = await buscarPlazas({ ficha, provincia: provincia ?? undefined, limite: 12 });
  } catch {
    return null; // sin base de datos, que conteste el flujo de siempre
  }
  // El mismo curso, el mismo día y en el mismo pueblo sale varias veces cuando
  // hay varios grupos. En la lista de la web se enseñan todos; en el chat, tres
  // líneas idénticas parecen un fallo. Una por curso, pueblo y fecha.
  const vistas = new Set<string>();
  resultado.plazas = resultado.plazas.filter(p => {
    const clave = `${p.titulo}|${p.municipio}|${p.inicio}`;
    if (vistas.has(clave)) return false;
    vistas.add(clave);
    return true;
  }).slice(0, 3);

  const donde = provincia ? ` en ${nombreProvincia(provincia)}` : "";
  const enlaceFicha = `[ficha de ${etiquetaPlazas(tipo.slug, tipo.nombre)}](/app/formacion/${tipo.slug})`;
  const enlaceTodas = `/app/formacion/plazas?ficha=${tipo.slug}`;

  if (resultado.total === 0) {
    if (!provincia) return null;
    const etiqueta = etiquetaPlazas(tipo.slug, tipo.nombre);
    return `🎓 **${etiqueta.charAt(0).toUpperCase() + etiqueta.slice(1)}${donde}**\n\n`
      + `Ahora mismo no tengo plazas con fecha de este curso${donde}. Las que enseño las publican los servicios de empleo `
      + `de Euskadi, Cataluña, Castilla y León, Murcia y Navarra; el resto de comunidades no las publica como datos.\n\n`
      + `• Busca en el [buscador oficial de FUNDAE](https://experienciafundae.es/buscador), que cubre toda España.\n`
      + `• En la ${enlaceFicha} tienes lo que cuesta, lo que dura y dónde sacarlo gratis.`;
  }

  const lineas = resultado.plazas.map(p => {
    const lugar = p.modalidad === "online" ? "online" : [p.municipio, nombreProvincia(p.provincia)].filter(Boolean).join(", ");
    const horas = p.horas ? ` · ${p.horas} h` : "";
    return `• **${p.titulo}** — empieza el ${fechaLarga(p.inicio)}${lugar ? `, ${lugar}` : ""}${horas}. [Apuntarse](${p.url})`;
  });

  return `🎓 **Plazas gratis de ${etiquetaPlazas(tipo.slug, tipo.nombre)}${donde}**\n\n`
    + `${lineas.join("\n")}\n\n`
    + (resultado.total > resultado.plazas.length
      ? `👉 [Ver las ${resultado.total} plazas](${enlaceTodas})\n\n`
      : "")
    + `Son cursos de los servicios públicos de empleo: muchos piden estar apuntado al paro. `
    + `En la ${enlaceFicha} tienes los papeles que te van a pedir, y si quieres te preparo la carta de solicitud con tu CV.\n\n`
    + `🔔 En esa misma ficha puedes encender el aviso: te escribo cuando salgan ofertas que pidan este curso (como mucho, una vez cada dos semanas).`;
}
