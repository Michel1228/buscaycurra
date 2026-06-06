import { chromium, webkit } from 'playwright';

const BASE = 'https://buscaycurra.es';

// Test con WebKit (simula Safari/iOS)
console.log('\n=== TEST WEBKIT (simula iOS/Safari) ===');
{
  const browser = await webkit.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148',
    permissions: [], // sin permisos de micrófono
  });
  const page = await ctx.newPage();
  const consoleMessages = [];
  page.on('console', m => consoleMessages.push(m.type() + ': ' + m.text()));

  // Login
  await page.goto(`${BASE}/auth/login`, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(1000);
  await page.locator('input[type="email"]').pressSequentially('michelkm11batista@gmail.com', { delay: 30 });
  await page.locator('input[type="password"]').pressSequentially('HUBI1228', { delay: 30 });
  await page.waitForTimeout(500);
  try { await page.click('button[type="submit"]', { timeout: 5000 }); } catch { await page.locator('button[type="submit"]').click({ force: true }); }
  await page.waitForTimeout(5000);
  console.log('URL tras login:', page.url());

  // Ir a entrevistas
  await page.goto(`${BASE}/app/entrevistas`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(3000);

  // Verificar si hay botón de micrófono
  const btnMic = await page.$('button:has-text("voz"), button:has-text("micrófono"), button:has-text("Responder"), button:has-text("Escuchando"), button:has-text("Toca")');
  console.log('Botón micrófono encontrado:', btnMic ? 'SÍ' : 'NO');

  // Verificar SpeechRecognition disponible
  const hasSR = await page.evaluate(() => !!(window.SpeechRecognition || window.webkitSpeechRecognition));
  const hasGetUserMedia = await page.evaluate(() => !!(navigator.mediaDevices?.getUserMedia));
  console.log('SpeechRecognition disponible:', hasSR);
  console.log('getUserMedia disponible:', hasGetUserMedia);

  await page.screenshot({ path: 'C:/Users/MichelBatista/Desktop/audit-capturas/mic_webkit_entrevistas.png', fullPage: true });
  console.log('Captura guardada: mic_webkit_entrevistas.png');

  if (btnMic) {
    await btnMic.click();
    await page.waitForTimeout(3000);
    const textoTras = await page.textContent('body');
    const hayBloqueado = textoTras?.includes('bloqueado') || textoTras?.includes('denegado');
    console.log('¿Aparece "bloqueado/denegado" tras click?', hayBloqueado);
    await page.screenshot({ path: 'C:/Users/MichelBatista/Desktop/audit-capturas/mic_webkit_despues_click.png', fullPage: true });
  }

  console.log('Mensajes consola:', consoleMessages.filter(m => m.includes('error') || m.includes('Error') || m.includes('mic')).slice(0, 5));
  await browser.close();
}

// Test con Chromium (simula Chrome/Android)
console.log('\n=== TEST CHROMIUM (simula Chrome) ===');
{
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    permissions: ['microphone'], // con permiso
  });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/auth/login`, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(1000);
  await page.locator('input[type="email"]').pressSequentially('michelkm11batista@gmail.com', { delay: 30 });
  await page.locator('input[type="password"]').pressSequentially('HUBI1228', { delay: 30 });
  await page.waitForTimeout(500);
  try { await page.click('button[type="submit"]', { timeout: 5000 }); } catch { await page.locator('button[type="submit"]').click({ force: true }); }
  await page.waitForTimeout(5000);

  await page.goto(`${BASE}/app/entrevistas`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(3000);

  const hasSR = await page.evaluate(() => !!(window.SpeechRecognition || window.webkitSpeechRecognition));
  const hasGetUserMedia = await page.evaluate(() => !!(navigator.mediaDevices?.getUserMedia));
  console.log('SpeechRecognition disponible:', hasSR);
  console.log('getUserMedia disponible:', hasGetUserMedia);

  await page.screenshot({ path: 'C:/Users/MichelBatista/Desktop/audit-capturas/mic_chrome_entrevistas.png', fullPage: true });
  console.log('Captura guardada: mic_chrome_entrevistas.png');

  await browser.close();
}

console.log('\n✅ Test micrófono completado.');
