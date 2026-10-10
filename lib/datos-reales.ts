/**
 * lib/datos-reales.ts — Las cifras que enseñamos, y de dónde salen.
 *
 * POR QUÉ EXISTE. La web decía "2.400+ personas ya encontraron trabajo con
 * nosotros" en seis sitios distintos, y "18.000+ CVs enviados este mes". Los
 * números de verdad eran 51 usuarios y 112 CVs en total. Uno de esos carteles
 * estaba en la página que vende a empresas "acceso a 2.400 candidatos" por
 * 49,99 €/mes, que ya no es solo un adorno: es publicidad engañosa.
 *
 * Lo bueno es que los datos reales venden MÁS. Dos millones de ofertas y
 * cuarenta mil nuevas al día es un argumento mucho mejor que 2.400 personas
 * que no existen, y además nadie te lo puede desmentir.
 *
 * CÓMO ACTUALIZARLO. Todo sale de una consulta a la base de datos del VPS:
 *
 *   SELECT count(*) FROM "JobListing" WHERE "isActive" = true;
 *   SELECT count(*) FROM "JobListing"
 *     WHERE "isActive" = true AND "createdAt" > now() - interval '7 days';
 *   SELECT count(*) FROM "JobListing"
 *     WHERE "isActive" = true AND "contactEmail" IS NOT NULL AND "contactEmail" <> '';
 *
 * Se redondean HACIA ABAJO a propósito: si alguien va a comprobarlo, que le
 * salga más de lo que prometemos, nunca menos.
 */

/** Cuándo se contaron estos números contra la base de datos de producción. */
export const VERIFICADO_EL = "10 de octubre de 2026";

export const DATOS = {
  /** 2.919.004 ofertas activas el 10 oct 2026. Se enseña "2,9 millones". */
  ofertasActivas: 2_900_000,
  ofertasActivasTexto: "2,9 millones",

  /** 454.639 nuevas en los últimos 7 días → 64.948 al día. */
  ofertasNuevasDia: 60_000,
  ofertasNuevasDiaTexto: "60.000",

  /**
   * 2.159.096 de 2.919.004 tienen email: el 74 %. Se dice "7 de cada 10".
   * Hasta el 10 oct ponía "8 de cada 10" (el 83 % de agosto): con más
   * ofertas de fuentes sin correo, la proporción bajó y la web exageraba.
   */
  porcentajeConEmail: 74,
  conEmailTexto: "7 de cada 10",

  /** Países con ofertas activas en la base de datos (48 el 10 oct 2026). */
  paises: 48,

  /** Precio de entrada, y con qué se compara. */
  precioDesde: "2,99 €",
} as const;

/**
 * Los ganchos de la portada. Cifra grande y una frase que explique por qué
 * eso le importa a quien busca trabajo — el número solo no dice nada.
 */
export const GANCHOS = [
  {
    numero: DATOS.ofertasActivasTexto,
    titulo: "de ofertas, ahora mismo",
    frase: "De medio mundo. Las de tu barrio y las de Oslo, en el mismo sitio.",
  },
  {
    numero: DATOS.ofertasNuevasDiaTexto,
    titulo: "nuevas cada día",
    frase: `Son ${Math.floor(DATOS.ofertasNuevasDia / 1440)} cada minuto. Mientras lees esto han entrado unas cuantas.`,
  },
  {
    numero: DATOS.conEmailTexto,
    titulo: "traen email de la empresa",
    frase: "Tu CV llega a una persona, no a una cola de 2.000 candidatos.",
  },
  {
    numero: DATOS.precioDesde,
    titulo: "al mes",
    // Aquí se comparaba con un precio de InfoJobs Premium sin fuente localizable.
    frase: "Menos que un café al mes. Y el CV lo manda Guzzi por ti.",
  },
] as const;
