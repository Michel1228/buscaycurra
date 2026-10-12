/**
 * lib/cursos/sugerencia-cv-baja.ts — Quien no quiere sugerencias de cursos por su CV.
 *
 * Una tabla de una columna: estar en ella es haber dicho que no. Así quien
 * nunca ha tocado nada recibe las sugerencias, y quien las apaga (desde el
 * perfil o desde el enlace del correo) no vuelve a recibir ninguna.
 *
 * El enlace del correo va firmado con un secreto del servidor, como el de los
 * avisos de curso (lib/cursos/baja-aviso.ts): nadie puede dar de baja a otro
 * cambiando el identificador.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { getPool } from "@/lib/db";

let tablaLista = false;

export async function asegurarTablaBaja(): Promise<void> {
  if (tablaLista) return;
  await getPool().query(`
    CREATE TABLE IF NOT EXISTS curso_sugerencia_baja (
      user_id   TEXT PRIMARY KEY,
      creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
  tablaLista = true;
}

export async function quiereSugerencias(userId: string): Promise<boolean> {
  await asegurarTablaBaja();
  const { rowCount } = await getPool().query(`SELECT 1 FROM curso_sugerencia_baja WHERE user_id = $1`, [userId]);
  return !rowCount;
}

export async function ponerSugerencias(userId: string, activas: boolean): Promise<void> {
  await asegurarTablaBaja();
  if (activas) {
    await getPool().query(`DELETE FROM curso_sugerencia_baja WHERE user_id = $1`, [userId]);
  } else {
    await getPool().query(`INSERT INTO curso_sugerencia_baja (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING`, [userId]);
  }
}

/** Los que han dicho que no, de entre estos. */
export async function sinSugerencias(userIds: string[]): Promise<Set<string>> {
  if (!userIds.length) return new Set();
  await asegurarTablaBaja();
  const { rows } = await getPool().query<{ user_id: string }>(
    `SELECT user_id FROM curso_sugerencia_baja WHERE user_id = ANY($1)`, [userIds]
  );
  return new Set(rows.map((r) => r.user_id));
}

function firma(userId: string): string | null {
  const s = process.env.ALERTS_SECRET || process.env.ADMIN_SECRET;
  if (!s) return null;
  return createHmac("sha256", s).update(`baja-sugerencias-cv:${userId}`).digest("base64url").slice(0, 32);
}

export function firmaBajaSugerenciasValida(userId: string, t: string): boolean {
  const esperada = firma(userId);
  if (!esperada || !t) return false;
  const a = Buffer.from(esperada);
  const b = Buffer.from(t);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function enlaceBajaSugerencias(userId: string): string | null {
  const f = firma(userId);
  return f ? `https://buscaycurra.es/api/cursos/sugerencias/baja?u=${encodeURIComponent(userId)}&t=${f}` : null;
}
