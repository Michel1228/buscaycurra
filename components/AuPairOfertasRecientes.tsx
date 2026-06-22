"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { Briefcase, MapPin, Send, Banknote, ArrowRight, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

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

type Modo = "au_pair" | "live_in_nanny";

interface Props {
  modo?: Modo;
}

const LABELS: Record<Modo, { titulo: string; keyword: string; categoria: string }> = {
  au_pair: { titulo: "Ofertas Au Pair", keyword: "au pair", categoria: "au_pair" },
  live_in_nanny: { titulo: "Ofertas Live-in Nanny", keyword: "live in nanny", categoria: "live_in_nanny" },
};

export default function AuPairOfertasRecientes({ modo = "au_pair" }: Props) {
  const router = useRouter();
  const supabase = getSupabaseBrowser();
  const [stats, setStats] = useState<Stats | null>(null);
  const [ofertas, setOfertas] = useState<OfertaAuPair[]>([]);
  const [loading, setLoading] = useState(true);
  const [enviandoIdx, setEnviandoIdx] = useState<number | null>(null);
  const [enviadosIdx, setEnviadosIdx] = useState<Set<number>>(new Set());
  const [erroresIdx, setErroresIdx] = useState<Record<number, string>>({});

  const labels = LABELS[modo];

  useEffect(() => {
    fetch(`/api/au-pair/ofertas?modo=${modo}`)
      .then(r => r.json())
      .then(d => {
        setStats(d.stats);
        setOfertas(d.ofertas || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [modo]);

  const irABuscador = () => {
    router.push(`/app/buscar?keyword=${encodeURIComponent(labels.keyword)}&categoria=${labels.categoria}&auto=1&location=`);
  };

  /** Enviar CV a esta oferta usando nuestro sistema interno */
  const enviarCv = useCallback(async (idx: number, oferta: OfertaAuPair) => {
    setEnviandoIdx(idx);
    setErroresIdx(prev => { const next = {...prev}; delete next[idx]; return next; });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setErroresIdx(prev => ({ ...prev, [idx]: "Inicia sesión para enviar CV" }));
        setEnviandoIdx(null);
        return;
      }

      let email = oferta.email;

      // Si no hay email, intentar extraerlo
      if (!email || email === "Ver en oferta") {
        try {
          const extractRes = await fetch("/api/company/extract", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
            body: JSON.stringify({ companyName: oferta.company }),
          });
          const extractData = await extractRes.json();
          if (extractData.email) email = extractData.email;
        } catch {}
      }

      if (!email || email === "Ver en oferta") {
        setErroresIdx(prev => ({ ...prev, [idx]: "No se pudo obtener el email de contacto" }));
        setEnviandoIdx(null);
        return;
      }

      // Enviar CV
      const res = await fetch("/api/cv-sender/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          companyName: oferta.company,
          companyEmail: email,
          companyUrl: "",
          jobTitle: oferta.title,
          strategy: "ahora",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErroresIdx(prev => ({ ...prev, [idx]: data.error || "Error al enviar" }));
      } else {
        setEnviadosIdx(prev => new Set([...prev, idx]));
      }
    } catch {
      setErroresIdx(prev => ({ ...prev, [idx]: "Error de conexión" }));
    } finally {
      setEnviandoIdx(null);
    }
  }, [supabase]);

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

  const total = stats?.total?.toLocaleString() || "...";

  return (
    <section className="card-game p-4 sm:p-6 mt-6">
      {/* Cabecera con contador */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-[#f1f5f9] flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-[#22c55e]" />
            {labels.titulo} — {total} disponibles
          </h2>
          <p className="text-sm text-[#94a3b8] mt-1">
            {stats ? (
              <>
                <span className="text-[#f1f5f9] font-bold">{stats.paises}</span> países
                {" · "}
                <span className="text-[#f1f5f9] font-bold">{stats.empresas}</span> agencias y familias
                {" · "}
                <span className="text-[#22c55e]">envío directo desde BuscayCurra</span>
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
          {ofertas.map((o, i) => {
            const enviado = enviadosIdx.has(i);
            const enviando = enviandoIdx === i;
            const error = erroresIdx[i];

            return (
              <div
                key={i}
                className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-[#0f1117] border border-[#2d3142] hover:border-[#22c55e]/30 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-[#f1f5f9] truncate">{o.title}</span>
                    {o.salary && o.salary !== "Ver en oferta" && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e" }}>
                        <Banknote className="w-3 h-3 inline mr-0.5" />
                        {o.salary.length > 25 ? o.salary.slice(0, 25) + "…" : o.salary}
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
                  {error && (
                    <p className="text-[10px] text-[#ef4444] mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {error}
                    </p>
                  )}
                </div>

                {/* Botón de envío */}
                <div className="shrink-0">
                  {enviado ? (
                    <span className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-medium text-[#22c55e]" style={{ background: "rgba(34,197,94,0.08)" }}>
                      <CheckCircle2 className="w-3 h-3" /> Enviado
                    </span>
                  ) : (
                    <button
                      onClick={() => enviarCv(i, o)}
                      disabled={enviando}
                      className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-medium transition-all disabled:opacity-50"
                      style={{
                        background: enviando ? "#1e212b" : "linear-gradient(135deg, #22c55e, #16a34a)",
                        color: enviando ? "#64748b" : "#fff",
                      }}
                    >
                      {enviando ? (
                        <><Loader2 className="w-3 h-3 animate-spin" /> Enviando...</>
                      ) : (
                        <><Send className="w-3 h-3" /> Enviar CV</>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-[#64748b] text-center py-4">
          Cargando ofertas {modo === "live_in_nanny" ? "live-in nanny" : "au pair"}...
        </p>
      )}

      {/* Link al buscador */}
      <div className="mt-4 pt-4 border-t border-[#2d3142] text-center">
        <button
          onClick={irABuscador}
          className="text-sm text-[#22c55e] hover:underline"
        >
          🔍 Buscar ofertas {modo === "live_in_nanny" ? "live-in nanny" : "au pair"} por país, ciudad o salario →
        </button>
      </div>
    </section>
  );
}
