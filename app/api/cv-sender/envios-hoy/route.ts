import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { PLAN_LIMITS } from "@/lib/cv-sender/plans";
import { getUserFromToken, extractToken } from "@/lib/auth-server";
import { getPlanEfectivo } from "@/lib/plan-limits";
import { ESTADOS_QUE_GASTAN_CUOTA } from "@/lib/cv-sender/rate-limiter";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "http://placeholder",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder"
);

// GET /api/cv-sender/envios-hoy?userId=xxx
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const token = extractToken(request.headers.get("Authorization"));
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const authUser = await getUserFromToken(token);
    if (!authUser) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "userId requerido" }, { status: 400 });
    }

    // Verificar que el userId del query coincide con el del token
    if (userId !== authUser.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Obtener plan del usuario desde Supabase
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan, subscription_status")
      .eq("id", userId)
      .single();

    // El estado de la suscripcion manda sobre el plan guardado: sin esto, quien
    // dejaba de pagar conservaba los limites de su plan de pago.
    const plan = getPlanEfectivo(profile?.plan, profile?.subscription_status);

    // Obtener envíos de hoy desde cv_sends en Supabase
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const { count } = await supabase
      .from("cv_sends")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      // Los mismos estados que el límite del plan: contaba también los
      // cancelados, fallidos y rebotados, y la pantalla decía "3/3" cuando el
      // límite real todavía dejaba enviar (auditoría del 3 oct 2026).
      .in("status", ESTADOS_QUE_GASTAN_CUOTA)
      .gte("created_at", hoy.toISOString());

    const planKey = (plan in PLAN_LIMITS ? plan : "free") as keyof typeof PLAN_LIMITS;
    const perDay = PLAN_LIMITS[planKey].perDay;
    return NextResponse.json({
      enviados: count || 0,
      limite: perDay === Infinity ? 9999 : perDay,
      plan: plan,
    });
  } catch (error) {
    console.error("[envios-hoy] Error:", (error as Error).message);
    return NextResponse.json(
      { enviados: 0, limite: 0, plan: "free" },
      { status: 200 }
    );
  }
}
