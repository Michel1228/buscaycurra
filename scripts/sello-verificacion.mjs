#!/usr/bin/env node
/**
 * 🔒 SELLO DE VERIFICACIÓN — BuscayCurra
 * 
 * Tests que garantizan que los fixes críticos NO se rompen.
 * Ejecutar tras cada deploy: node scripts/sello-verificacion.mjs
 */

const BASE = process.env.BASE_URL || 'https://buscaycurra.es';
// Sin valor por defecto A PROPOSITO. Antes habia uno escrito aqui, y este
// fichero esta en un repositorio publico; ademas se rotó en la auditoria, asi
// que el check fallaba haciendo creer que el endpoint estaba roto cuando lo
// unico caducado era el secreto. Si no se define, la comprobacion se salta y
// lo dice, en vez de dar un fallo que no es.
const ALERTS_SECRET = process.env.ALERTS_SECRET || '';

let passed = 0;
let failed = 0;

/**
 * Ejecuta una comprobación. Devuelve una promesa siempre, para poder esperar
 * a todas antes de dar el resultado.
 *
 * OJO: antes esto no hacía `await` de las funciones async, y una promesa
 * siempre cuenta como verdadera. Resultado: todos los checks que hacían
 * peticiones HTTP pasaban aunque el sitio estuviera caído. Eran decorativos.
 */
const pendientes = [];
function test(name, fn) {
  const p = (async () => {
    try {
      const result = await fn();
      if (result) {
        console.log(`  ✅ ${name}`);
        passed++;
      } else {
        console.log(`  ❌ ${name} — FAIL`);
        failed++;
      }
    } catch (e) {
      console.log(`  💥 ${name} — ERROR: ${e.message}`);
      failed++;
    }
  })();
  pendientes.push(p);
  return p;
}

console.log('\n🔒 SELLO DE VERIFICACIÓN BuscayCurra\n');

// ═══════════════════════════════════════════════════════════════
// BLOQUE 1: detectIntent — regex de intenciones
// ═══════════════════════════════════════════════════════════════
console.log('📋 BLOQUE 1: detectIntent regex');

const entrevistaPrepRe = /(prep[aá]r|practicar|simul).*(entrevista)|entrevista.*(prep[aá]r|practica)/i;
test('entrevista_prep: "prepárame para entrevista desarrollador"', () => entrevistaPrepRe.test('prepárame para entrevista desarrollador backend'));
test('entrevista_prep: "preparar entrevista"', () => entrevistaPrepRe.test('preparar entrevista de trabajo'));
test('entrevista_prep: "practicar entrevista"', () => entrevistaPrepRe.test('practicar entrevista para mañana'));

const cityKwRe = /\w{3,}\s+(?:en|por)\s+\w{3,}/;
const negFilterRe = /(carta|entrevista|mejorar|crear|subir|foto|ayuda|hola|gracias|adios|trabajado|trabaj[éeáa]|trabajaba|experiencia|no\s+puedo|cargar\s+peso|espalda|dolor|lesi[oó]n|baja\s+m[ée]dica|salario|sueldo|m[ií]nimo|smi|cu[aá]nto|cuesta|vale|cobra|gana|derecho|paro|sepe|finiquito|vacaciones|despido|indemnizaci[oó]n|mercado\s+laboral|situaci[oó]n\s+laboral|perspectivas\s+laborales|c[oó]mo\s+est[aá]|hay\s+trabajo|posibilidades|emigrar|emigraci[oó]n)/i;

test('NO buscar: "mercado laboral en Alemania"', () => cityKwRe.test('mercado laboral en Alemania para enfermeros') && negFilterRe.test('mercado laboral en Alemania para enfermeros'));
test('NO buscar: "cómo está el mercado laboral"', () => negFilterRe.test('cómo está el mercado laboral en España'));
test('NO buscar: "cuánto gana diseñador UX"', () => negFilterRe.test('cuánto gana diseñador UX en España'));
test('NO buscar: "quiero emigrar a Alemania"', () => negFilterRe.test('quiero emigrar a Alemania'));
test('SÍ buscar: "camarero en Madrid"', () => cityKwRe.test('camarero en Madrid') && !negFilterRe.test('camarero en Madrid'));
test('SÍ buscar: "ingeniero de sonido en Barcelona"', () => cityKwRe.test('ingeniero de sonido en Barcelona') && !negFilterRe.test('ingeniero de sonido en Barcelona'));

// ═══════════════════════════════════════════════════════════════
// BLOQUE 2: extractJobTerm — regex de extracción de puesto
// ═══════════════════════════════════════════════════════════════
console.log('\n📋 BLOQUE 2: extractJobTerm regex');

