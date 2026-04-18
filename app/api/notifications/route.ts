/**
 * /api/notifications — Sistema de notificaciones del usuario
 * 
 * GET: Obtener notificaciones del usuario
 * POST: Crear notificación (interno, para cuando una empresa responde)
 * PATCH: Marcar como leída
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET(request: NextRequest) {
  const userId = request.headers.get("x-user-id") ||
    new URL(request.url).searchParams.get("userId");

  if (!userId) return NextResponse.json({ error: "userId requerido" }, { status: 400 });

  try {
    const { data: notifs, error } = await supabase
      .from("notificaciones")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;

    const sinLeer = (notifs || []).filter(n => !n.leida).length;

    return NextResponse.json({
      notificaciones: notifs || [],
      sinLeer,
    });
  } catch (err) {
    console.error("[Notifications] Error:", (err as Error).message);
    return NextResponse.json({ notificaciones: [], sinLeer: 0 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, tipo, titulo, mensaje, datos } = body;

    if (!userId || !tipo || !titulo) {
      return NextResponse.json({ error: "Faltan campos" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("notificaciones")
      .insert({
        user_id: userId,
        tipo,       // "respuesta_empresa" | "cv_enviado" | "cv_visto" | "recordatorio"
        titulo,
        mensaje: mensaje || "",
        datos: datos || {},
        leida: false,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ ok: true, notificacion: data });
  } catch (err) {
    console.error("[Notifications] Error creating:", (err as Error).message);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { notifId, userId, marcarTodas } = body;

    if (marcarTodas && userId) {
      // Marcar todas como leídas
      await supabase
        .from("notificaciones")
        .update({ leida: true })
        .eq("user_id", userId)
        .eq("leida", false);
      return NextResponse.json({ ok: true });
    }

    if (!notifId) {
      return NextResponse.json({ error: "notifId requerido" }, { status: 400 });
    }

    await supabase
      .from("notificaciones")
      .update({ leida: true })
      .eq("id", notifId);

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
