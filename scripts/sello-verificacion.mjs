#!/usr/bin/env node
import { readFileSync } from 'fs';
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
// BLOQUE ENVÍOS: los candados de la cadena de CV
// ═══════════════════════════════════════════════════════════════
// El 8 de agosto de 2026 un envío murió con "Cannot read properties of
// null (reading 'replace')" y el usuario nunca se enteró: la pantalla le
// había dicho que su CV salía. La causa era una línea que hacía
// .replace() sobre profiles.full_name, que puede venir a null — y once
// de los veinticuatro perfiles de producción lo tenían así.
//
// Estos candados leen el código fuente, no la web, porque el fallo vive
// ahí. Si alguien vuelve a tocar el nombre sin red, o a contar la cuota
// por su cuenta, el despliegue se para aquí.
// ═══════════════════════════════════════════════════════════════
console.log('\n📮 BLOQUE ENVÍOS: la cadena de CV');

const leerFuente = (p) => { try { return readFileSync(p, 'utf-8'); } catch { return ''; } };

test('El nombre del usuario nunca se usa a pelo en el worker', () => {
  const src = leerFuente('lib/cv-sender/worker.ts');
  if (!src) { console.log('     ↳ no se pudo leer lib/cv-sender/worker.ts'); return false; }
  // Nada de full_name suelto fuera del tipo y del SELECT: para eso está `nombre`.
  // Se exceptúa la línea que precisamente calcula `nombre`, que es el único
  // sitio donde tocar full_name directamente es lo correcto — sin esta excusa,
  // el candado saltaba contra el propio arreglo.
  const crudos = src.split('\n').filter(l =>
    l.includes('userProfile.full_name')
    && !l.trim().startsWith('//')
    && !l.includes('const nombre ='));
  if (crudos.length) {
    console.log('     ↳ ' + crudos.length + ' uso(s) directo(s) de userProfile.full_name; usa la variable nombre');
    return false;
  }
  return src.includes('const nombre =') && src.includes('"Candidato"');
});

test('El tipo del perfil admite que full_name venga a null', () => {
  return /full_name:\s*string\s*\|\s*null/.test(leerFuente('lib/cv-sender/worker.ts'));
});

test('La cuota se cuenta con una sola lista de estados', () => {
  const ficheros = ['lib/cv-sender/rate-limiter.ts', 'app/api/user/stats/route.ts',
                    'app/api/dashboard/route.ts', 'app/api/au-pair/send/route.ts'];
  const sueltos = [];
  for (const p of ficheros) {
    for (const l of leerFuente(p).split('\n')) {
      // Una lista escrita a mano se salta el criterio común: así fue como la
      // pantalla decía "te quedan 3" y el envío contestaba "límite alcanzado".
      if (/\.in\(\s*["']status["']\s*,\s*\[/.test(l)) sueltos.push(p + ': ' + l.trim().slice(0, 55));
    }
  }
  if (sueltos.length) { sueltos.forEach(x => console.log('     ↳ ' + x)); return false; }
  return true;
});

test('"visto" y "respondido" gastan cuota (si no, se regenera sola)', () => {
  const src = leerFuente('lib/cv-sender/rate-limiter.ts');
  const m = src.match(/ESTADOS_QUE_GASTAN_CUOTA\s*=\s*\[([^\]]+)\]/);
  if (!m) { console.log('     ↳ no existe ESTADOS_QUE_GASTAN_CUOTA'); return false; }
  const faltan = ['enviado', 'pendiente', 'visto', 'respondido'].filter(e => !m[1].includes(e));
  if (faltan.length) { console.log('     ↳ faltan estados: ' + faltan.join(', ')); return false; }
  // Y estos dos NO deben estar: lo que no salió no gasta cuota.
  return !m[1].includes('fallido') && !m[1].includes('cancelado');
});

test('No se puede encolar dos veces a la misma empresa', () => {
  const src = leerFuente('lib/cv-sender/tracker.ts');
  // "pendiente" tiene que contar, y hay que tratarlo aparte: su sent_at es null,
  // y la resta de fechas daba NaN, que en la comparación dejaba pasar el envío.
  return /\.in\("status",\s*\["pendiente"/.test(src) && src.includes('status === "pendiente"');
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
