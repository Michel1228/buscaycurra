/**
 * lib/guzzi/llm.ts
 * LLM helpers: Groq (gratis, el de cabecera) y OpenAI (respaldo).
 *
 * El 6 ago 2026 se comprobó que DeepSeek devolvía 402 (saldo agotado) y Groq
 * 401 (clave caducada) a la vez: con solo dos proveedores, Guzzi se quedaba sin
 * IA y respondía con textos enlatados. OpenAI se añade como tercera red porque
 * su clave ya está en el proyecto y funcionando (la usa la búsqueda por foto).
 *
 * DeepSeek se retiró del todo el 23 oct 2026 (decisión de Michel): que ningún
 * dato de los usuarios salga a China. Llevaba sin saldo desde el 22 sep, así que
 * en la práctica ya respondían Groq y OpenAI.
 */

export async function callGroq(systemPrompt: string, userContent: string, maxTokens = 600): Promise<string | null> {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) return null;

  // Antes se usaba qwen/qwen3-32b, que Groq ha retirado: devolvia
  // "model_not_found" aunque la clave fuese valida. Su sucesor (qwen3.6-27b)
  // tampoco sirve aqui: razona en ingles dentro de <think> y se come todos los
  // tokens sin llegar a responder, que es justo lo que intentaba evitar el
  // prefijo "/no_think". Medido el 6 ago 2026 con la misma pregunta en espanol,
  // Groq retiro llama-3.3-70b el 16 ago 2026: la API devolvia
  // "model_not_found". gpt-oss-120b es el sustituto de su plan gratuito.
  const body = JSON.stringify({
    model: "openai/gpt-oss-120b",
        // Razona antes de contestar y ese razonamiento gasta tokens del
        // mismo presupuesto: sin esto devolvia respuestas vacias.
        reasoning_effort: "low",
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
      // gpt-oss escribe guiones "no separables" (U+2011) en fechas, teléfonos y
      // correos: se ven igual, pero al copiarlos ya no son un guion y un correo
      // así no se puede usar (auditoría del 3 oct 2026).
      return raw ? raw.replace(/<think>[\s\S]*?<\/think>/gi, "").replace(/[\u2010\u2011]/g, "-").trim() : null;
    } catch {
      if (attempt === 0) { await new Promise(r => setTimeout(r, 800)); continue; }
      return null;
    }
  }
  return null;
}

/**
 * Último recurso cuando Groq falla. Usa gpt-4o-mini, el modelo
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
