/**
 * lib/empresas/candidatos.ts — Los candidatos visibles, con su puntuación y sus sectores.
 *
 * Solo los que han activado «Visible para empresas» en el CV que tienen al día
 * (user_cvs, el más reciente). La puntuación y el sector salen de
 * lib/empresas/reglas.ts: hechos que se pueden comprobar, sin IA.
 *
 * Se leen todos los visibles y se ordenan aquí: son decenas o cientos, y así el
 * orden por puntuación y el alcance por sector se aplican igual en la lista
 * (/api/empresas/candidatos), en el CV completo (/talento) y al invitar.
 */
import { getPool } from "@/lib/db";
import { asegurarTablasReferencias } from "@/lib/referencias/referencias";
import { puedeVer, puntuacionCandidato, sectoresDelCv, type Alcance, type Puntuacion } from "@/lib/empresas/reglas";
import type { SectorEntrevista } from "@/lib/entrevistas/preguntas";

export interface FichaCandidato {
  id: string;
  cv: Record<string, unknown>;
  actualizado: string;
  referencias: number;
  cartas: number;
  sectores: SectorEntrevista[];
  puntuacion: Puntuacion;
}

interface Fila { user_id: string; form_data: Record<string, unknown>; updated_at: string; referencias: number; cartas: number }

async function hayTablaCartas(): Promise<boolean> {
  const { rows: [r] } = await getPool().query<{ hay: boolean }>("SELECT to_regclass('public.cv_cartas') IS NOT NULL AS hay");
  return !!r?.hay;
}

function ficha(f: Fila): FichaCandidato {
  const cv = f.form_data || {};
  return {
    id: String(f.user_id), cv, actualizado: f.updated_at, referencias: Number(f.referencias) || 0, cartas: Number(f.cartas) || 0,
    sectores: sectoresDelCv(cv),
    puntuacion: puntuacionCandidato({ cv, referencias: Number(f.referencias) || 0, cartasPresentacion: Number(f.cartas) || 0, actualizado: f.updated_at }),
  };
}

/**
 * Los visibles que casan con la búsqueda (ciudad y perfil), o uno solo por su id.
 * El perfil se busca en lo profesional, nunca en el contacto: si no, cualquiera
 * podría escribir un correo o un teléfono y saber si esa persona busca trabajo.
 */
export async function candidatosVisibles(f: { ciudad?: string; q?: string; id?: string } = {}): Promise<FichaCandidato[]> {
  await asegurarTablasReferencias();
  const params: string[] = [];
  const conds = ["uc.visible_empresas = true", "uc.form_data IS NOT NULL", "COALESCE(uc.form_data->>'nombre', '') <> ''"];
  if (f.id) { params.push(f.id); conds.push(`uc.user_id::text = $${params.length}`); }
  if (f.ciudad?.trim()) { params.push(`%${f.ciudad.trim()}%`); conds.push(`LOWER(uc.form_data->>'ciudad') LIKE LOWER($${params.length})`); }
  if (f.q?.trim()) {
    params.push(`%${f.q.trim()}%`);
    conds.push(`(uc.form_data - 'email' - 'telefono' - 'nombre' - 'apellidos' - 'fotoUrl')::text ILIKE $${params.length}`);
  }
  const cartas = (await hayTablaCartas())
    ? "(SELECT count(*)::int FROM cv_cartas c WHERE c.user_id = uc.user_id::text)"
    : "0";
  const { rows } = await getPool().query<Fila>(
    `SELECT uc.user_id, uc.form_data, uc.updated_at,
            COALESCE(rv.n, 0) AS referencias, ${cartas} AS cartas
       FROM (SELECT DISTINCT ON (user_id) * FROM user_cvs ORDER BY user_id, updated_at DESC) uc
       LEFT JOIN (SELECT user_id, count(*)::int AS n FROM referencia_laboral WHERE estado = 'verificada' GROUP BY user_id) rv
              ON rv.user_id = uc.user_id::text
      WHERE ${conds.join(" AND ")}
      LIMIT 3000`,
    params
  );
  return rows.map(ficha);
}

/** La del propio candidato, esté visible o no: para que vea su puntuación y qué le falta. */
export async function fichaPropia(userId: string): Promise<(FichaCandidato & { visible: boolean }) | null> {
  await asegurarTablasReferencias();
  const cartas = (await hayTablaCartas()) ? "(SELECT count(*)::int FROM cv_cartas c WHERE c.user_id = $1)" : "0";
  const { rows: [f] } = await getPool().query<Fila & { visible: boolean }>(
    `SELECT uc.user_id, uc.form_data, uc.updated_at, COALESCE(uc.visible_empresas, false) AS visible,
            (SELECT count(*)::int FROM referencia_laboral r WHERE r.user_id = $1 AND r.estado = 'verificada') AS referencias,
            ${cartas} AS cartas
       FROM user_cvs uc WHERE uc.user_id::text = $1 ORDER BY uc.updated_at DESC LIMIT 1`,
    [userId]
  );
  return f ? { ...ficha(f), visible: !!f.visible } : null;
}

/** Uno solo, si está visible. */
export async function candidatoVisible(id: string): Promise<FichaCandidato | null> {
  return (await candidatosVisibles({ id }))[0] ?? null;
}

/** Los que una empresa puede ver, de más puntuación a menos (y, a igualdad, el CV más reciente antes). */
export function ordenarParaEmpresa(lista: FichaCandidato[], alcance: Alcance): FichaCandidato[] {
  return lista
    .filter((c) => puedeVer(alcance, c.sectores))
    .sort((a, b) => b.puntuacion.total - a.puntuacion.total || +new Date(b.actualizado) - +new Date(a.actualizado));
}
