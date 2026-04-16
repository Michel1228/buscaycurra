/**
 * app/api/cv/mejorar/route.ts — API para mejorar CV con IA
 *
 * Recibe:  cvText (texto del CV) y jobTitle (puesto objetivo)
 *          tipo: "cv" (por defecto) | "carta" (para generar carta de presentación)
 * Proceso: verifica autenticación → enruta a la IA más adecuada (Groq/Gemini)
 * Devuelve: el CV mejorado o carta de presentación generada
 *
 * Colores de marca: azul #2563EB y naranja #F97316.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { enrutarMejoraCV, enrutarPeticionIA } from "@/lib/ai/ai-router";

// ─── Handler POST ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // ── Verificar autenticación del usuario ───────────────────────────────────
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Obtener el token de autorización de la cabecera
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (token) {
    // Verificar que el token es válido
    const { error: authError } = await supabase.auth.getUser(token);
    if (authError) {
      return NextResponse.json(
        { error: "No autorizado. Por favor, inicia sesión." },
        { status: 401 }
      );
    }
  }

  // ── Leer y validar el cuerpo de la petición ───────────────────────────────

  let body: { cvText?: string; jobTitle?: string; tipo?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Cuerpo de la petición no válido" },
      { status: 400 }
    );
  }

  const { cvText, jobTitle = "", tipo = "cv" } = body;

  // Validar que hay texto del CV
  if (!cvText || !cvText.trim()) {
    return NextResponse.json(
      { error: "El texto del CV no puede estar vacío" },
      { status: 400 }
    );
  }

  // Limitar tamaño del CV para evitar abusos (máximo ~50.000 caracteres)
  if (cvText.length > 50000) {
    return NextResponse.json(
      { error: "El CV es demasiado largo. Máximo 50.000 caracteres." },
      { status: 400 }
    );
  }

  try {
    let resultado;

    if (tipo === "carta") {
      // ── Generar carta de presentación ─────────────────────────────────
      console.log(`✉️  Generando carta de presentación para puesto: ${jobTitle}`);
      resultado = await enrutarPeticionIA("carta-presentacion", cvText, {
        puesto: jobTitle,
      });
    } else {
      // ── Mejorar CV (enruta automáticamente según longitud) ─────────────
      console.log(`📄 Mejorando CV para puesto: ${jobTitle}`);
      resultado = await enrutarMejoraCV(cvText, jobTitle);
    }

    return NextResponse.json({
      cvMejorado: resultado.respuesta,
      iaUsada: resultado.iaUsada,
      tiempoMs: resultado.tiempoMs,
    });
  } catch (error) {
    const mensaje = (error as Error).message;
    console.error("❌ Error al mejorar CV:", mensaje);

    // Mensajes de error en español según el tipo de fallo
    if (mensaje.includes("LIMIT")) {
      return NextResponse.json(
        { error: "La IA ha alcanzado su límite diario. Vuelve a intentarlo mañana." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: "Error al procesar tu CV. Inténtalo de nuevo." },
      { status: 500 }
    );
  }
}
