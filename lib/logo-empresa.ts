/**
 * lib/logo-empresa.ts — ¿De qué dominio sacamos el logotipo de esta empresa?
 *
 * Lo pidió Michel (7 nov 2026): los logos de Lidl, Carrefour o Mercadona en las
 * tarjetas "dan profesionalidad". La regla es NO ADIVINAR: un logo equivocado
 * (el de otra empresa con nombre parecido) es peor que ninguno. Solo hay logo
 * cuando sabemos el dominio de verdad:
 *
 *  1. Marcas grandes comprobadas a mano, por su nombre EXACTO (quitando "S.A.",
 *     "S.L." y similares). "Lidl Supermercados S.A.U." es Lidl; "Supermercados
 *     Hiber" no es nadie de la lista. Se dejan fuera los nombres que pueden ser
 *     de otro negocio ("Mango" puede ser un bar, "Dia" un diario).
 *  2. El correo de la empresa, solo si su dominio lleva el nombre de la empresa
 *     ("rrhh@lidl.es" para "Lidl España"). Si el correo es de una ETT o de un
 *     portal para otra empresa (adecco.es para un puesto de Carrefour), o de
 *     Gmail/Hotmail, no vale.
 *
 * El dominio de la marca es el que da un icono nítido (>= 32 px) en el
 * servicio de iconos: para Carrefour, carrefour.com (el de carrefour.es solo
 * tiene 16 px). Comprobado uno a uno el 7 nov 2026.
 *
 * Lo demás lleva un círculo con sus iniciales (components/neon/LogoEmpresa.tsx).
 */

const MARCAS: [dominio: string, nombres: string[]][] = [
  ["lidl.es", ["lidl", "lidl espana", "lidl supermercados"]],
  ["carrefour.com", ["carrefour", "carrefour espana", "centros comerciales carrefour", "carrefour express", "carrefour market"]],
  ["mercadona.es", ["mercadona"]],
  ["alcampo.es", ["alcampo"]],
  ["eroski.es", ["eroski", "grupo eroski"]],
  ["aldi.es", ["aldi", "aldi supermercados"]],
  ["consum.es", ["consum"]],
  ["elcorteingles.es", ["el corte ingles"]],
  ["supercor.es", ["supercor"]],
  ["decathlon.es", ["decathlon", "decathlon espana"]],
  ["leroymerlin.es", ["leroy merlin", "leroy merlin espana"]],
  ["ikea.com", ["ikea", "ikea iberica"]],
  ["mediamarkt.es", ["mediamarkt", "media markt"]],
  ["bauhaus.es", ["bauhaus"]],
  ["bricomart.es", ["bricomart"]],
  ["ahorramas.com", ["ahorramas"]],
  ["gadisa.es", ["gadis", "gadisa"]],
  ["bonpreuesclat.cat", ["bonpreu", "bon preu"]],
  ["zara.com", ["zara"]],
  ["inditex.com", ["inditex", "grupo inditex"]],
  ["pullandbear.com", ["pull&bear", "pull and bear"]],
  ["bershka.com", ["bershka"]],
  ["stradivarius.com", ["stradivarius"]],
  ["massimodutti.com", ["massimo dutti"]],
  ["lefties.com", ["lefties"]],
  ["primark.com", ["primark"]],
  ["hm.com", ["h&m", "h & m", "hennes & mauritz"]],
  ["kiabi.es", ["kiabi"]],
  ["sprinter.es", ["sprinter"]],
  ["mcdonalds.es", ["mcdonald", "mcdonalds"]],
  ["burgerking.es", ["burger king"]],
  ["kfc.es", ["kfc"]],
  ["dominospizza.es", ["domino s pizza", "dominos pizza"]],
  ["starbucks.es", ["starbucks"]],
  ["amazon.es", ["amazon", "amazon espana"]],
  ["correos.es", ["correos", "correos y telegrafos", "sociedad estatal correos y telegrafos"]],
  ["seur.com", ["seur"]],
  ["mrw.es", ["mrw"]],
  ["glovoapp.com", ["glovo"]],
  ["mahou-sanmiguel.com", ["mahou san miguel", "mahou"]],
  ["randstad.es", ["randstad"]],
  ["adecco.com", ["adecco"]],
  ["manpower.es", ["manpower", "manpowergroup"]],
  ["eurofirms.es", ["eurofirms"]],
  ["ilunion.com", ["ilunion"]],
  ["securitas.es", ["securitas", "securitas seguridad espana"]],
];

