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
export const VERIFICADO_EL = "17 de agosto de 2026";

export const DATOS = {
  /** 2.131.293 ofertas activas. Se enseña "2,1 millones". */
  ofertasActivas: 2_100_000,
  ofertasActivasTexto: "2,1 millones",

  /** 286.239 nuevas en los últimos 7 días → 40.891 al día. */
  ofertasNuevasDia: 40_000,
  ofertasNuevasDiaTexto: "40.000",

  /** 1.768.107 de 2.131.293 traen email: el 83%. Se dice "8 de cada 10". */
  porcentajeConEmail: 83,
  conEmailTexto: "8 de cada 10",

  /** Países con ofertas activas en la base de datos. */
  paises: 49,

  /** Precio de entrada, y con qué se compara. */
  precioDesde: "2,99 €",
  precioInfoJobsPremium: "39 €",
} as const;

/**
 * Los ganchos de la portada. Cifra grande y una frase que explique por qué
 * eso le importa a quien busca trabajo — el número solo no dice nada.
 */
export const GANCHOS = [
  {
    numero: DATOS.ofertasActivasTexto,
    titulo: "de ofertas, ahora mismo",
    frase: "De 49 países. Las de tu barrio y las de Oslo, en el mismo sitio.",
  },
  {
    numero: DATOS.ofertasNuevasDiaTexto,
    titulo: "nuevas cada día",
    frase: "Son 28 cada minuto. Mientras lees esto han entrado unas cuantas.",
  },
  {
    numero: DATOS.conEmailTexto,
    titulo: "traen email de la empresa",
    frase: "Tu CV llega a una persona, no a una cola de 2.000 candidatos.",
  },
  {
    numero: DATOS.precioDesde,
    titulo: "al mes",
    frase: `InfoJobs Premium cuesta ${DATOS.precioInfoJobsPremium}. Y aquí el CV lo manda Guzzi por ti.`,
  },
] as const;
