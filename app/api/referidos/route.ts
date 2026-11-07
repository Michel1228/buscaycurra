/**
 * /api/referidos — Sistema de referidos
 * GET: obtener código de referido + stats
 * POST: canjear código de referido
 *
 * Qué se gana y por qué, en lib/referidos/premios.ts (21 oct 2026).
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getUserFromToken, extractToken, correoSinVerificar } from "@/lib/auth-server";
import { aplicarReferido, amigosEsteMes, premiosDe, AMIGOS_CON_PREMIO_AL_MES, ENVIOS_DEL_INVITADO } from "@/lib/referidos/premios";

export const dynamic = "force-dynamic";

// ─── GET: obtener mi código y estadísticas ──────────────────────────────────
export async function GET(request: NextRequest) {
  const sinVerificar = await correoSinVerificar(request);
  if (sinVerificar) return sinVerificar;
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  try {
    const token = extractToken(request.headers.get("Authorization"));
    if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const user = await getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: "Sesión no válida" }, { status: 401 });
    }

    // Antes solo el plan Pro tenía código, y sin nadie de pago nadie podía
    // invitar: 0 invitaciones en toda la historia. Ahora invita cualquiera.

    // Obtener o generar código de referido
    const { data: perfil } = await supabaseAdmin
      .from("profiles")
      .select("referral_code, referral_count")
      .eq("id", user.id)
      .single();

    let codigo = perfil?.referral_code;
    if (!codigo) {
      // Generar código único con retry: prefijo del email + 4 dígitos aleatorios
      const prefix = (user.email || "usr").split("@")[0].slice(0, 3).toUpperCase();
      for (let intento = 0; intento < 10; intento++) {
        const candidato = `${prefix}${Math.floor(1000 + Math.random() * 9000)}`;
        // Verificar que no existe ya ese código
        const { data: existente } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("referral_code", candidato)
          .maybeSingle();
        if (!existente) {
          const { error: errUpdate } = await supabaseAdmin
            .from("profiles")
            .update({ referral_code: candidato })
            .eq("id", user.id);
          if (!errUpdate) { codigo = candidato; break; }
        }
      }
      if (!codigo) {
        return NextResponse.json({ error: "No se pudo generar código único" }, { status: 500 });
      }
    }

    const [premios, esteMes] = await Promise.all([premiosDe(user.id), amigosEsteMes(supabaseAdmin, user.id)]);
    return NextResponse.json({
      codigo,
      invitados: perfil?.referral_count || 0,
      invitadosEsteMes: esteMes,
      topeAlMes: AMIGOS_CON_PREMIO_AL_MES,
      enviosExtra: premios.envios,
      fotosExtra: premios.fotos,
      link: `https://buscaycurra.es/auth/registro?ref=${codigo}`,
    });
  } catch (error) {
    console.error("[referidos] Error GET:", (error as Error).message);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// ─── POST: canjear código de referido ───────────────────────────────────────
export async function POST(request: NextRequest) {
  const sinVerificar = await correoSinVerificar(request);
  if (sinVerificar) return sinVerificar;
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  try {
    const token = extractToken(request.headers.get("Authorization"));
    if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const user = await getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: "Sesión no válida" }, { status: 401 });
    }

    const body = await request.json() as { codigo?: string };
    const codigo = body.codigo?.trim().toUpperCase();

    if (!codigo) {
      return NextResponse.json({ error: "Código requerido" }, { status: 400 });
    }

    // El código es para quien llega nuevo. Sin esto, dos cuentas de siempre se
    // canjeaban el código la una a la otra y se llevaban los premios.
    const { data: cuenta } = await supabaseAdmin.auth.admin.getUserById(user.id);
    if (!cuenta?.user || Date.now() - new Date(cuenta.user.created_at).getTime() > 30 * 86400000) {
      return NextResponse.json({ error: "El código es para cuentas nuevas (del último mes)." }, { status: 400 });
    }

    const r = await aplicarReferido(supabaseAdmin, user.id, codigo);
    if (!r.ok) {
      const error = r.motivo === "propio" ? "No puedes usar tu propio código"
        : r.motivo === "ya-invitado" ? "Ya has usado un código de invitación"
        : "Código no válido";
      return NextResponse.json({ error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      mensaje: `¡Código canjeado! Tienes ${ENVIOS_DEL_INVITADO} envíos de CV extra${r.referentePremiado ? ", y quien te invitó también gana" : ""}.`,
    });
  } catch (error) {
    console.error("[referidos] Error POST:", (error as Error).message);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
