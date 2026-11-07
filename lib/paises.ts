/**
 * Configuración de países europeos para BuscayCurra
 * Monedas, idiomas, formatos, y URLs SEO por país
 */

export interface PaisConfig {
  codigo: string;        // ISO 3166-1 alpha-2 (ES, DE, FR...)
  nombre: string;        // Nombre en español
  nombreLocal: string;   // Nombre en idioma local
  moneda: string;        // Código ISO 4217 (EUR, SEK, DKK...)
  simboloMoneda: string; // Símbolo (€, kr, zł...)
  posicionSimbolo: "antes" | "despues"; // ¿El símbolo va antes o después?
  idioma: string;        // Código ISO 639-1 (es, de, fr...)
  bandera: string;       // Emoji bandera
  salarioMinimo: number; // Salario mínimo mensual en moneda local
  salarioMedio: number;  // Salario medio mensual en moneda local
  tasaCambioEUR: number; // Tasa de cambio respecto al EUR
  formatoMiles: string;  // Separador de miles
  formatoDecimal: string;// Separador decimal
  ciudades: string[];    // Principales ciudades
  keywordsLaborales: string[]; // Keywords de búsqueda en idioma local
  slug: string;                // URL amigable en español (ej: estados-unidos)
}

export const PAISES: Record<string, PaisConfig> = {
  ES: {
    codigo: "ES",
    nombre: "España",
    nombreLocal: "España",
    moneda: "EUR",
    simboloMoneda: "€",
    posicionSimbolo: "despues",
    idioma: "es",
    bandera: "🇪🇸",
    salarioMinimo: 1184,
    salarioMedio: 2100,
    tasaCambioEUR: 1,
    formatoMiles: ".",
    formatoDecimal: ",",
    ciudades: ["Madrid", "Barcelona", "Valencia", "Sevilla", "Bilbao", "Málaga", "Zaragoza"],
    keywordsLaborales: ["camarero", "programador", "administrativo", "comercial", "enfermero"],
    slug: "espana",
  },
  DE: {
    codigo: "DE",
    nombre: "Alemania",
    nombreLocal: "Deutschland",
    moneda: "EUR",
    simboloMoneda: "€",
    posicionSimbolo: "despues",
    idioma: "de",
    bandera: "🇩🇪",
    salarioMinimo: 2222,
    salarioMedio: 4200,
    tasaCambioEUR: 1,
    formatoMiles: ".",
    formatoDecimal: ",",
    ciudades: ["Berlin", "München", "Hamburg", "Frankfurt", "Köln", "Stuttgart", "Düsseldorf"],
    keywordsLaborales: ["Kellner", "Programmierer", "Bürokaufmann", "Vertrieb", "Krankenpfleger"],
    slug: "alemania",
  },
  FR: {
    codigo: "FR",
    nombre: "Francia",
    nombreLocal: "France",
    moneda: "EUR",
    simboloMoneda: "€",
    posicionSimbolo: "despues",
    idioma: "fr",
    bandera: "🇫🇷",
    salarioMinimo: 1802,
    salarioMedio: 3500,
    tasaCambioEUR: 1,
    formatoMiles: " ",
    formatoDecimal: ",",
    ciudades: ["Paris", "Lyon", "Marseille", "Toulouse", "Bordeaux", "Lille", "Nantes"],
    keywordsLaborales: ["serveur", "développeur", "administratif", "commercial", "infirmier"],
    slug: "francia",
  },
  IT: {
    codigo: "IT",
    nombre: "Italia",
    nombreLocal: "Italia",
    moneda: "EUR",
    simboloMoneda: "€",
    posicionSimbolo: "despues",
    idioma: "it",
    bandera: "🇮🇹",
    salarioMinimo: 1200,
    salarioMedio: 2500,
    tasaCambioEUR: 1,
    formatoMiles: ".",
    formatoDecimal: ",",
    ciudades: ["Roma", "Milano", "Napoli", "Torino", "Firenze", "Bologna", "Venezia"],
    keywordsLaborales: ["cameriere", "programmatore", "amministrativo", "commerciale", "infermiere"],
    slug: "italia",
  },
  PT: {
    codigo: "PT",
    nombre: "Portugal",
    nombreLocal: "Portugal",
    moneda: "EUR",
    simboloMoneda: "€",
    posicionSimbolo: "despues",
    idioma: "pt",
    bandera: "🇵🇹",
    salarioMinimo: 1020,
    salarioMedio: 1600,
    tasaCambioEUR: 1,
    formatoMiles: ".",
    formatoDecimal: ",",
    ciudades: ["Lisboa", "Porto", "Braga", "Coimbra", "Faro", "Aveiro", "Setúbal"],
    keywordsLaborales: ["empregado", "programador", "administrativo", "comercial", "enfermeiro"],
    slug: "portugal",
  },
  NL: {
    codigo: "NL",
    nombre: "Países Bajos",
    nombreLocal: "Nederland",
    moneda: "EUR",
    simboloMoneda: "€",
    posicionSimbolo: "despues",
    idioma: "nl",
    bandera: "🇳🇱",
    salarioMinimo: 2191,
    salarioMedio: 3800,
    tasaCambioEUR: 1,
    formatoMiles: ".",
    formatoDecimal: ",",
    ciudades: ["Amsterdam", "Rotterdam", "Den Haag", "Utrecht", "Eindhoven", "Groningen"],
    keywordsLaborales: ["ober", "programmeur", "administratief", "verkoper", "verpleegkundige"],
    slug: "paises-bajos",
  },
  PL: {
    codigo: "PL",
    nombre: "Polonia",
    nombreLocal: "Polska",
    moneda: "PLN",
    simboloMoneda: "zł",
    posicionSimbolo: "despues",
    idioma: "pl",
    bandera: "🇵🇱",
    salarioMinimo: 4666,
    salarioMedio: 8000,
    tasaCambioEUR: 4.32,
    formatoMiles: " ",
    formatoDecimal: ",",
    ciudades: ["Warszawa", "Kraków", "Wrocław", "Gdańsk", "Poznań", "Łódź"],
    keywordsLaborales: ["kelner", "programista", "administracyjny", "sprzedawca", "pielęgniarka"],
    slug: "polonia",
  },
  SE: {
    codigo: "SE",
    nombre: "Suecia",
    nombreLocal: "Sverige",
    moneda: "SEK",
    simboloMoneda: "kr",
    posicionSimbolo: "despues",
    idioma: "sv",
    bandera: "🇸🇪",
    salarioMinimo: 22000,
    salarioMedio: 38000,
    tasaCambioEUR: 11.32,
    formatoMiles: " ",
    formatoDecimal: ",",
    ciudades: ["Stockholm", "Göteborg", "Malmö", "Uppsala", "Linköping", "Örebro"],
    keywordsLaborales: ["servitör", "programmerare", "administratör", "säljare", "sjuksköterska"],
    slug: "suecia",
  },
  DK: {
    codigo: "DK",
    nombre: "Dinamarca",
    nombreLocal: "Danmark",
    moneda: "DKK",
    simboloMoneda: "kr",
    posicionSimbolo: "despues",
    idioma: "da",
    bandera: "🇩🇰",
    salarioMinimo: 24000,
    salarioMedio: 42000,
    tasaCambioEUR: 7.46,
    formatoMiles: ".",
    formatoDecimal: ",",
    ciudades: ["København", "Aarhus", "Odense", "Aalborg", "Esbjerg"],
    keywordsLaborales: ["tjener", "programmør", "administrativ", "sælger", "sygeplejerske"],
    slug: "dinamarca",
  },
  NO: {
    codigo: "NO",
    nombre: "Noruega",
    nombreLocal: "Norge",
    moneda: "NOK",
    simboloMoneda: "kr",
    posicionSimbolo: "despues",
    idioma: "no",
    bandera: "🇳🇴",
    salarioMinimo: 28000,
    salarioMedio: 48000,
    tasaCambioEUR: 11.80,
    formatoMiles: " ",
    formatoDecimal: ",",
    ciudades: ["Oslo", "Bergen", "Trondheim", "Stavanger", "Tromsø"],
    keywordsLaborales: ["servitør", "programmerer", "administrativ", "selger", "sykepleier"],
    slug: "noruega",
  },
  FI: {
    codigo: "FI",
    nombre: "Finlandia",
    nombreLocal: "Suomi",
    moneda: "EUR",
    simboloMoneda: "€",
    posicionSimbolo: "despues",
    idioma: "fi",
    bandera: "🇫🇮",
    salarioMinimo: 1800,
    salarioMedio: 3500,
    tasaCambioEUR: 1,
    formatoMiles: " ",
    formatoDecimal: ",",
    ciudades: ["Helsinki", "Espoo", "Tampere", "Turku", "Oulu"],
    keywordsLaborales: ["tarjoilija", "ohjelmoija", "toimistotyöntekijä", "myyjä", "sairaanhoitaja"],
    slug: "finlandia",
  },
  IE: {
    codigo: "IE",
    nombre: "Irlanda",
    nombreLocal: "Ireland",
    moneda: "EUR",
    simboloMoneda: "€",
    posicionSimbolo: "antes",
    idioma: "en",
    bandera: "🇮🇪",
    salarioMinimo: 2340,
    salarioMedio: 4000,
    tasaCambioEUR: 1,
    formatoMiles: ",",
    formatoDecimal: ".",
    ciudades: ["Dublin", "Cork", "Galway", "Limerick", "Waterford"],
    keywordsLaborales: ["waiter", "developer", "administrator", "sales", "nurse"],
    slug: "irlanda",
  },
  // Japón — añadido el 7 ago 2026. El visado SSW (特定技能) cubre 19 sectores
  // con escasez de mano de obra (cuidados, hostelería, construcción, limpieza,
  // agricultura, transporte) y NO exige título universitario: encaja de lleno
  // con el perfil de la app. El gobierno se ha fijado 820.000 trabajadores
  // extranjeros entre 2024 y 2028. Salarios del National Tax Agency 2026.
  JP: {
    codigo: "JP",
    nombre: "Japón",
    nombreLocal: "日本",
    moneda: "JPY",
    simboloMoneda: "¥",
    posicionSimbolo: "antes",
    idioma: "ja",
    bandera: "🇯🇵",
    salarioMinimo: 194000,   // 1.121 ¥/hora de media nacional × 40h × 4,33 semanas
    salarioMedio: 398000,    // 4,78 M ¥/año
    tasaCambioEUR: 165,
    formatoMiles: ",",
    formatoDecimal: ".",
    ciudades: ["Tokyo", "Osaka", "Nagoya", "Yokohama", "Fukuoka", "Sapporo", "Kyoto"],
    keywordsLaborales: ["caregiver", "hotel staff", "construction", "food service", "cleaning"],
    slug: "japon",
  },
  // Singapur — se trabaja en inglés y ya teníamos 2.245 ofertas suyas sin
  // haberlo buscado. No hay salario mínimo legal: se usa el "living wage"
  // de referencia (2.906 S$) como suelo orientativo.
  SG: {
    codigo: "SG",
    nombre: "Singapur",
    nombreLocal: "Singapore",
    moneda: "SGD",
    simboloMoneda: "S$",
    posicionSimbolo: "antes",
    idioma: "en",
    bandera: "🇸🇬",
    salarioMinimo: 2906,
    salarioMedio: 5800,
    tasaCambioEUR: 1.42,
    formatoMiles: ",",
    formatoDecimal: ".",
    ciudades: ["Singapore", "Jurong", "Tampines", "Woodlands", "Changi"],
    keywordsLaborales: ["waiter", "nurse", "engineer", "sales", "logistics"],
    slug: "singapur",
  },
  BE: {
    codigo: "BE",
    nombre: "Bélgica",
    nombreLocal: "België",
    moneda: "EUR",
    simboloMoneda: "€",
    posicionSimbolo: "despues",
    idioma: "nl",
    bandera: "🇧🇪",
    salarioMinimo: 2097,
    salarioMedio: 3700,
    tasaCambioEUR: 1,
    formatoMiles: ".",
    formatoDecimal: ",",
    ciudades: ["Brussel", "Antwerpen", "Gent", "Liège", "Brugge"],
    keywordsLaborales: ["ober", "programmeur", "administratief", "verkoper", "verpleegkundige"],
    slug: "belgica",
  },
  AT: {
    codigo: "AT",
    nombre: "Austria",
    nombreLocal: "Österreich",
    moneda: "EUR",
    simboloMoneda: "€",
    posicionSimbolo: "despues",
    idioma: "de",
    bandera: "🇦🇹",
    salarioMinimo: 2000,
    salarioMedio: 3600,
    tasaCambioEUR: 1,
    formatoMiles: ".",
    formatoDecimal: ",",
    ciudades: ["Wien", "Graz", "Linz", "Salzburg", "Innsbruck"],
    keywordsLaborales: ["Kellner", "Programmierer", "Bürokaufmann", "Verkäufer", "Krankenpfleger"],
    slug: "austria",
  },
  CH: {
    codigo: "CH",
    nombre: "Suiza",
    nombreLocal: "Schweiz",
    moneda: "CHF",
    simboloMoneda: "CHF",
    posicionSimbolo: "antes",
    idioma: "de",
    bandera: "🇨🇭",
    salarioMinimo: 4000,
    salarioMedio: 6500,
    tasaCambioEUR: 0.96,
    formatoMiles: "'",
    formatoDecimal: ".",
    ciudades: ["Zürich", "Genf", "Basel", "Bern", "Lausanne"],
    keywordsLaborales: ["Kellner", "Programmierer", "Bürokaufmann", "Verkäufer", "Krankenpfleger"],
    slug: "suiza",
  },

  // ===== FUERA DE EUROPA — MEJORES SALARIOS =====

  UK: {
    codigo: "UK",
    nombre: "Reino Unido",
    nombreLocal: "United Kingdom",
    moneda: "GBP",
    simboloMoneda: "£",
    posicionSimbolo: "antes",
    idioma: "en",
    bandera: "🇬🇧",
    salarioMinimo: 2116,
    salarioMedio: 3100,
    tasaCambioEUR: 0.86,
    formatoMiles: ",",
    formatoDecimal: ".",
    ciudades: ["London", "Manchester", "Birmingham", "Edinburgh", "Glasgow", "Leeds", "Bristol"],
    keywordsLaborales: ["waiter", "developer", "administrator", "sales", "nurse"],
    slug: "reino-unido",
  },

  US: {
    codigo: "US",
    nombre: "Estados Unidos",
    nombreLocal: "United States",
    moneda: "USD",
    simboloMoneda: "$",
    posicionSimbolo: "antes",
    idioma: "en",
    bandera: "🇺🇸",
    salarioMinimo: 1256,
    salarioMedio: 5000,
    tasaCambioEUR: 1.08,
    formatoMiles: ",",
    formatoDecimal: ".",
    ciudades: ["New York", "Los Angeles", "Chicago", "Houston", "Miami", "San Francisco", "Boston"],
    keywordsLaborales: ["waiter", "developer", "administrative", "sales", "nurse"],
    slug: "estados-unidos",
  },

  CA: {
    codigo: "CA",
    nombre: "Canadá",
    nombreLocal: "Canada",
    moneda: "CAD",
    simboloMoneda: "C$",
    posicionSimbolo: "antes",
    idioma: "en",
    bandera: "🇨🇦",
    salarioMinimo: 2752,
    salarioMedio: 5200,
    tasaCambioEUR: 1.48,
    formatoMiles: ",",
    formatoDecimal: ".",
    ciudades: ["Toronto", "Vancouver", "Montreal", "Calgary", "Ottawa", "Edmonton", "Québec"],
    keywordsLaborales: ["waiter", "developer", "administrative", "sales", "nurse"],
    slug: "canada",
  },

  AU: {
    codigo: "AU",
    nombre: "Australia",
    nombreLocal: "Australia",
    moneda: "AUD",
    simboloMoneda: "A$",
    posicionSimbolo: "antes",
    idioma: "en",
    bandera: "🇦🇺",
    salarioMinimo: 3830,
    salarioMedio: 6800,
    tasaCambioEUR: 1.65,
    formatoMiles: ",",
    formatoDecimal: ".",
    ciudades: ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide", "Gold Coast", "Canberra"],
    keywordsLaborales: ["waiter", "developer", "administrator", "sales", "nurse"],
    slug: "australia",
  },
  NZ: {
    codigo: "NZ",
    nombre: "Nueva Zelanda",
    nombreLocal: "New Zealand",
    moneda: "NZD",
    simboloMoneda: "NZ$",
    posicionSimbolo: "antes",
    idioma: "en",
    bandera: "🇳🇿",
    salarioMinimo: 4019,
    salarioMedio: 5500,
    tasaCambioEUR: 1.81,
    formatoMiles: ",",
    formatoDecimal: ".",
    ciudades: ["Auckland", "Wellington", "Christchurch", "Hamilton", "Dunedin", "Tauranga"],
    keywordsLaborales: ["waiter", "developer", "administrator", "sales", "nurse"],
    slug: "nueva-zelanda",
  },

  GR: {
    codigo: "GR",
    nombre: "Grecia",
    nombreLocal: "Ελλάδα",
    moneda: "EUR",
    simboloMoneda: "€",
    posicionSimbolo: "despues",
    idioma: "el",
    bandera: "🇬🇷",
    salarioMinimo: 950,
    salarioMedio: 1600,
    tasaCambioEUR: 1,
    formatoMiles: ".",
    formatoDecimal: ",",
    ciudades: ["Atenas", "Tesalónica", "Heraclión", "Patras", "Larisa", "Volos"],
    keywordsLaborales: ["σερβιτόρος", "προγραμματιστής", "νοσηλευτής", "πωλητής", "διοικητικός"],
    slug: "grecia",
  },
  CZ: {
    codigo: "CZ",
    nombre: "República Checa",
    nombreLocal: "Česká republika",
    moneda: "CZK",
    simboloMoneda: "Kč",
    posicionSimbolo: "despues",
    idioma: "cs",
    bandera: "🇨🇿",
    salarioMinimo: 820,
    salarioMedio: 1900,
    tasaCambioEUR: 25.3,
    formatoMiles: " ",
    formatoDecimal: ",",
    ciudades: ["Praga", "Brno", "Ostrava", "Pilsen", "Liberec", "Olomouc"],
    keywordsLaborales: ["číšník", "programátor", "zdravotní sestra", "prodejce", "administrativa"],
    slug: "republica-checa",
  },
  HU: {
    codigo: "HU",
    nombre: "Hungría",
    nombreLocal: "Magyarország",
    moneda: "HUF",
    simboloMoneda: "Ft",
    posicionSimbolo: "despues",
    idioma: "hu",
    bandera: "🇭🇺",
    salarioMinimo: 650,
    salarioMedio: 1300,
    tasaCambioEUR: 395,
    formatoMiles: " ",
    formatoDecimal: ",",
    ciudades: ["Budapest", "Debrecen", "Szeged", "Miskolc", "Pécs", "Győr"],
    keywordsLaborales: ["pincér", "programozó", "ápoló", "értékesítő", "adminisztrátor"],
    slug: "hungria",
  },
  RO: {
    codigo: "RO",
    nombre: "Rumanía",
    nombreLocal: "România",
    moneda: "RON",
    simboloMoneda: "lei",
    posicionSimbolo: "despues",
    idioma: "ro",
    bandera: "🇷🇴",
    salarioMinimo: 600,
    salarioMedio: 1100,
    tasaCambioEUR: 4.98,
    formatoMiles: ".",
    formatoDecimal: ",",
    ciudades: ["Bucarest", "Cluj-Napoca", "Timisoara", "Iași", "Constanța", "Brașov"],
    keywordsLaborales: ["ospătar", "programator", "asistent medical", "vânzător", "administrativ"],
    slug: "rumania",
  },

  // ===== UE: MALTA, ESLOVAQUIA, ESLOVENIA Y CHIPRE (6 nov 2026) =====
  // Sus ofertas ya entraban por EURES (6 nov 2026: Malta 4.575 vivas,
  // Eslovaquia 4.205, Eslovenia 3.785 y Chipre 1.978), pero no eran países de
  // la aplicación. EURES solo da la región (código NUTS), así que en la base la
  // ciudad de todas ellas es el nombre del país.

  MT: {
    codigo: "MT",
    nombre: "Malta",
    nombreLocal: "Malta",
    moneda: "EUR",
    simboloMoneda: "€",
    posicionSimbolo: "antes", // €1,234.56, como en inglés
    // Las ofertas de Malta están en inglés. OJO: con "en", al elegir Malta en el
    // menú la interfaz se pasa al inglés (AppNavWrapper), como con Irlanda.
    idioma: "en",
    bandera: "🇲🇹",
    // Salario mínimo desde los 18 años: 229,44 € a la semana desde el 1 ene 2026
    // (L.N. 289 of 2025, National Minimum Wage National Standard Order). En mes,
    // 994 € según Eurostat (earn_mw_cur, 2026-S2). Los convenios de cada sector
    // (Wage Regulation Orders) pueden fijar más.
    salarioMinimo: 994,
    // Salario BASE medio mensual de los asalariados, segundo trimestre de 2026:
    // 2.282 € (NSO, Labour Force Survey, nota 160/2026). Sin horas extra, primas
    // ni pluses. La web de NSO no deja descargar la nota (403): la cifra se ha
    // leído en sebsauerborn.com, que la cita con su número.
    salarioMedio: 2282,
    tasaCambioEUR: 1, // Malta usa el euro
    formatoMiles: ",",
    formatoDecimal: ".",
    // No hemos podido abrir un dato de empleo por localidad (NSO bloquea la
    // descarga). La capital y los núcleos de oficinas y hostelería; el orden
    // no está medido.
    ciudades: ["Valletta", "Sliema", "St Julian's", "Birkirkara", "Msida"],
    // Las palabras que más se repiten en los títulos de sus ofertas en la base
    // el 6 nov 2026: cleaner 388, driver 279, sales 210, chef 159 y waiter 93.
    keywordsLaborales: ["cleaner", "driver", "sales", "chef", "waiter"],
    slug: "malta",
  },

  SK: {
    codigo: "SK",
    nombre: "Eslovaquia",
    nombreLocal: "Slovensko",
    moneda: "EUR",
    simboloMoneda: "€",
    posicionSimbolo: "despues",
    idioma: "sk",
    bandera: "🇸🇰",
    // Salario mínimo 2026: 915 € al mes y 5,259 € la hora (Oznámenie del
    // Ministerio de Trabajo 245/2025 Z. z.). Eurostat, 915 € (2026-S2).
    salarioMinimo: 915,
    // Salario medio nominal mensual de 2025: 1.620 € (Oficina de Estadística,
    // ŠÚ SR, publicado el 3 mar 2026, según TASR).
    salarioMedio: 1620,
    tasaCambioEUR: 1, // Eslovaquia usa el euro
    formatoMiles: " ",
    formatoDecimal: ",",
    // Las capitales de las cinco regiones con más empleo en 2024 (Eurostat,
    // nama_10r_3empers): Bratislava 478.030, Žilina 324.900, Nitra 294.230,
    // Košice 292.390 y Prešov 283.240 ocupados.
    ciudades: ["Bratislava", "Žilina", "Nitra", "Košice", "Prešov"],
    // Las palabras que más se repiten en los títulos de sus ofertas en la base
    // el 6 nov 2026, que allí van en plural (el nombre de la ocupación): kuchári
    // 292, operátori 244, čašníci 182, upratovačky 162 y vodiči 122. Aquí van en
    // singular; la búsqueda es por palabra entera, así que los plurales están
    // en lib/job-search/sinonimos-puesto.ts y "kuchár" encuentra "Kuchári".
    keywordsLaborales: ["kuchár", "operátor", "čašník", "upratovačka", "vodič"],
    slug: "eslovaquia",
  },

  SI: {
    codigo: "SI",
    nombre: "Eslovenia",
    nombreLocal: "Slovenija",
    moneda: "EUR",
    simboloMoneda: "€",
    posicionSimbolo: "despues",
    idioma: "sl",
    bandera: "🇸🇮",
    // Salario mínimo 2026: 1.481,88 € brutos al mes (Ministerio de Trabajo,
    // 28 ene 2026; publicado en el Uradni list el 30 ene 2026). Eurostat, 1.482 €.
    salarioMinimo: 1482,
    // Salario medio mensual bruto de 2025: 2.536,03 € (1.602,05 € netos). SURS,
    // tabla 0701023S de SiStat.
    salarioMedio: 2536,
    tasaCambioEUR: 1, // Eslovenia usa el euro
    formatoMiles: ".",
    formatoDecimal: ",",
    // Los cinco municipios con más ocupados por lugar de trabajo en 2025 (SURS,
    // tabla 0775341S): Ljubljana 249.390, Maribor 65.193, Celje 32.201, Koper
    // 25.379 y Novo mesto 25.157 (Kranj, 24.829, se queda fuera por poco).
    ciudades: ["Ljubljana", "Maribor", "Celje", "Koper", "Novo mesto"],
    // Las palabras que más se repiten en los títulos de sus ofertas en la base
    // el 6 nov 2026: medicinska sestra 844, učitelj 686, čistilec 179,
    // varnostnik 148 y kuhar 121.
    keywordsLaborales: ["medicinska sestra", "učitelj", "čistilec", "varnostnik", "kuhar"],
    slug: "eslovenia",
  },

  CY: {
    codigo: "CY",
    nombre: "Chipre",
    nombreLocal: "Κύπρος",
    moneda: "EUR",
    simboloMoneda: "€",
    posicionSimbolo: "despues",
    idioma: "el",
    bandera: "🇨🇾",
    // Salario mínimo desde el 1 ene 2026: 1.088 € al mes tras seis meses con la
    // misma empresa, y 979 € hasta entonces (Consejo de Ministros, 23 dic 2025,
    // para 2026 y 2027). No cubre a hoteles, empleo doméstico, agricultura ni
    // marinos. Eurostat, 1.088 € (2026-S2).
    salarioMinimo: 1088,
    // Ganancia media bruta mensual de los asalariados en 2025: 2.605 €
    // (CYSTAT, provisional; mediana, 1.968 €). Leído en Cyprus Inform, 27 abr 2026.
    salarioMedio: 2605,
    tasaCambioEUR: 1, // Chipre usa el euro
    formatoMiles: ".",
    formatoDecimal: ",",
    // Por población del distrito (censo 2021): Nicosia 350.035, Limassol
    // 262.157, Larnaca 155.765, Paphos 101.106 y Famagusta, la parte bajo
    // control del Gobierno, 54.318. No es un dato de empleo. Ayia Napa, por
    // Famagusta, es elección nuestra.
    ciudades: ["Nicosia", "Limassol", "Larnaca", "Paphos", "Ayia Napa"],
    // Las palabras que más se repiten en los títulos de sus ofertas en la base
    // el 6 nov 2026 (casi todos en griego): καθαριστής (limpiador) 82, πωλητής
    // (vendedor) 61, cook 45, μάγειρας (cocinero) 26 y waiter 26.
    keywordsLaborales: ["καθαριστής", "πωλητής", "cook", "μάγειρας", "waiter"],
    slug: "chipre",
  },

  // ===== LATINOAMÉRICA =====

  // México entra el 5 nov 2026. Adzuna ya traía sus ofertas cada día (20.700
  // vivas ese día) y quien buscaba "vendedor" en Monterrey las encontraba, pero
  // no era un país de la aplicación: sin página, sin ficha de requisitos y fuera
  // del barrido completo de Adzuna, que solo recorre los países de esta lista.
  MX: {
    codigo: "MX",
    nombre: "México",
    nombreLocal: "México",
    moneda: "MXN",
    simboloMoneda: "MX$",
    posicionSimbolo: "antes",
    idioma: "es",
    bandera: "🇲🇽",
    // Zona general 2026: 315,04 $ al día (CONASAMI) = 9.582 $ al mes. En la Zona
    // Libre de la Frontera Norte es más alto: 440,87 $ al día.
    salarioMinimo: 9582,
    // Salario base de cotización medio del IMSS en julio de 2026: 673,9 $ al día × 30,4.
    salarioMedio: 20490,
    tasaCambioEUR: 21.01, // Banco Central Europeo, 4 nov 2026 (en agosto era 19,8)
    formatoMiles: ",",
    formatoDecimal: ".",
    ciudades: ["Ciudad de México", "Guadalajara", "Monterrey", "Puebla", "Tijuana", "Querétaro", "Mérida"],
    // Las cinco con más ofertas de México el 5 nov 2026 (no traducciones de las españolas).
    keywordsLaborales: ["auxiliar administrativo", "recepcionista", "ayudante general", "mesero", "vendedor"],
    slug: "mexico",
  },

  // Brasil entra el 5 nov 2026, detrás de México. Adzuna ya traía 78.659 ofertas
  // vivas, pero solo por el calendario corto (una página por ciudad); desde hoy
  // entra también en el barrido completo.
  BR: {
    codigo: "BR",
    nombre: "Brasil",
    nombreLocal: "Brasil",
    moneda: "BRL",
    simboloMoneda: "R$",
    posicionSimbolo: "antes",
    idioma: "pt",
    bandera: "🇧🇷",
    // Salário mínimo 2026: R$ 1.621 al mes (Decreto 12.797/2025, desde el 1 ene 2026).
    salarioMinimo: 1621,
    // Rendimiento medio del trabajo, primer trimestre de 2026: R$ 3.722 (IBGE, PNAD Contínua).
    salarioMedio: 3722,
    tasaCambioEUR: 6.16, // Banco Central Europeo, 4 nov 2026
    formatoMiles: ".",
    formatoDecimal: ",",
    ciudades: ["São Paulo", "Rio de Janeiro", "Brasília", "Belo Horizonte", "Curitiba", "Porto Alegre", "Salvador", "Recife", "Fortaleza"],
    // Las cinco con más ofertas en Brasil el 5 nov 2026, en el portugués de allí.
    keywordsLaborales: ["vendedor", "atendente", "motorista", "recepcionista", "cozinheiro"],
    slug: "brasil",
  },

  // Colombia entra el 5 nov 2026, la primera de Latinoamérica por Careerjet
  // (Adzuna no la cubre): barrido diario en scripts/vps/sync-careerjet-barrido.sh.
  CO: {
    codigo: "CO",
    nombre: "Colombia",
    nombreLocal: "Colombia",
    moneda: "COP",
    simboloMoneda: "$",
    posicionSimbolo: "antes",
    idioma: "es",
    bandera: "🇨🇴",
    // Salario mínimo 2026: 1.750.905 $ al mes (Decreto 1469 de 2025; suspendido
    // en febrero, el Decreto 159 de 2026 mantuvo la misma cifra). Quien gana
    // hasta dos mínimos cobra además 249.095 $ de auxilio de transporte.
    salarioMinimo: 1750905,
    // Ingreso laboral medio de los asalariados, enero-octubre de 2025: 2.158.174 $ (DANE).
    salarioMedio: 2158174,
    // El BCE no publica el peso colombiano: 1,1224 $ por euro (BCE) × 3.221,19
    // pesos por dólar (TRM del Banco de la República), 5 nov 2026.
    tasaCambioEUR: 3615,
    formatoMiles: ".",
    formatoDecimal: ",",
    ciudades: ["Bogotá", "Medellín", "Cali", "Barranquilla", "Cartagena", "Bucaramanga", "Pereira"],
    // Las cinco con más ofertas en Careerjet Colombia el 5 nov 2026: asesor
    // comercial 11.911, operario 5.792, call center 5.245, aseo 5.138 y
    // conductor 4.099. "Bachiller" daba más (26.152), pero es un requisito.
    keywordsLaborales: ["asesor comercial", "operario", "call center", "aseo", "conductor"],
    slug: "colombia",
  },

  // Perú entra el 5 nov 2026, detrás de Colombia y por el mismo barrido de Careerjet.
  PE: {
    codigo: "PE",
    nombre: "Perú",
    nombreLocal: "Perú",
    moneda: "PEN",
    simboloMoneda: "S/",
    posicionSimbolo: "antes",
    idioma: "es",
    bandera: "🇵🇪",
    // Remuneración mínima vital: S/ 1.230 desde el 1 oct 2026 (Decreto Supremo
    // 015-2026-TR). Subirá a S/ 1.300 en el primer semestre de 2027.
    salarioMinimo: 1230,
    // Ingreso medio mensual del trabajo en todo el país en 2025: S/ 1.887,2 (INEI).
    salarioMedio: 1887,
    // El BCE no publica el sol: 1,1267 $ por euro (BCE) × 3,452 soles por dólar
    // (BCRP, tipo de cambio bancario de venta), 4 nov 2026.
    tasaCambioEUR: 3.89,
    formatoMiles: ",",
    formatoDecimal: ".",
    ciudades: ["Lima", "Arequipa", "Trujillo", "Chiclayo", "Piura", "Cusco", "Huancayo"],
    // De las que más ofertas tienen en Careerjet Perú el 5 nov 2026: limpieza
    // 21.139, asesor de ventas 15.583, call center 12.479, operario 8.747 y
    // practicante 4.854. "Seguridad" daba 34.791, pero mezcla vigilantes con
    // "seguridad y salud en el trabajo".
    keywordsLaborales: ["limpieza", "asesor de ventas", "call center", "operario", "practicante"],
    slug: "peru",
  },

  // Chile entra el 5 nov 2026, por el mismo barrido de Careerjet.
  CL: {
    codigo: "CL",
    nombre: "Chile",
    nombreLocal: "Chile",
    moneda: "CLP",
    simboloMoneda: "$",
    posicionSimbolo: "antes",
    idioma: "es",
    bandera: "🇨🇱",
    // Ingreso mínimo mensual de 18 a 65 años: 553.553 $ desde el 1 may 2026
    // (Ley 21.830, publicada el 22 jun 2026 con efecto desde mayo).
    salarioMinimo: 553553,
    // Ingreso laboral medio de los ocupados en 2025, neto: 962.945 $ (INE,
    // Encuesta Suplementaria de Ingresos, publicada el 14 jul 2026).
    salarioMedio: 962945,
    // El BCE no publica el peso chileno: 1,1267 $ por euro (BCE) × 980,59 pesos
    // por dólar (dólar observado del Banco Central de Chile), 4 nov 2026.
    tasaCambioEUR: 1105,
    formatoMiles: ".",
    formatoDecimal: ",",
    ciudades: ["Santiago", "Valparaíso", "Concepción", "Antofagasta", "Viña del Mar", "Temuco", "La Serena"],
    // De las que más ofertas tienen en Careerjet Chile el 5 nov 2026: operario
    // 13.765, vendedor 7.073, administrativo 5.415, guardia de seguridad 3.166
    // y auxiliar de aseo 2.505.
    keywordsLaborales: ["operario", "vendedor", "administrativo", "guardia de seguridad", "auxiliar de aseo"],
    slug: "chile",
  },

  // Argentina entra el 5 nov 2026, por el mismo barrido de Careerjet. OJO: con
  // la inflación de allí, el mínimo y el salario medio se quedan viejos en
  // meses; el mínimo sube cada mes hasta abril de 2027 (Resolución 4/2026).
  AR: {
    codigo: "AR",
    nombre: "Argentina",
    nombreLocal: "Argentina",
    moneda: "ARS",
    simboloMoneda: "$",
    posicionSimbolo: "antes",
    idioma: "es",
    bandera: "🇦🇷",
    // Salario mínimo, vital y móvil de noviembre de 2026: 398.800 $ (Resolución
    // 4/2026 del Consejo del Salario, BO 2 sep 2026). Diciembre: 406.400 $.
    salarioMinimo: 398800,
    // RIPTE de agosto de 2026, el salario medio de los registrados estables:
    // 1.982.518 $ (Secretaría de Trabajo).
    salarioMedio: 1982518,
    // El BCE no publica el peso argentino: 1,1267 $ por euro (BCE) × 1.546
    // pesos por dólar (cotización oficial del BCRA), 4 nov 2026.
    tasaCambioEUR: 1742,
    formatoMiles: ".",
    formatoDecimal: ",",
    ciudades: ["Buenos Aires", "Córdoba", "Rosario", "Mendoza", "La Plata", "Mar del Plata", "Tucumán"],
    // De las que más ofertas tienen en Careerjet Argentina el 5 nov 2026:
    // atención al cliente 4.174, limpieza 2.555, vendedor 2.229, operario
    // 1.743 y administrativo 1.621. "Seguridad" daba más (6.680), pero mezcla
    // vigilantes con seguridad informática e higiene y seguridad.
    keywordsLaborales: ["atención al cliente", "limpieza", "vendedor", "operario", "administrativo"],
    slug: "argentina",
  },

  // Ecuador entra el 5 nov 2026, el primero de la fase 2, por el barrido de Careerjet.
  EC: {
    codigo: "EC",
    nombre: "Ecuador",
    nombreLocal: "Ecuador",
    moneda: "USD",
    simboloMoneda: "US$",
    posicionSimbolo: "antes",
    idioma: "es",
    bandera: "🇪🇨",
    // Salario básico unificado 2026: 482 US$ al mes (Acuerdo Ministerial
    // MDT-2025-195, desde el 1 ene 2026).
    salarioMinimo: 482,
    // Ingreso laboral medio en todo el país, abril de 2026: 513 US$ (INEC, ENEMDU).
    salarioMedio: 513,
    // Ecuador usa el dólar: 1,1267 $ por euro (BCE, 4 nov 2026).
    tasaCambioEUR: 1.1267,
    formatoMiles: ",",
    formatoDecimal: ".",
    ciudades: ["Quito", "Guayaquil", "Cuenca", "Manta", "Ambato", "Machala"],
    // Las que más ofertas tienen en Careerjet Ecuador el 5 nov 2026: atención
    // al cliente 1.472, asesor comercial 732, limpieza 674, vendedor 535 y call
    // center 217.
    keywordsLaborales: ["atención al cliente", "asesor comercial", "limpieza", "vendedor", "call center"],
    slug: "ecuador",
  },

  // Guatemala entra el 5 nov 2026, la de más ofertas de la fase 2 (9.142 en Careerjet).
  GT: {
    codigo: "GT",
    nombre: "Guatemala",
    nombreLocal: "Guatemala",
    moneda: "GTQ",
    simboloMoneda: "Q",
    posicionSimbolo: "antes",
    idioma: "es",
    bandera: "🇬🇹",
    // Salario mínimo 2026 de actividades no agrícolas en el departamento de
    // Guatemala: Q4.002,28 al mes, más Q250 de bonificación incentivo
    // (Acuerdo Gubernativo 256-2025). En el resto del país, Q3.816,90.
    salarioMinimo: 4002,
    // Ingreso laboral medio de 2025: unos Q2.713 al mes (ENEIC del INE, según
    // el boletín del instituto de economía de la Universidad de San Carlos, feb 2026).
    salarioMedio: 2713,
    // El BCE no publica el quetzal: 1,1267 $ por euro (BCE) × 7,64082 quetzales
    // por dólar (tipo de cambio de referencia del Banco de Guatemala), 4 nov 2026.
    tasaCambioEUR: 8.61,
    formatoMiles: ",",
    formatoDecimal: ".",
    ciudades: ["Ciudad de Guatemala", "Mixco", "Villa Nueva", "Quetzaltenango", "Escuintla", "Cobán"],
    // Las que más ofertas tienen en Careerjet Guatemala el 5 nov 2026: asesor
    // de ventas 776, bodega 611, vendedor 561, call center 462 y piloto 409.
    // Allí "piloto" es el conductor; por eso no se traduce como sinónimo: en
    // España sacaría pilotos de avión.
    keywordsLaborales: ["asesor de ventas", "call center", "bodega", "vendedor", "piloto"],
    slug: "guatemala",
  },

  // Costa Rica entra el 5 nov 2026, por el barrido de Careerjet (4.638 ofertas).
  CR: {
    codigo: "CR",
    nombre: "Costa Rica",
    nombreLocal: "Costa Rica",
    moneda: "CRC",
    simboloMoneda: "₡",
    posicionSimbolo: "antes",
    idioma: "es",
    bandera: "🇨🇷",
    // Salario mínimo 2026 del trabajador en ocupación no calificada genérico:
    // ₡373.092 al mes (Decreto Ejecutivo 45303-MTSS, desde el 1 ene 2026).
    salarioMinimo: 373092,
    // Ingreso medio por trabajo asalariado en 2026: ₡723.135 al mes (INEC, ENAHO).
    salarioMedio: 723135,
    // El BCE no publica el colón: 1,1224 $ por euro (BCE) × 454,41 colones por
    // dólar (tipo de cambio de venta del BCCR que publica Hacienda), 5 nov 2026.
    tasaCambioEUR: 510,
    formatoMiles: ".",
    formatoDecimal: ",",
    ciudades: ["San José", "Heredia", "Alajuela", "Cartago", "Liberia", "Limón"],
    // De las que más ofertas tienen en Careerjet Costa Rica el 5 nov 2026:
    // servicio al cliente 637, bodega 200, vendedor 132, chofer 106 y operario
    // 102. "Inglés" daba 468: muchos puestos son bilingües.
    keywordsLaborales: ["servicio al cliente", "bodega", "vendedor", "chofer", "operario"],
    slug: "costa-rica",
  },

  // Uruguay entra el 5 nov 2026, por el barrido de Careerjet (2.147 ofertas).
  UY: {
    codigo: "UY",
    nombre: "Uruguay",
    nombreLocal: "Uruguay",
    moneda: "UYU",
    simboloMoneda: "$U",
    posicionSimbolo: "antes",
    idioma: "es",
    bandera: "🇺🇾",
    // Salario mínimo nacional desde el 1 jul 2026: $25.383 al mes (Decreto
    // 64/2025 del MTSS: $24.572 de enero a junio y +3,3 % en julio).
    salarioMinimo: 25383,
    // Remuneración media mensual de los trabajadores dependientes en 2025:
    // $56.920, a precios de diciembre de 2025 (BPS, Boletín Estadístico 2026).
    salarioMedio: 56920,
    // El Banco Central del Uruguay publica el euro: 45,12 pesos, 4 nov 2026.
    tasaCambioEUR: 45.12,
    formatoMiles: ".",
    formatoDecimal: ",",
    ciudades: ["Montevideo", "Canelones", "Maldonado", "Punta del Este", "Salto", "Paysandú"],
    // Las que más ofertas tienen en Careerjet Uruguay el 5 nov 2026: atención
    // al cliente 317, limpieza 252, depósito 177, administrativo 168 y
    // vendedor 157.
    keywordsLaborales: ["atención al cliente", "limpieza", "depósito", "administrativo", "vendedor"],
    slug: "uruguay",
  },

  // El Salvador entra el 5 nov 2026, por el barrido de Careerjet (3.382 ofertas).
  SV: {
    codigo: "SV",
    nombre: "El Salvador",
    nombreLocal: "El Salvador",
    moneda: "USD",
    simboloMoneda: "US$",
    posicionSimbolo: "antes",
    idioma: "es",
    bandera: "🇸🇻",
    // Salario mínimo de industria, comercio y servicios: 408,80 US$ al mes
    // desde el 1 jun 2025 (Decreto Ejecutivo 11, DO del 23 may 2025); en 2026
    // no ha habido decreto nuevo.
    salarioMinimo: 408.8,
    // Salario medio mensual de los ocupados en 2025: 437,39 US$ (EHPM 2025 del
    // Banco Central de Reserva, según la prensa salvadoreña).
    salarioMedio: 437,
    // El Salvador usa el dólar: 1,1267 $ por euro (BCE, 4 nov 2026).
    tasaCambioEUR: 1.1267,
    formatoMiles: ",",
    formatoDecimal: ".",
    ciudades: ["San Salvador", "Santa Ana", "San Miguel", "Soyapango", "Santa Tecla"],
    // Las que más ofertas tienen en Careerjet El Salvador el 5 nov 2026:
    // atención al cliente 548, bodega 268, asesor de ventas 173, motorista
    // 127 (allí es el conductor) y vendedor 121.
    keywordsLaborales: ["atención al cliente", "bodega", "asesor de ventas", "motorista", "vendedor"],
    slug: "el-salvador",
  },

  // Panamá entra el 5 nov 2026, por el barrido de Careerjet (2.940 ofertas).
  PA: {
    codigo: "PA",
    nombre: "Panamá",
    nombreLocal: "Panamá",
    moneda: "PAB",
    simboloMoneda: "B/.",
    posicionSimbolo: "antes",
    idioma: "es",
    bandera: "🇵🇦",
    // En Panamá el mínimo va por hora, actividad, región y tamaño de empresa
    // (Decreto Ejecutivo 13 de 31 dic 2025, desde el 16 ene 2026, para dos
    // años). Comercio en gran empresa, región 1: B/.3,02 la hora; con la
    // jornada de 48 horas semanales salen unos B/.628 al mes. Es una cuenta
    // nuestra, no una cifra mensual oficial.
    salarioMinimo: 628,
    // Salario mensual MEDIANO de los empleados en 2025: B/.755,8 (Contraloría,
    // con datos del INEC). Es la mediana, no la media.
    salarioMedio: 756,
    // El balboa va a la par del dólar: 1,1267 por euro (BCE, 4 nov 2026).
    tasaCambioEUR: 1.1267,
    formatoMiles: ",",
    formatoDecimal: ".",
    ciudades: ["Ciudad de Panamá", "San Miguelito", "Colón", "David", "La Chorrera", "Santiago"],
    // Las que más ofertas tienen en Careerjet Panamá el 5 nov 2026: atención
    // al cliente 500, ejecutivo de ventas 129, bodega 128, vendedor 107 y
    // asistente administrativo 79.
    keywordsLaborales: ["atención al cliente", "ejecutivo de ventas", "bodega", "vendedor", "asistente administrativo"],
    slug: "panama",
  },

  // República Dominicana entra el 5 nov 2026, por el barrido de Careerjet.
  DO: {
    codigo: "DO",
    nombre: "República Dominicana",
    nombreLocal: "República Dominicana",
    moneda: "DOP",
    simboloMoneda: "RD$",
    posicionSimbolo: "antes",
    idioma: "es",
    bandera: "🇩🇴",
    // Salario mínimo del sector privado no sectorizado en grandes empresas:
    // RD$29.988 al mes desde el 1 feb 2026 (Resolución CNS-01-2025 del Comité
    // Nacional de Salarios). Medianas, RD$27.489,60; pequeñas y micro, menos.
    salarioMinimo: 29988,
    // Salario medio cotizable en la Seguridad Social, abril de 2026:
    // RD$39.565,63 (Tesorería de la Seguridad Social, según elDinero).
    salarioMedio: 39566,
    // El BCE no publica el peso dominicano: 1,1267 $ por euro (BCE) × 61,0459
    // pesos por dólar (tasa de referencia de venta del Banco Central), 4 nov 2026.
    tasaCambioEUR: 68.78,
    formatoMiles: ",",
    formatoDecimal: ".",
    ciudades: ["Santo Domingo", "Santiago de los Caballeros", "Punta Cana", "La Romana", "San Pedro de Macorís"],
    // Las que más ofertas tienen en Careerjet República Dominicana el 5 nov
    // 2026: servicio al cliente 143, almacén 99, chofer 39, vendedor 30 y call
    // center 23.
    keywordsLaborales: ["servicio al cliente", "almacén", "chofer", "vendedor", "call center"],
    slug: "republica-dominicana",
  },

  // Honduras entra el 5 nov 2026, por el barrido de Careerjet.
  HN: {
    codigo: "HN",
    nombre: "Honduras",
    nombreLocal: "Honduras",
    moneda: "HNL",
    simboloMoneda: "L",
    posicionSimbolo: "antes",
    idioma: "es",
    bandera: "🇭🇳",
    // Salario mínimo PROMEDIO vigente en 2026: L14.917,20 al mes (comunicado
    // SAR-19-2026, con el Acuerdo Ejecutivo SETRASS 233-2026, La Gaceta del 29
    // abr 2026). Cada sector y tamaño de empresa tiene el suyo.
    salarioMinimo: 14917,
    // Ingreso medio mensual de los ocupados en 2026: L10.356 (INE, según
    // E&N). Es MENOR que el mínimo: casi 870.000 asalariados privados cobran
    // por debajo (El Heraldo).
    salarioMedio: 10356,
    // El BCE no publica el lempira: 1,1225 $ por euro (BCE) × 27,027 lempiras
    // por dólar (precio de venta de referencia del BCH), ambos del 2 oct 2026.
    // El lempira apenas se mueve; se actualiza con el resto.
    tasaCambioEUR: 30.34,
    formatoMiles: ",",
    formatoDecimal: ".",
    ciudades: ["Tegucigalpa", "San Pedro Sula", "La Ceiba", "Choloma", "Comayagua"],
    // Las que más ofertas tienen en Careerjet Honduras el 5 nov 2026: atención
    // al cliente 235, vendedor 101, bodega 48, call center 36 y cajero 29.
    keywordsLaborales: ["atención al cliente", "vendedor", "bodega", "call center", "cajero"],
    slug: "honduras",
  },

  // Venezuela entra el 6 nov 2026, por el barrido de Careerjet.
  VE: {
    codigo: "VE",
    nombre: "Venezuela",
    nombreLocal: "Venezuela",
    moneda: "VES",
    simboloMoneda: "Bs.",
    posicionSimbolo: "antes",
    idioma: "es",
    bandera: "🇻🇪",
    // Salario mínimo LEGAL: Bs. 130 al mes desde el 15 mar 2022 (Decreto 4.653,
    // Gaceta Oficial Extraordinaria 6.691), sin cambios desde entonces. A la
    // tasa del BCV del 6 nov 2026 son unos 0,15 US$. Lo que cobra de verdad
    // quien está en el mínimo es el «ingreso mínimo integral»: 240 US$ al mes
    // desde mayo de 2026 (anuncio del 30 abr; 200 US$ de bono contra la guerra
    // económica + 40 US$ de cestaticket, en bolívares a la tasa del BCV; sin
    // Gaceta del ajuste). Son bonos: no cuentan para prestaciones, vacaciones
    // ni utilidades, que se calculan con los 130 Bs. El bono solo obliga al
    // sector público (Decreto 4.805, GO Ext. 6.746); a las empresas privadas el
    // Gobierno les pidió llegar a 240 US$, sin norma que las obligue.
    // Aquí va el LEGAL, que es lo que dice la etiqueta. En
    // public/data/salarios-minimos.json va el integral en bolívares (215.069),
    // porque con 130 Bs el comparador de salarios diría que un camarero cobra
    // menos de un dólar al mes. La diferencia es a propósito.
    salarioMinimo: 130,
    // SIN ESTADÍSTICA OFICIAL: ni el INE ni el BCV publican salarios medios.
    // Esto es la media del sector privado FORMAL en el primer trimestre de 2026
    // según una encuesta de la patronal, la Encuesta Cualitativa a Cámaras
    // Empresariales de Fedecámaras: 283 US$ (obrero 223, profesional 471,
    // gerente 806; El Nacional, 9 jun 2026), pasados a bolívares con la tasa
    // del BCV del 6 nov 2026 (896,1225). Deja fuera el empleo informal. La
    // ENCOVI 2025 de la UCAB (datos de mayo de 2025) daba 230,1 US$ al
    // asalariado privado y 116,9 al público.
    salarioMedio: 253603,
    // El BCE no publica el bolívar: 1,1165 $ por euro (BCE) × 896,1225 Bs por
    // dólar (BCV, fecha valor 6 nov 2026). El BCV da su propio euro: 1.004,96.
    // OJO, CADUCA RÁPIDO: de enero a septiembre de 2026 la inflación fue del
    // 225,3 % (Bloomberg Línea). Este cambio, el salario medio y el integral del
    // JSON están a la misma tasa: se actualizan juntos, cada mes.
    tasaCambioEUR: 1000.52,
    formatoMiles: ".",
    formatoDecimal: ",",
    // Por ofertas en la base el 6 nov 2026: Caracas 913, Valencia 325,
    // Maracaibo 204, Maracay 62 y Barquisimeto 40. Valencia también es de
    // España: lib/guzzi/ciudades-pais.ts ya la tiene en HOMONIMAS.
    ciudades: ["Caracas", "Valencia", "Maracaibo", "Maracay", "Barquisimeto"],
    // Las palabras que más se repiten en los títulos de sus ofertas en la base
    // el 6 nov 2026: ventas 241, analista 216, asesor 133, asistente 117 y
    // administrativo 73. Vendedor (76) se queda fuera porque ya va "ventas".
    keywordsLaborales: ["ventas", "analista", "asesor", "asistente", "administrativo"],
    slug: "venezuela",
  },

  // Nicaragua entra el 6 nov 2026, por el barrido de Careerjet.
  NI: {
    codigo: "NI",
    nombre: "Nicaragua",
    nombreLocal: "Nicaragua",
    moneda: "NIO",
    simboloMoneda: "C$",
    posicionSimbolo: "antes",
    idioma: "es",
    bandera: "🇳🇮",
    // Salario mínimo PROMEDIO del 1 mar 2026 al 28 feb 2027: C$9.237,84, la
    // media simple de los nueve sectores del Acta 1 CNSM-05/03/2026 de la
    // Comisión Nacional de Salario Mínimo (Ley 625), sin la zona franca, que va
    // por su acuerdo quinquenal (C$9.986,46 en 2026). EFE dio C$9.237,86. Cada
    // sector tiene el suyo: de C$6.188,02 en el campo (más alimentación) a
    // C$13.848,23 en construcción y finanzas; comercio, restaurantes, hoteles y
    // transporte, C$11.350,08. Se toma el promedio, como en Honduras.
    salarioMinimo: 9238,
    // Salario promedio de los afiliados al INSS en enero y febrero de 2026:
    // C$16.447 (BCN, según La Prensa, 14 may 2026). Es solo el empleo formal:
    // 813.056 afiliados.
    salarioMedio: 16447,
    // El BCE no publica el córdoba: 1,1165 $ por euro (BCE) × 36,6243 córdobas
    // por dólar (tipo oficial del BCN), 6 nov 2026. El BCN da el mismo valor
    // para todos los días de noviembre: lo tiene fijo.
    tasaCambioEUR: 40.89,
    formatoMiles: ",",
    formatoDecimal: ".",
    // Por ofertas en la base el 6 nov 2026: Managua 866, León 43, Masaya 42,
    // Matagalpa 37 y Chinandega 36. León también es de México y de España (ver
    // HOMONIMAS en lib/guzzi/ciudades-pais.ts).
    ciudades: ["Managua", "León", "Masaya", "Matagalpa", "Chinandega"],
    // Las palabras que más se repiten en los títulos de sus ofertas en la base
    // el 6 nov 2026: ventas 159, auxiliar 144, supervisor 67, conductor 48 y
    // bodega 33. Ejecutivo (62) y asesor (58) también salen; se dejan fuera
    // para que haya oficios distintos (decisión nuestra).
    keywordsLaborales: ["ventas", "auxiliar", "supervisor", "conductor", "bodega"],
    slug: "nicaragua",
  },

  // India entra el 6 nov 2026. Adzuna ya traía 45.406 ofertas vivas, en inglés;
  // desde hoy entra también en el barrido completo (in:20).
  IN: {
    codigo: "IN",
    nombre: "India",
    nombreLocal: "India",
    moneda: "INR",
    simboloMoneda: "₹",
    posicionSimbolo: "antes",
    idioma: "en",
    bandera: "🇮🇳",
    // India NO tiene un salario mínimo nacional. El Code on Wages, en vigor
    // desde el 21 nov 2025 (PIB, 5 feb 2026), manda fijar un "floor wage"
    // nacional, pero el 10 ago 2026 el Gobierno seguía sin dar cifra (Lok
    // Sabha, pregunta 3467). Cada estado fija los suyos.
    // Se pone el mínimo del Gobierno central para un trabajador no cualificado
    // en zona A, la de las grandes ciudades donde están las ofertas (Bangalore,
    // Hyderabad, Mumbai, Chennai, Ahmedabad, Pune y Delhi, entre otras): 523 +
    // 304 = 827 ₹ al día desde el 1 abr 2026 (orden de la Chief Labour
    // Commissioner de 30 mar 2026) × 26 días (Wages (Central) Rules 2026) =
    // 21.502 ₹ al mes. Solo obliga en los empleos de la esfera central; los
    // estados fijan otros.
    // OJO: sale casi igual que el salario medio, porque este es el mínimo de
    // las ciudades grandes y el medio es de todo el país, campo incluido.
    salarioMinimo: 21502,
    // Ganancia media mensual de los asalariados fijos en 2025: 22.699 ₹ (PLFS
    // 2025, MoSPI). La nota oficial del 26 mar 2026 da 24.217 ₹ los hombres y
    // 18.353 ₹ las mujeres; el total es la tabla 7.1 que saca India Labour
    // Observatory de los microdatos oficiales, y cuadra con esas dos cifras.
    salarioMedio: 22699,
    tasaCambioEUR: 104.86, // Banco Central Europeo, 6 nov 2026 (104,8645)
    // En India los miles se agrupan a su manera (1,00,000 es cien mil), pero
    // formatearSalario solo sabe agrupar de tres en tres: se deja la coma.
    formatoMiles: ",",
    formatoDecimal: ".",
    // Las que más ofertas tienen en la base el 6 nov 2026: Bangalore 5.712,
    // Hyderabad 4.701, Mumbai 4.490, Chennai 4.056, Ahmedabad 3.070, Pune
    // 2.888, Kolkata 2.464 y Delhi 2.368.
    ciudades: ["Bangalore", "Hyderabad", "Mumbai", "Chennai", "Ahmedabad", "Pune", "Kolkata", "Delhi"],
    // Las palabras que más se repiten en los títulos de sus ofertas en la base
    // el 6 nov 2026: engineer 6.870, sales 4.434, executive 3.954, developer
    // 3.623 y assistant 1.919. "Data" (1.941) va por delante de assistant, pero
    // no es un puesto: sale en "data analyst" o "data engineer".
    keywordsLaborales: ["engineer", "sales", "executive", "developer", "assistant"],
    slug: "india",
  },

  // Sudáfrica entra el 6 nov 2026. Adzuna ya traía 44.854 ofertas vivas, en
  // inglés; desde hoy entra también en el barrido completo (za:20).
  ZA: {
    codigo: "ZA",
    nombre: "Sudáfrica",
    nombreLocal: "South Africa",
    moneda: "ZAR",
    simboloMoneda: "R",
    posicionSimbolo: "antes",
    idioma: "en",
    bandera: "🇿🇦",
    // National Minimum Wage: R30,23 por hora ordinaria desde el 1 mar 2026
    // (Gaceta 54075, GN R.7083, 3 feb 2026). Al mes, con el criterio de la
    // propia ley (BCEA, art. 35: 45 horas a la semana × 4⅓ semanas):
    // R5.894,85. Vale también para el campo y el servicio doméstico; el
    // programa de obras públicas (EPWP) tiene uno más bajo, R16,62 la hora.
    salarioMinimo: 5895,
    // Ganancia media mensual en el sector formal no agrícola, mayo de 2026:
    // R30.611 (Stats SA, QES del 2.º trimestre, publicado a finales de sep
    // 2026). Es una media, y deja fuera el empleo informal y el campo.
    salarioMedio: 30611,
    tasaCambioEUR: 18.46, // Banco Central Europeo, 6 nov 2026 (18,4649)
    // Como escriben Stats SA y el Gobierno: "R30 611" y "R30,23".
    formatoMiles: " ",
    formatoDecimal: ",",
    // Las que más ofertas tienen en la base el 6 nov 2026: Pretoria 5.878,
    // Cape Town 5.548, Durban 5.494, East London 4.644, Johannesburg 4.616 y
    // Bloemfontein 4.252.
    ciudades: ["Pretoria", "Cape Town", "Durban", "East London", "Johannesburg", "Bloemfontein"],
    // Las palabras que más se repiten en los títulos de sus ofertas en la base
    // el 6 nov 2026: engineer 5.939, sales 2.588, assistant 2.134, technician
    // 1.774 y analyst 1.753.
    keywordsLaborales: ["engineer", "sales", "assistant", "technician", "analyst"],
    slug: "sudafrica",
  },
};

