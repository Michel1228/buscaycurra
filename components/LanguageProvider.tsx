"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { getIdiomaInicial, type IdiomaCode, IDIOMAS } from "@/lib/i18n/translations";

type LanguageContextType = {
  lang: IdiomaCode;
  setLang: (code: IdiomaCode) => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextType>({
  lang: "es",
  setLang: () => {},
  t: (key: string) => key,
});

function translate(key: string, lang: IdiomaCode): string {
  if (lang === "es") return key;
  const quick: Record<string, Record<string, string>> = {
    "Inicio": { en: "Home", fr: "Accueil", de: "Start", it: "Home", pt: "Início" },
    "Mi CV": { en: "My CV", fr: "Mon CV", de: "Mein CV", it: "Il mio CV", pt: "Meu CV" },
    "Buscar": { en: "Search", fr: "Chercher", de: "Suchen", it: "Cerca", pt: "Buscar" },
    "Envíos": { en: "Applications", fr: "Candidatures", de: "Bewerbungen", it: "Candidature", pt: "Candidaturas" },
    "Perfil": { en: "Profile", fr: "Profil", de: "Profil", it: "Profilo", pt: "Perfil" },
    "Entrevistas": { en: "Interviews", fr: "Entretiens", de: "Vorstellungsgespräche", it: "Colloqui", pt: "Entrevistas" },
    "Cerrar sesión": { en: "Log out", fr: "Déconnexion", de: "Abmelden", it: "Esci", pt: "Sair" },
    "Guzzi": { en: "Guzzi", fr: "Guzzi", de: "Guzzi", it: "Guzzi", pt: "Guzzi" },
    "Guardados": { en: "Saved", fr: "Sauvegardés", de: "Gespeichert", it: "Salvati", pt: "Guardados" },
    "Pipeline": { en: "Pipeline", fr: "Pipeline", de: "Pipeline", it: "Pipeline", pt: "Pipeline" },
    "Salarios": { en: "Salaries", fr: "Salaires", de: "Gehälter", it: "Stipendi", pt: "Salários" },
    "Reviews": { en: "Reviews", fr: "Avis", de: "Bewertungen", it: "Recensioni", pt: "Avaliações" },
    "Invitar": { en: "Invite", fr: "Inviter", de: "Einladen", it: "Invita", pt: "Convidar" },
    "Mi Plan": { en: "My Plan", fr: "Mon Plan", de: "Mein Plan", it: "Il mio piano", pt: "Meu Plano" },
  };
  return quick[key]?.[lang] || key;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<IdiomaCode>("es");

  useEffect(() => {
    setLangState(getIdiomaInicial());
  }, []);

  const setLang = useCallback((code: IdiomaCode) => {
    setLangState(code);
    localStorage.setItem("bc-lang", code);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("bc-lang-change", { detail: code }));
    }
  }, []);

  useEffect(() => {
    function handler(e: Event) {
      const code = (e as CustomEvent).detail as IdiomaCode;
      if (code && IDIOMAS.some(i => i.code === code)) {
        setLangState(code);
      }
    }
    window.addEventListener("bc-lang-change", handler);
    return () => window.removeEventListener("bc-lang-change", handler);
  }, []);

  const t = useCallback((key: string): string => {
    return translate(key, lang);
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
