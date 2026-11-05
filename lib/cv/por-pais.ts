/**
 * lib/cv/por-pais.ts — El mismo CV no vale para todos los países.
 *
 * EL PROBLEMA, Y ES NUESTRO. El editor de currículums genera un CV con foto,
 * al estilo español, y lo mandamos a ofertas de veintiséis países. En Alemania
 * eso está bien: allí la foto se espera y no ponerla se nota. En el Reino Unido
 * y en Países Bajos es al revés — muchas empresas descartan los CV con foto
 * para no exponerse a una demanda por discriminación.
 *
 * O sea que el mismo documento que ayuda en Múnich puede tumbarte en Londres, y
 * nuestro editor no le decía nada a nadie. Cero menciones de país en todo el
 * módulo de currículum, comprobado.
 *
 * ⚠️ ESTO SON CONVENCIONES, NO LEYES, y se dice así en la interfaz. Ninguna
 * norma británica prohíbe poner una foto: lo que hay es una práctica extendida
 * de descartarlos, que nace de la legislación de igualdad. Presentarlo como
 * obligación sería mentir; callarlo sería dejar que la gente se estrelle.
 *
 * El otro motivo, mas objetivo: muchos sistemas automáticos de selección
 * eliminan la imagen al procesar el archivo, y al hacerlo pueden desordenar el
 * resto del documento. Un CV que se lee raro se descarta sin que lo vea nadie.
 *
 * Fuentes, comprobadas el 2026-09-01:
 *   · Europass — Comisión Europea (formato europeo de referencia)
 *   · Prácticas de selección recogidas en guías de CV por país
 * México y Brasil, comprobadas el 2026-11-05:
 *   · Expansión (23 may 2024): el Estado de México prohíbe pedir CV con foto
 *     en sus empleos públicos ("currículum ciego").
 *   · Vagas.com, Zety Brasil y guías de carrera: en Brasil la foto no se
 *     espera, y CPF, RG y estado civil no van en el currículo. La Ley
 *     9.029/1995 castiga la discriminación al contratar.
 * Colombia, comprobada el 2026-11-05:
 *   · Allí se llama "hoja de vida". La foto es costumbre, no obligación; las
 *     plantillas y los formatos oficiales (SIGEP, de Función Pública, para
 *     empleo público) llevan tipo y número de documento. No hemos encontrado
 *     una fuente fiable sobre qué datos NO poner, así que no se inventa.
 * Perú, comprobada el 2026-11-05:
 *   · Ley 31944 (vigente desde el 26 nov 2023): en la selección no se puede
 *     exigir el certificado de antecedentes penales (basta declaración jurada)
 *     ni el reporte crediticio. Ley 26772: las ofertas no pueden pedir
 *     requisitos discriminatorios («buena presencia», según la PUCP).
 * Chile, comprobada el 2026-11-05:
 *   · Dirección del Trabajo (dt.gob.cl, art. 95023): pedir en una oferta la
 *     fotografía, la «buena presencia» o antecedentes penales o comerciales
 *     ajenos al cargo es discriminatorio (art. 2 del Código del Trabajo).
 */

export type UsoFoto = "se_espera" | "opcional" | "mejor_no";

export interface EstiloCV {
  codigo: string;
  pais: string;
  bandera: string;
  foto: UsoFoto;
  /** Cómo se llama allí el documento. Ayuda a buscar plantillas y ejemplos. */
  nombreLocal: string;
  paginas: string;
  /** Datos personales que allí NO se ponen. */
  noPongas: string[];
  /** Lo que sí se espera y aquí no solemos poner. */
  siPonen?: string[];
  nota: string;
}

export const ETIQUETA_FOTO: Record<UsoFoto, string> = {
  se_espera: "Con foto",
  opcional: "Foto opcional",
  mejor_no: "Sin foto",
};

export const COLOR_FOTO: Record<UsoFoto, string> = {
  se_espera: "#22c55e",
  opcional: "#94a3b8",
  mejor_no: "#f59e0b",
};

