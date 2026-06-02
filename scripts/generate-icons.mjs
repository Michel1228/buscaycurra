/**
 * generate-icons.mjs
 * Genera iconos PNG para PWA/stores a partir del logo SVG del gusano.
 * Uso: node scripts/generate-icons.mjs
 */
import { chromium } from "playwright";
import { writeFileSync, mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(__dirname, "..", "public");

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

// SVG del logo gusano — extraído de LogoGusano.tsx
const LOGO_SVG = `<svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="bodyGrad" cx="50%" cy="35%" r="55%">
      <stop offset="0%" stop-color="#4ade80"/>
      <stop offset="100%" stop-color="#00ff88" stop-opacity="0.85"/>
    </radialGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="1.5" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <circle cx="14" cy="50" r="10" fill="url(#bodyGrad)" filter="url(#glow)"/>
  <circle cx="14" cy="50" r="10" fill="none" stroke="#00ff88" stroke-width="0.8" stroke-opacity="0.5"/>
  <circle cx="26" cy="46" r="11" fill="url(#bodyGrad)" filter="url(#glow)"/>
  <circle cx="26" cy="46" r="11" fill="none" stroke="#00ff88" stroke-width="0.8" stroke-opacity="0.5"/>
  <circle cx="39" cy="44" r="11.5" fill="url(#bodyGrad)" filter="url(#glow)"/>
  <circle cx="39" cy="44" r="11.5" fill="none" stroke="#00ff88" stroke-width="0.8" stroke-opacity="0.5"/>
  <circle cx="52" cy="43" r="11" fill="url(#bodyGrad)" filter="url(#glow)"/>
  <circle cx="52" cy="43" r="11" fill="none" stroke="#00ff88" stroke-width="0.8" stroke-opacity="0.5"/>
  <circle cx="65" cy="40" r="13" fill="url(#bodyGrad)" filter="url(#glow)"/>
  <circle cx="65" cy="40" r="13" fill="none" stroke="#00ff88" stroke-width="1" stroke-opacity="0.6"/>
  <circle cx="60" cy="36" r="3.5" fill="#0a0a0a"/>
  <circle cx="60" cy="36" r="1.5" fill="#f0f0f0"/>
  <circle cx="61" cy="35" r="0.7" fill="#0a0a0a"/>
  <circle cx="69" cy="35" r="3.5" fill="#0a0a0a"/>
  <circle cx="69" cy="35" r="1.5" fill="#f0f0f0"/>
  <circle cx="70" cy="34" r="0.7" fill="#0a0a0a"/>
  <path d="M59 42 Q64.5 46 71 42" stroke="#0a0a0a" stroke-width="1.5" stroke-linecap="round" fill="none"/>
  <line x1="61" y1="28" x2="57" y2="18" stroke="#00ff88" stroke-width="1.2" stroke-linecap="round"/>
  <circle cx="57" cy="17" r="2.2" fill="#00ff88"/>
  <line x1="68" y1="27" x2="72" y2="16" stroke="#00ff88" stroke-width="1.2" stroke-linecap="round"/>
  <circle cx="72" cy="15" r="2.2" fill="#00ff88"/>
  <line x1="26" y1="56" x2="23" y2="63" stroke="#00ff88" stroke-width="1" stroke-linecap="round"/>
  <line x1="32" y1="57" x2="32" y2="64" stroke="#00ff88" stroke-width="1" stroke-linecap="round"/>
  <line x1="39" y1="55" x2="37" y2="62" stroke="#00ff88" stroke-width="1" stroke-linecap="round"/>
  <line x1="46" y1="54" x2="47" y2="61" stroke="#00ff88" stroke-width="1" stroke-linecap="round"/>
  <line x1="52" y1="54" x2="54" y2="61" stroke="#00ff88" stroke-width="1" stroke-linecap="round"/>
</svg>`;

function buildHtml(size) {
  const padding = Math.round(size * 0.1);
  const logoSize = size - padding * 2;
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${size}px;height:${size}px;overflow:hidden;
  background:#0f1a0a;display:flex;align-items:center;justify-content:center;
  border-radius:${Math.round(size * 0.22)}px}
svg{width:${logoSize}px;height:${logoSize}px}
</style></head>
<body>${LOGO_SVG.replace('width="80" height="80"', `width="${logoSize}" height="${logoSize}"`)}</body>
</html>`;
}

async function main() {
  mkdirSync(PUBLIC, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage();

  for (const size of SIZES) {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(buildHtml(size), { waitUntil: "networkidle" });
    const buffer = await page.screenshot({ type: "png", clip: { x: 0, y: 0, width: size, height: size } });
    const dest = path.join(PUBLIC, `icon-${size}.png`);
    writeFileSync(dest, buffer);
    console.log(`✅ icon-${size}.png`);
  }

  // Icono maskable (fondo plano, sin bordes redondeados — para Android adaptive icons)
  for (const size of [192, 512]) {
    await page.setViewportSize({ width: size, height: size });
    const padding = Math.round(size * 0.15);
    const logoSize = size - padding * 2;
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
*{margin:0;padding:0}html,body{width:${size}px;height:${size}px;overflow:hidden;
background:#0f1a0a;display:flex;align-items:center;justify-content:center}
svg{width:${logoSize}px;height:${logoSize}px}</style></head>
<body>${LOGO_SVG.replace('width="80" height="80"', `width="${logoSize}" height="${logoSize}"`)}</body></html>`;
    await page.setContent(html, { waitUntil: "networkidle" });
    const buffer = await page.screenshot({ type: "png", clip: { x: 0, y: 0, width: size, height: size } });
    writeFileSync(path.join(PUBLIC, `icon-${size}-maskable.png`), buffer);
    console.log(`✅ icon-${size}-maskable.png`);
  }

  // Feature graphic 1024x500 para Google Play
  await page.setViewportSize({ width: 1024, height: 500 });
  await page.setContent(`<!DOCTYPE html><html><head><meta charset="utf-8"><style>
*{margin:0;padding:0}html,body{width:1024px;height:500px;overflow:hidden;
background:linear-gradient(135deg,#0f1a0a 0%,#1a2e0f 50%,#0f1a0a 100%);
display:flex;align-items:center;justify-content:center;gap:40px;font-family:system-ui,sans-serif}
.logo svg{width:160px;height:160px}
.text h1{color:#7ed56f;font-size:52px;font-weight:900;letter-spacing:-1px;margin:0}
.text p{color:#b0a890;font-size:20px;margin-top:8px}
.text small{color:#7ed56f;font-size:14px;opacity:0.7}
</style></head>
<body>
<div class="logo">${LOGO_SVG.replace('width="80" height="80"', 'width="160" height="160"')}</div>
<div class="text">
  <h1>BuscayCurra</h1>
  <p>Encuentra trabajo con IA</p>
  <small>Envía tu CV automáticamente · 19 países</small>
</div>
</body></html>`, { waitUntil: "networkidle" });
  const fg = await page.screenshot({ type: "png", clip: { x: 0, y: 0, width: 1024, height: 500 } });
  writeFileSync(path.join(PUBLIC, "feature-graphic.png"), fg);
  console.log("✅ feature-graphic.png (1024×500 Google Play)");

  await browser.close();
  console.log("\n🎉 Todos los iconos generados en /public/");
}

main().catch(e => { console.error(e); process.exit(1); });
