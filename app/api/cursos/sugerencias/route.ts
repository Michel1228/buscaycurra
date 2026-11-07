/**
 * /api/cursos/sugerencias — El interruptor de "sugerirme cursos según mi CV".
 *
 * GET              → { activas }
 * POST { activas } → lo enciende o lo apaga
 *
 * Las sugerencias las manda /api/cursos/sugerencias-cv (lib/cursos/sugerencia-cv.ts).
 */
import { NextRequest, NextResponse } from "next/server";
import { getUserId, correoSinVerificar } from "@/lib/auth-server";
import { ponerSugerencias, quiereSugerencias } from "@/lib/cursos/sugerencia-cv-baja";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    return NextResponse.json({ activas: await quiereSugerencias(userId) });
  } catch (e) {
    console.error("[cursos/sugerencias] GET:", (e as Error).message);
    return NextResponse.json({ error: "No se pudo leer la preferencia" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const sinVerificar = await correoSinVerificar(req);
  if (sinVerificar) return sinVerificar;
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { activas?: boolean };
  try {
    await ponerSugerencias(userId, body.activas !== false);
    return NextResponse.json({ ok: true, activas: body.activas !== false });
  } catch (e) {
    console.error("[cursos/sugerencias] POST:", (e as Error).message);
    return NextResponse.json({ error: "No se pudo guardar" }, { status: 500 });
  }
}