export const ESTILOS: EstiloCV[] = [
  {
    codigo: "ES",
    pais: "España",
    bandera: "🇪🇸",
    foto: "opcional",
    nombreLocal: "Currículum vítae",
    paginas: "1 o 2 páginas",
    noPongas: ["Estado civil", "Número de hijos", "Fecha de nacimiento, si puedes evitarla"],
    nota: "La foto es lo habitual y no penaliza, pero cada vez más empresas grandes prefieren no tenerla.",
  },
  {
    codigo: "DE",
    pais: "Alemania",
    bandera: "🇩🇪",
    foto: "se_espera",
    nombreLocal: "Lebenslauf",
    paginas: "1 o 2 páginas, en formato de tabla",
    noPongas: [],
    siPonen: [
      "Foto profesional, de estudio. Es lo normal y no ponerla se nota.",
      "Fecha y lugar al final, y en muchos casos la firma.",
      "Formación y experiencia en orden cronológico, con mes y año.",
    ],
    nota: "Es el país más formal de la lista. Un CV alemán bien hecho parece un documento oficial, y eso allí es una virtud, no un defecto.",
  },
  {
    codigo: "AT",
    pais: "Austria",
    bandera: "🇦🇹",
    foto: "se_espera",
    nombreLocal: "Lebenslauf",
    paginas: "1 o 2 páginas",
    noPongas: [],
    siPonen: ["Foto profesional, como en Alemania."],
    nota: "Mismas costumbres que Alemania.",
  },
  {
    codigo: "CH",
    pais: "Suiza",
    bandera: "🇨🇭",
    foto: "se_espera",
    nombreLocal: "Lebenslauf / CV",
    paginas: "2 páginas",
    noPongas: [],
    siPonen: ["Foto profesional.", "Nivel de idiomas detallado: allí importa mucho."],
    nota: "Se espera foto. Y ojo con el idioma del CV: depende del cantón y de la empresa.",
  },
  {
    codigo: "UK",
    pais: "Reino Unido",
    bandera: "🇬🇧",
    foto: "mejor_no",
    nombreLocal: "CV",
    paginas: "2 páginas como máximo",
    noPongas: [
      "Foto. Muchas empresas descartan los CV que la llevan para no exponerse a una reclamación por discriminación.",
      "Fecha de nacimiento y edad",
      "Estado civil",
      "Nacionalidad",
    ],
    siPonen: ["Un párrafo de perfil al principio, de dos o tres líneas.", "Referencias «disponibles a petición»."],
    nota: "Es donde más se nota la diferencia con el CV español. Quitar la foto no es cosmética: puede ser la diferencia entre que lo lean o no.",
  },
  {
    codigo: "IE",
    pais: "Irlanda",
    bandera: "🇮🇪",
    foto: "mejor_no",
    nombreLocal: "CV",
    paginas: "2 páginas",
    noPongas: ["Foto", "Fecha de nacimiento", "Estado civil"],
    nota: "Mismas costumbres que el Reino Unido.",
  },
  {
    codigo: "NL",
    pais: "Países Bajos",
    bandera: "🇳🇱",
    foto: "mejor_no",
    nombreLocal: "CV",
    paginas: "2 páginas",
    noPongas: ["Foto, sobre todo en empresas grandes", "Estado civil"],
    nota: "Antes se ponía y ha cambiado en la última década. Si la empresa es grande o internacional, mejor sin ella.",
  },
  {
    codigo: "FR",
    pais: "Francia",
    bandera: "🇫🇷",
    foto: "opcional",
    nombreLocal: "CV",
    paginas: "1 página, y se nota si te pasas",
    noPongas: ["Estado civil"],
    nota: "La foto se acepta pero ya no es obligada. Lo que sí importa es la brevedad: una página.",
  },
  {
    codigo: "IT",
    pais: "Italia",
    bandera: "🇮🇹",
    foto: "opcional",
    nombreLocal: "Curriculum vitae",
    paginas: "1 o 2 páginas",
    noPongas: [],
    siPonen: ["La autorización para tratar tus datos personales, que allí se suele incluir al final."],
    nota: "Formato europeo muy extendido. La foto es habitual.",
  },
  {
    codigo: "PT",
    pais: "Portugal",
    bandera: "🇵🇹",
    foto: "opcional",
    nombreLocal: "Currículo",
    paginas: "1 o 2 páginas",
    noPongas: [],
    nota: "Costumbres parecidas a las españolas.",
  },
  {
    codigo: "BE",
    pais: "Bélgica",
    bandera: "🇧🇪",
    foto: "opcional",
    nombreLocal: "CV",
    paginas: "2 páginas",
    noPongas: ["Estado civil"],
    nota: "Depende mucho de la región y del idioma en que escribas: neerlandés al norte, francés al sur.",
  },
  {
    codigo: "SE",
    pais: "Suecia",
    bandera: "🇸🇪",
    foto: "opcional",
    nombreLocal: "CV",
    paginas: "2 páginas",
    noPongas: ["Fecha de nacimiento", "Estado civil"],
    nota: "La foto se usa, pero lo que de verdad valoran es que el CV sea claro y directo.",
  },
  {
    codigo: "DK",
    pais: "Dinamarca",
    bandera: "🇩🇰",
    foto: "opcional",
    nombreLocal: "CV",
    paginas: "2 páginas",
    noPongas: ["Estado civil"],
    nota: "Se acostumbra a acompañar de una carta de motivación bien trabajada.",
  },
  {
    codigo: "NO",
    pais: "Noruega",
    bandera: "🇳🇴",
    foto: "opcional",
    nombreLocal: "CV",
    paginas: "2 páginas",
    noPongas: ["Estado civil"],
    nota: "Sobrio y al grano.",
  },
  {
    codigo: "US",
    pais: "Estados Unidos",
    bandera: "🇺🇸",
    foto: "mejor_no",
    nombreLocal: "Resume",
    paginas: "1 página",
    noPongas: [
      "Foto. Allí es directamente un problema legal para quien contrata.",
      "Fecha de nacimiento y edad",
      "Estado civil",
      "Nacionalidad",
    ],
    nota: "Se llama «resume», no «CV»: allí el CV es otra cosa, el documento académico largo. Una sola página y con números.",
  },
  {
    codigo: "MX",
    pais: "México",
    bandera: "🇲🇽",
    foto: "opcional",
    nombreLocal: "Currículum (CV)",
    paginas: "1 o 2 páginas",
    noPongas: [
      "CURP, RFC o número de seguridad social: se dan al contratarte",
      "Estado civil y si tienes hijos",
    ],
    nota: "La foto es habitual en empresas privadas, pero no la pongas si la oferta no la pide: el Estado de México ya la prohíbe en sus empleos públicos y cada vez más empresas la quitan.",
  },
  {
    codigo: "BR",
    pais: "Brasil",
    bandera: "🇧🇷",
    foto: "mejor_no",
    nombreLocal: "Currículo",
    paginas: "1 o 2 páginas",
    noPongas: [
      "CPF, RG o número de PIS: se dan al contratarte",
      "Estado civil",
      "Dirección completa: basta la ciudad y el estado",
    ],
    nota: "Allí la foto no se espera: ponla solo si la oferta la pide. Y si la oferta está en portugués, el currículo también.",
  },
  {
    codigo: "CO",
    pais: "Colombia",
    bandera: "🇨🇴",
    foto: "opcional",
    nombreLocal: "Hoja de vida",
    paginas: "1 o 2 páginas",
    noPongas: [],
    siPonen: ["Tipo y número de documento: cédula, cédula de extranjería o pasaporte."],
    nota: "La foto es costumbre pero no obligatoria, y las empresas con selección a ciegas la piden sin ella. Para empleos del Estado se usa el formato del SIGEP o de la convocatoria, no el tuyo.",
  },
  {
    codigo: "PE",
    pais: "Perú",
    bandera: "🇵🇪",
    foto: "opcional",
    nombreLocal: "Currículum vitae (CV)",
    paginas: "1 o 2 páginas",
    noPongas: [
      "Certificado de antecedentes penales: en la selección basta una declaración jurada, y lo comprueban solo si te eligen (Ley 31944)",
      "Tu reporte de deudas: no pueden exigírtelo ni descartarte por no darlo (Ley 31944)",
    ],
    nota: "En Perú las ofertas no pueden pedir requisitos que discriminen, como «buena presencia» (Ley 26772). Para empleos del Estado se presenta el «CV documentado» con el formato de la convocatoria.",
  },
  {
    codigo: "CL",
    pais: "Chile",
    bandera: "🇨🇱",
    foto: "opcional",
    nombreLocal: "Currículum (CV)",
    paginas: "1 o 2 páginas",
    noPongas: [
      "Certificado de antecedentes: una oferta no puede exigirlo si no tiene que ver con el puesto (Dirección del Trabajo)",
    ],
    siPonen: ["Tu RUN, cuando ya tienes cédula chilena."],
    nota: "Una oferta no puede pedirte foto ni «buena presencia»: la Dirección del Trabajo lo considera discriminación (art. 2 del Código del Trabajo). Ponla solo si quieres.",
  },
];

