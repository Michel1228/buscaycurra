/**
 * lib/guzzi/paises-detect.ts — Reconocer un PAÍS en lo que escribe el usuario.
 *
 * POR QUÉ EXISTE: un cliente escribió "ofertas de trabajo en Irlanda" y Guzzi
 * respondió que no había ninguna, teniendo 13.604 vivas. La causa era que
 * extractCity() solo entendía ciudades y llevaba una lista `nonCities` con
 * 'irlanda', 'españa', 'alemania'... para descartarlas: los países se tiraban a
 * la basura, la búsqueda se quedaba sin ubicación y Guzzi pedía una ciudad.
 *
 * Buscar por país es una petición perfectamente normal ("quiero emigrar a
 * Irlanda"), y es justo el caso de uso de la app. Aquí se reconocen y se
 * traducen al código ISO que ya usa la búsqueda.
 */
import { PAISES } from "@/lib/paises";

/** Formas en que la gente escribe cada país, además del nombre oficial. */
const ALIAS: Record<string, string[]> = {
  ES: ["espana", "spain", "peninsula"],
  DE: ["alemania", "germany", "deutschland"],
  FR: ["francia", "france"],
  IT: ["italia", "italy"],
  PT: ["portugal"],
  NL: ["holanda", "paises bajos", "netherlands", "nederland"],
  IE: ["irlanda", "ireland", "eire"],
  GB: ["reino unido", "inglaterra", "gran bretana", "uk", "england", "britain", "escocia", "gales"],
  UK: ["reino unido", "inglaterra", "gran bretana", "uk", "england", "britain"],
  US: ["estados unidos", "eeuu", "ee uu", "usa", "america"],
  CA: ["canada"],
  AU: ["australia"],
  NZ: ["nueva zelanda", "new zealand"],
  CH: ["suiza", "switzerland", "schweiz"],
  BE: ["belgica", "belgium"],
  AT: ["austria"],
  SE: ["suecia", "sweden", "sverige"],
  NO: ["noruega", "norway", "norge"],
  DK: ["dinamarca", "denmark", "danmark"],
  FI: ["finlandia", "finland", "suomi"],
  PL: ["polonia", "poland", "polska"],
  LU: ["luxemburgo", "luxembourg"],
  CZ: ["republica checa", "chequia", "czechia"],
};

function normalizar(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
}

export interface PaisDetectado {
  codigo: string;   // ISO en minúsculas, como está en la base de datos ("ie")
  nombre: string;   // "Irlanda", para hablarle al usuario
  bandera: string;
}

/**
 * Devuelve el país mencionado en el texto, o null.
 * Compara con límites de palabra para que "irlanda" no salte dentro de otra
 * palabra y para no confundir "us" (Estados Unidos) con cualquier "us" suelto.
 */
export function detectarPais(texto: string): PaisDetectado | null {
  const t = normalizar(texto);
  let mejor: { codigo: string; largo: number } | null = null;

  const probar = (aguja: string, codigo: string) => {
    const a = normalizar(aguja);
    if (a.length < 2) return;
    // Alias muy cortos (uk, us) solo valen como palabra aislada
    const re = new RegExp(`(^|[^a-z0-9])${a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}($|[^a-z0-9])`, "i");
    if (re.test(t)) {
      // Nos quedamos con la coincidencia más larga: "nueva zelanda" gana a "zelanda"
      if (!mejor || a.length > mejor.largo) mejor = { codigo, largo: a.length };
    }
  };

  for (const [codigo, cfg] of Object.entries(PAISES)) {
    probar(cfg.nombre, codigo);
    if (cfg.nombreLocal) probar(cfg.nombreLocal, codigo);
    for (const alias of ALIAS[codigo] || []) probar(alias, codigo);
  }
  // Alias de países que puedan no estar en PAISES
  for (const [codigo, lista] of Object.entries(ALIAS)) {
    for (const alias of lista) probar(alias, codigo);
  }

  if (!mejor) return null;
  const elegido = mejor as { codigo: string; largo: number };
  const cfg = PAISES[elegido.codigo];
  return {
    codigo: elegido.codigo.toLowerCase(),
    nombre: cfg?.nombre || elegido.codigo,
    bandera: cfg?.bandera || "🌍",
  };
}

