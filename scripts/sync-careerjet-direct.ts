/**
 * Sync directo de Careerjet - se ejecuta dentro del contenedor
 * Saltándose el endpoint HTTP que está colgado
 * 
 * Uso: npx tsx scripts/sync-careerjet-direct.ts
 */
import { fetchCareerjetGlobal, upsertJobsForSync } from "../lib/job-search/sync-worker";
import { CAREERJET_COUNTRIES } from "../lib/job-search/careerjet-countries";

const BATCH_SIZE = 10; // Pitfall doc: 50 causa OOM, 10 seguro
const COUNTRIES = ["us","uk","au","ca","de","fr","nl","it","es","se","ch","be","pt","ie","no","dk","at","fi","nz","pl"];

async function main() {
  console.log("=== Careerjet Direct Sync ===");
  console.log(`Countries: ${COUNTRIES.length}, Batch: ${BATCH_SIZE}`);
  let totalInserted = 0;
  let totalFetched = 0;

  for (const country of COUNTRIES) {
    const cfg = CAREERJET_COUNTRIES[country];
    if (!cfg) { console.log(`  ${country}: SKIP (no config)`); continue; }

    let cInserted = 0;
    let cFetched = 0;

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

    console.log(`  ${country} (${cfg.name}): ${cInserted} ins / ${cFetched} fet`);
    totalInserted += cInserted;
    totalFetched += cFetched;
  }

  console.log(`\n=== DONE: ${totalInserted} inserted / ${totalFetched} fetched ===`);
}

main().catch(e => {
  console.error("FATAL:", e);
  process.exit(1);
});
