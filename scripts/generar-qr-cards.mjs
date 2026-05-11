import QRCode from "qrcode";
import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT = join(ROOT, "public", "qr-cards.html");
const URL_APP = "https://buscaycurra.es";

// Lee una imagen local y la convierte en data URL base64
function imagenBase64(nombreArchivo) {
  const ruta = join(ROOT, nombreArchivo);
  const buffer = readFileSync(ruta);
  const base64 = buffer.toString("base64");
  return `data:image/jpeg;base64,${base64}`;
}

const TARJETAS = [
  {
    titulo: "Matrix Guzzi",
    subtitulo: "Toma la pastilla verde",
    cta: "El trabajo que buscas ya existe",
    imagen: "matrix.jpeg",
  },
  {
    titulo: "Super Saiyan Guzzi",
    subtitulo: "Poder nivel 9000",
    cta: "Tu próximo empleo te está esperando",
    imagen: "dragon bol z.jpeg",
  },
  {
    titulo: "Breaking Bud",
    subtitulo: "I am the one who crawls",
    cta: "Somos la IA que encuentra tu trabajo",
    imagen: "Breaking bud.jpeg",
  },
  {
    titulo: "Guzzi al Rescate",
    subtitulo: "El héroe de tu búsqueda",
    cta: "BuscayCurra encuentra empleo por ti",
    imagen: "esta nose que peli es.jpeg",
  },
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
      <div class="card-bg" style="background-image: url('${imgDataUrl}');"></div>
      <div class="card-overlay"></div>
      <div class="card-content">
        <div class="card-top-badge">
          <span class="dot">🐛</span>
          <span class="brand-name">BuscayCurra</span>
        </div>
        <div class="card-bottom">
          <div class="card-text">
            <div class="card-title">${t.titulo}</div>
            <div class="card-sub">${t.subtitulo}</div>
            <div class="card-cta">${t.cta}</div>
            <div class="card-url">${URL_APP}</div>
          </div>
          <div class="qr-box">
            <img src="${qrDataUrl}" alt="QR BuscayCurra" class="qr-img" />
            <div class="qr-label">Escanea</div>
          </div>
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
    background: #1a1d27;
    font-family: 'Segoe UI', Arial, sans-serif;
    padding: 32px 24px;
  }

  h1 {
    text-align: center;
    font-size: 13px;
    color: #64748b;
    margin-bottom: 28px;
    letter-spacing: 2px;
    text-transform: uppercase;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 24px;
    max-width: 860px;
    margin: 0 auto;
  }

  .card {
    position: relative;
    border-radius: 20px;
    overflow: hidden;
    aspect-ratio: 3 / 4;
    border: 1.5px solid rgba(34, 197, 94, 0.3);
    box-shadow: 0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04);
    break-inside: avoid;
    page-break-inside: avoid;
  }

  .card-bg {
    position: absolute;
    inset: 0;
    background-size: cover;
    background-position: center top;
    background-repeat: no-repeat;
    transform: scale(1.02);
  }

  .card-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to bottom,
      rgba(0,0,0,0.05) 0%,
      rgba(0,0,0,0.1) 40%,
      rgba(10,12,20,0.88) 65%,
      rgba(10,12,20,0.98) 100%
    );
  }

  .card-content {
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;
    padding: 16px;
  }

  .card-top-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: rgba(0,0,0,0.55);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(34,197,94,0.4);
    border-radius: 30px;
    padding: 5px 12px 5px 8px;
    width: fit-content;
  }

  .dot { font-size: 16px; }

  .brand-name {
    font-size: 12px;
    font-weight: 800;
    color: #22c55e;
    letter-spacing: 0.4px;
  }

  .card-bottom {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 12px;
  }

  .card-text { flex: 1; min-width: 0; }

  .card-title {
    font-size: 20px;
    font-weight: 800;
    color: #f1f5f9;
    line-height: 1.2;
    margin-bottom: 4px;
    text-shadow: 0 2px 8px rgba(0,0,0,0.8);
  }

  .card-sub {
    font-size: 11px;
    color: #22c55e;
    font-style: italic;
    margin-bottom: 8px;
    letter-spacing: 0.2px;
  }

  .card-cta {
    font-size: 10px;
    color: #cbd5e1;
    line-height: 1.5;
    margin-bottom: 8px;
  }

  .card-url {
    font-size: 9px;
    color: #22c55e;
    font-family: monospace;
    letter-spacing: 0.3px;
    opacity: 0.9;
  }

  .qr-box {
    flex-shrink: 0;
    text-align: center;
  }

  .qr-img {
    display: block;
    width: 80px;
    height: 80px;
    background: white;
    border-radius: 10px;
    padding: 5px;
    box-shadow: 0 0 16px rgba(34,197,94,0.4);
  }

  .qr-label {
    font-size: 8px;
    color: #64748b;
    text-align: center;
    margin-top: 4px;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }

  @media print {
    body { background: white; padding: 10mm; }
    h1 { color: #6b7280; margin-bottom: 6mm; }
    .grid { grid-template-columns: repeat(2, 1fr); gap: 6mm; max-width: 100%; }
    .card { border: 1pt solid #22c55e; box-shadow: none; }
    .card-overlay {
      background: linear-gradient(
        to bottom,
        rgba(0,0,0,0.0) 0%,
        rgba(0,0,0,0.05) 40%,
        rgba(10,12,20,0.82) 65%,
        rgba(10,12,20,0.95) 100%
      );
    }
  }
</style>
</head>
<body>

<h1>BuscayCurra — Tarjetas QR · ${URL_APP}</h1>

<div class="grid">
${tarjetasHTML}
</div>

<p style="text-align:center;font-size:11px;color:#64748b;margin-top:24px;padding-bottom:8px;">
  Ctrl+P para imprimir · Recorta y coloca junto a la imagen correspondiente
</p>

</body>
</html>`;

  writeFileSync(OUT, html, "utf8");
  console.log(`✅ Generado: ${OUT}`);
  console.log(`   Abre en el navegador y pulsa Ctrl+P para imprimir.`);
}

main().catch(console.error);
