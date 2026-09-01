/**
 * lib/cursos/tipos.ts — Catálogo de tipos de curso.
 *
 * Esto NO son plazas concretas (esas llegan en la fase 2, desde Lanbide, el SOC
 * y las plataformas online). Esto es la ficha permanente de CADA TIPO de curso:
 * qué es, cuánto cuesta, cuánto dura, si lo pide la ley y dónde se saca.
 *
 * Por qué así y no en base de datos: la ficha de "carretillero" es la misma hoy
 * que dentro de un año, no depende de ninguna convocatoria. Guardarla en código
 * la hace tipada, revisable en el diff y gratis de servir — el VPS va con un 85%
 * de CPU robada por el hipervisor y cada consulta que se evita cuenta. Mismo
 * patrón que lib/primeros-pasos.ts, que lleva así desde el principio.
 *
 * ⚠️ REGLA QUE NO SE SALTA: cada dato de precio, duración o normativa lleva su
 * fuente en `fuentes`. Si no se ha podido verificar, no se publica. La regla del
 * proyecto es "no inventes cifras", y aquí es especialmente delicado: decirle a
 * alguien que un curso es obligatorio cuando no lo es, o al revés, le puede
 * costar un puesto de trabajo.
 */

/** Mismo enum que JobListing.sector, para poder cruzar cursos con ofertas. */
export type SectorCurso =
  | "HOSTELERIA" | "INDUSTRIA" | "OFICINA" | "COMERCIO" | "SALUD"
  | "EDUCACION" | "TECNOLOGIA" | "CONSTRUCCION" | "TRANSPORTE" | "OTRO";

export const NOMBRE_SECTOR: Record<SectorCurso, string> = {
  HOSTELERIA: "Hostelería",
  INDUSTRIA: "Industria y almacén",
  OFICINA: "Oficina y administración",
  COMERCIO: "Comercio y ventas",
  SALUD: "Salud y cuidados",
  EDUCACION: "Educación",
  TECNOLOGIA: "Tecnología",
  CONSTRUCCION: "Construcción",
  TRANSPORTE: "Transporte y logística",
  OTRO: "Otros",
};

export interface Fuente {
  titulo: string;
  url: string;
}

/** Sitio donde se puede hacer gratis o muy barato. */
export interface OpcionGratuita {
  nombre: string;
  url: string;
  descripcion: string;
  /** Si al terminar dan un certificado que sirve para enseñar a una empresa. */
  certificado: boolean;
}

export interface TipoCurso {
  slug: string;
  pais: string;
  sector: SectorCurso;
  /** obligatorio = sin esto no te contratan. mejora = te hace mejor candidato. */
  familia: "obligatorio" | "mejora";
  nombre: string;
  /** Una sola frase. Es lo que se lee en la tarjeta del listado. */
  resumen: string;
  queEs: string;
  paraQueSirve: string;
  obligatorioLegal: boolean;
  normativa?: string;
  duracionHoras: { min: number; max: number };
  precio: { min: number; max: number; moneda: string; nota?: string };
  /** Años hasta tener que renovarlo, si aplica. */
  validezAnios?: number;
  notaValidez?: string;
  /** Puestos que lo piden. Se cruzan con las ofertas de empleo. */
  puestos: string[];
  opcionesGratuitas: OpcionGratuita[];
  /** Pasos concretos, en orden. */
  comoSacarlo: string[];
  /**
   * Papeles que pide ESTE curso además de los de siempre (DNI, demanda de
   * empleo, CV). Se listan aparte porque es lo primero con lo que la gente se
   * atasca: llegan a la matrícula y les falta algo que tardan días en pedir.
   */
  documentosExtra?: string[];
  /** Cómo se llama lo equivalente en otros países (para quien emigra). */
  equivalenteEn?: { pais: string; nombre: string; nota: string }[];
  fuentes: Fuente[];
  /** Mes de la última revisión, formato YYYY-MM. */
  actualizado: string;
}

// ─── Opciones gratuitas que se repiten en varios cursos ─────────────────────

const SEPE_PRESENCIAL: OpcionGratuita = {
  nombre: "Tu servicio de empleo autonómico",
  url: "https://www.sepe.es/HomeSepe/Personas/formacion/catalogo-especialidades-formativas",
  descripcion:
    "Si estás apuntado al paro, tu comunidad autónoma da estos cursos gratis. Hay que estar inscrito como demandante de empleo y esperar a que salga convocatoria en tu zona.",
  certificado: true,
};

// ─── Catálogo ────────────────────────────────────────────────────────────────

