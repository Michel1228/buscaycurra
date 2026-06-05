/**
 * Script: sync-careerjet-all.ts
 * Ejecuta sync de Careerjet para los 21 países secuencialmente.
 * Uso: npx tsx scripts/sync-careerjet-all.ts
 */
import { fetchCareerjetGlobal, upsertJobsForSync } from "../lib/job-search/sync-worker";
import { CAREERJET_COUNTRIES } from "../lib/job-search/careerjet-countries";

const BATCH_SIZE = 50;
const COUNTRIES = ["us","uk","au","ca","de","fr","nl","it","es","se","ch","be","pt","ie","no","dk","at","fi","nz","pl"];

const offsets: Record<string, number> = {};

function hrTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}m${s % 60}s` : `${s}s`;
}

async function syncCountry(country: string): Promise<{ inserted: number; fetched: number }> {
  const cfg = CAREERJET_COUNTRIES[country];
  if (!cfg) {
    console.log(`  ⛔ ${country}: no config`);
    return { inserted: 0, fetched: 0 };
  }

  const startIdx = offsets[country] || 0;
  let totalFetched = 0;
  let totalInserted = 0;

  for (let i = 0; i < BATCH_SIZE; i++) {
    const comboIdx = (startIdx + i) % (cfg.keywords.length * cfg.cities.length);
    const kwIdx = comboIdx % cfg.keywords.length;
    const cityIdx = Math.floor(comboIdx / cfg.keywords.length) % cfg.cities.length;
    const kw = cfg.keywords[kwIdx];
    const city = cfg.cities[cityIdx];

    try {
      const jobs = await fetchCareerjetGlobal(kw, city);
      if (jobs.length > 0) {
        const inserted = await upsertJobsForSync(jobs, "OTRO", country);
        totalInserted += inserted;
        totalFetched += jobs.length;
      }
    } catch {
      // skip combo
    }
  }

  offsets[country] = startIdx + BATCH_SIZE;
  return { inserted: totalInserted, fetched: totalFetched };
}

async function main() {
  console.log("=== Careerjet Global Sync ===\n");
  const t0 = Date.now();
  let grandInserted = 0;
  let grandFetched = 0;
  let success = 0;
  let fail = 0;

  for (const country of COUNTRIES) {
    const tCountry = Date.now();
    process.stdout.write(`${country.toUpperCase()}... `);
    try {
      const { inserted, fetched } = await syncCountry(country);
      const elapsed = hrTime(Date.now() - tCountry);
      console.log(`✅ +${inserted} (${fetched} fetched) [${elapsed}]`);
      grandInserted += inserted;
      grandFetched += fetched;
      success++;
    } catch (e: any) {
      console.log(`❌ ${e.message}`);
      fail++;
    }
  }

  const totalElapsed = hrTime(Date.now() - t0);
  console.log(`\n===== RESUMEN =====`);
  console.log(`Éxitos: ${success}/${COUNTRIES.length} | Fallos: ${fail}`);
  console.log(`Total insertados: ${grandInserted} | Total fetched: ${grandFetched}`);
  console.log(`Tiempo total: ${totalElapsed}`);
}

main().catch(e => {
  console.error("FATAL:", e);
  process.exit(1);
});
