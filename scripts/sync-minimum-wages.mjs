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
// currency=NAC: en la moneda de cada pais, que es en la que los enseña la pantalla
// (en euros, Polonia salia unas 4 veces mas baja con el simbolo del zloty). Antes
// se pedia unit= y na_item=, que el dataset ya no admite: daba un 400 (1 nov 2026).
const EUROSTAT_URL =
  "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/earn_mw_cur" +
  "?format=JSON&lang=EN&currency=NAC";

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
  MX: { salarioMinimo: 9582,  moneda: "MXN", nota: "Zona general: $315,04/día × 30,4 (CONASAMI, ene 2026). Frontera norte: $440,87/día." },
  BR: { salarioMinimo: 1621,  moneda: "BRL", nota: "Salário mínimo nacional 2026 (Decreto 12.797/2025). Algunos estados fijan un piso regional más alto." },
  IN: { salarioMinimo: 21502, moneda: "INR", nota: "India no tiene mínimo nacional: el floor wage del Code on Wages sigue sin cifra. Mínimo del Gobierno central para un no cualificado en zona A (grandes ciudades): 827 ₹ al día desde el 1 abr 2026 × 26 días. Cada estado fija el suyo." },
  ZA: { salarioMinimo: 5895, moneda: "ZAR", nota: "National Minimum Wage: R30,23 la hora desde el 1 mar 2026 (GN R.7083) × 45 horas × 4⅓ semanas (BCEA, art. 35). Vale también para el campo y el servicio doméstico." },
  // Venezuela: el integral en bolívares, NO el legal (130 Bs, que va en lib/paises.ts). Ver el comentario de PAISES.VE.
  VE: { salarioMinimo: 215069, moneda: "VES", nota: "NO es el salario mínimo legal (Bs. 130 desde el 15 mar 2022, Decreto 4.653, GO Ext. 6.691; unos 0,15 US$). Es el ingreso mínimo integral de 240 US$ (200 de bono contra la guerra económica + 40 de cestaticket) pasado a bolívares a la tasa del BCV del 6 nov 2026 (896,1225). Son bonos: no cuentan para prestaciones. El bono solo obliga al sector público. Caduca con el bolívar: actualizar cada mes.", fuente: "Anuncio del Gobierno (30 abr 2026), sin Gaceta Oficial" },
  NI: { salarioMinimo: 9238, moneda: "NIO", nota: "Salario mínimo promedio de los nueve sectores, del 1 mar 2026 al 28 feb 2027 (Acta 1 CNSM-05/03/2026, Ley 625), sin zona franca. Cada sector tiene el suyo: de C$6.188,02 en el campo a C$13.848,23 en construcción y finanzas; comercio, restaurantes y hoteles, C$11.350,08." },
  HN: { salarioMinimo: 14917, moneda: "HNL", nota: "Salario mínimo promedio vigente en 2026 (comunicado SAR-19-2026, Acuerdo Ejecutivo SETRASS 233-2026). Cada sector y tamaño de empresa tiene el suyo." },
  DO: { salarioMinimo: 29988, moneda: "DOP", nota: "Salario mínimo del sector privado no sectorizado en grandes empresas desde el 1 feb 2026 (Resolución CNS-01-2025). Medianas, RD$27.489,60; pequeñas y micro, menos." },
  PA: { salarioMinimo: 628, moneda: "PAB", nota: "En Panamá el mínimo va por hora, actividad y región (Decreto Ejecutivo 13 de 2025, desde el 16 ene 2026). Comercio en gran empresa, región 1: B/.3,02 la hora; unos B/.628 al mes con 48 horas semanales." },
  SV: { salarioMinimo: 408.8, moneda: "USD", nota: "Salario mínimo de industria, comercio y servicios desde el 1 jun 2025 (Decreto Ejecutivo 11); sin decreto nuevo en 2026. Maquila y campo tienen el suyo." },
  UY: { salarioMinimo: 25383, moneda: "UYU", nota: "Salario mínimo nacional desde el 1 jul 2026 (Decreto 64/2025 del MTSS). De enero a junio era de $24.572." },
  CR: { salarioMinimo: 373092, moneda: "CRC", nota: "Salario mínimo 2026 del trabajador en ocupación no calificada genérico (Decreto Ejecutivo 45303-MTSS). Cada ocupación tiene el suyo; el doméstico es más bajo." },
  GT: { salarioMinimo: 4002, moneda: "GTQ", nota: "Salario mínimo 2026 de actividades no agrícolas en el departamento de Guatemala (Acuerdo Gubernativo 256-2025), más Q250 de bonificación incentivo. En el resto del país, Q3.816,90." },
  EC: { salarioMinimo: 482, moneda: "USD", nota: "Salario básico unificado 2026 (Acuerdo Ministerial MDT-2025-195). Ecuador usa el dólar." },
  AR: { salarioMinimo: 398800, moneda: "ARS", nota: "Salario mínimo, vital y móvil de noviembre de 2026 (Resolución 4/2026). Sube cada mes: 406.400 $ en diciembre y 437.000 $ en abril de 2027." },
  CL: { salarioMinimo: 553553, moneda: "CLP", nota: "Ingreso mínimo mensual de 18 a 65 años desde el 1 may 2026 (Ley 21.830). Para menores de 18 y mayores de 65 es más bajo." },
  PE: { salarioMinimo: 1230, moneda: "PEN", nota: "Remuneración mínima vital desde el 1 oct 2026 (Decreto Supremo 015-2026-TR). Subirá a S/ 1.300 en el primer semestre de 2027." },
  CO: { salarioMinimo: 1750905, moneda: "COP", nota: "Salario mínimo 2026 (Decreto 1469 de 2025; el Decreto 159 de 2026 mantuvo la cifra). Hasta dos mínimos se suman 249.095 $ de auxilio de transporte." },
};

