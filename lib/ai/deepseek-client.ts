/**
 * Cliente para DeepSeek API
 *
 * DeepSeek es la mejor IA para entender español coloquial.
 * Es perfecta para:
 * - Chat del agente Guzzi (entiende frases como "quiero echar currículum en bares")
 * - NLP y detección de intents
 * - Respuestas conversacionales naturales
 *
 * API OpenAI-compatible: https://api.deepseek.com/chat/completions
 * Modelo: deepseek-chat (DeepSeek-V3)
 *
 * Incluye:
 * - Caché automático (Redis)
 * - Rate limiting (contador diario)
 */

import { obtenerConCacheIA, TipoPeticionIA } from "../cache/ai-cache";
import { get, incrementar } from "../cache/redis-client";

// ==========================================
// CONFIGURACIÓN
// ==========================================

const MODELO_DEEPSEEK = "deepseek-chat";
const TEMPERATURA_DEFAULT = 0.7;
const LIMITE_DIARIO_DEEPSEEK = 10000; // DeepSeek es más generoso que Groq

// ==========================================
// GESTIÓN DE RATE LIMITING
// ==========================================

async function podemosUsarDeepSeek(): Promise<boolean> {
  const fecha = new Date().toISOString().split("T")[0];
  const clave = `deepseek:calls:${fecha}`;
  const total = await incrementar(clave, 86400);
  if (total > LIMITE_DIARIO_DEEPSEEK) {
    console.warn(`⚠️  DeepSeek: límite diario alcanzado (${total}/${LIMITE_DIARIO_DEEPSEEK})`);
    return false;
  }
  console.log(`📊 DeepSeek llamadas hoy: ${total}/${LIMITE_DIARIO_DEEPSEEK}`);
  return true;
}

// ==========================================
// FUNCIÓN PRINCIPAL
// ==========================================

export async function llamarDeepSeek(
  prompt: string,
  tipo: TipoPeticionIA = "generico",
  opciones: {
    temperatura?: number;
    maxTokens?: number;
    sistemaPrompt?: string;
  } = {}
): Promise<string> {
  return await obtenerConCacheIA(prompt, tipo, async () => {
    const disponible = await podemosUsarDeepSeek();
    if (!disponible) {
      throw new Error("DEEPSEEK_LIMIT_REACHED");
    }

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      throw new Error("DEEPSEEK_NOT_CONFIGURED");
    }

    const mensajes: { role: "system" | "user"; content: string }[] = [];

    if (opciones.sistemaPrompt) {
      mensajes.push({ role: "system", content: opciones.sistemaPrompt });
    }

    mensajes.push({ role: "user", content: prompt });

    console.log(`🤖 Llamando a DeepSeek (${MODELO_DEEPSEEK})...`);

    const res = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODELO_DEEPSEEK,
        messages: mensajes,
        temperature: opciones.temperatura ?? TEMPERATURA_DEFAULT,
        max_tokens: opciones.maxTokens ?? 2048,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`❌ DeepSeek error ${res.status}: ${errorText}`);
      throw new Error(`DEEPSEEK_ERROR: ${res.status}`);
    }

    const data = await res.json() as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const contenido = data.choices?.[0]?.message?.content || "";
    console.log(`✅ DeepSeek respondió (${contenido.length} caracteres)`);

    return contenido;
  });
}

// ==========================================
// FUNCIONES ESPECIALIZADAS
// ==========================================

/**
 * Chat conversacional — la función principal para Guzzi
 */
export async function chatDeepSeek(
  prompt: string,
  historial?: { role: "user" | "assistant"; content: string }[]
): Promise<string> {
  // Para chat NO usamos caché (cada conversación es única)
  const disponible = await podemosUsarDeepSeek();
  if (!disponible) {
    throw new Error("DEEPSEEK_LIMIT_REACHED");
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error("DEEPSEEK_NOT_CONFIGURED");
  }

  const mensajes: { role: string; content: string }[] = [
    {
      role: "system",
      content: `Eres Guzzi 🐛, el asistente de BuscayCurra (app española de búsqueda de empleo).
Hablas en español coloquial de España, con tono cercano, simpático y útil.
Eres una oruga verde, mascota de la plataforma.

Tus capacidades:
- Buscar ofertas de empleo por puesto y ubicación
- Buscar empresas en Google Maps (email, teléfono, web)
- Enviar CVs a ofertas y empresas
- Analizar y mejorar CVs
- Generar cartas de presentación

Reglas:
- NO inventes ofertas de trabajo que no existen
- Si no encuentras algo, dilo honestamente y sugiere alternativas
- Sé conciso — máximo 2-3 párrafos por respuesta
- Usa emojis con moderación`,
    },
  ];

  if (historial) {
    mensajes.push(...historial);
  }

  mensajes.push({ role: "user", content: prompt });

  console.log(`💬 Chat DeepSeek...`);

  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODELO_DEEPSEEK,
      messages: mensajes,
      temperature: 0.8,
      max_tokens: 1500,
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`❌ DeepSeek chat error ${res.status}: ${errorText}`);
    throw new Error(`DEEPSEEK_ERROR: ${res.status}`);
  }

  const data = await res.json() as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  return data.choices?.[0]?.message?.content || "";
}

export { LIMITE_DIARIO_DEEPSEEK, MODELO_DEEPSEEK };
