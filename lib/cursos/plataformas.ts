/**
 * lib/cursos/plataformas.ts — Dónde hay formación gratuita de verdad.
 *
 * POR QUÉ EXISTE ESTE FICHERO APARTE DE tipos.ts. tipos.ts describe CURSOS
 * concretos, uno a uno, escritos a mano y verificados: el carretillero, el
 * manipulador de alimentos. Eso da profundidad pero no da volumen — cada ficha
 * cuesta horas de comprobación y nunca vamos a tener mil.
 *
 * Esto es la otra mitad: las PLATAFORMAS donde ya hay cientos o miles de cursos
 * gratuitos montados por otros. Una sola entrada aquí (Santander Open Academy)
 * abre más de mil cursos en varios idiomas. Es la única manera honesta de dar
 * amplitud sin inventarse un catálogo que no tenemos.
 *
 * Y es lo que resuelve el multi-país: BuscayCurra está en 26 países, y las
 * plataformas online no tienen ubicación — la EU Academy sirve igual en Sevilla
 * que en Nápoles. Los cursos presenciales subvencionados, en cambio, solo
 * existen donde hay convocatoria, y por eso van por servicio público de empleo
 * de cada país.
 *
 * ⚠️ MISMA REGLA QUE EN tipos.ts: nada entra aquí sin haberlo abierto y mirado.
 * En particular, NO se afirma que dan certificado si no lo dicen ellos: mucha
 * gente elige el curso justamente por el papel del final, y prometerlo en falso
 * le hace perder semanas. Cuando no consta, se dice que no consta.
 *
 * Bajas comprobadas (para que nadie las vuelva a meter):
 *   · Conecta Empleo (Fundación Telefónica) — su plataforma propia
 *     conectaempleo-formacion.fundaciontelefonica.com ya redirige a la web
 *     general y el catálogo de formación solo ofrece ProFuturo, que es para
 *     docentes. Estaba en el plan original; a 2026-08 ya no es una opción real.
 */

import type { Fuente } from "./tipos";

/** Alcance: dónde sirve la plataforma. */
export type Alcance =
  | { tipo: "global" }
  /** Toda la Unión Europea. */
  | { tipo: "ue" }
  /** Solo estos países (códigos ISO de lib/paises.ts). */
  | { tipo: "paises"; codigos: string[] };

export interface PlataformaFormacion {
  id: string;
  nombre: string;
  /** Una frase. Es lo que se lee en la tarjeta. */
  resumen: string;
  url: string;
  alcance: Alcance;
  /** Idiomas en los que hay material, no los del menú de la web. */
  idiomas: string[];
  /** Etiquetas de búsqueda. En español, que es como la gente escribe. */
  temas: string[];
  /**
   * "si" solo si lo dice la propia plataforma. "no_consta" cuando lo hemos
   * mirado y no lo dicen — que no es lo mismo que decir que no lo dan.
   */
  certificado: "si" | "no" | "no_consta";
  /** Tamaño del catálogo, tal y como lo declaran ellos. */
  volumen?: string;
  /** Quién puede apuntarse. Vacío = cualquiera. */
  requisitos?: string;
  /** Lo que hay que saber antes de meterse. Se muestra en la tarjeta. */
  aviso?: string;
  fuentes: Fuente[];
  /** YYYY-MM de la última vez que se abrió y se comprobó. */
  actualizado: string;
}

// ─── Plataformas abiertas: no dependen de dónde vivas ───────────────────────

export const PLATAFORMAS: PlataformaFormacion[] = [
  {
    id: "santander-open-academy",
    nombre: "Santander Open Academy",
    resumen:
      "Más de mil cursos y becas gratis. No hace falta ser cliente del banco ni estudiante de nada.",
    url: "https://app.santanderopenacademy.com/program/search",
    alcance: { tipo: "global" },
    idiomas: ["Español", "Inglés", "Portugués"],
    temas: [
      "idiomas", "inglés", "informática", "ofimática", "excel", "tecnología",
      "programación", "marketing", "negocios", "finanzas", "liderazgo",
      "comunicación", "habilidades profesionales", "sostenibilidad",
    ],
    certificado: "no_consta",
    volumen: "Más de 1.000 cursos, contenidos y becas",
    aviso:
      "Ellos mismos dicen que es gratis y sin ser cliente. Lo que no dicen en la página de inicio es si dan certificado; míralo en cada curso antes de empezar si lo necesitas para enseñárselo a una empresa.",
    fuentes: [
      {
        titulo: "Santander Open Academy — plataforma gratuita de Banco Santander",
        url: "https://www.santanderopenacademy.com/es/index.html",
      },
    ],
    actualizado: "2026-08",
  },
  {
    id: "eu-academy",
    nombre: "EU Academy",
    resumen:
      "La plataforma de formación de la propia Unión Europea. Gratis y en más de 30 idiomas.",
    url: "https://academy.europa.eu/courses/",
    alcance: { tipo: "ue" },
    idiomas: [
      "Español", "Inglés", "Francés", "Alemán", "Italiano", "Portugués",
      "Neerlandés", "Polaco", "y más de 20 idiomas",
    ],
    temas: [
      "agricultura", "digital", "tecnología", "datos", "energía", "medio ambiente",
      "educación", "derecho", "migración", "integración", "transporte", "idiomas",
    ],
    certificado: "no_consta",
    aviso:
      "Es formación institucional de la UE: muy útil para lo digital, lo agrario y todo lo relacionado con moverse por Europa. No esperes aquí un curso de camarero.",
    fuentes: [
      { titulo: "EU Academy — plataforma oficial de la Unión Europea", url: "https://academy.europa.eu/" },
    ],
    actualizado: "2026-08",
  },
  {
    id: "grow-with-google",
    nombre: "Google — Actívate / Grow with Google",
    resumen:
      "29 cursos gratis de lo digital: marketing, programación, nube, productividad y búsqueda de empleo.",
    url: "https://grow.google/intl/es/courses-and-tools/?category=career&type=online-courses",
    alcance: { tipo: "global" },
    idiomas: ["Español", "Inglés"],
    temas: [
      "marketing digital", "programación", "cloud", "nube", "comercio electrónico",
      "ciberseguridad", "productividad", "ofimática", "competencias digitales",
      "inteligencia artificial", "hablar en público", "buscar trabajo",
    ],
    certificado: "no_consta",
    volumen: "29 cursos gratuitos en español",
    aviso:
      "Google reorganizó Actívate y ahora los cursos viven dentro de Skillshop y Grow with Google. Si buscas el certificado antiguo de Actívate, comprueba en cada curso qué acredita hoy: la validación de los certificados antiguos no está garantizada.",
    fuentes: [
      {
        titulo: "Grow with Google — catálogo de cursos gratuitos en español",
        url: "https://grow.google/intl/es/courses-and-tools/?category=career&type=online-courses",
      },
    ],
    actualizado: "2026-08",
  },
];

