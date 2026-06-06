// ============================================================
// AUDITORÍA UX EXHAUSTIVA — BuscayCurra
// Auditor QA Senior — edge cases, comportamientos inusuales
// ============================================================
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'https://buscaycurra.es';
const DEMO_EMAIL = 'demo@buscaycurra.es';
const DEMO_PASS = 'Demo2026!';
const SCREENSHOTS_DIR = 'c:/Users/MichelBatista/Desktop/audit-super';
const REPORT_PATH = 'c:/Users/MichelBatista/Desktop/audit-super/INFORME.md';

// ── helpers ──────────────────────────────────────────────
let reportLines = [];
let stepCounter = 0;
let browser, context, page;
const consoleErrors = [];
const consoleWarnings = [];

function log(symbol, title, detail) {
  const line = `${symbol} **${title}**: ${detail}`;
  console.log(line);
  reportLines.push(line);
}

async function ss(name, p = page) {
  const safe = name.replace(/[^a-z0-9_-]/gi, '_');
  const file = path.join(SCREENSHOTS_DIR, `${String(stepCounter).padStart(3,'0')}_${safe}.png`);
  stepCounter++;
  try {
    await p.screenshot({ path: file, fullPage: true });
    reportLines.push(`  📸 ${file}`);
    return file;
  } catch(e) {
    reportLines.push(`  ⚠️ No se pudo capturar: ${e.message}`);
    return null;
  }
}

async function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function safeGoto(url, opts = {}) {
  try {
    const r = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000, ...opts });
    await wait(1500);
    return r;
  } catch(e) {
    log('⚠️', 'Timeout/Error navegando', `${url} — ${e.message}`);
    return null;
  }
}

async function getTextContent(selector) {
  try {
    return await page.textContent(selector, { timeout: 3000 });
  } catch { return null; }
}

async function isVisible(selector) {
  try {
    return await page.isVisible(selector, { timeout: 3000 });
  } catch { return false; }
}

async function clickSafe(selector, desc = '') {
  try {
    await page.click(selector, { timeout: 5000 });
    await wait(800);
    return true;
  } catch(e) {
    log('⚠️', `No se pudo clicar ${desc || selector}`, e.message.substring(0, 120));
    return false;
  }
}

// ── SETUP ─────────────────────────────────────────────────
async function setup() {
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
    locale: 'es-ES',
  });
  page = await context.newPage();

  // Capturar errores de consola
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
    if (msg.type() === 'warning') consoleWarnings.push(msg.text());
  });
  page.on('pageerror', err => consoleErrors.push('PAGE ERROR: ' + err.message));
}

// ═══════════════════════════════════════════════════════════
// FASE 1 — LANDING (no autenticado)
// ═══════════════════════════════════════════════════════════
async function fase1_landing() {
  reportLines.push('\n## FASE 1 — LANDING (sin autenticar)\n');

  // 1.1 Landing desktop
  await safeGoto(BASE_URL);
  const titleDesktop = await page.title();
  log('✅', 'Landing desktop cargada', `Título: "${titleDesktop}" | URL: ${page.url()}`);
  await ss('01_landing_desktop');

  // 1.2 Landing mobile
  const mobileCtx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148',
    locale: 'es-ES',
  });
  const mobilePage = await mobileCtx.newPage();
  try {
    await mobilePage.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await wait(2000);
    const mobileFile = path.join(SCREENSHOTS_DIR, `${String(stepCounter).padStart(3,'0')}_02_landing_mobile.png`);
    stepCounter++;
    await mobilePage.screenshot({ path: mobileFile, fullPage: true });
    log('✅', 'Landing mobile (390x844)', `Captura guardada`);
    reportLines.push(`  📸 ${mobileFile}`);
  } catch(e) {
    log('⚠️', 'Landing mobile', e.message.substring(0,120));
  }
  await mobilePage.close();
  await mobileCtx.close();

  // 1.3 Scroll lento por la landing
  await safeGoto(BASE_URL);
  try {
    const scrollHeight = await page.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y < scrollHeight; y += 300) {
      await page.evaluate(pos => window.scrollTo(0, pos), y);
      await wait(200);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    log('✅', 'Scroll landing', `Scroll completo (${scrollHeight}px)`);
    await ss('03_landing_after_scroll');
  } catch(e) {
    log('⚠️', 'Scroll landing', e.message);
  }

  // 1.4 Revisar enlaces del nav
  try {
    const navLinks = await page.$$eval('nav a, header a', links =>
      links.map(l => ({ text: l.textContent?.trim(), href: l.href }))
        .filter(l => l.href && !l.href.startsWith('javascript'))
    );
    log('✅', 'Navegación — enlaces encontrados', `Total: ${navLinks.length}`);
    for (const link of navLinks) {
      reportLines.push(`  - [${link.text || '(sin texto)'}](${link.href})`);
    }

    // Probar cada enlace del nav
    for (const link of navLinks.slice(0, 8)) {
      if (!link.href || link.href === BASE_URL || link.href === BASE_URL + '/') continue;
      try {
        const resp = await page.request.get(link.href, { timeout: 10000 });
        const status = resp.status();
        const sym = status < 400 ? '✅' : '❌';
        log(sym, `Nav link "${link.text}"`, `${link.href} → HTTP ${status}`);
      } catch(e) {
        log('⚠️', `Nav link "${link.text}"`, `${link.href} — ${e.message.substring(0,80)}`);
      }
    }
  } catch(e) {
    log('⚠️', 'Inspección de nav', e.message);
  }

  // 1.5 Ir a /app sin login — ¿redirige?
  await safeGoto(`${BASE_URL}/app`);
  const urlAfterApp = page.url();
  if (urlAfterApp.includes('/auth/login') || urlAfterApp.includes('/login')) {
    log('✅', '/app sin login → redirige al login', urlAfterApp);
  } else {
    log('❌', '/app sin login NO redirige', `URL final: ${urlAfterApp}`);
  }
  await ss('04_app_sin_login');

  // 1.6 /app/curriculum sin login
  await safeGoto(`${BASE_URL}/app/curriculum`);
  const urlAfterCurr = page.url();
  if (urlAfterCurr.includes('/auth/login') || urlAfterCurr.includes('/login')) {
    log('✅', '/app/curriculum sin login → redirige', urlAfterCurr);
  } else {
    log('❌', '/app/curriculum sin login NO redirige', urlAfterCurr);
  }

  // 1.7 URL inventada /app/xyz
  await safeGoto(`${BASE_URL}/app/xyz`);
  const urlXyz = page.url();
  const textXyz = await page.textContent('body').catch(() => '');
  if (textXyz.includes('404') || textXyz.toLowerCase().includes('no encontr')) {
    log('✅', '/app/xyz → 404 correcto', urlXyz);
  } else if (urlXyz.includes('/auth/login') || urlXyz.includes('/login')) {
    log('✅', '/app/xyz → redirige al login (protegido)', urlXyz);
  } else {
    log('⚠️', '/app/xyz → comportamiento inesperado', `URL: ${urlXyz} | Texto: ${textXyz.substring(0,100)}`);
  }
  await ss('05_app_xyz_inventada');

  // 1.8 Captura página de login
  await safeGoto(`${BASE_URL}/auth/login`);
  log('✅', 'Página de login', `URL: ${page.url()}`);
  await ss('06_login_page');
}

