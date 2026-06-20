"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Briefcase, MapPin, Mail, Banknote, ArrowRight, ExternalLink } from "lucide-react";

interface OfertaAuPair {
  title: string;
  company: string;
  email: string;
  country: string;
  city: string;
  salary: string;
  url: string;
}

interface Stats {
  total: number;
  con_email: number;
  paises: number;
  empresas: number;
}

export default function AuPairOfertasRecientes() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [ofertas, setOfertas] = useState<OfertaAuPair[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/au-pair/ofertas")
      .then(r => r.json())
      .then(d => {
        setStats(d.stats);
        setOfertas(d.ofertas || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const irABuscador = () => {
    router.push("/app/buscar?q=au pair&categoria=au_pair");
  };

  if (loading) {
    return (
      <section className="card-game p-4 sm:p-6 mt-6">
        <div className="animate-pulse space-y-4">
          <div className="h-5 bg-[#2d3142] rounded w-48" />
          <div className="h-3 bg-[#2d3142] rounded w-64" />
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-[#2d3142] rounded" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="card-game p-4 sm:p-6 mt-6">
      {/* Cabecera con contador */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-[#f1f5f9] flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-[#22c55e]" />
            Ofertas Au Pair — {stats?.total?.toLocaleString() || "..."} disponibles
          </h2>
          <p className="text-sm text-[#94a3b8] mt-1">
            {stats ? (
              <>
                <span className="text-[#22c55e] font-bold">{stats.con_email.toLocaleString()}</span> con email de contacto
                {" · "}
                <span className="text-[#f1f5f9]">{stats.paises}</span> países
                {" · "}
                <span className="text-[#f1f5f9]">{stats.empresas}</span> agencias y familias
              </>
            ) : "..."}
          </p>
        </div>
        <button
          onClick={irABuscador}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
          style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "#fff" }}
        >
          Ver todas <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Lista de ofertas */}
      {ofertas.length > 0 ? (
        <div className="space-y-2">
          {ofertas.map((o, i) => (
            <div
              key={i}
              className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-[#0f1117] border border-[#2d3142] hover:border-[#22c55e]/30 transition-colors group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-[#f1f5f9] truncate">{o.title}</span>
                  {o.salary && o.salary !== "Ver en oferta" && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e" }}>
                      <Banknote className="w-3 h-3 inline mr-0.5" />
                      {o.salary.length > 20 ? o.salary.slice(0, 20) + "…" : o.salary}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-[#64748b]">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {o.city && o.city !== "Ver en oferta" ? `${o.city}, ` : ""}{o.country}
                  </span>
                  <span className="text-[#94a3b8]">{o.company}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {o.email && (
                  <a
                    href={`mailto:${o.email}?subject=Au Pair Application - ${encodeURIComponent(o.title)}`}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors opacity-0 group-hover:opacity-100 sm:opacity-100"
                    style={{ background: "#1a2e1a", color: "#22c55e", border: "1px solid rgba(34,197,94,0.2)" }}
                  >
                    <Mail className="w-3 h-3" />
                    Contactar
                  </a>
                )}
                {o.url && o.url !== "Ver en oferta" && (
                  <a
                    href={o.url}
                    target="_blank"
                    rel="noopener"
                    className="text-xs px-2 py-1.5 text-[#64748b] hover:text-[#f1f5f9]"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-[#64748b] text-center py-4">
          Cargando ofertas au pair...
        </p>
      )}

      {/* Link al buscador */}
      <div className="mt-4 pt-4 border-t border-[#2d3142] text-center">
        <button
          onClick={irABuscador}
          className="text-sm text-[#22c55e] hover:underline"
        >
          🔍 Buscar ofertas au pair por país, ciudad o salario →
        </button>
      </div>
    </section>
  );
}
