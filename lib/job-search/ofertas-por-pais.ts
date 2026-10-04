/**
 * lib/job-search/ofertas-por-pais.ts
 * Cuántas ofertas vivas hay en cada país, calculado UNA vez y compartido.
 *
 * POR QUÉ (auditoría del 3 oct 2026). Las 52 páginas /trabajar-en/<país>
 * contaban sus ofertas cada una por su lado. En Alemania la cuenta tardaba
 * 15,5 s, la conexión corta a los 15, el error se tragaba y la página enseñaba
 * "0 Ofertas activas" (y lo guardaba en caché una hora). Una sola consulta
 * agrupada da todos los países en unos 12 s; se guarda 6 horas en Redis.
 *
 * Devuelve null si no se ha podido calcular: quien la use NO debe enseñar un 0.
 */
import { getPool } from "@/lib/db";
import { get as cacheGet, set as cacheSet } from "@/lib/cache/redis-client";

const CLAVE = "ofertas-por-pais";

export async function ofertasPorPais(): Promise<Record<string, number> | null> {
  try {
    const guardado = await cacheGet(CLAVE);
    if (guardado) return JSON.parse(guardado);
  } catch { /* se calcula */ }
  try {
    const { rows } = await getPool().query(
      `SELECT UPPER(country) AS code, COUNT(*)::int AS total
         FROM "JobListing"
        WHERE "isActive" = true AND country IS NOT NULL AND country != ''
        GROUP BY UPPER(country)`
    );
    const mapa: Record<string, number> = {};
    for (const r of rows as Array<{ code: string; total: number }>) mapa[r.code] = r.total;
    await cacheSet(CLAVE, mapa, 6 * 3600).catch(() => false);
    return mapa;
  } catch (e) {
    console.error("[ofertas-por-pais]", (e as Error).message);
    return null;
  }
}

/** Ofertas de un país. Reino Unido aparece como "UK" y como "GB" según la fuente. */
export function ofertasDe(mapa: Record<string, number> | null, codigo: string): number | null {
  if (!mapa) return null;
  const c = codigo.toUpperCase();
  const total = (mapa[c] || 0) + (c === "UK" ? mapa.GB || 0 : c === "GB" ? mapa.UK || 0 : 0);
  return total || null;
}
