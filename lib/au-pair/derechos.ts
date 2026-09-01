/**
 * lib/au-pair/derechos.ts — Lo que te corresponde como au pair, y cuándo lo
 * que te están pidiendo ya no es ser au pair.
 *
 * POR QUÉ ESTO ES LO MÁS IMPORTANTE DE TODA EL ÁREA.
 *
 * Una au pair es casi siempre una chica joven, muchas veces menor de 25, que se
 * va a vivir a casa de unos desconocidos, en otro país, sin hablar bien el
 * idioma y sin conocer a nadie. Es la persona más expuesta de toda la
 * aplicación. Y el abuso más común del sector no es la agresión: es el
 * deslizamiento. Empieza con "ayuda con los niños cinco horas" y acaba con
 * jornada completa, la casa entera y la responsabilidad sola de dos críos, por
 * 280 euros al mes.
 *
 * Eso tiene nombre legal, y lo cambia todo:
 *
 *   · Au pair             = intercambio cultural. Dinero de bolsillo.
 *   · Empleada de hogar   = TRABAJO. Salario mínimo, Seguridad Social, paro.
 *
 * En España la diferencia entre una cosa y la otra son 280 €/mes frente a
 * 1.221 €/mes, más sanidad, pensión y derecho al paro. Nadie se lo cuenta,
 * porque las agencias de au pair trabajan para las familias, no para ella.
 *
 * ⚠️ AQUÍ NO SE PUEDE FALLAR NI UN DATO, y hay un matiz que no se puede omitir:
 * el Acuerdo Europeo NO está en vigor en todas partes. Alemania, Bélgica,
 * Suiza y Grecia lo firmaron y nunca lo ratificaron; Luxemburgo lo denunció en
 * 2003. Decirle a alguien que se va a Múnich que tiene derecho a cinco horas
 * diarias "por el Acuerdo Europeo" sería mandarla a discutir con una ley que
 * allí no aplica. Por eso cada derecho lleva dónde vale.
 *
 * Fuentes, comprobadas el 2026-09-01:
 *   · Acuerdo Europeo sobre la Colocación Au Pair (BOE-A-1988-21042)
 *   · Estado de ratificaciones del Consejo de Europa (STE n.º 068)
 *   · Real Decreto 126/2026, salario mínimo para 2026 (BOE-A-2026-3815)
 *   · Real Decreto 1620/2011 y Ley 12/2022, empleados de hogar
 */

export interface FuenteDerecho {
  titulo: string;
  url: string;
}

/**
 * Países donde el Acuerdo Europeo está EN VIGOR. Fuera de esta lista, los
 * derechos de abajo no se pueden reclamar por el tratado: hay que mirar la
 * norma nacional.
 */
export const PAISES_CON_ACUERDO = [
  { codigo: "ES", nombre: "España", desde: "1988" },
  { codigo: "FR", nombre: "Francia", desde: "1971" },
  { codigo: "IT", nombre: "Italia", desde: "1973" },
  { codigo: "DK", nombre: "Dinamarca", desde: "1971" },
  { codigo: "NO", nombre: "Noruega", desde: "1971" },
  { codigo: "FI", nombre: "Finlandia", desde: "1997" },
  { codigo: "BG", nombre: "Bulgaria", desde: "2002" },
  { codigo: "MD", nombre: "Moldavia", desde: "2001" },
] as const;

/** Los que suenan a que aplica y NO aplica. Es lo que hay que avisar. */
export const PAISES_SIN_ACUERDO = [
  { codigo: "DE", nombre: "Alemania", motivo: "Lo firmó en 1976 y nunca lo ratificó. Tiene su propia regulación nacional, que es estricta y bastante protectora." },
  { codigo: "BE", nombre: "Bélgica", motivo: "Firmado en 1969, sin ratificar. Se rige por normativa nacional." },
  { codigo: "CH", nombre: "Suiza", motivo: "Firmado en 1970, sin ratificar. Cada cantón tiene sus reglas." },
  { codigo: "GR", nombre: "Grecia", motivo: "Firmado en 1979, sin ratificar." },
  { codigo: "LU", nombre: "Luxemburgo", motivo: "Lo ratificó en 1990 y lo DENUNCIÓ en 2003. Ya no aplica." },
  { codigo: "GB", nombre: "Reino Unido", motivo: "Nunca fue parte, y además tras el Brexit el visado específico de au pair desapareció." },
  { codigo: "NL", nombre: "Países Bajos", motivo: "No es parte. Se rige por el régimen nacional de intercambio cultural." },
  { codigo: "IE", nombre: "Irlanda", motivo: "No es parte. Ojo: los tribunales irlandeses han tratado a au pairs como empleadas con derecho a salario mínimo." },
  { codigo: "AT", nombre: "Austria", motivo: "No es parte. Allí la au pair se da de alta como trabajadora y cotiza." },
] as const;