const mDirectRe = /(?:^|\s)([a-záéíóúüñ][\sa-záéíóúüñ]+?)\s+(?:en|por)\s+\w+/i;
test('extractJobTerm: "ingeniero de sonido en Madrid"', () => {
  const m = mDirectRe.exec('ingeniero de sonido en Madrid');
  return m && m[1].trim() === 'ingeniero de sonido';
});
test('extractJobTerm: "busco camarero en Madrid" (sin ^)', () => {
  const m = mDirectRe.exec('busco camarero en Madrid');
  return m && m[1].trim() === 'busco camarero'; // luego se limpia el prefijo
});
test('extractJobTerm: "camarero en Tudela" (inicio)', () => {
  const m = mDirectRe.exec('camarero en Tudela');
  return m && m[1].trim() === 'camarero';
});
test('extractJobTerm: "desarrollador React en Madrid" (compuesto)', () => {
  const m = mDirectRe.exec('desarrollador React en Madrid');
  return m && m[1].trim() === 'desarrollador React';
});

// ═══════════════════════════════════════════════════════════════
// BLOQUE 3: Send-alerts — endpoint responde
// ═══════════════════════════════════════════════════════════════
console.log('\n📋 BLOQUE 3: send-alerts endpoint');

test('GET /api/push/send-alerts responde 200', async () => {
  if (!ALERTS_SECRET) {
    console.log('     ↳ se salta: define ALERTS_SECRET para comprobarlo');
    return true;
  }
  try {
    const r = await fetch(`${BASE}/api/push/send-alerts`, {
      headers: { Authorization: `Bearer ${ALERTS_SECRET}` }
    });
    const body = await r.json();
    return r.status === 200 && body.ok === true;
  } catch {
    return false;
  }
});

// ═══════════════════════════════════════════════════════════════
// BLOQUE 4: App responde HTTP 200
// ═══════════════════════════════════════════════════════════════
console.log('\n📋 BLOQUE 4: App health');

test('Homepage HTTP 200', async () => {
  try {
    const r = await fetch(BASE);
    return r.status === 200;
  } catch {
    return false;
  }
});

test('Guzzi page HTTP 200', async () => {
  try {
    const r = await fetch(`${BASE}/app/gusi`);
    return r.status === 200;
  } catch {
    return false;
  }
});


// ═══════════════════════════════════════════════════════════════
// BLOQUE SEO: las cabeceras que deciden si Google te rastrea
//
// POR QUÉ EXISTE ESTE BLOQUE. El 26 de mayo de 2026 se metió
// `Cache-Control: no-store` en todo el HTML para arreglar un problema de
// caché en el móvil. Eso le dice a Google que el contenido es efímero, así
// que bajó el rastreo y la web dejó de salir la primera al buscar
// "busca y curra". Estuvo así hasta el 16 de agosto: casi TRES MESES, y
// nadie se dio cuenta porque no había nada que lo vigilara.
//
// Estos cuatro checks son ese vigilante. Si alguien vuelve a poner
// no-store en la home, o mete un noindex, el despliegue falla aquí.
// ═══════════════════════════════════════════════════════════════
console.log('\n🔍 BLOQUE SEO: cabeceras y rastreo');

test('La home NO lleva no-store (si lo lleva, Google deja de rastrearla)', async () => {
  const r = await fetch(BASE);
  const cc = (r.headers.get('cache-control') || '').toLowerCase();
  if (cc.includes('no-store')) {
    console.log(`     ↳ cache-control recibido: ${cc}`);
    return false;
  }
  return true;
});

test('La home se puede cachear (public / s-maxage)', async () => {
  const r = await fetch(BASE);
  const cc = (r.headers.get('cache-control') || '').toLowerCase();
  return cc.includes('public') || cc.includes('s-maxage');
});

test('La home NO lleva noindex', async () => {
  const r = await fetch(BASE);
  const html = await r.text();
  const m = html.match(/<meta[^>]+name=["\']robots["\'][^>]*>/i);
  return !m || !/noindex/i.test(m[0]);
});

test('robots.txt permite el rastreo y declara el sitemap', async () => {
  const r = await fetch(`${BASE}/robots.txt`);
  const txt = await r.text();
  return /allow:\s*\//i.test(txt) && /sitemap:/i.test(txt) && !/disallow:\s*\/\s*$/im.test(txt);
});

// ═══════════════════════════════════════════════════════════════
// RESULTADO
// ═══════════════════════════════════════════════════════════════
// Se espera a que TODAS terminen. Antes había un setTimeout de 5 segundos a
// ciegas, que podía cortar comprobaciones a medias y dar el visto bueno sin
// haberlas hecho.
await Promise.all(pendientes);

console.log(`\n${'═'.repeat(50)}`);
console.log(`  ✅ Passed: ${passed}  ❌ Failed: ${failed}`);
console.log(`${'═'.repeat(50)}\n`);
process.exit(failed > 0 ? 1 : 0);
