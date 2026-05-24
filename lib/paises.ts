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
    salarioMinimo: 2151,
    salarioMedio: 4100,
    tasaCambioEUR: 1,
    formatoMiles: ".",
    formatoDecimal: ",",
    ciudades: ["Berlin", "München", "Hamburg", "Frankfurt", "Köln", "Stuttgart", "Düsseldorf"],
    keywordsLaborales: ["Kellner", "Programmierer", "Bürokaufmann", "Vertrieb", "Krankenpfleger"],
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
    salarioMedio: 3400,
    tasaCambioEUR: 1,
    formatoMiles: " ",
    formatoDecimal: ",",
    ciudades: ["Paris", "Lyon", "Marseille", "Toulouse", "Bordeaux", "Lille", "Nantes"],
    keywordsLaborales: ["serveur", "développeur", "administratif", "commercial", "infirmier"],
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
    salarioMinimo: 870,
    salarioMedio: 1500,
    tasaCambioEUR: 1,
    formatoMiles: ".",
    formatoDecimal: ",",
    ciudades: ["Lisboa", "Porto", "Braga", "Coimbra", "Faro", "Aveiro", "Setúbal"],
    keywordsLaborales: ["empregado", "programador", "administrativo", "comercial", "enfermeiro"],
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
    salarioMinimo: 2070,
    salarioMedio: 3700,
    tasaCambioEUR: 1,
    formatoMiles: ".",
    formatoDecimal: ",",
    ciudades: ["Amsterdam", "Rotterdam", "Den Haag", "Utrecht", "Eindhoven", "Groningen"],
    keywordsLaborales: ["ober", "programmeur", "administratief", "verkoper", "verpleegkundige"],
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
    salarioMinimo: 4300,
    salarioMedio: 7500,
    tasaCambioEUR: 4.32,
    formatoMiles: " ",
    formatoDecimal: ",",
    ciudades: ["Warszawa", "Kraków", "Wrocław", "Gdańsk", "Poznań", "Łódź"],
    keywordsLaborales: ["kelner", "programista", "administracyjny", "sprzedawca", "pielęgniarka"],
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
    salarioMinimo: 2200,
    salarioMedio: 3800,
    tasaCambioEUR: 1,
    formatoMiles: ",",
    formatoDecimal: ".",
    ciudades: ["Dublin", "Cork", "Galway", "Limerick", "Waterford"],
    keywordsLaborales: ["waiter", "developer", "administrator", "sales", "nurse"],
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
    salarioMinimo: 2070,
    salarioMedio: 3600,
    tasaCambioEUR: 1,
    formatoMiles: ".",
    formatoDecimal: ",",
    ciudades: ["Brussel", "Antwerpen", "Gent", "Liège", "Brugge"],
    keywordsLaborales: ["ober", "programmeur", "administratief", "verkoper", "verpleegkundige"],
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
    salarioMinimo: 1930,
    salarioMedio: 2900,
    tasaCambioEUR: 0.86,
    formatoMiles: ",",
    formatoDecimal: ".",
    ciudades: ["London", "Manchester", "Birmingham", "Edinburgh", "Glasgow", "Leeds", "Bristol"],
    keywordsLaborales: ["waiter", "developer", "administrator", "sales", "nurse"],
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
    salarioMinimo: 2500,
    salarioMedio: 5000,
    tasaCambioEUR: 1.48,
    formatoMiles: ",",
    formatoDecimal: ".",
    ciudades: ["Toronto", "Vancouver", "Montreal", "Calgary", "Ottawa", "Edmonton", "Québec"],
    keywordsLaborales: ["waiter", "developer", "administrative", "sales", "nurse"],
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
    salarioMinimo: 3500,
    salarioMedio: 6500,
    tasaCambioEUR: 1.65,
    formatoMiles: ",",
    formatoDecimal: ".",
    ciudades: ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide", "Gold Coast", "Canberra"],
    keywordsLaborales: ["waiter", "developer", "administrator", "sales", "nurse"],
  },
};

/** Lista plana de países ordenados por mayor salario medio */
export const LISTA_PAISES: PaisConfig[] = [
  PAISES.CH,  // Suiza — 6,500 CHF/mes
  PAISES.AU,  // Australia — 6,500 AUD/mes
  PAISES.US,  // EEUU — 5,000 USD/mes
  PAISES.CA,  // Canadá — 5,000 CAD/mes
  PAISES.NO,  // Noruega — 48,000 NOK/mes
  PAISES.DK,  // Dinamarca — 42,000 DKK/mes
  PAISES.DE,  // Alemania — 4,100 EUR/mes
  PAISES.IE,  // Irlanda — 3,800 EUR/mes
  PAISES.SE,  // Suecia — 38,000 SEK/mes
  PAISES.NL,  // Países Bajos — 3,700 EUR/mes
  PAISES.AT,  // Austria — 3,600 EUR/mes
  PAISES.BE,  // Bélgica — 3,600 EUR/mes
  PAISES.FI,  // Finlandia — 3,500 EUR/mes
  PAISES.FR,  // Francia — 3,400 EUR/mes
  PAISES.UK,  // Reino Unido — 2,900 GBP/mes
  PAISES.IT,  // Italia — 2,500 EUR/mes
  PAISES.ES,  // España — 2,100 EUR/mes
  PAISES.PT,  // Portugal — 1,500 EUR/mes
  PAISES.PL,  // Polonia — 7,500 PLN/mes
];

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
