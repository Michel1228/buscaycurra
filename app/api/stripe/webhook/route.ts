/**
 * app/api/stripe/webhook/route.ts — API POST para webhooks de Stripe
 *
 * Recibe y procesa eventos de Stripe:
 *   - checkout.session.completed     → activa el plan pro o empresa
 *   - customer.subscription.updated  → refleja cambios de plan y estado
 *   - customer.subscription.deleted  → resetea el plan a 'free'
 *   - invoice.payment_failed         → marca la suscripción como past_due
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

    // ── Idempotencia: registrar el event.id antes de procesar ───────────────
    // Si Stripe reenvía el mismo evento, la inserción falla por UNIQUE y
    // devolvemos 200 OK sin re-ejecutar la lógica.
    const { error: errorIdempotencia } = await supabaseAdmin
      .from("stripe_webhook_events")
      .insert({ event_id: event.id, event_type: event.type });

    if (errorIdempotencia) {
      // Código 23505 = unique_violation en PostgreSQL
      const codigo = (errorIdempotencia as { code?: string }).code;
      if (codigo === "23505") {
        console.log(`[stripe/webhook] Evento duplicado ignorado: ${event.id}`);
        return NextResponse.json({ recibido: true, duplicado: true });
      }
      console.error("[stripe/webhook] Error registrando evento:", errorIdempotencia.message);
      // No abortamos: si la tabla aún no existe preferimos procesar el evento
      // a perderlo, pero queda el log para investigar.
    }

    // ── Procesar eventos de Stripe ───────────────────────────────────────────

    switch (event.type) {
      // ── Pago completado: activar el plan del usuario ──────────────────────
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const plan = session.metadata?.plan;

        if (!userId) {
          console.error("[stripe/webhook] checkout.session.completed sin userId en metadata");
          break;
        }

        if (!plan || (plan !== "pro" && plan !== "empresa")) {
          console.error("[stripe/webhook] checkout.session.completed con plan inválido en metadata:", plan);
          break;
        }

        // Obtener el plan real desde el precio de la suscripción (si hay line items)
        let planFinal = plan as "pro" | "empresa";

        // Si hay suscripción, obtener el price ID para determinar el plan exacto
        if (session.subscription) {
          try {
            const suscripcion = await getStripe().subscriptions.retrieve(
              session.subscription as string
            );
            const priceId = suscripcion.items.data[0]?.price.id;
            if (priceId) {
              const planDesdePrice = getPlanFromPriceId(priceId);
              if (planDesdePrice !== "free") {
                planFinal = planDesdePrice;
              }
            }
          } catch {
            // Si no podemos obtener el price, usamos el plan de metadata
          }
        }

        // Obtener datos de periodo si hay suscripción
        let subscriptionId: string | null = null;
        let currentPeriodEnd: string | null = null;
        if (session.subscription) {
          try {
            const suscripcion = await getStripe().subscriptions.retrieve(
              session.subscription as string
            );
            subscriptionId = suscripcion.id;
            if (suscripcion.items.data[0]?.current_period_end) {
              currentPeriodEnd = new Date(
                suscripcion.items.data[0].current_period_end * 1000
              ).toISOString();
            }
          } catch {
            // Si falla, seguimos sin estos datos
          }
        }

        // Actualizar el plan en el perfil del usuario
        const { error } = await supabaseAdmin
          .from("profiles")
          .upsert({
            id: userId,
            plan: planFinal,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: subscriptionId,
            subscription_status: "active",
            current_period_end: currentPeriodEnd,
            updated_at: new Date().toISOString(),
          });

        if (error) {
          console.error("[stripe/webhook] Error al actualizar plan:", error.message);
        } else {
          console.log(`[stripe/webhook] Plan '${planFinal}' activado para usuario ${userId}`);
        }
        break;
      }

      // ── Suscripción actualizada: reflejar cambios de plan o estado ───────
      case "customer.subscription.updated": {
        const suscripcion = event.data.object as Stripe.Subscription;
        const customerId = suscripcion.customer as string;

        // Determinar el plan actual según el price ID
        const priceId = suscripcion.items.data[0]?.price.id;
        const planActual = priceId ? getPlanFromPriceId(priceId) : "free";

        // Periodo actual (para mostrar "renueva el …" en la UI)
        const periodEndUnix = suscripcion.items.data[0]?.current_period_end;
        const currentPeriodEnd = periodEndUnix
          ? new Date(periodEndUnix * 1000).toISOString()
          : null;

        const { error: errorUpdate } = await supabaseAdmin
          .from("profiles")
          .update({
            plan: planActual,
            subscription_status: suscripcion.status,
            stripe_subscription_id: suscripcion.id,
            current_period_end: currentPeriodEnd,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_customer_id", customerId);

        if (errorUpdate) {
          console.error("[stripe/webhook] Error al actualizar suscripción:", errorUpdate.message);
        } else {
          console.log(
            `[stripe/webhook] Suscripción ${suscripcion.id} actualizada: plan=${planActual}, estado=${suscripcion.status}`
          );
        }
        break;
      }

      // ── Pago fallido: marcar estado como past_due (sin quitar el plan) ───
      // Stripe seguirá reintentando el cobro durante varios días. Solo cuando
      // agote los reintentos disparará subscription.deleted, y entonces sí
      // quitamos el plan. Mientras tanto, el usuario mantiene su acceso pero
      // el frontend puede avisarle con el estado past_due.
      case "invoice.payment_failed": {
        const factura = event.data.object as Stripe.Invoice;
        const customerId = factura.customer as string;

        const { error: errorFallo } = await supabaseAdmin
          .from("profiles")
          .update({
            subscription_status: "past_due",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_customer_id", customerId);

        if (errorFallo) {
          console.error("[stripe/webhook] Error marcando past_due:", errorFallo.message);
        } else {
          console.log(`[stripe/webhook] Pago fallido para customer ${customerId}, marcado past_due`);
        }
        break;
      }

      // ── Suscripción cancelada definitivamente: resetear a 'free' ─────────
      // Stripe dispara este evento al final del periodo pagado (cuando el
      // usuario canceló con cancel_at_period_end) o al agotar los reintentos
      // tras un pago fallido. En ambos casos, el acceso debe terminar aquí.
      case "customer.subscription.deleted": {
        const suscripcion = event.data.object as Stripe.Subscription;
        const customerId = suscripcion.customer as string;

        const { error: errorUpdate } = await supabaseAdmin
          .from("profiles")
          .update({
            plan: "free",
            subscription_status: "canceled",
            stripe_subscription_id: null,
            current_period_end: null,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_customer_id", customerId);

        if (errorUpdate) {
          console.error("[stripe/webhook] Error al resetear plan:", errorUpdate.message);
        } else {
          console.log(`[stripe/webhook] Plan reseteado a 'free' para customer ${customerId}`);
        }
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
