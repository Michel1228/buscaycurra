/**
 * /api/metricas/visita-ficha — Cuánta gente ve las fichas públicas de oferta
 * (/empleo/oferta/[id]) y cuánta pulsa el botón de enviar el CV, por día y
 * separando lo que llega desde Google.
 *
 * POR QUÉ (12 nov 2026). Nueve de cada diez altas entran por una ficha de
 * oferta, pero no se contaban las visitas: no había forma de saber cuánta
 * gente llega y se va sin registrarse, ni si un cambio en la ficha lo mejora.
 *
 * POST { tipo: "vista" | "clic", google: boolean } — lo manda la propia ficha
 * (components/MedirFicha.tsx). No guarda nada de la persona: solo suma 1 a un
 * contador del día en Redis. Los robots (Googlebot y compañía también ejecutan
 * JavaScript) no cuentan.
 *
 * GET — los últimos 14 días, solo con x-admin-secret.
 */
import { NextRequest, NextResponse } from "next/server";
import { incrementar, get } from "@/lib/cache/redis-client";
import { secretIguales } from "@/lib/secret-compare";

export const dynamic = "force-dynamic";

const ROBOT = /bot|crawl|spider|slurp|bingpreview|lighthouse|headless|google-inspectiontool|facebookexternalhit|preview/i;
const DIAS_GUARDADOS = 70;
const clave = (fecha: string, tipo: string, google: boolean) => `fichas:${fecha}:${tipo}:${google ? "google" : "otro"}`;
const hoy = () => new Date().toISOString().slice(0, 10);

export async function POST(req: NextRequest) {
  if (ROBOT.test(req.headers.get("user-agent") || "")) return new NextResponse(null, { status: 204 });
  const body = await req.json().catch(() => null) as { tipo?: unknown; google?: unknown } | null;
  const tipo = body?.tipo === "clic" ? "clic" : body?.tipo === "vista" ? "vista" : null;
  if (!tipo) return new NextResponse(null, { status: 400 });
  await incrementar(clave(hoy(), tipo, body?.google === true), DIAS_GUARDADOS * 86400).catch(() => 0);
  return new NextResponse(null, { status: 204 });
}

export async function GET(req: NextRequest) {
  if (!secretIguales(req.headers.get("x-admin-secret"), process.env.ADMIN_SECRET)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const dias = [];
  for (let i = 13; i >= 0; i--) {
    const fecha = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    const n = async (tipo: string, google: boolean) => Number(await get(clave(fecha, tipo, google)).catch(() => null) || 0);
    dias.push({
      fecha,
      vistasGoogle: await n("vista", true), vistasOtras: await n("vista", false),
      clicsGoogle: await n("clic", true), clicsOtros: await n("clic", false),
    });
  }
  return NextResponse.json({ dias }, { headers: { "Cache-Control": "no-store" } });
}
