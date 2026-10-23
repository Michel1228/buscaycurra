/**
 * GET /api/admin/contador — Los números de BuscayCurra para el contador del
 * escritorio de Michel (scripts/escritorio/contador-buscaycurra.ps1).
 *
 * Se entra con la clave solo de lectura del contador (cabecera x-contador, ver
 * lib/metricas/contador.ts) o con ADMIN_SECRET (x-admin-secret).
 */
import { NextRequest, NextResponse } from "next/server";
import { secretIguales } from "@/lib/secret-compare";
import { claveContador, numerosDelContador } from "@/lib/metricas/contador";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const autorizado = secretIguales(req.headers.get("x-contador"), claveContador())
    || secretIguales(req.headers.get("x-admin-secret"), process.env.ADMIN_SECRET);
  if (!autorizado) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    return NextResponse.json(await numerosDelContador(), { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("[contador]", (e as Error).message);
    return NextResponse.json({ error: "No se pudieron reunir los números" }, { status: 500 });
  }
}
