/**
 * scripts/reclasificar-aupair.mjs — Recupera las ofertas de cuidado de niños
 * que se quedaron sin clasificar por estar en otro idioma.
 *
 * POR QUÉ HACE FALTA. detectCategoria() se ejecuta al INGERIR una oferta, así
 * que ampliar sus idiomas solo arregla las que entren a partir de ahora. Las
 * que ya están en la base se quedan sin categoría para siempre si nadie las
 * repasa — y sin categoría son invisibles en la sección de Au Pair, por muy
 * bien que encajen.
 *
 * Medido en producción antes de escribir esto: 694 ofertas activas de cuidado
 * infantil sin categoría, 549 de ellas francesas. «Nounou à domicile», «Garde
 * d'enfants à Lyon», «Barnvakt sökes till Stockholm». Exactamente lo que busca
 * nuestra gente, y no lo veía nadie.
 *
 * MISMO PATRÓN QUE reclasificar-oper.mjs. Si aquello funcionó, esto también:
 * lotes de 5.000, pausa entre ellos, y solo toca filas con categoria NULL, así
 * que es idempotente y no pisa ninguna clasificación existente.
 *
 * DOS DETALLES DEL PATRÓN QUE COSTARON OFERTAS Y NO SE PUEDEN PERDER:
 *
 *   · El apóstrofo. Las ofertas francesas reales escriben «Garde d'enfants»
 *     con la comilla tipográfica, no con la recta. Hay que admitir las dos.
 *   · «tata» NO entra, aunque en italiano sea niñera: choca con Tata
 *     Consultancy y con «tata» (papá) en polaco.
 *
 * CÓMO SE USA (desde el VPS, dentro del proyecto):
 *   node scripts/reclasificar-aupair.mjs --simular    ← cuenta sin tocar nada
 *   node scripts/reclasificar-aupair.mjs              ← aplica los cambios
 */

import pg from "pg";

const SIMULAR = process.argv.includes("--simular");
const LOTE = 5000;
const PAUSA_MS = 1500;

// Los mismos idiomas que lib/job-search/sync-worker.ts → detectCategoria().
// Si se tocan allí, hay que tocarlos aquí.
const PATRON_AU_PAIR = String.raw`\y(au ?pair|aupair|ni[ñn]era|canguro|babysitter|baby ?sitter|kinderm[äa]dchen|kinderfrau|kinderbetreuung|garde d.?enfants|nounou|assistante maternelle|bambinaia|ragazza alla pari|kinderoppas|gastouder|bab[áa]|barnvakt|barnepike|barnepasser|niania)`;

// Los fuertes de interna. Se marcan como live_in_nanny en vez de au_pair.
const PATRON_LIVE_IN = String.raw`\y(live.in.nanny|governess|nounou log[ée]e|inwonende oppas|interne kinderfrau)`;

// Lo que NO puede colarse aunque case el patrón: puestos de oficina, docencia
// y geriatría. Sin esto, «Kindergarten teacher» acabaría en la sección.
const EXCLUIR = String.raw`\y(kindergarten|teacher|lehrer|professeur|administrative|assistant|manager|director|supervisor|recruiter|payroll|accountant)`;

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  host: process.env.DATABASE_URL ? undefined : (process.env.PGHOST || "buscaycurra-db"),
  port: process.env.DATABASE_URL ? undefined : parseInt(process.env.PGPORT || "5432"),
  database: process.env.DATABASE_URL ? undefined : "buscaycurra",
  user: process.env.DATABASE_URL ? undefined : "buscaycurra",
  password: process.env.DATABASE_URL ? undefined : (process.env.DATABASE_PASSWORD || process.env.VPS_DB_PASSWORD),
  max: 2,
  statement_timeout: 120000,
});

const CONDICION = (patron) =>
  `categoria IS NULL AND "isActive" = true AND title ~* '${patron}' AND title !~* '${EXCLUIR}'`;

async function reclasificar(patron, categoria) {
  const { rows: [{ pendientes }] } = await pool.query(
    `SELECT count(*)::int AS pendientes FROM "JobListing" WHERE ${CONDICION(patron)}`
  );
  console.log(`\n${categoria}: ${pendientes.toLocaleString("es-ES")} ofertas sin clasificar`);

  if (SIMULAR) {
    const { rows } = await pool.query(
      `SELECT title, country FROM "JobListing" WHERE ${CONDICION(patron)} LIMIT 8`
    );
    rows.forEach(r => console.log(`  [${r.country || "??"}] ${r.title.slice(0, 62)}`));
    return 0;
  }

  if (pendientes === 0) return 0;

  let total = 0;
  for (;;) {
    const r = await pool.query(
      `UPDATE "JobListing" SET categoria = '${categoria}'
        WHERE id IN (SELECT id FROM "JobListing" WHERE ${CONDICION(patron)} LIMIT ${LOTE})`
    );
    if (r.rowCount === 0) break;
    total += r.rowCount;
    console.log(`  ${total.toLocaleString("es-ES")} / ${pendientes.toLocaleString("es-ES")}`);
    await new Promise(res => setTimeout(res, PAUSA_MS));
  }
  return total;
}

async function main() {
  console.log(SIMULAR ? "MODO SIMULACIÓN — no se modifica nada" : "APLICANDO CAMBIOS");

  // Primero las de interna, que son más específicas. Si se hiciera al revés,
  // el patrón general se las llevaría todas a au_pair.
  const internas = await reclasificar(PATRON_LIVE_IN, "live_in_nanny");
  const aupair = await reclasificar(PATRON_AU_PAIR, "au_pair");

  if (!SIMULAR) {
    console.log(`\nListo: ${internas.toLocaleString("es-ES")} como live_in_nanny y ${aupair.toLocaleString("es-ES")} como au_pair.`);
  } else {
    console.log("\nPara aplicarlo de verdad, lánzalo sin --simular.");
  }
  await pool.end();
}

main().catch(async e => {
  console.error("Error:", e.message);
  await pool.end();
  process.exit(1);
});
