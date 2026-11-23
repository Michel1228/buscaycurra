"use client";

/**
 * /app/entrevistas/empresa/[id] — La entrevista que una empresa te ha mandado.
 *
 * 23 nov 2026 (Michel): «no es una simulación: la empresa la manda para que
 * hagan la entrevista desde la aplicación». Es una entrevista de verdad: el
 * candidato contesta cada pregunta hablando o escribiendo, puede rehacer sus
 * respuestas antes de mandarlas y las manda una vez. No ve qué espera oír la
 * empresa ni ninguna nota: todos con las mismas reglas, y la valora una persona
 * de la empresa (lib/entrevistas/empresa.ts). Para ensayar antes está el
 * simulador de siempre, con preguntas de su sector.
 *
 * Lo que va contestando se guarda en este móvil u ordenador, por si sale y vuelve.
 */
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Clock, Dumbbell, MessagesSquare, Mic, PenLine, Send, Volume2 } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import VoiceRecorder from "@/components/VoiceInterview/VoiceRecorder";
import LogoEmpresa from "@/components/neon/LogoEmpresa";
import { Etiqueta } from "@/components/neon/Neon";

interface Invitacion {
  id: string; empresa: string; puesto: string; preguntas: { texto: string }[];
  respuestas: string[] | null; enviadaEn: string | null; leida: boolean;
}
type Fase = "inicio" | "preguntas" | "repaso";

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

const contestada = (r: string | undefined) => (r || "").trim().length >= 2;

