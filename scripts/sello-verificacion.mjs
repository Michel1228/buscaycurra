#!/usr/bin/env node
import { readFileSync, readdirSync } from 'fs';
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
test('robots.txt prohíbe /api/ a TODOS los bots, no solo a Google', async () => {
  // Un grupo de robots.txt no termina con una línea en blanco ni con un
  // comentario: termina con el siguiente "User-agent". Aquí los Disallow
  // estaban escritos bajo el bloque de Googlebot, así que Bing, Yandex y el
  // resto se quedaban con un "Allow: /" pelado y podían recorrer /api/ —
  // consultas reales y PDFs con Chromium en un servidor de dos núcleos.
  const r = await fetch(`${BASE}/robots.txt`);
  const txt = await r.text();

  // Trocear por grupos de User-agent, como hace un rastreador de verdad.
  const grupos = {};
  let actual = null;
  for (const linea of txt.split('\n')) {
    const l = linea.replace(/#.*$/, '').trim();
    if (!l) continue;
    const ua = l.match(/^user-agent:\s*(.+)$/i);
    if (ua) { actual = ua[1].trim(); grupos[actual] = grupos[actual] || []; continue; }
    if (actual) grupos[actual].push(l.toLowerCase());
  }

  const comodin = grupos['*'] || [];
  const faltan = ['/api/', '/app/', '/auth/'].filter(
    ruta => !comodin.some(l => l.startsWith('disallow:') && l.includes(ruta))
  );
  if (faltan.length) {
    console.log(`     ↳ el grupo "*" no prohíbe: ${faltan.join(', ')}`);
    return false;
  }
  return true;
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

test('Las tablas de CV se piden a la base propia, no a Supabase', () => {
  // user_cvs y "CV" viven en buscaycurra-db, no en Supabase: alli devuelven un
  // 404 seco. Preguntar por ellas con supabase.from(...) no da error, da lista
  // vacia — y eso se traduce en "no tienes CV". Once de los veinticuatro
  // usuarios tenian su CV hecho en el editor y la aplicacion les decia que lo
  // subieran. Lo peor: ese fallo ya se habia arreglado una vez, contra la base
  // equivocada, asi que el arreglo no tocaba nada.
  const malas = [];
  const dirs = ['app/api', 'lib'];
  const recorrer = (d) => {
    let entradas = [];
    try { entradas = readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of entradas) {
      const p = d + '/' + e.name;
      if (e.isDirectory()) { recorrer(p); continue; }
      if (!/\.tsx?$/.test(e.name)) continue;
      for (const l of leerFuente(p).split('\n')) {
        if (/\.from\(\s*["'](user_cvs|CV)["']\s*\)/.test(l) && !l.trim().startsWith('//')) {
          malas.push(p + ': ' + l.trim().slice(0, 55));
        }
      }
    }
  };
  dirs.forEach(recorrer);
  if (malas.length) { malas.forEach(x => console.log('     ↳ ' + x)); return false; }
  return true;
});

test('No se puede encolar dos veces a la misma empresa', () => {
  const src = leerFuente('lib/cv-sender/tracker.ts');
  // "pendiente" tiene que contar, y hay que tratarlo aparte: su sent_at es null,
  // y la resta de fechas daba NaN, que en la comparación dejaba pasar el envío.
  return /\.in\("status",\s*\["pendiente"/.test(src) && src.includes('status === "pendiente"');
});
test('Ninguna pantalla llama sin token a un endpoint que exige la cabecera', () => {
  // EL FALLO QUE VIGILA. /api/cv/extraer exige "Authorization" y sin ella
  // devuelve 401. El editor de currículum y Guzzi lo llamaban sin la cabecera,
  // así que el autorrelleno no se ejecutaba nunca: el usuario subía su PDF,
  // leía "✅ PDF procesado" y los campos seguían vacíos. Lo mismo pasaba con el
  // perfil de Au Pair: guardar sí llevaba token, cargar no, o sea que se
  // guardaba bien y al volver aparecía en blanco.
  //
  // OJO CON EL FALSO POSITIVO. Solo cuentan los endpoints que leen la cabecera
  // A PELO. Los que usan getUserId() aceptan también la cookie de sesión, así
  // que desde el navegador funcionan sin token — marcarlos sería ruido.
  const soloCabecera = new Set();
  const recorrer = (dir, fn) => {
    let entradas = [];
    try { entradas = readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entradas) {
      const p = dir + '/' + e.name;
      if (e.isDirectory()) recorrer(p, fn); else fn(p, e.name);
    }
  };

  recorrer('app/api', (p, nombre) => {
    if (nombre !== 'route.ts') return;
    const src = leerFuente(p);
    if (/headers\.get\(\s*["']Authorization["']\s*\)/.test(src)
        && !/getUserId\s*\(/.test(src)
        && /status:\s*401/.test(src)) {
      soloCabecera.add(p.replace(/^app/, '').replace(/\/route\.ts$/, ''));
    }
  });

  // Excepciones comprobadas contra producción, con su motivo.
  const excusadas = new Set([
    // El GET es público (devuelve 200 sin token, verificado); solo el POST de
    // publicar reseña pide sesión, y ese sí la manda.
    '/api/reviews',
  ]);

  const rotos = [];
  for (const raiz of ['app', 'components']) {
    recorrer(raiz, (p, nombre) => {
      if (p.startsWith('app/api/') || !/\.tsx?$/.test(nombre)) return;
      const src = leerFuente(p);
      if (!src.includes('"use client"')) return;
      const lineas = src.split('\n');
      for (let i = 0; i < lineas.length; i++) {
        const m = lineas[i].match(/fetch\(\s*[`"'](\/api\/[^`"'?]+)/);
        if (!m) continue;
        const ruta = m[1].replace(/\/$/, '');
        if (!soloCabecera.has(ruta) || excusadas.has(ruta)) continue;
        if (!/Authorization/.test(lineas.slice(i, i + 8).join(' '))) {
          rotos.push(`${p}:${i + 1} → ${ruta}`);
        }
      }
    });
  }

  if (rotos.length) { rotos.forEach(r => console.log('     ↳ ' + r)); return false; }
  return true;
});
test('La subida de PDF no se fía solo de file.type (el iPhone lo manda vacío)', () => {
  // Cuando el fichero se elige desde Archivos o iCloud Drive, iOS entrega
  // file.type VACÍO. Comparar contra "application/pdf" a secas rechazaba el
  // currículum antes de subirlo: el usuario de iPhone veía "Solo se aceptan
  // archivos PDF" con un PDF válido, y no llegaba ni a la extracción de datos.
  const malos = [];
  for (const p of ['app/app/curriculum/Content.tsx', 'components/GusiChat.tsx']) {
    const src = leerFuente(p);
    if (/file\.type\s*!==\s*["']application\/pdf["']/.test(src)) {
      malos.push(p + ': compara file.type a pelo, sin mirar la extensión');
    }
    if (!/\.pdf\$\/i\.test\(file\.name\)/.test(src)) {
      malos.push(p + ': no acepta por extensión .pdf');
    }
  }
  if (malos.length) { malos.forEach(m => console.log('     ↳ ' + m)); return false; }
  return true;
});

test('La intención de cursos va ANTES de la regla genérica de búsqueda', () => {
  // La regla genérica ("algo EN algún sitio" → buscar) se traga casi todo. Si
  // la de cursos va después, "curso de carretillero en Pamplona" acaba
  // buscando OFERTAS de carretillero en vez de formación.
  const src = leerFuente('lib/guzzi/intents.ts');
  const iCursos = src.indexOf('return "buscar_cursos"');
  const iGenerica = src.indexOf('return "buscar";', src.indexOf('OTRO_TEMA.test(t)'));
  if (iCursos === -1) { console.log('     ↳ no existe la intención buscar_cursos'); return false; }
  if (iGenerica === -1) { console.log('     ↳ no se encuentra la regla genérica'); return false; }
  if (iCursos > iGenerica) {
    console.log('     ↳ la regla de cursos está DESPUÉS de la genérica: se la come');
    return false;
  }
  return true;
});

test('Hay forma de volver a Inicio desde cualquier pantalla', () => {
  // /app/bienvenida no estaba en ningún menú: se entraba, se empezaba a
  // navegar y esa pantalla se perdía sin retorno posible.
  const src = leerFuente('components/AppNavWrapper.tsx');
  const fallos = [];
  if (!/href="\/app\/bienvenida"/.test(src)) {
    fallos.push('no hay ningún enlace a /app/bienvenida en la navegación');
  }
  // Y no vale solo dentro del menú desplegable: tiene que verse sin abrir nada
  const barra = src.slice(src.indexOf('height: "56px"'), src.indexOf('Menu overlay'));
  if (!/\/app\/bienvenida/.test(barra)) {
    fallos.push('el enlace a inicio no está en la barra superior, solo en el menú');
  }
  if (fallos.length) { fallos.forEach(f => console.log('     ↳ ' + f)); return false; }
  return true;
});

test('El autoguardado del CV espera a que el CV esté cargado (si no, lo borra)', () => {
  // El autoguardado arranca en cuanto hay userId, que se pone nada más
  // recuperar la sesión — mucho antes de que llegue el CV guardado, que es
  // otra petición. Sin el guard de cvCargado, el temporizador de 3 s disparaba
  // con el formulario vacío y escribía ese vacío ENCIMA del CV bueno.
  //
  // Pasó de verdad: una cuenta real se quedó sin nombre ni teléfono, solo con
  // el email. En un servidor con 85% de CPU robada, que una carga tarde más de
  // 3 s es lo normal, no la excepción.
  const src = leerFuente('app/app/curriculum/Content.tsx');
  const fallos = [];
  if (!/const \[cvCargado, setCvCargado\]/.test(src)) {
    fallos.push('falta el estado cvCargado');
  }
  if (!/setCvCargado\(true\)/.test(src)) {
    fallos.push('nunca se marca el CV como cargado');
  }
  // El efecto de autoguardado tiene que comprobarlo antes de programar el guardado
  const efecto = src.match(/if \(!userId[^)]*\) return;[\s\S]{0,200}?guardarCV\(\)/);
  if (!efecto || !/cvCargado/.test(efecto[0])) {
    fallos.push('el autoguardado no comprueba cvCargado antes de guardar');
  }
  if (fallos.length) { fallos.forEach(f => console.log('     ↳ ' + f)); return false; }
  return true;
});



// ═══════════════════════════════════════════════════════════════
// RESULTADO
// ═══════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════
// BLOQUE NOTIFICACIONES: que pulsar una notificación haga algo
//
// POR QUÉ EXISTE. Las notificaciones tenían DOS resolvedores de destino
// duplicados —uno en la campana y otro en la página— que fueron divergiendo, y
// los dos devolvían null cuando no reconocían el tipo. El componente hacía
// entonces `if (!url) return`: el usuario pulsaba y NO PASABA NADA. Sin error,
// sin aviso, sin ir a ninguna parte.
//
// Lo sufrió el tipo "curso": guardaba su destino en datos.url y ninguno de los
// dos resolvedores leía ese campo.
//
// Estas comprobaciones son sobre el código fuente a propósito: la invariante
// que hay que proteger es "nunca un clic muerto", y eso se ve mejor en el
// fuente que reimplementando aquí una copia de la lógica que volvería a
// divergir, que es justo el fallo que estamos arreglando.
// ═══════════════════════════════════════════════════════════════
console.log('\n🔔 BLOQUE NOTIFICACIONES: ningún clic muerto');

// leerFuente ya existe más arriba y devuelve '' si el fichero no está.
const leer = leerFuente;

const destinoSrc = leer('lib/notificaciones/destino.ts');
const campanaSrc = leer('components/NotificationBell.tsx');
const paginaSrc  = leer('app/app/notificaciones/page.tsx');

test('existe el resolvedor compartido de destinos', () => destinoSrc.length > 0);
test('el resolvedor devuelve string, nunca null', () =>
  /export function destinoDeNotificacion\([^)]*\):\s*string/.test(destinoSrc));
test('el resolvedor tiene red de seguridad final', () =>
  destinoSrc.includes('return "/app/notificaciones"'));
test('el resolvedor respeta datos.url', () => destinoSrc.includes('datos.url'));
test('el resolvedor entiende job_id y jobId', () =>
  destinoSrc.includes('datos.job_id') && destinoSrc.includes('datos.jobId'));
test('la campana usa el resolvedor compartido', () =>
  campanaSrc.includes('destinoDeNotificacion'));
test('la página usa el resolvedor compartido', () =>
  paginaSrc.includes('destinoDeNotificacion'));
test('la campana no tiene clics muertos', () => !/if \(!url\) return/.test(campanaSrc));
test('la página no tiene clics muertos', () => !/if \(url\) router\.push/.test(paginaSrc));


// Se espera a que TODAS terminen. Antes había un setTimeout de 5 segundos a
// ciegas, que podía cortar comprobaciones a medias y dar el visto bueno sin
// haberlas hecho.
await Promise.all(pendientes);

console.log(`\n${'═'.repeat(50)}`);
console.log(`  ✅ Passed: ${passed}  ❌ Failed: ${failed}`);
console.log(`${'═'.repeat(50)}\n`);
// SIN process.exit(). En Windows, cortar el proceso mientras libuv todavía está
// cerrando las conexiones de los fetch revienta con
//
//     Assertion failed: !(handle->flags & UV_HANDLE_CLOSING), src\win\async.c
//
// y el sello acababa devolviendo un código 127 con CERO fallos. Un sello que
// revienta al salir no protege: da un fallo que no existe y para el despliegue
// por nada. Marcando exitCode, Node cierra lo que tenga pendiente y se va con
// el código correcto.
process.exitCode = failed > 0 ? 1 : 0;
