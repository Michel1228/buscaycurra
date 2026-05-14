"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, Suspense } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useRouter, useSearchParams } from "next/navigation";
import InfoTooltip from "@/components/InfoTooltip";

function ReferidosPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [codigo, setCodigo] = useState("");
  const [stats, setStats] = useState({ invitados: 0, creditos: 0 });
  const [loading, setLoading] = useState(true);
  const [copiado, setCopiado] = useState(false);
  const [canjearInput, setCanjearInput] = useState("");
  const [canjearMsg, setCanjearMsg] = useState("");
  const [canjearError, setCanjearError] = useState("");

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) setCanjearInput(ref);
  }, [searchParams]);

  useEffect(() => {
    async function cargar() {
      try {
        const session = (await getSupabaseBrowser().auth.getSession()).data.session;
        if (!session) { router.push("/auth/login"); return; }

        const res = await fetch("/api/referidos", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (res.ok) {
          const data = await res.json() as { codigo: string; invitados: number; creditos: number; link: string };
          setCodigo(data.codigo);
          setStats({ invitados: data.invitados, creditos: data.creditos });
        }
      } catch (e) {
        console.error("Error cargando referidos:", e);
      } finally {
        setLoading(false);
      }
    }
    cargar();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function copiarLink() {
    const link = `https://buscaycurra.es/auth/registro?ref=${codigo}`;
    await navigator.clipboard.writeText(link);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  async function canjearCodigo() {
    setCanjearMsg("");
    setCanjearError("");
    try {
      const session = (await getSupabaseBrowser().auth.getSession()).data.session;
      if (!session) return;
      const res = await fetch("/api/referidos", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ codigo: canjearInput }),
      });
      const data = await res.json() as { success?: boolean; mensaje?: string; error?: string };
      if (res.ok && data.success) {
        setCanjearMsg(data.mensaje || "¡Código canjeado!");
        setCanjearInput("");
      } else {
        setCanjearError(data.error || "Error al canjear");
      }
    } catch {
      setCanjearError("Error de red");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center" style={{ background: "#0f1117" }}>
        <div className="animate-spin rounded-full h-8 w-8" style={{ border: "3px solid #2d3142", borderTopColor: "#22c55e" }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16" style={{ background: "#0f1117" }}>
      <div className="py-8 px-4" style={{ background: "linear-gradient(135deg, rgba(34,197,94,0.08), rgba(245,158,11,0.05))" }}>
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-xl font-bold mb-1" style={{ color: "#f1f5f9" }}>Invita y gana</h1>
          <p className="text-xs" style={{ color: "#64748b" }}>Por cada amigo que se registre, ambos ganáis +10 CVs extra</p>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="card-game p-4 text-center">
            <p className="text-2xl font-bold" style={{ color: "#22c55e" }}>{stats.invitados}</p>
            <p className="text-[10px] mt-0.5" style={{ color: "#64748b" }}>Amigos invitados</p>
          </div>
          <div className="card-game p-4 text-center">
            <div className="flex items-center justify-center gap-1.5">
              <p className="text-2xl font-bold" style={{ color: "#f59e0b" }}>{stats.creditos}</p>
              <InfoTooltip text="Cada amigo que se registra con tu código te da +10 CVs extra al mes. Los créditos se añaden automáticamente a tu cuota mensual." position="top" />
            </div>
            <p className="text-[10px] mt-0.5" style={{ color: "#64748b" }}>CVs extra ganados</p>
          </div>
        </div>

        <div className="card-game p-5">
          <h2 className="font-semibold text-sm mb-3" style={{ color: "#f1f5f9" }}>Tu código de invitación</h2>
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 p-2.5 rounded-lg text-center font-mono text-sm font-bold tracking-widest"
              style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)", color: "#22c55e" }}>
              {codigo}
            </div>
            <button onClick={copiarLink}
              className="px-4 py-2.5 rounded-lg text-xs font-semibold transition hover:opacity-80 btn-game">
              {copiado ? "¡Copiado!" : "Copiar link"}
            </button>
          </div>
          <p className="text-[11px]" style={{ color: "#64748b" }}>
            Comparte este link con tus amigos. Cuando se registren, ambos recibiréis +10 CVs extra al mes.
          </p>
        </div>

        <div className="card-game p-5">
          <h2 className="font-semibold text-sm mb-3" style={{ color: "#f1f5f9" }}>¿Tienes un código?</h2>
          <div className="flex gap-2">
            <input type="text" value={canjearInput} onChange={e => setCanjearInput(e.target.value)}
              placeholder="Pega el código" className="flex-1 text-sm uppercase" maxLength={10} />
            <button onClick={canjearCodigo}
              className="px-4 py-2 rounded-lg text-xs font-semibold transition hover:opacity-80"
              style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#fff" }}>
              Canjear
            </button>
          </div>
          {canjearMsg && <p className="text-[11px] mt-2" style={{ color: "#22c55e" }}>{canjearMsg}</p>}
          {canjearError && <p className="text-[11px] mt-2" style={{ color: "#ef4444" }}>{canjearError}</p>}
        </div>

        <div className="card-game p-5">
          <h2 className="font-semibold text-sm mb-3" style={{ color: "#f1f5f9" }}>¿Cómo funciona?</h2>
          <div className="space-y-2">
            {[
              { num: "1", text: "Copia tu link de invitación" },
              { num: "2", text: "Compártelo con amigos que buscan trabajo" },
              { num: "3", text: "Cuando se registren, ambos ganáis +10 CVs" },
              { num: "4", text: "Sin límite de invitados" },
            ].map(paso => (
              <div key={paso.num} className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                  style={{ background: "rgba(34,197,94,0.12)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.2)" }}>
                  {paso.num}
                </div>
                <p className="text-xs" style={{ color: "#94a3b8" }}>{paso.text}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ReferidosPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen pt-16 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8" style={{ border: "3px solid #2d3142", borderTopColor: "#22c55e" }} />
      </div>
    }>
      <ReferidosPageInner />
    </Suspense>
  );
}
