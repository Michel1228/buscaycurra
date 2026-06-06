import { chromium } from 'playwright';

const BASE = 'https://buscaycurra.es';

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ locale: 'es-ES' });
const page = await ctx.newPage();

const errors400 = [];
page.on('response', r => { if (r.status() >= 400 && r.status() < 600) errors400.push(`HTTP ${r.status()} ${r.url()}`); });
page.on('console', m => { if (m.type() === 'error') errors400.push(`CONSOLE: ${m.text().slice(0, 150)}`); });

// Login
await page.goto(`${BASE}/auth/login`, { waitUntil: 'domcontentloaded', timeout: 20000 });
await page.waitForTimeout(1000);
await page.locator('input[type="email"]').pressSequentially('demo@buscaycurra.es', { delay: 30 });
await page.locator('input[type="password"]').pressSequentially('Demo2026!', { delay: 30 });
await page.waitForTimeout(500);
// Click forzado si el botón sigue disabled
try {
  await page.click('button[type="submit"]', { timeout: 5000 });
} catch {
  await page.locator('button[type="submit"]').click({ force: true });
}
await page.waitForTimeout(5000);
console.log('URL tras login:', page.url());

// Verificar /app/gusi — ¿hay textarea/input?
await page.goto(`${BASE}/app/gusi`, { waitUntil: 'domcontentloaded', timeout: 15000 });
await page.waitForTimeout(3000);
const inputGusi = await page.$('input, textarea');
console.log('INPUT en /app/gusi:', inputGusi ? 'ENCONTRADO (' + (await inputGusi.getAttribute('placeholder') || 'sin placeholder') + ')' : 'NO ENCONTRADO');

// Overflow en 320px — dashboard
await page.setViewportSize({ width: 320, height: 568 });
await page.goto(`${BASE}/app`, { waitUntil: 'domcontentloaded', timeout: 15000 });
await page.waitForTimeout(2000);
const scrollW = await page.evaluate(() => document.body.scrollWidth);
console.log('OVERFLOW 320px /app — scrollWidth:', scrollW, scrollW > 320 ? '⚠️ OVERFLOW' : '✅ OK');

// Overflow en /app/gusi
await page.goto(`${BASE}/app/gusi`, { waitUntil: 'domcontentloaded', timeout: 15000 });
await page.waitForTimeout(2000);
const scrollWGusi = await page.evaluate(() => document.body.scrollWidth);
console.log('OVERFLOW 320px /app/gusi — scrollWidth:', scrollWGusi, scrollWGusi > 320 ? '⚠️ OVERFLOW' : '✅ OK');

// Overflow en /app/buscar
await page.goto(`${BASE}/app/buscar`, { waitUntil: 'domcontentloaded', timeout: 15000 });
await page.waitForTimeout(2000);
const scrollWBuscar = await page.evaluate(() => document.body.scrollWidth);
console.log('OVERFLOW 320px /app/buscar — scrollWidth:', scrollWBuscar, scrollWBuscar > 320 ? '⚠️ OVERFLOW' : '✅ OK');

console.log('\nERRORES 4xx/5xx detectados:');
errors400.slice(0, 15).forEach(e => console.log(' -', e));
if (errors400.length === 0) console.log(' Ninguno');

await browser.close();
