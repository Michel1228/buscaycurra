/**
 * Exploración autenticada de buscaycurra.es via magic link de Supabase
 */

import { chromium } from "playwright";
import { existsSync, mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", "tmp-screenshots");
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

const BASE = "https://buscaycurra.es";
const MAGIC_LINK = "https://ojesordjedovnpyxspxi.supabase.co/auth/v1/verify?token=60e042076c7fff80be6b0469502edf34ac1dff0abd0ad0a4f5705444&type=magiclink&redirect_to=http://localhost:3000";

let sc = 0;
async function shot(page, name) {
  sc++;
  const file = path.join(OUT, `auth-${String(sc).padStart(2,"0")}-${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  console.log(`  📸 ${name}`);
  return file;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  });
  const page = await ctx.newPage();

  // ── 1. Autenticación via magic link ────────────────────────────────────────
  console.log("\n🔐 Autenticando con magic link...");
  try {
    await page.goto(MAGIC_LINK, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(2000);
    console.log("  URL tras magic link:", page.url());
    await shot(page, "auth-magic-redirect");

    // Navegar manualmente a /app si redirigió a localhost
    if (page.url().includes("localhost") || page.url().includes("buscaycurra.es")) {
      // Extraer cookies/tokens y navegar a la app real
      const cookies = await ctx.cookies();
      console.log("  Cookies:", cookies.map(c => c.name).join(", "));
    }

    // Ir a /app con las cookies/tokens de sesión
    await page.goto(`${BASE}/app`, { waitUntil: "networkidle", timeout: 20000 });
    await page.waitForTimeout(2000);
    console.log("  URL tras ir a /app:", page.url());
    await shot(page, "app-home-auth-check");
  } catch (e) {
    console.log("  ⚠️  Error en auth:", e.message);
  }

  // ── 2. Login manual como fallback ─────────────────────────────────────────
  const url = page.url();
  if (url.includes("/auth/login") || url.includes("localhost")) {
    console.log("\n  → Intentando login manual...");
    await page.goto(`${BASE}/auth/login`, { waitUntil: "networkidle", timeout: 20000 });

    // Probar con michel@buscaycurra.es y contraseñas conocidas
    const intentos = [
      { email: "michel@buscaycurra.es", pass: "hugoyrubi1228" },
      { email: "michelbatistagonzalez1992@gmail.com", pass: "hugoyrubi1228" },
      { email: "michel@buscaycurra.es", pass: "ByCurra2026Secure!" },
      { email: "michel@buscaycurra.es", pass: "Michel1228" },
    ];

    for (const { email, pass } of intentos) {
      try {
        await page.fill('input[type="email"]', email, { timeout: 3000 });
        await page.fill('input[type="password"]', pass, { timeout: 3000 });
        await page.click('button[type="submit"]', { timeout: 3000 });
        await page.waitForTimeout(2000);
        const newUrl = page.url();
        console.log(`  ${email} / ${pass.slice(0,4)}*** → ${newUrl}`);
        if (!newUrl.includes("/auth/login")) {
          console.log("  ✅ Login exitoso!");
          break;
        }
      } catch (e) {
        console.log(`  ⚠️  ${e.message}`);
      }
    }
    await shot(page, "login-intentos");
  }

  // ── 3. Recorrer páginas autenticadas ──────────────────────────────────────
  const urlActual = page.url();
  const autenticado = !urlActual.includes("/auth/login") && !urlActual.includes("localhost:3000");
  console.log(`\n  Autenticado: ${autenticado} — URL: ${urlActual}`);

  const rutas = [
    { path: "/app", name: "app-inicio" },
    { path: "/app/buscar", name: "buscar" },
    { path: "/app/curriculum", name: "curriculum" },
    { path: "/app/envios", name: "envios" },
    { path: "/app/entrevistas", name: "entrevistas" },
    { path: "/app/perfil", name: "perfil" },
    { path: "/empresas/publicar", name: "empresas" },
  ];

  for (const ruta of rutas) {
    console.log(`\n📄 ${ruta.path}`);
    try {
      await page.goto(`${BASE}${ruta.path}`, { waitUntil: "networkidle", timeout: 20000 });
      await page.waitForTimeout(1500);
      await shot(page, ruta.name);
      await page.evaluate(() => window.scrollTo(0, 500));
      await page.waitForTimeout(400);
      await shot(page, `${ruta.name}-down`);
    } catch (e) {
      console.log(`  ⚠️  ${e.message}`);
    }
  }

  // ── 4. Buscar con resultados ───────────────────────────────────────────────
  console.log("\n🔍 Búsqueda con resultados");
  try {
    await page.goto(`${BASE}/app/buscar`, { waitUntil: "networkidle", timeout: 20000 });
    await page.waitForTimeout(1000);

    // Buscar "programador" en "Madrid"
    const inputKeyword = await page.$('input[placeholder*="puesto"], input[placeholder*="keyword"], input[name="keyword"]');
    const inputLocation = await page.$('input[placeholder*="ciudad"], input[placeholder*="location"], input[name="location"]');

    if (inputKeyword) await inputKeyword.fill("programador");
    if (inputLocation) await inputLocation.fill("Madrid");

    const submitBtn = await page.$('button[type="submit"], button:has-text("Buscar")');
    if (submitBtn) {
      await submitBtn.click();
      await page.waitForTimeout(3000);
    }
    await shot(page, "buscar-programador-madrid");
  } catch (e) {
    console.log(`  ⚠️  ${e.message}`);
  }

  await browser.close();
  console.log(`\n✅ Completado — ${sc} screenshots en ${OUT}`);
}

main().catch(console.error);
