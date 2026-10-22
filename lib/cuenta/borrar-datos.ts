/**
 * lib/cuenta/borrar-datos.ts
 * Borra TODO lo que guardamos de una persona, en las dos bases y en el almacenamiento.
 *
 * POR QUÉ. "Eliminar mi cuenta" borraba cinco tablas de la base propia y seis de
 * Supabase, y se dejaba el resto (auditoría del 3 oct 2026):
 *   · las conversaciones con Guzzi (se guardan en Supabase; se borraba una
 *     tabla antigua del VPS que no se usa desde junio),
 *   · entrevistas, cursos, au pair, uso del plan, avisos, contactos, cartas,
 *     reseñas, suscripciones push...
 *   · y las FOTOS: se borraba "<id>/avatar", pero la foto de perfil se guarda
 *     en "avatars/<id>.<ext>" y la de au pair en "au-pair/<id>/". Como el
 *     almacenamiento es público, la foto seguía en internet tras borrar la
 *     cuenta.
 * El RGPD obliga a borrarlo todo cuando la persona lo pide.
 *
 * Cada tabla se borra por separado: una tabla que no existe no cuenta como
 * fallo, y cualquier otro fallo se devuelve para NO borrar la cuenta a medias
 * (quedarían datos sin dueño que nadie podría encontrar después).
 *
 * Si se añade una tabla nueva con datos de usuario, va AQUÍ. El sello
 * comprueba que estén todas las que tienen columna de usuario.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { getPool } from "@/lib/db";

/** Base propia (VPS): tabla → columna con el id de la persona. */
export const TABLAS_VPS: Record<string, string> = {
  user_cvs: "user_id", saved_jobs: "user_id", job_alerts: "user_id", alert_sent_jobs: "user_id",
  user_contacts: "user_id", push_subscriptions: "user_id", cv_cartas: "user_id", cv_sends: "user_id",
  gusi_conversations: "user_id", company_reviews: "user_id",
  SavedJob: "userId", Application: "userId", CV: "userId", ScheduledCampaign: "userId",
  // 13 oct 2026: la baja de las sugerencias de cursos según el CV. Se creó sin
  // añadirla aquí y el centinela lo cazó al día siguiente.
  curso_sugerencia_baja: "user_id",
  // 17 oct 2026: las ofertas que manda una empresa desde /empresas/publicar.
  oferta_empresa: "user_id",
  // 18 oct 2026: los carnés que tiene y cuándo caducan (lib/cursos/carnes.ts).
  carne_usuario: "user_id",
  // 21 oct 2026: lo ganado invitando amigos (lib/referidos/premios.ts).
  premios_usuario: "user_id", premios_gastados: "user_id",
};

/** Supabase: tabla → columna con el id de la persona. "profiles" va aparte, al final. */
export const TABLAS_SUPABASE: Record<string, string> = {
  notificaciones: "user_id", cv_sends: "user_id", usage_tracking: "user_id", gusi_conversations: "user_id",
  entrevistas: "user_id", curso_interes: "user_id", curso_progreso: "user_id", curso_aviso: "user_id",
  au_pair_sends: "user_id", au_pair_profiles: "user_id", company_reviews: "user_id", job_alerts: "user_id",
  push_subscriptions: "user_id", notificaciones_config: "user_id", cvs: "user_id",
};

const noExiste = (m: string) => /does not exist|schema cache|Could not find/i.test(m);

export async function borrarDatosDeUsuario(
  admin: SupabaseClient,
  userId: string,
  email?: string | null
): Promise<{ borrado: Record<string, number>; fallos: string[] }> {
  const borrado: Record<string, number> = {};
  const fallos: string[] = [];
  const pool = getPool();

  const vps = async (etiqueta: string, sql: string, params: unknown[]) => {
    try {
      const r = await pool.query(sql, params);
      if (r.rowCount) borrado[etiqueta] = r.rowCount;
    } catch (e) {
      const m = (e as Error).message;
      if (!noExiste(m)) fallos.push(`${etiqueta}: ${m.slice(0, 80)}`);
    }
  };
  for (const [tabla, col] of Object.entries(TABLAS_VPS)) {
    await vps(`vps.${tabla}`, `DELETE FROM "${tabla}" WHERE "${col}"::text = $1`, [userId]);
  }
  await vps("vps.referrals", `DELETE FROM referrals WHERE referrer_id::text = $1 OR referred_id::text = $1`, [userId]);
  if (email) await vps("vps.correos_rebotados", `DELETE FROM correos_rebotados WHERE email = $1`, [email.toLowerCase()]);
  // La tabla "User" es del sistema de cuentas de antes de Supabase (abril-mayo
  // 2026): correo, nombre, teléfono y contraseña. Ningún código la usa, pero
  // quien borra su cuenta también tiene que desaparecer de ahí (22 oct 2026).
  if (email) await vps("vps.User", `DELETE FROM "User" WHERE lower(email) = $1`, [email.toLowerCase()]);

  const sb = async (etiqueta: string, consulta: PromiseLike<{ error: { message: string } | null; count: number | null }>) => {
    const { error, count } = await consulta;
    if (error) { if (!noExiste(error.message)) fallos.push(`${etiqueta}: ${error.message.slice(0, 80)}`); }
    else if (count) borrado[etiqueta] = count;
  };
  for (const [tabla, col] of Object.entries(TABLAS_SUPABASE)) {
    await sb(`sb.${tabla}`, admin.from(tabla).delete({ count: "exact" }).eq(col, userId));
  }
  await sb("sb.referrals", admin.from("referrals").delete({ count: "exact" }).or(`referrer_id.eq.${userId},referred_id.eq.${userId}`));

  // Ficheros. Las rutas de verdad: CV en cvs/<id>/, foto de perfil en
  // profiles/avatars/<id>.<ext>, fotos de au pair en profiles/au-pair/<id>/.
  const quitar = async (bucket: string, rutas: string[]) => {
    if (!rutas.length) return;
    const { error } = await admin.storage.from(bucket).remove(rutas);
    if (error) fallos.push(`storage.${bucket}: ${error.message.slice(0, 80)}`);
    else borrado[`storage.${bucket}`] = (borrado[`storage.${bucket}`] || 0) + rutas.length;
  };
  const listar = async (bucket: string, carpeta: string, filtro?: (n: string) => boolean) => {
    const { data } = await admin.storage.from(bucket).list(carpeta, { limit: 1000 });
    return (data || []).map((f) => f.name).filter((n) => !filtro || filtro(n)).map((n) => (carpeta ? `${carpeta}/${n}` : n));
  };
  await quitar("cvs", await listar("cvs", userId));
  await quitar("profiles", await listar("profiles", "avatars", (n) => n.startsWith(`${userId}.`)));
  await quitar("profiles", await listar("profiles", `au-pair/${userId}`));
  await quitar("profiles", await listar("profiles", userId)); // ruta antigua, por si quedara algo

  // La ficha, la última: otras tablas pueden apuntar a ella.
  await sb("sb.profiles", admin.from("profiles").delete({ count: "exact" }).eq("id", userId));

  return { borrado, fallos };
}
