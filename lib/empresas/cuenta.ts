/**
 * lib/empresas/cuenta.ts — De qué empresa es quien mira, y lo que le queda del mes.
 *
 * POR QUÉ (4 nov 2026). El Plan Empresa era una sola cuenta con una contraseña.
 * Una empresa con varios departamentos podía compartirla y abrir todos los
 * contactos que quisiera por 49,99 €/mes, y nada lo impedía. Ahora:
 *
 *   · Cada persona entra con su propia cuenta. Quien paga (la titular) añade a
 *     las demás por su correo, hasta LIMITES_EMPRESA.usuarios contándose ella.
 *     Su correo tiene que estar confirmado: si no, cualquiera podría registrarse
 *     con el correo de otro y colarse en su empresa.
 *   · El cupo del mes es de la empresa, no de cada persona: candidatos a los que
 *     abre contacto y CV, e invitaciones «Me interesa» (lib/entrevistas/empresa.ts).
 *     Un candidato ya abierto sigue abierto y no vuelve a contar.
 *   · Lo que es de la persona (Guzzi, envíos de CV, cámara) sigue siendo de su
 *     propio plan: el equipo solo comparte lo de la empresa.
 *
 * Las tablas van en la base propia y se crean al primer uso. Borrar la cuenta
 * las limpia (lib/cuenta/borrar-datos.ts).
 */
import { getPool } from "@/lib/db";
import { getUserPlan } from "@/lib/cv-sender/rate-limiter";
import { LIMITES_EMPRESA } from "@/lib/plan-limits";
import { INICIO_DEL_MES, invitacionesDelMes } from "@/lib/entrevistas/empresa";

export interface CuentaEmpresa {
  /** La cuenta que paga: todo lo de la empresa (entrevistas, cupo) va a su nombre. */
  empresaId: string;
  titular: boolean;
}

let tablasListas = false;

export async function asegurarTablasEmpresa(): Promise<void> {
  if (tablasListas) return;
  await getPool().query(`
    -- Una persona está en una sola empresa: el correo es la clave.
    CREATE TABLE IF NOT EXISTS empresa_miembro (
      email      TEXT PRIMARY KEY,
      empresa_id TEXT NOT NULL,
      creado     TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS empresa_miembro_empresa ON empresa_miembro (empresa_id);
    -- Qué candidatos ha abierto cada empresa, y cuándo: de aquí sale el cupo del mes.
    CREATE TABLE IF NOT EXISTS empresa_candidato_abierto (
      empresa_id   TEXT NOT NULL,
      candidato_id TEXT NOT NULL,
      creado       TIMESTAMPTZ NOT NULL DEFAULT now(),
      PRIMARY KEY (empresa_id, candidato_id)
    );
    CREATE INDEX IF NOT EXISTS empresa_candidato_abierto_candidato ON empresa_candidato_abierto (candidato_id);
  `);
  tablasListas = true;
}

const esEmpresa = async (id: string) => (await getUserPlan(id).catch(() => "free")) === "empresa";
const normal = (email: string) => email.trim().toLowerCase();

/**
 * La empresa de quien mira: la suya si paga el Plan Empresa, o aquella en la
 * que la titular le ha dado acceso, mientras esa titular siga pagando.
 */
export async function cuentaEmpresa(u: { id: string; email?: string; confirmado?: boolean } | null): Promise<CuentaEmpresa | null> {
  if (!u?.id) return null;
  if (await esEmpresa(u.id)) return { empresaId: u.id, titular: true };
  if (!u.email || !u.confirmado) return null;
  await asegurarTablasEmpresa();
  const { rows: [m] } = await getPool().query<{ empresa_id: string }>(
    "SELECT empresa_id FROM empresa_miembro WHERE email = $1", [normal(u.email)]
  );
  if (!m || m.empresa_id === u.id || !(await esEmpresa(m.empresa_id))) return null;
  return { empresaId: m.empresa_id, titular: false };
}

