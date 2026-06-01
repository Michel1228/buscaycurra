/**
 * POST /api/cv/pdf-template
 * Recibe HTML del CV y devuelve un PDF real generado con Playwright/Chromium.
 * Chromium está instalado en el contenedor Docker (apk add chromium).
 */
import { NextRequest, NextResponse } from "next/server";
import { generateCVPdf } from "@/lib/cv-generator/generate-pdf";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { html } = await req.json() as { html?: string };

    if (!html || html.length < 100) {
      return NextResponse.json({ error: "HTML requerido" }, { status: 400 });
    }

    const pdfBuffer = await generateCVPdf(html);

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="CV_BuscayCurra.pdf"',
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[pdf-template]", (err as Error).message);
    return NextResponse.json({ error: "Error generando PDF" }, { status: 500 });
  }
}
