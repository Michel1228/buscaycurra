"use client";

import { useState, useMemo } from "react";
import { PAISES_AU_PAIR_LEGAL, calcularCosteFamilia } from "@/lib/au-pair-legal-data";
import { Calculator, Banknote, Utensils, GraduationCap, Shield, Car, ArrowRight } from "lucide-react";

export default function AuPairCalculadoraCostes() {
  const [paisCodigo, setPaisCodigo] = useState("ES");
  const [cursoExtra, setCursoExtra] = useState(0);
  const [transporteExtra, setTransporteExtra] = useState(0);

  const pais = useMemo(() => PAISES_AU_PAIR_LEGAL.find(p => p.codigo === paisCodigo), [paisCodigo]);
  const costes = useMemo(() => {
    if (!pais) return null;
    return calcularCosteFamilia(pais, { curso: cursoExtra, transporte: transporteExtra });
  }, [pais, cursoExtra, transporteExtra]);

  if (!pais || !costes) return null;

  return (
    <section className="card-game p-4 sm:p-6 mt-6">
      <div className="flex items-center gap-2 mb-4">
        <Calculator className="w-5 h-5 text-[#22c55e]" />
        <h2 className="text-xl font-bold text-[#f1f5f9]">Calculadora de Coste Total — Familias</h2>
      </div>
      <p className="text-sm text-[#94a3b8] mb-6">
        ¿Cuánto cuesta REALMENTE tener un au pair al mes? Elige país y te lo desglosamos.
      </p>

      {/* Selector de país */}
      <div className="flex flex-wrap gap-1.5 mb-6">
        {PAISES_AU_PAIR_LEGAL.map(p => (
          <button
            key={p.codigo}
            onClick={() => setPaisCodigo(p.codigo)}
            className={`text-xs px-3 py-2 rounded-lg border transition-all ${
              paisCodigo === p.codigo
                ? "border-[#22c55e] bg-[#22c55e]/15 text-[#f1f5f9] shadow-[0_0_12px_rgba(34,197,94,0.15)]"
                : "border-[#2d3142] text-[#94a3b8] hover:border-[#3d4152]"
            }`}
          >
            {p.bandera} {p.nombre}
          </button>
        ))}
      </div>

      {/* Tarjeta de resultados */}
      <div className="bg-[#0f1117] rounded-xl border border-[#2d3142] p-5 mb-6">
        <div className="text-center mb-4">
          <span className="text-3xl">{pais.bandera}</span>
          <h3 className="text-lg font-bold text-[#f1f5f9] mt-1">{pais.nombre}</h3>
          <p className="text-xs text-[#64748b]">{pais.notaAdicional}</p>
        </div>

        <div className="space-y-3">
          {/* Salario */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-[#1e212b]/50">
            <div className="flex items-center gap-2">
              <Banknote className="w-4 h-4 text-[#22c55e]" />
              <span className="text-sm text-[#f1f5f9]">Salario (pocket money)</span>
            </div>
            <span className="text-sm font-bold text-[#f1f5f9]">{costes.salario}€</span>
          </div>

          {/* Comida + alojamiento */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-[#1e212b]/50">
            <div className="flex items-center gap-2">
              <Utensils className="w-4 h-4 text-[#f59e0b]" />
              <span className="text-sm text-[#f1f5f9]">Comida + alojamiento (estimado)</span>
            </div>
            <span className="text-sm font-bold text-[#f1f5f9]">{costes.comidaAlojamiento}€</span>
          </div>

          {/* Curso idioma */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-[#1e212b]/50">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-[#8b5cf6]" />
              <span className="text-sm text-[#f1f5f9]">
                Curso de idioma
                <span className="text-xs text-[#64748b] ml-1">
                  ({pais.cursoIdioma.includes("Obligatorio") ? "obligatorio" : "recomendado"})
                </span>
              </span>
            </div>
            <span className="text-sm font-bold text-[#f1f5f9]">{costes.cursoIdioma}€</span>
          </div>

          {/* Seguro */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-[#1e212b]/50">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#ef4444]" />
              <span className="text-sm text-[#f1f5f9]">Seguro médico</span>
            </div>
            <span className="text-sm font-bold text-[#f1f5f9]">{costes.seguro}€</span>
          </div>

          {/* Transporte */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-[#1e212b]/50">
            <div className="flex items-center gap-2">
              <Car className="w-4 h-4 text-[#3b82f6]" />
              <span className="text-sm text-[#f1f5f9]">Transporte local</span>
            </div>
            <span className="text-sm font-bold text-[#f1f5f9]">{costes.transporte}€</span>
          </div>

          {/* Ajustes */}
          <div className="border-t border-[#2d3142] pt-3 space-y-2">
            <label className="flex items-center justify-between text-xs text-[#94a3b8]">
              Curso extra (materiales, universidad…)
              <input
                type="range"
                min="0"
                max="200"
                step="10"
                value={cursoExtra}
                onChange={e => setCursoExtra(Number(e.target.value))}
                className="w-24 h-1 accent-[#22c55e]"
              />
              <span className="text-[#f1f5f9] font-bold w-10 text-right">+{cursoExtra}€</span>
            </label>
            <label className="flex items-center justify-between text-xs text-[#94a3b8]">
              Transporte extra (abono, viajes…)
              <input
                type="range"
                min="0"
                max="150"
                step="5"
                value={transporteExtra}
                onChange={e => setTransporteExtra(Number(e.target.value))}
                className="w-24 h-1 accent-[#22c55e]"
              />
              <span className="text-[#f1f5f9] font-bold w-10 text-right">+{transporteExtra}€</span>
            </label>
          </div>

          {/* Total */}
          <div className="flex items-center justify-between p-4 rounded-xl border-2 border-[#22c55e] bg-[#22c55e]/5">
            <div>
              <div className="text-sm font-bold text-[#22c55e] flex items-center gap-1">
                <ArrowRight className="w-4 h-4" /> Coste TOTAL mensual
              </div>
              <div className="text-xs text-[#64748b]">Salario + manutención + curso + seguro + transporte</div>
            </div>
            <span className="text-2xl font-black text-[#22c55e]">{costes.total}€</span>
          </div>
        </div>
      </div>

      {/* Info adicional */}
      <div className="p-4 rounded-lg bg-[#111827] border border-[#2d3142]">
        <h4 className="text-sm font-bold text-[#f1f5f9] mb-2">📋 Documentación necesaria</h4>
        <p className="text-xs text-[#94a3b8]">{pais.documentacion}</p>
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#94a3b8]">
          <div><strong>Edad:</strong> {pais.edadMin}–{pais.edadMax} años</div>
          <div><strong>Horas:</strong> {pais.horasSemanales}h/semana</div>
          <div><strong>Duración:</strong> {pais.duracionMax}</div>
          <div><strong>Vacaciones:</strong> {pais.vacaciones.split("+")[0]}</div>
        </div>
      </div>
    </section>
  );
}
