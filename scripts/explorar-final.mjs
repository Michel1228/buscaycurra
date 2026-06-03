/**
 * Exploración completa de buscaycurra.es — autenticada
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
  const file = path.join(OUT, `final-${String(sc).padStart(2,"0")}-${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  console.log(`  📸 ${name}`);
  return file;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();

  // ── 1. Landing ──────────────────────────────────────────────────────────────
  console.log("\n🌍 Landing");
  await page.goto(BASE, { waitUntil: "networkidle", timeout: 30000 });
  await shot(page, "01-landing");
  await page.evaluate(() => window.scrollTo(0, 700));
  await page.waitForTimeout(400);
  await shot(page, "02-landing-medio");
  await page.evaluate(() => window.scrollTo(0, 2000));
  await page.waitForTimeout(400);
  await shot(page, "03-landing-final");

  // ── 2. Precios ─────────────────────────────────────────────────────────────
  console.log("\n💶 Precios");
  await page.goto(`${BASE}/precios`, { waitUntil: "networkidle", timeout: 20000 });
  await shot(page, "04-precios");

  // ── 3. Login ────────────────────────────────────────────────────────────────
  console.log("\n🔐 Login");
  await page.goto(`${BASE}/auth/login`, { waitUntil: "networkidle", timeout: 20000 });
  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', PASS);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  console.log("  URL tras login:", page.url());
  await shot(page, "05-login-resultado");

  const loggedIn = !page.url().includes("/auth/login");
  console.log(`  Autenticado: ${loggedIn}`);

  // ── 4. Dashboard /app ───────────────────────────────────────────────────────
  console.log("\n🏠 App inicio");
  await page.goto(`${BASE}/app`, { waitUntil: "networkidle", timeout: 20000 });
  await page.waitForTimeout(1500);
  await shot(page, "06-app-inicio");
  await page.evaluate(() => window.scrollTo(0, 500));
  await page.waitForTimeout(400);
  await shot(page, "07-app-inicio-scroll");

  // ── 5. Buscar ──────────────────────────────────────────────────────────────
  console.log("\n🔍 Buscar");
  await page.goto(`${BASE}/app/buscar`, { waitUntil: "networkidle", timeout: 20000 });
  await page.waitForTimeout(2000);
  await shot(page, "08-buscar-vacio");

  // Realizar búsqueda
  try {
    const inputs = await page.$$("input");
    console.log("  Inputs encontrados:", inputs.length);
    if (inputs.length >= 2) {
      await inputs[0].fill("programador");
      await inputs[1].fill("Madrid");
      const btn = await page.$('button[type="submit"]');
      if (btn) {
        await btn.click();
        await page.waitForTimeout(3000);
        await shot(page, "09-buscar-resultados");
        await page.evaluate(() => window.scrollTo(0, 600));
        await page.waitForTimeout(400);
        await shot(page, "10-buscar-resultados-scroll");
      }
    }
  } catch (e) {
    console.log("  ⚠️  búsqueda:", e.message.slice(0,60));
  }

  // ── 6. Curriculum ─────────────────────────────────────────────────────────
  console.log("\n📄 Curriculum");
  await page.goto(`${BASE}/app/curriculum`, { waitUntil: "networkidle", timeout: 20000 });
  await page.waitForTimeout(1500);
  await shot(page, "11-curriculum");
  await page.evaluate(() => window.scrollTo(0, 600));
  await page.waitForTimeout(400);
  await shot(page, "12-curriculum-scroll");

  // ── 7. Envíos ──────────────────────────────────────────────────────────────
  console.log("\n📧 Envíos");
  await page.goto(`${BASE}/app/envios`, { waitUntil: "networkidle", timeout: 20000 });
  await page.waitForTimeout(1500);
  await shot(page, "13-envios");
  await page.evaluate(() => window.scrollTo(0, 600));
  await page.waitForTimeout(400);
  await shot(page, "14-envios-scroll");

  // ── 8. Entrevistas ─────────────────────────────────────────────────────────
  console.log("\n🎙️ Entrevistas");
  await page.goto(`${BASE}/app/entrevistas`, { waitUntil: "networkidle", timeout: 20000 });
  await page.waitForTimeout(1500);
  await shot(page, "15-entrevistas");

  // ── 9. Perfil ──────────────────────────────────────────────────────────────
  console.log("\n👤 Perfil");
  await page.goto(`${BASE}/app/perfil`, { waitUntil: "networkidle", timeout: 20000 });
  await page.waitForTimeout(1500);
  await shot(page, "16-perfil");
  await page.evaluate(() => window.scrollTo(0, 500));
  await page.waitForTimeout(400);
  await shot(page, "17-perfil-scroll");

  // ── 10. Empresas ──────────────────────────────────────────────────────────
  console.log("\n🏢 Empresas publicar");
  await page.goto(`${BASE}/empresas/publicar`, { waitUntil: "networkidle", timeout: 20000 });
  await page.waitForTimeout(1500);
  await shot(page, "18-empresas-publicar");

  // ── 11. Gusi chat (si existe) ──────────────────────────────────────────────
  console.log("\n🤖 Gusi chat");
  try {
    await page.goto(`${BASE}/app`, { waitUntil: "networkidle", timeout: 20000 });
    await page.waitForTimeout(1000);
    // Buscar botón de Gusi
    const gusiBtn = await page.$('button:has-text("Gusi"), [aria-label*="Gusi"], button:has-text("🐛")');
    if (gusiBtn) {
      await gusiBtn.click();
      await page.waitForTimeout(1500);
      await shot(page, "19-gusi-chat");
    } else {
      console.log("  No se encontró botón de Gusi");
    }
  } catch (e) {
    console.log("  ⚠️ Gusi:", e.message.slice(0,60));
  }

  await browser.close();
  console.log(`\n✅ Exploración completada — ${sc} screenshots en ${OUT}`);
}

main().catch(console.error);
