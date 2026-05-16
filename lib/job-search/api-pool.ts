/**
 * api-pool.ts — Pool de claves API con circuit breaker y rotación automática
 *
 * Patrón: Circuit Breaker + Key Rotation
 * - Múltiples claves por proveedor (ADZUNA_APP_ID_2, ADZUNA_APP_KEY_2, ...)
 * - Contador de uso en Redis (clave: api:usage:<provider>:<keyIndex>:<YYYYMMDD>)
 * - Circuit breaker en Redis (clave: api:breaker:<provider>:<keyIndex>)
 * - Cuando una clave supera el umbral diario → pasa a la siguiente
 * - Cuando todas están agotadas → retorna null (fallback al caller)
 *
 * Para añadir más claves Adzuna: ADZUNA_APP_ID_2, ADZUNA_APP_KEY_2, etc.
 */

import * as redis from "@/lib/cache/redis-client";

export type ApiProvider = "adzuna" | "jooble" | "careerjet";

interface ApiKey {
  id: string;
  key: string;
}

function loadAdzunaKeys(): ApiKey[] {
  const keys: ApiKey[] = [];
  if (process.env.ADZUNA_APP_ID && process.env.ADZUNA_APP_KEY) {
    keys.push({ id: process.env.ADZUNA_APP_ID, key: process.env.ADZUNA_APP_KEY });
  }
  for (let i = 2; i <= 10; i++) {
    const id = process.env[`ADZUNA_APP_ID_${i}`];
    const key = process.env[`ADZUNA_APP_KEY_${i}`];
    if (id && key) keys.push({ id, key });
  }
  return keys;
}

function loadSimpleKeys(provider: "jooble" | "careerjet"): { key: string }[] {
  const prefix = provider === "jooble" ? "JOOBLE_API_KEY" : "CAREERJET_API_KEY";
  const keys: { key: string }[] = [];
  if (process.env[prefix]) keys.push({ key: process.env[prefix]! });
  for (let i = 2; i <= 5; i++) {
    const k = process.env[`${prefix}_${i}`];
    if (k) keys.push({ key: k });
  }
  return keys;
}

// Cuántas peticiones por clave por día antes de rotar
const DAILY_LIMIT: Record<ApiProvider, number> = {
  adzuna: 200,      // Free: 250/día, paramos en 200 para margen de seguridad
  jooble: 500,
  careerjet: 1000,
};

const BREAKER_TTL = 3600; // 1 hora en segundos

function today(): string {
  return new Date().toISOString().slice(0, 10).replace(/-/g, "");
}

function usageKey(provider: ApiProvider, idx: number): string {
  return `api:usage:${provider}:${idx}:${today()}`;
}

function breakerKey(provider: ApiProvider, idx: number): string {
  return `api:breaker:${provider}:${idx}`;
}

async function getUsage(provider: ApiProvider, idx: number): Promise<number> {
  const val = await redis.get(usageKey(provider, idx));
  return val ? parseInt(val) : 0;
}

async function incrementUsage(provider: ApiProvider, idx: number): Promise<void> {
  // incrementar(clave, ttl) pone TTL solo cuando el contador llega a 1 (nuevo)
  await redis.incrementar(usageKey(provider, idx), 90000);
}

async function isCircuitOpen(provider: ApiProvider, idx: number): Promise<boolean> {
  const val = await redis.get(breakerKey(provider, idx));
  return val !== null;
}

async function openCircuit(provider: ApiProvider, idx: number): Promise<void> {
  await redis.set(breakerKey(provider, idx), "1", BREAKER_TTL);
  console.warn(`[API Pool] Circuit OPEN: ${provider}[${idx}] — pausa ${BREAKER_TTL / 3600}h`);
}

/**
 * Reporta un fallo de API. 429 o 403 abre el circuit breaker.
 */
export async function reportFailure(provider: ApiProvider, idx: number, status?: number): Promise<void> {
  if (status === 429 || status === 403) {
    await openCircuit(provider, idx);
  }
}

async function selectKeyIndex(provider: ApiProvider, total: number): Promise<number> {
  for (let idx = 0; idx < total; idx++) {
    if (await isCircuitOpen(provider, idx)) continue;
    const usage = await getUsage(provider, idx);
    if (usage < DAILY_LIMIT[provider]) return idx;
  }
  return -1;
}

export interface AdzunaKey { id: string; key: string; idx: number }
export interface SimpleKey { key: string; idx: number }

export async function getAdzunaKey(): Promise<AdzunaKey | null> {
  const keys = loadAdzunaKeys();
  if (!keys.length) return null;
  const idx = await selectKeyIndex("adzuna", keys.length);
  if (idx === -1) {
    console.error("[API Pool] Adzuna: todas las claves agotadas o en breaker");
    return null;
  }
  await incrementUsage("adzuna", idx);
  return { ...keys[idx], idx };
}

export async function getJoobleKey(): Promise<SimpleKey | null> {
  const keys = loadSimpleKeys("jooble");
  if (!keys.length) return null;
  const idx = await selectKeyIndex("jooble", keys.length);
  if (idx === -1) {
    console.error("[API Pool] Jooble: todas las claves agotadas o en breaker");
    return null;
  }
  await incrementUsage("jooble", idx);
  return { ...keys[idx], idx };
}

export async function getCareerjetKey(): Promise<SimpleKey | null> {
  const keys = loadSimpleKeys("careerjet");
  if (!keys.length) return null;
  const idx = await selectKeyIndex("careerjet", keys.length);
  if (idx === -1) {
    console.error("[API Pool] Careerjet: todas las claves agotadas o en breaker");
    return null;
  }
  await incrementUsage("careerjet", idx);
  return { ...keys[idx], idx };
}

export async function getPoolStatus(): Promise<Record<string, unknown>> {
  const adzunaKeys = loadAdzunaKeys();
  const joobleKeys = loadSimpleKeys("jooble");
  const careerjetKeys = loadSimpleKeys("careerjet");

  async function keyStatuses(provider: ApiProvider, count: number) {
    const out = [];
    for (let i = 0; i < count; i++) {
      const usage = await getUsage(provider, i);
      const broken = await isCircuitOpen(provider, i);
      out.push({ idx: i, usage, limit: DAILY_LIMIT[provider], broken, ok: !broken && usage < DAILY_LIMIT[provider] });
    }
    return out;
  }

  return {
    adzuna: { keys: adzunaKeys.length, statuses: await keyStatuses("adzuna", adzunaKeys.length) },
    jooble: { keys: joobleKeys.length, statuses: await keyStatuses("jooble", joobleKeys.length) },
    careerjet: { keys: careerjetKeys.length, statuses: await keyStatuses("careerjet", careerjetKeys.length) },
    timestamp: new Date().toISOString(),
  };
}
