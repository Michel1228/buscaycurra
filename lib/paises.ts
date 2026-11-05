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
  PAISES.IT,  // Italia — 2.500 EUR/mes
  PAISES.JP,  // Japón — 398.000 JPY/mes (~2.412 €)
  PAISES.ES,  // España — 2.100 EUR/mes
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
