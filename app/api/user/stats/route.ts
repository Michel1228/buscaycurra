/**
 * GET /api/user/stats?userId=xxx
 * Devuelve estadísticas completas del usuario:
 * - CV enviados (hoy, semana, mes)
 * - Au pair enviados (hoy, semana, mes)
 * - Límites por plan
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "http://placeholder",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder"
);

// Límites diarios por plan
const LIMITS: Record<string, { cv: number; auPair: number }> = {
  free: { cv: 2, auPair: 2 },
  esencial: { cv: 5, auPair: 3 },
  basico: { cv: 5, auPair: 3 },
  pro: { cv: 10, auPair: 5 },
  empresa: { cv: 999, auPair: 999 },
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "userId requerido" }, { status: 400 });
    }

    // Plan del usuario
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan, subscription_status, stripe_subscription_id")
      .eq("id", userId)
      .single();

    // Si tiene stripe_subscription_id y plan !== free, usar plan. Si no, verificar status
    const rawPlan = profile?.plan || "free";
    const plan = (rawPlan !== "free" || profile?.subscription_status === "active")
      ? rawPlan
      : "free";
    const limits = LIMITS[plan] || LIMITS.free;

    // Rangos de tiempo
    const ahora = new Date();
    const inicioHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
    const inicioSemana = new Date(ahora);
    inicioSemana.setDate(ahora.getDate() - ahora.getDay() + 1); // Lunes
    inicioSemana.setHours(0, 0, 0, 0);
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);

    // Count CV sends
    const [{ count: cvHoy }, { count: cvSemana }, { count: cvMes }] = await Promise.all([
      supabase.from("cv_sends").select("*", { count: "exact", head: true })
        .eq("user_id", userId).gte("created_at", inicioHoy.toISOString()),
      supabase.from("cv_sends").select("*", { count: "exact", head: true })
        .eq("user_id", userId).gte("created_at", inicioSemana.toISOString()),
      supabase.from("cv_sends").select("*", { count: "exact", head: true })
        .eq("user_id", userId).gte("created_at", inicioMes.toISOString()),
    ]);

    // Count Au Pair sends (separate table or column)
    const [{ count: apHoy }, { count: apSemana }, { count: apMes }] = await Promise.all([
      supabase.from("au_pair_sends").select("*", { count: "exact", head: true })
        .eq("user_id", userId).gte("created_at", inicioHoy.toISOString()),
      supabase.from("au_pair_sends").select("*", { count: "exact", head: true })
        .eq("user_id", userId).gte("created_at", inicioSemana.toISOString()),
      supabase.from("au_pair_sends").select("*", { count: "exact", head: true })
        .eq("user_id", userId).gte("created_at", inicioMes.toISOString()),
    ]);

    return NextResponse.json({
      plan,
      cv: {
        hoy: cvHoy || 0,
        semana: cvSemana || 0,
        mes: cvMes || 0,
        limiteHoy: limits.cv,
        disponibles: Math.max(0, limits.cv - (cvHoy || 0)),
      },
      auPair: {
        hoy: apHoy || 0,
        semana: apSemana || 0,
        mes: apMes || 0,
        limiteHoy: limits.auPair,
        disponibles: Math.max(0, limits.auPair - (apHoy || 0)),
      },
    });
  } catch (error) {
    console.error("[stats] Error:", (error as Error).message);
    return NextResponse.json(
      { plan: "free", cv: { hoy: 0, semana: 0, mes: 0, limiteHoy: 2, disponibles: 2 }, auPair: { hoy: 0, semana: 0, mes: 0, limiteHoy: 2, disponibles: 2 } },
      { status: 200 }
    );
  }
}
