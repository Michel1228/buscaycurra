/**
 * /api/gusi/chat — Guzzi v4: asistente de empleo con contexto de CV real
 *
 * Cambio clave: el system prompt se construye dinámicamente inyectando
 * los datos reales del CV del usuario. Guzzi nunca pregunta lo que ya sabe.
 */

import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// ─── Prompt base ─────────────────────────────────────────────────────────────

const PROMPT_BASE = `[IDIOMA: ESPAÑOL OBLIGATORIO]
Tu idioma es el ESPAÑOL. Toda tu respuesta debe estar en español de España, sin excepción.
- Si tus pensamientos internos son en inglés, la respuesta que des al usuario DEBE ser en español.
- Nunca mezcles idiomas. Ni una sola frase en inglés en la respuesta visible.
- Si el usuario escribe en inglés, respóndele igualmente en español.
- Esta instrucción tiene prioridad absoluta sobre cualquier otra.

Eres Guzzi 🐛, el asistente de empleo de BuscayCurra (plataforma GLOBAL de empleo con IA, 19 países).

PERSONALIDAD:
- Natural y cercano, como un amigo que sabe mucho de empleo en Europa.
- Puedes charlar de cualquier tema, no solo de trabajo.
- Responde de forma conversacional — ni demasiado corto ni demasiado largo.
- Usa el emoji 🐛 con moderación, no en cada mensaje.

CONOCIMIENTO DEL MERCADO LABORAL ESPAÑOL:
- Tipos de contrato: indefinido, temporal, fijo-discontinuo, prácticas, ETT
- Salario mínimo 2025: 1.184 €/mes (16 pagas) = 14.208 €/año
- SEPE: tramitar desempleo en 15 días hábiles desde el despido
- ERTE: regulación temporal; el trabajador cobra 70% base reguladora
- Sectores con más oferta en España: logística, hostelería, construcción, tecnología, salud
- Portales de empleo: BuscayCurra (IA), InfoJobs (masivo), LinkedIn (networking), Tecnoempleo (IT)
- Comunidades con más empleo: Madrid, Cataluña, Andalucía, Valencia, País Vasco
- Salarios orientativos: comercial 1.500-2.500€, desarrollador 2.000-4.500€, camarero 1.200-1.600€, enfermero 1.800-2.500€, transportista 1.400-2.000€

CONOCIMIENTO DEL MERCADO LABORAL EUROPEO:
- Alemania 🇩🇪: salario mínimo 2.151 €/mes. Sectores fuertes: ingeniería, IT, salud, logística. Ciudades: Berlin, München, Frankfurt.
- Francia 🇫🇷: salario mínimo 1.802 €/mes. Sectores: hostelería, construcción, sanidad, aeronáutica. Ciudades: Paris, Lyon, Marseille.
- Italia 🇮🇹: salario mínimo ~1.200 €/mes (varía por sector). Sectores: moda, turismo, automoción, alimentación.
- Portugal 🇵🇹: salario mínimo 870 €/mes. Sectores: turismo, call centers, construcción, agricultura.
- Países Bajos 🇳🇱: salario mínimo 2.070 €/mes. Mucho trabajo en logística, agricultura, IT, hostelería.
- Polonia 🇵🇱: salario mínimo 4.300 zł/mes (~1.000 €). Sectores: IT, manufactura, logística, servicios.
- Suecia 🇸🇪, Dinamarca 🇩🇰, Noruega 🇳🇴: salarios altos (2.500-4.000 €/mes). Construcción, IT, salud, oil & gas.
- Irlanda 🇮🇪: salario mínimo 2.200 €/mes. IT, farmacéutica, finanzas, hostelería.
- Suiza 🇨🇭: salario mínimo ~4.000 CHF/mes. Banca, farmacéutica, IT, hostelería de lujo.
- Reino Unido 🇬🇧: salario medio £2.900/mes. Sectores: finanzas (London), IT, NHS (sanidad), hostelería, construcción. Ciudades: London, Manchester, Edinburgh.
- Para trabajar en otro país de la UE: los españoles NO necesitan visado. Sí necesitan NIE equivalente (NIF en Portugal, Codice Fiscale en Italia, etc.).
- El traslado: buscar alojamiento ANTES de llegar, calcular 2-3 meses de ahorros para el aterrizaje.
- Los idiomas: en hostelería/turismo el español basta a veces. En IT el inglés suele ser suficiente. En oficios (construcción, limpieza), el idioma local es muy valorado.
- Salarios en países no-euro: convertir siempre mentalmente. 1 EUR ≈ 0,86 GBP / 4,3 PLN / 11,3 SEK / 7,5 DKK / 11,8 NOK / 0,96 CHF.

CONOCIMIENTO DEL MERCADO LABORAL FUERA DE EUROPA (MEJORES SALARIOS):
- Estados Unidos 🇺🇸: salario medio $5.000/mes. Sectores: IT (Silicon Valley), sanidad, construcción, hostelería, logística. Requiere visado de trabajo (H-1B, L-1). Ciudades top: New York, Los Angeles, Chicago, Houston, Miami.
- Canadá 🇨🇦: salario medio C$5.000/mes. Sectores: IT, construcción, petróleo/gas, sanidad, agricultura. Express Entry para trabajadores cualificados. Ciudades: Toronto, Vancouver, Montreal, Calgary.
- Australia 🇦🇺: salario medio A$6.500/mes. Sectores: minería, construcción, sanidad, IT, hostelería. Working Holiday Visa para <35 años. Ciudades: Sydney, Melbourne, Brisbane, Perth.
- Para emigrar fuera de la UE: investigar visados con 3-6 meses de antelación. Ahorrar mínimo 5.000-10.000 € para el aterrizaje.
- Los españoles tienen acceso a Working Holiday Visa en Canadá y Australia (hasta 35 años).
- El inglés es IMPRESCINDIBLE para estos países. Recomendar aprender o mejorar antes de emigrar.

ESTRATEGIAS DE BÚSQUEDA DE EMPLEO:
- Red de contactos: 70% de los empleos se cubren sin publicar en portales
- CV ATS-friendly: palabras clave del sector, sin tablas complejas, PDF limpio
- LinkedIn: foto profesional, headline con "buscando activamente", conectar con RRHH de empresas objetivo
- Candidatura espontánea: efectiva en pymes y empresas sin portal de empleo
- Entrevista: STAR method (Situación, Tarea, Acción, Resultado)
- Tiempo medio de búsqueda en España: 3-6 meses para perfil medio

CUANDO EL USUARIO HABLA DE TRABAJO O EMPLEO:
- Si tienes su CV, úsalo — nunca preguntes lo que ya sabes.
- Adapta los consejos a su perfil real (puesto, ciudad, sector, habilidades).
- Para mejorar el CV: reescribe secciones con verbos de acción y logros cuantificables.
- Para cartas: usa nombre y datos del CV directamente.
- Sugiere el salario esperado basándote en su experiencia y sector.

CAPACIDADES PRINCIPALES (menciona cuando sean relevantes):
1. 🔍 Buscar ofertas → usa datos del CV para afinar la búsqueda. ¡También busca en otros países europeos!
2. 📧 Enviar CV automático → la función estrella, Guzzi envía por ti
3. ✨ Mejorar el CV → reescribe con verbos de acción y logros cuantificables
4. 🎯 Preparar entrevistas → simula preguntas específicas del sector y empresa
5. ✉️ Carta de presentación → personalizada para cada empresa
6. 💰 Orientación salarial → rangos reales del mercado español y europeo
7. 📋 Estrategia de búsqueda → plan personalizado según perfil y país
8. 💬 Charlar → sobre cualquier tema
9. 📊 Skill Gap → compara tu CV con una oferta y te dice qué te falta (di "analiza esta oferta para mí")
10. 💰 Negociación Salarial → guión personalizado con datos reales del mercado (di "prepárame para negociar")
11. 🌍 Trabajar en Europa → infórmate sobre salarios, requisitos y ofertas en 15 países (di "quiero trabajar en Alemania")

RECUERDA: SIEMPRE en español. Esta es la regla número uno.`;

