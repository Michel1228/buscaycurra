/**
 * Exploración de buscaycurra.es con Playwright
 * Recorre landing, login, y todas las rutas /app/* haciendo screenshots
 */

import { chromium } from "playwright";
import { existsSync, mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", "tmp-screenshots");
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

const BASE = "https://buscaycurra.es";
const EMAIL = "michelbatistagonzalez1992@gmail.com";
const PASSWORD = "hugoyrubi1228";

let sc = 0;
async function shot(page, name) {
  sc++;
  const file = path.join(OUT, `${String(sc).padStart(2,"0")}-${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  console.log(`  📸 ${file}`);
  return file;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  });
  const page = await ctx.newPage();

  // ── 1. Landing ──────────────────────────────────────────────────────────────
  console.log("\n🌍 Landing page");
  await page.goto(BASE, { waitUntil: "networkidle", timeout: 30000 });
  await shot(page, "landing-top");
  // Scroll a secciones
  await page.evaluate(() => window.scrollTo(0, 600));
  await page.waitForTimeout(500);
  await shot(page, "landing-mid");
  await page.evaluate(() => window.scrollTo(0, 1400));
  await page.waitForTimeout(500);
  await shot(page, "landing-bottom");

  // ── 2. Precios ─────────────────────────────────────────────────────────────
  console.log("\n💶 Precios");
  await page.goto(`${BASE}/precios`, { waitUntil: "networkidle", timeout: 20000 });
  await shot(page, "precios");

  // ── 3. Login ────────────────────────────────────────────────────────────────
  console.log("\n🔐 Login");
  await page.goto(`${BASE}/auth/login`, { waitUntil: "networkidle", timeout: 20000 });
  await shot(page, "login-form");

  // Intentar login
  try {
    await page.fill('input[type="email"]', EMAIL, { timeout: 5000 });
    await page.fill('input[type="password"]', PASSWORD, { timeout: 5000 });
    await shot(page, "login-filled");
    await page.click('button[type="submit"]', { timeout: 5000 });
    await page.waitForTimeout(3000);
    await shot(page, "login-result");
  } catch (e) {
    console.log("  ⚠️  No pudo hacer login:", e.message);
  }

  // ── 4. /app rutas ───────────────────────────────────────────────────────────
  const rutas = [
    { path: "/app", name: "app-inicio" },
    { path: "/app/buscar", name: "app-buscar" },
    { path: "/app/curriculum", name: "app-curriculum" },
    { path: "/app/envios", name: "app-envios" },
    { path: "/app/entrevistas", name: "app-entrevistas" },
    { path: "/app/perfil", name: "app-perfil" },
  ];

  for (const ruta of rutas) {
    console.log(`\n📄 ${ruta.path}`);
    try {
      await page.goto(`${BASE}${ruta.path}`, { waitUntil: "networkidle", timeout: 20000 });
      await page.waitForTimeout(1500);
      await shot(page, ruta.name);
      // Scroll para ver más contenido
      await page.evaluate(() => window.scrollTo(0, 400));
      await page.waitForTimeout(500);
      await shot(page, `${ruta.name}-scroll`);
    } catch (e) {
      console.log(`  ⚠️  Error en ${ruta.path}:`, e.message);
    }
  }

  // ── 5. Empresas ─────────────────────────────────────────────────────────────
  console.log("\n🏢 Empresas");
  try {
    await page.goto(`${BASE}/empresas/publicar`, { waitUntil: "networkidle", timeout: 20000 });
    await shot(page, "empresas-publicar");
  } catch (e) {
    console.log("  ⚠️  Error:", e.message);
  }

  // ── 6. Buscar con términos ───────────────────────────────────────────────────
  console.log("\n🔍 Buscar — ingeniería en Madrid");
  try {
    await page.goto(`${BASE}/app/buscar?keyword=ingeniero&location=Madrid`, {
      waitUntil: "networkidle",
      timeout: 20000,
    });
    await page.waitForTimeout(2000);
    await shot(page, "buscar-madrid");
  } catch (e) {
    console.log("  ⚠️  Error:", e.message);
  }

  await browser.close();
  console.log(`\n✅ Exploración completada — ${sc} screenshots en ${OUT}`);
}

main().catch(console.error);
