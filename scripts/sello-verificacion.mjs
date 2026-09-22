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


// ═══════════════════════════════════════════════════════════════
// BLOQUE INTENTS NUEVOS: que la pregunta llegue al modelo
//
// POR QUE EXISTE. Probado contra Guzzi en produccion: "cobro el paro y me voy
// a Alemania, lo pierdo?" se clasificaba como busqueda de empleo y contestaba
// "que puesto buscas?". Y "mando el CV a una empresa de Londres, le pongo
// foto?" devolvia la ficha de una tienda de Covent Garden.
//
// Las instrucciones del prompt sobre el U2 y sobre la foto no llegaban a
// usarse NUNCA en esas preguntas: el enrutador contestaba antes. Un prompt
// puede estar perfecto y no servir de nada si la pregunta no llega hasta el.
//
// La primera version del arreglo TAMPOCO funciono, porque puse las reglas
// nuevas por debajo de las genericas. Estas comprobaciones vigilan el ORDEN,
// que es lo que fallaba.
// ═══════════════════════════════════════════════════════════════
console.log("");
console.log("🧭 BLOQUE INTENTS: el enrutador no se traga las preguntas");

const intentsSrc = leerFuente("lib/guzzi/intents.ts");
const posParo = intentsSrc.indexOf('return "paro_europeo"');
const posCv = intentsSrc.indexOf('return "cv_por_pais"');
const posBuscarGenerico = intentsSrc.indexOf('(busco|buscar|necesito|quiero).*(trabajo|empleo|oferta|puesto)');
const posInfoEmpresa = intentsSrc.indexOf('return "info_empresa"');

test("existe el intent paro_europeo", () => posParo > 0);
test("existe el intent cv_por_pais", () => posCv > 0);
test("paro_europeo va ANTES de la regla generica de buscar", () =>
  posParo > 0 && posBuscarGenerico > 0 && posParo < posBuscarGenerico);
test("cv_por_pais va ANTES de info_empresa", () =>
  posCv > 0 && posInfoEmpresa > 0 && posCv < posInfoEmpresa);

// ─────────────────────────────────────────────────────────────────────────
// Y AHORA EJECUTANDO LA FUNCION DE VERDAD, QUE ES LA LECCION.
//
// Las cuatro comprobaciones de arriba solo miran POSICIONES DE TEXTO en el
// fichero. Pasaron en verde durante dos dias mientras la regla del paro estaba
// MUERTA: las expresiones llevaban el byte de retroceso (0x08) donde tenia que
// ir la secuencia \b de limite de palabra. Ningun texto humano contiene ese
// byte, asi que la condicion era siempre falsa. El texto estaba en su sitio y
// el orden era el correcto; lo unico que no funcionaba era el codigo.
//
// Una comprobacion que no ejecuta lo que vigila no vigila nada. Estas si lo
// ejecutan: se compila intents.ts con esbuild y se le pasan frases reales.
// ─────────────────────────────────────────────────────────────────────────
test("detectIntent CLASIFICA BIEN frases reales (no solo existe el texto)", async () => {
  const { execFileSync } = await import("node:child_process");
  const { unlinkSync } = await import("node:fs");
  const salida = ".sello-intents.cjs";
  try {
    execFileSync("npx", ["esbuild", "lib/guzzi/intents.ts", "--bundle",
      "--format=cjs", "--platform=node", `--outfile=${salida}`, "--log-level=error"],
      { stdio: "pipe", shell: true });
    const { detectIntent } = await import(`../${salida}`);
    const casos = [
      // El caso exacto que estuvo roto: se iba a "buscar" y contestaba
      // "¿que puesto buscas?" a quien preguntaba si pierde el paro.
      ["estoy cobrando el paro y me quiero ir a Alemania a buscar trabajo, lo pierdo?", "paro_europeo"],
      ["quiero buscar trabajo en Alemania sin perder el paro", "paro_europeo"],
      ["puedo mantener la prestacion si busco empleo en Irlanda", "paro_europeo"],
      ["necesito el U2 para buscar trabajo en Holanda", "paro_europeo"],
      // Y que no se haya vuelto tan glotona que se coma las busquedas normales.
      ["camarero en Madrid", "buscar"],
      ["ingeniero de sonido en Barcelona", "buscar"],
    ];
    const fallos = casos.filter(([frase, esperado]) => detectIntent(frase) !== esperado);
    if (fallos.length) {
      for (const [frase, esperado] of fallos) {
        console.log(`     ↳ "${frase.slice(0, 50)}" deberia ser ${esperado} y da ${detectIntent(frase)}`);
      }
    }
    try { unlinkSync(salida); } catch { /* da igual */ }
    return fallos.length === 0;
  } catch (e) {
    console.log(`     ↳ no se pudo compilar intents.ts: ${e.message?.slice(0, 80)}`);
    return false;
  }
});

// El byte de retroceso es invisible al leer el codigo y rompe cualquier regex
// donde se cuele. Ya paso una vez; que no vuelva a pasar sin avisar.
test("no hay bytes de retroceso (0x08) escondidos en las expresiones", () =>
  !intentsSrc.includes(""));
test("el prompt aclara que el limite del tratado es DIARIO", () =>
  leerFuente("lib/guzzi/prompts.ts").includes("el limite del tratado es DIARIO"));


// ═══════════════════════════════════════════════════════════════
// BLOQUE NACIONALIDAD: que la respuesta dependa de quién pregunta
//
// POR QUE EXISTE. Tres fallos distintos, y ninguno daba error en pantalla:
//
//  1. La aplicacion usa "UK" para el Reino Unido y yo escribi "GB" en los
//     modulos nuevos. Resultado: el aviso de visado britanico no se disparaba
//     NUNCA, justo en el pais con mas ofertas de au pair. Un codigo mal escrito
//     no rompe nada visible; simplemente deja de aplicarse a alguien, en
//     silencio y para siempre.
//
//  2. El desplegable de nacionalidad reutilizaba la lista de DESTINOS, asi que
//     un argentino no encontraba Argentina y no podia decirnos de donde era.
//     Justo la persona para la que se hizo la funcion era la que no podia
//     usarla.
//
//  3. Se publicaba que un espanol puede pedir el Youth Mobility britanico
//     "cupo limitado, solicitar en enero". Espana no esta en ese programa. Le
//     daban hasta el mes para apuntarse a un visado que no existe para el.
//
// Estas comprobaciones no miran que la pagina cargue: miran que el dato sea el
// correcto para quien lo lee.
// ═══════════════════════════════════════════════════════════════
console.log("");
console.log("🌍 BLOQUE NACIONALIDAD: la respuesta depende de quien pregunta");

const puedesIr = leerFuente("lib/au-pair/puedes-ir.ts");
const movilidadSrc = leerFuente("lib/origen/movilidad.ts");
const nacionalidadesSrc = leerFuente("lib/origen/nacionalidades.ts");
const avisoSrc = leerFuente("components/origen/AvisoNacionalidad.tsx");
const requisitosSrc = leerFuente("lib/destinos/requisitos.ts");
const pasosSrc = leerFuente("lib/primeros-pasos.ts");

// 1. El codigo del Reino Unido
test('el Reino Unido se identifica como "UK", que es lo que usa la aplicacion', () =>
  puedesIr.includes('codigo: "UK"') && !puedesIr.includes('codigo: "GB"'));
test('realidadDe acepta tambien "GB" para que ninguna via se quede fuera', () =>
  puedesIr.includes('"GB" ? "UK"'));
test("movilidad.ts normaliza GB a UK", () =>
  movilidadSrc.includes("normalizarPais") && movilidadSrc.includes('if (c === "GB") return "UK"'));
test("el enlace oficial britanico esta indexado por UK, no por GB", () =>
  movilidadSrc.includes("  UK: {") && !movilidadSrc.includes("OFICIAL_POR_DESTINO.GB"));

// 2. Que cualquiera pueda decir de donde es
test("Argentina se puede elegir como nacionalidad", () =>
  nacionalidadesSrc.includes('codigo: "AR"'));
test("hay bastantes mas nacionalidades que destinos", () =>
  (nacionalidadesSrc.match(/codigo: "[A-Z]{2}"/g) || []).length >= 80);
test("el desplegable usa la lista de NACIONALIDADES, no la de destinos", () =>
  avisoSrc.includes("nacionalidadesAgrupadas") && !avisoSrc.includes("LISTA_PAISES"));

// 3. Los datos que estaban mal
test("ya no se dice que un espanol tenga cupo en el Youth Mobility britanico", () =>
  !/cupo limitado para españoles/i.test(pasosSrc));
test("se avisa de que el Youth Mobility NO incluye a Espana ni a la UE", () =>
  /Youth Mobility Scheme NO incluye a España/.test(pasosSrc));