/** Lista plana de países ordenados por mayor salario medio */
export const LISTA_PAISES: PaisConfig[] = [
  PAISES.CH,  // Suiza — 6.800 CHF/mes
  PAISES.AU,  // Australia — 6.800 AUD/mes
  PAISES.US,  // EEUU — 5.000 USD/mes
  PAISES.CA,  // Canadá — 5.200 CAD/mes
  PAISES.NO,  // Noruega — 48.000 NOK/mes
  PAISES.DK,  // Dinamarca — 42.000 DKK/mes
  PAISES.NZ,  // Nueva Zelanda — 5.500 NZD/mes (~3.040€)
  PAISES.DE,  // Alemania — 4.200 EUR/mes
  PAISES.SG,  // Singapur — 5.800 SGD/mes (~4.085 €)
  PAISES.IE,  // Irlanda — 4.000 EUR/mes
  PAISES.SE,  // Suecia — 38.000 SEK/mes
  PAISES.NL,  // Países Bajos — 3.800 EUR/mes
  PAISES.FR,  // Francia — 3.500 EUR/mes
  PAISES.AT,  // Austria — 3.600 EUR/mes
  PAISES.BE,  // Bélgica — 3.700 EUR/mes
  PAISES.FI,  // Finlandia — 3.500 EUR/mes
  PAISES.UK,  // Reino Unido — 3.100 GBP/mes
  PAISES.CY,  // Chipre — 2.605 EUR/mes
  PAISES.SI,  // Eslovenia — 2.536 EUR/mes
  PAISES.IT,  // Italia — 2.500 EUR/mes
  PAISES.JP,  // Japón — 398.000 JPY/mes (~2.412 €)
  PAISES.MT,  // Malta — 2.282 EUR/mes, salario base
  PAISES.ES,  // España — 2.100 EUR/mes
  PAISES.ZA,  // Sudáfrica — 30.611 ZAR/mes (~1.658 €)
  PAISES.SK,  // Eslovaquia — 1.620 EUR/mes
  PAISES.GR,  // Grecia — 1.600 EUR/mes
  PAISES.PT,  // Portugal — 1.600 EUR/mes
  PAISES.PL,  // Polonia — 8.000 PLN/mes
  PAISES.CZ,  // República Checa — 1.900 EUR/mes
  PAISES.HU,  // Hungría — 1.300 EUR/mes
  PAISES.RO,  // Rumanía — 1.100 EUR/mes
  PAISES.MX,  // México — 20.490 MXN/mes (~975 €)
  PAISES.BR,  // Brasil — 3.722 BRL/mes (~604 €)
  PAISES.CO,  // Colombia — 2.158.174 COP/mes (~597 €)
  PAISES.PE,  // Perú — 1.887 PEN/mes (~485 €)
  PAISES.CL,  // Chile — 962.945 CLP/mes (~871 €)
  PAISES.AR,  // Argentina — 1.982.518 ARS/mes (~1.138 €)
  PAISES.EC,  // Ecuador — 513 USD/mes (~455 €)
  PAISES.GT,  // Guatemala — 2.713 GTQ/mes (~315 €)
  PAISES.CR,  // Costa Rica — 723.135 CRC/mes (~1.418 €)
  PAISES.UY,  // Uruguay — 56.920 UYU/mes (~1.261 €)
  PAISES.SV,  // El Salvador — 437 USD/mes (~388 €)
  PAISES.PA,  // Panamá — 756 PAB/mes, mediana (~671 €)
  PAISES.DO,  // República Dominicana — 39.566 DOP/mes (~575 €)
  PAISES.NI,  // Nicaragua — 16.447 NIO/mes, afiliados al INSS (~402 €)
  PAISES.HN,  // Honduras — 10.356 HNL/mes (~341 €)
  PAISES.VE,  // Venezuela — 253.603 VES/mes, privado formal según Fedecámaras (~253 €)
  PAISES.IN,  // India — 22.699 INR/mes (~216 €)
];

