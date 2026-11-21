/**
 * lib/empresas/verificacion.ts — Empresas verificadas: el alta, el visto bueno de Michel y el código.
 *
 * POR QUÉ (21 nov 2026, decisiones de Michel). Ver candidatos ya no se compra
 * con el Plan Empresa: es para empresas, ETT y agencias de colocación de
 * verdad, y de momento gratis. El camino:
 *
 *   1. La empresa se da de alta en /empresas/alta con su NIF, razón social,
 *      tipo (con el número de autorización si es ETT o agencia), sus sectores y
 *      un correo de la empresa. Queda «pendiente» y a Michel le llega un aviso.
 *   2. Michel lo mira en los registros oficiales y la aprueba en /app/admin/empresas.
 *      Se genera un código y se manda al correo de la empresa: meterlo prueba
 *      que quien se dio de alta controla ese correo.
 *   3. Con el código, la empresa queda «activa» y entra a los candidatos de su
 *      alcance (lib/empresas/reglas.ts). Su equipo entra con sus cuentas
 *      (lib/empresas/cuenta.ts).
 *
 * Del código solo se guarda su huella, caduca a los 30 días y se bloquea tras 5
 * fallos (pide uno nuevo a Michel). Un NIF solo puede tener una cuenta activa:
 * el resto de la empresa entra por el equipo.
 *
 * Tabla en la base propia, creada al primer uso. Borrar la cuenta la limpia
 * (lib/cuenta/borrar-datos.ts).
 */
import { createHmac, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { getPool } from "@/lib/db";
import { MAX_SECTORES, autorizacionValida, esSectorEmpresa, esTipoEntidad, nifValido, normalizarNif,
  type Alcance, type SectorEmpresa, type TipoEntidad } from "@/lib/empresas/reglas";

export type EstadoVerificacion = "pendiente" | "aprobada" | "activa" | "rechazada" | "suspendida";

export interface Solicitud {
  id: string;
  user_id: string;
  email_cuenta: string;
  razon_social: string;
  nif: string;
  tipo: TipoEntidad;
  autorizacion: string | null;
  sectores: SectorEmpresa[];
  busca: string | null;
  provincia: string | null;
  web: string | null;
  correo_empresa: string;
  telefono: string | null;
  estado: EstadoVerificacion;
  motivo: string | null;
  intentos: number;
  codigo_caduca: string | null;
  revisado_por: string | null;
  revisado_en: string | null;
  activada_en: string | null;
  creado: string;
}

export const DIAS_CODIGO = 30;
export const INTENTOS_CODIGO = 5;

let tablaLista = false;

export async function asegurarTablaVerificacion(): Promise<void> {
  if (tablaLista) return;
  await getPool().query(`
    CREATE TABLE IF NOT EXISTS empresa_verificacion (
      id             TEXT PRIMARY KEY,
      user_id        TEXT NOT NULL UNIQUE,
      email_cuenta   TEXT NOT NULL,
      razon_social   TEXT NOT NULL,
      nif            TEXT NOT NULL,
      tipo           TEXT NOT NULL,
      autorizacion   TEXT,
      sectores       TEXT[] NOT NULL DEFAULT '{}',
      busca          TEXT,
      provincia      TEXT,
      web            TEXT,
      correo_empresa TEXT NOT NULL,
      telefono       TEXT,
      estado         TEXT NOT NULL DEFAULT 'pendiente',
      motivo         TEXT,
      codigo_hash    TEXT,
      codigo_caduca  TIMESTAMPTZ,
      intentos       INT NOT NULL DEFAULT 0,
      revisado_por   TEXT,
      revisado_en    TIMESTAMPTZ,
      activada_en    TIMESTAMPTZ,
      creado         TIMESTAMPTZ NOT NULL DEFAULT now(),
      actualizado    TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    -- Un NIF, una sola cuenta aprobada o activa: los demás de la empresa, por el equipo.
    CREATE UNIQUE INDEX IF NOT EXISTS empresa_verificacion_nif_vigente
      ON empresa_verificacion (nif) WHERE estado IN ('aprobada', 'activa');
  `);
  tablaLista = true;
}

const COLUMNAS = `id, user_id, email_cuenta, razon_social, nif, tipo, autorizacion, sectores, busca, provincia, web,
  correo_empresa, telefono, estado, motivo, intentos, codigo_caduca, revisado_por, revisado_en, activada_en, creado`;

export async function solicitudDe(userId: string): Promise<Solicitud | null> {
  await asegurarTablaVerificacion();
  const { rows: [s] } = await getPool().query<Solicitud>(`SELECT ${COLUMNAS} FROM empresa_verificacion WHERE user_id = $1`, [userId]);
  return s ?? null;
}

/** Lo que ve la propia empresa de su solicitud (sin la huella del código ni quién la revisó). */
export function paraLaEmpresa(s: Solicitud | null) {
  if (!s) return null;
  return {
    razonSocial: s.razon_social, nif: s.nif, tipo: s.tipo, autorizacion: s.autorizacion, sectores: s.sectores, busca: s.busca,
    provincia: s.provincia, web: s.web, correoEmpresa: s.correo_empresa, telefono: s.telefono, estado: s.estado, motivo: s.motivo,
    codigoCaduca: s.codigo_caduca, creado: s.creado,
  };
}

/** El alcance de una empresa activa (tipo y sectores), o null si no lo es. */
export async function alcanceDe(empresaId: string): Promise<(Alcance & { razonSocial: string }) | null> {
  await asegurarTablaVerificacion();
  const { rows: [s] } = await getPool().query<{ tipo: TipoEntidad; sectores: SectorEmpresa[]; razon_social: string }>(
    "SELECT tipo, sectores, razon_social FROM empresa_verificacion WHERE user_id = $1 AND estado = 'activa'", [empresaId]
  );
  return s ? { tipo: s.tipo, sectores: s.sectores, razonSocial: s.razon_social } : null;
}

// ── 1. El alta ────────────────────────────────────────────────────────────
const CORREO = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
const limpio = (v: unknown, n: number) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, n);

