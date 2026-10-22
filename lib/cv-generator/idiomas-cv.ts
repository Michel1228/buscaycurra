/**
 * lib/cv-generator/idiomas-cv.ts — El CV en el idioma del país al que se va.
 *
 * Las diez plantillas escriben sus títulos en español ("Experiencia laboral",
 * "Formación", "Idiomas"…) y los niveles de idioma ("Nativo", "Avanzado"…).
 * En vez de tocar las diez, generarCV() pasa el HTML por localizarCV() cuando
 * el CV lleva otro idioma: un solo sitio, y una plantilla nueva sale traducida
 * sin hacer nada.
 *
 * El contenido (perfil, puestos, tareas) lo traduce la IA en
 * lib/cv-generator/traducir.ts; aquí solo lo que pone la plantilla.
 */

export type IdiomaCV = "es" | "en" | "de" | "fr" | "pt" | "it" | "nl";

export const IDIOMAS_CV: { codigo: Exclude<IdiomaCV, "es">; nombre: string; paises: string }[] = [
  { codigo: "en", nombre: "Inglés", paises: "Reino Unido, Irlanda, EE. UU., Canadá, Australia…" },
  { codigo: "de", nombre: "Alemán", paises: "Alemania, Austria, Suiza" },
  { codigo: "fr", nombre: "Francés", paises: "Francia, Bélgica, Suiza, Canadá" },
  { codigo: "pt", nombre: "Portugués", paises: "Portugal" },
  { codigo: "it", nombre: "Italiano", paises: "Italia" },
  { codigo: "nl", nombre: "Neerlandés", paises: "Países Bajos, Bélgica" },
];

export function esIdiomaCV(x: unknown): x is IdiomaCV {
  return typeof x === "string" && ["es", "en", "de", "fr", "pt", "it", "nl"].includes(x);
}

type Rotulos = {
  perfilProfesional: string; experienciaLaboral: string; experiencia: string; formacion: string;
  aptitudes: string; habilidades: string; idiomas: string; contacto: string; sobreMi: string;
  miPerfil: string; perfil: string; foto: string;
  nativo: string; avanzado: string; intermedio: string; basico: string; nociones: string;
  // Plantilla Sencilla (22 oct 2026): el título, los datos personales y sus etiquetas.
  curriculumVitae: string; datosPersonales: string; nombreApellidos: string; profesion: string;
  localidad: string; telefono: string; correo: string;
};

const ROTULOS: Record<Exclude<IdiomaCV, "es">, Rotulos> = {
  en: {
    perfilProfesional: "Professional profile", experienciaLaboral: "Work experience", experiencia: "Experience",
    formacion: "Education", aptitudes: "Skills", habilidades: "Skills", idiomas: "Languages", contacto: "Contact",
    sobreMi: "About me", miPerfil: "My profile", perfil: "Profile", foto: "Photo",
    nativo: "Native", avanzado: "Advanced", intermedio: "Intermediate", basico: "Basic", nociones: "Elementary",
    curriculumVitae: "Curriculum Vitae", datosPersonales: "Personal details", nombreApellidos: "Full name", profesion: "Profession", localidad: "Location", telefono: "Phone", correo: "Email",
  },
  de: {
    perfilProfesional: "Berufsprofil", experienciaLaboral: "Berufserfahrung", experiencia: "Erfahrung",
    formacion: "Ausbildung", aptitudes: "Kenntnisse", habilidades: "Fähigkeiten", idiomas: "Sprachen", contacto: "Kontakt",
    sobreMi: "Über mich", miPerfil: "Mein Profil", perfil: "Profil", foto: "Foto",
    nativo: "Muttersprache", avanzado: "Fortgeschritten", intermedio: "Mittelstufe", basico: "Grundkenntnisse", nociones: "Anfänger",
    curriculumVitae: "Lebenslauf", datosPersonales: "Persönliche Daten", nombreApellidos: "Vor- und Nachname", profesion: "Beruf", localidad: "Wohnort", telefono: "Telefon", correo: "E-Mail",
  },
  fr: {
    perfilProfesional: "Profil professionnel", experienciaLaboral: "Expérience professionnelle", experiencia: "Expérience",
    formacion: "Formation", aptitudes: "Compétences", habilidades: "Compétences", idiomas: "Langues", contacto: "Contact",
    sobreMi: "À propos de moi", miPerfil: "Mon profil", perfil: "Profil", foto: "Photo",
    nativo: "Langue maternelle", avanzado: "Avancé", intermedio: "Intermédiaire", basico: "Élémentaire", nociones: "Notions",
    curriculumVitae: "Curriculum vitae", datosPersonales: "Informations personnelles", nombreApellidos: "Nom et prénom", profesion: "Profession", localidad: "Localité", telefono: "Téléphone", correo: "E-mail",
  },
  pt: {
    perfilProfesional: "Perfil profissional", experienciaLaboral: "Experiência profissional", experiencia: "Experiência",
    formacion: "Formação", aptitudes: "Competências", habilidades: "Competências", idiomas: "Idiomas", contacto: "Contacto",
    sobreMi: "Sobre mim", miPerfil: "O meu perfil", perfil: "Perfil", foto: "Foto",
    nativo: "Nativo", avanzado: "Avançado", intermedio: "Intermédio", basico: "Básico", nociones: "Noções",
    curriculumVitae: "Curriculum vitae", datosPersonales: "Dados pessoais", nombreApellidos: "Nome completo", profesion: "Profissão", localidad: "Localidade", telefono: "Telefone", correo: "E-mail",
  },
  it: {
    perfilProfesional: "Profilo professionale", experienciaLaboral: "Esperienza lavorativa", experiencia: "Esperienza",
    formacion: "Formazione", aptitudes: "Competenze", habilidades: "Competenze", idiomas: "Lingue", contacto: "Contatti",
    sobreMi: "Chi sono", miPerfil: "Il mio profilo", perfil: "Profilo", foto: "Foto",
    nativo: "Madrelingua", avanzado: "Avanzato", intermedio: "Intermedio", basico: "Base", nociones: "Elementare",
    curriculumVitae: "Curriculum vitae", datosPersonales: "Dati personali", nombreApellidos: "Nome e cognome", profesion: "Professione", localidad: "Località", telefono: "Telefono", correo: "E-mail",
  },
  nl: {
    perfilProfesional: "Professioneel profiel", experienciaLaboral: "Werkervaring", experiencia: "Ervaring",
    formacion: "Opleiding", aptitudes: "Vaardigheden", habilidades: "Vaardigheden", idiomas: "Talen", contacto: "Contact",
    sobreMi: "Over mij", miPerfil: "Mijn profiel", perfil: "Profiel", foto: "Foto",
    nativo: "Moedertaal", avanzado: "Gevorderd", intermedio: "Gemiddeld", basico: "Basis", nociones: "Beginner",
    curriculumVitae: "Curriculum vitae", datosPersonales: "Persoonlijke gegevens", nombreApellidos: "Voor- en achternaam", profesion: "Beroep", localidad: "Woonplaats", telefono: "Telefoon", correo: "E-mail",
  },
};

