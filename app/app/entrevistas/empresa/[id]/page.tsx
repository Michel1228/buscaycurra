"use client";

/**
 * /app/entrevistas/empresa/[id] — Ensayar la entrevista de una empresa que se ha
 * interesado por mí (lib/entrevistas/empresa.ts).
 *
 * Después de cada respuesta, la IA dice qué puntos de los que busca la empresa
 * ha cubierto, para mejorarla. Eso solo lo ve el candidato. Cuando quiere, manda
 * a la empresa el texto de sus respuestas, sin ninguna nota: las valora una
 * persona de la empresa.
 */
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import VoiceRecorder from "@/components/VoiceInterview/VoiceRecorder";
import { Building2, Check, Lock, Volume2, X } from "lucide-react";
import { notaDePuntos } from "@/lib/entrevistas/puntos";

interface Pregunta { texto: string; puntos: string[] }
interface Invitacion {
  id: string; empresa: string; puesto: string; preguntas: Pregunta[];
  intentos: number; respuestas: string[] | null; enviadaEn: string | null; leida: boolean;
}
interface Resultado { cubiertos: boolean[]; consejo: string }

const nuevaSesion = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `s-${Date.now()}-${Math.random().toString(36).slice(2)}`);

function leerEnVoz(texto: string) {
  try {
    const s = window.speechSynthesis;
    s.cancel();
    const u = new SpeechSynthesisUtterance(texto);
    u.lang = "es-ES";
    u.rate = 0.95;
    s.speak(u);
  } catch { /* sin voz en este navegador */ }
}

