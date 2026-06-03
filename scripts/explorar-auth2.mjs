/**
 * Exploración autenticada — intercepta el redirect del magic link para capturar el token
 */

import { chromium } from "playwright";
import { existsSync, mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", "tmp-screenshots");
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

const BASE = "https://buscaycurra.es";
const MAGIC_LINK = "https://ojesordjedovnpyxspxi.supabase.co/auth/v1/verify?token=24d30c5cd8eb540c10bbde9742e31306150e70ea6a63ff8d7dfca07d&type=magiclink&redirect_to=http://localhost:3000";

let sc = 0;
async function shot(page, name) {
  sc++;
  const file = path.join(OUT, `v2-${String(sc).padStart(2,"0")}-${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  console.log(`  📸 ${name}`);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });
  const page = await ctx.newPage();

  // Interceptar la petición a localhost para capturar los tokens
  let accessToken = null;
  let refreshToken = null;

  await ctx.route("**/localhost*/**", async route => {
    const url = route.request().url();
    console.log("  → Interceptado redirect:", url.slice(0, 200));
    // Extraer tokens del hash
    if (url.includes("access_token=")) {
      const hash = url.split("#")[1] ?? "";
      const params = new URLSearchParams(hash);
      accessToken = params.get("access_token");
      refreshToken = params.get("refresh_token");
      console.log("  ✅ Access token capturado:", accessToken?.slice(0,30) + "...");
    }
    // Abortar la request a localhost (no puede conectar)
    await route.abort();
  });

  console.log("\n🔐 Siguiendo magic link...");
  try {
    await page.goto(MAGIC_LINK, { waitUntil: "commit", timeout: 15000 });
  } catch (e) {
    console.log("  (error esperado tras redirect a localhost):", e.message.slice(0,80));
  }
  await page.waitForTimeout(2000);

  if (!accessToken) {
    console.log("  ⚠️  No se capturó token — intentando ruta alternativa...");
    // Intentar navegar y ver la URL
    console.log("  URL actual:", page.url());
    await shot(page, "sin-token");
  }

  // Inyectar tokens en localStorage de buscaycurra.es
  if (accessToken) {
    console.log("\n🔑 Inyectando sesión en buscaycurra.es...");
    await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 20000 });

    // Inyectar la sesión en el localStorage de Supabase
    await page.evaluate(({ at, rt }) => {
      const session = {
        access_token: at,
        refresh_token: rt,
        token_type: "bearer",
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      };
      const key = "sb-ojesordjedovnpyxspxi-auth-token";
      localStorage.setItem(key, JSON.stringify(session));
    }, { at: accessToken, rt: refreshToken });

    await page.reload({ waitUntil: "networkidle", timeout: 20000 });
    await page.waitForTimeout(1500);
    console.log("  URL tras inyección:", page.url());
    await shot(page, "home-con-sesion");
  }

  // Navegar a /app
  const rutas = [
    { path: "/app", name: "app-inicio" },
    { path: "/app/buscar", name: "buscar" },
    { path: "/app/curriculum", name: "curriculum" },
    { path: "/app/envios", name: "envios" },
    { path: "/app/entrevistas", name: "entrevistas" },
    { path: "/app/perfil", name: "perfil" },
  ];

  for (const ruta of rutas) {
    console.log(`\n📄 ${ruta.path}`);
    try {
      await page.goto(`${BASE}${ruta.path}`, { waitUntil: "networkidle", timeout: 20000 });
      await page.waitForTimeout(1500);
      const currentUrl = page.url();
      console.log("  URL:", currentUrl);
      await shot(page, ruta.name);
      await page.evaluate(() => window.scrollTo(0, 500));
      await page.waitForTimeout(400);
      await shot(page, `${ruta.name}-scroll`);
    } catch (e) {
      console.log(`  ⚠️  ${e.message.slice(0,80)}`);
      try { await shot(page, `${ruta.name}-error`); } catch {}
    }
  }

  await browser.close();
  console.log(`\n✅ Completado — ${sc} screenshots`);
}

main().catch(console.error);
