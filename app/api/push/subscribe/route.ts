/**
 * /api/push/subscribe
 * Guarda o elimina suscripciones de push notifications del navegador.
 * POST: registrar suscripción
 * DELETE: eliminar suscripción
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getPool } from "@/lib/db";

export const dynamic = "force-dynamic";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "http://placeholder",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder"
);

async function getUserFromToken(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const body = await request.json() as {
      endpoint: string;
      keys: { p256dh: string; auth: string };
    };

    if (!body.endpoint || !body.keys?.p256dh || !body.keys?.auth) {
      return NextResponse.json({ error: "Suscripción inválida" }, { status: 400 });
    }

    const pool = getPool();
    await pool.query(
      `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, endpoint) DO UPDATE SET p256dh = $3, auth = $4`,
      [user.id, body.endpoint, body.keys.p256dh, body.keys.auth]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[push/subscribe] Error POST:", (error as Error).message);
    return NextResponse.json({ error: "Error al guardar suscripción" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { endpoint } = await request.json() as { endpoint: string };
    if (!endpoint) return NextResponse.json({ error: "endpoint requerido" }, { status: 400 });

    const pool = getPool();
    await pool.query(
      `DELETE FROM push_subscriptions WHERE user_id = $1 AND endpoint = $2`,
      [user.id, endpoint]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[push/subscribe] Error DELETE:", (error as Error).message);
    return NextResponse.json({ error: "Error al eliminar suscripción" }, { status: 500 });
  }
}
