"use client";

/**
 * lib/cv-sender/mis-envios-cliente.ts — Los envíos de ESTA persona, para marcar
 * las ofertas (ver marca-envio.ts). Se lee con su sesión: cv_sends solo deja leer
 * las filas propias (RLS, migración 012), así que nunca aparece un envío ajeno.
 * Una sola lectura compartida por todas las tarjetas de la pantalla.
 */

import { getSupabaseBrowser } from "@/lib/supabase-browser";
import type { EnvioPropio } from "./marca-envio";

let guardado: { userId: string; p: Promise<EnvioPropio[]>; ts: number } | null = null;

export async function misEnvios(): Promise<EnvioPropio[]> {
  try {
    const sb = getSupabaseBrowser();
    const { data: { session } } = await sb.auth.getSession();
    if (!session) return [];
    const userId = session.user.id;
    // Otra persona en el mismo navegador no hereda la lista de la anterior.
    if (guardado && guardado.userId === userId && Date.now() - guardado.ts < 60_000) return guardado.p;
    const p = (async () => {
      const { data } = await sb.from("cv_sends")
        .select("company_email, company_url, company_name, job_title, status, sent_at, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1000);
      return (data ?? []) as EnvioPropio[];
    })().catch(() => [] as EnvioPropio[]);
    guardado = { userId, p, ts: Date.now() };
    return p;
  } catch { return []; }
}

/** Tras enviar: la próxima lectura vuelve a la base. */
export function olvidarMisEnvios(): void { guardado = null; }
