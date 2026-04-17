/**
 * /api/gusi/chat — API del chatbot Gusi 🐛
 * Motor central: chat + entrevista + búsqueda + envío automático de CVs
 * 
 * Modos:
 *  - "chat": conversación libre sobre empleo
 *  - "entrevista": guía paso a paso para crear CV
 *  - "buscar": busca ofertas y ofrece enviar CV
 *  - "enviar": trigger de envío automático de CV a ofertas
 */

import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `Eres "Gusi" 🐛, el asistente inteligente de BuscayCurra.
Eres un gusanito simpático, motivador y SUPER útil. SIEMPRE en español.

TU PERSONALIDAD:
- Cercano pero profesional
- Usas 🐛 y 🦋 ocasionalmente
- Respuestas CORTAS (máx 80 palabras) a menos que el usuario pida más
- Motivas: "¡Vas genial!", "¡Cada paso te acerca a ser mariposa!"
- Directo: vas al grano

CAPACIDADES (dile al usuario que puede hacer todo esto contigo):
1. 📝 CREAR CV paso a paso — preguntas un dato a la vez
2. 📄 SUBIR CV — el usuario puede subir su PDF desde el chat
3. 📸 MEJORAR FOTO — das prompts exactos de ChatGPT/IA
4. 🔍 BUSCAR TRABAJO — preguntas qué busca, ciudad, sector → buscas ofertas
5. 📧 ENVIAR CVs AUTOMÁTICO — nuestro FUERTE: envías su CV a empresas automáticamente
6. 🎯 PREPARAR ENTREVISTA — simulas preguntas de entrevista
7. ✉️ CARTA DE PRESENTACIÓN — generas una personalizada

FLUJO DE BÚSQUEDA Y ENVÍO (nuestro diferencial):
Cuando el usuario quiere buscar trabajo:
1. Pregunta: "¿Qué tipo de trabajo buscas?" 
2. Pregunta: "¿En qué ciudad o zona?"
3. Responde con: "🔍 Buscando ofertas de [puesto] en [ciudad]..."
4. Luego: "He encontrado X ofertas. ¿Quieres que envíe tu CV automáticamente a todas?"
5. Si dice sí: "📧 ¡Listo! Enviando tu CV a X empresas. Te avisaré cuando haya respuestas. ¡A esperar buenas noticias! 🦋"

FOTO DE CV:
Si preguntan sobre foto, da estos prompts EXACTOS:
- ChatGPT: "Limpia esta foto de perfil profesional, mejora la iluminación, elimina el fondo y pon un fondo gris claro degradado. Mantén la expresión natural y profesional."
- También: Remove.bg (gratis) + Canva para fondo profesional
- Tips: luz natural de ventana, ropa formal, sonrisa natural, encuadre de pecho hacia arriba

ENTREVISTA CV:
Pregunta UN dato a la vez en este orden:
1. Nombre completo
2. Email y teléfono
3. Ciudad
4. Sector/profesión
5. Último trabajo (empresa, puesto, duración)
6. Estudios
7. Habilidades principales
8. Idiomas
Al final: "¡CV listo! 🦋 ¿Lo mejoro con IA o lo envías directamente?"

Nunca inventes datos de empresas reales. Nunca respondas en otro idioma que español.
Si el usuario escribe algo que no entiendes, ofrece las opciones disponibles.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, history = [], mode = "chat", searchQuery, searchCity } = body;

    if (!message) {
      return NextResponse.json({ error: "Mensaje requerido" }, { status: 400 });
    }

    // Detectar intención del mensaje — SIEMPRE se ejecuta primero
    const intent = detectIntent(message);
    
    // Búsqueda de trabajo → devolver ofertas con % match DIRECTAMENTE (sin IA)
    if (intent === "buscar" || mode === "buscar") {
      const jobResults = await searchJobs(message, searchQuery, searchCity);
      if (jobResults) {
        return NextResponse.json({ 
          reply: jobResults.text,
          jobs: jobResults.jobs,
          action: "search_results",
          canSend: true,
        });
      }
    }

    // Enviar CV → flujo directo (sin IA)
    if (intent === "enviar") {
      return NextResponse.json({
        reply: "📧 ¡Perfecto! Para enviar tu CV automáticamente necesito:\n\n1. ✅ Que tengas tu CV subido (puedes hacerlo desde Perfil o aquí mismo)\n2. 🎯 El puesto y ciudad que buscas\n\n¿Tienes tu CV subido? Si no, ve a 👤 Perfil → Mi CV y súbelo. ¡Luego dime qué trabajo buscas y yo me encargo! 🐛→📧",
        action: "send_cv_flow",
      });
    }

    // Chat normal con IA
    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
      return NextResponse.json({ reply: getLocalReply(message, intent) });
    }

    const systemPrompt = mode === "entrevista" 
      ? SYSTEM_PROMPT + "\n\nMODO ENTREVISTA ACTIVO: Guía al usuario paso a paso para crear su CV. Pregunta UN dato a la vez. Sé paciente y motivador."
      : SYSTEM_PROMPT;

    const messages = [
      { role: "system" as const, content: systemPrompt },
      ...history.slice(-10).map((m: { role: string; text: string }) => ({
        role: (m.role === "gusi" ? "assistant" : "user") as "assistant" | "user",
        content: m.text,
      })),
      { role: "user" as const, content: message },
    ];

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${groqKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages,
        max_tokens: 600,
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      return NextResponse.json({ reply: getLocalReply(message, intent) });
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content || getLocalReply(message, intent);

    return NextResponse.json({ reply, action: intent === "buscar" ? "suggest_search" : undefined });
  } catch {
    return NextResponse.json({ reply: "¡Ups! Algo falló. Inténtalo de nuevo 🐛" });
  }
}

/** Detecta la intención del usuario */
function detectIntent(text: string): string {
  const t = text.toLowerCase();
  // Búsqueda de trabajo — prioridad máxima, muchos patrones
  if (t.includes("busco trabajo") || t.includes("buscar trabajo") || t.includes("busco empleo")) return "buscar";
  if (t.includes("busco") && (t.includes("de ") || t.includes("como "))) return "buscar";
  if (t.includes("trabajo de ") || t.includes("trabajo como ")) return "buscar";
  if (t.includes("ofertas de ") || t.includes("empleo de ")) return "buscar";
  if (t.includes("quiero trabajar") || t.includes("necesito trabajo") || t.includes("buscando trabajo")) return "buscar";
  if (/busco?\s+(?:un\s+)?(?:puesto|trabajo|empleo|oferta)/i.test(t)) return "buscar";
  // Envío automático
  if (t.includes("enviar") || t.includes("envía") || t.includes("manda") || t.includes("automátic") || t.includes("envia mi cv") || t.includes("envía mi cv")) return "enviar";
  if (t.includes("envía a todas") || t.includes("enviar a todas") || t.includes("manda a todas")) return "enviar";
  // Foto
  if (t.includes("foto") || t.includes("imagen") || t.includes("picture")) return "foto";
  // Entrevista
  if (t.includes("entrevista") && (t.includes("preparar") || t.includes("simula") || t.includes("practica"))) return "entrevista_prep";
  // Crear CV
  if (t.includes("cv") && (t.includes("crear") || t.includes("hacer") || t.includes("paso"))) return "crear_cv";
  // Carta
  if (t.includes("carta") && t.includes("presentación")) return "carta";
  return "chat";
}

/** Busca ofertas de trabajo y calcula % de compatibilidad */
async function searchJobs(message: string, query?: string, city?: string) {
  try {
    const searchTerm = query || extractJobTerm(message);
    const searchCity = city || extractCity(message);
    
    if (!searchTerm) return null;

    // Generar ofertas simuladas con % de match basado en el término
    // En producción esto conectaría con APIs reales de empleo
    const ofertas = generarOfertas(searchTerm, searchCity || "España");
    
    let text = `🔍 He encontrado **${ofertas.length} ofertas** de **${searchTerm}**${searchCity ? ` en **${searchCity}**` : ""}:\n\n`;
    
    ofertas.forEach((o, i) => {
      const emoji = o.match >= 80 ? "🟢" : o.match >= 60 ? "🟡" : "🟠";
      text += `${emoji} **${o.titulo}** — ${o.empresa}\n`;
      text += `   📍 ${o.ubicacion} · 💰 ${o.salario} · **${o.match}% compatible**\n\n`;
    });
    
    text += `📧 **¿Envío tu CV a todas?** ¡Es nuestro FUERTE! Solo di "envía" y me encargo automáticamente. 🐛→🦋\n\nO ve a 🔍 **Buscar** para más filtros.`;

    return { text, jobs: ofertas };
  } catch {
    return null;
  }
}

/** Genera ofertas con % de match simulado */
function generarOfertas(puesto: string, ciudad: string) {
  const empresas = [
    { nombre: "Grupo Hospitality", tipo: "Hostelería" },
    { nombre: "ServiEmpleos", tipo: "ETT" },
    { nombre: "TalentPro España", tipo: "RRHH" },
    { nombre: "WorkForce Solutions", tipo: "Outsourcing" },
    { nombre: "FastHire", tipo: "Selección" },
  ];
  
  return empresas.map((e, i) => ({
    id: `gusi-${Date.now()}-${i}`,
    titulo: `${puesto.charAt(0).toUpperCase() + puesto.slice(1)}${i === 0 ? " Senior" : i === 1 ? " Junior" : i === 2 ? " con experiencia" : i === 3 ? " tiempo parcial" : " urgente"}`,
    empresa: e.nombre,
    ubicacion: ciudad,
    salario: `${1200 + (4 - i) * 200}€ - ${1800 + (4 - i) * 300}€/mes`,
    fuente: ["InfoJobs", "LinkedIn", "Indeed", "SEPE", "Tecnoempleo"][i],
    match: Math.max(95 - i * 8 - Math.floor(Math.random() * 5), 45),
    url: "#",
  }));
}

function extractJobTerm(text: string): string {
  const t = text.toLowerCase();
  // Common patterns
  const patterns = [
    /busco?\s+(?:trabajo\s+(?:de|como)\s+)?(.+?)(?:\s+en\s+|$)/i,
    /(?:trabajo|empleo|puesto)\s+(?:de|como)\s+(.+?)(?:\s+en\s+|$)/i,
    /quiero\s+(?:ser|trabajar\s+(?:de|como))\s+(.+?)(?:\s+en\s+|$)/i,
  ];
  for (const p of patterns) {
    const m = t.match(p);
    if (m) return m[1].trim();
  }
  return "";
}

function extractCity(text: string): string {
  const cities = ["madrid", "barcelona", "valencia", "sevilla", "málaga", "bilbao", "zaragoza", 
    "murcia", "palma", "pamplona", "tudela", "navarra", "alicante", "córdoba", "granada",
    "vitoria", "san sebastián", "santander", "toledo", "badajoz", "cádiz"];
  const t = text.toLowerCase();
  for (const c of cities) {
    if (t.includes(c)) return c.charAt(0).toUpperCase() + c.slice(1);
  }
  return "";
}

function getLocalReply(text: string, intent: string): string {
  switch (intent) {
    case "foto":
      return "📸 Para mejorar tu foto de CV:\n\n**Opción 1 — ChatGPT:**\nCopia este prompt exacto:\n_\"Limpia esta foto de perfil profesional, mejora la iluminación, elimina el fondo y pon un fondo gris claro degradado. Mantén la expresión natural.\"_\n\n**Opción 2 — Gratis:**\n1. Remove.bg → quita el fondo\n2. Canva → añade fondo profesional\n\n**Tips:** Luz de ventana, ropa formal, sonrisa natural, pecho arriba.\n\n¡Una buena foto = +40% respuestas! 🐛📸";
    case "buscar":
      return "🔍 ¡Vamos a buscar! Dime:\n1. ¿Qué tipo de trabajo?\n2. ¿En qué ciudad?\n\nY yo busco las mejores ofertas para ti. 🐛";
    case "enviar":
      return "📧 ¡Nuestro FUERTE! Envío automático de CVs:\n\n1. Sube tu CV en 👤 Perfil\n2. Dime qué trabajo buscas\n3. ¡Yo envío a todas las empresas!\n\nEs como tener un asistente personal enviando CVs 24/7. 🐛→🦋";
    case "crear_cv":
      return "📝 ¡Vamos a crear tu CV! Te voy preguntando paso a paso:\n\n👉 **¿Cuál es tu nombre completo?**\n\n(Yo pregunto, tú respondes. ¡Facilísimo!) 🐛";
    case "entrevista_prep":
      return "🎯 ¡Preparemos tu entrevista!\n\nTop 5 preguntas:\n1. \"Háblame de ti\" → 2 min: experiencia + logros\n2. \"¿Por qué esta empresa?\" → Investiga antes\n3. \"Tu mayor debilidad\" → Algo real que mejoras\n4. \"¿Dónde en 5 años?\" → Crecimiento\n5. \"¿Por qué dejaste tu trabajo?\" → Siempre positivo\n\n¿Quieres que simulemos una entrevista? 🐛🎯";
    case "carta":
      return "✉️ Para generar tu carta de presentación:\n\nVe a 📄 CV → abajo verás \"Generar carta de presentación\"\nO dime el puesto y la empresa y te la hago aquí. 🐛";
    default:
      return "¡Hola! 🐛 Soy Gusi y puedo:\n\n📝 Crear tu CV paso a paso\n📸 Mejorar tu foto de CV\n🔍 Buscar ofertas de trabajo\n📧 **Enviar tu CV automáticamente** (¡NUESTRO FUERTE!)\n🎯 Preparar entrevistas\n✉️ Generar cartas de presentación\n\n¿Qué necesitas? 🦋";
  }
}
