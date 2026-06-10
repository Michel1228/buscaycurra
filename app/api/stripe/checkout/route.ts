/**
 * app/api/stripe/checkout/route.ts — Crea sesión de pago con Stripe
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getStripe, PLANES } from "@/lib/stripe";

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

    if (plan !== "basico" && plan !== "esencial" && plan !== "pro" && plan !== "empresa") {
      return NextResponse.json({ error: "Plan no válido." }, { status: 400 });
    }

    // ⛔ Bloquear suscripción duplicada — si ya tiene plan activo, no permitir comprar otra vez
    const { data: perfil } = await supabaseAdmin
      .from("profiles")
      .select("plan, subscription_status")
      .eq("id", user.id)
      .single();

    if (perfil?.subscription_status === "active" && perfil?.plan !== "free") {
      return NextResponse.json({
        error: `Ya tienes el plan ${perfil.plan === "basico" ? "Básico" : perfil.plan === "esencial" ? "Esencial" : perfil.plan === "pro" ? "Pro" : "Empresa"} activo. Puedes gestionarlo en tu perfil.`
      }, { status: 409 });
    }

    const priceId =
      plan === "basico" ? PLANES.BASICO :
      plan === "esencial" ? PLANES.ESENCIAL :
      plan === "pro" ? PLANES.PRO :
      PLANES.EMPRESA;

    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ??
      `${request.nextUrl.protocol}//${request.nextUrl.host}`;

    const session = await getStripe().checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/app/pago-exitoso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/precios`,
      metadata: { userId: user.id, plan },
      ...(user.email ? { customer_email: user.email } : {}),
      // 7 días gratis solo en Pro
      ...(plan === "pro" ? { subscription_data: { trial_period_days: 7 } } : {}),
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[stripe/checkout]", (error as Error).message);
    return NextResponse.json({ error: "No se pudo crear la sesión de pago." }, { status: 500 });
  }
}
