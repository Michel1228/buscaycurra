/**
 * lib/metricas/contador.ts (servidor) — Los números del contador del escritorio
 * y del resumen diario por correo (23 oct 2026).
 */
import { createHmac } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { resumenPersonas, type ResumenPersonas } from "@/lib/metricas/personas";

/**
 * Clave SOLO DE LECTURA para el contador del ordenador de Michel. Sale de
 * ADMIN_SECRET pero no lo revela: si alguien la copiara del ordenador, solo
 * podría ver estos números, no usar el resto de /api/admin.
 */
export function claveContador(): string | null {
  const s = process.env.ADMIN_SECRET;
  return s ? createHmac("sha256", s).update("contador-escritorio").digest("base64url").slice(0, 40) : null;
}

export type NumerosContador = {
  generado: string;
  personas: ResumenPersonas;
  /** Suscriptores que pagan de verdad; null si no se pudo preguntar. */
  dePago: number | null;
};

export async function numerosDelContador(): Promise<NumerosContador> {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const personas = await resumenPersonas(sb);

  // Los suscriptores los cuenta /api/admin/metricas (Stripe más iPhone, sin las
  // cuentas de prueba): se le pregunta a él para no tener esa regla dos veces.
  let dePago: number | null = null;
  try {
    const r = await fetch(`http://127.0.0.1:${process.env.PORT || 3000}/api/admin/metricas`, {
      headers: { "x-admin-secret": process.env.ADMIN_SECRET || "" },
      cache: "no-store",
      signal: AbortSignal.timeout(25000),
    });
    if (r.ok) {
      const m = await r.json() as { suscriptores?: { activos?: number | null } };
      dePago = m.suscriptores?.activos ?? null;
    }
  } catch (e) {
    console.error("[contador] suscriptores:", (e as Error).message);
  }

  return { generado: new Date().toISOString(), personas, dePago };
}
