/**
 * /api/cv-sender/webhook — Webhook para rastrear respuestas de empresas
 * 
 * Se activa cuando:
 * 1. Un email de respuesta llega (via SMTP inbox)
 * 2. Un tracking pixel se carga (el email fue abierto/visto)
 * 3. Manualmente desde el dashboard (el usuario marca respuesta)
 * 
 * Crea notificaciones automáticas para el usuario
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

export async function POST(request: NextRequest) {
  const supabase = getSupabase();
  try {
    const body = await request.json();
    const { tipo, envioId, userId, empresa, detalles } = body;

    if (!tipo || !userId) {
      return NextResponse.json({ error: "tipo y userId requeridos" }, { status: 400 });
    }

    // Update cv_sends record if envioId provided
    if (envioId) {
      const nuevoEstado = tipo === "respuesta" ? "respuesta" : tipo === "visto" ? "visto" : "enviado";
      await supabase
        .from("cv_sends")
        .update({ estado: nuevoEstado })
        .eq("id", envioId);
    }

    // Create notification
    const titulos: Record<string, string> = {
      respuesta: `💬 ${empresa || "Una empresa"} ha respondido`,
      visto: `👀 ${empresa || "Una empresa"} ha visto tu CV`,
      enviado: `📧 CV enviado a ${empresa || "nueva empresa"}`,
      recordatorio: `⏰ Recuerda revisar tus candidaturas`,
    };

    const mensajes: Record<string, string> = {
      respuesta: `¡Buenas noticias! ${empresa || "La empresa"} ha respondido a tu candidatura. ${detalles || "Revisa tu email para más información."}`,
      visto: `Tu CV fue abierto por ${empresa || "la empresa"}. Esto puede significar que les interesa tu perfil.`,
      enviado: `Tu CV ha sido enviado correctamente a ${empresa || "la empresa"}. Te avisaremos si responden.`,
      recordatorio: detalles || "Tienes candidaturas pendientes de revisión.",
    };

    try {
      await supabase.from("notificaciones").insert({
        user_id: userId,
        tipo: tipo === "respuesta" ? "respuesta_empresa" : tipo === "visto" ? "cv_visto" : tipo === "enviado" ? "cv_enviado" : "recordatorio",
        titulo: titulos[tipo] || "Actualización",
        mensaje: mensajes[tipo] || detalles || "",
        datos: { envioId, empresa, detalles },
        leida: false,
      });
    } catch {
      // Table might not exist yet — that's OK
      console.warn("[Webhook] Could not create notification (table may not exist)");
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[Webhook] Error:", (err as Error).message);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

/**
 * GET — Tracking pixel para detectar apertura de emails
 * Usage: <img src="https://buscaycurra.es/api/cv-sender/webhook?track=ENVIO_ID&uid=USER_ID" />
 */
export async function GET(request: NextRequest) {
  const supabase = getSupabase();
  const { searchParams } = new URL(request.url);
  const trackId = searchParams.get("track");
  const uid = searchParams.get("uid");

  if (trackId && uid) {
    // Mark as "visto"
    try {
      await supabase
        .from("cv_sends")
        .update({ estado: "visto" })
        .eq("id", trackId);

      await supabase.from("notificaciones").insert({
        user_id: uid,
        tipo: "cv_visto",
        titulo: "👀 Tu CV fue abierto",
        mensaje: "Una empresa ha abierto el email con tu CV. ¡Buena señal!",
        datos: { envioId: trackId },
        leida: false,
      });
    } catch {
      // notification insert optional
    }
  }

  // Return 1x1 transparent pixel
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
