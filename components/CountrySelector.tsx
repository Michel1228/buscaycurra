"use client";

import { useState, useRef, useEffect } from "react";
import { PAISES, LISTA_PAISES, type PaisConfig } from "@/lib/paises";

interface CountrySelectorProps {
  paisActual: string;
  onCambiarPais: (codigo: string) => void;
  variant?: "navbar" | "buscar";
}

export default function CountrySelector({ paisActual, onCambiarPais, variant = "navbar" }: CountrySelectorProps) {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pais = PAISES[paisActual] || PAISES.ES;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setAbierto(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const isNavbar = variant === "navbar";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setAbierto(!abierto)}
        className={`flex items-center gap-1.5 rounded-lg transition-colors
          ${isNavbar
            ? "bg-[#1a1d2e] hover:bg-[#252839] px-2.5 py-1.5 text-sm"
            : "bg-[#1e212b] border border-[#2d3142] hover:border-[#3d4256] px-3 py-2 text-sm"
          }`}
        aria-label="Cambiar país"
      >
        <span className="text-base">{pais.bandera}</span>
        <span className="text-[#e2e8f0] font-medium hidden sm:inline">{pais.nombre}</span>
        <span className="text-[#94a3b8] text-xs ml-0.5">{pais.simboloMoneda}</span>
        <svg className="w-3 h-3 text-[#64748b] ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {abierto && (
        <div className={`absolute z-50 mt-1.5 bg-[#1a1d2e] border border-[#2d3142] rounded-xl shadow-2xl overflow-hidden
          ${isNavbar ? "right-0 w-64" : "left-0 w-72"}`}
        >
          <div className="px-3 py-2 border-b border-[#2d3142]">
            <p className="text-xs text-[#64748b] uppercase tracking-wider">Seleccionar país</p>
          </div>
          <div className="max-h-80 overflow-y-auto py-1">
            {LISTA_PAISES.map((p) => (
              <button
                key={p.codigo}
                onClick={() => { onCambiarPais(p.codigo); setAbierto(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors
                  ${p.codigo === paisActual
                    ? "bg-[#22c55e]/10 text-[#22c55e]"
                    : "text-[#e2e8f0] hover:bg-[#252839]"
                  }`}
              >
                <span className="text-lg">{p.bandera}</span>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium block">{p.nombre}</span>
                  <span className="text-xs text-[#64748b]">{p.nombreLocal}</span>
                </div>
                <span className="text-xs text-[#94a3b8] font-mono">{p.simboloMoneda}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
