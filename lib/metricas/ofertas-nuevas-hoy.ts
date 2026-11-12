/**
 * Cuántas ofertas nuevas han entrado hoy, para la cifra de Inicio.
 *
 * POR QUÉ (12 nov 2026). /api/dashboard lo contaba en cada apertura de la app
 * (COUNT sobre "JobListing", 3,7 M de filas) y la pantalla de Inicio no salía
 * hasta que acababa: medido ese día, 17,5 s en frío y 0,13 s cuando la base ya
 * lo tenía en memoria. La cifra es la misma para todo el mundo, así que se
 * guarda en Redis:
 *  - dato fresco (15 min): se devuelve tal cual;
 *  - dato del mismo día pero viejo: se devuelve al momento y se recuenta por
 *    detrás, sin hacer esperar a nadie;
 *  - nada de hoy (primera vez del día): se cuenta, con un tope de 8 s.
 */
import { getPool } from "@/lib/db";
import { get, set } from "@/lib/cache/redis-client";

const FRESCO_SEG = 15 * 60;
let contando: Promise<number> | null = null;

function contar(dia: string): Promise<number> {
  if (contando) return contando;
  contando = (async () => {
    const cliente = await getPool().connect();
    try {
      await cliente.query("BEGIN READ ONLY");
      await cliente.query("SET LOCAL statement_timeout = '60s'");
      const { rows } = await cliente.query<{ n: number }>(
        `SELECT COUNT(*)::int AS n FROM "JobListing" WHERE "isActive" = true AND "createdAt" >= $1`,
        [`${dia}T00:00:00.000Z`]
      );
      await cliente.query("COMMIT");
      const n = rows[0]?.n ?? 0;
      await set(`ofertas-nuevas-hoy:fresco:${dia}`, String(n), FRESCO_SEG).catch(() => false);
      await set(`ofertas-nuevas-hoy:dia:${dia}`, String(n), 26 * 3600).catch(() => false);
      return n;
    } catch (e) {
      await cliente.query("ROLLBACK").catch(() => {});
      throw e;
    } finally {
      cliente.release();
      contando = null;
    }
  })();
  return contando;
}

export async function ofertasNuevasHoy(): Promise<number> {
  const dia = new Date().toISOString().slice(0, 10);
  const fresco = await get(`ofertas-nuevas-hoy:fresco:${dia}`).catch(() => null);
  if (fresco !== null) return Number(fresco) || 0;
  const delDia = await get(`ofertas-nuevas-hoy:dia:${dia}`).catch(() => null);
  if (delDia !== null) {
    contar(dia).catch(() => {});
    return Number(delDia) || 0;
  }
  return Promise.race([
    contar(dia),
    new Promise<number>((resolver) => setTimeout(() => resolver(0), 8000)),
  ]).catch(() => 0);
}
