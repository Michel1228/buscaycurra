/**
 * lib/entrevistas/empresa.ts — La entrevista de cada empresa.
 *
 * POR QUÉ (3 nov 2026). Idea de Michel: que la empresa ponga lo que pregunta en
 * sus entrevistas y, cuando le interesa un candidato, le invite a hacerla.
 *
 * 23 NOV 2026, ENTREVISTA DE VERDAD (Michel: «no es una simulación: la empresa
 * la manda para que hagan la entrevista desde la aplicación»). Hasta ese día el
 * candidato «ensayaba» y una IA le decía qué puntos de los que busca la empresa
 * había cubierto, para que los corrigiera antes de mandarlos: casi todos
 * acababan mandando respuestas «perfectas» y la empresa no podía distinguir.
 * Ahora:
 *
 *   1. El candidato contesta desde la app, hablando o escribiendo; puede rehacer
 *      sus respuestas antes de mandarlas y las manda una vez. No ve lo que la
 *      empresa espera oír ni ninguna nota. Para ensayar está el simulador normal.
 *   2. La empresa las lee y marca qué puntos ha cubierto: la nota de 0 a 100 la
 *      pone una persona. Ninguna IA valora a nadie (una nota automática para
 *      elegir entre candidatos es IA de selección de «alto riesgo» en la ley
 *      europea, y pide evaluación de impacto y pruebas de sesgo).
 *   3. La referencia verificada se enseña al lado, como sello, sin sumar a la nota.
 *
 * Crear la entrevista cuesta poco: las preguntas del sector salen ya escritas
 * (lib/empresas/plantillas-entrevista.ts) y «qué esperas oír» es opcional.
 *
 * Las columnas intentos y ultima_sesion son de los ensayos de antes: ya no se usan.
 *
 * Tablas en la base propia, creadas al primer uso. La invitación lleva una copia
 * de las preguntas: si la empresa las cambia después, el candidato ensaya y
 * contesta lo que se le mandó.
 */
import { randomBytes } from "node:crypto";
import { getPool } from "@/lib/db";
import { LIMITES_EMPRESA } from "@/lib/plan-limits";
import { deTema, preguntaDiscriminatoria } from "@/lib/empresas/reglas";

export const MAX_PREGUNTAS = 8;
export const MAX_PUNTOS = 5;
/**
 * Si la empresa no escribe qué espera oír, la pregunta se valora con un sí o un
 * no: «¿me convence?». Así no tiene que escribir nada más que la pregunta.
 */
export const PUNTO_SIN_ESCRIBIR = "Me convence la respuesta";
export const INVITACIONES_AL_DIA = 30;

/** El día 1 de este mes, a las 00:00 de Madrid: ahí empieza el cupo de la empresa. */
export const INICIO_DEL_MES = `(date_trunc('month', now() AT TIME ZONE 'Europe/Madrid') AT TIME ZONE 'Europe/Madrid')`;

export interface Pregunta { texto: string; puntos: string[] }

export interface Entrevista {
  id: string;
  empresa: string;
  puesto: string;
  preguntas: Pregunta[];
}

export interface Invitacion {
  id: string;
  user_id: string;
  empresa_id: string;
  empresa: string;
  puesto: string;
  preguntas: Pregunta[];
  intentos: number;
  respuestas: string[] | null;
  enviada_en: string | null;
  marcas: boolean[][] | null;
  nota: number | null;
  creado: string;
}

let tablasListas = false;

