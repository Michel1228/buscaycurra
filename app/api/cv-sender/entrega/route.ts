/**
 * /api/cv-sender/entrega — Lo que Resend nos cuenta de cada correo.
 *
 * POR QUÉ HACÍA FALTA. El estado «enviado» significaba «se lo hemos dado a
 * Resend», no «ha llegado». No había nada escuchando los rebotes: el otro
 * webhook solo registra aperturas y respuestas, y el estado 'fallido' existía
 * en la tabla sin que nadie lo pusiera jamás.
 *
 * Resultado: si el correo de la empresa estaba mal escrito, o el buzón lleno,
 * o nos marcaban como spam, el usuario veía «enviado» y se quedaba esperando
 * una respuesta imposible. Creía haber echado el CV a veinte empresas y a lo
 * mejor había llegado a catorce. Para una función cuyo valor entero es «te
 * mandamos el CV», no saber si llega es el fallo más grave que puede tener.
 *
 * QUÉ HACE. Recibe los avisos de Resend y actualiza el envío:
 *   email.delivered  → entregado
 *   email.bounced    → rebotado, con el motivo
 *   email.complained → rebotado (nos marcaron como spam)
 *
 * Y avisa al usuario cuando rebota, porque es información que necesita: esa
 * empresa NO tiene su CV y puede volver a intentarlo por otra vía.
 *
 * CÓMO SE CONFIGURA (una vez, en el panel de Resend):
 *   Webhooks → Add endpoint → https://buscaycurra.es/api/cv-sender/entrega
 *   Eventos: email.delivered, email.bounced, email.complained
 *   Y copiar el secreto en RESEND_WEBHOOK_SECRET.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { secretIguales } from "@/lib/secret-compare";

export const dynamic = "force-dynamic";

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

interface AvisoResend {
  type?: string;
  data?: {
    email_id?: string;
    to?: string[] | string;
    bounce?: { message?: string; type?: string };
  };
}

export async function POST(req: NextRequest) {
  // Si hay secreto configurado, se exige. Si no lo hay, se acepta pero se
  // registra: es preferible recibir los avisos a perderlos mientras se
  // configura, y esto solo cambia estados de envíos que ya existen.
  const secreto = process.env.RESEND_WEBHOOK_SECRET;
  if (secreto) {
    const cabecera = req.headers.get("x-webhook-secret") || req.headers.get("svix-signature") || "";
    if (!secretIguales(cabecera, secreto)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
  } else {
    console.warn("[cv-sender/entrega] RESEND_WEBHOOK_SECRET sin configurar: aviso aceptado sin verificar");
  }

  const aviso = (await req.json().catch(() => ({}))) as AvisoResend;
  const tipo = aviso.type || "";
  const idCorreo = aviso.data?.email_id;
  const destinatario = Array.isArray(aviso.data?.to) ? aviso.data?.to[0] : aviso.data?.to;

  if (!tipo) return NextResponse.json({ error: "Aviso sin tipo" }, { status: 400 });

  const sb = supabaseAdmin();
  const ahora = new Date().toISOString();

  let cambios: Record<string, unknown> | null = null;
  let rebote = false;

  if (tipo === "email.delivered") {
    cambios = { status: "entregado", entregado_en: ahora };
  } else if (tipo === "email.bounced") {
    rebote = true;
    cambios = {
      status: "rebotado",
      rebotado_en: ahora,
      motivo_rebote: aviso.data?.bounce?.message?.slice(0, 300) || "Rebote sin detalle",
    };
  } else if (tipo === "email.complained") {
    rebote = true;
    cambios = {
      status: "rebotado",
      rebotado_en: ahora,
      motivo_rebote: "El destinatario marcó el correo como spam",
    };
  } else {
    // Los demás eventos no nos dicen nada útil. Se contesta 200 igualmente:
    // devolver error haría que Resend reintentara sin sentido.
    return NextResponse.json({ ok: true, ignorado: tipo });
  }

  // Correlacionar. Lo preferido es el identificador de Resend; si el envío es
  // anterior a que empezáramos a guardarlo, se busca por destinatario entre los
  // envíos recientes que aún no tienen desenlace.
  let consulta = sb.from("cv_sends").update(cambios).select("id, user_id, company_name");

  if (idCorreo) {
    consulta = consulta.eq("resend_id", idCorreo);
  } else if (destinatario) {
    const hace7dias = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    consulta = consulta
      .eq("company_email", destinatario)
      .in("status", ["enviado", "pendiente"])
      .gte("created_at", hace7dias);
  } else {
    return NextResponse.json({ error: "Aviso sin destinatario ni identificador" }, { status: 400 });
  }

  const { data: filas, error } = await consulta;

  if (error) {
    console.error("[cv-sender/entrega]", error.message);
    return NextResponse.json({ error: "No se pudo actualizar" }, { status: 500 });
  }

  // Si ha rebotado, el usuario tiene que enterarse: esa empresa NO tiene su CV.
  if (rebote && filas?.length) {
    for (const fila of filas) {
      await sb.from("notificaciones").insert({
        user_id: fila.user_id,
        tipo: "cv_enviado",
        titulo: `Tu CV no llegó a ${fila.company_name || "una empresa"}`,
        mensaje: "El correo rebotó, así que esa empresa no lo tiene. Puedes intentarlo por otra vía.",
        datos: { url: "/app/envios" },
      });
    }
  }

  return NextResponse.json({ ok: true, tipo, actualizados: filas?.length ?? 0 });
}
