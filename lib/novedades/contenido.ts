/**
 * lib/novedades/contenido.ts — Novedades y campañas de BuscayCurra.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * CÓMO PUBLICAR ALGO NUEVO (esto es lo único que hay que tocar)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 1. Copia una entrada de las de abajo y pégala ARRIBA DEL TODO del array
 *    (la lista se enseña por fecha, la más nueva primero).
 * 2. Cambia `slug` (sale en la URL: /novedades/lo-que-pongas), `titulo`,
 *    `fecha` (año-mes-día) y el texto.
 * 3. Si es un vídeo de YouTube, pon el enlace en `video` y se ve dentro de la
 *    página. Si es de TikTok, Instagram o Facebook, pon el enlace igualmente:
 *    se enseña una tarjeta que lleva al vídeo. (Los vídeos de esas redes NO se
 *    pueden incrustar aquí: la política de seguridad del sitio solo permite
 *    YouTube, y se dejó así a propósito para no abrir la web a scripts de
 *    terceros.)
 * 4. Guarda, despliega, y ya está en la web, en el mapa del sitio y en el RSS.
 *
 * REGLA: aquí solo va lo que ha pasado de verdad. Una novedad inventada para
 * rellenar se nota, y es lo contrario de por qué la gente vuelve a mirar.
 * ═══════════════════════════════════════════════════════════════════════════
 */

export type TipoNovedad = "producto" | "campana" | "nota";

export interface Novedad {
  slug: string;
  titulo: string;
  /** Año-mes-día, por ejemplo "2026-09-22". */
  fecha: string;
  tipo: TipoNovedad;
  /** Una frase. Sale en la lista, en Google y en el RSS. */
  resumen: string;
  /** El texto, un párrafo por posición. */
  cuerpo: string[];
  /** Vídeo de la campaña. YouTube se ve aquí dentro; el resto, como enlace. */
  video?: { url: string; titulo: string };
  /** Imagen del cartel o de la campaña, en /public (por ejemplo "/og-image.png"). */
  imagen?: string;
  enlaces?: Array<{ texto: string; href: string }>;
}

export const ETIQUETA_TIPO: Record<TipoNovedad, string> = {
  producto: "Novedad del producto",
  campana: "Campaña",
  nota: "Aviso",
};

export const NOVEDADES: Novedad[] = [
  {
    slug: "buscar-empresas-y-etts-en-pueblos-pequenos",
    titulo: "Buscar empresas y ETTs ya funciona en los pueblos pequeños",
    fecha: "2026-09-22",
    tipo: "producto",
    resumen:
      "Si vives en un pueblo, la búsqueda ya encuentra las ETTs de la comarca y te dice a cuántos kilómetros está cada una. Y fuera de España busca con el nombre que se usa allí.",
    cuerpo: [
      "Hasta hoy, buscar ETTs en un pueblo pequeño no daba lo que tenía que dar. Si escribías un nombre que se repite en España —hay dos Cabanillas— podías acabar viendo agencias a 300 kilómetros sin que nada te avisara. Y buscando en otro país, la consulta se hacía en español, así que en Berlín salían agencias de Barcelona.",
      "Ahora la búsqueda localiza primero el sitio que escribes, te dice cuál ha entendido y descarta lo que está lejos. En un pueblo mira también alrededor: en Fustiñana o Cabanillas te trae las ETTs de Tudela, a siete y once kilómetros, y te enseña la distancia de cada una.",
      "Fuera de España se pregunta con el nombre que se usa en cada sitio: Zeitarbeitsfirma en Alemania, uitzendbureau en Países Bajos, agence d'intérim en Francia, recruitment agency en Reino Unido e Irlanda. Son los 26 países de la aplicación.",
      "De paso se arregló algo que no se veía: la búsqueda de empresas por nombre llevaba unos días cayendo a un buscador de respaldo que no conoce las empresas pequeñas. Por eso «La Papelera de Buñuel» no aparecía. Ya aparece.",
    ],
    enlaces: [
      { texto: "Cómo encontrar las ETTs de tu zona", href: "/guias/ett" },
      { texto: "Cómo mandar el CV a una empresa", href: "/guias/enviar-cv-a-empresas" },
    ],
  },
  {
    slug: "guias-de-uso",
    titulo: "Ya hay guías de uso: cómo sacarle partido a BuscayCurra",
    fecha: "2026-09-22",
    tipo: "producto",
    resumen:
      "Seis guías paso a paso, públicas y sin cuenta, para mandar el CV a empresas, encontrar ETTs, preparar el CV y buscar trabajo fuera.",
    cuerpo: [
      "La mayoría de los puestos de un pueblo no se publican en ningún portal: se cubren porque alguien dejó el currículum. Eso es lo que hace esta aplicación, y hasta ahora no había ningún sitio donde estuviera explicado para quien todavía no tiene cuenta.",
      "Las guías cuentan, paso a paso, cómo mandar el CV a una empresa que no ha publicado oferta, cómo encontrar las ETTs de tu zona, qué se le puede pedir a Guzzi, cómo dejar el CV listo para pasar el primer filtro y por dónde se empieza si te vas a trabajar fuera.",
      "Y de paso se corrigió el centro de ayuda, que llevaba tiempo diciendo cifras que no eran: prometía dos envíos de CV al día en el plan gratuito cuando son tres, y hablaba de un plan que ya no se vende.",
    ],
    enlaces: [{ texto: "Ver las guías", href: "/guias" }],
  },
  {
    slug: "buscaycurra-en-la-app-store",
    titulo: "BuscayCurra ya se puede instalar en el iPhone",
    fecha: "2026-08-18",
    tipo: "producto",
    resumen:
      "La aplicación está publicada en la App Store. Misma cuenta que en la web: lo que guardas en el móvil lo tienes en el ordenador.",
    cuerpo: [
      "BuscayCurra está disponible en la App Store para iPhone y iPad. Se entra con la misma cuenta que en la web, así que los CVs, las ofertas guardadas y los envíos son los mismos en los dos sitios.",
      "En Android, de momento, se usa desde el navegador en buscaycurra.es, que funciona igual y se puede añadir a la pantalla de inicio.",
    ],
    enlaces: [
      { texto: "Descargar la app", href: "/descargar" },
      { texto: "Ver en la App Store", href: "https://apps.apple.com/app/buscaycurra-empleo-con-ia/id6775232067" },
    ],
  },
];

/** Las novedades, de la más nueva a la más vieja (por si alguna se pega fuera de sitio). */
export function novedadesOrdenadas(): Novedad[] {
  return [...NOVEDADES].sort((a, b) => b.fecha.localeCompare(a.fecha));
}

export function novedadPorSlug(slug: string): Novedad | undefined {
  return NOVEDADES.find((n) => n.slug === slug);
}

/** "22 de septiembre de 2026" a partir de "2026-09-22", sin depender del navegador. */
export function fechaEnEspanol(fecha: string): string {
  const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio",
    "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  const [anio, mes, dia] = fecha.split("-").map((n) => parseInt(n, 10));
  return `${dia} de ${MESES[mes - 1]} de ${anio}`;
}

/** El identificador del vídeo de YouTube, si el enlace es de YouTube. */
export function idDeYouTube(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,20})/);
  return m ? m[1] : null;
}
