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
 * en los países que cubrimos. Si una ciudad no está, no pasa nada — se sigue
 * usando el país del perfil, que es como funcionaba antes.
 */

/**
 * Ciudad -> [código del país tal y como está en la base de datos, formas de escribirla].
 *
 * OJO CON EL CÓDIGO. Es el que usa la columna `country`, que no siempre es el
 * ISO oficial: el Reino Unido está guardado como "uk", no como "gb". Poniendo
 * el ISO correcto, las 248.339 ofertas británicas quedaban invisibles — pedir
 * trabajo en Londres devolvía cero teniendo 43.579 ofertas allí.
 */
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
  londres: ["UK", ["london", "londres"]],
  london: ["UK", ["london", "londres"]],
  manchester: ["UK", ["manchester"]],
  birmingham: ["UK", ["birmingham"]],
  liverpool: ["UK", ["liverpool"]],
  leeds: ["UK", ["leeds"]],
  glasgow: ["UK", ["glasgow"]],
  edimburgo: ["UK", ["edinburgh", "edimburgo"]],
  edinburgh: ["UK", ["edinburgh", "edimburgo"]],
  bristol: ["UK", ["bristol"]],
  sheffield: ["UK", ["sheffield"]],
  cardiff: ["UK", ["cardiff"]],
  belfast: ["UK", ["belfast"]],

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

  // ── México ──────────────────────────────────────────────────────────
  // Así vienen en las ofertas: "Guadalajara, Jalisco", "Miguel Hidalgo, Ciudad
  // de México" (la alcaldía delante). Mirado en 600 ofertas el 5 nov 2026.
  "ciudad de mexico": ["MX", ["ciudad de mexico", "cdmx", "mexico city", "distrito federal"]],
  cdmx: ["MX", ["ciudad de mexico", "cdmx", "mexico city", "distrito federal"]],
  guadalajara: ["MX", ["guadalajara"]],
  zapopan: ["MX", ["zapopan"]],
  monterrey: ["MX", ["monterrey"]],
  puebla: ["MX", ["puebla"]],
  queretaro: ["MX", ["queretaro", "querétaro"]],
  hermosillo: ["MX", ["hermosillo"]],
  toluca: ["MX", ["toluca"]],
  merida: ["MX", ["merida", "mérida"]],
  leon: ["MX", ["leon", "león"]],
  aguascalientes: ["MX", ["aguascalientes"]],
  culiacan: ["MX", ["culiacan", "culiacán"]],
  tijuana: ["MX", ["tijuana"]],
  chihuahua: ["MX", ["chihuahua"]],
  morelia: ["MX", ["morelia"]],
  cancun: ["MX", ["cancun", "cancún"]],
  saltillo: ["MX", ["saltillo"]],
  "san luis potosi": ["MX", ["san luis potosi", "san luis potosí"]],
  "ciudad juarez": ["MX", ["ciudad juarez", "ciudad juárez", "juarez", "juárez"]],

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
  // India: las que más ofertas tienen en la base el 6 nov 2026.
  bengaluru: ["IN", ["bangalore", "bengaluru"]],
  hyderabad: ["IN", ["hyderabad"]],
  chennai: ["IN", ["chennai", "madras"]],
  madras: ["IN", ["chennai", "madras"]],
  ahmedabad: ["IN", ["ahmedabad"]],
  pune: ["IN", ["pune"]],
  kolkata: ["IN", ["kolkata", "calcutta", "calcuta"]],
  calcuta: ["IN", ["kolkata", "calcutta", "calcuta"]],
  "new delhi": ["IN", ["delhi", "new delhi", "nueva delhi"]],
  "nueva delhi": ["IN", ["delhi", "new delhi", "nueva delhi"]],

  // ── Sudáfrica ───────────────────────────────────────────────────────
  // Las que más ofertas tienen en la base el 6 nov 2026. "East London" va
  // entera: "london" es Reino Unido o Canadá (HOMONIMAS) y "east" es corta
  // para la búsqueda por primera palabra.
  pretoria: ["ZA", ["pretoria"]],
  "cape town": ["ZA", ["cape town", "ciudad del cabo"]],
  "ciudad del cabo": ["ZA", ["cape town", "ciudad del cabo"]],
  durban: ["ZA", ["durban"]],
  johannesburg: ["ZA", ["johannesburg", "johannesburgo"]],
  johannesburgo: ["ZA", ["johannesburg", "johannesburgo"]],
  "east london": ["ZA", ["east london"]],
  bloemfontein: ["ZA", ["bloemfontein"]],

  // ── Brasil ──────────────────────────────────────────────────────────
  "sao paulo": ["BR", ["sao paulo", "são paulo"]],
  "rio de janeiro": ["BR", ["rio de janeiro"]],
  brasilia: ["BR", ["brasilia", "brasília"]],
  // Las que más ofertas tenían el 5 nov 2026, escritas como vienen.
  "belo horizonte": ["BR", ["belo horizonte"]],
  curitiba: ["BR", ["curitiba"]],
  "porto alegre": ["BR", ["porto alegre"]],
  salvador: ["BR", ["salvador"]],
  recife: ["BR", ["recife"]],
  fortaleza: ["BR", ["fortaleza"]],
  manaus: ["BR", ["manaus"]],
  belem: ["BR", ["belem", "belém"]],
  goiania: ["BR", ["goiania", "goiânia"]],
  campinas: ["BR", ["campinas"]],
  florianopolis: ["BR", ["florianopolis", "florianópolis"]],
  "campo grande": ["BR", ["campo grande"]],
  maceio: ["BR", ["maceio", "maceió"]],
  "sao luis": ["BR", ["sao luis", "são luís", "sao luís"]],
  "joao pessoa": ["BR", ["joao pessoa", "joão pessoa"]],
  vitoria: ["BR", ["vitoria", "vitória"]],

  // ── El resto de Latinoamérica (5 nov 2026) ──────────────────────────
  // De estos países todavía no tenemos ofertas, pero hay que saber de dónde
  // es la ciudad: "camarera en Lima" se buscaba en España y devolvía ofertas
  // de toda España. Ahora se sabe que es Perú, y se dice lo que hay allí.
  lima: ["PE", ["lima"]],
  arequipa: ["PE", ["arequipa"]],
  cusco: ["PE", ["cusco", "cuzco"]],
  cuzco: ["PE", ["cusco", "cuzco"]],
  chiclayo: ["PE", ["chiclayo"]],
  piura: ["PE", ["piura"]],
  bogota: ["CO", ["bogota", "bogotá"]],
  medellin: ["CO", ["medellin", "medellín"]],
  cali: ["CO", ["cali"]],
  barranquilla: ["CO", ["barranquilla"]],
  bucaramanga: ["CO", ["bucaramanga"]],
  "buenos aires": ["AR", ["buenos aires"]],
  rosario: ["AR", ["rosario"]],
  mendoza: ["AR", ["mendoza"]],
  "la plata": ["AR", ["la plata"]],
  "mar del plata": ["AR", ["mar del plata"]],
  valparaiso: ["CL", ["valparaiso", "valparaíso"]],
  "vina del mar": ["CL", ["vina del mar", "viña del mar"]],
  antofagasta: ["CL", ["antofagasta"]],
  caracas: ["VE", ["caracas"]],
  maracaibo: ["VE", ["maracaibo"]],
  barquisimeto: ["VE", ["barquisimeto"]],
  quito: ["EC", ["quito"]],
  guayaquil: ["EC", ["guayaquil"]],
  montevideo: ["UY", ["montevideo"]],
  asuncion: ["PY", ["asuncion", "asunción"]],
  cochabamba: ["BO", ["cochabamba"]],
  "santo domingo": ["DO", ["santo domingo"]],
  "ciudad de guatemala": ["GT", ["ciudad de guatemala"]],
  tegucigalpa: ["HN", ["tegucigalpa"]],
  "san pedro sula": ["HN", ["san pedro sula"]],
  "san salvador": ["SV", ["san salvador"]],
  managua: ["NI", ["managua"]],
  "la habana": ["CU", ["la habana", "habana"]],
  habana: ["CU", ["la habana", "habana"]],
  "ciudad de panama": ["PA", ["ciudad de panama", "ciudad de panamá"]],
};

