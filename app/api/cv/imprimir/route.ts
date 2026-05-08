import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { generarCVHTML } from "@/lib/cv-generator/cv-template";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const userId = searchParams.get("userId");

  if (!userId) {
    return new NextResponse("Falta userId", { status: 400 });
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

    const cvData = typeof result.rows[0].form_data === "string"
      ? JSON.parse(result.rows[0].form_data)
      : result.rows[0].form_data;

    if (!cvData.nombre) {
      return new NextResponse("CV sin datos suficientes", { status: 404 });
    }

    const html = generarCVHTML(cvData);
    const htmlConPrint = html.replace(
      "</head>",
      `<script>window.onload = function() { setTimeout(function() { window.print(); }, 700); }</script></head>`
    );

    return new NextResponse(htmlConPrint, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (err) {
    console.error("[cv/imprimir]", err);
    return new NextResponse("Error interno", { status: 500 });
  }
}
