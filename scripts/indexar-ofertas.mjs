/**
 * scripts/indexar-ofertas.mjs
 * Lanza el indexador de ofertas directamente contra Supabase.
 * Uso: node scripts/indexar-ofertas.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Cargar .env.local manualmente
const envPath = resolve(__dirname, "../.env.local");
const envContent = readFileSync(envPath, "utf8");
for (const line of envContent.split("\n")) {
  const [key, ...rest] = line.split("=");
  if (key && rest.length) process.env[key.trim()] = rest.join("=").trim();
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const JOOBLE_KEY = process.env.JOOBLE_API_KEY;
const ADZUNA_APP_ID = process.env.ADZUNA_APP_ID;
const ADZUNA_KEY = process.env.ADZUNA_API_KEY;

console.log("🚀 Iniciando indexador de ofertas de empleo...");
console.log(`📡 Supabase: ${SUPABASE_URL}`);
console.log(`🔑 Jooble: ${JOOBLE_KEY ? "✓" : "✗"} | Adzuna: ${ADZUNA_KEY ? "✓" : "✗"}`);

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const PUESTOS = [
  "camarero", "cocinero", "conductor", "electricista", "fontanero",
  "albañil", "dependiente", "programador", "enfermero", "administrativo",
  "mecánico", "operario", "soldador", "limpiador", "cuidador",
  "almacén", "peluquero", "carpintero", "pintor", "vigilante seguridad",
  "recepcionista", "comercial", "técnico mantenimiento", "auxiliar enfermería",
  "repartidor", "carretillero", "chófer camión", "ayudante cocina",
  "auxiliar administrativo", "técnico informático",
];

const CIUDADES = [
  "Madrid", "Barcelona", "Valencia", "Sevilla", "Zaragoza",
  "Málaga", "Bilbao", "Murcia", "Alicante", "Valladolid",
  "Pamplona", "Tudela", "Logroño", "Santander", "Burgos",
  "Granada", "Córdoba", "Vigo", "Oviedo", "Gijón",
  "Tarragona", "Lleida", "Girona", "Badajoz", "Salamanca",
];

async function buscarJooble(puesto, ciudad) {
  if (!JOOBLE_KEY) return [];
  try {
    const res = await fetch(`https://jooble.org/api/${JOOBLE_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keywords: puesto, location: ciudad, page: 1 }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.jobs || []).slice(0, 20).map((j, i) => ({
      id: `jooble-${ciudad}-${puesto}-${i}-${Date.now()}`.replace(/\s/g, "-").toLowerCase(),
      titulo: (j.title || puesto).slice(0, 255),
      empresa: (j.company || "").slice(0, 255),
      ubicacion: (j.location || ciudad).slice(0, 255),
      provincia: ciudad,
      comunidad: "",
      salario: (j.salary || "").slice(0, 100),
      descripcion: (j.snippet || "").replace(/<[^>]+>/g, "").slice(0, 1000),
      fuente: "Jooble",
      url: (j.link || "").slice(0, 500),
      email_empresa: "",
      sector: inferirSector(j.title || puesto),
      keywords: [puesto.toLowerCase(), ciudad.toLowerCase()],
      fecha: j.updated ? (isNaN(Number(j.updated)) ? j.updated : new Date(Number(j.updated) * 1000).toISOString()) : new Date().toISOString(),
    }));
  } catch { return []; }
}

async function buscarAdzuna(puesto, ciudad) {
  if (!ADZUNA_APP_ID || !ADZUNA_KEY) return [];
  try {
    const url = `https://api.adzuna.com/v1/api/jobs/es/search/1?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_KEY}&results_per_page=20&what=${encodeURIComponent(puesto)}&where=${encodeURIComponent(ciudad)}&content-type=application/json`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).slice(0, 20).map((j, i) => ({
      id: `adzuna-${ciudad}-${puesto}-${i}-${Date.now()}`.replace(/\s/g, "-").toLowerCase(),
      titulo: (j.title || puesto).replace(/<[^>]+>/g, "").slice(0, 255),
      empresa: (j.company?.display_name || "").slice(0, 255),
      ubicacion: (j.location?.display_name || ciudad).slice(0, 255),
      provincia: ciudad,
      comunidad: "",
      salario: j.salary_min ? `${Math.round(j.salary_min)}€ - ${Math.round(j.salary_max || j.salary_min)}€` : "",
      descripcion: (j.description || "").replace(/<[^>]+>/g, "").slice(0, 1000),
      fuente: "Adzuna",
      url: (j.redirect_url || "").slice(0, 500),
      email_empresa: "",
      sector: inferirSector(j.title || puesto),
      keywords: [puesto.toLowerCase(), ciudad.toLowerCase()],
      fecha: j.created || new Date().toISOString(),
    }));
  } catch { return []; }
}

async function buscarArbeitnow(puesto) {
  try {
    const res = await fetch(`https://www.arbeitnow.com/api/job-board-api?search=${encodeURIComponent(puesto)}&location=Spain&page=1`, {
      headers: { "Accept": "application/json" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.data || []).slice(0, 15).map((j, i) => ({
      id: `arb-${puesto}-${i}-${Date.now()}`.replace(/\s/g, "-").toLowerCase(),
      titulo: (j.title || puesto).slice(0, 255),
      empresa: (j.company_name || "").slice(0, 255),
      ubicacion: (j.location || "España").slice(0, 255),
      provincia: "España",
      comunidad: "",
      salario: "",
      descripcion: (j.description || "").replace(/<[^>]+>/g, "").slice(0, 1000),
      fuente: "Arbeitnow",
      url: (j.url || "").slice(0, 500),
      email_empresa: "",
      sector: inferirSector(j.title || puesto),
      keywords: [puesto.toLowerCase()],
      fecha: j.created_at || new Date().toISOString(),
    }));
  } catch { return []; }
}

function inferirSector(titulo) {
  const t = (titulo || "").toLowerCase();
  if (/camarer|cociner|chef|hotel|restaur/i.test(t)) return "hosteleria";
  if (/electricist|fontaner|albañil|soldad|construc/i.test(t)) return "construccion";
  if (/program|develop|software|web|data/i.test(t)) return "tecnologia";
  if (/vendedor|cajero|depend|comerci/i.test(t)) return "comercio";
  if (/conduc|repartid|almacén|logíst|carretill/i.test(t)) return "logistica";
  if (/operario|fábrica|producc|industri/i.test(t)) return "industria";
  if (/enfermer|auxiliar|cuidador|sanidad/i.test(t)) return "sanidad";
  if (/administrat|secretar|recepcion|contabl/i.test(t)) return "administracion";
  return "otros";
}

async function upsertLote(filas) {
  if (!filas.length) return 0;
  const { error, count } = await supabase
    .from("ofertas")
    .upsert(filas, { onConflict: "id", ignoreDuplicates: true })
    .select("id", { count: "exact", head: true });
  if (error) {
    console.error("  ❌ Error upsert:", error.message);
    return 0;
  }
  return filas.length;
}

// ── MAIN ──────────────────────────────────────────────────────────────────
let totalInsertados = 0;
let combinacion = 0;
const total = PUESTOS.length * CIUDADES.length;

for (const puesto of PUESTOS) {
  // Arbeitnow: una vez por puesto (no por ciudad)
  const arbResults = await buscarArbeitnow(puesto);
  if (arbResults.length) {
    totalInsertados += await upsertLote(arbResults);
  }

  for (const ciudad of CIUDADES) {
    combinacion++;
    process.stdout.write(`\r⏳ [${combinacion}/${total}] "${puesto}" en "${ciudad}" — ${totalInsertados} insertadas`);

    const [joobleRes, adzunaRes] = await Promise.allSettled([
      buscarJooble(puesto, ciudad),
      buscarAdzuna(puesto, ciudad),
    ]);

    const filas = [
      ...(joobleRes.status === "fulfilled" ? joobleRes.value : []),
      ...(adzunaRes.status === "fulfilled" ? adzunaRes.value : []),
    ];

    if (filas.length) totalInsertados += await upsertLote(filas);

    // Pausa para respetar rate limits
    await new Promise(r => setTimeout(r, 300));
  }
}

console.log(`\n\n✅ Indexación completada: ${totalInsertados} ofertas insertadas en Supabase`);

// Verificar total en BD
const { count } = await supabase.from("ofertas").select("*", { count: "exact", head: true });
console.log(`📊 Total ofertas en BD: ${count}`);
