/**
 * GET /api/user/stats
 * Devuelve estadísticas de CV sends y plan del usuario
 * Acepta autenticación por token Bearer o query param userId (legacy)
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const LIMITES: Record<string, number> = { free: 2, esencial: 5, pro: 10, empresa: 9999 };

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let userId: string | null = null;

    // 1. Intentar obtener userId del token Bearer
    const authHeader = request.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const supabasePublico = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data: { user }, error: authError } = await supabasePublico.auth.getUser(authHeader.slice(7));
      if (!authError && user) {
        userId = user.id;
      }
    }

    // 2. Fallback: userId como query param (legacy)
    if (!userId) {
      userId = request.nextUrl.searchParams.get("userId");
    }

    if (!userId) {
      return NextResponse.json(
        { plan: "free", cv: { hoy: 0, limiteHoy: 2, disponibles: 2 } },
        { status: 200 }
      );
    }

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

    // Contar semana y mes
    const inicioSemana = new Date(hoy);
    inicioSemana.setDate(hoy.getDate() - hoy.getDay() + 1);
    inicioSemana.setHours(0, 0, 0, 0);

    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

    const [{ count: semanaCount }, { count: mesCount }] = await Promise.all([
      supabase.from("cv_sends")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .in("status", ["enviado", "pendiente"])
        .gte("created_at", inicioSemana.toISOString()),
      supabase.from("cv_sends")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .in("status", ["enviado", "pendiente"])
        .gte("created_at", inicioMes.toISOString()),
    ]);

    // Últimos envíos
    const { data: recientes } = await supabase
      .from("cv_sends")
      .select("company_name, company_email, job_title, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);

    return NextResponse.json({
      plan,
      cv: {
        hoy: enviadosHoy,
        semana: semanaCount || 0,
        mes: mesCount || 0,
        limiteHoy,
        disponibles,
      },
      recientes: (recientes || []).map((r: any) => ({
        empresa: r.company_name,
        email: r.company_email,
        puesto: r.job_title,
        fecha: r.created_at,
      })),
    });
  } catch (error) {
    console.error("[user/stats] Error:", (error as Error).message);
    return NextResponse.json(
      { plan: "free", cv: { hoy: 0, semana: 0, mes: 0, limiteHoy: 2, disponibles: 2 } },
      { status: 200 }
    );
  }
}