/**
 * CIUDADES QUE SE LLAMAN IGUAL EN VARIOS PAÍSES.
 *
 * Hay 360 ofertas en Guadalajara (España) y la tabla de arriba decía que
 * Guadalajara es de México: un español que buscaba en su Guadalajara acababa
 * mirando ofertas de Jalisco, con un aviso de "he cambiado la búsqueda". Con
 * Latinoamérica dentro, pasa con muchas más: Mérida, León, Córdoba, Valencia,
 * Cartagena, Vitoria...
 *
 * La regla es la de cualquier persona: si la ciudad existe en el país donde ya
 * estás buscando, es esa. Solo si no existe allí se va a la primera de la
 * lista, que es la que tiene más ofertas o la más conocida.
 */
const HOMONIMAS: Record<string, string[]> = {
  guadalajara: ["MX", "ES"],
  merida: ["MX", "ES", "VE"],
  leon: ["MX", "ES"],
  cordoba: ["ES", "AR", "MX"],
  salamanca: ["ES", "MX"],
  toledo: ["ES", "US", "BR"],
  valencia: ["ES", "VE"],
  cartagena: ["ES", "CO"],
  santiago: ["CL", "ES"],
  granada: ["ES", "NI"],
  barcelona: ["ES", "VE"],
  trujillo: ["PE", "ES", "VE"],
  vitoria: ["ES", "BR"],
  "santa cruz": ["BO", "ES"],
  cuenca: ["ES", "EC"],
  "la paz": ["BO", "MX"],
  "san jose": ["US", "CR"],
  london: ["UK", "CA"],
  londres: ["UK", "CA"],
  // East London es también la parte este de Londres: quien ya busca en el
  // Reino Unido se queda allí (6 nov 2026).
  "east london": ["ZA", "UK"],
  perth: ["AU", "UK"],
  birmingham: ["UK", "US"],
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
export function paisDeCiudad(ciudad: string, paisActual?: string): string | null {
  const c = normalizar(ciudad);
  if (!c) return null;

  // "Mérida, Yucatán" o "Vitoria-Gasteiz": vale con la primera palabra.
  const primeraHom = c.split(/[\s,\-]+/)[0];
  const varios = HOMONIMAS[c] ?? (primeraHom.length >= 5 ? HOMONIMAS[primeraHom] : undefined);
  if (varios) {
    const actual = (paisActual || "").trim().toUpperCase();
    return actual && varios.includes(actual) ? actual : varios[0];
  }

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
