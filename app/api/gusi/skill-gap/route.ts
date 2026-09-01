/**
 * POST /api/gusi/skill-gap
 * Compara el CV del usuario con una oferta y detecta lo que le falta.
 *
 * ESTUVO MUERTO PARA TODO EL MUNDO, y no se notaba porque devolvía un error
 * educado ("No tienes CV") en vez de romperse.
 *
 * Leía de la tabla `cvs` de Supabase, que tiene UNA fila, mientras los CV de
 * verdad —26, de 23 personas— están en `user_cvs` de la base propia, que es
 * donde escribe el editor. Y para colmo pedía campos que esa tabla ni tiene:
 * cv.experiencia, cv.habilidades, cv.idiomas… Sus columnas reales son
 * file_url, text_content y poco más. Así que incluso para esa única fila el
 * texto del CV salía vacío y el análisis se hacía contra la nada.
 *
 * Es el mismo fallo que tenía el autorrelleno: dos sitios donde vive el CV y
 * cada endpoint eligiendo uno. Por eso existe lib/cv/leer-cv.ts, que mira los
 * dos. Aquí se usa ese.
 *
 * Y ADEMÁS ENLAZA CON LOS CURSOS. Si lo que falta es un carnet que tenemos en
 * el catálogo, no basta con decir "te falta el de carretillero": se le da la
 * ficha, con lo que cuesta y dónde sacarlo gratis. Eso no lo puede hacer
 * ningún portal de empleo, porque hace falta conocer a la vez tu CV, la oferta
 * que estás mirando y el catálogo de formación.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getPool } from "@/lib/db";
import Groq from "groq-sdk";
import { checkUserRateLimit, RATE_LIMIT_MESSAGE } from "@/lib/rate-limit-user";
import { leerCVUsuario } from "@/lib/cv/leer-cv";
import { TIPOS_CURSO } from "@/lib/cursos/tipos";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { jobId } = await req.json();
    if (!jobId) return NextResponse.json({ error: "jobId requerido" }, { status: 400 });

    // 1. Autenticar usuario
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    if (!(await checkUserRateLimit("skill-gap", user.id, 30, 3600))) {
      return NextResponse.json({ error: RATE_LIMIT_MESSAGE }, { status: 429 });
    }

    // 2. Obtener CV del usuario — de las DOS tablas donde puede estar
    const cv = await leerCVUsuario(user.id);
    if (!cv) return NextResponse.json({ error: "No tienes CV. Créalo primero en /app/curriculum" }, { status: 400 });

    // 3. Obtener la oferta de la BD local
    const pool = getPool();
    const result = await pool.query(
      `SELECT title, company, description, salary, city FROM "JobListing" WHERE id = $1`,
      [jobId]
    );
    if (!result.rows.length) return NextResponse.json({ error: "Oferta no encontrada" }, { status: 404 });

    const oferta = result.rows[0];

    // 4. Construir el texto del CV con los campos que existen de verdad
    const cvTexto = [
      `${cv.nombre} ${cv.apellidos}`.trim(),
      cv.ciudad ? `Ciudad: ${cv.ciudad}` : "",
      cv.perfil,
      cv.aptitudes ? `Aptitudes: ${cv.aptitudes}` : "",
      cv.experiencia
        .map(e => `${e.puesto || "?"} en ${e.empresa || "?"}${e.fechas ? ` (${e.fechas})` : ""}`)
        .join("\n"),
    ].filter(Boolean).join("\n\n");

    // 5. Analizar con Groq (rápido, barato)
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });
    
    const prompt = `[ESPAÑOL OBLIGATORIO] Analiza este CV contra la oferta de trabajo. Responde SOLO en JSON válido, sin markdown:

OFERTA:
Título: ${oferta.title}
Empresa: ${oferta.company}
Descripción: ${(oferta.description || "").slice(0, 800)}
Salario: ${oferta.salary || "No especificado"}

CV DEL CANDIDATO:
${cvTexto.slice(0, 2000)}

Responde con este JSON exacto:
{
  "match": 0-100,
  "fortalezas": ["lo que encaja perfectamente", ...],
  "gaps": ["habilidad o requisito que falta", ...],
  "recomendaciones": [
    { "accion": "qué hacer", "detalle": "cómo hacerlo" }
  ],
  "mensajeMotivacion": "texto animando al candidato"
}`;

    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
        // Razona antes de contestar y ese razonamiento gasta tokens del
        // mismo presupuesto: sin esto devolvia respuestas vacias. El SDK aun
        // no lo declara en sus tipos, pero la API lo acepta.
        ...({ reasoning_effort: "low" } as Record<string, unknown>),
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 800,
    });

    const text = completion.choices[0]?.message?.content || "";
    
    // Extraer JSON de la respuesta
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json({ error: "No se pudo analizar", raw: text }, { status: 500 });

    const analysis = JSON.parse(jsonMatch[0]);

    // Cruzar lo que le falta con nuestro catálogo. "Te falta el carnet de
    // carretillero" es un diagnóstico; "te falta el carnet de carretillero,
    // cuesta esto y aquí lo sacas gratis" es una solución.
    const textoBusqueda = [
      ...(Array.isArray(analysis.gaps) ? analysis.gaps : []),
      oferta.title || "",
    ].join(" ").toLowerCase();

    const cursosQueAyudan = TIPOS_CURSO.filter(c => {
      if (c.pais !== "ES") return false;
      const señales = [c.nombre, ...c.puestos, c.normativa ?? ""]
        .map(x => x.toLowerCase())
        .filter(x => x.length > 4);
      return señales.some(x => textoBusqueda.includes(x));
    })
      .slice(0, 3)
      .map(c => ({
        slug: c.slug,
        nombre: c.nombre,
        obligatorio: c.obligatorioLegal,
        gratis: c.precio.max === 0,
        acreditablePorExperiencia: c.acreditablePorExperiencia === true,
        url: `/app/formacion/${c.slug}`,
      }));

    return NextResponse.json({
      puesto: oferta.title,
      empresa: oferta.company,
      ciudad: oferta.city,
      ...analysis,
      cursosQueAyudan,
    });
  } catch (err: any) {
    console.error("[SkillGap]", err);
    return NextResponse.json({ error: 'Error al analizar habilidades' }, { status: 500 });
  }
}
