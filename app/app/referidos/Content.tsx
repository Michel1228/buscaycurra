"use client";

import { useState, useEffect, Suspense } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useRouter, useSearchParams } from "next/navigation";

interface DatosReferidos {
  codigo: string;
  invitados: number;
  invitadosEsteMes: number;
  topeAlMes: number;
  enviosExtra: number;
  fotosExtra: number;
  link: string;
}

function ReferidosPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [datos, setDatos] = useState<DatosReferidos | null>(null);
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
        if (res.ok) setDatos(await res.json() as DatosReferidos);
      } catch (e) {
        console.error("Error cargando referidos:", e);
      } finally {
        setLoading(false);
      }
    }
    cargar();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const enlace = datos ? `https://buscaycurra.es/auth/registro?ref=${datos.codigo}` : "";
  // Lo que se manda por WhatsApp: corto, con lo que gana el amigo, que es lo que le hace pulsar.
  const mensaje = `Te paso BuscayCurra, una app para buscar trabajo y mandar tu CV a las empresas. Si te registras con mi enlace empiezas con 5 envíos de CV extra: ${enlace}`;

  async function copiarLink() {
    await navigator.clipboard.writeText(enlace);
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
      <div className="py-8 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-1" style={{ color: "#f8fafc" }}>Invita a un amigo y ganáis los dos</h1>
          <p className="text-xs" style={{ color: "#94a3b8" }}>Para quien también esté buscando trabajo</p>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* LO QUE SE GANA, LO PRIMERO (21 oct 2026). Ponía "Invita y gana" y no
            decía qué. Las cifras salen de lib/referidos/premios.ts. */}
        <div className="card-game p-5">
          <h2 className="font-semibold text-sm mb-3" style={{ color: "#f1f5f9" }}>Lo que ganáis</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="rounded-lg p-3" style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)" }}>
              <p className="text-[11px] font-semibold uppercase tracking-wide mb-1" style={{ color: "#22c55e" }}>Tú</p>
              <p className="text-sm font-bold" style={{ color: "#f1f5f9" }}>+5 envíos de CV y +1 foto con la cámara</p>
              <p className="text-xs mt-1" style={{ color: "#94a3b8" }}>Por cada amigo que se registre con tu enlace y confirme su correo.</p>
            </div>
            <div className="rounded-lg p-3" style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.18)" }}>
              <p className="text-[11px] font-semibold uppercase tracking-wide mb-1" style={{ color: "#f59e0b" }}>Tu amigo</p>
              <p className="text-sm font-bold" style={{ color: "#f1f5f9" }}>Empieza con 5 envíos de CV extra</p>
              <p className="text-xs mt-1" style={{ color: "#94a3b8" }}>Por llegar con tu enlace.</p>
            </div>
          </div>
          <p className="text-[11px] mt-3" style={{ color: "#8b98ad" }}>
            Los extras se usan cuando se te acaban los de tu plan y no caducan. Hasta {datos?.topeAlMes ?? 10} amigos al mes.
          </p>
        </div>

        {datos && (
          <div className="grid grid-cols-3 gap-2">
            {[
              { n: datos.invitados, t: "amigos invitados" },
              { n: datos.enviosExtra, t: "envíos extra" },
              { n: datos.fotosExtra, t: "fotos extra" },
            ].map(c => (
              <div key={c.t} className="card-game p-3 text-center">
                <p className="text-xl font-bold" style={{ color: "#22c55e" }}>{c.n}</p>
                <p className="text-[10px] mt-0.5" style={{ color: "#8b98ad" }}>{c.t}</p>
              </div>
            ))}
          </div>
        )}

        {datos && <div className="card-game p-5">
          <h2 className="font-semibold text-sm mb-3" style={{ color: "#f1f5f9" }}>Tu enlace</h2>
          <div className="p-2.5 rounded-lg text-center font-mono text-sm font-bold tracking-widest mb-3"
            style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)", color: "#22c55e" }}>
            {datos.codigo}
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <a href={`https://wa.me/?text=${encodeURIComponent(mensaje)}`} target="_blank" rel="noopener noreferrer"
              className="flex-1 text-center px-4 py-2.5 rounded-lg text-sm font-semibold btn-game">
              Compartir por WhatsApp
            </a>
            <button onClick={copiarLink}
              className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition hover:opacity-80"
              style={{ background: "rgba(12,15,22,0.86)", border: "1px solid rgba(148,163,184,0.18)", color: "#f1f5f9" }}>
              {copiado ? "¡Copiado!" : "Copiar enlace"}
            </button>
          </div>
          {datos.invitadosEsteMes >= datos.topeAlMes && (
            <p className="text-[11px] mt-3" style={{ color: "#f59e0b" }}>
              Este mes ya tienes {datos.topeAlMes} amigos con premio. Los que lleguen ahora también empiezan con sus 5 envíos; los tuyos vuelven el mes que viene.
            </p>
          )}
        </div>}

        <div className="card-game p-5">
          <h2 className="font-semibold text-sm mb-3" style={{ color: "#f1f5f9" }}>¿Te ha pasado alguien su código?</h2>
          <div className="flex gap-2">
            <input type="text" value={canjearInput} onChange={e => setCanjearInput(e.target.value)}
              placeholder="Pega el código" className="flex-1 text-sm uppercase" maxLength={10} />
            <button onClick={canjearCodigo}
              className="px-4 py-2 rounded-lg text-xs font-semibold transition hover:opacity-80"
              style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#fff" }}>
              Canjear
            </button>
          </div>
          <p className="text-[11px] mt-2" style={{ color: "#8b98ad" }}>Para cuentas creadas en el último mes.</p>
          {canjearMsg && <p className="text-[11px] mt-2" style={{ color: "#22c55e" }}>{canjearMsg}</p>}
          {canjearError && <p className="text-[11px] mt-2" style={{ color: "#ef4444" }}>{canjearError}</p>}
        </div>

        <div className="card-game p-5">
          <h2 className="font-semibold text-sm mb-3" style={{ color: "#f1f5f9" }}>¿Cómo funciona?</h2>
          <div className="space-y-2">
            {[
              { num: "1", text: "Mándale tu enlace a alguien que esté buscando trabajo" },
              { num: "2", text: "Se registra con él y confirma su correo" },
              { num: "3", text: "Os damos los envíos a los dos, y a ti la foto. Te avisamos en la campana" },
            ].map(paso => (
              <div key={paso.num} className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
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
