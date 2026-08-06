/**
 * lib/places-quota.ts — Tope diario de llamadas a Google Places.
 *
 * POR QUÉ EXISTE: en julio de 2026 llegó una factura de 100 € de Google Cloud
 * sin tener ni un suscriptor. La causa fue un cron que llamaba a Places sin
 * ningún límite. Lo natural sería poner el tope en la consola de Google, pero
 * las cuentas en periodo de prueba NO permiten editar cuotas ("cámbiate a una
 * cuenta pagada para aumentar tu cuota"), así que el tope se lleva aquí.
 *
 * Al hacerlo en casa además ganamos: cuenta TODAS las llamadas del proyecto
 * juntas, se puede cambiar sin tocar la consola, y avisa en el log al acercarse
 * al límite.
 *
 * FALLA CERRADO A PROPÓSITO: si Redis no responde, se deniega. Es lo contrario
 * de lo que hace lib/rate-limit-user.ts, y es deliberado — allí una denegación
 * deja al usuario sin servicio, aquí simplemente cae al respaldo gratuito de
 * OpenStreetMap. Ante la duda, preferimos no gastar dinero.
 */
import { Redis } from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://buscaycurra-redis:6379";

/** Tope de llamadas al día. Ajustable con PLACES_MAX_DIA sin tocar código. */
const MAX_DIA = parseInt(process.env.PLACES_MAX_DIA || "500", 10);

let redis: Redis | null = null;
function getRedis(): Redis | null {
  if (redis) return redis;
  try {
    redis = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 1,
      connectTimeout: 2000,
      lazyConnect: true,
    });
    redis.connect().catch(() => { redis = null; });
    return redis;
  } catch {
    return null;
  }
}

function claveHoy(): string {
  return `places:quota:${new Date().toISOString().slice(0, 10)}`;
}

/**
 * Consume una llamada del cupo diario.
 * Devuelve true si se puede llamar a Google, false si hay que usar el respaldo.
 */
export async function consumirCuotaPlaces(): Promise<boolean> {
  const r = getRedis();
  if (!r) {
    console.warn("[Places] sin Redis: no se llama a Google (se usara OpenStreetMap)");
    return false;
  }

  try {
    const clave = claveHoy();
    const usadas = await r.incr(clave);
    // La primera llamada del día fija la caducidad: 48 h cubre cualquier
    // desfase de zona horaria y la clave se limpia sola.
    if (usadas === 1) await r.expire(clave, 172800);

    if (usadas > MAX_DIA) {
      if (usadas === MAX_DIA + 1) {
        console.warn(`[Places] TOPE DIARIO ALCANZADO (${MAX_DIA}). El resto del dia se usa OpenStreetMap.`);
      }
      return false;
    }
    if (usadas === Math.floor(MAX_DIA * 0.8)) {
      console.warn(`[Places] atencion: ${usadas}/${MAX_DIA} llamadas usadas hoy (80%).`);
    }
    return true;
  } catch {
    console.warn("[Places] error de Redis: no se llama a Google (se usara OpenStreetMap)");
    return false;
  }
}

/** Cuántas llamadas van hoy, para diagnóstico. */
export async function consultarCuotaPlaces(): Promise<{ usadas: number; max: number }> {
  const r = getRedis();
  if (!r) return { usadas: -1, max: MAX_DIA };
  try {
    const v = await r.get(claveHoy());
    return { usadas: parseInt(v || "0", 10), max: MAX_DIA };
  } catch {
    return { usadas: -1, max: MAX_DIA };
  }
}
