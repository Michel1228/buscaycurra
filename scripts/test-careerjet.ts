// Minimal test to diagnose Careerjet sync hanging
import { fetchCareerjetGlobal, upsertJobsForSync } from "../lib/job-search/sync-worker";

async function main() {
  console.log("Test 1: Simple fetchCareerjetGlobal...");
  const t0 = Date.now();
  
  try {
    console.log("Calling fetchCareerjetGlobal('developer', 'berlin')...");
    const jobs = await fetchCareerjetGlobal("developer", "berlin");
    const elapsed = Date.now() - t0;
    console.log(`Result: ${jobs.length} jobs in ${elapsed}ms`);
    
    if (jobs.length > 0) {
      console.log(`Sample: ${jobs[0].title} at ${jobs[0].company}`);
      const inserted = await upsertJobsForSync(jobs.slice(0, 3), "OTRO", "de");
      console.log(`Inserted: ${inserted}`);
    }
  } catch (e: any) {
    console.log(`ERROR: ${e.message}`);
    console.log(e.stack);
  }
  
  console.log("DONE");
}

main();