export async function asegurarTablasEntrevistaEmpresa(): Promise<void> {
  if (tablasListas) return;
  await getPool().query(`
    CREATE TABLE IF NOT EXISTS entrevista_empresa (
      id          TEXT PRIMARY KEY,
      user_id     TEXT NOT NULL,
      empresa     TEXT NOT NULL,
      puesto      TEXT NOT NULL,
      preguntas   JSONB NOT NULL,
      creado      TIMESTAMPTZ NOT NULL DEFAULT now(),
      actualizado TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS entrevista_empresa_user ON entrevista_empresa (user_id);
    -- user_id es el candidato; empresa_id, la cuenta de la empresa.
    CREATE TABLE IF NOT EXISTS entrevista_invitacion (
      id            TEXT PRIMARY KEY,
      user_id       TEXT NOT NULL,
      empresa_id    TEXT NOT NULL,
      entrevista_id TEXT NOT NULL,
      empresa       TEXT NOT NULL,
      puesto        TEXT NOT NULL,
      preguntas     JSONB NOT NULL,
      intentos      INTEGER NOT NULL DEFAULT 0,
      ultima_sesion TEXT,
      respuestas    JSONB,
      enviada_en    TIMESTAMPTZ,
      marcas        JSONB,
      nota          INTEGER CHECK (nota BETWEEN 0 AND 100),
      creado        TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (empresa_id, user_id, entrevista_id)
    );
    CREATE INDEX IF NOT EXISTS entrevista_invitacion_user ON entrevista_invitacion (user_id);
    CREATE INDEX IF NOT EXISTS entrevista_invitacion_empresa ON entrevista_invitacion (empresa_id);
  `);
  tablasListas = true;
}

const limpio = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "");

/** Las preguntas tal como las escribe la empresa, o el motivo por el que no valen. */
export function validarPreguntas(v: unknown): { ok: true; preguntas: Pregunta[] } | { ok: false; error: string } {
  if (!Array.isArray(v)) return { ok: false, error: "Faltan las preguntas." };
  const preguntas = v.map((p) => ({
    texto: limpio((p as Pregunta)?.texto, 300),
    puntos: (Array.isArray((p as Pregunta)?.puntos) ? (p as Pregunta).puntos : []).map((x) => limpio(x, 160)).filter(Boolean).slice(0, MAX_PUNTOS),
  })).filter((p) => p.texto);
  if (!preguntas.length) return { ok: false, error: "Escribe al menos una pregunta." };
  if (preguntas.length > MAX_PREGUNTAS) return { ok: false, error: `Como mucho ${MAX_PREGUNTAS} preguntas.` };
  for (const p of preguntas) if (!p.puntos.length) p.puntos = [PUNTO_SIN_ESCRIBIR];
  // Nada de edad, familia, origen, salud… ni en la pregunta ni en lo que se espera oír (21 nov 2026).
  for (const [i, p] of preguntas.entries()) {
    const tema = [p.texto, ...p.puntos].map(preguntaDiscriminatoria).find(Boolean);
    if (tema) return { ok: false, error: `La pregunta ${i + 1} trata ${deTema(tema)}: en una entrevista no se puede preguntar, es discriminación. Pregunta por el puesto.` };
  }
  return { ok: true, preguntas };
}

/**
 * La nota que pone la empresa: los puntos que ha marcado como cubiertos sobre
 * el total, de 0 a 100. Las marcas deben tener la forma de las preguntas.
 */
export function notaDeMarcas(preguntas: Pregunta[], marcas: unknown): { nota: number; marcas: boolean[][] } | null {
  if (!Array.isArray(marcas) || marcas.length !== preguntas.length) return null;
  const limpias: boolean[][] = [];
  let total = 0, marcados = 0;
  for (let i = 0; i < preguntas.length; i++) {
    const fila = marcas[i];
    if (!Array.isArray(fila) || fila.length !== preguntas[i].puntos.length) return null;
    limpias.push(fila.map((x) => x === true));
    total += fila.length;
    marcados += fila.filter((x) => x === true).length;
  }
  return { nota: total ? Math.round((marcados / total) * 100) : 0, marcas: limpias };
}

const nuevoId = () => randomBytes(12).toString("base64url");

// ── Las entrevistas de una empresa ────────────────────────────────────────
export async function entrevistasDe(empresaId: string): Promise<Entrevista[]> {
  await asegurarTablasEntrevistaEmpresa();
  const { rows } = await getPool().query<Entrevista>(
    "SELECT id, empresa, puesto, preguntas FROM entrevista_empresa WHERE user_id = $1 ORDER BY actualizado DESC", [empresaId]
  );
  return rows;
}

