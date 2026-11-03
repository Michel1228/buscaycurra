/**
 * lib/referencias/referencias.ts — Cartas de recomendación que confirma quien las firmó.
 *
 * POR QUÉ (3 nov 2026). Las empresas y las ETT buscan gente de fiar, y Michel
 * quería premiar a quien lo acredite. Lo aprobado:
 *   - Solo lo bueno, y lo aporta la persona. Nada de faltas de asistencia ni
 *     bajas (pueden revelar la salud, art. 9 RGPD) ni notas de empresas sobre
 *     nadie en una base que vean otras: eso sería una lista negra.
 *   - La confirma quien la firmó, desde el correo de su empresa (no vale Gmail):
 *     le escribimos una vez y contesta con un clic.
 *   - Premio: 5 envíos de CV por carta confirmada, como mucho 2 cartas.
 *   - Las empresas con Plan Empresa ven quién la firmó y cuándo lo confirmó; la
 *     carta, solo si la persona lo permite. Quien tiene una confirmada sale
 *     antes en el portal de candidatos.
 *
 * Tablas en la base propia, creadas al primer uso (como premios_usuario). La
 * carta va al almacenamiento privado "cvs", junto al CV: <userId>/referencia-<id>.pdf,
 * y así el borrado de cuenta la quita con lo demás.
 */
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { getPool } from "@/lib/db";
import { correoCreibleParaOferta, esBuzonPublico } from "@/lib/job-search/correo-oferta";
import { asegurarTablasPremios, darPremio } from "@/lib/referidos/premios";

export const ENVIOS_POR_REFERENCIA = 5;
export const REFERENCIAS_CON_PREMIO = 2;
export const MAX_REFERENCIAS = 3;
/** Correos pedidos por persona en 30 días, contando los de cartas ya quitadas. */
export const PETICIONES_EN_30_DIAS = 3;

export type EstadoReferencia = "pendiente" | "verificada" | "rechazada";

export interface Referencia {
  id: string;
  empresa: string;
  firmante: string;
  cargo: string;
  email: string;
  carta_publica: boolean;
  tiene_carta: boolean;
  estado: EstadoReferencia;
  respondida_en: string | null;
  premiada: boolean;
}

let tablasListas = false;

