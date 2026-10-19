/**
 * lib/entrevistas/preguntas.ts — Lo que pregunta el simulador de entrevistas.
 *
 * Cada pregunta y cada frase del entrevistador está GRABADA con la misma voz
 * (public/voz/entrevista/<id>.mp3), elegida por Michel el 18 oct 2026 para que
 * suene tranquila y dé confianza. Antes se leía con la voz que trajera cada
 * móvil: distinta en cada uno, a menudo robótica, y en la app de Android muda.
 *
 * ⚠️ Si cambias un texto, hay que volver a grabarlo (scripts/grabar-voz-entrevista.mjs):
 * el sello compara cada texto con lib/entrevistas/voz-grabada.json y se para si
 * lo que se oye ya no es lo que se lee.
 *
 * Los sectores nuevos (almacén, limpieza, obra, transporte y cuidados) son donde
 * está casi toda nuestra gente; antes solo había general, hostelería,
 * tecnología, comercio y salud.
 */

export type SectorEntrevista =
  | "general" | "hosteleria" | "almacen" | "limpieza" | "construccion"
  | "transporte" | "cuidados" | "comercio" | "salud" | "tecnologia";

export interface Pregunta {
  /** Nombre del audio: public/voz/entrevista/<id>.mp3 */
  id: string;
  texto: string;
}

export const SECTORES_ENTREVISTA: { id: SectorEntrevista; label: string }[] = [
  { id: "general", label: "General" },
  { id: "hosteleria", label: "Hostelería" },
  { id: "almacen", label: "Almacén y logística" },
  { id: "limpieza", label: "Limpieza" },
  { id: "construccion", label: "Obra y oficios" },
  { id: "transporte", label: "Transporte y reparto" },
  { id: "cuidados", label: "Cuidado de personas" },
  { id: "comercio", label: "Comercio" },
  { id: "salud", label: "Salud" },
  { id: "tecnologia", label: "Tecnología" },
];

const TEXTOS: Record<SectorEntrevista, string[]> = {
  general: [
    "Háblame de ti y de tu experiencia profesional.",
    "¿Por qué quieres trabajar con nosotros?",
    "¿Cuál es tu mayor fortaleza y tu mayor debilidad?",
    "¿Dónde te ves dentro de cinco años?",
    "Cuéntame algún conflicto en el trabajo que hayas resuelto.",
    "¿Por qué dejaste tu último trabajo?",
    "¿Qué te motiva en tu día a día en el trabajo?",
  ],
  hosteleria: [
    "¿Cómo atiendes a un cliente que no está contento con su plato?",
    "Cuéntame alguna vez que hayas trabajado con mucha presión, en cocina o en sala.",
    "¿Qué harías si un compañero no aparece y tienes que cubrir su turno?",
    "¿Cómo te organizas cuando tienes varias mesas a la vez?",
    "Háblame de tu experiencia con los alérgenos y la seguridad alimentaria.",
  ],
  almacen: [
    "Cuéntame tu experiencia en almacén. ¿Con qué máquinas has trabajado?",
    "¿Cómo te organizas para preparar pedidos rápido y sin equivocarte?",
    "Si ves que un compañero maneja la carretilla de forma peligrosa, ¿qué haces?",
    "¿Qué tal llevas los turnos de noche o de fin de semana?",
    "Cuéntame alguna vez que hubo muchísimo trabajo. ¿Cómo lo sacasteis adelante?",
  ],
  limpieza: [
    "Cuéntame dónde has trabajado limpiando y qué tareas hacías.",
    "¿Cómo te organizas para limpiar una zona grande en poco tiempo?",
    "¿Qué precauciones tomas con los productos de limpieza?",
    "Si un cliente se queja de que algo no está bien limpio, ¿qué haces?",
    "Este trabajo suele ser a primera hora o por la tarde. ¿Qué horarios te vienen bien?",
  ],
  construccion: [
    "Cuéntame en qué obras has trabajado y qué hacías en ellas.",
    "¿Qué medidas de seguridad sigues siempre en una obra?",
    "Si el encargado te pide algo que crees que no es seguro, ¿qué haces?",
    "¿Qué herramientas o máquinas sabes manejar?",
    "Cuéntame algún problema que surgiera en una obra y cómo lo resolvisteis.",
  ],
  transporte: [
    "¿Qué carnés tienes y qué vehículos has conducido trabajando?",
    "¿Cómo planificas una ruta con muchas entregas?",
    "Si llegas a una entrega y el cliente no está, ¿qué haces?",
    "¿Cómo llevas el tráfico, las prisas y los horarios ajustados?",
    "¿Has tenido alguna incidencia en la carretera? Cuéntame cómo la resolviste.",
  ],
  cuidados: [
    "Cuéntame tu experiencia cuidando de personas mayores, dependientes o niños.",
    "¿Qué haces si la persona a la que cuidas no quiere comer o tomarse la medicación?",
    "¿Cómo tratas con la familia cuando no está de acuerdo con algo que haces?",
    "Cuéntame alguna situación difícil cuidando a alguien y cómo la llevaste.",
    "¿Qué haces para cuidarte tú y no quemarte en este trabajo?",
  ],
  comercio: [
    "¿Cómo ayudarías a decidirse a un cliente que no lo tiene claro?",
    "Cuéntame alguna venta que te saliera especialmente bien.",
    "¿Cómo llevas los objetivos de ventas de cada mes?",
    "Un cliente quiere devolver un producto fuera de plazo. ¿Qué haces?",
    "¿Cómo te organizas cuando tienes varios clientes a la vez?",
  ],
  salud: [
    "¿Cómo llevas la carga emocional de trabajar con pacientes?",
    "Cuéntame alguna emergencia que hayas tenido que atender.",
    "¿Cómo le das una mala noticia a un paciente o a su familia?",
    "¿Cómo priorizas cuando tienes varios pacientes urgentes?",
    "Háblame de tu experiencia trabajando en un equipo con distintos profesionales.",
  ],
  tecnologia: [
    "¿Cuál ha sido el proyecto más complicado en el que has trabajado?",
    "¿Cómo te mantienes al día con las nuevas tecnologías?",
    "Cuéntame alguna vez que hayas tenido que aprender algo nuevo muy rápido.",
    "¿Cómo le explicas algo técnico a alguien que no es del sector?",
    "Háblame de un error difícil que hayas resuelto.",
  ],
};

