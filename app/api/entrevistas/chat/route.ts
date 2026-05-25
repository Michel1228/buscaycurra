import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type Mensaje = { rol: "user" | "assistant"; texto: string };

export async function POST(req: NextRequest) {
  try {
    const { puesto, mensajes, inicio } = await req.json() as {
      puesto: string;
      mensajes: Mensaje[];
      inicio?: boolean;
    };

    if (!puesto) {
      return NextResponse.json({ error: "puesto requerido" }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GROQ_API_KEY no configurada" }, { status: 500 });
    }

    const systemPrompt = `Eres un entrevistador de recursos humanos profesional en España.
Estás haciendo una entrevista de trabajo para el puesto de: ${puesto}.
Tu misión:
- Hacer preguntas realistas de entrevista, una a la vez
- Evaluar brevemente cada respuesta del candidato (2-3 frases)
- Dar feedback constructivo y hacer la siguiente pregunta
- Mantener un tono profesional pero cercano
- Usar español de España
- Cubrir: motivación, experiencia, habilidades técnicas, trabajo en equipo, situaciones difíciles
- Después de 6-8 intercambios, hacer un cierre con evaluación general

${inicio ? "Empieza con una bienvenida breve y la primera pregunta de presentación." : ""}
Responde siempre en 3-5 frases máximo. Sé directo.`;

    const historial = mensajes.map((m) => ({
      role: m.rol === "user" ? "user" : "assistant",
      content: m.texto,
    }));

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: systemPrompt },
          ...historial,
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[Entrevistas] Groq error:", err);
      return NextResponse.json({ error: "Error en IA" }, { status: 502 });
    }

    const data = await res.json() as {
      choices: Array<{ message: { content: string } }>;
    };

    const respuesta = data.choices?.[0]?.message?.content ?? "No obtuve respuesta.";
    return NextResponse.json({ respuesta });
  } catch (e) {
    console.error("[Entrevistas] Error:", (e as Error).message);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
