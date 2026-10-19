/**
 * lib/cursos/carnes.ts — Los carnés que ya tiene cada persona, y cuándo caducan.
 *
 * Para quien ya trabaja de esto (fase 2 de renovaciones, 18 oct 2026): dice "ya
 * lo tengo", pone cuándo lo sacó, y le avisamos 3 meses y 1 mes antes de que
 * caduque. Un CAP caducado es una infracción para la empresa y una TPC
 * caducada te deja fuera de la obra: quien se entera tarde pierde trabajo.
 *
 * Solo los carnés con la renovación confirmada en una fuente
 * (tiposConRenovacion). La caducidad se calcula con validezAnios; el soldador
 * no tiene uno solo (2 o 3 años según su certificado), así que ahí la fecha la
 * pone la persona.
 *
 * Tabla en la base propia, creada al primer uso como curso_sugerencia_baja: no
 * hace falta aplicar nada a mano en Supabase.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { getPool } from "@/lib/db";
import { tipoPorSlug, type TipoCurso } from "@/lib/cursos/tipos";

export interface Carne {
  curso_slug: string;
  /** YYYY-MM-DD */
  obtenido_en: string;
  /** YYYY-MM-DD */
  caduca_en: string;
  avisos: boolean;
}

let tablaLista = false;

export async function asegurarTablaCarnes(): Promise<void> {
  if (tablaLista) return;
  await getPool().query(`
    CREATE TABLE IF NOT EXISTS carne_usuario (
      user_id     TEXT NOT NULL,
      curso_slug  TEXT NOT NULL,
      obtenido_en DATE NOT NULL,
      caduca_en   DATE NOT NULL,
      avisos      BOOLEAN NOT NULL DEFAULT true,
      avisado_3m  TIMESTAMPTZ,
      avisado_1m  TIMESTAMPTZ,
      creado_en   TIMESTAMPTZ NOT NULL DEFAULT now(),
      actualizado TIMESTAMPTZ NOT NULL DEFAULT now(),
      PRIMARY KEY (user_id, curso_slug)
    )
  `);
  tablaLista = true;
}

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

/** Fecha válida en formato YYYY-MM-DD, o null. */
export function fechaValida(v: unknown): string | null {
  if (typeof v !== "string" || !FECHA.test(v)) return null;
  const d = new Date(`${v}T00:00:00Z`);
  return Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== v ? null : v;
}

/** Años de validez para calcular la caducidad; null si la fecha la pone la persona. */
export function aniosDeValidez(t: TipoCurso): number | null {
  return t.renovacion && t.validezAnios ? t.validezAnios : null;
}

/** Fecha de caducidad: la que diga la persona, o la de sacarlo más los años de validez. */
export function calcularCaducidad(t: TipoCurso, obtenido: string, caducaManual?: string | null): string | null {
  if (caducaManual) return caducaManual;
  const anios = aniosDeValidez(t);
  if (!anios) return null;
  const d = new Date(`${obtenido}T00:00:00Z`);
  d.setUTCFullYear(d.getUTCFullYear() + anios);
  return d.toISOString().slice(0, 10);
}

export async function carnesDe(userId: string): Promise<Carne[]> {
  await asegurarTablaCarnes();
  const { rows } = await getPool().query<Carne>(
    `SELECT curso_slug, to_char(obtenido_en, 'YYYY-MM-DD') AS obtenido_en,
            to_char(caduca_en, 'YYYY-MM-DD') AS caduca_en, avisos
       FROM carne_usuario WHERE user_id = $1 ORDER BY caduca_en`,
    [userId]
  );
  return rows;
}

export async function guardarCarne(userId: string, slug: string, obtenido: string, caduca: string, avisos: boolean): Promise<void> {
  await asegurarTablaCarnes();
  // Al cambiar la fecha se vuelve a avisar: los avisos dados eran de la anterior.
  await getPool().query(
    `INSERT INTO carne_usuario (user_id, curso_slug, obtenido_en, caduca_en, avisos)
          VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (user_id, curso_slug) DO UPDATE SET
       avisos = EXCLUDED.avisos,
       avisado_3m = CASE WHEN carne_usuario.caduca_en = EXCLUDED.caduca_en THEN carne_usuario.avisado_3m END,
       avisado_1m = CASE WHEN carne_usuario.caduca_en = EXCLUDED.caduca_en THEN carne_usuario.avisado_1m END,
       obtenido_en = EXCLUDED.obtenido_en,
       caduca_en = EXCLUDED.caduca_en,
       actualizado = now()`,
    [userId, slug, obtenido, caduca, avisos]
  );
}

export async function quitarCarne(userId: string, slug: string): Promise<void> {
  await asegurarTablaCarnes();
  await getPool().query(`DELETE FROM carne_usuario WHERE user_id = $1 AND curso_slug = $2`, [userId, slug]);
}

/** Apaga los avisos de todos sus carnés (el enlace del correo). */
export async function sinAvisosDeCarnes(userId: string): Promise<void> {
  await asegurarTablaCarnes();
  await getPool().query(`UPDATE carne_usuario SET avisos = false, actualizado = now() WHERE user_id = $1`, [userId]);
}

/** El nombre corto para los textos: "homologación de soldador", "carné de carretillero"… */
export function nombreDelCarne(slug: string): string {
  const t = tipoPorSlug(slug, "ES");
  return t ? (t.renovacion?.que ?? t.nombre) : slug;
}

/**
 * ¿Es buena hora para avisar? De lunes a viernes, entre las 10:00 y las 12:00
 * de España: entre semana y a media mañana es donde más coinciden los estudios
 * de apertura de correo, y el sábado es el peor en todos. El reloj del servidor
 * va en UTC y España cambia de hora, así que el crontab llama dos veces cada
 * mañana y es aquí donde se decide con la hora de Madrid.
 */
export function enHorarioDeAviso(ahora = new Date()): boolean {
  const partes = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Madrid", weekday: "short", hour: "2-digit", hourCycle: "h23" }).formatToParts(ahora);
  const dia = partes.find(p => p.type === "weekday")?.value ?? "";
  const hora = Number(partes.find(p => p.type === "hour")?.value);
  return !["Sat", "Sun"].includes(dia) && hora >= 10 && hora < 12;
}

// ── Baja firmada del correo, como la de las sugerencias de cursos ─────────────
function firma(userId: string): string | null {
  const s = process.env.ALERTS_SECRET || process.env.ADMIN_SECRET;
  if (!s) return null;
  return createHmac("sha256", s).update(`baja-carnes:${userId}`).digest("base64url").slice(0, 32);
}

export function firmaBajaCarnesValida(userId: string, t: string): boolean {
  const esperada = firma(userId);
  if (!esperada || !t) return false;
  const a = Buffer.from(esperada);
  const b = Buffer.from(t);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function enlaceBajaCarnes(userId: string): string | null {
  const f = firma(userId);
  return f ? `https://buscaycurra.es/api/cursos/carnes/baja?u=${encodeURIComponent(userId)}&t=${f}` : null;
}
