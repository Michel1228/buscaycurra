/**
 * lib/cursos/papeles.ts — Los papeles que te piden, y dónde se sacan.
 *
 * POR QUÉ ESTO IMPORTA MÁS DE LO QUE PARECE. La gente no se queda fuera de un
 * curso subvencionado por no valer: se queda fuera por llegar el último día de
 * plazo sin el DARDE, o por pedir la vida laboral una semana tarde. El curso es
 * gratis y la plaza se pierde por un papel.
 *
 * Decirle a alguien "necesitas el informe de vida laboral" no le sirve de nada
 * si no sabe que se pide en la Seguridad Social, que es gratis, y que hay una
 * forma de sacarlo por SMS en tres minutos sin certificado digital. Eso último
 * es lo que de verdad le desatasca, y no lo cuenta casi nadie.
 *
 * ⚠️ CADA ENLACE DE AQUÍ ESTÁ COMPROBADO A MANO. Un enlace roto en esta lista
 * es peor que no tener la lista: mandas a alguien con prisa a una página que no
 * existe. Verificados el 2026-09-01, todos devolviendo 200.
 *
 * Lo que NO se hace aquí: alojar los PDF nosotros. Los impresos oficiales
 * cambian sin avisar y servir una copia vieja haría que le rechazaran la
 * solicitud — exactamente lo contrario de lo que buscamos. Se enlaza siempre al
 * origen oficial.
 */

export interface Papel {
  id: string;
  nombre: string;
  /** Para qué te lo piden, en cristiano. */
  paraQue: string;
  /** Dónde se saca. Enlace oficial, comprobado. */
  url: string;
  /** Cómo se llama el sitio al que va, para que sepa dónde está entrando. */
  donde: string;
  /** Pasos concretos. Cortos. */
  como: string[];
  /** El atajo que ahorra tiempo o evita el certificado digital. */
  truco?: string;
  gratuito: boolean;
  /** Cuánto tarda en llegar, si no es inmediato. */
  tarda?: string;
  /** Si lo emite cada comunidad y no hay un sitio único. */
  variaPorComunidad?: boolean;
}

