/**
 * lib/au-pair.ts
 * Detector y utilidades para ofertas de tipo Au Pair / Niñera / Childcare
 * Tipos alineados con la tabla au_pair_profiles en Supabase.
 */

// Palabras clave que identifican ofertas de tipo au pair / cuidado de niños
const AU_PAIR_KEYWORDS = [
  "au pair", "aupair", "nanny", "niñera", "nanny", "nanny live-in",
  "childcare", "child care", "babysitter", "baby sitter", "canguro",
  "live-in caregiver", "au-pair", "au pair live", "dem pair",
];

/**
 * Detecta si una oferta es de tipo au pair basándose en el título
 */
export function esOfertaAuPair(titulo: string | null | undefined): boolean {
  if (!titulo) return false;
  const t = titulo.toLowerCase().trim();
  return AU_PAIR_KEYWORDS.some(kw => t.includes(kw));
}

/**
 * Tipo para referencias del perfil Au Pair (columna references_json)
 */
export interface AuPairReference {
  nombre: string;
  email: string;
  telefono: string;
  relacion: string;
}

/**
 * Tipo completo del perfil Au Pair — alineado con la tabla au_pair_profiles
 */
export interface AuPairProfile {
  id?: string;
  user_id: string;
  /** Carta de presentación / Dear Family letter */
  letter_text: string;
  nombre: string;
  age: number | null;
  nationality: string;
  ciudad: string;
  languages: string[];
  childcare_experience: string;
  has_driving_license: boolean;
  available_from: string | null;
  available_to: string | null;
  dietary_info: string;
  hobbies: string;
  nivel_educativo: string;
  fumador: boolean;
  primeros_auxilios: boolean;
  sabe_nadar: boolean;
  duracion_preferida: string;
  photos: string[];
  references_json: AuPairReference[];
  created_at?: string;
  updated_at?: string;
}

/**
 * Row type exactly matching the Supabase au_pair_profiles table.
 * Use this when reading/writing to the database directly.
 */
export interface AuPairProfileRow {
  id: string;
  user_id: string;
  letter_text: string | null;
  nombre: string | null;
  age: number | null;
  nationality: string | null;
  ciudad: string | null;
  languages: string[] | null;
  childcare_experience: string | null;
  has_driving_license: boolean | null;
  available_from: string | null;
  available_to: string | null;
  dietary_info: string | null;
  hobbies: string | null;
  nivel_educativo: string | null;
  fumador: boolean | null;
  primeros_auxilios: boolean | null;
  sabe_nadar: boolean | null;
  duracion_preferida: string | null;
  photos: string[] | null;
  references_json: AuPairReference[] | null;
  created_at: string | null;
  updated_at: string | null;
}

/**
 * Plantilla guiada para la "Dear Family Letter"
 */
export function generarPlantillaLetter(datos: {
  nombre?: string;
  edad?: number;
  nacionalidad?: string;
  ciudad?: string;
  idiomas?: string[];
  experiencia?: string;
  hobbies?: string;
  paisDestino?: string;
  nivelEducativo?: string;
  duracion?: string;
  fotos?: string[];
}): string {
  const nombre = datos.nombre || "[Tu nombre]";
  const edad = datos.edad || "[Tu edad]";
  const nacionalidad = datos.nacionalidad || "[Tu nacionalidad]";
  const ciudad = datos.ciudad || "[Tu ciudad]";
  const idiomas = datos.idiomas?.join(", ") || "[Idiomas que hablas]";
  const experiencia = datos.experiencia || "[Describe tu experiencia con niños: edades, contexto, duración]";
  const hobbies = datos.hobbies || "[Tus hobbies, intereses, personalidad]";
  const pais = datos.paisDestino || "[País de destino]";
  const nivelEducativo = datos.nivelEducativo || "";
  const duracion = datos.duracion || "";

  return `Dear Host Family,

My name is ${nombre}, I am ${edad} years old and I am from ${ciudad}, ${nacionalidad}. 
${nivelEducativo ? `I have completed ${nivelEducativo}. ` : ""}I speak ${idiomas}.

I am writing to express my sincere interest in becoming your au pair in ${pais}. 
I have always loved spending time with children and I am excited about the opportunity 
to become part of your family, help with childcare, and experience your culture.
${duracion ? `\nI am looking for a stay of ${duracion}.` : ""}

${experiencia}

In my free time, I enjoy ${hobbies}. I am a responsible, caring, and flexible person 
who values open communication and mutual respect.

I have a valid driving license and I am comfortable with light household tasks 
related to the children.

I would love the opportunity to talk with you via video call so we can get to know 
each other better. Please feel free to ask me any questions.

Thank you for considering my application. I hope to hear from you soon!

Warm regards,
${nombre}`;
}

/**
 * Países con programas au pair activos (para filtrar ofertas)
 */
export const PAISES_AU_PAIR = [
  "UK", "IE", "US", "CA", "AU", "NZ",
  "DE", "FR", "NL", "BE", "CH", "AT",
  "SE", "NO", "DK", "FI", "IT", "PT",
  "ES",
];
