/**
 * lib/job-search/ciudad-busqueda.ts — Cómo se busca la ciudad que escribe la persona.
 *
 * EL FALLO (comprobado en producción el 6 nov 2026). En la base, la ciudad se
 * compara con translate(city, <tildes españolas>, <sin tildes>), que es la
 * expresión del índice trigram (idx_joblisting_city_unaccent_trgm): solo
 * quita las tildes del español. Y a lo que escribía la persona se le quitaban
 * TODAS. La base guarda "São Paulo, Estado de São Paulo", así que "São Paulo"
 * se buscaba como "Sao Paulo" y no casaba: vendedor en Brasil daba 353 con
 * "Paulo" y 0 con "São Paulo" o con "Sao Paulo". Lo mismo con Košice, Žilina,
 * Gdańsk o Malmö.
 *
 * EL ARREGLO, SIN TOCAR EL ÍNDICE NI LA BASE. La ciudad se busca en hasta tres
 * formas a la vez, todas con la misma expresión indexada (un OR):
 *   1. Como la escriben las ofertas, si es una de las ciudades de las fichas de
 *      lib/paises.ts: "Sao Paulo" → "São Paulo", "Kosice" → "Košice".
 *   2. Como la escribió la persona, quitando SOLO las tildes que quita la base.
 *   3. Sin ninguna tilde, que es lo que se buscaba antes: así no se pierde nada
 *      de lo que ya se encontraba (ofertas que escriben "Sao Paulo" sin tilde).
 * Las que solo se diferencian en mayúsculas se quedan en una: ILIKE ya no las
 * distingue. Para una ciudad española queda una sola forma, como antes, y la
 * búsqueda de España no se alarga.
 *
 * Lo que NO arregla: una ciudad con tildes que no son del español, que no está
 * en ninguna ficha y que se escribe sin ellas ("Gdansk" frente a "Gdańsk").
 * Para eso habría que cambiar el índice.
 */
import { PAISES } from "@/lib/paises";

/** Las tildes que quita translate() en la base: las mismas que el índice. */
export const ACCENT_FROM = "áéíóúñüÁÉÍÓÚÑÜàèìòùÀÈÌÒÙ";
export const ACCENT_TO   = "aeiounuAEIOUNUaeiouAEIOU";

/** Lo mismo que hace translate() en la base, en JavaScript: solo las tildes del español. */
export function quitarTildesComoLaBase(s: string): string {
  let r = "";
  for (const ch of s.normalize("NFC")) {
    const i = ACCENT_FROM.indexOf(ch);
    r += i >= 0 ? ACCENT_TO[i] : ch;
  }
  return r;
}

function sinNingunaTilde(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

// "kosice" → "Košice": cada ciudad de las fichas de país, por su forma sin tildes.
const CIUDAD_DE_LAS_FICHAS = new Map<string, string>();
for (const pais of Object.values(PAISES)) {
  for (const ciudad of pais.ciudades) {
    const clave = sinNingunaTilde(ciudad).toLowerCase();
    if (!CIUDAD_DE_LAS_FICHAS.has(clave)) CIUDAD_DE_LAS_FICHAS.set(clave, ciudad);
  }
}

/**
 * LOS NOMBRES CORTOS DE LAS CAPITALES (7 nov 2026, prueba desde Colombia y
 * México). "CDMX", "DF" o "Distrito Federal" daban 0 ofertas, y Ciudad de
 * México tiene más de 5.000: en la base se guardan como "Cuauhtémoc, Ciudad de
 * México" y ninguna dice CDMX ni DF. "Bogotá D.C." también daba 0, porque se
 * guarda "Bogotá DC" (sin puntos). Se busca por el nombre con el que se guardan.
 * La clave va sin tildes, en minúsculas y sin puntos: "D.F." → "df".
 */
const ALIAS_DE_CIUDAD: Record<string, string> = {
  "cdmx": "Ciudad de México",
  "df": "Ciudad de México",
  "distrito federal": "Ciudad de México",
  "mexico df": "Ciudad de México",
  "ciudad de mexico df": "Ciudad de México",
  "bogota dc": "Bogotá",
  "bogota d c": "Bogotá",
  "santa fe de bogota": "Bogotá",
};

/** "CDMX" → "Ciudad de México", "Bogotá D.C." → "Bogotá"; lo demás, tal cual. */
export function ciudadSinAlias(escrito: string): string {
  const texto = (escrito || "").trim();
  const clave = sinNingunaTilde(texto).toLowerCase().replace(/\./g, "").replace(/\s+/g, " ").trim();
  return ALIAS_DE_CIUDAD[clave] ?? texto;
}

/** Las formas en que se busca la ciudad escrita (una, dos o tres). */
export function formasDeCiudad(escrito: string): string[] {
  const texto = ciudadSinAlias(escrito);
  if (!texto) return [];
  const candidatas = [
    CIUDAD_DE_LAS_FICHAS.get(sinNingunaTilde(texto).toLowerCase()),
    texto,
    sinNingunaTilde(texto),
  ];
  const vistas = new Set<string>();
  const formas: string[] = [];
  for (const c of candidatas) {
    if (!c) continue;
    const forma = quitarTildesComoLaBase(c);
    const clave = forma.toLowerCase();
    if (vistas.has(clave)) continue;
    vistas.add(clave);
    formas.push(forma);
  }
  return formas;
}

/**
 * La condición SQL para `n` formas, que van en los parámetros $desde, $desde+1...
 * Ciudad o provincia, con la misma expresión que el índice.
 */
export function condicionCiudad(desde: number, n: number): string {
  const partes: string[] = [];
  for (let i = desde; i < desde + n; i++) {
    for (const col of ["city", "province"]) {
      partes.push(`translate(${col}, '${ACCENT_FROM}', '${ACCENT_TO}') ILIKE $${i}`);
    }
  }
  return `(${partes.join(" OR ")})`;
}
