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
  // Verificar firma HMAC-SHA256 de Meta (X-Hub-Signature-256)
  const rawBody = await req.text();
  const signature = req.headers.get("x-hub-signature-256");
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  // Firma OBLIGATORIA. Antes se verificaba solo "si llegaba la firma", así que un
  // tercero podía omitir el header y colar mensajes falsos sin verificación.
  if (!appSecret) {
    return NextResponse.json({ error: "Webhook no configurado" }, { status: 503 });
  }
  if (!signature) {
    return NextResponse.json({ error: "Firma requerida" }, { status: 401 });
  }
  {
    const { createHmac, timingSafeEqual } = await import("crypto");
    const expected = "sha256=" + createHmac("sha256", appSecret).update(rawBody).digest("hex");
    try {
      const sigBuf = Buffer.from(signature);
      const expBuf = Buffer.from(expected);
      if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
        return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
      }
    } catch {
      return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
    }
  }

  try {
    const body = JSON.parse(rawBody);

    const entry = body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    // ── Estados de entrega ────────────────────────────────────────────────
    // Meta avisa aquí de qué pasa con cada mensaje que enviamos: sent →
    // delivered → read, o failed con el motivo. Antes se descartaban en
    // silencio, y por eso era imposible saber por qué una alerta aceptada por
    // Meta ("accepted") no llegaba nunca al teléfono del usuario.
    if (value?.statuses?.length) {
      for (const st of value.statuses) {
        const destino = String(st.recipient_id || "");
        const corto = destino.slice(-4);
        if (st.status === "failed") {
          const err = st.errors?.[0];
          console.error(
            `[WhatsApp] NO ENTREGADO a ...${corto} — ${err?.title || "sin titulo"} (codigo ${err?.code}): ${err?.error_data?.details || err?.message || "sin detalle"}`
          );
        } else {
          console.log(`[WhatsApp] ${st.status} -> ...${corto} (id ${st.id})`);
        }
      }
      return NextResponse.json({ ok: true });
    }

    if (!value?.messages?.length) {
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
