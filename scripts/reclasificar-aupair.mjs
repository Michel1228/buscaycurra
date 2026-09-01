/**
 * scripts/reclasificar-aupair.mjs — Recupera las ofertas de cuidado de niños
 * que se quedaron sin clasificar por estar escritas en otro idioma.
 *
 * POR QUÉ HACE FALTA. detectCategoria() se ejecuta al INGERIR una oferta, así
 * que ampliar sus idiomas solo arregla lo que entre a partir de ahora. Lo que
 * ya está en la base se queda sin categoría para siempre si nadie lo repasa —
 * y sin categoría es invisible en la sección de Au Pair, por bien que encaje.
 *
 * Medido en producción: 694 ofertas activas de cuidado infantil sin clasificar,
 * 549 de ellas francesas. «Nounou à domicile», «Garde d'enfants à Lyon»,
 * «Barnvakt sökes till Stockholm». Justo lo que busca nuestra gente.
 *
 * ⚠️ VA PAÍS POR PAÍS, Y NO ES UN CAPRICHO. Las dos primeras versiones de este
 * script murieron con «canceling statement due to statement timeout»: recorrer
 * los 2,2 millones de filas aplicando la expresión regular se pasa del límite
 * de tiempo de este servidor, que tiene dos núcleos y un 85 % de CPU robada por
 * el hipervisor. Primero se cayó el recuento; después, ya sin recuento, se cayó
 * el propio UPDATE.
 *
 * Filtrando por país cada consulta se queda en un trozo manejable y el índice
 * de country hace la mitad del trabajo. Además, si un país falla, los demás
 * siguen: antes un solo fallo tiraba el proceso entero sin haber tocado nada.
 *
 * DOS DETALLES DEL PATRÓN QUE COSTARON OFERTAS:
 *   · El apóstrofo. Las ofertas francesas reales escriben «Garde d'enfants»
 *     con la comilla tipográfica, no con la recta. Por eso hay un comodín ahí.
 *   · «tata» NO entra, aunque en italiano signifique niñera: choca con Tata
 *     Consultancy y con «tata» (papá) en polaco.
 *
 * CÓMO SE USA (desde el VPS, dentro del proyecto):
 *   node scripts/reclasificar-aupair.mjs --simular
 *   node scripts/reclasificar-aupair.mjs
 *
 * Es idempotente: solo toca filas con categoria NULL.
 */

import pg from "pg";

const SIMULAR = process.argv.includes("--simular");
const LOTE = 2000;
const PAUSA_MS = 1200;

const PAISES = ["fr", "de", "se", "ch", "be", "it", "nl", "no", "dk", "pl", "at", "es", "ie", "pt", "fi"];

// Los mismos idiomas que lib/job-search/sync-worker.ts -> detectCategoria().
// Si se tocan allí, hay que tocarlos aquí.
const PATRON_AU_PAIR = String.raw`\y(au ?pair|aupair|ni[ñn]era|canguro|babysitter|baby ?sitter|kinderm[äa]dchen|kinderfrau|kinderbetreuung|garde d.?enfants|nounou|assistante maternelle|bambinaia|ragazza alla pari|kinderoppas|gastouder|bab[áa]|barnvakt|barnepike|barnepasser|niania)`;

const PATRON_LIVE_IN = String.raw`\y(live.in.nanny|governess|nounou log[ée]e|inwonende oppas|interne kinderfrau)`;

// Para que no se cuelen puestos de docencia, oficina ni geriatría.
const EXCLUIR = String.raw`\y(kindergarten|teacher|lehrer|professeur|administrative|assistant|manager|director|supervisor|recruiter|payroll|accountant)`;

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  host: process.env.DATABASE_URL ? undefined : (process.env.PGHOST || "buscaycurra-db"),
  port: process.env.DATABASE_URL ? undefined : parseInt(process.env.PGPORT || "5432"),
  database: process.env.DATABASE_URL ? undefined : "buscaycurra",
  user: process.env.DATABASE_URL ? undefined : "buscaycurra",
  password: process.env.DATABASE_URL ? undefined : (process.env.DATABASE_PASSWORD || process.env.VPS_DB_PASSWORD),
  max: 2,
  statement_timeout: 240000,
});

function condicion(patron) {
  return `categoria IS NULL AND "isActive" = true AND lower(country) = $1
          AND title ~* '${patron}' AND title !~* '${EXCLUIR}'`;
}

async function porPais(pais, patron, categoria) {
  if (SIMULAR) {
    const { rows } = await pool.query(
      `SELECT count(*)::int AS n FROM "JobListing" WHERE ${condicion(patron)}`,
      [pais]
    );
    return rows[0].n;
  }

  let total = 0;
  for (;;) {
    const r = await pool.query(
      `UPDATE "JobListing" SET categoria = '${categoria}'
        WHERE id IN (
          SELECT id FROM "JobListing" WHERE ${condicion(patron)} LIMIT ${LOTE}
        )`,
      [pais]
    );
    if (r.rowCount === 0) break;
    total += r.rowCount;
    await new Promise(res => setTimeout(res, PAUSA_MS));
  }
  return total;
}

async function main() {
  console.log(SIMULAR ? "MODO SIMULACION - no se modifica nada" : "APLICANDO CAMBIOS");

  let internas = 0;
  let aupair = 0;

  for (const pais of PAISES) {
    // Primero las de interna, que son más específicas: al revés, el patrón
    // general se las llevaría todas a au_pair.
    const tareas = [[PATRON_LIVE_IN, "live_in_nanny"], [PATRON_AU_PAIR, "au_pair"]];
    for (const [patron, categoria] of tareas) {
      try {
        const n = await porPais(pais, patron, categoria);
        if (n > 0) {
          console.log("  " + pais + " -> " + n + " como " + categoria);
          if (categoria === "live_in_nanny") internas += n;
          else aupair += n;
        }
      } catch (e) {
        // Que falle un país no puede tumbar los demás.
        console.log("  " + pais + " -> ERROR (" + categoria + "): " + e.message.slice(0, 60));
      }
    }
  }

  console.log("");
  console.log(SIMULAR
    ? "Se marcarian " + internas + " como live_in_nanny y " + aupair + " como au_pair."
    : "Listo: " + internas + " como live_in_nanny y " + aupair + " como au_pair.");
  await pool.end();
}

main().catch(async e => {
  console.error("Error:", e.message);
  await pool.end();
  process.exit(1);
});
