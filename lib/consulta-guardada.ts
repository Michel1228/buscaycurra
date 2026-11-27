/**
 * lib/consulta-guardada.ts — Lo caro de contar, guardado y recalculado por detrás.
 *
 * POR QUÉ (27 nov 2026). Contar las ofertas vivas por país recorre unos 3
 * millones de filas. Tardaba 12 s en octubre; con la base más grande pasa de
 * los 15 s del pool, se corta, no se guarda nada y la siguiente visita lo
 * vuelve a intentar: 131 cortes en un día, 15 s de CPU cada uno, en un
 * servidor de 2 núcleos con la carga en 3. Un fallo que se alimenta solo.
 *
 * Aquí:
 *   · se contesta al momento con lo guardado, aunque esté algo viejo;
 *   · si está viejo, se recalcula por detrás, UNA sola vez a la vez (candado
 *     en Redis), con más margen de tiempo que el pool;
 *   · lo guardado dura mucho más que lo que se tarda en refrescarlo, así que un
 *     fallo al recalcular no deja a nadie sin dato: se sigue con el anterior.
 *
 * Sale de lo que ya hacía Guzzi (app/api/gusi/chat/route.ts, 14 oct 2026),
 * más el candado, que le faltaba.
 */
import { getPool } from "@/lib/db";
import { get as cacheGet, set as cacheSet, incrementar, del as cacheDel } from "@/lib/cache/redis-client";

/** Una consulta con más margen que los 15 s del pool (por defecto, 60 s). */
export async function consultaConMargen<R extends Record<string, unknown>>(sql: string, params: unknown[] = [], ms = 60000): Promise<R[]> {
  const cliente = await getPool().connect();
  try {
    await cliente.query("BEGIN");
    await cliente.query(`SET LOCAL statement_timeout = ${Math.max(1000, Math.floor(ms))}`);
    const r = await cliente.query<R>(sql, params);
    await cliente.query("COMMIT");
    return r.rows;
  } catch (e) {
    await cliente.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    cliente.release();
  }
}

/**
 * El valor guardado en `clave`, o el recién calculado si no había ninguno.
 * `frescoMs`: a partir de cuándo se recalcula por detrás. `ttlS`: cuánto dura lo guardado.
 * Devuelve null solo si no hay nada guardado y no se ha podido calcular.
 */
export async function consultaGuardada<T>(
  clave: string,
  calcular: () => Promise<T>,
  { frescoMs = 3 * 3600 * 1000, ttlS = 48 * 3600 }: { frescoMs?: number; ttlS?: number } = {}
): Promise<T | null> {
  // Al compilar (next build) no hay base ni Redis, y cada llamada a Redis tarda
  // ~16 s en rendirse: tres seguidas pasaban de los 60 s que Next da a cada
  // página y la compilación fallaba (27 nov 2026). Sin dato; la página se
  // rehace con datos de verdad en cuanto la pide alguien.
  if (process.env.NEXT_PHASE === "phase-production-build") return null;
  const candado = `${clave}:calculando`;
  const refrescar = async (): Promise<T | null> => {
    // Uno a la vez: si ya lo está calculando otro, no se repite. Sin Redis
    // (devuelve 0) no hay candado posible y se calcula igual.
    const turno = await incrementar(candado, 300);
    if (turno > 1) return null;
    try {
      const valor = await calcular();
      await cacheSet(clave, JSON.stringify({ t: Date.now(), valor }), ttlS);
      return valor;
    } catch (e) {
      console.error(`[consulta-guardada] ${clave}:`, (e as Error).message);
      return null;
    } finally {
      // Solo se quita si se puso: sin Redis sería otra espera para nada.
      if (turno === 1) await cacheDel(candado).catch(() => false);
    }
  };
  const guardado = await cacheGet(clave).catch(() => null);
  if (guardado) {
    try {
      const { t, valor } = JSON.parse(guardado) as { t: number; valor: T };
      if (Date.now() - t > frescoMs) void refrescar();
      return valor;
    } catch { /* guardado roto: se recalcula */ }
  }
  return refrescar();
}