/**
 * Lo que vale para cualquier país, y que es lo que más CV tumba sin que nadie
 * se entere: el filtro automático.
 */
export const PARA_TODOS: string[] = [
  "Muchas empresas pasan el CV por un programa antes de que lo vea una persona. Ese programa lee texto, no diseño.",
  "Evita columnas, tablas y cajas de texto: al procesarlo se desordenan y el CV llega hecho un lío.",
  "Manda PDF salvo que te pidan otra cosa, y que el texto se pueda seleccionar. Un CV que es una imagen es un CV en blanco para el filtro.",
  "Usa las mismas palabras que la oferta. Si piden «carretillero» y tú pones «operador de maquinaria», puede que no te encuentre.",
  "Un nombre de archivo con tu nombre y el puesto. «CV.pdf» se pierde entre doscientos iguales.",
];

export const ENLACE_EUROPASS = {
  titulo: "Europass — el formato europeo de CV (Comisión Europea)",
  url: "https://europa.eu/europass/es/create-europass-cv",
};

export const ACTUALIZADO = "2026-09";

export function estiloDe(codigo: string): EstiloCV | undefined {
  const c = codigo.toUpperCase().trim();
  return ESTILOS.find(e => e.codigo === (c === "GB" ? "UK" : c));
}

/** Países donde la foto juega en tu contra. Sirve para avisar en el editor. */
export function paisesSinFoto(): EstiloCV[] {
  return ESTILOS.filter(e => e.foto === "mejor_no");
}
