/**
 * GET /api/usage — Devuelve el uso actual del usuario (consultas Guzzi, envíos CV)
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getPlanLimits } from "@/lib/plan-limits";

function todayKey() { return new Date().toISOString().slice(0, 10); }
function weekKey() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const weekNum = Math.ceil(((now.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

export async function GET(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const token = authHeader.slice(7);
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ error: "Sesión no válida." }, { status: 401 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Obtener plan del usuario
  const { data: perfil } = await supabaseAdmin
    .from("profiles")
    .select("plan, subscription_status")
    .eq("id", user.id)
    .single();

  const plan = perfil?.subscription_status === "active" ? perfil.plan : "free";
  const limits = getPlanLimits(plan);

  const today = todayKey();
  const week = weekKey();

  // Uso de hoy
  const { data: todayUsage } = await supabaseAdmin
    .from("usage_tracking")
    .select("guzzi_consultas, envios_cv")
    .eq("user_id", user.id)
    .eq("date_key", today)
    .single();

  // Uso de la semana
  const { data: weekRows } = await supabaseAdmin
    .from("usage_tracking")
    .select("envios_cv")
    .eq("user_id", user.id)
    .eq("week_key", week);

  const enviosSemana = (weekRows ?? []).reduce((sum: number, r: { envios_cv: number }) => sum + r.envios_cv, 0);

  const guzziUsadas = todayUsage?.guzzi_consultas ?? 0;
  const enviosHoy = todayUsage?.envios_cv ?? 0;

  return NextResponse.json({
    plan: plan === "basico" ? "esencial" : plan,
    planName: limits.name,
    guzzi: {
      used: guzziUsadas,
      max: limits.guzziMaxConsultasDia >= 999999 ? null : limits.guzziMaxConsultasDia,
      remaining: limits.guzziMaxConsultasDia >= 999999 ? null : Math.max(0, limits.guzziMaxConsultasDia - guzziUsadas),
      unlimited: limits.guzziMaxConsultasDia >= 999999,
    },
    envios: {
      hoy: enviosHoy,
      maxDia: limits.enviosCVDia,
      remainingDia: Math.max(0, limits.enviosCVDia - enviosHoy),
      semana: enviosSemana,
      maxSemana: limits.enviosCVSemana,
      remainingSemana: Math.max(0, limits.enviosCVSemana - enviosSemana),
    },
    features: {
      cartaIA: limits.cartaPersonalizada,
      codigosPromo: limits.codigosPromocionales,
      apiAccess: limits.apiAccess,
    },
  });
}
