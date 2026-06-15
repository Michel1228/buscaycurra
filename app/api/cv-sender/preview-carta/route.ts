/**
 * /api/cv-sender/preview-carta — Previsualizar carta de presentación antes de enviar
 * POST { companyName, companyEmail?, jobTitle? }
 */
import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { getUserId } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId(req);

    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { companyName, companyEmail, jobTitle, cvId } = await req.json() as {
      companyName?: string;
      companyEmail?: string;
      jobTitle?: string;
      cvId?: string;
    };

    if (!companyName) {
      return NextResponse.json({ error: "companyName requerido" }, { status: 400 });
    }

    // Obtener CV del usuario (por ID específico o el más reciente)
    const pool = getPool();
    let cvResult;
    if (cvId) {
      cvResult = await pool.query(
        `SELECT form_data FROM user_cvs WHERE id = $1 AND user_id = $2`,
        [cvId, userId]
      );
    } else {
      cvResult = await pool.query(
        `SELECT form_data FROM user_cvs WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 1`,
        [userId]
      );
    }

    if (cvResult.rows.length === 0) {
      return NextResponse.json({ error: "No tienes CV creado. Créalo primero en Guzzi." }, { status: 404 });
    }

    const formData = cvResult.rows[0].form_data as Record<string, unknown> || {};

    // Construir texto del CV desde form_data
    const cvParts: string[] = [];
    if (formData.nombre) cvParts.push(`Nombre: ${formData.nombre}`);
    if (formData.email) cvParts.push(`Email: ${formData.email}`);
    if (formData.telefono) cvParts.push(`Teléfono: ${formData.telefono}`);
    if (formData.perfil) cvParts.push(`Perfil: ${formData.perfil}`);
    if (formData.experiencia) {
      const exp = Array.isArray(formData.experiencia) ? formData.experiencia : [formData.experiencia];
      cvParts.push("Experiencia:");
      exp.forEach((e: unknown) => {
        const entry = e as Record<string, unknown>;
        if (entry.empresa) cvParts.push(`- ${entry.empresa}: ${entry.puesto || ""} (${entry.periodo || ""})`);
      });
    }
    if (formData.educacion) {
      const edu = Array.isArray(formData.educacion) ? formData.educacion : [formData.educacion];
      cvParts.push("Formación:");
      edu.forEach((e: unknown) => {
        const entry = e as Record<string, unknown>;
        if (entry.titulo) cvParts.push(`- ${entry.titulo} — ${entry.centro || ""}`);
      });
    }
    if (formData.habilidades) {
      const hab = Array.isArray(formData.habilidades) 
        ? formData.habilidades.join(", ") 
        : String(formData.habilidades);
      cvParts.push(`Habilidades: ${hab}`);
    }

    const cvText = cvParts.join("\n");

    // Prompt compartido para todos los proveedores IA
    const prompt = `Eres un experto en RRHH. Genera una carta de presentación profesional en español basada en este CV y empresa.

EMPRESA: ${companyName}
${jobTitle ? `PUESTO: ${jobTitle}` : "Candidatura espontánea"}

CV:
${cvText}

INSTRUCCIONES:
- 3 párrafos máximo
- Primer párrafo: menciona la empresa específicamente
- Segundo párrafo: destaca 2-3 skills del CV relevantes
- Tercer párrafo: cierre profesional con llamada a la acción
- Tono profesional pero cercano (España)
- NO uses frases genéricas tipo "como verá en mi CV adjunto"

Responde solo con:
CARTA:
[texto de la carta]

ASUNTO:
[asunto email, max 80 chars]`;

    // Template de fallback (último recurso si todas las APIs fallan)
    const cartaTemplate = `Estimado equipo de ${companyName},

Me dirijo a ustedes para presentar mi candidatura${jobTitle ? ` al puesto de ${jobTitle}` : ""}. Tras conocer su empresa, considero que mi perfil puede aportar valor a su equipo.

A lo largo de mi trayectoria profesional he desarrollado competencias que se alinean con lo que buscan. Soy una persona proactiva, con capacidad de adaptación y compromiso con los resultados.

Quedo a su disposición para concertar una entrevista y ampliar la información que consideren necesaria.

Un cordial saludo.`;

    const defaultSubject = jobTitle
      ? `Candidatura para ${jobTitle} — ${companyName}`
      : `Candidatura — ${companyName}`;

    // Función para parsear respuesta IA
    const parseAIResponse = (raw: string) => {
      const cleaned = raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
      const cartaMatch = cleaned.match(/CARTA:\s*([\s\S]*?)(?=ASUNTO:|$)/i);
      const asuntoMatch = cleaned.match(/ASUNTO:\s*(.*?)$/im);
      return {
        carta: cartaMatch?.[1]?.trim() || cleaned,
        subject: asuntoMatch?.[1]?.trim() || defaultSubject,
      };
    };

    // === INTENTO 1: DeepSeek (primario, key verificada 15 Jun 2026) ===
    const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
    if (DEEPSEEK_API_KEY) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);

        const res = await fetch("https://api.deepseek.com/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${DEEPSEEK_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "deepseek-chat",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
            max_tokens: 1200,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (res.ok) {
          const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
          const raw = data.choices?.[0]?.message?.content || "";
          const parsed = parseAIResponse(raw);
          return NextResponse.json({ ...parsed, generatedBy: "deepseek" });
        }
        console.warn("[preview-carta] DeepSeek falló, intentando Groq...");
      } catch (e) {
        console.warn("[preview-carta] DeepSeek error:", (e as Error).message);
      }
    }

    // === INTENTO 2: Groq (secundario) ===
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    if (GROQ_API_KEY) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);

        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${GROQ_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "qwen/qwen3-32b",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
            max_tokens: 1200,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (res.ok) {
          const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
          const raw = data.choices?.[0]?.message?.content || "";
          const parsed = parseAIResponse(raw);
          return NextResponse.json({ ...parsed, generatedBy: "groq" });
        }
        console.warn("[preview-carta] Groq falló, usando template...");
      } catch (e) {
        console.warn("[preview-carta] Groq error:", (e as Error).message);
      }
    }

    // === INTENTO 3: Template genérica (siempre disponible) ===
    console.warn("[preview-carta] Sin APIs disponibles, usando template genérica");
    return NextResponse.json({
      carta: cartaTemplate,
      subject: defaultSubject,
      generatedBy: "template",
    });
  } catch (err) {
    console.error("[preview-carta] Error:", (err as Error).message);
    return NextResponse.json({ error: "Error generando carta" }, { status: 500 });
  }
}
