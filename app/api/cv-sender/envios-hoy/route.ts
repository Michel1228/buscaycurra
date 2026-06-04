import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "http://placeholder",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder"
);

// Límites diarios por plan
const LIMITS: Record<string, number> = {
  free: 2,
  esencial: 5,
  basico: 5,
  pro: 10,
  empresa: 999,
};

// GET /api/cv-sender/envios-hoy?userId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "userId requerido" }, { status: 400 });
    }

    // Obtener plan del usuario desde Supabase
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_tier")
      .eq("id", userId)
      .single();

    const plan = profile?.subscription_tier || "free";

    // Obtener envíos de hoy desde cv_sends en Supabase
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const { count } = await supabase
      .from("cv_sends")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", hoy.toISOString());

    return NextResponse.json({
      enviados: count || 0,
      limite: LIMITS[plan] || 2,
      plan: plan,
    });
  } catch (error) {
    console.error("[envios-hoy] Error:", (error as Error).message);
    // En caso de error, devolver valores por defecto
    return NextResponse.json(
      { enviados: 0, limite: 2, plan: "free" },
      { status: 200 }
    );
  }
}
