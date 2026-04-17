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

        // Actualizar el plan en el perfil del usuario
        const { error } = await supabaseAdmin
          .from("profiles")
          .upsert({
            id: userId,
            plan: planFinal,
            stripe_customer_id: session.customer as string,
            updated_at: new Date().toISOString(),
          });

        if (error) {
          console.error("[stripe/webhook] Error al actualizar plan:", error.message);
        } else {
          console.log(`[stripe/webhook] Plan '${planFinal}' activado para usuario ${userId}`);
        }
        break;
      }

      // ── Suscripción cancelada: resetear el plan a 'free' ─────────────────
      case "customer.subscription.deleted": {
        const suscripcion = event.data.object as Stripe.Subscription;
        const customerId = suscripcion.customer as string;

        // Buscar el usuario por su stripe_customer_id
        const { data: perfiles, error: errorBusqueda } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .limit(1);

        if (errorBusqueda || !perfiles?.length) {
          console.error("[stripe/webhook] No se encontró usuario con customer_id:", customerId);
          break;
        }

        // Resetear el plan a 'free'
        const { error: errorUpdate } = await supabaseAdmin
          .from("profiles")
          .update({
            plan: "free",
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
