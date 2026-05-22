/**
 * /api/whatsapp/webhook
 *
 * GET  — Verificación de webhook por Meta (handshake inicial)
 * POST — Mensajes entrantes (respuestas de empresas, etc.) — guardados en Supabase
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ─── GET: verificación del webhook (Meta lo llama una sola vez al registrar) ──
export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get("hub.mode");
  const token = req.nextUrl.searchParams.get("hub.verify_token");
  const challenge = req.nextUrl.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log("[WhatsApp Webhook] Verificado OK");
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// ─── POST: mensajes entrantes de WhatsApp ─────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const entry = body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    if (!value?.messages?.length) {
      // Puede ser una notificación de estado (entregado, leído) — ignorar silencioso
      return NextResponse.json({ ok: true });
    }

    const supabase = getSupabase();

    for (const msg of value.messages) {
      const from = msg.from as string;   // Número E.164 sin +
      const text = msg.text?.body ?? msg.type ?? "";

      console.log(`[WhatsApp] Mensaje de +${from}: ${text.slice(0, 100)}`);

      // Guardar en tabla whatsapp_messages para auditoría / flujos futuros
      await supabase.from("whatsapp_messages").upsert({
        id: msg.id,
        from_number: from,
        message_type: msg.type,
        text,
        timestamp: new Date(parseInt(msg.timestamp) * 1000).toISOString(),
      }, { onConflict: "id", ignoreDuplicates: true }).select();
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[WhatsApp Webhook] Error:", (e as Error).message);
    return NextResponse.json({ ok: true }); // Siempre 200 a Meta para evitar desactivación
  }
}
