/**
 * GET /api/usage — Devuelve el uso actual del usuario (consultas Guzzi, envíos CV)
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getPlanLimits } from "@/lib/plan-limits";

function todayKey() { return new Date().toISOString().slice(0, 10); }

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

  // Uso de hoy (consultas Guzzi: usage_tracking sigue siendo la fuente para esto)
  const { data: todayUsage } = await supabaseAdmin
    .from("usage_tracking")
    .select("guzzi_consultas")
    .eq("user_id", user.id)
    .eq("date_key", today)
    .single();

  // Envios: usage_tracking.envios_cv nunca se incrementaba (trackCVSend() no
  // lo llamaba nadie), asi que este contador siempre marcaba 0 aunque el
  // usuario ya hubiera gastado su cuota. El limite real de envios se aplica
  // contando filas de cv_sends (ver /api/cv-sender/envios-hoy) — se cuenta
  // de la misma tabla aqui para que lo que el usuario VE coincida con lo que
  // de verdad se lo bloquea.
  const inicioHoy = new Date();
  inicioHoy.setHours(0, 0, 0, 0);
  const inicioSemana = new Date();
  inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay());
  inicioSemana.setHours(0, 0, 0, 0);

  const { count: enviosHoyCount } = await supabaseAdmin
    .from("cv_sends")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", inicioHoy.toISOString());

  const { count: enviosSemanaCount } = await supabaseAdmin
    .from("cv_sends")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", inicioSemana.toISOString());

  const guzziUsadas = todayUsage?.guzzi_consultas ?? 0;
  const enviosHoy = enviosHoyCount ?? 0;
  const enviosSemana = enviosSemanaCount ?? 0;

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
