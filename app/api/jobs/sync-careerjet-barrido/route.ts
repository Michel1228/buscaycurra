/**
 * /api/jobs/sync-careerjet-barrido
 *
 * Trae el catálogo de Careerjet de un país latinoamericano paginando por
 * fecha, sin palabras clave ni ciudades. Es el equivalente del barrido de
 * Adzuna para los países que Adzuna no cubre (Colombia, Perú, Chile y
 * Argentina el 5 nov 2026). La lista y el porqué están en
 * CAREERJET_BARRIDO (lib/job-search/sync-worker.ts).
 *
 * Lo llama scripts/vps/sync-careerjet-barrido.sh desde el crontab del VPS.
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

  let body: { country?: string; paginas?: number; desde?: number } = {};
  try { body = await req.json(); } catch { /* valores por defecto */ }

  const country = (body.country || "").toLowerCase();
  if (!CAREERJET_BARRIDO[country]) {
    return NextResponse.json({ error: `País no soportado: ${country}` }, { status: 400 });
  }
  // Tope de 40 páginas por llamada: cada una son 99 ofertas y ~1-2 s de API
  // más el guardado; 40 caben con holgura en los 300 s de maxDuration.
  const paginas = Math.min(Math.max(body.paginas ?? 20, 1), 40);
  const desde = Math.max(body.desde ?? 1, 1);

  return NextResponse.json(await barrerCareerjet(country, paginas, desde));
}
