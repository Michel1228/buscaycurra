/**
 * POST /api/auth/registro-cortado — La página de registro avisa de que Supabase
 * ha cortado un registro por su límite de correos por hora.
 *
 * Solo suma un contador del día en Redis; el centinela lo lee cada mañana
 * (lib/centinela/limites-correo.ts). Sin esto, un registro cortado no dejaba
 * rastro en ningún sitio nuestro y nadie se enteraba (6 oct 2026).
 */
import { NextRequest, NextResponse } from "next/server";
import { incrementar } from "@/lib/cache/redis-client";
import { checkUserRateLimit } from "@/lib/rate-limit-user";
import { claveRegistroCortado } from "@/lib/centinela/limites-correo";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // Tope por IP: que nadie pueda inflar el contador desde fuera.
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "desconocida";
  if (!(await checkUserRateLimit("registro-cortado", ip, 5, 3600))) return NextResponse.json({ ok: true });
  await incrementar(claveRegistroCortado(new Date().toISOString().slice(0, 10)), 3 * 86400);
  console.warn("[registro-cortado] Supabase ha cortado un registro por su límite de correos por hora");
  return NextResponse.json({ ok: true });
}
