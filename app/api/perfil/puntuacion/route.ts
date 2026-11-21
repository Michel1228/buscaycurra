/**
 * GET /api/perfil/puntuacion — La puntuación del propio candidato y qué le falta.
 *
 * La misma que ven las empresas verificadas (lib/empresas/reglas.ts): solo
 * hechos comprobables. Así cada uno sabe por qué sale antes o después y qué
 * puede hacer para mejorarla.
 */
import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth-server";
import { fichaPropia } from "@/lib/empresas/candidatos";
import { NIVELES } from "@/lib/empresas/reglas";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    const f = await fichaPropia(userId);
    if (!f) return NextResponse.json({ puntuacion: null, visible: false });
    return NextResponse.json({
      puntuacion: { ...f.puntuacion, nivelTexto: NIVELES[f.puntuacion.nivel] },
      visible: f.visible,
      referencias: f.referencias,
    });
  } catch (e) {
    console.error("[perfil/puntuacion]:", (e as Error).message);
    return NextResponse.json({ error: "No se pudo calcular" }, { status: 500 });
  }
}
