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

/**
 * La aplicación usa "UK" para el Reino Unido; el código ISO es "GB". Yo escribí
 * "GB" en estos módulos y el resultado fue que el aviso de visado británico no
 * se disparaba NUNCA — justo en el país con más ofertas de au pair (1.155).
 * Se aceptan los dos y se normaliza a "UK", que es lo que usa lib/paises.ts.
 */
export function normalizarPais(codigo: string | null | undefined): string {
  const c = (codigo || "").toUpperCase().trim();
  if (c === "GB") return "UK";
  return c;
}

export type Regimen =
  | "libre_circulacion"
  | "movilidad_joven"
  /** Un acuerdo entre países de la región (residencia del Mercosur en Brasil). */
  | "acuerdo_regional"
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
  "BE", "AT", "DK", "SE", "NO", "FI", "PL", "HU", "CZ", "SI", "UK",
]);

/**
 * Acuerdo de Residencia del Mercosur (Decreto 6.975/2009): residencia temporal
 * de dos años en Brasil sin oferta de trabajo, y con ella se puede trabajar.
 * Venezuela no está: las fuentes no coinciden y está suspendida desde 2016.
 */
const ACUERDO_MERCOSUR = new Set(["AR", "BO", "CL", "CO", "EC", "PY", "PE", "UY"]);

/**
 * Colombia (Resolución 5477 de 2022): visa M Migrante Mercosur (art. 71, dos
 * años y permiso abierto de trabajo) y M Migrante Andino (art. 72, Estatuto
 * Migratorio Andino: Bolivia, Ecuador y Perú). Chile no está en la de
 * Mercosur: Colombia se la quitó en 2019 por reciprocidad. Venezuela tampoco.
 */
const MERCOSUR_EN_COLOMBIA = new Set(["AR", "BR", "BO", "EC", "PY", "PE", "UY"]);
const ANDINOS_EN_COLOMBIA = new Set(["BO", "EC", "PE"]);

/**
 * Perú: residencia Mercosur (gob.pe/12927: Argentina, Brasil, Paraguay,
 * Uruguay, Chile, Colombia, Ecuador y Bolivia) y residencia temporal andina de
 * dos años (Decisión 878: Bolivia, Colombia y Ecuador).
 */
const MERCOSUR_EN_PERU = new Set(["AR", "BR", "PY", "UY", "CL", "CO", "EC", "BO"]);
const ANDINOS_EN_PERU = new Set(["BO", "CO", "EC"]);

/**
 * Chile: residencia temporal por reciprocidad del Mercosur (Ley 21.325, art.
 * 70 n.º 13), solo para Argentina, Bolivia, Brasil, Paraguay y Uruguay según
 * el Servicio Nacional de Migraciones. Perú y Colombia no están.
 */
const MERCOSUR_EN_CHILE = new Set(["AR", "BO", "BR", "PY", "UY"]);

/**
 * Argentina: residencia temporaria por nacionalidad Mercosur (argentina.gob.ar:
 * Uruguay, Brasil, Paraguay, Bolivia, Chile, Perú, Ecuador, Colombia y
 * Venezuela). Y con España, el Programa de Movilidad de Jóvenes (en vigor
 * desde el 10 feb 2023): visa de vacaciones y trabajo de 12 meses.
 */
const MERCOSUR_EN_ARGENTINA = new Set(["UY", "BR", "PY", "BO", "CL", "PE", "EC", "CO", "VE"]);

/**
 * Ecuador: residencia temporal Mercosur (Estados Parte del Acuerdo de
 * Residencia: Argentina, Brasil, Paraguay, Uruguay, Bolivia, Chile, Perú y
 * Colombia) y del Estatuto Migratorio Andino (Colombia, Perú y Bolivia), dos
 * años cada una (gob.ec).
 */
const MERCOSUR_EN_ECUADOR = new Set(["AR", "BR", "PY", "UY", "BO", "CL", "PE", "CO"]);
const ANDINOS_EN_ECUADOR = new Set(["CO", "PE", "BO"]);

