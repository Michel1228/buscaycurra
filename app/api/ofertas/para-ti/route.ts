/**
 * GET /api/ofertas/para-ti — Ofertas según el CV de quien pregunta.
 *
 * Para el buscador, antes de buscar (17 oct 2026, idea de Michel: "recomendar
 * ofertas siempre está bien, pero por el currículum, no al tuntún"). Las saca
 * lib/job-search/ofertas-para-ti.ts, la misma que la portada.
 *
 * estado: "ok" | "sin-cv" (el CV no dice de qué ha trabajado) | "sin-ofertas"
 * (lo dice, pero ahora no hay ofertas de eso en su zona). Sin CV no se
 * recomienda nada: se le pide que lo rellene.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getPool } from "@/lib/db";
import { getUserId } from "@/lib/auth-server";
import { ofertasParaTi } from "@/lib/job-search/ofertas-para-ti";
import { patronesDelCv, puestosDelCv } from "@/lib/job-search/puestos-del-cv";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const { rows } = await getPool().query(
      "SELECT form_data FROM user_cvs WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 1",
      [userId]
    );
    const cv = rows[0]?.form_data ?? null;
    if (!patronesDelCv(cv).length) return NextResponse.json({ estado: "sin-cv", ofertas: [], puestos: [] });

    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { data: perfil } = await sb.from("profiles").select("ciudad").eq("id", userId).maybeSingle();
    const lista = await ofertasParaTi(cv, perfil?.ciudad, 6);

    return NextResponse.json({
      estado: lista.length ? "ok" : "sin-ofertas",
      puestos: puestosDelCv(cv).slice(0, 3),
      ofertas: lista.map((o) => ({
        id: o.id,
        titulo: o.titulo,
        empresa: o.empresa || "Ver en oferta",
        ubicacion: o.ubicacion || "",
        salario: o.salario && o.salario !== "Ver en oferta" ? o.salario : "",
        descripcion: o.descripcion || "",
        fuente: o.fuente || "",
        url: o.url || "",
        fecha: o.fecha || undefined,
        emailEmpresa: o.emailEmpresa || undefined,
        emailConfianza: o.emailConfianza || undefined,
      })),
    });
  } catch (e) {
    console.error("[ofertas/para-ti]", (e as Error).message);
    return NextResponse.json({ estado: "error", ofertas: [], puestos: [] }, { status: 500 });
  }
}