/**
 * Palabras que NO son una profesión aunque la regex las capture.
 *
 * "hay ofertas en Dublin" hacía que Guzzi buscara literalmente el puesto
 * "hay ofertas" y no encontrara nada, y entonces dijera que no hay trabajo en
 * Dublín. Si lo que queda tras limpiar no aporta nada, es mejor no filtrar por
 * puesto y enseñar todo lo que haya en esa zona.
 */
const RELLENO = new Set([
  "hay", "ofertas", "oferta", "trabajo", "trabajos", "empleo", "empleos",
  "puesto", "puestos", "vacante", "vacantes", "curro", "curros", "chamba",
  "algo", "cosa", "cosas", "alguna", "alguno", "algun", "de", "en", "para",
  "que", "me", "te", "se", "lo", "la", "el", "un", "una", "unos", "unas",
  "busco", "buscar", "quiero", "necesito", "dame", "muestrame", "ensename",
  "disponible", "disponibles", "libre", "libres", "actuales", "nuevas",
  // Verbos de petición: una usuaria escribió "quiero que me mandes ofertas de
  // lo que sea en Irlanda" y Guzzi buscó literalmente el puesto
  // "mandes ofertas de lo que sea", que no existe.
  "manda", "mandas", "mandes", "mandame", "mandarme", "envia", "envias",
  "envies", "enviame", "enviarme", "pasa", "pases", "pasame", "busca",
  "buscame", "encuentra", "encuentrame", "sea", "cualquier", "cualquiera",
  "todo", "todas", "todos", "toda", "mas", "otras", "otros", "porfa",
  "favor", "gracias", "hola", "por",
]);

/**
 * Formas de decir "me vale cualquier cosa". Cuando el usuario lo dice, no hay
 * que inventarse un puesto: hay que enseñarle lo que haya en esa zona.
 */
const SIN_PREFERENCIA = /\b(lo\s+que\s+sea|cualquier\s+(cosa|trabajo|puesto|oferta)|me\s+da\s+igual|no\s+me\s+importa|da\s+lo\s+mismo|lo\s+que\s+haya|de\s+todo)\b/i;

/**
 * ¿El usuario ha dicho que le vale cualquier trabajo?
 *
 * Importa distinguirlo de "no ha dicho puesto": si alguien escribe "no me
 * importa de lo que trabajar", volver a preguntarle qué puesto quiere es
 * ignorar lo que acaba de decir. En ese caso hay que enseñarle lo que haya.
 */
export function sinPreferenciaDePuesto(texto: string): boolean {
  return SIN_PREFERENCIA.test(texto);
}

/**
 * Limpia el término de búsqueda. Devuelve null si no queda nada útil,
 * que significa "no filtres por puesto, enséñame lo que haya".
 */
export function limpiarTerminoBusqueda(termino: string | null): string | null {
  if (!termino) return null;

  // "lo que sea", "me da igual", "cualquier cosa"... no son un puesto: el
  // usuario está diciendo justo lo contrario, que no tiene preferencia.
  if (SIN_PREFERENCIA.test(termino)) return null;

  const palabras = normalizar(termino).split(/\s+/).filter(Boolean);

  // Se recorta SOLO por los extremos. Quitar el relleno también por dentro
  // rompía los puestos compuestos: "enfermera de urgencias" quedaba en
  // "enfermera urgencias", que ya no casa con el título real de la oferta.
  let ini = 0;
  let fin = palabras.length;
  while (ini < fin && RELLENO.has(palabras[ini])) ini++;
  while (fin > ini && RELLENO.has(palabras[fin - 1])) fin--;

  const limpio = palabras.slice(ini, fin).join(" ").trim();
  if (!limpio || limpio.length < 3) return null;
  // Si lo que queda es solo relleno, no hay puesto que filtrar
  if (limpio.split(/\s+/).every(p => RELLENO.has(p))) return null;
  return limpio;
}
