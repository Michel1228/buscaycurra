/**
 * GET /api/salarios — Estadísticas salariales desde la BD
 */
import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { PAISES } from "@/lib/paises";
import { normalizarPais } from "@/lib/origen/movilidad";
import { readFileSync } from "fs";
import { resumirSalarios } from "@/lib/salarios/anual";
import { join } from "path";

export const dynamic = "force-dynamic";

// ─── Carga de datos de salarios mínimos (cache en módulo) ───
interface SalarioMinimoPais {
  salarioMinimo: number;
  moneda: string;
  periodo?: string;
  fuente?: string;
  nota?: string;
}

let _salariosMinimosCache: Record<string, SalarioMinimoPais> | null = null;

function getSalariosMinimos(): Record<string, SalarioMinimoPais> {
  if (_salariosMinimosCache) return _salariosMinimosCache;
  try {
    const raw = readFileSync(join(process.cwd(), "public", "data", "salarios-minimos.json"), "utf-8");
    const data = JSON.parse(raw);
    _salariosMinimosCache = data.paises || {};
  } catch {
    _salariosMinimosCache = {};
  }
  return _salariosMinimosCache!;
}

interface SalarioRow {
  avg_salary: number;
  min_salary: number;
  max_salary: number;
  total: number;
}

interface ProvinciaRow {
  province: string;
  count: number;
  avg_salary: number;
}

// ─── Ocupaciones con sueldo (lista de arriba de la pantalla) ───
//
// Recorre TODAS las ofertas activas de España con sueldo (unas 6.200 de 2,4
// millones, sin índice que ayude: unos 10 s). Cambia poco, así que se guarda
// seis horas en memoria en vez de repetir la consulta en cada visita.
interface Ocupacion {
  puesto: string;
  total: number;
  avg_salary: number;
  min_salary: number;
  max_salary: number;
}
let _ocupacionesCache: { ts: number; datos: Ocupacion[] } | null = null;

