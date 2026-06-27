/**
 * lib/guzzi/llm.ts
 * LLM helpers: Groq (fallback rápido) y DeepSeek (primario, con streaming SSE)
 */

export async function callGroq(systemPrompt: string, userContent: string, maxTokens = 600): Promise<string | null> {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) return null;

  const body = JSON.stringify({
    model: "qwen/qwen3-32b",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: "/no_think " + userContent },
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

export async function callDeepSeek(systemPrompt: string, userContent: string, maxTokens = 800): Promise<string | null> {
  const deepseekKey = process.env.DEEPSEEK_API_KEY;
  if (!deepseekKey) return null;

  const body = JSON.stringify({
    model: "deepseek-v4-pro",
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
            model: "deepseek-v4-pro",
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