export async function guardarEntrevista(empresaId: string, e: { id?: string; empresa: string; puesto: string; preguntas: Pregunta[] }): Promise<string> {
  await asegurarTablasEntrevistaEmpresa();
  if (e.id) {
    const { rowCount } = await getPool().query(
      `UPDATE entrevista_empresa SET empresa = $3, puesto = $4, preguntas = $5, actualizado = now()
        WHERE id = $1 AND user_id = $2`,
      [e.id, empresaId, e.empresa, e.puesto, JSON.stringify(e.preguntas)]
    );
    if (rowCount) return e.id;
  }
  const id = nuevoId();
  await getPool().query(
    "INSERT INTO entrevista_empresa (id, user_id, empresa, puesto, preguntas) VALUES ($1, $2, $3, $4, $5)",
    [id, empresaId, e.empresa, e.puesto, JSON.stringify(e.preguntas)]
  );
  return id;
}

export async function quitarEntrevista(empresaId: string, id: string): Promise<boolean> {
  await asegurarTablasEntrevistaEmpresa();
  const { rowCount } = await getPool().query("DELETE FROM entrevista_empresa WHERE id = $1 AND user_id = $2", [id, empresaId]);
  return (rowCount ?? 0) > 0;
}

// ── Invitaciones ──────────────────────────────────────────────────────────
export type ResultadoInvitar =
  | { ok: true; id: string; nueva: boolean; empresa: string; puesto: string }
  | { ok: false; error: string; status: number };

/** La empresa invita a un candidato visible a preparar una de sus entrevistas. */
export async function invitar(empresaId: string, candidatoId: string, entrevistaId: string): Promise<ResultadoInvitar> {
  await asegurarTablasEntrevistaEmpresa();
  const pool = getPool();
  if (empresaId === candidatoId) return { ok: false, error: "No puedes invitarte a ti mismo.", status: 400 };
  const { rows: [e] } = await pool.query<Entrevista>(
    "SELECT id, empresa, puesto, preguntas FROM entrevista_empresa WHERE id = $1 AND user_id = $2", [entrevistaId, empresaId]
  );
  if (!e) return { ok: false, error: "Esa entrevista no está entre las tuyas.", status: 404 };
  // Solo quien ha pedido que las empresas le vean.
  const { rows: visible } = await pool.query(
    "SELECT 1 FROM user_cvs WHERE user_id::text = $1 AND visible_empresas = true LIMIT 1", [candidatoId]
  );
  if (!visible.length) return { ok: false, error: "Este candidato no tiene su perfil visible para empresas.", status: 404 };
  // Si ya estaba invitado se contesta antes de mirar los topes: volver a pulsar
  // no gasta cupo ni le avisa otra vez, y con el cupo lleno no debe dar error.
  const { rows: [previa] } = await pool.query<{ id: string }>(
    "SELECT id FROM entrevista_invitacion WHERE empresa_id = $1 AND user_id = $2 AND entrevista_id = $3", [empresaId, candidatoId, e.id]
  );
  if (previa) return { ok: true, id: previa.id, nueva: false, empresa: e.empresa, puesto: e.puesto };
  const { rows: [hoy] } = await pool.query<{ n: number }>(
    "SELECT count(*)::int AS n FROM entrevista_invitacion WHERE empresa_id = $1 AND creado > now() - interval '1 day'", [empresaId]
  );
  if (hoy.n >= INVITACIONES_AL_DIA) return { ok: false, error: `Puedes invitar a ${INVITACIONES_AL_DIA} candidatos al día.`, status: 429 };
  // El cupo es de la empresa: cuenta lo que invite cualquiera de su equipo.
  if ((await invitacionesDelMes(empresaId)) >= LIMITES_EMPRESA.invitacionesMes) {
    return { ok: false, error: `Ya has usado las ${LIMITES_EMPRESA.invitacionesMes} invitaciones de este mes. Se renuevan el día 1.`, status: 429 };
  }
  const id = nuevoId();
  const { rows } = await pool.query<{ id: string; nueva: boolean }>(
    `INSERT INTO entrevista_invitacion (id, user_id, empresa_id, entrevista_id, empresa, puesto, preguntas)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (empresa_id, user_id, entrevista_id) DO UPDATE SET empresa = entrevista_invitacion.empresa
     RETURNING id, (xmax = 0) AS nueva`,
    [id, candidatoId, empresaId, e.id, e.empresa, e.puesto, JSON.stringify(e.preguntas)]
  );
  return { ok: true, id: rows[0].id, nueva: rows[0].nueva, empresa: e.empresa, puesto: e.puesto };
}