export default function EntrevistaEmpresaPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [token, setToken] = useState("");
  const [inv, setInv] = useState<Invitacion | null>(null);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);
  const [sesion, setSesion] = useState("");
  const [idx, setIdx] = useState(0);
  const [respuestas, setRespuestas] = useState<string[]>([]);
  const [resultados, setResultados] = useState<(Resultado | null)[]>([]);
  const [comprobando, setComprobando] = useState(false);
  const [aviso, setAviso] = useState("");
  const [terminado, setTerminado] = useState(false);
  const [mandando, setMandando] = useState(false);
  const [confirmar, setConfirmar] = useState(false);
  // El servidor cuenta un ensayo por sesión; esto evita contarlo dos veces en pantalla.
  const [contada, setContada] = useState("");

  const clave = `bc_entrevista_empresa_${id}`;

  useEffect(() => {
    (async () => {
      const { data: { session } } = await getSupabaseBrowser().auth.getSession();
      if (!session) { router.push(`/auth/login?redirect=${encodeURIComponent(`/app/entrevistas/empresa/${id}`)}`); return; }
      setToken(session.access_token);
      const r = await fetch(`/api/entrevistas/empresa?id=${encodeURIComponent(id)}`, { headers: { Authorization: `Bearer ${session.access_token}` } });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.invitacion) { setError(j.error || "No se ha podido abrir esta entrevista."); setCargando(false); return; }
      const i: Invitacion = j.invitacion;
      setInv(i);
      // Se retoma el ensayo a medias (solo en este móvil u ordenador).
      try {
        const g = JSON.parse(localStorage.getItem(clave) || "null");
        if (g && Array.isArray(g.respuestas) && g.respuestas.length === i.preguntas.length) {
          setRespuestas(g.respuestas); setResultados(g.resultados || []); setIdx(Math.min(g.idx || 0, i.preguntas.length - 1));
          setSesion(g.sesion || nuevaSesion()); setTerminado(!!g.terminado); setContada(g.contada || "");
        } else {
          setRespuestas(i.preguntas.map(() => "")); setResultados(i.preguntas.map(() => null)); setSesion(nuevaSesion());
        }
      } catch {
        setRespuestas(i.preguntas.map(() => "")); setResultados(i.preguntas.map(() => null)); setSesion(nuevaSesion());
      }
      setCargando(false);
    })();
  }, [id, router, clave]);

  useEffect(() => {
    if (!inv) return;
    try { localStorage.setItem(clave, JSON.stringify({ respuestas, resultados, idx, sesion, terminado, contada })); } catch { /* da igual */ }
  }, [inv, respuestas, resultados, idx, sesion, terminado, contada, clave]);

  const ponerRespuesta = useCallback((t: string) => {
    setRespuestas((r) => r.map((x, i) => (i === idx ? t : x)));
    setResultados((r) => r.map((x, i) => (i === idx ? null : x)));
  }, [idx]);

  async function comprobar() {
    if (!inv || !respuestas[idx]?.trim()) return;
    setComprobando(true); setAviso("");
    try {
      const r = await fetch("/api/entrevistas/empresa/comprobar", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: inv.id, indice: idx, respuesta: respuestas[idx], sesion }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !Array.isArray(j.cubiertos)) { setAviso(j.error || "No se ha podido comprobar ahora."); return; }
      setResultados((res) => res.map((x, i) => (i === idx ? { cubiertos: j.cubiertos, consejo: j.consejo || "" } : x)));
      if (contada !== sesion) { setContada(sesion); setInv({ ...inv, intentos: inv.intentos + 1 }); }
    } catch {
      setAviso("No se ha podido comprobar ahora. Inténtalo de nuevo en un momento.");
    } finally {
      setComprobando(false);
    }
  }

  function otraVez() {
    if (!inv) return;
    setRespuestas(inv.preguntas.map(() => "")); setResultados(inv.preguntas.map(() => null));
    setIdx(0); setTerminado(false); setSesion(nuevaSesion()); setConfirmar(false);
  }

  async function mandar() {
    if (!inv) return;
    setMandando(true); setAviso("");
    try {
      const r = await fetch("/api/entrevistas/empresa/enviar", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: inv.id, respuestas }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { setAviso(j.error || "No se pudieron mandar."); return; }
      setInv({ ...inv, respuestas, enviadaEn: new Date().toISOString(), leida: false });
      setConfirmar(false);
    } finally {
      setMandando(false);
    }
  }

  async function quitar() {
    if (!inv || !window.confirm(`¿Quitar la invitación de ${inv.empresa}? Si les mandaste tus respuestas, se borran también.`)) return;
    const r = await fetch(`/api/entrevistas/empresa?id=${encodeURIComponent(inv.id)}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    if (r.ok) { try { localStorage.removeItem(clave); } catch { /* da igual */ } router.push("/app/entrevistas"); }
  }

  const caja = { background: "#1e212b", border: "1px solid #2d3142" };

  if (cargando) return <div className="min-h-screen pt-24 text-center text-sm" style={{ background: "#0f1117", color: "#6b7280" }}>Cargando la entrevista…</div>;
  if (error || !inv) {
    return (
      <div className="min-h-screen pt-24 px-4 text-center" style={{ background: "#0f1117" }}>
        <p className="text-sm mb-4" style={{ color: "#94a3b8" }}>{error}</p>
        <button onClick={() => router.push("/app/entrevistas")} className="btn-game px-5 py-2.5 text-sm">Ir al simulador</button>
      </div>
    );
  }

  const p = inv.preguntas[idx];
  const res = resultados[idx];
  const todas = resultados.every(Boolean);
  const nota = todas ? notaDePuntos(resultados.map((r) => r!.cubiertos)) : null;

  return (
    <div className="min-h-screen pt-16 pb-10 px-4" style={{ background: "#0f1117" }}>
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="text-center pt-2">
          <div className="flex justify-center mb-2"><Building2 size={32} strokeWidth={1.3} style={{ color: "#22c55e" }} /></div>
          <h1 className="text-xl font-bold text-white">{inv.empresa}</h1>
          <p className="text-sm mt-0.5" style={{ color: "#94a3b8" }}>Entrevista de {inv.puesto}</p>
        </div>

        <div className="rounded-xl px-4 py-3 text-xs leading-relaxed flex gap-2.5" style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)", color: "#cbd5e1" }}>
          <Lock size={15} strokeWidth={1.8} className="shrink-0 mt-0.5" style={{ color: "#22c55e" }} />
          <span>
            Se ha interesado por tu perfil y te invita a preparar su entrevista. Ensaya las veces que quieras: lo que practiques <b>solo lo ves tú</b>.
            Cuando estés listo, puedes mandarle tus respuestas. Las leerá y valorará una persona de la empresa: <b>no le llega ninguna nota automática</b>.
          </span>
        </div>

        {inv.enviadaEn && (
          <p className="text-xs text-center" style={{ color: "#22c55e" }}>
            ✓ Mandaste tus respuestas el {new Date(inv.enviadaEn).toLocaleDateString("es-ES", { day: "numeric", month: "long" })}.
            {inv.leida ? " La empresa ya las ha leído." : " La empresa todavía no las ha leído."}
          </p>
        )}

        {!terminado ? (
          <>
            <div>
              <div className="flex justify-between text-xs mb-1" style={{ color: "#64748b" }}>
                <span>Pregunta {idx + 1} de {inv.preguntas.length}</span>
              </div>
              <div className="h-1.5 rounded-full" style={{ background: "#1e212b" }}>
                <div className="h-1.5 rounded-full transition-all" style={{ background: "#22c55e", width: `${(idx / inv.preguntas.length) * 100}%` }} />
              </div>
            </div>

            <div className="rounded-2xl p-5 flex items-start justify-between gap-3" style={caja}>
              <p className="text-base font-medium text-white leading-relaxed flex-1">{p.texto}</p>
              <button onClick={() => leerEnVoz(p.texto)} className="p-2 rounded-lg shrink-0" style={{ background: "#0f1117", color: "#22c55e" }} aria-label="Escuchar la pregunta">
                <Volume2 size={18} strokeWidth={1.8} />
              </button>
            </div>

            <VoiceRecorder value={respuestas[idx] || ""} onChange={ponerRespuesta} disabled={comprobando} />

            {res && (
              <div className="rounded-2xl p-4 space-y-3" style={caja}>
                <p className="text-[10px] uppercase tracking-wide font-semibold" style={{ color: "#22c55e" }}>
                  Lo que busca la empresa · {res.cubiertos.filter(Boolean).length} de {res.cubiertos.length}
                </p>
                <ul className="space-y-1.5">
                  {p.puntos.map((pt, i) => (
                    <li key={i} className="flex gap-2 text-sm" style={{ color: res.cubiertos[i] ? "#e2e8f0" : "#94a3b8" }}>
                      {res.cubiertos[i] ? <Check size={16} className="shrink-0 mt-0.5" style={{ color: "#22c55e" }} /> : <X size={16} className="shrink-0 mt-0.5" style={{ color: "#f59e0b" }} />}
                      {pt}
                    </li>
                  ))}
                </ul>
                {res.consejo && <p className="text-sm leading-relaxed" style={{ color: "#cbd5e1" }}>{res.consejo}</p>}
                <p className="text-[11px]" style={{ color: "#64748b" }}>Si quieres, cambia tu respuesta y vuelve a comprobarla. Esto solo lo ves tú.</p>
              </div>
            )}

            {aviso && <p role="alert" className="text-sm" style={{ color: "#f59e0b" }}>{aviso}</p>}

            <div className="flex gap-3">
              <button onClick={() => void comprobar()} disabled={!respuestas[idx]?.trim() || comprobando || !!res}
                className="flex-1 py-3 rounded-xl font-semibold text-sm"
                style={{ background: respuestas[idx]?.trim() && !comprobando && !res ? "#22c55e" : "#1e212b", color: respuestas[idx]?.trim() && !comprobando && !res ? "#fff" : "#64748b" }}>
                {comprobando ? "Comprobando…" : "Comprobar"}
              </button>
              <button onClick={() => (idx < inv.preguntas.length - 1 ? setIdx(idx + 1) : setTerminado(true))} disabled={!res}
                className="flex-1 py-3 rounded-xl font-semibold text-sm"
                style={{ background: res ? "#1e212b" : "#0f1117", color: res ? "#e5e7eb" : "#2d3142", border: `1px solid ${res ? "#2d3142" : "#1e212b"}` }}>
                {idx < inv.preguntas.length - 1 ? "Siguiente →" : "Terminar"}
              </button>
            </div>
            {idx > 0 && <button onClick={() => setIdx(idx - 1)} className="text-xs" style={{ color: "#64748b" }}>← Pregunta anterior</button>}
          </>
        ) : (
          <>
            <div className="rounded-2xl p-5 text-center" style={caja}>
              <p className="text-[10px] uppercase tracking-wide font-semibold mb-1" style={{ color: "#64748b" }}>Tu preparación · solo la ves tú</p>
              <p className="text-4xl font-bold" style={{ color: "#22c55e" }}>{nota ?? "–"}<span className="text-lg" style={{ color: "#64748b" }}>/100</span></p>
              <p className="text-xs mt-2" style={{ color: "#94a3b8" }}>Son los puntos que busca la empresa que has cubierto en tus respuestas. Llevas {inv.intentos} {inv.intentos === 1 ? "ensayo" : "ensayos"}.</p>
            </div>

            <div className="space-y-3">
              {inv.preguntas.map((q, i) => (
                <div key={i} className="rounded-xl p-4" style={caja}>
                  <p className="text-xs font-semibold mb-1" style={{ color: "#22c55e" }}>{i + 1}. {q.texto}</p>
                  <p className="text-sm" style={{ color: "#cbd5e1" }}>{respuestas[i]}</p>
                  {resultados[i] && <p className="text-[11px] mt-1" style={{ color: "#64748b" }}>{resultados[i]!.cubiertos.filter(Boolean).length} de {q.puntos.length} puntos</p>}
                </div>
              ))}
            </div>

            {aviso && <p role="alert" className="text-sm" style={{ color: "#f59e0b" }}>{aviso}</p>}

            {!confirmar ? (
              <div className="flex flex-col gap-2.5">
                <button onClick={() => setConfirmar(true)} className="btn-game w-full py-3 text-sm">
                  {inv.enviadaEn ? "Mandar estas respuestas en lugar de las anteriores" : `Mandar mis respuestas a ${inv.empresa}`}
                </button>
                <button onClick={otraVez} className="w-full py-3 rounded-xl text-sm" style={{ border: "1px solid #2d3142", color: "#e5e7eb" }}>Ensayar otra vez</button>
              </div>
            ) : (
              <div className="rounded-2xl p-4 space-y-3" style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.25)" }}>
                <p className="text-sm leading-relaxed" style={{ color: "#e2e8f0" }}>
                  A {inv.empresa} le llegará lo que has contestado en cada pregunta y cuántas veces has ensayado. <b>No le llega tu nota</b>: tus respuestas las valora una persona.
                </p>
                <div className="flex gap-2">
                  <button onClick={() => void mandar()} disabled={mandando} className="btn-game flex-1 py-2.5 text-sm">{mandando ? "Mandando…" : "Sí, mandarlas"}</button>
                  <button onClick={() => setConfirmar(false)} className="flex-1 py-2.5 rounded-xl text-sm" style={{ border: "1px solid #2d3142", color: "#94a3b8" }}>Todavía no</button>
                </div>
              </div>
            )}
          </>
        )}

        <button onClick={() => void quitar()} className="block mx-auto text-xs pt-2" style={{ color: "#64748b" }}>Quitar esta invitación</button>
      </div>
    </div>
  );
}
