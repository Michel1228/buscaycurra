/**
 * Exploración rutas nuevas — Emigrar, Pipeline, Salarios, selector países, Guzzi completo
 */

import { chromium } from "playwright";
import { existsSync, mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", "tmp-screenshots");
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

const BASE = "https://buscaycurra.es";
const EMAIL = "michel@buscaycurra.es";
const PASS = "PlaywrightTemp2026!";

let sc = 0;
async function shot(page, name) {
  sc++;
  const file = path.join(OUT, `nuevo-${String(sc).padStart(2,"0")}-${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  console.log(`  📸 ${name}`);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();

  // Login
  console.log("🔐 Login...");
  await page.goto(`${BASE}/auth/login`, { waitUntil: "networkidle", timeout: 30000 });
  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', PASS);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  console.log("  URL:", page.url());

  // ── Emigrar ────────────────────────────────────────────────────────────────
  console.log("\n🌍 Emigrar");
  await page.goto(`${BASE}/app/emigrar`, { waitUntil: "networkidle", timeout: 20000 });
  await page.waitForTimeout(1500);
  console.log("  URL:", page.url());
  await shot(page, "emigrar-top");
  await page.evaluate(() => window.scrollTo(0, 600));
  await page.waitForTimeout(400);
  await shot(page, "emigrar-mid");
  await page.evaluate(() => window.scrollTo(0, 1400));
  await page.waitForTimeout(400);
  await shot(page, "emigrar-bottom");

  // ── Pipeline ───────────────────────────────────────────────────────────────
  console.log("\n📊 Pipeline");
  await page.goto(`${BASE}/app/pipeline`, { waitUntil: "networkidle", timeout: 20000 });
  await page.waitForTimeout(1500);
  console.log("  URL:", page.url());
  await shot(page, "pipeline-top");
  await page.evaluate(() => window.scrollTo(0, 600));
  await page.waitForTimeout(400);
  await shot(page, "pipeline-mid");

  // ── Salarios ───────────────────────────────────────────────────────────────
  console.log("\n💰 Salarios");
  await page.goto(`${BASE}/app/salarios`, { waitUntil: "networkidle", timeout: 20000 });
  await page.waitForTimeout(1500);
  console.log("  URL:", page.url());
  await shot(page, "salarios-top");
  await page.evaluate(() => window.scrollTo(0, 600));
  await page.waitForTimeout(400);
  await shot(page, "salarios-mid");

  // ── Buscar con selector de países ──────────────────────────────────────────
  console.log("\n🌐 Buscar — explorar selector de países");
  await page.goto(`${BASE}/app/buscar`, { waitUntil: "networkidle", timeout: 20000 });
  await page.waitForTimeout(1500);
  await shot(page, "buscar-paises-selector");

  // Click en el dropdown de países
  try {
    const selector = await page.$('button:has-text("España"), [class*="country"], select');
    if (selector) {
      await selector.click();
      await page.waitForTimeout(800);
      await shot(page, "buscar-paises-desplegado");
    }
  } catch (e) {
    console.log("  ⚠️", e.message.slice(0, 60));
  }

  // ── Entrevistas (versión desplegada) ───────────────────────────────────────
  console.log("\n🎙️ Entrevistas desplegada");
  await page.goto(`${BASE}/app/entrevistas`, { waitUntil: "networkidle", timeout: 20000 });
  await page.waitForTimeout(1500);
  await shot(page, "entrevistas-desplegada");

  // ── Menú hamburguesa / nav completo ───────────────────────────────────────
  console.log("\n☰ Menú completo");
  await page.goto(`${BASE}/app`, { waitUntil: "networkidle", timeout: 20000 });
  await page.waitForTimeout(1000);
  try {
    const menu = await page.$('button[aria-label*="menu"], button:has-text("☰"), .hamburger, [class*="menu-btn"]');
    if (menu) {
      await menu.click();
      await page.waitForTimeout(800);
      await shot(page, "menu-hamburguesa");
    }

    // Buscar el botón de menú por el ícono ≡
    const allBtns = await page.$$("button");
    for (const btn of allBtns) {
      const text = await btn.innerText().catch(() => "");
      const cls = await btn.getAttribute("class").catch(() => "");
      if (text.includes("≡") || (cls && cls.includes("menu"))) {
        await btn.click();
        await page.waitForTimeout(800);
        await shot(page, "menu-abierto");
        break;
      }
    }
  } catch (e) {
    console.log("  ⚠️", e.message.slice(0, 60));
  }

  // ── Guardadas ─────────────────────────────────────────────────────────────
  console.log("\n❤️ Guardadas");
  await page.goto(`${BASE}/app/guardadas`, { waitUntil: "networkidle", timeout: 20000 });
  await page.waitForTimeout(1500);
  console.log("  URL:", page.url());
  await shot(page, "guardadas");

  // ── Guzzi chat completo ────────────────────────────────────────────────────
  console.log("\n🤖 Guzzi — panel completo");
  await page.goto(`${BASE}/app`, { waitUntil: "networkidle", timeout: 20000 });
  await page.waitForTimeout(1000);
  // Click "Hablar con Guzzi"
  try {
    const guzziBtn = await page.$('a:has-text("Hablar con Guzzi"), button:has-text("Hablar con Guzzi")');
    if (guzziBtn) {
      await guzziBtn.click();
      await page.waitForTimeout(2000);
      await shot(page, "guzzi-chat-completo");
      await page.evaluate(() => window.scrollTo(0, 500));
      await shot(page, "guzzi-acciones");
    }
  } catch (e) {
    console.log("  ⚠️", e.message.slice(0, 60));
  }

  // ── Página de bienvenida ──────────────────────────────────────────────────
  console.log("\n🎉 Bienvenida");
  await page.goto(`${BASE}/app/bienvenida`, { waitUntil: "networkidle", timeout: 20000 });
  await page.waitForTimeout(1500);
  await shot(page, "bienvenida");

  await browser.close();
  console.log(`\n✅ Completado — ${sc} screenshots`);
}

main().catch(console.error);
