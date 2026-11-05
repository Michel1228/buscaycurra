/**
 * /api/jobs/sync-careerjet-barrido
 *
 * Trae de Careerjet las ofertas más nuevas de un lugar (el país o una de sus
 * ciudades grandes) de un país latinoamericano, sin palabras clave. Es el
 * equivalente del barrido de Adzuna para los países que Adzuna no cubre
 * (Colombia, Perú, Chile y Argentina el 5 nov 2026). La lista de lugares y
 * por qué se pregunta ciudad por ciudad están en CAREERJET_BARRIDO
 * (lib/job-search/sync-worker.ts).
 *
 * Un lugar por llamada (10 páginas, ~30 s): todos juntos no cabrían en los
 * 300 s de maxDuration. Lo recorre scripts/vps/sync-careerjet-barrido.sh.
 */
import { NextRequest, NextResponse } from "next/server";
import { barrerCareerjet, CAREERJET_BARRIDO } from "@/lib/job-search/sync-worker";
import { secretIguales } from "@/lib/secret-compare";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET() {
  return NextResponse.json({ paises: Object.keys(CAREERJET_BARRIDO) });
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-sync-secret");
  if (!secretIguales(secret, process.env.ADMIN_SECRET)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let body: { country?: string; lugar?: number } = {};
  try { body = await req.json(); } catch { /* valores por defecto */ }

  const country = (body.country || "").toLowerCase();
  if (!CAREERJET_BARRIDO[country]) {
    return NextResponse.json({ error: `País no soportado: ${country}` }, { status: 400 });
  }
  const lugar = Math.max(0, Math.floor(body.lugar ?? 0));

  return NextResponse.json(await barrerCareerjet(country, lugar));
}
