/**
 * POST /api/gusi/skill-gap
 * Compara el CV del usuario con una oferta y detecta lo que falta
 * Usa Groq para análisis IA de gaps
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getPool } from "@/lib/db";
import Groq from "groq-sdk";

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

    // 2. Obtener CV del usuario
    const { data: cv } = await supabase
      .from("cvs")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!cv) return NextResponse.json({ error: "No tienes CV. Créalo primero en /app/curriculum" }, { status: 400 });

    // 3. Obtener la oferta de la BD local
    const pool = getPool();
    const result = await pool.query(
      `SELECT title, company, description, salary, city FROM "JobListing" WHERE id = $1`,
      [jobId]
    );
    if (!result.rows.length) return NextResponse.json({ error: "Oferta no encontrada" }, { status: 404 });

    const oferta = result.rows[0];

    // 4. Construir el texto del CV
    const cvTexto = [
      cv.nombre_completo || "",
      cv.titulo || "",
      cv.experiencia || "",
      cv.educacion || "",
      cv.habilidades || "",
      cv.idiomas || "",
    ].filter(Boolean).join("\n\n");

    // 5. Analizar con Groq (rápido, barato)
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });
    
    const prompt = `[ESPAÑOL OBLIGATORIO] Analiza este CV contra la oferta de trabajo. Responde SOLO en JSON válido, sin markdown:

OFERTA:
Título: ${oferta.title}
Empresa: ${oferta.company}
Descripción: ${(oferta.description || "").slice(0, 800)}
Salario: ${oferta.salario || "No especificado"}

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
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 800,
    });

    const text = completion.choices[0]?.message?.content || "";
    
    // Extraer JSON de la respuesta
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json({ error: "No se pudo analizar", raw: text }, { status: 500 });

    const analysis = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      puesto: oferta.title,
      empresa: oferta.company,
      ciudad: oferta.city,
      ...analysis,
    });
  } catch (err: any) {
    console.error("[SkillGap]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