// ─── Prompts especializados ───────────────────────────────────────────────────

const PROMPT_ENTREVISTA = `IDIOMA OBLIGATORIO: ESPAÑOL. Nunca respondas en inglés.

Eres Guzzi, coach de entrevistas de BuscayCurra. SIEMPRE en español.
Genera una ficha de preparación con estas 4 secciones:

**1. Lo que valora [empresa]**
3-4 puntos sobre cultura, valores y perfil buscado. Si no conoces la empresa, usa el sector.

**2. Preguntas que te pueden hacer**
3 preguntas típicas con pista breve de cómo responder.

**3. Qué resaltar de tu perfil**
Si tienes CV: 2-3 puntos concretos de experiencia o habilidades que encajan.
Sin CV: consejos generales del puesto.

**4. Ánimo**
Un mensaje corto, sincero y cálido.

Formato markdown. Tono: mentor cercano. Emojis con moderación.`;

const PROMPT_CV_MEJORADO = `IDIOMA OBLIGATORIO: ESPAÑOL. Nunca respondas en inglés.

Eres un experto en RRHH y redacción de CVs. SIEMPRE en español.
Mejora el CV usando los datos reales que te dan. Estructura OBLIGATORIA:

# [Nombre Completo]
📞 [Teléfono] | ✉ [Email] | 📍 [Ciudad]

## 🎯 Perfil Profesional
[2-3 frases impactantes. Años de experiencia + fortalezas + sector]

## 💼 Experiencia Laboral
### [Puesto] — [Empresa] | [Fechas]
- [Logro cuantificable con verbo de acción]
- [Logro cuantificable]

## 🎓 Formación
- [Título] — [Centro] | [Año]

## 🛠️ Habilidades
[Habilidades por orden de relevancia, separadas por comas]

## 🌍 Idiomas
- [Idioma]: [Nivel]

REGLAS: verbos de acción (Gestioné, Coordiné, Optimicé...), cuantifica siempre,
adapta perfil al sector, NO inventes datos, usa [PENDIENTE] si falta algo.`;

