"use client";

/**
 * components/MisAlertas.tsx — Ver, añadir y quitar las alertas de empleo.
 *
 * No existía: las alertas se creaban desde el buscador (y una automática al
 * registrarse con ciudad), pero no había ninguna pantalla para verlas ni
 * quitarlas; solo el enlace del pie de un correo (auditoría del 3 oct 2026).
 * Usa /api/jobs/alertas (GET, POST y DELETE).
 *
 * AÑADIR, AQUÍ TAMBIÉN. Hasta el 12 oct 2026 solo se podía quitar: para dar de
 * alta una alerta había que ir al buscador, hacer una búsqueda y pulsar
 * «Alerta», y desde el perfil no se veía cómo (lo vio Michel). La alerta casa
 * el texto con el título, la empresa y la descripción, así que vale un puesto
 * ("camarero") o un sector ("hostelería").
 */
import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

type Alerta = { id: number; keyword: string; location: string; frequency: string };

const SECTORES = ["Hostelería", "Logística", "Comercio", "Limpieza", "Construcción", "Sanidad", "Administración", "Industria"];

export default function MisAlertas() {
  const [alertas, setAlertas] = useState<Alerta[] | null>(null);
  const [error, setError] = useState("");
  const [quitando, setQuitando] = useState<number | null>(null);
  const [puesto, setPuesto] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [frecuencia, setFrecuencia] = useState<"daily" | "weekly">("daily");
  const [creando, setCreando] = useState(false);
  const [aviso, setAviso] = useState("");

  const token = async () => (await getSupabaseBrowser().auth.getSession()).data.session?.access_token || null;

  async function cargar() {
    const t = await token();
    if (!t) return;
    const res = await fetch("/api/jobs/alertas", { headers: { Authorization: `Bearer ${t}` } });
    if (!res.ok) { setError("No se han podido cargar tus alertas."); setAlertas([]); return; }
    const d = await res.json() as { alertas?: Alerta[] };
    setAlertas(d.alertas || []);
  }

  useEffect(() => {
    cargar().catch(() => { setError("No se han podido cargar tus alertas."); setAlertas([]); });
  }, []);

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    if (!puesto.trim() && !ciudad.trim()) {
      setError("Escribe un puesto, un sector o una ciudad.");
      return;
    }
    setCreando(true);
    setError("");
    setAviso("");
    try {
      const t = await token();
      if (!t) return;
      const res = await fetch("/api/jobs/alertas", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
        body: JSON.stringify({ keyword: puesto.trim(), location: ciudad.trim(), frequency: frecuencia }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(d.error || "No se ha podido crear la alerta. Inténtalo otra vez en un momento.");
      }
      setAviso(`Alerta creada: ${[puesto.trim(), ciudad.trim()].filter(Boolean).join(" en ")}.`);
      setPuesto("");
      setCiudad("");
      await cargar();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCreando(false);
    }
  }

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
        Te avisamos de ofertas nuevas que encajan. Como mucho, un correo al día.
      </p>

      <form onSubmit={crear} className="rounded-lg p-3 mb-4 space-y-2" style={{ background: "#1e212b" }}>
        <p className="text-xs font-medium" style={{ color: "#f1f5f9" }}>Añadir una alerta</p>
        <div className="grid sm:grid-cols-2 gap-2">
          <div>
            <label htmlFor="alerta-puesto" className="sr-only">Puesto o sector</label>
            <input id="alerta-puesto" value={puesto} onChange={(e) => setPuesto(e.target.value)} maxLength={80}
              placeholder="Puesto o sector (ej: camarero, logística)" className="w-full text-sm" />
          </div>
          <div>
            <label htmlFor="alerta-ciudad" className="sr-only">Ciudad</label>
            <input id="alerta-ciudad" value={ciudad} onChange={(e) => setCiudad(e.target.value)} maxLength={80}
              placeholder="Ciudad (opcional)" className="w-full text-sm" />
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5" aria-label="Sectores frecuentes">
          {SECTORES.map((s) => (
            <button key={s} type="button" onClick={() => setPuesto(s)}
              className="text-[11px] px-2.5 py-1 rounded-full"
              style={puesto === s
                ? { color: "#22c55e", border: "1px solid rgba(34,197,94,0.4)", background: "rgba(34,197,94,0.08)" }
                : { color: "#94a3b8", border: "1px solid #2d3142" }}>
              {s}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="alerta-frecuencia" className="sr-only">Frecuencia</label>
          <select id="alerta-frecuencia" value={frecuencia} onChange={(e) => setFrecuencia(e.target.value as "daily" | "weekly")}
            className="text-sm">
            <option value="daily">Diaria</option>
            <option value="weekly">Semanal</option>
          </select>
          <button type="submit" disabled={creando} className="btn-game text-xs px-4 py-2 rounded-lg disabled:opacity-50">
            {creando ? "Creando…" : "Añadir alerta"}
          </button>
        </div>
      </form>

      {aviso && <p className="text-xs mb-3" style={{ color: "#22c55e" }}>{aviso}</p>}
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
