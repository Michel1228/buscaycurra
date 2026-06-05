/**
 * Sync Careerjet — 50 combos por país, secuencial
 * Ejecutar dentro del contenedor Docker
 */
import { fetchCareerjetGlobal, upsertJobsForSync } from "../lib/job-search/sync-worker";
import { CAREERJET_COUNTRIES } from "../lib/job-search/careerjet-countries";

const BATCH_SIZE = 50;
const COUNTRIES = ["us","uk","au","ca","de","fr","nl","it","es","se","ch","be","pt","ie","no","dk","at","fi","nz","pl"];

async function main() {
  console.log("=== Careerjet Global Sync ===");
  console.log(`Countries: ${COUNTRIES.length}, Batch: ${BATCH_SIZE}`);
  console.log(`Start: ${new Date().toISOString()}\n`);
  
  let totalInserted = 0;
  let totalFetched = 0;

  for (const country of COUNTRIES) {
    const cfg = CAREERJET_COUNTRIES[country];
    if (!cfg) { console.log(`  ${country}: SKIP (no config)`); continue; }

    let cInserted = 0;
    let cFetched = 0;
    const startTime = Date.now();

    for (let i = 0; i < BATCH_SIZE; i++) {
      const comboIdx = i % (cfg.keywords.length * cfg.cities.length);
      const kwIdx = comboIdx % cfg.keywords.length;
      const cityIdx = Math.floor(comboIdx / cfg.keywords.length) % cfg.cities.length;
      const kw = cfg.keywords[kwIdx];
      const city = cfg.cities[cityIdx];

      try {
        const jobs = await fetchCareerjetGlobal(kw, city);
        if (jobs.length > 0) {
          const inserted = await upsertJobsForSync(jobs, "OTRO", country);
          cInserted += inserted;
          cFetched += jobs.length;
        }
      } catch (e) { /* skip combo */ }
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
    console.log(`  ${country} (${cfg.name}): ${cInserted} ins / ${cFetched} fet (${elapsed}s)`);
    totalInserted += cInserted;
    totalFetched += cFetched;
  }

  console.log(`\n=== DONE: ${totalInserted} inserted / ${totalFetched} fetched ===`);
  console.log(`End: ${new Date().toISOString()}`);
}

main().catch(e => {
  console.error("FATAL:", e);
  process.exit(1);
});