/** Invitaciones de la empresa desde el día 1 de este mes. Volver a invitar a quien ya lo está no suma. */
export async function invitacionesDelMes(empresaId: string): Promise<number> {
  await asegurarTablasEntrevistaEmpresa();
  const { rows: [r] } = await getPool().query<{ n: number }>(
    `SELECT count(*)::int AS n FROM entrevista_invitacion WHERE empresa_id = $1 AND creado >= ${INICIO_DEL_MES}`, [empresaId]
  );
  return r.n;
}

const COLUMNAS = `id, user_id, empresa_id, empresa, puesto, preguntas, intentos, respuestas, enviada_en, marcas, nota, creado`;

export async function invitacionPorId(id: string): Promise<Invitacion | null> {
  await asegurarTablasEntrevistaEmpresa();
  const { rows } = await getPool().query<Invitacion>(`SELECT ${COLUMNAS} FROM entrevista_invitacion WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

export async function invitacionesDeEmpresa(empresaId: string): Promise<Invitacion[]> {
  await asegurarTablasEntrevistaEmpresa();
  const { rows } = await getPool().query<Invitacion>(
    `SELECT ${COLUMNAS} FROM entrevista_invitacion WHERE empresa_id = $1 ORDER BY enviada_en DESC NULLS LAST, creado DESC LIMIT 200`, [empresaId]
  );
  return rows;
}

export async function invitacionesDeCandidato(userId: string): Promise<Invitacion[]> {
  await asegurarTablasEntrevistaEmpresa();
  const { rows } = await getPool().query<Invitacion>(
    `SELECT ${COLUMNAS} FROM entrevista_invitacion WHERE user_id = $1 ORDER BY creado DESC`, [userId]
  );
  return rows;
}

/** El candidato manda sus respuestas. Se borran las marcas de antes: hay que volver a leerlas. */
export async function mandarRespuestas(id: string, userId: string, respuestas: string[]): Promise<boolean> {
  const { rowCount } = await getPool().query(
    `UPDATE entrevista_invitacion SET respuestas = $3, enviada_en = now(), marcas = NULL, nota = NULL
      WHERE id = $1 AND user_id = $2`,
    [id, userId, JSON.stringify(respuestas)]
  );
  return (rowCount ?? 0) > 0;
}

export async function quitarInvitacion(id: string, userId: string): Promise<boolean> {
  await asegurarTablasEntrevistaEmpresa();
  const { rowCount } = await getPool().query("DELETE FROM entrevista_invitacion WHERE id = $1 AND user_id = $2", [id, userId]);
  return (rowCount ?? 0) > 0;
}

export async function guardarMarcas(id: string, empresaId: string, marcas: boolean[][], nota: number): Promise<boolean> {
  const { rowCount } = await getPool().query(
    `UPDATE entrevista_invitacion SET marcas = $3, nota = $4 WHERE id = $1 AND empresa_id = $2 AND respuestas IS NOT NULL`,
    [id, empresaId, JSON.stringify(marcas), nota]
  );
  return (rowCount ?? 0) > 0;
}