async function ocupacionesConSueldo(pool: ReturnType<typeof getPool>): Promise<Ocupacion[]> {
  if (_ocupacionesCache && Date.now() - _ocupacionesCache.ts < 6 * 60 * 60 * 1000) {
    return _ocupacionesCache.datos;
  }
  const { rows } = await pool.query(
    `SELECT LOWER(TRIM(REGEXP_REPLACE(title, '(Senior|Junior|Jr\\.|Sr\\.|Lead|Trainee|Becario|Prácticas)', '', 'gi'))) AS ocupacion,
            salary
     FROM "JobListing"
     WHERE "isActive" = true AND salary ~ '[0-9]' AND LOWER(country) = 'es'`
  );
  const grupos = new Map<string, string[]>();
  for (const r of rows as Array<{ ocupacion: string | null; salary: string }>) {
    const o = (r.ocupacion || "").trim();
    if (o.length <= 2) continue;
    if (!grupos.has(o)) grupos.set(o, []);
    grupos.get(o)!.push(r.salary);
  }
  const datos: Ocupacion[] = [];
  for (const [puesto, sueldos] of grupos) {
    const r = resumirSalarios(sueldos);
    if (r && r.conSalario >= 10 && r.tipico >= 12000) {
      datos.push({ puesto, total: r.conSalario, avg_salary: r.tipico, min_salary: r.bajo, max_salary: r.alto });
    }
  }
  datos.sort((a, b) => b.total - a.total).splice(10);
  _ocupacionesCache = { ts: Date.now(), datos };
  return datos;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const puesto = (searchParams.get("puesto") || "").trim();
  const provincia = (searchParams.get("provincia") || "").trim();
  // normalizarPais convierte "GB" en "UK". La pantalla de salarios manda "GB"
  // para el Reino Unido, pero el fichero de salarios minimos y lib/paises.ts
  // usan "UK": sin esto no se encontraba el salario minimo britanico, el factor
  // salia 1,00 y los sueldos de Londres se ensenaban identicos a los de Madrid.
  const pais = normalizarPais(searchParams.get("pais") || "ES") || "ES";

  // Si es un país distinto de España, devolver datos de referencia con ajuste GDP
  if (pais && pais !== "ES") {
    const refData = obtenerDatosReferenciaPais(puesto, pais);
    return NextResponse.json({
      ...refData,
      puesto: puesto || "",
      provincia: provincia || null,
      provinciaDetalle: null,
    });
  }

  try {
    const pool = getPool();

    if (!puesto) {
      // Sin puesto: las ocupaciones con más ofertas con sueldo publicado.
      const ocupaciones = await ocupacionesConSueldo(pool);

      // Si no hay suficientes datos reales, devolver datos de referencia del mercado español 2026
      if (ocupaciones.length < 5) {
        return NextResponse.json({
          top: [
            { puesto: "camarero", total: 8540, avg_salary: 19200, min_salary: 16576, max_salary: 28000 },
            { puesto: "dependiente", total: 6200, avg_salary: 18500, min_salary: 16576, max_salary: 26000 },
            { puesto: "administrativo", total: 5100, avg_salary: 22500, min_salary: 18000, max_salary: 35000 },
            { puesto: "programador", total: 4800, avg_salary: 38000, min_salary: 24000, max_salary: 65000 },
            { puesto: "enfermero", total: 3500, avg_salary: 28000, min_salary: 22000, max_salary: 42000 },
            { puesto: "electricista", total: 2900, avg_salary: 24000, min_salary: 18000, max_salary: 36000 },
            { puesto: "conductor", total: 2700, avg_salary: 22000, min_salary: 18000, max_salary: 32000 },
            { puesto: "cocinero", total: 2500, avg_salary: 21000, min_salary: 17000, max_salary: 30000 },
          ],
          puesto: "",
          provincia: null,
          fuente: "referencia",
          rangoGeneral: null,
          porProvincia: [],
        });
      }

      return NextResponse.json({
        top: ocupaciones.slice(0, 8),
        puesto: "",
        provincia: null,
        fuente: "ofertas",
        rangoGeneral: null,
        porProvincia: [],
      });
    }

    // Búsqueda con puesto específico
    const puestoClean = puesto.toLowerCase().trim();
    const kw = `%${puestoClean}%`;

    // UNA consulta, solo por título (tiene índice GIN trigram; la descripción
    // no) y solo España, y el resumen se hace aquí con lib/salarios/anual.ts.
    // Antes eran tres consultas con expresiones regulares en SQL que leían mal
    // los sueldos: camarero salía con mínimo 144 € y máximo 95 €.
    const { rows } = await pool.query(
      `SELECT salary, province, city FROM "JobListing"
       WHERE "isActive" = true AND title ILIKE $1 AND LOWER(country) = 'es'
         AND salary ~ '[0-9]'
       LIMIT 5000`,
      [kw]
    );
    const filas = rows as Array<{ salary: string | null; province: string | null; city: string | null }>;
    const resumen = resumirSalarios(filas.map((r) => r.salary));

    // Si no hay datos reales, usar datos de referencia
    if (!resumen || resumen.conSalario < 3) {
      const refData = obtenerDatosReferencia(puestoClean);
      return NextResponse.json({
        ...refData,
        puesto: puesto,
        provincia: provincia || null,
        provinciaDetalle: null,
      });
    }

    // Los nombres de campo se mantienen por la pantalla: "avg" es la mediana y
    // "min"/"max" la mitad central de las ofertas (percentiles 25 y 75).
    const rangoGeneral = {
      total: resumen.conSalario,
      avg_salary: resumen.tipico,
      min_salary: resumen.bajo,
      max_salary: resumen.alto,
    };

    // Por provincia (o ciudad si la oferta no trae provincia)
    const porZona = new Map<string, string[]>();
    for (const r of filas) {
      const zona = (r.province || "").trim() || (r.city || "").trim();
      if (!zona || !r.salary) continue;
      if (!porZona.has(zona)) porZona.set(zona, []);
      porZona.get(zona)!.push(r.salary);
    }
    const porProvincia: ProvinciaRow[] = [];
    for (const [province, sueldos] of porZona) {
      const z = resumirSalarios(sueldos);
      if (z && z.conSalario >= 3) porProvincia.push({ province, count: z.conSalario, avg_salary: z.tipico });
    }
    porProvincia.sort((a, b) => b.count - a.count).splice(15);

    // Detalle de la provincia pedida
    let provinciaDetalle = null;
    if (provincia) {
      const buscada = provincia.toLowerCase().trim();
      const z = resumirSalarios(
        filas
          .filter((r) => (r.province || "").toLowerCase().includes(buscada) || (r.city || "").toLowerCase().includes(buscada))
          .map((r) => r.salary)
      );
      if (z) provinciaDetalle = { count: z.conSalario, avg_salary: z.tipico };
    }

    return NextResponse.json({
      puesto,
      provincia: provincia || null,
      fuente: "ofertas",
      rangoGeneral,
      porProvincia,
      provinciaDetalle,
    });

  } catch (error) {
    console.error("[Salarios API]", error);
    // En caso de error, devolver datos de referencia
    const refData = obtenerDatosReferencia(puesto.toLowerCase().trim());
    return NextResponse.json({
      ...refData,
      puesto: puesto || "",
      provincia: provincia || null,
      provinciaDetalle: null,
    });
  }
}

