/**
 * lib/entrevistas/cupo.ts — Cuántas entrevistas de ensayo le quedan esta semana.
 *
 * El plan gratis tiene 2 a la semana (Michel, 19 oct 2026: "si no nos cuesta
 * créditos o nos cuesta muy poco"). No los cuesta: la voz está grabada y las
 * respuestas del entrevistador salen del mismo nivel gratuito que ya usa Guzzi.
 * Los planes de pago, sin límite (entrevistasSemana = null en plan-limits).
 *
 * Una entrevista = una sesión, que la pantalla abre al pulsar "Empezar" con un
 * identificador propio. La primera respuesta de una sesión nueva gasta una de
 * las dos; las demás preguntas de esa sesión no gastan más, hasta un tope de
 * respuestas por sesión para que una sola no se convierta en infinitas.
 *
 * Se cuenta en Redis por semana ISO. Si Redis no responde, se deja ensayar: es
 * mejor regalar una entrevista que cortar a alguien a mitad.
 */
import { get, set, incrementar } from "@/lib/cache/redis-client";
import { getPlanLimits } from "@/lib/plan-limits";

/** Respuestas como mucho por entrevista (el sector más largo tiene 7 preguntas). */
export const RESPUESTAS_POR_SESION = 12;
const OCHO_DIAS = 8 * 86400;
const SESION_VALIDA = /^[a-z0-9-]{8,64}$/i;

/** "2026-W43": la semana ISO, que empieza el lunes. */
export function semanaIso(fecha = new Date()): string {
  const d = new Date(Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth(), fecha.getUTCDate()));
  const dia = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dia);
  const inicio = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const semana = Math.ceil(((d.getTime() - inicio.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(semana).padStart(2, "0")}`;
}

const claveSemana = (userId: string) => `entrevistas:${userId}:${semanaIso()}`;

async function sesionesDeLaSemana(userId: string): Promise<string[]> {
  const v = await get(claveSemana(userId));
  try { const lista = JSON.parse(v ?? "[]"); return Array.isArray(lista) ? lista : []; } catch { return []; }
}

export interface Cupo { ilimitado: boolean; maximo: number | null; restantes: number | null }

export async function cupoEntrevistas(userId: string, plan: string | null | undefined): Promise<Cupo> {
  const maximo = getPlanLimits(plan).entrevistasSemana;
  if (maximo === null) return { ilimitado: true, maximo: null, restantes: null };
  try {
    const usadas = (await sesionesDeLaSemana(userId)).length;
    return { ilimitado: false, maximo, restantes: Math.max(0, maximo - usadas) };
  } catch {
    return { ilimitado: false, maximo, restantes: maximo };
  }
}

/** ¿Puede contestar esta pregunta? Si es la primera de una entrevista nueva, la cuenta. */
export async function usarEntrevista(userId: string, plan: string | null | undefined, sesion: unknown): Promise<{ ok: true } | { ok: false; motivo: "sin-cupo" | "sesion" }> {
  const maximo = getPlanLimits(plan).entrevistasSemana;
  if (maximo === null) return { ok: true };
  if (typeof sesion !== "string" || !SESION_VALIDA.test(sesion)) return { ok: false, motivo: "sesion" };
  try {
    const sesiones = await sesionesDeLaSemana(userId);
    if (!sesiones.includes(sesion)) {
      if (sesiones.length >= maximo) return { ok: false, motivo: "sin-cupo" };
      await set(claveSemana(userId), JSON.stringify([...sesiones, sesion]), OCHO_DIAS);
    }
    const respuestas = await incrementar(`entrevista-sesion:${userId}:${sesion}`, OCHO_DIAS);
    if (respuestas > RESPUESTAS_POR_SESION) return { ok: false, motivo: "sin-cupo" };
    return { ok: true };
  } catch {
    return { ok: true };
  }
}
