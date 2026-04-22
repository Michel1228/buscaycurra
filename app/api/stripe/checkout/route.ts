/**
 * app/api/stripe/checkout/route.ts — API POST para crear sesión de pago con Stripe
 *
 * Verifica que el usuario esté autenticado, crea una sesión de Stripe Checkout
 * para el plan solicitado (pro o empresa) y devuelve la URL de pago.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getStripe, PLANES } from "@/lib/stripe";

export const dynamic = "force-dynamic";

// ─── POST /api/stripe/checkout ────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // ─── Cliente Supabase con clave anónima (para verificar sesión) ───────────
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  try {
    // ── Verificar autenticación del usuario ─────────────────────────────────
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "No autorizado. Debes iniciar sesión para continuar." },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7); // Eliminar "Bearer "
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Sesión no válida. Por favor, inicia sesión de nuevo." },
        { status: 401 }
      );
    }

    // ── Obtener el plan solicitado del body ─────────────────────────────────
    const body = await request.json() as { plan?: string };
    const plan = body.plan;

    if (plan !== "pro" && plan !== "empresa") {
      return NextResponse.json(
        { error: "Plan no válido. Elige 'pro' o 'empresa'." },
        { status: 400 }
      );
    }

    // ── Seleccionar el price ID según el plan ───────────────────────────────
    const priceId = plan === "pro" ? PLANES.PRO : PLANES.EMPRESA;

    // ── Construir las URLs de retorno ───────────────────────────────────────
    // Usamos NEXT_PUBLIC_SITE_URL si está definida, si no usamos la URL del request
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ??
      `${request.nextUrl.protocol}//${request.nextUrl.host}`;

    // ── Crear la sesión de Stripe Checkout ──────────────────────────────────
    const session = await getStripe().checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      // URL de éxito: incluye el session_id para confirmación
      success_url: `${baseUrl}/app/pago-exitoso?session_id={CHECKOUT_SESSION_ID}`,
      // URL de cancelación: volver a la página de precios
      cancel_url: `${baseUrl}/precios`,
      // Metadata: guardamos el userId para el webhook
      metadata: {
        userId: user.id,
        plan,
      },
      // Email del cliente para prellenar el formulario de Stripe (solo si está disponible)
      ...(user.email ? { customer_email: user.email } : {}),
    });

    // ── Devolver la URL de la sesión de pago ────────────────────────────────
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[stripe/checkout] Error al crear sesión:", (error as Error).message);
    return NextResponse.json(
      { error: "No se pudo crear la sesión de pago. Por favor, inténtalo de nuevo." },
      { status: 500 }
    );
  }
}
