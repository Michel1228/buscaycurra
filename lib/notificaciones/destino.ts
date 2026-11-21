/**
 * lib/notificaciones/destino.ts — A dónde lleva cada notificación.
 *
 * POR QUÉ EXISTE. Esto estaba escrito DOS veces, y distinto: getNotifUrl() en
 * la campana y getNonAlertaUrl() en la página de notificaciones. Al separarse
 * fueron divergiendo — la campana conocía quince tipos y la página cinco — y
 * las dos compartían el mismo fallo de fondo: cuando no reconocían el tipo
 * devolvían null, y quien recibía la notificación la pulsaba y NO PASABA NADA.
 *
 * Sin error, sin aviso, sin ir a ningún sitio. Simplemente nada.
 *
 * Medido sobre las mil últimas notificaciones de producción, el tipo "curso"
 * era uno de los que no estaban en ninguna de las dos listas: guardaba su
 * destino en `datos.url` y ninguno de los dos resolvedores leía ese campo.
 *
 * DOS REGLAS QUE NO SE TOCAN:
 *
 *   1. `datos.url` manda. Quien crea la notificación sabe mejor que nadie a
 *      dónde debe llevar; si lo ha dicho, se respeta.
 *   2. NUNCA se devuelve null. Un tipo desconocido lleva al listado de
 *      notificaciones, que siempre existe. Que te lleve a un sitio poco preciso
 *      es un defecto; que no haga nada es una aplicación rota.
 */

export interface NotifDestino {
  /** El de la notificación: con él, una alerta de varias ofertas se abre ya desplegada. */
  id?: string;
  tipo: string;
  datos?: Record<string, string> | null;
}

/**
 * LO QUE SE PULSA ES LO QUE SE ABRE (21 nov 2026, Michel: «si le doy a "Han
 * visto tu CV" o "Tu CV no se ha mandado", que me abra lo que he enviado, hasta
 * la carta; si vengo de una oferta, la oferta, no el buscador»).
 *
 * Los avisos de un envío llevan a ESE envío (/app/envios/<id>): a quién, el
 * puesto, cómo ha ido, la carta y el CV que salieron. El id es el de la fila
 * (envioId) o el de la cola (colaJobId, «cv-...»): la ficha acepta los dos.
 */
const TIPOS_ENVIO = new Set([
  "cv_enviado", "cv_fallido", "cv_visto", "cv_visto_por_empresa", "en_revision", "respuesta", "respuesta_empresa",
  "movido_a_entrevista", "oferta_recibida", "contratado", "rechazado",
]);

const TIPOS_ALERTA = new Set(["alerta_empleo", "nuevas_ofertas", "nuevo_empleo"]);

/** Las ofertas de una alerta, si se guardaron (job_ids, separadas por comas). */
function idsDeOfertas(datos: Record<string, string>): string[] {
  return String(datos.job_ids || "").split(",").map((s) => s.trim()).filter(Boolean);
}

/** Sitio al que lleva cada tipo cuando no hay nada más específico. */
const POR_TIPO: Record<string, string> = {
  // Candidaturas
  cv_enviado: "/app/envios",
  cv_visto: "/app/pipeline",
  cv_visto_por_empresa: "/app/pipeline",
  en_revision: "/app/pipeline",
  respuesta: "/app/pipeline",
  respuesta_empresa: "/app/pipeline",
  movido_a_entrevista: "/app/pipeline",
  oferta_recibida: "/app/pipeline",
  contratado: "/app/pipeline",
  rechazado: "/app/pipeline",

  // Ofertas: van al listado porque se despliegan ahí mismo, con las ofertas
  // dentro. Llevar a una sola oferta perdería las otras diecinueve.
  nuevas_ofertas: "/app/notificaciones",
  nuevo_empleo: "/app/notificaciones",
  alerta_empleo: "/app/notificaciones",
  oferta_recomendada: "/app/notificaciones",

  // Formación
  curso: "/app/formacion",

  // Varios
  recordatorio: "/app/gusi",
  // «Guzzi encontró ofertas y mandó tu CV a N empresas»: lo que mandó (21 nov 2026), no el chat.
  agente_auto: "/app/envios",
  bienvenida: "/app/bienvenida",
  plan: "/app/perfil?tab=plan",
};

/**
 * Las alertas con varias ofertas se despliegan dentro del listado, con esas
 * ofertas. Con una sola, no: se abre la oferta directamente.
 */
export function esAlertaDesplegable(n: NotifDestino): boolean {
  return TIPOS_ALERTA.has(n.tipo) && idsDeOfertas(n.datos || {}).length !== 1;
}

/**
 * Devuelve SIEMPRE una ruta. Nunca null: ver la regla 2 de la cabecera.
 */
export function destinoDeNotificacion(n: NotifDestino): string {
  const datos = n.datos || {};

  // 0. El envío del que habla, con su carta y su CV. Va antes que datos.url:
  //    los avisos antiguos de rebote y de «visto» llevaban la lista general.
  if (TIPOS_ENVIO.has(n.tipo)) {
    const envio = datos.envioId || datos.envio_id || datos.colaJobId;
    if (envio) return `/app/envios/${encodeURIComponent(envio)}`;
    // Sin id (avisos viejos): el último envío a esa empresa (la lista lo abre solo).
    const empresa = datos.companyName || datos.empresa;
    if (empresa) return `/app/envios?empresa=${encodeURIComponent(empresa)}`;
  }

  // 0b. Una alerta: con una sola oferta, esa oferta; con varias, desplegada en el listado.
  if (TIPOS_ALERTA.has(n.tipo)) {
    const ids = idsDeOfertas(datos);
    if (ids.length === 1) return `/app/ofertas/${encodeURIComponent(ids[0])}`;
    return n.id ? `/app/notificaciones?abrir=${encodeURIComponent(n.id)}` : "/app/notificaciones";
  }

  // 1. Destino explícito de quien la creó.
  if (typeof datos.url === "string" && datos.url.startsWith("/")) return datos.url;

  // 2. Una oferta concreta.
  //
  //    El prefijo "cv-" NO es una oferta: es el identificador de la cola de
  //    envios, que queue.ts genera como "cv-<usuario>-<fecha>". El worker lo
  //    guardaba en `jobId` y esta regla, que va por delante del mapa por tipo,
  //    montaba /app/ofertas/cv-8f3a...-1757. Esa pagina no existe, asi que la
  //    notificacion de "CV enviado" acababa en "Oferta no encontrada".
  //
  //    El worker ya no lo guarda ahi, pero las notificaciones que hay en la
  //    base se escribieron antes: este descarte es lo que las repara.
  const idOferta = datos.job_id || datos.jobId;
  if (idOferta && !String(idOferta).startsWith("cv-")) {
    return `/app/ofertas/${encodeURIComponent(idOferta)}`;
  }

  // 3. Un curso concreto.
  if (datos.curso_slug) return `/app/formacion/${encodeURIComponent(datos.curso_slug)}`;

  // 4. Por tipo.
  if (POR_TIPO[n.tipo]) return POR_TIPO[n.tipo];

  // 5. Red de seguridad. Preferimos un destino impreciso a un clic muerto.
  return "/app/notificaciones";
}
