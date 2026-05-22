/**
 * WhatsApp Cloud API Webhook
 * 
 * GET  → Verificación del webhook (Meta manda hub.challenge)
 * POST → Mensajes entrantes y notificaciones de estado
 * 
 * URL para configurar en Meta Developer: https://buscaycurra.es/api/whatsapp/webhook
 * Verify token: WHATSAPP_VERIFY_TOKEN en .env.local
 */

import { NextRequest, NextResponse } from "next/server";

/**
 * GET — Verificación del webhook de Meta
 * Meta manda ?hub.mode=subscribe&hub.verify_token=XXX&hub.challenge=CHALLENGE
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (!verifyToken) {
    console.error("[WhatsApp Webhook] WHATSAPP_VERIFY_TOKEN no configurado");
    return new NextResponse("Not configured", { status: 500 });
  }

  if (mode === "subscribe" && token === verifyToken) {
    console.log("[WhatsApp Webhook] ✅ Verificación exitosa");
    return new NextResponse(challenge, { status: 200 });
  }

  console.warn("[WhatsApp Webhook] ❌ Verificación fallida — token inválido");
  return new NextResponse("Forbidden", { status: 403 });
}

/**
 * POST — Recibe mensajes entrantes y actualizaciones de estado
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("[WhatsApp Webhook] Mensaje recibido:", JSON.stringify(body).slice(0, 500));

    // Meta manda un array de entries, cada entry tiene cambios
    if (body.object === "whatsapp_business_account") {
      for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
          // Mensaje entrante
          if (change.field === "messages" && change.value?.messages) {
            for (const msg of change.value.messages) {
              await manejarMensajeEntrante(change.value.metadata?.display_phone_number, msg);
            }
          }
          // Actualización de estado (entregado, leído, fallido)
          if (change.field === "messages" && change.value?.statuses) {
            for (const status of change.value.statuses) {
              console.log(`[WhatsApp] Estado mensaje ${status.id}: ${status.status}`);
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[WhatsApp Webhook] Error:", err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

/**
 * Maneja un mensaje entrante de WhatsApp
 */
async function manejarMensajeEntrante(phoneNumberId: string, msg: any) {
  const from = msg.from; // Número del usuario
  const text = msg.text?.body?.toLowerCase().trim() || "";

  console.log(`[WhatsApp] Mensaje de ${from}: "${text}"`);

  // Auto-respuesta simple si el usuario escribe "hola" o "info"
  if (text === "hola" || text === "info" || text === "ayuda") {
    // Import dinámico para no cargar WhatsApp en cada request
    const { sendWhatsAppText } = await import("@/lib/whatsapp/sender");
    await sendWhatsAppText(from, 
      "👋 ¡Hola! Soy Guzzi, el asistente de BuscayCurra.\n\n" +
      "Te avisaré cuando encuentre ofertas que encajen con tu perfil.\n\n" +
      "📱 También puedes usar la app en https://buscaycurra.es\n" +
      "🔔 Para gestionar tus alertas: https://buscaycurra.es/app/perfil"
    );
  }

  // Comando: "buscar [puesto]" — búsqueda rápida
  if (text.startsWith("buscar ")) {
    const puesto = text.replace("buscar ", "").trim();
    const { sendWhatsAppText } = await import("@/lib/whatsapp/sender");
    
    try {
      const { buscarOfertasReales } = await import("@/lib/job-search/real-search");
      const ofertas = await buscarOfertasReales({ keyword: puesto, ciudad: "", page: 0, limit: 3 });
      
      if (!ofertas || ofertas.length === 0) {
        await sendWhatsAppText(from, `🔍 No encontré ofertas para "${puesto}" ahora mismo.\nPrueba con otra palabra o busca en la app: https://buscaycurra.es/app/buscar`);
      } else {
        const lista = ofertas.map((o: any, i: number) =>
          `${i + 1}. *${o.title}* en ${o.company}\n   📍 ${o.city || "Varias"} ${o.salary ? "💰 " + o.salary : ""}\n   🔗 ${o.url || "https://buscaycurra.es/app/buscar"}`
        ).join("\n\n");
        await sendWhatsAppText(from, `🔍 *Ofertas de "${puesto}":*\n\n${lista}\n\n📱 Más en: https://buscaycurra.es/app/buscar`);
      }
    } catch {
      await sendWhatsAppText(from, "❌ Error al buscar. Prueba en la app: https://buscaycurra.es/app/buscar");
    }
  }
}
