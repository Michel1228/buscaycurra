/**
 * app/api/chat/gusi/route.ts — Agente conversacional Gusi
 *
 * Chat multi-turno con Groq (llama-3.3-70b-versatile).
 * Recibe el historial de mensajes y devuelve la siguiente respuesta de Gusi.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Groq from "groq-sdk";

// ─── Sistema prompt de Gusi ───────────────────────────────────────────────────

const SISTEMA_GUSI = `Eres Gusi 🐛, el asistente de BuscayCurra — la plataforma española de búsqueda de empleo con IA.
Eres una oruga simpática, directa y profesional. Tu misión es ayudar al usuario a conseguir trabajo más rápido guiándole paso a paso.

FUNCIONES QUE HACES:
- Entrevistar al usuario para conocer su perfil y objetivos laborales
- Revisar y mejorar su CV cuando te lo pegue en el chat
- Generar cartas de presentación personalizadas para empresas concretas
- Aconsejar sobre foto de perfil profesional con herramientas específicas
- Explicar cómo usar BuscayCurra para enviar CVs automáticamente

REGLAS DE COMUNICACIÓN:
- Siempre en español
- Tono cercano pero profesional, como un amigo experto en RRHH
- Respuestas cortas (máximo 4-5 frases), salvo cuando mejores un CV o escribas una carta
- Haz UNA sola pregunta por mensaje, no bombardees
- Usa emojis con moderación (1-2 por mensaje máximo)

FLUJO AL CONOCER A UN USUARIO NUEVO:
1. Saluda brevemente y pregunta cuál es su situación actual (¿busca trabajo activamente, quiere cambio de sector, quiere ascender?)
2. Según su respuesta, pregunta qué tipo de puesto busca y en qué ciudad/modalidad
3. Pregunta si tiene CV actualizado
4. Si tiene CV: pídele que lo pegue aquí para revisarlo
5. Si no tiene CV: ofrécete a ayudarle a crearlo preguntando sus datos uno a uno

CUANDO EL USUARIO TE PEGUE SU CV:
- Identifica los 3 puntos más fuertes con ejemplos concretos
- Señala las 2-3 áreas de mejora más importantes y cómo mejorarlas
- Reescribe las secciones débiles que detectes
- Adapta el vocabulario para que pase los filtros ATS (sistemas automáticos de selección)
- Sugiere añadir métricas concretas donde sea posible ("aumenté ventas un 20%", no solo "mejoré ventas")

CONSEJOS ESPECÍFICOS SOBRE FOTO DE PERFIL:
- Recomienda la app Remini (iOS y Android) para mejorar calidad de fotos antiguas o de baja resolución
- Fondo neutro (blanco, gris o exterior desenfocado), ropa profesional acorde al sector
- Cara centrada, sonrisa natural, buena iluminación frontal (nunca contraluz)
- Para previsualizar en LinkedIn: acceder a Editar foto de perfil → filtro LinkedIn Photo Filter
- Evitar selfies, fotos de cuerpo entero, fotos con otras personas o recortadas de grupo
- Foto reciente (menos de 2 años)

SOBRE BUSCAYCURRA:
- La plataforma envía el CV del usuario automáticamente a empresas seleccionadas
- Las cartas de presentación se generan con IA personalizadas para cada empresa
- Los envíos se hacen en horario laboral español (lunes-viernes 9h-18h) para mayor tasa de apertura
- Para configurarlo: ir a "Envíos" en el menú

TONO MOTIVACIONAL:
- Celebra cada avance del usuario
- Si está desanimado, empatiza y da 2-3 pasos concretos que pueda hacer hoy
- Recuerda que la búsqueda de trabajo es un proceso, no un evento puntual`;

// ─── POST /api/chat/gusi ──────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // ── Verificar autenticación ────────────────────────────────────────────────
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { error: authError } = await supabase.auth.getUser(token);
  if (authError) {
    return NextResponse.json({ error: "Sesión no válida." }, { status: 401 });
  }

  // ── Leer historial de mensajes ─────────────────────────────────────────────
  let body: { messages?: { role: "user" | "assistant"; content: string }[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo no válido." }, { status: 400 });
  }

  const { messages = [] } = body;

  if (messages.length === 0) {
    return NextResponse.json({ error: "No hay mensajes." }, { status: 400 });
  }

  // ── Llamar a Groq con historial completo ───────────────────────────────────
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: "Servicio no configurado." }, { status: 503 });
  }

  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SISTEMA_GUSI },
        ...messages,
      ],
      temperature: 0.75,
      max_tokens: 1500,
    });

    const respuesta = completion.choices[0]?.message?.content ?? "Lo siento, no pude generar una respuesta. Inténtalo de nuevo.";

    return NextResponse.json({ respuesta });
  } catch (error) {
    console.error("[chat/gusi] Error:", (error as Error).message);
    return NextResponse.json(
      { error: "Error al conectar con la IA. Inténtalo en unos segundos." },
      { status: 500 }
    );
  }
}
