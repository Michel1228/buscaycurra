/**
 * lib/guzzi/desplazamiento.ts — ¿Me sale a cuenta trabajar en la ciudad de al lado?
 *
 * POR QUÉ EXISTE. Mucha gente no encuentra nada en su pueblo y se rinde ahí,
 * porque mirar fuera "suena caro" y nadie echa las cuentas. Casi siempre esas
 * cuentas no se hacen por pereza, no porque no compensen. Esto las hace por él:
 * cuánto hay de distancia, cuánto cuesta el gasóleo cada mes, cuánto baja si va
 * con alguien, y qué parte del sueldo se queda por el camino.
 *
 * DE DÓNDE SALEN LOS DATOS, que es lo que importa:
 *
 *  - Precio del carburante: API oficial del Ministerio para la Transición
 *    Ecológica, precio real por provincia, actualizado a diario. Gratis y sin
 *    clave. Es el precio de verdad de hoy, no una media inventada.
 *  - Coordenadas: OpenStreetMap, guardadas en la tabla ciudad_coords.
 *  - Salario: el de la oferta, cuando lo trae. Solo 1 de cada 5 lo trae; con
 *    las otras se da el coste y se dice claramente que falta el sueldo.
 *
 * LO QUE NO SE INVENTA. No hay peajes (no tenemos esa base de datos), no hay
 * datos de cuánta gente hace cada ruta (nadie nos los da), y la distancia es
 * estimada, no medida por carretera. Todo eso se dice, no se disimula.
 */

import { getPool } from "@/lib/db";

/** Kilómetros en línea recta entre dos puntos de la Tierra. */
function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // radio de la Tierra en km
  const rad = (g: number) => (g * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/**
 * La carretera nunca va en línea recta. Se multiplica por 1,25, que es el
 * rodeo habitual en la red viaria europea. Es una ESTIMACIÓN, y así se dice
 * al usuario: para el número exacto está su navegador de mapas.
 */
const RODEO_CARRETERA = 1.25;

/** Días que se va a trabajar al mes, de media (5 días × 4,4 semanas). */
const DIAS_LABORABLES_MES = 22;

/** Litros a los 100 km de un coche medio. Conservador: si falla, es por arriba. */
const CONSUMO_MEDIO = 6.5;

export interface Coords { lat: number; lon: number }

/**
 * Coordenadas de una ciudad. Primero la tabla; si no está, OpenStreetMap y se
 * guarda para la próxima. Devuelve null si no se sabe — nunca una posición
 * inventada, que daría una distancia falsa.
 */
export async function coordsCiudad(ciudad: string, pais = "ES"): Promise<Coords | null> {
  const limpia = ciudad.split(",")[0].trim();
  if (!limpia) return null;
  const iso = pais.toUpperCase().slice(0, 2);
  const pool = getPool();

  const guardada = await pool.query(
    "SELECT lat, lon FROM ciudad_coords WHERE LOWER(ciudad) = LOWER($1) AND pais = $2",
    [limpia, iso]
  );
  if (guardada.rows.length > 0) {
    const { lat, lon } = guardada.rows[0] as { lat: number | null; lon: number | null };
    // Una fila con lat nula significa "ya preguntamos y no se sabe": no se
    // vuelve a molestar a OpenStreetMap por la misma ciudad.
    return lat !== null && lon !== null ? { lat, lon } : null;
  }

  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("city", limpia);
    url.searchParams.set("countrycodes", iso.toLowerCase());
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "1");
    const resp = await fetch(url, {
      headers: { "User-Agent": "BuscayCurra/1.0 (https://buscaycurra.es)" },
      signal: AbortSignal.timeout(6000),
    });
    const data = await resp.json();
    const encontrada = Array.isArray(data) && data.length > 0
      ? { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) }
      : null;

    await pool.query(
      `INSERT INTO ciudad_coords (ciudad, pais, lat, lon) VALUES ($1, $2, $3, $4)
       ON CONFLICT (ciudad, pais) DO NOTHING`,
      [limpia, iso, encontrada?.lat ?? null, encontrada?.lon ?? null]
    );
    return encontrada;
  } catch {
    return null;
  }
}

