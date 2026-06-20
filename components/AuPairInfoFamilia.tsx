"use client";

import { PAISES_AU_PAIR_LEGAL, calcularCosteFamilia } from "@/lib/au-pair-legal-data";
import { Banknote, GraduationCap, Shield, FileText, Info } from "lucide-react";

interface Props {
  paisCodigo: string;
  compacto?: boolean; // versión reducida para email
}

export default function AuPairInfoFamilia({ paisCodigo, compacto = false }: Props) {
  const paisData = PAISES_AU_PAIR_LEGAL.find(p => p.codigo === paisCodigo);
  if (!paisData) return null;

  const costes = calcularCosteFamilia(paisData);

  if (compacto) {
    // Versión ultra-compacta para email
    return (
      <div style={{ fontFamily: "Arial, sans-serif", fontSize: "13px", color: "#555", borderTop: "1px solid #e0e0e0", paddingTop: "12px", marginTop: "16px" }}>
        <p style={{ fontWeight: "bold", color: "#2d5a4e", marginBottom: "6px" }}>
          ℹ️ Para la familia anfitriona — {paisData.bandera} {paisData.nombre}
        </p>
        <p style={{ margin: "2px 0" }}>
          <strong>Coste estimado mensual:</strong> ~{costes.total}€ 
          (salario {costes.salario}€ + manutención ~{costes.comidaAlojamiento}€ 
          {costes.cursoIdioma > 0 ? ` + curso ~${costes.cursoIdioma}€` : ""} 
          + seguro ~{costes.seguro}€)
        </p>
        <p style={{ margin: "2px 0" }}><strong>Horas:</strong> {paisData.horasSemanales}h/semana · <strong>Edad:</strong> {paisData.edadMin}-{paisData.edadMax} años</p>
        <p style={{ margin: "2px 0" }}><strong>{paisData.cursoIdioma.includes("Obligatorio") ? "⚠️ Curso de idioma OBLIGATORIO" : "Curso de idioma: " + paisData.cursoIdioma}</strong></p>
        <p style={{ margin: "2px 0", fontSize: "11px", color: "#999" }}>Datos orientativos de BuscayCurra. Verifica requisitos actualizados.</p>
      </div>
    );
  }

  // Versión completa para la plantilla
  return (
    <div className="rounded-lg p-4" style={{ background: "#f0f7f4", border: "1px solid #c8e6d4" }}>
      <div className="flex items-center gap-2 mb-3">
        <Info className="w-4 h-4" style={{ color: "#2d5a4e" }} />
        <h3 className="text-xs uppercase tracking-[2px] font-bold" style={{ color: "#2d5a4e" }}>
          Para la familia anfitriona — {paisData.bandera} {paisData.nombre}
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        {/* Costes */}
        <div className="rounded p-2.5" style={{ background: "#fff", border: "1px solid #d4e8dc" }}>
          <div className="flex items-center gap-1.5 mb-1">
            <Banknote className="w-3 h-3" style={{ color: "#2d5a4e" }} />
            <span className="font-bold" style={{ color: "#1a3d34" }}>Coste estimado/mes</span>
          </div>
          <p className="text-lg font-black" style={{ color: "#2d5a4e" }}>~{costes.total}€</p>
          <div className="mt-1 space-y-0.5" style={{ color: "#666" }}>
            <div className="flex justify-between"><span>Salario</span><span className="font-medium">{costes.salario}€</span></div>
            <div className="flex justify-between"><span>Manutención</span><span className="font-medium">~{costes.comidaAlojamiento}€</span></div>
            {costes.cursoIdioma > 0 && (
              <div className="flex justify-between"><span>Curso idioma</span><span className="font-medium">~{costes.cursoIdioma}€</span></div>
            )}
            <div className="flex justify-between"><span>Seguro</span><span className="font-medium">~{costes.seguro}€</span></div>
          </div>
        </div>

        {/* Requisitos */}
        <div className="rounded p-2.5" style={{ background: "#fff", border: "1px solid #d4e8dc" }}>
          <div className="flex items-center gap-1.5 mb-1">
            <FileText className="w-3 h-3" style={{ color: "#2d5a4e" }} />
            <span className="font-bold" style={{ color: "#1a3d34" }}>Requisitos</span>
          </div>
          <div className="space-y-1" style={{ color: "#555" }}>
            <div className="flex items-center gap-1">
              <GraduationCap className="w-3 h-3" style={{ color: paisData.cursoIdioma.includes("Obligatorio") ? "#ef4444" : "#22c55e" }} />
              <span>{paisData.cursoIdioma}</span>
            </div>
            <div className="flex items-center gap-1">
              <Shield className="w-3 h-3" style={{ color: "#2d5a4e" }} />
              <span>{paisData.seguroMedico.length > 50 ? paisData.seguroMedico.slice(0, 50) + "…" : paisData.seguroMedico}</span>
            </div>
            <div><strong>Horas:</strong> {paisData.horasSemanales}h/semana</div>
            <div><strong>Edad:</strong> {paisData.edadMin}-{paisData.edadMax} años</div>
            <div><strong>Duración:</strong> {paisData.duracionMax}</div>
          </div>
        </div>
      </div>

      {/* Nota legal */}
      <p className="text-[9px] mt-3" style={{ color: "#999" }}>
        Datos orientativos actualizados a 2026. Verifica los requisitos legales actualizados en la web oficial del país. 
        Esta información la facilita el candidato como cortesía — BuscayCurra no es responsable de cambios normativos.
      </p>
    </div>
  );
}
