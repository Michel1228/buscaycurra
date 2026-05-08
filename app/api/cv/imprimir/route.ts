import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generarCVHTML } from "@/lib/cv-generator/cv-template";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const userId = searchParams.get("userId");

  if (!userId) {
    return new NextResponse("Falta userId", { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data } = await supabase
    .from("profiles")
    .select("cv_data")
    .eq("id", userId)
    .single();

  const cvData = data?.cv_data;
  if (!cvData || !cvData.nombre) {
    return new NextResponse("No hay CV guardado", { status: 404 });
  }

  const html = generarCVHTML(cvData);

  // Inyectamos el auto-print dentro del <head> del HTML generado
  const htmlConPrint = html.replace(
    "</head>",
    `<script>window.onload = function() { setTimeout(function() { window.print(); }, 700); }</script></head>`
  );

  return new NextResponse(htmlConPrint, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