function obtenerDatosReferencia(puesto: string): {
  fuente: "referencia";
  moneda: string;
  rangoGeneral: { min_salary: number; max_salary: number; avg_salary: number; total: number; fuente: string };
  porProvincia: Array<{ province: string; count: number; avg_salary: number }>;
} {
  // Datos de referencia: salarios medios anuales por provincia (INE + portales empleo 2026)
  // Índice: multiplicador sobre la media nacional para cada provincia
  const indiceProvincial: Record<string, number> = {
    Madrid: 1.22, Barcelona: 1.18, Vizcaya: 1.12, Guipúzcoa: 1.10, Álava: 1.08,
    Navarra: 1.05, Zaragoza: 1.02, Baleares: 0.98, Girona: 0.97, Tarragona: 0.95,
    Valencia: 0.94, Alicante: 0.91, Castellón: 0.90, Lleida: 0.89,
    Asturias: 0.93, Cantabria: 0.92, "La Rioja": 0.91,
    Valladolid: 0.90, Burgos: 0.89, León: 0.86, Salamanca: 0.85, Segovia: 0.84,
    Palencia: 0.83, Zamora: 0.82, Ávila: 0.81, Soria: 0.80,
    Murcia: 0.87, Albacete: 0.84, Toledo: 0.86, "Ciudad Real": 0.83,
    Cuenca: 0.81, Guadalajara: 0.87,
    Sevilla: 0.90, Málaga: 0.92, Granada: 0.87, Córdoba: 0.85,
    Cádiz: 0.84, Huelva: 0.82, Jaén: 0.81, Almería: 0.83,
    "A Coruña": 0.91, Pontevedra: 0.89, Lugo: 0.83, Ourense: 0.81,
    Badajoz: 0.82, Cáceres: 0.80,
    "Las Palmas": 0.88, Tenerife: 0.86,
    Huesca: 0.84, Teruel: 0.81,
  };

  const referencias: Record<string, { min: number; avg: number; max: number }> = {
    camarero: { min: 16576, avg: 19200, max: 28000 },
    cocinero: { min: 17000, avg: 21000, max: 30000 },
    limpieza: { min: 16576, avg: 17500, max: 22000 },
    conductor: { min: 18000, avg: 22000, max: 32000 },
    electricista: { min: 18000, avg: 24000, max: 36000 },
    dependiente: { min: 16576, avg: 18500, max: 26000 },
    programador: { min: 24000, avg: 38000, max: 65000 },
    enfermero: { min: 22000, avg: 28000, max: 42000 },
    administrativo: { min: 18000, avg: 22500, max: 35000 },
    mecanico: { min: 17000, avg: 22000, max: 32000 },
    albanil: { min: 17000, avg: 21000, max: 30000 },
    almacen: { min: 16000, avg: 19000, max: 24000 },
    soldador: { min: 18000, avg: 23000, max: 34000 },
    fontanero: { min: 17500, avg: 22500, max: 33000 },
    peluquero: { min: 16576, avg: 17000, max: 22000 },
    cuidador: { min: 16000, avg: 18500, max: 23000 },
    operario: { min: 16000, avg: 19500, max: 25000 },
    repartidor: { min: 16000, avg: 19000, max: 24000 },
    cajero: { min: 16576, avg: 17200, max: 21000 },
    vendedor: { min: 16576, avg: 19000, max: 28000 },
    ingeniero: { min: 28000, avg: 42000, max: 72000 },
    contable: { min: 20000, avg: 28000, max: 42000 },
    farmaceutico: { min: 22000, avg: 32000, max: 50000 },
    abogado: { min: 24000, avg: 35000, max: 60000 },
    arquitecto: { min: 22000, avg: 32000, max: 52000 },
    diseñador: { min: 18000, avg: 25000, max: 38000 },
    profesor: { min: 22000, avg: 30000, max: 45000 },
    periodista: { min: 18000, avg: 24000, max: 38000 },
    psicologo: { min: 19000, avg: 25000, max: 38000 },
    veterinario: { min: 20000, avg: 27000, max: 42000 },
    carnicero: { min: 16000, avg: 19500, max: 25000 },
    panadero: { min: 16576, avg: 18000, max: 23000 },
    jardinero: { min: 16576, avg: 17500, max: 22000 },
    pintor: { min: 16500, avg: 20000, max: 27000 },
    carpintero: { min: 17000, avg: 21000, max: 28000 },
    informatico: { min: 22000, avg: 32000, max: 55000 },
    teleoperador: { min: 16576, avg: 17000, max: 21000 },
    mozo: { min: 16576, avg: 17500, max: 22000 },
    vigilante: { min: 17000, avg: 20000, max: 26000 },
    socorrista: { min: 16000, avg: 18000, max: 22000 },
    recepcionista: { min: 16000, avg: 18500, max: 24000 },
    auxiliar: { min: 16576, avg: 17500, max: 23000 },
    tecnico: { min: 19000, avg: 26000, max: 40000 },
    comercial: { min: 18000, avg: 25000, max: 45000 },
    jefe: { min: 28000, avg: 42000, max: 75000 },
    director: { min: 35000, avg: 55000, max: 100000 },
    consultor: { min: 24000, avg: 38000, max: 65000 },
    analista: { min: 22000, avg: 32000, max: 52000 },
  };

  // Normalizar género femenino: quitar 'a' final si termina en -era/-ora/-esa/-ista
  const femToMasc: Record<string, string> = {
    camarera: "camarero", cocinera: "cocinero", enfermera: "enfermero",
    peluquera: "peluquero", cajera: "cajero", vendedora: "vendedor",
    repartidora: "repartidor", cuidadora: "cuidador", jardinera: "jardinero",
    panadera: "panadero", carnicera: "carnicero", conductora: "conductor",
    dependienta: "dependiente", limpiadora: "limpieza",
  };
  const puestoNorm = femToMasc[puesto] || puesto;

  // Búsqueda flexible: intentar match exacto, luego substring
  let match = referencias[puestoNorm];
  if (!match) {
    for (const [key, val] of Object.entries(referencias)) {
      if (puestoNorm.includes(key) || key.includes(puestoNorm)) {
        match = val;
        break;
      }
    }
  }
  if (!match) match = { min: 18000, avg: 24000, max: 36000 };

  // Generar datos por provincia usando salario mínimo real de España como base
  const salariosMin = getSalariosMinimos();
  const smiES = salariosMin["ES"]?.salarioMinimo || 1184;
  const smiAnualES = smiES * 12; // ~14208 €/año
  // Cuenta estimada: proporcional al índice provincial, total ~3M ocupados en estos sectores
  const totalEstimado = Object.keys(indiceProvincial).length * 45;

  const provincias = Object.entries(indiceProvincial)
    .map(([prov, idx]) => {
      // Count estimado basado en población activa provincial (~45-200 ofertas de referencia)
      const countEstimado = Math.round(45 + (idx - 0.80) * 300);
      return {
        province: prov,
        count: countEstimado,
        avg_salary: Math.round(match.avg * idx),
      };
    })
    .sort((a, b) => b.avg_salary - a.avg_salary)
    .slice(0, 20);

  const paisES = PAISES["ES"];
  return {
    fuente: "referencia",
    moneda: paisES?.simboloMoneda || "€",
    rangoGeneral: {
      min_salary: Math.max(match.min, smiAnualES),
      max_salary: match.max,
      avg_salary: match.avg,
      total: 0,
      fuente: "Referencia mercado laboral español 2026 (INE + portales empleo)",
    },
    porProvincia: provincias,
  };
}