export interface Derecho {
  articulo: string;
  titulo: string;
  texto: string;
  /** Lo que de verdad significa para ella, sin lenguaje jurídico. */
  enCristiano: string;
}

/** Del Acuerdo Europeo. Solo exigible en los ocho países de arriba. */
export const DERECHOS_ACUERDO: Derecho[] = [
  {
    articulo: "Artículo 9",
    titulo: "Cinco horas al día, no más",
    texto: "El tiempo dedicado a estos servicios no excederá, en general, de cinco horas diarias.",
    enCristiano:
      "Cinco horas. No ocho, no diez, no «lo que haga falta». Si te piden jornada completa, lo que te están pidiendo ya no es ser au pair.",
  },
  {
    articulo: "Artículo 8.3",
    titulo: "Un día libre entero por semana, y un domingo al mes",
    texto: "Dispondrá de al menos un día completo libre por semana, y al menos uno de los días libres de cada mes será domingo.",
    enCristiano:
      "Un día entero, no una tarde. Y al menos un domingo al mes, que es cuando la gente hace vida. Si nunca tienes un domingo libre, no se está cumpliendo.",
  },
  {
    articulo: "Artículo 6.1",
    titulo: "Contrato por escrito, antes de salir de tu país",
    texto: "Los derechos y obligaciones se recogerán en un acuerdo escrito, preferentemente antes de que la persona salga de su país de residencia y, como muy tarde, durante la primera semana.",
    enCristiano:
      "Si no hay papel, no vayas. Y si ya estás allí y a la semana no lo has firmado, eso es una señal de aviso, no un despiste. En el papel tiene que estar cuánto cobras, cuántas horas y qué días libras.",
  },
  {
    articulo: "Artículo 8.2",
    titulo: "Tiempo para estudiar el idioma",
    texto: "Dispondrá de tiempo suficiente para asistir a cursos de idiomas y para su perfeccionamiento cultural y profesional.",
    enCristiano:
      "El idioma es el motivo por el que existe la figura del au pair. Si los horarios nunca te dejan ir a clase, están incumpliendo lo esencial.",
  },
  {
    articulo: "Artículo 10.2",
    titulo: "El seguro lo paga la familia",
    texto: "Si la cobertura pública no es suficiente, el miembro responsable de la familia de acogida suscribirá un seguro privado, corriendo él con todo el gasto.",
    enCristiano:
      "No te lo tienen que descontar del dinero de bolsillo ni pagarlo tú. Es gasto de la familia.",
  },
  {
    articulo: "Artículo 8.4",
    titulo: "Dinero de bolsillo fijo y mensual",
    texto: "Recibirá mensualmente una cantidad fija en concepto de dinero de bolsillo, cuyo importe se fijará en el acuerdo escrito.",
    enCristiano:
      "Una cantidad fija, todos los meses, escrita en el contrato. No «según cómo vaya el mes» ni en función de las horas que hagas.",
  },
  {
    articulo: "Artículo 11.1",
    titulo: "Puedes irte avisando con dos semanas",
    texto: "Cuando el acuerdo sea por tiempo indefinido, cualquiera de las partes podrá ponerle fin con un preaviso de dos semanas.",
    enCristiano:
      "No estás atrapada. Si la cosa va mal, avisas con dos semanas y te vas. Y ellos también pueden, así que ten siempre a dónde ir y dinero para el billete de vuelta.",
  },
  {
    articulo: "Artículo 4.1",
    titulo: "Entre 17 y 30 años",
    texto: "No menos de diecisiete años ni más de treinta.",
    enCristiano:
      "Es la franja del tratado. Cada país aprieta más: Alemania corta a los 27, por ejemplo.",
  },
];

/**
 * Las señales de que aquello ya no es un intercambio cultural.
 *
 * Puestas en forma de lista para que se pueda leer con miedo en el cuerpo y a
 * las dos de la mañana, que es cuando se leen estas cosas.
 */
export const SENALES_DE_ALARMA: string[] = [
  "Haces más de cinco horas al día de forma habitual, no un día suelto.",
  "Eres tú sola la responsable de los niños durante la jornada, sin que haya un adulto de la familia al cargo.",
  "Te encargas de la limpieza general de la casa, no solo de lo de los niños.",
  "No tienes un día entero libre a la semana.",
  "No hay contrato escrito, o lo que hay no dice horas ni dinero.",
  "Te descuentan del dinero de bolsillo el seguro, el curso o la comida.",
  "Te han retenido el pasaporte. Esto no es una señal: es un delito. Sal de ahí y llama a la policía.",
  "Te impiden salir, o tienes que pedir permiso para hacerlo.",
];

/**
 * Lo que le corresponde si aquello es un trabajo y no un intercambio.
 * Cifras de España, año 2026, del BOE.
 */
