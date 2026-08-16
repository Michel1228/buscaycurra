/**
 * lib/guzzi/ciudades-pais.ts — De qué país es cada ciudad, y cómo se escribe allí.
 *
 * POR QUÉ EXISTE. Guzzi sabía que "Irlanda" es un país, pero no que París está
 * en Francia. Al pedirle "camarero en París" no detectaba país, se quedaba con
 * el del perfil (España) y devolvía camareros de Madrid. En las pruebas, las 11
 * búsquedas fuera de España acababan enseñando ofertas españolas.
 *
 * Y RESUELVE UNA SEGUNDA COSA. En la base de datos las ciudades vienen como las
 * escribe cada portal: hay 16.263 ofertas en "München" y solo 2.025 en "Munich".
 * Buscando una sola forma se pierden las otras. Cada entrada lleva todas las
 * formas, así que se buscan todas a la vez.
 *
 * No están todas las ciudades del mundo: están las que tienen ofertas de verdad
 * en los 26 países que cubrimos. Si una ciudad no está, no pasa nada — se sigue
 * usando el país del perfil, que es como funcionaba antes.
 */

/** Ciudad -> [código ISO del país, todas las formas de escribirla]. */
const CIUDADES: Record<string, [string, string[]]> = {
  // ── Francia ─────────────────────────────────────────────────────────
  paris: ["FR", ["paris", "parís"]],
  lyon: ["FR", ["lyon"]],
  marsella: ["FR", ["marseille", "marsella"]],
  marseille: ["FR", ["marseille", "marsella"]],
  toulouse: ["FR", ["toulouse"]],
  niza: ["FR", ["nice", "niza"]],
  nice: ["FR", ["nice", "niza"]],
  burdeos: ["FR", ["bordeaux", "burdeos"]],
  bordeaux: ["FR", ["bordeaux", "burdeos"]],
  nantes: ["FR", ["nantes"]],
  lille: ["FR", ["lille"]],
  estrasburgo: ["FR", ["strasbourg", "estrasburgo"]],
  strasbourg: ["FR", ["strasbourg", "estrasburgo"]],

  // ── Alemania ────────────────────────────────────────────────────────
  berlin: ["DE", ["berlin", "berlín"]],
  // 16.263 ofertas en "München" contra 2.025 en "Munich": hay que buscar las dos
  munich: ["DE", ["munchen", "münchen", "munich", "muenchen"]],
  munchen: ["DE", ["munchen", "münchen", "munich", "muenchen"]],
  hamburgo: ["DE", ["hamburg", "hamburgo"]],
  hamburg: ["DE", ["hamburg", "hamburgo"]],
  colonia: ["DE", ["koln", "köln", "cologne", "colonia", "koeln"]],
  koln: ["DE", ["koln", "köln", "cologne", "colonia", "koeln"]],
  cologne: ["DE", ["koln", "köln", "cologne", "colonia", "koeln"]],
  frankfurt: ["DE", ["frankfurt", "fráncfort"]],
  stuttgart: ["DE", ["stuttgart"]],
  dusseldorf: ["DE", ["dusseldorf", "düsseldorf", "duesseldorf"]],
  dresde: ["DE", ["dresden", "dresde"]],
  leipzig: ["DE", ["leipzig"]],
  nuremberg: ["DE", ["nurnberg", "nürnberg", "nuremberg", "nuernberg"]],

  // ── Reino Unido ─────────────────────────────────────────────────────
  londres: ["GB", ["london", "londres"]],
  london: ["GB", ["london", "londres"]],
  manchester: ["GB", ["manchester"]],
  birmingham: ["GB", ["birmingham"]],
  liverpool: ["GB", ["liverpool"]],
  leeds: ["GB", ["leeds"]],
  glasgow: ["GB", ["glasgow"]],
  edimburgo: ["GB", ["edinburgh", "edimburgo"]],
  edinburgh: ["GB", ["edinburgh", "edimburgo"]],
  bristol: ["GB", ["bristol"]],
  sheffield: ["GB", ["sheffield"]],
  cardiff: ["GB", ["cardiff"]],
  belfast: ["GB", ["belfast"]],

  // ── Irlanda ─────────────────────────────────────────────────────────
  dublin: ["IE", ["dublin", "dublín", "baile atha cliath"]],
  cork: ["IE", ["cork"]],
  galway: ["IE", ["galway"]],
  limerick: ["IE", ["limerick"]],

  // ── Italia ──────────────────────────────────────────────────────────
  roma: ["IT", ["roma", "rome"]],
  rome: ["IT", ["roma", "rome"]],
  milan: ["IT", ["milano", "milán", "milan"]],
  milano: ["IT", ["milano", "milán", "milan"]],
  napoles: ["IT", ["napoli", "nápoles", "naples", "napoles"]],
  napoli: ["IT", ["napoli", "nápoles", "naples", "napoles"]],
  turin: ["IT", ["torino", "turín", "turin"]],
  torino: ["IT", ["torino", "turín", "turin"]],
  florencia: ["IT", ["firenze", "florencia", "florence"]],
  firenze: ["IT", ["firenze", "florencia", "florence"]],
  venecia: ["IT", ["venezia", "venecia", "venice"]],
  bolonia: ["IT", ["bologna", "bolonia"]],
  bologna: ["IT", ["bologna", "bolonia"]],

  // ── Portugal ────────────────────────────────────────────────────────
  lisboa: ["PT", ["lisboa", "lisbon"]],
  lisbon: ["PT", ["lisboa", "lisbon"]],
  oporto: ["PT", ["porto", "oporto"]],
  porto: ["PT", ["porto", "oporto"]],
  braga: ["PT", ["braga"]],
  faro: ["PT", ["faro"]],
  coimbra: ["PT", ["coimbra"]],

  // ── Países Bajos ────────────────────────────────────────────────────
  amsterdam: ["NL", ["amsterdam", "ámsterdam"]],
  rotterdam: ["NL", ["rotterdam"]],
  lahaya: ["NL", ["den haag", "the hague", "la haya"]],
  utrecht: ["NL", ["utrecht"]],
  eindhoven: ["NL", ["eindhoven"]],

  // ── Bélgica ─────────────────────────────────────────────────────────
  bruselas: ["BE", ["brussel", "bruxelles", "brussels", "bruselas"]],
  brussels: ["BE", ["brussel", "bruxelles", "brussels", "bruselas"]],
  amberes: ["BE", ["antwerpen", "anvers", "antwerp", "amberes"]],
  gante: ["BE", ["gent", "gand", "ghent", "gante"]],
  lieja: ["BE", ["liege", "liège", "luik", "lieja"]],

  // ── Suiza ───────────────────────────────────────────────────────────
  // "Zurich" a secas también casa con "Lake Zurich, Illinois". Con el país
  // puesto a CH deja de colarse.
  zurich: ["CH", ["zurich", "zürich", "zuerich"]],
  ginebra: ["CH", ["geneve", "genève", "geneva", "ginebra", "genf"]],
  geneva: ["CH", ["geneve", "genève", "geneva", "ginebra", "genf"]],
  basilea: ["CH", ["basel", "basilea", "bale"]],
  basel: ["CH", ["basel", "basilea", "bale"]],
  berna: ["CH", ["bern", "berna", "berne"]],
  lausana: ["CH", ["lausanne", "lausana"]],
  lugano: ["CH", ["lugano"]],

  // ── Austria ─────────────────────────────────────────────────────────
  viena: ["AT", ["wien", "viena", "vienna"]],
  vienna: ["AT", ["wien", "viena", "vienna"]],
  graz: ["AT", ["graz"]],
  salzburgo: ["AT", ["salzburg", "salzburgo"]],
  innsbruck: ["AT", ["innsbruck"]],
  linz: ["AT", ["linz"]],

  // ── Nórdicos ────────────────────────────────────────────────────────
  estocolmo: ["SE", ["stockholm", "estocolmo"]],
  stockholm: ["SE", ["stockholm", "estocolmo"]],
  gotemburgo: ["SE", ["goteborg", "göteborg", "gothenburg", "gotemburgo"]],
  malmo: ["SE", ["malmo", "malmö"]],
  oslo: ["NO", ["oslo"]],
  bergen: ["NO", ["bergen"]],
  trondheim: ["NO", ["trondheim"]],
  stavanger: ["NO", ["stavanger"]],
  copenhague: ["DK", ["kobenhavn", "københavn", "copenhagen", "copenhague"]],
  copenhagen: ["DK", ["kobenhavn", "københavn", "copenhagen", "copenhague"]],
  aarhus: ["DK", ["aarhus", "arhus"]],
  helsinki: ["FI", ["helsinki", "helsingfors"]],
  tampere: ["FI", ["tampere"]],
  espoo: ["FI", ["espoo"]],

  // ── Polonia y centro de Europa ──────────────────────────────────────
  varsovia: ["PL", ["warszawa", "warsaw", "varsovia"]],
  warsaw: ["PL", ["warszawa", "warsaw", "varsovia"]],
  cracovia: ["PL", ["krakow", "kraków", "cracow", "cracovia"]],
  krakow: ["PL", ["krakow", "kraków", "cracow", "cracovia"]],
  wroclaw: ["PL", ["wroclaw", "wrocław", "breslau"]],
  poznan: ["PL", ["poznan", "poznań"]],
  gdansk: ["PL", ["gdansk", "gdańsk"]],
  praga: ["CZ", ["praha", "prague", "praga", "prag"]],
  prague: ["CZ", ["praha", "prague", "praga", "prag"]],
  brno: ["CZ", ["brno"]],
  budapest: ["HU", ["budapest"]],
  bucarest: ["RO", ["bucuresti", "bucurești", "bucharest", "bucarest"]],
  cluj: ["RO", ["cluj", "cluj-napoca"]],
  atenas: ["GR", ["athina", "athens", "atenas"]],
  athens: ["GR", ["athina", "athens", "atenas"]],
  tesalonica: ["GR", ["thessaloniki", "tesalonica", "salonica"]],
  luxemburgo: ["LU", ["luxembourg", "luxemburgo", "letzebuerg"]],

  // ── América del Norte ───────────────────────────────────────────────
  "nueva york": ["US", ["new york", "nueva york", "nyc"]],
  "new york": ["US", ["new york", "nueva york", "nyc"]],
  "los angeles": ["US", ["los angeles", "ángeles"]],
  chicago: ["US", ["chicago"]],
  miami: ["US", ["miami"]],
  houston: ["US", ["houston"]],
  boston: ["US", ["boston"]],
  seattle: ["US", ["seattle"]],
  "san francisco": ["US", ["san francisco"]],
  toronto: ["CA", ["toronto"]],
  montreal: ["CA", ["montreal", "montréal"]],
  vancouver: ["CA", ["vancouver"]],
  calgary: ["CA", ["calgary"]],
  ottawa: ["CA", ["ottawa"]],
  quebec: ["CA", ["quebec", "québec"]],
  "ciudad de mexico": ["MX", ["ciudad de mexico", "cdmx", "mexico city"]],
  guadalajara: ["MX", ["guadalajara"]],
  monterrey: ["MX", ["monterrey"]],

  // ── Oceanía ─────────────────────────────────────────────────────────
  sidney: ["AU", ["sydney", "sidney"]],
  sydney: ["AU", ["sydney", "sidney"]],
  melbourne: ["AU", ["melbourne"]],
  brisbane: ["AU", ["brisbane"]],
  perth: ["AU", ["perth"]],
  adelaida: ["AU", ["adelaide", "adelaida"]],
  canberra: ["AU", ["canberra"]],
  auckland: ["NZ", ["auckland"]],
  wellington: ["NZ", ["wellington"]],
  christchurch: ["NZ", ["christchurch"]],

  // ── Asia y Oriente Medio ────────────────────────────────────────────
  tokio: ["JP", ["tokyo", "tokio", "東京"]],
  tokyo: ["JP", ["tokyo", "tokio", "東京"]],
  osaka: ["JP", ["osaka", "大阪"]],
  kioto: ["JP", ["kyoto", "kioto"]],
  yokohama: ["JP", ["yokohama"]],
  singapur: ["SG", ["singapore", "singapur"]],
  singapore: ["SG", ["singapore", "singapur"]],
  dubai: ["AE", ["dubai", "dubái"]],
  "abu dabi": ["AE", ["abu dhabi", "abu dabi"]],
  bombay: ["IN", ["mumbai", "bombay"]],
  mumbai: ["IN", ["mumbai", "bombay"]],
  bangalore: ["IN", ["bangalore", "bengaluru"]],
  delhi: ["IN", ["delhi", "new delhi", "nueva delhi"]],

  // ── Brasil ──────────────────────────────────────────────────────────
  "sao paulo": ["BR", ["sao paulo", "são paulo"]],
  "rio de janeiro": ["BR", ["rio de janeiro"]],
  brasilia: ["BR", ["brasilia", "brasília"]],
};

