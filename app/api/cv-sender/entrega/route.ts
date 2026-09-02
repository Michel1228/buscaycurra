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
import { createHmac, timingSafeEqual } from "node:crypto";

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

/**
 * Comprueba la firma de Resend.
 *
 * ⚠️ LA PRIMERA VERSIÓN DE ESTO ESTABA MAL Y HABRÍA ROTO EL WEBHOOK. Comparaba
 * la cabecera `svix-signature` directamente con el secreto, y Resend NO manda
 * el secreto: manda una firma HMAC calculada con él. Esa comparación no habría
 * coincidido nunca, así que en cuanto se configurase RESEND_WEBHOOK_SECRET el
 * endpoint habría empezado a devolver 401 a todos los avisos.
 *
 * Resend firma con Svix, que sigue la especificación Standard Webhooks:
 *   · Se firma la cadena `${svix-id}.${svix-timestamp}.${cuerpo en crudo}`
 *   · HMAC-SHA256, con el secreto SIN el prefijo `whsec_` y decodificado de
 *     base64 — no el texto tal cual.
 *   · La cabecera trae una o varias firmas separadas por espacios, cada una
 *     con su versión: «v1,xxxx v1,yyyy». Basta con que coincida una.
 *
 * El cuerpo tiene que ser el CRUDO, sin pasar por JSON.parse y volver a
 * serializar: un espacio de diferencia y la firma ya no cuadra.
 */
function firmaValida(cuerpoCrudo: string, cabeceras: Headers, secreto: string): boolean {
  const id = cabeceras.get("svix-id");
  const marca = cabeceras.get("svix-timestamp");
  const firmas = cabeceras.get("svix-signature");
  if (!id || !marca || !firmas) return false;

  // Rechazar avisos viejos: sin esto, alguien que capture uno podría
  // reenviarlo indefinidamente. Cinco minutos de margen.
  const edad = Math.abs(Date.now() / 1000 - Number(marca));
  if (!Number.isFinite(edad) || edad > 300) return false;

  const clave = Buffer.from(secreto.replace(/^whsec_/, ""), "base64");
  const esperada = createHmac("sha256", clave)
    .update(`${id}.${marca}.${cuerpoCrudo}`)
    .digest("base64");

  const esperadaBuf = Buffer.from(esperada);
  for (const parte of firmas.split(" ")) {
    const recibida = parte.split(",")[1];
    if (!recibida) continue;
    const recibidaBuf = Buffer.from(recibida);
    // timingSafeEqual exige la misma longitud, y compararla antes no filtra
    // nada útil: la longitud de una firma base64 es siempre la misma.
    if (recibidaBuf.length === esperadaBuf.length && timingSafeEqual(recibidaBuf, esperadaBuf)) {
      return true;
    }
  }
  return false;
}

export async function POST(req: NextRequest) {
  // El cuerpo se lee UNA vez y en crudo: la firma se calcula sobre el texto
  // exacto que mandó Resend.
  const cuerpoCrudo = await req.text();

  const secreto = process.env.RESEND_WEBHOOK_SECRET;
  if (secreto) {
    if (!firmaValida(cuerpoCrudo, req.headers, secreto)) {
      return NextResponse.json({ error: "Firma no válida" }, { status: 401 });
    }
  } else {
    // Sin secreto se aceptan igual: es preferible recibir los avisos a
    // perderlos mientras se configura, y esto solo cambia el estado de envíos
    // que ya existen. Queda anotado en el registro para que no se olvide.
    console.warn("[cv-sender/entrega] RESEND_WEBHOOK_SECRET sin configurar: aviso aceptado sin verificar");
  }

  let aviso: AvisoResend = {};
  try { aviso = JSON.parse(cuerpoCrudo) as AvisoResend; } catch { /* aviso vacío */ }
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
