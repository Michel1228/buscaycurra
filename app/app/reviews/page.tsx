"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, Suspense } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useRouter, useSearchParams } from "next/navigation";
import InfoTooltip from "@/components/InfoTooltip";

const EMPRESAS_POPULARES = [
  "Mercadona", "Inditex", "El Corte Inglés", "Repsol", "Telefónica",
  "BBVA", "Santander", "Iberdrola", "Amazon", "Lidl",
  "McDonald's", "Burger King", "Mango", "Zara", "DHL",
];

interface Review {
  id: number;
  rating: number;
  title: string;
  comment: string;
  pros: string;
  cons: string;
  would_recommend: boolean;
  created_at: string;
}

interface ReviewStats {
  total: number;
  avgRating: string;
  recommendPct: number;
  distribution: Record<number, number>;
}

function ReviewsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [company, setCompany] = useState(searchParams.get("company") || "");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [pros, setPros] = useState("");
  const [cons, setCons] = useState("");
  const [wouldRecommend, setWouldRecommend] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (company) buscarReviews();
  }, [company]);

  async function buscarReviews() {
    if (!company.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/reviews?company=${encodeURIComponent(company.trim())}`);
      if (res.ok) {
        const data = await res.json() as { reviews: Review[]; stats: ReviewStats };
        setReviews(data.reviews || []);
        setStats(data.stats);
      }
    } catch (e) {
      console.error("Error:", e);
    } finally {
      setLoading(false);
    }
  }

  async function submitReview() {
    if (!rating || !company.trim()) return;
    setSubmitting(true);
    try {
      const session = (await getSupabaseBrowser().auth.getSession()).data.session;
      if (!session) { router.push("/auth/login"); return; }

      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          companyName: company.trim(),
          rating,
          title,
          comment,
          pros,
          cons,
          wouldRecommend,
        }),
      });

      if (res.ok) {
        setShowForm(false);
        setRating(0); setTitle(""); setComment(""); setPros(""); setCons("");
        buscarReviews();
      }
    } catch (e) {
      console.error("Error:", e);
    } finally {
      setSubmitting(false);
    }
  }

  function renderStars(r: number, interactive = false) {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(i => (
          <button key={i} onClick={() => interactive && setRating(i)}
            className={`text-base ${interactive ? "cursor-pointer hover:scale-110 transition" : ""}`}
            style={{ color: i <= r ? "#f59e0b" : "#2d3142" }}
            disabled={!interactive}>
            ★
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16" style={{ background: "#0f1117" }}>
      <div className="py-8 px-4" style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.08), rgba(168,85,247,0.05))" }}>
        <div className="max-w-3xl mx-auto">
          <h1 className="text-xl font-bold" style={{ color: "#f1f5f9" }}>Reviews de empresas</h1>
          <p className="text-xs mt-1" style={{ color: "#64748b" }}>Opiniones reales de quienes han trabajado o aplicado</p>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 py-6">
        <div className="card-game p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <p className="text-xs font-medium" style={{ color: "#94a3b8" }}>Buscar empresa</p>
            <InfoTooltip tip="Las reviews las escriben usuarios reales que han trabajado o aplicado en esa empresa. Puedes añadir tu propia opinión tras buscarla." position="right" />
          </div>
          <div className="flex gap-2">
            <input type="text" value={company} onChange={e => setCompany(e.target.value)}
              placeholder="Nombre de la empresa..." className="flex-1 text-sm"
              onKeyDown={e => e.key === "Enter" && buscarReviews()} />
            <button onClick={buscarReviews} disabled={loading} className="btn-game px-4 py-2 text-xs disabled:opacity-50">
              {loading ? "..." : "Buscar"}
            </button>
          </div>
          {!company && (
            <div className="mt-3">
              <p className="text-[10px] mb-2" style={{ color: "#475569" }}>Empresas más buscadas:</p>
              <div className="flex flex-wrap gap-1.5">
                {EMPRESAS_POPULARES.map(emp => (
                  <button key={emp} onClick={() => setCompany(emp)}
                    className="text-[11px] px-2.5 py-1 rounded-md transition hover:opacity-80"
                    style={{ background: "#161922", border: "1px solid #2d3142", color: "#94a3b8" }}>
                    {emp}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {stats && stats.total > 0 && (
          <div className="card-game p-4 mb-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="text-center">
                <p className="text-3xl font-bold" style={{ color: "#f59e0b" }}>{stats.avgRating}</p>
                <div className="flex justify-center mt-0.5">{renderStars(Math.round(parseFloat(stats.avgRating)))}</div>
                <p className="text-[10px] mt-0.5" style={{ color: "#64748b" }}>{stats.total} reviews</p>
              </div>
              <div className="flex-1 min-w-[180px]">
                {[5, 4, 3, 2, 1].map(star => {
                  const count = stats.distribution[star] || 0;
                  const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
                  return (
                    <div key={star} className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[10px] w-2" style={{ color: "#64748b" }}>{star}</span>
                      <span style={{ color: "#f59e0b" }}>★</span>
                      <div className="flex-1 h-1 rounded-full" style={{ background: "#252836" }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "#f59e0b" }} />
                      </div>
                      <span className="text-[10px] w-5 text-right" style={{ color: "#475569" }}>{count}</span>
                    </div>
                  );
                })}
              </div>
              <div className="text-center">
                <p className="text-xl font-bold" style={{ color: "#22c55e" }}>{stats.recommendPct}%</p>
                <p className="text-[10px]" style={{ color: "#64748b" }}>Recomiendan</p>
              </div>
            </div>
          </div>
        )}

        {company && !showForm && (
          <button onClick={() => setShowForm(true)}
            className="w-full py-2.5 rounded-lg text-xs font-medium mb-4 transition hover:opacity-80"
            style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", color: "#22c55e" }}>
            + Añadir mi review de {company}
          </button>
        )}

        {showForm && (
          <div className="card-game p-4 mb-4 space-y-3">
            <h3 className="font-semibold text-sm" style={{ color: "#f1f5f9" }}>Tu review de {company}</h3>
            <div>
              <label className="text-[11px] block mb-1" style={{ color: "#94a3b8" }}>Valoración</label>
              {renderStars(rating, true)}
            </div>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Título (opcional)" className="w-full text-sm" />
            <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Tu experiencia..." rows={3} className="w-full text-sm resize-none" />
            <div className="grid grid-cols-2 gap-2">
              <input value={pros} onChange={e => setPros(e.target.value)} placeholder="Pros" className="text-sm" />
              <input value={cons} onChange={e => setCons(e.target.value)} placeholder="Contras" className="text-sm" />
            </div>
            <label className="flex items-center gap-2 text-xs" style={{ color: "#94a3b8" }}>
              <input type="checkbox" checked={wouldRecommend} onChange={e => setWouldRecommend(e.target.checked)}
                className="w-3.5 h-3.5 rounded accent-green-500" />
              Recomendaría esta empresa
            </label>
            <div className="flex gap-2">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2 rounded-lg text-[11px]" style={{ border: "1px solid #2d3142", color: "#64748b" }}>Cancelar</button>
              <button onClick={submitReview} disabled={submitting || !rating} className="flex-1 btn-game text-[11px] disabled:opacity-50">
                {submitting ? "Enviando..." : "Publicar"}
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {reviews.map(r => (
            <div key={r.id} className="card-game p-4">
              <div className="flex items-center justify-between mb-2">
                {renderStars(r.rating)}
                <span className="text-[10px]" style={{ color: "#475569" }}>{new Date(r.created_at).toLocaleDateString("es-ES")}</span>
              </div>
              {r.title && <p className="font-semibold text-xs mb-1" style={{ color: "#f1f5f9" }}>{r.title}</p>}
              {r.comment && <p className="text-xs mb-2" style={{ color: "#94a3b8" }}>{r.comment}</p>}
              <div className="flex gap-3 text-[11px]">
                {r.pros && <div><span style={{ color: "#22c55e" }}>✓</span> <span style={{ color: "#64748b" }}>{r.pros}</span></div>}
                {r.cons && <div><span style={{ color: "#ef4444" }}>✗</span> <span style={{ color: "#64748b" }}>{r.cons}</span></div>}
              </div>
              {r.would_recommend !== null && (
                <p className="text-[10px] mt-1.5" style={{ color: r.would_recommend ? "#22c55e" : "#ef4444" }}>
                  {r.would_recommend ? "👍 Recomienda" : "👎 No recomienda"}
                </p>
              )}
            </div>
          ))}
        </div>

        {reviews.length === 0 && company && !loading && (
          <div className="card-game p-8 text-center">
            <p className="text-3xl mb-2">⭐</p>
            <p className="font-semibold text-sm" style={{ color: "#f1f5f9" }}>Sin reviews todavía</p>
            <p className="text-xs" style={{ color: "#64748b" }}>Sé el primero en opinar sobre {company}</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default function ReviewsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen pt-16 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8" style={{ border: "3px solid #2d3142", borderTopColor: "#22c55e" }} />
      </div>
    }>
      <ReviewsPageInner />
    </Suspense>
  );
}
