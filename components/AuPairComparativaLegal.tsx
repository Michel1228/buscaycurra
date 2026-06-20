"use client";

import { useState, useMemo } from "react";
import { PAISES_AU_PAIR_LEGAL, type PaisAuPair } from "@/lib/au-pair-legal-data";
import { ArrowUpDown, Check, Info, MapPin, Clock, Banknote, GraduationCap, Calendar, Heart, Shield } from "lucide-react";

type SortKey = "salario" | "horas" | "edadMax";

export default function AuPairComparativaLegal() {
  const [selectedPaises, setSelectedPaises] = useState<Set<string>>(new Set(["ES", "DE", "FR", "UK", "NL"]));
  const [sortBy, setSortBy] = useState<SortKey | null>(null);
  const [tooltipPais, setTooltipPais] = useState<string | null>(null);

  const togglePais = (codigo: string) => {
    const next = new Set(selectedPaises);
    if (next.has(codigo)) {
      if (next.size > 1) next.delete(codigo);
    } else {
      next.add(codigo);
    }
    setSelectedPaises(next);
  };

  const paisesVisibles = useMemo(() => {
    let list = PAISES_AU_PAIR_LEGAL.filter(p => selectedPaises.has(p.codigo));
    if (sortBy === "salario") {
      list = [...list].sort((a, b) => {
        const na = parseInt(a.salarioMinMensual.replace(/[^0-9]/g, "")) || 0;
        const nb = parseInt(b.salarioMinMensual.replace(/[^0-9]/g, "")) || 0;
        return nb - na;
      });
    } else if (sortBy === "horas") {
      list = [...list].sort((a, b) => a.horasSemanales - b.horasSemanales);
    } else if (sortBy === "edadMax") {
      list = [...list].sort((a, b) => b.edadMax - a.edadMax);
    }
    return list;
  }, [selectedPaises, sortBy]);

  return (
    <section className="card-game p-4 sm:p-6 mt-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-[#f1f5f9] flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-[#22c55e]" />
            Comparativa Legal Au Pair por País
          </h2>
          <p className="text-sm text-[#94a3b8] mt-1">
            Requisitos actualizados a 2026. Datos verificados de fuentes oficiales.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(["salario", "horas", "edadMax"] as SortKey[]).map(k => (
            <button
              key={k}
              onClick={() => setSortBy(sortBy === k ? null : k)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                sortBy === k
                  ? "border-[#22c55e] bg-[#22c55e]/10 text-[#22c55e]"
                  : "border-[#2d3142] text-[#94a3b8] hover:border-[#22c55e]/50"
              }`}
            >
              <ArrowUpDown className="w-3 h-3 inline mr-1" />
              {k === "salario" ? "Salario" : k === "horas" ? "Horas/sem" : "Edad máx"}
            </button>
          ))}
        </div>
      </div>

      {/* Selector de países */}
      <div className="flex flex-wrap gap-1.5 mb-6">
        {PAISES_AU_PAIR_LEGAL.map(p => (
          <button
            key={p.codigo}
            onClick={() => togglePais(p.codigo)}
            className={`text-xs px-2.5 py-1.5 rounded-full border transition-all ${
              selectedPaises.has(p.codigo)
                ? "border-[#22c55e] bg-[#22c55e]/15 text-[#f1f5f9]"
                : "border-[#2d3142] text-[#64748b] hover:border-[#3d4152]"
            }`}
          >
            {p.bandera} {p.nombre}
          </button>
        ))}
      </div>

      {/* Tabla comparativa */}
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <table className="w-full text-sm min-w-[700px]">
          <thead>
            <tr className="border-b border-[#2d3142]">
              <th className="text-left p-3 text-[#94a3b8] font-medium sticky left-0 bg-[#1e212b] z-10">Requisito</th>
              {paisesVisibles.map(p => (
                <th key={p.codigo} className="text-center p-3 min-w-[140px]">
                  <span className="text-lg">{p.bandera}</span>
                  <div className="text-[#f1f5f9] text-xs mt-1">{p.nombre}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Edad */}
            <tr className="border-b border-[#2d3142]/50 hover:bg-[#111827]/50">
              <td className="p-3 text-[#f1f5f9] flex items-center gap-2 sticky left-0 bg-[#1e212b]">
                <Clock className="w-4 h-4 text-[#22c55e]" /> Edad
              </td>
              {paisesVisibles.map(p => (
                <td key={p.codigo} className="text-center p-3 text-[#f1f5f9]">
                  {p.edadMin} – {p.edadMax} años
                </td>
              ))}
            </tr>

            {/* Horas semanales */}
            <tr className="border-b border-[#2d3142]/50 hover:bg-[#111827]/50">
              <td className="p-3 text-[#f1f5f9] flex items-center gap-2 sticky left-0 bg-[#1e212b]">
                <Clock className="w-4 h-4 text-[#f59e0b]" /> Horas/semana
              </td>
              {paisesVisibles.map(p => (
                <td key={p.codigo} className={`text-center p-3 font-medium ${
                  p.horasSemanales <= 20 ? "text-[#22c55e]" : "text-[#f1f5f9]"
                }`}>
                  {p.horasSemanales}h
                  {p.horasSemanales <= 20 && <Check className="w-3 h-3 inline ml-1 text-[#22c55e]" />}
                </td>
              ))}
            </tr>

            {/* Salario */}
            <tr className="border-b border-[#2d3142]/50 hover:bg-[#111827]/50">
              <td className="p-3 text-[#f1f5f9] flex items-center gap-2 sticky left-0 bg-[#1e212b]">
                <Banknote className="w-4 h-4 text-[#22c55e]" /> Salario/mes
              </td>
              {paisesVisibles.map(p => (
                <td key={p.codigo} className="text-center p-3 text-[#f1f5f9] font-medium">
                  {p.salarioMinMensual}
                </td>
              ))}
            </tr>

            {/* Curso idioma */}
            <tr className="border-b border-[#2d3142]/50 hover:bg-[#111827]/50">
              <td className="p-3 text-[#f1f5f9] flex items-center gap-2 sticky left-0 bg-[#1e212b]">
                <GraduationCap className="w-4 h-4 text-[#8b5cf6]" /> Curso idioma
              </td>
              {paisesVisibles.map(p => (
                <td key={p.codigo} className={`text-center p-3 text-xs ${
                  p.cursoIdioma.includes("Obligatorio") ? "text-[#ef4444]" : "text-[#22c55e]"
                }`}>
                  {p.cursoIdioma}
                </td>
              ))}
            </tr>

            {/* Visado UE */}
            <tr className="border-b border-[#2d3142]/50 hover:bg-[#111827]/50">
              <td className="p-3 text-[#f1f5f9] flex items-center gap-2 sticky left-0 bg-[#1e212b]">
                <Shield className="w-4 h-4 text-[#3b82f6]" /> Visado (UE)
              </td>
              {paisesVisibles.map(p => (
                <td key={p.codigo} className={`text-center p-3 text-xs ${
                  p.visadoUE.includes("No necesita") ? "text-[#22c55e]" : "text-[#f59e0b]"
                }`}>
                  {p.visadoUE.length > 40 ? p.visadoUE.slice(0, 40) + "…" : p.visadoUE}
                </td>
              ))}
            </tr>

            {/* Visado No-UE */}
            <tr className="border-b border-[#2d3142]/50 hover:bg-[#111827]/50">
              <td className="p-3 text-[#f1f5f9] flex items-center gap-2 sticky left-0 bg-[#1e212b]">
                <Shield className="w-4 h-4 text-[#f59e0b]" /> Visado (no-UE)
              </td>
              {paisesVisibles.map(p => (
                <td key={p.codigo} className="text-center p-3 text-xs text-[#94a3b8]">
                  {p.visadoNoUE.length > 45 ? p.visadoNoUE.slice(0, 45) + "…" : p.visadoNoUE}
                </td>
              ))}
            </tr>

            {/* Vacaciones */}
            <tr className="border-b border-[#2d3142]/50 hover:bg-[#111827]/50">
              <td className="p-3 text-[#f1f5f9] flex items-center gap-2 sticky left-0 bg-[#1e212b]">
                <Calendar className="w-4 h-4 text-[#ec4899]" /> Vacaciones
              </td>
              {paisesVisibles.map(p => (
                <td key={p.codigo} className="text-center p-3 text-xs text-[#94a3b8]">
                  {p.vacaciones.length > 35 ? p.vacaciones.slice(0, 35) + "…" : p.vacaciones}
                </td>
              ))}
            </tr>

            {/* Seguro médico */}
            <tr className="border-b border-[#2d3142]/50 hover:bg-[#111827]/50">
              <td className="p-3 text-[#f1f5f9] flex items-center gap-2 sticky left-0 bg-[#1e212b]">
                <Heart className="w-4 h-4 text-[#ef4444]" /> Seguro médico
              </td>
              {paisesVisibles.map(p => (
                <td key={p.codigo} className="text-center p-3 text-xs text-[#94a3b8]">
                  {p.seguroMedico.length > 40 ? p.seguroMedico.slice(0, 40) + "…" : p.seguroMedico}
                </td>
              ))}
            </tr>

            {/* Duración máxima */}
            <tr className="border-b border-[#2d3142]/50 hover:bg-[#111827]/50">
              <td className="p-3 text-[#f1f5f9] flex items-center gap-2 sticky left-0 bg-[#1e212b]">
                <MapPin className="w-4 h-4 text-[#06b6d4]" /> Duración máx
              </td>
              {paisesVisibles.map(p => (
                <td key={p.codigo} className="text-center p-3 text-[#f1f5f9]">
                  {p.duracionMax}
                </td>
              ))}
            </tr>

            {/* Coste familia */}
            <tr className="hover:bg-[#111827]/50 bg-[#0f1117]/30">
              <td className="p-3 text-[#22c55e] flex items-center gap-2 font-medium sticky left-0 bg-[#1e212b]">
                <Banknote className="w-4 h-4" /> Coste total familia/mes
              </td>
              {paisesVisibles.map(p => (
                <td key={p.codigo} className="text-center p-3 text-[#22c55e] font-bold">
                  {p.costeMensualFamilia}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Tooltip / info extra */}
      {tooltipPais && (
        <div className="mt-4 p-4 rounded-lg bg-[#111827] border border-[#2d3142]">
          {(() => {
            const pais = PAISES_AU_PAIR_LEGAL.find(p => p.codigo === tooltipPais);
            if (!pais) return null;
            return (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{pais.bandera}</span>
                  <span className="font-bold text-[#f1f5f9]">{pais.nombre}</span>
                  <span className="text-xs text-[#64748b]">— {pais.notaAdicional}</span>
                </div>
                <p className="text-sm text-[#94a3b8]"><strong>Documentación:</strong> {pais.documentacion}</p>
              </div>
            );
          })()}
        </div>
      )}

      <p className="text-xs text-[#64748b] mt-4 flex items-center gap-1">
        <Info className="w-3 h-3" />
        Datos orientativos. Verifica siempre los requisitos actualizados en la web oficial del país de destino.
      </p>
    </section>
  );
}
