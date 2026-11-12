"use client";

/**
 * /empresas/entrevistas — Las preguntas de entrevista de una empresa y lo que han
 * contestado los candidatos invitados (lib/entrevistas/empresa.ts). Plan Empresa.
 *
 * La nota de cada candidato la pone la empresa marcando lo que ha cubierto: aquí
 * no llega ninguna nota de la IA. La referencia verificada va aparte, como sello.
 */
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import FondoOleaje from "@/components/FondoOleaje";

interface Pregunta { texto: string; puntos: string[] }
interface Entrevista { id: string; empresa: string; puesto: string; preguntas: Pregunta[] }
interface Invitacion {
  id: string; candidatoId: string; nombre: string; ciudad: string; referencias: number;
  empresa: string; puesto: string; preguntas: Pregunta[]; intentos: number;
  respuestas: string[] | null; enviadaEn: string | null; marcas: boolean[][] | null; nota: number | null;
}
interface Borrador { id?: string; empresa: string; puesto: string; preguntas: { texto: string; puntos: string }[] }

const vacio = (empresa = ""): Borrador => ({ empresa, puesto: "", preguntas: [{ texto: "", puntos: "" }] });
const caja = { background: "rgba(12,15,22,0.86)", border: "1px solid rgba(148,163,184,0.18)" };
const fecha = (s: string) => new Date(s).toLocaleDateString("es-ES", { day: "numeric", month: "short" });

