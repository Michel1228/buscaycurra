/**
 * Comprueba que la información por país de destino es coherente y que sus
 * enlaces oficiales siguen vivos.
 *
 * Hace tres cosas, y las tres nacieron de un fallo real:
 *
 *   1. Que las 26 fichas cubran los 26 destinos que ofrece la aplicación.
 *   2. Que los códigos de país cuadren entre listas. El fallo GB/UK enseñó que
 *      un código mal escrito no rompe nada visible: simplemente deja de
 *      aplicarse a alguien, en silencio y para siempre.
 *   3. Que los enlaces oficiales respondan. Un enlace muerto manda a alguien que
 *      está a punto de mudarse de país a una página que no existe.
 *
 *   node scripts/comprobar-destinos.mjs
 */
import { readFileSync } from "node:fs";
import { request as peticionHttps } from "node:https";

const AGENTE =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

const fuente = readFileSync("lib/destinos/requisitos.ts", "utf8");
const paises = readFileSync("lib/paises.ts", "utf8");
const nacs = readFileSync("lib/origen/nacionalidades.ts", "utf8");
const movil = readFileSync("lib/origen/movilidad.ts", "utf8");

let problemas = 0;

// ── 1. Cobertura ────────────────────────────────────────────────────────────
const esperados = [...new Set([...paises.matchAll(/^  ([A-Z]{2}): \{/gm)].map(m => m[1]))];
const conFicha = [...new Set(
  [...fuente.matchAll(/codigo: "([A-Z]{2})"|destinoUE\("([A-Z]{2})"/g)].map(m => m[1] || m[2]),
)];

const faltan = esperados.filter(c => !conFicha.includes(c));
const sobran = conFicha.filter(c => !esperados.includes(c));

console.log("COBERTURA");
console.log(`  destinos que ofrecemos: ${esperados.length}`);
console.log(`  destinos con ficha:     ${conFicha.length}`);
if (faltan.length) { console.log(`  ⚠ SIN FICHA: ${faltan.join(", ")}`); problemas++; }
if (sobran.length) { console.log(`  ⚠ ficha de un país que no ofrecemos: ${sobran.join(", ")}`); problemas++; }
if (!faltan.length && !sobran.length) console.log("  ✓ los 26 destinos tienen ficha");

// ── 2. Coherencia de códigos ────────────────────────────────────────────────
const bloque = movil.match(/LIBRE_CIRCULACION = new Set\(\[([\s\S]*?)\]\)/);
const libres = new Set([...(bloque?.[1] || "").matchAll(/"([A-Z]{2})"/g)].map(m => m[1]));

const deLaUE = [...nacs.matchAll(/codigo: "([A-Z]{2})"[^}]*?grupo: "ue"/g)].map(m => m[1]);
const conEspana = [...deLaUE, "ES"];

const ueSinLibre = conEspana.filter(c => !libres.has(c));
const libreSinUE = [...libres].filter(c => !conEspana.includes(c));

const nacCodigos = new Set([...nacs.matchAll(/codigo: "([A-Z]{2})"/g)].map(m => m[1]));
const destinoNoElegible = esperados.filter(c => !nacCodigos.has(c));

console.log("\nCOHERENCIA DE CÓDIGOS");
if (ueSinLibre.length) { console.log(`  ⚠ marcados como UE pero sin libre circulación: ${ueSinLibre.join(", ")}`); problemas++; }
if (libreSinUE.length) { console.log(`  ⚠ con libre circulación pero no elegibles como nacionalidad: ${libreSinUE.join(", ")}`); problemas++; }
if (!ueSinLibre.length && !libreSinUE.length) console.log(`  ✓ los ${libres.size} países de libre circulación cuadran en ambas listas`);

if (destinoNoElegible.length) { console.log(`  ⚠ destinos que nadie puede elegir como nacionalidad: ${destinoNoElegible.join(", ")}`); problemas++; }
else console.log("  ✓ los 26 destinos también se pueden elegir como nacionalidad");

console.log(`  · nacionalidades disponibles: ${nacCodigos.size}`);

// ── 3. Enlaces ──────────────────────────────────────────────────────────────
/** Servidores que no mandan el certificado intermedio; el navegador sí entra. */
function sinVerificarCadena(url) {
  return new Promise(resolve => {
    const req = peticionHttps(url, { method: "GET", rejectUnauthorized: false, timeout: 20000 },
      res => { res.destroy(); resolve(res.statusCode); });
    req.on("error", () => resolve(null));
    req.on("timeout", () => { req.destroy(); resolve(null); });
    req.end();
  });
}

const urls = [...new Set([...fuente.matchAll(/url: "(https?:\/\/[^"]+)"/g)].map(m => m[1]))];
console.log(`\nENLACES OFICIALES (${urls.length})`);

let rotos = 0;
for (const url of urls) {
  let estado, nota = "";
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 22000);
    const res = await fetch(url, {
      redirect: "follow",
      signal: ctrl.signal,
      headers: { "User-Agent": AGENTE, Accept: "text/html,*/*", "Accept-Language": "es-ES,es;q=0.9,en;q=0.8" },
    });
    clearTimeout(t);
    estado = res.status;
  } catch (e) {
    if (e?.cause?.code === "UNABLE_TO_VERIFY_LEAF_SIGNATURE") {
      const c = await sinVerificarCadena(url);
      if (c && c < 400) { estado = c; nota = "certificado intermedio ausente; en navegador sí entra"; }
      else { estado = 0; nota = "certificado incompleto y sin respuesta"; }
    } else {
      estado = 0;
      nota = String(e?.cause?.code || e.message || e).slice(0, 45);
    }
  }

  // 403, 405 y 429 son cortafuegos anti-robots, no enlaces muertos.
  const vivo = estado >= 200 && estado < 400;
  const bloqueo = estado === 403 || estado === 405 || estado === 429;
  if (!vivo && !bloqueo) { rotos++; problemas++; }

  const marca = vivo ? "✓" : bloqueo ? "~" : "✗";
  if (!vivo || nota) {
    console.log(`  ${marca} ${String(estado || "—").padEnd(4)} ${url}`);
    if (nota) console.log(`         ${nota}`);
  }
}
console.log(`  ${rotos === 0 ? "✓ ninguno roto" : `✗ ${rotos} roto(s)`}   (~ = bloquea robots, se comprueba a mano)`);

console.log(`\n${problemas === 0 ? "✓ TODO CORRECTO" : `✗ ${problemas} PROBLEMA(S)`}`);
process.exit(problemas === 0 ? 0 : 1);