/** Kilómetros de carretera estimados entre dos ciudades. */
export async function distanciaEntre(
  origen: string, destino: string, pais = "ES"
): Promise<number | null> {
  const [a, b] = await Promise.all([
    coordsCiudad(origen, pais),
    coordsCiudad(destino, pais),
  ]);
  if (!a || !b) return null;
  return Math.round(haversine(a.lat, a.lon, b.lat, b.lon) * RODEO_CARRETERA);
}

// ── Precio real del carburante ────────────────────────────────────────

const MINISTERIO =
  "https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes";

interface PrecioCache { valor: number; fecha: number }
const cachePrecios = new Map<string, PrecioCache>();
const DOCE_HORAS = 12 * 60 * 60 * 1000;

/**
 * Precio medio del gasóleo A hoy, en euros por litro.
 *
 * Del Ministerio, que publica lo que cobra cada gasolinera de España. Se hace
 * la media nacional y se guarda 12 horas: el dato cambia una vez al día, no
 * tiene sentido pedirlo en cada búsqueda.
 *
 * Solo España. Fuera, devuelve null y quien llama omite el cálculo en vez de
 * usar un precio español que allí no vale.
 */
export async function precioGasoleo(pais = "ES"): Promise<number | null> {
  if (pais.toUpperCase() !== "ES") return null;

  const enCache = cachePrecios.get("ES");
  if (enCache && Date.now() - enCache.fecha < DOCE_HORAS) return enCache.valor;

  try {
    const resp = await fetch(`${MINISTERIO}/EstacionesTerrestres/`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(12000),
    });
    if (!resp.ok) return enCache?.valor ?? null;
    const data = await resp.json();
    const lista: Array<Record<string, string>> = data?.ListaEESSPrecio || [];

    const precios = lista
      // Vienen con coma decimal, como se escriben aquí los números.
      .map(e => parseFloat((e["Precio Gasoleo A"] || "").replace(",", ".")))
      // Fuera los vacíos y los disparatados: alguna estación publica erratas.
      .filter(p => Number.isFinite(p) && p > 0.5 && p < 4);

    if (precios.length < 100) return enCache?.valor ?? null;

    const media = precios.reduce((a, b) => a + b, 0) / precios.length;
    const valor = Math.round(media * 1000) / 1000;
    cachePrecios.set("ES", { valor, fecha: Date.now() });
    return valor;
  } catch {
    // Si el Ministerio no contesta, mejor el precio de ayer que ninguno.
    return enCache?.valor ?? null;
  }
}

// ── Salario de la oferta ──────────────────────────────────────────────

/**
 * Saca el salario mensual bruto del texto libre de la oferta.
 *
 * Los portales lo escriben cada uno a su manera: "&euro;24000 per year",
 * "1.900 € al mes", "&euro;9.36 per hour", "30000 - 40000". Devuelve null
 * cuando no hay un número creíble, que es lo más frecuente: 4 de cada 5
 * ofertas ponen solo "Ver en oferta".
 */
export function salarioMensual(texto: string | null | undefined): number | null {
  if (!texto) return null;
  const t = texto.replace(/&euro;/gi, "€").toLowerCase();

  // Todos los números del texto, con punto o coma como separador.
  const numeros = (t.match(/\d[\d.,]*/g) || [])
    .map(n => {
      // "1.900" son mil novecientos; "9.36" son nueve con treinta y seis.
      const limpio = /^\d{1,3}\.\d{3}$/.test(n) ? n.replace(".", "")
                   : n.replace(/\.(?=\d{3}\b)/g, "").replace(",", ".");
      return parseFloat(limpio);
    })
    .filter(n => Number.isFinite(n) && n > 0);

  if (numeros.length === 0) return null;
  // Con un rango ("30000 - 40000") se coge el más bajo: prometer de menos y
  // que sea más, nunca al revés.
  const base = Math.min(...numeros);

  let mensual: number;
  if (/hour|hora|\/h\b/.test(t)) {
    mensual = base * 8 * DIAS_LABORABLES_MES;          // jornada de 8 horas
  } else if (/year|año|anual|annum/.test(t)) {
    mensual = base / 12;
  } else if (/month|mes|mensual/.test(t)) {
    mensual = base;
  } else {
    // Sin unidad: se deduce por el tamaño. Un número de cinco cifras es anual.
    mensual = base >= 10000 ? base / 12 : base;
  }

  // Filtro de cordura contra la basura que publican algunos portales
  // ("10000 - 90000"): fuera de este rango no es un sueldo real en España.
  if (mensual < 400 || mensual > 20000) return null;
  return Math.round(mensual);
}

