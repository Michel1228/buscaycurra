/**
 * lib/guzzi/rate-limit.ts
 * Rate limiting con Redis para Guzzi.
 * Sobrevive a deploys (vs Map en memoria que se pierde).
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

const RATE_LIMIT_WINDOW = 60; // segundos
const RATE_LIMIT_MAX = 20; // mensajes por ventana

export async function checkRateLimit(key: string): Promise<{ allowed: boolean; retryAfter: number }> {
  const r = getRedis();
  if (!r) {
    // Fallback: siempre permitir si Redis no está disponible
    return { allowed: true, retryAfter: 0 };
  }

  try {
    const redisKey = `guzzi:rate:${key}`;
    const count = await r.incr(redisKey);
    if (count === 1) {
      await r.expire(redisKey, RATE_LIMIT_WINDOW);
    }
    if (count > RATE_LIMIT_MAX) {
      const ttl = await r.ttl(redisKey);
      return { allowed: false, retryAfter: Math.max(1, ttl) };
    }
    return { allowed: true, retryAfter: 0 };
  } catch {
    return { allowed: true, retryAfter: 0 }; // Fail open
  }
}
