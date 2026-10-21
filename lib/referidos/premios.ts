/**
 * lib/referidos/premios.ts — Invitar a un amigo, y lo que se gana.
 *
 * POR QUÉ (21 oct 2026). Solo el plan Pro tenía código y no había nadie de pago,
 * así que en toda la historia hubo 0 invitaciones. La página decía "Invita y
 * gana" sin decir qué, y el "+10 CVs" que se apuntaba no lo miraba nadie: el
 * límite de envíos nunca lo sumaba. Lo aprobado por Michel:
 *
 *   - Invita cualquiera, también el plan gratis.
 *   - Por cada amigo que se registra con tu enlace y confirma su correo:
 *     +5 envíos de CV y +1 foto con la cámara para ti.
 *   - Tu amigo empieza con +5 envíos extra.
 *   - Hasta 10 amigos al mes con premio (los vendedores de referidos aconsejan
 *     poner tope; además los CVs salen por la cuenta de correo de todo, con
 *     100 al día).
 *
 * Los extras se gastan cuando se acaban los del plan (día, semana o mes) y no
 * caducan. Datos que lo apoyan: en 60 días, 6 de las 23 personas del plan
 * gratis que mandaron CVs llegaron al tope de 3 al día, y son las que más
 * recomiendan.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { getPool } from "@/lib/db";

export const ENVIOS_POR_AMIGO = 5;
export const FOTOS_POR_AMIGO = 1;
export const ENVIOS_DEL_INVITADO = 5;
export const AMIGOS_CON_PREMIO_AL_MES = 10;

let tablasListas = false;

export async function asegurarTablasPremios(): Promise<void> {
  if (tablasListas) return;
  await getPool().query(`
    CREATE TABLE IF NOT EXISTS premios_usuario (
      user_id      TEXT PRIMARY KEY,
      envios_extra INTEGER NOT NULL DEFAULT 0 CHECK (envios_extra >= 0),
      fotos_extra  INTEGER NOT NULL DEFAULT 0 CHECK (fotos_extra >= 0),
      actualizado  TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    -- Un envío extra por empresa y día: la ruta de enviar y el programador
    -- comprueban el límite los dos para el mismo CV, y no se cobra dos veces.
    CREATE TABLE IF NOT EXISTS premios_gastados (
      user_id TEXT NOT NULL,
      clave   TEXT NOT NULL,
      creado  TIMESTAMPTZ NOT NULL DEFAULT now(),
      PRIMARY KEY (user_id, clave)
    );
  `);
  tablasListas = true;
}

export async function premiosDe(userId: string): Promise<{ envios: number; fotos: number }> {
  await asegurarTablasPremios();
  const { rows } = await getPool().query<{ envios_extra: number; fotos_extra: number }>(
    "SELECT envios_extra, fotos_extra FROM premios_usuario WHERE user_id = $1",
    [userId]
  );
  return { envios: rows[0]?.envios_extra ?? 0, fotos: rows[0]?.fotos_extra ?? 0 };
}

export async function darPremio(userId: string, envios: number, fotos: number): Promise<void> {
  await asegurarTablasPremios();
  await getPool().query(
    `INSERT INTO premios_usuario (user_id, envios_extra, fotos_extra) VALUES ($1, $2, $3)
     ON CONFLICT (user_id) DO UPDATE SET envios_extra = premios_usuario.envios_extra + $2,
       fotos_extra = premios_usuario.fotos_extra + $3, actualizado = now()`,
    [userId, envios, fotos]
  );
}

/**
 * Gasta un envío extra para mandar el CV a esta empresa hoy. true si se puede
 * enviar (ya estaba pagado o quedaba saldo), false si no queda ninguno.
 */
export async function gastarEnvioExtra(userId: string, companyEmail: string): Promise<boolean> {
  await asegurarTablasPremios();
  const clave = `envio:${companyEmail.trim().toLowerCase()}:${new Date().toISOString().slice(0, 10)}`;
  const cliente = await getPool().connect();
  try {
    await cliente.query("BEGIN");
    const { rows } = await cliente.query<{ envios_extra: number }>(
      "SELECT envios_extra FROM premios_usuario WHERE user_id = $1 FOR UPDATE",
      [userId]
    );
    const yaPagado = await cliente.query("SELECT 1 FROM premios_gastados WHERE user_id = $1 AND clave = $2", [userId, clave]);
    if (yaPagado.rowCount) { await cliente.query("COMMIT"); return true; }
    if (!rows[0] || rows[0].envios_extra <= 0) { await cliente.query("ROLLBACK"); return false; }
    await cliente.query("INSERT INTO premios_gastados (user_id, clave) VALUES ($1, $2)", [userId, clave]);
    await cliente.query("UPDATE premios_usuario SET envios_extra = envios_extra - 1, actualizado = now() WHERE user_id = $1", [userId]);
    await cliente.query("COMMIT");
    return true;
  } catch (e) {
    await cliente.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    cliente.release();
  }
}

