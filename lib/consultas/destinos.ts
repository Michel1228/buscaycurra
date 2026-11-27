/**
 * lib/consultas/destinos.ts — A quién se le puede escribir desde la app.
 *
 * POR QUÉ (26 nov 2026, Michel): «somos el intermediario: no dar un cartel de
 * cómo se hace, sino tener nosotros el correo y mandarlo desde aquí». La
 * persona manda su consulta desde BuscayCurra, a su nombre, y la respuesta le
 * llega a su correo.
 *
 * ⚠️ NINGÚN CORREO DEDUCIDO. Cada uno está copiado de una página oficial de la
 * comunidad, que va en `fuente`, comprobado el 26 nov 2026 desde el servidor.
 * Donde no se encontró un correo del servicio de acreditación (no lo publican,
 * solo hay uno de otro trámite o la página no cargaba), `email` es null y la
 * app enseña su web oficial y le deja la consulta escrita para pegarla allí.
 * Las webs salen de la lista oficial del Ministerio (todofp.es, «webs de las
 * comunidades»).
 *
 * La solicitud oficial NO se presenta por correo: va por la sede electrónica o
 * el registro de cada comunidad. Por correo va la consulta: si está abierto,
 * cómo se pide, qué papeles hacen falta.
 */

export interface OrganismoAcreditacion {
  id: string;
  ccaa: string;
  /** Quién lo gestiona, como lo nombra su web. */
  organismo: string;
  /** Correo de consultas del procedimiento, copiado de `fuente`. null si no hay uno verificado. */
  email: string | null;
  /** La web oficial del procedimiento (lista del Ministerio). */
  web: string;
  /** Dónde está escrito el correo. */
  fuente: string | null;
}