test("a Espana le corresponde la subclase 462 australiana, no la 417", () =>
  pasosSrc.includes("subclase 462") &&
  pasosSrc.includes("work-holiday-462") &&
  !pasosSrc.includes("work-holiday-417"));
test("Nueva Zelanda es de 18 a 30 para espanoles, no hasta los 35", () =>
  !/Working Holiday Visa para españoles 18-35/.test(pasosSrc));
test("Canada ya no dice que Espana no tenga acuerdo de movilidad juvenil", () =>
  !/España no tiene acuerdo de movilidad juvenil con Canadá/.test(puedesIr));

// 4. Que exista ficha de los 26 destinos y se enseñe
test("hay ficha de requisitos de los 26 destinos", () =>
  new Set((requisitosSrc.match(/codigo: "([A-Z]{2})"|destinoUE\("([A-Z]{2})"/g) || [])).size === 26);
test("la ficha de requisitos se pinta en la pagina publica del pais", () =>
  leerFuente("app/trabajar-en/[pais]/page.tsx").includes("<RequisitosPais"));
test("las fichas separan quien es de la UE de quien no", () =>
  requisitosSrc.includes("siEresDeLaUE") && requisitosSrc.includes("siNoEresDeLaUE"));


// ═══════════════════════════════════════════════════════════════
// BLOQUE SALARIOS: que no demos por medido lo que es una estimacion
//
// POR QUE EXISTE. La pantalla de salarios etiquetaba las estimaciones como
// "INE 2026" en TODOS los paises. Para Alemania o Japon eso era citar al
// Instituto Nacional de Estadistica espanol como fuente de sueldos que no
// publica, y que ademas no salian de ahi: se calculan cogiendo la referencia
// espanola y multiplicandola por la razon entre salarios minimos.
//
// Ademas se pintaba "8.540 ofertas" para camarero desde una tabla fija. Ese
// recuento no lo hemos medido nunca.
//
// Y el codigo del Reino Unido otra vez: la pantalla manda "GB", el fichero de
// salarios minimos tiene "UK". No encontraba el dato britanico, el factor salia
// 1,00 y los sueldos de Londres se ensenaban identicos a los de Madrid.
// ═══════════════════════════════════════════════════════════════
console.log("");
console.log("💶 BLOQUE SALARIOS: estimacion y medicion no son lo mismo");

const salariosPage = leerFuente("app/app/salarios/page.tsx");
const salariosApi = leerFuente("app/api/salarios/route.ts");

test("no se atribuye al INE una cifra que no es del INE", () =>
  !/badge: "INE 2026"/.test(salariosPage) && !/: "INE 2026"\}/.test(salariosPage));
test("las estimaciones se llaman estimaciones", () =>
  salariosPage.includes('"Estimación"'));
test("el recuento de ofertas solo se ensena si de verdad se ha medido", () =>
  salariosPage.includes("topMedido") && salariosPage.includes('d.fuente === "ofertas"'));
test("el codigo de pais se normaliza (GB y UK son el mismo sitio)", () =>
  salariosApi.includes("normalizarPais"));
test("se avisa cuando no tenemos datos del pais en vez de ensenar los espanoles", () =>
  salariosApi.includes("sinDatos") && salariosPage.includes("sinDatos"));


// ═══════════════════════════════════════════════════════════════
// BLOQUE PALETA: que la aplicacion se parezca a si misma
//
// POR QUE EXISTE. Medido: 3.760 colores escritos a mano y 122 valores
// distintos, con una paleta oficial de nueve. Lo peor eran CINCO grises casi
// identicos para la misma tarjeta (#1e212b, #161922, #252836, #1a1d2e,
// #1a1f2e) repartidos por 93 ficheros. La diferencia entre ellos no la ve
// nadie, pero al cambiar de pantalla el fondo saltaba sin motivo: por eso cada
// pagina parecia de una aplicacion distinta.
//
// Y el aviso de cookies —el elemento mas visible de la web, sale en todas las
// paginas— estaba pintado de azul #2563EB y naranja #F97316, colores que la
// cabecera del fichero llamaba "de marca" y no lo son.
//
// Ahora hay una escala de tres superficies con papeles distintos y un solo
// color de borde. Esto vigila que siga asi: si aparece un gris nuevo, salta
// aqui antes de que se reproduzca por veinte ficheros.
// ═══════════════════════════════════════════════════════════════
console.log("");
console.log("🎨 BLOQUE PALETA: que no vuelvan los cinco grises");

function contarEnFuentes(patron) {
  let n = 0;
  const raices = ["app", "components"];
  const pila = [...raices];
  while (pila.length) {
    const dir = pila.pop();
    let entradas;
    try { entradas = readdirSync(dir, { withFileTypes: true }); } catch { continue; }
    for (const e of entradas) {
      const ruta = `${dir}/${e.name}`;
      if (e.isDirectory()) { if (!/node_modules|\.next/.test(ruta)) pila.push(ruta); continue; }
      if (!/\.tsx?$/.test(e.name)) continue;
      try { n += (readFileSync(ruta, "utf8").match(patron) || []).length; } catch { /* ignorar */ }
    }
  }
  return n;
}