// ── El cálculo que ve el usuario ──────────────────────────────────────

export interface CosteDesplazamiento {
  km: number;
  minutos: number;
  litrosMes: number;
  precioLitro: number;
  costeSolo: number;
  costeCompartido2: number;
  costeCompartido3: number;
  salarioMensual: number | null;
  porcentajeSolo: number | null;
  porcentajeCompartido: number | null;
  quedaSolo: number | null;
  quedaCompartido: number | null;
  veredicto: string;
}

/**
 * Cuánto cuesta de verdad ir a trabajar a otra ciudad, cada mes.
 *
 * Devuelve null si falta lo básico (distancia o precio del carburante), en vez
 * de rellenar huecos con supuestos: más vale no decir nada que decir un número
 * que no es.
 */
export async function calcularCoste(
  origen: string,
  destino: string,
  salarioTexto?: string | null,
  pais = "ES"
): Promise<CosteDesplazamiento | null> {
  const [km, precioLitro] = await Promise.all([
    distanciaEntre(origen, destino, pais),
    precioGasoleo(pais),
  ]);
  if (km === null || precioLitro === null || km === 0) return null;

  // Ida y vuelta, todos los días que se trabaja.
  const kmMes = km * 2 * DIAS_LABORABLES_MES;
  const litrosMes = (kmMes * CONSUMO_MEDIO) / 100;
  const costeSolo = Math.round(litrosMes * precioLitro);

  const sueldo = salarioMensual(salarioTexto);
  const costeCompartido2 = Math.round(costeSolo / 2);
  const costeCompartido3 = Math.round(costeSolo / 3);

  const pct = (c: number) => (sueldo ? Math.round((c / sueldo) * 1000) / 10 : null);
  const porcentajeSolo = pct(costeSolo);
  const porcentajeCompartido = pct(costeCompartido2);

  let veredicto: string;
  if (!sueldo) {
    veredicto = `El desplazamiento te costaría **${costeSolo} €/mes** yendo solo, o **${costeCompartido2} €** compartiendo coche con una persona. La oferta no dice el sueldo: si me lo dices, te calculo cuánto te quedaría limpio.`;
  } else if (porcentajeSolo !== null && porcentajeSolo <= 10) {
    veredicto = `Sale a cuenta: el viaje se lleva un **${porcentajeSolo}%** del sueldo y te quedan **${sueldo - costeSolo} €** al mes.`;
  } else if (porcentajeSolo !== null && porcentajeSolo <= 20) {
    veredicto = `Se puede: el viaje se lleva un **${porcentajeSolo}%** yendo solo, pero compartiendo coche baja al **${porcentajeCompartido}%** y te quedan **${sueldo - costeCompartido2} €**.`;
  } else {
    veredicto = `Ojo, el viaje se lleva un **${porcentajeSolo}%** del sueldo (**${costeSolo} €** de **${sueldo} €**). Compartiendo coche baja a **${costeCompartido2} €**, pero por esa distancia merece la pena mirar si compensa mudarse o si la empresa paga el transporte.`;
  }

  return {
    km,
    // A 80 km/h de media, contando tramos de ciudad y de carretera.
    minutos: Math.round((km / 80) * 60),
    litrosMes: Math.round(litrosMes * 10) / 10,
    precioLitro,
    costeSolo,
    costeCompartido2,
    costeCompartido3,
    salarioMensual: sueldo,
    porcentajeSolo,
    porcentajeCompartido,
    quedaSolo: sueldo ? sueldo - costeSolo : null,
    quedaCompartido: sueldo ? sueldo - costeCompartido2 : null,
    veredicto,
  };
}

