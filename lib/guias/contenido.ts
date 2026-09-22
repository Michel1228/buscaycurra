/**
 * lib/guias/contenido.ts — Las guías de uso de BuscayCurra.
 *
 * POR QUÉ EXISTE: la aplicación convierte bien a quien entra (la ficha de la App
 * Store convierte al 50%), pero entra poca gente y quien entra no siempre sabe
 * qué puede pedirle. Esto es la web oficial: páginas públicas, sin sesión, que
 * Google puede indexar y que explican cómo se usa cada cosa.
 *
 * REGLA AL ESCRIBIR AQUÍ: cada cifra sale del código, no de lo que nos gustaría.
 * Los límites por plan vienen de lib/plan-limits.ts; los 15 días entre envíos a
 * la misma empresa, de lib/cv-sender/scheduler.ts; la ventana de envío (9:00 a
 * 18:00, hora de Madrid, días laborables), de getNextBusinessHour(). Si algo
 * cambia ahí, cambia aquí — el sello comprueba que los números coinciden.
 */
import { LIMITS } from "@/lib/plan-limits";

export interface PasoGuia {
  titulo: string;
  detalle: string;
}

export interface Guia {
  slug: string;
  titulo: string;
  /** Frase de una línea para la tarjeta del índice y la meta descripción. */
  resumen: string;
  /** Para quién es, en sus palabras. */
  paraQuien: string;
  icono: "enviar" | "ett" | "buscar" | "guzzi" | "cv" | "emigrar";
  pasos: PasoGuia[];
  /** Cosas que la gente pregunta y que conviene decir sin que las pregunten. */
  avisos?: string[];
  /** Enlaces a otras páginas nuestras que siguen a esta. */
  siguiente?: Array<{ texto: string; href: string }>;
}

const free = LIMITS.free;
const esencial = LIMITS.esencial;

