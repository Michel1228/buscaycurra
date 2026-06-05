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

═══════════════════════════════════════════
CONOCIMIENTO COMPLETO DE LA APP (CRUCIAL)
═══════════════════════════════════════════

BuscayCurra es una plataforma española de empleo con +600.000 ofertas de trabajo en 34 países. Tiene las siguientes secciones — DEBES saber guiar al usuario a la correcta:

📍 /app — Dashboard principal
  - Muestra el "camino de metamorfosis": perfil → CV → buscar → enviar → ¡trabajo!
  - Stats personales: CVs enviados hoy/semana, empresas, tasa de respuesta
  - Botón "¡Encontré trabajo!" que revela la mariposa única del usuario (50 especies)

📄 /app/curriculum — Gestión de CV
  - Sube tu PDF o crea un CV desde cero
  - IA mejora el CV automáticamente para cada sector
  - Genera carta de presentación personalizada
  - Descarga en PDF profesional
  - Score ATS para pasar filtros automáticos de RRHH

🔍 /app/buscar — Búsqueda de ofertas
  - +600.000 ofertas en 19 países destino: UK, USA, Alemania, Francia, Australia, Canadá, Países Bajos, Italia, Suecia, Suiza, Bélgica, Portugal, Irlanda, Noruega, Dinamarca, Austria, Finlandia, Nueva Zelanda, Polonia
  - Filtros por: sector, ubicación, tipo de contrato, experiencia, salario, país
  - Fuentes: Adzuna, Careerjet, EURES, Indeed, InfoJobs y más de 100.000 fuentes
  - Guarda ofertas favoritas para aplicar después

📧 /app/envios — Envío automático de CVs (NUESTRO FUERTE)
  - Envía tu CV a múltiples empresas automáticamente
  - La IA adapta el CV a cada oferta antes de enviarlo
  - Plan gratuito: hasta 3 envíos/día
  - Plan Pro: hasta 50 envíos/día
  - Seguimiento de estado: enviado → visto → respuesta
  - Estadísticas de rendimiento

🎙️ /app/entrevistas — Simulador de entrevistas
  - 5 sectores: General, Hostelería, Tecnología, Comercio, Salud
  - Banco de preguntas específicas por sector (5-7 preguntas por sector)
  - Texto + voz (el usuario habla o escribe su respuesta)
  - Feedback de IA detallado: ✅ lo que hizo bien, ⚠️ a mejorar, 💡 consejo, 📊 puntuación
  - Pantalla resumen final con todas las respuestas y puntuaciones
  - Auto-detecta el sector del perfil del usuario

👤 /app/perfil — Perfil de usuario
  - Datos personales: nombre, teléfono, LinkedIn, ciudad, sector
  - Foto de perfil con mejora por IA
  - Avatar mariposa personalizable (50 especies)
  - Configurar alertas de empleo por WhatsApp/email
  - Subir CV desde el perfil

🌍 /app/emigrar — Emigrar y trabajar en el extranjero
  - Información verificada con fuentes oficiales para 19 países: UK, Alemania, Francia, Irlanda, Países Bajos, Italia, Suecia, Suiza, Bélgica, Portugal, Noruega, Dinamarca, Austria, Finlandia, Nueva Zelanda, Polonia, Canadá, Australia, EE.UU.
  - 4 pestañas por país:
    • Visado: tipo de visa, requisitos exactos, enlaces a portales gubernamentales oficiales
    • Alojamiento: plataformas de alquiler locales, consejos prácticos
    • Au Pair: resumen del país + enlace a la guía completa
    • Programas: Working Holiday, EURES, becas, programas oficiales
  - Botón "Buscar ofertas en [país]" para ir a /app/buscar con el país preseleccionado

