/**
 * /api/translate — Traduce texto entre idiomas usando Groq
 * 
 * POST { text, from?, to }
 * from: idioma origen (default: auto)
 * to: idioma destino (default: "es")
 */
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Cache en memoria para no repetir traducciones
const cache = new Map<string, string>();
const MAX_CACHE = 500;

function cacheKey(text: string, from: string, to: string): string {
  return `${from}:${to}:${text.slice(0, 200)}`;
}

export async function POST(req: NextRequest) {
  try {
    const { text, from = "auto", to = "es" } = await req.json() as {
      text: string;
      from?: string;
      to?: string;
    };

    if (!text || text.trim().length < 10) {
      return NextResponse.json({ error: "Texto muy corto para traducir" }, { status: 400 });
    }

    const key = cacheKey(text, from, to);
    if (cache.has(key)) {
      return NextResponse.json({ translated: cache.get(key) });
    }

    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
      return NextResponse.json({ error: "API key no configurada" }, { status: 500 });
    }

    const prompt = from === "auto"
      ? `Translate the following text to ${to === "es" ? "Spanish (Spain)" : to}. Return ONLY the translated text, no explanations:\n\n${text.slice(0, 3000)}`
      : `Translate the following text from ${from} to ${to === "es" ? "Spanish (Spain)" : to}. Return ONLY the translated text, no explanations:\n\n${text.slice(0, 3000)}`;

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${groqKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "qwen/qwen3-32b",
        messages: [
          { role: "system", content: "You are a professional translator. Return ONLY the translated text, no explanations, no quotes around it." },
          { role: "user", content: "/no_think " + prompt },
        ],
        temperature: 0.3,
        max_tokens: 1500,
      }),
    });

    if (!res.ok) {
      console.error("Groq translate error:", res.status);
      return NextResponse.json({ error: "Error del servicio de traducción" }, { status: 502 });
    }

    const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
    let translated = data.choices?.[0]?.message?.content || "";

    // Limpiar posibles artifacts
    translated = translated
      .replace(/<think>[\s\S]*?<\/think>/gi, "")
      .replace(/^["']|["']$/g, "")
      .trim();

    // Cachear
    if (cache.size >= MAX_CACHE) {
      const firstKey = cache.keys().next().value;
      if (firstKey) cache.delete(firstKey);
    }
    cache.set(key, translated);

    return NextResponse.json({ translated });
  } catch (err) {
    console.error("Translate error:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