export const PREGUNTAS: Record<SectorEntrevista, Pregunta[]> = Object.fromEntries(
  (Object.keys(TEXTOS) as SectorEntrevista[]).map(s => [s, TEXTOS[s].map((texto, i) => ({ id: `${s}-${i + 1}`, texto }))]),
) as Record<SectorEntrevista, Pregunta[]>;

/** Lo que dice el entrevistador entre pregunta y pregunta. También grabado. */
export const FRASES = {
  bienvenida: "Hola, ¿qué tal? Gracias por venir. Esto es solo un ensayo, así que tómatelo con calma: aquí no hay respuestas perfectas. Cuando quieras, empezamos.",
  "acuse-1": "Gracias por contármelo. Te dejo un par de ideas.",
  "acuse-2": "Vale, muy bien. Mira lo que he visto.",
  "acuse-3": "Gracias. A ver, te cuento qué tal te ha salido.",
  siguiente: "Vamos con la siguiente.",
  cierre: "Hemos terminado. Gracias por practicar: cada ensayo hace que la entrevista de verdad cueste un poco menos. Aquí tienes lo que mejor se te da.",
} as const;

export type IdFrase = keyof typeof FRASES;

/** Todo lo que hay que tener grabado: frases y preguntas. */
export function textosGrabados(): Pregunta[] {
  return [
    ...(Object.keys(FRASES) as IdFrase[]).map(id => ({ id, texto: FRASES[id] })),
    ...Object.values(PREGUNTAS).flat(),
  ];
}

export function esSector(v: unknown): v is SectorEntrevista {
  return typeof v === "string" && v in TEXTOS;
}

const sinTildes = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/**
 * El sector de las preguntas según los puestos del CV. El orden importa:
 * "camarera de pisos" es limpieza aunque lleve "camarera", y "auxiliar de
 * ayuda a domicilio" es cuidados aunque se parezca a "auxiliar de enfermería".
 */
const REGLAS: [SectorEntrevista, RegExp][] = [
  ["limpieza", /limpi|de pisos|gobernant|cristaler/],
  ["cuidados", /cuidador|geriatr|gerocultor|domicilio|sociosanitari|dependencia|niñer|ninera|au pair|canguro/],
  ["salud", /enfermer|tcae|medic|sanitari|fisioterap|farmac|celador|odontolog|higienist/],
  ["hosteleria", /camarer|cocin|pinche|friegaplatos|barra|barista|hostel|restaura|hotel|sala|office|pizzer|panader/],
  ["transporte", /conductor|chofer|camion|repart|transport|mensajer|rider|trailer/],
  ["almacen", /almac|mozo|carretiller|logistic|pedidos|picking|fabrica|envasad|produccion/],
  ["construccion", /albañil|albanil|peon|obra|encofrador|ferrallist|construcc|pintor|fontaner|electricist|soldador|carpinter|instalador|mantenimiento/],
  ["comercio", /dependient|vendedor|cajer|reponedor|comercial|tienda|ventas|atencion al cliente|teleoperador/],
  ["tecnologia", /programador|desarrollador|informatic|software|sistemas|developer|devops|datos|frontend|backend/],
];

export function sectorDePuestos(puestos: string[]): SectorEntrevista | null {
  for (const p of puestos) {
    const t = sinTildes(p);
    for (const [sector, re] of REGLAS) if (re.test(t)) return sector;
  }
  return null;
}

/** El sector del perfil (mismo enum que las ofertas) al de las preguntas. */
export function sectorDePerfil(sector: unknown): SectorEntrevista | null {
  const mapa: Record<string, SectorEntrevista> = {
    HOSTELERIA: "hosteleria", INDUSTRIA: "almacen", CONSTRUCCION: "construccion",
    TRANSPORTE: "transporte", COMERCIO: "comercio", SALUD: "salud", TECNOLOGIA: "tecnologia",
  };
  return typeof sector === "string" ? mapa[sector.toUpperCase()] ?? null : null;
}