export interface DatosAlta {
  razonSocial: string; nif: string; tipo: TipoEntidad; autorizacion: string | null; sectores: SectorEmpresa[];
  busca: string | null; provincia: string | null; web: string | null; correoEmpresa: string; telefono: string | null;
}

/** Comprueba y limpia lo que manda el formulario de alta. */
export function validarAlta(b: Record<string, unknown>): { ok: true; datos: DatosAlta } | { ok: false; error: string } {
  const razonSocial = limpio(b.razonSocial, 160);
  const nif = normalizarNif(String(b.nif ?? ""));
  const tipo = b.tipo;
  const autorizacion = limpio(b.autorizacion, 30) || null;
  const sectores = [...new Set(Array.isArray(b.sectores) ? b.sectores : [])].filter(esSectorEmpresa);
  const correoEmpresa = limpio(b.correoEmpresa, 200).toLowerCase();
  if (razonSocial.length < 2) return { ok: false, error: "Escribe el nombre de la empresa como figura en su NIF (razón social)." };
  if (!nifValido(nif)) return { ok: false, error: "Ese NIF no es válido. Revisa las letras y los números." };
  if (!esTipoEntidad(tipo)) return { ok: false, error: "Elige si sois empresa, ETT o agencia de colocación." };
  if (tipo !== "empresa" && !autorizacion) {
    return { ok: false, error: tipo === "ett" ? "Pon vuestro número de autorización como ETT." : "Pon vuestro número de agencia de colocación." };
  }
  if (autorizacion && !autorizacionValida(tipo, autorizacion)) {
    return { ok: false, error: tipo === "ett" ? "El número de autorización de una ETT tiene 8 cifras (o la forma antigua, como 31/0012/95)." : "El número de agencia de colocación tiene 10 cifras." };
  }
  if (tipo === "empresa" && !sectores.length) return { ok: false, error: "Elige el sector (o los sectores) en el que buscáis gente." };
  if (sectores.length > MAX_SECTORES) return { ok: false, error: `Como mucho ${MAX_SECTORES} sectores.` };
  if (!CORREO.test(correoEmpresa)) return { ok: false, error: "Pon un correo de la empresa: ahí os mandaremos el código." };
  // Quien ve candidatos trata sus datos y responde de ello (RGPD): lo declara al darse de alta.
  if (b.compromiso !== true) return { ok: false, error: "Marca la casilla: los datos de los candidatos son solo para vuestros procesos de selección." };
  return {
    ok: true,
    datos: {
      razonSocial, nif, tipo, autorizacion: tipo === "empresa" ? null : autorizacion,
      sectores: tipo === "empresa" ? sectores : [], busca: limpio(b.busca, 300) || null, provincia: limpio(b.provincia, 80) || null,
      web: limpio(b.web, 200) || null, correoEmpresa, telefono: limpio(b.telefono, 30) || null,
    },
  };
}