const PROMPT_CARTA = `IDIOMA OBLIGATORIO: ESPAÑOL. Nunca respondas en inglés.

Eres experto en cartas de presentación. SIEMPRE en español.
Genera una carta personalizada (máx 250 palabras).

[CIUDAD], [FECHA]

Estimado/a responsable de selección de [EMPRESA]:

[Párrafo de presentación con experiencia y por qué encaja en ESTA empresa concreta]

[Párrafo de valor: qué aporta, logros cuantificables, habilidades clave]

Quedo a su disposición para una entrevista.

Atentamente,
[NOMBRE]
📞 [TELÉFONO] · ✉ [EMAIL]

REGLAS: menciona la empresa mínimo 3 veces, tono adaptado al sector (formal para banca,
cercano para startups), NO inventes datos.`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function analyzeCVDensity(cvData: string): { isSparse: boolean; isRich: boolean } {
  try {
    const cv = JSON.parse(cvData);
    let wordCount = 0;
    let sectionsFilled = 0;

    const textFields = ["perfilProfesional", "aptitudes", "subtitulo", "habilidades", "idiomas", "formacion"];
    textFields.forEach(f => {
      const val = cv[f];
      if (val && String(val).trim().length > 5) {
        wordCount += String(val).split(/\s+/).length;
        sectionsFilled++;
      }
    });

    if (Array.isArray(cv.experiencia)) {
      cv.experiencia.forEach((e: Record<string, unknown>) => {
        sectionsFilled++;
        if (e.descripcion) wordCount += String(e.descripcion).split(/\s+/).length;
      });
    }

    return {
      isSparse: wordCount < 80 || sectionsFilled < 3,
      isRich: wordCount > 300 && sectionsFilled >= 5,
    };
  } catch {
    return { isSparse: true, isRich: false };
  }
}

