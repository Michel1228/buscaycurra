/**
 * GET /api/jobs/comprobar?id=<id> → { viva: true | false | null }
 * Lo llama la ficha de la oferta al abrirse: si la web de origen ya la ha
 * retirado, se avisa antes de que la persona gaste un envío en ella.
 * Ver lib/job-search/oferta-viva.ts.
 */
import { NextRequest, NextResponse } from "next/server";
import { comprobarOfertaViva } from "@/lib/job-search/oferta-viva";
import { checkUserRateLimit } from "@/lib/rate-limit-user";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id") || "";
  if (!/^[\w-]{1,80}$/.test(id)) return NextResponse.json({ viva: null }, { status: 400 });
  // Cada comprobación es una visita a otra web: tope por IP contra el abuso.
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "desconocida";
  if (!(await checkUserRateLimit("comprobar-oferta", ip, 60, 600))) return NextResponse.json({ viva: null }, { status: 429 });
  return NextResponse.json({ viva: await comprobarOfertaViva(id) });
}