/** Texto de la plantilla en español → clave del diccionario. Los más largos primero. */
const TITULOS: [string, keyof Rotulos][] = [
  ["Perfil profesional", "perfilProfesional"], ["Perfil Profesional", "perfilProfesional"],
  ["Experiencia laboral", "experienciaLaboral"], ["Experiencia Laboral", "experienciaLaboral"],
  ["Experiencia", "experiencia"], ["Formación", "formacion"], ["Aptitudes", "aptitudes"],
  ["Habilidades", "habilidades"], ["Idiomas", "idiomas"], ["Contacto", "contacto"],
  ["Sobre mí", "sobreMi"], ["Mi perfil", "miPerfil"], ["Perfil", "perfil"],
  ["Currículum vitae", "curriculumVitae"], ["Datos personales", "datosPersonales"], ["Nombre y apellidos", "nombreApellidos"],
  ["Profesión", "profesion"], ["Localidad", "localidad"], ["Teléfono", "telefono"], ["Correo electrónico", "correo"],
];

const NIVELES: [string, keyof Rotulos][] = [
  ["Nativo", "nativo"], ["Avanzado", "avanzado"], ["Intermedio", "intermedio"],
  ["Básico", "basico"], ["Nociones", "nociones"],
];

const escRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Traduce lo que escribe la plantilla. Solo toca:
 *   · títulos que ocupan un elemento entero (">Formación<"), no palabras sueltas
 *     dentro de un párrafo;
 *   · los niveles de idioma, que las plantillas ponen como palabra suelta;
 *   · lang="es" y el alt="Foto".
 * En español devuelve el HTML tal cual.
 */
export function localizarCV(html: string, idioma: string | undefined): string {
  if (!idioma || idioma === "es" || !esIdiomaCV(idioma)) return html;
  const r = ROTULOS[idioma as Exclude<IdiomaCV, "es">];
  let out = html.replace(/<html([^>]*)\blang="es"/i, `<html$1lang="${idioma}"`);
  for (const [es, clave] of TITULOS) {
    out = out.replace(new RegExp(`>(\\s*)${escRe(es)}(\\s*)<`, "g"), `>$1${r[clave]}$2<`);
  }
  for (const [es, clave] of NIVELES) {
    out = out.replace(new RegExp(`(^|[^\\p{L}])${escRe(es)}(?![\\p{L}])`, "gu"), `$1${r[clave]}`);
  }
  return out.replace(/alt="Foto"/g, `alt="${r.foto}"`).replace(/(📷<br>)Foto/g, `$1${r.foto}`);
}
