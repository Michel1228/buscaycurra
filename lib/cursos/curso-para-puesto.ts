/**
 * lib/cursos/curso-para-puesto.ts — ¿Qué curso piden para el trabajo que busca?
 *
 * Para el correo diario de ofertas: quien tiene una alerta de "camarero" se
 * entera de que para eso piden el manipulador de alimentos, y de dónde hay
 * plazas gratis. Es la forma de que los cursos lleguen a la gente sin mandar
 * un correo más: va dentro del que ya ha pedido.
 *
 * ESTRICTO A PROPÓSITO. Solo cuenta si la búsqueda ES uno de los puestos de la
 * ficha o lo contiene entero ("ayudante de cocina" sí; "conductor" a secas no,
 * porque un taxista no necesita el CAP). Recomendar un curso que no hace falta
 * le cuesta dinero o tiempo a quien nos lee. Entre varias, la obligatoria por
 * ley va primero: es la que puede dejarle sin trabajo.
 */
import { tiposPorPais, type TipoCurso } from "@/lib/cursos/tipos";
import { normalizarTitulo } from "@/lib/cursos/plazas/emparejar";

/**
 * Los puestos de las fichas están en masculino ("camarero", "gerocultor") y
 * buena parte de quien nos lee escribe "camarera de sala" o "gerocultora".
 * Se pasa cada palabra a la forma de la ficha antes de comparar.
 */
export function aFormaDeFicha(texto: string): string {
  return texto
    .replace(/\b(\w+)oras?\b/g, "$1or")
    .replace(/\b(\w+)eras?\b/g, "$1ero")
    .replace(/\b(\w+)adas?\b/g, "$1ado")
    .replace(/\bdependientas?\b/g, "dependiente");
}

export function cursoParaPuesto(busqueda: string | null | undefined, pais = "ES"): TipoCurso | null {
  const b = ` ${aFormaDeFicha(normalizarTitulo(busqueda ?? "").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim())} `;
  if (b.trim().length < 3) return null;
  const candidatas = tiposPorPais(pais).filter(t =>
    t.puestos.some(p => b.includes(` ${normalizarTitulo(p).replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim()} `))
  );
  if (candidatas.length === 0) return null;
  return candidatas.find(t => t.obligatorioLegal) ?? candidatas[0];
}
