import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth-server";
import { darBienvenida } from "@/lib/onboarding/dar-bienvenida";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // Autenticación obligatoria: extraer userId del token, no del body
    const userId = await getUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const cuerpo = await req.json().catch(() => ({})) as {
      nombre?: string; ciudad?: string; ref?: string;
    };
    // Lo que hace está en lib/onboarding/dar-bienvenida.ts, que comparte con la
    // red de seguridad del servidor (/api/auth/bienvenidas-pendientes).
    const r = await darBienvenida(userId, cuerpo);
    return NextResponse.json(r, { status: r.ok ? 200 : 404 });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
