/**
 * lib/destinos/requisitos.ts — Qué te piden en cada país al que te mandamos.
 *
 * POR QUÉ ESTÁ ESCRITO ASÍ, Y NO DE LA OTRA MANERA.
 *
 * La primera idea fue una matriz de nacionalidad × destino: 26 por 26, 676
 * casillas. Es inmantenible y, sobre todo, imposible de verificar una a una, así
 * que habría acabado siendo inventada. Se descartó.
 *
 * Lo que se hace en su lugar es lo que de verdad refleja cómo funciona la
 * inmigración: **los requisitos los pone el país al que vas, no el país del que
 * sales**. Australia pide lo mismo a un español que a un argentino salvo en un
 * punto concreto —el acuerdo de movilidad joven, que sí es bilateral—. Así que
 * hay una ficha por destino, con tres bloques:
 *
 *   1. Lo que vale para casi todo el mundo (`siNoEresDeLaUE`).
 *   2. La excepción grande y bien delimitada: la libre circulación europea.
 *   3. Las excepciones por tratado, que son listas cerradas y oficiales
 *      (`movilidadJoven`), no apreciaciones nuestras.
 *
 * 26 fichas en vez de 676 casillas, y cada una comprobable.
 *
 * ⚠️ REGLA DE ESTE FICHERO: aquí NO se ponen cifras que cambien solas. Las
 * cuantías, los cupos y las tasas se miran en la autoridad del país, que es
 * quien manda y quien las actualiza. Nosotros decimos QUÉ vía existe y a DÓNDE
 * hay que ir; el número exacto lo pone la fuente oficial. Un dato caducado aquí
 * es peor que no tener el dato.
 *
 * Comprobado el 2026-09-02 contra gov.uk (lista del Youth Mobility), la lista de
 * pasaportes de la subclase 462 australiana, y la del International Experience
 * Canada. Todos los enlaces se comprueban por HTTP con
 * `scripts/comprobar-enlaces-destinos.mjs`: si uno cae, salta el sello.
 */

import { normalizarPais } from "@/lib/origen/movilidad";

export interface MovilidadJoven {
  /** Cómo se llama allí. Buscarlo por su nombre real ahorra media hora. */
  nombre: string;
  edad: string;
  /** Nacionalidades admitidas, en código ISO. Lista cerrada y oficial. */
  nacionalidades: string[];
  /** Lo que hay que cumplir además de la nacionalidad. */
  condiciones: string[];
  url: string;
  nota?: string;
}

export interface RequisitosDestino {
  codigo: string;
  nombre: string;
  bandera: string;
  /** Quien decide de verdad. Es el enlace más valioso de la ficha. */
  autoridad: { nombre: string; url: string };
  /** ¿Está dentro del espacio de libre circulación europeo? */
  libreCirculacion: boolean;
  /** Si tienes nacionalidad de la UE, del EEE o suiza. */
  siEresDeLaUE: string[];
  /** Si no. Es el caso de la mayoría del mundo, y el que más falta hace. */
  siNoEresDeLaUE: string[];
  /** Acuerdos de movilidad joven, cuando los hay. */
  movilidadJoven?: MovilidadJoven;
  /** El error concreto que comete la gente con este país. */
  ojoCon?: string;
}

/**
 * Lo que vale igual en los diecinueve destinos europeos. Se escribe una vez y se
 * reutiliza, que es justo el motivo de hacerlo por destino: dentro de la UE los
 * requisitos son casi los mismos y solo cambia el nombre de la oficina.
 */
const UE_SI_ERES_DE_LA_UE = [
  "No necesitas visado ni permiso de trabajo. Puedes entrar, buscar trabajo y firmar un contrato como cualquier nacional.",
  "Los tres primeros meses no hay que hacer nada. A partir de ahí toca registrarse como residente, que es un trámite, no un permiso.",
  "Para el registro suelen pedir pasaporte o DNI, y demostrar que trabajas, estudias o tienes medios para mantenerte.",
  "Pide el número de la seguridad social del país en cuanto empieces a trabajar: sin él no te dan de alta.",
];