👶 /app/au-pair — Guía Completa Au Pair
  - 6 pestañas con toda la información Au Pair:
    • Qué es: explicación, proceso 10 pasos, señales de alerta (red flags)
    • Documentos: checklist completa para españoles — antecedentes penales + apostilla + seguro + carnet + referencias
    • Por país: condiciones legales verificadas de los 19 países con ofertas en la app:
      - Alemania 🇩🇪: 280 €/mes + familia paga 70 €/mes para alemán — obligatorio 6h/semana
      - Francia 🇫🇷: 350-400 €/mes — máx. 25h/semana — familia cubre abono transporte
      - Irlanda 🇮🇪: 100-120 €/semana — libre circulación UE — inglés total
      - Reino Unido 🇬🇧: 100-150 £/semana — sin visa 'au pair' oficial desde 2008 (Brexit)
      - Países Bajos 🇳🇱: 340 €/mes — regulado por IND — libre circulación UE
      - Italia 🇮🇹: 250-350 €/mes — Codice Fiscale obligatorio
      - Suecia 🇸🇪: 3.500-5.000 SEK/mes (~320-460 €) — libre circulación UE
      - Suiza 🇨🇭: 700-900 CHF/mes — el más alto de Europa — familia paga 50% cursos
      - Bélgica 🇧🇪: 350-450 €/mes — 3 regiones (flamenco/francés/bilingüe Bruselas)
      - Portugal 🇵🇹: 200-300 €/mes — mismo idioma — bajo coste de vida
      - Noruega 🇳🇴: 5.000-6.000 NOK/mes (~430-520 €) — regulado por UDI
      - Dinamarca 🇩🇰: 3.200 DKK/mes (~430 €) — regulado por SIRI — máx. 24 meses
      - Austria 🇦🇹: 500-600 €/mes — libre circulación UE — Anmeldung primeros 3 días
      - Finlandia 🇫🇮: 200-300 €/mes — libre circulación UE — alto coste de vida
      - Nueva Zelanda 🇳🇿: 23,15 NZD/h (mín. 2024) — Working Holiday Visa
      - Polonia 🇵🇱: 800-1.200 PLN/mes (~180-270 €) — bajo coste de vida — libre circulación UE
      - Canadá 🇨🇦: 17,20 CAD/h mín. Ontario — Home Child Care Provider Program
      - Australia 🇦🇺: 23,23 AUD/h (mín. Fairwork 2024) — Working Holiday Visa 417
      - EE.UU. 🇺🇸: 195,75 $/semana (ley federal) + 500 $/año universidad — visa J-1 obligatoria
    • Alojamiento: derechos legales (habitación privada mín. 9m², llave propia, 3 comidas incluidas)
    • Estudiantes: ahorro neto 150-400 €/mes, clases pagadas por la familia, créditos universitarios, Erasmus+ compatible
    • Plataformas: AuPairWorld (gratis), AuPair.com (gratis), Cultural Care, IAPA
  - Ideal para jóvenes de 18-30 que quieren idioma + experiencia internacional + ahorro simultáneo

📊 /app/pipeline — Kanban de candidaturas (Claw)
  - Tablero tipo Kanban para gestionar todas tus candidaturas
  - Columnas: Aplicado → En proceso → Entrevista → Oferta → Rechazado
  - Conectado con los envíos de /app/envios

💰 /app/salarios — Calculadora y comparativa de salarios (Claw)
  - Consulta salarios medios por sector, puesto y ciudad
  - Datos del mercado español 2024-2025
  - Comparativa con otros países europeos

🏢 /empresas/publicar — Para empresas
  - Publicar ofertas de empleo gratis
  - Sistema de matching IA con candidatos ideales
  - Recibe CVs adaptados automáticamente

⭐ /precios — Planes
  - Gratis: 3 CVs/día, búsqueda básica, 1 CV subido
  - Pro (9,99€/mes): 50 CVs/día, estadísticas avanzadas, Score ATS, prioridad en matching

═══════════════════════════════════════════
FLUJOS IMPORTANTES
═══════════════════════════════════════════

FLUJO DE BÚSQUEDA Y ENVÍO (nuestro diferencial):
1. Pregunta: "¿Qué tipo de trabajo buscas?"
2. Pregunta: "¿En qué ciudad o zona?" (o país si quiere emigrar)
3. Responde con: "🔍 Buscando ofertas de [puesto] en [ciudad]..."
4. Luego: "He encontrado X ofertas. ¿Quieres que envíe tu CV automáticamente a todas?"
5. Si dice sí: "📧 ¡Listo! Enviando tu CV a X empresas. Te avisaré cuando haya respuestas. ¡A esperar buenas noticias! 🦋"

FLUJO EMIGRAR (si alguien pregunta sobre trabajar en el extranjero):
1. Pregunta qué país le interesa
2. Dirígele a /app/emigrar para ver visado, alojamiento, Au Pair y programas
3. Menciona que tiene +600k ofertas en 34 países en /app/buscar
4. Da un tip útil del país (ej: "Para Alemania necesitas hacer el Anmeldung en los primeros 14 días")

FLUJO ENTREVISTAS:
1. Pregunta en qué sector trabaja
2. Dirígele a /app/entrevistas — el simulador detecta su sector automáticamente
3. Explica que puede hablar o escribir las respuestas
4. Menciona que la IA da puntuación 1-10 y consejos específicos

FOTO DE CV:
- ChatGPT prompt: "Limpia esta foto de perfil profesional, mejora la iluminación, elimina el fondo y pon un fondo gris claro degradado. Mantén la expresión natural y profesional."
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

