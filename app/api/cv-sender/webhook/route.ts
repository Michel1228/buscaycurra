/**
 * /api/cv-sender/webhook — Rastrear respuestas y aperturas de emails
 *
 * POST: empresa responde o CV es visto → actualiza estado + notifica usuario
 * GET:  tracking pixel 1x1 para detectar apertura
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendPushNotification } from "@/lib/web-push";
import { enviarWhatsApp } from "@/lib/whatsapp";
import type webpush from "web-push";

export const dynamic = "force-dynamic";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

async function enviarPushAlUsuario(
  supabase: ReturnType<typeof getSupabase>,
  userId: string,
  payload: { title: string; body: string; url: string; tag: string }
) {
  try {
    const { data } = await supabase
      .from("push_subscriptions")
      .select("subscription")
      .eq("user_id", userId)
      .single();

    if (!data?.subscription) return;

    const sub = JSON.parse(data.subscription) as webpush.PushSubscription;
    await sendPushNotification(sub, payload);
  } catch (err) {
    // Si la suscripción expiró, la borramos
    if ((err as Error).message === "SUBSCRIPTION_EXPIRED") {
      await supabase.from("push_subscriptions").delete().eq("user_id", userId);
    }
    // Silencioso — push es opcional
  }
}

export async function POST(request: NextRequest) {
  const supabase = getSupabase();
  try {
    const body = await request.json();
    const { tipo, envioId, userId, empresa, detalles } = body;

    if (!tipo || !userId) {
      return NextResponse.json({ error: "tipo y userId requeridos" }, { status: 400 });
    }

    // Actualizar estado del envío si se proporciona ID
    if (envioId) {
      const nuevoEstado = tipo === "respuesta" ? "enviado" : tipo === "visto" ? "enviado" : "enviado";
      const updatePayload: Record<string, unknown> = { status: nuevoEstado };
      if (nuevoEstado === "enviado") updatePayload.sent_at = new Date().toISOString();
      await supabase.from("cv_sends").update(updatePayload).eq("id", envioId);
    }

    const titulos: Record<string, string> = {
      respuesta: `💬 ${empresa || "Una empresa"} ha respondido`,
      visto: `👀 ${empresa || "Una empresa"} ha visto tu CV`,
      enviado: `📧 CV enviado a ${empresa || "nueva empresa"}`,
      recordatorio: "⏰ Recuerda revisar tus candidaturas",
    };

    const mensajes: Record<string, string> = {
      respuesta: `¡Buenas noticias! ${empresa || "La empresa"} ha respondido a tu candidatura. ${detalles || "Revisa tu email para más información."}`,
      visto: `Tu CV fue abierto por ${empresa || "la empresa"}. Esto puede significar que les interesa tu perfil.`,
      enviado: `Tu CV ha sido enviado correctamente a ${empresa || "la empresa"}. Te avisaremos si responden.`,
      recordatorio: detalles || "Tienes candidaturas pendientes de revisión.",
    };

    const tipoNotif =
      tipo === "respuesta" ? "respuesta_empresa" :
      tipo === "visto" ? "cv_visto" :
      tipo === "enviado" ? "cv_enviado" : "recordatorio";

    const titulo = titulos[tipo] || "Actualización";
    const mensaje = mensajes[tipo] || detalles || "";

    try {
      await supabase.from("notificaciones").insert({
        user_id: userId,
        tipo: tipoNotif,
        titulo,
        mensaje,
        datos: { envioId, empresa, detalles },
        leida: false,
      });

      // Enviar push al teléfono
      await enviarPushAlUsuario(supabase, userId, {
        title: titulo,
        body: mensaje,
        url: "/app/envios?tab=envios",
        tag: tipoNotif,
      });

      // Enviar WhatsApp si el usuario tiene número registrado
      const { data: perfil } = await supabase
        .from("profiles")
        .select("whatsapp_phone")
        .eq("id", userId)
        .single();

      if (perfil?.whatsapp_phone) {
        if (tipo === "enviado") {
          await enviarWhatsApp({ tipo: "cv_enviado", to: perfil.whatsapp_phone, empresa: empresa ?? "", puesto: detalles ?? "" });
        } else if (tipo === "visto") {
          await enviarWhatsApp({ tipo: "cv_visto", to: perfil.whatsapp_phone, empresa: empresa ?? "", puesto: detalles ?? "" });
        } else if (tipo === "respuesta") {
          await enviarWhatsApp({ tipo: "respuesta", to: perfil.whatsapp_phone, empresa: empresa ?? "", mensaje: detalles ?? "" });
        }
      }
    } catch {
      console.warn("[Webhook] No se pudo crear notificación (tabla puede no existir)");
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[Webhook] Error:", (err as Error).message);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

// GET — Pixel de tracking para detectar apertura de emails
export async function GET(request: NextRequest) {
  const supabase = getSupabase();
  const { searchParams } = new URL(request.url);
  const trackId = searchParams.get("track");
  const uid = searchParams.get("uid");

  if (trackId && uid) {
    try {
      await supabase.from("cv_sends").update({ status: "enviado" }).eq("id", trackId);

      const titulo = "👀 Tu CV fue abierto";
      const mensaje = "Una empresa ha abierto el email con tu CV. ¡Buena señal!";

      await supabase.from("notificaciones").insert({
        user_id: uid,
        tipo: "cv_visto",
        titulo,
        mensaje,
        datos: { envioId: trackId },
        leida: false,
      });

      await enviarPushAlUsuario(supabase, uid, {
        title: titulo,
        body: mensaje,
        url: "/app/envios?tab=envios",
        tag: "cv_visto",
      });

      // WhatsApp tracking pixel
      const { data: perfil } = await supabase
        .from("profiles")
        .select("whatsapp_phone")
        .eq("id", uid)
        .single();
      if (perfil?.whatsapp_phone) {
        await enviarWhatsApp({ tipo: "cv_visto", to: perfil.whatsapp_phone, empresa: "una empresa", puesto: "" });
      }
    } catch { /* opcional */ }
  }

  const pixel = Buffer.from(
    "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
    "base64"
  );

  return new NextResponse(pixel, {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}