/**
 * Guarda el alta (o la corrige, si estaba pendiente o rechazada) y la deja
 * pendiente de revisión. Una ya aprobada o activa no se cambia desde aquí.
 */
export async function guardarSolicitud(userId: string, emailCuenta: string, d: DatosAlta): Promise<{ ok: true; solicitud: Solicitud } | { ok: false; error: string }> {
  await asegurarTablaVerificacion();
  const ya = await solicitudDe(userId);
  if (ya && (ya.estado === "aprobada" || ya.estado === "activa")) return { ok: false, error: "Vuestra empresa ya está verificada. Para cambiar algo, escríbenos." };
  if (ya?.estado === "suspendida") return { ok: false, error: "El acceso de esta cuenta está suspendido. Escríbenos si crees que es un error." };
  const { rows: [otra] } = await getPool().query(
    "SELECT 1 FROM empresa_verificacion WHERE nif = $1 AND estado IN ('aprobada', 'activa') AND user_id <> $2", [d.nif, userId]
  );
  if (otra) return { ok: false, error: "Ese NIF ya tiene una cuenta verificada. Pide a quien la tiene que te añada a su equipo." };
  const { rows: [s] } = await getPool().query<Solicitud>(
    `INSERT INTO empresa_verificacion (id, user_id, email_cuenta, razon_social, nif, tipo, autorizacion, sectores, busca, provincia, web, correo_empresa, telefono)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
     ON CONFLICT (user_id) DO UPDATE SET email_cuenta = EXCLUDED.email_cuenta, razon_social = EXCLUDED.razon_social, nif = EXCLUDED.nif,
       tipo = EXCLUDED.tipo, autorizacion = EXCLUDED.autorizacion, sectores = EXCLUDED.sectores, busca = EXCLUDED.busca,
       provincia = EXCLUDED.provincia, web = EXCLUDED.web, correo_empresa = EXCLUDED.correo_empresa, telefono = EXCLUDED.telefono,
       estado = 'pendiente', motivo = NULL, actualizado = now()
     RETURNING ${COLUMNAS}`,
    [randomUUID(), userId, emailCuenta.toLowerCase(), d.razonSocial, d.nif, d.tipo, d.autorizacion, d.sectores, d.busca, d.provincia, d.web, d.correoEmpresa, d.telefono]
  );
  return { ok: true, solicitud: s };
}

// ── 2. El visto bueno de Michel ───────────────────────────────────────────
export async function listarSolicitudes(): Promise<Solicitud[]> {
  await asegurarTablaVerificacion();
  const { rows } = await getPool().query<Solicitud>(
    `SELECT ${COLUMNAS} FROM empresa_verificacion
      ORDER BY (estado = 'pendiente') DESC, actualizado DESC LIMIT 300`
  );
  return rows;
}

// Sin letras que se confunden al copiarlas (0/O, 1/I/L).
const ALFABETO = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function nuevoCodigo(): string {
  const b = randomBytes(8);
  const c = Array.from(b, (x) => ALFABETO[x % ALFABETO.length]).join("");
  return `${c.slice(0, 4)}-${c.slice(4)}`;
}

export const normalizarCodigo = (c: string) => String(c || "").toUpperCase().replace(/[^A-Z0-9]/g, "");

function huella(id: string, codigo: string): string {
  const secreto = process.env.ALERTS_SECRET || process.env.ADMIN_SECRET || "";
  return createHmac("sha256", secreto || "empresa").update(`empresa-codigo:${id}:${normalizarCodigo(codigo)}`).digest("hex");
}

/**
 * Aprueba (o vuelve a mandar el código a) una solicitud: genera un código nuevo
 * y lo devuelve para mandarlo al correo de la empresa. El anterior deja de valer.
 */
