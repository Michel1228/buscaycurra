"use client";

/**
 * components/MisAlertas.tsx — Ver y quitar las alertas de empleo.
 *
 * No existía: las alertas se creaban desde el buscador (y una automática al
 * registrarse con ciudad), pero no había ninguna pantalla para verlas ni
 * quitarlas; solo el enlace del pie de un correo (auditoría del 3 oct 2026).
 * Usa /api/jobs/alertas (GET y DELETE), que ya existían sin que nadie los
 * llamara.
 */
import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

type Alerta = { id: number; keyword: string; location: string; frequency: string };

export default function MisAlertas() {
  const [alertas, setAlertas] = useState<Alerta[] | null>(null);
  const [error, setError] = useState("");
  const [quitando, setQuitando] = useState<number | null>(null);

  const token = async () => (await getSupabaseBrowser().auth.getSession()).data.session?.access_token || null;

  useEffect(() => {
    (async () => {
      const t = await token();
      if (!t) return;
      const res = await fetch("/api/jobs/alertas", { headers: { Authorization: `Bearer ${t}` } });
      if (!res.ok) { setError("No se han podido cargar tus alertas."); setAlertas([]); return; }
      const d = await res.json() as { alertas?: Alerta[] };
      setAlertas(d.alertas || []);
    })().catch(() => { setError("No se han podido cargar tus alertas."); setAlertas([]); });
  }, []);

  async function quitar(id: number) {
    setQuitando(id);
    setError("");
    try {
      const t = await token();
      if (!t) return;
      const res = await fetch(`/api/jobs/alertas?id=${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${t}` } });
      if (!res.ok) throw new Error();
      setAlertas((a) => (a || []).filter((x) => x.id !== id));
    } catch {
      setError("No se ha podido quitar la alerta. Inténtalo otra vez en un momento.");
    } finally {
      setQuitando(null);
    }
  }

  const titulo = (a: Alerta) => [a.keyword, a.location].filter(Boolean).join(" en ") || "Ofertas nuevas";

  return (
    <div className="rounded-xl p-5" style={{ background: "#161922", border: "1px solid #2d3142" }}>
      <h2 className="font-semibold text-sm mb-1" style={{ color: "#f1f5f9" }}>🔔 Mis alertas de empleo</h2>
      <p className="text-xs mb-4" style={{ color: "#64748b" }}>
        Te avisamos de ofertas nuevas que encajan. Como mucho, un correo al día. Para crear otra, busca y pulsa «Alerta».
      </p>
      {error && <p className="text-xs mb-3" style={{ color: "#ef4444" }}>{error}</p>}
      {alertas === null ? (
        <p className="text-xs" style={{ color: "#64748b" }}>Cargando…</p>
      ) : alertas.length === 0 ? (
        <p className="text-xs" style={{ color: "#64748b" }}>No tienes ninguna alerta.</p>
      ) : (
        <ul className="space-y-2">
          {alertas.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-3 rounded-lg px-3 py-2" style={{ background: "#1e212b" }}>
              <div className="min-w-0">
                <p className="text-sm truncate" style={{ color: "#f1f5f9" }}>{titulo(a)}</p>
                <p className="text-[11px]" style={{ color: "#64748b" }}>{a.frequency === "weekly" ? "Semanal" : "Diaria"}</p>
              </div>
              <button onClick={() => quitar(a.id)} disabled={quitando !== null}
                className="text-xs px-3 py-1.5 rounded-lg flex-shrink-0 disabled:opacity-50"
                style={{ color: "#94a3b8", border: "1px solid #2d3142" }}
                aria-label={`Quitar la alerta ${titulo(a)}`}>
                {quitando === a.id ? "Quitando…" : "Quitar"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
