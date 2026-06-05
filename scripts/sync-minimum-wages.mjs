#!/usr/bin/env node
/**
 * scripts/sync-minimum-wages.mjs
 *
 * Descarga los salarios mínimos oficiales desde la API de Eurostat
 * y actualiza public/data/salarios-minimos.json
 *
 * Fuente: Eurostat dataset "earn_mw_cur" (salarios mínimos mensuales en EUR)
 * URL: https://ec.europa.eu/eurostat/data/database
 *
 * Ejecutar: node scripts/sync-minimum-wages.mjs
 * GitHub Action: .github/workflows/update-migration-data.yml (cron mensual)
 */

import { writeFileSync, readFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUTPUT = join(ROOT, "public", "data", "salarios-minimos.json");

// ─── Eurostat API ─────────────────────────────────────────────────────────────
// Dataset earn_mw_cur: salarios mínimos mensuales estatutarios
// unit=EUR: convertidos a euros / na_item=MRW_MNC: salario bruto mensual
const EUROSTAT_URL =
  "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/earn_mw_cur" +
  "?format=JSON&lang=EN&unit=EUR&na_item=MRW_MNC";

// ─── Fuentes alternativas para países sin dato en Eurostat ───────────────────
// (países sin salario mínimo legal o fuera de la UE)
const FUENTES_ALTERNATIVAS = {
  SE: { salarioMinimo: 25000, moneda: "SEK", nota: "Acuerdo colectivo medio (Kollektivavtal) — no hay mínimo legal" },
  DK: { salarioMinimo: 28000, moneda: "DKK", nota: "Acuerdo colectivo medio — no hay mínimo legal" },
  NO: { salarioMinimo: 30000, moneda: "NOK", nota: "Acuerdo colectivo medio — mínimo varía por sector" },
  FI: { salarioMinimo: 2100,  moneda: "EUR", nota: "Acuerdo colectivo medio — no hay mínimo legal" },
  IT: { salarioMinimo: 1300,  moneda: "EUR", nota: "Acuerdo colectivo mínimo — no hay mínimo legal nacional" },
  AT: { salarioMinimo: 2100,  moneda: "EUR", nota: "Acuerdo colectivo mínimo — no hay mínimo legal nacional" },
  CH: { salarioMinimo: 4200,  moneda: "CHF", nota: "Varía por cantón. Ginebra: 4.434 CHF, Neuchâtel: 4.200 CHF" },
  UK: { salarioMinimo: 2116,  moneda: "GBP", nota: "National Living Wage: £12.21/h × 173h (Apr 2025)" },
  US: { salarioMinimo: 1256,  moneda: "USD", nota: "Federal: $7.25/h. California: $16/h. Varía por estado." },
  CA: { salarioMinimo: 2752,  moneda: "CAD", nota: "Ontario: $17.20/h. BC: $17.40/h. Varía por provincia." },
  AU: { salarioMinimo: 3830,  moneda: "AUD", nota: "National Minimum Wage: $23.23/h × 38h (Jul 2024)" },
  NZ: { salarioMinimo: 4019,  moneda: "NZD", nota: "Minimum Wage: $23.15/h × 40h (Apr 2025)" },
};

// ─── Mapeo código Eurostat → código BuscayCurra ───────────────────────────────
const EUROSTAT_MAP = {
  BE: "BE", BG: null, CZ: null, DE: "DE", EE: null,
  IE: "IE", EL: "GR", ES: "ES", FR: "FR", HR: null,
  LT: null, LU: null, LV: null, MT: null, NL: "NL",
  PL: "PL", PT: "PT", RO: null, SI: null, SK: null,
  HU: null,
};

async function fetchEurostat() {
  console.log("🔄 Descargando datos de Eurostat...");
  const res = await fetch(EUROSTAT_URL, {
    headers: { "Accept": "application/json" },
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) {
    throw new Error(`Eurostat API error: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  return json;
}

function parseEurostat(json) {
  const result = {};
  const { value, dimension } = json;

  if (!value || !dimension) {
    throw new Error("Formato inesperado de Eurostat API");
  }

  // El dataset tiene dimensiones: unit, na_item, geo, time
  // Necesitamos el índice de cada dimensión
  const geoDim = dimension.geo;
  const timeDim = dimension.time;

  if (!geoDim || !timeDim) {
    throw new Error("Dimensiones 'geo' o 'time' no encontradas en Eurostat response");
  }

  const geoIndex = geoDim.category.index;
  const timeIndex = timeDim.category.index;

  // Obtener el periodo más reciente disponible
  const periodos = Object.keys(timeIndex).sort().reverse();
  if (periodos.length === 0) throw new Error("Sin periodos en Eurostat response");
  const periodoReciente = periodos[0];
  const tIdx = timeIndex[periodoReciente];

  // Número de países y periodos para navegar el array plano de values
  const nGeo = Object.keys(geoIndex).length;
  const nTime = Object.keys(timeIndex).length;

  console.log(`  📅 Periodo más reciente: ${periodoReciente}`);

  for (const [eurostatCode, byc] of Object.entries(EUROSTAT_MAP)) {
    if (!byc) continue;

    const gIdx = geoIndex[eurostatCode];
    if (gIdx === undefined) continue;

    // El índice en el array plano (asumiendo orden: unit × na_item × geo × time)
    // Dado que filtramos unit=EUR y na_item=MRW_MNC, el índice es: gIdx * nTime + tIdx
    const valueIdx = gIdx * nTime + tIdx;
    const wage = value[valueIdx];

    if (wage != null && !isNaN(wage)) {
      result[byc] = {
        salarioMinimo: Math.round(wage),
        moneda: "EUR",
        periodo: periodoReciente,
        fuente: "Eurostat earn_mw_cur",
      };
    }
  }

  return result;
}

async function main() {
  const fechaActualizacion = new Date().toISOString().slice(0, 10);

  // Cargar datos anteriores si existen (para fallback)
  let datosPrevios = {};
  if (existsSync(OUTPUT)) {
    try {
      datosPrevios = JSON.parse(readFileSync(OUTPUT, "utf-8"));
    } catch {}
  }

  let datosEurostat = {};
  try {
    const json = await fetchEurostat();
    datosEurostat = parseEurostat(json);
    console.log(`  ✅ ${Object.keys(datosEurostat).length} países obtenidos de Eurostat`);
  } catch (err) {
    console.warn(`  ⚠️  Error Eurostat: ${err.message}. Usando datos anteriores como base.`);
    // Mantener datos previos del Eurostat si los había
    for (const [k, v] of Object.entries(datosPrevios)) {
      if (v.fuente === "Eurostat earn_mw_cur") datosEurostat[k] = v;
    }
  }

  // Combinar datos Eurostat + fuentes alternativas
  const resultado = {
    actualizadoEn: fechaActualizacion,
    nota: "Salarios mínimos mensuales brutos. Países UE: fuente Eurostat. Resto: agencias oficiales.",
    paises: {},
  };

  // Primero los de Eurostat
  for (const [codigo, datos] of Object.entries(datosEurostat)) {
    resultado.paises[codigo] = datos;
  }

  // Luego las fuentes alternativas (para países no cubiertos por Eurostat)
  for (const [codigo, datos] of Object.entries(FUENTES_ALTERNATIVAS)) {
    if (!resultado.paises[codigo]) {
      resultado.paises[codigo] = {
        ...datos,
        fuente: "Fuente oficial nacional",
      };
    }
  }

  // Comparar con datos anteriores y loguear cambios
  if (datosPrevios.paises) {
    let cambios = 0;
    for (const [codigo, datos] of Object.entries(resultado.paises)) {
      const prev = datosPrevios.paises?.[codigo];
      if (prev && prev.salarioMinimo !== datos.salarioMinimo) {
        console.log(
          `  📊 ${codigo}: ${prev.salarioMinimo} ${prev.moneda} → ${datos.salarioMinimo} ${datos.moneda}`
        );
        cambios++;
      }
    }
    if (cambios === 0) console.log("  ℹ️  Sin cambios respecto a datos anteriores.");
  }

  // Guardar
  if (!existsSync(join(ROOT, "public", "data"))) {
    mkdirSync(join(ROOT, "public", "data"), { recursive: true });
  }

  writeFileSync(OUTPUT, JSON.stringify(resultado, null, 2), "utf-8");
  console.log(`✅ Guardado: public/data/salarios-minimos.json (${Object.keys(resultado.paises).length} países)`);
}

main().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
