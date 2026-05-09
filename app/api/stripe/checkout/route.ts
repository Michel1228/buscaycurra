import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getStripe, PLANES } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Sesión no válida." }, { status: 401 });
    }

    const body = await request.json() as { plan?: string };
    const plan = body.plan;

    if (plan !== "esencial" && plan !== "basico" && plan !== "pro" && plan !== "empresa") {
      return NextResponse.json({ error: "Plan no válido." }, { status: 400 });
    }

    // Comprobar si el usuario ya tiene ese plan activo
    const { data: perfil } = await supabaseAdmin
      .from("profiles")
      .select("plan, stripe_customer_id")
      .eq("id", user.id)
      .single();

    if (perfil?.plan === plan) {
      return NextResponse.json({ error: `Ya tienes el plan ${plan} activo.` }, { status: 400 });
    }

    const PLANES_ORDEN = ["free", "esencial", "basico", "pro", "empresa"];
    const planActualIdx = PLANES_ORDEN.indexOf(perfil?.plan || "free");
    const planNuevoIdx = PLANES_ORDEN.indexOf(plan);

    // Si ya tiene un plan de pago activo, no permitir contratar otro sin cancelar primero
    if (planActualIdx > 0 && planNuevoIdx <= planActualIdx) {
      return NextResponse.json({
        error: `Ya tienes el plan ${perfil?.plan} activo. Cancela tu suscripción actual antes de cambiar.`
      }, { status: 400 });
    }

    const priceId =
      plan === "esencial" ? PLANES.ESENCIAL :
      plan === "basico"   ? PLANES.BASICO   :
      plan === "pro"      ? PLANES.PRO       :
      PLANES.EMPRESA;

    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ??
      `${request.nextUrl.protocol}//${request.nextUrl.host}`;

    const sessionParams: Parameters<typeof getStripe().checkout.sessions.create>[0] = {
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/app/pago-exitoso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/precios`,
      metadata: { userId: user.id, plan },
      ...(user.email ? { customer_email: user.email } : {}),
    };

    // Si ya tiene customer_id en Stripe, reutilizarlo para no duplicar clientes
    if (perfil?.stripe_customer_id) {
      (sessionParams as Record<string, unknown>).customer = perfil.stripe_customer_id;
      delete (sessionParams as Record<string, unknown>).customer_email;
    }

    const session = await getStripe().checkout.sessions.create(sessionParams);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[stripe/checkout] Error:", (error as Error).message);
    return NextResponse.json({ error: "No se pudo crear la sesión de pago." }, { status: 500 });
  }
}
