"use client";

/**
 * Invitar a entrevista, en la ficha de un candidato (/talento/[id]).
 *
 * 23 nov 2026 (Michel): es una entrevista de verdad, que el candidato hace desde
 * la app, no un ensayo. Si la empresa todavía no tiene ninguna, el botón la
 * lleva a crearla con las preguntas de su sector ya escritas y, al guardarla,
 * este candidato queda invitado (/empresas/entrevistas?nueva=1&invitar=…).
 * Si ya estaba invitado, se ve cómo va.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Clock, MessagesSquare, Mic, Send, Sparkles } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { Etiqueta } from "@/components/neon/Neon";

interface Entrevista { id: string; puesto: string; empresa: string; preguntas: unknown[] }
interface Invitacion { id: string; candidatoId: string; puesto: string; respuestas: unknown; nota: number | null }

export default function InvitarEntrevista({ candidatoId, nombre }: { candidatoId: string; nombre: string }) {
  const [token, setToken] = useState("");
  const [entrevistas, setEntrevistas] = useState<Entrevista[] | null>(null);
  const [suyas, setSuyas] = useState<Invitacion[]>([]);
  const [elegida, setElegida] = useState("");
  const [estado, setEstado] = useState<"" | "mandando" | "hecho" | "ya">("");
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const { data: { session } } = await getSupabaseBrowser().auth.getSession();
      if (!session) return;
      setToken(session.access_token);
      const r = await fetch("/api/empresas/entrevistas", { headers: { Authorization: `Bearer ${session.access_token}` } });
      const j = await r.json().catch(() => ({}));
      const lista: Entrevista[] = j.entrevistas || [];
      setEntrevistas(lista);
      setSuyas(((j.invitaciones || []) as Invitacion[]).filter((i) => i.candidatoId === candidatoId));
      if (lista[0]) setElegida(lista[0].id);
    })();
  }, [candidatoId]);

  async function invitar() {
    setEstado("mandando"); setError("");
    const r = await fetch("/api/empresas/entrevistas/invitar", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ candidatoId, entrevistaId: elegida }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { setError(j.error || "No se pudo invitar."); setEstado(""); return; }
    setEstado(j.nueva ? "hecho" : "ya");
  }

  if (entrevistas === null) return null;
  const primerNombre = nombre.split(" ")[0] || "Este candidato";
  const crear = `/empresas/entrevistas?nueva=1&invitar=${encodeURIComponent(candidatoId)}&nombre=${encodeURIComponent(primerNombre)}`;

  return (
    <section className="cristal tono-cian p-5 sm:p-6 space-y-4" aria-labelledby="invitar-titulo">
      <div className="flex items-center gap-3.5">
        <span className="icono-circulo" style={{ width: 52, height: 52 }} aria-hidden="true"><Mic size={24} /></span>
        <div className="min-w-0">
          <h2 id="invitar-titulo" className="text-[18px] font-extrabold leading-tight" style={{ color: "#f8fafc" }}>Entrevista por la app</h2>
          <p className="text-[13px] mt-0.5" style={{ color: "#a7b3c6" }}>Contesta tus preguntas hablando o escribiendo. Tú valoras.</p>
        </div>
      </div>

      {/* Cómo va con este candidato, si ya le invitasteis. */}
      {suyas.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {suyas.map((s) => (
            <Etiqueta key={s.id} tono={s.nota !== null ? "verde" : s.respuestas ? "ambar" : "neutro"}>
              {s.nota !== null ? <Check size={12} aria-hidden="true" /> : s.respuestas ? <Send size={12} aria-hidden="true" /> : <Clock size={12} aria-hidden="true" />}
              {s.puesto} · {s.nota !== null ? `${s.nota}/100` : s.respuestas ? "Ha contestado" : "Invitado"}
            </Etiqueta>
          ))}
        </div>
      )}

      {estado === "hecho" || estado === "ya" ? (
        <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.35)" }}>
          <span className="icono-circulo tono-verde" style={{ width: 40, height: 40 }} aria-hidden="true"><Check size={20} /></span>
          <p className="flex-1 text-[14px] font-semibold" style={{ color: "#dcfce7" }}>
            {estado === "hecho" ? `${primerNombre} está invitado. Le llega un aviso en la app.` : `${primerNombre} ya tenía esta entrevista.`}
          </p>
          <Link href="/empresas/entrevistas" className="text-[13px] font-semibold shrink-0" style={{ color: "#86efac" }}>Ver</Link>
        </div>
      ) : entrevistas.length === 0 ? (
        <Link href={crear} className="boton-neon w-full"><Sparkles size={18} aria-hidden="true" />Crear entrevista e invitar</Link>
      ) : (
        <>
          {entrevistas.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1" role="radiogroup" aria-label="Qué entrevista" style={{ scrollbarWidth: "none" }}>
              {entrevistas.map((e) => {
                const si = e.id === elegida;
                return (
                  <button key={e.id} type="button" role="radio" aria-checked={si} onClick={() => setElegida(e.id)}
                    className="shrink-0 text-[13.5px] font-semibold px-4 min-h-[40px] rounded-full"
                    style={si
                      ? { background: "rgba(45,212,191,0.18)", color: "#99f6e4", border: "1px solid rgba(45,212,191,0.6)" }
                      : { background: "rgba(255,255,255,0.03)", color: "#a7b3c6", border: "1px solid rgba(148,163,184,0.22)" }}>
                    {e.puesto}
                  </button>
                );
              })}
            </div>
          )}
          <button type="button" onClick={() => void invitar()} disabled={estado === "mandando"} className="boton-neon w-full">
            <MessagesSquare size={18} aria-hidden="true" />
            {estado === "mandando" ? "Invitando…" : `Invitar a ${primerNombre}${entrevistas.length === 1 ? ` · ${entrevistas[0].puesto}` : ""}`}
          </button>
          <Link href="/empresas/entrevistas?nueva=1" className="block text-center text-[13px] font-semibold" style={{ color: "#99f6e4" }}>Otra entrevista</Link>
        </>
      )}
      {error && <p role="alert" className="text-[13px]" style={{ color: "#fca5a5" }}>{error}</p>}
    </section>
  );
}
