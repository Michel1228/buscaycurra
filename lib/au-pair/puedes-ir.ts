/**
 * lib/au-pair/puedes-ir.ts — ¿Puedes ir de verdad a ese país?
 *
 * EL PROBLEMA QUE ARREGLA, Y ES NUESTRO.
 *
 * Medido en producción, las ofertas activas de au pair y live-in nanny de la
 * aplicación están encabezadas por:
 *
 *     Reino Unido  1.155
 *     Estados Unidos 648
 *     Canadá         411
 *     España         395
 *
 * Los tres primeros son países donde una persona española NO puede presentarse
 * a trabajar sin más. En el Reino Unido no existe visado de au pair desde enero
 * de 2021 y España no está en el Youth Mobility Scheme; en Estados Unidos la
 * única vía legal es el visado J-1 a través de una agencia designada por el
 * Departamento de Estado, no respondiendo a un anuncio.
 *
 * O sea que la mitad de lo que enseñamos lleva a un sitio al que no se puede
 * ir. Las ofertas son reales, no es un fallo de datos: el fallo es enseñarlas
 * sin decir lo que hace falta para aceptarlas. Alguien puede organizar su vida
 * —dejar el trabajo, comprar el billete— y descubrirlo al llegar. O peor:
 * quedarse allí sin papeles, en casa de un desconocido y sin poder denunciar
 * nada.
 *
 * Esto no oculta ofertas. Solo pone al lado lo que hace falta para poder
 * aceptarlas.
 *
 * ⚠️ Escrito desde el punto de vista de quien tiene nacionalidad española o de
 * la UE, que es la mayoría de nuestra gente. Para quien tenga otra
 * nacionalidad, la respuesta cambia y se dice que cambia.
 *
 * Comprobado el 2026-09-01 contra gov.uk, j1visa.state.gov y Your Europe.
 */

export type Dificultad = "libre" | "con_tramite" | "dificil";

export interface RealidadPais {
  codigo: string;
  nombre: string;
  bandera: string;
  dificultad: Dificultad;
  /** Una frase. Es lo que se lee en la tarjeta. */
  resumen: string;
  /** Lo que de verdad hay que hacer, en orden. */
  comoSePuede: string[];
  /** Lo que NO vale, aunque te lo ofrezcan. */
  cuidadoCon?: string;
  enlace?: { titulo: string; url: string };
}

export const ETIQUETA_DIFICULTAD: Record<Dificultad, string> = {
  libre: "Puedes ir",
  con_tramite: "Puedes, con trámite",
  dificil: "Complicado",
};

export const COLOR_DIFICULTAD: Record<Dificultad, string> = {
  libre: "#22c55e",
  con_tramite: "#f59e0b",
  dificil: "#ef4444",
};

