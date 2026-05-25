import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { pregunta, respuesta, sector } = await req.json() as {
      pregunta: string;
      respuesta: string;
      sector?: string;
    };

    if (!pregunta || !respuesta) {
      return NextResponse.json({ error: "pregunta y respuesta requeridos" }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "GROQ_API_KEY no configurada" }, { status: 500 });

    const prompt = `[ESPAÑOL OBLIGATORIO] Eres un coach de entrevistas experto en el sector ${sector || "general"} en España. Analiza esta respuesta de entrevista y da feedback constructivo.

PREGUNTA: "${pregunta}"

RESPUESTA DEL CANDIDATO: "${respuesta.slice(0, 1500)}"

Da feedback EN ESPAÑOL en este formato:
✅ Lo que hiciste bien: [1-2 frases]
⚠️ A mejorar: [1-2 frases con consejos concretos]
💡 Consejo: [1 frase accionable]
📊 Puntuación: [1-10]

Sé directo pero motivador. Máximo 150 palabras.`;

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[Entrevistas/feedback] Groq error:", err);
      return NextResponse.json({ error: "Error en IA" }, { status: 502 });
    }

    const data = await res.json() as { choices: Array<{ message: { content: string } }> };
    const feedback = data.choices?.[0]?.message?.content ?? "No se pudo generar feedback.";

    return NextResponse.json({ feedback });
  } catch (err) {
    console.error("[Entrevistas/feedback]", (err as Error).message);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