/**
 * Uruguay: residencia permanente por la Ley 19.254 para nacionales de los
 * Estados Parte y Asociados del Mercosur (también Venezuela, según Voz de
 * América), gratis y resuelta en 30 días hábiles.
 */
const MERCOSUR_EN_URUGUAY = new Set(["AR", "BR", "PY", "BO", "CL", "CO", "EC", "PE", "VE"]);

const OFICIAL_POR_DESTINO: Record<string, { titulo: string; url: string }> = {
  MX: {
    titulo: "Instituto Nacional de Migración — Gobierno de México",
    url: "https://www.gob.mx/inm",
  },
  BR: {
    titulo: "Imigração — Polícia Federal de Brasil",
    url: "https://www.gov.br/pf/pt-br/assuntos/imigracao",
  },
  CO: {
    titulo: "Visas — Cancillería de Colombia",
    url: "https://www.cancilleria.gov.co/atencion-y-servicio-al-ciudadano/tramites-y-servicios/visa",
  },
  PE: {
    titulo: "Superintendencia Nacional de Migraciones — Perú",
    url: "https://www.gob.pe/migraciones",
  },
  CL: {
    titulo: "Servicio Nacional de Migraciones — Chile",
    url: "https://serviciomigraciones.cl/",
  },
  AR: {
    titulo: "Dirección Nacional de Migraciones — Argentina",
    url: "https://www.argentina.gob.ar/interior/migraciones",
  },
  EC: {
    titulo: "Visas — Cancillería del Ecuador",
    url: "https://www.cancilleria.gob.ec/",
  },
  GT: {
    titulo: "Instituto Guatemalteco de Migración",
    url: "https://igm.gob.gt/",
  },
  CR: {
    titulo: "Dirección General de Migración y Extranjería — Costa Rica",
    url: "https://www.migracion.go.cr/",
  },
  UY: {
    titulo: "Residencias — Ministerio de Relaciones Exteriores del Uruguay",
    url: "https://www.gub.uy/ministerio-relaciones-exteriores/",
  },
  SV: {
    titulo: "Dirección General de Migración y Extranjería — El Salvador",
    url: "https://www.migracion.gob.sv/",
  },
  PA: {
    titulo: "Servicio Nacional de Migración — Panamá",
    url: "https://www.migracion.gob.pa/",
  },
  DO: {
    titulo: "Dirección General de Migración — República Dominicana",
    url: "https://migracion.gob.do/",
  },
  HN: {
    titulo: "Instituto Nacional de Migración — Honduras",
    url: "https://inm.gob.hn/",
  },
  AU: {
    titulo: "Buscador de visados — Departamento de Interior de Australia",
    url: "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-finder",
  },
  UK: {
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
  const o = normalizarPais(origen);
  const d = normalizarPais(destino);

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

  // Brasil y el Acuerdo de Residencia del Mercosur.
  if (d === "BR" && ACUERDO_MERCOSUR.has(o)) {
    return {
      regimen: "acuerdo_regional",
      titulo: "Tienes la vía del Mercosur",
      explicacion:
        "Con tu nacionalidad puedes pedir en Brasil una residencia temporal de dos años sin tener oferta de trabajo (Acuerdo de Residencia del Mercosur), y con ella trabajar. Al llegar, regístrate en la Polícia Federal.",
      enlaceOficial: OFICIAL_POR_DESTINO.BR,
    };
  }

  // Colombia: visa M Mercosur o M Migrante Andino, sin oferta de trabajo.
  if (d === "CO" && (MERCOSUR_EN_COLOMBIA.has(o) || ANDINOS_EN_COLOMBIA.has(o))) {
    return {
      regimen: "acuerdo_regional",
      titulo: ANDINOS_EN_COLOMBIA.has(o) ? "Tienes la vía andina y la del Mercosur" : "Tienes la vía del Mercosur",
      explicacion:
        "Con tu nacionalidad puedes pedir en Colombia una visa M de dos años sin tener oferta de trabajo, y con ella trabajar. Al llegar, tienes 15 días para sacar la cédula de extranjería en Migración Colombia.",
      enlaceOficial: OFICIAL_POR_DESTINO.CO,
    };
  }

  // Perú: residencia Mercosur o andina, sin oferta de trabajo.
  if (d === "PE" && MERCOSUR_EN_PERU.has(o)) {
    return {
      regimen: "acuerdo_regional",
      titulo: ANDINOS_EN_PERU.has(o) ? "Tienes la vía andina y la del Mercosur" : "Tienes la vía del Mercosur",
      explicacion:
        "Con tu nacionalidad puedes pedir en Migraciones una residencia temporal de dos años sin tener oferta de trabajo, y con ella trabajar. Te dan el carné de extranjería.",
      enlaceOficial: OFICIAL_POR_DESTINO.PE,
    };
  }

  // Chile: residencia por reciprocidad del Mercosur.
  if (d === "CL" && MERCOSUR_EN_CHILE.has(o)) {
    return {
      regimen: "acuerdo_regional",
      titulo: "Tienes la vía del Mercosur",
      explicacion:
        "Con tu nacionalidad puedes pedir en Chile la residencia temporal por reciprocidad del Mercosur, y con ella trabajar. Con la residencia en vigor, tienes 30 días para sacar la cédula en el Registro Civil.",
      enlaceOficial: OFICIAL_POR_DESTINO.CL,
    };
  }

  // Argentina: residencia por nacionalidad Mercosur, y movilidad de jóvenes con España.
  if (d === "AR" && MERCOSUR_EN_ARGENTINA.has(o)) {
    return {
      regimen: "acuerdo_regional",
      titulo: "Tienes la vía del Mercosur",
      explicacion:
        "Con tu nacionalidad puedes pedir en Argentina la residencia temporaria por nacionalidad Mercosur, de dos años, sin oferta de trabajo, y con ella trabajar. Después sacas el DNI y el CUIL.",
      enlaceOficial: OFICIAL_POR_DESTINO.AR,
    };
  }
  if (d === "AR" && o === "ES") {
    return {
      regimen: "movilidad_joven",
      titulo: "Tienes vía de movilidad joven",
      explicacion:
        "España y Argentina tienen un programa de movilidad de jóvenes: una visa de vacaciones y trabajo de 12 meses, no prorrogable, que se pide en un consulado argentino en España. Mira allí la edad y el cupo antes de contar con ello.",
      enlaceOficial: OFICIAL_POR_DESTINO.AR,
    };
  }

  // Ecuador: residencia andina o Mercosur, sin oferta de trabajo.
  if (d === "EC" && MERCOSUR_EN_ECUADOR.has(o)) {
    return {
      regimen: "acuerdo_regional",
      titulo: ANDINOS_EN_ECUADOR.has(o) ? "Tienes la vía andina y la del Mercosur" : "Tienes la vía del Mercosur",
      explicacion: ANDINOS_EN_ECUADOR.has(o)
        ? "Con tu nacionalidad puedes pedir en Ecuador la residencia temporal del Estatuto Migratorio Andino: dos años, sin oferta de trabajo, y solo pagas los 50 US$ de la solicitud."
        : "Con tu nacionalidad puedes pedir en Ecuador la residencia temporal Mercosur: dos años, sin oferta de trabajo, y con ella trabajar.",
      enlaceOficial: OFICIAL_POR_DESTINO.EC,
    };
  }

  // Uruguay: residencia permanente directa por la Ley 19.254.
  if (d === "UY" && MERCOSUR_EN_URUGUAY.has(o)) {
    return {
      regimen: "acuerdo_regional",
      titulo: "Tienes la residencia permanente del Mercosur",
      explicacion:
        "Con tu nacionalidad puedes pedir en Uruguay la residencia permanente (Ley 19.254), sin oferta de trabajo y gratis. Cancillería tiene 30 días hábiles para resolver, y al empezar el trámite te dan una cédula provisoria.",
      enlaceOficial: OFICIAL_POR_DESTINO.UY,
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
  return !!origen && LIBRE_CIRCULACION.has(normalizarPais(origen));
}

export const ACTUALIZADO = "2026-09";
