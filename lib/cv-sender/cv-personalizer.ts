/**
 * cv-personalizer.ts — Personalización del CV y carta de presentación
 * Usa Groq API (mismo proveedor que Guzzi) para generar cartas personalizadas.
 */

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "qwen/qwen3-32b";

// ─── Tipos ───────────────────────────────────────────────────────────────────

/** Información sobre la empresa destino */
export interface CompanyInfo {
  name: string; // Nombre de la empresa
  url?: string; // URL del sitio web
  sector?: string; // Sector de actividad (tecnología, salud, etc.)
  size?: "pequena" | "mediana" | "grande"; // Tamaño aproximado
  description?: string; // Descripción breve de la empresa
}

/** Resultado de la personalización */
export interface PersonalizationResult {
  coverLetter: string; // Carta de presentación personalizada
  subjectLine: string; // Asunto del email
  cvHighlights?: string[]; // Skills del CV más relevantes para esta empresa
}

// ─── Llamada a Groq API ───────────────────────────────────────────────────────

async function askGroq(prompt: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY no configurada");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);

  try {
    const res = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 1200,
      }),
      signal: controller.signal,
    });

    if (!res.ok) throw new Error(`Groq error ${res.status}`);
    const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
    const raw = data.choices?.[0]?.message?.content ?? "";
    return raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  } finally {
    clearTimeout(timeout);
  }
}

// ─── Funciones Principales ───────────────────────────────────────────────────

/**
 * Personaliza el CV y genera una carta de presentación para una empresa concreta.
 *
 * El proceso:
 *   1. Envía el CV y la info de la empresa a OpenClaw
 *   2. OpenClaw analiza el sector, tamaño y cultura de la empresa
 *   3. Genera una carta personalizada destacando las skills más relevantes
 *   4. Devuelve la carta + el asunto del email
 *
 * @param cvText - Texto del CV del usuario (extraído del PDF)
 * @param companyInfo - Información sobre la empresa
 * @param jobTitle - Puesto al que aplica (opcional)
 * @returns Carta de presentación personalizada y asunto del email
 */
export async function personalizeForCompany(
  cvText: string,
  companyInfo: CompanyInfo,
  jobTitle?: string
): Promise<PersonalizationResult> {
  console.log(`[Personalizador] Personalizando CV para ${companyInfo.name}...`);

  // Construimos el prompt. Objetivo: carta HUMANA y auténtica, no de plantilla.
  const prompt = `
Ayudas a una persona real de España a escribir una carta de presentación que suene HUMANA y natural, no robótica ni de plantilla. Escríbela en primera persona, como la escribiría de verdad esa persona: cercana, con calidez y algo de personalidad, cuidada y sin faltas.

EMPRESA:
- Nombre: ${companyInfo.name}
- Sector: ${companyInfo.sector ?? "No especificado"}
- Tamaño: ${companyInfo.size ?? "No especificado"}
- Descripción: ${companyInfo.description ?? "No disponible"}
${jobTitle ? `- Puesto solicitado: ${jobTitle}` : "- Candidatura espontánea"}

CV DE LA PERSONA:
${cvText}

CÓMO DEBE SONAR:
- Natural y cercana, como si la escribiera una persona con ganas de verdad, no una IA. Tono de España: cálido y respetuoso, ni demasiado formal ni demasiado coloquial.
- En primera persona ("yo"), frases sencillas y directas. Que se note que hay una persona detrás.
- Concreta: menciona la empresa por su nombre y conecta 1 o 2 cosas REALES del CV con lo que puede aportar. Nada de habilidades genéricas inventadas.
- Breve: 3 párrafos cortos — saludo cálido, cuerpo, y un cierre sencillo con ganas de charlar.

EVITA A TODA COSTA (suena a robot / plantilla): "Me dirijo a ustedes", "Me complace", "Considero que mi perfil", "adjunto mi CV", "en la era actual", "sinergias", "proactivo con capacidad de adaptación", "aportar valor a su equipo". Si una frase no dice nada real, quítala.

Responde SOLO con:
CARTA:
[la carta de presentación]

ASUNTO:
[línea de asunto para el email, máximo 80 caracteres]

SKILLS_DESTACADAS:
[lista de 3-5 skills del CV más relevantes, separadas por coma]
`.trim();

  try {
    const respuesta = await askGroq(prompt);
    return parseOpenClawResponse(respuesta, companyInfo, jobTitle);
  } catch (error) {
    console.warn(`[Personalizador] Groq no disponible, usando carta genérica:`, (error as Error).message);
    return generateGenericLetter(companyInfo, jobTitle);
  }
}

/**
 * Genera solo el asunto del email personalizado.
 * Más ligero que la personalización completa.
 *
 * @param userName - Nombre completo del usuario
 * @param jobTitle - Puesto al que aplica (opcional)
 * @param company - Nombre de la empresa
 * @returns Asunto del email
 */
export async function generateSubjectLine(
  userName: string,
  jobTitle: string | undefined,
  company: string
): Promise<string> {
  if (jobTitle) {
    return `Candidatura para ${jobTitle} — ${userName}`;
  }
  return `Candidatura espontánea — ${userName} | ${company}`;
}

// ─── Funciones Auxiliares ─────────────────────────────────────────────────────

/**
 * Parsea la respuesta estructurada de OpenClaw.
 * OpenClaw devuelve la carta, el asunto y las skills en formato texto.
 */
function parseOpenClawResponse(
  response: string,
  companyInfo: CompanyInfo,
  jobTitle?: string
): PersonalizationResult {
  // Extraemos las secciones usando expresiones regulares
  const cartaMatch = response.match(/CARTA:\s*([\s\S]*?)(?=ASUNTO:|$)/i);
  const asuntoMatch = response.match(/ASUNTO:\s*(.*?)(?=SKILLS_DESTACADAS:|$)/i);
  const skillsMatch = response.match(/SKILLS_DESTACADAS:\s*(.*?)$/im);

  const coverLetter = cartaMatch?.[1]?.trim() ?? generateGenericLetter(companyInfo, jobTitle).coverLetter;
  const subjectLine =
    asuntoMatch?.[1]?.trim() ??
    `Candidatura ${jobTitle ? `para ${jobTitle}` : "espontánea"} — ${companyInfo.name}`;
  const cvHighlights = skillsMatch?.[1]
    ?.split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return { coverLetter, subjectLine, cvHighlights };
}

/**
 * Genera una carta de presentación genérica cuando OpenClaw no está disponible.
 * Es una carta profesional pero no personalizada para la empresa específica.
 */
function generateGenericLetter(
  companyInfo: CompanyInfo,
  jobTitle?: string
): PersonalizationResult {
  const coverLetter = `
Hola equipo de ${companyInfo.name}:

Os escribo porque me haría mucha ilusión formar parte de vuestro equipo${jobTitle ? ` como ${jobTitle}` : ""}. Me gusta lo que hacéis${companyInfo.sector ? ` en el sector de ${companyInfo.sector}` : ""} y creo que puedo encajar y echar una mano de verdad.

Vengo con ganas de trabajar, de aprender rápido y de arrimar el hombro en lo que haga falta. Soy de las personas que se implican y no dejan las cosas a medias.

Si os parece, me encantaría que habláramos y contaros un poco más en persona. Muchas gracias por leerme.

Un saludo,
`.trim();

  const subjectLine = jobTitle
    ? `Candidatura para ${jobTitle} — ${companyInfo.name}`
    : `Candidatura espontánea — ${companyInfo.name}`;

  return { coverLetter, subjectLine };
}
