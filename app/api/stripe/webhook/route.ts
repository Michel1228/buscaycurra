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
import { Resend } from "resend";

// ─── Necesario: deshabilitar el body parser de Next.js para webhooks ──────────
// Stripe necesita el body en bruto para verificar la firma
export const runtime = "nodejs";

const NOMBRES_PLAN: Record<string, string> = {
  esencial: "Esencial — 2,99€/mes",
  basico:   "Básico — 4,99€/mes",
  pro:      "Pro — 9,99€/mes",
  empresa:  "Empresa — 49,99€/mes",
};

async function enviarEmailConfirmacion(emailDestino: string, plan: string) {
  if (!process.env.RESEND_API_KEY) return;
  const resend = new Resend(process.env.RESEND_API_KEY);
  const nombrePlan = NOMBRES_PLAN[plan] ?? plan;
  await resend.emails.send({
    from: process.env.FROM_EMAIL ?? "noreply@buscaycurra.es",
    to: emailDestino,
    subject: `✅ Tu plan ${plan.charAt(0).toUpperCase() + plan.slice(1)} ya está activo — BuscayCurra`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#0f1117;color:#f1f5f9;padding:32px;border-radius:12px">
        <div style="text-align:center;margin-bottom:24px">
          <span style="font-size:32px">🐛</span>
          <h1 style="color:#22c55e;margin:8px 0 4px">¡Pago confirmado!</h1>
          <p style="color:#94a3b8;margin:0">BuscayCurra</p>
        </div>
        <div style="background:#161922;border:1px solid #2d3142;border-radius:8px;padding:20px;margin-bottom:20px">
          <p style="margin:0 0 8px;color:#64748b;font-size:13px">Plan activado</p>
          <p style="margin:0;font-size:18px;font-weight:700;color:#22c55e">${nombrePlan}</p>
        </div>
        <p style="color:#94a3b8;font-size:14px;line-height:1.6">
          Tu suscripción está activa. Puedes acceder a todas las funciones de tu plan desde la aplicación.
        </p>
        <div style="text-align:center;margin-top:24px">
          <a href="https://buscaycurra.es/app/gusi"
             style="background:#22c55e;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">
            Ir a BuscayCurra →
          </a>
        </div>
        <p style="color:#475569;font-size:12px;margin-top:24px;text-align:center">
          Puedes gestionar tu suscripción en cualquier momento desde <a href="https://buscaycurra.es/app/perfil" style="color:#22c55e">Mi cuenta</a>.
        </p>
      </div>
    `,
  }).catch(err => console.error("[stripe/webhook] Error enviando email:", err));
}

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
          // Enviar email de confirmación
          const emailCliente = session.customer_details?.email ?? (session.customer_email as string | null);
          if (emailCliente) {
            await enviarEmailConfirmacion(emailCliente, planFinal);
          }
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
