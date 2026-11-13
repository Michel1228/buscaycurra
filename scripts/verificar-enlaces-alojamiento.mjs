#!/usr/bin/env node
/**
 * scripts/verificar-enlaces-alojamiento.mjs — Comprueba los enlaces de
 * alojamiento y de au pair de lib/primeros-pasos.ts (13 nov 2026).
 *
 * Uso: node scripts/verificar-enlaces-alojamiento.mjs
 *
 * Para cada plataforma: si carga, si redirige a OTRO dominio (Wohnungsboerse
 * acababa en ImmobilienScout24) y si la página parece un dominio en venta.
 * OJO al leer el resultado: muchos portales grandes (Idealista, Zillow,
 * SeLoger...) responden 403/429 "Just a moment" o "Security check" a cualquier
 * programa; eso es su antirrobots, no un enlace roto. Lo que hay que mirar son
 * los 404, los dominios que no existen (ENOTFOUND), las redirecciones a otro
 * sitio y los títulos que no cuadran (en nov 2026, Immonet.at era una web de
 * casinos y la "WG de Viena" enseñaba Kaiserslautern).
 * Solo lee: no envía nada a nadie.
 */
import { readFileSync } from "node:fs";

const src = readFileSync(new URL("../lib/primeros-pasos.ts", import.meta.url), "utf8");
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";
const ANTIRROBOTS = /just a moment|attention required|security check|access denied|has been denied|browser challenge|vercel security|pardon our interruption|client challenge/i;

function plataformas(seccion) {
  const filas = [];
  const re = new RegExp(`${seccion}:\\s*\\{[\\s\\S]*?plataformas:\\s*\\[([\\s\\S]*?)\\]`, "g");
  let m;
  while ((m = re.exec(src))) {
    const pais = (src.slice(0, m.index).match(/\n {2}([A-Z]{2}): \{/g) || []).pop()?.match(/[A-Z]{2}/)[0] ?? "?";
    for (const p of m[1].matchAll(/nombre:\s*"([^"]+)",\s*url:\s*"([^"]+)"/g)) filas.push({ seccion, pais, nombre: p[1], url: p[2] });
  }
  return filas;
}

async function mirar(f) {
  try {
    const r = await fetch(f.url, { redirect: "follow", headers: { "user-agent": UA, "accept-language": "es-ES,es;q=0.9,en;q=0.8" }, signal: AbortSignal.timeout(25000) });
    const html = (await r.text()).slice(0, 150000);
    const titulo = (html.match(/<title[^>]*>([^<]{0,100})/i) || [])[1]?.trim().replace(/\s+/g, " ") ?? "";
    const d0 = new URL(f.url).hostname.replace(/^www\./, ""), d1 = new URL(r.url).hostname.replace(/^www\./, "");
    const enVenta = /domain (is )?for sale|buy this domain|im\.forsale|hugedomains|afternic|dan\.com/i.test(r.url + html.slice(0, 20000));
    // La página de bloqueo de muchos portales lleva su propio dominio por título
    // ("idealista.com", "seloger.com"): es el portal de verdad cerrando el paso a robots.
    const conSuNombre = titulo.toLowerCase().includes(d0.split(".")[0]);
    const bloqueo = [202, 403, 406, 429].includes(r.status) && (ANTIRROBOTS.test(titulo) || !titulo || conSuNombre);
    const estado = enVenta ? "EN VENTA" : r.status === 200 && d1 === d0 ? "ok" : bloqueo ? "ok (antirrobots)" : d1 !== d0 ? `REDIRIGE a ${r.url.slice(0, 60)}` : `HTTP ${r.status}`;
    return { ...f, estado, titulo };
  } catch (e) {
    return { ...f, estado: `ERROR ${e.cause?.code || e.name}`, titulo: "" };
  }
}

const todas = [...plataformas("alojamiento"), ...plataformas("auPair")];
const res = [];
for (let i = 0; i < todas.length; i += 12) res.push(...(await Promise.all(todas.slice(i, i + 12).map(mirar))));
const malas = res.filter((r) => !r.estado.startsWith("ok"));
for (const r of res) console.log(`${r.estado.startsWith("ok") ? "  " : "✗ "}${r.seccion} ${r.pais} ${r.nombre} · ${r.estado} · «${r.titulo.slice(0, 60)}»`);
console.log(`\n${res.length} enlaces · ${malas.length} a revisar a mano`);
process.exit(malas.length ? 1 : 0);
