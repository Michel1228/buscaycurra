/**
 * /api/cursos/aviso/baja — Apagar el aviso de un curso, con un clic.
 *
 * GET:  el enlace del pie del correo. Apaga el aviso y enseña una página sencilla.
 * POST: la baja "de un clic" de Gmail y otros (cabecera List-Unsubscribe-Post).
 *
 * Ver lib/cursos/baja-aviso.ts para la firma.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { firmaBajaAvisoValida } from "@/lib/cursos/baja-aviso";

export const dynamic = "force-dynamic";

async function apagar(req: NextRequest): Promise<"hecho" | "enlace-malo" | "error"> {
  const p = new URL(req.url).searchParams;
  const avisoId = p.get("a") || "";
  const firma = p.get("t") || "";
  if (!avisoId || !firmaBajaAvisoValida(avisoId, firma)) return "enlace-malo";
  try {
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { error } = await sb.from("curso_aviso").update({ activo: false }).eq("id", avisoId);
    if (error) throw new Error(error.message);
    return "hecho";
  } catch (e) {
    console.error("[cursos/aviso/baja]", (e as Error).message);
    return "error";
  }
}

function pagina(titulo: string, texto: string, status: number): NextResponse {
  const html = `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${titulo} — BuscayCurra</title></head>
<body style="margin:0;background:#0f1117;color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
<main style="max-width:480px;margin:0 auto;padding:64px 20px;text-align:center;">
<p style="font-size:40px;margin:0 0 12px;">🐛</p>
<h1 style="font-size:22px;margin:0 0 12px;">${titulo}</h1>
<p style="color:#94a3b8;font-size:15px;line-height:1.6;margin:0 0 28px;">${texto}</p>
<a href="https://buscaycurra.es/cursos" style="display:inline-block;background:#22c55e;color:#0f1117;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:10px;">Ver los cursos</a>
</main></body></html>`;
  return new NextResponse(html, { status, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

export async function GET(req: NextRequest) {
  const r = await apagar(req);
  if (r === "hecho") {
    return pagina("Hecho: aviso apagado", "Ya no te escribiremos sobre este curso. Si lo quieres otra vez, enciéndelo en la ficha del curso.", 200);
  }
  if (r === "enlace-malo") {
    return pagina("Este enlace no es válido", "Puede que se haya copiado cortado. Prueba con el enlace completo del correo.", 400);
  }
  return pagina("No se ha podido hacer ahora", "Es un fallo nuestro. Vuelve a pulsar el enlace dentro de un rato.", 500);
}

export async function POST(req: NextRequest) {
  const r = await apagar(req);
  return NextResponse.json({ ok: r === "hecho" }, { status: r === "hecho" ? 200 : r === "enlace-malo" ? 400 : 500 });
}
