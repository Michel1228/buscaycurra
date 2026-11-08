"use client";

/**
 * components/MisAvisosCursos.tsx — Los avisos de cursos, en el perfil.
 *
 * Van APARTE de las alertas de empleo (components/MisAlertas.tsx): aquellas
 * avisan de ofertas nuevas; estos, de un curso concreto (hay trabajo que lo
 * pide o hay plazas). Hasta el 12 oct 2026 solo se encendían y apagaban desde
 * la ficha de cada curso, y no había ningún sitio donde ver cuáles tenías.
 * Usa /api/cursos/aviso (GET sin slug para la lista, POST para encender/apagar).
 *
 * Y el interruptor de las sugerencias según el CV (/api/cursos/sugerencias):
 * encendido por defecto, se apaga aquí o desde el enlace del correo.
 */
import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { tiposPorPais } from "@/lib/cursos/tipos";

type Aviso = { slug: string; nombre: string };

export default function MisAvisosCursos() {
  const [avisos, setAvisos] = useState<Aviso[] | null>(null);
  const [elegido, setElegido] = useState("");
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [sugerencias, setSugerencias] = useState<boolean | null>(null);

  const cabeceras = async (): Promise<Record<string, string> | null> => {
    const t = (await getSupabaseBrowser().auth.getSession()).data.session?.access_token;
    return t ? { "Content-Type": "application/json", Authorization: `Bearer ${t}` } : null;
  };

  async function cargar() {
    const h = await cabeceras();
    if (!h) return;
    const res = await fetch("/api/cursos/aviso", { headers: h });
    if (!res.ok) { setError("No se han podido cargar tus avisos de cursos."); setAvisos([]); return; }
    const d = await res.json() as { avisos?: Aviso[] };
    setAvisos(d.avisos || []);
  }

  useEffect(() => {
    cargar().catch(() => { setError("No se han podido cargar tus avisos de cursos."); setAvisos([]); });
    (async () => {
      const h = await cabeceras();
      if (!h) return;
      const res = await fetch("/api/cursos/sugerencias", { headers: h });
      if (res.ok) setSugerencias(((await res.json()) as { activas?: boolean }).activas !== false);
    })().catch(() => { /* sin el interruptor, el resto sigue */ });
  }, []);

  async function cambiarSugerencias(activas: boolean) {
    setSugerencias(activas);
    const h = await cabeceras();
    if (!h) return;
    const res = await fetch("/api/cursos/sugerencias", { method: "POST", headers: h, body: JSON.stringify({ activas }) }).catch(() => null);
    if (!res?.ok) { setSugerencias(!activas); setError("No se ha podido guardar. Inténtalo otra vez."); }
  }

  async function cambiar(slug: string, activo: boolean) {
    setOcupado(slug);
    setError("");
    try {
      const h = await cabeceras();
      if (!h) return;
      const res = await fetch("/api/cursos/aviso", { method: "POST", headers: h, body: JSON.stringify({ slug, activo }) });
      if (!res.ok) throw new Error();
      if (activo) setElegido("");
      await cargar();
    } catch {
      setError(activo ? "No se ha podido activar el aviso." : "No se ha podido quitar el aviso.");
    } finally {
      setOcupado(null);
    }
  }

  const activos = new Set((avisos || []).map((a) => a.slug));
  const disponibles = tiposPorPais("ES").filter((t) => !activos.has(t.slug));

  return (
    <div className="rounded-xl p-5" style={{ background: "rgba(12,15,22,0.78)", border: "1px solid rgba(148,163,184,0.18)" }}>
      <h2 className="font-semibold text-sm mb-1" style={{ color: "#f1f5f9" }}>🎓 Mis avisos de cursos</h2>
      <p className="text-xs mb-4" style={{ color: "#8b98ad" }}>
        Aparte de las alertas de empleo: te avisamos cuando hay trabajo que pide el curso que te interesa.
      </p>

      {sugerencias !== null && (
        <label className="flex items-start gap-3 rounded-lg px-3 py-2.5 mb-4 cursor-pointer" style={{ background: "rgba(12,15,22,0.86)" }}>
          <input type="checkbox" checked={sugerencias} onChange={(e) => cambiarSugerencias(e.target.checked)} className="mt-0.5" />
          <span>
            <span className="block text-sm" style={{ color: "#f1f5f9" }}>Sugerirme cursos según mi CV</span>
            <span className="block text-[11px]" style={{ color: "#8b98ad" }}>
              Si para lo que has trabajado piden un curso que no tienes, te avisamos cuando haya plaza gratis. Como mucho, uno cada dos semanas.
            </span>
          </span>
        </label>
      )}

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <label htmlFor="aviso-curso" className="sr-only">Curso</label>
        <select id="aviso-curso" value={elegido} onChange={(e) => setElegido(e.target.value)} className="text-sm flex-1 min-w-0">
          <option value="">Elige un curso…</option>
          {disponibles.map((t) => <option key={t.slug} value={t.slug}>{t.nombre}</option>)}
        </select>
        <button onClick={() => elegido && cambiar(elegido, true)} disabled={!elegido || ocupado !== null}
          className="btn-game text-xs px-4 py-2 rounded-lg disabled:opacity-50">
          {ocupado === elegido && elegido ? "Activando…" : "Añadir aviso"}
        </button>
      </div>

      {error && <p className="text-xs mb-3" style={{ color: "#ef4444" }}>{error}</p>}
      {avisos === null ? (
        <p className="text-xs" style={{ color: "#8b98ad" }}>Cargando…</p>
      ) : avisos.length === 0 ? (
        <p className="text-xs" style={{ color: "#8b98ad" }}>No tienes avisos de cursos.</p>
      ) : (
        <ul className="space-y-2">
          {avisos.map((a) => (
            <li key={a.slug} className="flex items-center justify-between gap-3 rounded-lg px-3 py-2" style={{ background: "rgba(12,15,22,0.86)" }}>
              <a href={`/app/formacion/${a.slug}`} className="text-sm truncate hover:underline" style={{ color: "#f1f5f9" }}>{a.nombre}</a>
              <button onClick={() => cambiar(a.slug, false)} disabled={ocupado !== null}
                className="text-xs px-3 py-1.5 rounded-lg flex-shrink-0 disabled:opacity-50"
                style={{ color: "#94a3b8", border: "1px solid rgba(148,163,184,0.18)" }}
                aria-label={`Quitar el aviso de ${a.nombre}`}>
                {ocupado === a.slug ? "Quitando…" : "Quitar"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
