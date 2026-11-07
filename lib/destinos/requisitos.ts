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
 * Lo que vale igual en los veintitrés destinos europeos. Se escribe una vez y se
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
  // ── Los veintitrés destinos del espacio europeo ────────────────────────────
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

  // Malta (6 nov 2026). Fuentes: Identità — eResidence de ciudadanos de la UE
  // por empleo, y Single Permit (quién puede pedirlo y cómo), comprobadas el
  // 6 nov 2026; EURES, «Living and working conditions: Malta» (18 may 2026).
  destinoUE("MT", "Malta", "🇲🇹", {
    nombre: "Identità — Unidad de Expatriados del Gobierno de Malta",
    url: "https://identita.gov.mt/",
  }, [
    "En Malta el permiso es el Single Permit, residencia y trabajo en uno. Solo lo puede pedir la empresa que te contrata, por internet, y tiene que estar registrada en Jobsplus: tú no puedes pedirlo por tu cuenta.",
    "El permiso te ata a esa empresa: no puedes trabajar para otra ni hacer tareas distintas de las de tu solicitud.",
    "Si eres de fuera de la UE y empezaste a trabajar desde el 1 oct 2025, tu sueldo tiene que llegarte por transferencia a una cuenta a tu nombre.",
  ]),

  // Eslovaquia (6 nov 2026). Va sin destinoUE() porque la frase común «los tres
  // primeros meses no hay que hacer nada» aquí no vale: hay que avisar a la
  // policía de extranjería en 10 días hábiles. Fuentes: slovensko.sk (estancia
  // de ciudadanos de la UE e inicio de un empleo) y la pregunta 16 del
  // Ministerio del Interior (residencia temporal por empleo, jul 2025).
  {
    codigo: "SK",
    nombre: "Eslovaquia",
    bandera: "🇸🇰",
    autoridad: {
      nombre: "Policía de Fronteras y Extranjería — Ministerio del Interior de Eslovaquia",
      url: "https://www.minv.sk/?uhcp",
    },
    libreCirculacion: true,
    siEresDeLaUE: [
      "No necesitas visado ni permiso de trabajo. Puedes entrar, buscar trabajo y firmar un contrato como cualquier eslovaco.",
      "Aquí sí hay que hacer algo al llegar: en los 10 días hábiles siguientes tienes que avisar de tu estancia a la policía de extranjería, salvo que lo haga tu alojamiento.",
      "Si te quedas más de tres meses, tienes 30 días más para registrar la residencia, en persona y gratis, en la policía de extranjería.",
      "Al empezar a trabajar, la empresa te da de alta en la Seguridad Social (Sociálna poisťovňa), en una aseguradora de salud y en Hacienda.",
    ],
    siNoEresDeLaUE: [
      ...UE_SI_NO_ERES_DE_LA_UE,
      "La residencia temporal para trabajar se pide en persona en la embajada de Eslovaquia, o en la policía de extranjería si ya estás en el país de forma legal. Antes, la oficina de empleo (ÚPSVaR) tiene que confirmar que ese puesto se puede cubrir contigo.",
      "Piden antecedentes penales de menos de 90 días y prueba de alojamiento; y en los 30 días siguientes a recibir el permiso, un certificado médico.",
    ],
    ojoCon: UE_OJO_TURISTA,
  },

  // Eslovenia (6 nov 2026). Fuentes: gov.si, «Zaposlovanje in delo tujcev»
  // (actualizado el 4 jun 2026), y la ficha del certificado de registro de
  // residencia para ciudadanos de la UE.
  destinoUE("SI", "Eslovenia", "🇸🇮", {
    nombre: "Empleo y trabajo de extranjeros — Gobierno de Eslovenia",
    url: "https://www.gov.si/teme/zaposlovanje-in-delo-tujcev/",
  }, [
    "Para vivir y trabajar en Eslovenia hace falta el permiso único de residencia y trabajo (enotno dovoljenje). Lo da la oficina administrativa (upravna enota), que pide por su cuenta el visto bueno del servicio de empleo (ZRSZ).",
  ]),

  // Chipre (6 nov 2026). Fuentes: Departamento de Trabajo, «Employment of
  // non-EU citizens — General information»; Cyprus Mail, 27 sep 2026 («Cyprus
  // labour shortages: who can legally work?»); EURES, «Living and working
  // conditions: Cyprus» (11 mar 2026), sobre el norte de la isla.
  destinoUE("CY", "Chipre", "🇨🇾", {
    nombre: "Departamento de Trabajo de Chipre — empleo de ciudadanos de fuera de la UE",
    url: "https://www.mlsi.gov.cy/mlsi/dl/dl.nsf/page5a_en/page5a_en",
  }, [
    "La empresa pide permiso al Departamento de Trabajo, que solo lo da si no hay nadie de Chipre o de la UE para ese puesto. Si lo aprueba, sella el contrato y Migración te da el permiso de residencia y trabajo.",
    "La vía general se usa sobre todo en agricultura y ganadería, reparto de comida, industria y comercio. El empleo doméstico va aparte, y los perfiles muy cualificados de empresas extranjeras tienen programas propios.",
  ], "Todo esto vale para la parte de la isla que controla la República de Chipre. En el norte, el 36,2 % del país, el Gobierno no ejerce el control y el derecho de la UE está suspendido: la libre circulación no te sirve allí."),

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

  // México (5 nov 2026). Comprobado en gob.mx (INM y la ficha de la visa de
  // residencia temporal), la Ventanilla Única de trámites y los consulados de
  // México. Sin cuantías ni tasas, por la regla de arriba.
  {
    codigo: "MX",
    nombre: "México",
    bandera: "🇲🇽",
    autoridad: { nombre: "Instituto Nacional de Migración (INM) — Gobierno de México", url: "https://www.gob.mx/inm" },
    libreCirculacion: false,
    siEresDeLaUE: [
      "Ser de la UE no da derecho a trabajar en México. Con pasaporte de la UE puedes entrar sin visado como visitante, pero esa estancia no permite trabajar.",
    ],
    siNoEresDeLaUE: [
      "El trámite lo empieza la empresa, no tú: tiene que estar inscrita como empleadora ante el Instituto Nacional de Migración, y es ella quien pide la autorización de visa por oferta de empleo.",
      "Con la autorización, recoges la visa en un consulado de México. Si el trabajo dura más de 180 días, es de residente temporal; si dura menos, de visitante con permiso para actividades remuneradas.",
      "Con la visa de residente, al entrar tienes 30 días naturales para canjearla por la tarjeta de residente en una oficina del INM.",
      "Para cobrar en nómina hacen falta además la CURP, el RFC del SAT y el número de seguridad social del IMSS.",
    ],
    ojoCon:
      "Entrar como visitante y ponerte a trabajar no es una vía legal, aunque te lo ofrezcan. Y una oferta de una empresa que no está inscrita ante el INM no sirve para pedir la visa, por buena que sea.",
  },
  // Brasil (5 nov 2026). Fuentes: Lei de Migração 13.445/2017 y su Decreto
  // 9.199/2017 (art. 64, registro en 90 días), el Acuerdo de Residencia del
  // Mercosur (Decreto 6.975/2009), la Polícia Federal y la Receita Federal
  // (CPF gratuito). Venezuela NO se pone en la vía Mercosur: las fuentes no
  // coinciden y está suspendida del bloque desde 2016.
  {
    codigo: "BR",
    nombre: "Brasil",
    bandera: "🇧🇷",
    autoridad: { nombre: "Polícia Federal — Imigração (Gobierno de Brasil)", url: "https://www.gov.br/pf/pt-br/assuntos/imigracao" },
    libreCirculacion: false,
    siEresDeLaUE: [
      "Ser de la UE no da derecho a trabajar en Brasil. Con pasaporte de la UE puedes entrar sin visado como turista, pero esa estancia no permite trabajar.",
    ],
    siNoEresDeLaUE: [
      "Si eres de Argentina, Bolivia, Chile, Colombia, Ecuador, Paraguay, Perú o Uruguay, tienes el Acuerdo de Residencia del Mercosur: pides una residencia temporal de dos años sin necesitar oferta de trabajo, y con ella puedes trabajar.",
      "Si no, hace falta una oferta de trabajo formal: con ella se pide la autorización de residencia para trabajar (por MigranteWeb, del Ministerio de Justicia) o el visado temporal de trabajo en un consulado de Brasil.",
      "Con visado temporal, al llegar tienes 90 días para registrarte en la Polícia Federal y sacar la Carteira de Registro Nacional Migratório (CRNM).",
      "Para cobrar hacen falta el CPF de la Receita Federal (gratis, también en los consulados) y la Carteira de Trabalho Digital, que va con el CPF.",
    ],
    ojoCon:
      "Trabajar con entrada de turista no es legal. Y si alguien te cobra por sacarte el CPF, desconfía: en la Receita Federal y en los consulados es gratis.",
  },
  // Colombia (5 nov 2026). Fuente: Resolución 5477 de 2022 de la Cancillería,
  // leída en su texto compilado: art. 71 (visa M Migrante Mercosur), art. 72
  // (M Migrante Andino), art. 74 (M Trabajador: el empleador acredita ingresos
  // medios de 100 salarios mínimos en los últimos cuatro meses, y el permiso
  // vale solo para ese cargo y esa empresa) y art. 118 (cédula de extranjería
  // en 15 días). Chile NO va en la vía Mercosur: Colombia se la quitó en
  // febrero de 2019 por reciprocidad (Asuntos Legales, 24 abr 2019) y no
  // consta que se la haya devuelto. PPT de venezolanos: en mayo de 2026 solo
  // admitía inscripciones de menores escolarizados (Migración Colombia).
  {
    codigo: "CO",
    nombre: "Colombia",
    bandera: "🇨🇴",
    autoridad: { nombre: "Visas — Cancillería de Colombia", url: "https://www.cancilleria.gov.co/atencion-y-servicio-al-ciudadano/tramites-y-servicios/visa" },
    libreCirculacion: false,
    siEresDeLaUE: [
      "Ser de la UE no da derecho a trabajar en Colombia. Con pasaporte español puedes entrar sin visa como turista, pero esa estancia no permite trabajar.",
    ],
    siNoEresDeLaUE: [
      "Si eres de Argentina, Brasil, Bolivia, Ecuador, Paraguay, Perú o Uruguay, puedes pedir la visa M Mercosur: dos años, sin necesitar oferta de trabajo, y con ella puedes trabajar en lo que quieras. Bolivia, Ecuador y Perú tienen además la visa M Migrante Andino.",
      "Si no, hace falta una empresa que te contrate: pide la visa M Trabajador por ti y tiene que demostrar ingresos y explicar por qué contrata a alguien de fuera. Esa visa solo vale para ese puesto y esa empresa; si cambias de trabajo, hace falta otra.",
      "Con la visa, tienes 15 días naturales desde que entras (o desde que te la dan, si ya estás en Colombia) para pedir la cédula de extranjería en Migración Colombia.",
      "Si eres de Venezuela, el Permiso por Protección Temporal (PPT) ya no admite inscripciones nuevas de adultos: en mayo de 2026 solo estaba abierto para menores escolarizados. Pregunta en Migración Colombia qué vía tienes.",
    ],
    ojoCon:
      "Trabajar con entrada de turista no es legal, y la empresa que te contrata así se arriesga a multas. Y para alquilar, nadie puede pedirte un depósito en dinero: la ley lo prohíbe (Ley 820 de 2003).",
  },
  // Perú (5 nov 2026). Fuentes: Decreto Legislativo 689 (art. 3.c, leído en el
  // PDF de gob.pe: quien viene de un país con convenio de doble nacionalidad,
  // como España, no cuenta en el tope del 20% de plantilla y 30% de sueldos),
  // el reglamento de la Ley de Migraciones (contrato aprobado por el Ministerio
  // de Trabajo y calidad migratoria antes de empezar), gob.pe/12927 (residencia
  // Mercosur: Argentina, Brasil, Paraguay, Uruguay, Chile, Colombia, Ecuador y
  // Bolivia) y la Decisión 878 (residencia andina de dos años).
  {
    codigo: "PE",
    nombre: "Perú",
    bandera: "🇵🇪",
    autoridad: { nombre: "Superintendencia Nacional de Migraciones", url: "https://www.gob.pe/migraciones" },
    libreCirculacion: false,
    siEresDeLaUE: [
      "Ser de la UE no da derecho a trabajar en Perú. Con pasaporte español entras sin visa como turista, pero esa estancia no permite trabajar.",
      "Si eres de España, la empresa puede contratarte sin el tope de extranjeros (20% de la plantilla), porque hay convenio de doble nacionalidad. El contrato y el permiso hacen falta igual.",
    ],
    siNoEresDeLaUE: [
      "Si eres de Argentina, Brasil, Bolivia, Chile, Colombia, Ecuador, Paraguay o Uruguay, puedes pedir la residencia Mercosur en Migraciones: dos años, y con ella puedes trabajar. Bolivia, Colombia y Ecuador tienen además la residencia andina.",
      "Si no, hace falta una empresa que te contrate: registra tu contrato en el Ministerio de Trabajo y, con él aprobado, pides en Migraciones la calidad migratoria de trabajador residente. No puedes empezar a trabajar hasta tener las dos cosas.",
      "Con la residencia aprobada, Migraciones te da el carné de extranjería: es tu documento de identidad en Perú.",
      "Si eres de Venezuela, el Carné de Permiso Temporal de Permanencia (CPP) se abre por campañas: mira en Migraciones si hay una en marcha.",
    ],
    ojoCon:
      "Trabajar con entrada de turista no es legal. Y en una selección no pueden exigirte el certificado de antecedentes penales (basta una declaración jurada) ni tu reporte de deudas (Ley 31944).",
  },
  // Chile (5 nov 2026). Fuentes: Ley 21.325 y el dictamen de 2022 (la
  // residencia temporal se pide desde el extranjero, salvo casos concretos);
  // Servicio Nacional de Migraciones, subcategoría de reciprocidad
  // internacional (art. 70 n.º 13: Argentina, Bolivia, Brasil, Paraguay y
  // Uruguay; a Bolivia no le cobran); ChileAtiende (cédula para extranjeros
  // en el Registro Civil, 30 días desde que rige la residencia) y la
  // Dirección del Trabajo (pedir foto, «buena presencia» o antecedentes en una
  // oferta es discriminatorio, art. 2 del Código del Trabajo).
  {
    codigo: "CL",
    nombre: "Chile",
    bandera: "🇨🇱",
    autoridad: { nombre: "Servicio Nacional de Migraciones", url: "https://serviciomigraciones.cl/" },
    libreCirculacion: false,
    siEresDeLaUE: [
      "Ser de la UE no da derecho a trabajar en Chile. Con pasaporte español entras sin visa como turista, pero esa estancia no permite trabajar.",
    ],
    siNoEresDeLaUE: [
      "Si eres de Argentina, Bolivia, Brasil, Paraguay o Uruguay, puedes pedir la residencia temporal por reciprocidad del Mercosur, y con ella trabajar. A quien es de Bolivia no le cobran el trámite.",
      "Si no, la residencia temporal para trabajar se pide desde fuera de Chile, en el portal del Servicio Nacional de Migraciones, normalmente con una oferta o un contrato. Entrar como turista y cambiarla dentro casi nunca es posible.",
      "Con la residencia en vigor, tienes 30 días para pedir la cédula de identidad para extranjeros en el Registro Civil. Si te pasas, hay multa.",
    ],
    ojoCon:
      "Trabajar con entrada de turista no es legal. Y una oferta no puede pedirte foto, «buena presencia» ni antecedentes que no tengan que ver con el puesto: la Dirección del Trabajo lo considera discriminación.",
  },
  // Argentina (5 nov 2026). Fuentes: argentina.gob.ar (residencia temporaria
  // por nacionalidad Mercosur: Uruguay, Brasil, Paraguay, Bolivia, Chile, Perú,
  // Ecuador, Colombia y Venezuela), la Cancillería argentina (Programa de
  // Movilidad de Jóvenes con España, en vigor desde el 10 feb 2023: visa de
  // vacaciones y trabajo de 12 meses no prorrogables) y la DNM (trabajador
  // migrante: el empleador inscrito en el RENURE y firmas certificadas).
  {
    codigo: "AR",
    nombre: "Argentina",
    bandera: "🇦🇷",
    autoridad: { nombre: "Dirección Nacional de Migraciones", url: "https://www.argentina.gob.ar/interior/migraciones" },
    libreCirculacion: false,
    siEresDeLaUE: [
      "Ser de la UE no da derecho a trabajar en Argentina. Con pasaporte español entras sin visa como turista, pero esa estancia no permite trabajar.",
      "Si eres joven y de España, hay un programa de movilidad de jóvenes: una visa de vacaciones y trabajo de 12 meses, que se pide en un consulado argentino en España. Mira allí la edad y el cupo.",
      "Si no, hace falta una empresa inscrita en el RENURE (el registro de quienes contratan extranjeros) que te firme el contrato, con las firmas certificadas, para pedir la residencia temporaria como trabajador migrante.",
    ],
    siNoEresDeLaUE: [
      "Si eres de Uruguay, Brasil, Paraguay, Bolivia, Chile, Perú, Ecuador, Colombia o Venezuela, puedes pedir la residencia temporaria por nacionalidad Mercosur: dos años, y con ella puedes trabajar.",
      "Si no, hace falta una empresa inscrita en el RENURE que te contrate, para pedir la residencia temporaria como trabajador migrante en la Dirección Nacional de Migraciones.",
      "Con la residencia, sacas el DNI para extranjeros y el CUIL, el número con el que te dan de alta en el trabajo.",
    ],
    ojoCon:
      "Trabajar con entrada de turista no es legal. Y desconfía de los anuncios de «encuestas pagadas desde casa» que se publican como empleo en decenas de pueblos a la vez: no son trabajos.",
  },
  // Ecuador (5 nov 2026). Fuentes: gob.ec (visa de residencia temporal de
  // trabajo en relación de dependencia, con el contrato registrado en el
  // Ministerio del Trabajo; residencia temporal Mercosur, 2 años, 50 + 200
  // US$; residencia temporal del Estatuto Migratorio Andino, 2 años, 50 US$),
  // Ley Orgánica de Movilidad Humana (art. 60) y el Acuerdo de Residencia del
  // Mercosur (art. 8: trabajar por cuenta propia o ajena). Lista Mercosur: los
  // firmantes (Argentina, Brasil, Paraguay, Uruguay, Bolivia, Chile) y los que
  // se adhirieron (Perú, Colombia); la ficha de gob.ec no enumera países.
  {
    codigo: "EC",
    nombre: "Ecuador",
    bandera: "🇪🇨",
    autoridad: { nombre: "Ministerio de Relaciones Exteriores y Movilidad Humana", url: "https://www.cancilleria.gob.ec/" },
    libreCirculacion: false,
    siEresDeLaUE: [
      "Ser de la UE no da derecho a trabajar en Ecuador. Con pasaporte español entras sin visa como turista, pero esa estancia no permite trabajar.",
    ],
    siNoEresDeLaUE: [
      "Si eres de Colombia, Perú o Bolivia, tienes la residencia temporal del Estatuto Migratorio Andino: dos años y solo pagas los 50 US$ de la solicitud.",
      "Si eres de Argentina, Brasil, Paraguay, Uruguay, Bolivia, Chile, Perú o Colombia, puedes pedir la residencia temporal Mercosur: dos años, 250 US$ en total, y con ella puedes trabajar.",
      "Si no, hace falta un contrato con una empresa ecuatoriana, registrado en el Ministerio del Trabajo, para pedir la visa de residencia temporal de trabajo. Todo se pide en línea.",
      "Si eres de Venezuela, hay además un estatuto migratorio entre los dos países: pregunta en Cancillería qué visa te toca.",
    ],
    ojoCon:
      "Trabajar con entrada de turista no es legal. Y en Ecuador las ETT están prohibidas desde 2008 (Mandato 8): si una agencia te ofrece trabajar contratado por ella para otra empresa, desconfía.",
  },
  // Guatemala (5 nov 2026). Fuentes: Agencia Guatemalteca de Noticias (el
  // permiso de trabajo del Ministerio de Trabajo lo pide el empleador, en
  // línea por la plataforma PEX) y guías que lo distinguen de la residencia
  // temporal del Instituto Guatemalteco de Migración: hacen falta los dos.
  // No se ha encontrado una vía regional para trabajar (el CA-4 es para
  // viajar), así que no se promete ninguna.
  {
    codigo: "GT",
    nombre: "Guatemala",
    bandera: "🇬🇹",
    autoridad: { nombre: "Instituto Guatemalteco de Migración", url: "https://igm.gob.gt/" },
    libreCirculacion: false,
    siEresDeLaUE: [
      "Ser de la UE no da derecho a trabajar en Guatemala. Con pasaporte español entras sin visa como turista, pero esa estancia no permite trabajar.",
    ],
    siNoEresDeLaUE: [
      "Hace falta una empresa que te contrate: ella pide en línea al Ministerio de Trabajo tu permiso de trabajo, que va ligado a esa empresa.",
      "Además necesitas la residencia temporal como trabajador del Instituto Guatemalteco de Migración. Una sin la otra no vale.",
      "Con la residencia, sacas el DPI de extranjero domiciliado en el RENAP.",
    ],
    ojoCon:
      "Trabajar con entrada de turista no es legal. Y el permiso es para una empresa concreta: si cambias de trabajo, la nueva tiene que pedir otro.",
  },
  // Costa Rica (5 nov 2026). Fuente: Ley General de Migración 8764 (art. 80:
  // la autorización para trabajar la da la Dirección General de Migración, con
  // el criterio del Ministerio de Trabajo) y guías que coinciden en que no hay
  // permiso de trabajo aparte: trabajar depende de la categoría de residencia,
  // va ligado a un empleador y tarda meses.
  {
    codigo: "CR",
    nombre: "Costa Rica",
    bandera: "🇨🇷",
    autoridad: { nombre: "Dirección General de Migración y Extranjería", url: "https://www.migracion.go.cr/" },
    libreCirculacion: false,
    siEresDeLaUE: [
      "Ser de la UE no da derecho a trabajar en Costa Rica. Con pasaporte español entras sin visa como turista, pero esa estancia no permite trabajar.",
    ],
    siNoEresDeLaUE: [
      "En Costa Rica no hay un permiso de trabajo aparte: lo que te deja trabajar es la categoría de residencia. Para un empleo, la empresa hace su parte ante el Ministerio de Trabajo y tú pides la residencia en la Dirección General de Migración.",
      "Esa autorización va ligada a la empresa que te contrata, y el trámite suele tardar meses.",
    ],
    ojoCon:
      "Trabajar con entrada de turista no es legal. Y muchas ofertas de Costa Rica piden inglés: si no lo hablas, filtra por las que no lo pidan antes de mandar el CV.",
  },
  // Uruguay (5 nov 2026). Fuentes: Ley 19.254 (residencia permanente para
  // nacionales de los Estados Parte y Asociados del Mercosur, gratis, la
  // resuelve Cancillería en 30 días hábiles; al iniciarla se da una cédula
  // provisoria), la guía «Tipos de residencia» de Cancillería (residencia
  // temporaria por categorías, como profesional contratado con certificación
  // de la empresa; residencia legal definitiva con medios de vida) y Voz de
  // América (los venezolanos también se acogen).
  {
    codigo: "UY",
    nombre: "Uruguay",
    bandera: "🇺🇾",
    autoridad: { nombre: "Ministerio de Relaciones Exteriores — Residencias", url: "https://www.gub.uy/ministerio-relaciones-exteriores/" },
    libreCirculacion: false,
    siEresDeLaUE: [
      "Ser de la UE no da derecho a trabajar en Uruguay. Con pasaporte español entras sin visa como turista.",
      "Para quedarte hay residencia temporaria por categorías (por ejemplo, profesional contratado, con un certificado de la empresa con tu actividad, sueldo y duración) o la residencia legal definitiva, demostrando medios de vida.",
    ],
    siNoEresDeLaUE: [
      "Si eres de Argentina, Brasil, Paraguay, Bolivia, Chile, Colombia, Ecuador, Perú o Venezuela, tienes la residencia permanente por la Ley 19.254: gratis, la pides en Uruguay o en un consulado, Cancillería tiene 30 días hábiles para resolver y al empezar te dan una cédula provisoria.",
      "Si no, la residencia temporaria por categorías o la residencia legal definitiva, como desde la UE.",
    ],
    ojoCon:
      "Para alquilar, el Estado ofrece una garantía (Contaduría General de la Nación y Ministerio de Vivienda), y otra para jóvenes de 18 a 29 años. Infórmate antes de pagar un seguro de fianza.",
  },
  // El Salvador (5 nov 2026). Fuentes: Diario El Mundo (la Dirección General de
  // Migración y Extranjería da residencias temporales de hasta dos años a
  // quien tiene una oferta de empleo), portal de transparencia del Gobierno.
  // No se ha encontrado una vía regional para trabajar (el CA-4 es para
  // viajar), así que no se promete ninguna.
  {
    codigo: "SV",
    nombre: "El Salvador",
    bandera: "🇸🇻",
    autoridad: { nombre: "Dirección General de Migración y Extranjería", url: "https://www.migracion.gob.sv/" },
    libreCirculacion: false,
    siEresDeLaUE: [
      "Ser de la UE no da derecho a trabajar en El Salvador. Con pasaporte español entras sin visa como turista, pero esa estancia no permite trabajar.",
    ],
    siNoEresDeLaUE: [
      "Hace falta una oferta de empleo de una empresa salvadoreña: con ella pides la residencia temporal en la Dirección General de Migración y Extranjería, de hasta dos años y prorrogable.",
    ],
    ojoCon:
      "Trabajar con entrada de turista no es legal. Y el Ministerio de Trabajo no tiene bolsa en línea: sus vacantes salen en los «Lunes de Empleo» de sus 14 oficinas.",
  },
  // Panamá (5 nov 2026). Fuentes: el decreto de Países Amigos y su
  // ampliación a Ecuador (Decreto Ejecutivo 16, en vigor el 1 sep 2026; la
  // lista incluye a España), guías jurídicas que coinciden en la vía por
  // contrato laboral (residencia provisional de dos años, luego permanente) y
  // en que la residencia NO exime del permiso de trabajo del Ministerio de
  // Trabajo (MITRADEL).
  {
    codigo: "PA",
    nombre: "Panamá",
    bandera: "🇵🇦",
    autoridad: { nombre: "Servicio Nacional de Migración", url: "https://www.migracion.gob.pa/" },
    libreCirculacion: false,
    siEresDeLaUE: [
      "Ser de la UE no da derecho a trabajar en Panamá. Con pasaporte español entras sin visa como turista, pero esa estancia no permite trabajar.",
      "Si eres de España, estás en la lista de Países Amigos: con un contrato de trabajo en Panamá pides una residencia provisional de dos años que luego pasa a permanente.",
      "Aun con esa residencia, para trabajar necesitas además el permiso de trabajo del Ministerio de Trabajo (MITRADEL).",
    ],
    siNoEresDeLaUE: [
      "Mira si tu país está en la lista de Países Amigos (en septiembre de 2026 se añadió Ecuador): con contrato de trabajo tienes residencia provisional de dos años y después permanente.",
      "Con esa residencia o con otra, el permiso de trabajo del Ministerio de Trabajo se pide aparte.",
    ],
    ojoCon:
      "Trabajar con entrada de turista no es legal. Y el Ministerio de Trabajo ha avisado de portales de empleo falsos que se hacen pasar por el suyo: el oficial es empleospanama.gob.pa.",
  },
  // República Dominicana (5 nov 2026). Fuentes: Dirección General de
  // Migración (Residencia Temporal Laboral RT-3, con visa de negocios NM1;
  // permiso de trabajo temporal), Diario Libre (Resolución 001-2026: el
  // permiso se renueva solo con contrato formal registrado en el Ministerio de
  // Trabajo, y no vale para trabajos informales como motoconcho o delivery) y
  // el Código de Trabajo (el 80 % de la plantilla tiene que ser dominicana).
  {
    codigo: "DO",
    nombre: "República Dominicana",
    bandera: "🇩🇴",
    autoridad: { nombre: "Dirección General de Migración", url: "https://migracion.gob.do/" },
    libreCirculacion: false,
    siEresDeLaUE: [
      "Ser de la UE no da derecho a trabajar en República Dominicana. Con pasaporte español entras como turista, pero esa estancia no permite trabajar.",
    ],
    siNoEresDeLaUE: [
      "Hace falta una empresa que te contrate, con el contrato registrado en el Ministerio de Trabajo: con él se pide la Residencia Temporal Laboral (RT-3) en la Dirección General de Migración, que exige entrar con visa de negocios.",
      "Por ley, el 80 % de la plantilla de una empresa tiene que ser dominicana, así que cada empresa tiene un cupo para extranjeros.",
      "El permiso de trabajo no vale para trabajos informales como motoconcho, taxi, venta ambulante, delivery o mensajería.",
    ],
    ojoCon:
      "Trabajar con entrada de turista no es legal. Y desde 2026 el permiso solo se renueva con un contrato formal registrado: una declaración jurada ya no sirve.",
  },
  // Honduras (5 nov 2026). Fuentes: Código de Trabajo, art. 11 (al menos el
  // 90 % de la plantilla tiene que ser hondureña; salvo hasta dos directivos
  // extranjeros por empresa, según el anexo del TLC Perú-Honduras) y guías que
  // coinciden en el proceso: autorización de la Secretaría de Trabajo y
  // residencia del Instituto Nacional de Migración.
  {
    codigo: "HN",
    nombre: "Honduras",
    bandera: "🇭🇳",
    autoridad: { nombre: "Instituto Nacional de Migración", url: "https://inm.gob.hn/" },
    libreCirculacion: false,
    siEresDeLaUE: [
      "Ser de la UE no da derecho a trabajar en Honduras. Con pasaporte español entras sin visa como turista, pero esa estancia no permite trabajar.",
    ],
    siNoEresDeLaUE: [
      "Hace falta una empresa que te contrate: la Secretaría de Trabajo autoriza tu permiso de trabajo y el Instituto Nacional de Migración te da la residencia.",
      "Por ley, al menos el 90 % de la plantilla tiene que ser hondureña, así que cada empresa tiene un cupo pequeño para extranjeros.",
    ],
    ojoCon:
      "Trabajar con entrada de turista no es legal. Y la empresa que contrata a alguien sin permiso se arriesga a una multa de la Secretaría de Trabajo.",
  },
  // Venezuela (6 nov 2026). Fuentes: Exteriores, recomendaciones de viaje
  // (actualizadas el 17 sep 2026): con pasaporte español, sin visado hasta 90
  // días como turista; para trabajar Venezuela exige visado de trabajo; la
  // prórroga se pide en el SAIME antes de los 90 días, y quien se pasa se
  // arriesga a multa y a no poder entrar en 3 a 5 años. Embajada de España en
  // Caracas: los permisos de residencia y trabajo los tramita el consulado de
  // Venezuela. Finanzas Digital (17 feb 2025): la visa de transeúnte laboral
  // (TR-L) se prorroga por un año en el SAIME con la autorización laboral
  // renovada. LOTTT (Gaceta Oficial Ext. 6.076, 7 may 2012), art. 27: con
  // diez trabajadores o más, al menos el 90 % tiene que ser venezolano y los
  // sueldos de los extranjeros no pueden pasar del 20 % del total. No se ha
  // encontrado una vía regional que hoy deje trabajar en Venezuela, así que no
  // se promete ninguna.
  {
    codigo: "VE",
    nombre: "Venezuela",
    bandera: "🇻🇪",
    autoridad: { nombre: "SAIME — Servicio Administrativo de Identificación, Migración y Extranjería", url: "https://www.saime.gob.ve/" },
    libreCirculacion: false,
    siEresDeLaUE: [
      "Ser de la UE no da derecho a trabajar en Venezuela. Con pasaporte español entras sin visa como turista hasta 90 días, pero para trabajar Venezuela exige visa de trabajo.",
    ],
    siNoEresDeLaUE: [
      "Hace falta una empresa que te contrate y una visa de trabajo (transeúnte laboral), que se pide en un consulado de Venezuela. Se prorroga cada año en el SAIME, con la autorización laboral renovada.",
      "Por ley, si la empresa tiene diez trabajadores o más, al menos el 90 % tiene que ser venezolano, y los sueldos de los extranjeros no pueden pasar del 20 % del total.",
    ],
    ojoCon:
      "Trabajar con entrada de turista no es legal. Y si te quedas más de 90 días sin pedir la prórroga en el SAIME, te arriesgas a una multa y a no poder volver a entrar en 3 a 5 años.",
  },
  // Nicaragua (6 nov 2026). Fuentes: Exteriores, recomendaciones de viaje
  // (actualizadas el 26 may 2026): sin visado hasta 90 días, 10 US$ de
  // entrada, y entrar o salir de forma irregular se castiga con 2 a 6 años de
  // prisión. Embajada de España en Managua: la residencia, y en su caso el
  // permiso de trabajo, se pide en la Dirección General de Migración y
  // Extranjería si ya estás en Nicaragua, o en un consulado si estás fuera; la
  // temporal dura de 1 a 3 años; piden partida de nacimiento y antecedentes
  // penales legalizados y, a los temporales, un depósito igual al billete de
  // vuelta; los españoles tienen un régimen equivalente al de los
  // centroamericanos y la nacionalidad a los dos años, sin renunciar a la
  // suya. Código del Trabajo (Ley 185, art. 14): al menos el 90 % de la
  // plantilla, nicaragüense, salvo excepción del Ministerio del Trabajo por
  // razones técnicas. PRONicaragua: la empresa tiene que pedirte la cédula de
  // residencia en vigor. No se ha encontrado una vía regional para trabajar
  // (el CA-4 es para viajar), así que no se promete ninguna.
  {
    codigo: "NI",
    nombre: "Nicaragua",
    bandera: "🇳🇮",
    autoridad: { nombre: "Dirección General de Migración y Extranjería", url: "https://www.migob.gob.ni/migracion/" },
    libreCirculacion: false,
    siEresDeLaUE: [
      "Ser de la UE no da derecho a trabajar en Nicaragua. Con pasaporte español entras sin visa como turista hasta 90 días, pagando 10 US$ al llegar, pero para trabajar hace falta la residencia.",
      "Si eres de España, tienes el mismo trato que un centroamericano: a los dos años de residencia puedes pedir la nacionalidad nicaragüense sin perder la española.",
    ],
    siNoEresDeLaUE: [
      "Hace falta una empresa que te contrate y la residencia temporal, de uno a tres años, que se pide en la Dirección General de Migración y Extranjería si ya estás en Nicaragua, o en un consulado nicaragüense si estás fuera.",
      "Te piden la partida de nacimiento y el certificado de antecedentes penales legalizados y, para la residencia temporal, un depósito igual a lo que cuesta el billete de vuelta a tu país.",
      "Por ley, al menos el 90 % de la plantilla tiene que ser nicaragüense; el Ministerio del Trabajo solo hace excepciones por razones técnicas.",
      "La empresa te pedirá la cédula de residencia, y tiene que estar en vigor mientras trabajes.",
    ],
    ojoCon:
      "Trabajar con entrada de turista no es legal. Y entrar o salir por un paso no habilitado se castiga con dos a seis años de cárcel; a los extranjeros la ley les prohíbe además participar en actividades políticas, manifestaciones incluidas.",
  },
  // India (6 nov 2026). Fuentes: páginas del Employment Visa de los consulados
  // de India en Edimburgo y San Francisco y de las embajadas en Atenas y La
  // Haya: profesional cualificado, sueldo mínimo anual (Rs 16,25 lakh en esas
  // páginas; no se pone aquí, por la regla de arriba), exentos los profesores
  // de idiomas que no sean de inglés y los traductores, se pide desde el país
  // de origen o de residencia de más de dos años, no hay e-Visa de empleo y,
  // si pasa de 180 días, registro en 14 días.
  {
    codigo: "IN",
    nombre: "India",
    bandera: "🇮🇳",
    autoridad: { nombre: "Bureau of Immigration — Ministerio del Interior de India", url: "https://boi.gov.in/" },
    libreCirculacion: false,
    siEresDeLaUE: [
      "Ser de la UE no da ningún derecho a trabajar en India: hace falta el Employment Visa, igual que a cualquiera.",
    ],
    siNoEresDeLaUE: [
      "La vía es el Employment Visa: una empresa de India te contrata y, con su carta, lo pides en la embajada o el consulado de India. No se puede pedir como e-Visa.",
      "Es para profesionales cualificados, y pide un sueldo anual mínimo muy por encima del sueldo medio de allí. Eso deja fuera casi todos los empleos corrientes.",
      "Ese mínimo no se aplica a los profesores de idiomas que no sean de inglés ni a los traductores. Para un hispanohablante, enseñar español o traducir es la puerta más realista.",
      "Se pide desde tu país o desde el país donde vives hace más de dos años.",
      "Si el visado es de más de 180 días, al llegar tienes 14 días para registrarte en la oficina de extranjeros (FRRO). Se hace en línea.",
    ],
    ojoCon:
      "Trabajar con un visado de turista o de negocios no es legal, aunque te lo ofrezcan. Y el visado va con esa empresa: si cambias de trabajo, hay que pedir uno nuevo con el contrato nuevo.",
  },
  // Sudáfrica (6 nov 2026). Fuentes: listas de requisitos de Home Affairs del
  // Critical Skills Work Visa y del General Work Visa (en vigor desde el 9 oct
  // 2024), el sistema por puntos (Gaceta 51416, GN 5448, 18 oct 2024: 100
  // puntos; la profesión en la lista de habilidades críticas da los 100), la
  // lista de países exentos de visado de Home Affairs (España: 90 días) y la
  // Ley de Inmigración, arts. 38 y 49(3) (Labour Guide).
  {
    codigo: "ZA",
    nombre: "Sudáfrica",
    bandera: "🇿🇦",
    autoridad: { nombre: "Department of Home Affairs — Sudáfrica", url: "https://www.dha.gov.za/index.php/immigration-services" },
    libreCirculacion: false,
    siEresDeLaUE: [
      "Ser de la UE no da derecho a trabajar en Sudáfrica. Con pasaporte español entras sin visado hasta 90 días como turista, pero esa estancia no permite trabajar.",
    ],
    siNoEresDeLaUE: [
      "Hace falta un visado de trabajo y una oferta de empresa: el de habilidades críticas (Critical Skills Work Visa) si tu profesión está en la lista oficial; si no, el general (General Work Visa).",
      "Van por puntos y hacen falta 100. Estar en la lista de habilidades críticas da los 100. Si no, se suman con un sueldo alto, título universitario, años de experiencia y hablar una lengua oficial.",
      "Tu título tiene que evaluarlo SAQA, y si tu profesión tiene colegio profesional, hay que pedir el registro.",
      "Piden también certificado médico y de antecedentes penales, de menos de seis meses. La solicitud se entrega en VFS Global.",
    ],
    ojoCon:
      "Trabajar con la entrada de turista no es legal, y la empresa que contrata a sabiendas a alguien sin permiso comete un delito. Ojo también con los sueldos: los de atención al cliente o de hostelería quedan muy lejos de lo que da puntos.",
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
