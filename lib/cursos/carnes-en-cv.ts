/**
 * lib/cursos/carnes-en-cv.ts — Los carnés que el CV dice que tienes.
 *
 * Para proponer en "Mis carnés" los que ya pone el CV: "tu CV dice que tienes
 * el de carretillero, ¿cuándo lo sacaste?". Solo menciones explícitas del
 * carné: haber trabajado de conductor no quiere decir tener el CAP, ni de peón
 * tener la TPC. La excepción es el vigilante: sin TIP no se puede trabajar de
 * vigilante de seguridad, así que el puesto ya lo dice.
 *
 * Sin dependencias de servidor, para probarlo en el sello con CVs inventados.
 */

const REGLAS: [string, RegExp][] = [
  ["carretillero", /carne?t? de carretill|carretillero homologado|une ?58451|operador de carretill/],
  ["plataforma-elevadora", /plataformas? elevadoras?|\bpemp\b|\bipaf\b|tarjeta pal\b/],
  ["tpc-construccion", /\btpc\b|tarjeta profesional de la construccion/],
  ["cap-conductor-profesional", /\bcap\b|certificado de aptitud profesional|tarjeta de cualificacion del conductor/],
  ["vigilante-seguridad", /\btip\b|tarjeta de identidad profesional|vigilante de seguridad/],
  ["soldadura", /homologacion.{0,40}soldad|soldad\w*.{0,30}homologad|\b9606\b/],
];

function textos(v: unknown, fuera: string[] = []): string[] {
  if (typeof v === "string") fuera.push(v);
  else if (Array.isArray(v)) v.forEach(x => textos(x, fuera));
  else if (v && typeof v === "object") Object.values(v).forEach(x => textos(x, fuera));
  return fuera;
}

/** Las fichas de carné que menciona el CV, sin repetir. */
export function carnesEnElCv(cv: unknown): string[] {
  const t = textos(cv).join(" \n ").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  return REGLAS.filter(([, re]) => re.test(t)).map(([slug]) => slug);
}