export const ACREDITACION_CCAA: OrganismoAcreditacion[] = [
  { id: "andalucia", ccaa: "Andalucía", organismo: "Instituto Andaluz de Cualificaciones Profesionales", email: "acredita.iacp.ced@juntadeandalucia.es",
    web: "https://www.juntadeandalucia.es/educacion/portales/web/iacp", fuente: "https://cdn.juntadeandalucia.es/sites/default/files/2025-03/Folleto%20divulgativo%20CS_IACP.pdf" },
  { id: "aragon", ccaa: "Aragón", organismo: "Agencia de las Cualificaciones Profesionales de Aragón", email: "agenciacualificacion@aragon.es",
    web: "https://www.peacaragon.es/", fuente: "https://www.peacaragon.es/" },
  { id: "asturias", ccaa: "Asturias", organismo: "Servicio Público de Empleo del Principado de Asturias", email: "acredita@asturias.org",
    web: "https://trabajastur.asturias.es/acredita-tus-competencias", fuente: "https://trabajastur.asturias.es/acredita-tus-competencias" },
  // 27 nov 2026: el correo general del IQPIB, de su página de contacto en caib.es
  // (el de las preguntas frecuentes, secretariatecnicaiqpib@, es solo para reclamar el resultado).
  { id: "baleares", ccaa: "Illes Balears", organismo: "Institut de les Qualificacions Professionals de les Illes Balears (IQPIB)", email: "iqpib@ibeducacio.eu",
    web: "https://www.caib.es/sites/iqpib/es/preguntas_frecuentes/", fuente: "https://www.caib.es/sites/iqpib/es/contacto/" },
  { id: "canarias", ccaa: "Canarias", organismo: "Dirección General de Cualificaciones Profesionales (Consejería de Educación)", email: "acreditafp.educacion@gobiernodecanarias.org",
    web: "https://www.gobiernodecanarias.org/empleo/sce/principal/areas_tematicas/formacion_acreditacion/acreditacion_exp_profesional.html",
    fuente: "https://www.gobiernodecanarias.org/educacion/web/contacto/datos_consejeria/direcciones_generales/dg_cualificaciones_profesionales/" },
  { id: "cantabria", ccaa: "Cantabria", organismo: "Acredita Cantabria (Consejería de Educación)", email: null, web: "https://acredita.cantabria.es/", fuente: null },
  { id: "castilla-la-mancha", ccaa: "Castilla-La Mancha", organismo: "Junta de Comunidades de Castilla-La Mancha", email: null, web: "http://pop.jccm.es/?id=425", fuente: null },
  { id: "castilla-y-leon", ccaa: "Castilla y León", organismo: "Junta de Castilla y León", email: null,
    web: "http://www.educa.jcyl.es/adultos/es/acreditacion-competencias-profesionales", fuente: null },
  { id: "cataluna", ccaa: "Cataluña", organismo: "Agència FPCAT (Generalitat de Catalunya)", email: null, web: "https://fp.gencat.cat/ca/acreditacio/index.html", fuente: null },
  { id: "extremadura", ccaa: "Extremadura", organismo: "Instituto Extremeño de las Cualificaciones y Acreditaciones", email: null, web: "https://www.educarex.es/ieca/peac.html", fuente: null },
  { id: "galicia", ccaa: "Galicia", organismo: "Consellería de Educación (Xunta de Galicia)", email: null, web: "https://www.edu.xunta.gal/fp/acredita", fuente: null },
  { id: "madrid", ccaa: "Comunidad de Madrid", organismo: "Comunidad de Madrid", email: "procedimientoacreditacion@madrid.org",
    web: "https://www.comunidad.madrid/servicios/empleo/acreditacion-experiencia-laboral", fuente: "https://www.comunidad.madrid/servicios/empleo/acreditacion-experiencia-laboral" },
  { id: "murcia", ccaa: "Región de Murcia", organismo: "Instituto de las Cualificaciones de la Región de Murcia (ICUAM)", email: null, web: "https://icuam.es/prear/", fuente: null },
  { id: "navarra", ccaa: "Navarra", organismo: "Sección de Acreditaciones Profesionales (Gobierno de Navarra)", email: "inacuali@navarra.es",
    web: "https://www.navarra.es/es/tramites/on/-/line/Acreditacion-de-la-competencia-profesional1", fuente: "https://www.navarra.es/es/tramites/on/-/line/Acreditacion-de-la-competencia-profesional1" },
  { id: "pais-vasco", ccaa: "País Vasco", organismo: "Instituto Vasco del Conocimiento de la FP (IVAC-EEI)", email: null, web: "https://ivac-eei.eus/es/reconocimiento-competencias/", fuente: null },
  { id: "la-rioja", ccaa: "La Rioja", organismo: "Acredita La Rioja (soporte de la web de solicitud)", email: "web@acreditalarioja.org",
    web: "https://www.acreditalarioja.org/", fuente: "https://www.acreditalarioja.org/" },
  { id: "valencia", ccaa: "Comunitat Valenciana", organismo: "Conselleria de Educación (Cualificaciones Profesionales)", email: null,
    web: "https://ceice.gva.es/es/web/cualificaciones-profesionales/procedimiento-de-acreditacion-de-competencias", fuente: null },
  { id: "ceuta", ccaa: "Ceuta", organismo: "Ministerio de Educación, FP y Deportes", email: null,
    web: "https://www.educacionyfp.gob.es/servicios-al-ciudadano/catalogo/general/20/200277/ceuta/200277-evaluados.html", fuente: null },
  { id: "melilla", ccaa: "Melilla", organismo: "Ministerio de Educación, FP y Deportes", email: null,
    web: "https://www.educacionyfp.gob.es/servicios-al-ciudadano/catalogo/general/20/200277/melilla/200277-evaluados.html", fuente: null },
];

export const COMPROBADO = "2026-11-26";

export function organismoPorId(id: string): OrganismoAcreditacion | undefined {
  return ACREDITACION_CCAA.find((o) => o.id === id);
}
