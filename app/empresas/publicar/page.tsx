"use client";

/**
 * /empresas/publicar — Portal para que empresas publiquen ofertas
 * Acceso público (sin login de usuario), las empresas se registran aparte
 */

import { useState } from "react";
import Link from "next/link";

const SECTORES = [
  "Hostelería y turismo", "Construcción", "Tecnología", "Sanidad",
  "Comercio", "Logística", "Educación", "Limpieza", "Industria",
  "Finanzas", "Marketing", "Otro",
];

const JORNADAS = ["Completa", "Parcial", "Por horas", "Remoto", "Híbrido"];

export default function PublicarOfertaPage() {
  const [empresa, setEmpresa] = useState("");
  const [emailEmpresa, setEmailEmpresa] = useState("");
  const [webEmpresa, setWebEmpresa] = useState("");
  const [titulo, setTitulo] = useState("");
  const [sector, setSector] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [jornada, setJornada] = useState("");
  const [salario, setSalario] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [requisitos, setRequisitos] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [exito, setExito] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setExito(false);
    if (!empresa.trim() || !emailEmpresa.trim() || !titulo.trim() || !ciudad.trim()) {
      setError("Los campos marcados con * son obligatorios");
      return;
    }
    setEnviando(true);
    try {
      const res = await fetch("/api/empresas/publicar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          empresa: empresa.trim(),
          emailEmpresa: emailEmpresa.trim(),
          webEmpresa: webEmpresa.trim() || undefined,
          titulo: titulo.trim(),
          sector, ciudad: ciudad.trim(), jornada,
          salario: salario.trim() || undefined,
          descripcion: descripcion.trim(),
          requisitos: requisitos.trim() || undefined,
        }),
      });
      const data = await res.json() as { success?: boolean; error?: string };
      if (!res.ok || data.error) throw new Error(data.error || "Error al publicar");
      setExito(true);
      setEmpresa(""); setEmailEmpresa(""); setWebEmpresa("");
      setTitulo(""); setSector(""); setCiudad(""); setJornada("");
      setSalario(""); setDescripcion(""); setRequisitos("");
    } catch (err) {
      setError((err as Error).message);
    } finally { setEnviando(false); }
  };

  return (
    <div className="min-h-screen" style={{ background: "#1a1a12" }}>
      {/* Header */}
      <div className="py-12 px-4" style={{ background: "linear-gradient(135deg, rgba(126,213,111,0.1), rgba(240,192,64,0.05))" }}>
        <div className="max-w-2xl mx-auto text-center">
          <span className="text-4xl block mb-3">🏢</span>
          <h1 className="text-2xl font-bold mb-2" style={{ color: "#f0ebe0" }}>Portal de Empresas</h1>
          <p className="text-sm" style={{ color: "#b0a890" }}>
            Publica tu oferta de trabajo y llega a miles de candidatos cualificados. <strong style={{ color: "#7ed56f" }}>¡100% gratis!</strong>
          </p>
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {["✅ Gratis", "🎯 Candidatos filtrados", "📧 CVs directos", "🤖 IA matching"].map(f => (
              <span key={f} className="text-xs px-3 py-1 rounded-full"
                style={{ background: "rgba(126,213,111,0.1)", color: "#7ed56f", border: "1px solid rgba(126,213,111,0.15)" }}>
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        {exito ? (
          <div className="card-game p-8 text-center">
            <span className="text-5xl block mb-4">🎉</span>
            <h2 className="text-xl font-bold mb-2" style={{ color: "#7ed56f" }}>¡Oferta publicada!</h2>
            <p className="text-sm mb-6" style={{ color: "#b0a890" }}>
              Tu oferta será revisada y publicada en minutos. Los candidatos que encajen recibirán una notificación.
            </p>
            <button onClick={() => setExito(false)}
              className="px-6 py-3 rounded-xl font-bold text-sm"
              style={{ background: "linear-gradient(135deg, #7ed56f, #5cb848)", color: "#1a1a12" }}>
              📝 Publicar otra oferta
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Datos de la empresa */}
            <div className="card-game p-6">
              <h2 className="text-sm font-bold mb-4" style={{ color: "#f0c040" }}>🏢 Datos de tu empresa</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: "#b0a890" }}>
                    Nombre de la empresa <span style={{ color: "#f87171" }}>*</span>
                  </label>
                  <input type="text" value={empresa} onChange={e => setEmpresa(e.target.value)}
                    placeholder="ej: Mi Restaurante S.L." required className="w-full" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: "#b0a890" }}>
                    Email de contacto <span style={{ color: "#f87171" }}>*</span>
                  </label>
                  <input type="email" value={emailEmpresa} onChange={e => setEmailEmpresa(e.target.value)}
                    placeholder="rrhh@empresa.com" required className="w-full" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: "#b0a890" }}>
                    Web <span className="font-normal" style={{ color: "#504a3a" }}>(opcional)</span>
                  </label>
                  <input type="url" value={webEmpresa} onChange={e => setWebEmpresa(e.target.value)}
                    placeholder="https://www.miempresa.es" className="w-full" />
                </div>
              </div>
            </div>

            {/* Datos de la oferta */}
            <div className="card-game p-6">
              <h2 className="text-sm font-bold mb-4" style={{ color: "#f0c040" }}>💼 Datos de la oferta</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: "#b0a890" }}>
                    Puesto <span style={{ color: "#f87171" }}>*</span>
                  </label>
                  <input type="text" value={titulo} onChange={e => setTitulo(e.target.value)}
                    placeholder="ej: Camarero/a con experiencia" required className="w-full" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold mb-1.5" style={{ color: "#b0a890" }}>Sector</label>
                    <select value={sector} onChange={e => setSector(e.target.value)} className="w-full">
                      <option value="">Seleccionar</option>
                      {SECTORES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1.5" style={{ color: "#b0a890" }}>Jornada</label>
                    <select value={jornada} onChange={e => setJornada(e.target.value)} className="w-full">
                      <option value="">Seleccionar</option>
                      {JORNADAS.map(j => <option key={j} value={j}>{j}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold mb-1.5" style={{ color: "#b0a890" }}>
                      Ciudad <span style={{ color: "#f87171" }}>*</span>
                    </label>
                    <input type="text" value={ciudad} onChange={e => setCiudad(e.target.value)}
                      placeholder="Madrid, Tudela..." required className="w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1.5" style={{ color: "#b0a890" }}>Salario</label>
                    <input type="text" value={salario} onChange={e => setSalario(e.target.value)}
                      placeholder="1.500€ - 2.000€/mes" className="w-full" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: "#b0a890" }}>Descripción</label>
                  <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)}
                    placeholder="Describe el puesto, responsabilidades, horario..."
                    rows={4} className="w-full" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: "#b0a890" }}>Requisitos</label>
                  <textarea value={requisitos} onChange={e => setRequisitos(e.target.value)}
                    placeholder="Experiencia mínima, formación, idiomas..."
                    rows={3} className="w-full" />
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-xl px-4 py-3 text-sm" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
                ❌ {error}
              </div>
            )}

            <button type="submit" disabled={enviando}
              className="w-full font-bold py-3.5 rounded-xl text-sm transition"
              style={{
                background: enviando ? "#3d3c30" : "linear-gradient(135deg, #7ed56f, #5cb848)",
                color: enviando ? "#706a58" : "#1a1a12",
                boxShadow: enviando ? "none" : "0 4px 16px rgba(126,213,111,0.25)",
              }}>
              {enviando ? "Publicando..." : "🚀 Publicar oferta gratis"}
            </button>

            <p className="text-xs text-center" style={{ color: "#504a3a" }}>
              Las ofertas son revisadas antes de publicarse. Sin spam, sin coste.
            </p>
          </form>
        )}

        {/* Link back */}
        <div className="text-center mt-8">
          <Link href="/" className="text-sm" style={{ color: "#7ed56f" }}>← Volver a BuscayCurra</Link>
        </div>
      </div>
    </div>
  );
}