// ─── Servicio público de empleo de cada país ────────────────────────────────
//
// Aquí es donde está lo subvencionado y lo presencial, que es lo que de verdad
// sirve para carretillero, soldadura o atención sociosanitaria. Cambia por país
// y muchas veces por región, así que lo que damos es la puerta oficial de
// entrada, no una lista de plazas que se quedaría vieja en una semana.

export interface ServicioEmpleo {
  pais: string;
  nombre: string;
  url: string;
  /** Qué se hace exactamente ahí. */
  queHacer: string;
  actualizado: string;
}

export const SERVICIOS_EMPLEO: ServicioEmpleo[] = [
  {
    pais: "ES",
    nombre: "SEPE — Formación para el empleo",
    url: "https://www.sepe.es/HomeSepe/Personas/formacion",
    queHacer:
      "Buscar cursos gratuitos para trabajadores y desempleados. Los certificados de profesionalidad se piden aquí y en el servicio de empleo de tu comunidad.",
    actualizado: "2026-08",
  },
  {
    pais: "DE",
    nombre: "Bundesagentur für Arbeit — buscador de formación",
    url: "https://web.arbeitsagentur.de/weiterbildungssuche/",
    queHacer:
      "Buscador oficial alemán de cursos. Muchos se pagan con el Bildungsgutschein, un bono de formación que te da la agencia si cumples requisitos.",
    actualizado: "2026-08",
  },
  {
    pais: "FR",
    nombre: "Mon Compte Formation",
    url: "https://www.moncompteformation.gouv.fr/espace-prive/html/#/",
    queHacer:
      "En Francia cada trabajador acumula un saldo en euros para formarse. Se entra con identidad digital y se paga el curso con ese saldo.",
    actualizado: "2026-08",
  },
  {
    pais: "IT",
    nombre: "Cliclavoro",
    url: "https://www.cliclavoro.gov.it/",
    queHacer:
      "Portal público italiano de empleo y formación. Las plazas concretas las gestiona cada región.",
    actualizado: "2026-08",
  },
  {
    pais: "PT",
    nombre: "IEFP — Formação",
    url: "https://www.iefp.pt/formacao",
    queHacer:
      "Instituto público portugués de empleo y formación profesional. Cursos gratuitos y con certificado.",
    actualizado: "2026-08",
  },
  {
    pais: "NL",
    nombre: "UWV",
    url: "https://www.uwv.nl/particulieren",
    queHacer:
      "Organismo público neerlandés de empleo. Desde aquí se llega a las ayudas de formación y reorientación.",
    actualizado: "2026-08",
  },
  {
    pais: "GB",
    nombre: "National Careers Service",
    url: "https://nationalcareers.service.gov.uk/explore-careers",
    queHacer:
      "Servicio público británico de orientación. Explica qué se necesita para cada oficio y qué formación gratuita hay.",
    actualizado: "2026-08",
  },
];

// ─── Reconocer fuera lo que ya tienes ───────────────────────────────────────

export const EUROPASS = {
  nombre: "Europass",
  url: "https://europa.eu/europass/es",
  resumen:
    "Servicio oficial de la UE para hacer el CV europeo y, sobre todo, para saber si tu titulación vale en otro país.",
  actualizado: "2026-08",
};

// ─── Utilidades ─────────────────────────────────────────────────────────────

/** Las plataformas que sirven en un país dado. */
export function plataformasPorPais(pais: string): PlataformaFormacion[] {
  const UE = new Set([
    "ES", "DE", "FR", "IT", "PT", "NL", "BE", "AT", "IE", "PL", "SE", "DK",
    "FI", "CZ", "GR", "HU", "RO", "BG", "HR", "SK", "SI", "LT", "LV", "EE",
    "LU", "CY", "MT",
  ]);
  return PLATAFORMAS.filter(p => {
    if (p.alcance.tipo === "global") return true;
    if (p.alcance.tipo === "ue") return UE.has(pais);
    return p.alcance.codigos.includes(pais);
  });
}

export function servicioEmpleoDe(pais: string): ServicioEmpleo | undefined {
  return SERVICIOS_EMPLEO.find(s => s.pais === pais);
}