export async function asegurarTablasReferencias(): Promise<void> {
  if (tablasListas) return;
  await getPool().query(`
    CREATE TABLE IF NOT EXISTS referencia_laboral (
      id            TEXT PRIMARY KEY,
      user_id       TEXT NOT NULL,
      empresa       TEXT NOT NULL,
      firmante      TEXT NOT NULL,
      cargo         TEXT NOT NULL,
      email         TEXT NOT NULL,
      carta_ruta    TEXT,
      carta_publica BOOLEAN NOT NULL DEFAULT false,
      estado        TEXT NOT NULL DEFAULT 'pendiente',
      respondida_en TIMESTAMPTZ,
      premiada      BOOLEAN NOT NULL DEFAULT false,
      creado_en     TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS referencia_laboral_user ON referencia_laboral (user_id);
    -- A quién se ha escrito, aunque luego se quite la carta: sin esto, quitar y
    -- volver a subir mandaría correos sin fin a la misma persona.
    CREATE TABLE IF NOT EXISTS referencia_peticion (
      user_id TEXT NOT NULL,
      email   TEXT NOT NULL,
      creado  TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  tablasListas = true;
}

/**
 * ¿Es el correo de esa empresa? Lo de un Gmail lo puede escribir cualquiera, y
 * un dominio que no tiene que ver con la empresa no prueba nada. Es la misma
 * comprobación que decide a qué correos de ofertas se manda un CV.
 */
export function correoDeEmpresaValido(email: string, empresa: string): boolean {
  if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email.trim())) return false;
  if (esBuzonPublico(email)) return false;
  return correoCreibleParaOferta(email, empresa, null, null);
}

// ── El enlace del correo, firmado: sin la firma nadie contesta por otro ───────
function firma(id: string): string | null {
  const s = process.env.ALERTS_SECRET || process.env.ADMIN_SECRET;
  if (!s) return null;
  return createHmac("sha256", s).update(`referencia:${id}`).digest("base64url").slice(0, 32);
}

export function firmaReferenciaValida(id: string, t: string): boolean {
  const esperada = firma(id);
  if (!esperada || !t) return false;
  const a = Buffer.from(esperada);
  const b = Buffer.from(t);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function enlaceReferencia(id: string): string | null {
  const f = firma(id);
  return f ? `https://buscaycurra.es/api/referencias/confirmar?r=${encodeURIComponent(id)}&t=${f}` : null;
}

export const nuevoIdReferencia = () => randomBytes(12).toString("base64url");

/** Enlace a la carta que caduca solo: el almacenamiento de los CV es privado. */
export async function enlaceCarta(ruta: string, segundos: number): Promise<string | null> {
  const { data } = await createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    .storage.from("cvs").createSignedUrl(ruta, segundos);
  return data?.signedUrl ?? null;
}

const COLUMNAS = `id, empresa, firmante, cargo, email, carta_publica, (carta_ruta IS NOT NULL) AS tiene_carta,
  estado, respondida_en, premiada`;

export async function referenciasDe(userId: string): Promise<Referencia[]> {
  await asegurarTablasReferencias();
  const { rows } = await getPool().query<Referencia>(
    `SELECT ${COLUMNAS} FROM referencia_laboral WHERE user_id = $1 ORDER BY creado_en`, [userId]
  );
  return rows;
}

/** Lo que ve una empresa: solo las confirmadas. */
export async function referenciasVerificadas(userId: string): Promise<Array<Referencia & { carta_ruta: string | null }>> {
  await asegurarTablasReferencias();
  const { rows } = await getPool().query(
    `SELECT ${COLUMNAS}, carta_ruta FROM referencia_laboral
      WHERE user_id = $1 AND estado = 'verificada' ORDER BY respondida_en DESC`, [userId]
  );
  return rows;
}

export async function referenciaPorId(id: string): Promise<(Referencia & { user_id: string; carta_ruta: string | null }) | null> {
  await asegurarTablasReferencias();
  const { rows } = await getPool().query(
    `SELECT ${COLUMNAS}, user_id, carta_ruta FROM referencia_laboral WHERE id = $1`, [id]
  );
  return rows[0] ?? null;
}

/** Por qué no se puede pedir otra, o null si se puede. */
export async function motivoParaNoPedir(userId: string, email: string): Promise<string | null> {
  await asegurarTablasReferencias();
  const pool = getPool();
  await pool.query(`DELETE FROM referencia_peticion WHERE creado < now() - interval '30 days'`);
  const { rows: [n] } = await pool.query<{ total: number }>(
    `SELECT count(*)::int AS total FROM referencia_laboral WHERE user_id = $1`, [userId]
  );
  if (n.total >= MAX_REFERENCIAS) return `Puedes tener ${MAX_REFERENCIAS} cartas como mucho. Quita una para subir otra.`;
  const { rows: pedidas } = await pool.query<{ email: string }>(
    `SELECT email FROM referencia_peticion WHERE user_id = $1`, [userId]
  );
  if (pedidas.some((p) => p.email === email.trim().toLowerCase())) return "Ya le escribimos a ese correo hace poco. Si no contesta, prueba con otra persona.";
  if (pedidas.length >= PETICIONES_EN_30_DIAS) return `Puedes pedir ${PETICIONES_EN_30_DIAS} confirmaciones cada 30 días. Prueba dentro de unos días.`;
  return null;
}

export async function crearReferencia(r: {
  id: string; userId: string; empresa: string; firmante: string; cargo: string; email: string;
  cartaRuta: string; cartaPublica: boolean;
}): Promise<void> {
  await asegurarTablasReferencias();
  await getPool().query(
    `INSERT INTO referencia_laboral (id, user_id, empresa, firmante, cargo, email, carta_ruta, carta_publica)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [r.id, r.userId, r.empresa, r.firmante, r.cargo, r.email.trim().toLowerCase(), r.cartaRuta, r.cartaPublica]
  );
}

/** Apunta que se le ha escrito (solo cuando el correo ha salido). */
export async function apuntarPeticion(userId: string, email: string): Promise<void> {
  await getPool().query(`INSERT INTO referencia_peticion (user_id, email) VALUES ($1, $2)`, [userId, email.trim().toLowerCase()]);
}

/** Quita una carta suya. Devuelve la ruta del fichero para borrarlo, o undefined si no era suya. */
export async function quitarReferencia(userId: string, id: string): Promise<string | null | undefined> {
  await asegurarTablasReferencias();
  const { rows } = await getPool().query<{ carta_ruta: string | null }>(
    `DELETE FROM referencia_laboral WHERE id = $1 AND user_id = $2 RETURNING carta_ruta`, [id, userId]
  );
  return rows.length ? rows[0].carta_ruta : undefined;
}

export type Respuesta =
  | { ok: true; estado: "verificada" | "rechazada"; userId: string; premiada: boolean; cartaRuta: string | null }
  | { ok: false; motivo: "no-existe" | "ya-contestada" };

/**
 * Lo que contesta quien firmó. Solo cuenta la primera respuesta. El premio se
 * reparte con un candado por persona: dos cartas confirmadas a la vez no pueden
 * pasar las dos del tope.
 */
export async function responderReferencia(id: string, esSuya: boolean): Promise<Respuesta> {
  await asegurarTablasReferencias();
  await asegurarTablasPremios();
  const cliente = await getPool().connect();
  let resultado: Respuesta;
  try {
    await cliente.query("BEGIN");
    const { rows } = await cliente.query<{ user_id: string; carta_ruta: string | null }>(
      `UPDATE referencia_laboral SET estado = $2, respondida_en = now()
        WHERE id = $1 AND estado = 'pendiente' RETURNING user_id, carta_ruta`,
      [id, esSuya ? "verificada" : "rechazada"]
    );
    if (!rows.length) {
      const existe = await cliente.query("SELECT 1 FROM referencia_laboral WHERE id = $1", [id]);
      await cliente.query("ROLLBACK");
      return { ok: false, motivo: existe.rowCount ? "ya-contestada" : "no-existe" };
    }
    const { user_id: userId, carta_ruta: cartaRuta } = rows[0];
    let premiada = false;
    if (esSuya) {
      await cliente.query("SELECT pg_advisory_xact_lock(hashtext($1))", [`referencia:${userId}`]);
      // Los premios dados se cuentan en premios_gastados, que no se borra al
      // quitar la carta: si no, quitar una premiada y subir otra saltaría el tope.
      const { rows: [c] } = await cliente.query<{ n: number }>(
        "SELECT count(*)::int AS n FROM premios_gastados WHERE user_id = $1 AND clave LIKE 'premio-referencia:%'", [userId]
      );
      if (c.n < REFERENCIAS_CON_PREMIO) {
        await cliente.query("INSERT INTO premios_gastados (user_id, clave) VALUES ($1, $2)", [userId, `premio-referencia:${id}`]);
        await cliente.query("UPDATE referencia_laboral SET premiada = true WHERE id = $1", [id]);
        premiada = true;
      }
    } else {
      // Una carta que quien firma no reconoce no se enseña ni se guarda.
      await cliente.query("UPDATE referencia_laboral SET carta_ruta = NULL WHERE id = $1", [id]);
    }
    await cliente.query("COMMIT");
    resultado = { ok: true, estado: esSuya ? "verificada" : "rechazada", userId, premiada, cartaRuta };
  } catch (e) {
    await cliente.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    cliente.release();
  }
  if (resultado.ok && resultado.premiada) await darPremio(resultado.userId, ENVIOS_POR_REFERENCIA, 0);
  return resultado;
}
