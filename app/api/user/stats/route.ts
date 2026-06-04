/**
 * GET /api/user/stats — Estadísticas de envíos y plan del usuario
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const LIMITES: Record<string, number> = {
  free: 2,
  gratuito: 2,
  esencial: 5,
  pro: 10,
  empresa: 9999,
};

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  let userId = "";

  // Auth por Bearer token
  if (authHeader?.startsWith("Bearer ")) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    const { data: { user } } = await supabase.auth.getUser(authHeader.slice(7));
    if (user) userId = user.id;
  }

  // Fallback: query param (legacy, para compatibilidad)
  if (!userId) {
    userId = request.nextUrl.searchParams.get("userId") || "";
  }

  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // Plan del usuario
    const { data: profile } = await adminClient
      .from("profiles")
      .select("plan")
      .eq("id", userId)
      .single();

    const plan: string = profile?.plan || "free";
    const limiteHoy = LIMITES[plan] ?? LIMITES.esencial;

    // Conteos de hoy, semana, mes — usar created_at (momento en que se programó)
    // Incluir pendientes (sent_at puede ser null) y enviados
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const inicioSemana = new Date(hoy);
    inicioSemana.setDate(hoy.getDate() - hoy.getDay());
    inicioSemana.setHours(0, 0, 0, 0);
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

    const [{ count: hoyCount }, { count: semanaCount }, { count: mesCount }, { data: recientes }] = await Promise.all([
      adminClient.from("cv_sends").select("*", { count: "exact", head: true }).eq("user_id", userId).in("status", ["enviado", "pendiente"]).gte("created_at", hoy.toISOString()),
      adminClient.from("cv_sends").select("*", { count: "exact", head: true }).eq("user_id", userId).in("status", ["enviado", "pendiente"]).gte("created_at", inicioSemana.toISOString()),
      adminClient.from("cv_sends").select("*", { count: "exact", head: true }).eq("user_id", userId).in("status", ["enviado", "pendiente"]).gte("created_at", inicioMes.toISOString()),
      adminClient.from("cv_sends").select("company_name, company_email, job_title, sent_at, created_at").eq("user_id", userId).in("status", ["enviado", "pendiente"]).order("created_at", { ascending: false }).limit(10),
    ]);

    const disponibles = Math.max(0, limiteHoy - (hoyCount || 0));

    return NextResponse.json({
      cv: {
        hoy: hoyCount || 0,
        semana: semanaCount || 0,
        mes: mesCount || 0,
        limiteHoy,
        disponibles,
      },
      plan,
      recientes: (recientes || []).map((r) => ({
        empresa: r.company_name,
        email: r.company_email,
        puesto: r.job_title,
        fecha: r.sent_at || r.created_at,
      })),
    });
  } catch (err) {
    console.error("[User Stats] Error:", (err as Error).message);
    return NextResponse.json({
      cv: { hoy: 0, semana: 0, mes: 0, limiteHoy: 2, disponibles: 2 },
      plan: "free",
      recientes: [],
    });
  }
}
