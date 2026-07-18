/**
 * POST /api/cv/ats-score — Encaje ATS del CV del usuario contra una oferta
 *
 * Compara el CV activo (user_cvs más reciente) con la oferta (título/empresa/
 * descripción) usando IA y devuelve JSON estricto:
 *   { score: 0-100, resumen, faltan: string[], consejos: string[] }
 *
 * Es la versión "premium" del match heurístico de las cards: dice QUÉ palabras
 * clave faltan y CÓMO mejorar el CV para esa oferta concreta (lo que venden
 * Jobscan/Teal, aquí en español y con el CV que ya tenemos en BD).
 */
import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth-server";
import { getPool } from "@/lib/db";
import { checkUserRateLimit, RATE_LIMIT_MESSAGE } from "@/lib/rate-limit-user";
import { enrutarPeticionIA } from "@/lib/ai/ai-router";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

interface AtsResultado {
  score: number;
  resumen: string;
  faltan: string[];
  consejos: string[];
}

function cvCompacto(fd: Record<string, unknown>): string {
  const partes: string[] = [];
  if (fd.subtitulo) partes.push(`Puesto objetivo: ${fd.subtitulo}`);
  if (fd.perfilProfesional) partes.push(`Perfil: ${fd.perfilProfesional}`);
  if (Array.isArray(fd.experiencia)) {
    const exp = (fd.experiencia as Record<string, unknown>[])
      .filter((e) => e.puesto)
      .map((e) => `- ${e.puesto} en ${e.empresa || "?"} (${e.fechas || "?"}): ${String(e.descripcion || "").slice(0, 200)}`)
      .join("\n");
    if (exp) partes.push(`Experiencia:\n${exp}`);
  }
  if (fd.aptitudes) partes.push(`Habilidades: ${String(fd.aptitudes)}`);
  if (fd.idiomas) partes.push(`Idiomas: ${String(fd.idiomas)}`);
  return partes.join("\n").slice(0, 4000);
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId(req);
    if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const permitido = await checkUserRateLimit("ats-score", userId, 15, 3600);
    if (!permitido) return NextResponse.json({ error: RATE_LIMIT_MESSAGE }, { status: 429 });

    const { titulo, empresa, descripcion } = (await req.json()) as {
      titulo?: string; empresa?: string; descripcion?: string;
    };
    if (!titulo?.trim()) {
      return NextResponse.json({ error: "Falta el título de la oferta" }, { status: 400 });
    }

    // CV activo del usuario (el más reciente)
    const pool = getPool();
    const cvRes = await pool.query(
      `SELECT form_data FROM user_cvs WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 1`,
      [userId]
    );
    const fd = cvRes.rows[0]?.form_data as Record<string, unknown> | undefined;
    if (!fd || !fd.nombre) {
      return NextResponse.json(
        { error: "sin-cv", mensaje: "Crea tu CV primero en /app/curriculum para poder analizar el encaje." },
        { status: 422 }
      );
    }

    const prompt = `Eres un sistema ATS (filtro automático de candidaturas) español. Evalúa el encaje de este CV con la oferta.

OFERTA:
Título: ${titulo}
${empresa ? `Empresa: ${empresa}` : ""}
${descripcion ? `Descripción: ${String(descripcion).slice(0, 1500)}` : ""}

CV DEL CANDIDATO:
${cvCompacto(fd)}

DEVUELVE SOLO este JSON (sin markdown, sin comentarios, sin texto fuera del JSON):
{"score": <0-100 entero, encaje realista del CV con la oferta>, "resumen": "<1 frase en español resumiendo el encaje>", "faltan": ["<hasta 5 palabras clave o requisitos de la oferta que NO aparecen en el CV>"], "consejos": ["<hasta 3 consejos CONCRETOS y accionables en español para mejorar el encaje, basados solo en datos reales del CV>"]}`;

    const r = await enrutarPeticionIA("generico", prompt);

    // Parseo defensivo: extraer el primer bloque {...} de la respuesta
    let resultado: AtsResultado | null = null;
    try {
      const m = r.respuesta.match(/\{[\s\S]*\}/);
      if (m) {
        const parsed = JSON.parse(m[0]) as Partial<AtsResultado>;
        resultado = {
          score: Math.min(100, Math.max(0, Math.round(Number(parsed.score) || 0))),
          resumen: String(parsed.resumen || "").slice(0, 200),
          faltan: Array.isArray(parsed.faltan) ? parsed.faltan.slice(0, 5).map(String) : [],
          consejos: Array.isArray(parsed.consejos) ? parsed.consejos.slice(0, 3).map(String) : [],
        };
      }
    } catch { /* respuesta no parseable */ }

    if (!resultado) {
      return NextResponse.json({ error: "No se pudo analizar el encaje. Inténtalo de nuevo." }, { status: 502 });
    }

    return NextResponse.json(resultado);
  } catch (err) {
    console.error("[ats-score]", (err as Error).message);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