export default function EntrevistasEmpresaPage() {
  const [token, setToken] = useState("");
  const [estado, setEstado] = useState<"cargando" | "entrar" | "plan" | "listo">("cargando");
  const [entrevistas, setEntrevistas] = useState<Entrevista[]>([]);
  const [invitaciones, setInvitaciones] = useState<Invitacion[]>([]);
  const [borrador, setBorrador] = useState<Borrador | null>(null);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [abierta, setAbierta] = useState<string | null>(null);
  const [marcas, setMarcas] = useState<Record<string, boolean[][]>>({});

  const cargar = useCallback(async (t: string) => {
    const r = await fetch("/api/empresas/entrevistas", { headers: { Authorization: `Bearer ${t}` } });
    if (r.status === 401) { setEstado("entrar"); return; }
    if (r.status === 402) { setEstado("plan"); return; }
    const j = await r.json().catch(() => ({}));
    setEntrevistas(j.entrevistas || []);
    setInvitaciones(j.invitaciones || []);
    setEstado("listo");
  }, []);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await getSupabaseBrowser().auth.getSession();
      if (!session) { setEstado("entrar"); return; }
      setToken(session.access_token);
      await cargar(session.access_token);
    })();
  }, [cargar]);

  async function guardar() {
    if (!borrador) return;
    setGuardando(true); setError("");
    try {
      const r = await fetch("/api/empresas/entrevistas", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          id: borrador.id, empresa: borrador.empresa, puesto: borrador.puesto,
          preguntas: borrador.preguntas.map((p) => ({ texto: p.texto, puntos: p.puntos.split("\n").map((s) => s.trim()).filter(Boolean) })),
        }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { setError(j.error || "No se pudo guardar."); return; }
      setEntrevistas(j.entrevistas || []);
      setBorrador(null);
    } finally {
      setGuardando(false);
    }
  }

  async function quitar(id: string) {
    if (!window.confirm("¿Quitar esta entrevista? A quien ya invitaste le queda su copia.")) return;
    const r = await fetch(`/api/empresas/entrevistas?id=${encodeURIComponent(id)}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    const j = await r.json().catch(() => ({}));
    if (r.ok) setEntrevistas(j.entrevistas || []);
  }

  function abrir(inv: Invitacion) {
    setAbierta(abierta === inv.id ? null : inv.id);
    if (!marcas[inv.id]) setMarcas({ ...marcas, [inv.id]: inv.marcas ?? inv.preguntas.map((p) => p.puntos.map(() => false)) });
  }

  async function valorar(inv: Invitacion) {
    const r = await fetch("/api/empresas/entrevistas/marcar", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ invitacionId: inv.id, marcas: marcas[inv.id] }),
    });
    const j = await r.json().catch(() => ({}));
    if (r.ok) setInvitaciones(invitaciones.map((i) => (i.id === inv.id ? { ...i, nota: j.nota, marcas: marcas[inv.id] } : i)));
    else setError(j.error || "No se pudo guardar la valoración.");
  }

  const cabecera = (
    <header className="sticky top-0 z-50" style={{ background: "rgba(15,17,23,0.95)", backdropFilter: "blur(10px)", borderBottom: "1px solid rgba(45,49,66,0.4)" }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link href="/empresas" className="flex items-center gap-2.5">
          <img src="/icon-192.png" alt="Guzzi" width={24} height={24} style={{ borderRadius: "50%" }} />
          <span className="font-bold text-sm" style={{ color: "#22c55e" }}>BuscayCurra</span>
          <span className="hidden sm:inline text-xs" style={{ color: "#8b98ad" }}>/ Entrevistas</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/empresas/equipo" className="text-xs font-semibold" style={{ color: "#22c55e" }}>Tu equipo</Link>
          <Link href="/empresas/candidatos" className="text-xs font-semibold" style={{ color: "#22c55e" }}>Candidatos →</Link>
        </div>
      </div>
    </header>
  );

  if (estado !== "listo") {
    const textos = {
      cargando: ["Cargando…", "", ""],
      entrar: ["Entra con tu cuenta de empresa", "/auth/login?redirect=%2Fempresas%2Fentrevistas", "Entrar"],
      plan: ["Las entrevistas son del Plan Empresa", "/empresas", "Ver Plan Empresa"],
    }[estado];
    return (
      <div className="min-h-screen" style={{ background: "#0f1117" }}>{cabecera}
        <div className="text-center py-24 px-4">
          <p className="text-sm font-semibold mb-4" style={{ color: "#f1f5f9" }}>{textos[0]}</p>
          {textos[1] && <Link href={textos[1]} className="btn-game text-sm px-5 py-2.5 rounded-lg inline-block">{textos[2]}</Link>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16" style={{ background: "#0f1117" }}>
      {/* El fondo de oleaje de toda la aplicación (diseño de neón, 8 nov 2026) */}
      <FondoOleaje />
      {cabecera}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-10">
        <section>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: "#f8fafc" }}>Candidatos invitados</h1>
          <p className="text-xs mb-5 max-w-2xl" style={{ color: "#8b98ad" }}>
            En el perfil de un candidato, pulsa «Me interesa» para invitarle a preparar tu entrevista. Ensaya con tus preguntas y, cuando quiere, te manda sus respuestas.
            Aquí no llega ninguna nota automática: la valoración la haces tú, marcando lo que ha cubierto en cada respuesta.
          </p>
          {invitaciones.length === 0 ? (
            <p className="text-sm" style={{ color: "#94a3b8" }}>Todavía no has invitado a nadie. <Link href="/empresas/candidatos" style={{ color: "#22c55e" }}>Ver candidatos →</Link></p>
          ) : (
            <div className="space-y-3">
              {invitaciones.map((inv) => (
                <div key={inv.id} className="rounded-xl p-4" style={caja}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold" style={{ color: "#f1f5f9" }}>{inv.nombre} <span className="font-normal" style={{ color: "#8b98ad" }}>{inv.ciudad && `· ${inv.ciudad}`}</span></p>
                      <p className="text-xs" style={{ color: "#94a3b8" }}>{inv.puesto} · {inv.intentos} {inv.intentos === 1 ? "ensayo" : "ensayos"}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {inv.referencias > 0 && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(34,197,94,0.12)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.3)" }}>
                            ✓ {inv.referencias > 1 ? `${inv.referencias} referencias verificadas` : "Referencia verificada"}
                          </span>
                        )}
                        <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "#0f1117", color: inv.respuestas ? "#22c55e" : "#94a3b8", border: "1px solid rgba(148,163,184,0.18)" }}>
                          {inv.respuestas ? `Respuestas del ${fecha(inv.enviadaEn!)}` : "Preparándose"}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      {inv.nota !== null && <p className="text-2xl font-bold" style={{ color: "#22c55e" }}>{inv.nota}<span className="text-xs" style={{ color: "#8b98ad" }}>/100</span></p>}
                      <div className="flex gap-3 justify-end mt-1">
                        {/* <a> y no <Link>: Next precarga los <Link>, y abrir un CV nuevo gasta cupo del mes. */}
                        <a href={`/talento/${inv.candidatoId}`} className="text-xs" style={{ color: "#94a3b8" }}>Ver CV</a>
                        {inv.respuestas && (
                          <button onClick={() => abrir(inv)} className="text-xs font-semibold" style={{ color: "#22c55e" }}>
                            {abierta === inv.id ? "Cerrar" : inv.nota === null ? "Leer y valorar" : "Ver valoración"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {abierta === inv.id && inv.respuestas && (
                    <div className="mt-4 pt-4 space-y-4" style={{ borderTop: "1px solid rgba(148,163,184,0.14)" }}>
                      {inv.preguntas.map((p, i) => (
                        <div key={i}>
                          <p className="text-xs font-semibold mb-1" style={{ color: "#22c55e" }}>{i + 1}. {p.texto}</p>
                          <p className="text-sm whitespace-pre-wrap mb-2" style={{ color: "#e2e8f0" }}>{inv.respuestas![i]}</p>
                          <p className="text-[10px] uppercase tracking-wide mb-1" style={{ color: "#8b98ad" }}>Marca lo que ha cubierto</p>
                          {p.puntos.map((pt, k) => (
                            <label key={k} className="flex items-start gap-2 text-xs mb-1 cursor-pointer" style={{ color: "#cbd5e1" }}>
                              <input type="checkbox" className="mt-0.5" style={{ accentColor: "#22c55e" }} checked={!!marcas[inv.id]?.[i]?.[k]}
                                onChange={(e) => setMarcas({ ...marcas, [inv.id]: marcas[inv.id].map((f, a) => (a === i ? f.map((x, b) => (b === k ? e.target.checked : x)) : f)) })} />
                              {pt}
                            </label>
                          ))}
                        </div>
                      ))}
                      <button onClick={() => void valorar(inv)} className="btn-game text-xs px-4 py-2">Guardar valoración</button>
                      <p className="text-[10px]" style={{ color: "#8b98ad" }}>La nota es la parte de los puntos que has marcado, de 0 a 100. Valora solo lo que ha contestado, no cómo habla.</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-bold" style={{ color: "#f1f5f9" }}>Tus entrevistas</h2>
            {!borrador && <button onClick={() => setBorrador(vacio(entrevistas[0]?.empresa))} className="btn-game text-xs px-4 py-2">+ Nueva entrevista</button>}
          </div>
          <p className="text-xs mb-5 max-w-2xl" style={{ color: "#8b98ad" }}>
            Las preguntas que haces en tus entrevistas y, en cada una, qué esperas oír. El candidato verá esos puntos después de contestar en su ensayo, para saber qué buscas.
          </p>

          {borrador && (
            <div className="rounded-xl p-5 mb-5 space-y-4" style={caja}>
              <div className="grid sm:grid-cols-2 gap-3">
                <label className="block"><span className="block text-[11px] font-semibold mb-1" style={{ color: "#94a3b8" }}>Empresa</span>
                  <input value={borrador.empresa} maxLength={120} onChange={(e) => setBorrador({ ...borrador, empresa: e.target.value })} className="w-full text-sm" /></label>
                <label className="block"><span className="block text-[11px] font-semibold mb-1" style={{ color: "#94a3b8" }}>Puesto</span>
                  <input value={borrador.puesto} maxLength={120} placeholder="Ej.: Camarero/a de sala" onChange={(e) => setBorrador({ ...borrador, puesto: e.target.value })} className="w-full text-sm" /></label>
              </div>
              {borrador.preguntas.map((p, i) => (
                <div key={i} className="rounded-lg p-3 space-y-2" style={{ background: "#0f1117", border: "1px solid rgba(148,163,184,0.18)" }}>
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-semibold" style={{ color: "#22c55e" }}>Pregunta {i + 1}</span>
                    {borrador.preguntas.length > 1 && (
                      <button onClick={() => setBorrador({ ...borrador, preguntas: borrador.preguntas.filter((_, k) => k !== i) })} className="text-[11px]" style={{ color: "#94a3b8" }}>Quitar</button>
                    )}
                  </div>
                  <textarea rows={2} maxLength={300} value={p.texto} placeholder="Ej.: ¿Cómo atenderías una mesa que se queja de la espera?"
                    onChange={(e) => setBorrador({ ...borrador, preguntas: borrador.preguntas.map((q, k) => (k === i ? { ...q, texto: e.target.value } : q)) })} className="w-full text-sm" />
                  <textarea rows={3} value={p.puntos} placeholder={"Qué esperas oír, una cosa por línea. Ej.:\nPide disculpas y explica el retraso\nOfrece algo mientras esperan\nAvisa al encargado si hace falta"}
                    onChange={(e) => setBorrador({ ...borrador, preguntas: borrador.preguntas.map((q, k) => (k === i ? { ...q, puntos: e.target.value } : q)) })} className="w-full text-xs" />
                </div>
              ))}
              {borrador.preguntas.length < 8 && (
                <button onClick={() => setBorrador({ ...borrador, preguntas: [...borrador.preguntas, { texto: "", puntos: "" }] })} className="text-xs font-semibold" style={{ color: "#22c55e" }}>+ Añadir pregunta</button>
              )}
              <p className="text-[11px] leading-relaxed" style={{ color: "#f59e0b" }}>
                Pregunta solo por el puesto. Nada de edad, origen, religión, salud, embarazo o hijos: además de no decir nada del trabajo, es discriminación.
              </p>
              {error && <p className="text-xs" style={{ color: "#ef4444" }}>{error}</p>}
              <div className="flex gap-2">
                <button onClick={() => void guardar()} disabled={guardando} className="btn-game text-xs px-4 py-2">{guardando ? "Guardando…" : "Guardar"}</button>
                <button onClick={() => { setBorrador(null); setError(""); }} className="text-xs px-4 py-2 rounded-lg" style={{ border: "1px solid rgba(148,163,184,0.18)", color: "#94a3b8" }}>Cancelar</button>
              </div>
            </div>
          )}

          {entrevistas.length === 0 && !borrador ? (
            <p className="text-sm" style={{ color: "#94a3b8" }}>Todavía no tienes ninguna. Crea la primera para poder invitar a candidatos.</p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {entrevistas.map((e) => (
                <div key={e.id} className="rounded-xl p-4" style={caja}>
                  <p className="text-sm font-semibold" style={{ color: "#f1f5f9" }}>{e.puesto}</p>
                  <p className="text-xs mb-3" style={{ color: "#8b98ad" }}>{e.empresa} · {e.preguntas.length} {e.preguntas.length === 1 ? "pregunta" : "preguntas"}</p>
                  <div className="flex gap-4">
                    <button onClick={() => setBorrador({ id: e.id, empresa: e.empresa, puesto: e.puesto, preguntas: e.preguntas.map((p) => ({ texto: p.texto, puntos: p.puntos.join("\n") })) })}
                      className="text-xs font-semibold" style={{ color: "#22c55e" }}>Editar</button>
                    <button onClick={() => void quitar(e.id)} className="text-xs" style={{ color: "#94a3b8" }}>Quitar</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