export const TIPOS_CURSO: TipoCurso[] = [

  // ══════════════════ HOSTELERÍA ══════════════════

  {
    slug: "manipulador-alimentos",
    pais: "ES",
    sector: "HOSTELERIA",
    familia: "obligatorio",
    nombre: "Manipulador de alimentos",
    resumen: "Obligatorio para trabajar con comida. Se saca en una tarde y puede salir gratis.",
    queEs:
      "Es la formación en higiene alimentaria que la ley exige a cualquier persona que toque comida en su trabajo. No es un título largo: son entre 4 y 10 horas, casi siempre online, y se termina en un día.",
    paraQueSirve:
      "Sin él no te pueden contratar en cocina, sala, obrador, supermercado ni almacén de alimentación. Es lo primero que te van a pedir, y muchas veces lo piden ya en la entrevista.",
    obligatorioLegal: true,
    normativa: "Reglamento (CE) 852/2004 y Real Decreto 109/2010",
    duracionHoras: { min: 4, max: 10 },
    precio: { min: 0, max: 30, moneda: "EUR", nota: "Gratis por tu servicio de empleo autonómico; entre 10 y 30 € en academias privadas online." },
    notaValidez:
      "La ley no le pone fecha de caducidad, pero exige que la formación esté al día. En la práctica, muchas empresas y auditorías sanitarias piden renovarlo cada 2-4 años.",
    puestos: ["camarero", "cocinero", "ayudante de cocina", "reponedor", "dependiente de charcutería", "personal de obrador", "office"],
    opcionesGratuitas: [SEPE_PRESENCIAL],
    comoSacarlo: [
      "Mira primero si tu servicio de empleo autonómico lo tiene gratis — está en el catálogo del SEPE.",
      "Si no hay convocatoria y lo necesitas ya, en academias online cuesta entre 10 y 30 € y se hace el mismo día.",
      "Comprueba que el certificado cite el RD 109/2010. Es lo que mira la empresa.",
      "Guárdalo en PDF: te lo van a pedir en cada trabajo nuevo.",
    ],
    equivalenteEn: [
      { pais: "DE", nombre: "Belehrung nach §43 IfSG", nota: "Se hace en el Gesundheitsamt (oficina de sanidad). El español NO vale." },
      { pais: "UK", nombre: "Food Hygiene Certificate Level 2", nota: "Online, lo aceptan casi todos los empleadores." },
      { pais: "FR", nombre: "Formation HACCP", nota: "Obligatoria para restauración comercial." },
    ],
    fuentes: [
      { titulo: "Reglamento (CE) 852/2004 sobre higiene de los productos alimenticios", url: "https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX%3A32004R0852" },
      { titulo: "Real Decreto 109/2010", url: "https://www.boe.es/buscar/doc.php?id=BOE-A-2010-3032" },
      { titulo: "Catálogo de especialidades formativas del SEPE", url: "https://www.sepe.es/HomeSepe/Personas/formacion/catalogo-especialidades-formativas" },
    ],
    actualizado: "2026-08",
  },

  {
    slug: "barista",
    pais: "ES",
    sector: "HOSTELERIA",
    familia: "mejora",
    nombre: "Barista",
    resumen: "Café de especialidad. Te separa del resto en cafeterías y hoteles buenos.",
    queEs:
      "Formación en preparación de café: molienda, extracción del espresso, texturizado de la leche y latte art. Suele ser presencial porque hace falta practicar con la máquina.",
    paraQueSirve:
      "Las cafeterías de especialidad y los hoteles pagan más por alguien que sabe sacar un café en condiciones. Es de las cosas que más rápido diferencian un currículum de camarero.",
    obligatorioLegal: false,
    duracionHoras: { min: 8, max: 40 },
    precio: { min: 0, max: 400, moneda: "EUR", nota: "Muy variable: gratis si sale en tu servicio de empleo, entre 100 y 400 € en escuelas privadas según las horas." },
    puestos: ["camarero", "barista", "ayudante de barra", "encargado de cafetería"],
    opcionesGratuitas: [SEPE_PRESENCIAL],
    comoSacarlo: [
      "Busca convocatoria en tu servicio de empleo autonómico: sale con cierta frecuencia dentro de hostelería.",
      "Si vas por lo privado, elige uno con prácticas reales en máquina. Un barista no se aprende viendo vídeos.",
      "Mira si el centro sigue el estándar de la SCA (Specialty Coffee Association): es el que reconocen fuera de España.",
    ],
    fuentes: [
      { titulo: "Specialty Coffee Association — programas de formación", url: "https://sca.coffee/education" },
      { titulo: "Catálogo de especialidades formativas del SEPE", url: "https://www.sepe.es/HomeSepe/Personas/formacion/catalogo-especialidades-formativas" },
    ],
    actualizado: "2026-08",
  },

  {
    slug: "ingles-hosteleria",
    pais: "ES",
    sector: "HOSTELERIA",
    familia: "mejora",
    nombre: "Inglés para hostelería",
    resumen: "En zona turística, sin inglés te quedas fuera de los sitios que mejor pagan.",
    queEs:
      "Inglés centrado en lo que de verdad usas en sala o recepción: tomar comanda, explicar la carta, alergias, quejas, cobrar. No es un curso de gramática.",
    paraQueSirve:
      "En costa, islas y hoteles de ciudad, el inglés decide quién entra y quién no. También es el primer filtro si te planteas trabajar fuera.",
    obligatorioLegal: false,
    duracionHoras: { min: 30, max: 200 },
    precio: { min: 0, max: 300, moneda: "EUR", nota: "Hay bastante oferta gratuita: los servicios autonómicos programan muchos cursos de idiomas." },
    puestos: ["camarero", "recepcionista", "jefe de rango", "personal de sala", "animador turístico"],
    opcionesGratuitas: [
      SEPE_PRESENCIAL,
      {
        nombre: "Lanbide (Euskadi)",
        url: "https://web.lanbide.eus/apps/FR_BUSQUEDA_CURSOS?LG=C&ML=FORMEN1",
        descripcion: "Es el servicio autonómico con más oferta de idiomas: 178 cursos de inglés en catálogo cuando se revisó esto.",
        certificado: true,
      },
    ],
    comoSacarlo: [
      "Mira el catálogo de tu servicio autonómico: los idiomas son de lo que más se programa.",
      "Si puedes, elige uno que acabe en certificado de nivel (A2, B1...). Es lo que se pone en el currículum.",
      "Para hostelería concreta, busca 'inglés profesional para turismo' en el catálogo del SEPE.",
    ],
    fuentes: [
      { titulo: "Buscador de cursos de Lanbide", url: "https://web.lanbide.eus/apps/FR_BUSQUEDA_CURSOS?LG=C&ML=FORMEN1" },
      { titulo: "Catálogo de especialidades formativas del SEPE", url: "https://www.sepe.es/HomeSepe/Personas/formacion/catalogo-especialidades-formativas" },
    ],
    actualizado: "2026-08",
  },

  // ══════════════════ INDUSTRIA Y ALMACÉN ══════════════════

  {
    slug: "carretillero",
    pais: "ES",
    sector: "INDUSTRIA",
    familia: "obligatorio",
    nombre: "Carné de carretillero",
    resumen: "El más pedido en almacén y logística. Hay bastantes plazas gratis.",
    queEs:
      "Formación para manejar carretillas elevadoras. Tiene una parte teórica y otra práctica con la máquina, y acaba en un certificado según la norma UNE 58451.",
    paraQueSirve:
      "Es el requisito que más se repite en las ofertas de almacén, logística y fábrica. Con él entras a puestos que sin él ni te miran, y suelen estar mejor pagados.",
    obligatorioLegal: true,
    normativa: "UNE 58451 y Real Decreto 1215/1997",
    duracionHoras: { min: 12, max: 20 },
    precio: { min: 0, max: 300, moneda: "EUR", nota: "Gratis por tu servicio de empleo autonómico. En academias privadas, entre 150 y 300 € según categoría de máquina." },
    validezAnios: 5,
    notaValidez:
      "La UNE 58451 recomienda reciclarlo cada 5 años. No es un plazo legal fijo, pero es el criterio que siguen las empresas y las auditorías.",
    puestos: ["carretillero", "mozo de almacén", "operario de logística", "preparador de pedidos", "operario de fábrica"],
    opcionesGratuitas: [
      SEPE_PRESENCIAL,
      {
        nombre: "Lanbide (Euskadi)",
        url: "https://web.lanbide.eus/apps/FR_BUSQUEDA_CURSOS?LG=C&ML=FORMEN1",
        descripcion: "Es donde más plazas gratuitas hay: 36 cursos de carretilla y plataforma elevadora en catálogo cuando se revisó esto.",
        certificado: true,
      },
    ],
    comoSacarlo: [
      "Apúntate como demandante de empleo y mira el catálogo de tu comunidad: sale con bastante frecuencia y es gratis.",
      "Fíjate en la categoría de máquina: no es lo mismo la frontal que la retráctil o la de gran tonelaje. Mira qué pide la oferta a la que quieres apuntarte.",
      "Si lo pagas, comprueba que el certificado cite la UNE 58451. Sin esa referencia, muchas empresas no lo aceptan.",
      "Apúntate la fecha: a los 5 años toca reciclarlo.",
    ],
    documentosExtra: [
      "Certificado médico o declaración de aptitud — algunos centros lo piden porque hay parte práctica con máquina",
    ],
    equivalenteEn: [
      { pais: "DE", nombre: "Staplerschein", nota: "Formación según DGUV Grundsatz 308-001. El español no se convalida automáticamente." },
      { pais: "UK", nombre: "Forklift licence (RTITB o ITSSAR)", nota: "Se pide la acreditación de uno de esos organismos." },
      { pais: "FR", nombre: "CACES R489", nota: "Obligatorio y con categorías propias por tipo de máquina." },
    ],
    fuentes: [
      { titulo: "Norma UNE 58451 (AENOR)", url: "https://www.une.org/encuentra-tu-norma/busca-tu-norma/norma?c=N0055655" },
      { titulo: "Real Decreto 1215/1997 sobre equipos de trabajo", url: "https://www.boe.es/buscar/act.php?id=BOE-A-1997-17824" },
      { titulo: "Buscador de cursos de Lanbide", url: "https://web.lanbide.eus/apps/FR_BUSQUEDA_CURSOS?LG=C&ML=FORMEN1" },
    ],
    actualizado: "2026-08",
  },

  {
    slug: "plataforma-elevadora",
    pais: "ES",
    sector: "INDUSTRIA",
    familia: "obligatorio",
    nombre: "Operador de plataforma elevadora (PEMP)",
    resumen: "Para trabajar en altura con plataforma. Va muy de la mano del carretillero.",
    queEs:
      "Formación para manejar plataformas elevadoras móviles de personal: las de tijera y las de brazo articulado. Acaba en certificado según la norma UNE 58923.",
    paraQueSirve:
      "Lo piden en mantenimiento industrial, montaje, obra y logística. Mucha gente lo saca junto con el de carretillero porque las ofertas suelen pedir los dos.",
    obligatorioLegal: true,
    normativa: "UNE 58923 y Real Decreto 1215/1997",
    duracionHoras: { min: 8, max: 20 },
    precio: { min: 0, max: 300, moneda: "EUR", nota: "Gratis por servicio autonómico; en privado, en una horquilla parecida a la del carretillero." },
    validezAnios: 5,
    notaValidez: "Mismo criterio que el carretillero: reciclaje recomendado a los 5 años.",
    puestos: ["operario de mantenimiento", "montador", "electricista industrial", "mozo de almacén", "operario de obra"],
    opcionesGratuitas: [SEPE_PRESENCIAL],
    comoSacarlo: [
      "Búscalo en el catálogo de tu comunidad; a veces aparece como 'operador de PEMP' o por el tipo de máquina (3A, 3B).",
      "Distingue los tipos: 1A y 1B son las de desplazamiento con la cesta bajada; 3A y 3B, las que se mueven desde la cesta. Mira cuál pide la oferta.",
      "Si puedes, sácalo a la vez que el de carretillero: muchos centros hacen los dos juntos y sale más barato.",
    ],
    fuentes: [
      { titulo: "Norma UNE 58923 (AENOR)", url: "https://www.une.org/encuentra-tu-norma/busca-tu-norma/norma?c=N0052623" },
      { titulo: "Real Decreto 1215/1997 sobre equipos de trabajo", url: "https://www.boe.es/buscar/act.php?id=BOE-A-1997-17824" },
    ],
    actualizado: "2026-08",
  },

  {
    slug: "prl-basico",
    pais: "ES",
    sector: "INDUSTRIA",
    familia: "obligatorio",
    nombre: "Prevención de riesgos laborales (nivel básico)",
    resumen: "La base de seguridad que piden en industria, almacén y obra.",
    queEs:
      "Formación en seguridad y salud en el trabajo. El nivel básico son 60 horas y cubre los riesgos generales y las medidas preventivas de tu puesto.",
    paraQueSirve:
      "Es requisito en industria, almacén, limpieza industrial y obra. En construcción va ligado a la Tarjeta Profesional de la Construcción, y ahí lo exige el convenio.",
    obligatorioLegal: true,
    normativa: "Ley 31/1995 de Prevención de Riesgos Laborales y Real Decreto 39/1997",
    duracionHoras: { min: 30, max: 60 },
    precio: { min: 0, max: 250, moneda: "EUR", nota: "Muy habitual gratis por servicio autonómico. La empresa también está obligada a formarte cuando te contrata." },
    puestos: ["operario de fábrica", "mozo de almacén", "peón de obra", "personal de limpieza industrial", "recurso preventivo"],
    opcionesGratuitas: [
      SEPE_PRESENCIAL,
      {
        nombre: "Lanbide (Euskadi)",
        url: "https://web.lanbide.eus/apps/FR_BUSQUEDA_CURSOS?LG=C&ML=FORMEN1",
        descripcion: "54 cursos de PRL en catálogo cuando se revisó esto, muchos específicos por oficio.",
        certificado: true,
      },
    ],
    comoSacarlo: [
      "Antes de pagarlo: si ya estás trabajando, la formación en prevención te la debe dar la empresa. Es obligación suya, no tuya.",
      "Si estás en paro, búscalo en el catálogo de tu comunidad. Es de lo que más se programa.",
      "Mira si necesitas el genérico o uno de tu oficio: hay versiones específicas por sector que valen más en el currículum.",
      "Para trabajar en obra, esto es solo una parte: necesitas además la TPC.",
    ],
    fuentes: [
      { titulo: "Ley 31/1995 de Prevención de Riesgos Laborales", url: "https://www.boe.es/buscar/act.php?id=BOE-A-1995-24292" },
      { titulo: "Real Decreto 39/1997, Reglamento de los Servicios de Prevención", url: "https://www.boe.es/buscar/act.php?id=BOE-A-1997-1853" },
      { titulo: "Instituto Nacional de Seguridad y Salud en el Trabajo", url: "https://www.insst.es/" },
    ],
    actualizado: "2026-08",
  },

  // ══════════════════ CONSTRUCCIÓN ══════════════════

  {
    slug: "tpc-construccion",
    pais: "ES",
    sector: "CONSTRUCCION",
    familia: "obligatorio",
    nombre: "Tarjeta Profesional de la Construcción (TPC)",
    resumen: "Sin ella no te dejan pisar una obra. La gestiona la Fundación Laboral.",
    queEs:
      "Es el carné que acredita tu formación en prevención de riesgos, tu categoría profesional y tu experiencia en el sector. La emite la Fundación Laboral de la Construcción.",
    paraQueSirve:
      "Es lo que te piden al entrar a una obra. Sin ella no puedes trabajar, y la controlan tanto la constructora como la inspección.",
    obligatorioLegal: true,
    normativa: "Convenio General del Sector de la Construcción",
    duracionHoras: { min: 20, max: 60 },
    precio: { min: 0, max: 250, moneda: "EUR", nota: "La formación suele darla gratis la Fundación Laboral de la Construcción a trabajadores del sector." },
    notaValidez: "La tarjeta se renueva de forma periódica. Consulta el plazo vigente en la Fundación Laboral.",
    puestos: ["peón de obra", "albañil", "encofrador", "ferrallista", "electricista de obra", "fontanero", "pintor"],
    opcionesGratuitas: [
      {
        nombre: "Fundación Laboral de la Construcción",
        url: "https://www.fundacionlaboral.org/",
        descripcion: "Es el organismo que gestiona la TPC y da la formación. Para trabajadores del sector suele ser gratuita.",
        certificado: true,
      },
      SEPE_PRESENCIAL,
    ],
    comoSacarlo: [
      "Necesitas acreditar al menos 30 días trabajados en el sector en los últimos cinco años.",
      "Haz la formación en prevención que te corresponda: las horas cambian según tu oficio y tu puesto.",
      "Solicita la tarjeta en la Fundación Laboral de la Construcción con la formación y la vida laboral.",
      "Consulta siempre en la Fundación qué formación exacta te toca: depende del convenio y del oficio.",
    ],
    documentosExtra: [
      "Informe de vida laboral — hay que acreditar 30 días trabajados en el sector en los últimos 5 años. Se pide gratis en la Seguridad Social y tarda un rato en llegar: pídelo antes de nada.",
      "Certificado de la formación en prevención que hayas hecho",
    ],
    equivalenteEn: [
      { pais: "UK", nombre: "CSCS Card", nota: "Se pide en casi todas las obras. Hay que pasar un test de salud y seguridad." },
      { pais: "DE", nombre: "SCC / Sicherheitsunterweisung", nota: "Formación en seguridad exigida por la mayoría de contratistas." },
      { pais: "FR", nombre: "Carte BTP", nota: "Obligatoria para trabajar en obra." },
    ],
    fuentes: [
      { titulo: "Fundación Laboral de la Construcción — TPC", url: "https://www.fundacionlaboral.org/" },
      { titulo: "Ley 31/1995 de Prevención de Riesgos Laborales", url: "https://www.boe.es/buscar/act.php?id=BOE-A-1995-24292" },
    ],
    actualizado: "2026-08",
  },

  // ─── Salud y cuidados ─────────────────────────────────────────────────────
  //
  // Este sector faltaba entero, y es donde está buena parte de nuestra gente.
  // Con un dato que importa: aquí la cualificación NO es un "te viene bien", es
  // requisito para poder trabajar. Y mucha gente lleva años cuidando sin saber
  // que puede acreditar esa experiencia sin volver a estudiar.
  {
    slug: "atencion-sociosanitaria-instituciones",
    pais: "ES",
    sector: "SALUD",
    familia: "obligatorio",
    nombre: "Atención sociosanitaria en residencias (SSCS0208)",
    resumen: "Sin esto no puedes trabajar de gerocultor en una residencia o centro de día.",
    queEs:
      "Certificado de profesionalidad oficial de 450 horas. Acredita que sabes atender a personas dependientes en residencias, centros de día y centros sociosanitarios: higiene, alimentación, movilizaciones y apoyo psicosocial.",
    paraQueSirve:
      "Es la titulación que la administración exige para trabajar como cuidador o gerocultor en centros acreditados. Sin ella o una equivalente, el centro no te puede contratar en esa categoría.",
    obligatorioLegal: true,
    normativa: "Orden PSO/52/2018 y Acuerdo del Consejo Territorial (BOE-A-2015-12394)",
    duracionHoras: { min: 450, max: 450 },
    precio: { min: 0, max: 1500, moneda: "EUR", nota: "Gratis si sale convocatoria en tu comunidad. En centro privado suele ir de 600 a 1.500 euros, y hay que hacer prácticas presenciales." },
    puestos: ["gerocultor", "cuidador de residencia", "auxiliar de geriatría", "auxiliar sociosanitario"],
    opcionesGratuitas: [SEPE_PRESENCIAL],
    comoSacarlo: [
      "ANTES DE PAGAR NADA: si ya llevas años cuidando, mira la habilitación excepcional. La Orden PSO/52/2018 permite acreditar la experiencia sin sacarte el certificado, y hay gente que ha pagado un curso que no necesitaba.",
      "Si no tienes experiencia previa, apúntate como demandante de empleo y vigila el catálogo de tu comunidad: es de los certificados que más se programan.",
      "Comprueba que el centro esté acreditado para impartirlo. Un curso que no sea certificado de profesionalidad oficial no te sirve para esto.",
      "Cuenta con las prácticas: son obligatorias y presenciales, en un centro real.",
    ],
    documentosExtra: [
      "Título de ESO o equivalente, o prueba de acceso (es formación de nivel 2)",
      "Certificado de delitos de naturaleza sexual, que te van a pedir para trabajar con personas vulnerables",
    ],
    equivalenteEn: [
      { pais: "DE", nombre: "Altenpflegehelfer", nota: "Auxiliar de geriatría, normalmente un año de formación. Piden nivel de alemán B1 o B2, que en la práctica es el filtro de verdad." },
      { pais: "GB", nombre: "Care Certificate", nota: "No es un título como el español: son 15 estándares que te forma el propio empleador al entrar. Se empieza antes, pero acredita menos." },
      { pais: "FR", nombre: "Titre professionnel ADVF", nota: "Assistant de vie aux familles. Es el equivalente para trabajo en domicilio y se gestiona por France Travail." },
    ],
    fuentes: [
      { titulo: "Ficha oficial SEPE del certificado SSCS0208", url: "https://www.sepe.es/SiteSepe/contenidos/personas/formacion/certificados_de_profesionalidad/pdf/fichasCertificados/SSCS0208_ficha.pdf" },
      { titulo: "Orden PSO/52/2018 — cualificaciones del personal de atención directa", url: "https://www.boe.es/buscar/doc.php?id=BOE-A-2018-11138" },
      { titulo: "Acuerdo del Consejo Territorial de Dependencia (BOE-A-2015-12394)", url: "https://www.boe.es/diario_boe/txt.php?id=BOE-A-2015-12394" },
    ],
    actualizado: "2026-08",
  },
  {
    slug: "atencion-sociosanitaria-domicilio",
    pais: "ES",
    sector: "SALUD",
    familia: "obligatorio",
    nombre: "Atención sociosanitaria a domicilio (SSCS0108)",
    resumen: "El que piden para trabajar de auxiliar de ayuda a domicilio.",
    queEs:
      "Certificado de profesionalidad oficial de 600 horas. Es el hermano del de residencias, pero para atender a la persona en su propia casa: higiene, alimentación, apoyo psicosocial y gestión del hogar.",
    paraQueSirve:
      "Es la titulación exigida para la categoría de auxiliar de ayuda a domicilio en los servicios acreditados. Las empresas que llevan el servicio municipal de ayuda a domicilio lo piden siempre.",
    obligatorioLegal: true,
    normativa: "Orden PSO/52/2018 y Acuerdo del Consejo Territorial (BOE-A-2015-12394)",
    duracionHoras: { min: 600, max: 600 },
    precio: { min: 0, max: 1800, moneda: "EUR", nota: "Gratis por convocatoria autonómica. Es más largo que el de residencias, así que en privado sale más caro." },
    puestos: ["auxiliar de ayuda a domicilio", "cuidador a domicilio", "asistente personal"],
    opcionesGratuitas: [SEPE_PRESENCIAL],
    comoSacarlo: [
      "Igual que en el de residencias: si ya tienes años de experiencia cuidando, mira primero la habilitación excepcional antes de pagar un curso.",
      "Decide cuál te conviene: este es para domicilio y el SSCS0208 para residencias. No son intercambiables aunque se parezcan.",
      "Busca convocatoria en tu comunidad estando apuntado al paro.",
      "Reserva tiempo para las prácticas presenciales.",
    ],
    documentosExtra: [
      "Título de ESO o equivalente, o prueba de acceso",
      "Certificado de delitos de naturaleza sexual",
      "Carnet de conducir en muchas ofertas: en domicilio te mueves entre casas",
    ],
    fuentes: [
      { titulo: "Ficha oficial SEPE del certificado SSCS0108", url: "https://www.sepe.es/HomeSepe/dam/jcr:ef00e05b-1e2c-4c1f-8dbb-71c61584f558/SSCS0108_ficha.pdf" },
      { titulo: "Orden PSO/52/2018 — cualificaciones del personal de atención directa", url: "https://www.boe.es/buscar/doc.php?id=BOE-A-2018-11138" },
    ],
    actualizado: "2026-08",
  },

  // ─── Limpieza ─────────────────────────────────────────────────────────────
  {
    slug: "limpieza-industrial",
    pais: "ES",
    sector: "OTRO",
    familia: "mejora",
    nombre: "Limpieza industrial y de espacios abiertos (SEAG0209)",
    resumen: "Certificado oficial que se paga mejor que la limpieza corriente.",
    queEs:
      "Certificado de profesionalidad de 210 horas sobre limpieza de instalaciones industriales, maquinaria y espacios abiertos, incluido el manejo seguro de productos químicos.",
    paraQueSirve:
      "La limpieza industrial se paga mejor que la de oficinas y pide formación específica por los riesgos químicos. Tenerlo te separa del montón en un sector con muchísima rotación.",
    obligatorioLegal: false,
    duracionHoras: { min: 210, max: 210 },
    precio: { min: 0, max: 700, moneda: "EUR", nota: "Se programa gratis con frecuencia en los catálogos autonómicos." },
    puestos: ["limpiador industrial", "peón de limpieza", "operario de limpieza viaria", "limpieza hospitalaria"],
    opcionesGratuitas: [SEPE_PRESENCIAL],
    comoSacarlo: [
      "Búscalo en el catálogo de tu comunidad estando inscrito como demandante de empleo.",
      "Si vas a limpieza hospitalaria, pregunta por la parte de residuos sanitarios: es lo que más valoran ahí.",
      "Combínalo con el PRL básico. Juntos son la pareja que piden las contratas grandes.",
    ],
    fuentes: [
      { titulo: "Ficha oficial SEPE del certificado SEAG0209", url: "https://sepe.es/HomeSepe/dam/jcr:ba4004f0-3e3e-4cd7-927e-ca2922e3cd04/SEAG0209_ficha.pdf" },
    ],
    actualizado: "2026-08",
  },

  // ─── Oficina, comercio y digital ──────────────────────────────────────────
  //
  // Estos tres no los exige nadie y se pueden empezar hoy mismo, gratis y sin
  // esperar convocatoria. Están aquí porque son la vía de salida de quien
  // quiere dejar de estar doce horas de pie.
  {
    slug: "excel-ofimatica",
    pais: "ES",
    sector: "OFICINA",
    familia: "mejora",
    nombre: "Excel y ofimática",
    resumen: "El filtro número uno de cualquier trabajo de oficina. Gratis y desde casa.",
    queEs:
      "Manejo de hojas de cálculo, procesador de textos y correo profesional. No hay un título oficial único: lo que cuenta es que sepas hacerlo y puedas demostrarlo.",
    paraQueSirve:
      "Es el requisito que más se repite en las ofertas de administración, atención al cliente y comercio. También es lo que permite pasar del almacén a la oficina del almacén.",
    obligatorioLegal: false,
    duracionHoras: { min: 10, max: 60 },
    precio: { min: 0, max: 0, moneda: "EUR", nota: "Hay versiones gratuitas completas y en español. No hace falta pagar por esto." },
    puestos: ["administrativo", "auxiliar administrativo", "recepcionista", "atención al cliente", "controlador de almacén"],
    opcionesGratuitas: [
      {
        nombre: "Santander Open Academy",
        url: "https://app.santanderopenacademy.com/program/search",
        descripcion: "Más de mil cursos gratis, ofimática incluida. Abierto a cualquiera: no hay que ser cliente del banco.",
        certificado: false,
      },
      {
        nombre: "Google — competencias digitales",
        url: "https://grow.google/intl/es/courses-and-tools/?category=career&type=online-courses",
        descripcion: "Cursos gratis de productividad y competencias digitales, en español.",
        certificado: false,
      },
    ],
    comoSacarlo: [
      "Empieza por lo que de verdad piden: tablas dinámicas, BUSCARV y filtros. Con eso pasas la mayoría de las pruebas.",
      "Haz el curso gratis y, en paralelo, monta un archivo de ejemplo tuyo. En la entrevista, enseñar algo hecho vale más que decir que sabes.",
      "Ponlo en el CV por lo que sabes hacer, no por el nombre del curso.",
    ],
    fuentes: [
      { titulo: "Santander Open Academy — catálogo de cursos", url: "https://app.santanderopenacademy.com/program/search" },
      { titulo: "Grow with Google — cursos gratuitos en español", url: "https://grow.google/intl/es/courses-and-tools/?category=career&type=online-courses" },
    ],
    actualizado: "2026-08",
  },
  {
    slug: "competencias-digitales",
    pais: "ES",
    sector: "TECNOLOGIA",
    familia: "mejora",
    nombre: "Competencias digitales y marketing",
    resumen: "La puerta más barata para cambiar de sector. Gratis y en español.",
    queEs:
      "Formación en lo digital básico y en marketing online: cómo funciona una web, redes para empresas, comercio electrónico, analítica y seguridad.",
    paraQueSirve:
      "Es el camino habitual de quien quiere salir de hostelería o almacén sin volver a estudiar años. También sirve para montar algo propio.",
    obligatorioLegal: false,
    duracionHoras: { min: 1, max: 40 },
    precio: { min: 0, max: 0, moneda: "EUR" },
    puestos: ["community manager", "auxiliar de marketing", "comercial online", "atención al cliente digital"],
    opcionesGratuitas: [
      {
        nombre: "Google — Actívate / Grow with Google",
        url: "https://grow.google/intl/es/courses-and-tools/?category=career&type=online-courses",
        descripcion: "29 cursos gratuitos en español: marketing digital, programación, nube, comercio electrónico y ciberseguridad.",
        certificado: false,
      },
      {
        nombre: "EU Academy",
        url: "https://academy.europa.eu/courses/",
        descripcion: "Plataforma de la Unión Europea, gratis y en más de 30 idiomas. Útil si estás fuera de España.",
        certificado: false,
      },
    ],
    comoSacarlo: [
      "Elige UNO y termínalo. El error clásico es apuntarse a seis y no acabar ninguno.",
      "Comprueba en el propio curso qué acredita: Google reorganizó Actívate y no todos dan ya el mismo certificado.",
      "Cuando lo acabes, pídele a Guzzi que te busque ofertas donde lo pidan.",
    ],
    fuentes: [
      { titulo: "Grow with Google — cursos gratuitos en español", url: "https://grow.google/intl/es/courses-and-tools/?category=career&type=online-courses" },
      { titulo: "EU Academy — plataforma oficial de la Unión Europea", url: "https://academy.europa.eu/" },
    ],
    actualizado: "2026-08",
  },
  {
    slug: "atencion-cliente",
    pais: "ES",
    sector: "COMERCIO",
    familia: "mejora",
    nombre: "Atención al cliente y venta",
    resumen: "Convierte la experiencia de cara al público en algo que se puede poner en el CV.",
    queEs:
      "Técnicas de trato con el cliente, gestión de quejas, cobro y venta. Es formación corta y hay opciones gratuitas online.",
    paraQueSirve:
      "Si ya has trabajado de cara al público, esto le pone nombre a lo que sabes hacer. En comercio y en centros de llamadas es de lo más valorado, porque la rotación es enorme y buscan a quien aguante bien el trato difícil.",
    obligatorioLegal: false,
    duracionHoras: { min: 8, max: 60 },
    precio: { min: 0, max: 300, moneda: "EUR", nota: "Hay opciones gratuitas online, y los presenciales de las comunidades también salen gratis." },
    puestos: ["dependiente", "cajero", "teleoperador", "azafata de eventos", "recepcionista"],
    opcionesGratuitas: [
      SEPE_PRESENCIAL,
      {
        nombre: "Santander Open Academy",
        url: "https://app.santanderopenacademy.com/program/search",
        descripcion: "Cursos gratis de habilidades profesionales y comunicación, abiertos a cualquiera.",
        certificado: false,
      },
    ],
    comoSacarlo: [
      "Si vas a comercio de alimentación, sácate antes el manipulador de alimentos: ese sí es obligatorio.",
      "Haz el curso gratis y añade en el CV a cuántos clientes atendías al día. El número convence más que el título.",
    ],
    fuentes: [
      { titulo: "Catálogo de especialidades formativas del SEPE", url: "https://www.sepe.es/HomeSepe/Personas/formacion/catalogo-especialidades-formativas" },
      { titulo: "Santander Open Academy — catálogo de cursos", url: "https://app.santanderopenacademy.com/program/search" },
    ],
    actualizado: "2026-08",
  },
];

