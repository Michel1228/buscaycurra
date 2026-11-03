"use client";

/**
 * «Me interesa»: en el perfil de un candidato (/talento/[id]), la empresa le
 * invita a preparar una de sus entrevistas (lib/entrevistas/empresa.ts). Al
 * candidato le llega un aviso en la app que le abre el ensayo.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

interface Entrevista { id: string; puesto: string; empresa: string }

export default function InvitarEntrevista({ candidatoId, nombre }: { candidatoId: string; nombre: string }) {
  const [token, setToken] = useState("");
  const [entrevistas, setEntrevistas] = useState<Entrevista[] | null>(null);
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
      if (lista[0]) setElegida(lista[0].id);
    })();
  }, []);

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

  return (
    <div className="p-5 rounded-xl" style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.25)" }}>
      <h2 className="text-sm font-semibold mb-1" style={{ color: "#22c55e" }}>¿Te interesa?</h2>
      {entrevistas.length === 0 ? (
        <p className="text-xs" style={{ color: "#94a3b8" }}>
          Escribe las preguntas de tu entrevista y podrás invitarle a prepararla. <Link href="/empresas/entrevistas" style={{ color: "#22c55e" }}>Escribir mis preguntas →</Link>
        </p>
      ) : estado === "hecho" || estado === "ya" ? (
        <p className="text-xs" style={{ color: "#cbd5e1" }}>
          {estado === "hecho" ? `Invitación enviada. A ${primerNombre} le llega un aviso para preparar tu entrevista.` : `${primerNombre} ya estaba invitado a esta entrevista.`}{" "}
          Verás sus respuestas en <Link href="/empresas/entrevistas" style={{ color: "#22c55e" }}>tus entrevistas</Link> cuando te las mande.
        </p>
      ) : (
        <>
          <p className="text-xs mb-3" style={{ color: "#94a3b8" }}>
            Invítale a preparar tu entrevista. Ensaya con tus preguntas y, cuando quiera, te manda sus respuestas para que las valores tú.
          </p>
          <div className="flex flex-wrap gap-2">
            {entrevistas.length > 1 && (
              <select value={elegida} onChange={(e) => setElegida(e.target.value)} className="text-xs rounded-lg px-2 py-2" style={{ background: "#0f1117", color: "#f1f5f9", border: "1px solid #2d3142" }}>
                {entrevistas.map((e) => <option key={e.id} value={e.id}>{e.puesto}</option>)}
              </select>
            )}
            <button onClick={() => void invitar()} disabled={estado === "mandando"} className="btn-game text-xs px-4 py-2">
              {estado === "mandando" ? "Invitando…" : `Me interesa: invitar a ${primerNombre}`}
            </button>
          </div>
          {error && <p className="text-xs mt-2" style={{ color: "#ef4444" }}>{error}</p>}
        </>
      )}
    </div>
  );
}
