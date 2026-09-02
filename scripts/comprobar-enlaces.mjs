/**
 * Comprueba por HTTP todos los enlaces que publicamos como «oficiales».
 *
 * POR QUÉ EXISTE. Se descubrió comprobándolos por primera vez: de los 200
 * enlaces de lib/primeros-pasos.ts, 85 estaban rotos. Entre ellos, la web de la
 * agencia de empleo alemana, la de inmigración noruega, la del número fiscal
 * italiano y la del visado de vacaciones y trabajo neozelandés. Es decir, justo
 * los que alguien pulsa cuando ya ha decidido mudarse de país.
 *
 * Nadie los había roto: los ministerios reorganizan sus webs cada dos por tres y
 * los enlaces se pudren solos. Por eso esto tiene que poder ejecutarse cuando
 * uno quiera, y no depender de que a alguien se le ocurra mirar.
 *
 *   node scripts/comprobar-enlaces.mjs            → todos los ficheros
 *   node scripts/comprobar-enlaces.mjs --oficiales → solo webs de gobierno
 *   node scripts/comprobar-enlaces.mjs --rotos     → solo lo que falla
 */
import { readFileSync } from "node:fs";
import { request as peticionHttps } from "node:https";

const FICHEROS = [
  "lib/primeros-pasos.ts",
  "lib/destinos/requisitos.ts",
  "lib/au-pair/puedes-ir.ts",
  "lib/au-pair/derechos.ts",
  "lib/cursos/papeles.ts",
  "lib/cursos/acreditacion.ts",
  "lib/emigrar/paro-europeo.ts",
  "lib/cv/por-pais.ts",
];

const AGENTE =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

/** ¿Es la web de una administración pública? Son las que no pueden fallar. */
function esOficial(url) {
  return /\.gov(\.[a-z]{2})?\/|\.gob\.|\.gouv\.|\.go\.jp|\.govt\.nz|gov\.uk|europa\.eu|\.admin\.ch|\.gv\.at|\.overheid\.nl|government\.nl|arbeitsagentur|migrationsverket|nyidanmark|skatteetaten|helsenorge|agenziaentrate|make-it-in-germany|irishimmigration|migri\.fi|udi\.no|ind\.nl|aima\.gov|dvv\.fi|seg-social|sepe\.es|inclusion\.gob|ssa\.gov|ato\.gov|ird\.govt/i.test(url);
}

const soloOficiales = process.argv.includes("--oficiales");
const soloRotos = process.argv.includes("--rotos");

const encontrados = new Map(); // url -> fichero donde aparece
for (const f of FICHEROS) {
  let texto;
  try {
    texto = readFileSync(f, "utf8");
  } catch {
    continue;
  }
  for (const m of texto.matchAll(/"(https?:\/\/[^"\s]+)"/g)) {
    if (!encontrados.has(m[1])) encontrados.set(m[1], f);
  }
}

let urls = [...encontrados.keys()];
if (soloOficiales) urls = urls.filter(esOficial);

console.log(`Comprobando ${urls.length} enlaces${soloOficiales ? " de administraciones públicas" : ""}.\n`);

/** Algunos servidores no mandan el certificado intermedio; el navegador sí entra. */
function reintentarSinVerificarCadena(url) {
  return new Promise(resolve => {
    const req = peticionHttps(url, { method: "GET", rejectUnauthorized: false, timeout: 20000 },
      res => { res.destroy(); resolve(res.statusCode); });
    req.on("error", () => resolve(null));
    req.on("timeout", () => { req.destroy(); resolve(null); });
    req.end();
  });
}

async function comprobar(url) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 20000);
    const res = await fetch(url, {
      redirect: "follow",
      signal: ctrl.signal,
      headers: { "User-Agent": AGENTE, Accept: "text/html,application/xhtml+xml,*/*", "Accept-Language": "es-ES,es;q=0.9,en;q=0.8" },
    });
    clearTimeout(t);
    return { estado: res.status, destino: res.url !== url ? res.url : null };
  } catch (e) {
    if (e?.cause?.code === "UNABLE_TO_VERIFY_LEAF_SIGNATURE") {
      const c = await reintentarSinVerificarCadena(url);
      if (c && c < 400) return { estado: c, nota: "certificado intermedio ausente; en navegador entra" };
    }
    return { estado: 0, nota: String(e?.cause?.code || e.message || e).slice(0, 45) };
  }
}

const rotos = [];
const dudosos = [];
let i = 0;

for (const url of urls) {
  const { estado, destino, nota } = await comprobar(url);
  i++;

  // 403/405/429 casi siempre es el cortafuegos anti-robots, no un enlace muerto.
  // 0 suele ser un corte de red o que nos han limitado por hacer muchas seguidas.
  const vivo = estado >= 200 && estado < 400;
  const bloqueo = estado === 403 || estado === 405 || estado === 429;
  const marca = vivo ? "✓" : bloqueo ? "~" : estado === 0 ? "?" : "✗";

  if (!vivo && !bloqueo) {
    (estado === 0 ? dudosos : rotos).push({ url, estado, fichero: encontrados.get(url) });
  }
  if (soloRotos && (vivo || bloqueo)) continue;

  console.log(`  ${marca} ${String(estado || "—").padEnd(4)} ${url}`);
  if (destino) console.log(`         → ${destino}`);
  if (nota) console.log(`         ${nota}`);
}

console.log(`\n─────────────────────────────────────────────`);
console.log(`Comprobados: ${i}`);
console.log(`Rotos:       ${rotos.length}`);
console.log(`Sin respuesta (puede ser red o límite de peticiones): ${dudosos.length}`);

const oficialesRotos = rotos.filter(r => esOficial(r.url));
if (oficialesRotos.length) {
  console.log(`\n⚠ ${oficialesRotos.length} DE ADMINISTRACIÓN PÚBLICA. Son los que hay que arreglar primero:`);
  for (const r of oficialesRotos) console.log(`   ${r.estado}  ${r.url}\n        (${r.fichero})`);
}

process.exit(oficialesRotos.length ? 1 : 0);
