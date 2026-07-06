/**
 * lib/rate-limit-user.ts — Rate limit por USUARIO y acción, respaldado en Redis.
 *
 * Pensado para endpoints con coste (IA de pago: Groq/DeepSeek/OpenAI). Antes,
 * varios endpoints autenticados no tenían ningún tope por usuario, así que un
 * solo usuario Free podía llamarlos en bucle y disparar la factura de las APIs
 * (que además se comparten con otros procesos del proyecto).
 *
 * Complementa a los límites de plan (lib/plan-limits.ts): esto es un tope
 * ANTI-ABUSO genérico, no la cuota comercial del plan.
 */
import { Redis } from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://buscaycurra-redis:6379";

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

/**
 * Devuelve true si la petición está permitida, false si supera el tope.
 *
 * @param action   nombre de la acción (namespace de la clave)
 * @param userId   id del usuario ya autenticado
 * @param max      máximo de llamadas por ventana
 * @param windowSec tamaño de la ventana en segundos
 *
 * Fail-open si Redis no está disponible (mejor no bloquear a usuarios legítimos
 * por una caída de Redis; el abuso real requiere Redis operativo el 99% del tiempo).
 */
export async function checkUserRateLimit(
  action: string,
  userId: string,
  max: number,
  windowSec: number
): Promise<boolean> {
  const r = getRedis();
  if (!r) return true;
  try {
    const key = `rl:${action}:${userId}`;
    const count = await r.incr(key);
    if (count === 1) await r.expire(key, windowSec);
    return count <= max;
  } catch {
    return true;
  }
}

/** Respuesta JSON estándar cuando se supera el tope (para usar con NextResponse). */
export const RATE_LIMIT_MESSAGE = "Vas demasiado rápido. Espera un momento y vuelve a intentarlo.";
