/**
 * POST /api/entrevistas/feedback
 * Analiza la respuesta del usuario a una pregunta de entrevista
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Groq from "groq-sdk";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // Auth
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { pregunta, respuesta, sector } = await req.json();
    if (!pregunta || !respuesta) {
      return NextResponse.json({ error: "pregunta y respuesta requeridos" }, { status: 400 });
    }

    // Analizar con Groq
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

    const prompt = `[ESPAÑOL OBLIGATORIO] Eres un coach de entrevistas experto en el sector ${sector || "general"} en España. Analiza esta respuesta de entrevista y da feedback constructivo.

PREGUNTA: "${pregunta}"

RESPUESTA DEL CANDIDATO: "${respuesta.slice(0, 1500)}"

Da feedback EN ESPAÑOL en este formato:
✅ Lo que hiciste bien: [1-2 frases]
⚠️ A mejorar: [1-2 frases con consejos concretos]
💡 Consejo: [1 frase accionable]
📊 Puntuación: [1-10]

Sé directo pero motivador. Máximo 150 palabras.`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 300,
    });

    const feedback = completion.choices[0]?.message?.content || "No se pudo generar feedback.";

    return NextResponse.json({ feedback });
  } catch (err: any) {
    console.error("[Entrevistas]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
