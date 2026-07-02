/**
 * screenshot-appstore-final.mjs — Capturas para App Store Connect (Guideline 2.3.3)
 *
 * Genera capturas en los DOS tamaños exactos que Apple exige y que faltaban:
 *   - iPhone 6.5"  → 1284 x 2778 px  (viewport 428x926  @ deviceScaleFactor 3)
 *   - iPad 13"     → 2064 x 2752 px  (viewport 1032x1376 @ deviceScaleFactor 2)
 *
 * Muestran la app EN USO (pantallas internas reales), no marketing ni login,
 * tal y como pide Apple.
 *
 * Uso:
 *   SCREENSHOT_EMAIL=tu@email SCREENSHOT_PASSWORD=tuClave node screenshot-appstore-final.mjs
 *
 * (Las credenciales van por variables de entorno; no se hardcodean en el script.)
 */
import { chromium } from "playwright";

const BASE = process.env.SCREENSHOT_BASE_URL || "https://buscaycurra.es";
const EMAIL = process.env.SCREENSHOT_EMAIL;
const PASSWORD = process.env.SCREENSHOT_PASSWORD;

if (!EMAIL || !PASSWORD) {
  console.error("❌ Faltan credenciales. Ejecuta:");
  console.error('   SCREENSHOT_EMAIL="tu@email" SCREENSHOT_PASSWORD="tuClave" node screenshot-appstore-final.mjs');
  process.exit(1);
}

// Pantallas internas que muestran la app en uso (core features)
const PANTALLAS = [
  { slug: "guzzi", ruta: "/app/gusi" },
  { slug: "buscar", ruta: "/app/buscar" },
  { slug: "pipeline", ruta: "/app/pipeline" },
  { slug: "salarios", ruta: "/app/salarios" },
  { slug: "envios", ruta: "/app/envios" },
];

const DISPOSITIVOS = [
  { prefijo: "iphone65", viewport: { width: 428, height: 926 }, dsf: 3, isMobile: true },
  { prefijo: "ipad13", viewport: { width: 1032, height: 1376 }, dsf: 2, isMobile: false },
];

async function aceptarCookies(page) {
  try {
    const btn = page.locator('[aria-label="Banner de consentimiento de cookies"] button:has-text("Aceptar")');
    await btn.waitFor({ state: "visible", timeout: 4000 });
    await btn.click({ force: true });
    await page.waitForTimeout(600);
  } catch { /* no hay banner */ }
}

async function capturarDispositivo(browser, disp) {
  const ctx = await browser.newContext({
    viewport: disp.viewport,
    deviceScaleFactor: disp.dsf,
    isMobile: disp.isMobile,
    hasTouch: true,
  });
  const page = await ctx.newPage();

  // ── Login ──────────────────────────────────────────────────────────────
  await page.goto(`${BASE}/auth/login`, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(1200);
  await aceptarCookies(page);
  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', PASSWORD);
  await aceptarCookies(page);
  await page.click('button[type="submit"]', { force: true });
  await page.waitForTimeout(5000);
  console.log(`[${disp.prefijo}] login → ${page.url()}`);

  // ── Capturar cada pantalla ─────────────────────────────────────────────
  let n = 1;
  for (const p of PANTALLAS) {
    await page.goto(`${BASE}${p.ruta}`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(3000);
    await aceptarCookies(page);
    const nombre = `${disp.prefijo}-${String(n).padStart(2, "0")}-${p.slug}.png`;
    await page.screenshot({ path: nombre, fullPage: false });
    console.log(`  ✓ ${nombre} (${disp.viewport.width * disp.dsf}x${disp.viewport.height * disp.dsf})`);
    n++;
  }

  await ctx.close();
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  for (const disp of DISPOSITIVOS) {
    await capturarDispositivo(browser, disp);
  }
  await browser.close();
  console.log("\n✅ Capturas generadas para iPhone 6.5\" (1284x2778) e iPad 13\" (2064x2752).");
}

main().catch((e) => { console.error(e); process.exit(1); });
