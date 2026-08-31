/**
 * scripts/rellenar-createdat.mjs — Pone fecha a las ofertas que se quedaron sin ella.
 *
 * POR QUÉ HACE FALTA. El extractor alemán insertaba solo siete columnas y dejaba
 * el resto a NULL, `createdAt` incluido. Eso son 237.296 ofertas sin fecha,
 * 222.523 de ellas alemanas — cerca del 10 % de la tabla. El INSERT ya está
 * arreglado, así que esto no vuelve a pasar, pero las que ya entraron mal
 * siguen sin fecha y nadie las va a arreglar solo.
 *
 * QUÉ ROMPE NO TENERLA. Todo lo que ordena por "más recientes primero" las
 * coloca mal o las deja fuera, y ordenar por recientes es justo lo que espera
 * quien busca trabajo. Además fue lo que nos engañó al auditar: el máximo de
 * esa columna se quedó clavado en mayo y parecía que Alemania llevaba 99 días
 * sin traer nada, cuando el problema era otro.
 *
 * DE DÓNDE SALE LA FECHA. De `updatedAt`, que sí tiene valor por defecto en la
 * tabla, y si tampoco estuviera, de `scrapedAt`. No se inventa nada: es la
 * fecha en que la oferta pasó por aquí, que es lo que `createdAt` significa.
 *
 * POR QUÉ VA POR LOTES. El servidor tiene dos núcleos y un 85 % de CPU robada
 * por el hipervisor. Un UPDATE de 237.000 filas de golpe lo deja clavado y la
 * web deja de responder. Va de 5.000 en 5.000 con pausa, y se puede parar con
 * Ctrl+C sin dejar nada a medias: cada lote se confirma solo.
 *
 * CÓMO SE USA (desde el VPS, dentro del proyecto):
 *   node scripts/rellenar-createdat.mjs --simular    ← cuenta sin tocar nada
 *   node scripts/rellenar-createdat.mjs              ← aplica los cambios
 *
 * Es idempotente: solo toca filas con createdAt NULL.
 */

import pg from "pg";

const SIMULAR = process.argv.includes("--simular");
const LOTE = 5000;
const PAUSA_MS = 1500;

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  host: process.env.DATABASE_URL ? undefined : (process.env.PGHOST || "buscaycurra-db"),
  port: process.env.DATABASE_URL ? undefined : parseInt(process.env.PGPORT || "5432"),
  database: process.env.DATABASE_URL ? undefined : "buscaycurra",
  user: process.env.DATABASE_URL ? undefined : "buscaycurra",
  password: process.env.DATABASE_URL ? undefined : (process.env.DATABASE_PASSWORD || process.env.VPS_DB_PASSWORD),
  max: 2,
  // Más que los 15 s del pool de la aplicación: esto lo lanza una persona a
  // propósito, no un visitante impaciente.
  statement_timeout: 120000,
});

async function main() {
  console.log(SIMULAR ? "MODO SIMULACIÓN — no se modifica nada\n" : "APLICANDO CAMBIOS\n");

  const { rows: [{ pendientes }] } = await pool.query(
    `SELECT count(*)::int AS pendientes FROM "JobListing" WHERE "createdAt" IS NULL`
  );
  console.log(`Ofertas sin fecha de alta: ${pendientes.toLocaleString("es-ES")}`);

  if (SIMULAR) {
    const { rows } = await pool.query(
      `SELECT "sourceName", count(*)::int AS n
         FROM "JobListing" WHERE "createdAt" IS NULL
        GROUP BY 1 ORDER BY 2 DESC LIMIT 8`
    );
    console.log("\nPor fuente:");
    rows.forEach(r => console.log(`  ${(r.sourceName || "(sin fuente)").padEnd(20)} ${r.n.toLocaleString("es-ES")}`));
    console.log("\nPara aplicarlo de verdad, lánzalo sin --simular.");
    await pool.end();
    return;
  }

  if (pendientes === 0) { console.log("Nada que hacer."); await pool.end(); return; }

  let total = 0;
  for (;;) {
    const r = await pool.query(
      `UPDATE "JobListing"
          SET "createdAt" = COALESCE("updatedAt", "scrapedAt", NOW())
        WHERE id IN (
          SELECT id FROM "JobListing" WHERE "createdAt" IS NULL LIMIT ${LOTE}
        )`
    );
    if (r.rowCount === 0) break;
    total += r.rowCount;
    console.log(`  ${total.toLocaleString("es-ES")} / ${pendientes.toLocaleString("es-ES")}`);
    await new Promise(res => setTimeout(res, PAUSA_MS));
  }

  console.log(`\nListo: ${total.toLocaleString("es-ES")} ofertas con fecha puesta.`);
  await pool.end();
}

main().catch(async e => {
  console.error("Error:", e.message);
  await pool.end();
  process.exit(1);
});