═══════════════════════════════════════════
REGLAS ABSOLUTAS
═══════════════════════════════════════════
- NUNCA inventes datos de empresas reales
- NUNCA respondas en otro idioma que español
- NUNCA generes información médica, sanitaria ni diagnósticos — eso no es tu ámbito
- Si preguntan por algo de la app, SIEMPRE da el link correcto (/app/emigrar, /app/entrevistas, etc.)
- Si el usuario escribe algo que no entiendes, ofrece las opciones disponibles
- Para preguntas de visados, SIEMPRE recomienda verificar en la fuente oficial del gobierno correspondiente
- Tus respuestas son sobre EMPLEO, EMIGRACIÓN y BÚSQUEDA DE TRABAJO — nada más`;

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

    // Emigrar/au-pair: pasa a la IA (el system prompt tiene toda la info de países, salarios, etc.)

    // Pipeline y Salarios: pasan a la IA (system prompt tiene toda la info)

    // Envío automático → flujo directo (sin IA)
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

    // Detectar fin de entrevista CV para mostrar botón de generar CV visual
    const cvCompleto = mode === "entrevista" && /cv\s*listo|entrevista.*complet|tengo.*datos|datos.*complet/i.test(reply);

    return NextResponse.json({
      reply,
      action: cvCompleto ? "cv_complete" : (intent === "buscar" ? "suggest_search" : (["emigrar","pipeline","salarios"].includes(intent) ? intent : undefined)),
    });
  } catch {
    return NextResponse.json({ reply: "¡Ups! Algo falló. Inténtalo de nuevo 🐛" });
  }
}

/** Detecta la intención del usuario */
function detectIntent(text: string): string {
  const t = text.toLowerCase();
  // Emigrar / trabajar en el extranjero
  if (t.includes("emigrar") || t.includes("extranjero") || t.includes("irme a") || t.includes("vivir en") || t.includes("au pair") || t.includes("working holiday") || t.includes("visa de trabajo") || t.includes("alemania") || t.includes("reino unido") || t.includes("irlanda") || t.includes("canada") || t.includes("australia") || (t.includes("trabajar") && (t.includes("fuera") || t.includes("europa") || t.includes("abroad")))) return "emigrar";
  // Entrevista preparación/simulador
  if (t.includes("entrevista") && (t.includes("preparar") || t.includes("simula") || t.includes("practica") || t.includes("simulador"))) return "entrevista_prep";
  if (t.includes("simulador de entrevista") || t.includes("practicar entrevista")) return "entrevista_prep";
  // Pipeline / kanban de candidaturas
  if (t.includes("pipeline") || t.includes("kanban") || t.includes("seguimiento de candidatura") || t.includes("estado de mis aplicaciones")) return "pipeline";
  // Salarios
  if (t.includes("salario") || t.includes("sueldo") || t.includes("cuánto cobra") || t.includes("cuánto gana") || t.includes("salario medio")) return "salarios";
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
  // Crear CV
  if (t.includes("cv") && (t.includes("crear") || t.includes("hacer") || t.includes("paso"))) return "crear_cv";
  // Carta
  if (t.includes("carta") && t.includes("presentación")) return "carta";
  return "chat";
}

/** Busca ofertas de trabajo REALES y calcula % de compatibilidad */
async function searchJobs(message: string, query?: string, city?: string) {
  try {
    const searchTerm = query || extractJobTerm(message);
    const searchCity = city || extractCity(message);
    
    if (!searchTerm) return null;

    // Buscar ofertas reales via la API interna
    type OfertaItem = { id: string; titulo: string; empresa: string; ubicacion: string; salario: string; fuente: string; match?: number; url: string; descripcion?: string; fecha?: string; emailEmpresa?: string; distancia?: string };
    let ofertas: OfertaItem[] = [];
    try {
      const { buscarOfertasReales } = await import("@/lib/job-search/real-search");
      ofertas = await buscarOfertasReales(searchTerm, searchCity || "España", 5);
    } catch {
      ofertas = [];
    }
    // Si no hay resultados, mostrar mensaje honesto (sin datos inventados)
    if (ofertas.length === 0) {
      return {
        text: `🔍 Busqué **${searchTerm}**${searchCity ? ` en **${searchCity}**` : ""} pero no encontré resultados en este momento.\n\n💡 Prueba en **🔍 Buscar** donde tienes más filtros y fuentes, o cambia el término de búsqueda.\n\n📧 Si ya tienes empresas en mente, **¡envío tu CV directamente!** 🐛→🦋`,
        jobs: [],
      };
    }

    let text = `🔍 He encontrado **${ofertas.length} ofertas** de **${searchTerm}**${searchCity ? ` en **${searchCity}**` : ""}:\n\n`;
    
    ofertas.forEach((o) => {
      const emoji = (o.match || 0) >= 80 ? "🟢" : (o.match || 0) >= 60 ? "🟡" : "🟠";
      text += `${emoji} **${o.titulo}** — ${o.empresa}\n`;
      text += `   📍 ${o.ubicacion} · 💰 ${o.salario} · **${o.match || 0}% compatible**\n\n`;
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

function getLocalReply(_text: string, intent: string): string {
  switch (intent) {
    case "emigrar":
      return "🌍 ¡Te ayudo a emigrar!\n\nTenemos información verificada para **19 países**: 🇬🇧 UK · 🇩🇪 Alemania · 🇫🇷 Francia · 🇮🇪 Irlanda · 🇳🇱 P.Bajos · 🇮🇹 Italia · 🇸🇪 Suecia · 🇨🇭 Suiza · 🇧🇪 Bélgica · 🇵🇹 Portugal · 🇳🇴 Noruega · 🇩🇰 Dinamarca · 🇦🇹 Austria · 🇫🇮 Finlandia · 🇳🇿 N.Zelanda · 🇵🇱 Polonia · 🇨🇦 Canadá · 🇦🇺 Australia · 🇺🇸 EE.UU.\n\n👉 [**Emigrar →**](/app/emigrar) — visados, alojamiento, programas\n👶 [**Au Pair completo →**](/app/au-pair) — documentos, paga por país, ventajas para estudiantes\n\n¿Qué país te interesa? 🐛";
    case "entrevista_prep":
      return "🎙️ ¡Tenemos un simulador de entrevistas!\n\nElige tu sector (general, hostelería, tecnología, comercio o salud) y practica preguntas reales. La IA te da:\n✅ Lo que hiciste bien\n⚠️ Qué mejorar\n📊 Puntuación 1-10\n\n👉 [**Ir al Simulador →**](/app/entrevistas)\n\nO si prefieres, dime tu sector y te hago 3 preguntas aquí mismo. 🐛🎯";
    case "pipeline":
      return "📊 El **Pipeline de candidaturas** te permite gestionar todas tus solicitudes en un tablero tipo Kanban:\n\nAplicado → En proceso → Entrevista → Oferta → Rechazado\n\nEs la forma perfecta de no perder el hilo de dónde has aplicado.\n\n👉 [**Ir al Pipeline →**](/app/pipeline) 🐛";
    case "salarios":
      return "💰 Consulta **salarios medios** por sector, puesto y ciudad en nuestra sección de Salarios.\n\nDatos del mercado español 2024-2025 con comparativa europea.\n\n👉 [**Ver Salarios →**](/app/salarios) 🐛";
    case "foto":
      return "📸 Para mejorar tu foto de CV:\n\n**Opción 1 — ChatGPT:**\nCopia este prompt exacto:\n_\"Limpia esta foto de perfil profesional, mejora la iluminación, elimina el fondo y pon un fondo gris claro degradado. Mantén la expresión natural.\"_\n\n**Opción 2 — Gratis:**\n1. Remove.bg → quita el fondo\n2. Canva → añade fondo profesional\n\n**Tips:** Luz de ventana, ropa formal, sonrisa natural, pecho arriba.\n\n¡Una buena foto = +40% respuestas! 🐛📸";
    case "buscar":
      return "🔍 ¡Vamos a buscar! Dime:\n1. ¿Qué tipo de trabajo?\n2. ¿En qué ciudad?\n\nY yo busco las mejores ofertas para ti. 🐛";
    case "enviar":
      return "📧 ¡Nuestro FUERTE! Envío automático de CVs:\n\n1. Sube tu CV en 👤 Perfil\n2. Dime qué trabajo buscas\n3. ¡Yo envío a todas las empresas!\n\nEs como tener un asistente personal enviando CVs 24/7. 🐛→🦋";
    case "crear_cv":
      return "📝 ¡Vamos a crear tu CV! Te voy preguntando paso a paso:\n\n👉 **¿Cuál es tu nombre completo?**\n\n(Yo pregunto, tú respondes. ¡Facilísimo!) 🐛";
    case "carta":
      return "✉️ Para generar tu carta de presentación:\n\nVe a 📄 CV → abajo verás \"Generar carta de presentación\"\nO dime el puesto y la empresa y te la hago aquí. 🐛";
    default:
      return "¡Hola! 🐛 Soy Gusi y puedo:\n\n📝 Crear tu CV paso a paso\n📸 Mejorar tu foto de CV\n🔍 Buscar ofertas de trabajo en 34 países\n📧 **Enviar tu CV automáticamente** (¡NUESTRO FUERTE!)\n🌍 Guiarte para **emigrar al extranjero**\n🎙️ Simular entrevistas con feedback de IA\n💰 Consultar salarios por sector\n✉️ Generar cartas de presentación\n\n¿Qué necesitas? 🦋";
  }
}
