import { chromium } from "playwright";
import { getCoverLetterCSS, getCoverLetterPageHTML, type CoverLetterData } from "./cover-letter-template";

// Flags estables para Chromium headless en Docker (sin --single-process que causa crashes)
const CHROMIUM_ARGS = [
  "--no-sandbox",
  "--disable-dev-shm-usage",
  "--disable-gpu",
  "--disable-setuid-sandbox",
  "--no-first-run",
  "--no-zygote",
];

export async function generateCVPdf(html: string): Promise<Buffer> {
  const executablePath = process.env.CHROMIUM_PATH || undefined;

  const browser = await chromium.launch({ executablePath, args: CHROMIUM_ARGS });

  try {
    const page = await browser.newPage();
    // waitUntil:"load" + espera 3s para que carguen imágenes externas (ej: foto desde Supabase)
    await page.setContent(html, { waitUntil: "load", timeout: 20000 });
    await page.waitForTimeout(3000);
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0mm", right: "0mm", bottom: "0mm", left: "0mm" },
    });
    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}

/**
 * Genera un PDF de 2 páginas: carta de presentación (página 1) + CV (página 2).
 * Usa un único HTML combinado con salto de página CSS entre ambas secciones.
 *
 * @param coverData - Datos para la página de carta de presentación
 * @param cvHtml    - HTML completo del CV (generado por generarCVHTML)
 */
export async function generateCombinedPdf(
  coverData: CoverLetterData,
  cvHtml: string
): Promise<Buffer> {
  const executablePath = process.env.CHROMIUM_PATH || undefined;

  // Extraer cuerpo y estilos del CV
  const cvBodyMatch  = cvHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const cvBodyContent = cvBodyMatch?.[1]?.trim() ?? "";
  const cvStyleMatch  = cvHtml.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
  const cvStyle       = cvStyleMatch?.[1] ?? "";
  const cvFontMatch   = cvHtml.match(/<link[^>]*fonts\.googleapis[^>]*>/i);
  const cvFontLink    = cvFontMatch?.[0] ?? "";

  const combinedHtml = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Candidatura — ${coverData.userName}</title>
${cvFontLink}
<style>
  * { margin:0; padding:0; box-sizing:border-box; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  body { font-family:'Montserrat',sans-serif; background:#fff; }

${getCoverLetterCSS(coverData.accent ?? "#3B5FE0")}

${cvStyle}

  /* Salto de página entre carta y CV */
  .page-break { page-break-after:always; break-after:page; }

  @page { size:A4 portrait; margin:0; }
  @media print {
    html, body { width:210mm; margin:0; padding:0; background:none; }
    .cl-page, .cv-page {
      width:210mm !important; height:297mm !important; max-height:297mm !important;
      overflow:hidden !important; box-shadow:none !important;
      page-break-inside:avoid !important; break-inside:avoid !important;
    }
    .page-break { page-break-after:always !important; break-after:page !important; }
  }
</style>
</head>
<body>
  <div class="page-break">
${getCoverLetterPageHTML(coverData)}
  </div>
${cvBodyContent}
</body>
</html>`;

  const browser = await chromium.launch({ executablePath, args: CHROMIUM_ARGS });

  try {
    const page = await browser.newPage();
    await page.setContent(combinedHtml, { waitUntil: "load", timeout: 25000 });
    // Espera para que carguen imágenes externas (foto de CV desde Supabase Storage)
    await page.waitForTimeout(3000);
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0mm", right: "0mm", bottom: "0mm", left: "0mm" },
    });
    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}
