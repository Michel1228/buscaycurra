/**
 * Scraper de APIs de empleo europeas GRATUITAS (sin auth)
 * 
 * Fuentes:
 * - 🇸🇪 Suecia: JobTech API (jobtechdev.se) — sin auth, JSON
 * - 🇵🇱 Polonia: Just Join IT (justjoin.it) — sin auth, JSON, ofertas IT
 * - 🇵🇱 Polonia: No Fluff Jobs (nofluffjobs.com) — sin auth, JSON, ofertas IT
 */

import { getPool } from "@/lib/db";

export interface EuropeanJob {
  titulo: string;
  empresa: string;
  ubicacion: string;
  url: string;
  fuente: string;
  salario?: string;
  descripcion?: string;
  fecha?: string;
}

// ─── Suecia: JobTech API ────────────────────────────────────────────────────

export async function fetchSwedenJobs(keywords: string[]): Promise<{ fetched: number; inserted: number }> {
  let totalFetched = 0;
  let totalInserted = 0;
  const pool = getPool();

  for (const keyword of keywords) {
    try {
      const url = `https://jobsearch.api.jobtechdev.se/search?q=${encodeURIComponent(keyword)}&limit=100`;
      const res = await fetch(url, {
        headers: { "Accept": "application/json", "User-Agent": "BuscayCurra/1.0" }
      });
      if (!res.ok) continue;
      
      const data = await res.json() as { hits?: Array<{
        id: string;
        headline?: string;
        employer?: { name?: string };
        workplace_address?: { city?: string; region?: string };
        application_deadline?: string;
        description?: { text?: string };
        salary_description?: string;
        webpage_url?: string;
      }> };

      const hits = data.hits || [];
      totalFetched += hits.length;
      let inserted = 0;

      for (const hit of hits) {
        try {
          const id = `jobtech_${hit.id}`;
          const titulo = hit.headline || "Sin título";
          const empresa = hit.employer?.name || "Empresa";
          const ubicacion = hit.workplace_address?.city || hit.workplace_address?.region || "Suecia";
          const url = hit.webpage_url || `https://arbetsformedlingen.se/platsbanken/annonser/${hit.id}`;
          const salario = hit.salary_description || null;
          const descripcion = hit.description?.text?.slice(0, 500) || null;

          await pool.query(
            `INSERT INTO "JobListing" ("id", "title", "company", "city", "sourceUrl", "sourceName", "sector", "salary", "description", "createdAt")
             VALUES ($1, $2, $3, $4, $5, 'JobTech_SE', 'TECNOLOGIA', $6, $7, NOW())
             ON CONFLICT ("id") DO NOTHING`,
            [id, titulo, empresa, ubicacion, url, salario, descripcion]
          );
          inserted++;
        } catch (e) { console.error("JobTech insert error:", e); }
      }
      totalInserted += inserted;
    } catch (e) { console.error("JobTech fetch error:", e); }
  }

  return { fetched: totalFetched, inserted: totalInserted };
}

// ─── Polonia: Just Join IT ──────────────────────────────────────────────────

