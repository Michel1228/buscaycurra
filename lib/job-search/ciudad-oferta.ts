/**
 * lib/job-search/ciudad-oferta.ts
 * La ciudad de una oferta, lista para buscar su empresa.
 *
 * POR QUÉ (1 nov 2026). La empresa se buscaba en Google solo por el nombre, en todo
 * el mundo: "Clober" acabó en un club de golf británico, "Fastrack" en la India y
 * Adecco en adecco.de. Si esa dirección existe, el CV llega a quien no es.
 */

// Lo que aparece como ubicación sin ser un sitio donde buscar.
const NO_ES_UN_SITIO = /^(espa[nñ]a|spain|remoto|remote|teletrabajo|h[ií]brido|hybrid|europa|europe|worldwide|internacional|toda espa[nñ]a|varias|varios|n\/a)$/i;

export function ciudadParaBuscarEmpresa(ubicacion?: string | null): string | undefined {
  const ciudad = (ubicacion || "").split(/[,(]/)[0].trim();
  return ciudad.length >= 2 && !NO_ES_UN_SITIO.test(ciudad) ? ciudad : undefined;
}

// Lo que no distingue a una empresa de otra.
const PALABRAS_VACIAS = new Set(["de", "del", "la", "las", "el", "los", "y", "e", "the", "and", "of", "sl", "slu", "sa", "sau", "ltd", "gmbh", "inc", "spain", "espana"]);

const palabras = (s: string) => s
  .normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
  .replace(/\b(s)\.(l|a)\.?(u\.?)?/g, "$1$2$3")
  .split(/[^a-z0-9]+/).filter(Boolean);

/**
 * ¿Este resultado de Google es la empresa de la oferta?
 *
 * Con la ciudad, Google contesta con lo más parecido que haya allí: "Clober" en
 * Madrid daba The Clover House y "Fastrack" el Fast Track del aeropuerto (aena.es).
 * Eso es peor que un rebote, porque el CV sí llega. Las dos primeras palabras que
 * distinguen a la empresa tienen que estar en el nombre, o dentro del dominio
 * ("Hoffman" en hoffmann-group.com). Si no, mejor decir que no hay correo.
 */
export function esLaMismaEmpresa(buscada: string, nombre?: string | null, dominio?: string | null): boolean {
  const claves = palabras(buscada).filter((p) => !PALABRAS_VACIAS.has(p)).slice(0, 2);
  if (!claves.length) return false;
  const delNombre = new Set(palabras(nombre || ""));
  const web = (dominio || "").toLowerCase();
  return claves.every((p) => delNombre.has(p) || web.includes(p));
}
