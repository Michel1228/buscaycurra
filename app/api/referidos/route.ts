/**
 * /api/referidos — Sistema de referidos
 * GET: obtener código de referido + stats
 * POST: canjear código de referido
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// ─── GET: obtener mi código y estadísticas ──────────────────────────────────
export async function GET(request: NextRequest) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Sesión no válida" }, { status: 401 });
    }

    // Obtener o generar código de referido
    const { data: perfil } = await supabaseAdmin
      .from("profiles")
      .select("referral_code, referral_count, referral_credits")
      .eq("id", user.id)
      .single();

    let codigo = perfil?.referral_code;
    if (!codigo) {
      // Generar código único: primeras 3 letras del email + 4 números aleatorios
      const prefix = (user.email || "usr").split("@")[0].slice(0, 3).toUpperCase();
      codigo = `${prefix}${Math.floor(1000 + Math.random() * 9000)}`;
      await supabaseAdmin.from("profiles").update({ referral_code: codigo }).eq("id", user.id);
    }

    return NextResponse.json({
      codigo,
      invitados: perfil?.referral_count || 0,
      creditos: perfil?.referral_credits || 0,
      link: `https://buscaycurra.es/auth/registro?ref=${codigo}`,
    });
  } catch (error) {
    console.error("[referidos] Error GET:", (error as Error).message);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// ─── POST: canjear código de referido ───────────────────────────────────────
export async function POST(request: NextRequest) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Sesión no válida" }, { status: 401 });
    }

    const body = await request.json() as { codigo?: string };
    const codigo = body.codigo?.trim().toUpperCase();

    if (!codigo) {
      return NextResponse.json({ error: "Código requerido" }, { status: 400 });
    }

    // No puedes referirte a ti mismo
    const { data: miPerfil } = await supabaseAdmin
      .from("profiles")
      .select("referral_code")
      .eq("id", user.id)
      .single();

    if (miPerfil?.referral_code === codigo) {
      return NextResponse.json({ error: "No puedes usar tu propio código" }, { status: 400 });
    }

    // Buscar al referente
    const { data: referente } = await supabaseAdmin
      .from("profiles")
      .select("id, referral_count, referral_credits")
      .eq("referral_code", codigo)
      .single();

    if (!referente) {
      return NextResponse.json({ error: "Código no válido" }, { status: 400 });
    }

    // Verificar que no haya sido referido antes
    const { data: yaReferido } = await supabaseAdmin
      .from("referrals")
      .select("id")
      .eq("referred_id", user.id)
      .single();

    if (yaReferido) {
      return NextResponse.json({ error: "Ya has usado un código de referido" }, { status: 400 });
    }

    // Registrar la referencia
    await supabaseAdmin.from("referrals").insert({
      referrer_id: referente.id,
      referred_id: user.id,
      code_used: codigo,
      created_at: new Date().toISOString(),
    });

    // Actualizar contador del referente (+10 créditos = +10 CVs extra)
    await supabaseAdmin.from("profiles").update({
      referral_count: (referente.referral_count || 0) + 1,
      referral_credits: (referente.referral_credits || 0) + 10,
    }).eq("id", referente.id);

    // Actualizar el perfil del nuevo usuario con el referente
    await supabaseAdmin.from("profiles").update({
      referred_by: referente.id,
    }).eq("id", user.id);

    return NextResponse.json({
      success: true,
      mensaje: "¡Código canjeado! Tu amigo ha ganado +10 CVs",
    });
  } catch (error) {
    console.error("[referidos] Error POST:", (error as Error).message);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