export async function fetchPolandJJITJobs(): Promise<{ fetched: number; inserted: number }> {
  const pool = getPool();

  try {
    const res = await fetch("https://justjoin.it/api/offers", {
      headers: { "Accept": "application/json", "User-Agent": "BuscayCurra/1.0" }
    });
    if (!res.ok) return { fetched: 0, inserted: 0 };

    const offers = await res.json() as Array<{
      id?: string;
      title?: string;
      company_name?: string;
      city?: string;
      country_code?: string;
      salary_from?: number;
      salary_to?: number;
      salary_currency?: string;
      body?: string;
      marker_icon?: string;
      published_at?: string;
    }>;

    let inserted = 0;
    for (const o of offers) {
      try {
        const id = `jjit_${o.id || Math.random().toString(36).slice(2)}`;
        const titulo = o.title || "Sin título";
        const empresa = o.company_name || "Empresa";
        const ubicacion = [o.city, o.country_code === "PL" ? "Polonia" : o.country_code].filter(Boolean).join(", ");
        const url = `https://justjoin.it/job-offer/${o.id}`;
        const salario = o.salary_from ? `${o.salary_from}-${o.salary_to || ""} ${o.salary_currency || "PLN"}` : null;
        const descripcion = o.body?.slice(0, 500) || null;

        await pool.query(
          `INSERT INTO "JobListing" ("id", "title", "company", "city", "sourceUrl", "sourceName", "sector", "salary", "description", "createdAt")
           VALUES ($1, $2, $3, $4, $5, 'JJIT_PL', 'TECNOLOGIA', $6, $7, NOW())
           ON CONFLICT ("id") DO NOTHING`,
          [id, titulo, empresa, ubicacion, url, salario, descripcion]
        );
        inserted++;
      } catch { /* duplicado */ }
    }

    return { fetched: offers.length, inserted };
  } catch {
    return { fetched: 0, inserted: 0 };
  }
}

// ─── Polonia: No Fluff Jobs ─────────────────────────────────────────────────

export async function fetchPolandNFJJobs(): Promise<{ fetched: number; inserted: number }> {
  const pool = getPool();

  try {
    const res = await fetch("https://nofluffjobs.com/api/posting", {
      headers: {
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (compatible; BuscayCurra/1.0)"
      }
    });
    if (!res.ok) return { fetched: 0, inserted: 0 };

    const data = await res.json() as { postings?: Array<{
      id?: string;
      title?: string;
      name?: string;
      location?: { places?: Array<{ city?: string; province?: string }> };
      salary?: { from?: number; to?: number; currency?: string };
      posted?: number;
      technology?: string;
      url?: string;
    }> };

    const offers = (data.postings || []).slice(0, 2000); // Subido de 500 a 2000
    let inserted = 0;

    // Insert batch de 50 en 50
    for (let i = 0; i < offers.length; i += 50) {
      const batch = offers.slice(i, i + 50);
      const values: string[] = [];
      const params: any[] = [];
      
      batch.forEach((o, idx) => {
        const base = idx * 9;
        values.push(`($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8}, $${base + 9})`);
        params.push(
          `nfj_${o.id || Math.random().toString(36).slice(2)}`,
          o.title || "Sin título",
          o.name || "Empresa",
          o.location?.places?.map((p: { city?: string }) => p.city).filter(Boolean).join(", ") || "Polonia",
          o.url || `https://nofluffjobs.com/pl/job/${o.id}`,
          "NFJ_PL",
          "TECNOLOGIA",
          o.salary?.from ? `${o.salary.from}-${o.salary.to || ""} ${o.salary.currency || "PLN"}` : null,
          new Date().toISOString()
        );
      });

      try {
        const result = await pool.query(
          `INSERT INTO "JobListing" ("id", "title", "company", "city", "sourceUrl", "sourceName", "sector", "salary", "createdAt")
           VALUES ${values.join(", ")}
           ON CONFLICT ("id") DO NOTHING`,
          params
        );
        inserted += result.rowCount || 0;
      } catch (e) { console.error("NFJ batch insert error:", e); }
    }

    return { fetched: offers.length, inserted };
  } catch (e) {
    console.error("NFJ fetch error:", e);
    return { fetched: 0, inserted: 0 };
  }
}

// ─── TODAS las fuentes europeas ─────────────────────────────────────────────