// ── El mapa de alrededores ────────────────────────────────────────────

export interface CiudadCercana {
  ciudad: string;
  km: number;
  ofertas: number;
  costeMes: number | null;
  costeCompartido: number | null;
}

/**
 * Dónde hay trabajo de lo suyo cerca de casa, por orden de cercanía.
 *
 * Esta es la respuesta a "en mi pueblo no hay nada". En vez de decirle que
 * pruebe en la capital, se le enseña el abanico entero: a 15 km hay 3, a 40 km
 * hay 20, a 90 km hay 200 — y lo que cuesta llegar a cada sitio. Así decide él,
 * con los números delante, en vez de rendirse por no echar cuentas.
 *
 * La distancia se calcula en la propia base de datos, contra las coordenadas ya
 * guardadas. Traer las 727 ciudades a memoria para medirlas una a una sería
 * mucho más lento, y este servidor tiene solo dos núcleos.
 */
export async function ciudadesCercanasConOfertas(
  terminosOficio: string[],
  origen: string,
  pais = "ES",
  radioKm = 120,
  maximo = 8
): Promise<CiudadCercana[]> {
  const centro = await coordsCiudad(origen, pais);
  if (!centro || terminosOficio.length === 0) return [];

  const pool = getPool();
  const iso = pais.toUpperCase().slice(0, 2);

  // El oficio, en el título y como palabra entera. Buscarlo dentro de la
  // descripción devolvía "Learning Architect" al pedir camarero.
  const patrones = terminosOficio.map(t =>
    "\\m" + t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\M"
  );
  const oficioOr = patrones.map((_, i) => `j.title ~* $${i + 1}`).join(" OR ");
  const p = patrones.length;

  const { rows } = await pool.query(
    `WITH ciudades AS (
       SELECT split_part(j.city, ',', 1) AS ciudad, count(*)::int AS ofertas
       FROM "JobListing" j
       WHERE j."isActive" = true
         AND j.city IS NOT NULL AND j.city <> ''
         AND (${oficioOr})
         AND (UPPER(j.country) = $${p + 1} OR LOWER(j.country) LIKE $${p + 2})
       GROUP BY 1
     )
     SELECT c.ciudad, c.ofertas,
            -- Haversine: 6371 km de radio terrestre, por 1,25 de rodeo de
            -- carretera, que es el desvío habitual respecto a la línea recta.
            round((2 * 6371 * asin(sqrt(
              power(sin(radians(co.lat - $${p + 3}) / 2), 2) +
              cos(radians($${p + 3})) * cos(radians(co.lat)) *
              power(sin(radians(co.lon - $${p + 4}) / 2), 2)
            )) * 1.25)::numeric)::int AS km
     FROM ciudades c
     JOIN ciudad_coords co
       ON LOWER(co.ciudad) = LOWER(c.ciudad) AND co.pais = $${p + 5}
     WHERE co.lat IS NOT NULL
     ORDER BY km ASC
     LIMIT 60`,
    [...patrones, iso, `%${iso.toLowerCase()}%`, centro.lat, centro.lon, iso]
  );

  const precioLitro = await precioGasoleo(pais);

  return (rows as Array<{ ciudad: string; ofertas: number; km: number }>)
    // Fuera la propia ciudad (0 km) y lo que quede demasiado lejos.
    .filter(r => r.km > 0 && r.km <= radioKm)
    .slice(0, maximo)
    .map(r => {
      if (precioLitro === null) {
        return { ciudad: r.ciudad, km: r.km, ofertas: r.ofertas, costeMes: null, costeCompartido: null };
      }
      const coste = Math.round(
        ((r.km * 2 * DIAS_LABORABLES_MES * CONSUMO_MEDIO) / 100) * precioLitro
      );
      return {
        ciudad: r.ciudad,
        km: r.km,
        ofertas: r.ofertas,
        costeMes: coste,
        costeCompartido: Math.round(coste / 2),
      };
    });
}
