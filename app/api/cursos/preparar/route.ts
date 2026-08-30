/**
 * POST /api/cursos/preparar — Le deja la solicitud del curso lista.
 *
 * Esto es lo que separa a BuscayCurra de un directorio de cursos. Un directorio
 * te enseña el curso y te suelta la mano. Aquí, con el CV que ya tenemos, se le
 * devuelve:
 *
 *   1. La carta de solicitud escrita (muchos cursos piden justificar por qué lo
 *      quieres, y ahí es donde la gente abandona).
 *   2. Sus datos ordenados para copiar y pegar en el formulario del portal.
 *   3. Los papeles exactos que le van a pedir, incluidos los que tardan días.
 *
 * Lo que NO hacemos, y conviene tenerlo claro: enviar el formulario por él. Los
 * portales públicos no tienen API y hacerlo sería suplantarle. Le dejamos todo
 * hecho hasta la puerta; el último clic es suyo.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getPool } from "@/lib/db";
import { getUserId } from "@/lib/auth-server";
import { callGroq, callDeepSeek } from "@/lib/guzzi/llm";
import { tipoPorSlug } from "@/lib/cursos/tipos";

export const dynamic = "force-dynamic";

/**
 * Papeles que piden en casi cualquier curso subvencionado en España. Van aquí
 * y no en el catálogo porque se repiten en todos; los específicos de cada curso
 * están en `documentosExtra`.
 */
const DOCUMENTOS_BASE = [
  "DNI o NIE en vigor (que no caduque antes de que acabe el curso)",
  "Tarjeta de demanda de empleo (DARDE) si estás en paro — es lo que más se olvida, y sin ella no puedes acceder a lo subvencionado",
  "Número de afiliación a la Seguridad Social",
  "Currículum actualizado",
];

const PROMPT_SOLICITUD = `Eres Guzzi, el asistente de empleo de BuscayCurra.

Escribe una carta breve para solicitar plaza en un curso de formación.

REGLAS:
- En español, tuteando, natural. Nada de lenguaje de oficina ni florituras.
- Entre 100 y 150 palabras. Que quepa en un formulario.
- Explica por qué quiere el curso y qué va a hacer con él, usando SU experiencia real.
- Si no tiene experiencia en ese campo, no lo disimules: convierte en fuerza las ganas de entrar en el sector.
- NO te inventes titulaciones, empresas ni fechas que no estén en el CV.
- No pongas encabezado, ni fecha, ni "Atentamente". Solo el cuerpo del texto.
- Devuelve SOLO la carta, sin comentarios tuyos.`;

export async function POST(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let slug = "";
  try {
    ({ slug } = (await request.json()) as { slug: string });
  } catch {
    return NextResponse.json({ error: "Petición no válida" }, { status: 400 });
  }

  const curso = tipoPorSlug(slug, "ES");
  if (!curso) {
    return NextResponse.json({ error: "Curso no encontrado" }, { status: 404 });
  }

  // ── CV del usuario ────────────────────────────────────────────────────
  // Vive en user_cvs de la base propia, NO en Supabase. Confundir las dos es
  // el fallo que ya rompió el autorrelleno y probablemente sigue roto en
  // skill-gap, así que aquí se lee de donde de verdad está.
  let cv: Record<string, unknown> | null = null;
  try {
    const r = await getPool().query<{ form_data: Record<string, unknown> }>(
      `SELECT form_data FROM user_cvs WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 1`,
      [userId]
    );
    cv = r.rows[0]?.form_data ?? null;
  } catch (e) {
    console.error("[cursos/preparar] no se pudo leer el CV:", (e as Error).message);
  }

  if (!cv || !cv.nombre) {
    return NextResponse.json(
      {
        error: "sin-cv",
        mensaje: "Necesito tu CV para prepararte la solicitud. Súbelo o créalo y vuelve.",
        accion: "/app/curriculum",
      },
      { status: 428 } // Precondition Required
    );
  }

  // ── Ficha con sus datos, para copiar y pegar en el formulario ─────────
  const ficha = {
    nombre: String(cv.nombre || ""),
    apellidos: String(cv.apellidos || ""),
    email: String(cv.email || ""),
    telefono: String(cv.telefono || ""),
    ciudad: String(cv.ciudad || ""),
  };

  // ── Papeles ───────────────────────────────────────────────────────────
  const documentos = [...DOCUMENTOS_BASE, ...(curso.documentosExtra ?? [])];

  // ── Carta ─────────────────────────────────────────────────────────────
  const experiencia = Array.isArray(cv.experiencia)
    ? (cv.experiencia as Record<string, unknown>[])
        .slice(0, 4)
        .map(e => `${e.puesto || "?"} en ${e.empresa || "?"} (${e.fechas || "?"})`)
        .join("; ")
    : "";

  const contexto = [
    `CURSO: ${curso.nombre}`,
    `PARA QUÉ SIRVE: ${curso.paraQueSirve}`,
    `PUESTOS A LOS QUE DA ACCESO: ${curso.puestos.join(", ")}`,
    "",
    `CANDIDATO: ${ficha.nombre} ${ficha.apellidos}`,
    ficha.ciudad ? `CIUDAD: ${ficha.ciudad}` : "",
    experiencia ? `EXPERIENCIA: ${experiencia}` : "SIN EXPERIENCIA PREVIA REGISTRADA",
    cv.perfilProfesional ? `PERFIL: ${cv.perfilProfesional}` : "",
    cv.aptitudes ? `APTITUDES: ${cv.aptitudes}` : "",
  ].filter(Boolean).join("\n");

  // Groq primero: es gratis y para 150 palabras da de sobra. DeepSeek de
  // respaldo. Mismo criterio que el resto de generaciones de texto de la app.
  const carta =
    (await callGroq(PROMPT_SOLICITUD, contexto, 400)) ||
    (await callDeepSeek(PROMPT_SOLICITUD, contexto, 400));

  if (!carta) {
    return NextResponse.json(
      { error: "Ahora mismo no puedo escribir la carta. Inténtalo en un rato." },
      { status: 503 }
    );
  }

  // ── Registrar el interés ──────────────────────────────────────────────
  // Que falle esto no debe estropearle la solicitud al usuario: es dato
  // nuestro, no suyo. Por eso va al final y sin bloquear la respuesta.
  try {
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    await sb.from("curso_interes").insert({
      user_id: userId,
      curso_slug: curso.slug,
      curso_nombre: curso.nombre,
      sector: curso.sector,
      accion: "preparado",
    });
  } catch (e) {
    console.error("[cursos/preparar] no se pudo registrar el interés:", (e as Error).message);
  }

  return NextResponse.json({
    curso: { slug: curso.slug, nombre: curso.nombre },
    carta: carta.trim(),
    ficha,
    documentos,
    dondeApuntarse: curso.opcionesGratuitas.map(o => ({ nombre: o.nombre, url: o.url })),
  });
}