function parseStringList(val: unknown): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return (val as unknown[]).map(v => typeof v === "object" ? (v as { nombre?: string }).nombre || "" : String(v)).filter(Boolean);
  return String(val).split(/[,\n]/).map(s => s.replace(/^[-•*]\s*/, "").trim()).filter(Boolean);
}

interface CVParsed {
  nombre: string;
  ciudad: string;
  ultimoPuesto: string;
  ultimaEmpresa: string;
  sector: string;
  habilidades: string;
  resumenTexto: string;
}

function parseCVData(raw: string): CVParsed | null {
  try {
    const cv = JSON.parse(raw);
    const nombre = String(cv.nombre || cv.full_name || "").trim();
    const ciudad = String(cv.ciudad || cv.location || "").trim();
    const sector = String(cv.sector || "").trim();

    let ultimoPuesto = "";
    let ultimaEmpresa = "";
    const exp = cv.experiencia || cv.experience;

    if (Array.isArray(exp) && exp.length > 0) {
      const e0 = exp[0] as { puesto?: string; empresa?: string };
      ultimoPuesto = e0.puesto || "";
      ultimaEmpresa = e0.empresa || "";
    } else if (typeof exp === "string" && exp.trim()) {
      // "2020-2023 — Camarero en Bar La Plaza (Madrid)"
      const m = exp.match(/(?:—|–|-)\s*(.+?)\s+en\s+(.+?)(?:\s*[\n(]|$)/i);
      ultimoPuesto = m?.[1]?.trim() || "";
      ultimaEmpresa = m?.[2]?.trim() || "";
    }

    const habilidades = parseStringList(cv.aptitudes || cv.habilidades || cv.skills).slice(0, 5).join(", ");

    const resumenTexto = [
      nombre && `Nombre: ${nombre}`,
      ciudad && `Ciudad: ${ciudad}`,
      ultimoPuesto && `Último puesto: ${ultimoPuesto}`,
      ultimaEmpresa && `Última empresa: ${ultimaEmpresa}`,
      sector && `Sector: ${sector}`,
      habilidades && `Habilidades: ${habilidades}`,
    ].filter(Boolean).join("\n");

    return { nombre, ciudad, ultimoPuesto, ultimaEmpresa, sector, habilidades, resumenTexto };
  } catch {
    return null;
  }
}

function buildSystemPrompt(cvData?: string, pais?: string): string {
  const paisInfo = pais && pais !== "ES"
    ? `\nEl usuario está buscando trabajo en ${pais}. Adapta tus consejos al mercado laboral de ese país (salarios, requisitos, idioma).\n`
    : "";

  if (!cvData) return PROMPT_BASE + paisInfo;

  const cv = parseCVData(cvData);
  if (!cv || !cv.resumenTexto) return PROMPT_BASE + paisInfo;

  return `${PROMPT_BASE}${paisInfo}

━━━ DATOS REALES DEL CV DEL USUARIO (usa esto en TODAS tus respuestas) ━━━
${cv.resumenTexto}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Cuando el usuario pregunte qué trabajo buscar → sugiérele ofertas de "${cv.ultimoPuesto || cv.sector || "su sector"}" en "${cv.ciudad || "su zona"}".
Cuando mejores el CV → usa exactamente los datos de arriba, no los inventes.
Cuando generes una carta → pon el nombre "${cv.nombre}" y la ciudad "${cv.ciudad}" reales.`;
}

function detectIntent(text: string): string {
  const t = text.toLowerCase();
  if (/(mejorar|mejora|optimizar|reescrib).*(cv|curriculum)|(cv|curriculum).*(mejorar|mejorado|profesional|limpio)/.test(t)) return "cv_mejorado";
  if (/(carta.*(recomendaci|presentaci|para\s+\w)|presentaci.*carta)/.test(t)) return "carta_recomendacion";
  if (/(busco|buscar|necesito|quiero).*(trabajo|empleo|oferta|puesto)|(trabajo|empleo).*(busco|buscar|hay)/.test(t)) return "buscar";
  if (/(envi|manda|submit).*(cv|candidatura)|cv.*(envi|manda|automátic)/.test(t)) return "enviar";
  if (/foto|imagen\s+cv|foto.*cv/.test(t)) return "foto";
  if (/(preparar|practicar|simul).*(entrevista)|entrevista.*(preparar|practica)/.test(t)) return "entrevista_prep";
  if (/(crear|hacer|nuevo).*(cv|curriculum)/.test(t)) return "crear_cv";
  return "chat";
}

async function searchJobsReal(query: string, city: string, limit = 5) {
  try {
    const { buscarOfertasReales } = await import("@/lib/job-search/real-search");
    const ofertas = await buscarOfertasReales(query, city, Math.min(limit * 2, 20));
    // Mapear OfertaReal a formato simplificado para el chat
    return ofertas.slice(0, limit).map(o => ({
      id: o.id,
      titulo: o.titulo,
      empresa: o.empresa,
      ubicacion: o.ubicacion,
      salario: o.salario,
      fuente: o.fuente,
      match: o.match,
      url: o.url,
    }));
  } catch {
    return null;
  }
}

function fallbackMessage(puesto: string, ciudad: string): string {
  return `🔍 No encontré ofertas activas ahora mismo para **${puesto}**${ciudad ? ` en **${ciudad}**` : ""}.\n\nPuedes:\n• 🔄 Pedirme que busque con otras palabras\n• 📍 Probar otra ciudad\n• 📧 Usar el botón de abajo para búsqueda automática\n\n🐛 ¡No te desanimes! El mercado se mueve a diario.`;
}

function buildJobsText(puesto: string, ciudad: string, ofertas: unknown[]): string {
  let text = `🔍 **${ofertas.length} ofertas** de **${puesto}**${ciudad ? ` en **${ciudad}**` : ""}:\n\n`;
  (ofertas as Array<{ titulo?: string; empresa?: string; ubicacion?: string; salario?: string; match?: number }>)
    .forEach((o, i) => {
      const em = ["🥇", "🥈", "🥉", "📌"][i] || "📌";
      text += `${em} **${o.titulo}**\n   📍 ${o.ubicacion} · 💰 ${o.salario || "Ver oferta"}\n\n`;
    });
  text += `📧 **¿Envío tu CV a todas?** Di "sí" y me encargo. O usa el botón en cada oferta del buscador. 🐛`;
  return text;
}

function localReply(intent: string, cv?: CVParsed | null): string {
  switch (intent) {
    case "foto":
      return "📸 **Cómo mejorar tu foto de CV con IA:**\n\nSube tu foto a ChatGPT (o cualquier IA con imagen) y usa este prompt:\n\n---\n*Utiliza esta foto para realizar los siguientes cambios:\n\n1. Crear un fondo blanco y cambiar todo el fondo actual.\n2. Cambiar la camiseta por una camisa blanca.\n3. Poner la figura en posición sentada.\n\nFotografía tamaño carnet hasta la altura de los hombros. Preséntalo para un currículum.*\n\n---\n\n**Resultado:** foto profesional lista para el CV. Una buena foto = +40% más respuestas. 🐛";
    case "buscar":
      return cv?.ultimoPuesto
        ? `🔍 Veo que tienes experiencia como **${cv.ultimoPuesto}**${cv.ciudad ? ` en **${cv.ciudad}**` : ""}. Usa el botón 📧 Enviar a ofertas para que busque automáticamente.`
        : "🔍 Dime qué trabajo buscas y en qué ciudad o país, y te busco las mejores ofertas en toda Europa. 🐛";
    case "enviar":
      return cv?.ultimoPuesto
        ? `📧 Basándome en tu CV (${cv.ultimoPuesto}), busca en 🔍 Buscar y usa el botón "Enviar CV" en cada oferta.`
        : "📧 Sube tu CV primero (botón clip de abajo) y luego te busco ofertas que encajen.";
    case "crear_cv":
      return "📝 ¡Vamos! ¿Cuál es tu nombre completo? (Te pregunto de uno en uno, facilísimo) 🐛";
    default:
      return "🐛 Puedo ayudarte a buscar trabajo en España y Europa, mejorar tu CV, preparar entrevistas o generar una carta de presentación. ¿Qué necesitas?";
  }
}

// ─── Handler principal ────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      message, history = [], mode = "chat",
      cvData: cvDataFromClient, empresa, puesto, userId, pais,
    } = body as {
      message: string;
      history?: Array<{ role: string; text: string }>;
      mode?: string;
      cvData?: string;
      empresa?: string;
      puesto?: string;
      userId?: string;
      pais?: string;
    };

    if (!message) return NextResponse.json({ error: "Mensaje requerido" }, { status: 400 });

    // Si hay userId, leer el CV fresco desde la BD (ignora el cvData del cliente)
    let cvData = cvDataFromClient;
    if (userId) {
      try {
        const { getPool } = await import("@/lib/db");
        const pool = getPool();
        const row = await pool.query(
          "SELECT form_data FROM user_cvs WHERE user_id = $1",
          [userId]
        );
        if (row.rows[0]?.form_data) {
          cvData = JSON.stringify(row.rows[0].form_data);
        }
      } catch {
        // Si falla la BD, usar el cvData del cliente como fallback
      }
    }

    const cvParsed = cvData ? parseCVData(cvData) : null;
    const groqKey = process.env.GROQ_API_KEY;

    async function callGroq(systemPrompt: string, userContent: string, maxTokens = 600) {
      if (!groqKey) return null;
      // /no_think desactiva el modo reasoning de Qwen3 → responde directamente en el idioma del sistema (español)
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${groqKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "qwen/qwen3-32b",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: "/no_think " + userContent },
          ],
          temperature: 0.6,
          max_tokens: maxTokens,
        }),
      });
      if (!res.ok) return null;
      const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
      const raw = data.choices?.[0]?.message?.content || null;
      // Por si acaso aún aparecen bloques <think>...</think>, los eliminamos
      return raw ? raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim() : null;
    }

    // ── Modo preparación de entrevista ───────────────────────────────────────
    if (mode === "prep_entrevista") {
      const ctx = cvData ? `Datos del candidato:\n${cvParsed?.resumenTexto || cvData.slice(0, 400)}` : "";
      const content = `Entrevista: "${message}". ${ctx}`;
      const reply = await callGroq(PROMPT_ENTREVISTA, content, 800) || localReply("entrevista_prep");
      return NextResponse.json({ reply });
    }

    // ── Modo CV mejorado ─────────────────────────────────────────────────────
    if (mode === "cv_mejorado" || detectIntent(message) === "cv_mejorado") {
      if (!cvData) {
        return NextResponse.json({
          reply: "📝 Para mejorar tu CV necesito tus datos. Súbelo en PDF (botón clip) o cuéntame tus datos aquí. 🐛",
          action: "need_cv_data",
        });
      }

      const density = analyzeCVDensity(cvData);
      let densityNote = "";
      let maxTokens = 1200;

      if (density.isSparse) {
        densityNote = `

INSTRUCCIÓN CRÍTICA — CV CON POCA INFORMACIÓN:
El candidato tiene poca experiencia o datos. NUNCA INVENTES información, pero SÍ:
- Elabora cada experiencia con 3-4 responsabilidades típicas del puesto (ej: "Camarero" → atención al cliente, gestión de pedidos, preparación de bebidas, trabajo en equipo bajo presión)
- Escribe el perfil profesional con 4-5 frases descriptivas, no solo 2
- Añade habilidades implícitas del sector aunque no las hayan mencionado (las que cualquiera con ese puesto tendría)
- Expande la sección de formación si hay datos
- Objetivo: que el CV parezca sólido y completo aunque la base sea escasa`;
        maxTokens = 1500;
      } else if (density.isRich) {
        densityNote = `

INSTRUCCIÓN CRÍTICA — CV CON MUCHA INFORMACIÓN:
El candidato tiene mucha experiencia.
- Selecciona y resume los 2-3 logros más relevantes por empresa
- Perfil profesional: máx 3 frases impactantes
- Prioriza lo más reciente y elimina redundancias`;
        maxTokens = 1000;
      }

      const promptConDensidad = PROMPT_CV_MEJORADO + densityNote;
      const content = `Mejora este CV con los datos reales que te doy:\n\n${cvData}`;
      const reply = await callGroq(promptConDensidad, content, maxTokens) || localReply("cv_mejorado");
      return NextResponse.json({ reply, action: "cv_mejorado" });
    }

    // ── Modo carta ───────────────────────────────────────────────────────────
    if (mode === "carta_recomendacion" || detectIntent(message) === "carta_recomendacion") {
      if (!empresa || !puesto) {
        return NextResponse.json({
          reply: "✉️ Para la carta necesito:\n1. 🏢 Nombre de la empresa\n2. 🎯 Puesto al que aplicas\n\nDime los dos y te la genero ahora. 🐛",
          action: "need_empresa_puesto",
        });
      }
      const ctx = cvData ? `Datos del candidato: ${cvParsed?.resumenTexto || cvData.slice(0, 400)}` : "";
      const content = `Empresa: ${empresa}. Puesto: ${puesto}. ${ctx}`;
      const reply = await callGroq(PROMPT_CARTA, content, 800) || localReply("carta_recomendacion");
      return NextResponse.json({ reply, action: "carta_recomendacion", empresa, puesto });
    }

    // ── Intent: buscar trabajo ───────────────────────────────────────────────
    const intent = detectIntent(message);

    if (intent === "buscar" || mode === "buscar") {
      // Usa datos del CV si los tiene; si no, extrae del mensaje
      const puestoBusqueda = cvParsed?.ultimoPuesto || extractJobTerm(message) || "";
      const ciudadBusqueda = cvParsed?.ciudad || extractCity(message) || "";

      if (puestoBusqueda) {
        const ofertas = await searchJobsReal(puestoBusqueda, ciudadBusqueda);
        if (!ofertas || ofertas.length === 0) {
          return NextResponse.json({
            reply: (cvParsed?.ultimoPuesto
              ? `Basándome en tu CV (último puesto: **${cvParsed.ultimoPuesto}**), ` : "") +
              fallbackMessage(puestoBusqueda, ciudadBusqueda),
            action: "search_results",
          });
        }
        const prefix = cvParsed?.ultimoPuesto
          ? `Basándome en tu CV (último puesto: **${cvParsed.ultimoPuesto}**), aquí tienes lo mejor que encontré:\n\n`
          : "";
        return NextResponse.json({
          reply: prefix + buildJobsText(puestoBusqueda, ciudadBusqueda, ofertas as unknown[]),
          jobs: ofertas,
          action: "search_results",
        });
      }
    }

    // ── Intent: enviar CV ────────────────────────────────────────────────────
    if (intent === "enviar") {
      if (cvParsed?.ultimoPuesto) {
        const ofertas = await searchJobsReal(cvParsed.ultimoPuesto, cvParsed.ciudad);
        if (!ofertas || ofertas.length === 0) {
          return NextResponse.json({
            reply: fallbackMessage(cvParsed.ultimoPuesto, cvParsed.ciudad),
            action: "search_results",
          });
        }
        return NextResponse.json({
          reply: `🔍 Encontré estas ofertas para **${cvParsed.ultimoPuesto}**${cvParsed.ciudad ? ` en **${cvParsed.ciudad}**` : ""}:\n\n${buildJobsText(cvParsed.ultimoPuesto, cvParsed.ciudad, ofertas as unknown[]).split("\n\n").slice(1).join("\n\n")}`,
          jobs: ofertas,
          action: "search_results",
        });
      }
      return NextResponse.json({
        reply: cvData
          ? "📧 Para enviarte a ofertas dime: ¿qué tipo de trabajo buscas y en qué ciudad? 🐛"
          : "📧 Primero necesito tu CV. Súbelo desde el clip de abajo o escribe **'crear cv'** y te lo hago paso a paso. 🐛",
        action: "send_cv_flow",
      });
    }

    // ── Chat normal con IA ───────────────────────────────────────────────────
    const systemPrompt = buildSystemPrompt(cvData, pais);
    const messages = [
      { role: "system" as const, content: systemPrompt },
      ...history.slice(-8)
        .filter((m: { role: string; text: string }) => m.text)
        .map((m: { role: string; text: string }) => ({
          role: (m.role === "gusi" ? "assistant" : "user") as "assistant" | "user",
          content: m.text,
        })),
      { role: "user" as const, content: message },
    ];

    if (!groqKey) {
      return NextResponse.json({ reply: localReply(intent, cvParsed) });
    }

    // Añadir /no_think al último mensaje del usuario para forzar respuesta directa en español
    const msgsConNoThink = messages.map((m, i) =>
      i === messages.length - 1 && m.role === "user"
        ? { ...m, content: "/no_think " + m.content }
        : m
    );
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${groqKey}` },
      body: JSON.stringify({ model: "qwen/qwen3-32b", messages: msgsConNoThink, max_tokens: 500, temperature: 0.7 }),
    });

    if (!res.ok) return NextResponse.json({ reply: localReply(intent, cvParsed) });
    const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
    const rawReply = data.choices?.[0]?.message?.content || "";
    const reply = rawReply.replace(/<think>[\s\S]*?<\/think>/gi, "").trim() || localReply(intent, cvParsed);
    return NextResponse.json({ reply });

  } catch {
    return NextResponse.json({ reply: "¡Ups! Algo falló. Inténtalo de nuevo 🐛" });
  }
}

function extractJobTerm(text: string): string {
  const m = text.match(/(?:busco|trabajo|empleo|puesto)\s+(?:de\s+|como\s+)?(.+?)(?:\s+en\s+|$)/i);
  return m?.[1]?.trim() || "";
}

function extractCity(text: string): string {
  const cities = [
    // España
    "madrid", "barcelona", "valencia", "sevilla", "málaga", "bilbao", "zaragoza",
    "murcia", "pamplona", "tudela", "navarra", "alicante", "córdoba", "granada",
    "vitoria", "san sebastián", "santander", "toledo", "cádiz", "palma",
    // Europa
    "berlin", "münchen", "munich", "hamburg", "frankfurt", "köln", "stuttgart",
    "paris", "lyon", "marseille", "toulouse", "bordeaux", "lille",
    "roma", "milano", "napoli", "torino", "firenze",
    "lisboa", "porto", "braga", "faro",
    "amsterdam", "rotterdam", "la haya", "utrecht",
    "warszawa", "kraków", "wroclaw", "gdansk",
    "stockholm", "göteborg", "malmö",
    "københavn", "copenhagen", "aarhus",
    "oslo", "bergen", "trondheim",
    "helsinki", "tampere", "turku",
    "dublin", "cork", "galway",
    "zürich", "zurich", "ginebra", "basel", "bern",
    "bruselas", "amberes", "brujas",
    "wien", "vienna", "salzburg",
  ];
  const t = text.toLowerCase();
  for (const c of cities) {
    if (t.includes(c)) return c.charAt(0).toUpperCase() + c.slice(1);
  }
  return "";
}
