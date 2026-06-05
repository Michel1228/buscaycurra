/**
 * /api/jobs/sync-france-travail
 * Sincroniza ofertas de France Travail (1.5M+ ofertas francesas)
 * Autenticación: OAuth2 client_credentials
 */
import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const KEYWORDS = [
  "informatique", "développeur", "commercial", "comptable", "infirmier",
  "ingénieur", "technicien", "assistant", "administratif", "ouvrier",
  "conducteur", "cuisinier", "serveur", "vendeur", "manutentionnaire",
  "electricien", "mécanicien", "soudeur", "cariste", "agent",
  "nettoyage", "sécurité", "bâtiment", "logistique", "transport",
  "marketing", "communication", "ressources humaines", "finance", "design",
];

const CITIES = [
  { code: "75", name: "Paris" },
  { code: "13", name: "Marseille" },
  { code: "69", name: "Lyon" },
  { code: "31", name: "Toulouse" },
  { code: "33", name: "Bordeaux" },
  { code: "44", name: "Nantes" },
  { code: "59", name: "Lille" },
  { code: "67", name: "Strasbourg" },
  { code: "34", name: "Montpellier" },
  { code: "35", name: "Rennes" },
];

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60000) {
    return cachedToken.token;
  }
  const res = await fetch(
    "https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=%2Fpartenaire",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: process.env.FRANCE_TRAVAIL_CLIENT_ID || "",
        client_secret: process.env.FRANCE_TRAVAIL_CLIENT_SECRET || "",
        scope: "api_offresdemploiv2 o2dsoffre",
      }),
    }
  );
  if (!res.ok) throw new Error(`Auth error: ${res.status}`);
  const data = await res.json();
  cachedToken = { token: data.access_token, expiresAt: Date.now() + (data.expires_in || 3600) * 1000 };
  return cachedToken.token;
}

async function upsertJob(job: {
  id: string; title: string; company: string; city: string;
  salary?: string; description?: string; sourceUrl?: string;
  country: string; sourceName: string; contractType?: string;
}) {
  const pool = getPool();
  await pool.query(`
    INSERT INTO "JobListing" (id, title, company, city, salary, description, "sourceUrl", country, "sourceName", "isActive", "createdAt", "scrapedAt")
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET "scrapedAt" = NOW(), "isActive" = true
  `, [job.id, job.title, job.company, job.city, job.salary || null, job.description || null, job.sourceUrl || null, job.country, job.sourceName]);
}

export async function GET() {
  return NextResponse.json({
    source: "France Travail",
    keywords: KEYWORDS.length,
    cities: CITIES.length,
    totalCombos: KEYWORDS.length * CITIES.length,
  });
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-sync-secret");
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let body: { maxCombos?: number; startCombo?: number } = {};
  try { body = await req.json(); } catch { /* defaults */ }

  const maxCombos = Math.min(body.maxCombos ?? 10, 50);
  const start = body.startCombo ?? 0;

  const allCombos: Array<{ kw: string; city: { code: string; name: string } }> = [];
  for (const kw of KEYWORDS) {
    for (const city of CITIES) {
      allCombos.push({ kw, city });
    }
  }

  const selected = allCombos.slice(start, start + maxCombos);
  let totalInserted = 0, totalFetched = 0;
  let token: string;

  try { token = await getToken(); }
  catch (e: any) { return NextResponse.json({ error: "Auth failed", detail: e.message }, { status: 500 }); }

  for (const combo of selected) {
    try {
      const res = await fetch(
        "https://api.francetravail.io/partenaire/offresdemploi/v2/offres/search",
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ motsCles: combo.kw, lieux: combo.city.code, range: "0-49" }),
          signal: AbortSignal.timeout(15000),
        }
      );

      if (res.status === 401) { cachedToken = null; token = await getToken(); continue; }
      if (!res.ok) continue;

      const data = await res.json();
      const offres = data.resultats || [];
      totalFetched += offres.length;

      for (const o of offres) {
        const lieu = o.lieuTravail || {};
        const entreprise = o.entreprise || {};
        const sal = o.salaire || {};
        const origine = o.origineOffre || {};

        await upsertJob({
          id: `ft-${o.id}`,
          title: o.intitule || "",
          company: entreprise.nom || "Non spécifié",
          city: lieu.libelle || combo.city.name,
          salary: sal.libelle || null,
          description: (o.description || "").substring(0, 5000),
          sourceUrl: origine.urlOrigine || `https://candidat.francetravail.fr/offres/recherche/detail/${o.id}`,
          country: "FR",
          sourceName: "FranceTravail",
          contractType: o.typeContrat || null,
        });
        totalInserted++;
      }

      await new Promise(r => setTimeout(r, 250));
    } catch { /* skip */ }
  }

  return NextResponse.json({
    ok: true,
    source: "france_travail",
    totalInserted,
    totalFetched,
    combosProcessed: selected.length,
    nextStartCombo: start + maxCombos,
    totalCombos: allCombos.length,
  });
}
