/**
 * scripts/reclasificar-oper.mjs — Reclasifica ofertas antiguas como 'oper'.
 *
 * POR QUÉ HACE FALTA. detectCategoria() se ejecuta al INGERIR una oferta, así
 * que ampliar sus idiomas solo arregla las que entren a partir de ahora. Las
 * que ya están en la base (2,2 millones) se quedan sin categoría para siempre
 * si nadie las repasa. Medido en producción, solo en inglés había 5.252
 * ofertas de almacén sin clasificar.
 *
 * POR QUÉ VA POR LOTES Y NO DE UNA. El servidor tiene dos núcleos y un 85 % de
 * CPU robada por el hipervisor. Un UPDATE de golpe sobre millones de filas lo
 * dejaría clavado y, con el statement_timeout de 15 s del pool, moriría a
 * medias. Así que va de 5.000 en 5.000, con una pausa entre lotes, y se puede
 * parar con Ctrl+C sin dejar nada a medio hacer: cada lote se confirma solo.
 *
 * CÓMO SE USA (desde el VPS, dentro del proyecto):
 *   node scripts/reclasificar-oper.mjs --simular    ← cuenta sin tocar nada
 *   node scripts/reclasificar-oper.mjs              ← aplica los cambios
 *
 * Es idempotente: solo toca filas con categoria NULL, así que volver a
 * lanzarlo no rompe nada ni pisa clasificaciones existentes.
 */

import pg from "pg";

const SIMULAR = process.argv.includes("--simular");
const LOTE = 5000;
const PAUSA_MS = 1500;

// Los mismos patrones que lib/job-search/sync-worker.ts → detectCategoria().
// Si se tocan allí, hay que tocarlos aquí.
const PATRONES = [
  // Español
  String.raw`\y(operario|operador|pe[oó]n|carretillero|reponedor|empaquetador|manipulador|montador|producci[oó]n|f[aá]brica|almac[eé]n|log[ií]stica)\y`,
  // Inglés
  String.raw`\y(warehouse|forklift|order picker|picker|packer|production operative|machine operator|factory worker|logistics operative)\y`,
  // Alemán
  String.raw`\y(lager|lagerist|lagerarbeiter|lagerhelfer|stapler|staplerfahrer|kommissionierer|produktionsmitarbeiter|produktionshelfer|fabrikarbeiter)\y`,
  // Francés
  String.raw`\y(magasinier|cariste|manutentionnaire|op[ée]rateur de production|agent de production)\y`,
  // Italiano y portugués
  String.raw`\y(magazziniere|carrellista|operaio|armaz[ée]m|empilhador|oper[áa]rio)\y`,
  // Neerlandés y polaco
  String.raw`\y(magazijn|magazijnmedewerker|heftruck|productiemedewerker|magazynier|pakowacz)\y`,
];

const CONDICION = PATRONES.map(p => `title ~* '${p}'`).join(" OR ");

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  host: process.env.DATABASE_URL ? undefined : (process.env.PGHOST || "buscaycurra-db"),
  port: process.env.DATABASE_URL ? undefined : parseInt(process.env.PGPORT || "5432"),
  database: process.env.DATABASE_URL ? undefined : "buscaycurra",
  user: process.env.DATABASE_URL ? undefined : "buscaycurra",
  password: process.env.DATABASE_URL ? undefined : (process.env.DATABASE_PASSWORD || process.env.VPS_DB_PASSWORD),
  max: 2,
  // Más que los 15 s del pool de la app: estas consultas recorren mucho y las
  // lanza una persona a propósito, no un visitante impaciente.
  statement_timeout: 120000,
});

async function main() {
  console.log(SIMULAR ? "MODO SIMULACIÓN — no se modifica nada\n" : "APLICANDO CAMBIOS\n");

  const { rows: [{ pendientes }] } = await pool.query(
    `SELECT count(*)::int AS pendientes
       FROM "JobListing"
      WHERE categoria IS NULL AND "isActive" = true AND (${CONDICION})`
  );
  console.log(`Ofertas activas sin categoría que encajan con 'oper': ${pendientes.toLocaleString("es-ES")}`);

  if (SIMULAR) {
    const { rows } = await pool.query(
      `SELECT title, country FROM "JobListing"
        WHERE categoria IS NULL AND "isActive" = true AND (${CONDICION})
        LIMIT 15`
    );
    console.log("\nMuestra de lo que se marcaría:");
    rows.forEach(r => console.log(`  [${r.country || "??"}] ${r.title}`));
    console.log("\nPara aplicarlo de verdad, lánzalo sin --simular.");
    await pool.end();
    return;
  }

  if (pendientes === 0) { console.log("Nada que hacer."); await pool.end(); return; }

  let total = 0;
  for (;;) {
    const r = await pool.query(
      `UPDATE "JobListing" SET categoria = 'oper'
        WHERE id IN (
          SELECT id FROM "JobListing"
           WHERE categoria IS NULL AND "isActive" = true AND (${CONDICION})
           LIMIT ${LOTE}
        )`
    );
    if (r.rowCount === 0) break;
    total += r.rowCount;
    console.log(`  ${total.toLocaleString("es-ES")} / ${pendientes.toLocaleString("es-ES")}`);
    await new Promise(res => setTimeout(res, PAUSA_MS));
  }

  console.log(`\nListo: ${total.toLocaleString("es-ES")} ofertas marcadas como 'oper'.`);
  await pool.end();
}

main().catch(async e => {
  console.error("Error:", e.message);
  await pool.end();
  process.exit(1);
});