// ─── Mapeo código Eurostat → código BuscayCurra ───────────────────────────────
// MT, SK, SI y CY entran el 6 nov 2026; los cuatro usan el euro, así que no
// hace falta MONEDA_NACIONAL.
const EUROSTAT_MAP = {
  BE: "BE", BG: null, CZ: null, DE: "DE", EE: null,
  IE: "IE", EL: "GR", ES: "ES", FR: "FR", HR: null,
  LT: null, LU: null, LV: null, MT: "MT", NL: "NL",
  PL: "PL", PT: "PT", RO: null, SI: "SI", SK: "SK",
  HU: null, CY: "CY",
};

// De los que se usan, el unico que no tiene el euro.
const MONEDA_NACIONAL = { PL: "PLN" };

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

    // El índice en el array plano (orden: freq × currency × geo × time). Con una
    // sola frecuencia y una moneda, el índice es: gIdx * nTime + tIdx
    const valueIdx = gIdx * nTime + tIdx;
    const wage = value[valueIdx];

    if (wage != null && !isNaN(wage)) {
      result[byc] = {
        salarioMinimo: Math.round(wage),
        moneda: MONEDA_NACIONAL[byc] || "EUR",
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

  // Si Eurostat falla se para sin escribir nada: el fichero se queda como está y la
  // tarea sale en rojo. El 1 nov 2026, el "usar datos anteriores" que había aquí
  // miraba en el sitio equivocado y dejó el fichero sin España ni otros 8 países.
  const datosEurostat = parseEurostat(await fetchEurostat());
  console.log(`  ✅ ${Object.keys(datosEurostat).length} países obtenidos de Eurostat`);

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
      // Cada país puede decir su fuente: el ingreso de Venezuela se anunció sin
      // Gaceta, y llamarlo "Fuente oficial nacional" exageraba.
      resultado.paises[codigo] = {
        ...datos,
        fuente: datos.fuente || "Fuente oficial nacional",
      };
    }
  }

  // Un país que este mes no venga se queda con su último dato: nunca se pierde.
  for (const [codigo, datos] of Object.entries(datosPrevios.paises || {})) {
    if (!resultado.paises[codigo]) {
      console.log(`  ⚠️  ${codigo}: sin dato nuevo, se mantiene el anterior`);
      resultado.paises[codigo] = datos;
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
