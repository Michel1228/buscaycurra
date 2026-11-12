"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import { LISTA_PAISES } from "@/lib/paises";
import VoiceRecorder from "@/components/VoiceInterview/VoiceRecorder";
import InterviewFeedback from "@/components/VoiceInterview/InterviewFeedback";
import InvitacionesEmpresa from "@/components/VoiceInterview/InvitacionesEmpresa";
import { Mic, PartyPopper, Volume2, VolumeX, Square } from "lucide-react";
import {
  PREGUNTAS, SECTORES_ENTREVISTA, FRASES, esSector,
  type SectorEntrevista, type IdFrase,
} from "@/lib/entrevistas/preguntas";
import type { PartesFeedback } from "@/lib/entrevistas/feedback";
import { hablar, parar, siLaVozSeBloquea, type Clip } from "@/lib/entrevistas/voz";
import { IconoCirculo } from "@/components/neon/Neon";

type Respuesta = { pregunta: string; respuesta: string; feedback: string; partes?: PartesFeedback | null };

const LS_KEY = "bc_entrevistas";
const LS_VOZ = "bc_entrevista_voz";
const frase = (id: IdFrase): Clip => ({ id, texto: FRASES[id] });

export default function EntrevistasPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [sector, setSector] = useState<SectorEntrevista>("general");
  // Lo que eligió el CV, para decirlo en pantalla (solo mientras siga en ese sector).
  const [delCv, setDelCv] = useState<{ sector: SectorEntrevista; puesto: string } | null>(null);
  // Para qué país se prepara. La entrevista no es igual en Berlín que en Madrid.
  const [paisEntrevista, setPaisEntrevista] = useState("ES");
  const [empezado, setEmpezado] = useState(false);
  const [idx, setIdx] = useState(0);
  const [texto, setTexto] = useState("");
  const [feedback, setFeedback] = useState("");
  const [partes, setPartes] = useState<PartesFeedback | null>(null);
  const [aviso, setAviso] = useState<{ texto: string; plan: string | null } | null>(null);
  const [analizando, setAnalizando] = useState(false);
  const [historial, setHistorial] = useState<Respuesta[]>([]);
  const [finalizado, setFinalizado] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [voz, setVoz] = useState(true);
  const [hablando, setHablando] = useState(false);
  // Cupo del plan gratis (2 entrevistas a la semana); null = sin límite o sin saberlo.
  const [cupo, setCupo] = useState<{ ilimitado: boolean; restantes: number | null } | null>(null);
  // La entrevista en curso: la primera respuesta de una nueva gasta una del cupo.
  const [sesion, setSesion] = useState<string | null>(null);

  const preguntas = PREGUNTAS[sector];

  // ─── Inicialización (auth + sector según el CV + lo guardado) ──
  useEffect(() => {
    async function init() {
      const { data: { session } } = await getSupabaseBrowser().auth.getSession();
      if (!session) { router.push("/auth/login"); return; }
      setToken(session.access_token);

      let sectorDetectado: SectorEntrevista = "general";
      try {
        const r = await fetch("/api/entrevistas/sector", { headers: { Authorization: `Bearer ${session.access_token}` } });
        const d = await r.json();
        if (esSector(d.sector)) sectorDetectado = d.sector;
        if (d.origen === "cv" && d.puesto && esSector(d.sector)) setDelCv({ sector: d.sector, puesto: d.puesto });
        if (d.cupo) setCupo({ ilimitado: !!d.cupo.ilimitado, restantes: d.cupo.restantes ?? null });
      } catch { /* se queda en general */ }

      try {
        if (localStorage.getItem(LS_VOZ) === "no") setVoz(false);
        const saved = JSON.parse(localStorage.getItem(LS_KEY) || "null");
        // Se retoma por donde iba si era del mismo sector.
        if (saved && saved.sector === sectorDetectado) {
          if (typeof saved.idx === "number" && saved.idx >= 0 && saved.idx < PREGUNTAS[sectorDetectado].length) setIdx(saved.idx);
          if (Array.isArray(saved.historial)) setHistorial(saved.historial);
          if (typeof saved.paisEntrevista === "string") setPaisEntrevista(saved.paisEntrevista);
          if (typeof saved.sesion === "string") setSesion(saved.sesion);
          if (saved.idx > 0 || saved.historial?.length) setEmpezado(true);
        }
      } catch { /* localStorage puede no estar disponible */ }

      setSector(sectorDetectado);
      setCargando(false);
    }
    init();
  }, [router]);

  // ─── Persistencia automática en localStorage ───────────────────
  useEffect(() => {
    if (cargando) return;
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ sector, idx, historial, paisEntrevista, sesion }));
    } catch { /* localStorage puede no estar disponible */ }
  }, [sector, idx, historial, paisEntrevista, sesion, cargando]);

  // Que no siga hablando al salir de la pantalla.
  useEffect(() => () => parar(), []);

  // Si el navegador no deja sonar la voz, se enseña un botón para oírla: antes
  // la entrevista se quedaba muda sin decir nada (8 nov 2026, en un ordenador).
  const [reintentarVoz, setReintentarVoz] = useState<null | (() => void)>(null);
  useEffect(() => {
    siLaVozSeBloquea((reintentar) => setReintentarVoz(() => reintentar));
    return () => siLaVozSeBloquea(null);
  }, []);

  /** El entrevistador dice estos clips, si la voz está puesta. */
  const decir = useCallback((clips: Clip[]) => {
    if (!voz) return;
    // Primero hablar() (que cierra lo anterior) y luego marcar que habla:
    // al revés, el cierre de lo anterior lo dejaba marcado como callado.
    hablar(clips, () => setHablando(false));
    setHablando(true);
  }, [voz]);

  const cambiarSector = (s: SectorEntrevista) => {
    parar(); setReintentarVoz(null);
    setSector(s); setIdx(0); setEmpezado(false); setSesion(null);
    setTexto(""); setFeedback(""); setPartes(null); setHistorial([]); setFinalizado(false);
  };

  const cambiarVoz = () => {
    const nueva = !voz;
    if (!nueva) parar();
    setVoz(nueva);
    try { localStorage.setItem(LS_VOZ, nueva ? "si" : "no"); } catch { /* da igual */ }
  };

  const sinCupo = !!cupo && !cupo.ilimitado && cupo.restantes !== null && cupo.restantes <= 0;

  const empezar = () => {
    if (sinCupo) return;
    setReintentarVoz(null);
    // Cada "Empezar" abre una entrevista nueva: es lo que cuenta el cupo del plan gratis.
    setSesion(typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `s-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`);
    setEmpezado(true);
    decir([frase("bienvenida"), preguntas[idx]]);
  };

  const analizar = async () => {
    if (!texto.trim()) return;
    parar(); setReintentarVoz(null);
    // Una entrevista retomada de antes de existir el cupo no trae sesión: se abre aquí.
    const sesionActual = sesion ?? (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `s-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`);
    if (!sesion) setSesion(sesionActual);
    setAnalizando(true);
    try {
      const res = await fetch("/api/entrevistas/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ pregunta: preguntas[idx].texto, respuesta: texto, sector, pais: paisEntrevista, sesion: sesionActual }),
      });
      const data = await res.json().catch(() => ({}));
      // Si la API dice por qué no (plan gratis, límite por hora...), se dice eso
      // y NO se apunta como respuesta hecha (auditoría del 3 oct 2026).
      if (!res.ok || !data.feedback) {
        setFeedback("");
        setPartes(null);
        setAviso({ texto: data.error || "No se ha podido analizar ahora. Inténtalo de nuevo en un momento.", plan: res.status === 402 ? (data.upgradeUrl || "/app/perfil?tab=plan") : null });
        return;
      }
      setAviso(null);
      // La primera respuesta de esta entrevista ya ha gastado una del cupo.
      if (historial.length === 0 && cupo && !cupo.ilimitado && cupo.restantes !== null) {
        setCupo({ ...cupo, restantes: Math.max(0, cupo.restantes - 1) });
      }
      setFeedback(data.feedback);
      setPartes(data.partes ?? null);
      setHistorial(h => [...h, { pregunta: preguntas[idx].texto, respuesta: texto, feedback: data.feedback, partes: data.partes ?? null }]);
      const acuses: IdFrase[] = ["acuse-1", "acuse-2", "acuse-3"];
      decir([frase(acuses[historial.length % acuses.length])]);
    } catch {
      setAviso({ texto: "No se ha podido analizar ahora. Inténtalo de nuevo en un momento.", plan: null });
    } finally {
      setAnalizando(false);
    }
  };

  const siguiente = () => {
    if (idx < preguntas.length - 1) {
      setIdx(i => i + 1); setTexto(""); setFeedback(""); setPartes(null);
      decir([frase("siguiente"), preguntas[idx + 1]]);
    } else {
      setFinalizado(true);
      decir([frase("cierre")]);
    }
  };

  const reiniciar = () => {
    parar();
    setIdx(0); setTexto(""); setFeedback(""); setPartes(null); setHistorial([]); setFinalizado(false); setEmpezado(false); setSesion(null);
  };

  if (cargando) {
    return (
      <div className="min-h-screen pt-24 pb-8 px-4 flex items-center justify-center" style={{ background: "#0f1117" }}>
        <div className="text-center">
          <div className="flex justify-center mb-3"><Mic size={40} strokeWidth={1.2} style={{ color: "#22c55e" }} /></div>
          <p className="text-sm" style={{ color: "#8b98ad" }}>Cargando simulador...</p>
        </div>
      </div>
    );
  }

  // ─── Resumen final ────────────────────────────────────────────
  if (finalizado) {
    const fuertes = historial.map(r => r.partes?.bien).filter((b): b is string => !!b);
    return (
      <div className="min-h-screen pt-16 pb-8 px-4" style={{ background: "#0f1117" }}>
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-3"><PartyPopper size={44} strokeWidth={1.2} style={{ color: "#22c55e" }} /></div>
            <h1 className="text-2xl font-bold text-white mb-1">¡Entrevista terminada!</h1>
            <p className="text-sm" style={{ color: "#94a3b8" }}>
              Has contestado {historial.length} de {preguntas.length} preguntas. Cada ensayo cuenta.
            </p>
          </div>

          {fuertes.length > 0 && (
            <div className="rounded-2xl p-4 mb-6" style={{ background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.25)" }}>
              <p className="text-[10px] uppercase tracking-wide font-semibold mb-2" style={{ color: "#22c55e" }}>Lo que mejor se te da</p>
              <ul className="space-y-1.5">
                {fuertes.map((b, i) => (
                  <li key={i} className="text-sm leading-relaxed" style={{ color: "#e2e8f0" }}>{b}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-4 mb-6">
            {historial.map((r, i) => (
              <div key={i} className="space-y-2.5">
                <p className="text-xs font-semibold" style={{ color: "#22c55e" }}>{i + 1}. {r.pregunta}</p>
                <p className="text-sm" style={{ color: "#94a3b8" }}>{r.respuesta}</p>
                <InterviewFeedback feedback={r.feedback} partes={r.partes} />
              </div>
            ))}
          </div>

          <button onClick={reiniciar} className="btn-game w-full py-3 text-sm">
            Volver a ensayar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16 pb-8 px-4" style={{ background: "#0f1117" }}>
      <div className="max-w-2xl mx-auto space-y-5">
        {/* Cabecera */}
        <div className="text-center pt-2">
          <div className="flex justify-center mb-3"><IconoCirculo Icono={Mic} tono="lima" size={56} /></div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">Simulador de <span className="texto-neon">entrevistas</span></h1>
          <p className="text-xs mt-1" style={{ color: "#94a3b8" }}>
            Ensaya con calma: aquí no hay respuestas perfectas.
          </p>
        </div>

        {/* Las empresas que le han invitado a preparar su entrevista */}
        {token && <InvitacionesEmpresa token={token} />}

        {/* Qué preguntas y para qué país */}
        <div className="grid grid-cols-2 gap-2.5">
          <label className="rounded-xl px-3 py-2 block" style={{ background: "rgba(12,15,22,0.86)", border: "1px solid rgba(148,163,184,0.18)" }}>
            <span className="text-[10px] uppercase tracking-wide font-semibold block" style={{ color: "#8b98ad" }}>Preguntas de</span>
            <select
              id="sector-entrevista"
              value={sector}
              onChange={e => cambiarSector(e.target.value as SectorEntrevista)}
              className="w-full bg-transparent text-sm outline-none mt-0.5"
              style={{ color: "#f1f5f9" }}
            >
              {SECTORES_ENTREVISTA.map(s => <option key={s.id} value={s.id} style={{ background: "rgba(12,15,22,0.86)" }}>{s.label}</option>)}
            </select>
          </label>
          <label className="rounded-xl px-3 py-2 block" style={{ background: "rgba(12,15,22,0.86)", border: "1px solid rgba(148,163,184,0.18)" }}>
            <span className="text-[10px] uppercase tracking-wide font-semibold block" style={{ color: "#8b98ad" }}>Entrevista en</span>
            <select
              id="pais-entrevista"
              value={paisEntrevista}
              onChange={e => setPaisEntrevista(e.target.value)}
              className="w-full bg-transparent text-sm outline-none mt-0.5"
              style={{ color: "#f1f5f9" }}
            >
              {LISTA_PAISES.map(p => <option key={p.codigo} value={p.codigo} style={{ background: "rgba(12,15,22,0.86)" }}>{p.bandera} {p.nombre}</option>)}
            </select>
          </label>
        </div>
        {delCv && delCv.sector === sector && (
          <p className="text-xs -mt-2" style={{ color: "#8b98ad" }}>Elegidas por tu CV: {delCv.puesto}.</p>
        )}

        {!empezado ? (
          // ─── Antes de empezar ─────────────────────────────────────
          // El botón no es un trámite: el móvil solo deja sonar audio después
          // de un toque, y con él el entrevistador puede saludar y preguntar.
          <div className="rounded-2xl p-5 space-y-4" style={{ background: "rgba(12,15,22,0.86)", border: "1px solid rgba(148,163,184,0.18)" }}>
            <p className="text-sm leading-relaxed" style={{ color: "#cbd5e1" }}>
              Te haré {preguntas.length} preguntas. Contesta hablando o escribiendo, como te sea más cómodo.
              Después de cada una te diré lo que te ha salido bien y un detalle que pulir.
            </p>
            {cupo && !cupo.ilimitado && cupo.restantes !== null && (
              <p className="text-xs" style={{ color: sinCupo ? "#f59e0b" : "#94a3b8" }}>
                {sinCupo
                  ? "Ya has hecho las 2 entrevistas de esta semana del plan gratis. Vuelve el lunes, o ensaya sin límite con el plan Esencial."
                  : `Plan gratis: te ${cupo.restantes === 1 ? "queda 1 entrevista" : `quedan ${cupo.restantes} entrevistas`} esta semana.`}
                {sinCupo && (
                  <button onClick={() => router.push("/app/perfil?tab=plan")} className="block mt-1 font-semibold underline" style={{ color: "#22c55e" }}>
                    Ver el plan Esencial (2,99 €/mes)
                  </button>
                )}
              </p>
            )}
            <div className="flex items-center gap-3">
              <button onClick={empezar} disabled={sinCupo} className="btn-game flex-1 py-3 text-sm" style={sinCupo ? { opacity: 0.5 } : undefined}>Empezar</button>
              <button
                onClick={cambiarVoz}
                aria-pressed={voz}
                className="rounded-xl px-3 py-3 text-xs flex items-center gap-1.5"
                style={{ background: "#0f1117", border: "1px solid rgba(148,163,184,0.18)", color: voz ? "#22c55e" : "#64748b" }}
              >
                {voz ? <Volume2 size={15} strokeWidth={1.9} /> : <VolumeX size={15} strokeWidth={1.9} />}
                {voz ? "Con voz" : "Sin voz"}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Progreso */}
            <div>
              <div className="flex justify-between text-xs mb-1" style={{ color: "#8b98ad" }}>
                <span>Pregunta {idx + 1} de {preguntas.length}</span>
                {reintentarVoz ? (
                  <button
                    onClick={() => { const r = reintentarVoz; setReintentarVoz(null); r(); }}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold"
                    style={{ background: "#22c55e", color: "#0f1117" }}>
                    <Volume2 size={13} strokeWidth={2.2} /> Pulsa para oír al entrevistador
                  </button>
                ) : hablando && (
                  <button onClick={() => parar()} className="flex items-center gap-1" style={{ color: "#22c55e" }}>
                    <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#22c55e" }} />
                    Hablando · parar <Square size={10} strokeWidth={2.2} />
                  </button>
                )}
              </div>
              <div className="h-1.5 rounded-full" style={{ background: "rgba(12,15,22,0.86)" }}>
                <div className="h-1.5 rounded-full transition-all" style={{ background: "#22c55e", width: `${(idx / preguntas.length) * 100}%` }} />
              </div>
            </div>

            {/* Pregunta */}
            <div className="rounded-2xl p-5" style={{ background: "rgba(12,15,22,0.86)", border: "1px solid rgba(148,163,184,0.18)" }}>
              <div className="flex items-start justify-between gap-3">
                <p className="text-base font-medium text-white leading-relaxed flex-1">{preguntas[idx].texto}</p>
                <div className="flex gap-1.5 shrink-0">
                  {voz && (
                    <button onClick={() => decir([preguntas[idx]])} className="p-2 rounded-lg" style={{ background: "#0f1117", color: "#22c55e" }}
                            title="Escuchar otra vez" aria-label="Escuchar la pregunta otra vez">
                      <Volume2 size={18} strokeWidth={1.8} />
                    </button>
                  )}
                  <button onClick={cambiarVoz} className="p-2 rounded-lg" style={{ background: "#0f1117", color: voz ? "#64748b" : "#22c55e" }}
                          title={voz ? "Quitar la voz" : "Poner la voz"} aria-label={voz ? "Quitar la voz" : "Poner la voz"} aria-pressed={!voz}>
                    {voz ? <VolumeX size={18} strokeWidth={1.8} /> : <Volume2 size={18} strokeWidth={1.8} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Respuesta: hablando o escribiendo */}
            <VoiceRecorder value={texto} onChange={setTexto} disabled={analizando || !!feedback} alEscuchar={() => parar()} />

            <InterviewFeedback feedback={feedback} partes={partes} />
            {aviso && (
              <div role="alert" className="rounded-xl px-4 py-3 text-sm" style={{ background: "rgba(240,192,64,0.1)", border: "1px solid rgba(240,192,64,0.3)", color: "#f0c040" }}>
                {aviso.texto}
                {aviso.plan && (
                  <button onClick={() => router.push(aviso.plan!)} className="block mt-2 font-semibold underline" style={{ color: "#22c55e" }}>
                    Ver planes
                  </button>
                )}
              </div>
            )}

            {/* Acciones */}
            <div className="flex gap-3">
              <button
                onClick={analizar}
                disabled={!texto.trim() || analizando || !!feedback}
                className="flex-1 py-3 rounded-xl font-semibold text-sm transition"
                style={{
                  background: texto.trim() && !analizando && !feedback ? "#22c55e" : "#1e212b",
                  color: texto.trim() && !analizando && !feedback ? "#fff" : "#64748b",
                }}
              >
                {analizando ? "Escuchando tu respuesta..." : "Contestar"}
              </button>
              <button
                onClick={siguiente}
                disabled={!feedback}
                className="flex-1 py-3 rounded-xl font-semibold text-sm transition"
                style={{
                  background: feedback ? "#1e212b" : "#0f1117",
                  color: feedback ? "#e5e7eb" : "#2d3142",
                  border: `1px solid ${feedback ? "#2d3142" : "#1e212b"}`,
                }}
              >
                {idx < preguntas.length - 1 ? "Siguiente →" : "Terminar"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
