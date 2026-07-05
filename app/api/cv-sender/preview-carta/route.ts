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

    // Prompt compartido para todos los proveedores IA.
    // Objetivo: que la carta suene HUMANA y auténtica, no de plantilla ni de robot.
    const prompt = `Ayudas a una persona real de España a escribir una carta de presentación que suene HUMANA y natural, no robótica ni de plantilla. Escríbela en primera persona, como la escribiría de verdad esa persona: cercana, con calidez y algo de personalidad, cuidada y sin faltas.

EMPRESA: ${companyName}
${jobTitle ? `PUESTO: ${jobTitle}` : "Candidatura espontánea"}

CV de la persona:
${cvText}

CÓMO DEBE SONAR:
- Natural y cercana, como si la escribiera una persona con ganas de verdad, no una IA. Tono de España: cálido y respetuoso, ni demasiado formal ni demasiado coloquial.
- En primera persona ("yo"), con frases sencillas y directas. Que se note que hay una persona detrás.
- Concreta: menciona la empresa por su nombre y conecta 1 o 2 cosas REALES del CV con lo que puede aportar. Nada de habilidades genéricas inventadas.
- Breve: 3 párrafos cortos — un saludo cálido, el cuerpo, y un cierre sencillo mostrando ganas de charlar.

EVITA A TODA COSTA (suena a robot / plantilla):
- "Me dirijo a ustedes", "Me complace", "Considero que mi perfil", "adjunto mi CV", "en la era actual", "sinergias", "proactivo con capacidad de adaptación", "aportar valor a su equipo".
- Clichés vacíos de recursos humanos. Si una frase no dice nada real, quítala.

Responde SOLO con:
CARTA:
[texto de la carta]

ASUNTO:
[asunto del email, natural, máx 80 caracteres]`;

    // Template de fallback (último recurso si todas las APIs fallan)
    const cartaTemplate = `Hola equipo de ${companyName}:

Os escribo porque me haría mucha ilusión formar parte de vuestro equipo${jobTitle ? ` como ${jobTitle}` : ""}. Me gusta lo que hacéis y creo que puedo encajar y echar una mano de verdad.

Vengo con ganas de trabajar, de aprender rápido y de arrimar el hombro en lo que haga falta. Soy de las personas que se implican y no dejan las cosas a medias.

Si os parece, me encantaría que habláramos y contaros un poco más en persona. Gracias por leerme.

Un saludo${formData.nombre ? `,\n${formData.nombre}` : ""}`;

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