/** Gasta una foto extra de la cámara. true si quedaba alguna. */
export async function gastarFotoExtra(userId: string): Promise<boolean> {
  await asegurarTablasPremios();
  const { rowCount } = await getPool().query(
    "UPDATE premios_usuario SET fotos_extra = fotos_extra - 1, actualizado = now() WHERE user_id = $1 AND fotos_extra > 0",
    [userId]
  );
  return (rowCount ?? 0) > 0;
}

/** El día 1 del mes en curso en España (a medianoche UTC: una o dos horas no cambian nada aquí). */
function inicioDelMes(): string {
  const mes = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Madrid" }).slice(0, 7);
  return `${mes}-01T00:00:00Z`;
}

/** Cuántos amigos con premio lleva este mes. */
export async function amigosEsteMes(admin: SupabaseClient, referenteId: string): Promise<number> {
  const { count } = await admin.from("referrals").select("id", { count: "exact", head: true })
    .eq("referrer_id", referenteId).gte("created_at", inicioDelMes());
  return count ?? 0;
}

export type ResultadoReferido =
  | { ok: true; referenteId: string; referentePremiado: boolean }
  | { ok: false; motivo: "codigo" | "propio" | "ya-invitado" };

/**
 * Apunta que `nuevoId` llegó con el código de otra persona y reparte los premios.
 * Se llama al confirmar el correo (la bienvenida) o al canjear el código a mano.
 */
export async function aplicarReferido(admin: SupabaseClient, nuevoId: string, codigoEscrito: string): Promise<ResultadoReferido> {
  const codigo = codigoEscrito.trim().toUpperCase();
  if (!codigo) return { ok: false, motivo: "codigo" };

  const { data: referente } = await admin.from("profiles")
    .select("id, referral_count").eq("referral_code", codigo).maybeSingle();
  if (!referente) return { ok: false, motivo: "codigo" };
  if (referente.id === nuevoId) return { ok: false, motivo: "propio" };

  const { data: yaReferido } = await admin.from("referrals").select("id").eq("referred_id", nuevoId).maybeSingle();
  if (yaReferido) return { ok: false, motivo: "ya-invitado" };

  // El tope se mira antes de apuntar a este: los 10 primeros del mes tienen premio.
  const referentePremiado = (await amigosEsteMes(admin, referente.id)) < AMIGOS_CON_PREMIO_AL_MES;

  const { error } = await admin.from("referrals").insert({
    referrer_id: referente.id, referred_id: nuevoId, code_used: codigo, created_at: new Date().toISOString(),
  });
  // Dos peticiones a la vez para la misma persona: la segunda no reparte nada.
  if (error) return { ok: false, motivo: "ya-invitado" };

  await admin.from("profiles").update({ referral_count: Math.max(0, referente.referral_count || 0) + 1 }).eq("id", referente.id);
  await admin.from("profiles").update({ referred_by: referente.id }).eq("id", nuevoId);

  await darPremio(nuevoId, ENVIOS_DEL_INVITADO, 0);
  if (referentePremiado) {
    await darPremio(referente.id, ENVIOS_POR_AMIGO, FOTOS_POR_AMIGO);
    const { data: nuevo } = await admin.from("profiles").select("full_name").eq("id", nuevoId).maybeSingle();
    const quien = String(nuevo?.full_name || "").trim().split(" ")[0] || "Alguien";
    await admin.from("notificaciones").insert({
      user_id: referente.id, tipo: "referido",
      titulo: `${quien} se ha registrado con tu enlace`,
      mensaje: `Te damos ${ENVIOS_POR_AMIGO} envíos de CV y ${FOTOS_POR_AMIGO} foto más con la cámara. Se usan cuando se te acaben los de tu plan.`,
      datos: { url: "/app/referidos" }, leida: false,
    });
  }
  return { ok: true, referenteId: referente.id, referentePremiado };
}