const UE_SI_NO_ERES_DE_LA_UE = [
  "Hace falta visado y permiso de trabajo, y en casi todos los casos hay que tenerlo ANTES de viajar.",
  "La vía normal es que una empresa de allí te contrate primero y tramite el permiso. Presentarte a buscar trabajo no es una vía.",
  "Si tienes titulación universitaria y una oferta bien pagada, existe la Tarjeta Azul europea, que es más rápida y permite moverse después a otros países de la UE.",
  "El permiso suele estar atado a ese empleo concreto: si lo dejas, hay que comunicarlo y puede afectar a tu residencia.",
];

const UE_OJO_TURISTA =
  "Entrar con visado de turista o sin visado por noventa días y ponerte a trabajar allí no es una vía legal, aunque te lo ofrezcan. Trabajar sin permiso te cierra la puerta a regularizarte después.";

function destinoUE(
  codigo: string,
  nombre: string,
  bandera: string,
  autoridad: { nombre: string; url: string },
  especifico: string[] = [],
  ojoCon?: string,
): RequisitosDestino {
  return {
    codigo,
    nombre,
    bandera,
    autoridad,
    libreCirculacion: true,
    siEresDeLaUE: UE_SI_ERES_DE_LA_UE,
    siNoEresDeLaUE: [...UE_SI_NO_ERES_DE_LA_UE, ...especifico],
    ojoCon: ojoCon || UE_OJO_TURISTA,
  };
}

/**
 * Australia distingue dos visados de movilidad joven y la diferencia importa: la
 * 417 no pide estudios ni inglés, la 462 sí, y además puede tener cupo anual.
 * España y toda Latinoamérica van por la 462; media Europa, por la 417.
 * Listas comprobadas el 2026-09-02 en immi.homeaffairs.gov.au.
 */
const AU_417 = ["BE", "CA", "CY", "DK", "EE", "FI", "FR", "DE", "HK", "IE", "IT", "JP", "KR", "MT", "NL", "NO", "SE", "TW", "UK"];
const AU_462 = ["AR", "AT", "BR", "CL", "CN", "CZ", "EC", "GR", "HU", "IN", "ID", "IL", "LU", "MY", "MN", "PG", "PE", "PL", "PT", "SM", "SG", "SK", "SI", "ES", "CH", "TH", "TR", "UY", "US", "VN"];

/** Youth Mobility Scheme británico. Comprobado el 2026-09-02 en gov.uk. */
const UK_YMS_18_35 = ["AU", "CA", "NZ", "KR"];
const UK_YMS_18_30 = ["AD", "IS", "JP", "MC", "SM", "UY"];
const UK_YMS_SORTEO = ["HK", "TW"];

/** International Experience Canada. Acuerdos bilaterales de movilidad juvenil. */
const CA_IEC = ["AD", "AU", "AT", "BE", "CL", "CR", "HR", "CZ", "DK", "EE", "FR", "DE", "GR", "HK", "IS", "IE", "IT", "JP", "KR", "LV", "LT", "LU", "MX", "NL", "NZ", "NO", "PL", "PT", "SM", "SK", "SI", "ES", "SE", "CH", "TW", "UK"];