export const PAPELES: Papel[] = [
  {
    id: "darde",
    nombre: "DARDE — tarjeta de demanda de empleo",
    paraQue:
      "Es LA condición para entrar en cualquier curso subvencionado estando en paro. Es también el papel que más se olvida: la plaza se pierde por esto más que por cualquier otra cosa.",
    url: "https://www.sistemanacionalempleo.es/",
    donde: "Sistema Nacional de Empleo",
    como: [
      "Se saca en el servicio de empleo de TU comunidad, no en el SEPE. Desde aquí se llega al de cada una.",
      "Si ya estás inscrito, lo que necesitas es renovarlo: caduca y un DARDE caducado no vale.",
      "Descárgalo en PDF y guárdalo. Te lo van a pedir en papel o por correo.",
    ],
    truco:
      "Míralo ANTES de elegir curso, no después. Si está caducado, renovarlo puede llevarte días y los plazos de matrícula son cortos.",
    gratuito: true,
    variaPorComunidad: true,
  },
  {
    id: "vida-laboral",
    nombre: "Informe de vida laboral",
    paraQue:
      "Acredita los años que llevas cotizados y en qué. Lo piden los cursos que exigen experiencia previa, y es el documento central para acreditar competencias por experiencia.",
    url: "https://portal.seg-social.gob.es/wps/portal/importass/importass/Categorias/Vida+laboral+e+informes/Informes+sobre+tu+vida+laboral+y+tus+bases/Informe+de+tu+vida+laboral",
    donde: "Import@ss — Seguridad Social",
    como: [
      "Entra en Import@ss con Cl@ve, certificado digital o el envío de un código por SMS.",
      "Descárgalo en PDF. Sale al momento.",
    ],
    truco:
      "Sin certificado ni Cl@ve: manda un SMS al 638 444 444 con el texto VLABORAL seguido de tu DNI con letra. En un par de minutos te llega un enlace con un código para descargarlo. Tu móvil tiene que estar dado de alta en la Seguridad Social.",
    gratuito: true,
  },
  {
    id: "numero-afiliacion",
    nombre: "Número de afiliación a la Seguridad Social",
    paraQue:
      "Te lo piden en la matrícula de casi todo lo subvencionado. Si nunca has trabajado en España, hay que solicitarlo la primera vez.",
    url: "https://portal.seg-social.gob.es/",
    donde: "Import@ss — Seguridad Social",
    como: [
      "Si ya has trabajado, viene en tu informe de vida laboral: no hace falta pedirlo aparte.",
      "Si es la primera vez, se solicita en Import@ss y te lo dan en el momento.",
    ],
    gratuito: true,
  },
  {
    id: "delitos-sexuales",
    nombre: "Certificado de delitos de naturaleza sexual",
    paraQue:
      "Obligatorio para trabajar con menores o con personas dependientes. Te lo van a pedir sí o sí en cuidados, geriatría y ayuda a domicilio, y también en muchos cursos de esos sectores.",
    url: "https://sede.mjusticia.gob.es/tramites/certificado-registro-central",
    donde: "Sede electrónica del Ministerio de Justicia",
    como: [
      "Se pide por internet con Cl@ve o certificado digital.",
      "Normalmente se emite al momento; el plazo máximo legal es de 30 días.",
      "Se descarga desde la misma sede con el número de solicitud del resguardo.",
    ],
    truco:
      "Pídelo con tiempo aunque suela salir al momento: si te toca el caso raro que tarda, te quedas sin plaza.",
    gratuito: false,
    tarda: "Normalmente al momento, hasta 30 días como máximo",
  },
  {
    id: "homologacion",
    nombre: "Homologación del título de fuera de España",
    paraQue:
      "Los certificados profesionales de nivel 2 piden la ESO o equivalente. Si estudiaste fuera, tu título no vale por sí solo: hay que homologarlo, y eso tarda meses.",
    url: "https://www.educacionfpydeportes.gob.es/servicios-al-ciudadano/catalogo/gestion-titulos/estudios-no-universitarios/titulos-extranjeros/homologacion-convalidacion-no-universitarios.html",
    donde: "Ministerio de Educación y Formación Profesional",
    como: [
      "Comprueba primero si tu título necesita homologación o basta con una convalidación, que es más rápida.",
      "Mientras se resuelve te dan un volante de inscripción condicional, y con eso puedes matricularte.",
    ],
    truco:
      "Empieza esto ANTES que nada si vienes de fuera. Es lo que más tarda de toda la lista, y sin ello no puedes acceder al nivel 2.",
    gratuito: false,
    tarda: "Meses",
  },
];

/**
 * Los papeles que le tocan a un curso concreto.
 *
 * Solo se enseña lo que le hace falta: soltarle los cinco a todo el mundo es
 * volver a la lista genérica que no lee nadie. La idea es "esto es lo TUYO".
 */
export function papelesDeCurso(opciones: {
  obligatorioLegal: boolean;
  sector: string;
  documentosExtra?: string[];
}): Papel[] {
  const ids = new Set<string>(["darde"]);

  const extras = (opciones.documentosExtra ?? []).join(" ").toLowerCase();
  if (extras.includes("vida laboral")) ids.add("vida-laboral");
  if (extras.includes("delitos")) ids.add("delitos-sexuales");
  if (extras.includes("eso") || extras.includes("prueba de acceso")) ids.add("homologacion");

  // Cuidados: aunque la ficha no lo diga, el certificado de delitos se lo van a
  // pedir en cuanto pise un centro. Mejor que lo sepa desde el curso.
  if (opciones.sector === "SALUD") {
    ids.add("delitos-sexuales");
    ids.add("vida-laboral");
  }

  return PAPELES.filter(p => ids.has(p.id));
}

export const ACTUALIZADO_PAPELES = "2026-09";
