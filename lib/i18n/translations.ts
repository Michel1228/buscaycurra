/**
 * Traducciones BuscayCurra — 12 idiomas europeos
 * Clave: texto en español → traducciones simplificadas
 */

export const IDIOMAS = [
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "it", name: "Italiano", flag: "🇮🇹" },
  { code: "pt", name: "Português", flag: "🇵🇹" },
  { code: "nl", name: "Nederlands", flag: "🇳🇱" },
  { code: "pl", name: "Polski", flag: "🇵🇱" },
  { code: "sv", name: "Svenska", flag: "🇸🇪" },
  { code: "da", name: "Dansk", flag: "🇩🇰" },
  { code: "fi", name: "Suomi", flag: "🇫🇮" },
  { code: "no", name: "Norsk", flag: "🇳🇴" },
] as const;

export type IdiomaCode = (typeof IDIOMAS)[number]["code"];

const TRAD: Record<string, Record<string, string>> = {
  // ─── Nav ─────────────────────────────────────────────────
  Inicio:     { en: "Home", fr: "Accueil", de: "Start", it: "Home", pt: "Início", nl: "Home", pl: "Start", sv: "Hem", da: "Hjem", fi: "Koti", no: "Hjem" },
  "Mi CV":    { en: "My CV", fr: "Mon CV", de: "Mein CV", it: "Il mio CV", pt: "Meu CV", nl: "Mijn CV", pl: "Moje CV", sv: "Mitt CV", da: "Mit CV", fi: "CV", no: "Min CV" },
  Buscar:     { en: "Search", fr: "Chercher", de: "Suchen", it: "Cerca", pt: "Buscar", nl: "Zoeken", pl: "Szukaj", sv: "Sök", da: "Søg", fi: "Etsi", no: "Søk" },
  Envíos:     { en: "Applications", fr: "Candidatures", de: "Bewerbungen", it: "Candidature", pt: "Candidaturas", nl: "Sollicitaties", pl: "Aplikacje", sv: "Ansökningar", da: "Ansøgninger", fi: "Hakemukset", no: "Søknader" },
  Perfil:     { en: "Profile", fr: "Profil", de: "Profil", it: "Profilo", pt: "Perfil", nl: "Profiel", pl: "Profil", sv: "Profil", da: "Profil", fi: "Profiili", no: "Profil" },
  Entrevistas: { en: "Interviews", fr: "Entretiens", de: "Vorstellungsgespräche", it: "Colloqui", pt: "Entrevistas", nl: "Sollicitatiegesprekken", pl: "Rozmowy", sv: "Intervjuer", da: "Samtaler", fi: "Haastattelut", no: "Intervjuer" },
  "Cerrar sesión": { en: "Log out", fr: "Déconnexion", de: "Abmelden", it: "Esci", pt: "Sair", nl: "Uitloggen", pl: "Wyloguj", sv: "Logga ut", da: "Log ud", fi: "Kirjaudu ulos", no: "Logg ut" },

  // ─── Landing ─────────────────────────────────────────────
  "Encuentra trabajo con IA": {
    en: "Find jobs with AI", fr: "Trouve un emploi avec l'IA", de: "Finde Jobs mit KI",
    it: "Trova lavoro con l'IA", pt: "Encontra trabalho com IA", nl: "Vind werk met AI",
    pl: "Znajdź pracę z AI", sv: "Hitta jobb med AI", da: "Find job med AI",
    fi: "Löydä töitä tekoälyllä", no: "Finn jobb med AI"
  },
  "El asistente inteligente que busca, envía tu CV y te consigue entrevistas": {
    en: "The smart assistant that searches, sends your CV and gets you interviews",
    fr: "L'assistant intelligent qui cherche, envoie ton CV et te décroche des entretiens",
    de: "Der smarte Assistent, der sucht, dein CV verschickt und dir Vorstellungsgespräche besorgt",
    it: "L'assistente intelligente che cerca, invia il tuo CV e ti procura colloqui",
    pt: "O assistente inteligente que procura, envia o teu CV e consegue-te entrevistas",
    nl: "De slimme assistent die zoekt, je CV verstuurt en interviews voor je regelt",
    pl: "Inteligentny asystent, który szuka, wysyła CV i załatwia rozmowy",
    sv: "Den smarta assistenten som söker, skickar ditt CV och fixar intervjuer",
    da: "Den smarte assistent der søger, sender dit CV og skaffer dig samtaler",
    fi: "Älykäs assistentti, joka etsii, lähettää CV:si ja hankkii haastatteluja",
    no: "Den smarte assistenten som søker, sender CV-en din og skaffer deg intervjuer"
  },
  "Empieza gratis": {
    en: "Start free", fr: "Commence gratuitement", de: "Kostenlos starten",
    it: "Inizia gratis", pt: "Começa grátis", nl: "Begin gratis",
    pl: "Zacznij za darmo", sv: "Börja gratis", da: "Start gratis",
    fi: "Aloita ilmaiseksi", no: "Start gratis"
  },

  // ─── Search ──────────────────────────────────────────────
  "Buscar ofertas": { en: "Search jobs", fr: "Chercher des offres", de: "Jobs suchen", it: "Cerca offerte", pt: "Procurar ofertas", nl: "Vacatures zoeken", pl: "Szukaj ofert", sv: "Sök jobb", da: "Søg job", fi: "Etsi työpaikkoja", no: "Søk jobber" },
  "Ofertas encontradas": { en: "Jobs found", fr: "Offres trouvées", de: "Jobs gefunden", it: "Offerte trovate", pt: "Ofertas encontradas", nl: "Vacatures gevonden", pl: "Znaleziono ofert", sv: "Jobb hittade", da: "Job fundet", fi: "Työpaikkoja löytyi", no: "Jobber funnet" },
};

export function t(key: string, lang: IdiomaCode): string {
  if (lang === "es") return key;
  const entry = TRAD[key];
  if (!entry) return key;
  return entry[lang] || key;
}

/**
 * Obtiene el idioma guardado o detecta del navegador
 */
export function getIdiomaInicial(): IdiomaCode {
  if (typeof window === "undefined") return "es";
  const saved = localStorage.getItem("bc-lang") as IdiomaCode | null;
  if (saved && IDIOMAS.some(i => i.code === saved)) return saved;
  
  const navLang = navigator.language.slice(0, 2);
  if (IDIOMAS.some(i => i.code === navLang)) return navLang as IdiomaCode;
  
  return "es";
}
