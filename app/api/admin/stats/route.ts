import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getPool } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-admin-secret") ?? req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const [
    { count: totalUsuarios },
    { data: perfiles },
    { data: recientes },
    jobsResult,
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("plan"),
    supabase.from("profiles").select("created_at").order("created_at", { ascending: false }).limit(7),
    getPool().query<{ cnt: string; source: string }>(
      `SELECT "sourceName" as source, COUNT(*) as cnt FROM "JobListing" WHERE "isActive" = true GROUP BY "sourceName"`
    ).catch(() => ({ rows: [] as { cnt: string; source: string }[] })),
  ]);

  const planCount: Record<string, number> = { free: 0, esencial: 0, basico: 0, pro: 0, empresa: 0 };
  for (const p of perfiles ?? []) {
    const plan = (p.plan as string) ?? "free";
    planCount[plan] = (planCount[plan] ?? 0) + 1;
  }

  const pagados = (totalUsuarios ?? 0) - (planCount.free ?? 0);

  const jobsBySource: Record<string, number> = {};
  let totalOfertas = 0;
  for (const row of jobsResult.rows) {
    jobsBySource[row.source] = parseInt(row.cnt);
    totalOfertas += parseInt(row.cnt);
  }

  return NextResponse.json({
    usuarios: totalUsuarios ?? 0,
    pagados,
    ofertas: totalOfertas,
    jobsBySource,
    planes: planCount,
    recientes: recientes?.map(r => r.created_at) ?? [],
    ts: new Date().toISOString(),
  });
}