// ── El equipo ─────────────────────────────────────────────────────────────
export async function miembrosDe(empresaId: string): Promise<{ email: string; creado: string }[]> {
  await asegurarTablasEmpresa();
  const { rows } = await getPool().query(
    "SELECT email, creado FROM empresa_miembro WHERE empresa_id = $1 ORDER BY creado", [empresaId]
  );
  return rows;
}

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function anadirMiembro(empresaId: string, correoTitular: string, email: string): Promise<{ ok: true } | { ok: false; error: string }> {
  await asegurarTablasEmpresa();
  const e = normal(email);
  if (!CORREO.test(e) || e.length > 200) return { ok: false, error: "Ese correo no parece válido." };
  if (e === normal(correoTitular)) return { ok: false, error: "Ese es tu correo: tú ya estás dentro." };
  const ya = await miembrosDe(empresaId);
  if (ya.some((m) => m.email === e)) return { ok: false, error: "Esa persona ya está en tu equipo." };
  if (1 + ya.length >= LIMITES_EMPRESA.usuarios) {
    return { ok: false, error: `Tu plan incluye ${LIMITES_EMPRESA.usuarios} personas, contándote a ti. Quita a alguien para añadir a otra.` };
  }
  const { rowCount } = await getPool().query(
    "INSERT INTO empresa_miembro (email, empresa_id) VALUES ($1, $2) ON CONFLICT (email) DO NOTHING", [e, empresaId]
  );
  if (!rowCount) return { ok: false, error: "Esa persona ya tiene acceso a la cuenta de otra empresa." };
  return { ok: true };
}

export async function quitarMiembro(empresaId: string, email: string): Promise<boolean> {
  await asegurarTablasEmpresa();
  const { rowCount } = await getPool().query(
    "DELETE FROM empresa_miembro WHERE empresa_id = $1 AND email = $2", [empresaId, normal(email)]
  );
  return (rowCount ?? 0) > 0;
}

// ── El cupo del mes ───────────────────────────────────────────────────────
export async function candidatosAbiertosDelMes(empresaId: string): Promise<number> {
  await asegurarTablasEmpresa();
  const { rows: [r] } = await getPool().query<{ n: number }>(
    `SELECT count(*)::int AS n FROM empresa_candidato_abierto WHERE empresa_id = $1 AND creado >= ${INICIO_DEL_MES}`, [empresaId]
  );
  return r.n;
}

/** De estos candidatos, los que la empresa ya ha abierto alguna vez (esos se ven sin gastar cupo). */
export async function yaAbiertos(empresaId: string, candidatos: string[]): Promise<Set<string>> {
  if (!candidatos.length) return new Set();
  await asegurarTablasEmpresa();
  const { rows } = await getPool().query<{ candidato_id: string }>(
    "SELECT candidato_id FROM empresa_candidato_abierto WHERE empresa_id = $1 AND candidato_id = ANY($2)", [empresaId, candidatos]
  );
  return new Set(rows.map((r) => r.candidato_id));
}

/**
 * Abrir el contacto y el CV de un candidato. Si ya lo había abierto, no gasta;
 * si es nuevo y el cupo del mes está lleno, no se abre.
 */
export async function abrirCandidato(empresaId: string, candidatoId: string): Promise<{ ok: boolean; usados: number; maximo: number }> {
  const maximo = LIMITES_EMPRESA.candidatosMes;
  if ((await yaAbiertos(empresaId, [candidatoId])).has(candidatoId)) {
    return { ok: true, usados: await candidatosAbiertosDelMes(empresaId), maximo };
  }
  // Contar y apuntar con la empresa bloqueada: si dos personas del equipo
  // abren a la vez con una plaza libre, solo entra una.
  const c = await getPool().connect();
  try {
    await c.query("BEGIN");
    await c.query("SELECT pg_advisory_xact_lock(hashtext($1))", [`cupo-empresa:${empresaId}`]);
    const { rows: [r] } = await c.query<{ n: number }>(
      `SELECT count(*)::int AS n FROM empresa_candidato_abierto WHERE empresa_id = $1 AND creado >= ${INICIO_DEL_MES}`, [empresaId]
    );
    if (r.n >= maximo) { await c.query("ROLLBACK"); return { ok: false, usados: r.n, maximo }; }
    const { rowCount } = await c.query(
      "INSERT INTO empresa_candidato_abierto (empresa_id, candidato_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [empresaId, candidatoId]
    );
    await c.query("COMMIT");
    return { ok: true, usados: r.n + (rowCount ?? 0), maximo };
  } catch (e) {
    await c.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    c.release();
  }
}

export async function cupoDelMes(empresaId: string) {
  const [candidatos, invitaciones] = await Promise.all([candidatosAbiertosDelMes(empresaId), invitacionesDelMes(empresaId)]);
  return {
    candidatos: { usados: candidatos, maximo: LIMITES_EMPRESA.candidatosMes },
    invitaciones: { usados: invitaciones, maximo: LIMITES_EMPRESA.invitacionesMes },
  };
}
