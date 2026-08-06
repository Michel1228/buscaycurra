/**
 * app/api/cuenta/limpiar-historial/route.ts — API endpoint DELETE para limpiar historial
 *
 * Oculta (hidden=true) los registros de cv_sends del usuario cuyo estado sea
 * 'completed', 'failed', 'enviado', 'fallido' o 'cancelado' (terminados).
 * Los trabajos pendientes ('pendiente', 'processing') NO se tocan.
 *
 * NO borra físicamente: la cuota de envíos se calcula contando filas, así que
 * un borrado real permitiría resetear el límite del plan en bucle.
 *
 * Solo acepta peticiones DELETE autenticadas.
 * Devuelve el número de registros ocultados.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ─── Estados que se consideran "terminados" y se pueden borrar ────────────────
// Estos estados corresponden a envíos completados o fallidos definitivamente.
// Los estados 'pendiente' y 'processing' no se borran.
const ESTADOS_BORRAR = ["completed", "failed", "enviado", "fallido", "cancelado"];

// ─── DELETE /api/cuenta/limpiar-historial ────────────────────────────────────

export async function DELETE(request: NextRequest) {
  // ─── Cliente con clave anónima (para verificar sesión del usuario) ──────
  const supabasePublico = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // ─── Cliente con service role (para tener permisos de escritura) ────────
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  try {
    // ── Verificar autenticación del usuario ────────────────────────────────
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "No autorizado. Debes iniciar sesión para realizar esta acción." },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7); // Quitar "Bearer "

    // Verificar el token con Supabase
    const { data: { user }, error: authError } = await supabasePublico.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Sesión no válida. Por favor, inicia sesión de nuevo." },
        { status: 401 }
      );
    }

    const userId = user.id;

    // ── Contar cuántos registros se van a borrar (para informar al usuario) ─
    const { count: totalABorrar } = await supabaseAdmin
      .from("cv_sends")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .in("status", ESTADOS_BORRAR);

    // ── Ocultar los registros completados/fallidos del usuario ─────────────
    // Soft-delete (hidden=true), NO borrado físico: el límite de envíos se
    // calcula contando filas de cv_sends, así que borrarlas de verdad dejaba a
    // cualquier usuario resetear su cuota a cero llamando aquí en bucle.
    // Mismo criterio que /api/cv-sender/delete; el historial ya filtra hidden
    // (lib/cv-sender/tracker.ts) así que el usuario los sigue sin ver.
    const { error: errorBorrar } = await supabaseAdmin
      .from("cv_sends")
      .update({ hidden: true })
      .eq("user_id", userId)
      .in("status", ESTADOS_BORRAR);

    if (errorBorrar) {
      console.error("[limpiar historial] Error al borrar registros:", errorBorrar.message);
      return NextResponse.json(
        { error: "No se pudo limpiar el historial. Por favor, inténtalo de nuevo." },
        { status: 500 }
      );
    }

    // ── Respuesta de éxito ─────────────────────────────────────────────────
    const registrosBorrados = totalABorrar ?? 0;

    return NextResponse.json(
      {
        success: true,
        registrosBorrados,
        mensaje: registrosBorrados > 0
          ? `Se han borrado ${registrosBorrados} registro(s) del historial.`
          : "No había registros que limpiar. El historial ya estaba vacío.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[limpiar historial] Error inesperado:", (error as Error).message);
    return NextResponse.json(
      { error: "Error interno del servidor. Por favor, inténtalo de nuevo." },
      { status: 500 }
    );
  }
}