/** Número oficial de países que soporta BuscayCurra */
export const NUM_PAISES = LISTA_PAISES.length;

/** Formatea un salario según el país */
export function formatearSalario(cantidad: number, codigoPais: string): string {
  const pais = PAISES[codigoPais] || PAISES.ES;
  const { simboloMoneda, posicionSimbolo, formatoMiles, formatoDecimal } = pais;

  const partes = Math.round(cantidad).toString().split(".");
  const enteros = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, formatoMiles);
  const numero = partes.length > 1 ? `${enteros}${formatoDecimal}${partes[1]}` : enteros;

  return posicionSimbolo === "antes"
    ? `${simboloMoneda}${numero}`
    : `${numero} ${simboloMoneda}`;
}

/** Convierte salario de EUR a moneda local */
export function convertirSalario(eurAmount: number, codigoPais: string): number {
  const pais = PAISES[codigoPais] || PAISES.ES;
  return Math.round(eurAmount * pais.tasaCambioEUR);
}

/** Mapa inverso: slug en español → código ISO. Ej: "estados-unidos" → "US" */
export const SLUG_A_CODIGO: Record<string, string> = {};
for (const [codigo, pais] of Object.entries(PAISES)) {
  SLUG_A_CODIGO[pais.slug] = codigo;
}