// Los grises que se retiraron. Si vuelve alguno, es que alguien se invento otro
// fondo de tarjeta en vez de usar el que hay.
for (const gris of ["#1a1d2e", "#1a1f2e"]) {
  test(`no ha vuelto el gris de tarjeta ${gris}`, () =>
    contarEnFuentes(new RegExp(gris, "gi")) === 0);
}
// Los bordes sueltos.
for (const borde of ["#2d3748", "#374151", "#334155"]) {
  test(`no ha vuelto el borde suelto ${borde}`, () =>
    contarEnFuentes(new RegExp(borde, "gi")) === 0);
}
// #252836 es una superficie (--color-superficie2), no un borde. Usarlo como
// borde fue justo el error que se colo al limpiar esto la primera vez.
test("#252836 no se usa como borde (es superficie, no linea)", () =>
  contarEnFuentes(/solid\s+#252836/gi) === 0);

// El aviso de cookies, con los colores de la marca y no con los de otra.
//
// Se quitan los comentarios antes de mirar: la cabecera del fichero NOMBRA los
// colores que se retiraron para explicar por que, y sin esto la comprobacion se
// pillaba a si misma y fallaba por un texto explicativo.
function sinComentarios(fuente) {
  return fuente.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}
const cookieSrc = sinComentarios(leerFuente("components/CookieBanner.tsx"));
test("el aviso de cookies usa el verde de marca", () =>
  cookieSrc.includes("#22c55e"));
test("el aviso de cookies ya no usa el azul ni el naranja de fuera de paleta", () =>
  !/#2563EB/i.test(cookieSrc) && !/#F97316/i.test(cookieSrc));

// La paleta calida de texto. Habia DOS jerarquias de texto corriendo a la vez:
// la fria (#f1f5f9/#94a3b8/#64748b), que documenta CLAUDE.md y usan 80
// ficheros, y una calida sin documentar (#f0ebe0/#b0a890/#9a9378) que estaba
// solo en trece pero incluia el panel principal y la tarjeta de oferta, o sea
// lo que mas se ve al entrar. Se unifico a la fria.
for (const calido of ["#f0ebe0", "#b0a890", "#9a9378", "#504a3a", "#7ed56f"]) {
  test(`no ha vuelto el tono calido ${calido}`, () =>
    contarEnFuentes(new RegExp(calido, "gi")) === 0);
}

// LOS CUATRO RAYOS. La API del panel mandaba EMOJI como nombre de icono
// ("sparkles", "documento", "lupa", "grafico") y el cliente los resuelve con un
// switch que espera nombres en mayusculas. Ninguno encajaba, asi que los cuatro
// caian en `default: <Zap/>` y las cuatro acciones rapidas salian con el MISMO
// RAYO, para cuatro cosas distintas. Michel lo vio a simple vista.
const dashSrc = leerFuente("app/api/dashboard/route.ts");
test("la API del panel manda nombres de icono, no emoji", () =>
  /icon: "SPARKLES"/.test(dashSrc) &&
  !/icon: "[\u{1F300}-\u{1FAFF}\u2600-\u27BF]/u.test(dashSrc));
test("los cuatro atajos del panel llevan iconos distintos", () => {
  const iconos = [...dashSrc.matchAll(/\{ icon: "([A-Z0-9]+)"/g)].map(m => m[1]);
  return iconos.length >= 4 && new Set(iconos).size === iconos.length;
});
test("el respaldo de icono desconocido avisa en vez de callarse", () =>
  leerFuente("app/app/bienvenida/BienvenidaClient.tsx").includes("icono desconocido"));

// El menu era un arcoiris de nueve colores con glow de neon, y ninguno
// significaba nada. Ahora el color dice si estas o no en esa seccion.
const navSrc = leerFuente("components/AppNavWrapper.tsx");
test("los iconos del menu ya no llevan glow de neon", () =>
  !navSrc.includes("filter: `drop-shadow"));
test("el color del icono del menu depende de si la seccion esta activa", () =>
  navSrc.includes('const color = activo ? "#22c55e" : "#94a3b8"'));

// Guzzi NO se toca: es la mascota. Lo que se cambio fue el marco.
test("Guzzi sigue siendo la misma imagen de siempre", () =>
  leerFuente("components/LogoGusano.tsx").includes("/icon-192.png") &&
  leerFuente("components/GuzziAvatar.tsx").includes("/icon-192.png"));

// LOS EMOJI QUE HACIAN DE ICONO. Michel mando capturas: en "Buscar y enviar
// CV" habia un cohete de emoji en el estado vacio y tres emoji mas en la franja
// (personas, billetes volando, diana). En "Mi CV", los botones eran un disquete,
// un tick, una papelera y una paleta de pintor. Se pintan distinto en cada
// telefono y no pegan con el resto, que usa iconos de trazo.
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;
test("no queda ningun emoji en Buscar y enviar CV", () =>
  !EMOJI.test(leerFuente("app/app/buscar/page.tsx")));
test("los botones de Mi CV usan iconos, no emoji", () => {
  const cv = leerFuente("app/app/curriculum/Content.tsx");
  return cv.includes("<Trash2") && cv.includes("<Save") && !/>\s*🗑/.test(cv);
});
test("el centinela de exito del CV sigue intacto (es logica, no adorno)", () =>
  leerFuente("app/app/curriculum/Content.tsx").includes('startsWith("✅")'));

// LAS PAGINAS DE PAIS TARDABAN 15 SEGUNDOS. Eran force-dynamic, asi que cada
// visita ejecutaba un COUNT sobre 2,3 millones de filas. Es la MISMA leccion que
// la portada aprendio en su dia: alli force-dynamic daba 5-16 s y pantalla negra
// al arrancar en iOS, que costo un rechazo de Apple. Son 52 paginas publicas de
// las que llegan por Google, asi que esto no puede volver.
for (const ruta of ["app/trabajar-en/[pais]/page.tsx", "app/trabajar-en/[pais]/[keyword]/page.tsx"]) {
  const src = leerFuente(ruta);
  test(`${ruta.split("/").slice(1, 3).join("/")} se sirve de cache, no en cada visita`, () =>
    src.includes("export const revalidate") && !src.includes('dynamic = "force-dynamic"'));
}
test("la portada sigue sirviendose de cache", () =>
  leerFuente("app/(home)/page.tsx").includes("export const revalidate"));

// EL MICROFONO DE LAS ENTREVISTAS. La aplicacion daba el dictado por
// soportado con solo ver que existia `webkitSpeechRecognition`. Dentro del
// WebView de iOS esa API EXISTE pero NO FUNCIONA (fallo 239816 de WebKit), asi
// que fallaba y mandaba al usuario a Ajustes a dar un permiso que no arreglaba
// nada. Y en Android era imposible: RECORD_AUDIO ni siquiera estaba declarado.
const vozSrc = leerFuente("components/VoiceInterview/VoiceRecorder.tsx");
test("el dictado usa el plugin nativo dentro de la app", () =>
  vozSrc.includes("@capgo/capacitor-speech-recognition") && vozSrc.includes("isNative()"));
test("ya no se da por bueno el API del navegador dentro del WebView", () =>
  vozSrc.includes('setModoVoz(SR ? "web" : "ninguno")') && !vozSrc.includes("setSoporteVoz(!!SR)"));
test("se piden permisos de verdad, no se supone que estan", () =>
  vozSrc.includes("requestPermissions"));
test("Android declara el permiso de microfono", () =>
  leerFuente("android/app/src/main/AndroidManifest.xml").includes("android.permission.RECORD_AUDIO"));

// Las cabeceras eran bloques de verde macizo a pantalla completa. Michel pidio
// el acabado suave de la tarjeta de "microfono bloqueado" para todo.
for (const pantalla of [
  "app/app/buscar/page.tsx",
  "app/app/curriculum/Content.tsx",
  "app/app/curriculum/guardados/page.tsx",
  "app/app/notificaciones/page.tsx",
  "app/app/empresas/page.tsx",
  "app/empleo/[puesto]/[ciudad]/page.tsx",
]) {
  // Ojo: solo se vigilan las CABECERAS a pantalla completa. Un boton con
  // degradado verde esta bien y no debe hacer fallar nada; el problema eran los
  // bloques de color macizo ocupando todo el ancho.
  test(`${pantalla.split("/").slice(2).join("/")} no lleva cabecera de verde macizo`, () =>
    !/<div\s*\n?\s*className="(?:py-\d+ px-\d+|px-\d+ py-\d+)[^"]*"\s*\n?\s*style=\{\{ background: "linear-gradient\(135deg, #22c55e/m
      .test(leerFuente(pantalla)));
}

// LAS PAGINAS DE EMPLEO POR CIUDAD. Tardaban 8,5 s la primera vez que alguien
// pedia una combinacion. Medido con EXPLAIN ANALYZE, la base de datos eran solo
// 2 s: el resto era Next.js montando la pagina en un servidor con el 85% de la
// CPU robada. Se pre-generan las 80 combinaciones que traen visitas, para que
// ese coste lo pague la compilacion y no el usuario.
const empleoSrc = leerFuente("app/empleo/[puesto]/[ciudad]/page.tsx");
test("las combinaciones populares de empleo se pre-generan", () =>
  empleoSrc.includes("PUESTOS_POPULARES.slice") && !/generateStaticParams\(\) \{\s*return \[\];/.test(empleoSrc));
test("las consultas de empleo van en paralelo, no en fila", () =>
  (empleoSrc.match(/await Promise\.all\(\[/g) || []).length >= 2);
test("las paginas de empleo no se cachean para siempre", () =>
  empleoSrc.includes("export const revalidate"));

// LAS OFERTAS NO CADUCABAN NUNCA. La columna "expiresAt" se rellenaba y nadie
// la miraba: sin trabajo que actuara sobre ella, y con solo 1 de las 33
// consultas teniendola en cuenta, se acumulaban para siempre. Medido: 163.503
// ofertas con mas de tres meses ensenandose como activas. Y ocho de los diez
// extractores ni siquiera ponian la fecha.
test("existe el endpoint que retira las ofertas caducadas", () =>
  leerFuente("app/api/jobs/retirar-caducadas/route.ts").includes('"isActive" = false'));
// Programada en el crontab del VPS (limpiar-caducadas.sh, 05:30 UTC). Antes
// esta prueba leia .github/workflows/sync-jobs.yml, que no se ejecuta: GitHub
// solo lanza los calendarios programados desde main, y alli se desactivaron el
// 5 jul 2026. Daba por buena una programacion que no existia.
test("la limpieza esta programada, no depende de que alguien se acuerde", () =>
  /^[^#].*limpiar-caducadas\.sh/m.test(leerFuente("scripts/vps/crontab.txt")));
test("la columna de caducidad tiene valor por defecto", () =>
  leerFuente("db/migrations/004_caducidad_por_defecto.sql").includes("SET DEFAULT"));
test("los fallos del sincronizador se cuentan en vez de perderse", () => {
  const w = leerFuente("lib/job-search/sync-worker.ts");
  return w.includes("anotarFallo") && !w.includes("} catch { return []; }");
});

// NO SE PODIA CERRAR SESION EN EL MOVIL. El menu usaba max-height con 100vh, y
// en el movil 100vh NO es lo que se ve: incluye la franja de las barras del
// navegador y del sistema. El menu se creia mas alto de lo que cabe y lo ultimo
// de la lista quedaba fuera de pantalla. "Cerrar sesion" es justo lo ultimo,
// detras de veinte entradas.
const cssGlobal = leerFuente("app/globals.css");
test("el menu del movil mide con dvh, que es lo que de verdad se ve", () =>
  cssGlobal.includes("max-height: calc(100dvh - 80px)"));
test("y deja vh de respaldo, para no quedarse sin altura en navegadores viejos", () =>
  cssGlobal.includes("max-height: calc(100vh - 80px)"));
test("el menu respeta la barra inferior del iPhone", () =>
  cssGlobal.includes("env(safe-area-inset-bottom"));
test("con el menu abierto el fondo no se mueve", () =>
  leerFuente("components/AppNavWrapper.tsx").includes('document.body.style.overflow = "hidden"'));

// LOS ENVIOS QUE REVENTABAN NO DEJABAN RASTRO. El manejador `failed` del worker
// solo escribia en la consola: no marcaba la fila como fallida ni avisaba a
// nadie. Como "pendiente" GASTA CUOTA, cada envio reventado le comia un hueco
// del plan al usuario de forma permanente, por un CV que nunca salio. Medido al
// encontrarlo: 3 de 119 envios llevaban mas de 24 horas atascados.
const workerSrc = leerFuente("lib/cv-sender/worker.ts");
test("un envio fallido se marca como fallido, no se queda en pendiente", () =>
  workerSrc.includes('updateSendStatus(job.id as string, "fallido"'));
test("y solo cuando se han agotado los reintentos, no en el primero", () =>
  workerSrc.includes("job.attemptsMade < intentos"));
test("al usuario se le avisa de que su CV no salio", () =>
  workerSrc.includes('tipo: "cv_fallido"'));
test("hay rescate de envios colgados al arrancar el worker", () =>
  leerFuente("scripts/worker-entry.ts").includes("rescatarEnviosHuerfanos"));
test("el rescate usa los nombres de columna reales de cv_sends", () => {
  const r = leerFuente("lib/cv-sender/rescatar-huerfanos.ts");
  return r.includes('.eq("status", "pendiente")') && r.includes('"company_name"') === false
    && r.includes("company_name");
});

// UN CORREO DE CV SIN CV. El adjunto iba en un condicional: si el PDF venia
// vacio, el correo salia IGUAL y se devolvia success:true. La empresa recibia
// "te mando mi CV" sin nada dentro, la persona lo veia como enviado, y gastaba
// cuota. Un fallo se reintenta; esto quema la oportunidad en silencio.
const mailSrc = leerFuente("lib/cv-sender/email-sender.ts");
test("no se manda un correo de CV sin el CV dentro", () =>
  mailSrc.includes("SIN CV adjunto") && mailSrc.includes("if (!cvData.cvPdfBuffer?.length)"));
test("el generador comprueba que lo que devuelve es un PDF de verdad", () =>
  leerFuente("lib/cv-generator/generate-pdf.ts").includes('!== "%PDF-"'));

// EL CANDADO ANTIDUPLICADOS SE ABRIA AL FALLAR. canSendToCompany metia el error
// de consulta en el mismo saco que "no hay historial": las dos cosas devolvian
// true. Un fallo pasajero de Supabase y la proteccion desaparecia, dejando
// mandar dos CV identicos a la misma empresa con minutos de diferencia. Eso es
// lo que hace que marquen a alguien como spam, y el dano se lo lleva su correo.
const trackerSrc = leerFuente("lib/cv-sender/tracker.ts");
test("el candado antiduplicados se cierra cuando falla, no se abre", () =>
  trackerSrc.includes("Se bloquea el envio por precaucion") &&
  !trackerSrc.includes("if (error || !data || data.length === 0)"));

// CAMBIAR DE PLAN EN STRIPE NO CAMBIABA EL PLAN. El evento
// customer.subscription.updated solo escribia subscription_status, y solo si
// venia de past_due: NUNCA tocaba la columna `plan`. Y como el checkout rechaza
// a quien ya tiene plan activo, el portal es la UNICA via para cambiarlo. Bajar
// de plan = pagar menos y conservar los limites de antes. Subir = pagar mas y
// quedarse con los de antes.
const stripeHook = leerFuente("app/api/stripe/webhook/route.ts");
test("el webhook de Stripe actualiza el PLAN al cambiar de suscripcion", () =>
  /customer\.subscription\.updated[\s\S]{0,2000}cambios\.plan = planActual/.test(stripeHook));
test("y avisa si el precio de Stripe no esta en el mapa de planes", () =>
  stripeHook.includes('planActual === "free"') && stripeHook.includes("Precio desconocido"));

// EL LIMITE SEMANAL DE ENVIOS NO SE COMPROBABA NUNCA. Estaba declarado y solo
// se usaba para calcular el mensual (semana*4). Y el mensaje del tope decia
// "El plan Pro te da 500 envios al mes" cuando el real son 1.400.
const rlSrc = leerFuente("lib/cv-sender/rate-limiter.ts");
test("el limite semanal de envios se aplica de verdad", () =>
  rlSrc.includes("limiteSemana") && rlSrc.includes("enviosCVSemana"));
test("el mensaje del tope no promete una cifra inventada", () =>
  !rlSrc.includes("te da 500 envíos al mes"));

// LA PAGINA DE PRECIOS PROMETIA UNA COSA Y EL CODIGO HACIA OTRA.
//
// Decia "Sin envios de CV" en el plan gratuito cuando el codigo da 3 al dia (28
// al mes), "3 busquedas por camara" cuando son 2, y "2 consultas a Guzzi
// (total)" cuando son 15 DIARIAS. Dos sitios escribiendo los mismos numeros por
// separado siempre acaban diciendo cosas distintas.
//
// Michel decidio que el plan gratuito SI debe enviar CV —es lo que nos separa de
// InfoJobs— asi que gana el codigo y la pagina se cuadra con el. Ahora ademas
// saca los numeros de LIMITS en vez de escribirlos.
const preciosSrc = leerFuente("app/precios/page.tsx");
const limitsSrc = leerFuente("lib/plan-limits.ts");

test("la pagina de precios saca los numeros del codigo, no a mano", () =>
  preciosSrc.includes('from "@/lib/plan-limits"') && preciosSrc.includes("LIMITS.free.enviosCVDia"));
test("el plan gratuito ya no dice que no puede enviar CV", () =>
  !preciosSrc.includes('badge: "Sin envíos de CV"') &&
  !/\{ t: "Envíos de CV", ok: false/.test(preciosSrc));
test("no se vende una API que no existe", () =>
  !/\{ t: "API e integraciones", ok: true/.test(preciosSrc));

// Y que los numeros de los planes DE PAGO sigan cuadrando con plan-limits.
// Hoy cuadran; esto es para que no se separen manana.
function limiteDe(plan, campo) {
  // OJO CON LAS PLANTILLAS DE JAVASCRIPT. La primera version construia la
  // expresion con backticks, y ahi \s y \d se quedan en "s" y "d": acababa
  // buscando "enviosCVDias*(d+)", que no casa con nada. Devolvia null y la
  // comprobacion fallaba sin que el codigo tuviera ningun problema — o sea, una
  // prueba que miente, que es peor que no tenerla. Con concatenacion normal los
  // escapes sobreviven.
  const bloque = limitsSrc.split(plan + ": {")[1] || "";
  const m = bloque.match(new RegExp(campo + ":\\s*(\\d+)"));
  return m ? m[1] : null;
}
for (const [plan, campo, texto] of [
  ["esencial", "enviosCVDia", "envíos CV/día"],
  ["esencial", "guzziMaxConsultasDia", "consultas/día a Guzzi"],
  ["pro", "enviosCVDia", "envíos CV/día"],
  ["pro", "guzziMaxConsultasDia", "consultas/día a Guzzi"],
]) {
  const n = limiteDe(plan, campo);
  test(`precios cuadra con el codigo: ${plan} ${texto} = ${n}`, () =>
    n !== null && preciosSrc.includes(`${n} ${texto}`));
}

// LA MOROSIDAD SOLO PROTEGIA A GUZZI. getPlanEfectivo() existia y era correcta,
// pero la llamaba UN solo sitio: el chat. Los otros ocho leian select("plan") a
// secas. Resultado: alguien dejaba de pagar el plan Pro y conservaba 50 envios
// de CV al dia, 30 fotos con GPT-4o —que se pagan a OpenAI— , entrevistas, 10
// CVs y 200 ofertas guardadas. Lo unico que perdia era el chat, o sea que lo
// unico protegido era justo lo mas caro y todo lo demas quedaba abierto.
const gates = [
  ["app/api/cv/guardar/route.ts", "planEfectivoDeUsuario"],
  ["app/api/jobs/guardar/route.ts", "planEfectivoDeUsuario"],
  ["app/api/entrevistas/chat/route.ts", "planEfectivoDeUsuario"],
  ["app/api/entrevistas/feedback/route.ts", "planEfectivoDeUsuario"],
  ["app/api/gusi/analyze-image/route.ts", "planEfectivoDeUsuario"],
  ["app/api/cv-sender/envios-hoy/route.ts", "getPlanEfectivo"],
  ["app/api/au-pair/send/route.ts", "getPlanEfectivo"],
  ["app/api/user/stats/route.ts", "getPlanEfectivo"],
  ["lib/cv-sender/rate-limiter.ts", "getPlanEfectivo"],
];
for (const [ruta, fn] of gates) {
  const corto = ruta.replace("app/api/", "").replace("/route.ts", "");
  test(`${corto} respeta el estado de la suscripcion`, () =>
    leerFuente(ruta).includes(fn));
}

// El plan Empresa se saltaba la lista negra: el atajo de "ilimitado" retornaba
// ANTES de comprobarla. El que mas envia era el unico que ignoraba a quien pidio
// no recibir CVs. Eso no es cuota, es una peticion de la otra parte.
test("la lista negra se comprueba ANTES del atajo del plan empresa", () => {
  const src = leerFuente("lib/cv-sender/rate-limiter.ts");
  return src.indexOf("isInBlacklist(companyEmail)") < src.indexOf('if (plan === "empresa")');
});

// La portada: la misma cifra salia dos veces con etiquetas distintas.
const homeSrc = leerFuente("app/(home)/page.tsx");
test("la portada no repite la misma cifra dos veces", () =>
  !homeSrc.includes("ofertas objetivo"));


// Se espera a que TODAS terminen. Antes había un setTimeout de 5 segundos a
// ciegas, que podía cortar comprobaciones a medias y dar el visto bueno sin
// haberlas hecho.
// ── NAVEGACION EN MOVIL ──────────────────────────────────────────────────────
//
// La barra de /app/* es `fixed top-0` y mide 56px, y no empuja el contenido:
// cada pagina tiene que dejarle sitio ella misma. La de detalle de oferta se
// quedo en py-6 (24px), asi que su primera fila —que era justo el boton de
// volver— aparecia DEBAJO de la barra. En el navegador se disimula porque el
// movil trae su propio boton de atras; dentro de la app del iPhone no hay
// ninguno, y el usuario se quedaba encerrado en la oferta.
const PAGINAS_APP = [
  "app/app/ofertas/[id]/OfertaDetalleClient.tsx",
  "app/app/au-pair/page.tsx",
  "app/app/admin/page.tsx",
  "app/app/emigrar/page.tsx",
];
for (const pagina of PAGINAS_APP) {
  test(`${pagina} deja sitio a la barra fija de 56px`, () => {
    const src = leerFuente(pagina);
    // pt-16 = 64px, pt-20 = 80px, pt-24 = 96px. Cualquiera pasa de 56.
    return src.includes("pt-16") || src.includes("pt-20") || src.includes("pt-24");
  });
}

// El iPhone no tiene boton de atras: la vista de detalle necesita el suyo, y
// tiene que poder pulsarse (Apple pide 44px) y funcionar aunque no haya
// historial, que es lo que pasa al abrir la oferta desde una notificacion.
const detalleSrc = leerFuente("app/app/ofertas/[id]/OfertaDetalleClient.tsx");
test("el detalle de oferta lleva flecha de volver", () =>
  detalleSrc.includes("<ArrowLeft") && detalleSrc.includes("router.back()"));
test("la flecha de volver se puede tocar con el dedo (44px)", () =>
  detalleSrc.includes('minHeight: "44px"'));
test("volver funciona aunque no haya historial (llegada por notificacion)", () =>
  detalleSrc.includes("window.history.length > 1"));


// ── ADZUNA: SOLO LOS PAISES QUE EXISTEN ──────────────────────────────────────
//
// Adzuna publica 19 paises. El calendario de sincronizacion pedia ademas
// Irlanda y Suecia, que no estan. El codigo no fallaba: caia a España por tres
// sitios a la vez -consultaba la API española, buscaba en ciudades españolas y
// etiquetaba el resultado con el pais pedido-, asi que guardaba ofertas de
// A Coruña, Vigo y Toledo como suecas. 6.820 en produccion. Quien filtraba por
// Suecia veia Galicia; quien filtraba por España no las veia.
//
// Esta comprobacion compara las dos listas. Es la que habria cazado aquello.
const syncSrc = leerFuente("lib/job-search/sync-worker.ts");

// Los paises de ADZUNA_COUNTRIES, tal cual estan escritos en el fuente.
const tablaAdzuna = syncSrc.split("const ADZUNA_COUNTRIES")[1] || "";
const cierre = tablaAdzuna.indexOf("};");
const paisesAdzuna = [...tablaAdzuna.slice(0, cierre).matchAll(/^  ([a-z]{2}):/gm)].map(m => m[1]);

// Los que piden DE VERDAD los scripts de Adzuna del crontab del VPS. Antes se
// leia el calendario de GitHub sync-jobs.yml, que no se ejecuta desde el 5 jul
// 2026: de alli se quito Suecia el 4 de septiembre y esta prueba se puso en
// verde, mientras /root/sync-adzuna-loop.sh la seguia pidiendo tres veces al dia.
const loopAdzuna = leerFuente("scripts/vps/sync-adzuna-loop.sh");
const plan19 = (leerFuente("scripts/vps/sync-adzuna-19.sh").match(/^PLAN="([^"]+)"/m) || [])[1] || "";
const paisesCalendario = [
  ...((loopAdzuna.match(/^for p in ([a-z ]+); do/m) || [])[1] || "").split(" "),
  ...plan19.split(" ").map(e => e.split(":")[0]),
].filter(Boolean);

test("la tabla de Adzuna tiene los 19 paises que publica", () =>
  paisesAdzuna.length === 19);

test("los scripts del VPS no piden a Adzuna paises que no existen", () => {
  const sobran = paisesCalendario.filter(p => !paisesAdzuna.includes(p));
  if (sobran.length) console.log("      sobran: " + sobran.join(", "));
  return sobran.length === 0 && paisesCalendario.length > 0;
});

test("el sincronizador se planta si el pais no esta en Adzuna", () =>
  syncSrc.includes("adzunaCubrePais") && syncSrc.includes("Adzuna no cubre"));


// ── LOS ENLACES A OFERTAS APUNTAN DONDE ESTAN LAS OFERTAS ────────────────────
//
// La portada leia sus seis ofertas de la tabla `ofertas` de Supabase, que lleva
// congelada desde el 5 de julio, pero la tarjeta enlaza a /app/ofertas/<id> y
// esa pagina consulta JobListing en la base propia. Dos espacios de
// identificador distintos: los seis enlaces estaban muertos.
//
// No daba error. Salian seis ofertas con su titulo y su empresa, y al pulsar
// cualquiera aparecia "Oferta no encontrada". Es lo primero que se ve al entrar.
const panelSrc = leerFuente("app/api/dashboard/route.ts");

test("la portada lee las ofertas de JobListing, no de Supabase", () =>
  panelSrc.includes('FROM "JobListing"') && !panelSrc.includes('.from("ofertas")'));

test("un fallo leyendo las ofertas de la portada se ve en el registro", () =>
  panelSrc.includes("[dashboard] No se pudieron leer las ofertas"));

// ── EL BARRIDO DE ADZUNA ─────────────────────────────────────────────────────
//
// El sincronizador de siempre pide solo la pagina 1 de cada combinacion, asi
// que cada pasada vuelve a bajarse lo mismo: de 104.000 ofertas al dia solo
// 16.000 son nuevas. El barrido pagina el catalogo sin palabras clave.
const barridoSrc = leerFuente("app/api/jobs/sync-adzuna-barrido/route.ts");

test("el barrido de Adzuna existe y esta protegido por el secreto", () =>
  barridoSrc.includes("secretIguales") && barridoSrc.includes("barrerAdzuna"));

test("el barrido se reanuda por donde iba (guarda la pagina)", () =>
  barridoSrc.includes("guardarOffset") && barridoSrc.includes("leerOffset"));

test("el barrido no pide palabra clave ni ciudad", () => {
  const s2 = leerFuente("lib/job-search/sync-worker.ts");
  const fn = s2.split("export async function fetchAdzunaPagina")[1] || "";
  const cuerpo = fn.slice(0, fn.indexOf("anotarFallo"));
  return cuerpo.length > 0 && !cuerpo.includes("what=") && !cuerpo.includes("where=");
});


// ── LA NOTIFICACION DE "CV ENVIADO" NO LLEVA A UN ERROR ──────────────────────
//
// queue.ts genera el identificador de la COLA como "cv-<usuario>-<fecha>". El
// worker lo guardaba en datos.jobId, y destinoDeNotificacion prioriza ese campo
// sobre el mapa por tipo: montaba /app/ofertas/cv-8f3a...-1757, que no existe.
// La notificacion del envio —la accion mas importante que tenemos— acababa en
// "Oferta no encontrada" en 76 de cada 78 casos.
//
// Esta comprobacion EJECUTA la funcion en vez de mirar si el texto esta. Ya nos
// paso con el detector de intenciones de Guzzi: el sello daba por bueno un
// fichero con bytes de retroceso dentro porque solo comparaba posiciones.
test("destinoDeNotificacion no manda a una oferta inventada", async () => {
  const { execFileSync } = await import("node:child_process");
  const { unlinkSync } = await import("node:fs");
  const salida = "scripts/.tmp-destino.cjs";
  execFileSync("npx", ["esbuild", "lib/notificaciones/destino.ts", "--bundle",
    "--format=cjs", "--platform=node", `--outfile=${salida}`, "--log-level=error"],
    { stdio: "pipe", shell: true });
  const { destinoDeNotificacion } = await import(`../${salida}`);

  const casos = [
    // Lo que rompia: identificador de la cola, no de una oferta.
    [{ tipo: "cv_enviado", datos: { companyName: "Acme", colaJobId: "cv-8f3a-1757" } }, "/app/envios"],
    // Y las que ya estan guardadas con el nombre viejo, que tambien se reparan.
    [{ tipo: "cv_enviado", datos: { companyName: "Acme", jobId: "cv-8f3a-1757" } }, "/app/envios"],
    // Una oferta de verdad si tiene que llevar a la oferta.
    [{ tipo: "cv_enviado", datos: { jobId: "d92fd96823e08edc626d0c07" } }, "/app/ofertas/d92fd96823e08edc626d0c07"],
    // Y el destino explicito manda por encima de todo.
    [{ tipo: "cv_enviado", datos: { url: "/app/pipeline" } }, "/app/pipeline"],
  ];

  let bien = true;
  for (const [n, esperado] of casos) {
    const r = destinoDeNotificacion(n);
    if (r !== esperado) { console.log(`      ${JSON.stringify(n.datos)} -> ${r} (se esperaba ${esperado})`); bien = false; }
  }
  try { unlinkSync(salida); } catch {}
  return bien;
});


// ── LO QUE PIDE EL SQL Y LO QUE LEE EL JAVASCRIPT SE LLAMAN IGUAL ────────────
//
// Postgres devuelve los identificadores entrecomillados tal cual: "sourceUrl"
// vuelve como sourceUrl, no como sourceurl. El mapeo del buscador los leia en
// minusculas, asi que url, fecha y fuente llegaban vacias en TODAS las ofertas.
// No fallaba: las tarjetas salian, solo que sin enlace, sin fecha y sin origen.
//
// El de contactEmail ya se aliaseaba bien. Quien lo añadio no vio que los tres
// de arriba estaban rotos, y por eso esta comprobacion mira los cuatro.
const buscaSrc = leerFuente("app/api/jobs/search/route.ts");

for (const campo of ["sourceurl", "sourcename", "scrapedat", "contactemail"]) {
  test(`el buscador devuelve ${campo} (alias en el SQL, no camelCase)`, () => {
    // Si el JavaScript lo lee en minusculas, el SQL tiene que aliasearlo.
    if (!buscaSrc.includes("j." + campo)) return true;  // no se lee, nada que comprobar
    return buscaSrc.includes("AS " + campo);
  });
}

// ── LA CAMPANA CUENTA TODAS, NO SOLO LA PRIMERA PAGINA ───────────────────────
//
// Se pedian 50 notificaciones y se contaban las no leidas DE ESAS 50. Hay
// usuarios con 262: si sus 50 mas recientes estaban leidas, la campana marcaba
// cero teniendo 200 sin leer detras.
const rutaCampanaSrc = leerFuente("app/api/notifications/route.ts");

test("la campana cuenta las no leidas sobre todas las filas", () =>
  rutaCampanaSrc.includes('count: "exact", head: true'));


// ── LOS CALENDARIOS USAN UN SECRETO QUE EXISTE ─────────────────────────
//
// Al escribir el barrido puse secrets.SYNC_SECRET, que no existe: el que hay
// configurado es ADMIN_SECRET. Habria dado 401 todos los dias a las cinco de la
// mañana sin que nadie se enterase, porque un workflow que recibe 401 y sigue
// adelante termina en verde igual.
const SECRETOS_QUE_EXISTEN = ["ADMIN_SECRET", "GITHUB_TOKEN"];
for (const nombre of readdirSync(".github/workflows").filter(n => n.endsWith(".yml"))) {
  const src = leerFuente(".github/workflows/" + nombre);
  if (!src.includes("x-sync-secret")) continue;
  test(nombre + " usa un secreto que existe", () => {
    const usados = [...src.matchAll(/secrets[.]([A-Z_]+)/g)].map(m => m[1]);
    const raros = [...new Set(usados)].filter(u => !SECRETOS_QUE_EXISTEN.includes(u));
    if (raros.length) console.log("      secreto desconocido: " + raros.join(", "));
    return raros.length === 0;
  });
}

// ── EL FILTRO DE SALARIO NO PEGA NUMEROS ─────────────────────────────
//
// Borraba todo lo que no fuera digito y pegaba lo que quedaba:
//
//     "30000 - 30000"  ->  3000030000    pasaba cualquier filtro
//     "12 - 12"        ->  1212          no pasaba ninguno
//
// El salario se guarda casi siempre como rango: 488.699 ofertas vivas tienen
// esa forma. El filtro no filtraba, devolvia de todo, y el usuario se lo creia.
//
// Lo correcto es el PRIMER numero (el minimo del rango), quitando antes los
// separadores de miles o "£100,000" se queda en 100. Comprobado contra la base
// de produccion con los ocho formatos reales, millones incluidos.
const salarioSrc = leerFuente("app/api/jobs/search/route.ts");

test("el filtro de salario no concatena los numeros del rango", () =>
  !salarioSrc.includes("regexp_replace(salary, '[^0-9]'"));

test("el filtro de salario se queda con el primer numero", () =>
  salarioSrc.includes("SALARIO_MINIMO_SQL") && salarioSrc.includes("from '[0-9]+'"));

test("el filtro de salario quita los separadores de miles antes", () =>
  salarioSrc.includes("([0-9])[.,]([0-9]{3})"));

// ── LOS RESPALDOS NO SE SALTAN EL PAIS ───────────────────────────────
//
// El respaldo por ciudad filtraba solo por ciudad, y hay ciudades que se llaman
// igual en sitios distintos: Toledo esta en Castilla-La Mancha y en Ohio,
// Valencia en España y en Venezuela. Con Espana elegida podian llegar ofertas
// de Estados Unidos mientras el filtro seguia marcado en pantalla.
test("el respaldo por ciudad respeta el pais elegido", () =>
  salarioSrc.includes("condPais") && salarioSrc.includes("condPaisCuenta"));

// ── NINGUN PAIS DE LA APP SE QUEDA SIN SINCRONIZAR ─────────────────────
//
// La aplicacion ofrece 26 paises. Seis de ellos —Japon, Singapur, Grecia,
// Chequia, Hungria y Rumania— no estaban en ningun calendario, asi que nunca
// se sincronizaron. Su configuracion llevaba tiempo escrita en
// careerjet-countries.ts, entre 330 y 600 combinaciones cada uno, y nadie la
// llamaba.
//
// Japon acabo con 19 ofertas. Quien lo elegia entre los destinos abria la
// aplicacion y no encontraba nada, sin ningun aviso que lo explicara.
const paisesApp = [...leerFuente("lib/paises.ts").matchAll(/^  ([A-Z][A-Z]): \{/gm)].map(m => m[1].toLowerCase());
//
// Se cruzan con los paises que piden DE VERDAD los scripts del crontab del VPS.
// Antes se cruzaban con los calendarios de GitHub, y ahi Japon y Singapur ya
// "estaban" desde el 5 de septiembre... en un calendario que no se ejecuta: el
// script real de Careerjet seguia sin ellos. La prueba pasaba y Japon no crecia.
const scriptCareerjet = leerFuente("scripts/vps/sync-careerjet-parallel.sh");
const paisesSincronizados = new Set([
  ...((scriptCareerjet.match(/^countries="([a-z ]+)"/m) || [])[1] || "").split(" "),
  ...paisesCalendario,
].filter(Boolean));

test("los 26 paises de la app estan en algun script de sincronizacion del VPS", () => {
  const sinCubrir = paisesApp.filter(p => !paisesSincronizados.has(p));
  if (sinCubrir.length) console.log("      sin sincronizar: " + sinCubrir.join(", "));
  return paisesApp.length === 26 && sinCubrir.length === 0;
});

// ── LAS TAREAS PROGRAMADAS VIVEN EN EL CRONTAB DEL VPS ─────────────────
//
// GitHub solo lanza calendarios programados desde la rama por defecto (main), y
// alli se desactivaron el 5 jul 2026. El centinela y el barrido de Adzuna se
// escribieron como workflows y no llegaron a ejecutarse nunca. Ahora son
// scripts del crontab, y su copia versionada tiene que decir que lo estan.
const crontabVps = leerFuente("scripts/vps/crontab.txt");
test("el centinela esta programado en el crontab del VPS", () =>
  crontabVps.includes("/root/centinela.sh"));
test("el barrido de Adzuna esta programado en el crontab del VPS", () =>
  crontabVps.includes("/root/sync-adzuna-barrido.sh"));
test("no vuelven los workflows que fingian tareas programadas", () =>
  !readdirSync(".github/workflows").some(n => n === "centinela.yml" || n === "sync-adzuna-barrido.yml"));

// Un centinela sin canal no avisa a nadie: el vigilante que ya habia solo
// escribia en /tmp/watchdog-alerts.log. Este tiene que mandar correo.
test("el centinela avisa por correo, no solo en un log", () => {
  const c = leerFuente("scripts/vps/centinela.sh");
  return c.includes("api.resend.com") && c.includes("ADMIN_EMAILS");
});

// Cloudflare, delante de la API de Resend, rechaza la identificacion por defecto
// de Python con un 403 "error code: 1010". El primer aviso del centinela no salio
// por eso: el canal de alertas existia, con clave buena y dominio verificado, y
// no funcionaba.
test("el centinela se identifica ante Resend (sin eso, 403 de Cloudflare)", () =>
  /"User-Agent"\s*:\s*"[^"]+"/.test(leerFuente("scripts/vps/centinela.sh")));

// ── GUZZI DESCUENTA SUS CONSULTAS DE UNA VEZ ──────────────────────────────
//
// trackGuzziQuery leia el contador, comparaba y escribia contador + 1. Entre la
// lectura y la escritura cabia otro mensaje: diez a la vez pasaban los diez el
// limite diario y llegaban al modelo. Ahora suma y comprueba en la base de
// datos en una sola operacion (consumir_consulta_guzzi, migracion 005). El
// metodo antiguo solo queda como respaldo si la funcion no responde, y tiene
// que ir DESPUES de intentarla.
test("Guzzi descuenta la consulta con la funcion atomica antes que leyendo y escribiendo", () => {
  const u = leerFuente("lib/usage-tracker.ts");
  const cuerpo = (u.split("export async function trackGuzziQuery")[1] || "").split("export async function")[0];
  const rpc = cuerpo.indexOf('rpc("consumir_consulta_guzzi"');
  const lectura = cuerpo.indexOf('.select("guzzi_consultas")');
  return rpc > -1 && cuerpo.includes("nuevo === null") && (lectura === -1 || rpc < lectura);
});

// ── LA APLICACION TIENE QUE LLEGAR A REDIS ────────────────────────────────
//
// El 22 sep 2026 Easypanel recreo Redis con otra IP. La aplicacion vivia en otra
// red de Docker y lo encontraba por una linea fija en /etc/hosts, que siguio
// apuntando a la IP vieja: cayeron a la vez la cola de envios de CV, la busqueda
// de empresas y de ETTs y los limites anti-abuso, sin ningun error visible.
const deploySrc = leerFuente("build-deploy.sh");
test("el despliegue conecta la aplicacion a la red de Redis", () =>
  /^docker network connect easypanel-buscaycurra buscaycurra-nextjs/m.test(deploySrc));
test("el despliegue comprueba que la aplicacion llega a Redis", () =>
  deploySrc.includes("r.ping()") && deploySrc.includes("NO LLEGA A REDIS"));
test("el centinela vigila que la aplicacion llega a Redis", () => {
  const c = leerFuente("app/api/admin/centinela/route.ts");
  return c.includes("la aplicacion llega a Redis") && c.includes("redis.ping()");
});

// ── FECHAS DEL FUTURO Y OFERTAS REPETIDAS ──────────────────────────────────
//
// Auditoria del 22 sep 2026: 5.511 ofertas fechadas hasta diciembre (el feed de
// DEVITJOBS las mandaba asi) se ponian las primeras en el buscador, que ordena
// por fecha. Y 23.237 grupos de ofertas repetidas pasaban enteros porque el
// filtro de duplicados comparaba el ENLACE, y cada fuente le pone el suyo: una
// ETT alemana salia 72 veces seguidas con el mismo puesto en el mismo pueblo.
test("las fechas de las fuentes nunca son del futuro", () => {
  const f = leerFuente("lib/job-search/free-global-apis.ts");
  return f.includes("export function fechaNoFutura") &&
    f.includes("fecha.getTime() > ahora.getTime()") &&
    f.includes("fechaNoFutura(o.fecha)");
});
test("el centinela vigila las fechas del futuro", () => {
  const c = leerFuente("app/api/admin/centinela/route.ts");
  return c.includes("ninguna oferta esta fechada en el futuro") &&
    c.includes(`"createdAt" > now() + interval '1 day'`);
});
test("el buscador no enseña la misma oferta varias veces", () => {
  const s = leerFuente("app/api/jobs/search/route.ts");
  return s.includes("${limpiar(j.title)}|${limpiar(j.company)}|${limpiar(j.city)}");
});

// ── NINGUN MODELO RETIRADO EN EL CODIGO ────────────────────────────────────
//
// Los proveedores retiran modelos y la API responde 404, pero nuestras llamadas
// devuelven null al fallar, asi que nada lo dice: el usuario recibe una respuesta
// peor o ninguna. Ya han caido: llama-3.3-70b-versatile (Groq, 16 ago),
// llama-3.1-8b-instant (Groq, busqueda semantica), gemini-1.5-flash y
// gemini-2.5-flash-lite (Google), y deepseek-chat (DeepSeek lo retiro el 24 jul
// 2026). Esta lista crece cada vez que cae otro. Solo mira los valores de
// model / MODELO_*, no los comentarios que cuentan la historia.
const MODELOS_RETIRADOS = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "gemini-1.5-flash", "gemini-2.5-flash-lite", "deepseek-chat"];
test("ninguna llamada usa un modelo que el proveedor ya ha retirado", () => {
  const usos = [];
  for (const raiz of ["app", "lib"]) {
    for (const rel of readdirSync(raiz, { recursive: true })) {
      const ruta = raiz + "/" + String(rel).split("\\").join("/");
      if (!/\.(ts|tsx)$/.test(ruta)) continue;
      const src = leerFuente(ruta);
      for (const m of MODELOS_RETIRADOS) {
        const patron = new RegExp("(model\\s*:\\s*|MODELO[A-Z_]*\\s*=\\s*)[\"'`]" + m.replace(/\./g, "\\.") + "[\"'`]");
        if (patron.test(src)) usos.push(ruta + " -> " + m);
      }
    }
  }
  if (usos.length) console.log("      modelo retirado en: " + usos.join(", "));
  return usos.length === 0;
});

// ── ioredis SE IMPORTA ARRIBA, NO DENTRO DE LA FUNCION ─────────────────────
//
// Con `await import("ioredis")` dentro de un route, el paquete compilado devuelve
// un objeto sin constructor ("a is not a constructor"): el control de Redis del
// centinela daba fallo el 22 sep 2026 con Redis perfectamente vivo. En su forma
// normal (arriba del fichero) funciona, como en lib/places-quota.ts.
test("nadie carga ioredis dentro de una funcion", () => {
  const culpables = [];
  for (const raiz of ["app", "lib"]) {
    for (const rel of readdirSync(raiz, { recursive: true })) {
      const ruta = raiz + "/" + String(rel).split("\\").join("/");
      if (!/\.(ts|tsx)$/.test(ruta)) continue;
      // Solo codigo: los comentarios que cuentan este fallo mencionan la forma mala.
      const lineas = leerFuente(ruta).split("\n").filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l));
      if (/import\s*\(\s*["'`]ioredis["'`]\s*\)/.test(lineas.join("\n"))) culpables.push(ruta);
    }
  }
  if (culpables.length) console.log("      import dinamico de ioredis en: " + culpables.join(", "));
  return culpables.length === 0;
});

// ── BUSCADOR DE ETTs ───────────────────────────────────────────────────────
//
// Probado el 22 sep 2026 contra Google: "Cabanillas" devolvia ETTs de Guadalajara
// (hay dos Cabanillas) y "Berlin" tres de cinco resultados en Barcelona, porque se
// preguntaba siempre en español. Ademas se guardaba en cache pero no se leia: cada
// busqueda de la misma ciudad volvia a pagar ~33 llamadas.
const ettSrc = leerFuente("app/api/ett/search/route.ts");
test("el buscador de ETTs mira la cache antes de pagar a Google", () =>
  ettSrc.indexOf("buscarEnCacheCerca(zona.lat") > -1 &&
  ettSrc.indexOf("buscarEnCacheCerca(zona.lat") < ettSrc.indexOf("buscarTextoSinDetalles(q"));
// La caché por cercanía necesita que cada ficha lleve dónde está; si se guardan
// sin coordenadas, la caché queda inservible y todo vuelve a pagarse.
test("las empresas se guardan con sus coordenadas", () => {
  const c = leerFuente("lib/empresas-cache.ts");
  return c.includes("lat = COALESCE(EXCLUDED.lat, empresas.lat)") &&
    c.includes("e.lat ?? null, e.lon ?? null") &&
    ettSrc.includes("lat: coordsPorId.get(gr.place_id)?.lat ?? null");
});
test("el buscador de ETTs situa la zona y descarta las lejanas", () =>
  ettSrc.includes("await situarZona(city)") &&
  ettSrc.includes("distanciaKm(zona") &&
  ettSrc.includes("c.km <= RADIO_CERCA_KM"));
// En un pueblo pequeño la consulta generica ("agencia de empleo Fustiñana")
// devuelve lo que sea: el ayuntamiento, una empresa de congelados, una de
// renovables. Solo la consulta especifica se acepta a ciegas.
test("el buscador de ETTs no cuela el ayuntamiento del pueblo", () =>
  ettSrc.includes("function nombreDeAgencia") &&
  ettSrc.includes("indice === 0 || nombreDeAgencia(sitio.name, terminos)") &&
  ettSrc.includes("seguras.length >= 5 ? seguras"));

// Situar el pueblo se hace con OpenStreetMap, que es gratis. La geocodificacion
// de Google no esta activada en el proyecto (REQUEST_DENIED el 22 sep 2026) y se
// paga aparte: si alguien invierte el orden, cada busqueda empieza pagando.
test("situar la zona empieza por OpenStreetMap, que no cuesta", () => {
  const g = leerFuente("lib/google-places.ts");
  const i = g.indexOf("export async function situarZona(");
  const cuerpo = g.slice(i, i + 900);
  return cuerpo.indexOf("situarZonaOSM(texto)") > -1 &&
    cuerpo.indexOf("situarZonaOSM(texto)") < cuerpo.indexOf("consumirCuotaPlaces");
});
test("el buscador de ETTs pregunta en el idioma del pais", () => {
  const t = leerFuente("lib/ett-terminos.ts");
  // Los 26 paises de la app tienen que estar: si se añade uno nuevo a
  // lib/paises.ts y no se le ponen sus palabras, esto lo dice.
  const codigos = [...leerFuente("lib/paises.ts").matchAll(/codigo: "([A-Z]{2})"/g)].map((m) => m[1]);
  const faltan = codigos.filter((c) => !new RegExp("^\\s*" + c + ":", "m").test(t));
  if (faltan.length) console.log("      paises sin terminos de ETT: " + faltan.join(", "));
  return ettSrc.includes("terminosEtt(zona?.paisCodigo)") &&
    t.includes("Zeitarbeitsfirma") && t.includes("uitzendbureau") && faltan.length === 0;
});

// ── DEEPSEEK SIN SALDO ─────────────────────────────────────────────────────
//
// El 22 sep 2026 la cuenta estaba a -0,01 USD y respondia 402 a todo. Guzzi seguia
// contestando (cae a Groq), pero gastaba dos intentos y casi un segundo por mensaje
// en una llamada condenada a fallar.
test("Guzzi deja de llamar a DeepSeek cuando se queda sin saldo", () => {
  const llm = leerFuente("lib/guzzi/llm.ts");
  const chat = leerFuente("app/api/gusi/chat/route.ts");
  return /if\s*\(!deepseekKey \|\| deepseekApagado\(\)\) return null;/.test(llm) &&
    llm.includes("if (res.status === 402) { apagarDeepSeek(); return null; }") &&
    chat.includes("!deepseekApagado()") && chat.includes("apagarDeepSeek()");
});

// ── LA WEB PUBLICA NO PUEDE MENTIR ─────────────────────────────────────────
//
// El 22 sep 2026 el centro de ayuda decia "2 envios de CV al dia" en el plan
// gratuito y "5" en Esencial, cuando de verdad eran 3 y 15, y hablaba de un plan
// Basico que ya no se vende; tambien decia 90 dias para repetir empresa cuando el
// codigo usa 15. Las cifras se sacan de lib/plan-limits.ts, no se escriben a mano.
for (const fichero of ["lib/guias/contenido.ts", "components/CentroAyuda.tsx"]) {
  test(`las cifras de ${fichero.split("/").pop()} salen del codigo, no a mano`, () => {
    const src = leerFuente(fichero);
    if (!src.includes('from "@/lib/plan-limits"')) return false;
    // Solo el codigo: los comentarios que cuentan este fallo citan las cifras malas.
    const codigo = src.split("\n").filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l)).join("\n");
    // Un numero pegado a "envios ... dia" es una cifra escrita a mano.
    const aMano = /\b\d+\s*(envios|env[ií]os)\s*(de CV\s*)?(al|por)\s*d[ií]a/i.test(codigo);
    if (aMano) console.log("      hay un limite escrito a mano en " + fichero);
    return !aMano;
  });
}

// Si se incrusta un video y la politica de seguridad no lo permite, el navegador
// no enseña ningun error: sale un hueco en blanco. Por eso se comprueba que lo
// que se incrusta (youtube-nocookie) es exactamente lo que la cabecera permite.
test("los videos de las campañas se pueden ver de verdad", () => {
  const csp = leerFuente("next.config.ts");
  const video = leerFuente("components/novedades/VideoNovedad.tsx");
  const permitido = /frame-src[^;]*https:\/\/www\.youtube-nocookie\.com/.test(csp);
  const usado = video.includes("https://www.youtube-nocookie.com/embed/");
  return permitido && usado;
});

test("las novedades estan en el mapa del sitio y tienen su RSS", () => {
  const s = leerFuente("app/sitemap.ts");
  const rss = leerFuente("app/novedades/rss.xml/route.ts");
  return s.includes('from "@/lib/novedades/contenido"') &&
    s.includes("/novedades/${n.slug}") &&
    rss.includes("application/rss+xml") &&
    rss.includes("novedadesOrdenadas");
});

test("la web publica enlaza las funciones y las novedades", () => {
  const pie = leerFuente("components/PublicFooter.tsx");
  const cabecera = leerFuente("components/PublicHeader.tsx");
  return pie.includes('href: "/novedades"') && pie.includes('href: "/funciones"') &&
    cabecera.includes('href="/funciones"') && cabecera.includes('href="/guias"');
});

test("las guias de uso estan en el mapa del sitio", () => {
  const s = leerFuente("app/sitemap.ts");
  return s.includes('from "@/lib/guias/contenido"') && s.includes("/guias/${g.slug}");
});

// Una pagina publica sin enlaces internos no la encuentra nadie: /descargar y
// /precios ya estuvieron meses sin que las enlazara ninguna navegacion.
test("las paginas publicas enlazan con el resto de la web", () => {
  const sinPie = ["app/guias/page.tsx", "app/precios/page.tsx", "app/soporte/page.tsx",
    "app/cursos/page.tsx", "app/trabajar-en/page.tsx", "app/cv-por-pais/page.tsx",
    "app/llevarte-el-paro/page.tsx", "app/derechos-au-pair/page.tsx"]
    .filter((f) => !leerFuente(f).includes("<PublicFooter />"));
  if (sinPie.length) console.log("      sin pie de pagina: " + sinPie.join(", "));
  return sinPie.length === 0;
});

// El repositorio es publico. Seis scripts del crontab llevaban la clave de
// administracion escrita dentro; ahora la leen de .env.local en el servidor.
test("los scripts del VPS no llevan claves escritas", () => {
  const nombres = readdirSync("scripts/vps");
  const malos = nombres.filter(n => {
    const s = leerFuente("scripts/vps/" + n);
    return /^[A-Z_]*(SECRET|TOKEN|PASSWORD|API_KEY)=["']?[A-Za-z0-9_./+=-]{12,}/m.test(s)
        || /"(password|pass|secret|token)"\s*:\s*"[^"]+/i.test(s)
        || /x-(sync|admin)-secret:\s*[A-Za-z0-9_-]{12,}/i.test(s);
  });
  if (malos.length) console.log("      con clave escrita: " + malos.join(", "));
  return nombres.length > 0 && malos.length === 0;
});

// Sin agrupar, el centinela gritaba cada dia por nombres de fuente retirados
// (careerjet_US...) y por ciudades de Careerjet que esperan turno (EURES_SEA...).
// Una alarma que siempre suena se ignora, y entonces tampoco se ve la de verdad.
test("el centinela agrupa Careerjet y descarta nombres de fuente retirados", () => {
  const c = leerFuente("app/api/admin/centinela/route.ts");
  return c.includes("Careerjet (EURES_ciudad)") && c.includes("NOT LIKE 'careerjet!_%'");
});

// ── TOCAR UNA NOTIFICACION HACE ALGO AL MOMENTO ───────────────────────
//
// La pagina de notificaciones esperaba a marcar la notificacion como leida
// ANTES de desplegarla o de navegar:
//
//     if (!n.leida) await marcarLeida(n.id);
//     router.push(...)
//
// Asi que al tocar una notificacion no pasaba nada hasta que volvia la
// peticion. En el movil eso es tocar y que la aplicacion parezca rota: tocas
// otra vez, y otra. La campana no lo esperaba; las dos pantallas hacian lo
// mismo de forma distinta.
//
// Marcar como leida es un efecto secundario y no tiene que bloquear nada.
const notifPagSrc = leerFuente("app/app/notificaciones/page.tsx");

test("tocar una notificacion no espera a la red para abrirse", () =>
  !notifPagSrc.includes("await marcarLeida"));

test("marcar todas no va de una en una esperando cada respuesta", () =>
  notifPagSrc.includes("Promise.allSettled"));

// El boton de la campana solo tenia title, que en el movil no vale como nombre
// accesible: el lector de pantalla no lo anuncia.
test("el boton de la campana tiene nombre accesible", () =>
  leerFuente("components/NotificationBell.tsx").includes("aria-label="));
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
