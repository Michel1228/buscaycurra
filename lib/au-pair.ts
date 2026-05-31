/**
 * lib/au-pair.ts
 * Detector y utilidades para ofertas de tipo Au Pair / Niñera / Childcare
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
 * Tipo para el perfil Au Pair
 */
export interface AuPairProfile {
  id?: string;
  user_id: string;
  letter_text: string;
  age: number | null;
  nationality: string;
  languages: string[];
  childcare_experience: string;
  has_driving_license: boolean;
  available_from: string | null;
  available_to: string | null;
  dietary_info: string;
  hobbies: string;
  photos: string[];
  references_json: AuPairReference[];
  created_at?: string;
  updated_at?: string;
}

export interface AuPairReference {
  nombre: string;
  email: string;
  telefono: string;
  relacion: string;
}

/**
 * Plantilla guiada para la "Dear Family Letter"
 */
export function generarPlantillaLetter(datos: {
  nombre?: string;
  edad?: number;
  nacionalidad?: string;
  idiomas?: string[];
  experiencia?: string;
  hobbies?: string;
  paisDestino?: string;
}): string {
  const nombre = datos.nombre || "[Tu nombre]";
  const edad = datos.edad || "[Tu edad]";
  const nacionalidad = datos.nacionalidad || "[Tu nacionalidad]";
  const idiomas = datos.idiomas?.join(", ") || "[Idiomas que hablas]";
  const experiencia = datos.experiencia || "[Describe tu experiencia con niños: edades, contexto, duración]";
  const hobbies = datos.hobbies || "[Tus hobbies, intereses, personalidad]";
  const pais = datos.paisDestino || "[País de destino]";

  return `Dear Host Family,

My name is ${nombre}, I am ${edad} years old and I am from ${nacionalidad}. 
I speak ${idiomas}.

I am writing to express my sincere interest in becoming your au pair in ${pais}. 
I have always loved spending time with children and I am excited about the opportunity 
to become part of your family, help with childcare, and experience your culture.

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
