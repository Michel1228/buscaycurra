/**
 * GET /api/entrevistas/sector — De qué sector preguntar en el simulador.
 *
 * Según el CV: quien ha trabajado de camarera de pisos ensaya preguntas de
 * limpieza, no las de "general". Antes salía del sector del perfil, que casi
 * nadie tiene relleno, y solo había cinco sectores.
 *
 * → { sector, puesto, origen: "cv" | "perfil" | null }
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getPool } from "@/lib/db";
import { getUserId } from "@/lib/auth-server";
import { puestosDelCv } from "@/lib/job-search/puestos-del-cv";
import { sectorDePerfil, sectorDePuestos } from "@/lib/entrevistas/preguntas";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const { rows } = await getPool().query(
      "SELECT form_data FROM user_cvs WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 1",
      [userId]
    );
    const puestos = puestosDelCv(rows[0]?.form_data ?? null);
    const delCv = sectorDePuestos(puestos);
    if (delCv) return NextResponse.json({ sector: delCv, puesto: puestos[0] ?? null, origen: "cv" });

    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { data: perfil } = await sb.from("profiles").select("sector").eq("id", userId).maybeSingle();
    const delPerfil = sectorDePerfil(perfil?.sector);
    return NextResponse.json({ sector: delPerfil ?? "general", puesto: null, origen: delPerfil ? "perfil" : null });
  } catch (e) {
    console.error("[entrevistas/sector]", (e as Error).message);
    return NextResponse.json({ sector: "general", puesto: null, origen: null });
  }
}