export async function syncAllEuropeanAPIs(): Promise<{
  sweden: { fetched: number; inserted: number };
  polandJJIT: { fetched: number; inserted: number };
  polandNFJ: { fetched: number; inserted: number };
  total: number;
}> {
  // Suecia: keywords en sueco — ampliado a 80 keywords
  const swedenKeywords = [
    // IT / Tech
    "utvecklare", "systemutvecklare", "mjukvaruutvecklare", "webbutvecklare",
    "frontend", "backend", "fullstack", "devops", "data scientist",
    "IT-säkerhet", "IT-arkitekt", "IT-konsult", "IT-support",
    "nätverkstekniker", "systemadministratör", "databasadministratör",
    "scrum master", "product owner", "java", "python", "javascript",
    // Salud
    "sjuksköterska", "läkare", "undersköterska", "vårdare",
    "tandläkare", "tandsköterska", "fysioterapeut", "psykolog",
    "barnmorska", "apotekare", "biomedicinsk analytiker",
    // Educación
    "lärare", "förskollärare", "fritidspedagog", "specialpedagog",
    "studievägledare", "skolassistent",
    // Industria / Ingeniería
    "ingenjör", "civilingenjör", "maskiningenjör", "elektriker",
    "mekaniker", "svetsare", "CNC-operatör", "fastighetstekniker",
    "produktionstekniker", "underhållstekniker", "automation",
    // Oficina / Admin
    "ekonom", "administratör", "receptionist", "kundtjänst",
    "redovisningsekonom", "löneadministratör", "controller",
    "HR", "personaladministratör", "kontorsassistent",
    // Comercio / Servicios
    "säljare", "butiksäljare", "butikschef", "account manager",
    "försäljningschef", "fastighetsmäklare",
    // Hostelería / Restauración
    "kock", "servitör", "barista", "receptionist hotell",
    "städare", "lokalvårdare",
    // Logística / Transporte
    "lastbilschaufför", "lagerarbetare", "truckförare",
    "chaufför", "logistik", "terminalarbetare",
    // Construcción
    "snickare", "målare", "byggarbetare", "VVS-montör",
    "golvläggare", "takmontör",
    // General / Minijobs
    "deltid", "sommarjobb", "extrajobb", "vikarie",
    "timanställd", "projektledare", "konsult", "chef",
    
    // ─── AMPLIACIÓN: +70 keywords suecas ───
    // Más IT
    "frontendutvecklare", "backendutvecklare", "mobilutvecklare", "spelutvecklare",
    "AI", "maskininlärning", "cloud", "azure", "aws", "google cloud",
    "cybersäkerhet", "pentest", "nätverk", "linux", "windows server",
    "tekniker", "elektronik", "robotik", "inbyggda system",
    // Más salud
    "specialistsjuksköterska", "distriktssköterska", "skötare", "habilitering",
    "kiropraktor", "naprapat", "dietist", "logoped", "sjukgymnast",
    // Más educación
    "gymnasielärare", "SFI-lärare", "yrkeslärare", "rektor", "bibliotekarie",
    // Más industria
    "processoperatör", "kemist", "laboratorietekniker", "kvalitetstekniker",
    "montör", "lackering", "plåtslagare", "industrielektriker",
    // Más oficios
    "rörmokare", "ventilation", "kyltekniker", "besiktningsman",
    "brandman", "polis", "väktare", "ordningsvakt",
    // Más servicios
    "frisör", "massör", "nagelterapeut", "estetiker",
    "makeupartist", "tatuerare", "piercare",
    // Transporte
    "busschaufför", "taxichaufför", "budbilschaufför", "lokförare",
    // Finanzas
    "banktjänsteman", "försäkringsrådgivare", "finansiell rådgivare",
    "redovisningskonsult", "revisor", "lönespecialist",
    // Media / Creativo
    "journalist", "fotograf", "grafisk formgivare", "copywriter",
    "översättare", "webbredaktör", "kommunikatör", "producent",
    // Agronomía / Naturaleza
    "jordbrukare", "skogsarbetare", "trädgårdsarbetare", "naturguide",
    "fiskare", "djurvårdare", "veterinär", "hundskötare",
  ];

  const sweden = await fetchSwedenJobs(swedenKeywords);
  const polandJJIT = await fetchPolandJJITJobs();
  const polandNFJ = await fetchPolandNFJJobs();

  return {
    sweden,
    polandJJIT,
    polandNFJ,
    total: sweden.inserted + polandJJIT.inserted + polandNFJ.inserted,
  };
}
