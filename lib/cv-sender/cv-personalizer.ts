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
        max_tokens: 800,
      }),
      signal: controller.signal,
    });

    if (!res.ok) throw new Error(`Groq error ${res.status}`);
    const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
    return data.choices?.[0]?.message?.content ?? "";
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

  // Construimos el prompt para OpenClaw
  const prompt = `
Eres un experto en recursos humanos y redacción de cartas de presentación en España.

Analiza el siguiente CV y genera una carta de presentación personalizada para la empresa indicada.

EMPRESA:
- Nombre: ${companyInfo.name}
- Sector: ${companyInfo.sector ?? "No especificado"}
- Tamaño: ${companyInfo.size ?? "No especificado"}
- Descripción: ${companyInfo.description ?? "No disponible"}
${jobTitle ? `- Puesto solicitado: ${jobTitle}` : "- Candidatura espontánea"}

CV DEL CANDIDATO:
${cvText}

INSTRUCCIONES:
1. Escribe una carta de presentación profesional en español (máximo 3 párrafos)
2. Personaliza el primer párrafo mencionando algo específico de la empresa
3. En el segundo párrafo destaca las 3 skills más relevantes del CV para esta empresa
4. El tercer párrafo debe ser un cierre profesional con llamada a la acción
5. Tono: profesional pero cercano, adaptado a la cultura española
6. NO uses frases genéricas como "me llamo" o "como verá en mi CV adjunto"

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
Estimado equipo de ${companyInfo.name},

Me dirijo a ustedes para presentar mi candidatura${jobTitle ? ` al puesto de ${jobTitle}` : " espontánea"} en ${companyInfo.name}. Tras conocer su empresa${companyInfo.sector ? ` y su trayectoria en el sector de ${companyInfo.sector}` : ""}, considero que mis habilidades y experiencia pueden aportar valor a su equipo.

A lo largo de mi trayectoria profesional he desarrollado competencias técnicas y humanas que se alinean con los valores y necesidades de empresas como la suya. Soy una persona proactiva, comprometida y con capacidad de adaptación a diferentes entornos de trabajo.

Quedaría encantado/a de tener la oportunidad de presentarme y conocer más sobre las posibilidades de colaboración. Quedo a su disposición para concertar una entrevista cuando estimen conveniente.

Un cordial saludo,
`.trim();

  const subjectLine = jobTitle
    ? `Candidatura para ${jobTitle} — ${companyInfo.name}`
    : `Candidatura espontánea — ${companyInfo.name}`;

  return { coverLetter, subjectLine };
}