// ─── Datos de referencia para países no-España ───
// Se usa salarios-minimos.json para obtener el SMI real de cada país
// y PAISES para moneda, ciudades y datos de configuración

function obtenerDatosReferenciaPais(puesto: string, pais: string): {
  fuente: "referencia";
  /** true cuando no tenemos salario mínimo de ese país y no hay con qué estimar. */
  sinDatos: boolean;
  moneda: string;
  rangoGeneral: { min_salary: number; max_salary: number; avg_salary: number; total: number; fuente: string };
  porProvincia: Array<{ province: string; count: number; avg_salary: number }>;
} {
  const paisConfig = PAISES[pais];
  const salariosMin = getSalariosMinimos();
  const smiConocido = salariosMin[pais]?.salarioMinimo || paisConfig?.salarioMinimo;
  const smiES = salariosMin["ES"]?.salarioMinimo || 1184;
  // Si no sabemos el salario mínimo del país no hay con qué ajustar, y el factor
  // sale 1,00: es decir, se enseñarían los sueldos españoles con la bandera de
  // otro país. Eso pasaba con Argentina, México, Colombia, Chile y Perú. Se
  // marca y la pantalla lo dice, en vez de inventar.
  const sinDatos = !smiConocido;
  const smiPais = smiConocido || smiES;
  // Factor salarial: razón entre el salario mínimo del país y el español.
  const factor = smiPais / smiES;

  // Usar ciudades de PAISES como regiones; fallback a ["Nacional"]
  const regiones = (paisConfig?.ciudades && paisConfig.ciudades.length > 0)
    ? paisConfig.ciudades
    : ["Nacional"];

  // Datos base de ocupaciones (misma tabla que obtenerDatosReferencia)
  const referencias: Record<string, { min: number; avg: number; max: number }> = {
    camarero: { min: 16576, avg: 19200, max: 28000 },
    cocinero: { min: 17000, avg: 21000, max: 30000 },
    programador: { min: 24000, avg: 38000, max: 65000 },
    enfermero: { min: 22000, avg: 28000, max: 42000 },
    electricista: { min: 18000, avg: 24000, max: 36000 },
    conductor: { min: 18000, avg: 22000, max: 32000 },
    administrativo: { min: 18000, avg: 22500, max: 35000 },
    dependiente: { min: 16576, avg: 18500, max: 26000 },
    mecanico: { min: 17000, avg: 22000, max: 32000 },
    ingeniero: { min: 28000, avg: 42000, max: 72000 },
    profesor: { min: 22000, avg: 30000, max: 45000 },
    contable: { min: 20000, avg: 28000, max: 42000 },
    diseñador: { min: 18000, avg: 25000, max: 38000 },
    comercial: { min: 18000, avg: 25000, max: 45000 },
    director: { min: 35000, avg: 55000, max: 100000 },
    limpieza: { min: 16576, avg: 17500, max: 22000 },
    albañil: { min: 17000, avg: 21000, max: 30000 },
    almacen: { min: 16000, avg: 19000, max: 24000 },
    soldador: { min: 18000, avg: 23000, max: 34000 },
    fontanero: { min: 17500, avg: 22500, max: 33000 },
    peluquero: { min: 16576, avg: 17000, max: 22000 },
    cuidador: { min: 16000, avg: 18500, max: 23000 },
    operario: { min: 16000, avg: 19500, max: 25000 },
    repartidor: { min: 16000, avg: 19000, max: 24000 },
    cajero: { min: 16576, avg: 17200, max: 21000 },
    vendedor: { min: 16576, avg: 19000, max: 28000 },
    tecnico: { min: 19000, avg: 26000, max: 40000 },
    consultor: { min: 24000, avg: 38000, max: 65000 },
    analista: { min: 22000, avg: 32000, max: 52000 },
  };

  const femToMasc: Record<string, string> = {
    camarera: "camarero", cocinera: "cocinero", enfermera: "enfermero",
    peluquera: "peluquero", cajera: "cajero", vendedora: "vendedor",
    repartidora: "repartidor", cuidadora: "cuidador", jardinera: "jardinero",
    panadera: "panadero", carnicera: "carnicero", conductora: "conductor",
    dependienta: "dependiente", limpiadora: "limpieza",
  };
  const puestoClean = femToMasc[puesto.toLowerCase().trim()] || puesto.toLowerCase().trim();

  let match = referencias[puestoClean];
  if (!match) {
    for (const [key, val] of Object.entries(referencias)) {
      if (puestoClean.includes(key) || key.includes(puestoClean)) {
        match = val;
        break;
      }
    }
  }
  if (!match) match = { min: 18000, avg: 24000, max: 36000 };

  // SMI anual del país
  const smiAnualPais = smiPais * 12;

  // Generar datos por región basados en el factor salarial real
  const porProvincia = regiones.map((r, i) => {
    // Variación regional: +0% a +22% según posición en la lista (primeras = capital/más caras)
    const variacionRegional = 1.0 + (regiones.length - i) / regiones.length * 0.22;
    // Count estimado basado en nº de regiones (más regiones = país más grande)
    const countEstimado = Math.round(20 + (regiones.length - i) / regiones.length * 80);
    return {
      province: r,
      count: countEstimado,
      avg_salary: Math.round(match.avg * factor * variacionRegional),
    };
  }).sort((a, b) => b.avg_salary - a.avg_salary);

  const moneda = paisConfig?.simboloMoneda || "€";
  const nombrePais = paisConfig?.nombre || pais;

  return {
    fuente: "referencia",
    sinDatos,
    moneda,
    rangoGeneral: {
      min_salary: Math.max(Math.round(match.min * factor), smiAnualPais),
      max_salary: Math.round(match.max * factor),
      avg_salary: Math.round(match.avg * factor),
      total: 0,
      fuente: sinDatos
        ? `No tenemos el salario mínimo de ${nombrePais}: esta cifra es la referencia española sin ajustar, así que tómala solo como punto de partida.`
        : `Estimación para ${nombrePais}: referencia del mercado español ajustada por el salario mínimo oficial del país.`,
    },
    porProvincia,
  };
}
