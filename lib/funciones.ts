/**
 * lib/funciones.ts — Todo lo que hace BuscayCurra, para la página pública.
 *
 * POR QUÉ EXISTE: la portada vende la idea en diez segundos, pero quien se está
 * pensando si merece la pena quiere ver la lista entera. Y quien llega desde
 * Google suele buscar una cosa concreta ("comparador de salarios", "simulador de
 * entrevista"), no "portal de empleo".
 *
 * REGLA: aquí solo va lo que existe y funciona hoy. Cada entrada apunta a una
 * pantalla real de la aplicación. Si algo se retira, se quita de aquí en el
 * mismo cambio: una web que promete una función que ya no está es la forma más
 * rápida de perder a quien acababa de confiar.
 */

export interface Funcion {
  titulo: string;
  /** Qué hace, en una o dos frases, sin palabras de folleto. */
  descripcion: string;
  /** Dónde está en la aplicación (requiere cuenta). */
  ruta: string;
  /** Guía pública que lo explica, si la hay. */
  guia?: string;
  /** Si es solo de los planes de pago. */
  dePago?: boolean;
}

export interface GrupoFunciones {
  titulo: string;
  resumen: string;
  funciones: Funcion[];
}

export const GRUPOS_FUNCIONES: GrupoFunciones[] = [
  {
    titulo: "Llegar a las empresas",
    resumen:
      "La parte que de verdad consigue puestos: escribir a quien contrata, aunque no haya publicado nada.",
    funciones: [
      {
        titulo: "Enviar tu CV a cualquier empresa",
        descripcion:
          "Buscas la empresa por su nombre, se encuentra su correo de contacto, se escribe una carta para ella y se manda en hora de oficina. Tú confirmas antes de que salga nada.",
        ruta: "/app/empresas",
        guia: "/guias/enviar-cv-a-empresas",
      },
      {
        titulo: "Empresas de tu zona por sector",
        descripcion:
          "Todas las de un sector en tu ciudad —hostelería, industria, comercio, limpieza— aunque no tengan ninguna oferta publicada, con su correo y su teléfono.",
        ruta: "/app/empresas",
      },
      {
        titulo: "ETTs cerca de ti",
        descripcion:
          "Las empresas de trabajo temporal de tu comarca, con la distancia a cada una. Funciona en pueblos pequeños y en los 26 países, buscando con el nombre que se usa allí.",
        ruta: "/app/empresas",
        guia: "/guias/ett",
      },
      {
        titulo: "Seguimiento de los envíos",
        descripcion:
          "Qué CV salió, cuándo, si llegó, si rebotó y si lo abrieron. Sin esto no se sabe si el problema es el CV o el correo.",
        ruta: "/app/envios",
      },
      {
        titulo: "Carta de presentación personalizada",
        descripcion:
          "La carta se adapta a la empresa y al puesto con tu experiencia real. No inventa nada que no le hayas contado.",
        ruta: "/app/empresas",
        dePago: true,
      },
    ],
  },
  {
    titulo: "Buscar ofertas",
    resumen: "Millones de ofertas de 26 países en un solo sitio, con enlace, fuente y fecha.",
    funciones: [
      {
        titulo: "Buscador de empleo",
        descripcion:
          "Ofertas de varias fuentes públicas a la vez, filtrando por oficio, ciudad, país y salario. Cada una enlaza a su origen.",
        ruta: "/app/buscar",
        guia: "/guias/buscar-ofertas",
      },
      {
        titulo: "Ofertas guardadas",
        descripcion: "Guardas las que te interesan y al día siguiente no vuelves a leer las mismas.",
        ruta: "/app/guardados",
      },
      {
        titulo: "Tablero de candidaturas",
        descripcion:
          "Cada candidatura por fases: apuntada, enviada, entrevista, respuesta. Para saber a quién escribiste y cuándo toca insistir.",
        ruta: "/app/pipeline",
      },
      {
        titulo: "Avisos de ofertas nuevas",
        descripcion:
          "Notificaciones cuando entra algo de lo tuyo, para no tener que repetir la misma búsqueda cada mañana.",
        ruta: "/app/notificaciones",
      },
      {
        titulo: "Comparador de salarios",
        descripcion:
          "Lo que se paga de verdad por un puesto en cada país, calculado con las ofertas publicadas, no con encuestas.",
        ruta: "/app/salarios",
      },
      {
        titulo: "Reseñas de empresas",
        descripcion: "Lo que cuenta quien ha trabajado allí, antes de mandar el CV o de aceptar.",
        ruta: "/app/reviews",
      },
    ],
  },
  {
    titulo: "Tu candidatura",
    resumen: "Que el CV pase el primer filtro y que la entrevista no te pille en frío.",
    funciones: [
      {
        titulo: "CV con revisión ATS",
        descripcion:
          "Se analiza como lo haría el programa que filtra candidaturas en las empresas grandes, con nota y qué corregir.",
        ruta: "/app/curriculum",
        guia: "/guias/cv",
      },
      {
        titulo: "Crear o mejorar el CV con IA",
        descripcion:
          "Si no tienes CV, se monta con lo que cuentes. Si lo tienes, se ordena y se adapta a la oferta sin inventar experiencia.",
        ruta: "/app/curriculum",
      },
      {
        titulo: "Simulador de entrevista",
        descripcion:
          "Hace de entrevistador, te deja responder y te dice qué mejorarías. Es la parte que más cambia el resultado y la que casi nadie practica.",
        ruta: "/app/entrevistas",
        dePago: true,
      },
      {
        titulo: "Guzzi, el asistente",
        descripcion:
          "Le hablas como a una persona: «algo de almacén cerca de Tudela para empezar ya». Busca, compara y te dice si compensa el desplazamiento con el precio real del carburante.",
        ruta: "/app/gusi",
        guia: "/guias/guzzi",
      },
      {
        titulo: "Búsqueda por foto",
        descripcion:
          "Foto al cartel de «se necesita personal» del escaparate y se saca la empresa, el puesto y por dónde echar el CV.",
        ruta: "/app/gusi",
      },
    ],
  },
  {
    titulo: "Irte a trabajar fuera",
    resumen: "Lo que hay que mirar antes de comprar el billete, país por país.",
    funciones: [
      {
        titulo: "Guía por país",
        descripcion:
          "Papeles, primeros pasos, alojamiento y qué se cobra, para cada uno de los 26 países, con enlaces a las fuentes oficiales.",
        ruta: "/trabajar-en",
        guia: "/guias/emigrar",
      },
      {
        titulo: "Llevarte el paro",
        descripcion:
          "Cómo seguir cobrando la prestación española mientras buscas trabajo en otro país de la UE, con los plazos que la tiran si los fallas.",
        ruta: "/llevarte-el-paro",
      },
      {
        titulo: "El CV según el país",
        descripcion:
          "Dónde se pone foto y dónde resta, cuánto se estira, qué datos no se ponen. Mandar el CV español tal cual es el error más repetido.",
        ruta: "/cv-por-pais",
      },
      {
        titulo: "Au pair",
        descripcion:
          "Carta a la familia, derechos, horas y paga: lo que te pueden pedir y lo que no.",
        ruta: "/app/au-pair",
      },
    ],
  },
  {
    titulo: "Formación y extras",
    resumen: "Los papeles que piden para entrar a trabajar, y lo que te ahorra tiempo.",
    funciones: [
      {
        titulo: "Cursos y carnés",
        descripcion:
          "Qué carné piden para carretillero, manipulador de alimentos, PRL o vigilante, cuánto cuesta, cuánto dura y dónde hay opciones gratuitas.",
        ruta: "/cursos",
      },
      {
        titulo: "Acreditar tu experiencia",
        descripcion:
          "Cómo conseguir un título oficial por los años que ya llevas trabajados, sin volver a estudiar lo que ya sabes.",
        ruta: "/cursos/acreditar",
      },
      {
        titulo: "Invitar a alguien",
        descripcion: "Código para compartir con quien también esté buscando.",
        ruta: "/app/referidos",
      },
      {
        titulo: "App para iPhone y iPad",
        descripcion:
          "La misma cuenta en el móvil y en el ordenador. En Android se usa desde el navegador y se puede añadir a la pantalla de inicio.",
        ruta: "/descargar",
      },
    ],
  },
];

/** Cuántas funciones hay en total, para no escribir el número a mano. */
export const NUM_FUNCIONES = GRUPOS_FUNCIONES.reduce((n, g) => n + g.funciones.length, 0);