export const REALIDAD_POR_PAIS: RealidadPais[] = [
  {
    codigo: "GB",
    nombre: "Reino Unido",
    bandera: "🇬🇧",
    dificultad: "dificil",
    resumen:
      "Es donde más ofertas hay, y donde menos fácil lo tienes. No existe visado de au pair desde el Brexit.",
    comoSePuede: [
      "El visado específico de au pair desapareció en enero de 2021. Ya no existe.",
      "El Youth Mobility Scheme, que sería la vía natural, NO incluye a España. Solo Australia, Canadá, Japón, Mónaco, Nueva Zelanda, Taiwán, Hong Kong y Corea del Sur.",
      "Queda el visado de trabajo cualificado, que exige que una empresa autorizada te patrocine. Una familia particular no puede hacerlo.",
      "O el visado de estudiante, que permite trabajar 20 horas semanales durante el curso.",
    ],
    cuidadoCon:
      "Si una familia británica te ofrece ir «como antes», sin papeles, te está proponiendo trabajar de forma irregular. Si sale mal no vas a poder reclamar nada, y quien se juega la expulsión eres tú, no ellos.",
    enlace: { titulo: "Comprobar si necesitas visado — GOV.UK", url: "https://www.gov.uk/check-uk-visa" },
  },
  {
    codigo: "US",
    nombre: "Estados Unidos",
    bandera: "🇺🇸",
    dificultad: "con_tramite",
    resumen:
      "Sí se puede, pero solo por una puerta: el visado J-1 con una agencia designada por el Departamento de Estado.",
    comoSePuede: [
      "El programa es real y sigue activo: visado J-1, doce meses, prorrogable.",
      "La única vía legal es a través de una agencia patrocinadora designada por el Departamento de Estado. No hay otra.",
      "La agencia se encarga del visado, del seguro y de la formación obligatoria, y es a quien reclamas si la familia incumple.",
      "Comprueba que la agencia está en la lista oficial ANTES de pagar nada.",
    ],
    cuidadoCon:
      "Cualquier familia o intermediario que te ofrezca ir de au pair a Estados Unidos SIN pasar por una agencia designada te está proponiendo algo ilegal, o es una estafa. Con un visado de turista no se puede trabajar.",
    enlace: {
      titulo: "Agencias designadas — Departamento de Estado",
      url: "https://j1visa.state.gov/participants/how-to-apply/sponsor-search/?program=Au%20Pair",
    },
  },
  {
    codigo: "CA",
    nombre: "Canadá",
    bandera: "🇨🇦",
    dificultad: "dificil",
    resumen: "Hace falta permiso de trabajo. El antiguo programa de cuidadores internos ya no existe.",
    comoSePuede: [
      "No hay figura de au pair como tal: se entra como trabajador y hace falta permiso de trabajo.",
      "El programa de cuidadores internos que había se cerró; las vías actuales piden oferta de empleo y trámite migratorio.",
      "España no tiene acuerdo de movilidad juvenil con Canadá que cubra esto de forma directa.",
    ],
    cuidadoCon: "Si te piden dinero por «gestionarte el permiso» sin contrato ni número de expediente, desconfía.",
  },
  {
    codigo: "ES",
    nombre: "España",
    bandera: "🇪🇸",
    dificultad: "libre",
    resumen: "Sin trámite si eres española o de la UE. Y aquí el Acuerdo Europeo sí se puede reclamar.",
    comoSePuede: [
      "Libre circulación: no necesitas permiso de trabajo.",
      "Es de los ocho países donde el Acuerdo Europeo de au pair está en vigor, así que los derechos del tratado son exigibles.",
      "Si el trabajo es de interna de verdad, es relación laboral especial de empleados de hogar: alta en la Seguridad Social y salario mínimo.",
    ],
  },
  {
    codigo: "DE",
    nombre: "Alemania",
    bandera: "🇩🇪",
    dificultad: "libre",
    resumen: "Sin visado siendo de la UE. Muy regulado, pero el Acuerdo Europeo no aplica allí.",
    comoSePuede: [
      "Libre circulación. Solo tienes que empadronarte al llegar (Anmeldung).",
      "La regulación nacional alemana es estricta y bastante protectora: contrato tipo, dinero de bolsillo fijado y seguro a cargo de la familia.",
      "Firmó el Acuerdo Europeo en 1976 pero nunca lo ratificó: no le puedes reclamar el tratado, sí la norma alemana.",
    ],
  },
  {
    codigo: "FR",
    nombre: "Francia",
    bandera: "🇫🇷",
    dificultad: "libre",
    resumen: "Sin visado y con el Acuerdo Europeo en vigor desde 1971.",
    comoSePuede: [
      "Libre circulación.",
      "El Acuerdo Europeo está ratificado: cinco horas al día, día libre y contrato por escrito son exigibles.",
      "La figura tiene nombre propio, «stagiaire aide familial», con su contrato tipo.",
    ],
  },
  {
    codigo: "IT",
    nombre: "Italia",
    bandera: "🇮🇹",
    dificultad: "libre",
    resumen: "Sin visado y con el Acuerdo Europeo en vigor desde 1973.",
    comoSePuede: [
      "Libre circulación.",
      "El Acuerdo Europeo aplica.",
      "Si el trabajo es de interna, entra en el convenio nacional de trabajo doméstico, que fija salarios por categoría.",
    ],
  },
  {
    codigo: "IE",
    nombre: "Irlanda",
    bandera: "🇮🇪",
    dificultad: "libre",
    resumen: "Sin visado, y con un detalle a tu favor: allí a las au pairs se las ha tratado como empleadas.",
    comoSePuede: [
      "Libre circulación.",
      "No es parte del Acuerdo Europeo, pero los tribunales irlandeses han considerado a au pairs como trabajadoras con derecho al salario mínimo.",
      "Si te tratan como empleada, exige contrato y nóminas.",
    ],
  },
  {
    codigo: "NL",
    nombre: "Países Bajos",
    bandera: "🇳🇱",
    dificultad: "libre",
    resumen: "Sin visado. Régimen nacional de intercambio cultural, con límites propios.",
    comoSePuede: [
      "Libre circulación.",
      "No es parte del Acuerdo Europeo: rigen las reglas neerlandesas de intercambio cultural, que limitan las horas y prohíben que sustituyas a una empleada.",
    ],
  },
];

export const FUENTES_PUEDES_IR = [
  { titulo: "Trabajar en otro país de la UE — Your Europe (Comisión Europea)", url: "https://europa.eu/youreurope/citizens/work/work-abroad/index_es.htm" },
  { titulo: "Programa Au Pair J-1 — Departamento de Estado de EE. UU.", url: "https://j1visa.state.gov/programs/au-pair/" },
  { titulo: "¿Necesitas visado para el Reino Unido? — GOV.UK", url: "https://www.gov.uk/check-uk-visa" },
];

export function realidadDe(codigo: string): RealidadPais | undefined {
  return REALIDAD_POR_PAIS.find(p => p.codigo === codigo.toUpperCase());
}
