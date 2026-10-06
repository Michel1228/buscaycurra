/**
 * lib/centinela/limites-correo.ts
 * Que nadie se quede sin correo por un límite que no vigilábamos.
 *
 * POR QUÉ (6 oct 2026). Supabase tenía un límite de 2 correos de confirmación
 * por hora y el tercer registro de la hora fallaba sin que nadie se enterase.
 * Y Resend, por donde sale todo lo demás, tiene sus propios topes. Si se pasan,
 * deja de salir de golpe: confirmaciones, alertas, envíos de CV. Aquí se avisa
 * ANTES de llegar, con margen para actuar.
 *
 * Las cifras, de las fuentes oficiales (comprobadas el 6 oct 2026):
 *  - Resend, plan gratuito: 100 correos al día (día natural en hora UTC) y
 *    3.000 al mes. https://resend.com/docs/knowledge-base/account-quotas-and-limits
 *  - Resend, todas las cuentas: rebotes por debajo del 4 %, o pausa los envíos
 *    hasta que baje. (Misma página.)
 *  - Supabase, correos de confirmación: 30 por hora. Lo puso Michel el 6 oct en
 *    https://supabase.com/dashboard/project/ojesordjedovnpyxspxi/auth/rate-limits
 *    Si se cambia ahí, hay que cambiar LIMITE_SUPABASE_HORA aquí.
 *
 * Se avisa al 80 % de los topes de Resend, al 70 % del de Supabase y desde el
 * 3 % de rebotes, para tener tiempo.
 */
import { get as cacheGet } from "@/lib/cache/redis-client";

type Anota = (nombre: string, bien: boolean, detalle: string, nacioDe: string) => void;

export const LIMITE_RESEND_DIA = 100;
export const LIMITE_RESEND_MES = 3000;
export const LIMITE_REBOTES = 4;
export const LIMITE_SUPABASE_HORA = 30;

const NACIO = "6 oct 2026: Supabase cortaba el tercer registro de la hora y nadie lo sabía";

type Correo = { to?: string[]; subject?: string; created_at: string; last_event?: string };
const fecha = (s: string) => new Date(String(s).replace(" ", "T").replace(/\+00$/, "Z"));

/** Clave de Redis donde la página de registro apunta los registros cortados (ver /api/auth/registro-cortado). */
export const claveRegistroCortado = (dia: string) => `registro-cortado:${dia}`;

async function correosUltimosDias(dias: number): Promise<Correo[]> {
  const H = { Authorization: `Bearer ${process.env.RESEND_API_KEY}` };
  const desde = Date.now() - dias * 86400000;
  const todos: Correo[] = [];
  let after: string | null = null;
  for (let pag = 0; pag < 80; pag++) {
    const r = await fetch("https://api.resend.com/emails?limit=100" + (after ? `&after=${after}` : ""), { headers: H, signal: AbortSignal.timeout(20000) });
    if (!r.ok) throw new Error(`Resend respondió ${r.status}`);
    const j = await r.json() as { data?: Array<Correo & { id: string }>; has_more?: boolean };
    const lista = j.data || [];
    todos.push(...lista);
    if (!j.has_more || !lista.length || fecha(lista[lista.length - 1].created_at).getTime() < desde) break;
    after = lista[lista.length - 1].id;
    await new Promise((ok) => setTimeout(ok, 300)); // Resend admite 10 peticiones por segundo
  }
  return todos.filter((e) => fecha(e.created_at).getTime() >= desde);
}

export async function limitesDeCorreo(anota: Anota): Promise<void> {
  let correos: Correo[];
  try {
    correos = await correosUltimosDias(30);
  } catch (e) {
    anota("los límites de correo están lejos", false, `no se pudo leer Resend: ${(e as Error).message}`, NACIO);
    return;
  }
  const hace7 = Date.now() - 7 * 86400000;

  // 1. Tope diario de Resend: el día con más correos de la última semana.
  const porDia: Record<string, number> = {};
  for (const e of correos) if (fecha(e.created_at).getTime() >= hace7) {
    const d = fecha(e.created_at).toISOString().slice(0, 10);
    porDia[d] = (porDia[d] || 0) + 1;
  }
  const [diaMax, maxDia] = Object.entries(porDia).sort((a, b) => b[1] - a[1])[0] || ["-", 0];
  anota(`ningún día se acerca al tope de ${LIMITE_RESEND_DIA} correos de Resend`, maxDia < LIMITE_RESEND_DIA * 0.8,
    `el día con más en una semana: ${maxDia} (${diaMax}). Si pasa de ${LIMITE_RESEND_DIA}, el resto del día no sale nada; en el plan de pago no hay tope diario`,
    NACIO);

  // 2. Tope mensual de Resend.
  anota(`el mes no se acerca al tope de ${LIMITE_RESEND_MES} correos de Resend`, correos.length < LIMITE_RESEND_MES * 0.8,
    `${correos.length} correos en 30 días (${Math.round((100 * correos.length) / LIMITE_RESEND_MES)} %)`,
    NACIO);

  // 3. Rebotes de la última semana, solo a direcciones reales (las de prueba de
  //    Resend rebotan a propósito).
  const reales = correos.filter((e) => fecha(e.created_at).getTime() >= hace7 && !/@resend\.dev$/i.test(e.to?.[0] || ""));
  const rebotes = reales.filter((e) => e.last_event === "bounced").length;
  const pct = reales.length ? (100 * rebotes) / reales.length : 0;
  anota(`los rebotes siguen por debajo del ${LIMITE_REBOTES} % que exige Resend`, pct < 3,
    `${rebotes} de ${reales.length} correos rebotaron esta semana (${pct.toFixed(1)} %). Con más del ${LIMITE_REBOTES} % Resend puede pausar todos los envíos`,
    NACIO);

  // 4. Registros por hora frente al límite de Supabase.
  const porHora: Record<string, number> = {};
  for (const e of correos) if (/^Confirma tu cuenta/.test(e.subject || "") && fecha(e.created_at).getTime() >= hace7) {
    const h = fecha(e.created_at).toISOString().slice(0, 13);
    porHora[h] = (porHora[h] || 0) + 1;
  }
  const maxHora = Math.max(0, ...Object.values(porHora));
  anota(`los registros por hora están lejos del límite de Supabase (${LIMITE_SUPABASE_HORA})`, maxHora < LIMITE_SUPABASE_HORA * 0.7,
    `la hora con más correos de confirmación en una semana: ${maxHora}`, NACIO);

  // 5. Nadie se ha quedado sin registrarse por ese límite (lo apunta la página
  //    de registro cuando Supabase contesta 429).
  const hoy = new Date().toISOString().slice(0, 10);
  const ayer = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const cortados = Number(await cacheGet(claveRegistroCortado(hoy)).catch(() => 0) || 0)
    + Number(await cacheGet(claveRegistroCortado(ayer)).catch(() => 0) || 0);
  anota("nadie se ha quedado sin registrarse por el límite de correos", cortados === 0,
    cortados ? `${cortados} intento(s) de registro cortados por Supabase entre ayer y hoy: sube el límite en el panel de Supabase` : "ningún registro cortado entre ayer y hoy",
    NACIO);
}
