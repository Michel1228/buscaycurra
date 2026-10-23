/**
 * lib/metricas/contador.ts (servidor) — Los números del contador del escritorio
 * y del resumen diario por correo (23 oct 2026).
 */
import { createHmac } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { resumenPersonas, type ResumenPersonas } from "@/lib/metricas/personas";
import { suscriptoresDePago } from "@/lib/metricas/suscriptores";

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

  const { data: perfiles } = await sb.from("profiles").select("plan, subscription_status, plan_source, email");
  const dePago = await suscriptoresDePago(perfiles || []);

  return { generado: new Date().toISOString(), personas, dePago };
}
