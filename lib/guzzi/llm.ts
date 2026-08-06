/**
 * lib/guzzi/llm.ts
 * LLM helpers: DeepSeek (primario, con streaming SSE), Groq (respaldo rápido)
 * y OpenAI (último recurso).
 *
 * El 6 ago 2026 se comprobó que DeepSeek devolvía 402 (saldo agotado) y Groq
 * 401 (clave caducada) a la vez: con solo dos proveedores, Guzzi se quedaba sin
 * IA y respondía con textos enlatados. OpenAI se añade como tercera red porque
 * su clave ya está en el proyecto y funcionando (la usa la búsqueda por foto).
 */

export async function callGroq(systemPrompt: string, userContent: string, maxTokens = 600): Promise<string | null> {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) return null;

  // Antes se usaba qwen/qwen3-32b, que Groq ha retirado: devolvia
  // "model_not_found" aunque la clave fuese valida. Su sucesor (qwen3.6-27b)
  // tampoco sirve aqui: razona en ingles dentro de <think> y se come todos los
  // tokens sin llegar a responder, que es justo lo que intentaba evitar el
  // prefijo "/no_think". Medido el 6 ago 2026 con la misma pregunta en espanol,
  // llama-3.3-70b responde bien y en 635 ms.
  const body = JSON.stringify({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ],
    temperature: 0.6,
    max_tokens: maxTokens,
  });

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${groqKey}`, "Content-Type": "application/json" },
        body,
        signal: AbortSignal.timeout(20000),
      });
      if (!res.ok) {
        if (attempt === 0) { await new Promise(r => setTimeout(r, 800)); continue; }
        return null;
      }
      const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
      const raw = data.choices?.[0]?.message?.content || null;
      return raw ? raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim() : null;
    } catch {
      if (attempt === 0) { await new Promise(r => setTimeout(r, 800)); continue; }
      return null;
    }
  }
  return null;
}

/**
 * DeepSeek. Se usa V4-Flash y no V4-Pro a proposito: medido el 6 ago 2026 con
 * la misma pregunta, Pro gastaba 227 tokens de salida para dar 64 de respuesta
 * (el 72% se le iba en razonar para si mismo) frente a 100 y 65 de Flash. Es
 * 3,5 veces mas caro y en la prueba respondio igual de bien o peor: Pro llego a
 * inventarse nombres de calles de Tudela.
 */
export async function callDeepSeek(systemPrompt: string, userContent: string, maxTokens = 800): Promise<string | null> {
  const deepseekKey = process.env.DEEPSEEK_API_KEY;
  if (!deepseekKey) return null;

  const body = JSON.stringify({
    model: "deepseek-v4-flash",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ],
    temperature: 0.5,
    max_tokens: maxTokens,
  });

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${deepseekKey}`, "Content-Type": "application/json" },
        body,
        signal: AbortSignal.timeout(35000),
      });
      if (!res.ok) {
        if (attempt === 0) { await new Promise(r => setTimeout(r, 800)); continue; }
        return null;
      }
      const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
      return data.choices?.[0]?.message?.content?.trim() || null;
    } catch {
      if (attempt === 0) { await new Promise(r => setTimeout(r, 800)); continue; }
      return null;
    }
  }
  return null;
}

/**
 * Último recurso cuando DeepSeek y Groq fallan. Usa gpt-4o-mini, el modelo
 * barato: es una red de seguridad, no el proveedor habitual.
 */
export async function callOpenAI(systemPrompt: string, userContent: string, maxTokens = 800): Promise<string | null> {
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) return null;

  const body = JSON.stringify({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ],
    temperature: 0.5,
    max_tokens: maxTokens,
  });

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${openaiKey}`, "Content-Type": "application/json" },
        body,
        signal: AbortSignal.timeout(30000),
      });
      if (!res.ok) {
        console.error("[Guzzi] OpenAI HTTP", res.status);
        if (attempt === 0) { await new Promise(r => setTimeout(r, 800)); continue; }
        return null;
      }
      const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
      return data.choices?.[0]?.message?.content?.trim() || null;
    } catch {
      if (attempt === 0) { await new Promise(r => setTimeout(r, 800)); continue; }
      return null;
    }
  }
  return null;
}

/**
 * Streaming SSE con DeepSeek.
 * Devuelve un ReadableStream que emite chunks de texto.
 */
export function streamDeepSeek(systemPrompt: string, userContent: string, maxTokens = 800): ReadableStream | null {
  const deepseekKey = process.env.DEEPSEEK_API_KEY;
  if (!deepseekKey) return null;

  const encoder = new TextEncoder();
  let aborted = false;

  return new ReadableStream({
    async start(controller) {
      try {
        const res = await fetch("https://api.deepseek.com/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${deepseekKey}`,
            "Content-Type": "application/json",
            "Accept": "text/event-stream",
          },
          body: JSON.stringify({
            model: "deepseek-v4-flash",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userContent },
            ],
            temperature: 0.5,
            max_tokens: maxTokens,
            stream: true,
          }),
          signal: AbortSignal.timeout(35000),
        });

        if (!res.ok || !res.body) {
          controller.close();
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (!aborted) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6).trim();
              if (data === "[DONE]") {
                controller.close();
                return;
              }
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  controller.enqueue(encoder.encode(content));
                }
              } catch { /* skip invalid JSON chunks */ }
            }
          }
        }
        controller.close();
      } catch {
        if (!aborted) controller.close();
      }
    },
    cancel() {
      aborted = true;
    },
  });
}
