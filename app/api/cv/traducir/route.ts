/**
 * /api/cv/traducir — Traduce el contenido del CV al idioma del país al que se va.
 *
 * Recibe { cv, idioma } y devuelve { cv } con el texto traducido e idioma
 * puesto, listo para generarCV(). No guarda nada: el CV en español de la
 * persona no se toca. Lo que se manda a la IA y lo que se acepta de vuelta
 * está explicado en lib/cv-generator/traducir.ts.
 */
import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth-server";
import { checkUserRateLimit, RATE_LIMIT_MESSAGE } from "@/lib/rate-limit-user";
import { enrutarPeticionIA } from "@/lib/ai/ai-router";
import { esIdiomaCV } from "@/lib/cv-generator/idiomas-cv";
import { aplicarTraduccion, promptTraduccion } from "@/lib/cv-generator/traducir";
import type { CVData } from "@/lib/cv-generator/cv-template";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const corta = (s: unknown, max: number) => (typeof s === "string" ? s.slice(0, max) : undefined);

/** Solo lo que tiene forma de CV y con un tamaño razonable: esto va a una IA. */
function sanear(raw: any): CVData | null {
  if (!raw || typeof raw !== "object" || typeof raw.nombre !== "string") return null;
  return {
    ...raw,
    subtitulo: corta(raw.subtitulo, 200),
    perfilProfesional: corta(raw.perfilProfesional, 3000),
    aptitudes: Array.isArray(raw.aptitudes) ? raw.aptitudes.slice(0, 40).map((a: unknown) => String(a).slice(0, 120)) : undefined,
    idiomas: Array.isArray(raw.idiomas) ? raw.idiomas.slice(0, 12) : undefined,
    experiencia: Array.isArray(raw.experiencia) ? raw.experiencia.slice(0, 15).map((e: any) => ({
      ...e,
      puesto: String(e?.puesto ?? "").slice(0, 200),
      fechas: String(e?.fechas ?? "").slice(0, 80),
      descripcion: Array.isArray(e?.descripcion) ? e.descripcion.slice(0, 15).map((d: unknown) => String(d).slice(0, 600)) : [],
    })) : undefined,
    formacion: Array.isArray(raw.formacion) ? raw.formacion.slice(0, 12).map((f: any) => ({
      ...f, titulo: String(f?.titulo ?? "").slice(0, 300),
    })) : undefined,
  };
}

export async function POST(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Inicia sesión para traducir tu CV." }, { status: 401 });
  if (!(await checkUserRateLimit("cv-traducir", userId, 15, 3600))) {
    return NextResponse.json({ error: RATE_LIMIT_MESSAGE }, { status: 429 });
  }

  const body = await req.json().catch(() => null) as { cv?: unknown; idioma?: unknown } | null;
  const idioma = body?.idioma;
  if (!esIdiomaCV(idioma) || idioma === "es") {
    return NextResponse.json({ error: "Idioma no válido." }, { status: 400 });
  }
  const cv = sanear(body?.cv);
  if (!cv) return NextResponse.json({ error: "No llega el CV." }, { status: 400 });

  try {
    const { respuesta } = await enrutarPeticionIA("traducir-cv", promptTraduccion(cv, idioma));
    const r = aplicarTraduccion(cv, respuesta, idioma);
    if (!r) {
      return NextResponse.json({ error: "No hemos podido traducirlo ahora. Vuelve a intentarlo en un momento." }, { status: 502 });
    }
    return NextResponse.json({ cv: r.cv, sinTraducir: r.sinTraducir });
  } catch (e) {
    console.error("[cv/traducir]", (e as Error).message);
    return NextResponse.json({ error: "No hemos podido traducirlo ahora. Vuelve a intentarlo en un momento." }, { status: 502 });
  }
}