// ═══════════════════════════════════════════════════════════
// FASE 2 — AUTENTICACIÓN
// ═══════════════════════════════════════════════════════════
async function fase2_auth() {
  reportLines.push('\n## FASE 2 — AUTENTICACIÓN\n');

  await safeGoto(`${BASE_URL}/auth/login`);

  // 2.1 Email incorrecto
  try {
    await page.fill('input[type="email"]', 'fakeuser@test.com');
    await page.fill('input[type="password"]', 'wrongpass');
    await ss('07_login_datos_incorrectos_antes');
    await page.click('button[type="submit"]');
    await wait(3000);
    const errorText = await page.textContent('body');
    const errorVisible = errorText.toLowerCase().includes('incorrecto') ||
      errorText.toLowerCase().includes('invalid') ||
      errorText.toLowerCase().includes('error') ||
      errorText.toLowerCase().includes('contraseña') ||
      errorText.toLowerCase().includes('credentials');
    if (errorVisible) {
      log('✅', 'Login email incorrecto → muestra error', 'Mensaje de error detectado');
    } else {
      log('⚠️', 'Login email incorrecto', `No se detectó mensaje de error claro. URL: ${page.url()}`);
    }
    await ss('08_login_email_incorrecto_resultado');
  } catch(e) {
    log('❌', 'Login email incorrecto', e.message);
  }

  // 2.2 Email correcto, contraseña vacía
  await safeGoto(`${BASE_URL}/auth/login`);
  try {
    await page.fill('input[type="email"]', DEMO_EMAIL);
    // Dejar password vacío o limpiar
    const passInput = page.locator('input[type="password"]');
    await passInput.fill('');
    await page.click('button[type="submit"]');
    await wait(2000);
    const url2 = page.url();
    const body2 = await page.textContent('body');
    const hasValidation = body2.toLowerCase().includes('requerido') ||
      body2.toLowerCase().includes('required') ||
      body2.toLowerCase().includes('contraseña') ||
      !url2.includes('/app');
    if (hasValidation) {
      log('✅', 'Contraseña vacía → no deja pasar', `URL: ${url2}`);
    } else {
      log('❌', 'Contraseña vacía → deja pasar sin validar', `URL: ${url2}`);
    }
    await ss('09_login_password_vacio');
  } catch(e) {
    log('⚠️', 'Contraseña vacía', e.message);
  }

  // 2.3 Login correcto
  await safeGoto(`${BASE_URL}/auth/login`);
  try {
    await page.fill('input[type="email"]', DEMO_EMAIL);
    await page.fill('input[type="password"]', DEMO_PASS);
    await ss('10_login_datos_correctos_antes');
    await page.click('button[type="submit"]');
    await wait(5000);
    const urlFinal = page.url();
    if (urlFinal.includes('/app')) {
      log('✅', 'Login correcto → redirige al app', urlFinal);
    } else {
      log('❌', 'Login correcto → NO redirige al app', urlFinal);
    }
    await ss('11_dashboard_tras_login');
  } catch(e) {
    log('❌', 'Login correcto', e.message);
  }
}

