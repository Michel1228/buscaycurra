/**
 * /api/notifications — Sistema de notificaciones del usuario
 *
 * GET: Obtener notificaciones del usuario
 * POST: Crear notificación (interno)
 * PATCH: Marcar como leída
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

async function autenticar(request: NextRequest): Promise<{ userId: string } | NextResponse> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const { data: { user }, error } = await supabase.auth.getUser(authHeader.slice(7));
  if (error || !user) return NextResponse.json({ error: "Sesión no válida" }, { status: 401 });
  return { userId: user.id };
}

export async function GET(request: NextRequest) {
  const auth = await autenticar(request);
  if (auth instanceof NextResponse) return auth;
  const { userId } = auth;

  try {
    // LA CUENTA Y LA LISTA SON DOS COSAS DISTINTAS.
    //
    // Antes se pedian 50 notificaciones y se contaban las no leidas DE ESAS 50.
    // Hay usuarios con 262: si sus 50 mas recientes estaban leidas, la campana
    // marcaba cero teniendo 200 sin leer detras. Y el "99+" del componente era
    // codigo inalcanzable, porque la cuenta no podia pasar de 50.
    //
    // La lista sigue topada —es un desplegable, no un archivo— pero la cuenta
    // se pide aparte, sobre todas las filas y sin traerselas (head: true).
    const sb = getSupabaseAdmin();

    const [{ data: notifs, error }, { count, error: errorCuenta }] = await Promise.all([
      sb.from("notificaciones")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50),
      sb.from("notificaciones")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("leida", false),
    ]);

    if (error) { console.error("[NOTIF-DEBUG] Query error:", error.message); throw error; }
    if (errorCuenta) console.error("[Notifications] No se pudo contar las no leidas:", errorCuenta.message);

    // Si la cuenta falla se usa la de la pagina: baja, pero no inventada.
    // Antes ese era el unico camino que habia.
    const sinLeer = errorCuenta
      ? (notifs || []).filter((n: { leida: boolean }) => !n.leida).length
      : (count ?? 0);

    return NextResponse.json({ notificaciones: notifs || [], sinLeer });
  } catch (err) {
    console.error("[Notifications] Error:", (err as Error).message);
    return NextResponse.json({ notificaciones: [], sinLeer: 0 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await autenticar(request);
  if (auth instanceof NextResponse) return auth;
  const { userId } = auth;

  try {
    const body = await request.json();
    const { tipo, titulo, mensaje, datos } = body;

    if (!tipo || !titulo) {
      return NextResponse.json({ error: "Faltan campos" }, { status: 400 });
    }

    const { data, error } = await getSupabaseAdmin()
      .from("notificaciones")
      .insert({
        user_id: userId, // siempre del token
        tipo,
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
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await autenticar(request);
  if (auth instanceof NextResponse) return auth;
  const { userId } = auth;

  try {
    const body = await request.json();
    const { notifId, marcarTodas } = body;

    if (marcarTodas) {
      await getSupabaseAdmin()
        .from("notificaciones")
        .update({ leida: true })
        .eq("user_id", userId)
        .eq("leida", false);
      return NextResponse.json({ ok: true });
    }

    if (!notifId) return NextResponse.json({ error: "notifId requerido" }, { status: 400 });

    // Verificar que la notificación pertenece al usuario (IDOR fix)
    await getSupabaseAdmin()
      .from("notificaciones")
      .update({ leida: true })
      .eq("id", notifId)
      .eq("user_id", userId);

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