// Cómo lo escribe la gente cuando no pone el nombre oficial.
const OTROS_NOMBRES: Record<string, string> = {
  eeuu: "US", "ee uu": "US", usa: "US", "estados unidos de america": "US",
  inglaterra: "UK", uk: "UK", "gran bretana": "UK", escocia: "UK", gales: "UK",
  holanda: "NL", "republica checa": "CZ", chequia: "CZ",
  mejico: "MX", "republica mexicana": "MX", "estados unidos mexicanos": "MX",
  brazil: "BR", "republica federativa do brasil": "BR",
  bharat: "IN",
  surafrica: "ZA", "sud africa": "ZA", "republica de sudafrica": "ZA",
  "republica eslovaca": "SK", slovakia: "SK", slovenia: "SI", cyprus: "CY",
  "republica de chipre": "CY",
};

const sinTildes = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[.]/g, " ").replace(/\s+/g, " ").trim();

/**
 * "Japón", "Australia", "Inglaterra" → su código. null si no es un país nuestro.
 *
 * POR QUÉ (21 oct 2026). En el "¿Dónde?" del buscador la gente escribe el país
 * entero, y se buscaba como si fuera una ciudad que se llamara así: "Japón" no
 * encontraba nada y acababa devolviendo camareros de Sevilla y Madrid.
 */
export function paisPorNombre(texto: string): string | null {
  const t = sinTildes(texto || "");
  if (t.length < 2) return null;
  if (OTROS_NOMBRES[t]) return OTROS_NOMBRES[t];
  const pais = LISTA_PAISES.find((p) => sinTildes(p.nombre) === t || sinTildes(p.nombreLocal) === t);
  return pais ? pais.codigo : null;
}