export async function aprobar(id: string, admin: string): Promise<{ ok: true; codigo: string; solicitud: Solicitud } | { ok: false; error: string }> {
  await asegurarTablaVerificacion();
  const codigo = nuevoCodigo();
  try {
    const { rows: [s] } = await getPool().query<Solicitud>(
      `UPDATE empresa_verificacion SET estado = 'aprobada', motivo = NULL, codigo_hash = $2,
              codigo_caduca = now() + interval '${DIAS_CODIGO} days', intentos = 0, revisado_por = $3, revisado_en = now(), actualizado = now()
        WHERE id = $1 AND estado IN ('pendiente', 'aprobada', 'rechazada')
        RETURNING ${COLUMNAS}`,
      [id, huella(id, codigo), admin]
    );
    if (!s) return { ok: false, error: "Esa solicitud no está o ya está activa." };
    return { ok: true, codigo, solicitud: s };
  } catch (e) {
    if ((e as { code?: string }).code === "23505") return { ok: false, error: "Ese NIF ya tiene otra cuenta verificada." };
    throw e;
  }
}

/** Rechazar (con el motivo, que ve la empresa) o suspender una que ya estaba dentro. */
export async function cerrar(id: string, admin: string, accion: "rechazar" | "suspender", motivo: string): Promise<Solicitud | null> {
  await asegurarTablaVerificacion();
  const { rows: [s] } = await getPool().query<Solicitud>(
    `UPDATE empresa_verificacion SET estado = $2, motivo = $3, codigo_hash = NULL, codigo_caduca = NULL,
            revisado_por = $4, revisado_en = now(), actualizado = now()
      WHERE id = $1 AND estado IN (${accion === "rechazar" ? "'pendiente', 'aprobada'" : "'aprobada', 'activa'"})
      RETURNING ${COLUMNAS}`,
    [id, accion === "rechazar" ? "rechazada" : "suspendida", limpio(motivo, 300) || null, admin]
  );
  return s ?? null;
}

// ── 3. El código ──────────────────────────────────────────────────────────
export type ResultadoCodigo =
  | { ok: true; solicitud: Solicitud }
  | { ok: false; error: string };

export async function activarConCodigo(userId: string, codigo: string): Promise<ResultadoCodigo> {
  await asegurarTablaVerificacion();
  const c = await getPool().connect();
  try {
    await c.query("BEGIN");
    const { rows: [s] } = await c.query<Solicitud & { codigo_hash: string | null; caducado: boolean }>(
      `SELECT ${COLUMNAS}, codigo_hash, (codigo_caduca < now()) AS caducado FROM empresa_verificacion WHERE user_id = $1 FOR UPDATE`, [userId]
    );
    const fallo = async (error: string): Promise<ResultadoCodigo> => { await c.query("COMMIT"); return { ok: false, error }; };
    if (!s) return await fallo("Primero da de alta tu empresa.");
    if (s.estado === "activa") { await c.query("COMMIT"); return { ok: true, solicitud: s }; }
    if (s.estado !== "aprobada" || !s.codigo_hash) return await fallo("Tu empresa aún no está aprobada: te avisaremos por correo.");
    if (s.caducado) return await fallo("Ese código ha caducado. Escríbenos y te mandamos otro.");
    if (s.intentos >= INTENTOS_CODIGO) return await fallo("Demasiados intentos. Escríbenos y te mandamos un código nuevo.");
    const a = Buffer.from(huella(s.id, codigo));
    const b = Buffer.from(s.codigo_hash);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      await c.query("UPDATE empresa_verificacion SET intentos = intentos + 1 WHERE id = $1", [s.id]);
      const quedan = INTENTOS_CODIGO - s.intentos - 1;
      return await fallo(quedan > 0 ? `Ese código no es. Te quedan ${quedan} ${quedan === 1 ? "intento" : "intentos"}.` : "Ese código no es, y ya no quedan intentos. Escríbenos y te mandamos otro.");
    }
    const { rows: [lista] } = await c.query<Solicitud>(
      `UPDATE empresa_verificacion SET estado = 'activa', activada_en = now(), codigo_hash = NULL, codigo_caduca = NULL, actualizado = now()
        WHERE id = $1 RETURNING ${COLUMNAS}`, [s.id]
    );
    await c.query("COMMIT");
    return { ok: true, solicitud: lista };
  } catch (e) {
    await c.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    c.release();
  }
}
