/**
 * /api/gusi/chat — Guzzi v4: asistente de empleo con contexto de CV real
 *
 * Cambio clave: el system prompt se construye dinámicamente inyectando
 * los datos reales del CV del usuario. Guzzi nunca pregunta lo que ya sabe.
 */

import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// ─── Prompt base ─────────────────────────────────────────────────────────────

const PROMPT_BASE = `IDIOMA OBLIGATORIO: ESPAÑOL. NUNCA respondas en inglés ni en ningún otro idioma. Si el usuario escribe en inglés, respóndele en español igualmente.

Eres Guzzi 🐛, el asistente de empleo de BuscayCurra (plataforma española). Toda tu comunicación es en español de España.

PERSONALIDAD:
- Natural y cercano, como un amigo que sabe mucho de empleo.
- Puedes charlar de cualquier tema, no solo de trabajo.
- Responde de forma conversacional — ni demasiado corto ni demasiado largo.
- Usa el emoji 🐛 solo cuando sea natural, no en cada mensaje.
- Si alguien te hace una pregunta general (política, tecnología, recetas, lo que sea), responde con criterio y naturalidad, como ChatGPT.

CUANDO EL USUARIO HABLA DE TRABAJO O EMPLEO:
- Si tienes su CV, úsalo — nunca preguntes lo que ya sabes.
- Adapta los consejos a su perfil real (puesto, ciudad, sector, habilidades).
- Para mejorar el CV: reescribe secciones con verbos de acción y logros cuantificables.
- Para cartas: usa nombre y datos del CV directamente.

CAPACIDADES PRINCIPALES (menciona cuando sean relevantes):
1. 🔍 Buscar ofertas de trabajo → usa datos del CV para afinar la búsqueda
2. 📧 Enviar CV automático → la función estrella de BuscayCurra
3. ✨ Mejorar el CV → reescribe con datos reales del usuario
4. 🎯 Preparar entrevistas → simula preguntas del sector específico
5. ✉️ Carta de presentación → personalizada empresa + puesto
6. 💬 Charlar → sobre cualquier tema

RECUERDA: Responde SIEMPRE en español. Nunca en inglés.`;

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

function buildSystemPrompt(cvData?: string): string {
  if (!cvData) return PROMPT_BASE;

  const cv = parseCVData(cvData);
  if (!cv || !cv.resumenTexto) return PROMPT_BASE;

  return `${PROMPT_BASE}

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
    const params = new URLSearchParams({ keyword: query, location: city || "España", page: "1" });
    const res = await fetch(`${process.env.API_URL || "http://localhost:3000"}/api/jobs/search?${params}`);
    if (!res.ok) return null;
    const data = await res.json() as { ofertas?: unknown[] };
    return (data.ofertas || []).slice(0, limit);
  } catch {
    return null;
  }
}

function fallbackJobs(puesto: string, ciudad: string) {
  return Array.from({ length: 4 }, (_, i) => ({
    id: `gusi-${Date.now()}-${i}`,
    titulo: `${puesto}${[" (jornada completa)", " (media jornada)", " con experiencia", ""][i]}`,
    empresa: ["Empresa local", "Grupo empresarial", "PYME del sector", "Empresa nacional"][i],
    ubicacion: ciudad || "España",
    salario: `${1200 + i * 150}€ - ${1800 + i * 200}€/mes`,
    fuente: "BuscayCurra",
    match: Math.max(95 - i * 7, 55),
    url: `/app/buscar?keyword=${encodeURIComponent(puesto)}&location=${encodeURIComponent(ciudad)}`,
  }));
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
      return "📸 Para mejorar tu foto de CV:\n\n**ChatGPT:** \"Limpia esta foto de perfil, mejora la iluminación, fondo gris claro degradado, expresión profesional natural.\"\n\n**Gratis:** Remove.bg → quita fondo · Canva → añade fondo profesional\n\n**Tips:** Luz de ventana, ropa formal, pecho arriba. Una buena foto = +40% respuestas. 🐛";
    case "buscar":
      return cv?.ultimoPuesto
        ? `🔍 Veo que tienes experiencia como **${cv.ultimoPuesto}**${cv.ciudad ? ` en **${cv.ciudad}**` : ""}. Usa el botón 📧 Enviar a ofertas para que busque automáticamente.`
        : "🔍 Dime qué trabajo buscas y en qué ciudad, y te busco las mejores ofertas. 🐛";
    case "enviar":
      return cv?.ultimoPuesto
        ? `📧 Basándome en tu CV (${cv.ultimoPuesto}), busca en 🔍 Buscar y usa el botón "Enviar CV" en cada oferta.`
        : "📧 Sube tu CV primero (botón clip de abajo) y luego te busco ofertas que encajen.";
    case "crear_cv":
      return "📝 ¡Vamos! ¿Cuál es tu nombre completo? (Te pregunto de uno en uno, facilísimo) 🐛";
    default:
      return "🐛 Puedo ayudarte a buscar trabajo, mejorar tu CV, preparar entrevistas o generar una carta de presentación. ¿Qué necesitas?";
  }
}

// ─── Handler principal ────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      message, history = [], mode = "chat",
      cvData, empresa, puesto,
    } = body as {
      message: string;
      history?: Array<{ role: string; text: string }>;
      mode?: string;
      cvData?: string;
      empresa?: string;
      puesto?: string;
    };

    if (!message) return NextResponse.json({ error: "Mensaje requerido" }, { status: 400 });

    const cvParsed = cvData ? parseCVData(cvData) : null;
    const groqKey = process.env.GROQ_API_KEY;

    async function callGroq(systemPrompt: string, userContent: string, maxTokens = 600) {
      if (!groqKey) return null;
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${groqKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "qwen/qwen3-32b",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userContent },
          ],
          temperature: 0.6,
          max_tokens: maxTokens,
        }),
      });
      if (!res.ok) return null;
      const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
      return data.choices?.[0]?.message?.content || null;
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
        const ofertas = await searchJobsReal(puestoBusqueda, ciudadBusqueda) || fallbackJobs(puestoBusqueda, ciudadBusqueda);
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
        const ofertas = await searchJobsReal(cvParsed.ultimoPuesto, cvParsed.ciudad) || fallbackJobs(cvParsed.ultimoPuesto, cvParsed.ciudad);
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
    const systemPrompt = buildSystemPrompt(cvData);
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

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${groqKey}` },
      body: JSON.stringify({ model: "qwen/qwen3-32b", messages, max_tokens: 500, temperature: 0.7 }),
    });

    if (!res.ok) return NextResponse.json({ reply: localReply(intent, cvParsed) });
    const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
    const reply = data.choices?.[0]?.message?.content || localReply(intent, cvParsed);
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
  const cities = ["madrid", "barcelona", "valencia", "sevilla", "málaga", "bilbao", "zaragoza",
    "murcia", "pamplona", "tudela", "navarra", "alicante", "córdoba", "granada",
    "vitoria", "san sebastián", "santander", "toledo", "cádiz", "palma"];
  const t = text.toLowerCase();
  for (const c of cities) {
    if (t.includes(c)) return c.charAt(0).toUpperCase() + c.slice(1);
  }
  return "";
}
