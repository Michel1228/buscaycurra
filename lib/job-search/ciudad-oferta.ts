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
