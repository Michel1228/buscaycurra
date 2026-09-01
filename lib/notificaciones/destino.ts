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
  tipo: string;
  datos?: Record<string, string> | null;
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
  agente_auto: "/app/gusi",
  bienvenida: "/app/bienvenida",
  plan: "/app/perfil?tab=plan",
};

/** Tipos cuyo contenido se despliega dentro del listado en vez de navegar. */
export function esAlertaDesplegable(tipo: string): boolean {
  return tipo === "alerta_empleo" || tipo === "nuevas_ofertas" || tipo === "nuevo_empleo";
}

/**
 * Devuelve SIEMPRE una ruta. Nunca null: ver la regla 2 de la cabecera.
 */
export function destinoDeNotificacion(n: NotifDestino): string {
  const datos = n.datos || {};

  // 1. Destino explícito de quien la creó.
  if (typeof datos.url === "string" && datos.url.startsWith("/")) return datos.url;

  // 2. Una oferta concreta. `jobId` en camelCase también: las notificaciones de
  //    CV enviado lo guardan así y llevaban desde siempre sin reconocerse.
  const idOferta = datos.job_id || datos.jobId;
  if (idOferta) return `/app/ofertas/${encodeURIComponent(idOferta)}`;

  // 3. Un curso concreto.
  if (datos.curso_slug) return `/app/formacion/${encodeURIComponent(datos.curso_slug)}`;

  // 4. Por tipo.
  if (POR_TIPO[n.tipo]) return POR_TIPO[n.tipo];

  // 5. Red de seguridad. Preferimos un destino impreciso a un clic muerto.
  return "/app/notificaciones";
}
