/**
 * app/api/stripe/portal/route.ts — API POST para abrir el Customer Portal
 *
 * El Customer Portal es una página hospedada por Stripe donde el usuario
 * puede:
 *   - Actualizar su método de pago
 *   - Ver y descargar facturas
 *   - Cambiar de plan (si configuras los productos en Stripe)
 *   - Cancelar la suscripción
 *
 * Auth: requiere Authorization: Bearer <supabase_access_token>.
 * Devuelve: { url } con la URL temporal del portal (usar y redirigir).
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getStripe } from "@/lib/stripe";

// ─── POST /api/stripe/portal ──────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // ─── Cliente Supabase con clave anónima (para verificar sesión) ───────────
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // ─── Cliente Supabase con service role (para leer stripe_customer_id) ─────
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // ── Verificar autenticación ────────────────────────────────────────────
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "No autorizado. Debes iniciar sesión." },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Sesión no válida. Inicia sesión de nuevo." },
        { status: 401 }
      );
    }

    // ── Buscar el customer_id de Stripe en el perfil ───────────────────────
    const { data: perfil, error: errorPerfil } = await supabaseAdmin
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    if (errorPerfil || !perfil?.stripe_customer_id) {
      return NextResponse.json(
        { error: "No tienes una suscripción activa que gestionar." },
        { status: 400 }
      );
    }

    // ── URL de retorno después de salir del portal ─────────────────────────
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ??
      `${request.nextUrl.protocol}//${request.nextUrl.host}`;

    // ── Crear la sesión del Customer Portal ────────────────────────────────
    const session = await getStripe().billingPortal.sessions.create({
      customer: perfil.stripe_customer_id,
      return_url: `${baseUrl}/app/perfil`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[stripe/portal] Error:", (error as Error).message);
    return NextResponse.json(
      { error: "No se pudo abrir el portal de gestión. Inténtalo de nuevo." },
      { status: 500 }
    );
  }
}
