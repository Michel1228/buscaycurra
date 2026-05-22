"use client";

import { useState, useRef, useEffect } from "react";
import { IDIOMAS, IdiomaCode } from "@/lib/i18n/translations";

export default function LanguageSelector() {
  const [lang, setLang] = useState<IdiomaCode>("es");
  const [abierto, setAbierto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("bc-lang") as IdiomaCode | null;
    if (saved && IDIOMAS.some(i => i.code === saved)) {
      setLang(saved);
    }
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setAbierto(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function seleccionar(code: IdiomaCode) {
    setLang(code);
    localStorage.setItem("bc-lang", code);
    setAbierto(false);
    // Disparar evento para que otros componentes reaccionen
    window.dispatchEvent(new CustomEvent("bc-lang-change", { detail: code }));
  }

  const actual = IDIOMAS.find(i => i.code === lang) || IDIOMAS[0];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setAbierto(!abierto)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition hover:opacity-80"
        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#f1f5f9" }}
      >
        <span className="text-sm">{actual.flag}</span>
        <span className="hidden sm:inline">{actual.code.toUpperCase()}</span>
        <span className="text-[10px] opacity-50">▼</span>
      </button>

      {abierto && (
        <div
          className="absolute right-0 mt-1 w-44 rounded-xl shadow-xl z-50 overflow-hidden"
          style={{ background: "#1a1d28", border: "1px solid #2d3142" }}
        >
          <div className="max-h-64 overflow-y-auto py-1">
            {IDIOMAS.map((idioma) => (
              <button
                key={idioma.code}
                onClick={() => seleccionar(idioma.code)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs transition hover:opacity-100"
                style={{
                  background: lang === idioma.code ? "rgba(34,197,94,0.08)" : "transparent",
                  color: lang === idioma.code ? "#22c55e" : "#94a3b8",
                }}
              >
                <span className="text-base">{idioma.flag}</span>
                <span>{idioma.name}</span>
                {lang === idioma.code && (
                  <span className="ml-auto text-[#22c55e]">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
