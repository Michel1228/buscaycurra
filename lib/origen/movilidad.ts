/**
 * lib/origen/movilidad.ts — De dónde eres cambia TODA la respuesta.
 *
 * EL PROBLEMA QUE ARREGLA, Y ERA GRAVE.
 *
 * Toda la ayuda que da la aplicación estaba escrita dando por hecho que quien
 * la usa es español o de la Unión Europea: la acreditación de competencias pide
 * nacionalidad española o permiso de residencia; el formulario U2 exige estar
 * cobrando paro en un país de la UE; las fichas de au pair dicen «puedes ir sin
 * visado» porque hay libre circulación.
 *
 * Nada de eso vale para un argentino. Y la aplicación NO SABÍA de dónde era
 * nadie: el perfil guarda ciudad, provincia y código postal —todo pensado para
 * España— y ni un campo de nacionalidad. Sabíamos a dónde quería ir cada uno,
 * pero no de dónde salía.
 *
 * El caso que lo destapó: un argentino que quiere irse a Australia. La
 * respuesta correcta no es «no puedes» ni «vete sin visado»: Argentina SÍ está
 * en el visado Work and Holiday australiano (subclase 462), igual que España,
 * pero con condiciones distintas. Sin saber la nacionalidad no se puede acertar
 * ni por casualidad.
 *
 * ⚠️ LO QUE ESTE MÓDULO NO HACE, Y ES DELIBERADO. No hay una matriz de
 * requisitos para las 26 nacionalidades por los 26 destinos: son cientos de
 * combinaciones, cada una con su normativa, y publicarlas sin verificarlas una
 * a una sería exactamente el tipo de dato inventado que este proyecto no se
 * permite. Lo que sí se hace es lo que se puede afirmar con seguridad:
 *
 *   1. Decir qué RÉGIMEN aplica: libre circulación, acuerdo de movilidad
 *      joven, o visado por la vía general.
 *   2. Mandar a la autoridad oficial de inmigración del país de destino, que
 *      es quien tiene la respuesta exacta y actualizada.
 *   3. Avisar cuando algo de la aplicación NO le sirve por su nacionalidad,
 *      en vez de dejar que lo lea y organice su vida con ello.
 *
 * Vale más un «esto no te aplica, mira aquí» que una respuesta detallada y
 * falsa.
 *
 * Fuentes comprobadas el 2026-09-02: immi.homeaffairs.gov.au, Your Europe,
 * gov.uk y usa.gov.
 */

/** Países de la UE más los del Espacio Económico Europeo y Suiza. */
export const LIBRE_CIRCULACION = new Set([
  "ES", "DE", "FR", "IT", "PT", "NL", "BE", "AT", "IE", "PL", "SE", "DK",
  "FI", "CZ", "GR", "HU", "RO", "BG", "HR", "SK", "SI", "LT", "LV", "EE",
  "LU", "CY", "MT", "IS", "NO", "LI", "CH",
]);

export type Regimen =
  | "libre_circulacion"
  | "movilidad_joven"
  | "visado_general"
  | "desconocido";

export interface Movilidad {
  regimen: Regimen;
  titulo: string;
  explicacion: string;
  /** Lo que NO le sirve de la aplicación, si aplica. */
  noTeAplica?: string[];
  enlaceOficial?: { titulo: string; url: string };
}

/**
 * Países que tienen acuerdo de movilidad joven con Australia (subclases 417 y
 * 462). Se listan solo los que interesan a nuestro público hispanohablante y
 * europeo, y se remite a la fuente oficial para el resto: la lista cambia y
 * algunos tienen cupo anual.
 */
const ACUERDO_AUSTRALIA = new Set([
  "ES", "AR", "CL", "PE", "UY", "EC", "PT", "FR", "IT", "DE", "IE", "NL",
  "BE", "AT", "DK", "SE", "NO", "FI", "PL", "HU", "CZ", "SI", "GB",
]);

const OFICIAL_POR_DESTINO: Record<string, { titulo: string; url: string }> = {
  AU: {
    titulo: "Buscador de visados — Departamento de Interior de Australia",
    url: "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-finder",
  },
  GB: {
    titulo: "Visados e inmigración — GOV.UK",
    url: "https://www.gov.uk/browse/visas-immigration",
  },
  US: {
    titulo: "Visados de Estados Unidos — USA.gov",
    url: "https://www.usa.gov/visas",
  },
};