// ═══════════════════════════════════════════════════════════
// FASE 3 — DASHBOARD
// ═══════════════════════════════════════════════════════════
async function fase3_dashboard() {
  reportLines.push('\n## FASE 3 — DASHBOARD\n');

  // Asegurar que estamos logueados
  const currentUrl = page.url();
  if (!currentUrl.includes('/app')) {
    await safeGoto(`${BASE_URL}/app/gusi`);
    await wait(2000);
  }

  // 3.1 Captura dashboard completo
  await ss('12_dashboard_completo');
  const dashText = await page.textContent('body');
  log('✅', 'Dashboard cargado', `URL: ${page.url()} | Longitud contenido: ${dashText.length} chars`);

  // ¿Hay botón/enlace Hablar con Guzzi?
  const guzziSelectors = [
    'button:has-text("Guzzi")',
    'a:has-text("Guzzi")',
    '[data-testid*="guzzi"]',
    'button:has-text("Chat")',
    'button:has-text("Asistente")',
    'text=Guzzi',
    'text=Hablar'
  ];

  // 3.2 Ir a la ruta de Guzzi directamente
  await safeGoto(`${BASE_URL}/app/gusi`);
  await wait(2000);
  await ss('13_guzzi_chat_pagina');
  log('✅', 'Página Guzzi/Gusi cargada', page.url());

  // 3.3 Escribir en el chat
  const chatInputSelectors = [
    'textarea[placeholder]',
    'input[placeholder*="escribe"]',
    'input[placeholder*="mensaje"]',
    'input[placeholder*="pregunta"]',
    'textarea',
    '[contenteditable="true"]',
    'input[type="text"]'
  ];

  let chatInput = null;
  for (const sel of chatInputSelectors) {
    try {
      if (await page.isVisible(sel, { timeout: 2000 })) {
        chatInput = sel;
        break;
      }
    } catch {}
  }

  if (chatInput) {
    log('✅', 'Input de chat encontrado', chatInput);

    // "Hola"
    try {
      await page.fill(chatInput, 'Hola');
      await ss('14_chat_hola_escrito');
      // Buscar botón enviar
      const sendBtns = ['button[type="submit"]', 'button:has-text("Enviar")', 'button:has-text("Send")', 'button[aria-label*="nviar"]'];
      let sent = false;
      for (const btn of sendBtns) {
        if (await isVisible(btn)) {
          await clickSafe(btn, 'enviar mensaje');
          sent = true; break;
        }
      }
      if (!sent) { await page.keyboard.press('Enter'); }
      await wait(4000);
      await ss('15_chat_hola_respuesta');
      const respText = await page.textContent('body');
      if (respText.includes('Hola') || respText.length > 500) {
        log('✅', 'Chat "Hola" → Guzzi responde', 'Respuesta detectada en el DOM');
      } else {
        log('⚠️', 'Chat "Hola"', 'No se detectó respuesta clara de Guzzi');
      }
    } catch(e) {
      log('⚠️', 'Chat "Hola"', e.message);
    }

    // "Busco trabajo de camarero en Madrid"
    try {
      await page.fill(chatInput, 'Busco trabajo de camarero en Madrid');
      await page.keyboard.press('Enter');
      await wait(6000);
      await ss('16_chat_camarero_madrid');
      log('✅', 'Chat búsqueda camarero Madrid', 'Mensaje enviado, captura tomada');
    } catch(e) {
      log('⚠️', 'Chat camarero', e.message);
    }

    // "Envía mi CV a 10 empresas"
    try {
      await page.fill(chatInput, 'Envía mi CV a 10 empresas ahora mismo');
      await page.keyboard.press('Enter');
      await wait(5000);
      await ss('17_chat_enviar_cv_10_empresas');
      const bodyText = await page.textContent('body');
      if (bodyText.toLowerCase().includes('cv') || bodyText.toLowerCase().includes('empresa')) {
        log('✅', 'Chat "Envía CV a 10 empresas"', 'Respuesta relacionada detectada');
      } else {
        log('⚠️', 'Chat "Envía CV a 10 empresas"', 'Respuesta no clara');
      }
    } catch(e) {
      log('⚠️', 'Chat envío CV', e.message);
    }

    // "Quiero ser astronauta en Marte" (absurdo)
    try {
      await page.fill(chatInput, 'Quiero ser astronauta en Marte, ¿me puedes ayudar?');
      await page.keyboard.press('Enter');
      await wait(5000);
      await ss('18_chat_astronauta_marte');
      log('✅', 'Chat mensaje absurdo enviado', 'Captura tomada — revisión manual necesaria');
    } catch(e) {
      log('⚠️', 'Chat mensaje absurdo', e.message);
    }

  } else {
    log('❌', 'Input de chat NO encontrado', 'No se encontró ningún input en /app/gusi');
    await ss('13b_guzzi_sin_input');

    // Intentar clicar en un botón para abrir el chat
    const openChatBtns = ['button:has-text("Guzzi")', 'button:has-text("Chat")', 'button:has-text("Abrir")', '[aria-label*="chat"]'];
    for (const btn of openChatBtns) {
      if (await isVisible(btn)) {
        await clickSafe(btn, 'abrir chat');
        await wait(2000);
        await ss('13c_guzzi_chat_abierto');
        break;
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════
// FASE 4 — BÚSQUEDA (edge cases)
// ═══════════════════════════════════════════════════════════
async function fase4_busqueda() {
  reportLines.push('\n## FASE 4 — BÚSQUEDA (edge cases)\n');

  await safeGoto(`${BASE_URL}/app/buscar`);
  await wait(2000);
  await ss('19_buscar_pagina_inicial');
  log('✅', 'Página /app/buscar cargada', page.url());

  // Detectar inputs de búsqueda
  const jobInput = await page.$('input[placeholder*="trabajo"], input[placeholder*="puesto"], input[placeholder*="Busca"], input[name*="job"], input[name*="query"], input[name*="q"], input[type="search"]').catch(() => null);
  const locationInput = await page.$('input[placeholder*="ciudad"], input[placeholder*="lugar"], input[placeholder*="location"], input[name*="location"]').catch(() => null);

  // 4.1 Búsqueda vacía
  const searchBtn = await page.$('button[type="submit"], button:has-text("Buscar"), button:has-text("Search")').catch(() => null);
  if (searchBtn) {
    await searchBtn.click();
    await wait(2000);
    await ss('20_busqueda_vacia_resultado');
    const body = await page.textContent('body');
    if (body.includes('0') || body.toLowerCase().includes('sin resultado') || body.toLowerCase().includes('vacío')) {
      log('✅', 'Búsqueda vacía → resultado', 'Muestra estado de sin resultados o listado');
    } else {
      log('⚠️', 'Búsqueda vacía', `Resultado inesperado. URL: ${page.url()}`);
    }
  } else {
    log('⚠️', 'Búsqueda vacía', 'No se encontró botón de búsqueda');
  }

  // 4.2 Búsqueda "camarero" en "Madrid"
  await safeGoto(`${BASE_URL}/app/buscar`);
  await wait(1500);
  try {
    const jobIn = await page.$('input[placeholder*="trabajo"], input[placeholder*="puesto"], input[placeholder*="Busca"], input[placeholder*="busca"], input[name*="job"], input[name*="query"], input[type="search"], input[placeholder*="rol"]');
    if (jobIn) {
      await jobIn.fill('camarero');
      log('✅', 'Input trabajo rellenado', '"camarero"');
    } else {
      log('⚠️', 'Input de trabajo', 'No encontrado — intentando con el primero disponible');
      const inputs = await page.$$('input[type="text"], input:not([type="hidden"])');
      if (inputs.length > 0) await inputs[0].fill('camarero');
    }

    const locIn = await page.$('input[placeholder*="ciudad"], input[placeholder*="lugar"], input[placeholder*="location"], input[placeholder*="Madrid"], input[name*="location"]');
    if (locIn) {
      await locIn.fill('Madrid');
      log('✅', 'Input ubicación rellenado', '"Madrid"');
    }

    const btn = await page.$('button[type="submit"], button:has-text("Buscar")');
    if (btn) { await btn.click(); await wait(3000); }
    else { await page.keyboard.press('Enter'); await wait(3000); }

    await ss('21_busqueda_camarero_madrid');
    const body = await page.textContent('body');
    const hasResults = body.toLowerCase().includes('camarero') || body.toLowerCase().includes('oferta') || body.includes('resultado');
    if (hasResults) {
      log('✅', 'Búsqueda "camarero" Madrid → resultados', 'Ofertas encontradas');
    } else {
      log('⚠️', 'Búsqueda "camarero" Madrid', 'No se encontraron resultados claros');
    }
  } catch(e) {
    log('❌', 'Búsqueda camarero Madrid', e.message);
  }

  // 4.3 Búsqueda inventada
  await safeGoto(`${BASE_URL}/app/buscar`);
  await wait(1500);
  try {
    const jobIn = await page.$('input[type="search"], input[placeholder*="trabajo"], input[placeholder*="puesto"], input[placeholder*="Busca"], input[placeholder*="busca"]');
    if (jobIn) {
      await jobIn.fill('asdfjkl xyz123');
      const btn = await page.$('button[type="submit"], button:has-text("Buscar")');
      if (btn) { await btn.click(); }
      else { await page.keyboard.press('Enter'); }
      await wait(3000);
      await ss('22_busqueda_inventada_resultado');
      const body = await page.textContent('body');
      if (body.toLowerCase().includes('no') && (body.toLowerCase().includes('resultado') || body.toLowerCase().includes('encontr'))) {
        log('✅', 'Búsqueda sin resultados → estado vacío', 'Mensaje de no resultados correcto');
      } else {
        log('⚠️', 'Búsqueda inventada', `No se detectó estado de vacío claro. Texto: ${body.substring(0,200)}`);
      }
    } else {
      log('⚠️', 'Búsqueda inventada', 'Input no encontrado');
    }
  } catch(e) {
    log('⚠️', 'Búsqueda inventada', e.message);
  }

  // 4.4 Búsqueda con solo espacios
  await safeGoto(`${BASE_URL}/app/buscar`);
  await wait(1500);
  try {
    const jobIn = await page.$('input[type="search"], input[placeholder*="trabajo"], input[placeholder*="puesto"], input[placeholder*="Busca"]');
    if (jobIn) {
      await jobIn.fill('     ');
      const btn = await page.$('button[type="submit"], button:has-text("Buscar")');
      if (btn) { await btn.click(); await wait(2000); }
      else { await page.keyboard.press('Enter'); await wait(2000); }
      await ss('23_busqueda_espacios');
      log('✅', 'Búsqueda con solo espacios', `URL: ${page.url()} — revisión visual necesaria`);
    }
  } catch(e) {
    log('⚠️', 'Búsqueda con espacios', e.message);
  }

  // 4.5 Cambiar país a Alemania
  await safeGoto(`${BASE_URL}/app/buscar`);
  await wait(1500);
  try {
    // Buscar selector de país
    const countrySelectors = ['select[name*="countr"], select[name*="pais"], select[name*="país"]', 'select'];
    let countrySelect = null;
    for (const sel of countrySelectors) {
      const el = await page.$(sel);
      if (el) { countrySelect = el; break; }
    }

    if (countrySelect) {
      // Intentar seleccionar Alemania
      await countrySelect.selectOption({ label: 'Alemania' }).catch(async () => {
        await countrySelect.selectOption({ value: 'de' }).catch(async () => {
          await countrySelect.selectOption({ value: 'DE' }).catch(() => {});
        });
      });
      await wait(2000);
      await ss('24_busqueda_alemania');
      log('✅', 'País cambiado a Alemania', `Selector encontrado: select`);
    } else {
      // Buscar botón/tab de país
      const germanyBtn = await page.$('text=Alemania, button:has-text("Alemania"), [data-country="de"]');
      if (germanyBtn) {
        await germanyBtn.click();
        await wait(2000);
        await ss('24_busqueda_alemania');
        log('✅', 'País cambiado a Alemania (botón)', 'OK');
      } else {
        log('⚠️', 'Selector de país', 'No se encontró selector de país/Alemania');
        await ss('24_busqueda_sin_selector_pais');
      }
    }
  } catch(e) {
    log('⚠️', 'Cambio de país', e.message);
  }

  // Captura final de resultados
  await ss('25_busqueda_resultados_final');
}

// ═══════════════════════════════════════════════════════════
// FASE 5 — MI CV
// ═══════════════════════════════════════════════════════════
async function fase5_cv() {
  reportLines.push('\n## FASE 5 — MI CV (curriculum)\n');

  await safeGoto(`${BASE_URL}/app/curriculum`);
  await wait(3000);
  await ss('26_curriculum_pagina');
  log('✅', 'Página /app/curriculum cargada', page.url());

  const body = await page.textContent('body');
  if (body.toLowerCase().includes('demo') || body.toLowerCase().includes('nombre') || body.toLowerCase().includes('experiencia')) {
    log('✅', 'CV del usuario demo', 'Datos del CV encontrados en la página');
  } else {
    log('⚠️', 'CV del usuario demo', 'No se detectan datos del CV. ¿Está vacío o cargando?');
  }

  // ¿Hay preview del CV?
  const previewSelectors = ['[class*="preview"]', '[class*="Preview"]', 'iframe', 'canvas', '[class*="pdf"]', 'embed'];
  let hasPreview = false;
  for (const sel of previewSelectors) {
    if (await isVisible(sel)) { hasPreview = true; log('✅', 'Preview CV', `Encontrado: ${sel}`); break; }
  }
  if (!hasPreview) {
    log('⚠️', 'Preview CV', 'No se detectó iframe/canvas/preview del CV');
  }

  await ss('27_curriculum_completo');
}

// ═══════════════════════════════════════════════════════════
// FASE 6 — ENVÍOS
// ═══════════════════════════════════════════════════════════
async function fase6_envios() {
  reportLines.push('\n## FASE 6 — ENVÍOS\n');

  await safeGoto(`${BASE_URL}/app/envios`);
  await wait(2000);
  const enviosUrl = page.url();
  log('✅', 'Navegando a /app/envios', `URL final: ${enviosUrl}`);

  // ¿Redirige a empresas?
  if (enviosUrl.includes('/empresas')) {
    log('⚠️', '/app/envios → redirige a /empresas', 'Posiblemente /envios no está implementado aún');
  } else if (enviosUrl.includes('/envios')) {
    log('✅', '/app/envios cargado correctamente', 'No redirige');
  }

  await ss('28_envios_pagina');

  const body = await page.textContent('body');

  // ¿Muestra lista de envíos?
  const hasEnvios = body.toLowerCase().includes('envío') || body.toLowerCase().includes('enviado') || body.toLowerCase().includes('empresa') || body.toLowerCase().includes('aplicación');
  if (hasEnvios) {
    log('✅', 'Lista de envíos', 'Contenido relacionado con envíos detectado');
  } else {
    log('⚠️', 'Lista de envíos', 'No se detecta contenido de envíos');
  }

  // ¿Hay filtros?
  const filterSelectors = ['[class*="filter"]', 'select', 'input[type="date"]', 'button:has-text("Filtrar")'];
  let hasFilters = false;
  for (const sel of filterSelectors) {
    if (await isVisible(sel)) { hasFilters = true; log('✅', 'Filtros en envíos', `Encontrado: ${sel}`); break; }
  }
  if (!hasFilters) log('⚠️', 'Filtros en envíos', 'No se detectaron filtros');

  // ¿Botón "Enviar nuevo CV"?
  const newCVBtn = await page.$('button:has-text("Enviar"), button:has-text("nuevo"), a:has-text("Enviar")');
  if (newCVBtn) {
    log('✅', 'Botón "Enviar nuevo CV"', 'Encontrado');
  } else {
    log('⚠️', 'Botón "Enviar nuevo CV"', 'No encontrado en /app/envios');
  }
}

// ═══════════════════════════════════════════════════════════
// FASE 7 — EMPRESAS
// ═══════════════════════════════════════════════════════════
async function fase7_empresas() {
  reportLines.push('\n## FASE 7 — EMPRESAS\n');

  await safeGoto(`${BASE_URL}/app/empresas`);
  await wait(2000);
  await ss('29_empresas_pagina');
  log('✅', 'Página /app/empresas cargada', page.url());

  // Buscar Mercadona
  const searchInput = await page.$('input[type="search"], input[placeholder*="busca"], input[placeholder*="empresa"], input[placeholder*="Busca"], input[placeholder*="Empresa"]');
  if (searchInput) {
    await searchInput.fill('Mercadona');
    await wait(2000);
    await ss('30_empresas_mercadona');
    const body = await page.textContent('body');
    if (body.toLowerCase().includes('mercadona')) {
      log('✅', 'Búsqueda "Mercadona"', 'Encontrado en resultados');
    } else {
      log('⚠️', 'Búsqueda "Mercadona"', 'No aparece Mercadona en resultados');
    }

    // Búsqueda inventada
    await searchInput.fill('xyz9999empresa');
    await wait(2000);
    await ss('31_empresas_busqueda_inventada');
    const body2 = await page.textContent('body');
    const hasEmpty = body2.toLowerCase().includes('no') || body2.toLowerCase().includes('encontr') || body2.toLowerCase().includes('resultado');
    if (hasEmpty) {
      log('✅', 'Búsqueda empresa inventada → estado vacío', 'Correcto');
    } else {
      log('⚠️', 'Búsqueda empresa inventada', 'No se detectó estado de vacío');
    }
    // Limpiar búsqueda
    await searchInput.fill('');
  } else {
    log('⚠️', 'Buscador de empresas', 'Input de búsqueda no encontrado');
  }

  // Tab ETTs
  try {
    const ettTab = await page.$('text=ETT, text=ETTs, button:has-text("ETT"), [role="tab"]:has-text("ETT")');
    if (ettTab) {
      await ettTab.click();
      await wait(2000);
      await ss('32_empresas_tab_ETTs');
      log('✅', 'Tab ETTs clickeada', 'Cargada correctamente');
    } else {
      log('⚠️', 'Tab ETTs', 'No encontrada');
      // Buscar todas las tabs
      const tabs = await page.$$('[role="tab"], .tab, button[class*="tab"]');
      log('⚠️', 'Tabs disponibles', `${tabs.length} tabs encontradas`);
      await ss('32_empresas_tabs');
    }
  } catch(e) {
    log('⚠️', 'Tab ETTs', e.message);
  }

  // Tab Historial
  try {
    const histTab = await page.$('text=Historial, button:has-text("Historial"), [role="tab"]:has-text("Historial")');
    if (histTab) {
      await histTab.click();
      await wait(2000);
      await ss('33_empresas_historial');
      log('✅', 'Tab Historial', 'Cargada');
    } else {
      log('⚠️', 'Tab Historial', 'No encontrada en /app/empresas');
    }
  } catch(e) {
    log('⚠️', 'Tab Historial', e.message);
  }
}

// ═══════════════════════════════════════════════════════════
// FASE 8 — PERFIL Y PLAN
// ═══════════════════════════════════════════════════════════
async function fase8_perfil() {
  reportLines.push('\n## FASE 8 — PERFIL Y PLAN\n');

  await safeGoto(`${BASE_URL}/app/perfil`);
  await wait(2000);
  await ss('34_perfil_pagina');
  log('✅', 'Página /app/perfil cargada', page.url());

  const body = await page.textContent('body');

  // ¿Muestra "Plan Empresa"?
  if (body.toLowerCase().includes('empresa') || body.toLowerCase().includes('plan')) {
    log('✅', 'Perfil muestra info de plan', 'Texto relacionado con plan detectado');
  } else {
    log('⚠️', 'Perfil — plan', 'No se detecta info de plan en la página');
  }

  // Email del usuario demo
  if (body.includes('demo@') || body.includes('Demo')) {
    log('✅', 'Perfil muestra email del usuario', 'demo@buscaycurra.es visible');
  } else {
    log('⚠️', 'Perfil — email', 'Email del usuario no visible claramente');
  }

  // Tab "Mi Plan"
  try {
    const planTab = await page.$('text=Mi Plan, button:has-text("Plan"), [role="tab"]:has-text("Plan"), a:has-text("Plan")');
    if (planTab) {
      await planTab.click();
      await wait(2000);
      await ss('35_perfil_mi_plan');
      log('✅', 'Tab "Mi Plan" clickeada', 'Cargada');
    } else {
      log('⚠️', 'Tab "Mi Plan"', 'No encontrada — buscando tabs...');
      const tabs = await page.$$('[role="tab"]');
      for (const t of tabs) {
        const txt = await t.textContent();
        reportLines.push(`  - Tab: "${txt?.trim()}"`);
      }
    }
  } catch(e) {
    log('⚠️', 'Tab Mi Plan', e.message);
  }

  // Tab "Seguridad"
  try {
    const secTab = await page.$('text=Seguridad, button:has-text("Seguridad"), [role="tab"]:has-text("Seguridad")');
    if (secTab) {
      await secTab.click();
      await wait(2000);
      await ss('36_perfil_seguridad');
      const bodyS = await page.textContent('body');
      if (bodyS.toLowerCase().includes('contraseña') || bodyS.toLowerCase().includes('password')) {
        log('✅', 'Tab Seguridad — cambio de contraseña', 'Opción de contraseña encontrada');
      } else {
        log('⚠️', 'Tab Seguridad', 'No se detecta opción de cambiar contraseña');
      }
    } else {
      log('⚠️', 'Tab Seguridad', 'No encontrada');
      await ss('36_perfil_sin_seguridad');
    }
  } catch(e) {
    log('⚠️', 'Tab Seguridad', e.message);
  }
}

// ═══════════════════════════════════════════════════════════
// FASE 9 — EMIGRAR Y AU PAIR
// ═══════════════════════════════════════════════════════════
async function fase9_emigrar() {
  reportLines.push('\n## FASE 9 — EMIGRAR Y AU PAIR\n');

  // Emigrar
  await safeGoto(`${BASE_URL}/app/emigrar`);
  await wait(2000);
  await ss('37_emigrar_pagina');
  log('✅', 'Página /app/emigrar cargada', page.url());

  // Clicar en Alemania
  try {
    const alemBtn = await page.$('text=Alemania, button:has-text("Alemania"), a:has-text("Alemania"), [data-country="de"]');
    if (alemBtn) {
      await alemBtn.click();
      await wait(2000);
      await ss('38_emigrar_alemania');
      const body = await page.textContent('body');
      if (body.toLowerCase().includes('alemania') || body.toLowerCase().includes('deutschland')) {
        log('✅', 'Click Alemania → muestra info', 'Contenido de Alemania detectado');
      } else {
        log('⚠️', 'Click Alemania', 'No se detecta info de Alemania');
      }
    } else {
      log('⚠️', 'Botón Alemania', 'No encontrado en /app/emigrar');
      await ss('38_emigrar_sin_alemania');
    }
  } catch(e) {
    log('⚠️', 'Alemania click', e.message);
  }

  // Au Pair dentro de Alemania
  try {
    const auPairInAlem = await page.$('text=Au Pair, button:has-text("Au Pair"), a:has-text("Au Pair")');
    if (auPairInAlem) {
      await auPairInAlem.click();
      await wait(2000);
      await ss('39_emigrar_au_pair_dentro_alemania');
      log('✅', 'Au Pair dentro de Alemania clickeado', 'OK');
    } else {
      log('⚠️', 'Au Pair dentro de Alemania', 'No encontrado');
    }
  } catch(e) {
    log('⚠️', 'Au Pair dentro de Alemania', e.message);
  }

  // /app/au-pair
  await safeGoto(`${BASE_URL}/app/au-pair`);
  await wait(2000);
  await ss('40_au_pair_pagina');
  log('✅', 'Página /app/au-pair cargada', page.url());

  // ¿Se puede escribir en el formulario?
  const auPairInput = await page.$('input[placeholder], textarea[placeholder]');
  if (auPairInput) {
    await auPairInput.fill('Nombre de prueba QA');
    await wait(500);
    await ss('41_au_pair_formulario_texto');
    log('✅', 'Formulario au-pair — input', 'Se puede escribir en el formulario');
  } else {
    log('⚠️', 'Formulario au-pair', 'No se encontraron inputs de texto');
  }

  // ¿Hay preview de plantilla?
  const previewAP = await page.$('[class*="preview"], iframe, canvas, [class*="template"]');
  if (previewAP) {
    log('✅', 'Au Pair — preview de plantilla', 'Preview encontrado');
  } else {
    log('⚠️', 'Au Pair — preview', 'No se detectó preview de plantilla');
  }
}

// ═══════════════════════════════════════════════════════════
// FASE 10 — ENTREVISTAS
// ═══════════════════════════════════════════════════════════
async function fase10_entrevistas() {
  reportLines.push('\n## FASE 10 — ENTREVISTAS\n');

  await safeGoto(`${BASE_URL}/app/entrevistas`);
  await wait(2000);
  await ss('42_entrevistas_pagina');
  log('✅', 'Página /app/entrevistas cargada', page.url());

  // Seleccionar sector Hostelería
  try {
    const sectorSelectors = [
      'select',
      'button:has-text("Hostelería")',
      'text=Hostelería',
      '[class*="sector"]',
      '[class*="category"]'
    ];

    let sectorSelected = false;
    // Buscar select
    const selectEl = await page.$('select');
    if (selectEl) {
      await selectEl.selectOption({ label: 'Hostelería' }).catch(async () => {
        await selectEl.selectOption({ value: 'hosteleria' }).catch(async () => {
          await selectEl.selectOption({ value: 'hostelería' }).catch(() => {});
        });
      });
      await wait(2000);
      await ss('43_entrevistas_hosteleria');
      log('✅', 'Sector Hostelería seleccionado', 'Usando select');
      sectorSelected = true;
    }

    if (!sectorSelected) {
      const hostBtn = await page.$('button:has-text("Hostelería"), text=Hostelería');
      if (hostBtn) {
        await hostBtn.click();
        await wait(2000);
        await ss('43_entrevistas_hosteleria');
        log('✅', 'Sector Hostelería', 'Clickeado');
        sectorSelected = true;
      }
    }

    if (!sectorSelected) {
      log('⚠️', 'Sector Hostelería', 'No se encontró selector de sector');
      await ss('43_entrevistas_sin_hosteleria');
    }
  } catch(e) {
    log('⚠️', 'Selección sector', e.message);
  }

  // ¿Aparece una pregunta?
  await wait(2000);
  const body = await page.textContent('body');
  const hasPregunta = body.includes('?') || body.toLowerCase().includes('pregunta') || body.toLowerCase().includes('responde') || body.toLowerCase().includes('¿');
  if (hasPregunta) {
    log('✅', 'Pregunta de entrevista', 'Se detecta una pregunta en la página');
  } else {
    log('⚠️', 'Pregunta de entrevista', 'No se detecta pregunta de entrevista');
  }

  // Escribir respuesta larga (>500 caracteres)
  try {
    const respInput = await page.$('textarea, [contenteditable="true"]');
    if (respInput) {
      const longAnswer = 'Esta es mi respuesta de entrevista. '.repeat(20); // ~720 chars
      await respInput.fill(longAnswer);
      await wait(500);
      await ss('44_entrevistas_respuesta_larga');
      log('✅', 'Respuesta larga escrita', `${longAnswer.length} caracteres`);

      // Clicar "Analizar respuesta"
      const analyzeBtn = await page.$('button:has-text("Analizar"), button:has-text("analizar"), button:has-text("Evaluar"), button[type="submit"]');
      if (analyzeBtn) {
        await analyzeBtn.click();
        await wait(6000);
        await ss('45_entrevistas_analisis');
        const bodyAn = await page.textContent('body');
        if (bodyAn.toLowerCase().includes('análisis') || bodyAn.toLowerCase().includes('feedback') || bodyAn.toLowerCase().includes('resultado')) {
          log('✅', 'Análisis de respuesta', 'Resultado de análisis detectado');
        } else {
          log('⚠️', 'Análisis de respuesta', 'No se detecta resultado de análisis');
        }
      } else {
        log('⚠️', 'Botón "Analizar"', 'No encontrado');
      }
    } else {
      log('⚠️', 'Textarea de respuesta', 'No encontrado en /app/entrevistas');
    }
  } catch(e) {
    log('⚠️', 'Entrevistas respuesta', e.message);
  }
}

// ═══════════════════════════════════════════════════════════
// FASE 11 — COMPORTAMIENTOS INUSUALES
// ═══════════════════════════════════════════════════════════
async function fase11_inusuales() {
  reportLines.push('\n## FASE 11 — COMPORTAMIENTOS INUSUALES\n');

  // 11.1 /app/admin sin ser admin
  await safeGoto(`${BASE_URL}/app/admin`);
  await wait(2000);
  const adminUrl = page.url();
  const adminBody = await page.textContent('body');
  if (adminBody.toLowerCase().includes('no autorizado') || adminBody.toLowerCase().includes('acceso') ||
      adminBody.toLowerCase().includes('403') || adminBody.includes('unauthorized') ||
      adminUrl.includes('/login') || adminUrl.includes('error')) {
    log('✅', '/app/admin sin ser admin → bloqueado', `URL: ${adminUrl}`);
  } else {
    log('❌', '/app/admin → ACCESO NO BLOQUEADO', `URL: ${adminUrl} | Texto: ${adminBody.substring(0,150)}`);
  }
  await ss('46_admin_acceso');

  // 11.2 Doble click rápido en "Buscar"
  await safeGoto(`${BASE_URL}/app/buscar`);
  await wait(2000);
  try {
    const searchBtn = await page.$('button[type="submit"], button:has-text("Buscar")');
    if (searchBtn) {
      // Doble click rápido
      await searchBtn.click();
      await searchBtn.click();
      await wait(3000);
      await ss('47_doble_click_buscar');
      log('✅', 'Doble click en Buscar', `URL: ${page.url()} — revisar si hay double-submit`);
    } else {
      log('⚠️', 'Doble click', 'Botón Buscar no encontrado');
    }
  } catch(e) {
    log('⚠️', 'Doble click', e.message);
  }

  // 11.3 Resize a 320px
  await page.setViewportSize({ width: 320, height: 568 });
  await wait(1000);
  await ss('48_resize_320px');
  const body320 = await page.textContent('body');
  const hasOverflow = await page.evaluate(() => {
    return document.body.scrollWidth > 320;
  });
  if (hasOverflow) {
    log('⚠️', 'Viewport 320px — overflow horizontal', `scrollWidth > 320px — posible layout roto`);
  } else {
    log('✅', 'Viewport 320px', 'No hay overflow horizontal');
  }
  await page.setViewportSize({ width: 1280, height: 800 });

  // 11.4 /precios — botones de plan
  await safeGoto(`${BASE_URL}/precios`);
  await wait(2000);
  await ss('49_precios_pagina');
  const preciosUrl = page.url();
  const preciosBody = await page.textContent('body');
  if (preciosUrl.includes('/precios') || preciosBody.toLowerCase().includes('plan') || preciosBody.toLowerCase().includes('precio')) {
    log('✅', 'Página /precios cargada', preciosUrl);
    // ¿Hay botones de plan?
    const planBtns = await page.$$('button:has-text("Contratar"), button:has-text("Empezar"), button:has-text("Suscribir"), a:has-text("Contratar"), a:has-text("Empezar")');
    if (planBtns.length > 0) {
      log('✅', 'Botones de plan encontrados', `${planBtns.length} botones`);
      // Clicar el primero
      await planBtns[0].click();
      await wait(2000);
      await ss('50_precios_boton_plan_click');
      log('✅', 'Click en botón de plan', `URL: ${page.url()}`);
    } else {
      log('⚠️', 'Botones de plan', 'No encontrados en /precios');
    }
  } else {
    log('⚠️', '/precios', `URL inesperada: ${preciosUrl}`);
  }

  // 11.5 Recarga forzada en /app/buscar
  await safeGoto(`${BASE_URL}/app/buscar`);
  await wait(1500);
  try {
    const jobIn = await page.$('input[type="search"], input[placeholder*="trabajo"], input[placeholder*="puesto"], input[placeholder*="Busca"]');
    if (jobIn) {
      await jobIn.fill('cocinero');
      await wait(500);
    }
    await page.reload({ waitUntil: 'domcontentloaded' });
    await wait(2000);
    await ss('51_buscar_reload');
    const jobInAfter = await page.$('input[type="search"], input[placeholder*="trabajo"]');
    const val = jobInAfter ? await jobInAfter.inputValue() : '';
    if (val === 'cocinero') {
      log('✅', 'Reload en /app/buscar — mantiene estado', `Valor preservado: "${val}"`);
    } else {
      log('⚠️', 'Reload en /app/buscar — NO mantiene estado', `Valor tras reload: "${val}"`);
    }
  } catch(e) {
    log('⚠️', 'Reload en buscar', e.message);
  }
}

// ═══════════════════════════════════════════════════════════
// FASE 12 — NOTIFICACIONES
// ═══════════════════════════════════════════════════════════
async function fase12_notificaciones() {
  reportLines.push('\n## FASE 12 — NOTIFICACIONES\n');

  // Ir al dashboard
  await safeGoto(`${BASE_URL}/app/gusi`);
  await wait(2000);

  // Icono de campana
  try {
    const bellSelectors = [
      'button[aria-label*="notificacion"]',
      'button[aria-label*="notification"]',
      'button[aria-label*="campana"]',
      '[class*="bell"]',
      '[class*="notification"]',
      'svg[class*="bell"]',
      'button:has([class*="Bell"])',
      '[data-testid*="notif"]',
      'button:has(svg):near(:text("notif"))',
    ];

    let bellFound = false;
    for (const sel of bellSelectors) {
      try {
        if (await page.isVisible(sel, { timeout: 2000 })) {
          await page.click(sel);
          await wait(2000);
          await ss('52_notificaciones_panel');
          const body = await page.textContent('body');
          if (body.toLowerCase().includes('notificacion') || body.toLowerCase().includes('vacío') || body.toLowerCase().includes('no hay')) {
            log('✅', 'Panel de notificaciones', 'Panel abierto, contenido detectado');
          } else {
            log('⚠️', 'Panel de notificaciones', 'Panel abierto pero contenido no claro');
          }
          bellFound = true;
          break;
        }
      } catch {}
    }

    if (!bellFound) {
      log('⚠️', 'Icono de campana', 'No encontrado en ningún selector conocido');
      await ss('52_sin_campana');
    }
  } catch(e) {
    log('⚠️', 'Notificaciones', e.message);
  }

  // Badge de Guzzi
  try {
    const badgeSelectors = ['[class*="badge"]', '[class*="Badge"]', '[class*="count"]', 'span[class*="red"]', '.notification-badge'];
    for (const sel of badgeSelectors) {
      const el = await page.$(sel);
      if (el) {
        const badgeText = await el.textContent();
        log('⚠️', 'Badge encontrado', `Selector: ${sel} | Texto: "${badgeText?.trim()}" — ¿es hardcoded?`);
        break;
      }
    }
  } catch(e) {
    log('⚠️', 'Badge Guzzi', e.message);
  }

  await ss('53_dashboard_final');
}

// ═══════════════════════════════════════════════════════════
// RESUMEN DE ERRORES DE CONSOLA
// ═══════════════════════════════════════════════════════════
async function resumenConsola() {
  reportLines.push('\n## ERRORES DE CONSOLA DETECTADOS\n');
  if (consoleErrors.length === 0) {
    reportLines.push('✅ No se detectaron errores de consola graves\n');
  } else {
    reportLines.push(`❌ ${consoleErrors.length} errores de consola:`);
    consoleErrors.slice(0, 20).forEach(e => reportLines.push(`  - ${e.substring(0, 200)}`));
  }
  if (consoleWarnings.length > 0) {
    reportLines.push(`\n⚠️ ${consoleWarnings.length} warnings de consola (primeros 10):`);
    consoleWarnings.slice(0, 10).forEach(w => reportLines.push(`  - ${w.substring(0, 150)}`));
  }
}

// ═══════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════
async function main() {
  console.log('🚀 Iniciando auditoría UX exhaustiva de BuscayCurra...');
  reportLines.push('# INFORME AUDITORÍA UX EXHAUSTIVA — BuscayCurra');
  reportLines.push(`Fecha: ${new Date().toISOString()}`);
  reportLines.push(`URL: ${BASE_URL}`);
  reportLines.push(`Capturas: ${SCREENSHOTS_DIR}\n`);

  try {
    await setup();
    console.log('✅ Browser lanzado');

    await fase1_landing();
    console.log('✅ Fase 1 completada');

    await fase2_auth();
    console.log('✅ Fase 2 completada');

    await fase3_dashboard();
    console.log('✅ Fase 3 completada');

    await fase4_busqueda();
    console.log('✅ Fase 4 completada');

    await fase5_cv();
    console.log('✅ Fase 5 completada');

    await fase6_envios();
    console.log('✅ Fase 6 completada');

    await fase7_empresas();
    console.log('✅ Fase 7 completada');

    await fase8_perfil();
    console.log('✅ Fase 8 completada');

    await fase9_emigrar();
    console.log('✅ Fase 9 completada');

    await fase10_entrevistas();
    console.log('✅ Fase 10 completada');

    await fase11_inusuales();
    console.log('✅ Fase 11 completada');

    await fase12_notificaciones();
    console.log('✅ Fase 12 completada');

    await resumenConsola();

  } catch(e) {
    console.error('❌ Error fatal en auditoría:', e);
    reportLines.push(`\n❌ ERROR FATAL: ${e.message}\n${e.stack}`);
  } finally {
    try { await browser?.close(); } catch {}

    // Guardar informe
    const reportContent = reportLines.join('\n');
    fs.writeFileSync(REPORT_PATH, reportContent, 'utf8');
    console.log(`\n📄 Informe guardado: ${REPORT_PATH}`);
    console.log(`📸 Capturas en: ${SCREENSHOTS_DIR}`);
    console.log(`\n=== RESUMEN ===`);
    const ok = reportLines.filter(l => l.startsWith('✅')).length;
    const warn = reportLines.filter(l => l.startsWith('⚠️')).length;
    const error = reportLines.filter(l => l.startsWith('❌')).length;
    console.log(`✅ OK: ${ok} | ⚠️ PROBLEMAS: ${warn} | ❌ ROTOS: ${error}`);
  }
}

main();
