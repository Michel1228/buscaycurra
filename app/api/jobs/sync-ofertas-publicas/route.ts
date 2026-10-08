/**
 * /api/jobs/sync-ofertas-publicas — Ofertas de Lanbide y del SEF de Murcia.
 *
 * Desde el crontab del servidor (scripts/vps/sync-ofertas-publicas.sh), dos
 * veces al día: las ofertas públicas cierran plazo en pocos días. Cada fuente
 * va por separado; una que falle no toca sus ofertas de ayer.
 * Ver lib/job-search/ofertas-publicas.ts.
 *
 * ?fuente=lanbide para sincronizar solo una.
 */
import { NextRequest, NextResponse } from "next/server";
import { secretIguales } from "@/lib/secret-compare";
import {
  descargarOfertas, guardarOfertas, TODAS_LAS_FUENTES_OFERTAS, type FuenteOfertas,
} from "@/lib/job-search/ofertas-publicas";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  if (!secretIguales(req.headers.get("x-sync-secret"), process.env.ADMIN_SECRET)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const pedida = new URL(req.url).searchParams.get("fuente");
  const fuentes = pedida ? TODAS_LAS_FUENTES_OFERTAS.filter(f => f === pedida) : TODAS_LAS_FUENTES_OFERTAS;
  if (fuentes.length === 0) return NextResponse.json({ error: `Fuente desconocida: ${pedida}` }, { status: 400 });

  const resultado: Record<string, unknown> = {};
  let fallidas = 0;
  for (const fuente of fuentes as FuenteOfertas[]) {
    const inicio = new Date();
    try {
      const ofertas = await descargarOfertas(fuente);
      resultado[fuente] = { ok: true, ...(await guardarOfertas(fuente, ofertas, inicio)) };
    } catch (e) {
      fallidas++;
      resultado[fuente] = { ok: false, error: (e as Error).message.slice(0, 300) };
      console.error(`[ofertas-publicas] ${fuente}:`, (e as Error).message);
    }
  }
  return NextResponse.json({ resultado }, { status: fallidas === fuentes.length ? 502 : 200 });
}