// ─── Funciones de consulta ───────────────────────────────────────────────────

export function tiposPorPais(pais = "ES"): TipoCurso[] {
  return TIPOS_CURSO.filter(t => t.pais === pais);
}

export function tipoPorSlug(slug: string, pais = "ES"): TipoCurso | undefined {
  return TIPOS_CURSO.find(t => t.slug === slug && t.pais === pais);
}

export function tiposPorSector(sector: SectorCurso, pais = "ES"): TipoCurso[] {
  return TIPOS_CURSO.filter(t => t.sector === sector && t.pais === pais);
}

/** Sectores que de verdad tienen cursos, para no pintar secciones vacías. */
export function sectoresConCursos(pais = "ES"): SectorCurso[] {
  const vistos = new Set<SectorCurso>();
  for (const t of TIPOS_CURSO) if (t.pais === pais) vistos.add(t.sector);
  return [...vistos];
}

/** Los obligatorios primero: son los que dejan a alguien sin trabajar. */
export function ordenarPorUrgencia(tipos: TipoCurso[]): TipoCurso[] {
  return [...tipos].sort((a, b) => {
    if (a.familia !== b.familia) return a.familia === "obligatorio" ? -1 : 1;
    return a.nombre.localeCompare(b.nombre, "es");
  });
}

