/**
 * lib/job-search/oferta-viva.ts
 * ¿Sigue publicada la oferta en la web de donde la sacamos?
 *
 * POR QUÉ (auditoría del 3 oct 2026). Las ofertas caducan a los 60 días de la
 * última vez que se vieron, pero las webs de origen las retiran mucho antes.
 * Medido a mano: de las ofertas de Adzuna con más de una semana, casi todas
 * devolvían 404 o 410 ("Page not found"); de las recientes, una de cada tres.
 * La persona veía la oferta como activa y podía gastar un envío en un puesto
 * cerrado.
 *
 * Se comprueba al abrir la ficha y, en segundo plano, en lo que enseña cada
 * búsqueda. Solo cuenta como cerrada un 404 o un 410 claros: un fallo de red o
 * una web lenta no retiran nada.
 */
import { getPool } from "@/lib/db";
import { Redis } from "ioredis";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36";
const HORAS_CACHE = 12;

let redis: Redis | null = null;
function getRedis(): Redis | null {
  if (redis) return redis;
  try {
    redis = new Redis(process.env.REDIS_URL || "redis://buscaycurra-redis:6379", { maxRetriesPerRequest: 1, connectTimeout: 2000, lazyConnect: true });
    redis.connect().catch(() => { redis = null; });
    return redis;
  } catch { return null; }
}

/** true = sigue publicada, false = la han retirado, null = no se ha podido saber. */
export async function comprobarOfertaViva(id: string): Promise<boolean | null> {
  const r = getRedis();
  const clave = `oferta-viva:${id}`;
  try {
    const guardado = await r?.get(clave);
    if (guardado === "1") return true;
    if (guardado === "0") return false;
  } catch { /* sin caché */ }

  const pool = getPool();
  const { rows } = await pool.query(`SELECT "sourceUrl" AS u, "isActive" AS activa FROM "JobListing" WHERE id::text = $1 LIMIT 1`, [id]);
  if (!rows.length) return false;
  if (rows[0].activa === false) return false;
  const url = String(rows[0].u || "");
  if (!/^https?:\/\//.test(url)) return null;

  let viva: boolean | null = null;
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "text/html" }, redirect: "follow", signal: AbortSignal.timeout(6000) });
    viva = res.status === 404 || res.status === 410 ? false : res.ok ? true : null;
    res.body?.cancel().catch(() => {});
  } catch { viva = null; }

  if (viva === false) {
    await pool.query(`UPDATE "JobListing" SET "isActive" = false WHERE id::text = $1`, [id]).catch(() => {});
    console.log(`[oferta-viva] ${id} retirada: la web de origen ya no la tiene`);
  }
  if (viva !== null) await r?.set(clave, viva ? "1" : "0", "EX", HORAS_CACHE * 3600).catch(() => {});
  return viva;
}

/** Comprueba unas pocas en segundo plano, de una en una. No espera ni falla. */
export function comprobarEnSegundoPlano(ids: string[], maximo = 5): void {
  const lista = ids.filter(Boolean).slice(0, maximo);
  if (!lista.length) return;
  void (async () => {
    for (const id of lista) {
      await comprobarOfertaViva(id).catch(() => null);
      await new Promise((ok) => setTimeout(ok, 1000));
    }
  })();
}
