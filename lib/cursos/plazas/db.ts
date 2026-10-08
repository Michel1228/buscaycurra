/**
 * lib/cursos/plazas/db.ts — Guardar y consultar las plazas reales de cursos.
 *
 * Va en la base de datos propia (la de JobListing), no en Supabase: son datos
 * públicos que se reemplazan cada día, no datos de usuarios.
 *
 * La tabla se crea sola la primera vez (mismo patrón que cv_cartas): así el
 * despliegue no depende de que nadie lance una migración a mano.
 *
 * REGLA DE LA SINCRONIZACIÓN: una fuente que falla NO borra sus plazas. Solo
 * se borran las plazas de una fuente que respondió bien y ya no las trae. Si
 * Lanbide se cae un día, mejor enseñar las de ayer que dejar Euskadi vacío.
 */
import { getPool } from "@/lib/db";
import type { FuentePlaza, PlazaCurso } from "./fuentes";
import { fichasDePlaza, normalizarTitulo } from "./emparejar";

let tablaLista = false;

export async function asegurarTabla(): Promise<void> {
  if (tablaLista) return;
  const pool = getPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS curso_plaza (
      id           TEXT PRIMARY KEY,
      fuente       TEXT NOT NULL,
      codigo       TEXT NOT NULL,
      titulo       TEXT NOT NULL,
      titulo_norm  TEXT NOT NULL,
      familia      TEXT,
      provincia    TEXT,
      municipio    TEXT,
      centro       TEXT,
      direccion    TEXT,
      telefono     TEXT,
      email        TEXT,
      web          TEXT,
      url          TEXT NOT NULL,
      inicio       DATE,
      fin          DATE,
      horas        INTEGER,
      modalidad    TEXT,
      dirigido     TEXT,
      certificado  BOOLEAN,
      estado       TEXT,
      fichas       TEXT[] NOT NULL DEFAULT '{}',
      visto_en     TIMESTAMPTZ NOT NULL DEFAULT now(),
      creado_en    TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS curso_plaza_inicio_idx ON curso_plaza (inicio)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS curso_plaza_fichas_idx ON curso_plaza USING GIN (fichas)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS curso_plaza_fuente_idx ON curso_plaza (fuente, visto_en)`);
  tablaLista = true;
}

const COLUMNAS = [
  "id", "fuente", "codigo", "titulo", "titulo_norm", "familia", "provincia", "municipio",
  "centro", "direccion", "telefono", "email", "web", "url", "inicio", "fin", "horas",
  "modalidad", "dirigido", "certificado", "estado", "fichas", "visto_en",
] as const;

/** Tanda de inserción. 250 filas × 23 columnas = 5.750 parámetros, lejos del límite de 65.535. */
const TANDA = 250;

export async function guardarFuente(
  fuente: FuentePlaza,
  plazas: PlazaCurso[],
  ahora: Date
): Promise<{ guardadas: number; retiradas: number }> {
  await asegurarTabla();
  const pool = getPool();

  for (let i = 0; i < plazas.length; i += TANDA) {
    const tanda = plazas.slice(i, i + TANDA);
    const valores: unknown[] = [];
    const filas = tanda.map((p, j) => {
      const fila = [
        p.id, p.fuente, p.codigo, p.titulo, normalizarTitulo(p.titulo), p.familia, p.provincia,
        p.municipio, p.centro, p.direccion, p.telefono, p.email, p.web, p.url, p.inicio, p.fin,
        p.horas, p.modalidad, p.dirigido, p.certificado, p.estado, fichasDePlaza(p.titulo), ahora,
      ];
      valores.push(...fila);
      return `(${fila.map((_, k) => `$${j * COLUMNAS.length + k + 1}`).join(", ")})`;
    });
    const actualizar = COLUMNAS.filter(c => c !== "id").map(c => `${c} = EXCLUDED.${c}`).join(", ");
    await pool.query(
      `INSERT INTO curso_plaza (${COLUMNAS.join(", ")}) VALUES ${filas.join(", ")}
       ON CONFLICT (id) DO UPDATE SET ${actualizar}`,
      valores
    );
  }

  // Lo que esta fuente ya no publica, fuera. Solo de ESTA fuente y solo porque
  // acaba de responder bien.
  const { rowCount } = await pool.query(
    `DELETE FROM curso_plaza WHERE fuente = $1 AND visto_en < $2`,
    [fuente, ahora]
  );
  return { guardadas: plazas.length, retiradas: rowCount ?? 0 };
}

/** Plazas que terminaron hace más de un mes: ya no le sirven a nadie. */
export async function limpiarTerminadas(): Promise<number> {
  await asegurarTabla();
  const { rowCount } = await getPool().query(
    `DELETE FROM curso_plaza WHERE fin IS NOT NULL AND fin < current_date - 30`
  );
  return rowCount ?? 0;
}

export interface FiltroPlazas {
  ficha?: string;
  provincia?: string;
  modalidad?: "presencial" | "online" | "mixta";
  texto?: string;
  limite?: number;
  desde?: number;
}

export interface PlazaPublica {
  id: string;
  fuente: FuentePlaza;
  titulo: string;
  familia: string | null;
  provincia: string | null;
  municipio: string | null;
  centro: string | null;
  direccion: string | null;
  telefono: string | null;
  email: string | null;
  web: string | null;
  url: string;
  inicio: string;
  fin: string | null;
  horas: number | null;
  modalidad: string | null;
  dirigido: string | null;
  certificado: boolean | null;
}

/**
 * Por empezar: desde hoy y como mucho a 18 meses vista. Murcia publica alguna
 * fecha en 2029 que es casi seguro un error de carga; enseñarla como plaza
 * disponible sería mandar a alguien a esperar tres años.
 */
const VENTANA = `inicio >= current_date AND inicio <= current_date + interval '18 months'`;

function condiciones(f: FiltroPlazas): { where: string; params: unknown[] } {
  const partes = [VENTANA];
  const params: unknown[] = [];
  if (f.ficha) { params.push(f.ficha); partes.push(`$${params.length} = ANY(fichas)`); }
  if (f.provincia) { params.push(f.provincia); partes.push(`provincia = $${params.length}`); }
  if (f.modalidad) { params.push(f.modalidad); partes.push(`modalidad = $${params.length}`); }
  if (f.texto) {
    // Cada palabra tiene que estar; sin tildes, como se guardó titulo_norm.
    for (const palabra of normalizarTitulo(f.texto).split(" ").filter(p => p.length >= 2).slice(0, 6)) {
      params.push(`%${palabra.replace(/[%_\\]/g, "")}%`);
      partes.push(`titulo_norm LIKE $${params.length}`);
    }
  }
  return { where: partes.join(" AND "), params };
}

export async function buscarPlazas(f: FiltroPlazas): Promise<{ total: number; plazas: PlazaPublica[] }> {
  await asegurarTabla();
  const { where, params } = condiciones(f);
  const limite = Math.min(Math.max(f.limite ?? 20, 1), 50);
  const desde = Math.max(f.desde ?? 0, 0);
  const { rows } = await getPool().query(
    `SELECT id, fuente, titulo, familia, provincia, municipio, centro, direccion, telefono,
            email, web, url, to_char(inicio, 'YYYY-MM-DD') AS inicio,
            to_char(fin, 'YYYY-MM-DD') AS fin, horas, modalidad, dirigido, certificado,
            count(*) OVER ()::int AS total
       FROM curso_plaza
      WHERE ${where}
      ORDER BY inicio, titulo, id
      LIMIT ${limite} OFFSET ${desde}`,
    params
  );
  return {
    total: rows[0]?.total ?? 0,
    plazas: rows.map(({ total: _t, ...p }) => p as PlazaPublica),
  };
}

/** Cuántas plazas hay por provincia (para el desplegable), con los mismos filtros salvo la provincia. */
export async function provinciasConPlazas(f: FiltroPlazas): Promise<{ provincia: string; n: number }[]> {
  await asegurarTabla();
  const { where, params } = condiciones({ ...f, provincia: undefined });
  const { rows } = await getPool().query(
    `SELECT provincia, count(*)::int AS n FROM curso_plaza
      WHERE ${where} AND provincia IS NOT NULL
      GROUP BY provincia ORDER BY n DESC`,
    params
  );
  return rows;
}

/** Para el panel y el centinela: cuántas hay por fuente y cuándo se vio cada una por última vez. */
export async function resumenPlazas(): Promise<{
  porEmpezar: number;
  fuentes: { fuente: string; porEmpezar: number; ultimaVez: string | null }[];
}> {
  await asegurarTabla();
  const { rows } = await getPool().query(
    `SELECT fuente,
            count(*) FILTER (WHERE ${VENTANA})::int AS por_empezar,
            max(visto_en) AS ultima_vez
       FROM curso_plaza GROUP BY fuente ORDER BY fuente`
  );
  return {
    porEmpezar: rows.reduce((s, r) => s + r.por_empezar, 0),
    fuentes: rows.map(r => ({
      fuente: r.fuente,
      porEmpezar: r.por_empezar,
      ultimaVez: r.ultima_vez ? new Date(r.ultima_vez).toISOString() : null,
    })),
  };
}
