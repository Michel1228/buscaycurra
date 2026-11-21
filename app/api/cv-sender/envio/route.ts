/**
 * GET /api/cv-sender/envio?id=<id de la fila o de la cola> — Un envío, con todo lo que salió.
 *
 * POR QUÉ (21 nov 2026, Michel): al pulsar «Han visto tu CV», «Tu CV no llegó» o
 * «No se pudo enviar», la persona tiene que ver ESE envío: a qué empresa y a qué
 * correo, el puesto y la oferta, cómo ha ido (programado, enviado, entregado,
 * visto, sin llegar…), la carta de presentación y el CV que se mandaron.
 *
 * El id puede ser el de la fila de cv_sends (los avisos de «visto» y de rebote)
 * o el de la cola, «cv-...» (los de «enviado» y «falló» del worker). Solo lo
 * ve su dueño: se busca siempre con su user_id.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getUserId } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const COLA = /^cv-[\w-]{6,120}$/;

export async function GET(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id") || "";
  if (!UUID.test(id) && !COLA.test(id)) return NextResponse.json({ error: "Envío no válido" }, { status: 400 });

  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data, error } = await sb.from("cv_sends").select("*")
    .eq("user_id", userId).eq(UUID.test(id) ? "id" : "job_id", id)
    .order("created_at", { ascending: false }).limit(1);
  if (error) {
    console.error("[cv-sender/envio]", error.message);
    return NextResponse.json({ error: "No se pudo leer el envío" }, { status: 500 });
  }
  const e = data?.[0];
  if (!e) return NextResponse.json({ error: "No encontramos ese envío. Puede que lo quitaras de tu lista." }, { status: 404 });

  let cv: Record<string, unknown> | null = null;
  try { cv = e.cv_snapshot ? JSON.parse(e.cv_snapshot) : null; } catch { cv = null; }

  return NextResponse.json({
    envio: {
      id: e.id, colaJobId: e.job_id ?? null,
      empresa: e.company_name, correo: e.company_email, oferta: e.company_url ?? null, puesto: e.job_title ?? null,
      estado: e.status, creado: e.created_at, enviado: e.sent_at ?? null,
      entregado: e.entregado_en ?? null, rebotado: e.rebotado_en ?? null, motivoRebote: e.motivo_rebote ?? null,
      error: e.error_message ?? null, carta: e.cover_letter || null, cv,
    },
  });
}