export default function EntrevistaEmpresaPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [token, setToken] = useState("");
  const [inv, setInv] = useState<Invitacion | null>(null);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);
  const [fase, setFase] = useState<Fase>("inicio");
  const [idx, setIdx] = useState(0);
  const [respuestas, setRespuestas] = useState<string[]>([]);
  const [aviso, setAviso] = useState("");
  const [mandando, setMandando] = useState(false);
  const [confirmar, setConfirmar] = useState(false);

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
      // Lo que llevaba contestado, si salió a medias (solo en este aparato).
      try {
        const g = JSON.parse(localStorage.getItem(clave) || "null");
        if (g && Array.isArray(g.respuestas) && g.respuestas.length === i.preguntas.length) {
          setRespuestas(g.respuestas); setIdx(Math.min(g.idx || 0, i.preguntas.length - 1));
        } else setRespuestas(i.preguntas.map(() => ""));
      } catch { setRespuestas(i.preguntas.map(() => "")); }
      setCargando(false);
    })();
  }, [id, router, clave]);

  useEffect(() => {
    if (!inv || inv.enviadaEn) return;
    try { localStorage.setItem(clave, JSON.stringify({ respuestas, idx })); } catch { /* da igual */ }
  }, [inv, respuestas, idx, clave]);

  const ponerRespuesta = useCallback((t: string) => setRespuestas((r) => r.map((x, i) => (i === idx ? t : x))), [idx]);

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
      if (!r.ok) { setAviso(j.error || "No se pudo mandar. Inténtalo de nuevo."); return; }
      setInv({ ...inv, respuestas, enviadaEn: new Date().toISOString(), leida: false });
      try { localStorage.removeItem(clave); } catch { /* da igual */ }
      setConfirmar(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setMandando(false);
    }
  }

  async function quitar() {
    if (!inv || !window.confirm(`¿Quitar la entrevista de ${inv.empresa}? Si les mandaste tus respuestas, se borran también.`)) return;
    const r = await fetch(`/api/entrevistas/empresa?id=${encodeURIComponent(inv.id)}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    if (r.ok) { try { localStorage.removeItem(clave); } catch { /* da igual */ } router.push("/app/entrevistas"); }
  }

  if (cargando) return <div className="ui-neon min-h-screen pt-24 text-center text-sm" style={{ color: "#a7b3c6" }}>Cargando la entrevista…</div>;
  if (error || !inv) {
    return (
      <div className="ui-neon min-h-screen pt-24 px-4 text-center space-y-4">
        <p className="text-sm" style={{ color: "#cbd5e1" }}>{error}</p>
        <Link href="/app/entrevistas" className="boton-neon">Ir a entrevistas</Link>
      </div>
    );
  }

  const n = inv.preguntas.length;
  const hechas = respuestas.filter(contestada).length;
  const empezada = hechas > 0;

  // La empresa y el puesto, arriba de todo, en cada fase.
  const cabecera = (grande: boolean) => (
    <div className={`flex items-center ${grande ? "gap-4" : "gap-3"}`}>
      <LogoEmpresa empresa={inv.empresa} tono="cian" size={grande ? 64 : 44} />
      <div className="min-w-0">
        <p className="text-[11px] font-bold tracking-[0.22em] uppercase" style={{ color: "#99f6e4" }}>Entrevista</p>
        <h1 className={`${grande ? "text-[26px]" : "text-[19px]"} font-extrabold leading-tight truncate`} style={{ color: "#f8fafc" }}>{inv.empresa}</h1>
        <p className="text-[13.5px] truncate" style={{ color: "#a7b3c6" }}>{inv.puesto}</p>
      </div>
    </div>
  );

  return (
    <div className="ui-neon min-h-screen pt-16">
      <div className="max-w-2xl mx-auto px-4 pt-5 pb-12 space-y-5">
        <Link href="/app/entrevistas" className="inline-flex items-center gap-1.5 text-[13px] min-h-[40px]" style={{ color: "#a7b3c6" }}>
          <ArrowLeft size={16} aria-hidden="true" /> Entrevistas
        </Link>

        {inv.enviadaEn ? (
          // ── Ya mandada ────────────────────────────────────────────────
          <>
            <section className="cristal tono-cian p-5 sm:p-6">{cabecera(true)}</section>
            <section className="cristal tono-verde p-6 text-center flex flex-col items-center gap-2" role="status">
              <span className="icono-circulo" style={{ width: 64, height: 64 }} aria-hidden="true"><CheckCircle2 size={32} /></span>
              <h2 className="text-[20px] font-extrabold" style={{ color: "#f8fafc" }}>Entrevista mandada</h2>
              <p className="text-[13.5px]" style={{ color: "#a7b3c6" }}>El {new Date(inv.enviadaEn).toLocaleDateString("es-ES", { day: "numeric", month: "long" })}</p>
              <Etiqueta tono={inv.leida ? "verde" : "ambar"}>{inv.leida ? "La empresa ya la ha leído" : "Pendiente de leer"}</Etiqueta>
            </section>
            {inv.respuestas && (
              <details className="cristal tono-neutro p-5">
                <summary className="cursor-pointer text-[15px] font-bold" style={{ color: "#f1f5f9" }}>Tus respuestas</summary>
                <ol className="mt-4 space-y-4">
                  {inv.preguntas.map((p, i) => (
                    <li key={i}>
                      <p className="text-[13.5px] font-bold mb-1" style={{ color: "#99f6e4" }}>{i + 1}. {p.texto}</p>
                      <p className="text-[14px] whitespace-pre-wrap" style={{ color: "#cbd5e1" }}>{inv.respuestas![i]}</p>
                    </li>
                  ))}
                </ol>
              </details>
            )}
          </>
        ) : fase === "inicio" ? (
          // ── Portada ───────────────────────────────────────────────────
          <section className="cristal tono-cian p-5 sm:p-7 space-y-5">
            {cabecera(true)}
            <ul className="grid grid-cols-3 gap-2">
              {[
                { Icono: MessagesSquare, texto: `${n} ${n === 1 ? "pregunta" : "preguntas"}` },
                { Icono: Clock, texto: `Unos ${Math.max(3, n * 2)} min` },
                { Icono: Mic, texto: "Hablando o escribiendo" },
              ].map(({ Icono, texto }) => (
                <li key={texto} className="rounded-2xl p-3 flex flex-col items-center gap-1.5 text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(45,212,191,0.22)" }}>
                  <Icono size={20} style={{ color: "#99f6e4" }} aria-hidden="true" />
                  <span className="text-[12.5px] font-semibold leading-tight" style={{ color: "#e2e8f0" }}>{texto}</span>
                </li>
              ))}
            </ul>
            <p className="text-[13px] leading-relaxed" style={{ color: "#a7b3c6" }}>
              Puedes rehacer cada respuesta antes de mandarla. La lee y la valora una persona de la empresa.
            </p>
            <div className="grid gap-2.5">
              <button type="button" onClick={() => setFase(empezada && hechas === n ? "repaso" : "preguntas")} className="boton-neon w-full">
                <Mic size={18} aria-hidden="true" />{empezada ? `Seguir (${hechas} de ${n})` : "Empezar la entrevista"}
              </button>
              <Link href="/app/entrevistas" className="boton-cristal tono-cian w-full"><Dumbbell size={17} aria-hidden="true" />Ensayar antes</Link>
            </div>
          </section>
        ) : fase === "preguntas" ? (
          // ── Pregunta a pregunta ───────────────────────────────────────
          <>
            {cabecera(false)}
            <div className="flex gap-1.5" aria-label={`Pregunta ${idx + 1} de ${n}`}>
              {inv.preguntas.map((_, i) => (
                <span key={i} className="h-1.5 flex-1 rounded-full" style={{ background: i === idx ? "#2dd4bf" : contestada(respuestas[i]) ? "rgba(45,212,191,0.5)" : "rgba(148,163,184,0.2)" }} />
              ))}
            </div>
            <section className="cristal tono-cian p-5">
              <div className="flex items-center justify-between gap-3 mb-2">
                <p className="text-[12px] font-bold tracking-[0.15em] uppercase" style={{ color: "#99f6e4" }}>Pregunta {idx + 1} de {n}</p>
                <button type="button" onClick={() => leerEnVoz(inv.preguntas[idx].texto)} className="w-11 h-11 inline-flex items-center justify-center rounded-full"
                  style={{ background: "rgba(45,212,191,0.12)", color: "#99f6e4" }} aria-label="Escuchar la pregunta">
                  <Volume2 size={19} />
                </button>
              </div>
              <p className="text-[19px] font-bold leading-snug" style={{ color: "#f8fafc" }}>{inv.preguntas[idx].texto}</p>
            </section>

            <VoiceRecorder value={respuestas[idx] || ""} onChange={ponerRespuesta} placeholder="Contesta aquí, o pulsa el micrófono y habla" />

            <div className="grid grid-cols-2 gap-2.5">
              <button type="button" onClick={() => (idx > 0 ? setIdx(idx - 1) : setFase("inicio"))} className="boton-cristal tono-neutro">Anterior</button>
              <button type="button" disabled={!contestada(respuestas[idx])}
                onClick={() => (idx < n - 1 ? setIdx(idx + 1) : setFase("repaso"))} className="boton-neon disabled:opacity-40">
                {idx < n - 1 ? "Siguiente" : "Repasar"}
              </button>
            </div>
          </>
        ) : (
          // ── Repaso y envío ────────────────────────────────────────────
          <>
            {cabecera(false)}
            <h2 className="text-[20px] font-extrabold" style={{ color: "#f8fafc" }}>Repasa tus respuestas</h2>
            <ol className="space-y-3">
              {inv.preguntas.map((p, i) => (
                <li key={i} className="cristal tono-neutro p-4">
                  <div className="flex items-start gap-3">
                    <p className="flex-1 text-[13.5px] font-bold" style={{ color: "#99f6e4" }}>{i + 1}. {p.texto}</p>
                    <button type="button" onClick={() => { setIdx(i); setFase("preguntas"); }} aria-label={`Cambiar la respuesta ${i + 1}`}
                      className="shrink-0 w-10 h-10 inline-flex items-center justify-center rounded-full" style={{ background: "rgba(45,212,191,0.1)", color: "#99f6e4" }}>
                      <PenLine size={17} />
                    </button>
                  </div>
                  <p className="text-[14px] mt-1.5 whitespace-pre-wrap" style={{ color: contestada(respuestas[i]) ? "#e2e8f0" : "#fca5a5" }}>
                    {contestada(respuestas[i]) ? respuestas[i] : "Sin contestar"}
                  </p>
                </li>
              ))}
            </ol>

            {aviso && <p role="alert" className="text-[13.5px]" style={{ color: "#fca5a5" }}>{aviso}</p>}

            {!confirmar ? (
              <button type="button" onClick={() => setConfirmar(true)} disabled={hechas < n} className="boton-neon w-full disabled:opacity-40">
                <Send size={18} aria-hidden="true" />Mandar a {inv.empresa}
              </button>
            ) : (
              <div className="cristal tono-lima p-5 space-y-3">
                <p className="text-[14px] font-semibold" style={{ color: "#f1f5f9" }}>Una vez mandada, no se puede cambiar.</p>
                <div className="grid grid-cols-2 gap-2.5">
                  <button type="button" onClick={() => void mandar()} disabled={mandando} className="boton-neon">{mandando ? "Mandando…" : "Sí, mandar"}</button>
                  <button type="button" onClick={() => setConfirmar(false)} className="boton-cristal tono-neutro">Todavía no</button>
                </div>
              </div>
            )}
          </>
        )}

        <button type="button" onClick={() => void quitar()} className="block mx-auto text-[12.5px] min-h-[40px]" style={{ color: "var(--texto-tenue)" }}>Quitar esta entrevista</button>
      </div>
    </div>
  );
}
