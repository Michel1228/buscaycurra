/**
 * lib/especies.ts — Sistema de 50 especies de mariposas y polillas del mundo
 *
 * Distribución de rareza:
 *   - común:     25 especies (ids 1-25)
 *   - rara:      15 especies (ids 26-40)
 *   - épica:      8 especies (ids 41-48)
 *   - legendaria: 2 especies (ids 49-50)
 *
 * Asignación determinista por usuario:
 *   especieId = (hashCode(userId) % 50) + 1
 */

export type Rareza = "común" | "rara" | "épica" | "legendaria";

export interface Especie {
  id: number;
  nombre: string;
  nombreCientifico: string;
  colores: string[];
  descripcion: string;
  rareza: Rareza;
}

export const ESPECIES: Especie[] = [
  // ─── COMUNES (1–25) ────────────────────────────────────────────────────────
  {
    id: 1,
    nombre: "Mariposa Limonera",
    nombreCientifico: "Gonepteryx rhamni",
    colores: ["#F4E04D", "#C9B800", "#FFFFFF"],
    descripcion: "La constancia transforma el esfuerzo en logro.",
    rareza: "común",
  },
  {
    id: 2,
    nombre: "Mariposa Blanca de la Col",
    nombreCientifico: "Pieris brassicae",
    colores: ["#F8F8FF", "#D0D0D0", "#1A1A1A"],
    descripcion: "Lo simple y limpio siempre llama la atención.",
    rareza: "común",
  },
  {
    id: 3,
    nombre: "Mariposa Aurora",
    nombreCientifico: "Anthocharis cardamines",
    colores: ["#FF6B35", "#F8F8FF", "#2D5016"],
    descripcion: "El amanecer trae nuevas oportunidades.",
    rareza: "común",
  },
  {
    id: 4,
    nombre: "Mariposa Atalanta",
    nombreCientifico: "Vanessa atalanta",
    colores: ["#1A1A1A", "#E8230A", "#FFFFFF"],
    descripcion: "Velocidad y determinación te llevan lejos.",
    rareza: "común",
  },
  {
    id: 5,
    nombre: "Mariposa Dama Pintada",
    nombreCientifico: "Vanessa cardui",
    colores: ["#E8720C", "#1A1A1A", "#F5DEB3", "#FFFFFF"],
    descripcion: "Viaja lejos, sueña más alto.",
    rareza: "común",
  },
  {
    id: 6,
    nombre: "Mariposa Pavo Real",
    nombreCientifico: "Aglais io",
    colores: ["#B22222", "#1A1A1A", "#4169E1", "#F5DEB3"],
    descripcion: "Muestra tus colores con orgullo.",
    rareza: "común",
  },
  {
    id: 7,
    nombre: "Mariposa Ortiguera",
    nombreCientifico: "Aglais urticae",
    colores: ["#FF6600", "#1A1A1A", "#4169E1", "#F5E642"],
    descripcion: "De los lugares humildes nacen las grandes historias.",
    rareza: "común",
  },
  {
    id: 8,
    nombre: "Mariposa Coma",
    nombreCientifico: "Polygonia c-album",
    colores: ["#C07028", "#8B4513", "#1A1A1A"],
    descripcion: "Los bordes irregulares son parte de tu unicidad.",
    rareza: "común",
  },
  {
    id: 9,
    nombre: "Mariposa Náyade",
    nombreCientifico: "Melitaea cinxia",
    colores: ["#E8901A", "#1A1A1A", "#F5C842"],
    descripcion: "Persiste, aunque el camino sea difícil.",
    rareza: "común",
  },
  {
    id: 10,
    nombre: "Mariposa Mirtilo",
    nombreCientifico: "Maniola jurtina",
    colores: ["#8B6914", "#C89B3C", "#1A1A1A"],
    descripcion: "La sencillez también es elegancia.",
    rareza: "común",
  },
  {
    id: 11,
    nombre: "Mariposa Espoleta",
    nombreCientifico: "Thymelicus sylvestris",
    colores: ["#DAA520", "#8B6914", "#1A1A1A"],
    descripcion: "La rapidez de reacción es tu mayor talento.",
    rareza: "común",
  },
  {
    id: 12,
    nombre: "Mariposa Sileno",
    nombreCientifico: "Aphantopus hyperantus",
    colores: ["#4A3728", "#8B6914", "#1A1A1A", "#F5F5DC"],
    descripcion: "La oscuridad que llevas te hace más brillante.",
    rareza: "común",
  },
  {
    id: 13,
    nombre: "Mariposa Pardillo",
    nombreCientifico: "Pyronia tithonus",
    colores: ["#C8860A", "#8B4513", "#F5DEB3", "#1A1A1A"],
    descripcion: "Cada día de búsqueda te acerca a tu meta.",
    rareza: "común",
  },
  {
    id: 14,
    nombre: "Mariposa Nacarada",
    nombreCientifico: "Issoria lathonia",
    colores: ["#E8901A", "#1A1A1A", "#C0C0C0", "#F5C842"],
    descripcion: "Tu brillo interior atrae las mejores oportunidades.",
    rareza: "común",
  },
  {
    id: 15,
    nombre: "Mariposa Azul del Prado",
    nombreCientifico: "Polyommatus icarus",
    colores: ["#6EB5FF", "#003F9E", "#1A1A1A", "#F8F8FF"],
    descripcion: "El cielo no es el límite, es el comienzo.",
    rareza: "común",
  },
  {
    id: 16,
    nombre: "Mariposa Cupido",
    nombreCientifico: "Cupido minimus",
    colores: ["#7090D0", "#1A1A1A", "#F8F8FF"],
    descripcion: "Incluso lo pequeño puede conquistar grandes espacios.",
    rareza: "común",
  },
  {
    id: 17,
    nombre: "Mariposa Argos",
    nombreCientifico: "Plebejus argus",
    colores: ["#5080C0", "#2040A0", "#F8F8FF", "#E86010"],
    descripcion: "Mil ojos, mil oportunidades detectadas.",
    rareza: "común",
  },
  {
    id: 18,
    nombre: "Mariposa Canela",
    nombreCientifico: "Erynnis tages",
    colores: ["#7B4F2E", "#4A2C12", "#C89070"],
    descripcion: "El sabor genuino nunca pasa de moda.",
    rareza: "común",
  },
  {
    id: 19,
    nombre: "Polilla Ermita",
    nombreCientifico: "Macrothylacia rubi",
    colores: ["#C05020", "#8B3A0F", "#F5DEB3", "#1A1A1A"],
    descripcion: "La paciencia es la madre de la fortuna.",
    rareza: "común",
  },
  {
    id: 20,
    nombre: "Polilla del Sauce",
    nombreCientifico: "Cerura vinula",
    colores: ["#D0D0D0", "#808080", "#1A1A1A", "#FFFFFF"],
    descripcion: "La elegancia está en los detalles.",
    rareza: "común",
  },
  {
    id: 21,
    nombre: "Mariposa Esfinge Colibrí",
    nombreCientifico: "Macroglossum stellatarum",
    colores: ["#8B6914", "#1A1A1A", "#E87020", "#F5C842"],
    descripcion: "La energía que das al trabajo siempre vuelve multiplicada.",
    rareza: "común",
  },
  {
    id: 22,
    nombre: "Mariposa Melanargia",
    nombreCientifico: "Melanargia galathea",
    colores: ["#F8F8FF", "#1A1A1A", "#D0D0D0"],
    descripcion: "El equilibrio entre blanco y negro define el éxito.",
    rareza: "común",
  },
  {
    id: 23,
    nombre: "Mariposa Escarlata",
    nombreCientifico: "Callophrys rubi",
    colores: ["#2E8B57", "#006400", "#F5DEB3"],
    descripcion: "El verde de la esperanza nunca se apaga.",
    rareza: "común",
  },
  {
    id: 24,
    nombre: "Mariposa Duende",
    nombreCientifico: "Thecla betulae",
    colores: ["#8B4513", "#C87820", "#F5DEB3", "#1A1A1A"],
    descripcion: "Los pequeños detalles marcan la diferencia.",
    rareza: "común",
  },
  {
    id: 25,
    nombre: "Mariposa Mapa",
    nombreCientifico: "Araschnia levana",
    colores: ["#E8901A", "#1A1A1A", "#F5DEB3", "#FFFFFF"],
    descripcion: "Tu camino es único, como un mapa sin igual.",
    rareza: "común",
  },

  // ─── RARAS (26–40) ─────────────────────────────────────────────────────────
  {
    id: 26,
    nombre: "Mariposa Monarca",
    nombreCientifico: "Danaus plexippus",
    colores: ["#E8720C", "#1A1A1A", "#F5DEB3"],
    descripcion: "Migra, persevera, llega a tu destino.",
    rareza: "rara",
  },
  {
    id: 27,
    nombre: "Mariposa Cebra",
    nombreCientifico: "Heliconius charithonia",
    colores: ["#1A1A1A", "#FFFF00", "#FFFFFF"],
    descripcion: "Las rayas que te definen son tu fortaleza.",
    rareza: "rara",
  },
  {
    id: 28,
    nombre: "Mariposa Tigre Azul",
    nombreCientifico: "Tirumala limniace",
    colores: ["#1A1A1A", "#7BC8E8", "#FFFFFF"],
    descripcion: "La fuerza azul del cielo está en ti.",
    rareza: "rara",
  },
  {
    id: 29,
    nombre: "Mariposa Cleopatra",
    nombreCientifico: "Gonepteryx cleopatra",
    colores: ["#F4E04D", "#FF8C00", "#C9B800"],
    descripcion: "Tienes la grandeza de una reina.",
    rareza: "rara",
  },
  {
    id: 30,
    nombre: "Mariposa Isabelina",
    nombreCientifico: "Colias hecla",
    colores: ["#E8901A", "#C07028", "#1A1A1A"],
    descripcion: "El otoño también trae cosechas doradas.",
    rareza: "rara",
  },
  {
    id: 31,
    nombre: "Mariposa Emperador Púrpura",
    nombreCientifico: "Apatura iris",
    colores: ["#7B3FB5", "#4B0082", "#1A1A1A", "#F5DEB3"],
    descripcion: "La realeza se gana con trabajo, no se hereda.",
    rareza: "rara",
  },
  {
    id: 32,
    nombre: "Mariposa Morada Española",
    nombreCientifico: "Apatura metis",
    colores: ["#6A0DAD", "#4B0082", "#1A1A1A"],
    descripcion: "España te vio transformarte. Ahora conquista el mundo.",
    rareza: "rara",
  },
  {
    id: 33,
    nombre: "Polilla Io",
    nombreCientifico: "Automeris io",
    colores: ["#F5C842", "#E8901A", "#4169E1", "#1A1A1A"],
    descripcion: "El que no arriesga no gana.",
    rareza: "rara",
  },
  {
    id: 34,
    nombre: "Mariposa del Cardo",
    nombreCientifico: "Melitaea phoebe",
    colores: ["#E8720C", "#C05020", "#F5DEB3", "#1A1A1A"],
    descripcion: "Florece incluso en terrenos difíciles.",
    rareza: "rara",
  },
  {
    id: 35,
    nombre: "Polilla Seda",
    nombreCientifico: "Bombyx mori",
    colores: ["#F8F8FF", "#E8E8D0", "#D0C8A0"],
    descripcion: "Del trabajo meticuloso nace algo extraordinario.",
    rareza: "rara",
  },
  {
    id: 36,
    nombre: "Mariposa Jade",
    nombreCientifico: "Graphium agamemnon",
    colores: ["#00A36C", "#006400", "#1A1A1A", "#228B22"],
    descripcion: "El verde de la naturaleza es el color del crecimiento.",
    rareza: "rara",
  },
  {
    id: 37,
    nombre: "Mariposa Ulises",
    nombreCientifico: "Papilio ulysses",
    colores: ["#1E90FF", "#0047AB", "#1A1A1A"],
    descripcion: "El viaje hacia tu sueño es la aventura más grande.",
    rareza: "rara",
  },
  {
    id: 38,
    nombre: "Mariposa Ala de Pájaro Dorada",
    nombreCientifico: "Troides aeacus",
    colores: ["#FFD700", "#1A1A1A", "#C0A820"],
    descripcion: "El oro se consigue con esfuerzo y brillo propio.",
    rareza: "rara",
  },
  {
    id: 39,
    nombre: "Polilla Halcón de la Lavanda",
    nombreCientifico: "Macroglossum stellatarum",
    colores: ["#9B59B6", "#6C3483", "#C8A0DC", "#1A1A1A"],
    descripcion: "La determinación es tu motor.",
    rareza: "rara",
  },
  {
    id: 40,
    nombre: "Mariposa Ninfa Ártica",
    nombreCientifico: "Oeneis bore",
    colores: ["#C8A050", "#8B6914", "#F5DEB3", "#1A1A1A"],
    descripcion: "Sobrevives a los climas más fríos. El trabajo ideal te espera.",
    rareza: "rara",
  },

  // ─── ÉPICAS (41–48) ────────────────────────────────────────────────────────
  {
    id: 41,
    nombre: "Morpho Azul",
    nombreCientifico: "Morpho menelaus",
    colores: ["#1E90FF", "#0047AB", "#00BFFF", "#1A1A1A"],
    descripcion: "Hay una belleza iridiscente en todo lo que haces.",
    rareza: "épica",
  },
  {
    id: 42,
    nombre: "Polilla Luna",
    nombreCientifico: "Actias luna",
    colores: ["#B5EAD7", "#7DCE98", "#F5F5DC", "#5CB87A"],
    descripcion: "Iluminas la noche más oscura con tu luz.",
    rareza: "épica",
  },
  {
    id: 43,
    nombre: "Mariposa Cristal",
    nombreCientifico: "Greta oto",
    colores: ["#C8A882", "#3D2B1F", "#A0785A", "#F5ECD0"],
    descripcion: "La transparencia y autenticidad son tus mayores fortalezas.",
    rareza: "épica",
  },
  {
    id: 44,
    nombre: "Mariposa Cola de Golondrina",
    nombreCientifico: "Papilio machaon",
    colores: ["#FFD700", "#1A1A1A", "#3030FF", "#FF4500"],
    descripcion: "Vuelas con gracia y dejás huella donde quiera que vayas.",
    rareza: "épica",
  },
  {
    id: 45,
    nombre: "Mariposa Búho",
    nombreCientifico: "Caligo memnon",
    colores: ["#C8860A", "#8B4513", "#4A3720", "#F5DEB3"],
    descripcion: "Ves oportunidades donde otros solo ven obstáculos.",
    rareza: "épica",
  },
  {
    id: 46,
    nombre: "Polilla Calavera",
    nombreCientifico: "Acherontia atropos",
    colores: ["#5C3317", "#F5F0DC", "#222222", "#C8A050"],
    descripcion: "Lo que otros temen, tú lo conviertes en tu mayor poder.",
    rareza: "épica",
  },
  {
    id: 47,
    nombre: "Mariposa Esmeralda Brillante",
    nombreCientifico: "Cyanophrys remus",
    colores: ["#50C878", "#006400", "#00A86B", "#228B22"],
    descripcion: "El verde más puro simboliza tu nuevo comienzo.",
    rareza: "épica",
  },
  {
    id: 48,
    nombre: "Polilla Saturnia del Cerezo",
    nombreCientifico: "Saturnia pyri",
    colores: ["#C07028", "#8B4513", "#E8C880", "#7B3F00"],
    descripcion: "La grandeza nace de la paciencia y el trabajo.",
    rareza: "épica",
  },

  // ─── LEGENDARIAS (49–50) ───────────────────────────────────────────────────
  {
    id: 49,
    nombre: "Mariposa Atlas",
    nombreCientifico: "Attacus atlas",
    colores: ["#E8901A", "#FF6B35", "#C07028", "#1A1A1A", "#FFFFFF"],
    descripcion: "Llevas el mundo entero en tus alas. Eres imparable.",
    rareza: "legendaria",
  },
  {
    id: 50,
    nombre: "Birdwing Reina Alexandra",
    nombreCientifico: "Ornithoptera alexandrae",
    colores: ["#00A86B", "#006B3C", "#1A1A1A", "#C9A227"],
    descripcion: "La especie más grande del mundo nació para reinar. Como tú.",
    rareza: "legendaria",
  },
];

// ─── Función de asignación determinista ───────────────────────────────────────

/**
 * Calcula un hash numérico estable a partir de un string.
 * Siempre devuelve el mismo número para el mismo userId.
 */
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/**
 * Devuelve la especie asignada a un usuario de forma determinista.
 * El resultado es siempre el mismo para el mismo userId.
 */
export function getEspecieForUser(userId: string): Especie {
  const idx = hashCode(userId) % ESPECIES.length;
  return ESPECIES[idx];
}

/**
 * Devuelve una especie por su id (1-50).
 */
export function getEspecieById(id: number): Especie | undefined {
  return ESPECIES.find((e) => e.id === id);
}

/**
 * Colores de badge por rareza.
 */
export const RAREZA_COLORES: Record<Rareza, { bg: string; text: string; border: string }> = {
  común:      { bg: "#1a2e1a", text: "#4ade80",  border: "#4ade8040" },
  rara:       { bg: "#1a1a3e", text: "#6eb5ff",  border: "#6eb5ff40" },
  épica:      { bg: "#2e1a3e", text: "#c084fc",  border: "#c084fc40" },
  legendaria: { bg: "#3e2a00", text: "#fbbf24",  border: "#fbbf2460" },
};