export const REQUISITOS: RequisitosDestino[] = [
  // ── Los diecinueve destinos del espacio europeo ────────────────────────────
  destinoUE("ES", "España", "🇪🇸", {
    nombre: "Portal de Inmigración — Ministerio de Inclusión",
    url: "https://www.inclusion.gob.es/web/migraciones/home",
  }, [
    "No hay un visado general para venir a buscar trabajo: se entra con un contrato ya firmado, salvo profesiones muy concretas.",
    "Existe el arraigo, que permite regularizarse tras un tiempo residiendo aquí, pero es una salida a una situación irregular, no una vía de entrada.",
  ]),

  destinoUE("DE", "Alemania", "🇩🇪", {
    nombre: "Make it in Germany — portal oficial del Gobierno alemán",
    url: "https://www.make-it-in-germany.com/en/",
  }, [
    "Alemania sí tiene una vía para ir a buscar trabajo: la Chancenkarte, la «tarjeta de oportunidades», que puntúa titulación, experiencia, idioma y edad.",
    "Con título universitario y una oferta que llegue al umbral salarial, la Tarjeta Azul alemana es de las más ágiles de Europa.",
  ], "Tu título de fuera se tiene que reconocer, y en oficios regulados —sanidad, electricidad, obra— es obligatorio antes de poder trabajar. Empieza ese trámite antes de nada: es lo que más tarda."),

  destinoUE("FR", "Francia", "🇫🇷", {
    nombre: "Administration étrangers en France — Ministerio del Interior",
    url: "https://administration-etrangers-en-france.interieur.gouv.fr/",
  }),

  destinoUE("IT", "Italia", "🇮🇹", {
    nombre: "Visti per l'Italia — Ministerio de Asuntos Exteriores",
    url: "https://vistoperitalia.esteri.it/home.aspx",
  }, [
    "Italia funciona con cupos anuales por decreto, el «decreto flussi»: hay ventanas concretas para presentar solicitudes y fuera de ellas no se puede.",
  ]),

  destinoUE("PT", "Portugal", "🇵🇹", {
    nombre: "AIMA — Agencia para la Integración, Migraciones y Asilo",
    url: "https://aima.gov.pt/pt",
  }, [
    "Portugal tiene visado para buscar trabajo: se entra legalmente durante unos meses con permiso para buscar y firmar un contrato allí.",
  ]),

  destinoUE("NL", "Países Bajos", "🇳🇱", {
    nombre: "IND — Servicio de Inmigración y Naturalización",
    url: "https://ind.nl/en",
  }, [
    "La contratación de extracomunitarios pasa casi siempre por un empleador reconocido por el IND. Si la empresa no lo es, el trámite se complica mucho.",
    "Quien acaba de terminar una carrera puede optar al «año de orientación» para buscar trabajo allí.",
  ]),

  destinoUE("BE", "Bélgica", "🇧🇪", {
    nombre: "Oficina de Extranjería de Bélgica",
    url: "https://dofi.ibz.be/en",
  }, [
    "El permiso de trabajo lo dan las regiones —Flandes, Valonia y Bruselas—, no el Estado, y cada una tiene sus condiciones y su ventanilla.",
  ]),

  destinoUE("AT", "Austria", "🇦🇹", {
    nombre: "Migration.gv.at — portal oficial de Austria",
    url: "https://www.migration.gv.at/en/",
  }, [
    "Austria usa un sistema por puntos, la Rot-Weiß-Rot Karte, que valora cualificación, experiencia, idioma y edad.",
  ]),

  destinoUE("IE", "Irlanda", "🇮🇪", {
    nombre: "Irish Immigration Service — Departamento de Justicia",
    url: "https://www.irishimmigration.ie/",
  }, [
    "Irlanda está en la UE pero NO en Schengen: tiene su propio sistema de permisos de trabajo, con lista de ocupaciones críticas y ocupaciones excluidas.",
    "Mira si tu oficio está en la lista de ocupaciones no elegibles antes de gastar en nada: si está, no hay permiso posible por esa vía.",
  ]),

  destinoUE("PL", "Polonia", "🇵🇱", {
    nombre: "Oficina de Extranjeros de Polonia",
    url: "https://www.gov.pl/web/udsc",
  }),

  destinoUE("SE", "Suecia", "🇸🇪", {
    nombre: "Migrationsverket — Agencia Sueca de Migración",
    url: "https://www.migrationsverket.se/English.html",
  }, [
    "Suecia exige un salario mínimo para conceder el permiso de trabajo, y lo ha ido subiendo. Una oferta por debajo de ese umbral no sirve, aunque sea real.",
  ]),

  destinoUE("DK", "Dinamarca", "🇩🇰", {
    nombre: "New to Denmark — Agencia Danesa de Contratación Internacional",
    url: "https://www.nyidanmark.dk/en-GB",
  }, [
    "Dinamarca tiene listas de profesiones con escasez de mano de obra: si tu oficio está en una, la vía es bastante más rápida.",
  ]),

  destinoUE("NO", "Noruega", "🇳🇴", {
    nombre: "UDI — Dirección de Inmigración de Noruega",
    url: "https://www.udi.no/en/",
  }, [
    "Noruega no está en la UE pero sí en el Espacio Económico Europeo: para quien es de la UE la libre circulación funciona igual.",
  ]),

  destinoUE("FI", "Finlandia", "🇫🇮", {
    nombre: "Migri — Servicio de Inmigración de Finlandia",
    url: "https://migri.fi/en/home",
  }),

  destinoUE("CZ", "Chequia", "🇨🇿", {
    nombre: "Portal de inmigración — Ministerio del Interior checo",
    url: "https://ipc.gov.cz/en/",
  }),

  destinoUE("GR", "Grecia", "🇬🇷", {
    nombre: "Ministerio de Migración y Asilo de Grecia",
    url: "https://migration.gov.gr/en/",
  }),

  destinoUE("HU", "Hungría", "🇭🇺", {
    nombre: "Dirección General de Extranjería de Hungría",
    url: "https://oif.gov.hu/",
  }),

  destinoUE("RO", "Rumanía", "🇷🇴", {
    nombre: "Inspectoratul General pentru Imigrări",
    url: "https://igi.mai.gov.ro/en/",
  }),

  destinoUE("CH", "Suiza", "🇨🇭", {
    nombre: "SEM — Secretaría de Estado de Migración de Suiza",
    url: "https://www.sem.admin.ch/sem/en/home.html",
  }, [
    "Suiza no está en la UE, pero tiene acuerdo de libre circulación con ella: si eres de la UE entras igual, solo que anunciando el trabajo.",
    "Para quien no es de la UE, Suiza aplica cupos anuales y admite sobre todo perfiles cualificados. Es de los países más cerrados de Europa.",
  ]),

  // ── Los siete de fuera. Aquí es donde la gente se estrella ─────────────────
  {
    codigo: "UK",
    nombre: "Reino Unido",
    bandera: "🇬🇧",
    autoridad: { nombre: "Visados e inmigración — GOV.UK", url: "https://www.gov.uk/browse/visas-immigration" },
    libreCirculacion: false,
    siEresDeLaUE: [
      "Desde el Brexit, ser de la UE ya no da ningún derecho a trabajar aquí. Estás en las mismas condiciones que el resto del mundo.",
      "Si ya vivías en el Reino Unido antes del 31 de diciembre de 2020, mira si te corresponde el EU Settlement Scheme: eso sí se conserva.",
    ],
    siNoEresDeLaUE: [
      "El sistema es por puntos. La vía normal es el visado de trabajo cualificado (Skilled Worker), y exige que una empresa con licencia de patrocinador te contrate.",
      "Sin patrocinador no hay visado de trabajo. Ninguna familia ni particular puede patrocinarte.",
      "El puesto tiene que estar en la lista de ocupaciones admitidas y llegar al umbral salarial, que se ha subido varias veces.",
      "El visado de estudiante permite trabajar un número limitado de horas durante el curso.",
    ],
    movilidadJoven: {
      nombre: "Youth Mobility Scheme",
      edad: "18 a 35 años en unos países, 18 a 30 en otros",
      nacionalidades: [...UK_YMS_18_35, ...UK_YMS_18_30, ...UK_YMS_SORTEO],
      condiciones: [
        "Dos años para vivir y trabajar en lo que quieras, sin patrocinador.",
        "Piden un ahorro mínimo en la cuenta y que lleve un tiempo ahí.",
        "Hong Kong y Taiwán entran por sorteo: hay que salir elegido antes de poder solicitarlo.",
        "Australia, Canadá, Nueva Zelanda y Corea del Sur llegan hasta los 35; el resto, hasta los 30.",
      ],
      url: "https://www.gov.uk/youth-mobility",
      nota: "España y el resto de la UE NO están en esta lista. Uruguay sí, y también Andorra, Islandia, Japón, Mónaco y San Marino.",
    },
    ojoCon:
      "Es el país con más ofertas de cuidado de niños de la aplicación y a la vez uno de los más difíciles. El visado de au pair desapareció en enero de 2021 y no ha vuelto. Si una familia te propone ir «como se hacía antes», te está proponiendo trabajar sin papeles: quien se juega la expulsión eres tú.",
  },

  {
    codigo: "US",
    nombre: "Estados Unidos",
    bandera: "🇺🇸",
    autoridad: { nombre: "Visados de EE. UU. — Departamento de Estado", url: "https://travel.state.gov/content/travel/en/us-visas.html" },
    libreCirculacion: false,
    siEresDeLaUE: [
      "Ser de la UE no da ningún derecho a trabajar allí. El ESTA sirve para viajar, no para trabajar.",
    ],
    siNoEresDeLaUE: [
      "No existe un visado general de trabajo que se pida uno mismo: casi todos los pide la empresa por ti, ante el servicio de inmigración.",
      "El visado de profesional cualificado (H-1B) va por sorteo anual, con muchísima más demanda que plazas.",
      "El visado de intercambio (J-1) es la vía real para au pair, prácticas y campamentos de verano, y va siempre a través de una agencia patrocinadora designada por el Departamento de Estado.",
      "Comprueba que la agencia está en la lista oficial ANTES de pagar nada.",
    ],
    ojoCon:
      "Entrar con ESTA o con visado de turista y ponerte a trabajar es una infracción migratoria seria, y las consecuencias duran años. Cualquiera que te ofrezca ir a trabajar «con el ESTA» te está metiendo en un problema o te está estafando.",
  },

  {
    codigo: "CA",
    nombre: "Canadá",
    bandera: "🇨🇦",
    autoridad: { nombre: "Inmigración, Refugiados y Ciudadanía de Canadá", url: "https://www.canada.ca/en/services/immigration-citizenship.html" },
    libreCirculacion: false,
    siEresDeLaUE: [
      "Ser de la UE no da derecho de entrada, pero la mayoría de países de la UE sí tienen acuerdo de movilidad juvenil con Canadá, que es la vía más accesible con diferencia.",
    ],
    siNoEresDeLaUE: [
      "La vía por trabajo suele exigir que la empresa consiga primero una autorización que acredite que no encontró a nadie en Canadá (LMIA).",
      "La vía por residencia permanente es Entry Express: un sistema por puntos que valora edad, estudios, experiencia e idiomas, y no hace falta tener oferta de trabajo para entrar en la bolsa.",
    ],
    movilidadJoven: {
      nombre: "International Experience Canada (IEC)",
      edad: "18 a 30 o 18 a 35, según el país",
      nacionalidades: CA_IEC,
      condiciones: [
        "Tiene tres modalidades: Working Holiday, con permiso abierto para trabajar donde quieras; Young Professionals; y prácticas de estudiantes.",
        "Se entra en una bolsa y van saliendo invitaciones por sorteo a lo largo de la temporada.",
        "Cada país tiene su propio cupo anual y su propia franja de edad.",
      ],
      url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/work-canada/iec.html",
      nota: "España SÍ está en la lista, y también Chile, Costa Rica y México. Argentina no tiene acuerdo bilateral, pero existe la vía de las organizaciones reconocidas.",
    },
    ojoCon:
      "El antiguo programa de cuidadores internos se cerró. Si ves ofertas de interna en Canadá, comprueba por qué vía se entra antes de ilusionarte.",
  },

  {
    codigo: "AU",
    nombre: "Australia",
    bandera: "🇦🇺",
    autoridad: { nombre: "Buscador de visados — Departamento de Interior de Australia", url: "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-finder" },
    libreCirculacion: false,
    siEresDeLaUE: [
      "Ser de la UE no da derecho de entrada, pero casi todos los países de la UE tienen acuerdo de movilidad joven con Australia.",
    ],
    siNoEresDeLaUE: [
      "La vía por trabajo exige patrocinio de una empresa australiana acreditada, y que la ocupación esté en las listas oficiales.",
      "La vía por puntos (visados de trabajo cualificado) valora edad, inglés, estudios y experiencia, y funciona por invitación.",
    ],
    movilidadJoven: {
      nombre: "Working Holiday (417) y Work and Holiday (462)",
      edad: "18 a 30 años, y hasta 35 en algunos países",
      nacionalidades: [...AU_417, ...AU_462],
      condiciones: [
        "Un año para trabajar y viajar, prorrogable hasta tres si haces el trabajo especificado en zonas regionales.",
        "Son DOS visados distintos y no da igual cuál te toca. La 417 es la sencilla: basta el pasaporte.",
        "La 462, que es la que corresponde a España y a Latinoamérica, pide además estudios superiores, nivel de inglés y, en algunos países, carta de apoyo del gobierno y cupo anual.",
        "Piden acreditar unos ahorros mínimos al entrar.",
      ],
      url: "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/work-holiday-462",
      nota: "España, Argentina, Chile, Perú, Ecuador y Uruguay van por la 462, con sus requisitos añadidos. Francia, Alemania, Italia, Irlanda, Países Bajos y Reino Unido van por la 417, que es más fácil.",
    },
    ojoCon:
      "Que tu país esté en la lista no significa que puedas ir mañana: la 462 tiene cupo anual por nacionalidad, y cuando se agota no se conceden más hasta el 1 de julio siguiente.",
  },

  {
    codigo: "NZ",
    nombre: "Nueva Zelanda",
    bandera: "🇳🇿",
    autoridad: { nombre: "Immigration New Zealand", url: "https://www.immigration.govt.nz/" },
    libreCirculacion: false,
    siEresDeLaUE: [
      "Ser de la UE no da derecho de entrada. La vía habitual para gente joven es el visado de vacaciones y trabajo, que Nueva Zelanda tiene firmado con muchos países europeos.",
    ],
    siNoEresDeLaUE: [
      "La vía por trabajo es el visado de empleador acreditado (AEWV): la empresa tiene que estar acreditada por inmigración y el puesto tiene que pasar una comprobación de mercado laboral.",
      "Hay listas de ocupaciones con escasez que acortan mucho el trámite.",
    ],
    movilidadJoven: {
      nombre: "Working Holiday Visa",
      edad: "normalmente 18 a 30 años, y hasta 35 en algunos países",
      nacionalidades: [],
      condiciones: [
        "Doce meses para trabajar y viajar, y más en algunos países.",
        "La mayoría de los acuerdos tienen cupo anual y se agotan: los de más demanda se abren un día concreto del año y se acaban en horas.",
        "Piden acreditar ahorros y billete de vuelta o dinero para pagarlo.",
      ],
      url: "https://www.immigration.govt.nz/work/working-holiday-visas/",
      nota: "La lista de países cambia y cada acuerdo tiene su cupo y su fecha de apertura, así que no la reproducimos aquí: compruébala en la web oficial, que es donde está al día.",
    },
  },

  {
    codigo: "JP",
    nombre: "Japón",
    bandera: "🇯🇵",
    autoridad: { nombre: "Visados de Japón — Ministerio de Asuntos Exteriores", url: "https://www.mofa.go.jp/j_info/visit/visa/index.html" },
    libreCirculacion: false,
    siEresDeLaUE: [
      "Ser de la UE no da derecho a trabajar. Sí evita el visado para ir de turista, pero eso no permite trabajar.",
    ],
    siNoEresDeLaUE: [
      "El visado de trabajo se pide en dos pasos: primero la empresa japonesa consigue el Certificado de Elegibilidad ante inmigración, y con ese papel pides el visado en el consulado.",
      "Sin empresa que lo tramite no hay visado de trabajo. El certificado tarda semanas o meses.",
      "Los visados se conceden por categoría de actividad —ingeniería, humanidades, cocina especializada, docencia— y tienes que trabajar en lo que pone el tuyo.",
    ],
    movilidadJoven: {
      nombre: "Working Holiday",
      edad: "18 a 30 años en la mayoría de los acuerdos",
      nacionalidades: ["ES", "AR", "CL", "UY", "FR", "DE", "IT", "PT", "IE", "UK", "DK", "NO", "SE", "FI", "IS", "AT", "HU", "PL", "CZ", "SK", "EE", "LT", "NL", "AU", "NZ", "CA", "KR", "TW", "HK"],
      condiciones: [
        "Hasta un año, con la idea de que el trabajo es para financiar el viaje, no al revés.",
        "Casi todos los acuerdos tienen cupo anual de plazas.",
        "Se pide acreditar ahorros y seguro médico.",
      ],
      url: "https://www.mofa.go.jp/j_info/visit/w_holiday/index.html",
      nota: "España, Argentina, Chile y Uruguay están entre los países con acuerdo. La lista y los cupos los publica el Ministerio japonés; confírmalos ahí antes de organizar nada.",
    },
  },

  {
    codigo: "SG",
    nombre: "Singapur",
    bandera: "🇸🇬",
    autoridad: { nombre: "Ministry of Manpower — permisos de trabajo de Singapur", url: "https://www.mom.gov.sg/passes-and-permits" },
    libreCirculacion: false,
    siEresDeLaUE: [
      "Ser de la UE no cambia nada: Singapur aplica las mismas reglas a todo el mundo, y son de las más estrictas y a la vez más claras.",
    ],
    siNoEresDeLaUE: [
      "Todos los permisos los solicita el empleador, nunca la persona. No puedes pedirlo por tu cuenta.",
      "El Employment Pass es para perfiles profesionales y exige un salario mínimo alto, que sube con la edad y se revisa cada año.",
      "El S Pass es para perfiles técnicos, con umbral salarial más bajo y cuota por empresa.",
      "El Work Permit cubre construcción, industria y servicio doméstico, y está limitado por nacionalidad y por sector.",
      "Existe un sistema de puntos (COMPASS) que valora salario, estudios y la diversidad de la plantilla de la empresa.",
    ],
    ojoCon:
      "Singapur publica los umbrales salariales exactos y los actualiza cada año, y son públicos y comprobables. Si una oferta paga por debajo del umbral de su permiso, ese permiso no se va a conceder por mucho que la oferta sea real.",
  },
];

