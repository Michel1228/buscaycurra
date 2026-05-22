/**
 * /api/cv-sender/preview-carta — Previsualizar carta de presentación antes de enviar
 * POST { userId, companyName, companyEmail?, jobTitle? }
 */
import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { userId, companyName, companyEmail, jobTitle } = await req.json() as {
      userId?: string;
      companyName?: string;
      companyEmail?: string;
      jobTitle?: string;
    };

    if (!userId || !companyName) {
      return NextResponse.json({ error: "userId y companyName requeridos" }, { status: 400 });
    }

    // Obtener CV del usuario
    const pool = getPool();
    const cvResult = await pool.query(
      `SELECT form_data FROM user_cvs WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 1`,
      [userId]
    );

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

    // Generar carta con Groq
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_API_KEY) {
      // Carta genérica si no hay API key
      const cartaGenerica = `Estimado equipo de ${companyName},\n\nMe dirijo a ustedes para presentar mi candidatura${jobTitle ? ` al puesto de ${jobTitle}` : ""}. Tras conocer su empresa, considero que mi perfil puede aportar valor a su equipo.\n\nA lo largo de mi trayectoria profesional he desarrollado competencias que se alinean con lo que buscan. Soy una persona proactiva, con capacidad de adaptación y compromiso con los resultados.\n\nQuedo a su disposición para concertar una entrevista y ampliar la información que consideren necesaria.\n\nUn cordial saludo.`;
      
      return NextResponse.json({
        carta: cartaGenerica,
        subject: jobTitle ? `Candidatura para ${jobTitle} — ${companyName}` : `Candidatura — ${companyName}`,
        generatedBy: "template",
      });
    }

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

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    try {
      const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
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

      if (!groqRes.ok) {
        throw new Error(`Groq error ${groqRes.status}`);
      }

      const data = await groqRes.json() as { choices?: Array<{ message?: { content?: string } }> };
      const raw = (data.choices?.[0]?.message?.content || "").replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

      const cartaMatch = raw.match(/CARTA:\s*([\s\S]*?)(?=ASUNTO:|$)/i);
      const asuntoMatch = raw.match(/ASUNTO:\s*(.*?)$/im);

      const carta = cartaMatch?.[1]?.trim() || raw;
      const subject = asuntoMatch?.[1]?.trim() || 
        (jobTitle ? `Candidatura para ${jobTitle} — ${companyName}` : `Candidatura — ${companyName}`);

      return NextResponse.json({ carta, subject, generatedBy: "ia" });
    } finally {
      clearTimeout(timeout);
    }
  } catch (err) {
    console.error("[preview-carta] Error:", (err as Error).message);
    return NextResponse.json({ error: "Error generando carta" }, { status: 500 });
  }
}
