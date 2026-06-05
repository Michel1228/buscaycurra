import QRCode from "qrcode";
import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT = join("C:/Users/miche/OneDrive/Escritorio", "qr-cards.html");
const URL_APP = "https://buscaycurra.es";

// Lee una imagen local y la convierte en data URL base64
function imagenBase64(nombreArchivo) {
  const ruta = join(ROOT, nombreArchivo);
  const buffer = readFileSync(ruta);
  const base64 = buffer.toString("base64");
  return `data:image/jpeg;base64,${base64}`;
}

const TARJETAS = [
  { imagen: "matrix.jpeg" },
  { imagen: "dragon bol z.jpeg" },
  { imagen: "Breaking bud.jpeg" },
  { imagen: "esta nose que peli es.jpeg" },
  { imagen: "rey leon.jpeg" },
];

async function generarQRsvg(url) {
  return await QRCode.toString(url, {
    type: "svg",
    margin: 1,
    color: { dark: "#0f1117", light: "#ffffff" },
    width: 180,
  });
}

async function main() {
  const qrSvg = await generarQRsvg(URL_APP);
  const qrB64 = Buffer.from(qrSvg).toString("base64");
  const qrDataUrl = `data:image/svg+xml;base64,${qrB64}`;

  const tarjetasHTML = TARJETAS.map((t) => {
    const imgDataUrl = imagenBase64(t.imagen);
    return `
    <div class="card">
      <img class="card-img" src="${imgDataUrl}" alt="" />
      <div class="card-footer">
        <img src="${qrDataUrl}" class="qr" alt="QR" />
        <div class="footer-text">
          <div class="brand">🐛 BuscayCurra</div>
          <div class="url">${URL_APP}</div>
          <div class="scan">Escanea para buscar trabajo con IA</div>
        </div>
      </div>
    </div>`;
  }).join("\n");

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<title>QR Cards — BuscayCurra</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: #111;
    font-family: 'Segoe UI', Arial, sans-serif;
    padding: 24px;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
    max-width: 1060px;
    margin: 0 auto;
  }

  .card {
    background: #000;
    border-radius: 16px;
    overflow: hidden;
    border: 2px solid #22c55e;
    break-inside: avoid;
    page-break-inside: avoid;
  }

  .card-img {
    display: block;
    width: 100%;
    height: auto;
    object-fit: cover;
  }

  .card-footer {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 16px;
    background: #000;
  }

  .qr {
    width: 80px;
    height: 80px;
    flex-shrink: 0;
    background: #fff;
    border-radius: 8px;
    padding: 4px;
  }

  .footer-text {
    flex: 1;
  }

  .brand {
    font-size: 15px;
    font-weight: 800;
    color: #22c55e;
    margin-bottom: 3px;
  }

  .url {
    font-size: 12px;
    color: #fff;
    font-family: monospace;
    margin-bottom: 4px;
  }

  .scan {
    font-size: 10px;
    color: #6b7280;
    line-height: 1.4;
  }

  @media print {
    body { background: #fff; padding: 8mm; }
    .grid { grid-template-columns: repeat(2, 1fr); gap: 8mm; max-width: 100%; }
    .card { border: 1.5pt solid #22c55e; }
    .card-footer { background: #fff; }
    .brand { color: #16a34a; }
    .url { color: #000; }
  }
</style>
</head>
<body>
<div class="grid">
${tarjetasHTML}
</div>
</body>
</html>`;

  writeFileSync(OUT, html, "utf8");
  console.log(`✅ Generado: ${OUT}`);
  console.log(`   Abre en el navegador y pulsa Ctrl+P para imprimir.`);
}

main().catch(console.error);
