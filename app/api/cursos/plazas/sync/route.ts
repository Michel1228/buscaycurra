/**
 * /api/cursos/plazas/sync — Descarga las plazas de cursos de los servicios
 * públicos de empleo y las guarda en curso_plaza.
 *
 * Se lanza una vez al día desde el crontab del servidor
 * (scripts/vps/sync-plazas-cursos.sh, 06:20 UTC) con la cabecera
 * x-sync-secret. NO desde GitHub Actions: en esta rama los workflows
 * programados no se ejecutan (ver scripts/vps/README.md).
 *
 * Cada fuente va por separado y en su propio try: que el SOC no responda no
 * puede dejar sin actualizar Lanbide, ni borrar las plazas del SOC de ayer.
 * El resultado dice qué fuente falló y por qué, para verlo en el log.
 *
 * ?fuente=lanbide sincroniza solo una (para probar sin descargarlas todas).
 */
import { NextRequest, NextResponse } from "next/server";
import { secretIguales } from "@/lib/secret-compare";
import { descargarFuente, TODAS_LAS_FUENTES, type FuentePlaza } from "@/lib/cursos/plazas/fuentes";
import { guardarFuente, limpiarTerminadas, resumenPlazas } from "@/lib/cursos/plazas/db";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  if (!secretIguales(req.headers.get("x-sync-secret"), process.env.ADMIN_SECRET)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const pedida = new URL(req.url).searchParams.get("fuente");
  const fuentes = pedida
    ? TODAS_LAS_FUENTES.filter(f => f === pedida)
    : TODAS_LAS_FUENTES;
  if (fuentes.length === 0) {
    return NextResponse.json({ error: `Fuente desconocida: ${pedida}` }, { status: 400 });
  }

  const ahora = new Date();
  const resultado: Record<string, { ok: boolean; guardadas?: number; retiradas?: number; error?: string }> = {};

  for (const fuente of fuentes as FuentePlaza[]) {
    try {
      const plazas = await descargarFuente(fuente);
      const { guardadas, retiradas } = await guardarFuente(fuente, plazas, ahora);
      resultado[fuente] = { ok: true, guardadas, retiradas };
    } catch (e) {
      resultado[fuente] = { ok: false, error: (e as Error).message.slice(0, 300) };
      console.error(`[cursos/plazas/sync] ${fuente}:`, (e as Error).message);
    }
  }

  const terminadasBorradas = await limpiarTerminadas();
  const resumen = await resumenPlazas();
  const fallidas = Object.entries(resultado).filter(([, r]) => !r.ok).map(([f]) => f);

  // 200 aunque falle alguna: las demás sí se guardaron. Solo es error si no
  // salió ninguna, que es cuando el workflow debe ponerse en rojo.
  return NextResponse.json(
    { resultado, fallidas, terminadasBorradas, porEmpezar: resumen.porEmpezar },
    { status: fallidas.length === fuentes.length ? 502 : 200 }
  );
}
