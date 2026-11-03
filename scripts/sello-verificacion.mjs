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
  // "entregado" lo pone el aviso de Resend al llegar el correo: faltaba y un CV
  // entregado dejaba de contar (30 sep 2026).
  const faltan = ['enviado', 'pendiente', 'entregado', 'visto', 'respondido'].filter(e => !m[1].includes(e));
  if (faltan.length) { console.log('     ↳ faltan estados: ' + faltan.join(', ')); return false; }
  // Y estos NO deben estar: lo que no salió o no llegó no gasta cuota.
  return !m[1].includes('fallido') && !m[1].includes('cancelado') && !m[1].includes('rebotado');
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
  // Desde el 3 oct 2026 usa ESTADOS_QUE_GASTAN_CUOTA, que incluye "pendiente"
  // (lo vigila la prueba de la cuota).
  return (/\.in\("status",\s*\["pendiente"/.test(src) || src.includes('.in("status", ESTADOS_QUE_GASTAN_CUOTA)'))
    && src.includes('status === "pendiente"');
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
  const efecto = src.match(/if \(!userId[^)]*\) return;[\s\S]{0,700}?guardarCV\(\)/);
  if (!efecto || !/cvCargado/.test(efecto[0])) {
    fallos.push('el autoguardado no comprueba cvCargado antes de guardar');
  }
  // El guardado AL SALIR (pagehide/visibilitychange) tampoco puede escribir un
  // formulario vacio: solo manda algo si el efecto de arriba, que si comprueba
  // cvCargado, lo marco como pendiente.
  if (!efecto || !/pendienteRef\.current = true/.test(efecto[0]) || !/if \(!pendienteRef\.current \|\| !datosAGuardarRef\.current\) return;/.test(src)) {
    fallos.push('el guardado al salir no depende del autoguardado protegido');
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
      // Auditoria del 29 sep 2026: las tres se iban a "buscar ofertas" o a
      // charla vaga. La primera es la frase exacta que le fallo a Michel.
      ["quiero echar el curriculum en la papelera de buñuel", "info_empresa"],
      ["¿qué papeles necesito para trabajar en Alemania?", "papeles_pais"],
      ["¿me compensa ir a trabajar a Zaragoza desde Tudela?", "desplazamiento"],
      ["hola, busco trabajo de camarero en Tudela", "buscar"],
      // 10 oct 2026: sin nombrar "papeles" acababa buscando negocios en
      // "Alemania de enfermera".
      ["¿Qué necesito para trabajar en Alemania de enfermera?", "papeles_pais"],
      ["¿Qué necesito para trabajar de camarero en Pamplona?", "buscar"],
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

// Auditoria del 3 oct 2026: un "vale", "ok gracias" o "si, pero luego" con un
// 📍 o la palabra "bar" (dentro de "Barcelona") en el historial mandaba el CV
// a una empresa que nadie habia elegido. Solo vale un si a la propuesta que
// Guzzi acaba de hacer, y con varios negocios tiene que decir cual.
test("Guzzi solo manda el CV a un negocio si se lo acaba de proponer y elige cual", async () => {
  const { execFileSync } = await import("node:child_process");
  const { unlinkSync } = await import("node:fs");
  const salidas = [".sello-intents2.cjs", ".sello-envio-local.cjs"];
  try {
    for (const [entrada, salida] of [["lib/guzzi/intents.ts", salidas[0]], ["lib/guzzi/envio-local.ts", salidas[1]]]) {
      execFileSync("npx", ["esbuild", entrada, "--bundle", "--format=cjs", "--platform=node",
        `--outfile=${salida}`, "--log-level=error"], { stdio: "pipe", shell: true });
    }
    const { detectIntent } = await import(`../${salidas[0]}?${Date.now()}`);
    const local = await import(`../${salidas[1]}?${Date.now()}`);
    const fallos = [];
    const MANDA = "send_cv_local_confirm";
    // 1. Sin propuesta (un listado de ofertas normal): nada manda el CV.
    const ofertas = [{ role: "user", text: "camarero en barcelona" },
      { role: "gusi", text: "5 ofertas de camarero en Barcelona:\n🏢 Bar Centro\n📍 Barcelona\n⭐ 92%\nSin embargo hay mas." }];
    for (const f of ["vale", "ok gracias", "perfecto", "si pero luego", "ok no lo mandes", "la primera", "opcion 2", "sí"]) {
      if (detectIntent(f, [...ofertas, { role: "user", text: f }]) === MANDA) fallos.push(`sin propuesta "${f}" manda el CV`);
    }
    // 2. Con la propuesta de verdad, justo antes.
    const texto = local.textoNegociosLocales([{ nombre: "Bar Diamante", web: "https://www.bardiamante.es/" },
      { nombre: "Restaurante El Choko" }, { nombre: "Cafetería Delicias" }], "Tudela", "camarero");
    const conPropuesta = [{ role: "user", text: "camarero en tudela" }, { role: "gusi", text: texto }];
    const casos = [["la 2", 1], ["sí, al Diamante", 0], ["mándalo a delicias", 2], ["sí", null], ["vale", null],
      ["ok gracias", "no"], ["si pero luego", "no"], ["no, mejor no", "no"], ["vale, ahora busca de cocinero en tudela", "no"]];
    for (const [f, esperado] of casos) {
      const h = [...conPropuesta, { role: "user", text: f }];
      const intent = detectIntent(f, h);
      if (esperado === "no") { if (intent === MANDA) fallos.push(`"${f}" manda el CV`); continue; }
      if (intent !== MANDA) { fallos.push(`"${f}" deberia contestar a la propuesta y da ${intent}`); continue; }
      const elegido = local.negocioElegido(f, local.propuestaPendiente(h).negocios);
      if (elegido !== esperado) fallos.push(`"${f}" elige ${elegido} y deberia ser ${esperado}`);
    }
    // 3. Una propuesta de hace dos turnos ya no cuenta.
    if (detectIntent("la 2", [...conPropuesta, { role: "user", text: "y de cocinero?" }, { role: "user", text: "la 2" }]) === MANDA) {
      fallos.push("una propuesta antigua todavia manda el CV");
    }
    // 4. Se lee de vuelta lo que se enseña: ciudad, puesto y web del negocio.
    const leida = local.propuestaPendiente(conPropuesta);
    if (leida?.ciudad !== "Tudela" || leida?.puesto !== "camarero" || leida?.negocios[0].web !== "http://www.bardiamante.es") {
      fallos.push(`la lista no se lee bien: ${JSON.stringify(leida).slice(0, 80)}`);
    }
    fallos.forEach((f) => console.log(`     ↳ ${f}`));
    return fallos.length === 0;
  } catch (e) {
    console.log(`     ↳ no se pudo probar: ${e.message?.slice(0, 80)}`);
    return false;
  } finally {
    for (const s of salidas) { try { unlinkSync(s); } catch { /* da igual */ } }
  }
});
// Auditoria del 3 oct 2026: la regla de cursos se tragaba a quien hablaba de su
// oficio ("carretillero en Tudela", "cuanto cobra un carretillero", "soy
// carretillero"), "borrar mis datos" iba al editor del CV, las cartas de au
// pair a la carta generica, "en la Rioja" no buscaba, y lo que la persona
// contaba despues de "dime que quieres poner y te lo redacto" acababa en cursos.
test("Guzzi entiende oficio, cuenta, au pair, articulos y el texto para el CV", async () => {
  const { execFileSync } = await import("node:child_process");
  const { unlinkSync } = await import("node:fs");
  const salida = ".sello-intents3.cjs";
  try {
    execFileSync("npx", ["esbuild", "lib/guzzi/intents.ts", "--bundle", "--format=cjs", "--platform=node",
      `--outfile=${salida}`, "--log-level=error"], { stdio: "pipe", shell: true });
    const { detectIntent } = await import(`../${salida}?${Date.now()}`);
    const NO = (x) => "!" + x;
    const casos = [
      ["ofertas de carretillero en pamplona", "buscar"], ["carretillero en tudela", "buscar"],
      ["camionero con carnet c en zaragoza", "buscar"], ["cuanto cobra un carretillero", NO("buscar_cursos")],
      ["soy carretillero", NO("buscar_cursos")], ["tengo el curso de carretillero", NO("buscar_cursos")],
      ["mi carnet de conducir esta caducado", NO("buscar_cursos")],
      ["curso de carretillero en Pamplona", "buscar_cursos"], ["necesito el de manipulador", "buscar_cursos"],
      ["busco formacion de soldador", "buscar_cursos"], ["busco trabajo de profesor de cursos de ingles", "buscar"],
      ["tengo curso de carretillero, añadelo a mi curriculum", "editar_cv"], ["quita mi foto del cv", "editar_cv"],
      ["borrar mis datos", "cuenta"], ["cancelar suscripcion", "cuenta"], ["cambiar mi contraseña", "cuenta"],
      ["carta para au pair en alemania", "carta_au_pair"], ["vendimia en la rioja", "buscar"],
      ["voy a mandar mi CV a una empresa de Londres, le pongo foto?", "cv_por_pais"],
    ];
    const editor = { role: "gusi", text: "👉 [Abrir el editor de CV](/app/curriculum)\n\nDime qué quieres poner y te lo redacto." };
    const tras = [
      ["carretillero en Logística Ribera, de 2022 a 2025, cargaba camiones y preparaba pedidos", "redactar_cv"],
      ["vale gracias", NO("redactar_cv")], ["busco trabajo de camarero en Tudela", "buscar"],
    ];
    const fallos = [];
    const mira = (f, esperado, r) => {
      const ok = esperado.startsWith("!") ? r !== esperado.slice(1) : r === esperado;
      if (!ok) fallos.push(`"${f.slice(0, 45)}" da ${r} (esperado ${esperado})`);
    };
    for (const [f, e] of casos) mira(f, e, detectIntent(f, [{ role: "user", text: f }]));
    for (const [f, e] of tras) mira(f, e, detectIntent(f, [{ role: "user", text: "cambiar mi cv" }, editor, { role: "user", text: f }]));
    fallos.forEach((f) => console.log(`     ↳ ${f}`));
    const chat = leerFuente("app/api/gusi/chat/route.ts");
    return fallos.length === 0 && chat.includes('preIntent === "redactar_cv"') && chat.includes('preIntent === "cuenta"');
  } catch (e) {
    console.log(`     ↳ no se pudo probar: ${e.message?.slice(0, 80)}`);
    return false;
  } finally {
    try { unlinkSync(salida); } catch { /* da igual */ }
  }
});

// Auditoria del 14 oct 2026 ("¿por qué se rompe tanto Guzzi?"), sobre 474
// mensajes reales. Las frases de aquí son parecidas a las reales, no copias.
//  1. Las instrucciones fijas (32.000 caracteres) no cabían en el plan
//     gratuito de Groq (8.000 tokens por minuto): Groq daba 413 a TODAS las
//     conversaciones gratuitas y todo dependía del respaldo de pago.
//  2. Le pedían decir "Dame un segundo que te busco…" sin buscar nada.
//  3. "Mándalo a todas" buscaba en Google una empresa llamada "Todas".
//  4. Los atajos del chat (envío automático, entrevista, foto, au pair) caían
//     donde no tocaba.
test("Guzzi cabe en el plan gratuito y no promete búsquedas que no hace", async () => {
  const { execFileSync } = await import("node:child_process");
  const { unlinkSync } = await import("node:fs");
  const salida = ".sello-prompts.cjs";
  try {
    execFileSync("npx", ["esbuild", "lib/guzzi/prompts.ts", "--bundle", "--format=cjs", "--platform=node",
      `--outfile=${salida}`, "--log-level=error"], { stdio: "pipe", shell: true });
    const p = await import(`../${salida}?${Date.now()}`);
    const fallos = [];
    if (!(p.PROMPT_BASE.length < 8000)) fallos.push(`el núcleo mide ${p.PROMPT_BASE.length} caracteres (máximo 8.000)`);
    // Una conversación que toca todos los temas a la vez no puede pasarse.
    const todo = "me han despedido y cobro el paro, quiero irme a Alemania de au pair, cuánto se cobra, tengo una entrevista, mi cv y un curso";
    const temas = p.temasParaLaConversacion ? p.temasParaLaConversacion(todo, []) : "x".repeat(99999);
    if (temas.length > 9000) fallos.push(`los temas suman ${temas.length} caracteres (máximo 9.000)`);
    if (p.temasParaLaConversacion && !p.temasParaLaConversacion("me han despedido, qué me toca de finiquito?").includes("Finiquito")) {
      fallos.push("una pregunta de despido no lleva el bloque de derechos");
    }
    if (p.temasParaLaConversacion && p.temasParaLaConversacion("hola").length > 0) fallos.push("un saludo carga temas");
    const completo = p.PROMPT_BASE + Object.values(p.TEMAS || {}).map((t) => t.texto).join("\n");
    if (/Dame un segundo que te busco|D[ée]jame buscar las \[/.test(completo)) fallos.push("sigue pidiendo prometer búsquedas");
    if (!/NUNCA digas "voy a buscar"/.test(p.PROMPT_BASE)) fallos.push("falta la regla de no prometer búsquedas");
    if (/1\.231 €|16 pagas/.test(completo) || !completo.includes("1.221 € al mes brutos en 14 pagas")) fallos.push("el SMI de 2026 no es el de la ficha de derechos");
    if (!completo.includes("el limite del tratado es DIARIO")) fallos.push("se perdió el límite diario del au pair");
    fallos.forEach((f) => console.log(`     ↳ ${f}`));
    const chat = leerFuente("app/api/gusi/chat/route.ts");
    // Y que si vuelve a pasar, el centinela lo vea: el chat cuenta cada caso en
    // Redis y el centinela lo lee cada mañana.
    const ruta = chat.includes("temasParaLaConversacion(message") && chat.includes("PROMPT_MODO_CV")
      && /voy a buscar\|d\[ée\]jame buscar/.test(chat)
      && chat.includes('contarFalloGuzzi("sin-ia")') && chat.includes('contarFalloGuzzi("groq-413")')
      // El modelo principal (16 oct 2026): gpt-5.6-luna antes que Groq.
      && chat.indexOf('model: "gpt-5.6-luna"') > 0
      && chat.indexOf('model: "gpt-5.6-luna"') < chat.indexOf('model: "openai/gpt-oss-120b"')
      && leerFuente("app/api/admin/centinela/route.ts").includes("guzzi:fallo:${t}:${d}");
    if (!ruta) console.log("     ↳ el chat no usa los temas, el modo CV, la red de seguridad de 'voy a buscar' o los contadores del centinela");
    return fallos.length === 0 && ruta;
  } catch (e) {
    console.log(`     ↳ no se pudo probar: ${e.message?.slice(0, 80)}`);
    return false;
  } finally {
    try { unlinkSync(salida); } catch { /* da igual */ }
  }
});


// 16 oct 2026, antes de enseñarlo en el consorcio: la foto se quedaba
// "cargando" y nunca llegaba al servidor. En iPhone el timeout de
// getCurrentPosition no corre mientras el permiso está pendiente, y el envío no
// tenía tiempo máximo. Y "búscame la peluquería X" buscaba ofertas de
// peluquería en toda España en vez de ese negocio.
test("la cámara de Guzzi no espera a la ubicación para siempre y 'búscame la peluquería X' busca el negocio", async () => {
  const chat = leerFuente("components/GusiChat.tsx");
  const camara = chat.includes("new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000))")
    && /fetch\("\/api\/gusi\/analyze-image"[\s\S]{0,400}signal: corte\.signal/.test(chat);
  if (!camara) console.log("     ↳ la ubicación o el envío de la foto vuelven a no tener tope");
  const { execFileSync } = await import("node:child_process");
  const { unlinkSync } = await import("node:fs");
  const salida = ".sello-intents-peluqueria.cjs";
  let negocio = false;
  try {
    execFileSync("npx", ["esbuild", "lib/guzzi/intents.ts", "--bundle", "--format=cjs", "--platform=node",
      `--outfile=${salida}`, "--log-level=error"], { stdio: "pipe", shell: true });
    const { detectIntent } = await import(`../${salida}?${Date.now()}`);
    negocio = detectIntent("búscame la peluquería Bella Imagen", []) === "info_empresa"
      && detectIntent("encuéntrame el bar La Parada", []) === "info_empresa"
      && detectIntent("busco trabajo de peluquera en Tudela", []) === "buscar";
    if (!negocio) console.log("     ↳ 'búscame la peluquería X' ya no busca el negocio");
  } catch (e) {
    console.log(`     ↳ no se pudo probar: ${e.message?.slice(0, 80)}`);
  } finally {
    try { unlinkSync(salida); } catch { /* da igual */ }
  }
  const ruta = leerFuente("app/api/gusi/chat/route.ts").includes("extractCity(message) || cvParsed?.ciudad");
  // La foto se ve en el chat (16 oct 2026) y no viaja a la IA en cada mensaje.
  const enElChat = chat.includes("<img src={m.foto}") && chat.includes(".map((m) => ({ ...m, foto: undefined }))");
  if (!enElChat) console.log("     ↳ la foto no se ve en el chat o se manda a la IA en cada mensaje");
  if (!ruta) console.log("     ↳ sin ciudad en el mensaje, el negocio ya no se busca en la ciudad del CV");
  return camara && negocio && ruta && enElChat;
});

// 16 oct 2026, después de enseñarlo en el Consorcio EDER: la foto de su tarjeta
// pedía "más información" estando el Consorcio a 0 km, un nombre escrito a mano
// no se buscaba, una botella de agua no daba las empresas del sector y "búscalo"
// se iba a la charla libre. Probado con 39 fotos (tarjetas, papeles escritos a
// mano, carteles, dibujos, productos, fachadas) desde Tudela con y sin GPS.
test("la cámara busca cualquier nombre cerca y el sector de más cerca a más lejos", async () => {
  const { execFileSync } = await import("node:child_process");
  const { unlinkSync } = await import("node:fs");
  const salida = ".sello-camara.cjs";
  const fallos = [];
  try {
    execFileSync("npx", ["esbuild", "lib/camara/analizar-foto.ts", "--bundle", "--format=cjs", "--platform=node",
      "--packages=external", "--tsconfig=tsconfig.json", `--outfile=${salida}`, "--log-level=error"], { stdio: "pipe", shell: true });
    const c = await import(`../${salida}?${Date.now()}`);
    if (c.quitarCiudad?.("bar la parada tudela", ["Tudela"]) !== "bar la parada") fallos.push("la ciudad pegada al nombre no se quita");
    if (c.quitarCiudad?.("Randstad", ["Tudela"]) !== "Randstad") fallos.push("quitarCiudad estropea un nombre sin ciudad");
    if (!c.coincideFuerte?.("Zara", "ZARA Gran Vía") || c.coincideFuerte?.("Rasta", "Oficial Rastas Madrid")) fallos.push("la coincidencia por palabras falla");
    if (!(c.similitud?.("Rasta", "Randstad Tudela") >= 0.5) || c.similitud?.("Rasta", "Mercadona") >= 0.5) fallos.push("el parecido entre nombres falla");
    const t = c.terminosDeOfertas?.("", ["administrativo sanitario", "enfermero"]) || [];
    if (t.some((x) => x.startsWith("administrati")) || !t.some((x) => x.startsWith("enferm"))) fallos.push(`palabras de ofertas genéricas: ${t.join(",")}`);
    const tras = [{ role: "gusi", text: "📸 He leído **Consorcio EDER**, pero no encuentro ningún sitio con ese nombre." }];
    const b1 = c.nombreDeLaFotoAnterior?.("búscalo", tras);
    const b2 = c.nombreDeLaFotoAnterior?.("búscalo en pamplona", tras);
    if (b1?.nombre !== "Consorcio EDER" || b1?.ciudad !== null || b2?.ciudad !== "Pamplona") fallos.push("'búscalo' después de una foto no se entiende");
    if (c.nombreDeLaFotoAnterior?.("búscalo", [{ role: "gusi", text: "📸 En la foto hay **botella de agua**." }])) fallos.push("'búscalo' tras un objeto busca el objeto como negocio");
    const p = c.PROMPT_VISION || "";
    if (!["escrito a mano", "NO adivines marcas", "\"busquedas_empresas\"", "\"nombre_corregido\"", "\"palabras_ofertas\""].every((x) => p.includes(x))) fallos.push("faltan reglas en las instrucciones de la foto");
  } catch (e) {
    fallos.push(`no se pudo probar: ${e.message?.slice(0, 80)}`);
  } finally {
    try { unlinkSync(salida); } catch { /* da igual */ }
  }
  const lib = leerFuente("lib/camara/analizar-foto.ts");
  const ruta = leerFuente("app/api/gusi/analyze-image/route.ts");
  const chat = leerFuente("app/api/gusi/chat/route.ts");
  if (!ruta.includes("responderFoto(foto, { lat, lng, ciudadUsuario: await ciudadEnCamino })") ||!ruta.includes("form_data->>'ciudad'")) fallos.push("la ruta no usa el módulo o no mira la ciudad del CV");
  if (!chat.includes("nombreDeLaFotoAnterior(message, history)")) fallos.push("el chat no entiende 'búscalo' tras una foto");
  // Los datos de una tarjeta nunca en la ficha de otra empresa, ninguna web de
  // Google se toma por la de la empresa, y "en la calle" es en la calle.
  if (!lib.includes('if (deLaFoto.email && encontrado && encontrado.via !== "exacto") encontrado = null;')) fallos.push("el correo de una tarjeta puede acabar en otra empresa");
  if (!lib.includes("PLATAFORMAS.test(dominioDe(web))") || !lib.includes("website: webPropia(r.website)")) fallos.push("se deducen correos de webs de Google o Facebook");
  if (!lib.includes("distanciaKm({ lat, lng }, r.geometry.location) <= 1")) fallos.push("'en la calle' no comprueba la distancia");
  fallos.forEach((f) => console.log(`     ↳ ${f}`));
  return fallos.length === 0;
});
// Las empresas veían siempre 0 candidatos (17 oct 2026): el portal miraba la
// visibilidad en una columna de Supabase que no existe, mientras 16 personas la
// tenían activada en user_cvs. Y el CV completo (/talento) leía una tabla vacía.
test("las empresas ven a los candidatos visibles y solo ellas saben quién es cada uno", () => {
  const api = leerFuente("app/api/empresas/candidatos/route.ts");
  const talento = leerFuente("app/talento/[id]/page.tsx");
  const checks = {
    "el portal lee la visibilidad de user_cvs": api.includes("uc.visible_empresas = true") && !api.includes('.from("profiles")'),
    "quien no es empresa no recibe ni el nombre ni el identificador del CV":
      api.includes("id: esEmpresa ? row.user_id :") && /nombre: esEmpresa \?[^\n]*: "Candidato"/.test(api),
    "buscar por correo o teléfono no delata a nadie": api.includes("(uc.form_data - 'email' - 'telefono'"),
    "el CV completo sale de user_cvs": talento.includes("FROM user_cvs") && !talento.includes('.from("cvs")'),
    "el CV completo solo lo ven las empresas y el propio candidato": talento.includes('!== "empresa"') && talento.includes("quien === id"),
  };
  const malos = Object.entries(checks).filter(([, ok]) => !ok).map(([k]) => k);
  if (malos.length) console.log(`     ↳ ${malos.join(" · ")}`);
  return malos.length === 0;
});
// Guzzi con iniciativa (17 oct 2026): "¿qué curso me conviene?" se contesta
// con su CV, una plaza gratis, las ofertas que lo piden y negocios de la zona;
// y al enseñar ofertas avisa una vez del curso que le falta. Sin exagerar: el
// carné de carretillero no es obligatorio para todo mozo, y el manipulador de
// alimentos no convierte a una camarera en cocinera.
test("Guzzi recomienda el siguiente paso con datos y sin exagerar", async () => {
  const { execFileSync } = await import("node:child_process");
  const { unlinkSync } = await import("node:fs");
  const salida = ".sello-siguiente-paso.cjs";
  const fallos = [];
  try {
    execFileSync("npx", ["esbuild", "lib/guzzi/siguiente-paso.ts", "--bundle", "--format=cjs", "--platform=node",
      "--packages=external", "--tsconfig=tsconfig.json", `--outfile=${salida}`, "--log-level=error"], { stdio: "pipe", shell: true });
    const m = await import(`../${salida}?${Date.now()}`);
    for (const t of ["¿Qué curso me conviene?", "¿Cómo consigo un trabajo mejor?", "¿qué me falta para trabajar de camarero?", "en qué me puedo formar"]) {
      if (!m.pideSiguientePaso?.(t)) fallos.push(`no entiende «${t}»`);
    }
    for (const t of ["curso de carretillero en Pamplona", "busco trabajo de camarero en Tudela", "¿qué me falta en mi CV?"]) {
      if (m.pideSiguientePaso?.(t)) fallos.push(`se lleva «${t}»`);
    }
    const mozo = { subtitulo: "Mozo de almacén", experiencia: [{ puesto: "Mozo de almacén", empresa: "X" }] };
    const pista = m.pistaDeCurso?.("mozo de almacén", mozo, []) || "";
    if (!pista.includes("**Carné de carretillero** (obligatorio por ley para esas tareas)")) fallos.push(`pista: ${pista.slice(0, 90)}`);
    if (m.pistaDeCurso?.("mozo de almacén", { ...mozo, aptitudes: "carnet de carretillero" }, [])) fallos.push("avisa de un curso que ya está en el CV");
    if (m.pistaDeCurso?.("mozo de almacén", mozo, [{ role: "gusi", text: pista }])) fallos.push("repite la pista en la misma conversación");
    if (m.pistaDeCurso?.("barista", null, [])) fallos.push("sin CV avisa de un curso que no es obligatorio");
    const carretillero = { nombre: "Carné de carretillero", puesto: "Mozo de almacén", puestosQueLoPiden: ["carretillero", "mozo de almacén", "preparador de pedidos"] };
    const manipulador = { nombre: "Manipulador de alimentos", puesto: "Camarera", puestosQueLoPiden: ["camarero", "cocinero", "reponedor"] };
    if (m.puestosQueAbre?.(carretillero, mozo).join() !== "carretillero") fallos.push("el carné no abre la puerta a carretillero");
    if (m.puestosQueAbre?.(manipulador, { subtitulo: "Camarera" }).length !== 0) fallos.push("dice que el manipulador convierte a una camarera en cocinera");
    if (m.cvConContenido?.({ nombre: "", experiencia: [{ puesto: "" }] }) !== null) fallos.push("un CV vacío cuenta como CV");
    if (m.provinciaPorCodigoPostal?.("Tudela 31500") !== "31") fallos.push("no saca la provincia del código postal");
  } catch (e) {
    fallos.push(`no se pudo probar: ${e.message?.slice(0, 80)}`);
  } finally {
    try { unlinkSync(salida); } catch { /* da igual */ }
  }
  const chat = leerFuente("app/api/gusi/chat/route.ts");
  if (!chat.includes("pideSiguientePaso(message)") || (chat.match(/pistaDeCurso\(puestoBusqueda, cvObjeto, history\)/g) || []).length !== 2) {
    fallos.push("el chat no contesta el siguiente paso o no da la pista al enseñar ofertas");
  }
  // "Bilbao, Vizcaya": buscando solo "Bizkaia" no salía ninguna de sus ofertas.
  if (!leerFuente("lib/cursos/para-esa-persona.ts").includes('Bizkaia: ["Vizcaya"]')) fallos.push("las provincias no tienen sus otros nombres");
  fallos.forEach((f) => console.log(`     ↳ ${f}`));
  return fallos.length === 0;
});
// "Ofertas recomendadas para ti" eran las seis más nuevas de la ciudad, de
// cualquier cosa: a un carretillero de Tudela le salía "Profesor/a particular"
// (17 oct 2026). Ahora salen de los puestos de su CV, sin rellenar con nada.
test("las ofertas recomendadas salen del CV, no de lo último publicado", async () => {
  const { execFileSync } = await import("node:child_process");
  const { unlinkSync } = await import("node:fs");
  const salida = ".sello-puestos-cv.cjs";
  const fallos = [];
  try {
    execFileSync("npx", ["esbuild", "lib/job-search/puestos-del-cv.ts", "--bundle", "--format=cjs", "--platform=node",
      `--outfile=${salida}`, "--log-level=error"], { stdio: "pipe", shell: true });
    const m = await import(`../${salida}?${Date.now()}`);
    const cv = { subtitulo: "Reponedor, Repartidor, Encargado de Almacén y Ventas", experiencia: [
      { puesto: "Ayudante de cocina y camarero", fechas: "2009" },
      { puesto: "Carretillero - mantenimiento de maquinaria", fechas: "2015-2026" }] };
    const p = m.patronesDelCv?.(cv) || [];
    if (!p.includes("carretill") || !p.includes("reponed") || !p.includes("almacen")) fallos.push(`puestos del CV: ${p.join(",")}`);
    if (p.indexOf("carretill") > p.indexOf("cocin") && p.includes("cocin")) fallos.push("la experiencia más antigua va antes que la reciente");
    for (const t of ["Profesor/a particular a domicilio", "Director/a de Delegación", "Terapeuta ocupacional"]) {
      if (m.patronDelTitulo?.(t, p) !== -1) fallos.push(`recomienda «${t}» a un carretillero`);
    }
    for (const t of ["Carretilleros/as", "Mozo/a almacén con carnet de carretilla", "Cajero/a Reponedor/a"]) {
      if (!(m.patronDelTitulo?.(t, p) >= 0)) fallos.push(`no recomienda «${t}»`);
    }
    if (m.raiz?.("cajero") !== "cajer" || m.raiz?.("pintor") !== "pintor") fallos.push("raíces demasiado cortas (caj, pint)");
    if ((m.patronesDelCv?.({ nombre: "Ana" }) || []).length !== 0) fallos.push("sin puestos en el CV recomienda algo");
    // A un camarero de bar le salían "Camarera/o de pisos" (limpieza de hotel).
    const camarero = { subtitulo: "Camarero", experiencia: [{ puesto: "Camarero" }] };
    if ((m.puestosDelCv?.(camarero) || []).length !== 1) fallos.push("el mismo puesto sale repetido");
    if (!/de\\s\+pisos/.test(m.exclusionesDelCv?.(camarero, m.patronesDelCv(camarero)) || "")) fallos.push("a un camarero de bar le recomienda camarera de pisos");
    if (m.exclusionesDelCv?.({ subtitulo: "Camarera de pisos" }, ["camar"]) !== null) fallos.push("a una camarera de pisos le quita lo suyo");
    if (m.palabraPrincipal?.("DEPENDIENTES/AS T. PARCIAL GIJON") !== "dependiente") fallos.push(`oficio del título: ${m.palabraPrincipal?.("DEPENDIENTES/AS T. PARCIAL GIJON")}`);
  } catch (e) {
    fallos.push(`no se pudo probar: ${e.message?.slice(0, 80)}`);
  } finally {
    try { unlinkSync(salida); } catch { /* da igual */ }
  }
  const portada = leerFuente("app/api/dashboard/route.ts");
  const consulta = leerFuente("lib/job-search/ofertas-para-ti.ts");
  if (!portada.includes("ofertasParaTi(cvs[0]?.form_data ?? null, profile?.ciudad)") || /ORDER BY "createdAt" DESC\s+LIMIT \$2/.test(portada)) {
    fallos.push("la portada no usa el CV o sigue rellenando con lo último publicado");
  }
  if (!consulta.includes("WITH zona AS MATERIALIZED") || !consulta.includes("regexDePatrones(patrones)")) fallos.push("la consulta no filtra primero por zona");
  const guardados = leerFuente("app/app/guardados/Content.tsx");
  if (!guardados.includes("puestosDelCv(") || guardados.includes("if (ciudad || sector)")) fallos.push("Guardados recomienda por ciudad sin mirar el CV");
  fallos.forEach((f) => console.log(`     ↳ ${f}`));
  return fallos.length === 0;
});
// El plan Empresa se vendía con alertas de candidatos, API, exportar
// contactos, "soporte 24/7" y precios de InfoJobs sin fuente; y la oferta que
// mandaba una empresa iba a una tabla que no existe (17 oct 2026).
test("a las empresas se les vende lo que hay y su oferta se guarda", () => {
  const empresas = leerFuente("app/empresas/page.tsx").replace(/^\s*\/\/.*$/gm, "");
  const precios = leerFuente("app/precios/page.tsx").replace(/^\s*\/\/.*$/gm, "");
  const portada = leerFuente("app/(home)/page.tsx").replace(/^\s*\/\/.*$/gm, "");
  const ruta = leerFuente("app/api/empresas/publicar/route.ts");
  const checks = {
    "sin promesas que no existen en /empresas": !/369|Alertas de nuevos candidatos|API de acceso|24\/7|Exporta contactos|optimizado por IA|Guzzi la incluye/.test(empresas),
    "los testimonios solo si los hay": empresas.includes("{TESTIMONIOS.length > 0 && ("),
    "precios vende ver candidatos y no soporte 24/7": precios.includes("Ver candidatos con nombre, email y teléfono") && !/Soporte 24\/7/.test(precios + portada),
    "la oferta se guarda en nuestra base y avisa al equipo": ruta.includes("INSERT INTO oferta_empresa") && ruta.includes("sendOfertaEmpresaAvisoEmail(")
      && !ruta.includes('from("ofertas_empresas")'),
    "no promete publicarla en minutos": !leerFuente("app/empresas/publicar/page.tsx").includes("publicada en minutos"),
    "borrar la cuenta borra sus ofertas": leerFuente("lib/cuenta/borrar-datos.ts").includes('oferta_empresa: "user_id"'),
  };
  const malos = Object.entries(checks).filter(([, ok]) => !ok).map(([k]) => k);
  if (malos.length) console.log(`     ↳ ${malos.join(" · ")}`);
  return malos.length === 0;
});
// Del 12 al 17 oct 2026 la sugerencia de curso se repetía cada 3 horas a las
// mismas personas (42 veces): una fila de user_cvs con user_id "test" hacía
// fallar la lectura de lo ya sugerido y el error se tomaba por "nada".
test("la sugerencia de curso no se repite si no se puede leer lo ya enviado", () => {
  const r = leerFuente("app/api/cursos/sugerencias-cv/route.ts");
  return r.includes("const cvsValidos = cvs.filter((c) => UUID.test(c.user_id));")
    && /if \(errPrevias \|\| !previas\) \{[\s\S]{0,300}?status: 500/.test(r)
    && !r.includes("for (const n of previas || [])");
});
// "Recomendar ofertas siempre está bien, pero por el currículum, no al
// tuntún" (Michel, 17 oct 2026): el buscador enseña ofertas según el CV antes
// de buscar, y sin CV se pide rellenarlo en vez de enseñar cualquier cosa.
test("el buscador recomienda ofertas según el CV y sin CV pide rellenarlo", () => {
  const ruta = leerFuente("app/api/ofertas/para-ti/route.ts");
  const buscar = leerFuente("app/app/buscar/page.tsx");
  const portada = leerFuente("app/api/dashboard/route.ts") + leerFuente("app/app/bienvenida/BienvenidaClient.tsx");
  return ruta.includes('if (!patronesDelCv(cv).length) return NextResponse.json({ estado: "sin-cv"') && ruta.includes("ofertasParaTi(cv, perfil?.ciudad, 6)")
    && buscar.includes('fetch("/api/ofertas/para-ti"') && buscar.includes('paraTi?.estado === "sin-cv"') && buscar.includes("Ofertas según tu CV")
    && portada.includes("estadoRecomendadas") && portada.includes('estadoRecomendadas === "sin-cv"');
});
// MUCHAS VISITAS, POCOS REGISTROS (18 oct 2026): de Google llegan unas 80
// personas al día, casi todas a una ficha de oferta, y se registraban 2 o 3.
// La ficha mandaba al registro sin la oferta, "Buscar similares" pedía entrar,
// y /empleo/[puesto]/[ciudad] decía "0 ofertas" (también camarero en Madrid).
test("de la ficha de oferta al registro y de vuelta a la oferta, sin perderla", () => {
  const ficha = leerFuente("app/empleo/oferta/[id]/page.tsx");
  const landing = leerFuente("app/empleo/[puesto]/[ciudad]/page.tsx");
  const registro = leerFuente("app/auth/registro/page.tsx");
  const checks = {
    "la ficha manda al registro con la oferta": ficha.includes("/auth/registro?oferta=${encodeURIComponent(row.id)}") && ficha.includes("Envía tu CV a {empresa ??"),
    "la ficha enseña más ofertas de lo mismo en su ciudad": ficha.includes("ofertasParecidas(") && !ficha.includes("Buscar similares en BuscayCurra"),
    "la ficha no enseña 'Ver en oferta' como sueldo": ficha.includes("sueldoDe(row.salary)"),
    "las páginas de puesto y ciudad no se generan al compilar ni buscan en la descripción":
      !landing.includes("generateStaticParams") && !landing.includes("description ILIKE") && landing.includes("ofertasParecidas("),
    "la ciudad se busca sin tildes y con el índice": leerFuente("lib/job-search/ofertas-parecidas.ts").includes("translate(city, 'áéíóúñüÁÉÍÓÚÑÜàèìòùÀÈÌÒÙ', 'aeiounuAEIOUNUaeiouAEIOU')`")
      && leerFuente("lib/job-search/ofertas-parecidas.ts").includes("${CIUDAD_SIN_TILDES} ILIKE $1"),
    "el registro guarda a qué oferta volver": registro.includes("destinoCuenta = ofertaId ? `/app/ofertas/${ofertaId}`") && registro.includes("/api/ofertas/resumen?id="),
    // Los botones de las páginas públicas que llevan dentro de la app dejaban a
    // la gente nueva en "Bienvenido de vuelta" (el login).
    "sin cuenta en el dispositivo, al registro con el destino": leerFuente("middleware.ts").includes("if (!request.cookies.get(COOKIE_CUENTA))")
      && leerFuente("middleware.ts").includes('registroUrl.searchParams.set("destino", destino)'),
    "el login ofrece crear cuenta a quien viene de un botón": leerFuente("app/auth/login/page.tsx").includes("¿Primera vez en BuscayCurra?"),
    "el destino solo puede ser de la app": /startsWith\("\/app\/"\) \|\| v\.includes\("\/\/"\)/.test(leerFuente("lib/auth/destino.ts")),
    "al confirmar el correo se vuelve a la oferta": leerFuente("app/auth/callback/page.tsx").includes("sesion?.user?.user_metadata?.destino"),
    "al entrar sin redirect se vuelve a la oferta": leerFuente("app/auth/login/page.tsx").includes("entrada.user?.user_metadata?.destino"),
    "con sesión, el registro de una oferta lleva a la oferta": leerFuente("middleware.ts").includes("NextResponse.redirect(new URL(`/app/ofertas/${oferta}`"),
    "hacer el CV no pierde la oferta": leerFuente("app/app/ofertas/[id]/OfertaDetalleClient.tsx").includes("/app/curriculum?volver=") && leerFuente("app/app/curriculum/Content.tsx").includes("Volver a la oferta"),
    "banner de la App Store en Safari": leerFuente("app/layout.tsx").includes('itunes: { appId: "6775232067" }'),
    // "Ver la oferta original en EURES_GIJ": el código interno no se enseña.
    "la fuente se nombra legible": ficha.includes("nombreFuente(row.sourceName)") && !ficha.includes("` en ${row.sourceName}`"),
    // Uno de cada cuatro no confirmaba el correo: botón a su bandeja.
    "botón para abrir el correo y confirmar": registro.includes("bandejaDe(email)") && registro.includes("mail.google.com"),
    // Abría la primera cuenta del móvil y no buscaba en spam.
    "Gmail se abre en la cuenta registrada y busca también en spam": registro.includes("authuser=${encodeURIComponent(email.trim())}") && registro.includes("in%3Aanywhere"),
  };
  const malos = Object.entries(checks).filter(([, ok]) => !ok).map(([k]) => k);
  if (malos.length) console.log(`     ↳ ${malos.join(" · ")}`);
  return malos.length === 0;
});
// /empresas enseñaba la página de enviar CV en producción: compilando en una
// carpeta llamada /app, Next.js confundía app/empresas con app/app/empresas
// (comprobado el 17 oct 2026 con dos compilaciones iguales salvo la carpeta).
test("la compilación no se hace en /app (confunde /empresas con /app/empresas)", () => {
  const d = leerFuente("Dockerfile");
  const builder = d.slice(d.indexOf("AS builder"), d.indexOf("AS runner"));
  return /^WORKDIR \/srv\/web$/m.test(builder) && !/^WORKDIR \/app$/m.test(builder) && !d.includes("--from=builder /app/");
});
// El 17 oct 2026 el servidor estuvo 29 minutos apagado y se veía el error del
// navegador o de la app. Ahora sale nuestra página de mantenimiento.
test("si el servidor no contesta sale nuestra página de mantenimiento", () => {
  const sw = leerFuente("public/sw.js");
  const pagina = leerFuente("public/mantenimiento.html");
  return sw.includes("event.request.mode !== 'navigate'") && sw.includes("c.add(new Request(PAGINA_MANTENIMIENTO")
    && /r\.status >= 502 && r\.status <= 504/.test(sw) && sw.includes(".catch(() => mantenimiento()")
    && pagina.includes("Volvemos en unos minutos") && !/<link[^>]+href="https?:|<script[^>]+src=/.test(pagina)
    && leerFuente("capacitor.config.ts").includes('errorPath: "mantenimiento.html"');
});
// La foto es un extra (17 oct 2026): cada una cuesta ~1 céntimo de GPT-4o y
// hasta 10-12 de Google Maps, y escribir el nombre del negocio es gratis.
test("la cámara se cuenta por mes: 5, 30, 100 y 300 fotos", () => {
  const limites = leerFuente("lib/plan-limits.ts");
  const ruta = leerFuente("app/api/gusi/analyze-image/route.ts");
  const textos = leerFuente("app/precios/page.tsx") + leerFuente("app/(home)/page.tsx");
  // En el orden del fichero: free, basico, esencial, pro, empresa.
  const fotos = [...limites.matchAll(/camaraMaxUsos: (\d+)/g)].map((m) => m[1]).join(",");
  const checks = {
    [`límites 5/30/30/100/300 (hay ${fotos})`]: fotos === "5,30,30,100,300",
    "el contador va por mes": ruta.includes("const dateKey = `camara-${new Date().toISOString().slice(0, 7)}`;"),
    "sin fotos se le dice que escriba el nombre del negocio": ruta.includes("escríbeme el nombre del negocio"),
    "ninguna página promete fotos al día ni ilimitadas": !/cámara al día|\/día por cámara|cámara ilimitada/i.test(textos),
  };
  const malos = Object.entries(checks).filter(([, ok]) => !ok).map(([k]) => k);
  if (malos.length) console.log(`     ↳ ${malos.join(" · ")}`);
  return malos.length === 0;
});
test("Guzzi entiende los atajos, 'a todas' y los puestos que no lo son", async () => {
  const { execFileSync } = await import("node:child_process");
  const { unlinkSync, writeFileSync } = await import("node:fs");
  const entrada = ".sello-guzzi-entrada.ts", salida = ".sello-guzzi.cjs";
  try {
    writeFileSync(entrada, 'export * from "./lib/guzzi/intents";\nexport * from "./lib/guzzi/entender";\nexport * from "./lib/guzzi/respuestas-fijas";\n');
    execFileSync("npx", ["esbuild", entrada, "--bundle", "--format=cjs", "--platform=node", "--external:ioredis",
      `--outfile=${salida}`, "--log-level=error"], { stdio: "pipe", shell: true });
    const g = await import(`../${salida}?${Date.now()}`);
    const fallos = [];
    // Los atajos del chat (son textos nuestros, de components/GusiChat.tsx).
    for (const [f, esperado] of [
      ["Quiero enviar mi CV automáticamente a empresas", "envio_auto_info"],
      ["Quiero preparar una entrevista de trabajo", "entrevista_prep"],
      ["¿Cómo mejoro mi foto de CV? Dame prompts para ChatGPT", "foto_prompts"],
      ["busco trabajo de camarero en Tudela", "buscar"],
    ]) {
      const r = g.detectIntent(f, []);
      if (r !== esperado) fallos.push(`"${f.slice(0, 40)}" da ${r} (esperado ${esperado})`);
    }
    // "A todas", "la segunda"... solo si antes se le enseñaron ofertas.
    const conOfertas = [{ role: "user", text: "soldador en zaragoza" }, { role: "gusi", text: "🔍 **2 ofertas** de **soldador**:\n\n🥇 ...",
      jobs: [{ id: "db-1", titulo: "Soldador TIG", empresa: "Talleres Uno" }, { id: "db-2", titulo: "Soldador MIG", empresa: "Metal Dos" }] }];
    const sinOfertas = [{ role: "gusi", text: "¡Hola! Tengo millones de ofertas para ti." }];
    const refiere = g.refiereAOfertasMostradas;
    if (!refiere?.("me encantan todas, quiero mandar el curriculum a todas ellas", conOfertas)) fallos.push("'a todas' con ofertas no se reconoce");
    if (refiere?.("me encantan todas, quiero mandar el curriculum a todas ellas", sinOfertas)) fallos.push("'a todas' sin ofertas se toma por ofertas");
    if (refiere?.("vale, gracias", conOfertas)) fallos.push("'vale, gracias' se toma por mandar el CV");
    const segunda = g.respuestaOfertasMostradas?.("mándalo a la segunda", conOfertas, true);
    if (segunda?.jobs?.length !== 1 || segunda.jobs[0].id !== "db-2") fallos.push("'la segunda' no devuelve la segunda oferta");
    const todas = g.respuestaOfertasMostradas?.("a todas", conOfertas, true);
    if (todas?.jobs?.length !== 2 || /he enviado|enviados/i.test(todas.reply)) fallos.push("'a todas' no devuelve las ofertas o dice que ya las ha enviado");
    if (g.respuestaOfertasMostradas?.("a todas", conOfertas, false)?.jobs) fallos.push("sin CV no pide subirlo primero");
    // Puestos que no lo son → al modelo; puestos de verdad → no.
    if (!g.hayQueEntender?.("buscar", "Hola, soy un chaval de Murcia y estoy buscando curro en Italia de fontanero")) fallos.push("un puesto-frase no va al modelo");
    if (g.hayQueEntender?.("buscar", "camarero en Madrid")) fallos.push("'camarero en Madrid' va al modelo sin necesidad");
    if (g.hayQueEntender?.("chat", "gracias")) fallos.push("un 'gracias' va al modelo");
    const e = g.parseEntendido?.('Aquí va: {"accion":"buscar_ofertas","puesto":"camarero","lugar":"Londres","pais":"gb"}');
    if (e?.pais !== "uk" || e?.puesto !== "camarero") fallos.push(`la respuesta del modelo no se lee bien: ${JSON.stringify(e)}`);
    if (g.parseEntendido?.('{"accion":"borrar_todo"}') !== null) fallos.push("acepta una acción que no existe");
    // El modelo gratuito a veces contesta con voseo aunque se le pida "tú".
    const tuteo = g.sinVoseo?.("¿Y vos? Si tenés dudas, decime y te busco algo para vos.");
    if (tuteo !== "¿Y tú? Si tienes dudas, dime y te busco algo para ti.") fallos.push(`el voseo no se corrige: ${tuteo}`);
    if (g.sinVoseo?.("Tienes razón, puedes mirar las ofertas.") !== "Tienes razón, puedes mirar las ofertas.") fallos.push("sinVoseo cambia el tuteo normal");
    fallos.forEach((f) => console.log(`     ↳ ${f}`));
    const chat = leerFuente("app/api/gusi/chat/route.ts");
    const BS = String.fromCharCode(92);
    const ruta = chat.includes("refiereAOfertasMostradas(message, history)") && chat.includes("const puestoDelCV")
      && chat.includes('preIntent === "envio_auto_info"') && chat.includes("TEXTO_INFO_AU_PAIR") && chat.includes("sinVoseo(rawReply")
      && !chat.includes("de" + BS + BS + "s+limpieza") && chat.includes("🏢 **${sectorRaw}** en **${cityFromSector}**");
    if (!ruta) console.log("     ↳ el chat no usa lo nuevo (ofertas enseñadas, prefijo del CV, atajos o la expresión de sectores)");
    return fallos.length === 0 && ruta;
  } catch (e) {
    console.log(`     ↳ no se pudo probar: ${e.message?.slice(0, 80)}`);
    return false;
  } finally {
    for (const f of [entrada, salida]) { try { unlinkSync(f); } catch { /* da igual */ } }
  }
});
// Auditoria del 3 oct 2026, cuenta y funciones:
// - un suscriptor que pulsaba otro plan acababa en el 409 del checkout;
// - Mi Plan y "pago completado" vendian buscador avanzado, estadisticas y API;
// - el simulador decia "No se pudo analizar" a quien no pagaba;
// - los referidos prometian +10 CVs que nada aplicaba y se quedaban vacios;
// - las alertas mandaban hasta 12 correos al dia, "semanal" se ignoraba y no
//   habia pantalla para verlas ni quitarlas.
test("cambiar de plan no acaba en error ni se venden ventajas que no existen", () => {
  const p = leerFuente("app/app/perfil/page.tsx");
  const ok = leerFuente("app/app/pago-exitoso/page.tsx");
  return p.includes('if (planActual !== "free") return void irAPortal();') && !/Buscador avanzado|Estadísticas|IA avanzada|· API ·/.test(p + ok)
    && !ok.includes("Acceso a API");
});
test("el simulador de entrevistas explica por que no analiza y no lo apunta", () => {
  const e = leerFuente("app/app/entrevistas/page.tsx");
  return e.includes("if (!res.ok || !data.feedback)") && !e.includes('data.feedback || "No se pudo analizar."');
});
// Antes también exigía el aviso "solo Pro": el 21 oct 2026 Michel decidió que
// invite cualquiera (ver la prueba "invitar a un amigo" más abajo).
test("los referidos no prometen lo que no se da y dicen qué se gana", () => {
  const r = leerFuente("app/app/referidos/Content.tsx");
  return !/\+10 CVs|ambos gan|ambos recib/.test(r) && r.includes("+5 envíos de CV y +1 foto con la cámara");
});
test("las alertas: un correo al dia como mucho, semanal de verdad y se pueden quitar", () => {
  const s = leerFuente("app/api/push/send-alerts/route.ts");
  const api = leerFuente("app/api/jobs/alertas/route.ts");
  const perfil = leerFuente("app/app/perfil/page.tsx");
  return s.includes("CASE WHEN frequency = 'weekly' THEN INTERVAL '7 days'") && s.includes("if (contact?.email && !yaTuvoCorreoHoy)")
    && api.includes("UPDATE job_alerts SET frequency") && perfil.includes("<MisAlertas />")
    && leerFuente("components/MisAlertas.tsx").includes('method: "DELETE"');
});

// Auditoria del 3 oct 2026: en au pair el boton de guardar solo estaba en el
// paso 4 y su aviso salia 13.000 px por encima, fuera de la pantalla del movil.
test("au pair: guardar esta en los cuatro pasos y el aviso sale junto al boton", () => {
  const a = leerFuente("app/app/au-pair/page.tsx");
  const barra = a.indexOf('className="sticky bottom-0 z-30');
  return barra > 0 && a.indexOf("onClick={guardar}") > barra && a.indexOf("{error || mensaje}") > barra
    && (a.match(/onClick=\{guardar\}/g) || []).length === 1;
});

// Los correos que invitan a pedir un enlace nuevo llevan ?email=: un enlace
// directo caduca en una hora y quien lo abre al dia siguiente se lo encuentra
// muerto. La pagina tiene que traer el correo relleno.
test("tras cambiar la contraseña se pide la bienvenida (cuentas que nunca confirmaron)", () =>
  leerFuente("app/auth/nueva-contrasena/page.tsx").includes("pedirBienvenida((await supabase.auth.getSession()).data.session?.access_token)"));
test("recuperar la contraseña acepta el correo en el enlace (?email=)", () =>
  leerFuente("app/auth/recuperar/page.tsx").includes('new URLSearchParams(window.location.search).get("email")'));
test("el registro enlaza las condiciones y la politica de privacidad (RGPD)", () => {
  const r = leerFuente("app/auth/registro/page.tsx");
  return r.includes('href="/terminos"') && r.includes('href="/privacidad"');
});

// Auditoria del 3 oct 2026, web publica: la portada describia un plan gratis
// que no existe ("2 consultas a Guzzi (total)", "Sin envios de CV"), vendia un
// "Dashboard de equipo" que no existe y una cifra inventada ("la media de
// nuestros usuarios es de 3 semanas"); el canonical del layout raiz mandaba
// todas las paginas a la portada; y las paginas de pais decian "0 ofertas".
test("la portada no promete lo que no es verdad", () => {
  const h = leerFuente("app/(home)/page.tsx");
  const fallos = [];
  if (/2 consultas a Guzzi \(total\)|Sin envíos de CV|Sin Guzzi ni envíos|No incluye Guzzi/.test(h)) fallos.push("plan gratis antiguo");
  if (!h.includes("${LIMITS.free.enviosCVDia} envíos de CV al día")) fallos.push("el plan gratis no sale de LIMITS");
  if (/Dashboard de equipo|media de nuestros usuarios|El 95% de esos CVs|reclutador abre el email/.test(h)) fallos.push("promesa sin respaldo");
  for (const p of ["app/auth/login/page.tsx", "app/auth/registro/page.tsx"]) {
    if (leerFuente(p).includes("reclutador abre el email")) fallos.push(`${p}: reclutador abre el email`);
  }
  fallos.forEach((f) => console.log(`     ↳ ${f}`));
  return fallos.length === 0;
});
// 22 oct 2026: sin ninguno, Search Console avisaba "Duplicada: el usuario no ha
// indicado ninguna versión canónica". El layout raíz pone "./", que Next resuelve
// con la ruta de cada página: nunca "/" (eso era mandarlas todas a la portada).
test("el canonical de la portada no lo heredan las demas paginas: cada una, el suyo", () =>
  (leerFuente("app/layout.tsx").match(/alternates:\s*\{\s*canonical:\s*"([^"]*)"/) || [])[1] === "./"
  && leerFuente("app/(home)/page.tsx").includes('alternates: { canonical: "https://buscaycurra.es" }'));
test("las paginas de pais no cuentan por su cuenta ni enseñan un 0", () => {
  const p = leerFuente("app/trabajar-en/[pais]/page.tsx");
  return p.includes("ofertasDe(await ofertasPorPais(), codigo)") && !p.includes('SELECT COUNT(*) FROM "JobListing"')
    && p.includes('totalOfertas ? totalOfertas.toLocaleString("es-ES") : "Miles"');
});

// Auditoria del 3 oct 2026: con mala cobertura el autoguardado del perfil se
// disparaba antes de cargar y BORRABA telefono, ciudad, provincia, CP y sector.
test("el perfil no se autoguarda antes de cargar ni se guarda vacio", () => {
  const p = leerFuente("app/app/perfil/page.tsx");
  const api = leerFuente("app/api/perfil/actualizar/route.ts");
  return p.includes("if (!userId || cargando || !tocadoRef.current) return;") && p.includes("tocadoRef.current = true;")
    && api.includes('Object.values(cambios).every((v) => v === "")');
});
// Auditoria del 3 oct 2026: apuntar una candidatura a mano en el pipeline
// contaba como CV enviado y agotaba el cupo del dia; y "envios de hoy" contaba
// tambien cancelados, fallidos y rebotados.
test("las candidaturas apuntadas a mano no gastan cupo ni salen como envios", () => {
  const pipe = leerFuente("app/app/pipeline/page.tsx");
  const tracker = leerFuente("lib/cv-sender/tracker.ts");
  const hoy = leerFuente("app/api/cv-sender/envios-hoy/route.ts");
  return /company_email: CORREO_ANOTACION_MANUAL,\s*job_title: [^\n]+\n\s*status: "cancelado"/.test(pipe)
    && tracker.includes("company_email.neq.${CORREO_ANOTACION_MANUAL}")
    && hoy.includes('.in("status", ESTADOS_QUE_GASTAN_CUOTA)');
});

// Auditoria del 3 oct 2026: /api/reviews (sin sesion) gastaba Google Places de
// pago con cada empresa nueva; un anonimo podia agotar el tope del dia.
test("las reseñas solo piden Google Places con sesion y lo guardan 7 dias", () => {
  const s = leerFuente("app/api/reviews/route.ts");
  return s.includes("google: (await getUserId(request).catch(() => null)) ? await getGooglePlaceData(company) : null")
    && s.includes("await cacheSet(clave, datos, 7 * 24 * 3600)");
});
// Y el centinela comprueba cada mañana que, con la clave publica, ninguna
// tabla de Supabase con datos de personas devuelva filas.
test("el centinela vigila que ninguna tabla de Supabase quede abierta", () => {
  const r = leerFuente("lib/centinela/recorrido.ts");
  return r.includes("R9. Con la clave pública") && r.includes('const PUBLICAS = new Set(["ofertas"])');
});

// gpt-oss escribe guiones U+2011: se ven igual pero el correo de la firma o una
// fecha copiados al CV dejan de ser texto normal (auditoria del 3 oct 2026).
test("las respuestas de la IA gratuita salen con guiones normales", () =>
  ["lib/guzzi/llm.ts", "lib/cv-sender/cv-personalizer.ts"].every((p) =>
    leerFuente(p).includes(".replace(/[\\u2010\\u2011]/g, \"-\")")));
test("la ficha de una oferta no se inventa un porcentaje de compatibilidad", () =>
  !/match:\s*85/.test(leerFuente("app/api/jobs/detail/route.ts")));

// 4 oct 2026: "Mándame mi currículum y carta de presentación a este correo de
// empresa rrhh@sofidel.com" acababa pidiendo empresa y puesto para redactar
// una carta, y con la respuesta mandaba a buscar la oferta. Guzzi no sabia
// enviar a un correo. Ahora lo prepara, lo enseña y lo envia con un "si".
test("Guzzi envia el CV a un correo que le das, y solo tras un si", async () => {
  const { execFileSync } = await import("node:child_process");
  const { unlinkSync } = await import("node:fs");
  const salidas = [".sello-intents4.cjs", ".sello-envio-correo.cjs"];
  try {
    for (const [entrada, salida] of [["lib/guzzi/intents.ts", salidas[0]], ["lib/guzzi/envio-correo.ts", salidas[1]]]) {
      execFileSync("npx", ["esbuild", entrada, "--bundle", "--format=cjs", "--platform=node", `--outfile=${salida}`, "--log-level=error"], { stdio: "pipe", shell: true });
    }
    const { detectIntent } = await import(`../${salidas[0]}?${Date.now()}`);
    const ec = await import(`../${salidas[1]}?${Date.now()}`);
    const fallos = [];
    const f1 = "Mándame mi currículum y carta de presentación a este correo de empresa rrhh@sofidel.com";
    if (detectIntent(f1, [{ role: "user", text: f1 }]) !== "enviar_correo") fallos.push("la frase de Michel no se entiende como envio");
    if (ec.empresaDelCorreo("rrhh@sofidel.com") !== "Sofidel") fallos.push("no saca la empresa del correo");
    const prop = ec.textoPropuesta({ email: "rrhh@sofidel.com", empresa: "Sofidel", puesto: null });
    const h = (f) => [{ role: "user", text: f1 }, { role: "gusi", text: prop }, { role: "user", text: f }];
    if (detectIntent("Sofidel nombre de empresa y puesto peon", h("Sofidel nombre de empresa y puesto peon")) !== "enviar_correo") fallos.push("no recoge el puesto");
    if (detectIntent("sí, envíalo", h("sí, envíalo")) !== "enviar_correo_confirmar") fallos.push("el si no confirma");
    if (detectIntent("no, espera", h("no, espera")) !== "enviar_correo_cancelar") fallos.push("el no no cancela");
    if (detectIntent("sí, envíalo", [{ role: "user", text: "sí, envíalo" }]) === "enviar_correo_confirmar") fallos.push("un si sin propuesta envia");
    if (detectIntent("mi correo es pepe@gmail.com", [{ role: "user", text: "mi correo es pepe@gmail.com" }]) === "enviar_correo") fallos.push("dar tu propio correo dispara un envio");
    const chat = leerFuente("app/api/gusi/chat/route.ts");
    if (!chat.includes('preIntent === "enviar_correo_confirmar"') || !chat.includes("${BASE_INTERNA}/api/cv-sender/send")) fallos.push("la ruta no envia por /api/cv-sender/send");
    fallos.forEach((f) => console.log(`     ↳ ${f}`));
    return fallos.length === 0;
  } catch (e) {
    console.log(`     ↳ no se pudo probar: ${e.message?.slice(0, 80)}`);
    return false;
  } finally {
    for (const s of salidas) { try { unlinkSync(s); } catch { /* da igual */ } }
  }
});

// 4 oct 2026: el servidor solo escuchaba en la IP del contenedor (Docker pone
// en HOSTNAME su identificador) y las llamadas internas a localhost fallaban:
// ningun envio desde Guzzi salio nunca. Las pruebas de codigo pasaban.
test("el servidor escucha en todas las direcciones y nadie se llama por localhost", () => {
  const arranque = leerFuente("scripts/docker-start.sh");
  const sueltos = [];
  const recorrer = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = `${dir}/${e.name}`;
      if (e.isDirectory()) { if (e.name !== "node_modules" && !e.name.startsWith(".")) recorrer(p); continue; }
      if (/\.(ts|tsx)$/.test(e.name) && /fetch\(\s*[`"']http:\/\/localhost:3000/.test(leerFuente(p))) sueltos.push(p);
    }
  };
  recorrer("app"); recorrer("lib");
  sueltos.forEach((p) => console.log(`     ↳ ${p} llama a localhost:3000`));
  return arranque.includes("export HOSTNAME=0.0.0.0") && arranque.indexOf("export HOSTNAME=0.0.0.0") < arranque.indexOf("exec node server.js")
    && sueltos.length === 0 && leerFuente("lib/centinela/recorrido.ts").includes("R10. Guzzi envía el CV a un correo");
});

// 6 oct 2026 (centinela): dos personas confirmaron su cuenta y se quedaron sin
// bienvenida. El cliente de Supabase canjea solo el ?code= al arrancar; el
// segundo canje de la pagina fallaba y se tomaba por "sin sesion" aunque la
// hubiera. Ademas, la bienvenida dependia solo del navegador: ahora el servidor
// completa cada 10 minutos las que falten.
test("la bienvenida no depende solo del navegador", () => {
  const cb = leerFuente("app/auth/callback/page.tsx");
  const pend = leerFuente("app/api/auth/bienvenidas-pendientes/route.ts");
  const ruta = leerFuente("app/api/auth/welcome/route.ts");
  const cron = leerFuente("scripts/vps/crontab.txt");
  return cb.includes("const yaHaySesion = error ? !!(await supabase.auth.getSession()).data.session : false;")
    && cb.includes("if (error && !yaHaySesion)")
    && /darBienvenida\(u\.id[,)]/.test(pend) && ruta.includes("darBienvenida(userId, cuerpo)")
    && /\*\/10 \* \* \* \* .*bienvenidas-pendientes\.sh/.test(cron);
});

// 23 oct 2026 (aprobado por Michel): 81 cuentas confirmadas de antes de la red
// de seguridad nunca recibieron la bienvenida. Se les da con cuidado: en horario
// de aviso, a tandas, sin comerse el cupo de correos, nunca a cuentas de prueba
// y sin duplicar el aviso de ofertas de quien ya se hizo uno.
test("las bienvenidas atrasadas salen a tandas, en horario y sin duplicar avisos", () => {
  const pend = leerFuente("app/api/auth/bienvenidas-pendientes/route.ts");
  const w = leerFuente("lib/onboarding/dar-bienvenida.ts");
  const cron = leerFuente("scripts/vps/crontab.txt");
  const bucle = pend.slice(pend.indexOf("let hechas = 0;"));
  return pend.includes('if (antiguas && !probar && !enHorarioDeAviso()) return')
    && /pendientes\.slice\(0, MAX_ANTIGUAS_POR_PASADA\)/.test(bucle)
    && /if \(antiguas && !\(await quedaSitioParaLoQuePuedeEsperar\(\)\)\) break;/.test(bucle)
    && /DE_PRUEBA = \/buscaycurra\|@\(resend/.test(pend) && pend.includes('.neq("plan", "free")')
    && w.includes("opciones.aunqueSeaAntigua ||")
    && /SELECT 1 FROM job_alerts WHERE user_id = \$1 LIMIT 1[\s\S]{0,200}if \(!yaTieneAlerta\)/.test(w)
    && /\n15 9 \* \* 1-5 .*bienvenidas-antiguas\.sh/.test(cron);
});
// 6 oct 2026: la comprobacion de salario del centinela contaba sueldos de mas
// de 200.000 sin mirar la moneda y daba falsas alarmas. Ahora prueba la misma
// formula que el buscador con rangos conocidos.
test("el centinela prueba la formula real del filtro de salario", () => {
  const c = leerFuente("app/api/admin/centinela/route.ts");
  const b = leerFuente("app/api/jobs/search/route.ts");
  return c.includes("salarioMinimoSql(\"t.texto\")") && c.includes("CASOS_SALARIO") && !c.includes(">= 200000")
    && b.includes("const SALARIO_MINIMO_SQL = salarioMinimoSql();");
});
// 6 oct 2026: Supabase tenia 2 correos de confirmacion por hora y cortaba
// registros sin que nadie lo supiera; Resend tiene 100 al dia, 3.000 al mes y
// pausa la cuenta con mas del 4 % de rebotes. El centinela avisa antes de
// llegar, la pagina de registro apunta cada registro cortado, y no se manda
// nada a dominios que no reciben correo.
test("el centinela vigila los limites de correo y nadie se queda sin registrarse sin saberlo", () => {
  const lim = leerFuente("lib/centinela/limites-correo.ts");
  const cent = leerFuente("app/api/admin/centinela/route.ts");
  const reg = leerFuente("app/auth/registro/page.tsx");
  return cent.includes("await limitesDeCorreo(anota)")
    // Plan Pro desde el 23 oct 2026: 50.000 al mes, sin tope diario (el diario es nuestro reparto).
    && /LIMITE_RESEND_DIA = 1600/.test(lim) && /LIMITE_RESEND_MES = 50000/.test(lim) && /LIMITE_REBOTES = 4/.test(lim) && /LIMITE_SUPABASE_HORA = 150/.test(lim)
    && lim.includes("claveRegistroCortado(hoy)")
    && reg.includes('fetch("/api/auth/registro-cortado"')
    && leerFuente("app/api/auth/registro-cortado/route.ts").includes("incrementar(claveRegistroCortado(");
});
// 6 oct 2026, decision de Michel: los CVs por una cuenta de Resend aparte (sus
// rebotes no pueden pausar las confirmaciones y alertas), y seguir gratis
// repartiendo: lo que puede esperar no se come el tope diario de 100.
test("los CVs pueden salir por una cuenta aparte y sus avisos de entrega se aceptan", () => {
  const es = leerFuente("lib/cv-sender/email-sender.ts");
  const ent = leerFuente("app/api/cv-sender/entrega/route.ts");
  const lim = leerFuente("lib/centinela/limites-correo.ts");
  return es.includes("process.env.RESEND_API_KEY_CV") && es.includes("const remitente = remitenteDeCVs();")
    && ent.includes("process.env.RESEND_WEBHOOK_SECRET_CV") && lim.includes('" (cuenta de CVs)"');
});
// 6 oct 2026: el panel decia "Suscriptores activos: 3" cuando eran 0 (la cuenta
// de Michel, la de demostracion y una regalada). Ahora cuenta Stripe + iPhone.
test("el panel cuenta como suscriptores solo a quien paga de verdad", () => {
  // Desde el 23 oct 2026 la regla vive en lib/metricas/suscriptores.ts (la usan el panel y el contador).
  const m = leerFuente("app/api/admin/metricas/route.ts") + leerFuente("lib/metricas/suscriptores.ts");
  return m.includes('getStripe().subscriptions.list({ status: estado') && !m.includes('if (plan !== "free" && p.subscription_status === "active") dePago++;')
    && leerFuente("app/api/admin/metricas/route.ts").includes("await suscriptoresDePago(perfiles || [])")
    && leerFuente("lib/centinela/recorrido.ts").includes('plan: "pro", subscription_status: "active"');
});
test("lo que puede esperar no se come el tope diario de Resend", () => {
  const smtp = leerFuente("lib/email/smtp-sender.ts");
  const alertas = leerFuente("app/api/push/send-alerts/route.ts");
  const puedeEsperar = (smtp.match(/puedeEsperar: true/g) || []).length;
  return smtp.includes("if (opciones.puedeEsperar && !(await quedaSitioParaLoQuePuedeEsperar()))")
    && puedeEsperar >= 3 && (smtp.match(/await apuntarCorreo\(\)/g) || []).length >= 2
    && alertas.includes("else await cacheDel(claveCorreo)")
    && leerFuente("lib/email/presupuesto-diario.ts").includes("LIMITE_RESEND_DIA - RESERVA");
});
test("no se manda correo a dominios que no lo reciben (CVs y avisos)", () => {
  const ds = leerFuente("lib/cv-sender/direccion-segura.ts");
  const smtp = leerFuente("lib/email/smtp-sender.ts");
  const motivo = ds.slice(ds.indexOf("export async function motivoParaNoEnviar"));
  return motivo.includes("await dominioSinCorreo(email)") && ds.includes('codigo !== "ENOTFOUND" && codigo !== "ENODATA"')
    && smtp.includes("await dominioSinCorreo(to)");
});
// La comprobacion R10 del centinela usaba un correo por dia y, pasandolo dos
// veces el mismo dia, la espera de 15 dias por empresa daba una falsa alarma.
test("el centinela usa un correo de prueba distinto en cada pasada (R10)", () =>
  leerFuente("lib/centinela/recorrido.ts").includes("delivered+recorrido-envio-${Date.now()}@resend.dev"));
test("Guzzi no reintenta Groq cuando la peticion no cabe (413)", () =>
  leerFuente("app/api/gusi/chat/route.ts").includes("if (res.status === 413) {"));
test("el registro explica el limite de correos de Supabase", () =>
  leerFuente("app/auth/registro/page.tsx").includes("sErr.status === 429"));

test("el envio a un negocio no usa correos de buscadores ni ciudad fija", () => {
  const ruta = leerFuente("app/api/gusi/send-cv-local/route.ts");
  const chat = leerFuente("app/api/gusi/chat/route.ts");
  return ruta.includes(`result.confidence === "high"`) && !ruta.includes(`"Tudela"`)
    && !/cvParsed\?\.nombre \|\| "Michel"/.test(chat) && !chat.includes(`|| "Empresa local"`);
});

// El byte de retroceso es invisible al leer el codigo y rompe cualquier regex
// donde se cuele. Ya paso una vez; que no vuelva a pasar sin avisar.
test("no hay bytes de retroceso (0x08) escondidos en las expresiones", () =>
  ![intentsSrc, leerFuente("lib/guzzi/envio-local.ts")].some((src) => src.includes(String.fromCharCode(8))));
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
// El panel es lo primero que se ve al entrar y tardaba 6,8 s (30 sep 2026):
// seis consultas independientes, una detras de otra, cinco de ellas a Supabase.
test("el panel lanza sus consultas a la vez, no en fila", () =>
  /await Promise\.all\(\[[\s\S]{0,300}getPool\(\)/.test(dashSrc) &&
  !/await supabaseAdmin\s*\.from\("cv_sends"\)/.test(dashSrc));
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

// LAS PAGINAS DE EMPLEO POR CIUDAD. Se pre-generaban 80 al compilar para que
// la primera visita no tardase, pero en la compilacion no hay base de datos:
// salian con "0 ofertas" y se servian asi (18 oct 2026, "camarero en Madrid,
// 0 ofertas" con 232 abiertas). Ahora se generan al pedirlas, con una sola
// consulta rapida (ciudad primero, sin tildes; el puesto en el titulo) que
// cuenta y lista a la vez, y se guardan en Redis.
const empleoSrc = leerFuente("app/empleo/[puesto]/[ciudad]/page.tsx");
test("las paginas de empleo no se pre-generan sin base de datos", () =>
  !empleoSrc.includes("generateStaticParams") && empleoSrc.includes("export const dynamicParams = true"));
test("las paginas de empleo cuentan y listan en una sola consulta rapida", () =>
  empleoSrc.includes("ofertasParecidas(") && !empleoSrc.includes("description ILIKE")
    && /SELECT count\(\*\) FROM zona\)::int AS en_ciudad/.test(leerFuente("lib/job-search/ofertas-parecidas.ts")));
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
// El webhook de Stripe no tiene activado invoice.payment_failed (30 sep 2026):
// el impago tiene que anotarse con el evento que si llega.
test("un impago en Stripe se anota aunque no llegue invoice.payment_failed", () =>
  /customer\.subscription\.updated[\s\S]{0,2500}suscripcion\.status === "past_due"[\s\S]{0,120}cambios\.subscription_status = "past_due"/.test(stripeHook));

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

// Desde el 6 oct 2026 la formula vive en lib/job-search/salario-sql.ts.
const salarioSqlSrc = leerFuente("lib/job-search/salario-sql.ts");
test("el filtro de salario se queda con el primer numero", () =>
  salarioSrc.includes("SALARIO_MINIMO_SQL = salarioMinimoSql()") && salarioSqlSrc.includes("from '[0-9]+'"));

test("el filtro de salario quita los separadores de miles antes", () =>
  salarioSqlSrc.includes("([0-9])[.,]([0-9]{3})"));

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

// ── LA CARTA DE LOS ENVIOS ─────────────────────────────────────────────────
//
// Auditoria del 29 sep 2026 sobre lo mas importante de la app, el envio de CV:
// la llamada que escribe la carta era la unica a gpt-oss sin reasoning_effort
// (puede devolver vacio), y si la IA devolvia "CARTA:" sin texto, `??` no lo
// sustituia y el CV salia con la carta en blanco.
test("la carta del envio no puede salir en blanco", () => {
  const p = leerFuente("lib/cv-sender/cv-personalizer.ts");
  return p.includes('reasoning_effort: "low"') &&
    p.includes("cartaMatch?.[1]?.trim() || generateGenericLetter") &&
    !p.includes("cartaMatch?.[1]?.trim() ?? generateGenericLetter");
});

// ── LA CAMARA ──────────────────────────────────────────────────────────────
//
// Probado el 29 sep 2026 con fotos reales: el reconocimiento de la imagen
// acertaba siempre (Nike Air Max, Adidas, Font Vella, Zara), pero lo de despues
// estaba roto. Nike devolvia una tienda de deportes de Tudela, Font Vella una
// fuente de Girona, las "ofertas cerca de Tudela" eran de Berlin y Plymouth, las
// instrucciones obligaban al modelo a adivinar marcas, y el boton de "Enviar mi
// CV" no aparecia nunca despues de una foto.
// Desde el 16 oct 2026 lo que se hace con la foto está en lib/camara/analizar-foto.ts.
const camaraSrc = leerFuente("app/api/gusi/analyze-image/route.ts") + leerFuente("lib/camara/analizar-foto.ts");
const fichaSrc = leerFuente("lib/camara/ficha-marca.ts");
const chatSrc = leerFuente("components/GusiChat.tsx");

test("la camara no obliga a adivinar marcas", () => {
  const codigo = camaraSrc.split("\n").filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l)).join("\n");
  return codigo.includes("NO adivines marcas") &&
    !/NUNCA pongas "MARCA: generico"|Prefiere estimar a rendirte/.test(codigo);
});

test("la camara no anuncia como cercanas ofertas de otro pais", () =>
  !camaraSrc.includes("async function searchJobsBySector") &&
  !camaraSrc.includes("async function searchJobsByCompanyOrSector") &&
  // Desde el 16 oct 2026 la consulta compara en minúsculas: lower(j.country) = $1.
  (camaraSrc.includes("country = $1") || camaraSrc.includes("lower(j.country) = $1")) &&
  fichaSrc.includes("(country = $2) AS en_pais"));

test("la ficha de la marca solo enseña webs que existen", () =>
  fichaSrc.includes("webExiste(texto(bruto.web_oficial))") &&
  fichaSrc.includes("webExiste(texto(bruto.portal_empleo))") &&
  fichaSrc.includes("res.status === 404"));

// Nike en Tudela devolvia Intersport y dos tiendas de deportes como "sus tiendas".
test("una tienda que vende la marca no se presenta como suya", () =>
  fichaSrc.includes("propias: todas.filter((t) => slug(t.empresa.nombre).includes(marcaNorm))") &&
  camaraSrc.includes("Tiendas cerca que venden"));

// Una foto de un Zara devolvia el Stradivarius de al lado: se cogia el primer
// resultado de "negocios cerca" sin mirar el nombre.
test("la fachada solo se da por buena si el nombre coincide", () =>
  camaraSrc.includes("function nombreCoincide") &&
  camaraSrc.includes("nearbyData.results?.find((r) => nombreCoincide(companyName") &&
  camaraSrc.includes("sitios.filter((s) => nombreCoincide(companyName, s.name))"));

test("despues de una foto aparece el boton de enviar el CV", () =>
  chatSrc.includes("addMsg(\"gusi\", data.reply, data.action, data.company") &&
  camaraSrc.includes("emailRrhh: p.email") &&
  camaraSrc.includes("company: lugarAEmpresaDelChat(lugar)"));

test("la app reduce la foto antes de mandarla", () =>
  chatSrc.includes("async function reducirFoto") &&
  chatSrc.includes("await reducirFoto(file, 1024"));

// ── EL PRIMER DIA DEL USUARIO ──────────────────────────────────────────────
//
// A 23 sep 2026: 122 registrados, 36 con CV subido y solo 6 personas habian
// mandado un CV en 30 dias. Los tres pasos del principio se calculan contra los
// datos de verdad (perfil, user_cvs, cv_sends) y NO contra una columna del tipo
// "onboarding_completado": una banderita se desincroniza del mundo real —borras
// tu CV y sigues "completado"— y acaba mintiendo en la pantalla que dice
// justamente lo que te falta.
test("los pasos del primer dia se miden con datos reales", () => {
  const p = leerFuente("lib/onboarding/primer-dia.ts");
  // Solo el codigo: el comentario de arriba nombra la banderita para explicar
  // por que NO se usa.
  const codigo = p.split("\n").filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l)).join("\n");
  return codigo.includes("FROM user_cvs WHERE user_id") &&
    codigo.includes('from("cv_sends")') &&
    codigo.includes('select("ciudad")') &&
    // El CV puede estar en el editor o subido como PDF: se cuentan las dos.
    codigo.includes('storage.from("cvs")') &&
    !/onboarding_completado|primer_dia_hecho/.test(codigo);
});

// El correo de bienvenida prometia "mas de 148.000 ofertas activas en España"
// cuando habia 38.576: el numero se escribio a mano cuando era cierto y se quedo
// ahi. Ahora las cifras viven en lib/promesas.ts y el centinela las comprueba
// contra la base cada mañana.
test("los correos no prometen cifras escritas a mano", () => {
  const e = leerFuente("lib/email/smtp-sender.ts");
  const codigo = e.split("\n").filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l)).join("\n");
  const inventadas = codigo.match(/[0-9]{1,3}[.][0-9]{3}\s*ofertas/gi) || [];
  if (inventadas.length) console.log("      cifra escrita a mano: " + inventadas.join(", "));
  return codigo.includes("frasePromesaOfertas()") && inventadas.length === 0;
});
test("el centinela comprueba lo que prometemos", () => {
  const c = leerFuente("app/api/admin/centinela/route.ts");
  return c.includes("lo que prometemos por correo sigue siendo verdad") &&
    c.includes("reales >= OFERTAS_ESPANA");
});

// El formulario de registro pide la ciudad, y hasta el 23 sep 2026 se guardaba
// en user_contacts y en la alerta de empleo pero NUNCA en profiles.ciudad, que es
// de donde la leen el perfil, las recomendaciones y los pasos del principio. De
// 50 registros del ultimo mes, 49 figuraban "sin ciudad" habiendola escrito. Y a
// 69 de 123 cuentas no se les habia creado ni la ficha del perfil.
test("la ciudad del registro llega al perfil", () => {
  const w = leerFuente("lib/onboarding/dar-bienvenida.ts");
  return w.includes('.from("profiles")') &&
    w.includes("...(ciudad ? { ciudad } : {})") &&                          // ficha nueva, con ciudad
    w.includes("if (ciudad && !perfilActual.ciudad?.trim()) faltan.ciudad = ciudad") && // ficha vieja sin ciudad
    w.includes(".insert({") &&        // crea la ficha si no existia
    w.includes("maybeSingle()");      // y no falla cuando no hay fila
});

// Un recordatorio que se repite acaba en la carpeta de spam de todo el mundo, y
// uno que se da por enviado sin salir deja a esa persona sin recibirlo nunca,
// porque solo se manda una vez.
test("el recordatorio del primer dia se manda una sola vez y solo si sale", () => {
  const r = leerFuente("app/api/onboarding/recordatorios/route.ts");
  const e = leerFuente("lib/email/smtp-sender.ts");
  const posicionFallo = r.indexOf("if (!salio)");
  const posicionInsert = r.indexOf(".insert({");
  // Entre el fallo y el apunte tiene que haber un `continue`: si no, se anota
  // como avisado a quien no recibio el correo, y como solo se manda una vez,
  // esa persona se queda sin el para siempre.
  const entreMedias = posicionFallo > -1 && posicionInsert > posicionFallo
    ? r.slice(posicionFallo, posicionInsert)
    : "";
  return r.includes('const TIPO = "recordatorio_primer_dia"') &&
    r.includes('.eq("tipo", TIPO)') &&
    entreMedias.includes("continue;") &&
    e.includes("async function enviarCorreo") &&
    e.includes("return enviarCorreo(params.email");
});

// ── NINGUNA PANTALLA LLAMA A UNA RUTA QUE NO EXISTE ────────────────────────
//
// El 22 sep 2026, guardar una oferta desde una notificacion siempre fallaba: la
// pantalla llamaba a /api/jobs/save y /api/jobs/unsave, que no existen (es
// /api/jobs/guardar, con la accion en el cuerpo). Se comia un 404 y enseñaba un
// "No se pudo guardar la oferta" sin mas. Un fallo asi no lo ve ningun tipo ni
// ninguna compilacion: solo lo ve quien lo usa.
test("ninguna pantalla llama a una ruta de API que no existe", () => {
  const rutasApi = new Set();
  for (const rel of readdirSync("app/api", { recursive: true })) {
    const ruta = "app/api/" + String(rel).split("\\").join("/");
    if (ruta.endsWith("/route.ts")) rutasApi.add(ruta.replace(/^app/, "").replace(/\/route\.ts$/, ""));
  }
  const conParametro = [...rutasApi].filter((r) => r.includes("["));
  const existe = (r) =>
    rutasApi.has(r) ||
    conParametro.some((d) => new RegExp("^" + d.replace(/\[[^\]]+\]/g, "[^/]+") + "$").test(r));

  const fantasmas = [];
  for (const raiz of ["app", "components", "lib"]) {
    for (const rel of readdirSync(raiz, { recursive: true })) {
      const fichero = raiz + "/" + String(rel).split("\\").join("/");
      if (!/\.(ts|tsx)$/.test(fichero) || fichero.includes("/api/")) continue;
      for (const m of leerFuente(fichero).matchAll(/["'`](\/api\/[a-zA-Z0-9/_\-[\]$.{}]*)["'`]/g)) {
        const ruta = m[1].replace(/\/$/, "");
        // Las rutas que se arman con variables no se pueden comprobar aqui.
        if (ruta.includes("${") || ruta.includes("[")) continue;
        if (!existe(ruta)) fantasmas.push(ruta + " (en " + fichero + ")");
      }
    }
  }
  if (fantasmas.length) console.log("      rutas que no existen: " + [...new Set(fantasmas)].join(", "));
  return fantasmas.length === 0;
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

// ── NINGÚN DATO SALE A CHINA ───────────────────────────────────────────────
//
// DeepSeek (China) era respaldo de Guzzi, de las cartas y del enrutador de IA.
// Michel lo retiró el 23 oct 2026: que ningún dato de los usuarios salga a China.
// Si alguien lo vuelve a meter, aunque sea de respaldo, la política de privacidad
// dejaría de decir la verdad.
test("ningún dato sale a China: nada llama a DeepSeek", async () => {
  const { execFileSync } = await import("node:child_process");
  // git grep sin resultados sale con código 1: eso es lo bueno.
  let llamadas = "";
  try {
    llamadas = execFileSync("git", ["grep", "-nIE", "api\\.deepseek\\.com|DEEPSEEK_API_KEY", "--", "app", "lib", "components", "scripts", ":!scripts/sello-verificacion.mjs"], { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch { /* sin resultados */ }
  if (llamadas) console.log("     ↳ " + llamadas.split("\n").slice(0, 5).join("\n       "));
  return llamadas === "";
});

// El enrutador de IA ("Mejorar mi CV", carta y nota ATS) elegia DeepSeek por
// defecto y, si fallaba por algo que no fuera "limite diario", relanzaba el
// error. Con el 402 de falta de saldo, esas dos pantallas daban error 500 a
// todos los usuarios (comprobado en produccion el 29 sep 2026).
test("el enrutador de IA cae a la otra IA si la elegida falla por cualquier motivo", () => {
  const r = leerFuente("lib/ai/ai-router.ts");
  const bloqueCatch = r.slice(r.indexOf("} catch (error) {"), r.indexOf("// EJECUTOR DE TAREAS"));
  const soloLimites = /if\s*\(\s*mensaje === "GROQ_LIMIT_REACHED"/.test(bloqueCatch);
  return !soloLimites &&
    /for \(const fallback of alternativas\)[\s\S]*?ejecutarTareaConIA\(fallback/.test(bloqueCatch);
});

// 23 oct 2026, probando Guzzi en producción: "hazme una carta de presentación
// para Mercadona de reponedor" daba empresa "Mercadona de reponedor", ningún
// puesto, y Guzzi volvía a pedir los dos. Se prueba la expresión tal cual está
// en el chat con frases de verdad.
test("Guzzi saca empresa y puesto de 'carta para Mercadona de reponedor'", () => {
  const chat = leerFuente("app/api/gusi/chat/route.ts");
  const linea = chat.split("\n").find((l) => l.includes("const empMatch = message.match(")) || "";
  const re = new Function("return " + linea.slice(linea.indexOf("match(") + 6, linea.lastIndexOf(");")))();
  const casos = [
    ["hazme una carta de presentación para Mercadona de reponedor", "Mercadona", "reponedor"],
    ["carta para Leroy Merlin de dependiente", "Leroy Merlin", "dependiente"],
    ["carta de presentación para Mercadona", "Mercadona", undefined],
  ];
  const mal = casos.filter(([frase, empresa, puesto]) => { const m = frase.match(re); return !m || m[1] !== empresa || m[2] !== puesto; });
  mal.forEach(([frase]) => console.log(`     ↳ ${frase}: ${JSON.stringify(frase.match(re)?.slice(1, 3))}`));
  return mal.length === 0;
});

// ── LAS APPS TIENEN QUE PODER DAR LA UBICACIÓN (oct 2026) ─────────────────
//
// La cámara busca donde está el móvil, y sin ubicación, en la ciudad del perfil.
// Dentro de las apps nunca llegaba: faltaba declarar el permiso, y sin él el
// sistema lo deniega sin preguntar. Probado en producción con un perfil de Tudela
// y fotos de Pamplona: salía el "Cafe Iruña" de Sartaguda y el Mercadona de Tudela.
test("las apps de iPhone y Android declaran el permiso de ubicación que usa la cámara", () => {
  const manifiesto = leerFuente("android/app/src/main/AndroidManifest.xml");
  const codemagic = leerFuente("codemagic.yaml");
  return manifiesto.includes("android.permission.ACCESS_COARSE_LOCATION") && manifiesto.includes("android.permission.ACCESS_FINE_LOCATION")
    // Sin esto Google Play escondería la app a quien no tenga GPS.
    && /android\.hardware\.location\.gps" android:required="false"/.test(manifiesto)
    && /Add :NSLocationWhenInUseUsageDescription string/.test(codemagic)
    // "cap add ios" crea el proyecto con la 1.0, ya publicada: Apple no admite otra igual.
    && /Set :CFBundleShortVersionString \d+\.\d+\.\d+"/.test(codemagic)
    // npm ci sin esto acaba en ERESOLVE, y Codemagic pide las "Novedades" del idioma principal para enviar a Apple.
    && codemagic.includes("script: npm ci --legacy-peer-deps")
    // Sin esto, el altool de Xcode 26 no encuentra la app y la subida a Apple falla (error 19).
    && /APP_STORE_CONNECT_ALTOOL_ADDITIONAL_ARGUMENTS: "--apple-id \d+"/.test(codemagic)
    && JSON.parse(leerFuente("release_notes.json")).some((n) => n.language === "es-ES" && n.text);
});

// ── LA FOTO, MÁS LIGERA (3 nov 2026) ──────────────────────────────────────
//
// Medido en producción: de 5 a 7 s por foto, unos 4 de ellos leyéndola. El modelo
// reduce una foto de móvil a 1024x768 de todas formas, así que subirla a 1280 era
// mandar más para lo mismo; y la ciudad del perfil se buscaba después de leerla.
test("la foto sube a 1024 px y la ciudad se busca mientras se lee", () => {
  const chat = leerFuente("components/GusiChat.tsx");
  const ruta = leerFuente("app/api/gusi/analyze-image/route.ts");
  const layout = leerFuente("app/layout.tsx");
  const meta = layout.slice(layout.indexOf("export const metadata"), layout.indexOf("export const viewport"));
  return chat.includes("reducirFoto(file, 1024, 0.82)")
    && ruta.indexOf("const ciudadEnCamino") > 0 && ruta.indexOf("const ciudadEnCamino") < ruta.indexOf("await leerFoto(")
    && ruta.includes("ciudadUsuario: await ciudadEnCamino")
    // 78.390 avisos en un día por tenerlo en metadata: va en viewport.
    && !meta.includes("themeColor") && layout.slice(layout.indexOf("export const viewport")).includes('themeColor: "#0f1117"');
});

// El 3 nov 2026, la primera foto tras un despliegue: OpenAI contestó un 520 y la
// persona leyó "No se pudo leer la imagen". Un fallo pasajero se reintenta una vez.
test("la lectura de la foto reintenta una vez si OpenAI falla de paso", async () => {
  const { execFileSync } = await import("node:child_process");
  const { unlinkSync } = await import("node:fs");
  const salida = ".sello-leerfoto.cjs";
  const fetchReal = globalThis.fetch;
  try {
    execFileSync("npx", ["esbuild", "lib/camara/analizar-foto.ts", "--bundle", "--format=cjs", "--platform=node",
      "--packages=external", "--tsconfig=tsconfig.json", `--outfile=${salida}`, "--log-level=error"], { stdio: "pipe", shell: true });
    const c = await import(`../${salida}?${Date.now()}`);
    const bien = () => new Response(JSON.stringify({ choices: [{ message: { content: '{"tipo":"negocio","nombre":"Mercadona"}' } }] }), { status: 200 });
    const conRespuestas = async (respuestas) => {
      let n = 0;
      globalThis.fetch = async () => { const r = respuestas[n++]; if (r instanceof Error) throw r; return typeof r === "function" ? r() : r; };
      const errores = console.error; console.error = () => {};
      try { return { foto: await c.leerFoto("AAAA", "clave"), llamadas: n }; } finally { console.error = errores; }
    };
    const pasajero = await conRespuestas([new Response("<!DOCTYPE html>", { status: 520 }), bien]);
    const red = await conRespuestas([new TypeError("fetch failed"), bien]);
    const clave = await conRespuestas([new Response("bad key", { status: 401 }), bien]);
    const dosVeces = await conRespuestas([new Response("x", { status: 503 }), new Response("x", { status: 503 }), bien]);
    const ok = pasajero.foto?.nombre === "Mercadona" && pasajero.llamadas === 2
      && red.foto?.nombre === "Mercadona"
      && clave.foto === null && clave.llamadas === 1
      && dosVeces.foto === null && dosVeces.llamadas === 2;
    if (!ok) console.log("    ", JSON.stringify({ pasajero, red, clave, dosVeces }).slice(0, 300));
    return ok;
  } finally {
    globalThis.fetch = fetchReal;
    try { unlinkSync(salida); } catch { /* da igual */ }
  }
});

// ── REBOTES Y EMPRESA EQUIVOCADA (1 nov 2026) ─────────────────────────────
//
// La semana llegó al 4,0 % de rebotes, el límite de Resend. De 19 CVs a direcciones
// genéricas rebotaron 11, y de 18 a otras, 1. Además la empresa se buscaba solo por
// el nombre: "Clober" acabó en un club de golf británico y Adecco en adecco.de.
test("con los rebotes altos se frena lo deducido, y la empresa se busca en la ciudad de la oferta", async () => {
  const { execFileSync } = await import("node:child_process");
  const { unlinkSync, writeFileSync } = await import("node:fs");
  const entrada = ".sello-freno-entrada.ts", salida = ".sello-freno.cjs";
  try {
    writeFileSync(entrada, 'export { esDireccionGenerica, UMBRAL_FRENO_REBOTES } from "./lib/cv-sender/direccion-generica";\nexport { ciudadParaBuscarEmpresa, esLaMismaEmpresa } from "./lib/job-search/ciudad-oferta";\nexport { rebotesDeLaSemana } from "./lib/centinela/limites-correo";\nexport { sugerenciaCorreo } from "./lib/auth/sugerencia-correo";\n');
    execFileSync("npx", ["esbuild", entrada, "--bundle", "--format=cjs", "--platform=node", "--packages=external", "--tsconfig=tsconfig.json", `--outfile=${salida}`, "--log-level=error"], { stdio: "pipe", shell: true });
    const m = await import(`../${salida}`);
    const ahora = new Date().toISOString();
    const viejo = new Date(Date.now() - 9 * 864e5).toISOString();
    const r = m.rebotesDeLaSemana([
      { to: ["a@x.es"], created_at: ahora, last_event: "bounced" }, { to: ["b@x.es"], created_at: ahora, last_event: "delivered" },
      { to: ["bounced@resend.dev"], created_at: ahora, last_event: "bounced" }, { to: ["c@x.es"], created_at: viejo, last_event: "bounced" },
    ]);
    const ds = leerFuente("lib/cv-sender/direccion-segura.ts");
    const motivo = ds.slice(ds.indexOf("export async function motivoParaNoEnviar"));
    const reg = leerFuente("app/auth/registro/page.tsx");
    const sh = leerFuente("scripts/vps/sync-adzuna-barrido.sh");
    const cent = leerFuente("app/api/admin/centinela/route.ts");
    const checks = {
      "reconoce lo genérico": m.esDireccionGenerica("empleo@x.es") && m.esDireccionGenerica("INFO@x.es") && m.esDireccionGenerica("rrhh@x.es") && !m.esDireccionGenerica("ana.garcia@x.es") && !m.esDireccionGenerica("info.madrid@x.es"),
      "frena al mismo 3 % en que avisa el centinela": m.UMBRAL_FRENO_REBOTES === 3 && leerFuente("lib/cv-sender/freno-rebotes.ts").includes("UMBRAL_FRENO_REBOTES"),
      "cuenta solo la semana y sin las pruebas de Resend": r.rebotes === 1 && r.total === 2 && r.pct === 50,
      "el freno solo mira lo genérico y respeta lo que ya llegó": /esDireccionGenerica\(email\)[\s\S]*frenoDeRebotesActivo\(\)[\s\S]*direccionQueYaLlego\(email\)/.test(motivo),
      "ciudad limpia para buscar": m.ciudadParaBuscarEmpresa("Madrid, Comunidad de Madrid") === "Madrid" && m.ciudadParaBuscarEmpresa("Vitoria-Gasteiz (Álava)") === "Vitoria-Gasteiz",
      "sin ciudad si no es un sitio": m.ciudadParaBuscarEmpresa("España") === undefined && m.ciudadParaBuscarEmpresa("Remoto") === undefined && m.ciudadParaBuscarEmpresa("") === undefined && m.ciudadParaBuscarEmpresa(undefined) === undefined,
      "las pantallas de ofertas pasan la ciudad": ["components/JobCard.tsx", "components/ChatSendPanel.tsx", "components/GusiChat.tsx", "app/app/ofertas/[id]/OfertaDetalleClient.tsx"].every((f) => leerFuente(f).includes("ciudadParaBuscarEmpresa(") && leerFuente(f).includes("deOferta: true")),
      // Casos reales del 1 nov 2026, probados contra Google en producción.
      "lo parecido no vale": !m.esLaMismaEmpresa("Clober", "The Clover House", "thecloverhouse.es") && !m.esLaMismaEmpresa("Fastrack", "Fast Track T4 - Aeropuerto de Adolfo Suárez Madrid-Barajas (MAD)", "aena.es"),
      "la misma empresa sí": m.esLaMismaEmpresa("Adecco", "Adecco Staffing", "adecco.com") && m.esLaMismaEmpresa("Universidad de Deusto.", "Universidad de Deusto", "deusto.es")
        && m.esLaMismaEmpresa("HOFFMAN", "Hoffmann Group", "hoffmann-group.com") && m.esLaMismaEmpresa("Catalonia Hotels & Resorts", "Catalonia Gran Hotel", "cataloniahotels.com") && m.esLaMismaEmpresa("Café Bar Gaucho S.L.", "Cafe Bar Gaucho", null),
      "la ruta filtra y sin ciudad no busca": /deOferta && name && !city/.test(leerFuente("app/api/company/extract/route.ts")) && leerFuente("app/api/company/extract/route.ts").includes("empresas: soloLaMisma(empresas)"),
      "salarios: si Eurostat falla no se escribe nada y ningún país se pierde": !leerFuente("scripts/sync-minimum-wages.mjs").includes("Usando datos anteriores") && leerFuente("scripts/sync-minimum-wages.mjs").includes("datosPrevios.paises || {}") && leerFuente("scripts/sync-minimum-wages.mjs").includes("currency=NAC") && JSON.parse(leerFuente("public/data/salarios-minimos.json")).paises.PL.moneda === "PLN",
      "la espera entre correos no cuenta como registro cortado": reg.indexOf("segundos") > 0 && reg.indexOf("segundos") < reg.indexOf('fetch("/api/auth/registro-cortado"'),
      "el registro para una vez si el correo parece mal escrito": /sugerido && correoAvisado !== /.test(reg) && m.sugerenciaCorreo("ma@gmails.com") === "ma@gmail.com",
      "el barrido repite al final los países que no trajeron nada": sh.includes("REPETIR") && sh.includes("barrer_pais"),
      "el centinela avisa si España se queda sin barrido": cent.includes("el barrido de Adzuna trae ofertas de España") && cent.includes("ADZUNA_ES"),
    };
    const fallos = Object.entries(checks).filter(([, ok]) => !ok).map(([n]) => n);
    if (fallos.length) console.log("    fallan:", fallos.join(" | "));
    return fallos.length === 0;
  } finally {
    for (const f of [entrada, salida]) { try { unlinkSync(f); } catch { /* ya no está */ } }
  }
});

// ── CORREOS DEDUCIDOS DE OTRA EMPRESA U OTRO PAÍS (3 nov 2026) ────────────
//
// El proceso nocturno adivinaba la web por el nombre, en cualquier país, y copiaba
// el correo a todas las ofertas con ese nombre. En ofertas de España: Amazon con
// amazon.de, Santander con telepizza.es, Maersk con vpn.com. Casos reales.
test("un correo deducido de otra empresa u otro país no se ofrece, y el extractor busca por país", async () => {
  const { execFileSync } = await import("node:child_process");
  const { unlinkSync } = await import("node:fs");
  const salida = ".sello-correo-oferta.cjs";
  try {
    execFileSync("npx", ["esbuild", "lib/job-search/correo-oferta.ts", "--bundle", "--format=cjs", "--platform=node", `--outfile=${salida}`, "--log-level=error"], { stdio: "pipe", shell: true });
    const { correoCreibleParaOferta: vale } = await import(`../${salida}?${Date.now()}`);
    const worker = leerFuente("scripts/vps/extract-emails-worker.js");
    const sh = leerFuente("scripts/vps/extract-emails-fast.sh");
    const prop = leerFuente("scripts/vps/propagar-emails.sql");
    const checks = {
      "otro país no": !vale("empleo@amazon.de", "Amazon", "es") && !vale("rrhh@leroy-merlin.fr", "Leroy Merlin España", "es") && !vale("a@yahoo.co.in", "Glintt Global", "es"),
      "otra empresa no": !vale("info@telepizza.es", "Santander", "es") && !vale("x@vpn.com", "A.P. Moller - Maersk", "es") && !vale("info@alsglobal.com", "Alsa Grupo", "es") && !vale("info@kia.com", "Kiabi España", "es") && !vale("info@comunidad.com", "Comunidad Autónoma de la Región de Murcia", "es"),
      "la suya sí": vale("info@amazon.com", "Amazon Spain Services, S.L.U.", "es") && vale("empleo@gruascarter.com", "Asistencias Carter", "es") && vale("rrhh@elcorteingles.es", "El Corte Inglés", "es")
        && vale("x@bbva.com", "Banco Bilbao Vizcaya Argentaria", "es") && vale("info@tudela.es", "Ayuntamiento de Tudela", "es") && vale("jobs@acme.co.uk", "Acme Ltd", "uk") && vale("x@amazon.de", "Amazon", "de"),
      "un buzón de cualquiera no se juzga por el nombre": vale("barpepe@gmail.com", "Bar Pepe", "es"),
      "lo que escribió la empresa en la oferta vale siempre": vale("rrhh@otra.de", "Lo que sea", "es", "alta"),
      "sin correo, nada": !vale("", "Amazon", "es") && !vale(null, "Amazon", "es"),
      "la búsqueda, la ficha, para ti y au pair lo comprueban": ["app/api/jobs/search/route.ts", "app/app/ofertas/[id]/page.tsx", "lib/job-search/ofertas-para-ti.ts", "app/api/au-pair/ofertas/route.ts", "app/api/au-pair/agencias/route.ts"].every((f) => leerFuente(f).includes("correoCreibleParaOferta(")),
      "el extractor prueba solo los dominios del país": worker.includes("guessTlds(country)") && !/'de', 'fr', 'es', 'it', 'se'/.test(worker),
      "el extractor solo acepta correos del propio dominio y que pasen la comprobación de la app": worker.includes("if (!suyos.length) return null") && worker.includes("correoCreibleParaOferta(email, name, country, null)"),
      "la web tiene que nombrar a la empresa": worker.includes("nombraALaEmpresa(html, name)"),
      "el correo encontrado va solo a las ofertas de ese país": worker.includes("AND lower(country) = '${safeCountry.toLowerCase()}'") && sh.includes("GROUP BY company, lower(country)"),
      "la propagación no cruza países": prop.includes("lower(j.country) = m.pais"),
    };
    const fallos = Object.entries(checks).filter(([, ok]) => !ok).map(([n]) => n);
    if (fallos.length) console.log("    fallan:", fallos.join(" | "));
    return fallos.length === 0;
  } finally {
    try { unlinkSync(salida); } catch { /* ya no está */ }
  }
});

// ── ENCAJAS AQUÍ / TE DARÍA VENTAJA (3 nov 2026, idea de Michel) ──────────
//
// La foto decía qué negocio era y la oferta qué pedía, pero ninguna decía qué
// tenía que ver con el CV de quien miraba. Sin IA: puestos de aquí contra los
// suyos, y el curso que piden para ellos y su CV no nombra.
test("Guzzi dice si encajas y qué te daría ventaja, en la foto y en la oferta, sin inventar", async () => {
  const { execFileSync } = await import("node:child_process");
  const { unlinkSync } = await import("node:fs");
  const salida = ".sello-encaje.cjs";
  try {
    execFileSync("npx", ["esbuild", "lib/guzzi/consejo-encaje.ts", "--bundle", "--format=cjs", "--platform=node", "--tsconfig=tsconfig.json", `--outfile=${salida}`, "--log-level=error"], { stdio: "pipe", shell: true });
    const { encajeConPuestos, textoEncaje } = await import(`../${salida}?${Date.now()}`);
    const camarera = { subtitulo: "Camarera", experiencia: [{ puesto: "Camarera de sala", empresa: "Bar La Parada" }, { puesto: "Reponedora", empresa: "Eroski" }] };
    const conCarne = { ...camarera, formacion: [{ titulo: "Manipulador de alimentos" }] };
    const informatico = { subtitulo: "Desarrollador web", experiencia: [{ puesto: "Programador", empresa: "Acme" }] };
    const super_ = ["reponedor", "cajero", "carnicero"];
    const a = encajeConPuestos(camarera, super_);
    const b = encajeConPuestos(conCarne, ["camarero", "cocinero"]);
    const c = encajeConPuestos(informatico, ["reponedor", "cajero"]);
    const ruta = leerFuente("app/api/gusi/analyze-image/route.ts");
    const checks = {
      "encaja por lo que ha trabajado, con dónde": a.encaja[0]?.suyo === "Reponedora" && a.encaja[0]?.empresa === "Eroski" && /has trabajado de reponedora en Eroski/.test(textoEncaje(a, super_, true)),
      "el curso que piden y su CV no nombra": a.curso?.slug === "manipulador-alimentos" && textoEncaje(a, super_, true).includes("[Dónde sacarlo](/cursos/manipulador-alimentos)"),
      "no se le recomienda lo que ya tiene": b.encaja.length === 1 && b.curso === null,
      "sin nada en común no se le inventa experiencia": c.encaja.length === 0 && /en tu CV no aparece/.test(textoEncaje(c, ["reponedor", "cajero"], true)) && !/Encajas/.test(textoEncaje(c, ["reponedor", "cajero"], true)),
      "sin CV, que lo suba": /Si subes tu CV/.test(textoEncaje(null, ["camarero"], false)) && encajeConPuestos(null, ["camarero"]) === null,
      "sin puestos, nada": textoEncaje(encajeConPuestos(camarera, []), [], true) === "",
      "la foto lo añade sin esperar más: el CV se pide mientras se lee": ruta.indexOf("const cvEnCamino") > 0 && ruta.indexOf("const cvEnCamino") < ruta.indexOf("await leerFoto(") && ruta.includes("ACCIONES_CON_CONSEJO.has("),
      "la ficha de la oferta lo enseña": leerFuente("app/app/ofertas/[id]/OfertaDetalleClient.tsx").includes("encajeConPuestos(cvDatos, [oferta.titulo]"),
    };
    const fallos = Object.entries(checks).filter(([, ok]) => !ok).map(([n]) => n);
    if (fallos.length) console.log("    fallan:", fallos.join(" | "));
    return fallos.length === 0;
  } finally {
    try { unlinkSync(salida); } catch { /* ya no está */ }
  }
});

// ── EL SIMULADOR DE ENTREVISTAS POR VOZ EN IPHONE (31 oct 2026) ───────────
//
// El plugin de voz necesita las dos claves. Sin la de reconocimiento, Apple rechazó
// la compilación 23 (ITMS-90683) y iOS cierra la app al pedir el permiso. El Info.plist
// real lo escribe codemagic.yaml, que decía que el micrófono era para "grabar vídeo".
test("el iPhone explica el micrófono y el reconocimiento de voz del simulador de entrevistas", () => {
  const codemagic = leerFuente("codemagic.yaml");
  return /Add :NSSpeechRecognitionUsageDescription string '[^']*entrevistas[^']*'/.test(codemagic)
    && /Add :NSMicrophoneUsageDescription string '[^']*entrevistas[^']*'/.test(codemagic);
});

// ── DE DÓNDE VIENE LA GENTE (23 oct 2026) ──────────────────────────────────
//
// De 248 cuentas, de 190 no se sabía por qué canal llegaron. Ahora se apunta al
// registrarse: lo que contestan, de qué web venían y si es la app o la web. Sin
// cookies ni nada guardado en el navegador (la política lo dice así), y con las
// referencias que mandan de verdad Google, Instagram o la app de Google.
test("de dónde viene cada registro: sin cookies, con la pregunta y bien clasificado", async () => {
  const { execFileSync } = await import("node:child_process");
  const { unlinkSync } = await import("node:fs");
  const salida = ".sello-llegada.cjs";
  try {
    execFileSync("npx", ["esbuild", "lib/origen/llegada.ts", "--bundle", "--format=cjs", "--platform=node",
      `--outfile=${salida}`, "--log-level=error"], { stdio: "pipe", shell: true });
    const { clasificarLlegada } = await import(`../${salida}?${Date.now()}`);
    const casos = [
      [["https://www.google.com/", "", ""], "google"],
      [["https://www.google.es/", "", ""], "google"],
      [["android-app://com.google.android.googlequicksearchbox/", "", ""], "google"],
      [["https://l.instagram.com/", "", ""], "instagram"],
      [["https://play.google.com/store/apps", "", ""], "google play"],
      [["https://www.tiktok.com/", "", ""], "tiktok"],
      [["", "Instagram", "Bio"], "instagram"],
      [["https://buscaycurra.es/precios", "", ""], "directo"],
      [["", "", ""], "directo"],
      [["https://www.diariodenavarra.es/noticia", "", ""], "diariodenavarra.es"],
    ];
    const mal = casos.filter(([args, esperado]) => clasificarLlegada(...args).llegoDe !== esperado);
    mal.forEach(([args, esperado]) => console.log(`     ↳ ${JSON.stringify(args)}: ${clasificarLlegada(...args).llegoDe} (debía ser ${esperado})`));
    const llegada = leerFuente("lib/origen/llegada.ts");
    const reg = leerFuente("app/auth/registro/page.tsx");
    const checks = {
      "sin almacenamiento en el navegador": !/localStorage|sessionStorage|document\.cookie/.test(llegada),
      "la campaña del enlace se guarda": clasificarLlegada("", "Instagram", "Bio").campana === "bio",
      "el registro guarda pregunta, web y plataforma": reg.includes('htmlFor="conocio"') && reg.includes("...(conocio ? { conocio } : {})")
        && reg.includes("llego_de: llegada.llegoDe") && reg.includes("plataforma: plataforma()"),
      "se apunta al llegar a cualquier página": leerFuente("app/layout.tsx").includes("<ApuntarLlegada />"),
      "la política de privacidad lo cuenta": leerFuente("app/privacidad/page.tsx").includes("Cómo nos conociste:"),
    };
    const malos = Object.entries(checks).filter(([, ok]) => !ok).map(([k]) => k);
    if (malos.length) console.log(`     ↳ ${malos.join(" · ")}`);
    return mal.length === 0 && malos.length === 0;
  } catch (e) {
    console.log(`     ↳ no se pudo probar: ${e.message?.slice(0, 80)}`);
    return false;
  } finally {
    try { unlinkSync(salida); } catch { /* no estaba */ }
  }
});

// El contador del escritorio de Michel y el resumen de cada mañana: personas
// reales (sin cuentas de prueba), un canal por persona y con clave de solo lectura.
test("el contador y el resumen diario cuentan personas reales y piden clave", async () => {
  const { execFileSync } = await import("node:child_process");
  const { unlinkSync } = await import("node:fs");
  const salida = ".sello-personas.cjs";
  try {
    execFileSync("npx", ["esbuild", "lib/metricas/personas.ts", "--bundle", "--format=cjs", "--platform=node",
      "--external:@supabase/supabase-js", `--outfile=${salida}`, "--log-level=error"], { stdio: "pipe", shell: true });
    const { canalDe, esCuentaDePrueba } = await import(`../${salida}?${Date.now()}`);
    const casos = [
      [{ conocio: "charla", llego_de: "google" }, "En una charla o un curso"],
      [{ llego_de: "instagram" }, "Instagram"],
      [{ llego_de: "directo", origen: "oferta:abc123" }, "Ficha de una oferta"],
      [{ llego_de: "directo", plataforma: "ios" }, "App de iPhone"],
      [{ llego_de: "directo", plataforma: "web" }, "Directo"],
      [{}, "Sin dato"],
    ];
    const mal = casos.filter(([meta, esperado]) => canalDe(meta) !== esperado);
    mal.forEach(([meta, esperado]) => console.log(`     ↳ ${JSON.stringify(meta)}: ${canalDe(meta)} (debía ser ${esperado})`));
    const contador = leerFuente("app/api/admin/contador/route.ts");
    const resumen = leerFuente("app/api/admin/resumen-diario/route.ts");
    const checks = {
      "cuentas de prueba fuera": esCuentaDePrueba("delivered+qa@resend.dev") && esCuentaDePrueba("demo@buscaycurra.es")
        && esCuentaDePrueba("audit3@gmail.com") && !esCuentaDePrueba("lucia.perez@gmail.com"),
      "el contador pide su clave": contador.includes('secretIguales(req.headers.get("x-contador"), claveContador())') && contador.includes("status: 401"),
      "el resumen pide el secreto del servidor": resumen.includes('secretIguales(req.headers.get("x-sync-secret"), process.env.ADMIN_SECRET)'),
      "sale cada mañana después del centinela": /\n40 7 \* \* \* .*resumen-diario\.sh/.test(leerFuente("scripts/vps/crontab.txt")),
    };
    const malos = Object.entries(checks).filter(([, ok]) => !ok).map(([k]) => k);
    if (malos.length) console.log(`     ↳ ${malos.join(" · ")}`);
    return mal.length === 0 && malos.length === 0;
  } catch (e) {
    console.log(`     ↳ no se pudo probar: ${e.message?.slice(0, 80)}`);
    return false;
  } finally {
    try { unlinkSync(salida); } catch { /* no estaba */ }
  }
});

// ── EL REGISTRO NO PUEDE PERDER LO QUE ESCRIBE LA PERSONA ─────────────────
//
// El formulario llamaba a /api/auth/welcome sin sesion (con la confirmacion por
// correo aun no la hay) y se quedaba en un 401. A 29 sep 2026: de 14 registros
// desde el 23 sep, 12 habian escrito su ciudad, 2 la tenian guardada, y ninguno
// tenia alerta ni correo de bienvenida. Ahora la llama la pagina de
// confirmacion con la sesion ya abierta, y el servidor lee los datos de la
// cuenta y la hace una sola vez.
test("la bienvenida se hace al confirmar el correo, con sesion y una sola vez", () => {
  const cb = leerFuente("app/auth/callback/page.tsx");
  const w = leerFuente("lib/onboarding/dar-bienvenida.ts");
  const reg = leerFuente("app/auth/registro/page.tsx");
  const ayuda = leerFuente("lib/onboarding/pedir-bienvenida.ts");
  return /pedirBienvenida\(sesion\?\.access_token\)/.test(cb) &&
    /fetch\("\/api\/auth\/welcome"[\s\S]{0,200}Authorization: `Bearer \$\{accessToken\}`/.test(ayuda) &&
    !w.includes("email y nombre requeridos") &&
    /cuerpo\.ciudad \|\| meta\.ciudad/.test(w) &&
    /if \(cuenta\.app_metadata\?\.bienvenida_en\)/.test(w) &&
    /ref: referralCode/.test(reg.slice(reg.indexOf("auth.signUp"), reg.indexOf("auth.signUp") + 600));
});

// El enlace de confirmacion es PKCE y solo funciona en el navegador donde te
// registraste. Registrarse en la app y abrir el correo en Gmail (otro
// navegador) daba "Algo no fue bien: el enlace no es valido" con la cuenta YA
// confirmada, y sin bienvenida: 2 de las 10 cuentas de la semana (3 oct 2026,
// reproducido con un registro real). Ahora se dice que esta confirmada, y la
// bienvenida se pide tambien al entrar con la contrasena.
test("confirmar el correo en otro navegador no da error y la bienvenida llega al entrar", () => {
  const cb = leerFuente("app/auth/callback/page.tsx");
  const login = leerFuente("app/auth/login/page.tsx");
  const trasCanje = cb.slice(cb.indexOf("exchangeCodeForSession(code)"), cb.indexOf("exchangeCodeForSession(code)") + 3000);
  return /if \(error && !yaHaySesion\) \{[\s\S]*?setEstado\("confirmada"\)/.test(trasCanje) &&
    !/setEstado\("error"\);\s*setMensaje\("El enlace de confirmación no es válido o ha expirado\."\);\s*return;\s*\}\s*\/\/ Flujo implícito/.test(cb) &&
    /supabase\.auth\.setSession\(\{/.test(cb) &&                               // el hash #access_token se recoge
    /pedirBienvenida\(entrada\.session\?\.access_token\)/.test(login);
});

// ── LAS PAGINAS QUE RASTREA GOOGLE NO PUEDEN DAR ERROR ─────────────────────
//
// /trabajar-en/{pais}/{oficio} son 156 de las 196 URLs del mapa del sitio y
// daban error 500 (30 sep 2026): OR entre fuente y ciudades, y el oficio buscado
// tambien en la descripcion, sin indice posible. Se agotaban los 15 s.
test("las paginas trabajar-en/pais/oficio usan indice y no revientan", () => {
  const p = leerFuente("app/trabajar-en/[pais]/[keyword]/page.tsx");
  return /LOWER\(country\) = \$1/.test(p) && /"title" ILIKE \$2/.test(p) &&
    !/"description" ILIKE/.test(p) &&
    /\} catch \(e\) \{\s*console\.error\(`\[trabajar-en\]/.test(p);
});

// El 30 sep 2026 un 503 suelto de Adzuna en la primera pagina dejo a Espana
// con 0 ofertas en el barrido diario (los otros 14 paises trajeron 33.385).
test("el barrido de Adzuna reintenta los fallos pasajeros (5xx, red)", () => {
  const w = leerFuente("lib/job-search/sync-worker.ts");
  const barrer = w.slice(w.indexOf("export async function barrerAdzuna"), w.indexOf("export async function syncAdzunaCountry"));
  return /for \(let intento = 1; lote\.length === 0 && intento <= 2 && \/HTTP 5\\d\\d\|error de red\/\.test/.test(barrer) &&
    /lote = await fetchAdzunaPagina\(countryCode, pagina/.test(barrer.slice(barrer.indexOf("intento++"))) ;
});

// ── LOS TRES FALLOS DEL CV QUE CONTO MICHEL (2 oct 2026) ───────────────────
//
// 1. Descargar el CV abria una pagina con {"error":"No autorizado"}.
// 2. Pedirle a Guzzi editar el CV acababa hablando de ofertas de carretillero.
// 3. "Mejorar con IA" no cambiaba nada a la vista y no se guardaba.
test("el enlace del PDF del movil no exige sesion (la abre el navegador del sistema)", () => {
  const r = leerFuente("app/api/cv/pdf-template/route.ts");
  const get = r.slice(r.indexOf("export async function GET"));
  // El camino del movil vive en UN solo sitio, y las dos pantallas que bajan
  // el CV lo usan: antes cada una tenia el suyo y las dos fallaban.
  const ayuda = leerFuente("lib/cv-generator/descargar-pdf.ts");
  const pantallas = ["app/app/curriculum/Content.tsx", "app/app/curriculum/guardados/page.tsx"];
  const vida = Number((r.match(/const SEGUNDOS_VIDA = (\d+)/) || [])[1] || 0);
  return !/getUserId/.test(get) &&                              // window.open no lleva sesion
    /\^\[\\w-\]\+:\[a-f0-9\]\{32\}\$/.test(get) &&              // el azar del enlace es lo que protege
    // NO de un solo uso: el telefono pide el mismo PDF mas de una vez (gestor
    // de descargas de Android, "Guardar en Archivos" del iPhone) y la segunda
    // peticion se llevaba un error con nombre de PDF que se abria vacio.
    !/r\.del\(/.test(get) && vida >= 600 &&
    // y si caduca, una pagina que se entienda, no {"error":...}
    !/NextResponse\.json\(/.test(get) && /paginaDeAviso\(/.test(get) &&
    ayuda.includes("if (esNativo()) {") &&                      // y vale para iOS y Android
    pantallas.every((f) => leerFuente(f).includes("await descargarCVComoPDF(")) &&
    pantallas.every((f) => /if \(fallo\) setError\(fallo\)/.test(leerFuente(f)));
});

// ── EL CV QUE SE VE ES EL QUE SE DESCARGA, SE GUARDA Y SE ENVIA ────────────
//
// Habia tres conversiones distintas de los datos del formulario al CV, y el
// autoguardado metia los datos en bruto en la columna "html": la pantalla de
// CVs guardados descargaba un PDF con {"nombre":...} (los 52 CV guardados
// estaban asi), y el CV que recibia la empresa salia en otro orden, con la
// fila en blanco del formulario y un "Espanol 100 %" que nadie habia puesto.
test("una sola conversion del formulario al CV, en todas partes", () => {
  const editor = leerFuente("app/app/curriculum/Content.tsx");
  const guardados = leerFuente("app/app/curriculum/guardados/page.tsx");
  const worker = leerFuente("lib/cv-sender/worker.ts");
  const fnEditor = editor.slice(editor.indexOf("function formToCVDataDe"), editor.indexOf("function formToCVDataDe") + 300);
  return /return normalizar\(/.test(fnEditor) &&
    /function formToCVDataRaw\(\): CVData \{\s*return formToCVDataDe\(form\);/.test(editor) &&
    /generarCV\(normalizar\(datos\)\)/.test(guardados) &&
    /normalizar\(rawData\)/.test(worker) &&
    // el autoguardado guarda el CV montado, no los datos en bruto
    !/cvText: JSON\.stringify\(cvData\)/.test(editor);
});

// Y la columna "html" la monta EL SERVIDOR: la subida del CV por Guzzi tambien
// mandaba JSON.stringify(datos), el mismo fallo por otra puerta. Asi ninguna
// pantalla, de ahora o futura, puede volver a guardar texto en bruto.
test("el CV guardado lo monta el servidor desde los datos", async () => {
  const gusiCv = leerFuente("app/api/gusi/cv/route.ts");
  const guardar = leerFuente("app/api/cv/guardar/route.ts");
  const post = gusiCv.slice(gusiCv.indexOf("export async function POST"), gusiCv.indexOf("export async function DELETE"));
  const { execFileSync } = await import("node:child_process");
  const { unlinkSync } = await import("node:fs");
  const salida = "scripts/.tmp-htmlcv.cjs";
  execFileSync("npx", ["esbuild", "lib/cv-generator/html-guardado.ts", "--bundle",
    "--format=cjs", "--platform=node", `--outfile=${salida}`, "--log-level=error"],
    { stdio: "pipe", shell: true });
  const { htmlDelCV } = await import(`../${salida}`);
  try { unlinkSync(salida); } catch {}
  const html = htmlDelCV({ nombre: "Ana", experiencia: [{ puesto: "Camarera", fechas: "2024" }] });
  return /const html = htmlDelCV\(cvData\)/.test(post) && !/cvText \|\| ""/.test(post) &&
    /htmlDelCV\(formData\)/.test(guardar) &&
    /cv-page/.test(html) && html.includes("Ana") && !html.trim().startsWith("{") &&
    htmlDelCV(null) === "";
});

test("normalizar ordena, quita filas vacias y no se inventa idiomas", async () => {
  const { execFileSync } = await import("node:child_process");
  const { unlinkSync } = await import("node:fs");
  const salida = "scripts/.tmp-normalizar.cjs";
  execFileSync("npx", ["esbuild", "lib/cv-generator/normalizar.ts", "--bundle",
    "--format=cjs", "--platform=node", `--outfile=${salida}`, "--log-level=error"],
    { stdio: "pipe", shell: true });
  const { normalizar } = await import(`../${salida}`);
  try { unlinkSync(salida); } catch {}
  const salida2 = "scripts/.tmp-plantillas.cjs";
  execFileSync("npx", ["esbuild", "lib/cv-generator/plantillas.ts", "--bundle",
    "--format=cjs", "--platform=node", `--outfile=${salida2}`, "--log-level=error"],
    { stdio: "pipe", shell: true });
  const cv = normalizar({
    nombre: "Ana", idiomas: "",
    experiencia: [
      { fechas: "2015 - 2018", puesto: "Dependienta", empresa: "A", descripcion: "" },
      { fechas: "", puesto: "", empresa: "", descripcion: "" },              // la fila en blanco del formulario
      { fechas: "2021 - 2024", puesto: "Camarera", empresa: "B", descripcion: "servir\n- cobrar" },
    ],
  });
  // Auditoria del 2 oct 2026: el trabajo actual salia debajo de uno mas viejo,
  // una experiencia sin puesto desaparecia sin avisar y "B2" era un 70 % cualquiera.
  const cv2 = normalizar({
    nombre: "Ana", idiomas: "Inglés:B2, Francés:C1",
    experiencia: [
      { fechas: "2019 - 2024", puesto: "Ayudante de cocina", empresa: "A" },
      { fechas: "2023 - Actualidad", puesto: "Jefa de partida", empresa: "B" },
      { fechas: "2017 - 2018", puesto: "", empresa: "Pulpería Ezequiel", descripcion: "cocer pulpo" },
    ],
    formacion: [{ titulo: "", centro: "Escuela de Hostelería" }],
  });
  const { generarCV } = await import(`../${salida2}`);
  const html = generarCV({ nombre: "Ana", perfilProfesional: "Primera línea\nSegunda línea", templateId: "clasica" });
  try { unlinkSync(salida2); } catch {}
  return cv.experiencia.length === 2 &&
    cv.experiencia[0].puesto === "Camarera" &&                              // la mas reciente primero
    JSON.stringify(cv.experiencia[0].descripcion) === JSON.stringify(["servir", "cobrar"]) &&
    cv.idiomas.length === 0 &&                                              // nada de "Espanol 100 %"
    cv2.experiencia[0].puesto === "Jefa de partida" &&                      // "Actualidad" va la primera
    cv2.experiencia.some((e) => e.puesto === "Pulpería Ezequiel") &&       // sin puesto no se pierde
    cv2.formacion.length === 1 &&
    cv2.idiomas[0].nivel === 70 && cv2.idiomas[1].nivel === 85 &&          // B2 y C1
    /Primera línea<br>Segunda línea/.test(html);                            // los saltos del perfil salen
});

test("Guzzi manda al editor de CV en vez de hablar de carretilleros", async () => {
  const { execFileSync } = await import("node:child_process");
  const { unlinkSync } = await import("node:fs");
  const salida = "scripts/.tmp-editarcv.cjs";
  execFileSync("npx", ["esbuild", "lib/guzzi/intents.ts", "--bundle",
    "--format=cjs", "--platform=node", `--outfile=${salida}`, "--log-level=error"],
    { stdio: "pipe", shell: true });
  const { detectIntent } = await import(`../${salida}`);
  try { unlinkSync(salida); } catch {}
  const casos = [
    ["cambiar mi experiencia de carretillero", "editar_cv"],   // antes: buscar_cursos
    ["quiero cambiar el puesto de mi cv", "editar_cv"],        // antes: buscar
    ["quita el trabajo de carretillero del cv", "editar_cv"],
    ["¿puedo editar mi curriculum?", "editar_cv"],
    // Y lo que NO debe cambiar:
    ["quiero un curso de carretillero en Pamplona", "buscar_cursos"],
    ["busco trabajo de carretillero en Tudela", "buscar"],
    ["quiero cambiar de trabajo", "buscar"],
    ["mejorar mi cv", "cv_mejorado"],
  ];
  let bien = true;
  for (const [frase, esperado] of casos) {
    const r = detectIntent(frase);
    if (r !== esperado) { console.log(`      "${frase}" -> ${r} (se esperaba ${esperado})`); bien = false; }
  }
  // Y la respuesta no promete lo que no puede hacer.
  const chat = leerFuente("app/api/gusi/chat/route.ts");
  const bloque = chat.slice(chat.indexOf('preIntent === "editar_cv"'), chat.indexOf('preIntent === "editar_cv"') + 2600);
  return bien && bloque.includes("/app/curriculum") && /Yo no puedo escribir dentro de tu CV/.test(bloque) &&
    // y no suelta el mismo parrafo cada vez que se lo piden
    /yaLeDijimosDondeEs/.test(bloque);
});

test("mejorar el CV con IA escribe en el formulario y se puede deshacer", () => {
  const c = leerFuente("app/app/curriculum/Content.tsx");
  const fn = c.slice(c.indexOf("async function generarYMejorar"), c.indexOf("function deshacerMejora"));
  return /setFormAntesDeMejorar\(antes\)/.test(fn) && /setForm\(nuevo\)/.test(fn) &&
    // y si la IA falla, se dice; antes se tragaba el error y parecia que no hacia nada
    /setError\(/.test(fn) && !/catch \{ \/\* usa el perfil original/.test(fn) &&
    /if \(formAntesDeMejorar\) setForm\(formAntesDeMejorar\)/.test(c);
});

// ── EL CENTINELA RECORRE LA APP COMO UN USUARIO CADA MAÑANA ────────────────
//
// Los fallos de la semana (Mejorar que no cambiaba nada, el PDF del movil,
// Guzzi hablando de cursos, la bienvenida en 401) respondian 200 por separado:
// solo se veian haciendo el camino entero. El recorrido lo hace cada dia.
test("el centinela hace el recorrido de usuario cada dia", () => {
  const c = leerFuente("app/api/admin/centinela/route.ts");
  const rec = leerFuente("lib/centinela/recorrido.ts");
  const comprobaciones = (rec.match(/anota\("/g) || []).length;
  return /await recorridoDeUsuario\(anota\)/.test(c) &&
    // los seis caminos, cada uno con el fallo del que nace
    ["/api/cv/mejorar", "/api/cv/ats-score", "/api/gusi/chat", "/api/cv/pdf-template"].every((r) => rec.includes(r)) &&
    /LIKE '\{%'/.test(rec) && /bienvenida_en/.test(rec) && comprobaciones >= 6 &&
    // la cuenta de comprobacion no es de las que borra el kit de auditoria
    /delivered\+recorrido@resend\.dev/.test(rec);
});

// ── ELIMINAR LA CUENTA LO BORRA TODO (RGPD) ────────────────────────────────
//
// Borraba once tablas y dejaba las conversaciones con Guzzi, entrevistas,
// cursos, au pair, contactos... y las fotos, que estan en "avatars/<id>" y
// "au-pair/<id>/" (se borraba "<id>/avatar", que no existe) y son publicas.
test("eliminar la cuenta borra todas las tablas y las fotos de verdad", () => {
  const ruta = leerFuente("app/api/user/delete-account/route.ts");
  const lib = leerFuente("lib/cuenta/borrar-datos.ts");
  const rec = leerFuente("lib/centinela/recorrido.ts");
  const necesarias = ["gusi_conversations", "entrevistas", "usage_tracking", "curso_progreso", "au_pair_profiles",
    "user_contacts", "cv_cartas", "notificaciones", "user_cvs", "push_subscriptions"];
  return /await borrarDatosDeUsuario\(/.test(ruta) && !/pool\.query\("DELETE FROM/.test(ruta) &&
    necesarias.every((t) => lib.includes(`${t}:`)) &&
    /"avatars"/.test(lib) && /`au-pair\/\$\{userId\}`/.test(lib) &&
    // si algo falla no se borra la cuenta a medias
    /if \(fallos\.length\)/.test(ruta) &&
    // y el centinela avisa si aparece una tabla nueva sin borrar
    /borrar la cuenta conoce todas las tablas/.test(rec);
});

// ── NINGUNA OFERTA ENTRA INVISIBLE ─────────────────────────────────────────
//
// El 30 sep 2026 habia 290.707 ofertas con isActive vacio: el buscador solo
// ensena isActive = true, asi que nadie veia 70.732 de Suecia y 9.972 de
// Polonia. Venian de european-apis.ts, que insertaba sin isActive.
test("los insertores europeos guardan las ofertas activas y con pais", () => {
  const e = leerFuente("lib/job-search/european-apis.ts");
  const inserts = e.match(/INSERT INTO "JobListing" \([^)]*\)/g) || [];
  const mig = leerFuente("db/migrations/008_ofertas_visibles_por_defecto.sql");
  return inserts.length === 3 &&
    inserts.every((i) => i.includes('"isActive"') && i.includes('"scrapedAt"') && i.includes('"country"')) &&
    !/ON CONFLICT \("id"\) DO NOTHING/.test(e) &&
    /ALTER COLUMN "isActive" SET DEFAULT true/.test(mig);
});

// ── LAS OFERTAS NO ENSEÑAN "&euro;" ────────────────────────────────────────
//
// Careerjet manda el texto con entidades HTML y se guardaba tal cual: 68.425
// sueldos con "&euro;" y 30.499 con "&pound;" en ofertas vivas (30 sep 2026),
// y la pagina de /trabajar-en/es/camarero ensenaba "&euro;1450 - 1500 per month".
test("las ofertas se guardan sin entidades HTML y sin cambiar de id", async () => {
  const { execFileSync } = await import("node:child_process");
  const { unlinkSync } = await import("node:fs");
  const salida = "scripts/.tmp-entidades.cjs";
  execFileSync("npx", ["esbuild", "lib/job-search/entidades.ts", "--bundle",
    "--format=cjs", "--platform=node", `--outfile=${salida}`, "--log-level=error"],
    { stdio: "pipe", shell: true });
  const { sinEntidades } = await import(`../${salida}`);
  try { unlinkSync(salida); } catch {}
  const bien =
    sinEntidades("&euro;1450 - 1500 per month") === "€1450 - 1500 per month" &&
    sinEntidades("Johnson &amp; Johnson") === "Johnson & Johnson" &&
    sinEntidades("Cocinero/a &#8211; Tudela") === "Cocinero/a – Tudela" &&
    sinEntidades("&pound;25,000 a year") === "£25,000 a year" &&
    sinEntidades("R&D &raro;") === "R&D &raro;";           // lo desconocido se deja
  const w = leerFuente("lib/job-search/sync-worker.ts");
  return bien &&
    /const id = makeId\(j\.title, j\.company, j\.city, j\.source\)/.test(w) &&  // id con el texto original
    /sinEntidades\(j\.title\), sinEntidades\(j\.company\)/.test(w) &&
    /sinEntidades\(j\.salary\)/.test(w);
});

// ── LOS SUELDOS SE LEEN BIEN Y NO LOS MUEVE LA BASURA ──────────────────────
//
// El 30 sep 2026 "camarero" en Espana daba minimo 144 € y maximo 95 €: la
// expresion SQL del maximo solo dejaba las dos ultimas cifras. Y la media la
// subian a 30.481 € anuncios de "camarero de barra" a 72.000-90.000 €, cuando
// la mediana real era 20.500 €. "Negociar salario" daba ademas error 500 por
// buscar en la descripcion de 2,4 millones de ofertas.
test("los sueldos se interpretan bien y el resumen usa la mediana", async () => {
  const { execFileSync } = await import("node:child_process");
  const { unlinkSync } = await import("node:fs");
  const salida = "scripts/.tmp-salarios.cjs";
  execFileSync("npx", ["esbuild", "lib/salarios/anual.ts", "--bundle",
    "--format=cjs", "--platform=node", `--outfile=${salida}`, "--log-level=error"],
    { stdio: "pipe", shell: true });
  const { salarioAnualEuros, resumirSalarios } = await import(`../${salida}`);
  try { unlinkSync(salida); } catch {}
  const r = (t) => JSON.stringify(salarioAnualEuros(t));
  const bien =
    r("18.000 - 22.095 €") === JSON.stringify({ min: 18000, max: 22095 }) &&
    r("&euro;24000 per year") === JSON.stringify({ min: 24000, max: 24000 }) &&
    r("24,000 - 28,000") === JSON.stringify({ min: 24000, max: 28000 }) &&
    r("&euro;1802 per month") === "null" &&        // mensual: 12 o 14 pagas, no se adivina
    r("&euro;11.85 per hour") === "null" &&
    r("$45,000 per year") === "null";
  // Diez sueldos normales y tres absurdos: la mediana no se mueve.
  const textos = ["18000", "19000", "19500", "20000", "20500", "21000", "21500", "22000", "23000", "24000",
    "72000 - 90000", "72000 - 90000", "72000 - 90000"];
  const res = resumirSalarios(textos);
  const negociar = leerFuente("app/api/salarios/negociar/route.ts");
  const api = leerFuente("app/api/salarios/route.ts");
  return bien && res.tipico === 21500 && res.conSalario === 13 &&
    !/description ILIKE/.test(negociar) &&
    !api.includes("substring(salary from '.*(") &&
    // La lista de arriba: oficios comunes, no titulos exactos de una agencia.
    api.includes("OCUPACIONES_COMUNES.map") && !/GROUP BY ocupacion/.test(api);
});

// ── AVISAR ANTES DE MANDAR UN CV A UNA DIRECCION DEDUCIDA ──────────────────
//
// 1.050.269 ofertas tienen un correo deducido ("probable") y 25.956 uno
// verificado (30 sep 2026); 9 de 25 envios de septiembre rebotaron. Michel
// decidio que se avise antes de enviar. Cada pantalla que envia y puede usar
// una direccion deducida tiene que pasar por confirmarEnvioADireccion.
test("todas las pantallas que envian CV avisan si la direccion es deducida", async () => {
  const { execFileSync } = await import("node:child_process");
  const { unlinkSync } = await import("node:fs");
  const salida = "scripts/.tmp-confirmar.cjs";
  execFileSync("npx", ["esbuild", "lib/confirmar-direccion.ts", "--bundle",
    "--format=cjs", "--platform=node", `--outfile=${salida}`, "--log-level=error"],
    { stdio: "pipe", shell: true });
  const { esDireccionDeducida } = await import(`../${salida}`);
  try { unlinkSync(salida); } catch {}
  const reglas = esDireccionDeducida("media") && esDireccionDeducida("baja") &&
    esDireccionDeducida(undefined, true) && !esDireccionDeducida("alta") && !esDireccionDeducida(undefined);
  // AutoSendSetup queda fuera: ahi el correo lo escribe la persona.
  const sitios = ["components/JobCard.tsx", "app/app/ofertas/[id]/OfertaDetalleClient.tsx",
    "app/app/notificaciones/page.tsx", "components/ChatSendPanel.tsx", "app/app/empresas/page.tsx",
    "components/AuPairOfertasRecientes.tsx"];
  const sinAviso = sitios.filter((f) => !leerFuente(f).includes("confirmarEnvioADireccion({"));
  if (sinAviso.length) console.log("      sin aviso: " + sinAviso.join(", "));
  const guzzi = (leerFuente("components/GusiChat.tsx").match(/confirmarEnvioADireccion\(\{/g) || []).length;
  return reglas && sinAviso.length === 0 && guzzi >= 2;
});

// ── LAS ALERTAS SE QUITAN CON UN CLIC ──────────────────────────────────────
//
// Mandan un correo al dia, se crean solas al registrarse con ciudad y no habia
// forma de quitarlas: ni pantalla ni enlace (30 sep 2026).
test("las alertas llevan un enlace de baja firmado que funciona", async () => {
  const { execFileSync } = await import("node:child_process");
  const { unlinkSync } = await import("node:fs");
  const salida = "scripts/.tmp-baja.cjs";
  execFileSync("npx", ["esbuild", "lib/alertas/baja.ts", "--bundle",
    "--format=cjs", "--platform=node", `--outfile=${salida}`, "--log-level=error"],
    { stdio: "pipe", shell: true });
  process.env.ALERTS_SECRET = "secreto-de-prueba";
  const { firmaBaja, firmaBajaValida, enlaceBaja } = await import(`../${salida}`);
  try { unlinkSync(salida); } catch {}
  const f = firmaBaja("usuario-1");
  const firma = f && firmaBajaValida("usuario-1", f) && !firmaBajaValida("usuario-2", f) &&
    !firmaBajaValida("usuario-1", "inventada") && /\/api\/alertas\/baja\?u=usuario-1&t=/.test(enlaceBaja("usuario-1"));
  delete process.env.ALERTS_SECRET;
  const envio = leerFuente("app/api/push/send-alerts/route.ts");
  const correo = leerFuente("lib/email/smtp-sender.ts");
  const ruta = leerFuente("app/api/alertas/baja/route.ts");
  return firma && envio.includes("bajaUrl: enlaceBaja(alerta.user_id)") &&
    correo.includes("Dejar de recibir estas alertas") && correo.includes('"List-Unsubscribe-Post": "List-Unsubscribe=One-Click"') &&
    /UPDATE job_alerts SET active = false WHERE user_id = \$1/.test(ruta) && ruta.includes("export async function POST");
});

// El recordatorio del primer dia: 78 avisados, 0 primeros CV (23-29 sep 2026).
// Ahora lleva ofertas reales de su ciudad y el asunto con la cifra.
test("el recordatorio del primer dia lleva ofertas reales de su ciudad", () => {
  const ruta = leerFuente("app/api/onboarding/recordatorios/route.ts");
  const correo = leerFuente("lib/email/smtp-sender.ts");
  const primerDia = correo.slice(correo.indexOf("export async function sendPrimerDiaEmail"), correo.indexOf("export async function sendBienvenidaAtrasadaEmail"));
  return /ofertas: await ofertasRecientesEn\(ciudad\)/.test(ruta) &&
    primerDia.includes("plantillaSencilla(") && primerDia.includes("listaOfertas(") &&
    !primerDia.includes("headerGradient(");
});

// La gente escribe la ciudad como quiere: "Tudela navarra" no encontraba nada,
// "Portugal" encontraba Portugalete y "Santo domingo, republica dominicana"
// sin la coma encontraba Santo Domingo de la Calzada (30 sep 2026).
test("las ofertas del correo entienden como escribe la gente su ciudad", async () => {
  const { execFileSync } = await import("node:child_process");
  const { unlinkSync } = await import("node:fs");
  const salida = "scripts/.tmp-lugar.cjs";
  execFileSync("npx", ["esbuild", "lib/email/ofertas-para-correo.ts", "--bundle",
    "--format=cjs", "--platform=node", `--outfile=${salida}`, "--log-level=error"],
    { stdio: "pipe", shell: true });
  const { candidatos } = await import(`../${salida}`);
  try { unlinkSync(salida); } catch {}
  const src = leerFuente("lib/email/ofertas-para-correo.ts");
  const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  return igual(candidatos("Tudela navarra"), ["Tudela navarra", "Tudela"]) &&
    igual(candidatos("Logroño, La Rioja"), ["Logroño, La Rioja", "Logroño"]) &&
    igual(candidatos("Santo domingo, república dominicana"), ["Santo domingo, república dominicana"]) &&
    /LISTA_PAISES\.find/.test(src) && /LOWER\(country\) = \$1/.test(src);
});

// ── NUESTROS CORREOS NO INSISTEN EN DIRECCIONES QUE REBOTAN ────────────────
//
// Del 1 al 29 sep 2026 rebotaron 392 alertas (mas que las 218 que llegaron),
// todas a dos cuentas de prueba sin buzon. Eso hunde la entrega de todo lo que
// sale de noreply@, recordatorios y bienvenidas incluidos.
test("los correos propios no se mandan a direcciones que rebotan", () => {
  const s = leerFuente("lib/email/smtp-sender.ts");
  const w = leerFuente("app/api/cv-sender/entrega/route.ts");
  const cuerpo = (nombre) => s.slice(s.indexOf(`async function ${nombre}(`), s.indexOf(`async function ${nombre}(`) + 1000);
  return /if \(await direccionQueRebota\(to\)\) return;/.test(cuerpo("sendEmail")) &&
    /if \(await direccionQueRebota\(to\)\) return false;/.test(cuerpo("enviarCorreo")) &&
    /WHERE email = \$1 AND \(permanente OR veces >= 2\)/.test(s) &&
    /if \(rebote && destinatario\)[\s\S]{0,600}INSERT INTO correos_rebotados/.test(w);
});

// ── NO MANDAR CVs A DIRECCIONES QUE SE SABE QUE NO LLEGAN ──────────────────
//
// Del 1 al 29 sep 2026 rebotaron 9 de 25 envios (36 %): direcciones deducidas
// que no existian y una "ejemplo@domain.com" sacada de una plantilla. Todos
// nuestros correos salen por la misma cuenta de Resend, asi que cada rebote
// resta entrega a las bienvenidas y a las alertas.
test("los envios de CV se paran en direcciones de relleno o que ya rebotaron", async () => {
  const { execFileSync } = await import("node:child_process");
  const { unlinkSync } = await import("node:fs");
  const salida = "scripts/.tmp-direccion.cjs";
  execFileSync("npx", ["esbuild", "lib/cv-sender/direccion-segura.ts", "--bundle",
    "--format=cjs", "--platform=node", `--outfile=${salida}`, "--log-level=error"],
    { stdio: "pipe", shell: true });
  const { esDireccionDeRelleno } = await import(`../${salida}`);
  const casos = [
    ["ejemplo@domain.com", true], ["rrhh@domain.com", true], ["tu@example.com", true], ["tuemail@gmail.com", true],
    ["rrhh@mercadona.es", false], ["info@grupo-jorge.com", false], ["seleccion@user.es", false],
  ];
  let bien = true;
  for (const [email, esperado] of casos) {
    if (esDireccionDeRelleno(email) !== esperado) { console.log(`      ${email} -> ${!esperado}`); bien = false; }
  }
  try { unlinkSync(salida); } catch {}
  // Y las dos puertas por las que entra un envio lo comprueban.
  const send = leerFuente("app/api/cv-sender/send/route.ts");
  const ds = leerFuente("lib/cv-sender/direccion-segura.ts");
  return bien &&
    /const motivoNoEnviar = await motivoParaNoEnviar\(companyEmail\);\s*if \(motivoNoEnviar\)/.test(send) &&
    send.includes("if (await motivoParaNoEnviar(oferta.emailEmpresa)) continue;") &&
    /\.eq\("status", "rebotado"\)/.test(ds) && /hard bounce\|spam/.test(ds);
});

// Auditoria del 3 oct 2026: el correo que recibe la empresa sale de
// noreply@buscaycurra.es y pintaba como HTML el nombre de la empresa, el
// puesto, el nombre de la persona y la carta. Con una cuenta gratis se podian
// meter enlaces o imagenes propios desde la direccion oficial.
test("los correos de envio de CV escapan todo lo que escribe la persona", async () => {
  const { execFileSync } = await import("node:child_process");
  const { unlinkSync } = await import("node:fs");
  const salida = "scripts/.tmp-email-sender.cjs";
  try {
    execFileSync("npx", ["esbuild", "lib/cv-sender/email-sender.ts", "--bundle",
      "--format=cjs", "--platform=node", `--outfile=${salida}`, "--log-level=error"],
      { stdio: "pipe", shell: true });
    const { buildCVEmailHTML, buildConfirmationEmailHTML } = await import(`../${salida}`);
    const malo = (campo) => `${campo}<script>x()</script><a href="https://malo.example">pulsa</a><img src=x>`;
    const html = buildCVEmailHTML(
      { userName: malo("Ana"), userEmail: "ana@correo.es", userPhone: malo("600"), cvPdfBuffer: Buffer.from("") },
      `Hola\n${malo("linea")}`, malo("Empresa"), { sendId: "s1", userId: "u1" })
      + buildConfirmationEmailHTML(malo("Ana"), malo("Empresa"), malo("Chef"));
    const colados = html.match(/<script|<a href="https:\/\/malo|<img src=x/g) || [];
    if (colados.length) console.log(`     ↳ ${colados.length} etiqueta(s) sin escapar`);
    return colados.length === 0 && html.includes("&lt;script&gt;");
  } catch (e) {
    console.log(`     ↳ no se pudo probar: ${e.message?.slice(0, 80)}`);
    return false;
  } finally {
    try { unlinkSync(salida); } catch {}
  }
});

// Auditoria del 3 oct 2026: se podia mandar el mismo CV a la misma empresa al
// minuto, porque la espera de 15 dias no contaba "entregado" (el estado en que
// acaba casi todo envio). Ahora usa la misma lista que la cuota del plan. Y el
// envio desde Guzzi a un negocio se la saltaba entera.
test("la espera de 15 dias por empresa cuenta los mismos estados que la cuota", () => {
  const f = trackerSrc.match(/export async function canSendToCompany[\s\S]*?\r?\n}\r?\n/)?.[0] || "";
  const local = leerFuente("app/api/gusi/send-cv-local/route.ts");
  return f.includes('.in("status", ESTADOS_QUE_GASTAN_CUOTA)') && !/\.in\(\s*"status"\s*,\s*\[/.test(f)
    && local.includes("canSendToCompany(userId, companyEmail)") && local.includes("motivoParaNoEnviar(companyEmail)");
});

// Auditoria del 3 oct 2026: "He olvidado mi contraseña" lo mandaba Supabase en
// ingles ("Reset Your Password") y su enlace solo valia en el navegador donde se
// pidio: abierto desde Gmail en el movil decia "no es valido". De once personas
// que lo pidieron, cuatro no han entrado nunca. Ahora el correo es nuestro y el
// enlace lleva token_hash, que se verifica en cualquier navegador.
test("recuperar la contraseña: correo propio y enlace que vale en cualquier navegador", () => {
  const pagina = leerFuente("app/auth/recuperar/page.tsx");
  const api = leerFuente("app/api/auth/recuperar/route.ts");
  const nueva = leerFuente("app/auth/nueva-contrasena/page.tsx");
  const mw = leerFuente("middleware.ts");
  const correo = leerFuente("lib/email/smtp-sender.ts");
  const fallos = [];
  if (pagina.includes("resetPasswordForEmail") || !pagina.includes('"/api/auth/recuperar"')) fallos.push("la pagina no usa /api/auth/recuperar");
  if (!/generateLink\(\{ type: "recovery"/.test(api) || !api.includes("token_hash=")) fallos.push("el endpoint no genera el enlace con token_hash");
  // Haya cuenta o no, la misma respuesta: si no, sirve para saber quien esta registrado.
  if (!/if \(error \|\| !tokenHash\) \{[\s\S]{0,400}return NextResponse\.json\(\{ ok: true \}\);/.test(api)) fallos.push("sin cuenta no contesta igual que con cuenta");
  if (!api.includes('checkUserRateLimit("recuperar-1min"') || !api.includes('checkUserRateLimit("recuperar-ip"')) fallos.push("sin topes contra el abuso");
  if (!/verifyOtp\(\{ token_hash: tokenHash, type: "recovery" \}\)/.test(nueva)) fallos.push("nueva-contrasena no verifica el token_hash");
  if (!mw.includes('pathname !== "/auth/nueva-contrasena"')) fallos.push("con sesion abierta, el middleware saca de nueva-contrasena");
  if (!correo.includes('"Cambia tu contraseña de BuscayCurra"')) fallos.push("el correo no esta en español");
  fallos.forEach((f) => console.log(`     ↳ ${f}`));
  return fallos.length === 0;
});

// Auditoria del 3 oct 2026, ofertas guardadas: la ficha decia "Guardada" tres
// segundos y volvia a "Guardar", no habia forma de quitar una (y el aviso del
// tope del plan decia "borra alguna"), y las guardadas que ya no existen
// contaban para el tope sin verse.
test("las ofertas guardadas se pueden quitar y la ficha recuerda si lo estan", () => {
  const ficha = leerFuente("app/app/ofertas/[id]/OfertaDetalleClient.tsx");
  const lista = leerFuente("app/app/guardados/Content.tsx");
  const fallos = [];
  if (/setTimeout\(\(\) => setGuardado\(false\)/.test(ficha)) fallos.push("la ficha vuelve sola a 'Guardar'");
  if (!ficha.includes('action: quitar ? "unsave" : "save"')) fallos.push("el boton de la ficha no quita");
  if (!/setGuardado\(!!data\.guardados\?\.some/.test(ficha)) fallos.push("la ficha no mira si ya esta guardada");
  if (!lista.includes('action: "unsave"') || !lista.includes("Quitar de guardadas")) fallos.push("guardados no tiene boton de quitar");
  if (!lista.includes("jobData.notFound")) fallos.push("las guardadas que ya no existen no se avisan");
  fallos.forEach((f) => console.log(`     ↳ ${f}`));
  return fallos.length === 0;
});

// Auditoria del 3 oct 2026, buscador: empresa y descripcion en minusculas en
// todas las tarjetas; sin resultados devolvia 50 ofertas de cualquier cosa de
// las APIs externas (y tardaba hasta 25 s); y "jornada parcial" o "remoto"
// devolvian lo mismo que sin filtro porque el respaldo por ciudad lo ignoraba.
test("el buscador no inventa resultados ni se salta los filtros", () => {
  const s = leerFuente("app/api/jobs/search/route.ts");
  const fallos = [];
  if (/const company = \([^;]*\)\.toLowerCase\(\)/.test(s) || !s.includes("empresa: empresaOriginal")) fallos.push("la empresa sale en minusculas");
  if (/descripcion: description\.slice/.test(s)) fallos.push("la descripcion sale en minusculas");
  if (/await buscarOfertasReales\(keyword, location, 50\);\s*return NextResponse/.test(s)) fallos.push("las ofertas externas no se filtran por puesto");
  if (!/tituloCoincide\(o\.titulo/.test(s) || !/setTimeout\(\(\) => ok\(\[\]\), 8000\)/.test(s)) fallos.push("sin filtro por titulo o sin tope de tiempo");
  if (!/!categoria && !jornada && !experiencia\)/.test(s)) fallos.push("el respaldo por ciudad se salta la jornada");
  fallos.forEach((f) => console.log(`     ↳ ${f}`));
  return fallos.length === 0;
});

// Auditoria del 3 oct 2026: casi todas las ofertas de Adzuna con mas de una
// semana ya no existian en origen (404/410) y seguian activas: se podia gastar
// un envio en un puesto cerrado. La ficha lo comprueba al abrirse y el buscador
// en segundo plano; solo un 404/410 claro retira una oferta.
test("las ofertas retiradas en origen se avisan y no gastan envios", () => {
  const viva = leerFuente("lib/job-search/oferta-viva.ts");
  const ficha = leerFuente("app/app/ofertas/[id]/OfertaDetalleClient.tsx");
  const busca = leerFuente("app/api/jobs/search/route.ts");
  const fallos = [];
  if (!/res\.status === 404 \|\| res\.status === 410 \? false/.test(viva)) fallos.push("no distingue 404/410");
  if (!viva.includes(`UPDATE "JobListing" SET "isActive" = false`)) fallos.push("no retira la oferta");
  if (!ficha.includes("/api/jobs/comprobar?id=") || !ficha.includes("disabled={enviando || !cvListo || retirada}")) fallos.push("la ficha no avisa o deja enviar");
  if ((busca.match(/comprobarEnSegundoPlano\(/g) || []).length < 2) fallos.push("el buscador no comprueba lo que enseña");
  fallos.forEach((f) => console.log(`     ↳ ${f}`));
  return fallos.length === 0;
});

// Auditoria del 3 oct 2026: EURES guardaba el codigo del pais como ciudad y las
// tarjetas decian "FR" o "NO" (371.622 ofertas).
test("las ofertas de EURES guardan el nombre del pais, no el codigo", () => {
  const s = leerFuente("app/api/jobs/sync-eures/route.ts");
  return !/city: paisDe\(jv\)\.toUpperCase\(\)/.test(s) && s.includes('new Intl.DisplayNames(["es"], { type: "region" })')
    && s.includes("city: ciudadDe(jv)");
});

// Auditoria del 3 oct 2026: a una camarera que pedia un puesto de mecanico la
// carta le inventaba "cambios de aceite al coche familiar". Probado contra la
// IA: con la regla, 0 de 3 cartas inventan; sin ella, 3 de 3. La carta sale a
// nombre de la persona y le pueden preguntar por ello en la entrevista.
test("la carta de los envios prohibe inventar experiencia y datos de contacto", () => {
  const p = leerFuente("lib/cv-sender/cv-personalizer.ts");
  return p.includes("NO INVENTES NADA") && p.includes("NO le inventes relación con el oficio")
    && p.includes("Firma SOLO con el nombre");
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

// ── PLAZAS REALES DE CURSOS (8 oct 2026) ──────────────────────────────
//
// Cinco fuentes de datos abiertos, cada una con sus manías, y las cinco se
// rompieron de alguna forma al probarlas con los datos de verdad:
//   · Lanbide y el SOC van en Windows-1252: leídos como UTF-8, "Formación"
//     sale "Formaci�n" y "ESTÈTIQUES" sale "EST�TIQUES".
//   · El SOC da las fechas mes/día/año ("06/29/2026").
//   · El SOC repite cursos y el Consorci repite grupos con otra fecha: sin
//     quitar repetidos, el upsert falla por meter el mismo id dos veces.
//   · Navarra marca "para desempleados" con 1/0, no con Sí/No.
// Y lo que se enseña tiene que ser verdad: "competencias digitales DOCENTES"
// no es una plaza para quien busca su primer trabajo de oficina, y la salida
// hacia los cursos de pago no puede ser una redirección abierta.
// Se compila el código de verdad y se le pasan datos como los reales.
test("las plazas de cursos se leen bien de las seis fuentes", async () => {
  const { execFileSync } = await import("node:child_process");
  const { unlinkSync, writeFileSync } = await import("node:fs");
  const entrada = ".sello-plazas-entrada.ts";
  const salida = ".sello-plazas.cjs";
  try {
    writeFileSync(entrada, [
      'export * from "./lib/cursos/plazas/fuentes";',
      'export * from "./lib/cursos/plazas/emparejar";',
      'export * from "./lib/cursos/afiliados";',
      'export { provinciaEnTexto, fichaEnTexto } from "./lib/guzzi/plazas-cursos";',
    ].join("\n"));
    execFileSync("npx", ["esbuild", entrada, "--bundle", "--format=cjs", "--platform=node",
      "--external:pg", `--outfile=${salida}`, "--log-level=error"], { stdio: "pipe", shell: true });
    const m = await import(`../${salida}`);
    const fallos = [];
    const comprueba = (nombre, ok) => { if (!ok) fallos.push(nombre); };

    // Windows-1252: "Formación" con ó = 0xF3, que no es UTF-8 válido.
    const bytes = Uint8Array.from([...Buffer.from("nombre([{\"codigo\":\"1\",\"titulo\":\"Formaci", "latin1"), 0xF3,
      ...Buffer.from("n (SSCE01 - Especialidad completa)\",\"municipio\":\"BILBAO\",\"f_inicio\":\"22/01/2027\",\"f_fin\":\"26/04/2027\",\"horas\":\"150\",\"codprov\":\"48\",\"modalidad\":\"1\",\"url\":\"https://web.lanbide.eus/x\"}])", "latin1")]);
    const lan = m.leerLanbide(m.decodificar(bytes))[0];
    comprueba("Lanbide en Windows-1252", lan?.titulo.startsWith("Formación") && lan.inicio === "2027-01-22" && lan.provincia === "48" && lan.modalidad === "presencial");

    // SOC: mes/día/año y repetidos.
    const soc = m.sinRepetidos(m.leerSoc(JSON.stringify([
      { curs: "9", tipus: "Formació ocupacional", especialitat_formativa: "CONDUCCIÓ DE CARRETONS ELEVADORS", provincia_especialitat: "TARRAGONA", modalitat: "PRESENCIAL", data_inici: "06/29/2026", data_fi: "10/30/2026", hores: "60", web_centre: "info@centre.cat" },
      { curs: "9", tipus: "Formació ocupacional", especialitat_formativa: "Conducció de carretons elevadors", provincia_especialitat: "TARRAGONA", modalitat: "PRESENCIAL", data_inici: "06/29/2026", data_fi: "10/30/2026", hores: "60" },
    ])));
    comprueba("SOC mes/día/año, sin repetidos y correo fuera del campo web", soc.length === 1 && soc[0].inicio === "2026-06-29" && soc[0].provincia === "43" && soc[0].dirigido === "desempleados" && soc[0].email === "info@centre.cat" && soc[0].web === null);
    comprueba("una fecha imposible no se convierte en otra", m.fecha("31/02/2026", "dma") === null && m.fecha("13/45/2026", "mda") === null);

    // Consorci: CSV con comas dentro de comillas; mismo grupo con otra fecha = otra plaza.
    const csv = '"IDENTIFICADOR","NUM_GRUP","DENOMINACIO","MODALITAT","HORES","DATA_INICI","DATA_FINAL","CODI_MUNICIPI","NOM_MUNICIPI","WEB","EMAIL","TELÈFON"\n'
      + '"295782","9","Personal de control d\'accessos, nivell 1","Presencial","60","13/10/2026","03/11/2026","43155","TORTOSA","www.idfo.com","a@idfo.com","932689292"\n'
      + '"295782","9","Personal de control d\'accessos, nivell 1","Presencial","60","05/10/2026","27/10/2026","43155","TORTOSA","www.idfo.com","a@idfo.com","932689292"\n';
    const con = m.sinRepetidos(m.leerConsorci(csv));
    comprueba("Consorci: comas dentro de comillas y dos fechas = dos plazas", con.length === 2 && con[0].titulo.includes("nivell 1") && con[0].provincia === "43" && con[0].dirigido === "ocupados" && con[0].web === "https://www.idfo.com");

    // Navarra: 1/0.
    const nav = m.leerNavarra('_id,CODIGO,TITULO DEL CURSO,FECHA DE INICIO,FECHA DE FIN,DESEMPLEADOS,OCUPADOS,DESCRIPCION MODALIDAD\n1,16128,Conducción de Carretillas Elevadoras,09/11/2026,11/11/2026,1,0,Presencial\n');
    comprueba("Navarra con 1/0", nav[0]?.dirigido === "desempleados" && nav[0].provincia === "31");

    // Castilla y León: tildes rotas desde el origen, fecha solo en texto, enlace
    // a un servidor interno, y prácticas en empresas que no son cursos.
    const ecyl = m.leerEcyl(JSON.stringify([
      { identificador: "1", titulo: "FIRMA Y FACTURACIÃ\u0093N ELECTRÃ\u0093NICA", codigo_localidad: 9, localidad_: "Burgos",
        tipo_formacion: "TeleformaciÃ³n", fecha_de_inicio: null, fechas_de_desarrollo: "desde el 28 de octubre de 2026 (previsto) hasta el 20 de noviembre de 2026",
        duracion: "20 horas", colectivo_destinatario: ["Ocupado", "Desempleado"], lugar_de_celebracion: "ASOCIACION X, CL/ SAGRADA FAMILIA, 31, 09006 - BURGOS(BURGOS), Tfno: 664384569",
        enlace_al_contenido: "https://gestorcontenidos.jcyl.es/web/jcyl/Empleo/es/Plantilla100Detalle/1/Formacion/1/Propuesta" },
      { identificador: "2", titulo: "PNL A POC A POC. LOGOPEDIA", fecha_de_inicio: "2026-11-01" },
    ]));
    comprueba("Castilla y León: tildes, fecha en texto, enlace público y sin prácticas", ecyl.length === 1
      && ecyl[0].titulo === "Firma y facturación electrónica" && ecyl[0].inicio === "2026-10-28" && ecyl[0].fin === "2026-11-20"
      && ecyl[0].provincia === "09" && ecyl[0].modalidad === "online" && ecyl[0].dirigido === "todos" && ecyl[0].telefono === "664384569"
      && ecyl[0].url.startsWith("https://empleo.jcyl.es/"));

    // Emparejar con las fichas: castellano, catalán y exclusiones.
    comprueba("carretillas y carretons van a carretillero", m.fichasDePlaza("CONDUCCIÓN DE CARRETILLAS ELEVADORAS").includes("carretillero") && m.fichasDePlaza("Conducció de carretons elevadors").includes("carretillero"));
    comprueba("los cursos para profesores no van a competencias digitales", m.fichasDePlaza("COMPETENCIAS DIGITALES DOCENTES (SSCE17)").length === 0 && m.fichasDePlaza("Competencias digitales básicas").includes("competencias-digitales"));

    // Afiliados: nada de redirección abierta, y la comisión solo si hay plantilla.
    comprueba("la salida a cursos de pago solo va a sus dominios", m.destinoPermitido("coursera", "https://www.coursera.org/search?query=excel")
      && !m.destinoPermitido("coursera", "https://coursera.org.evil.com/") && !m.destinoPermitido("coursera", "http://www.coursera.org/")
      && !m.destinoPermitido("coursera", "https://evil.com/?u=coursera.org"));
    const sinCodigo = m.destinoFinal("coursera", "https://www.coursera.org/x", {});
    const conCodigo = m.destinoFinal("coursera", "https://www.coursera.org/x?a=1", { AFILIADO_COURSERA_PLANTILLA: "https://imp.i1.net/c/1/2/3?u={url}" });
    comprueba("el código de afiliado solo se pone si está configurado", !sinCodigo.conComision && sinCodigo.url === "https://www.coursera.org/x"
      && conCodigo.conComision && conCodigo.url === "https://imp.i1.net/c/1/2/3?u=" + encodeURIComponent("https://www.coursera.org/x?a=1"));

    // Guzzi: curso y provincia salen del mensaje.
    comprueba("Guzzi reconoce curso y provincia", m.fichaEnTexto("busco un curso de carretillero en Bilbao") === "carretillero"
      && m.provinciaEnTexto("busco un curso de carretillero en Bilbao") === "48" && m.provinciaEnTexto("curso de inglés en Molina de Segura") === "30");

    for (const f of fallos) console.log(`     ↳ falla: ${f}`);
    return fallos.length === 0;
  } catch (e) {
    console.log(`     ↳ no se pudo compilar o ejecutar: ${e.message?.slice(0, 120)}`);
    return false;
  } finally {
    for (const f of [entrada, salida]) { try { unlinkSync(f); } catch { /* da igual */ } }
  }
});

test("las plazas y el aviso de pago están en la ficha, y Guzzi y el centinela las usan", () => {
  const ficha = leerFuente("components/cursos/DetalleCurso.tsx");
  const chat = leerFuente("app/api/gusi/chat/route.ts");
  const centinela = leerFuente("app/api/admin/centinela/route.ts");
  const db = leerFuente("lib/cursos/plazas/db.ts");
  const sync = leerFuente("app/api/cursos/plazas/sync/route.ts");
  return ficha.includes("<PlazasCurso")
    && ficha.includes('rel="sponsored')
    && ficha.includes("puede recibir una comisión")
    && /preIntent === "buscar_cursos"[\s\S]{0,300}respuestaPlazasCurso/.test(chat)
    && centinela.includes("las plazas de cursos se actualizan cada día")
    // Una fuente caída no borra sus plazas: solo se borra lo que una fuente
    // que acaba de responder bien ya no trae.
    && db.includes("DELETE FROM curso_plaza WHERE fuente = $1 AND visto_en < $2")
    && /descargarFuente\(fuente\)[\s\S]{0,200}guardarFuente\(/.test(sync);
});

// La sincronización de plazas se puso primero en un workflow de GitHub, que en
// esta rama no se ejecuta nunca (scripts/vps/README.md). Tiene que estar en el
// crontab del servidor, activa (no comentada) y llamando al script versionado.
// La verificación de la web en Impact (afiliados de Coursera). Si alguien la
// quita "porque no se usa", Impact deja de reconocer la web y las comisiones
// pueden quedarse sin atribuir.
test("la portada lleva la verificación de Impact (afiliados de Coursera)", () =>
  /name="impact-site-verification"[\s\S]{0,200}value: "5475f2f2-412b-4825-a15f-84781f036795"/.test(leerFuente("app/layout.tsx")));

// ── AGENCIAS DE AU PAIR: REGISTROS OFICIALES (8 oct 2026) ─────────────
//
// La lista de agencias sale de los portales de ofertas, sin comprobar. El
// registro del IND neerlandés es una lista cerrada: la marca "registro
// oficial" solo puede salir con el nombre completo, nunca por parecerse
// ("Au Pair" a secas casaría con media lista).
test("las agencias de au pair se marcan como oficiales solo si están en el registro, por nombre completo", async () => {
  const { execFileSync } = await import("node:child_process");
  const { unlinkSync, writeFileSync } = await import("node:fs");
  const entrada = ".sello-aupair-entrada.ts", salida = ".sello-aupair.cjs";
  try {
    writeFileSync(entrada, 'export { agenciaEnRegistro, REGISTROS_AU_PAIR } from "./lib/au-pair/registros-oficiales";\n');
    execFileSync("npx", ["esbuild", entrada, "--bundle", "--format=cjs", "--platform=node", `--outfile=${salida}`, "--log-level=error"], { stdio: "pipe", shell: true });
    const m = await import(`../${salida}`);
    const casos = [
      [m.agenciaEnRegistro("Au Pair International B.V.", "NL"), true],
      [m.agenciaEnRegistro("Au Pair International", "nl"), true],
      [m.agenciaEnRegistro("Au Pair", "NL"), false],
      [m.agenciaEnRegistro("Agencia Falsa Au Pair B.V.", "NL"), false],
      [m.agenciaEnRegistro("Au Pair International B.V.", "DE"), null],
    ];
    const malos = casos.filter(([r, esperado]) => r !== esperado);
    const ruta = leerFuente("app/api/au-pair/agencias/route.ts");
    const pantalla = leerFuente("app/app/au-pair/page.tsx");
    return malos.length === 0 && m.REGISTROS_AU_PAIR.every(r => /^https:\/\//.test(r.url) && r.queSignifica.length > 40)
      && ruta.includes("registroOficial: r.country ? agenciaEnRegistro(r.company, r.country) : null")
      && pantalla.includes("¿Es de fiar esta agencia?");
  } catch (e) {
    console.log(`     ↳ no se pudo compilar: ${e.message?.slice(0, 100)}`);
    return false;
  } finally {
    for (const f of [entrada, salida]) { try { unlinkSync(f); } catch { /* da igual */ } }
  }
});

// ── CURSOS DE IDIOMA PARA QUIEN LLEGA (8 oct 2026) ────────────────────
//
// Casi nunca es igual para todos, y la diferencia suele ser ser de la UE o no.
// Cada ficha tiene que decir qué pasa si eres de la UE y salir de una página
// oficial; y los casos que más se confunden (Noruega, Francia, Alemania) no
// pueden aparecer como "gratis".
test("cada curso de idioma para inmigrantes dice qué pasa si eres de la UE y tiene fuente", async () => {
  const { execFileSync } = await import("node:child_process");
  const { unlinkSync, writeFileSync } = await import("node:fs");
  const entrada = ".sello-idioma-entrada.ts", salida = ".sello-idioma.cjs";
  try {
    writeFileSync(entrada, 'export { CURSOS_IDIOMA } from "./lib/cursos/idioma-inmigrantes";\n');
    execFileSync("npx", ["esbuild", entrada, "--bundle", "--format=cjs", "--platform=node", `--outfile=${salida}`, "--log-level=error"], { stdio: "pipe", shell: true });
    const { CURSOS_IDIOMA } = await import(`../${salida}`);
    const malas = CURSOS_IDIOMA.filter(c => !c.siEresDeLaUE || c.siEresDeLaUE.length < 40 || !/^https:\/\//.test(c.url) || !c.fuentes?.length).map(c => c.pais);
    const porPais = Object.fromEntries(CURSOS_IDIOMA.map(c => [c.pais, c]));
    const trampas = porPais.NO?.gratis === "no" && porPais.DE?.gratis !== "si" && /no es para ciudadanos de la UE/i.test(porPais.FR?.siEresDeLaUE ?? "");
    if (malas.length) console.log("     ↳ fichas incompletas: " + malas.join(", "));
    const lista = leerFuente("components/cursos/ListaCursos.tsx");
    return CURSOS_IDIOMA.length >= 13 && malas.length === 0 && trampas && lista.includes("cursoIdiomaDe(p.codigo)");
  } catch (e) {
    console.log(`     ↳ no se pudo compilar: ${e.message?.slice(0, 100)}`);
    return false;
  } finally {
    for (const f of [entrada, salida]) { try { unlinkSync(f); } catch { /* da igual */ } }
  }
});

// ── EL CV EN EL IDIOMA DEL PAÍS (8 oct 2026) ──────────────────────────
//
// Para quien se va fuera faltaba lo más útil: el CV en inglés, alemán,
// francés… Tres cosas que no pueden romperse: las diez plantillas tienen que
// salir enteras en el otro idioma (y idénticas en español); a la IA no se le
// manda ni nombre, ni teléfono, ni correo, ni empresas; y si la IA inventa un
// puesto, no llega al CV que se descarga.
test("el CV se traduce entero, sin mandar datos personales a la IA y sin aceptar inventos", async () => {
  const { execFileSync } = await import("node:child_process");
  const { unlinkSync, writeFileSync } = await import("node:fs");
  const entrada = ".sello-cv-idioma-entrada.ts", salida = ".sello-cv-idioma.cjs";
  try {
    writeFileSync(entrada, 'export { generarCV, TEMPLATE_IDS } from "./lib/cv-generator/plantillas";\nexport { promptTraduccion, aplicarTraduccion } from "./lib/cv-generator/traducir";\n');
    execFileSync("npx", ["esbuild", entrada, "--bundle", "--format=cjs", "--platform=node", `--outfile=${salida}`, "--log-level=error"], { stdio: "pipe", shell: true });
    const m = await import(`../${salida}`);
    const cv = { nombre: "Ana", email: "ana@correo.test", telefono: "600111222", ciudad: "Tudela", subtitulo: "Camarera", perfilProfesional: "Camarera con experiencia.",
      aptitudes: ["Atención"], idiomas: [{ nombre: "Español", nivel: 100 }, { nombre: "Inglés", nivel: 70 }],
      experiencia: [{ fechas: "2020 - Actualidad", puesto: "Camarera", empresa: "Bar Sol", descripcion: ["Servir mesas"] }], formacion: [{ titulo: "Hostelería", centro: "IES Sol" }] };
    const restos = /(>\s*(Experiencia laboral|Experiencia Laboral|Experiencia|Formación|Aptitudes|Habilidades|Idiomas|Contacto|Sobre mí|Mi perfil|Perfil profesional|Perfil)\s*<)|\b(Nativo|Avanzado|Intermedio|Nociones)\b|Básico|lang="es"/;
    const malasEn = m.TEMPLATE_IDS.filter(id => restos.test(m.generarCV({ ...cv, templateId: id, idioma: "en" })));
    const cambianEs = m.TEMPLATE_IDS.filter(id => m.generarCV({ ...cv, templateId: id }) !== m.generarCV({ ...cv, templateId: id, idioma: "es" }));
    const p = m.promptTraduccion(cv, "en");
    const privado = !/ana@correo\.test|600111222|Tudela|Bar Sol|IES Sol|"Ana"/.test(p);
    const inventa = m.aplicarTraduccion(cv, JSON.stringify({ experiencia: [{ puesto: "Waitress", fechas: "2020", descripcion: ["x"] }, { puesto: "CEO", fechas: "2010", descripcion: [] }] }), "en");
    const sinInventos = inventa && inventa.cv.experiencia.length === 1 && inventa.cv.experiencia[0].empresa === "Bar Sol" && inventa.cv.email === "ana@correo.test";
    const basura = m.aplicarTraduccion(cv, "Lo siento, no puedo ayudar con eso", "en") === null;
    if (malasEn.length) console.log("     ↳ plantillas con restos en español: " + malasEn.join(", "));
    if (cambianEs.length) console.log("     ↳ plantillas que cambian en español: " + cambianEs.join(", "));
    if (!privado) console.log("     ↳ el prompt lleva datos personales");
    const pantalla = leerFuente("app/app/curriculum/Content.tsx");
    // \r?: Content.tsx tiene saltos de línea de Windows (CRLF).
    const fnTraducir = (pantalla.match(/async function traducirCV\(\)[\s\S]*?\r?\n  \}\r?\n/) || [""])[0];
    const pantallaBien = pantalla.includes("traducidoHTML || mejoradoHTML || livePreviewHTML") && fnTraducir.includes("/api/cv/traducir") && !fnTraducir.includes("setForm(");
    const router = leerFuente("lib/ai/ai-router.ts");
    const margen = /tarea === "traducir-cv"[\s\S]{0,300}maxTokens: (\d+)/.exec(router);
    return malasEn.length === 0 && cambianEs.length === 0 && privado && sinInventos && basura && pantallaBien && margen && Number(margen[1]) >= 4000;
  } catch (e) {
    console.log(`     ↳ no se pudo compilar o ejecutar: ${e.message?.slice(0, 100)}`);
    return false;
  } finally {
    for (const f of [entrada, salida]) { try { unlinkSync(f); } catch { /* da igual */ } }
  }
});

// ── OFERTAS DE LOS SERVICIOS PÚBLICOS DE EMPLEO (8 oct 2026) ──────────
//
// España tenía 65.124 ofertas de 2,8 millones, el 70 % de Adzuna y ninguna de
// los servicios públicos. Lanbide y el SEF de Murcia publican las suyas. Dos
// trampas que hay que cerrar: con una empresa inventada ("vía Lanbide") el
// proceso que deduce correos acabaría mandando CVs a Lanbide; y el correo que
// trae Murcia es de una oficina del SEF, solo para quien está inscrito fuera y
// con el DNI en el asunto: no puede ir al envío automático.
test("las ofertas públicas entran sin empresa inventada ni correo, y solo se retiran si la fuente respondió", async () => {
  const { execFileSync } = await import("node:child_process");
  const { unlinkSync, writeFileSync } = await import("node:fs");
  const entrada = ".sello-ofertas-entrada.ts", salida = ".sello-ofertas.cjs";
  try {
    writeFileSync(entrada, 'export { leerLanbide, leerSefMurcia } from "./lib/job-search/ofertas-publicas";\n');
    execFileSync("npx", ["esbuild", entrada, "--bundle", "--format=cjs", "--platform=node", "--external:pg", `--outfile=${salida}`, "--log-level=error"], { stdio: "pipe", shell: true });
    const m = await import(`../${salida}`);
    const lan = m.leerLanbide('cb([{"codigo":"1","desEmpleo":"CAMARERO/A","desPuesto":"Servicio en sala","pais":"ESPAÑA","provincia":"BIZKAIA","municipio":"BILBAO","fecPub":"08/10/2026","url":"https://web.lanbide.eus/x"}])');
    const mur = m.leerSefMurcia(JSON.stringify([{ numeroOferta: "9", fechaDeInicio: "08/10/2026", fechaDeFin: "13/10/2026", municipio: { municipio: "LORCA", provincia: { provincia: "MURCIA" } },
      descripcion: "ADMINISTRATIVO/A", adicionales: "Envíe su CV a oficina@sefcarm.es<BR/>- Atención al público", urlDetalles: "https://sefoficinavirtual.carm.es/x" }]));
    const lectores = lan[0]?.titulo === "Camarero/a" && lan[0].ciudad === "Bilbao" && lan[0].provincia === "Bizkaia"
      && mur[0]?.caduca?.toISOString() === "2026-10-13T23:59:00.000Z" && !("contactEmail" in mur[0]) && mur[0].descripcion.includes("\n- Atención");
    const src = leerFuente("lib/job-search/ofertas-publicas.ts");
    const insert = (src.match(/INSERT INTO "JobListing"[\s\S]*?RETURNING/) || [""])[0];
    const sinEmpresaNiCorreo = /VALUES \(\$1, \$2, '',/.test(insert) && !insert.includes("contactEmail");
    const retiradaSegura = /if \(ofertas\.length < FUENTES\[fuente\]\.minimo\)[\s\S]{0,200}retiradaOmitida: true/.test(src);
    const emails = leerFuente("scripts/vps/extract-emails-fast.sh");
    const cron = /^[^#].*sync-ofertas-publicas\.sh/m.test(leerFuente("scripts/vps/crontab.txt"));
    if (!lectores) console.log("     ↳ los lectores no dan lo esperado");
    if (!sinEmpresaNiCorreo) console.log("     ↳ el INSERT pone empresa o correo");
    return lectores && sinEmpresaNiCorreo && retiradaSegura && emails.includes("company != ''") && cron;
  } catch (e) {
    console.log(`     ↳ no se pudo compilar o ejecutar: ${e.message?.slice(0, 100)}`);
    return false;
  } finally {
    for (const f of [entrada, salida]) { try { unlinkSync(f); } catch { /* da igual */ } }
  }
});

// Los servicios de empleo de los otros países estaban escritos pero no salían
// en ninguna página (la de cursos solo enseñaba el de España), el de Reino
// Unido llevaba "GB" cuando la app usa "UK", y a 19 de los 26 países no les
// correspondía ninguno. Ahora hay uno por país y se elige en /cursos.
test("cada país de la app tiene su servicio oficial de formación y se puede elegir en /cursos", async () => {
  const { execFileSync } = await import("node:child_process");
  const { unlinkSync, writeFileSync } = await import("node:fs");
  const entrada = ".sello-servicios-entrada.ts", salida = ".sello-servicios.cjs";
  try {
    writeFileSync(entrada, 'export { LISTA_PAISES } from "./lib/paises";\nexport { servicioEmpleoDe } from "./lib/cursos/plataformas";\n');
    execFileSync("npx", ["esbuild", entrada, "--bundle", "--format=cjs", "--platform=node", `--outfile=${salida}`, "--log-level=error"], { stdio: "pipe", shell: true });
    const m = await import(`../${salida}`);
    const sin = m.LISTA_PAISES.filter(p => !m.servicioEmpleoDe(p.codigo)).map(p => p.codigo);
    if (sin.length) console.log("     ↳ sin servicio: " + sin.join(", "));
    const lista = leerFuente("components/cursos/ListaCursos.tsx");
    return sin.length === 0 && m.LISTA_PAISES.length >= 26 && lista.includes("<FormacionPorPais");
  } catch (e) {
    console.log(`     ↳ no se pudo compilar: ${e.message?.slice(0, 100)}`);
    return false;
  } finally {
    for (const f of [entrada, salida]) { try { unlinkSync(f); } catch { /* da igual */ } }
  }
});

// De 32 personas con alerta, 23 no tenían oficio en ningún sitio: el correo
// no podía decirles qué curso les piden. Se pregunta al registrarse y llega
// hasta el correo de ofertas.
test("el oficio del registro se guarda y lo usa el correo de ofertas", () => {
  const registro = leerFuente("app/auth/registro/page.tsx");
  const bienvenida = leerFuente("lib/onboarding/dar-bienvenida.ts");
  const alertas = leerFuente("app/api/push/send-alerts/route.ts");
  return /data: \{[\s\S]{0,200}oficio:/.test(registro) && registro.includes('htmlFor="oficio"')
    && bienvenida.includes("meta.oficio") && bienvenida.includes("COALESCE(NULLIF($4, ''), user_contacts.oficio)")
    && /asegurarColumnaOficio\(pool\)[\s\S]{0,600}SELECT user_id, email, whatsapp_phone, whatsapp_alertas, full_name, oficio/.test(alertas)
    && alertas.includes("contact?.oficio?.trim()");
});

// ── LA WEB VUELVE SOLA Y, SI NO, ALGUIEN SE ENTERA (8 oct 2026) ───────
//
// El servidor se reinició por una actualización del núcleo y el contenedor de
// la app no volvió (sin política de reinicio): 7 horas de "Bad Gateway" sin que
// nadie lo supiera, porque el centinela vive dentro de la propia app.
test("la app vuelve sola tras un reinicio y un vigilante externo avisa si cae", () => {
  const deploy = leerFuente("build-deploy.sh");
  const vig = leerFuente("scripts/vps/vigilante-app.sh");
  const run = (deploy.match(/docker run -d --name buscaycurra-nextjs[\s\S]*?buscaycurra:latest/) || [""])[0];
  return run.includes("--restart unless-stopped")
    && /^[^#].*vigilante-app\.sh/m.test(leerFuente("scripts/vps/crontab.txt"))
    && vig.includes('pgrep -f "^bash (.*/)?build-deploy\\.sh"')
    && vig.includes("--restart unless-stopped")
    && vig.includes("docker network connect easypanel-buscaycurra buscaycurra-nextjs")
    && vig.includes("ADMIN_EMAILS");
});

// ── ALERTAS DE CURSOS QUE LLEGAN DE VERDAD (8 oct 2026) ───────────────
//
// No se había mandado ni una: solo estaban en un workflow de GitHub que en esta
// rama no corre. Y al activarlas apareció lo peligroso: salían por sendEmail
// (sin mirar el presupuesto diario) con un tope de 200 por pasada, el doble de
// lo que deja Resend en un día. Una pasada así deja sin confirmación de
// registro a quien se apunte esa tarde. Ahora: cron, presupuesto, 40 por
// pasada, baja de un clic, y solo se marca como avisado si el correo salió.
test("las alertas de cursos salen por cron, con presupuesto diario y baja de un clic", () => {
  const ruta = leerFuente("app/api/cursos/alertas/route.ts");
  const correo = leerFuente("lib/email/smtp-sender.ts");
  const ini = correo.indexOf("export async function sendCursoAlertaEmail");
  const fn = correo.slice(ini, correo.indexOf("\n}\n", ini));
  const tope = Number((ruta.match(/const MAX_CORREOS = (\d+)/) || [])[1] || 999);
  return /^[^#].*alertas-cursos\.sh/m.test(leerFuente("scripts/vps/crontab.txt"))
    && leerFuente("scripts/vps/alertas-cursos.sh").includes("/api/cursos/alertas")
    && tope <= 50
    && ruta.includes("quedaSitioParaLoQuePuedeEsperar()")
    && /if \(!salio\) \{ fallidos\+\+; continue; \}/.test(ruta)
    && fn.includes("enviarCorreo(") && fn.includes("puedeEsperar: true") && fn.includes("bajaUrl")
    && !fn.includes("await sendEmail(");
});

test("el correo de ofertas recomienda el curso del oficio, bien y sin colar HTML", async () => {
  const { execFileSync } = await import("node:child_process");
  const { unlinkSync, writeFileSync } = await import("node:fs");
  const entrada = ".sello-curso-puesto-entrada.ts";
  const salida = ".sello-curso-puesto.cjs";
  try {
    writeFileSync(entrada, [
      'export { cursoParaPuesto } from "./lib/cursos/curso-para-puesto";',
      'export { enlaceBajaAviso, firmaBajaAvisoValida } from "./lib/cursos/baja-aviso";',
    ].join("\n"));
    execFileSync("npx", ["esbuild", entrada, "--bundle", "--format=cjs", "--platform=node",
      "--external:pg", `--outfile=${salida}`, "--log-level=error"], { stdio: "pipe", shell: true });
    const habiaSecreto = !!process.env.ADMIN_SECRET;
    if (!habiaSecreto) process.env.ADMIN_SECRET = "secreto-de-prueba-del-sello";
    const m = await import(`../${salida}`);
    const casos = [
      ["camarero", "manipulador-alimentos"], ["Camarera de sala", "manipulador-alimentos"],
      ["Gerocultora", "atencion-sociosanitaria-instituciones"], ["Mozo de almacén", "carretillero"],
      ["conductora de autobús", "cap-conductor-profesional"],
      // Estricto: un taxista no necesita el CAP, y un programador no necesita nada de esto.
      ["conductor", null], ["programador", null],
    ];
    const malos = casos.filter(([p, esperado]) => (m.cursoParaPuesto(p)?.slug ?? null) !== esperado);
    for (const [p, e] of malos) console.log(`     ↳ "${p}" debería dar ${e} y da ${m.cursoParaPuesto(p)?.slug ?? null}`);
    const url = new URL(m.enlaceBajaAviso("123"));
    const firmaBuena = m.firmaBajaAvisoValida("123", url.searchParams.get("t")) && !m.firmaBajaAvisoValida("124", url.searchParams.get("t"));
    if (!habiaSecreto) delete process.env.ADMIN_SECRET;
    if (!firmaBuena) console.log("     ↳ la firma de baja del aviso no protege el id");
    // El oficio sale del CV, que escribe el usuario: dentro del HTML va escapado.
    const correo = leerFuente("lib/email/smtp-sender.ts");
    const escapado = correo.includes("escaparHtml(curso.puesto") && correo.includes("escaparHtml(curso.nombre)");
    if (!escapado) console.log("     ↳ el oficio del CV entra en el correo sin escapar");
    const ruta = leerFuente("app/api/push/send-alerts/route.ts");
    const espaciado = ruta.includes("curso-en-alerta:") && /14 \* 86400/.test(ruta) && ruta.includes("fichasDePlaza(cv.texto)");
    if (!espaciado) console.log("     ↳ la recomendación del curso no se espacia o se repite a quien ya lo tiene");
    return malos.length === 0 && firmaBuena && escapado && espaciado;
  } catch (e) {
    console.log(`     ↳ no se pudo compilar o ejecutar: ${e.message?.slice(0, 120)}`);
    return false;
  } finally {
    for (const f of [entrada, salida]) { try { unlinkSync(f); } catch { /* da igual */ } }
  }
});

// globals.css fuerza "padding: 10px 14px !important" a todo input de búsqueda,
// así que pl-10 no hacía nada y la lupa del catálogo de cursos tapaba el texto
// (visto en una captura en móvil el 8 oct 2026). Los buscadores con lupa
// necesitan la clase que gana a esa regla.
test("los buscadores de cursos con lupa no la ponen encima del texto", () =>
  /input\[type="search"\]\.input-con-icono\s*\{[^}]*padding-left:\s*\d+px\s*!important/.test(leerFuente("app/globals.css"))
  && leerFuente("components/cursos/CatalogoCursos.tsx").includes("input-con-icono")
  && leerFuente("components/cursos/PlazasCurso.tsx").includes("input-con-icono"));

test("las plazas de cursos se sincronizan desde el crontab del servidor", () =>
  /^[^#].*sync-plazas-cursos\.sh/m.test(leerFuente("scripts/vps/crontab.txt"))
  && leerFuente("scripts/vps/sync-plazas-cursos.sh").includes("/api/cursos/plazas/sync"));

// ── GOOGLE: JOBPOSTING SIN EMPRESA (10 oct 2026) ──────────────────────
//
// Search Console avisó de un error crítico: "Falta el campo name (en
// hiringOrganization)". 6.316 ofertas de España no tienen empresa real (las de
// Lanbide y SEF Murcia, y rellenos como "Empresa"), y todas declaraban país
// "ES" aunque fueran de Alemania. Sin empresa real no se marca la oferta; con
// ella, el país es el suyo. Y las de los servicios públicos se solicitan en su
// web: el CV no puede acabar en un correo deducido de la administración.
test("JobPosting solo con empresa real y país de la oferta; ofertas oficiales por su web", async () => {
  const { execFileSync } = await import("node:child_process");
  const { unlinkSync, writeFileSync } = await import("node:fs");
  const entrada = ".sello-jobposting-entrada.ts", salida = ".sello-jobposting.cjs";
  try {
    writeFileSync(entrada, 'export { jobPostingDe } from "./lib/seo/job-posting";\nexport { servicioOficial, esCorreoDeServicioOficial } from "./lib/job-search/fuente-oficial";\n');
    execFileSync("npx", ["esbuild", entrada, "--bundle", "--format=cjs", "--platform=node", `--outfile=${salida}`, "--log-level=error"], { stdio: "pipe", shell: true });
    const m = await import(`../${salida}`);
    const base = { title: "Camarero", description: "Turno de tarde", city: "Bilbao", province: "Bizkaia", createdAt: "2026-10-01T00:00:00Z" };
    const buena = m.jobPostingDe({ ...base, company: "Bar Pepe", country: "de" });
    const reino = m.jobPostingDe({ ...base, company: "Pub Ltd", country: "uk" });
    const sinEmpresa = [m.jobPostingDe({ ...base, company: "", country: "es" }), m.jobPostingDe({ ...base, company: "Empresa", country: "es" }),
      m.jobPostingDe({ ...base, company: "  Ver en oferta ", country: "es" }), m.jobPostingDe({ ...base, company: null, country: "es" })];
    const okSchema = buena?.hiringOrganization?.name === "Bar Pepe" && buena.jobLocation.address.addressCountry === "DE"
      && reino?.jobLocation.address.addressCountry === "GB" && sinEmpresa.every(x => x === null)
      && m.jobPostingDe({ ...base, company: "Bar Pepe", country: null }) === null;
    if (!okSchema) console.log("     ↳ el JobPosting sale sin empresa o con el país equivocado");
    const okOficial = m.servicioOficial("LANBIDE")?.corto === "Lanbide" && m.servicioOficial("ADZUNA_ES") === null
      && m.esCorreoDeServicioOficial("empleo@web.lanbide.eus") && m.esCorreoDeServicioOficial("empleo@sefoficinavirtual.carm.es")
      && !m.esCorreoDeServicioOficial("rrhh@empresa-lanbide.es");
    if (!okOficial) console.log("     ↳ no se reconocen las ofertas o los correos de los servicios públicos");
    const publica = leerFuente("app/empleo/oferta/[id]/page.tsx");
    const app = leerFuente("app/app/ofertas/[id]/page.tsx");
    const paginas = publica.includes("jobPostingDe(row)") && app.includes("jobPostingDe(row)")
      && !/addressCountry:\s*"ES"/.test(publica + app) && !app.includes('employmentType = "FULL_TIME"')
      && /\{jobPostingSchema && \(/.test(publica) && /\{jobPostingSchema && \(/.test(app);
    if (!paginas) console.log("     ↳ alguna página de oferta no usa lib/seo/job-posting.ts");
    const botones = leerFuente("components/JobCard.tsx").includes("Inscribirme en {oficial.corto}")
      && leerFuente("app/app/ofertas/[id]/OfertaDetalleClient.tsx").includes("Inscribirme en {oficial.corto}")
      && publica.includes("Inscribirme en {oficial.corto}")
      && leerFuente("lib/cv-sender/direccion-segura.ts").includes("if (esCorreoDeServicioOficial(email))");
    if (!botones) console.log("     ↳ las ofertas oficiales siguen ofreciendo enviar el CV por correo");
    return okSchema && okOficial && paginas && botones;
  } catch (e) {
    console.log(`     ↳ no se pudo compilar: ${e.message?.slice(0, 100)}`);
    return false;
  } finally {
    for (const f of [entrada, salida]) { try { unlinkSync(f); } catch { /* da igual */ } }
  }
});

// ── AUDITORÍA PARA CEIN (10 oct 2026) ─────────────────────────────────
//
// La web se va a enseñar a un jurado. Lo que dice tiene que poder demostrarse:
// con 0 suscriptores no hay plan "más popular" ni "más elegido", y con un
// centenar de usuarios no hay "miles". Los Términos decían 2 envíos al día
// (Free) y 10 (Pro) cuando lo real y lo anunciado en /precios es 3 y 50.
test("la web no afirma lo que no se puede demostrar y los Términos dicen los límites reales", () => {
  const textos = ["app/(home)/page.tsx", "app/precios/page.tsx", "app/app/page.tsx", "app/sobre-nosotros/page.tsx"]
    .map(leerFuente).join("\n");
  const falsas = [/M[aá]s elegido/, /M[aá]s popular/, /Miles de personas/i, /miles de usuarios/i].filter(r => r.test(textos));
  if (falsas.length) console.log(`     ↳ siguen afirmaciones sin respaldo: ${falsas.join(", ")}`);
  const terminos = leerFuente("app/terminos/page.tsx");
  const tabla = terminos.includes("LIMITS.free.enviosCVDia") && terminos.includes("LIMITS.esencial.enviosCVDia")
    && terminos.includes("LIMITS.pro.enviosCVDia") && !/>\s*(2|10) CVs \/ día\s*</.test(terminos);
  if (!tabla) console.log("     ↳ la tabla de los Términos no sale de lib/plan-limits.ts");
  return falsas.length === 0 && tabla;
});

// Las diez pantallas de arranque de iPhone que declara el layout daban 404.
test("existen todas las imágenes que el layout declara (iconos y pantallas de arranque)", async () => {
  const { existsSync } = await import("node:fs");
  const rutas = [...leerFuente("app/layout.tsx").matchAll(/href="(\/[^"]+\.(?:png|jpg|svg|webp|ico))"/g)].map(m => m[1]);
  const faltan = rutas.filter(r => !existsSync("public" + r));
  if (faltan.length) console.log(`     ↳ faltan: ${faltan.slice(0, 4).join(", ")}`);
  return rutas.length > 5 && faltan.length === 0;
});

// Un único fallo de Adzuna se repetía en cada pasada del sincronizador
// durante días porque el contador no se vaciaba nunca.
test("el sincronizador olvida los fallos ya contados tras cada pasada", () =>
  /delete fallosPorFuente\[f\]/.test(leerFuente("lib/job-search/sync-worker.ts"))
  && /poweredByHeader:\s*false/.test(leerFuente("next.config.ts")));

// Lo que la web dice que hace tiene que hacerlo. Revisado contra el código el
// 10 oct 2026: la IA escribe una CARTA por empresa (no adapta el CV), el envío
// sale en horario laboral (no "a la hora de actividad de cada empresa"), el CV
// se traduce a 6 idiomas (no "12"), y las estadísticas de "la verdad
// incómoda" estaban mal atribuidas (el 78 % de "Adecco" es de Indeed y mide
// otra cosa). Tampoco hay fuente para "InfoJobs Premium cuesta 39 €".
test("las funciones y cifras que anuncia la web coinciden con el código y tienen fuente", async () => {
  const paginas = ["app/(home)/page.tsx", "app/auth/login/page.tsx", "app/auth/registro/page.tsx", "app/empleo/page.tsx",
    "app/sobre-nosotros/page.tsx", "app/app/page.tsx", "lib/datos-reales.ts", "lib/guzzi/prompts.ts", "app/layout.tsx",
    "public/manifest.json", "lib/guzzi-limits.ts", "app/trabajar-en/page.tsx", "lib/funciones.ts", "lib/guias/contenido.ts"].map(leerFuente).join("\n");
  const prohibidas = [/12 idiomas y adapta/, /descartan (al|el) 75/, /El 75% de los CVs/, /8:32/, /hora de actividad de cada empresa/,
    /Primero en la bandeja/, /\(inútil\)/, /InfoJobs Premium cuesta/, /1 de cada 5 titulados/, /fuente: "Adecco Spain"/,
    /adapta tu CV a cada (oferta|empresa)/, /CV adaptado (por IA )?a cada empresa/, /49 países/,
    /primer agente IA/i, /busca, adapta y env[ií]a/, /No hay otro sistema igual/, /19 países/,
    /CV adaptado con IA/, /adapta tu CV y env[ií]a/, /tu CV adaptado por ti/, /adapta a la oferta/, /adaptar tu CV a una oferta concreta/,
    /Pipeline de candidaturas\\n\\n/];
  const quedan = prohibidas.filter(r => r.test(paginas));
  if (quedan.length) console.log(`     ↳ sigue: ${quedan.map(String).join(", ")}`);
  // El texto del porcentaje de email tiene que salir del porcentaje medido.
  const { unlinkSync, writeFileSync } = await import("node:fs");
  const { execFileSync } = await import("node:child_process");
  const entrada = ".sello-datos-entrada.ts", salida = ".sello-datos.cjs";
  let cuadra = false;
  try {
    writeFileSync(entrada, 'export { DATOS } from "./lib/datos-reales";\n');
    execFileSync("npx", ["esbuild", entrada, "--bundle", "--format=cjs", "--platform=node", `--outfile=${salida}`, "--log-level=error"], { stdio: "pipe", shell: true });
    const { DATOS } = await import(`../${salida}`);
    cuadra = DATOS.conEmailTexto === `${Math.floor(DATOS.porcentajeConEmail / 10)} de cada 10` && !("precioInfoJobsPremium" in DATOS);
    if (!cuadra) console.log(`     ↳ "${DATOS.conEmailTexto}" no cuadra con el ${DATOS.porcentajeConEmail} %`);
  } catch (e) {
    console.log(`     ↳ no se pudo compilar: ${e.message?.slice(0, 100)}`);
  } finally {
    for (const f of [entrada, salida]) { try { unlinkSync(f); } catch { /* da igual */ } }
  }
  return quedan.length === 0 && cuadra;
});

// El panel de métricas salía como "index, follow" y robots.txt no lo cerraba.
test("el panel interno no se indexa: noindex y fuera de robots para todos los bots", () => {
  const robots = leerFuente("public/robots.txt");
  const layout = leerFuente("app/admin/layout.tsx");
  return (robots.match(/^Disallow: \/admin\r?$/gm) || []).length === 2
    && /robots:\s*\{\s*index:\s*false/.test(layout);
});

// Lo que la auditoría con navegador (308 páginas, 10 oct 2026) vio fallar:
// un 406 de Supabase al abrir Guzzi sin conversación previa, "Sin resultados"
// en la página de candidatos cuando lo que pasaba era que no había sesión, el
// GPS bloqueado por nuestra propia cabecera, y páginas de 9,5 s en la primera
// visita tras cada despliegue.
test("lo que falló en la auditoría con navegador sigue arreglado", () => {
  const chat = leerFuente("components/GusiChat.tsx");
  const conv = /from\("gusi_conversations"\)[\s\S]{0,400}?\n\s*\.(maybeSingle|single)\(\);/.exec(chat);
  const candidatos = leerFuente("app/empresas/candidatos/page.tsx");
  const login = leerFuente("app/auth/login/page.tsx");
  const cabeceras = leerFuente("next.config.ts");
  const buscar = leerFuente("app/app/buscar/page.tsx");
  const deploy = leerFuente("build-deploy.sh");
  const checks = {
    "Guzzi carga la conversación con maybeSingle": conv?.[1] === "maybeSingle",
    "candidatos pide entrar si la API da 401": candidatos.includes("setNecesitaEntrar(res.status === 401)"),
    "el login vuelve a /empresas/candidatos y a nada más fuera de /app/": login.includes('destino === "/empresas/candidatos"') && !/destino\.startsWith\("\/(?!app\/)/.test(login),
    "GPS permitido para la propia web": /geolocation=\(self\)/.test(cabeceras),
    "el buscador no pide GPS al abrir": !buscar.includes("navigator.geolocation") && !buscar.includes("nominatim"),
    "el despliegue precalienta el sitemap": /setsid timeout \d+ bash -c[\s\S]*sitemap\.xml/.test(deploy),
    // "enfermera" en Alemania: 19 s y corte por statement_timeout. El país va
    // por su índice y un puesto conocido se busca solo en el título (2,4 s).
    "el buscador filtra el país por índice": !/"country" ILIKE/.test(leerFuente("app/api/jobs/search/route.ts"))
      && /lower\("country"\) = lower\(\$\$\{idx\}\)/.test(leerFuente("app/api/jobs/search/route.ts")),
    "un puesto conocido no se busca en company": /esPuestoConocido \? `title ~\* \$\$\{i\}`/.test(leerFuente("app/api/jobs/search/route.ts")),
    // Guzzi: "enfermera en Alemania" sin ciudad leía la descripción de todo el
    // país (22 s, corte a los 15 y "no me sale nada"); con ciudad, la pasada por
    // descripción recorría 3,6 M de filas por el OR del país (21 s).
    "Guzzi sin ciudad busca solo en el título": (() => {
      const g = leerFuente("app/api/gusi/chat/route.ts");
      const sinCiudad = g.slice(g.indexOf("// No city: just strategy 3"), g.indexOf("// -- Estrategia 4"));
      return sinCiudad.includes("AND title ~* $1") && !sinCiudad.includes("LOWER(description) LIKE");
    })(),
    // "Camarero en Pamplona" → "Operario puente grúa + carretilla": el bucle
    // de sinónimos se quedaba siempre con la primera entrada (carretillero).
    "Guzzi usa los sinónimos del puesto pedido, no los del primero del diccionario": (() => {
      const g = leerFuente("app/api/gusi/chat/route.ts");
      return !g.includes("syns.some(s => queryNorm.includes(s)) || enOtrosIdiomas.length > 1")
        && g.includes("const entradaEs = Object.entries(SINONIMOS_PUESTO).find(");
    })(),
    "Guzzi solo mira la descripción en España y por el índice del país":
      /if \(r\.rows\.length === 0 && isoCode === "ES"\) \{\s*r = await pool\.query\(consulta\("LOWER\(title\) LIKE \$1 OR LOWER\(description\) LIKE \$1", true\)/
        .test(leerFuente("app/api/gusi/chat/route.ts")),
  };
  const malos = Object.entries(checks).filter(([, ok]) => !ok).map(([k]) => k);
  if (malos.length) console.log(`     ↳ ${malos.join(" · ")}`);
  return malos.length === 0;
});

// ── 12 OCT 2026: ALERTAS, AU PAIR, GOOGLE Y CURSOS SEGÚN EL CV ─────────
//
// En el perfil solo se podían QUITAR alertas de empleo; crear una exigía ir al
// buscador. Los avisos de cursos (otra cosa) no salían en ningún sitio.
test("el perfil deja añadir y quitar alertas de empleo y, aparte, avisos de cursos", () => {
  const alertas = leerFuente("components/MisAlertas.tsx");
  const api = leerFuente("app/api/jobs/alertas/route.ts");
  const cursos = leerFuente("components/MisAvisosCursos.tsx");
  const perfil = leerFuente("app/app/perfil/page.tsx");
  const aviso = leerFuente("app/api/cursos/aviso/route.ts");
  const ok = {
    "añadir alerta": alertas.includes('method: "POST"') && alertas.includes("Añadir alerta") && alertas.includes('method: "DELETE"'),
    "tope de alertas": /MAX_ALERTAS = \d+/.test(api) && api.includes(">= MAX_ALERTAS"),
    "avisos de cursos en el perfil": perfil.includes("<MisAvisosCursos />") && perfil.includes("<MisAlertas />"),
    "lista de avisos de cursos": aviso.includes("if (!slug) {") && cursos.includes("Añadir aviso") && cursos.includes("cambiar(a.slug, false)"),
  };
  const malos = Object.entries(ok).filter(([, v]) => !v).map(([k]) => k);
  if (malos.length) console.log(`     ↳ ${malos.join(" · ")}`);
  return malos.length === 0;
});

// La familia recibe un PDF que monta el servidor; la pantalla solo enseñaba el
// texto de la carta. Y todo salía como "Au Pair" aunque fuera Live-in Nanny.
test("au pair: se ve el perfil tal cual lo recibe la familia, sin gastar cupo, y con su rol", () => {
  const ruta = leerFuente("app/api/au-pair/send/route.ts");
  const pagina = leerFuente("app/app/au-pair/page.tsx");
  const ok = {
    "soloVer devuelve el HTML del PDF": /if \(soloVer\) \{\s*return NextResponse\.json\(\{ html: htmlPerfil/.test(ruta),
    "ver no gasta cupo": ruta.includes("if (!soloVer && (enviadosHoy || 0) >= limiteHoy)"),
    "rol de la persona": ruta.includes('body.modo === "live_in_nanny" ? "Live-in Nanny" : "Au Pair"') && !ruta.includes("`Au Pair Application — ${userName}"),
    "botón y ventana": pagina.includes("Ver mi perfil tal cual lo recibirán") && pagina.includes("srcDoc={perfilFinal}") && pagina.includes("soloVer: true, modo"),
    "se guarda antes de ver": pagina.includes("if (!(await guardar())) return;"),
  };
  const malos = Object.entries(ok).filter(([, v]) => !v).map(([k]) => k);
  if (malos.length) console.log(`     ↳ ${malos.join(" · ")}`);
  return malos.length === 0;
});

// Search Console, 12 oct 2026: "Excluida por una etiqueta noindex" en páginas
// del sitemap. Eran ofertas que caducaban antes de que Google pasara.
test("el sitemap de ofertas no da ofertas que vayan a caducar antes de que Google pase", () => {
  const s = leerFuente("app/sitemap-ofertas.xml/route.ts");
  // Y el índice no devuelve 503 si el recuento tarda (recién desplegado).
  const sinCaida = s.includes('total = Number(await cacheGet("sitemap-ofertas:total")) || null;')
    && s.includes("const paginas = total === null ? 4 :");
  if (!sinCaida) console.log("     ↳ si el recuento falla, el índice del sitemap devuelve 503");
  return sinCaida && /VIVA_AL_RASTREAR = `\("expiresAt" IS NULL OR "expiresAt" > NOW\(\) \+ INTERVAL '\d+ days'\)`/.test(s)
    && (s.match(/AND \$\{VIVA_AL_RASTREAR\}/g) || []).length === 1
    && /ORDER BY "createdAt" DESC NULLS LAST/.test(s.slice(s.indexOf("AND ${VIVA_AL_RASTREAR}")));
});

// "Veo en tu CV que has trabajado de camarera…": el curso que le falta para lo
// que ha trabajado, con la misma regla estricta que el correo de ofertas.
test("cursos según el CV: el que falta para lo trabajado, nunca el que ya tiene, sin abusar", async () => {
  const { execFileSync } = await import("node:child_process");
  const { unlinkSync, writeFileSync } = await import("node:fs");
  const entrada = ".sello-sugerencia-entrada.ts", salida = ".sello-sugerencia.cjs";
  try {
    writeFileSync(entrada, 'export { cursosQueEncajan, textoSugerencia } from "./lib/cursos/sugerencia-cv";\n');
    execFileSync("npx", ["esbuild", entrada, "--bundle", "--format=cjs", "--platform=node", `--outfile=${salida}`, "--log-level=error"], { stdio: "pipe", shell: true });
    const m = await import(`../${salida}`);
    const slugs = (cv) => m.cursosQueEncajan(cv).map((c) => c.slug).join(",");
    const casos = [
      [slugs({ experiencia: [{ puesto: "Camarera", empresa: "Bar Pepe" }] }), "manipulador-alimentos"],
      [slugs({ experiencia: [{ puesto: "Camarera" }], formacion: [{ titulo: "Manipulador de alimentos" }] }), ""],
      [slugs({ experiencia: [{ puesto: "Conductor", empresa: "Taxi" }] }), ""],
      [slugs({ experiencia: [{ puesto: "Mozo de almacén" }] }), "carretillero"],
      [slugs(null), ""],
      [slugs({ experiencia: "texto suelto" }), ""],
    ];
    const malos = casos.filter(([r, e]) => r !== e);
    if (malos.length) console.log(`     ↳ ${JSON.stringify(malos)}`);
    // Primera prueba en producción (12 oct): a un oficial soldador se le sugería
    // el curso de soldadura. Quien trabaja de algo acreditable recibe la vía de
    // la experiencia; y si el certificado ya está en su formación, nada.
    const soldador = m.cursosQueEncajan({ experiencia: [{ puesto: "Oficial soldador", empresa: "Metálicas SA" }] })[0];
    const conTitulo = m.cursosQueEncajan({ experiencia: [{ puesto: "Oficial soldador" }], formacion: [{ titulo: "Certificado de soldadura MIG/MAG" }] });
    const viaOk = soldador?.viaExperiencia === true && m.textoSugerencia(soldador, null, null).mensaje.includes("sin volver a clase")
      && conTitulo.length === 0;
    if (!viaOk) console.log("     ↳ al que ya trabaja de algo acreditable no se le ofrece la vía de la experiencia");
    const c = m.cursosQueEncajan({ experiencia: [{ puesto: "Camarera", empresa: "Bar Pepe" }] })[0];
    const t = m.textoSugerencia(c, { titulo: "Manipulador", municipio: "Tudela", provincia: "Navarra", inicio: "2026-11-03", horas: 10, modalidad: "presencial" }, { total: 23, zona: "Navarra" });
    const textoOk = t.mensaje.startsWith("Veo en tu CV que has trabajado de camarera en Bar Pepe.") && t.mensaje.includes("3 de noviembre") && t.mensaje.includes("23 ofertas");
    if (!textoOk) console.log(`     ↳ ${t.mensaje}`);
    // La plaza y el recuento viven en una librería que también usa Guzzi.
    const ruta = leerFuente("app/api/cursos/sugerencias-cv/route.ts") + leerFuente("lib/cursos/para-esa-persona.ts");
    // Plazas del Consorci (en catalán, para ocupados) se ofrecían "online" a
    // gente de Navarra o Asturias, y alguna empezaba al día siguiente.
    const plazaBien = ruta.includes('if (p.dirigido === "ocupados") return false;')
      && ruta.includes("if (p.inicio < enTresDias) return false;")
      && ruta.includes('if (p.modalidad === "online") return (PROVINCIAS_DE_FUENTE[p.fuente] ?? []).includes(provincia);');
    if (!plazaBien) console.log("     ↳ se pueden sugerir plazas de otra comunidad, solo para ocupados o que empiezan ya");
    const freno = /DIAS_ENTRE_SUGERENCIAS = 14;/.test(ruta) && /MAX_POR_PASADA = \d+;/.test(ruta)
      && ruta.includes("quedaSitioParaLoQuePuedeEsperar()") && ruta.includes("enlaceBajaSugerencias(cv.user_id)")
      && ruta.includes("sinSugerencias(") && ruta.includes('get("simular") === "1"') && ruta.includes("secretIguales(");
    if (!freno) console.log("     ↳ faltan los frenos de la ruta (14 días, tope, presupuesto, baja o secreto)");
    const cron = /^40 \*\/3 \* \* \* .*sugerencias-cursos-cv\.sh/m.test(leerFuente("scripts/vps/crontab.txt"))
      && leerFuente("scripts/vps/sugerencias-cursos-cv.sh").includes("/api/cursos/sugerencias-cv");
    if (!cron) console.log("     ↳ no está en el crontab cada 3 horas");
    const interruptor = leerFuente("components/MisAvisosCursos.tsx").includes("Sugerirme cursos según mi CV");
    return malos.length === 0 && viaOk && plazaBien && textoOk && freno && cron && interruptor;
  } catch (e) {
    console.log(`     ↳ no se pudo compilar: ${e.message?.slice(0, 100)}`);
    return false;
  } finally {
    for (const f of [entrada, salida]) { try { unlinkSync(f); } catch { /* da igual */ } }
  }
});

// 14 oct 2026: la plantilla de Au Pair / Live-in Nanny no se podía ver a
// pantalla completa, "Ver carta" no enseñaba nada, "Descargar PDF" no hacía
// nada sin "Ver carta" antes (y no mandaba la sesión), y la plantilla decía
// "Au Pair" aunque fuera Live-in Nanny.
test("au pair: plantilla y carta a pantalla completa, PDF que descarga y rol correcto", () => {
  const p = leerFuente("app/app/au-pair/page.tsx");
  const t = leerFuente("components/AuPairPlantilla.tsx");
  const ok = {
    "botón de pantalla completa": p.includes('onClick={() => setVistaCompleta("plantilla")}') && p.includes("{vistaCompleta && ("),
    "ver carta la enseña": /function verCarta\(\) \{[\s\S]{0,200}setVistaCompleta\("carta"\)/.test(p) && p.includes("srcDoc={previewHTML}"),
    "descargar monta la carta y usa el camino del editor": /async function descargarCarta\(\) \{[\s\S]{0,300}const html = construirCarta\(\);[\s\S]{0,500}descargarCVComoPDF\(html/.test(p),
    "la plantilla recibe el rol": (p.match(/modo=\{modo\}/g) || []).length >= 2 && t.includes('modo === "live_in_nanny" ? "Live-in Nanny" : "Au Pair"') && !t.includes(">Au Pair Profile ·"),
  };
  const malos = Object.entries(ok).filter(([, v]) => !v).map(([k]) => k);
  if (malos.length) console.log(`     ↳ ${malos.join(" · ")}`);
  return malos.length === 0;
});

// 14 oct 2026: "¿Cuántas ofertas contamos en Suiza?" buscaba el puesto
// "contamos" y Guzzi acababa tirando del CV. Una pregunta de cuántas hay en un
// país no lleva puesto: tiene que acabar en el recuento del país.
test("Guzzi: «¿cuántas ofertas tenemos en Suiza?» no se convierte en un puesto", async () => {
  const { execFileSync } = await import("node:child_process");
  const { unlinkSync, writeFileSync } = await import("node:fs");
  const entrada = ".sello-cuantas-entrada.ts", salida = ".sello-cuantas.cjs";
  try {
    writeFileSync(entrada, 'export { extractJobTerm } from "./lib/guzzi/intents";\nexport { limpiarTerminoBusqueda, detectarPais } from "./lib/guzzi/paises-detect";\n');
    execFileSync("npx", ["esbuild", entrada, "--bundle", "--format=cjs", "--platform=node", `--outfile=${salida}`, "--log-level=error"], { stdio: "pipe", shell: true });
    const m = await import(`../${salida}`);
    const puesto = (f) => m.limpiarTerminoBusqueda(m.extractJobTerm(f));
    const casos = [
      ["¿Cuántas ofertas contamos en Suiza?", null],
      ["cuantas ofertas contabamos en suiza", null],
      ["cuántas ofertas tenemos en Suiza", null],
      ["¿cuántos trabajos tenéis en Noruega?", null],
      ["busco trabajo de camarero en Suiza", "camarero"],
      ["gestor de cuentas en Madrid", "gestor de cuentas"],
    ];
    const malos = casos.filter(([f, e]) => puesto(f) !== e).map(([f]) => `${f} → ${JSON.stringify(puesto(f))}`);
    if (malos.length) console.log(`     ↳ ${malos.join(" · ")}`);
    // Y el recuento no puede caer por tiempo: Alemania pasaba de 15 s, daba 0
    // y Guzzi preguntaba por el puesto en vez de contestar.
    const ruta = leerFuente("app/api/gusi/chat/route.ts");
    const recuento = ruta.includes('consultaGuardada("guzzi:ofertas-por-pais"') && ruta.includes('SET LOCAL statement_timeout = 60000')
      && ruta.includes("consultaGuardada(`guzzi:ciudades-top:");
    if (!recuento) console.log("     ↳ el recuento por país no está guardado ni tiene margen de tiempo");
    return malos.length === 0 && recuento && m.detectarPais("¿Cuántas ofertas contamos en Suiza?")?.codigo === "ch";
  } catch (e) {
    console.log(`     ↳ no se pudo compilar: ${e.message?.slice(0, 100)}`);
    return false;
  } finally {
    for (const f of [entrada, salida]) { try { unlinkSync(f); } catch { /* da igual */ } }
  }
});

// RENOVACIONES (18 oct 2026): quien ya tiene el carné quiere saber cada cuánto
// caduca y qué hacer. Solo con el plazo confirmado en una fuente, y la TIP del
// vigilante decía "no caduca" cuando vale 10 años (Orden INT/318/2011, art. 14.2).
test("renovación de carnés: plazos con fuente, en la ficha y con página propia", async () => {
  const { execFileSync } = await import("node:child_process");
  const { unlinkSync, writeFileSync } = await import("node:fs");
  const entrada = ".sello-renovar-entrada.ts", salida = ".sello-renovar.cjs";
  try {
    writeFileSync(entrada, 'export { tiposConRenovacion, tipoPorSlug } from "./lib/cursos/tipos";\n');
    execFileSync("npx", ["esbuild", entrada, "--bundle", "--format=cjs", "--platform=node", `--outfile=${salida}`, "--log-level=error"], { stdio: "pipe", shell: true });
    const m = await import(`../${salida}`);
    const conRenovacion = m.tiposConRenovacion("ES").map(t => t.slug);
    const vigilante = m.tipoPorSlug("vigilante-seguridad");
    const ficha = leerFuente("components/cursos/DetalleCurso.tsx");
    const pagina = leerFuente("app/cursos/[tipo]/renovar/page.tsx");
    const mapa = leerFuente("app/sitemap.ts");
    const checks = {
      "los seis carnés confirmados tienen renovación": ["carretillero", "plataforma-elevadora", "tpc-construccion", "cap-conductor-profesional", "vigilante-seguridad", "soldadura"].every(s => conRenovacion.includes(s)),
      "sin plazo confirmado no se inventa": !conRenovacion.includes("gases-fluorados") && !conRenovacion.includes("manipulador-alimentos"),
      "cada renovación lleva casillas y fuente": m.tiposConRenovacion("ES").every(t => t.renovacion.cada && t.renovacion.casillas.length > 0
        && t.renovacion.fuentes.length > 0 && t.renovacion.fuentes.every(f => f.url.startsWith("https://"))),
      "la TIP caduca a los 10 años": vigilante?.validezAnios === 10 && !/no caduca/i.test(JSON.stringify(vigilante)),
      "la TPC caduca a los 5 años": m.tipoPorSlug("tpc-construccion")?.validezAnios === 5,
      "la ficha lleva al bloque de renovación": ficha.includes('href="#renovacion"') && ficha.includes('id="renovacion"') && ficha.includes("<CasillasRenovacion r={t.renovacion} />"),
      "página pública por carné, 404 si no hay dato": pagina.includes('tiposConRenovacion("ES").map(t => ({ tipo: t.slug }))') && pagina.includes("if (!t?.renovacion) notFound();"),
      "índice público y en la app": leerFuente("app/cursos/renovar/page.tsx").includes('<ListaRenovaciones base="/cursos" />')
        && leerFuente("app/app/formacion/renovar/page.tsx").includes('<ListaRenovaciones base="/app/formacion" />'),
      "el listado de cursos enlaza a renovaciones": leerFuente("components/cursos/ListaCursos.tsx").includes("href={`${base}/renovar`}"),
      "en el sitemap": mapa.includes("...paginasRenovar,") && mapa.includes("/cursos/renovar`"),
    };
    const malos = Object.entries(checks).filter(([, ok]) => !ok).map(([k]) => k);
    if (malos.length) console.log(`     ↳ ${malos.join(" · ")}`);
    return malos.length === 0;
  } catch (e) {
    console.log(`     ↳ no se pudo compilar: ${e.message?.slice(0, 100)}`);
    return false;
  } finally {
    for (const f of [entrada, salida]) { try { unlinkSync(f); } catch { /* da igual */ } }
  }
});

// RENOVACIONES, FASE 2 (18 oct 2026): "ya lo tengo", cuándo caduca y el aviso
// 3 meses y 1 mes antes. Un CAP o una TPC caducados te dejan sin trabajar.
test("mis carnés: fecha de caducidad bien calculada, avisos con baja y Guzzi con la ficha verificada", async () => {
  const { execFileSync } = await import("node:child_process");
  const { unlinkSync, writeFileSync } = await import("node:fs");
  const entrada = ".sello-carnes-entrada.ts", salida = ".sello-carnes.cjs";
  try {
    writeFileSync(entrada, 'export { calcularCaducidad, fechaValida, enHorarioDeAviso } from "./lib/cursos/carnes";\nexport { preguntaPorRenovacion, carneEnTexto } from "./lib/guzzi/renovacion";\nexport { tipoPorSlug } from "./lib/cursos/tipos";\nexport { carnesEnElCv } from "./lib/cursos/carnes-en-cv";\n');
    execFileSync("npx", ["esbuild", entrada, "--bundle", "--format=cjs", "--platform=node", "--packages=external", "--tsconfig=tsconfig.json", `--outfile=${salida}`, "--log-level=error"], { stdio: "pipe", shell: true });
    const m = await import(`../${salida}`);
    const enCv = (cv) => JSON.stringify(m.carnesEnElCv(cv));
    const avisos = leerFuente("app/api/cursos/carnes/avisos/route.ts");
    const checks = {
      "carretillero sacado el 15-3-2020 caduca el 15-3-2025": m.calcularCaducidad(m.tipoPorSlug("carretillero"), "2020-03-15") === "2025-03-15",
      "la TIP, a los 10 años": m.calcularCaducidad(m.tipoPorSlug("vigilante-seguridad"), "2018-06-01") === "2028-06-01",
      "el soldador pone su fecha (depende de su certificado)": m.calcularCaducidad(m.tipoPorSlug("soldadura"), "2024-01-10") === null,
      "fechas imposibles fuera": m.fechaValida("2026-02-30") === null && m.fechaValida("2026-02-28") === "2026-02-28",
      "Guzzi reconoce «¿Cómo renuevo el CAP?»": m.preguntaPorRenovacion("¿Cómo renuevo el CAP?") && m.carneEnTexto("¿Cómo renuevo el CAP?") === "cap-conductor-profesional",
      "«convencer» no es «vence»": !m.preguntaPorRenovacion("como convencer al encargado de carretillero"),
      "el carné de conducir no es el CAP": m.carneEnTexto("renovar el carnet de conducir") === null,
      "Guzzi lo contesta con la ficha": leerFuente("app/api/gusi/chat/route.ts").includes("respuestaRenovacion(message, userId)"),
      "la ficha tiene «Ya lo tengo»": leerFuente("components/cursos/DetalleCurso.tsx").includes("<MiCarne slug={t.slug}"),
      "avisos: solo uuid, correo solo si se aprueba, se puede simular": avisos.includes("UUID.test(r.user_id)") && avisos.includes('process.env.CARNES_AVISO_CORREO === "1"') && avisos.includes('params.get("simular") === "1"'),
      "el correo lleva baja firmada": avisos.includes("bajaUrl: enlaceBajaCarnes(r.user_id)") && leerFuente("lib/cursos/carnes.ts").includes("timingSafeEqual"),
      // Solo si el CV nombra el carné: ser conductor no es tener el CAP.
      "el CV propone los carnés que nombra, y solo esos": enCv({ formacion: "Carnet de carretillero (UNE 58451)" }) === '["carretillero"]'
        && enCv({ titulo: "Conductor de reparto", descripcion: "Furgoneta, carnet B" }) === "[]"
        && enCv({ certificaciones: "CAP en vigor, carnet C+E" }) === '["cap-conductor-profesional"]'
        && enCv({ descripcion: "Capacidad de trabajo en equipo" }) === "[]",
      "se borran al borrar la cuenta": leerFuente("lib/cuenta/borrar-datos.ts").includes('carne_usuario: "user_id"'),
      // Michel: "programarlo para horarios óptimos". Entre semana a media mañana de
      // España, también después del cambio de hora (el servidor va en UTC).
      "a las 10:30 de España entre semana, en verano y en invierno": m.enHorarioDeAviso(new Date("2026-10-19T08:30:00Z"))
        && m.enHorarioDeAviso(new Date("2026-10-26T09:30:00Z")) && !m.enHorarioDeAviso(new Date("2026-10-26T08:30:00Z"))
        && !m.enHorarioDeAviso(new Date("2026-10-24T08:30:00Z")) && avisos.includes("!enHorarioDeAviso()"),
      "programado de lunes a viernes": leerFuente("scripts/vps/crontab.txt").includes("30 8,9 * * 1-5 /usr/bin/flock -n /tmp/avisos-carnes.lock"),
    };
    const malos = Object.entries(checks).filter(([, ok]) => !ok).map(([k]) => k);
    if (malos.length) console.log(`     ↳ ${malos.join(" · ")}`);
    return malos.length === 0;
  } catch (e) {
    console.log(`     ↳ no se pudo compilar: ${e.message?.slice(0, 100)}`);
    return false;
  } finally {
    for (const f of [entrada, salida]) { try { unlinkSync(f); } catch { /* da igual */ } }
  }
});

// LA VOZ DEL ENTREVISTADOR (18 oct 2026). Michel: "una voz relajada, agradable,
// que no sea tan autoritaria". Antes leía la voz que trajera cada móvil (en la
// app de Android, ninguna), cada respuesta llevaba "A mejorar" y una nota del 1
// al 10, y las preguntas no salían del CV.
test("entrevista: voz grabada para cada pregunta, tono que anima y preguntas según el CV", async () => {
  const { execFileSync } = await import("node:child_process");
  const { existsSync, unlinkSync, writeFileSync } = await import("node:fs");
  const entrada = ".sello-entrevista-entrada.ts", salida = ".sello-entrevista.cjs";
  try {
    writeFileSync(entrada, 'export { textosGrabados, sectorDePuestos, PREGUNTAS } from "./lib/entrevistas/preguntas";\nexport { partesDelFeedback } from "./lib/entrevistas/feedback";\n');
    execFileSync("npx", ["esbuild", entrada, "--bundle", "--format=cjs", "--platform=node", `--outfile=${salida}`, "--log-level=error"], { stdio: "pipe", shell: true });
    const m = await import(`../${salida}`);
    const grabado = JSON.parse(leerFuente("lib/entrevistas/voz-grabada.json") || "{}");
    const textos = m.textosGrabados();
    const sinAudio = textos.filter(t => !existsSync(`public/voz/entrevista/${t.id}.mp3`)).map(t => t.id);
    // Si alguien cambia una pregunta sin volver a grabarla, se oiría otra cosa.
    const desfasados = textos.filter(t => grabado[t.id] !== t.texto).map(t => t.id);
    const sector = (p) => m.sectorDePuestos([p]);
    const casos = [
      ["Camarera de pisos", "limpieza"], ["Camarero", "hosteleria"], ["Auxiliar de ayuda a domicilio", "cuidados"],
      ["Auxiliar de enfermería", "salud"], ["Mozo de almacén", "almacen"], ["Conductor de camión", "transporte"],
      ["Peón de obra", "construccion"], ["Operario de limpieza", "limpieza"], ["Dependienta", "comercio"],
    ];
    const malSector = casos.filter(([p, s]) => sector(p) !== s).map(([p]) => `${p} → ${sector(p)}`);
    const partes = m.partesDelFeedback("**BIEN:** Has dado un ejemplo.\nPULIR: Di cuánto tiempo.\nDILO ASI: «Llevé seis mesas a la vez.»");
    const ruta = leerFuente("app/api/entrevistas/feedback/route.ts");
    const pagina = leerFuente("app/app/entrevistas/page.tsx");
    const grabadora = leerFuente("components/VoiceInterview/VoiceRecorder.tsx");
    const checks = {
      [`cada frase tiene su audio (faltan: ${sinAudio.slice(0, 4).join(", ")})`]: sinAudio.length === 0,
      [`lo grabado es lo que se lee (desfasados: ${desfasados.slice(0, 4).join(", ")})`]: desfasados.length === 0,
      "cinco sectores nuevos": ["almacen", "limpieza", "construccion", "transporte", "cuidados"].every(s => m.PREGUNTAS[s]?.length >= 5),
      [`el sector sale del puesto (${malSector.join(" · ")})`]: malSector.length === 0,
      "las tres casillas se separan": partes?.bien === "Has dado un ejemplo." && partes?.diloAsi === "Llevé seis mesas a la vez.",
      "sin nota del 1 al 10 en cada respuesta": !ruta.includes("Puntuación") && ruta.includes("Sin notas ni puntuaciones") && ruta.includes("partesDelFeedback(feedback)"),
      "la pantalla usa la voz grabada, no la del móvil": pagina.includes("hablar(clips") && !pagina.includes("new SpeechSynthesisUtterance") && pagina.includes('fetch("/api/entrevistas/sector"'),
      "el micrófono se cierra al contestar y calla al entrevistador": grabadora.includes("if (disabled && escuchando) pararEscucha();") && pagina.includes("alEscuchar={() => parar()}"),
    };
    const malos = Object.entries(checks).filter(([, ok]) => !ok).map(([k]) => k);
    if (malos.length) console.log(`     ↳ ${malos.join(" · ")}`);
    return malos.length === 0;
  } catch (e) {
    console.log(`     ↳ no se pudo compilar: ${e.message?.slice(0, 100)}`);
    return false;
  } finally {
    for (const f of [entrada, salida]) { try { unlinkSync(f); } catch { /* da igual */ } }
  }
});

// AUDITORÍA PARA LAS ONG (19 oct 2026): los cuatro fuertes (CV, envíos,
// migración y cursos) tienen que entenderse sin ayuda y no decir nada falso.
test("los cuatro fuertes, claros y sin afirmaciones falsas (auditoría para las ONG)", async () => {
  const { execFileSync } = await import("node:child_process");
  const { existsSync, unlinkSync, writeFileSync } = await import("node:fs");
  const entrada = ".sello-ong-entrada.ts", salida = ".sello-ong.cjs";
  try {
    writeFileSync(entrada, 'export { leerIdiomas, escribirIdiomas } from "./components/cv/SelectorIdiomas";\n');
    execFileSync("npx", ["esbuild", entrada, "--bundle", "--format=cjs", "--platform=node", "--packages=external", "--tsconfig=tsconfig.json", "--jsx=automatic", `--outfile=${salida}`, "--log-level=error"], { stdio: "pipe", shell: true });
    const m = await import(`../${salida}`);
    const ida = (t) => m.escribirIdiomas(m.leerIdiomas(t));
    const cv = leerFuente("app/app/curriculum/Content.tsx");
    const envios = leerFuente("app/app/envios/page.tsx");
    const aupair = leerFuente("app/app/au-pair/page.tsx");
    const todo = ["app/app/buscar/page.tsx", "app/app/gusi/page.tsx"].map(leerFuente).join("\n");
    const checks = {
      "sin «uno entre 2.000» (no tenía fuente) ni «Contrato directo»": !/[">]\s*(CV propio, no )?[Uu]no entre 2\.000/.test(todo) && !todo.includes("Contrato directo"),
      "el CV enseña qué es cada campo": !cv.includes('className="sr-only" htmlFor="cv-') && !cv.includes('className="sr-only" htmlFor={`cv-'),
      "idiomas con nivel en palabras, sin romper los CV hechos": cv.includes("<SelectorIdiomas") && !cv.includes("Formato: Idioma:nivel (0-100)")
        && ida("Español:95, Inglés:60") === "Español:95, Inglés:60" && ida("Inglés B1, Francés:40") === "Inglés B1, Francés:40",
      "con el CV casi vacío, subir el PDF va lo primero": cv.includes("{pct < 50 && bloqueSubirPDF}") && !cv.includes("Completitud del CV"),
      "envíos: «Entregado» y «No llegó» con nombre y filtro": envios.includes('entregado: "Entregado"') && envios.includes('rebotado: "No llegó"')
        && envios.includes('estados: ["enviado", "entregado"]') && !envios.includes(">\n              Limpiar todo"),
      "contador de envíos en palabras": leerFuente("components/UsageCounter.tsx").includes("{enviosQuedan} quedan"),
      "au pair: sin «¡vuelve mañana!» con envíos por delante, país y no gentilicio, una sola casilla de fumador":
        !aupair.includes("disponible{auPairStats.disponibles !== 1 ? \"s\" : \"\"} hoy — ¡vuelve mañana!")
        && aupair.includes("nombrePaisEs(n.code)") && !aupair.includes("Fumador/a</span>"),
      "ofertas de cuidado de niños con su nombre y el salario en español": leerFuente("components/AuPairOfertasRecientes.tsx").includes('titulo: "Ofertas para cuidar niños"')
        && leerFuente("components/AuPairOfertasRecientes.tsx").includes("salarioLegible(o.salary)"),
      "pestañas de país con nombre también en el móvil": !leerFuente("app/app/emigrar/page.tsx").includes('<span className="hidden sm:inline">{t.label}</span>'),
      "plazas de tu provincia y el centro sin código interno": leerFuente("components/cursos/PlazasCurso.tsx").includes("if (!provinciaLista) return;")
        && leerFuente("components/cursos/PlazasCurso.tsx").includes("centroLegible(p.centro)"),
      "banderas también en Windows, con su autoría": leerFuente("app/layout.tsx").includes("<PolyfillBanderas />") && existsSync("public/fonts/banderas.woff2")
        && leerFuente("app/aviso-legal/page.tsx").includes("Twemoji"),
      "el aviso de cookies no tapa los botones": leerFuente("components/CookieBanner.tsx").includes("document.body.style.paddingBottom"),
    };
    const malos = Object.entries(checks).filter(([, ok]) => !ok).map(([k]) => k);
    if (malos.length) console.log(`     ↳ ${malos.join(" · ")}`);
    return malos.length === 0;
  } catch (e) {
    console.log(`     ↳ no se pudo compilar: ${e.message?.slice(0, 100)}`);
    return false;
  } finally {
    for (const f of [entrada, salida]) { try { unlinkSync(f); } catch { /* da igual */ } }
  }
});

// 19 oct 2026, Michel: dos entrevistas a la semana en el plan gratis ("si no
// nos cuesta créditos": la voz está grabada y el entrevistador va por el nivel
// gratuito), y "dejemos de atacar" a InfoJobs: se compara solo si lo preguntan.
test("plan gratis con 2 entrevistas a la semana, y sin atacar a la competencia", async () => {
  const { execFileSync } = await import("node:child_process");
  const { unlinkSync, writeFileSync } = await import("node:fs");
  const entrada = ".sello-cupo-entrada.ts", salida = ".sello-cupo.cjs";
  try {
    writeFileSync(entrada, 'export { semanaIso, RESPUESTAS_POR_SESION } from "./lib/entrevistas/cupo";\nexport { LIMITS } from "./lib/plan-limits";\n');
    execFileSync("npx", ["esbuild", entrada, "--bundle", "--format=cjs", "--platform=node", "--packages=external", "--tsconfig=tsconfig.json", `--outfile=${salida}`, "--log-level=error"], { stdio: "pipe", shell: true });
    const m = await import(`../${salida}`);
    const ruta = leerFuente("app/api/entrevistas/feedback/route.ts");
    const pantalla = leerFuente("app/app/entrevistas/page.tsx");
    const ataques = [
      ["app/app/gusi/page.tsx", "InfoJobs"], ["app/app/page.tsx", "InfoJobs / LinkedIn"], ["app/auth/login/page.tsx", "<span className=\"text-center\">InfoJobs / LinkedIn</span>"],
      ["app/app/bienvenida/BienvenidaClient.tsx", "alternativa real a InfoJobs"], ["app/empresas/page.tsx", "Sin depender de InfoJobs"], ["app/(home)/page.tsx", "ni se llegan a leer"],
    ].filter(([f, t]) => leerFuente(f).includes(t)).map(([f]) => f);
    const checks = {
      "gratis: 2 entrevistas a la semana; de pago: sin límite": m.LIMITS.free.entrevistasSemana === 2
        && ["esencial", "pro", "empresa"].every((p) => m.LIMITS[p].entrevistasSemana === null),
      "la semana empieza el lunes": m.semanaIso(new Date("2026-10-19T08:00:00Z")) === "2026-W43" && m.semanaIso(new Date("2026-10-25T20:00:00Z")) === "2026-W43"
        && m.semanaIso(new Date("2026-10-26T08:00:00Z")) === "2026-W44",
      "una entrevista no da para infinitas respuestas": m.RESPUESTAS_POR_SESION > 0 && m.RESPUESTAS_POR_SESION <= 15,
      "la respuesta gasta el cupo en vez de cerrar el simulador al plan gratis": ruta.includes("usarEntrevista(user.id, plan, sesion)") && !ruta.includes("está en los planes de pago"),
      "la pantalla abre una entrevista al empezar y enseña lo que queda": pantalla.includes("sesion: sesionActual") && pantalla.includes("Plan gratis: te ") && pantalla.includes("disabled={sinCupo}"),
      "precios dicen lo mismo": leerFuente("app/precios/page.tsx").includes("ensayos de entrevista con voz a la semana"),
      [`sin ataques a InfoJobs (${ataques.join(", ")})`]: ataques.length === 0,
      "Guzzi compara solo si se lo preguntan y sin hablar mal": leerFuente("lib/guzzi/prompts.ts").includes("No hables mal de InfoJobs"),
    };
    const malos = Object.entries(checks).filter(([, ok]) => !ok).map(([k]) => k);
    if (malos.length) console.log(`     ↳ ${malos.join(" · ")}`);
    return malos.length === 0;
  } catch (e) {
    console.log(`     ↳ no se pudo compilar: ${e.message?.slice(0, 100)}`);
    return false;
  } finally {
    for (const f of [entrada, salida]) { try { unlinkSync(f); } catch { /* da igual */ } }
  }
});

// Recorrido con una cuenta gratis nueva (19 oct 2026): la primera pantalla se
// veía vacía (la ruedita usaba "border-3", que Tailwind no tiene: borde 0) y el
// plan gratis no veía cuántos envíos le quedaban.
test("una cuenta gratis nueva ve que carga y cuántos envíos le quedan", () => {
  const ruedas = ["app/app/bienvenida/BienvenidaClient.tsx", "app/app/curriculum/Content.tsx", "app/app/perfil/page.tsx"]
    .filter((f) => /\bborder-3\b/.test(leerFuente(f)));
  const contador = leerFuente("components/UsageCounter.tsx");
  const checks = {
    [`ruedas de carga visibles (${ruedas.join(", ")})`]: ruedas.length === 0,
    "la bienvenida dice que está cargando": leerFuente("app/app/bienvenida/BienvenidaClient.tsx").includes("Preparando tu panel…"),
    "el contador sale también en el plan gratis, con lo que de verdad queda": !contador.includes('usage.plan === "free") return null')
      && contador.includes("Math.min(usage.envios.remainingDia"),
    "lista de envíos vacía dice que aún no hay": leerFuente("app/app/envios/page.tsx").includes("Todavía no has enviado ningún CV."),
  };
  const malos = Object.entries(checks).filter(([, ok]) => !ok).map(([k]) => k);
  if (malos.length) console.log(`     ↳ ${malos.join(" · ")}`);
  return malos.length === 0;
});

// CONFIRMAR EL CORREO (20 oct 2026). 56 de 206 cuentas sin confirmar. Tras
// registrarse salía "¡Cuenta creada!" con un check y el botón grande era "Ir al
// login"; había correos con erratas (gmaill.com, gail.com) y nadie recordaba
// nada a quien no confirmaba. Michel: que se mande solo a quien le falta.
test("confirmar el correo: lo que falta en grande, erratas avisadas y un recordatorio que no caduca", async () => {
  const { execFileSync } = await import("node:child_process");
  const { unlinkSync, writeFileSync } = await import("node:fs");
  const entrada = ".sello-confirmar-entrada.ts", salida = ".sello-confirmar.cjs";
  try {
    writeFileSync(entrada, 'export { sugerenciaCorreo } from "./lib/auth/sugerencia-correo";\nexport { enlaceConfirmar, firmaConfirmarValida } from "./lib/auth/confirmar-correo";\n');
    execFileSync("npx", ["esbuild", entrada, "--bundle", "--format=cjs", "--platform=node", "--packages=external", "--tsconfig=tsconfig.json", `--outfile=${salida}`, "--log-level=error"], { stdio: "pipe", shell: true });
    const m = await import(`../${salida}`);
    // La firma lee el secreto del entorno: se pone y se quita sin esperar a nada,
    // así ninguna otra prueba lo ve.
    const antes = process.env.ALERTS_SECRET;
    process.env.ALERTS_SECRET = "secreto-del-sello";
    const id = "0b5e6c1a-2f4d-4c8e-9a7b-3d2e1f0a9b8c", otro = "1c6f7d2b-3a5e-4d9f-8b8c-4e3f2a1b0c9d";
    const t = new URL(m.enlaceConfirmar(id)).searchParams.get("t");
    const firmas = m.firmaConfirmarValida(id, t) && !m.firmaConfirmarValida(otro, t) && !m.firmaConfirmarValida(id, t.slice(0, -1) + "x");
    if (antes === undefined) delete process.env.ALERTS_SECRET; else process.env.ALERTS_SECRET = antes;

    const recordar = leerFuente("app/api/auth/recordar-confirmacion/route.ts");
    const confirmar = leerFuente("app/api/auth/confirmar/route.ts");
    const smtp = leerFuente("lib/email/smtp-sender.ts");
    const correo = smtp.slice(smtp.indexOf("export async function sendConfirmarCorreoEmail"), smtp.indexOf("// ─── Bienvenida que llegó tarde"));
    const registro = leerFuente("app/auth/registro/page.tsx");
    const checks = {
      "«¿Querías decir…?» con las erratas vistas": m.sugerenciaCorreo("ana@gmaill.com") === "ana@gmail.com" && m.sugerenciaCorreo("ana@gail.com") === "ana@gmail.com"
        && m.sugerenciaCorreo("ana@gmail.es") === "ana@gmail.com" && m.sugerenciaCorreo("ana@hotmial.com") === "ana@hotmail.com",
      "y nada con los que existen": m.sugerenciaCorreo("ana@hotmail.es") === null && m.sugerenciaCorreo("ana@mail.com") === null
        && m.sugerenciaCorreo("ana@live.fr") === null && m.sugerenciaCorreo("ana@gmail.com") === null,
      "el enlace del correo va firmado y solo vale para esa cuenta": firmas,
      "tras registrarse, lo que falta en grande y sin «Ir al login»": registro.includes("Confirma tu correo") && !/>\s*¡Cuenta creada!/.test(registro)
        && !registro.includes("Ir al login") && registro.includes("Corrígelo") && registro.includes("sugerenciaCorreo(email)"),
      "el botón solo sirve sin confirmar, con enlace recién hecho": confirmar.includes("email_confirmed_at) return alLogin")
        && confirmar.includes('generateLink({ type: "magiclink"')
        // 22 oct 2026: se canjea en el servidor (en el navegador, el reintento de
        // Supabase gastaba el enlace y salía "Algo no fue bien" con la cuenta dentro).
        && confirmar.includes("publico.auth.verifyOtp(") && confirmar.includes("/auth/callback#") && !confirmar.includes("/auth/callback?token_hash=")
        && leerFuente("app/auth/callback/page.tsx").includes("if (error && !(await supabase.auth.getSession()).data.session)"),
      "recordatorio: sin confirmar, de 1 a 30 días, una vez y solo si salió": recordar.includes("!u.email_confirmed_at") && recordar.includes("dias >= 1 && dias <= 30")
        && recordar.includes("!u.app_metadata?.recordatorio_confirmar_en")
        && recordar.indexOf("if (!salio) continue;") > 0 && recordar.indexOf("if (!salio) continue;") < recordar.indexOf("recordatorio_confirmar_en: new Date"),
      "a media mañana entre semana y nunca a cuentas de prueba": recordar.includes("!enHorarioDeAviso()") && recordar.includes("resend\\.dev")
        && leerFuente("scripts/vps/crontab.txt").includes("45 8,9 * * 1-5 /usr/bin/flock -n /tmp/recordar-confirmacion.lock"),
      // Las ofertas piden entrar, y sin confirmar no se puede: el único enlace es el botón.
      "el correo no se come el cupo y su único enlace es el botón": correo.includes("puedeEsperar: true") && !correo.includes("x.url") && correo.includes("params.enlace"),
      "el del primer día ya no va a quien no puede entrar": leerFuente("app/api/onboarding/recordatorios/route.ts").includes("!u.email_confirmed_at) continue;"),
    };
    const malos = Object.entries(checks).filter(([, ok]) => !ok).map(([k]) => k);
    if (malos.length) console.log(`     ↳ ${malos.join(" · ")}`);
    return malos.length === 0;
  } catch (e) {
    console.log(`     ↳ no se pudo compilar: ${e.message?.slice(0, 100)}`);
    return false;
  } finally {
    for (const f of [entrada, salida]) { try { unlinkSync(f); } catch { /* da igual */ } }
  }
});

// VIENE DE EMIGRAR (21 oct 2026). "Ver todas las ofertas en Australia" ponía
// Tudela (la ciudad del perfil) en el "¿Dónde?" con la bandera de Australia
// debajo; "Japón" en el "¿Dónde?" daba camareros de Sevilla (se buscaba como
// ciudad y se caía a las APIs externas, que son de España); todo Estados Unidos
// tardaba 16 s y salían ofertas españolas. Y "Lo que he enviado" parpadeaba:
// cada 30 s la rueda tapaba la lista entera.
test("emigrar → ofertas: el país del que vienes, nunca España por detrás, y envíos sin parpadeo", async () => {
  const { execFileSync } = await import("node:child_process");
  const { unlinkSync, writeFileSync } = await import("node:fs");
  const entrada = ".sello-pais-entrada.ts", salida = ".sello-pais.cjs";
  try {
    writeFileSync(entrada, 'export { paisPorNombre } from "./lib/paises";\n');
    execFileSync("npx", ["esbuild", entrada, "--bundle", "--format=cjs", "--platform=node", "--packages=external", "--tsconfig=tsconfig.json", `--outfile=${salida}`, "--log-level=error"], { stdio: "pipe", shell: true });
    const m = await import(`../${salida}`);
    const buscar = leerFuente("app/app/buscar/page.tsx");
    const api = leerFuente("app/api/jobs/search/route.ts");
    const envios = leerFuente("components/CVSenderDashboard.tsx");
    const checks = {
      "reconoce el país escrito como sea": m.paisPorNombre("Japón") === "JP" && m.paisPorNombre("japon") === "JP" && m.paisPorNombre("Inglaterra") === "UK"
        && m.paisPorNombre("EE.UU.") === "US" && m.paisPorNombre("Australia") === "AU",
      "y una ciudad no es un país": m.paisPorNombre("Tudela") === null && m.paisPorNombre("Paris") === null && m.paisPorNombre("") === null,
      "viniendo de otro país no se pone la ciudad del perfil": buscar.includes("if (paisDeFuera) return;") && buscar.includes("useState(ubicacionInicial)"),
      "y se busca solo con los valores en la llamada, no con el formulario": buscar.includes("buscar(undefined, { keyword: urlKeyword, ubicacion: ubicacionInicial })") && !buscar.includes("form.requestSubmit()"),
      "la bandera a mano arrastra el «¿Dónde?»": buscar.includes("onCambiarPais={elegirPaisAMano}"),
      "el Jooble español solo con España": buscar.includes('paisParaBuscar !== "ES" ? Promise.resolve([])'),
      "la API busca en todo el país escrito": api.includes("const paisEscrito = paisPorNombre(location);"),
      "fuera de España nunca las APIs españolas": (api.match(/if \(!externasValen\)/g) || []).length === 2,
      "todo un país grande, por fecha y con tope": api.includes('ORDER BY "createdAt" DESC') && api.includes("masDe: true"),
      "lo enviado se refresca sin tapar la lista": envios.includes("setInterval(() => void loadData(true), 30_000)") && envios.includes("if (!enSegundoPlano) { setLoading(true); setError(null); }"),
    };
    const malos = Object.entries(checks).filter(([, ok]) => !ok).map(([k]) => k);
    if (malos.length) console.log(`     ↳ ${malos.join(" · ")}`);
    return malos.length === 0;
  } catch (e) {
    console.log(`     ↳ no se pudo compilar: ${e.message?.slice(0, 100)}`);
    return false;
  } finally {
    for (const f of [entrada, salida]) { try { unlinkSync(f); } catch { /* da igual */ } }
  }
});

// INVITAR A UN AMIGO (21 oct 2026). Solo el plan Pro tenía código y no había
// nadie de pago: 0 invitaciones en la historia. La página no decía qué se
// ganaba, y el "+10 CVs" que se apuntaba no lo miraba el límite de envíos.
// Lo aprobado por Michel: +5 envíos y +1 foto por amigo que confirma, el amigo
// empieza con +5, hasta 10 al mes, y los extras se gastan al acabarse el plan.
test("invitar a un amigo: invita cualquiera, se dice qué se gana y los extras se usan de verdad", async () => {
  const { execFileSync } = await import("node:child_process");
  const { unlinkSync, writeFileSync } = await import("node:fs");
  const entrada = ".sello-referidos-entrada.ts", salida = ".sello-referidos.cjs";
  try {
    writeFileSync(entrada, 'export { ENVIOS_POR_AMIGO, FOTOS_POR_AMIGO, ENVIOS_DEL_INVITADO, AMIGOS_CON_PREMIO_AL_MES } from "./lib/referidos/premios";\n');
    execFileSync("npx", ["esbuild", entrada, "--bundle", "--format=cjs", "--platform=node", "--packages=external", "--tsconfig=tsconfig.json", `--outfile=${salida}`, "--log-level=error"], { stdio: "pipe", shell: true });
    const m = await import(`../${salida}`);
    const premios = leerFuente("lib/referidos/premios.ts");
    const limite = leerFuente("lib/cv-sender/rate-limiter.ts");
    const ruta = leerFuente("app/api/referidos/route.ts");
    const pagina = leerFuente("app/app/referidos/Content.tsx");
    const planes = leerFuente("lib/plan-limits.ts");
    const extra = limite.slice(limite.indexOf("async function conEnvioExtra"), limite.indexOf("// ─── Funciones Principales"));
    const checks = {
      "lo aprobado: 5 envíos y 1 foto por amigo, 5 para el amigo, 10 al mes": m.ENVIOS_POR_AMIGO === 5 && m.FOTOS_POR_AMIGO === 1 && m.ENVIOS_DEL_INVITADO === 5 && m.AMIGOS_CON_PREMIO_AL_MES === 10,
      "invita cualquiera, también el plan gratis": !planes.includes("codigosPromocionales: false") && !ruta.includes("status: 402"),
      "la página dice qué se gana, con las mismas cifras": pagina.includes("+5 envíos de CV y +1 foto con la cámara") && pagina.includes("Empieza con 5 envíos de CV extra") && !pagina.includes("del plan Pro"),
      "y quien llega invitado lo ve al registrarse": leerFuente("app/auth/registro/page.tsx").includes("Vienes invitado"),
      "bienvenida y canjear reparten igual": leerFuente("lib/onboarding/dar-bienvenida.ts").includes("aplicarReferido(supabaseAdmin, userId, ref)") && ruta.includes("aplicarReferido(supabaseAdmin, user.id, codigo)")
        && !leerFuente("lib/onboarding/dar-bienvenida.ts").includes("referral_credits"),
      "el código a mano, solo para cuentas nuevas": ruta.includes("30 * 86400000"),
      "los extras entran en los tres topes del plan": (limite.match(/return conEnvioExtra\(userId, companyEmail, \{/g) || []).length === 3,
      "uno por empresa y día, y nunca por un envío que luego se rechaza": extra.indexOf("canSendToCompany") > 0 && extra.indexOf("canSendToCompany") < extra.indexOf("gastarEnvioExtra(userId, companyEmail)")
        && premios.includes("FOR UPDATE") && premios.includes("envio:${companyEmail.trim().toLowerCase()}:${new Date().toISOString().slice(0, 10)}"),
      "el saldo nunca baja de cero": premios.includes("CHECK (envios_extra >= 0)") && premios.includes("fotos_extra > 0"),
      "la cámara usa las fotos ganadas": leerFuente("app/api/gusi/analyze-image/route.ts").includes("gastarFotoExtra(userId)"),
      "se borran al borrar la cuenta": leerFuente("lib/cuenta/borrar-datos.ts").includes('premios_usuario: "user_id"'),
    };
    const malos = Object.entries(checks).filter(([, ok]) => !ok).map(([k]) => k);
    if (malos.length) console.log(`     ↳ ${malos.join(" · ")}`);
    return malos.length === 0;
  } catch (e) {
    console.log(`     ↳ no se pudo compilar: ${e.message?.slice(0, 100)}`);
    return false;
  } finally {
    for (const f of [entrada, salida]) { try { unlinkSync(f); } catch { /* da igual */ } }
  }
});

// LAS FOTOS DEL MÓVIL (21 oct 2026, antes de una presentación). La foto del CV
// no podía pasar de 3 MB y la de au pair de 5; una foto del móvil pesa 3-6 MB
// y salía "La imagen no puede superar 3 MB". Ahora se reducen antes de subir.
test("fotos del móvil: se reducen antes de subirlas al CV y a au pair", () => {
  const util = leerFuente("lib/imagen/foto-para-subir.ts");
  const cv = leerFuente("app/app/curriculum/Content.tsx");
  const au = leerFuente("app/app/au-pair/page.tsx");
  const reduceAntes = (src, tope) => src.indexOf("await fotoParaSubir(original)") > 0
    && src.indexOf("await fotoParaSubir(original)") < src.indexOf(tope);
  const checks = {
    "la utilidad deja la foto en JPEG de 1.200 px con fondo blanco": util.includes("ladoMax = 1200") && util.includes('lienzo.toBlob(ok, "image/jpeg", calidad)') && util.includes('ctx.fillStyle = "#ffffff"'),
    "el CV reduce antes de mirar los 3 MB": reduceAntes(cv, "if (file.size > 3 * 1024 * 1024)"),
    "au pair reduce antes de mirar los 5 MB": reduceAntes(au, "if (file.size > 5 * 1024 * 1024)"),
  };
  const malos = Object.entries(checks).filter(([, ok]) => !ok).map(([k]) => k);
  if (malos.length) console.log(`     ↳ ${malos.join(" · ")}`);
  return malos.length === 0;
});

// LA RESPUESTA A UNA FOTO, A LA VISTA (21 oct 2026, antes de enseñar la cámara
// en una charla). En el móvil la página de Guzzi crece con la conversación y lo
// que se desplaza es la ventana; solo se bajaba la caja de mensajes, y tras una
// foto la respuesta quedaba 4.500 px por debajo de lo que se veía.
test("Guzzi baja al último mensaje también en el móvil, y otra vez al cargar una foto", () => {
  const c = leerFuente("components/GusiChat.tsx");
  return c.includes('if (modoIncrustado) finRef.current?.scrollIntoView({ block: "end" });')
    && c.includes('caja.addEventListener("load", alCargar, true);')
    && c.includes('<div ref={finRef} aria-hidden="true" />')
    // La página sigue creciendo (con altura fija el iPhone tapaba la campana).
    && leerFuente("app/app/gusi/page.tsx").includes('minHeight: "100dvh"');
});

// LOS AVISOS, POR EL CV (22 oct 2026). Alumnos de una charla con CV de camarero
// o dependienta recibían "bastantes ofertas" de almacén: la alerta que crea la
// bienvenida no tiene palabra y mandaba todo lo nuevo de su ciudad. Y en la
// lectura del CV, "5 años de experiencia" era un puesto, "Full Stack" buscaba
// "full" y "Ayudante de cocina" recibía "Vendedor/a experto/a en cocinas".
test("avisos y recomendaciones salen del CV: sin palabra, por sus puestos; sin CV ni oficio, nada al azar", async () => {
  const { execFileSync } = await import("node:child_process");
  const { unlinkSync } = await import("node:fs");
  const salida = ".sello-puestos-cv2.cjs";
  try {
    execFileSync("npx", ["esbuild", "lib/job-search/puestos-del-cv.ts", "--bundle", "--format=cjs", "--platform=node",
      `--outfile=${salida}`, "--log-level=error"], { stdio: "pipe", shell: true });
    const m = await import(`../${salida}?${Date.now()}`);
    const dev = m.patronesDelCv({ subtitulo: "Desarrollador Full Stack · 5 años de experiencia", experiencia: [{ puesto: "Full Stack Developer", fechas: "2020 - 2022" }] });
    const farmacia = m.patronesDelCv({ subtitulo: "TÉCNICA DE FARMACIA", experiencia: [{ puesto: "ATENCIÓN AL PÚBLICO" }, { puesto: "PRODUCTOS NATURALES" }] });
    const cocina = { subtitulo: "Ayudante de cocina" };
    const alertas = leerFuente("app/api/push/send-alerts/route.ts");
    const checks = {
      "«5 años de experiencia» y «Full» no son un oficio": !dev.includes("anos") && !dev.includes("full") && dev.includes("stack") && dev.includes("desarrollad"),
      "«Atención al público» y «Productos» tampoco": farmacia.join() === "farmaci",
      "a quien es de cocina no le salen vendedores de cocinas": /cocinas/.test(m.exclusionesDelCv(cocina, m.patronesDelCv(cocina)) || "")
        && m.exclusionesDelCv({ subtitulo: "Montador de cocinas" }, ["montad", "cocin"]) === null,
      "la alerta sin palabra busca por los puestos del CV": alertas.includes("const puesto = a.keyword.trim() ? null : puestoDeLaAlerta(a.user_id);")
        && alertas.includes("keywordClause = `(title ~* $${bpIdx}"),
      "sin CV, por el oficio del registro": alertas.includes("if (!patrones.length && oficio) { cv = { subtitulo: oficio }; patrones = patronesDelCv(cv); }"),
      "sin CV ni oficio, nada al azar (tampoco del inventario)": alertas.includes('keywordClause = "FALSE";') && alertas.includes("const elegible = !sinNada &&"),
    };
    const malos = Object.entries(checks).filter(([, ok]) => !ok).map(([k]) => k);
    if (malos.length) console.log(`     ↳ ${malos.join(" · ")}`);
    return malos.length === 0;
  } catch (e) {
    console.log(`     ↳ no se pudo probar: ${e.message?.slice(0, 100)}`);
    return false;
  } finally {
    try { unlinkSync(salida); } catch { /* da igual */ }
  }
});

// LA PLANTILLA SENCILLA (22 oct 2026). A los alumnos de los cursos les piden
// dejar colores y adornos y mandar el CV de siempre: blanco y negro,
// "CURRÍCULUM VITAE" arriba, datos personales con etiqueta, foto al lado y
// apartados subrayados con viñetas. Va la primera, como recomendada.
test("plantilla Sencilla: la primera y recomendada, en blanco y negro y traducida", async () => {
  const { execFileSync } = await import("node:child_process");
  const { unlinkSync, writeFileSync } = await import("node:fs");
  const entrada = ".sello-sencilla-entrada.ts", salida = ".sello-sencilla.cjs";
  try {
    writeFileSync(entrada, 'export { generarCV, LISTA_PLANTILLAS, PLANTILLAS } from "./lib/cv-generator/plantillas";\nexport { CV_EJEMPLO } from "./lib/cv-generator/ejemplo";\n');
    execFileSync("npx", ["esbuild", entrada, "--bundle", "--format=cjs", "--platform=node", "--tsconfig=tsconfig.json", `--outfile=${salida}`, "--log-level=error"], { stdio: "pipe", shell: true });
    const m = await import(`../${salida}?${Date.now()}`);
    const es = m.generarCV({ ...m.CV_EJEMPLO, templateId: "sencilla", accentColor: "#e11d48" });
    const en = m.generarCV({ ...m.CV_EJEMPLO, templateId: "sencilla", idioma: "en" });
    const checks = {
      "es la primera y la recomendada": m.LISTA_PLANTILLAS[0]?.id === "sencilla" && m.PLANTILLAS.sencilla.recomendada === true,
      "título, datos personales con etiqueta y foto": es.includes(">Currículum vitae<") && es.includes("<b>Nombre y apellidos</b>:") && es.includes('class="foto"'),
      "en blanco y negro: el color elegido no entra": !es.includes("#e11d48"),
      "títulos y etiquetas traducidos": en.includes(">Curriculum Vitae<") && en.includes(">Personal details<") && en.includes("<b>Full name</b>:") && !en.includes(">Datos personales<"),
      "en el móvil se ve aunque las demás estén plegadas": leerFuente("app/app/curriculum/Content.tsx").includes("!activa && !p.recomendada && !verPlantillas"),
    };
    const malos = Object.entries(checks).filter(([, ok]) => !ok).map(([k]) => k);
    if (malos.length) console.log(`     ↳ ${malos.join(" · ")}`);
    return malos.length === 0;
  } catch (e) {
    console.log(`     ↳ no se pudo probar: ${e.message?.slice(0, 100)}`);
    return false;
  } finally {
    for (const f of [entrada, salida]) { try { unlinkSync(f); } catch { /* da igual */ } }
  }
});

// PRIVACIDAD (superauditoría del 22 oct 2026). La política decía que los datos
// solo iban a Supabase, Stripe y Resend, con los servidores "en el EEE o con
// garantías equivalentes"; Guzzi va por OpenAI, el CV por Groq, la cámara por
// OpenAI y Google. Un script llevaba escrita una contraseña de Redis (antigua)
// en este repositorio público, y el borrado de cuenta se dejaba la tabla "User"
// del sistema de cuentas anterior.
test("privacidad: la política nombra a quien recibe datos, el borrado es completo y no hay contraseñas en scripts", async () => {
  const politica = leerFuente("app/privacidad/page.tsx");
  const { execFileSync } = await import("node:child_process");
  // git grep sin resultados sale con código 1: eso es lo bueno.
  let contrasenasEnScripts = "";
  try {
    contrasenasEnScripts = execFileSync("git", ["grep", "-nIE", "(REDIS_PASS|PASSWORD|PASS)=['\"][A-Za-z0-9]{8,}['\"]", "--", "scripts"], { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch { /* sin resultados */ }
  const checks = {
    "nombra a todos los que reciben datos": ["OpenAI", "Groq", "Google", "Resend", "Supabase", "Stripe", "Hostinger", "RevenueCat", "WhatsApp"].every((n) => politica.includes(n)),
    "no nombra a DeepSeek ni a China (retirado el 23 oct 2026)": !/DeepSeek|China/.test(politica),
    "no dice que solo se comparten con tres": !/únicamente con estos proveedores/.test(politica) && !/Espacio Económico Europeo o cuentan con garantías/.test(politica),
    "dice que hay datos que salen de la UE": politica.includes("salen del Espacio Económico Europeo"),
    "cuenta las fotos, la ubicación y las conversaciones": /miniatura/.test(politica) && /Ubicación:/.test(politica) && /Conversaciones con Guzzi/.test(politica),
    "el borrado de cuenta quita la tabla antigua User": leerFuente("lib/cuenta/borrar-datos.ts").includes(`DELETE FROM "User" WHERE lower(email) = $1`),
    "ninguna contraseña escrita en los scripts": contrasenasEnScripts === "",
  };
  const malos = Object.entries(checks).filter(([, ok]) => !ok).map(([k]) => k);
  if (malos.length) console.log(`     ↳ ${malos.join(" · ")}`);
  return malos.length === 0;
});

// POR QUÉ SE SUGIERE (superauditoría del 22 oct 2026). La portada decía "Ofertas
// según tu CV" sin decir de qué puestos, y con CV pero sin ofertas cerca dejaba
// el hueco vacío. Los avisos decían "3 nuevas ofertas para ti" sin decir de qué.
test("las sugerencias dicen de qué puesto del CV salen", () => {
  const portada = leerFuente("app/app/bienvenida/BienvenidaClient.tsx");
  const alertas = leerFuente("app/api/push/send-alerts/route.ts");
  const checks = {
    "la API de la portada manda los puestos": leerFuente("app/api/dashboard/route.ts").includes("puestosRecomendadas = puestosDelCv(cvs[0]?.form_data ?? null).slice(0, 3);"),
    "la portada dice de qué puestos salen": portada.includes("De lo que has trabajado ({puestosRecomendadas.join"),
    "y si no hay nada cerca, lo dice": portada.includes('estadoRecomendadas === "sin-ofertas"') && portada.includes("Ahora no hay ofertas de lo tuyo"),
    "el aviso nombra el puesto del CV": alertas.includes("que: puestosDelCv(cv)[0] || oficio") && alertas.includes('const deQue = !alerta.keyword.trim() && puesto?.que'),
    "y el correo y el enlace usan ese puesto": alertas.includes("keyword: palabraAviso,") && alertas.includes("encodeURIComponent(palabraAviso)"),
  };
  const malos = Object.entries(checks).filter(([, ok]) => !ok).map(([k]) => k);
  if (malos.length) console.log(`     ↳ ${malos.join(" · ")}`);
  return malos.length === 0;
});

// LA WEB PÚBLICA, RECORRIDA ENTERA (22 oct 2026): las 208 direcciones del mapa
// del sitio responden y tienen título y canonical, pero en "trabajar en" con
// tildes la canonical salía en minúsculas ya codificada (%c3%bc frente al
// %C3%BC del mapa), y /cookies heredaba el título de la portada.
test("web pública: canonical igual que el mapa del sitio y títulos propios", () => {
  const pagina = leerFuente("app/trabajar-en/[pais]/[keyword]/page.tsx");
  return pagina.includes("encodeURIComponent(decodeURIComponent(keyword).toLowerCase())") && !pagina.includes("${keyword.toLowerCase()}")
    && leerFuente("app/cookies/layout.tsx").includes('title: "Política de cookies — BuscayCurra"');
});

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
