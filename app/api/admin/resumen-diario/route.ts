/**
 * POST /api/admin/resumen-diario — El correo de cada mañana para Michel: cuántas
 * personas hay, cuántas han entrado ayer y de dónde vienen (23 oct 2026).
 *
 * Lo pide el crontab del servidor después del centinela
 * (scripts/vps/resumen-diario.sh), que le pasa cómo le ha ido:
 * ?centinela=28 pasan, 4 fallan. Va a ADMIN_EMAILS y a RESUMEN_DIARIO_EMAILS.
 *
 * RESUMEN_DIARIO_EMAILS (5 nov 2026): quien recibe este correo y puede abrir el
 * panel de métricas, pero NO es administrador: no le llegan los avisos del
 * centinela ni del vigilante, ni las ofertas de empresas. Es el socio. Las
 * direcciones van en el .env.local del servidor, nunca aquí: el repositorio
 * es público.
 */
import { NextRequest, NextResponse } from "next/server";
import { secretIguales } from "@/lib/secret-compare";
import { numerosDelContador } from "@/lib/metricas/contador";
import { sendResumenDiarioEmail } from "@/lib/email/smtp-sender";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  if (!secretIguales(req.headers.get("x-sync-secret"), process.env.ADMIN_SECRET)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const destinos = [...new Set(
    `${process.env.ADMIN_EMAILS || process.env.NEXT_PUBLIC_ADMIN_EMAIL || ""},${process.env.RESUMEN_DIARIO_EMAILS || ""}`
      .split(",").map((e) => e.trim().toLowerCase()).filter(Boolean)
  )];
  if (!destinos.length) return NextResponse.json({ error: "Falta ADMIN_EMAILS" }, { status: 500 });

  const m = (req.nextUrl.searchParams.get("centinela") || "").match(/(\d+) pasan, (\d+) fallan/);
  const centinela = m ? { pasan: Number(m[1]), fallan: Number(m[2]) } : null;

  try {
    const numeros = await numerosDelContador();
    const enviados = await sendResumenDiarioEmail({ destinos, numeros, centinela });
    return NextResponse.json({ enviados, personas: numeros.personas.reales, ayer: numeros.personas.ayer });
  } catch (e) {
    console.error("[resumen-diario]", (e as Error).message);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
