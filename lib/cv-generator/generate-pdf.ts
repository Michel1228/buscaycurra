import { chromium } from "playwright";

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
    await page.emulateMedia({ media: "print" });
    // waitUntil:"load" + espera 3s para que carguen imágenes externas (ej: foto desde Supabase)
    await page.setContent(html, { waitUntil: "load", timeout: 20000 });
    await page.waitForTimeout(3000);

    // ── Ajuste a UNA sola página A4 ──
    // Si el contenido desborda (típico tras "mejorar con IA"), se mide y se escala para
    // que quepa entero en un folio, en vez de partirse en una 2ª hoja o recortarse.
    await page.evaluate(() => {
      const A4_W = 794;              // 210mm @ 96dpi
      const A4_H = 1122;             // 297mm @ 96dpi
      const el = document.querySelector(".cv-page") as HTMLElement | null;
      if (!el) return;

      // Neutralizar las restricciones que las plantillas ponen para el modo combinado
      // (algunas fuerzan height:297mm !important en @media print → recortarían el CV).
      const imp = (prop: string, val: string) => el.style.setProperty(prop, val, "important");
      imp("min-height", "0");
      imp("max-height", "none");
      imp("height", "auto");
      imp("overflow", "visible");
      imp("box-shadow", "none");
      imp("margin", "0");
      document.body.style.setProperty("margin", "0", "important");
      document.body.style.setProperty("padding", "0", "important");
      document.body.style.setProperty("display", "block", "important");
      document.body.style.setProperty("background", "#fff", "important");

      // Envolver en un contenedor de tamaño A4 EXACTO → el layout ocupa 1 página
      const wrap = document.createElement("div");
      wrap.style.cssText = `width:${A4_W}px;height:${A4_H}px;overflow:hidden;background:#fff;`;
      el.parentNode!.insertBefore(wrap, el);
      wrap.appendChild(el);

      // Primera estimación de escala con el ancho natural
      const h0 = el.getBoundingClientRect().height;
      let escala = Math.min(1, (A4_H * 0.98) / h0);

      if (escala < 1) {
        // Al ensanchar el contenido refluye (más corto): re-medimos para aprovechar
        // mejor el folio y que la letra no salga más pequeña de lo necesario.
        imp("width", `${A4_W / escala}px`);
        imp("max-width", "none");
        const h1 = el.getBoundingClientRect().height;
        escala = Math.min(1, (A4_H * 0.98) / h1);
        imp("width", `${A4_W / escala}px`);
        el.style.transformOrigin = "top left";
        el.style.transform = `scale(${escala})`;
      } else {
        imp("width", `${A4_W}px`);
        imp("max-width", "none");
        imp("min-height", `${A4_H}px`);
      }
    });
    await page.waitForTimeout(200);

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      pageRanges: "1",   // red de seguridad: jamás una 2ª hoja
      margin: { top: "0mm", right: "0mm", bottom: "0mm", left: "0mm" },
    });
    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}
