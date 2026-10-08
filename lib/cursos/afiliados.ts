/**
 * lib/cursos/afiliados.ts — Enlaces a cursos de pago que nos pueden dejar comisión.
 *
 * CÓMO FUNCIONA. La web nunca enlaza directamente a Coursera: enlaza a
 * /api/cursos/ir?p=coursera&u=..., que apunta el clic y redirige. Si en el
 * servidor está la variable AFILIADO_COURSERA_PLANTILLA, la redirección lleva
 * nuestro código de afiliado; si no, va al enlace normal. Así:
 *   · el código se activa sin volver a compilar (las páginas de /cursos son
 *     estáticas y se construyen sin las variables del servidor);
 *   · sabemos cuánta gente sale hacia cada curso, haya comisión o no.
 *
 * La plantilla es el enlace de seguimiento que da la red de afiliados (Impact,
 * en el caso de Coursera) con {url} donde va el destino, por ejemplo:
 *   https://imp.i000000.net/c/1234567/123456/12345?u={url}
 * Se escribe en el .env.local del servidor. No va en el código: este
 * repositorio es público.
 *
 * LO QUE NO SE HACE. No se esconde que es de pago ni que puede haber comisión:
 * cada bloque lo dice debajo, y los enlaces llevan rel="sponsored", que es lo
 * que pide Google para no penalizar la web.
 */

export type ProgramaAfiliado = "coursera";

interface Programa {
  nombre: string;
  /** Solo se redirige a estos dominios: la ruta no puede ser una redirección abierta. */
  dominios: string[];
  variable: string;
}

export const PROGRAMAS: Record<ProgramaAfiliado, Programa> = {
  coursera: {
    nombre: "Coursera",
    dominios: ["www.coursera.org", "coursera.org"],
    variable: "AFILIADO_COURSERA_PLANTILLA",
  },
};

/**
 * Búsqueda de Coursera en español para cada ficha donde tiene sentido hacerlo
 * online. Se enlaza la BÚSQUEDA y no un curso concreto: los cursos sueltos
 * desaparecen o cambian de precio, la búsqueda siempre devuelve lo vigente.
 * Comprobadas el 2026-10-08 (devuelven resultados).
 */
export const BUSQUEDA_COURSERA: Record<string, string> = {
  "excel-ofimatica": "excel",
  "competencias-digitales": "habilidades digitales",
  "atencion-cliente": "atencion al cliente",
  "ingles-hosteleria": "ingles",
};

export function urlBusquedaCoursera(consulta: string): string {
  return `https://www.coursera.org/search?query=${encodeURIComponent(consulta)}&language=Spanish`;
}

export function programaValido(p: string | null): p is ProgramaAfiliado {
  return !!p && Object.prototype.hasOwnProperty.call(PROGRAMAS, p);
}

/** ¿El destino es de verdad de ese programa? Solo https y solo sus dominios. */
export function destinoPermitido(programa: ProgramaAfiliado, destino: string): boolean {
  try {
    const u = new URL(destino);
    return u.protocol === "https:" && PROGRAMAS[programa].dominios.includes(u.hostname);
  } catch {
    return false;
  }
}

/** A dónde se redirige de verdad: con código de afiliado si está configurado. */
export function destinoFinal(programa: ProgramaAfiliado, destino: string, entorno = process.env): {
  url: string;
  conComision: boolean;
} {
  const plantilla = entorno[PROGRAMAS[programa].variable]?.trim();
  if (!plantilla || !plantilla.includes("{url}") || !/^https:\/\//.test(plantilla)) {
    return { url: destino, conComision: false };
  }
  return { url: plantilla.replace("{url}", encodeURIComponent(destino)), conComision: true };
}

/** El enlace que se pone en la web. */
export function enlaceSalida(programa: ProgramaAfiliado, destino: string, ficha?: string): string {
  const sp = new URLSearchParams({ p: programa, u: destino });
  if (ficha) sp.set("f", ficha);
  return `/api/cursos/ir?${sp}`;
}
