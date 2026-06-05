/**
 * lib/job-search/remote-apis.ts
 * Fuentes adicionales GRATUITAS de ofertas de empleo:
 * - Remote OK (remoteok.io) — ofertas remotas globales, sin API key
 * - Arbeitnow (arbeitnow.com) — ofertas Europa, sin API key
 */

import { getPool } from "@/lib/db";

interface RawJob {
  titulo: string;
  empresa: string;
  ubicacion: string;
  salario: string;
  descripcion: string;
  url: string;
  fecha: string;
  fuente: string;
}

function slugId(titulo: string, empresa: string, fuente: string): string {
  // ID estable: sin timestamp para evitar duplicados en syncs repetidos
  const base = `${fuente}-${titulo}-${empresa}`
    .toLowerCase()
    .replace(/[^a-z0-9ñáéíóúü]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return base.slice(0, 100);
}

async function guardarOfertas(ofertas: RawJob[]): Promise<number> {
  if (ofertas.length === 0) return 0;
  const pool = getPool();
  let guardadas = 0;

  for (const o of ofertas) {
    try {
      const id = slugId(o.titulo, o.empresa, o.fuente);
      await pool.query(
        `INSERT INTO "JobListing" (id, title, company, city, salary, description, "sourceUrl", "scrapedAt", "isActive", "sourceName", "sector")
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), true, $8, $9)
         ON CONFLICT (id) DO NOTHING`,
        [id, o.titulo, o.empresa, o.ubicacion, o.salario, o.descripcion?.slice(0, 5000) || "", o.url, o.fuente, "OTRO"]
      );
      guardadas++;
    } catch {
      // skip duplicates
    }
  }
  return guardadas;
}

// ─── Remote OK ──────────────────────────────────────────────────────────────

export async function fetchRemoteOK(): Promise<RawJob[]> {
  try {
    // Remote OK movió a remoteok.com, seguir redirects
    const res = await fetch("https://remoteok.com/api", {
      headers: { "User-Agent": "BuscayCurra/1.0 (job board aggregator; contacto@buscaycurra.es)" },
      redirect: "follow",
    });
    if (!res.ok) return [];
    const data = await res.json() as Array<Record<string, unknown>>;

    return data
      .filter((j: Record<string, unknown>) => j.position && j.company && j.url)
      .slice(0, 100)
      .map((j: Record<string, unknown>) => ({
        titulo: String(j.position || ""),
        empresa: String(j.company || ""),
        ubicacion: j.location ? String(j.location) : "Remoto",
        salario: j.salary_min && j.salary_max
          ? `${j.salary_min}-${j.salary_max}€/año`
          : j.salary ? String(j.salary) : "",
        descripcion: String(j.description || ""),
        url: String(j.url || `https://remoteok.io/l/${String(j.slug || j.id || "")}`),
        fecha: j.date ? String(j.date) : new Date().toISOString(),
        fuente: "RemoteOK",
      }));
  } catch {
    return [];
  }
}

// ─── Arbeitnow ───────────────────────────────────────────────────────────────

export async function fetchArbeitnow(): Promise<RawJob[]> {
  try {
    const res = await fetch("https://www.arbeitnow.com/api/job-board-api", {
      headers: { "User-Agent": "BuscayCurra/1.0 (job board aggregator; contacto@buscaycurra.es)" },
    });
    if (!res.ok) return [];
    const data = await res.json() as { data?: Array<Record<string, unknown>> };

    return (data.data || [])
      .slice(0, 100)
      .map((j: Record<string, unknown>) => ({
        titulo: String(j.title || ""),
        empresa: String(j.company_name || ""),
        ubicacion: String(j.location || "Remoto"),
        salario: "",
        descripcion: String(j.description || ""),
        url: String(j.url || ""),
        fecha: j.created_at ? String(j.created_at) : new Date().toISOString(),
        fuente: "Arbeitnow",
      }));
  } catch {
    return [];
  }
}

// ─── Sync completo ───────────────────────────────────────────────────────────

export async function syncRemoteAPIs(): Promise<{ remoteok: number; arbeitnow: number }> {
  console.log("[RemoteAPIs] Iniciando sync...");

  const [remoteOkJobs, arbeitnowJobs] = await Promise.all([
    fetchRemoteOK(),
    fetchArbeitnow(),
  ]);

  const [remoteok, arbeitnow] = await Promise.all([
    guardarOfertas(remoteOkJobs),
    guardarOfertas(arbeitnowJobs),
  ]);

  console.log(`[RemoteAPIs] Sync completado — RemoteOK: ${remoteok}, Arbeitnow: ${arbeitnow}`);
  return { remoteok, arbeitnow };
}