/** Texto corto de precio para las tarjetas. */
/**
 * Cómo se paga el curso. Es lo primero que quiere saber cualquiera, antes
 * incluso de qué enseña: si cuesta dinero o no.
 *
 * Se deduce del precio en vez de guardarse a mano para que no puedan
 * contradecirse. Tres casos y ya:
 *
 *   gratis         · no cuesta nada nunca. Online, se empieza hoy.
 *   subvencionado  · gratis SI sale convocatoria en tu zona; si no, se paga.
 *                    Es el caso de casi todos los oficiales españoles, y por
 *                    eso importa decir las dos cifras y no solo "gratis": a
 *                    quien no le salga convocatoria le va a costar dinero.
 *   pago           · no hay via gratuita conocida.
 */
export type Financiacion = "gratis" | "subvencionado" | "pago";

export const NOMBRE_FINANCIACION: Record<Financiacion, string> = {
  gratis: "Gratis",
  subvencionado: "Subvencionado",
  pago: "De pago",
};

/** Explicación corta de qué significa cada grupo. Va bajo el filtro. */
export const EXPLICA_FINANCIACION: Record<Financiacion, string> = {
  gratis: "No cuesta nada. Online y puedes empezar hoy mismo.",
  subvencionado: "Gratis si sale convocatoria en tu zona. Si no, lo pagas tú.",
  pago: "No hemos encontrado forma de hacerlo gratis.",
};

