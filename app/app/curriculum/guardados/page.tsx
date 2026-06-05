"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

interface CVGuardado {
  id: string;
  nombre: string;
  form_data: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export default function MisCurriculumsPage() {
  const router = useRouter();
  const [cvs, setCvs] = useState<CVGuardado[]>([]);
  const [cargando, setCargando] = useState(true);
  const [token, setToken] = useState("");
  const [eliminando, setEliminando] = useState<string | null>(null);
  const [viendoId, setViendoId] = useState<string | null>(null);
  const [htmlVista, setHtmlVista] = useState("");
  const [cargandoVista, setCargandoVista] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function init() {
      const sb = getSupabaseBrowser();
      const { data: { session } } = await sb.auth.getSession();
      if (!session) { router.push("/auth/login"); return; }
      setToken(session.access_token);
      await cargarLista(session.access_token);
    }
    init();
  }, [router]);

  async function cargarLista(tok: string) {
    setCargando(true);
    try {
      const res = await fetch("/api/cv/lista", {
        headers: { Authorization: `Bearer ${tok}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCvs(data.cvs || []);
      }
    } catch { /* silencioso */ }
    finally { setCargando(false); }
  }

  async function verCV(id: string) {
    if (viendoId === id) { setViendoId(null); setHtmlVista(""); return; }
    setCargandoVista(true);
    setViendoId(id);
    try {
      const res = await fetch("/api/cv/lista", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        const data = await res.json();
        setHtmlVista(data.html || "");
      }
    } catch { /* silencioso */ }
    finally { setCargandoVista(false); }
  }

  function descargar(html: string, nombre: string) {
    const banner = `
    <div id="cv-banner" style="position:fixed;top:0;left:0;right:0;background:#1B2845;color:#fff;padding:12px 20px;font-family:sans-serif;font-size:13px;display:flex;align-items:center;justify-content:space-between;gap:12px;z-index:9999;box-shadow:0 2px 8px rgba(0,0,0,0.3);">
      <span style="flex:1">💡 <strong>Para guardar con los colores:</strong> activa <strong>"Gráficos de fondo"</strong> en la ventana de impresión</span>
      <button onclick="document.getElementById('cv-banner').style.display='none';window.print();" style="background:#7ed56f;color:#1a1a12;border:none;padding:10px 22px;border-radius:8px;font-weight:700;cursor:pointer;">⬇️ Guardar PDF</button>
    </div>
    <div style="height:56px"></div>
    <style>@media print{#cv-banner,div[style*="height:56px"]{display:none!important}}</style>`;
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html.replace("</body>", banner + "</body>"));
      win.document.close();
    }
  }

  async function editarCV(cv: CVGuardado) {
    if (cv.form_data) {
      const sb = getSupabaseBrowser();
      const { data: { session } } = await sb.auth.getSession();
      if (!session) return;
      localStorage.setItem("cv_draft_" + session.user.id, JSON.stringify(cv.form_data));
    }
    // Cargar el HTML generado también
    const res = await fetch("/api/cv/lista", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id: cv.id }),
    });
    if (res.ok) {
      const data = await res.json();
      const sb = getSupabaseBrowser();
      const { data: { session } } = await sb.auth.getSession();
      if (session && data.html) {
        localStorage.setItem("cv_html_" + session.user.id, data.html);
      }
    }
    router.push("/app/curriculum");
  }

  async function eliminarCV(id: string) {
    if (!confirm("¿Eliminar este currículum? Esta acción no se puede deshacer.")) return;
    setEliminando(id);
    try {
      const res = await fetch(`/api/cv/borrar/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setCvs(prev => prev.filter(c => c.id !== id));
        if (viendoId === id) { setViendoId(null); setHtmlVista(""); }
      } else {
        setError("No se pudo eliminar el CV.");
      }
    } catch { setError("Error al eliminar."); }
    finally { setEliminando(null); }
  }

  function formatFecha(iso: string) {
    return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
  }

  return (
    <div className="min-h-screen pt-16">
      {/* Cabecera */}
      <div className="py-8 px-4" style={{ background: "linear-gradient(135deg, #7ed56f, #5cb848)", color: "#1a1a12" }}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">📂 Mis currículums</h1>
            <p className="text-sm mt-1 opacity-75">Tus CVs guardados para distintos trabajos</p>
          </div>
          <button onClick={() => router.push("/app/curriculum")}
            className="px-5 py-2.5 text-sm font-semibold rounded-xl transition"
            style={{ background: "rgba(0,0,0,0.15)", color: "#1a1a12" }}>
            + Crear nuevo
          </button>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-4 p-3 rounded-xl text-sm" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
            {error}
          </div>
        )}

        {cargando && (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#7ed56f", borderTopColor: "transparent" }} />
          </div>
        )}

        {!cargando && cvs.length === 0 && (
          <div className="text-center py-16 space-y-4">
            <div className="text-5xl opacity-30">📄</div>
            <p className="font-semibold" style={{ color: "#f0ebe0" }}>Aún no tienes currículums guardados</p>
            <p className="text-sm" style={{ color: "#706a58" }}>Crea tu primer CV y guárdalo desde el generador</p>
            <button onClick={() => router.push("/app/curriculum")}
              className="btn-game px-8 py-3 mt-2">
              Crear mi primer CV →
            </button>
          </div>
        )}

        {!cargando && cvs.length > 0 && (
          <div className="space-y-4">
            <p className="text-sm" style={{ color: "#706a58" }}>{cvs.length} currículum{cvs.length !== 1 ? "s" : ""} guardado{cvs.length !== 1 ? "s" : ""}</p>

            {cvs.map(cv => (
              <div key={cv.id} className="card-game overflow-hidden">
                {/* Cabecera de la tarjeta */}
                <div className="p-5 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-base truncate" style={{ color: "#f0ebe0" }}>{cv.nombre}</h3>
                    <p className="text-xs mt-1" style={{ color: "#706a58" }}>
                      Guardado el {formatFecha(cv.created_at)}
                      {cv.updated_at !== cv.created_at && ` · Editado el ${formatFecha(cv.updated_at)}`}
                    </p>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                    <button
                      onClick={() => verCV(cv.id)}
                      className="px-4 py-2 text-xs font-semibold rounded-xl transition"
                      style={{ background: viendoId === cv.id ? "rgba(126,213,111,0.2)" : "rgba(255,255,255,0.05)", border: "1px solid #3d3c30", color: "#f0ebe0" }}>
                      {viendoId === cv.id ? "Ocultar" : "👁 Ver"}
                    </button>
                    <button
                      onClick={() => editarCV(cv)}
                      className="px-4 py-2 text-xs font-semibold rounded-xl transition"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid #3d3c30", color: "#f0ebe0" }}>
                      ✏️ Editar
                    </button>
                    {viendoId === cv.id && htmlVista && (
                      <button
                        onClick={() => descargar(htmlVista, cv.nombre)}
                        className="px-4 py-2 text-xs font-semibold rounded-xl transition"
                        style={{ background: "rgba(126,213,111,0.15)", border: "1px solid rgba(126,213,111,0.4)", color: "#7ed56f" }}>
                        ⬇️ PDF
                      </button>
                    )}
                    <button
                      onClick={() => eliminarCV(cv.id)}
                      disabled={eliminando === cv.id}
                      className="px-4 py-2 text-xs font-semibold rounded-xl transition disabled:opacity-50"
                      style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444" }}>
                      {eliminando === cv.id ? "…" : "🗑"}
                    </button>
                  </div>
                </div>

                {/* Vista previa del CV */}
                {viendoId === cv.id && (
                  <div className="border-t" style={{ borderColor: "#3d3c30" }}>
                    {cargandoVista ? (
                      <div className="flex justify-center py-8">
                        <div className="w-6 h-6 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#7ed56f", borderTopColor: "transparent" }} />
                      </div>
                    ) : htmlVista ? (
                      <iframe
                        srcDoc={htmlVista}
                        className="w-full bg-white"
                        style={{ height: "700px", border: "none" }}
                        title={cv.nombre}
                      />
                    ) : null}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
