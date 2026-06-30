/**
 * POST /api/notifications/subscribe — Guardar suscripción push del usuario
 * DELETE /api/notifications/subscribe — Eliminar suscripción
 */

import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { getUserFromToken as getUser, extractToken } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

async function verificarAuth(req: NextRequest) {
  const token = extractToken(req.headers.get("Authorization"));
  if (!token) return null;
  return await getUser(token);
}

export async function POST(req: NextRequest) {
  const user = await verificarAuth(req);
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json() as {
      endpoint: string;
      keys?: { p256dh: string; auth: string };
    };

    if (!body.endpoint || !body.keys?.p256dh || !body.keys?.auth) {
      return NextResponse.json({ error: "Suscripción inválida (endpoint, p256dh, auth requeridos)" }, { status: 400 });
    }

    const pool = getPool();
    await pool.query(
      `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, endpoint) DO UPDATE SET p256dh = $3, auth = $4`,
      [user.id, body.endpoint, body.keys.p256dh, body.keys.auth]
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[PushSubscribe]", (err as Error).message);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const user = await verificarAuth(req);
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { endpoint } = await req.json() as { endpoint?: string };
    const pool = getPool();

    if (endpoint) {
      await pool.query(
        `DELETE FROM push_subscriptions WHERE user_id = $1 AND endpoint = $2`,
        [user.id, endpoint]
      );
    } else {
      await pool.query(
        `DELETE FROM push_subscriptions WHERE user_id = $1`,
        [user.id]
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