export const COLOR_FINANCIACION: Record<Financiacion, string> = {
  gratis: "#22c55e",
  subvencionado: "#3b82f6",
  pago: "#f59e0b",
};

export function financiacionDe(t: TipoCurso): Financiacion {
  if (t.precio.max === 0) return "gratis";
  if (t.precio.min === 0) return "subvencionado";
  return "pago";
}

/**
 * El coste, dicho entero y sin trampa.
 *
 * precioResumido() dice "Gratis o hasta 1500 €", que en una tarjeta se lee como
 * "gratis" y se olvida el resto. Esto separa las dos mitades para poder
 * enseñarlas con distinto peso: lo que puede costarte no puede ir en letra
 * pequeña cuando hablamos de 1.500 euros.
 */
export function costeDetallado(t: TipoCurso): { etiqueta: string; detalle?: string } {
  const f = financiacionDe(t);
  if (f === "gratis") return { etiqueta: "Gratis" };
  if (f === "subvencionado") {
    return { etiqueta: "Gratis con plaza", detalle: `si no, hasta ${t.precio.max} €` };
  }
  return { etiqueta: `${t.precio.min}-${t.precio.max} €` };
}

export function precioResumido(t: TipoCurso): string {
  if (t.precio.min === 0 && t.precio.max === 0) return "Gratis";
  if (t.precio.min === 0) return `Gratis o hasta ${t.precio.max} €`;
  return `${t.precio.min}-${t.precio.max} €`;
}

/** Texto corto de duración para las tarjetas. */
export function duracionResumida(t: TipoCurso): string {
  const { min, max } = t.duracionHoras;
  return min === max ? `${min} h` : `${min}-${max} h`;
}
