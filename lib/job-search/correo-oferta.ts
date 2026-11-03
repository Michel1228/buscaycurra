/**
 * lib/job-search/correo-oferta.ts
 * ¿Se puede ofrecer este correo para mandar el CV a esta oferta?
 *
 * POR QUÉ (3 nov 2026). El proceso nocturno deduce el correo adivinando la web de
 * la empresa por su nombre, probando .com, .de, .co.uk… sin mirar el país de la
 * oferta, y lo copia a todas las ofertas con ese nombre. En una muestra de ofertas
 * de España salieron Maersk con vpn.com, Alsa con alsglobal.com, Amazon con
 * amazon.de y Aramark con aramark.de. Si esa dirección existe, el CV llega a quien
 * no es. Un correo equivocado es peor que ninguno: sin él, la oferta se solicita
 * en su web.
 *
 * Lo que la empresa escribió en la propia oferta (confianza "alta") vale siempre.
 */

// Dominios de dos letras que se usan como genéricos, no por el país.
const CC_GENERICOS = new Set(["io", "ai", "co", "cc", "me", "tv", "eu", "ly", "fm", "gg", "to", "ws", "so", "sh", "ac", "la", "app"]);

// Segundos niveles de los países que los usan (empresa.co.uk, empresa.com.au).
const SEGUNDO_NIVEL = new Set(["co", "com", "org", "net", "ac", "gov", "edu", "or", "ne"]);

// Buzones de cualquiera: no dicen nada de la empresa, ni a favor ni en contra.
const BUZONES_PUBLICOS = /^(gmail|googlemail|hotmail|outlook|live|msn|yahoo|ymail|icloud|me|mac|gmx|web|aol|protonmail|proton|telefonica|movistar)\./;

// Lo que no distingue a una empresa de otra.
const NO_DISTINGUEN = new Set([
  "de", "del", "la", "las", "el", "los", "y", "e", "the", "and", "of", "for",
  "sl", "slu", "sa", "sau", "sll", "scoop", "ltd", "limited", "gmbh", "inc", "llc", "plc", "bv", "nv", "ag", "spa", "srl", "sas", "ab", "co",
  "spain", "espana", "iberia", "iberica", "europe", "europa", "international", "internacional", "global",
  "grupo", "group", "groupe", "gruppo", "gruppe", "holding", "holdings", "company", "compania", "empresa",
  "servicios", "services", "service", "solutions", "soluciones", "consulting", "consultoria",
  "seleccion", "talent", "talento", "recursos", "humanos", "rrhh", "hr", "empleo", "jobs", "careers",
  "hotel", "hotels", "hoteles", "resort", "resorts",
  "comunidad", "autonoma", "region", "gobierno", "junta", "ayuntamiento", "diputacion", "consejeria", "oficina", "universidad",
]);

const palabras = (s: string) => s
  .normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
  .replace(/\b(s)\.(l|a)\.?(u\.?)?/g, "$1$2$3")
  .split(/[^a-z0-9]+/).filter(Boolean);

/** El nombre del dominio sin el país ni el www: "info@rrhh.acciona.es" → "acciona". */
function nombreDelDominio(dominio: string): { nombre: string; pais: string } {
  const partes = dominio.toLowerCase().split(".").filter(Boolean);
  const pais = partes[partes.length - 1] || "";
  const conSegundoNivel = partes.length >= 3 && SEGUNDO_NIVEL.has(partes[partes.length - 2]) && pais.length === 2;
  const nombre = partes[partes.length - (conSegundoNivel ? 3 : 2)] || "";
  return { nombre, pais };
}

export function correoCreibleParaOferta(
  email: string | null | undefined,
  empresa: string | null | undefined,
  pais: string | null | undefined,
  confianza?: string | null,
): boolean {
  const dominio = (email || "").trim().toLowerCase().split("@")[1];
  if (!dominio) return false;
  if (confianza === "alta") return true;

  const { nombre, pais: tld } = nombreDelDominio(dominio);
  // Un dominio de otro país: amazon.de en una oferta de España.
  const paisOferta = (pais || "").trim().toLowerCase();
  if (paisOferta && tld.length === 2 && !CC_GENERICOS.has(tld) && tld !== paisOferta && !(paisOferta === "uk" && tld === "gb")) return false;
  if (BUZONES_PUBLICOS.test(dominio)) return true;

  // El dominio tiene que ser de esa empresa: alguna palabra suya dentro del
  // dominio ("carter" en gruascarter.com), el dominio dentro del nombre, o sus
  // iniciales ("bbva" de Banco Bilbao Vizcaya Argentaria).
  const todas = palabras(empresa || "");
  const suyas = todas.filter((p) => !NO_DISTINGUEN.has(p));
  if (!suyas.length || !nombre) return false;
  // El nombre entero (elcorteingles.es), o el dominio dentro de lo que la distingue:
  // "Comunidad Autónoma de la Región de Murcia" no es comunidad.com.
  if (nombre === todas.join("") || (nombre.length >= 4 && suyas.join("").includes(nombre))) return true;
  if (suyas.some((p) => p.length >= 3 && nombre.includes(p))) return true;
  const iniciales = suyas.map((p) => p[0]).join("");
  return iniciales.length >= 3 && nombre === iniciales;
}