export const SI_ES_TRABAJO = {
  regimen: "Empleada de hogar (relación laboral especial)",
  smiMensual: 1221,
  smiAnual: 17094,
  smiDiario: 40.7,
  precioHoraExternas: 9.55,
  /** Dinero de bolsillo típico de au pair en Europa, para comparar. */
  bolsilloAuPairTipico: 280,
  puntos: [
    "Alta obligatoria en la Seguridad Social desde la primera hora, sin importar cuántas hagas.",
    "Salario mínimo: 1.221 € al mes en catorce pagas, o 17.094 € al año.",
    "El alojamiento y la comida cuentan como salario en especie, pero no pueden pasar del 30 % ni bajarte el mínimo que cobras en dinero.",
    "Desde 2023 cotizas por desempleo y tienes derecho al paro (Ley 12/2022).",
    "Tienes derecho a indemnización si te despiden, y protección del FOGASA.",
  ],
  normas: [
    "Real Decreto 1620/2011, relación laboral especial del servicio del hogar familiar",
    "Ley 12/2022, que igualó derechos con el régimen general",
    "Real Decreto 126/2026, salario mínimo para 2026",
  ],
};

/**
 * REINO UNIDO: LA EXENCIÓN QUE DEJÓ DE EXISTIR Y CASI NADIE SABE.
 *
 * Desde 1999 había una excepción en la ley británica del salario mínimo: si
 * vivías en casa de tu empleador y te trataban «como uno más de la familia»,
 * podían no pagarte el mínimo. Se creó pensando en las au pairs y acabó
 * amparando a niñeras internas trabajando jornada completa por doscientas
 * libras al mes.
 *
 * Se ELIMINÓ el 1 de abril de 2024. Desde entonces, quien trabaja de interna
 * en el Reino Unido sin ser de la familia tiene derecho al salario mínimo
 * nacional como cualquier otro trabajador.
 *
 * Son veinticinco años de costumbre diciendo lo contrario de lo que dice la ley
 * hoy. Muchas familias no se han enterado, y muchas chicas tampoco.
 */
export const REINO_UNIDO_INTERNAS = {
  cambio: "La exención de salario mínimo para trabajadoras internas se eliminó el 1 de abril de 2024.",
  /** Libras por hora desde abril de 2026, gov.uk */
  salarioHora21: 12.71,
  salarioHora18a20: 10.85,
  /** Tope de lo que te pueden descontar por el alojamiento. */
  descuentoAlojamientoDia: 11.1,
  descuentoAlojamientoSemana: 77.7,
  puntos: [
    "Si trabajas de interna en el Reino Unido y no eres de la familia, te corresponde el salario mínimo nacional. Ya no hay excepción.",
    "Desde abril de 2026 son 12,71 £ la hora a partir de 21 años, y 10,85 £ entre 18 y 20.",
    "Te pueden descontar por el alojamiento, pero con tope: 11,10 £ al día, 77,70 £ a la semana. Ni una libra más.",
    "Si te descuentan más de ese tope, la diferencia sale de tu salario mínimo — y eso es incumplir la ley, no un acuerdo entre ustedes.",
  ],
  fuentes: [
    { titulo: "Tarifas del salario mínimo nacional — GOV.UK", url: "https://www.gov.uk/national-minimum-wage-rates" },
    { titulo: "Descuento por alojamiento — GOV.UK", url: "https://www.gov.uk/national-minimum-wage-accommodation" },
  ],
};

export const FUENTES: FuenteDerecho[] = [
  {
    titulo: "Acuerdo Europeo sobre la Colocación Au Pair — texto ratificado por España (BOE)",
    url: "https://www.boe.es/diario_boe/txt.php?id=BOE-A-1988-21042",
  },
  {
    titulo: "Anexo I del Acuerdo: cobertura sanitaria por país (BOE)",
    url: "https://www.boe.es/buscar/doc.php?id=BOE-A-1989-14726",
  },
  {
    titulo: "Real Decreto 126/2026 — salario mínimo para 2026 (BOE)",
    url: "https://www.boe.es/buscar/act.php?id=BOE-A-2026-3815",
  },
  {
    titulo: "Real Decreto 1620/2011 — empleados de hogar (BOE)",
    url: "https://www.boe.es/buscar/act.php?id=BOE-A-2011-17975",
  },
];

export const ACTUALIZADO = "2026-09";

/** ¿Vale el Acuerdo Europeo en este país? */
export function acuerdoAplicaEn(codigo: string): boolean {
  return PAISES_CON_ACUERDO.some(p => p.codigo === codigo.toUpperCase());
}

/** Cuánto se deja al año quien acepta dinero de bolsillo por un trabajo real. */
export function diferenciaAnual(): number {
  return SI_ES_TRABAJO.smiAnual - SI_ES_TRABAJO.bolsilloAuPairTipico * 12;
}
