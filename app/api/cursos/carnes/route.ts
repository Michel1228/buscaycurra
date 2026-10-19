/**
 * /api/cursos/carnes — Los carnés que ya tengo y cuándo caducan.
 *
 * GET                                         → { carnes, enTuCv }
 * POST { slug, obtenidoEn, caducaEn?, avisos? } → guardar o cambiar uno
 * DELETE ?slug=                               → quitarlo
 *
 * Solo carnés con la renovación confirmada (lib/cursos/carnes.ts).
 */
import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth-server";
import { tipoPorSlug } from "@/lib/cursos/tipos";
import { calcularCaducidad, carnesDe, fechaValida, guardarCarne, quitarCarne } from "@/lib/cursos/carnes";
import { carnesEnElCv } from "@/lib/cursos/carnes-en-cv";
import { getPool } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Entra para ver tus carnés" }, { status: 401 });
  try {
    const carnes = await carnesDe(userId);
    // Los que el CV dice que tiene y aún no ha guardado: se le proponen.
    let enTuCv: string[] = [];
    try {
      const { rows } = await getPool().query(
        "SELECT form_data FROM user_cvs WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 1", [userId]
      );
      const guardados = new Set(carnes.map(c => c.curso_slug));
      enTuCv = carnesEnElCv(rows[0]?.form_data ?? null).filter(s => !guardados.has(s));
    } catch { /* sin CV, sin propuestas */ }
    return NextResponse.json({ carnes, enTuCv });
  } catch (e) {
    console.error("[cursos/carnes] GET:", (e as Error).message);
    return NextResponse.json({ error: "No se pudo leer tus carnés" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Entra para guardar tu carné" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { slug?: string; obtenidoEn?: string; caducaEn?: string; avisos?: boolean };
  const tipo = body.slug ? tipoPorSlug(body.slug, "ES") : undefined;
  if (!tipo?.renovacion) return NextResponse.json({ error: "Ese carné no está entre los que caducan" }, { status: 400 });

  const obtenido = fechaValida(body.obtenidoEn);
  if (!obtenido) return NextResponse.json({ error: "Pon la fecha en que lo sacaste" }, { status: 400 });
  const hoy = new Date().toISOString().slice(0, 10);
  if (obtenido > hoy) return NextResponse.json({ error: "La fecha en que lo sacaste no puede ser futura" }, { status: 400 });

  const manual = body.caducaEn ? fechaValida(body.caducaEn) : null;
  if (body.caducaEn && !manual) return NextResponse.json({ error: "La fecha de caducidad no es válida" }, { status: 400 });
  const caduca = calcularCaducidad(tipo, obtenido, manual);
  if (!caduca) return NextResponse.json({ error: "Pon la fecha de caducidad que diga tu certificado" }, { status: 400 });
  if (caduca <= obtenido) return NextResponse.json({ error: "La caducidad tiene que ser después de cuando lo sacaste" }, { status: 400 });

  try {
    await guardarCarne(userId, tipo.slug, obtenido, caduca, body.avisos !== false);
    return NextResponse.json({ ok: true, carne: { curso_slug: tipo.slug, obtenido_en: obtenido, caduca_en: caduca, avisos: body.avisos !== false } });
  } catch (e) {
    console.error("[cursos/carnes] POST:", (e as Error).message);
    return NextResponse.json({ error: "No se pudo guardar" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const slug = new URL(req.url).searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "Falta slug" }, { status: 400 });
  try {
    await quitarCarne(userId, slug);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[cursos/carnes] DELETE:", (e as Error).message);
    return NextResponse.json({ error: "No se pudo quitar" }, { status: 500 });
  }
}
