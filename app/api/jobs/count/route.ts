import { NextResponse } from "next/server";
import { getJobStats } from "@/lib/job-search/sync-worker";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const stats = await getJobStats();
    return NextResponse.json(
      { total: stats.total || 0 },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } }
    );
  } catch {
    return NextResponse.json({ total: 213000 });
  }
}
