/**
 * POST /api/notifications/subscribe — Guardar suscripción push del usuario
 * DELETE /api/notifications/subscribe — Eliminar suscripción
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function POST(req: NextRequest) {
  try {
    const { userId, subscription } = await req.json() as {
      userId: string;
      subscription: object;
    };
    if (!userId || !subscription) {
      return NextResponse.json({ error: "userId y subscription requeridos" }, { status: 400 });
    }

    const supabase = getSupabase();
    const { error } = await supabase
      .from("push_subscriptions")
      .upsert(
        { user_id: userId, subscription: JSON.stringify(subscription), updated_at: new Date().toISOString() },
        { onConflict: "user_id" }
      );

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[PushSubscribe]", (err as Error).message);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await req.json() as { userId: string };
    if (!userId) return NextResponse.json({ error: "userId requerido" }, { status: 400 });

    const supabase = getSupabase();
    await supabase.from("push_subscriptions").delete().eq("user_id", userId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
