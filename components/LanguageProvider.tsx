"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { getIdiomaInicial, type IdiomaCode, IDIOMAS, t as tFull } from "@/lib/i18n/translations";

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
    return tFull(key, lang);
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