// Lo que se quita del final del nombre: la forma jurídica.
const FORMA_JURIDICA = new Set(["s", "a", "l", "u", "v", "sa", "sl", "slu", "sau", "sll", "slne", "sc", "coop", "scoop", "cb", "sociedad", "anonima", "limitada", "cooperativa"]);

/** "Lidl Supermercados S.A.U." → "lidl supermercados". El "&" se queda (H&M). */
export function nombreNormalizado(nombre: string): string {
  const palabras = nombre
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9&]+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);
  while (palabras.length > 1 && FORMA_JURIDICA.has(palabras[palabras.length - 1])) palabras.pop();
  return palabras.join(" ");
}

const POR_NOMBRE = new Map<string, string>();
for (const [dominio, nombres] of MARCAS) for (const n of nombres) POR_NOMBRE.set(n, dominio);

// Correos que no son de ninguna empresa en concreto.
const CORREO_GENERICO = /^(gmail|googlemail|hotmail|outlook|live|msn|yahoo|ymail|icloud|me|mac|aol|gmx|protonmail|proton|telefonica|movistar|orange|vodafone|ono|jazztel|terra|yandex|mail|zoho)\./;

// Palabras del nombre que no sirven para reconocerlo en un dominio.
const PALABRAS_VACIAS = new Set(["grupo", "group", "empresa", "servicios", "service", "services", "espana", "spain", "iberica", "supermercados", "hotel", "restaurante", "centro", "global", "sociedad", "asociacion", "fundacion"]);

/**
 * El dominio del que sacar el logo, o null si no lo sabemos con seguridad.
 * `correo` solo debe pasarse si es de verdad el de la empresa (el que puso en
 * la oferta, o al que se envió el CV).
 */
export function dominioDeLogo(empresa: string | null | undefined, correo?: string | null): string | null {
  if (!empresa?.trim()) return null;
  const nombre = nombreNormalizado(empresa);
  const deMarca = POR_NOMBRE.get(nombre) || POR_NOMBRE.get(nombre.replace(/ (espana|spain|iberica)$/, ""));
  if (deMarca) return deMarca;

  const dominio = (correo || "").trim().toLowerCase().split("@")[1]?.replace(/^www\./, "");
  if (!dominio || !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(dominio) || CORREO_GENERICO.test(dominio)) return null;
  // "rrhh.lidl.es" → "lidl": la etiqueta que va antes del final.
  const partes = dominio.split(".");
  const etiqueta = (partes.length >= 3 && partes[partes.length - 2].length <= 3 ? partes[partes.length - 3] : partes[partes.length - 2]) || "";
  const pegada = etiqueta.replace(/-/g, "");
  const coincide = nombre.split(" ").some((p) => p.length >= 4 && !PALABRAS_VACIAS.has(p) && (etiqueta.split("-").includes(p) || pegada.includes(p)));
  return coincide ? dominio : null;
}

/** "Supermercados Hiber" → "SH"; "Domestiko.com" → "D". */
export function inicialesDe(empresa: string | null | undefined): string {
  const palabras = nombreNormalizado(empresa || "").split(" ").filter((p) => p && !["de", "del", "la", "el", "los", "las", "y", "com", "es"].includes(p));
  if (!palabras.length) return "?";
  return (palabras[0][0] + (palabras[1]?.[0] || "")).toUpperCase();
}