/** Quita acentos y pasa a minúsculas. */
function normalizar(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
}

/**
 * ¿De qué país es esta ciudad? Devuelve el código ISO, o null si no se sabe.
 *
 * Devolver null es una respuesta legítima: quiere decir "no me consta", y quien
 * llama sigue con el país del perfil. Nunca se adivina.
 */
export function paisDeCiudad(ciudad: string): string | null {
  const c = normalizar(ciudad);
  if (!c) return null;
  const directa = CIUDADES[c];
  if (directa) return directa[0];

  // "Palma de Mallorca", "Frankfurt am Main": se prueba con la primera palabra
  // solo si tiene cuerpo suficiente para no confundirse ("san", "los"...).
  const primera = c.split(/[\s,]+/)[0];
  if (primera.length >= 5 && CIUDADES[primera]) return CIUDADES[primera][0];
  return null;
}

/**
 * Todas las formas de escribir esta ciudad, para buscarlas a la vez.
 *
 * Si no está en la tabla, se devuelve tal cual: el comportamiento de siempre.
 */
export function aliasCiudad(ciudad: string): string[] {
  const c = normalizar(ciudad);
  if (!c) return [];
  const entrada = CIUDADES[c];
  if (!entrada) return [c];
  // El nombre tal y como lo escribió el usuario va incluido siempre.
  return [...new Set([c, ...entrada[1].map(v => v.toLowerCase())])];
}
