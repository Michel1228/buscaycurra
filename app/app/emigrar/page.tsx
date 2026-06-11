"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PAISES, LISTA_PAISES, formatearSalario } from "@/lib/paises";
import { getPrimerosPasos, type PrimerosPasosInfo } from "@/lib/primeros-pasos";
import { PenLine, Search, Home, Lightbulb, Globe, ClipboardList, GraduationCap, Star, Briefcase, Users, AlertTriangle, Mail, type LucideIcon } from "lucide-react";

type Tab = "au-pair" | "alojamiento" | "visado" | "programas";

interface EmigrarContentProps {
  paisCode: string;
  primerosPasos: PrimerosPasosInfo | null;
}

function AuPairTab({ paisCode, info }: { paisCode: string; info: PrimerosPasosInfo }) {
  if (!info.auPair.disponible) {
    return (
      <div className="bg-[#1a1d2e] border border-[#2d3142] rounded-xl p-6 text-center">
        <div className="flex justify-center mb-4"><Users size={48} strokeWidth={1.2} style={{ color: "#94a3b8" }} /></div>
        <h3 className="text-lg font-semibold text-[#e2e8f0] mb-2">Programa Au Pair</h3>
        <p className="text-sm text-[#94a3b8]">
          El programa au pair no está disponible actualmente en este país o no tenemos información suficiente.
        </p>
      </div>
    );
  }

  const pais = PAISES[paisCode];
  return (
    <div>
      {/* 🆕 Perfil Au Pair */}
      <div className="bg-gradient-to-br from-[#222c1a] to-[#1a2e1a] border border-[#22c55e]/30 rounded-xl p-6 mb-4">
        <h3 className="text-lg font-semibold text-[#e2e8f0] mb-2 flex items-center gap-2">
          <Mail size={20} strokeWidth={1.6} className="shrink-0" /> Tu perfil Au Pair
        </h3>
        <p className="text-sm text-[#94a3b8] mb-4">
          Las familias no buscan un CV. Buscan conocerte. Crea tu carta "Dear Family" 
          y tu perfil completo para aplicar a ofertas au pair.
        </p>
        <Link
          href="/app/au-pair"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#22c55e] hover:bg-[#1ea34d] text-black font-semibold rounded-xl text-sm transition-colors"
        >
          <PenLine size={16} strokeWidth={1.8} className="shrink-0" />Crear/Editar mi perfil Au Pair
        </Link>
      </div>

      <div className="bg-gradient-to-br from-[#1a1d2e] to-[#1e2538] border border-[#2d3142] rounded-xl p-6 mb-4">
        <h3 className="text-lg font-semibold text-[#e2e8f0] mb-3 flex items-center gap-2">
          <Users size={20} strokeWidth={1.6} className="shrink-0" /> Programa Au Pair en {pais?.nombre || paisCode}
        </h3>
        <div className="bg-[#0f1117]/50 rounded-lg p-4 mb-4 border border-[#2d3142]">
          <p className="text-xs text-[#64748b] uppercase tracking-wider mb-1">Requisitos</p>
          <p className="text-sm text-[#e2e8f0] leading-relaxed">{info.auPair.requisitos}</p>
        </div>
        <p className="text-xs text-[#64748b] uppercase tracking-wider mb-2">Agencias y plataformas verificadas</p>
        <div className="space-y-2">
          {info.auPair.plataformas.map((p) => (
            <a
              key={p.nombre}
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-[#252839] border border-[#2d3142] hover:border-[#22c55e]/40 rounded-lg p-4 transition-colors group"
            >
              <span className="text-sm font-medium text-[#22c55e] group-hover:underline">
                {p.nombre} →
              </span>
              <span className="text-xs text-[#94a3b8] block mt-1">{p.descripcion}</span>
            </a>
          ))}
        </div>
      </div>

      <Link
        href={`/app/buscar?keyword=au%20pair&pais=${paisCode}`}
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#22c55e] hover:bg-[#1ea34d] text-black font-semibold rounded-xl text-sm transition-colors"
      >
        <Search size={16} strokeWidth={1.8} className="shrink-0" />Buscar ofertas de Au Pair en {pais?.nombre || paisCode}
      </Link>
    </div>
  );
}

function AlojamientoTab({ paisCode, info }: { paisCode: string; info: PrimerosPasosInfo }) {
  const pais = PAISES[paisCode];
  return (
    <div>
      <div className="bg-gradient-to-br from-[#1a1d2e] to-[#1e2538] border border-[#2d3142] rounded-xl p-6 mb-4">
        <h3 className="text-lg font-semibold text-[#e2e8f0] mb-3 flex items-center gap-2">
          <Home size={20} strokeWidth={1.6} className="shrink-0" /> Alojamiento en {pais?.nombre || paisCode}
        </h3>
        <p className="text-xs text-[#64748b] uppercase tracking-wider mb-2">Portales de alquiler verificados</p>
        <div className="grid sm:grid-cols-2 gap-2 mb-4">
          {info.alojamiento.plataformas.map((p) => (
            <a
              key={p.nombre}
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#252839] border border-[#2d3142] hover:border-[#22c55e]/40 rounded-lg p-4 transition-colors group"
            >
              <span className="text-sm font-medium text-[#22c55e] group-hover:underline block">
                {p.nombre} →
              </span>
              <span className="text-xs text-[#94a3b8] block mt-1">{p.descripcion}</span>
            </a>
          ))}
        </div>
        <div className="bg-[#0f1117]/50 rounded-lg p-4 border border-[#2d3142]">
          <p className="flex items-center gap-1 text-xs text-[#64748b] uppercase tracking-wider mb-1"><Lightbulb size={11} strokeWidth={2} />Consejo local</p>
          <p className="text-sm text-[#e2e8f0] leading-relaxed">{info.alojamiento.consejo}</p>
        </div>
      </div>

      <Link
        href={`/app/buscar?pais=${paisCode}`}
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#22c55e] hover:bg-[#1ea34d] text-black font-semibold rounded-xl text-sm transition-colors"
      >
        <Search size={16} strokeWidth={1.8} className="shrink-0" />Ver todas las ofertas en {pais?.nombre || paisCode}
      </Link>
    </div>
  );
}

function VisadoTab({ paisCode, info }: { paisCode: string; info: PrimerosPasosInfo }) {
  const pais = PAISES[paisCode];
  const tipoLabel: Record<string, { flagIcon?: string; Icon?: LucideIcon; label: string; color: string }> = {
    "ue-libre": { flagIcon: "🇪🇺", label: "Libre circulación UE", color: "#22c55e" },
    "visado-trabajo": { Icon: ClipboardList, label: "Visado de trabajo requerido", color: "#f59e0b" },
    "working-holiday": { Icon: Briefcase, label: "Working Holiday Visa", color: "#3b82f6" },
    "visado-estudiante": { Icon: GraduationCap, label: "Visado de estudiante", color: "#8b5cf6" },
  };
  const tipo = tipoLabel[info.visado.tipo] || { Icon: ClipboardList, label: info.visado.tipo, color: "#94a3b8" };

  return (
    <div>
      <div className="bg-gradient-to-br from-[#1a1d2e] to-[#1e2538] border border-[#2d3142] rounded-xl p-6 mb-4">
        <h3 className="text-lg font-semibold text-[#e2e8f0] mb-3 flex items-center gap-2">
          <ClipboardList size={20} strokeWidth={1.6} className="shrink-0" /> Visado para {pais?.nombre || paisCode}
        </h3>
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-4"
          style={{ background: `${tipo.color}15`, color: tipo.color, border: `1px solid ${tipo.color}30` }}
        >
          {tipo.flagIcon ? <span>{tipo.flagIcon}</span> : tipo.Icon ? (() => { const TI = tipo.Icon!; return <TI size={14} strokeWidth={1.8} />; })() : null}
          <span>{tipo.label}</span>
        </div>
        <div className="bg-[#0f1117]/50 rounded-lg p-4 mb-4 border border-[#2d3142]">
          <p className="text-sm text-[#e2e8f0] leading-relaxed">{info.visado.descripcion}</p>
        </div>
        {info.visado.enlaceOficial && (
          <a
            href={info.visado.enlaceOficial}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#252839] border border-[#2d3142] hover:border-[#22c55e]/40 rounded-xl text-sm font-medium text-[#22c55e] transition-colors"
          >
            <Globe size={16} strokeWidth={1.8} className="shrink-0" />Web oficial de inmigración →
          </a>
        )}
      </div>
    </div>
  );
}

function ProgramasTab({ paisCode, info }: { paisCode: string; info: PrimerosPasosInfo }) {
  const pais = PAISES[paisCode];
  if (!info.programasExtra || info.programasExtra.length === 0) {
    return (
      <div className="bg-[#1a1d2e] border border-[#2d3142] rounded-xl p-6 text-center">
        <div className="flex justify-center mb-4"><Star size={48} strokeWidth={1.2} style={{ color: "#94a3b8" }} /></div>
        <h3 className="text-lg font-semibold text-[#e2e8f0] mb-2">Programas especiales</h3>
        <p className="text-sm text-[#94a3b8]">
          No hay programas especiales listados para {pais?.nombre || paisCode} todavía.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-gradient-to-br from-[#1a1d2e] to-[#1e2538] border border-[#2d3142] rounded-xl p-6 mb-4">
        <h3 className="text-lg font-semibold text-[#e2e8f0] mb-4 flex items-center gap-2">
          <Star size={20} strokeWidth={1.6} className="shrink-0" /> Programas especiales en {pais?.nombre || paisCode}
        </h3>
        <div className="grid sm:grid-cols-2 gap-3">
          {info.programasExtra.map((p) => (
            <a
              key={p.nombre}
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#252839] border border-[#2d3142] hover:border-[#22c55e]/40 rounded-xl p-5 transition-colors group"
            >
              <span className="text-sm font-semibold text-[#e2e8f0] group-hover:text-[#22c55e] transition-colors block">
                {p.nombre}
              </span>
              <span className="text-xs text-[#94a3b8] block mt-2 leading-relaxed">{p.descripcion}</span>
              <span className="text-xs text-[#22c55e] mt-2 inline-block group-hover:underline">
                Más información →
              </span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function EmigrarPage() {
  const router = useRouter();
  const [paisCode, setPaisCode] = useState("UK");
  const [tab, setTab] = useState<Tab>("visado");

  // Cargar país del localStorage al iniciar
  useEffect(() => {
    const saved = localStorage.getItem("bc_pais");
    if (saved && PAISES[saved]) {
      setPaisCode(saved);
    }
  }, []);

  const pais = PAISES[paisCode];
  const primerosPasos = getPrimerosPasos(paisCode);

  if (!pais) {
    return (
      <main className="min-h-screen bg-[#0f1117] flex items-center justify-center">
        <p className="text-[#f1f5f9] text-lg">País no encontrado</p>
      </main>
    );
  }

  const tabs: { id: Tab; Icon: LucideIcon; label: string }[] = [
    { id: "visado", Icon: ClipboardList, label: "Visado" },
    { id: "alojamiento", Icon: Home, label: "Alojamiento" },
    { id: "au-pair", Icon: Users, label: "Au Pair" },
    { id: "programas", Icon: Star, label: "Programas" },
  ];

  return (
    <main className="min-h-screen bg-[#0f1117] text-[#f1f5f9]">
      {/* Hero */}
      <section className="relative py-12 px-4 sm:px-6 max-w-4xl mx-auto text-center">
        <div className="flex justify-center mb-4"><Globe size={48} strokeWidth={1.2} style={{ color: "#94a3b8" }} /></div>
        <h1 className="text-3xl sm:text-4xl font-bold mb-3">
          Emigrar al extranjero
        </h1>
        <p className="text-[#94a3b8] max-w-xl mx-auto leading-relaxed">
          Toda la información que necesitas para trabajar fuera de España: visados, alojamiento, programas au pair y más. Guía completa por país.
        </p>
      </section>

      {/* Country selector */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 mb-8">
        <div className="flex flex-wrap gap-2 justify-center">
          {LISTA_PAISES.filter((p) => p.codigo !== "ES").map((p) => (
            <button
              key={p.codigo}
              onClick={() => { setPaisCode(p.codigo); setTab("visado"); }}
              className="px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-1.5"
              style={{
                background: paisCode === p.codigo ? "rgba(34,197,94,0.12)" : "rgba(30,33,43,0.8)",
                border: paisCode === p.codigo ? "1px solid rgba(34,197,94,0.4)" : "1px solid #2d3142",
                color: paisCode === p.codigo ? "#22c55e" : "#94a3b8",
              }}
            >
              <span>{p.bandera}</span>
              <span>{p.nombre}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Tabs */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 mb-6">
        <div className="flex gap-1 bg-[#1a1d2e] border border-[#2d3142] rounded-xl p-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5"
              style={{
                background: tab === t.id ? "rgba(34,197,94,0.12)" : "transparent",
                color: tab === t.id ? "#22c55e" : "#94a3b8",
              }}
            >
              {(() => { const TI = t.Icon; return <TI size={16} strokeWidth={1.8} />; })()}
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Content */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-16">
        {!primerosPasos ? (
          <div className="bg-[#1a1d2e] border border-[#2d3142] rounded-xl p-8 text-center">
            <div className="flex justify-center mb-4"><AlertTriangle size={48} strokeWidth={1.2} style={{ color: "#f59e0b" }} /></div>
            <h3 className="text-lg font-semibold text-[#e2e8f0] mb-2">Información en construcción</h3>
            <p className="text-sm text-[#94a3b8]">
              Estamos recopilando información detallada sobre {pais.nombre}. Mientras tanto, puedes explorar las ofertas de empleo disponibles.
            </p>
            <Link
              href={`/app/buscar?pais=${paisCode}`}
              className="inline-flex items-center gap-2 mt-4 px-4 py-2.5 bg-[#22c55e] hover:bg-[#1ea34d] text-black font-semibold rounded-xl text-sm transition-colors"
            >
              <Search size={16} strokeWidth={1.8} className="shrink-0" />Buscar ofertas en {pais.nombre}
            </Link>
          </div>
        ) : (
          <>
            {tab === "au-pair" && <AuPairTab paisCode={paisCode} info={primerosPasos} />}
            {tab === "alojamiento" && <AlojamientoTab paisCode={paisCode} info={primerosPasos} />}
            {tab === "visado" && <VisadoTab paisCode={paisCode} info={primerosPasos} />}
            {tab === "programas" && <ProgramasTab paisCode={paisCode} info={primerosPasos} />}
          </>
        )}
      </section>

      {/* Quick links to job search */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-16 border-t border-[#2d3142] pt-10">
        <h2 className="text-lg font-semibold mb-4 text-center">
          ¿Listo para buscar trabajo en {pais.nombre}? {pais.bandera}
        </h2>
        <div className="flex flex-wrap gap-3 justify-center">
          {pais.keywordsLaborales.slice(0, 6).map((kw) => (
            <Link
              key={kw}
              href={`/app/buscar?keyword=${encodeURIComponent(kw)}&pais=${paisCode}`}
              className="bg-[#1e212b] border border-[#2d3142] hover:border-[#22c55e]/40 rounded-full px-4 py-2 text-sm text-[#94a3b8] transition-colors"
            >
              {kw} en {pais.nombre}
            </Link>
          ))}
          <Link
            href={`/app/buscar?pais=${paisCode}`}
            className="bg-[#22c55e] hover:bg-[#1ea34d] rounded-full px-4 py-2 text-sm text-black font-medium transition-colors"
          >
            Ver todas las ofertas →
          </Link>
        </div>
      </section>
    </main>
  );
}
