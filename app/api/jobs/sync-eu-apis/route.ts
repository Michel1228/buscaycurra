/**
 * POST /api/jobs/sync-eu-apis
 * Sincroniza ofertas de APIs europeas gratuitas:
 * - 🇸🇪 Suecia: JobTech (25 keywords × 100 = 2,500 ofertas/ronda)
 * - 🇵🇱 Polonia: Just Join IT + No Fluff Jobs (~3,000 ofertas IT)
 */

import { NextRequest, NextResponse } from "next/server";
import { syncAllEuropeanAPIs } from "@/lib/job-search/european-apis";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-sync-secret") ?? req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const results = await syncAllEuropeanAPIs();
    return NextResponse.json({
      success: true,
      ...results,
      message: `🇪🇺 +${results.total} ofertas europeas (SE: ${results.sweden.inserted}, PL-JJIT: ${results.polandJJIT.inserted}, PL-NFJ: ${results.polandNFJ.inserted})`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    endpoints: {
      sweden: "JobTech API — 25 keywords × 100 ofertas/ronda",
      polandJJIT: "Just Join IT — ~2,500 ofertas IT activas",
      polandNFJ: "No Fluff Jobs — ~500 ofertas IT premium",
    },
    usage: "POST /api/jobs/sync-eu-apis con header x-sync-secret",
  });
}
