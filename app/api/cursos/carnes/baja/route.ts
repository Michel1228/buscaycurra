/**
 * /api/cursos/carnes/baja — Dejar de recibir avisos de caducidad, con un clic.
 *
 * GET:  el enlace del pie del correo. Apaga los avisos de todos sus carnés.
 * POST: la baja "de un clic" de Gmail y otros (cabecera List-Unsubscribe-Post).
 */
import { NextRequest, NextResponse } from "next/server";
import { firmaBajaCarnesValida, sinAvisosDeCarnes } from "@/lib/cursos/carnes";

export const dynamic = "force-dynamic";

async function apagar(req: NextRequest): Promise<"hecho" | "enlace-malo" | "error"> {
  const p = new URL(req.url).searchParams;
  const userId = p.get("u") || "";
  if (!userId || !firmaBajaCarnesValida(userId, p.get("t") || "")) return "enlace-malo";
  try {
    await sinAvisosDeCarnes(userId);
    return "hecho";
  } catch (e) {
    console.error("[cursos/carnes/baja]", (e as Error).message);
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
<a href="https://buscaycurra.es/app/formacion/mis-cursos" style="display:inline-block;background:#22c55e;color:#0f1117;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:10px;">Ver mis carnés</a>
</main></body></html>`;
  return new NextResponse(html, { status, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

export async function GET(req: NextRequest) {
  const r = await apagar(req);
  if (r === "hecho") return pagina("Hecho", "Ya no te avisaremos de cuándo caducan tus carnés. Puedes volver a activarlo en cada carné, en Mis cursos.", 200);
  if (r === "enlace-malo") return pagina("Este enlace no es válido", "Puede que se haya copiado cortado. Prueba con el enlace completo del correo.", 400);
  return pagina("No se ha podido hacer ahora", "Es un fallo nuestro. Vuelve a pulsar el enlace dentro de un rato.", 500);
}

export async function POST(req: NextRequest) {
  const r = await apagar(req);
  return NextResponse.json({ ok: r === "hecho" }, { status: r === "hecho" ? 200 : r === "enlace-malo" ? 400 : 500 });
}
