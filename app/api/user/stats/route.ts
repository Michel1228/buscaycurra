/**
 * GET /api/user/stats?userId=xxx
 * Devuelve estadísticas de CV sends y plan del usuario
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const LIMITES: Record<string, number> = { free: 2, esencial: 5, pro: 10, empresa: 9999 };

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "userId requerido" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Obtener plan del usuario
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", userId)
      .single();

    const plan = profile?.plan || "free";
    const limiteHoy = LIMITES[plan] ?? 2;

    // Contar envíos de hoy
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const { count: hoyCount } = await supabase
      .from("cv_sends")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .in("status", ["enviado", "pendiente"])
      .gte("created_at", hoy.toISOString());

    const enviadosHoy = hoyCount || 0;
    const disponibles = Math.max(0, limiteHoy - enviadosHoy);

    return NextResponse.json({
      plan,
      cv: {
        hoy: enviadosHoy,
        limiteHoy,
        disponibles,
      },
    });
  } catch (error) {
    console.error("[user/stats] Error:", (error as Error).message);
    return NextResponse.json(
      {
        plan: "free",
        cv: { hoy: 0, limiteHoy: 2, disponibles: 2 },
      },
      { status: 200 }
    );
  }
}
