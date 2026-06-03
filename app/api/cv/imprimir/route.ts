import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { generarCVHTML } from "@/lib/cv-generator/cv-template";
import { normalizar } from "@/lib/cv-generator/normalizar";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  // Obtener userId del token de sesión, no del query param
  let userId: string | null = null;
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => request.cookies.getAll().map(c => ({ name: c.name, value: c.value })) } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id || null;
  } catch {
    // fallback: si falla la autenticación, usar query param (compatibilidad)
    userId = request.nextUrl.searchParams.get("userId");
  }

  if (!userId) {
    return new NextResponse("No autorizado", { status: 401 });
  }

  try {
    const pool = getPool();
    const result = await pool.query(
      `SELECT form_data FROM user_cvs WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0 || !result.rows[0].form_data) {
      return new NextResponse("No hay CV guardado", { status: 404 });
    }

    const raw = typeof result.rows[0].form_data === "string"
      ? JSON.parse(result.rows[0].form_data)
      : result.rows[0].form_data;

    const cvData = normalizar(raw);

    if (!cvData.nombre) {
      return new NextResponse("CV sin nombre", { status: 404 });
    }

    const html = generarCVHTML(cvData);
    const htmlConPrint = html.replace(
      "</head>",
      `<script>window.onload=function(){setTimeout(function(){window.print();},700);}</script></head>`
    );

    return new NextResponse(htmlConPrint, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (err) {
    console.error("[cv/imprimir]", err);
    return new NextResponse("Error interno", { status: 500 });
  }
}
