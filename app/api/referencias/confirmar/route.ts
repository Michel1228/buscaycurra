/**
 * /api/referencias/confirmar — Quien firmó la carta contesta si es suya.
 *
 * GET:  el enlace del correo. Enseña la carta y dos botones. NO contesta nada:
 *       los antivirus del correo (Outlook, Gmail) abren los enlaces solos, y si
 *       abrir confirmara, las cartas se darían por buenas sin que nadie las viera.
 * POST: el botón. Solo cuenta la primera respuesta.
 *
 * El enlace va firmado (lib/referencias/referencias.ts): sin la firma nadie
 * contesta por otro cambiando el id.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  enlaceCarta, ENVIOS_POR_REFERENCIA, firmaReferenciaValida, referenciaPorId, responderReferencia,
} from "@/lib/referencias/referencias";

export const dynamic = "force-dynamic";

const admin = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function pagina(titulo: string, contenido: string, status = 200): NextResponse {
  const html = `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>${esc(titulo)} — BuscayCurra</title></head>
<body style="margin:0;background:#0f1117;color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
<main style="max-width:520px;margin:0 auto;padding:56px 20px;">
<p style="font-size:36px;margin:0 0 12px;text-align:center;">🐛</p>
<h1 style="font-size:22px;margin:0 0 16px;text-align:center;">${esc(titulo)}</h1>
${contenido}
</main></body></html>`;
  return new NextResponse(html, { status, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

const texto = (s: string) => `<p style="color:#94a3b8;font-size:15px;line-height:1.6;margin:0 0 16px;">${s}</p>`;

/** Valida el enlace y devuelve la carta, o la página de error. */
async function leer(req: NextRequest) {
  const p = new URL(req.url).searchParams;
  const id = p.get("r") || "";
  const t = p.get("t") || "";
  if (!id || !firmaReferenciaValida(id, t)) {
    return { fallo: pagina("Este enlace no es válido", texto("Puede que se haya copiado cortado. Pruebe con el enlace completo del correo."), 400) };
  }
  const ref = await referenciaPorId(id);
  if (!ref) return { fallo: pagina("Esta carta ya no está", texto("Quien la subió la ha quitado de su perfil. No tiene que hacer nada más.")) };
  return { id, t, ref };
}

export async function GET(req: NextRequest) {
  try {
    const r = await leer(req);
    if ("fallo" in r) return r.fallo;
    const { id, t, ref } = r;
    if (ref.estado !== "pendiente") return pagina("Ya nos contestó", texto("Su respuesta está guardada. Gracias."));

    const url = ref.carta_ruta ? await enlaceCarta(ref.carta_ruta, 60 * 60) : null;
    const verCarta = url
      ? `<p style="margin:0 0 24px;text-align:center;"><a href="${esc(url)}" target="_blank" rel="noopener" style="color:#22c55e;font-weight:600;">Ver la carta (PDF) →</a></p>`
      : "";
    const accion = `/api/referencias/confirmar?r=${encodeURIComponent(id)}&t=${encodeURIComponent(t)}`;
    const boton = (valor: string, etiqueta: string, estilo: string) =>
      `<button type="submit" name="respuesta" value="${valor}" style="width:100%;padding:14px;border-radius:10px;font-size:15px;font-weight:700;cursor:pointer;${estilo}">${etiqueta}</button>`;
    return pagina("¿Escribió usted esta carta?", `
${texto(`Nos dicen que la firmó usted, <strong style="color:#f1f5f9;">${esc(ref.firmante)}</strong>, como ${esc(ref.cargo)} de <strong style="color:#f1f5f9;">${esc(ref.empresa)}</strong>.`)}
${verCarta}
<form method="post" action="${esc(accion)}" style="display:flex;flex-direction:column;gap:12px;margin:0 0 24px;">
  ${boton("si", "Sí, la escribí yo", "background:#22c55e;color:#0f1117;border:none;")}
  ${boton("no", "No la reconozco", "background:transparent;color:#f1f5f9;border:1px solid #2d3142;")}
</form>
<p style="color:#64748b;font-size:12px;line-height:1.6;margin:0;">Si dice que sí, las empresas que vean ese perfil verán que usted confirmó la carta, con su nombre, su cargo y la fecha. Si dice que no, la carta se borra y no se enseña. Su correo no se enseña nunca. <a href="https://buscaycurra.es/privacidad" style="color:#94a3b8;">Privacidad</a></p>`);
  } catch (e) {
    console.error("[referencias/confirmar] GET:", (e as Error).message);
    return pagina("No se ha podido abrir ahora", texto("Es un fallo nuestro. Vuelva a abrir el enlace dentro de un rato."), 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const r = await leer(req);
    if ("fallo" in r) return r.fallo;
    const respuesta = String((await req.formData().catch(() => null))?.get("respuesta") || "");
    if (respuesta !== "si" && respuesta !== "no") return pagina("Falta la respuesta", texto("Vuelva al enlace del correo y pulse uno de los dos botones."), 400);

    const res = await responderReferencia(r.id, respuesta === "si");
    if (!res.ok) {
      return res.motivo === "ya-contestada"
        ? pagina("Ya nos contestó", texto("Su respuesta está guardada. Gracias."))
        : pagina("Esta carta ya no está", texto("Quien la subió la ha quitado de su perfil. No tiene que hacer nada más."));
    }

    const sb = admin();
    const quien = r.ref.firmante.split(" ")[0] || "Quien firmó";
    if (res.estado === "rechazada" && res.cartaRuta) await sb.storage.from("cvs").remove([res.cartaRuta]);
    await sb.from("notificaciones").insert({
      user_id: res.userId, tipo: "referencia", leida: false, datos: { url: "/app/curriculum" },
      titulo: res.estado === "verificada" ? `${quien} ha confirmado tu carta de ${r.ref.empresa}` : `${quien} no ha confirmado tu carta de ${r.ref.empresa}`,
      mensaje: res.estado === "verificada"
        ? `Las empresas ya lo ven en tu perfil.${res.premiada ? ` Te damos ${ENVIOS_POR_REFERENCIA} envíos de CV más; se usan cuando se te acaben los de tu plan.` : ""}`
        : "No se enseñará a las empresas y la hemos borrado. Puedes quitarla de tu lista en tu CV.",
    });

    return res.estado === "verificada"
      ? pagina("Gracias por confirmarlo", texto("Las empresas que vean ese perfil sabrán que la carta es suya. No tiene que hacer nada más."))
      : pagina("Gracias por avisarnos", texto("La carta se ha borrado y no se enseñará a nadie. No tiene que hacer nada más."));
  } catch (e) {
    console.error("[referencias/confirmar] POST:", (e as Error).message);
    return pagina("No se ha podido guardar", texto("Es un fallo nuestro. Vuelva a abrir el enlace del correo dentro de un rato."), 500);
  }
}