export const ACTUALIZADO = "2026-09";

export const FUENTES_DESTINOS = [
  { titulo: "Youth Mobility Scheme — GOV.UK", url: "https://www.gov.uk/youth-mobility" },
  { titulo: "Work and Holiday (subclass 462) — Departamento de Interior de Australia", url: "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/work-holiday-462" },
  { titulo: "International Experience Canada — Gobierno de Canadá", url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/work-canada/iec.html" },
  { titulo: "Trabajar en otro país de la UE — Your Europe", url: "https://europa.eu/youreurope/citizens/work/work-abroad/index_es.htm" },
];

export function requisitosDe(destino: string | null | undefined): RequisitosDestino | undefined {
  const d = normalizarPais(destino);
  return REQUISITOS.find(r => r.codigo === d);
}

/**
 * ¿Esta nacionalidad tiene vía de movilidad joven para este destino?
 *
 * Devuelve `null` cuando no hay programa, y `undefined` cuando lo hay pero no
 * publicamos la lista de nacionalidades (Nueva Zelanda). Son cosas distintas y
 * la interfaz tiene que decirlas distinto: «no existe» no es lo mismo que «no lo
 * sabemos, míralo aquí».
 */
export function movilidadJovenPara(
  origen: string | null | undefined,
  destino: string,
): { aplica: boolean | undefined; programa: MovilidadJoven | null } {
  const ficha = requisitosDe(destino);
  if (!ficha?.movilidadJoven) return { aplica: false, programa: null };

  const programa = ficha.movilidadJoven;
  const o = normalizarPais(origen);
  if (!o) return { aplica: undefined, programa };
  if (programa.nacionalidades.length === 0) return { aplica: undefined, programa };

  return { aplica: programa.nacionalidades.includes(o), programa };
}

/** Solo el enlace oficial, que es lo que más se usa. Nunca devuelve nada falso. */
export function autoridadDe(destino: string | null | undefined) {
  return requisitosDe(destino)?.autoridad;
}
