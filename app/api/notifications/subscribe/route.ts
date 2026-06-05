/**
 * POST /api/notifications/subscribe — Guardar suscripción push del usuario
 * DELETE /api/notifications/subscribe — Eliminar suscripción
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

async function verificarAuth(req: NextRequest) {
  const supabasePublico = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const { data: { user }, error } = await supabasePublico.auth.getUser(authHeader.slice(7));
  if (error || !user) return null;
  return user;
}

export async function POST(req: NextRequest) {
  const user = await verificarAuth(req);
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json() as { subscription?: object };
    const { subscription } = body;
    if (!subscription) {
      return NextResponse.json({ error: "subscription requerida" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("push_subscriptions")
      .upsert(
        { user_id: user.id, subscription: JSON.stringify(subscription), updated_at: new Date().toISOString() },
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
  const user = await verificarAuth(req);
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const supabase = getSupabaseAdmin();
    await supabase.from("push_subscriptions").delete().eq("user_id", user.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
