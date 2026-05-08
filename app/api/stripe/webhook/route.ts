/**
 * app/api/stripe/webhook/route.ts — API POST para webhooks de Stripe
 *
 * Recibe y procesa eventos de Stripe:
 *   - checkout.session.completed → activa el plan pro o empresa en el perfil
 *   - customer.subscription.deleted → resetea el plan a 'free'
 *
 * IMPORTANTE: usa el body raw (sin parsear) para verificar la firma del webhook.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getStripe, getPlanFromPriceId } from "@/lib/stripe";
import Stripe from "stripe";

// ─── Necesario: deshabilitar el body parser de Next.js para webhooks ──────────
// Stripe necesita el body en bruto para verificar la firma
export const runtime = "nodejs";

// ─── POST /api/stripe/webhook ─────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // ─── Cliente Supabase con service role (para actualizar perfiles) ─────────
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // ── Obtener el body raw para verificar la firma de Stripe ────────────────
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Falta la firma del webhook." },
        { status: 400 }
      );
    }

    // ── Verificar la firma del webhook con el secreto configurado ────────────
    let event: Stripe.Event;
    try {
      event = getStripe().webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err) {
      console.error("[stripe/webhook] Firma no válida:", (err as Error).message);
      return NextResponse.json(
        { error: "Firma del webhook no válida." },
        { status: 400 }
      );
    }

    // ── Procesar eventos de Stripe ───────────────────────────────────────────

    const PLANES_VALIDOS = ["esencial", "basico", "pro", "empresa"] as const;
    type PlanPago = typeof PLANES_VALIDOS[number];

    // Obtiene el plan desde un price ID o metadata, garantizando que sea válido
    async function resolverPlan(
      planMetadata: string | undefined,
      subscriptionId: string | null | undefined
    ): Promise<PlanPago | null> {
      // Intentar obtener desde el price ID real de Stripe (más fiable)
      if (subscriptionId) {
        try {
          const sub = await getStripe().subscriptions.retrieve(subscriptionId as string);
          const priceId = sub.items.data[0]?.price.id;
          const planDesdePrice = priceId ? getPlanFromPriceId(priceId) : "free";
          if ((PLANES_VALIDOS as readonly string[]).includes(planDesdePrice)) {
            return planDesdePrice as PlanPago;
          }
        } catch { /* fallback a metadata */ }
      }
      if (planMetadata && (PLANES_VALIDOS as readonly string[]).includes(planMetadata)) {
        return planMetadata as PlanPago;
      }
      return null;
    }

    // Actualiza el plan de un usuario por customerId
    async function actualizarPlanPorCustomer(customerId: string, nuevoPlan: string) {
      const { error } = await supabaseAdmin
        .from("profiles")
        .update({ plan: nuevoPlan, updated_at: new Date().toISOString() })
        .eq("stripe_customer_id", customerId);
      if (error) {
        console.error(`[stripe/webhook] Error actualizando plan a '${nuevoPlan}' para customer ${customerId}:`, error.message);
      } else {
        console.log(`[stripe/webhook] Plan '${nuevoPlan}' aplicado a customer ${customerId}`);
      }
    }

    switch (event.type) {
      // ── Pago completado: activar el plan del usuario ──────────────────────
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;

        if (!userId) {
          console.error("[stripe/webhook] checkout.session.completed sin userId en metadata");
          break;
        }

        const planFinal = await resolverPlan(session.metadata?.plan, session.subscription as string | null);
        if (!planFinal) {
          console.error("[stripe/webhook] Plan no reconocido en metadata:", session.metadata?.plan);
          break;
        }

        const { error } = await supabaseAdmin
          .from("profiles")
          .upsert({
            id: userId,
            plan: planFinal,
            stripe_customer_id: session.customer as string,
            updated_at: new Date().toISOString(),
          });

        if (error) {
          console.error("[stripe/webhook] Error al activar plan:", error.message);
        } else {
          console.log(`[stripe/webhook] Plan '${planFinal}' activado para usuario ${userId}`);
        }
        break;
      }

      // ── Suscripción actualizada: el usuario cambió de plan ────────────────
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        const priceId = sub.items.data[0]?.price.id;

        if (!priceId) break;

        const planActualizado = getPlanFromPriceId(priceId);
        if (!(PLANES_VALIDOS as readonly string[]).includes(planActualizado)) break;

        await actualizarPlanPorCustomer(customerId, planActualizado);
        break;
      }

      // ── Suscripción cancelada: resetear el plan a 'free' ─────────────────
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;

        const { data: perfiles, error: errorBusqueda } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .limit(1);

        if (errorBusqueda || !perfiles?.length) {
          console.error("[stripe/webhook] No se encontró usuario con customer_id:", customerId);
          break;
        }

        await actualizarPlanPorCustomer(customerId, "free");
        break;
      }

      // ── Otros eventos: los ignoramos ──────────────────────────────────────
      default:
        console.log(`[stripe/webhook] Evento ignorado: ${event.type}`);
    }

    // ── Respuesta de confirmación a Stripe ───────────────────────────────────
    return NextResponse.json({ recibido: true });
  } catch (error) {
    console.error("[stripe/webhook] Error inesperado:", (error as Error).message);
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
