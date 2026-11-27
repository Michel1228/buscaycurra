/**
 * lib/job-search/ofertas-por-pais.ts
 * Cuántas ofertas vivas hay en cada país, calculado UNA vez y compartido.
 *
 * POR QUÉ (auditoría del 3 oct 2026). Las 52 páginas /trabajar-en/<país>
 * contaban sus ofertas cada una por su lado. En Alemania la cuenta tardaba
 * 15,5 s, la conexión corta a los 15, el error se tragaba y la página enseñaba
 * "0 Ofertas activas" (y lo guardaba en caché una hora). Una sola consulta
 * agrupada da todos los países; se guarda en Redis.
 *
 * 27 NOV 2026: esa consulta ya pasaba de los 15 s, fallaba y no se guardaba
 * nada, así que cada visita la repetía (131 cortes en un día). Ahora va por
 * lib/consulta-guardada.ts: 90 s de margen, se recalcula por detrás una sola
 * vez a la vez y, si falla, se sigue con la última cuenta buena (48 h).
 * Guzzi usa esta misma cuenta en vez de hacer la suya.
 *
 * 27 NOV (tarde): ni con 90 s terminaba. Recorre la tabla entera (5,5 GB; el
 * índice de países no sirve porque solo el 36 % de la tabla está marcada como
 * visible) y medida a mano tardó 129 s con el servidor cargado. Ahora nadie la
 * espera: sin dato guardado se devuelve null y se calcula por detrás, con 300 s
 * de margen, cada 12 h y solo una a la vez.
 *
 * Devuelve null si no se ha podido calcular: quien la use NO debe enseñar un 0.
 */
import { consultaConMargen, consultaGuardada } from "@/lib/consulta-guardada";

const CLAVE = "ofertas-por-pais:v2";

export async function ofertasPorPais(): Promise<Record<string, number> | null> {
  return consultaGuardada(CLAVE, async () => {
    const rows = await consultaConMargen<{ code: string; total: number }>(
      `SELECT UPPER(country) AS code, COUNT(*)::int AS total
         FROM "JobListing"
        WHERE "isActive" = true AND country IS NOT NULL AND country != ''
        GROUP BY UPPER(country)`,
      [],
      300000
    );
    const mapa: Record<string, number> = {};
    for (const r of rows) mapa[r.code] = r.total;
    return mapa;
  }, { frescoMs: 12 * 3600 * 1000, ttlS: 72 * 3600, esperar: false, candadoS: 360 });
}

/** Ofertas de un país. Reino Unido aparece como "UK" y como "GB" según la fuente. */
export function ofertasDe(mapa: Record<string, number> | null, codigo: string): number | null {
  if (!mapa) return null;
  const c = codigo.toUpperCase();
  const total = (mapa[c] || 0) + (c === "UK" ? mapa.GB || 0 : c === "GB" ? mapa.UK || 0 : 0);
  return total || null;
}
