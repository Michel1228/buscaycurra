/**
 * GET /api/onboarding/estado — Qué le falta a quien acaba de llegar.
 *
 * Devuelve los tres pasos del primer día calculados contra los datos reales.
 * Lo pinta components/PrimerDia.tsx en el panel mientras no estén los tres.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getUserId } from "@/lib/auth-server";
import { estadoPrimerDia } from "@/lib/onboarding/primer-dia";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    return NextResponse.json(await estadoPrimerDia(supabase, userId));
  } catch (error) {
    console.error("[onboarding/estado] Error:", (error as Error).message);
    // Sin estado no se enseña la tarjeta: es mejor no dar la turra que dar una
    // lista de pasos equivocada a quien ya los ha hecho.
    return NextResponse.json({ error: "No se pudo calcular" }, { status: 500 });
  }
}