/** Para los destinos de la UE cuando quien pregunta NO es de la UE. */
const OFICIAL_UE = {
  titulo: "Vivir y trabajar en la UE siendo de fuera — Comisión Europea",
  url: "https://europa.eu/youreurope/citizens/residence/residence-rights/index_es.htm",
};

/**
 * Qué régimen le toca a esta persona para este destino.
 *
 * `origen` es su nacionalidad; `destino`, a dónde quiere ir. Ambos en código
 * de dos letras. Si no sabemos el origen se devuelve "desconocido", que en la
 * interfaz se traduce en pedírselo, no en suponer que es español.
 */
export function movilidadDe(origen: string | null | undefined, destino: string): Movilidad {
  const o = (origen || "").toUpperCase();
  const d = (destino || "").toUpperCase();

  if (!o) {
    return {
      regimen: "desconocido",
      titulo: "No sabemos de dónde eres",
      explicacion:
        "Lo que necesitas para trabajar en otro país depende de tu nacionalidad, y todavía no nos la has dicho. Dínosla y te contamos qué te aplica de verdad.",
    };
  }

  // Dentro del espacio de libre circulación: sin permiso de trabajo.
  if (LIBRE_CIRCULACION.has(o) && LIBRE_CIRCULACION.has(d)) {
    return {
      regimen: "libre_circulacion",
      titulo: "Puedes ir sin visado",
      explicacion:
        "Con tu nacionalidad tienes libre circulación: puedes ir, vivir y trabajar sin permiso de trabajo. Normalmente solo hay que empadronarse al llegar.",
    };
  }

  // Australia y su acuerdo de movilidad joven.
  if (d === "AU") {
    if (ACUERDO_AUSTRALIA.has(o)) {
      return {
        regimen: "movilidad_joven",
        titulo: "Tienes vía de movilidad joven",
        explicacion:
          "Tu país tiene acuerdo de Working Holiday con Australia, así que hay una vía pensada para ir a trabajar una temporada. Suele pedir una edad máxima, ahorros mínimos y, en algunos países, cupo anual y carta de apoyo del gobierno. Comprueba tu caso en la web oficial antes de contar con ello.",
        enlaceOficial: OFICIAL_POR_DESTINO.AU,
      };
    }
    return {
      regimen: "visado_general",
      titulo: "Necesitas visado",
      explicacion:
        "No nos consta que tu país tenga acuerdo de movilidad joven con Australia, así que la vía es un visado de trabajo ordinario, que normalmente exige que una empresa te patrocine.",
      enlaceOficial: OFICIAL_POR_DESTINO.AU,
    };
  }

  // De fuera de la UE hacia la UE.
  if (!LIBRE_CIRCULACION.has(o) && LIBRE_CIRCULACION.has(d)) {
    return {
      regimen: "visado_general",
      titulo: "Necesitas permiso de trabajo",
      explicacion:
        "Sin nacionalidad de la Unión Europea hace falta visado y permiso de trabajo, y en casi todos los casos que una empresa te contrate desde tu país. Ojo: aparecer con visado de turista y buscar trabajo allí no es una vía legal.",
      noTeAplica: [
        "La acreditación de competencias por experiencia pide nacionalidad española o de la UE, o permiso de residencia y trabajo en vigor.",
        "El formulario U2 para llevarte el paro solo vale si ya estabas cobrando prestación en un país de la UE.",
        "Los derechos del Acuerdo Europeo de au pair se reclaman en los países que lo ratificaron, no desde fuera.",
      ],
      enlaceOficial: OFICIAL_UE,
    };
  }

  // Cualquier otro caso: Reino Unido, Estados Unidos y demás.
  return {
    regimen: "visado_general",
    titulo: "Necesitas visado",
    explicacion:
      "Este destino exige visado con tu nacionalidad. Lo que hace falta cambia mucho según el país y el tipo de trabajo, así que lo seguro es mirarlo en la fuente oficial.",
    enlaceOficial: OFICIAL_POR_DESTINO[d],
  };
}

/** Si esta persona puede usar lo que damos para España y la UE. */
export function esDeLaUE(origen: string | null | undefined): boolean {
  return !!origen && LIBRE_CIRCULACION.has(origen.toUpperCase());
}

export const ACTUALIZADO = "2026-09";