export const GUIAS: Guia[] = [
  {
    slug: "enviar-cv-a-empresas",
    titulo: "Cómo enviar tu CV a una empresa que no ha publicado ninguna oferta",
    resumen:
      "La mayoría de los puestos de un pueblo no se publican en ningún portal. Así mandas tu CV directamente a la empresa, con carta y en hora de oficina.",
    paraQuien:
      "Para quien sabe dónde quiere trabajar —la fábrica del polígono, el bar de al lado, esa empresa concreta— y no encuentra ninguna oferta suya.",
    icono: "enviar",
    pasos: [
      {
        titulo: "Sube tu CV una vez",
        detalle:
          "En «Mi CV» puedes subir el PDF que ya tengas, o contarle tu experiencia a Guzzi y que lo monte él. Queda guardado y se usa en todos los envíos: no hay que adjuntarlo cada vez.",
      },
      {
        titulo: "Busca la empresa por su nombre",
        detalle:
          "En «Empresas», pestaña «Buscar empresa», escribe el nombre tal y como lo dirías: «La Papelera de Buñuel», «el Mercadona de la calle Tudela». Si el sitio es pequeño o el nombre se repite, añade el pueblo o la provincia.",
      },
      {
        titulo: "Mira el correo que ha encontrado",
        detalle:
          "Cada ficha dice de dónde sale el correo. «Verificado» es un correo que aparece en la web de la empresa; «probable» es una dirección del tipo rrhh@ que existe en su dominio. Si ves uno mejor en su web, puedes escribirlo tú.",
      },
      {
        titulo: "Lee la carta antes de que salga",
        detalle:
          "Se genera una carta de presentación para esa empresa y ese puesto, y se te enseña antes de enviar nada. Puedes cancelar si no te convence. Nada sale sin que le des a confirmar.",
      },
      {
        titulo: "Se envía en hora de oficina, no de madrugada",
        detalle:
          "El envío se programa entre las 9:00 y las 18:00 de un día laborable (hora de Madrid), con unos minutos de diferencia entre uno y otro. Un correo que entra a las tres de la mañana o un domingo se lee peor, y en bloque parece publicidad.",
      },
      {
        titulo: "Sigue qué pasa con él",
        detalle:
          "En «Envíos» ves el estado de cada uno: programado, enviado, entregado, abierto o rebotado. Si rebota, el correo no existía y conviene buscar otro.",
      },
    ],
    avisos: [
      `El plan gratuito permite ${free.enviosCVDia} envíos al día y ${free.enviosCVSemana} a la semana. El plan Esencial (2,99 €/mes), ${esencial.enviosCVDia} al día.`,
      "A la misma empresa no se puede volver a escribir hasta pasados 15 días. Insistir cada semana no consigue el puesto: quema el contacto.",
      "Tu CV se manda tal cual lo tengas guardado. Si lo cambias, los envíos siguientes ya llevan el nuevo.",
    ],
    siguiente: [
      { texto: "Cómo encontrar las ETTs de tu zona", href: "/guias/ett" },
      { texto: "Cómo preparar el CV", href: "/guias/cv" },
    ],
  },
  {
    slug: "ett",
    titulo: "Cómo encontrar las ETTs de tu zona (aunque vivas en un pueblo)",
    resumen:
      "Las empresas de trabajo temporal mueven mucho empleo que nunca se publica. Están en la cabecera de comarca, no en tu pueblo, y esta búsqueda las trae con su correo.",
    paraQuien:
      "Para quien quiere entrar a trabajar ya, en almacén, fábrica, limpieza, hostelería o campo, y le da igual empezar por una temporal.",
    icono: "ett",
    pasos: [
      {
        titulo: "Escribe tu pueblo, no la capital",
        detalle:
          "En «Empresas», pestaña «ETTs», escribe donde vives aunque sea pequeño. La búsqueda mira también alrededor: si en tu pueblo no hay ninguna, trae las de la ciudad más cercana y te dice a cuántos kilómetros está cada una.",
      },
      {
        titulo: "Comprueba qué sitio ha entendido",
        detalle:
          "Arriba de los resultados se indica el sitio que se ha localizado. En España hay nombres que se repiten (hay dos Cabanillas, varias Villanueva): si no es el tuyo, añade la provincia y vuelve a buscar.",
      },
      {
        titulo: "Empieza por las que tienen correo verificado",
        detalle:
          "Salen primero las que tienen un correo comprobado, que son donde el CV llega a alguien. Detrás, las que tienen uno probable.",
      },
      {
        titulo: "Mándales el CV como a cualquier empresa",
        detalle:
          "El envío es el mismo que a una empresa normal: se te enseña la carta, tú confirmas y sale en hora de oficina. En una ETT conviene decir qué puedes hacer y desde cuándo, más que a qué puesto aspiras.",
      },
    ],
    avisos: [
      "Funciona en los 26 países de la aplicación, buscando con el nombre que se usa allí: Zeitarbeitsfirma en Alemania, uitzendbureau en Países Bajos, agence d'intérim en Francia, recruitment agency en Reino Unido e Irlanda.",
      "Apuntarse a una ETT no es firmar nada: es dejar el CV en su bolsa para cuando entre un pedido.",
    ],
    siguiente: [
      { texto: "Cómo enviar el CV a una empresa", href: "/guias/enviar-cv-a-empresas" },
      { texto: "Trabajar en otro país", href: "/trabajar-en" },
    ],
  },
  {
    slug: "buscar-ofertas",
    titulo: "Cómo buscar ofertas y no repetir la misma búsqueda cada día",
    resumen:
      "Millones de ofertas de 26 países en un solo sitio, con filtros que funcionan y ofertas guardadas para no empezar de cero cada mañana.",
    paraQuien:
      "Para quien está mirando varios portales a la vez y ya no sabe cuál ha visto.",
    icono: "buscar",
    pasos: [
      {
        titulo: "Busca por oficio, no por título rimbombante",
        detalle:
          "«camarero», «carretillero», «limpieza», «cuidado de mayores». En «Buscar» se consultan a la vez las ofertas de todas nuestras fuentes, con el país y la ciudad que elijas.",
      },
      {
        titulo: "Filtra por ciudad y por salario",
        detalle:
          "Puedes acotar por ubicación y por lo que pagan. Las ofertas traen siempre enlace al origen, fuente y fecha: si algo no se puede comprobar, no se enseña.",
      },
      {
        titulo: "Guarda lo que te interese",
        detalle:
          `Con el corazón se guardan en «Guardados» (${free.ofertasGuardadas} en el plan gratuito, ${esencial.ofertasGuardadas} en Esencial). Así al día siguiente no vuelves a leer las mismas.`,
      },
      {
        titulo: "Lleva tus candidaturas en el tablero",
        detalle:
          "En «Pipeline» pasas cada candidatura por sus fases: apuntada, enviada, entrevista, respuesta. Sirve para saber a quién has escrito y cuándo toca recordar.",
      },
    ],
    avisos: [
      "Las ofertas vienen de fuentes públicas (Adzuna, Careerjet, EURES y otras) y se refrescan varias veces al día. Las que caducan se retiran solas.",
      "Si una oferta te lleva a una página que ya no existe, es que la empresa la ha quitado en origen: pasa en todos los portales.",
    ],
    siguiente: [
      { texto: "Qué le puedes pedir a Guzzi", href: "/guias/guzzi" },
      { texto: "Cómo enviar el CV a una empresa", href: "/guias/enviar-cv-a-empresas" },
    ],
  },
  {
    slug: "guzzi",
    titulo: "Qué le puedes pedir a Guzzi (y qué no)",
    resumen:
      "Guzzi es el asistente de la aplicación. Entiende cómo habla la gente y hace el trabajo aburrido: buscar, comparar, escribir cartas y prepararte la entrevista.",
    paraQuien: "Para quien prefiere decirlo con sus palabras antes que rellenar filtros.",
    icono: "guzzi",
    pasos: [
      {
        titulo: "Pídele ofertas como se lo dirías a un amigo",
        detalle:
          "«Quiero algo de almacén cerca de Tudela para empezar ya», «busco camarero de fin de semana». Entiende el pueblo, el oficio y la disponibilidad en la misma frase.",
      },
      {
        titulo: "Pregúntale si te compensa el desplazamiento",
        detalle:
          "Sabe a cuántos kilómetros está un sitio de otro y cuánto cuesta el carburante hoy en tu provincia, con el precio oficial del Ministerio. Te dice lo que se te va en ir y volver.",
      },
      {
        titulo: "Dile que te prepare la carta o el CV",
        detalle:
          "Puede adaptar tu CV a una oferta concreta y escribir la carta. En el plan gratuito tienes un CV con IA; en los de pago, más.",
      },
      {
        titulo: "Ensaya la entrevista",
        detalle:
          "En los planes de pago hace de entrevistador: pregunta, te deja responder y te dice qué mejorarías. Es la parte que más cambia el resultado y la que nadie practica.",
      },
    ],
    avisos: [
      `En el plan gratuito son ${free.guzziMaxConsultasDia} consultas al día; en Esencial, ${esencial.guzziMaxConsultasDia}.`,
      "Guzzi no manda nada por su cuenta: todo envío lo confirmas tú.",
      "No se inventa ofertas. Si no encuentra nada en tu zona, lo dice y propone mirar el pueblo de al lado.",
    ],
    siguiente: [
      { texto: "Cómo enviar el CV a una empresa", href: "/guias/enviar-cv-a-empresas" },
      { texto: "Cómo preparar el CV", href: "/guias/cv" },
    ],
  },
  {
    slug: "cv",
    titulo: "Cómo preparar el CV para que pase el primer filtro",
    resumen:
      "Un CV que no pasa el lector automático no lo ve nadie. Aquí se revisa, se puntúa y se arregla antes de mandarlo a ninguna parte.",
    paraQuien: "Para quien manda currículums y no recibe ni el «hemos recibido su candidatura».",
    icono: "cv",
    pasos: [
      {
        titulo: "Sube el que ya tienes",
        detalle:
          "En «Mi CV», el PDF que uses normalmente. Si no tienes ninguno, cuéntale tu experiencia a Guzzi y te lo monta desde cero.",
      },
      {
        titulo: "Mira la puntuación ATS",
        detalle:
          "Se analiza como lo haría el programa que filtra candidaturas en las empresas grandes: si faltan palabras del sector, si el formato se lee mal, si no se entiende tu experiencia. Te devuelve nota y qué corregir.",
      },
      {
        titulo: "Adáptalo a la oferta concreta",
        detalle:
          "Para una oferta que te interese de verdad, se reescribe destacando lo que piden. No se inventa experiencia que no tienes: se ordena la que hay.",
      },
      {
        titulo: "Comprueba las costumbres del país",
        detalle:
          "La foto se espera en Alemania y resta en Reino Unido, Irlanda, Países Bajos y Estados Unidos. La edad y el estado civil no se ponen en casi ningún sitio. Cada país tiene su norma y no es la misma.",
      },
    ],
    avisos: [
      `Puedes tener ${free.cvsGuardados} CV guardado en el plan gratuito y ${esencial.cvsGuardados} en Esencial (por ejemplo, uno de hostelería y otro de almacén).`,
      "El CV se guarda para poder enviarlo; no se enseña a ninguna empresa que no elijas tú.",
    ],
    siguiente: [
      { texto: "El CV según el país", href: "/cv-por-pais" },
      { texto: "Cómo enviar el CV a una empresa", href: "/guias/enviar-cv-a-empresas" },
    ],
  },
  {
    slug: "emigrar",
    titulo: "Irte a trabajar fuera: por dónde se empieza",
    resumen:
      "Papeles, alojamiento, el paro que puedes llevarte y qué se espera de tu CV en cada país. Lo que hay que mirar antes de comprar el billete.",
    paraQuien: "Para quien se plantea salir de España a trabajar y no sabe por dónde empezar.",
    icono: "emigrar",
    pasos: [
      {
        titulo: "Elige país y mira qué se cobra de verdad",
        detalle:
          "Cada país tiene su página con ofertas reales, salarios de las ofertas publicadas y lo que hace falta para trabajar allí. Sirve para comparar antes de decidir.",
      },
      {
        titulo: "Comprueba si puedes llevarte el paro",
        detalle:
          "Si estás cobrando la prestación, se puede exportar a otro país de la Unión Europea durante un tiempo limitado, con un trámite previo. Está explicado paso a paso.",
      },
      {
        titulo: "Prepara el CV como lo esperan allí",
        detalle:
          "Formato, foto, extensión e idioma cambian mucho de un país a otro. Mandar el CV español tal cual es el error más repetido.",
      },
      {
        titulo: "Busca desde aquí, antes de irte",
        detalle:
          "Puedes mandar CV a empresas y a ETTs del país de destino desde España. Llegar con dos o tres contactos hechos no es lo mismo que llegar a ciegas.",
      },
    ],
    avisos: [
      "Si vas de au pair, hay una página con tus derechos: horas, paga y qué no te pueden exigir.",
      "Nada de lo que contamos sustituye a la información oficial de cada país: siempre enlazamos a la fuente para que lo compruebes.",
    ],
    siguiente: [
      { texto: "Trabajar en otro país", href: "/trabajar-en" },
      { texto: "Llevarte el paro", href: "/llevarte-el-paro" },
      { texto: "Derechos de las au pair", href: "/derechos-au-pair" },
    ],
  },
];

export function guiaPorSlug(slug: string): Guia | undefined {
  return GUIAS.find((g) => g.slug === slug);
}
