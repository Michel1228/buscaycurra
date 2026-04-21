"use client";

import { useState, useEffect, useCallback } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import PerfilForm, { type DatosPerfil } from "@/components/PerfilForm";

type TabId = "perfil" | "seguridad" | "peligro";
const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: "perfil", label: "Mi Perfil", icon: "👤" },
  { id: "seguridad", label: "Seguridad", icon: "🔒" },
  { id: "peligro", label: "Peligro", icon: "⚠️" },
];

export default function PerfilPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [datos, setDatos] = useState<Partial<DatosPerfil>>({});
  const [cargando, setCargando] = useState(true);
  const [tab, setTab] = useState<TabId>("perfil");

  const cargar = useCallback(async () => {
    try {
      const { data: { session } } = await getSupabaseBrowser().auth.getSession();
      if (!session) { router.push("/auth/login"); return; }
      setUserId(session.user.id);
      setToken(session.access_token);
      setEmail(session.user.email ?? "");
      const { data: p } = await getSupabaseBrowser().from("profiles")
        .select("full_name, phone, ciudad, sector").eq("id", session.user.id).single();
      if (p) setDatos({ nombre: p.full_name ?? "", telefono: p.phone ?? "", ciudad: p.ciudad ?? "", sector: p.sector ?? "" });
    } catch { /* */ } finally { setCargando(false); }
  }, [router]);

  useEffect(() => { void cargar(); }, [cargar]);

  if (cargando) return (
    <div className="min-h-screen flex items-center justify-center pt-16" style={{ background: "#1a1a12" }}>
      <div className="w-8 h-8 border-3 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#7ed56f", borderTopColor: "transparent" }} />
    </div>
  );
  if (!userId) return null;

  const iniciales = () => {
    const n = datos.nombre ?? email;
    const p = n.trim().split(" ").filter(Boolean);
    if (!p.length) return "?";
    return p.length === 1 ? p[0][0].toUpperCase() : (p[0][0] + p[p.length - 1][0]).toUpperCase();
  };

  const inputCls = "w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 transition";
  const inputStyle = { background: "#1a1a12", border: "1.5px solid #3d3c30", color: "#f0ebe0" };

  return (
    <div className="min-h-[calc(100vh-56px)]">
      {/* Header perfil */}
      <div className="px-4 py-8" style={{ background: "linear-gradient(135deg, rgba(126,213,111,0.08), rgba(139,111,71,0.05))" }}>
        <div className="max-w-2xl mx-auto flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #7ed56f, #5cb848)", color: "#1a1a12" }}>
            {iniciales()}
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "#f0ebe0" }}>{datos.nombre || "Mi cuenta"}</h1>
            <p className="text-sm" style={{ color: "#706a58" }}>{email}</p>
            {datos.sector && <p className="text-xs mt-0.5" style={{ color: "#b0a890" }}>{datos.sector}</p>}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="glass-warm sticky top-14 z-10" style={{ borderBottom: "1px solid rgba(126,213,111,0.1)" }}>
        <div className="max-w-2xl mx-auto px-4 flex">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition"
              style={{
                borderColor: tab === t.id ? "#7ed56f" : "transparent",
                color: tab === t.id ? "#7ed56f" : "#706a58",
              }}>
              <span>{t.icon}</span>
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Contenido */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        {tab === "perfil" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold" style={{ color: "#f0ebe0" }}>Información personal</h2>
              <p className="text-sm" style={{ color: "#706a58" }}>Se usa para personalizar tu carta de presentación</p>
            </div>
            <div className="card-game p-6">
              <PerfilForm userId={userId} datosIniciales={datos} onGuardado={(d) => {
                setDatos(d);
                // Auto-redirect to next step (CV) after saving profile
                setTimeout(() => router.push("/app/curriculum"), 1200);
              }} />
            </div>

          </div>
        )}

        {tab === "seguridad" && <TabSeguridad token={token} inputCls={inputCls} inputStyle={inputStyle} />}
        {tab === "peligro" && <TabPeligro token={token} inputCls={inputCls} inputStyle={inputStyle} />}
      </main>
    </div>
  );
}

function TabSeguridad({ token, inputCls, inputStyle }: { token: string | null; inputCls: string; inputStyle: React.CSSProperties }) {
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [exito, setExito] = useState(false);
  const [error, setError] = useState("");

  const handleCambiar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setExito(false);
    if (nueva.length < 8) { setError("Mínimo 8 caracteres."); return; }
    if (nueva !== confirmar) { setError("No coinciden."); return; }
    setGuardando(true);
    try {
      const { data: { session } } = await getSupabaseBrowser().auth.getSession();
      if (!session?.user.email) { setError("Error de sesión."); return; }
      const { error: e1 } = await getSupabaseBrowser().auth.signInWithPassword({ email: session.user.email, password: actual });
      if (e1) { setError("Contraseña actual incorrecta."); return; }
      const { error: e2 } = await getSupabaseBrowser().auth.updateUser({ password: nueva });
      if (e2) { setError("No se pudo cambiar."); return; }
      setExito(true); setActual(""); setNueva(""); setConfirmar("");
      setTimeout(() => setExito(false), 4000);
    } catch { setError("Error inesperado."); }
    finally { setGuardando(false); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold" style={{ color: "#f0ebe0" }}>Cambiar contraseña</h2>
        <p className="text-sm" style={{ color: "#706a58" }}>Elige una contraseña segura</p>
      </div>
      <div className="card-game p-6">
        <form onSubmit={handleCambiar} className="space-y-4">
          {[
            { id: "actual", label: "Contraseña actual", val: actual, set: setActual, ph: "Tu contraseña actual" },
            { id: "nueva", label: "Nueva contraseña", val: nueva, set: setNueva, ph: "Mínimo 8 caracteres" },
            { id: "confirmar", label: "Confirmar nueva", val: confirmar, set: setConfirmar, ph: "Repite la nueva" },
          ].map(f => (
            <div key={f.id}>
              <label htmlFor={f.id} className="block text-sm font-medium mb-1.5" style={{ color: "#b0a890" }}>{f.label}</label>
              <input id={f.id} type="password" value={f.val} onChange={e => f.set(e.target.value)}
                placeholder={f.ph} required className={inputCls} style={inputStyle} />
            </div>
          ))}
          {error && <div className="rounded-xl px-4 py-3 text-sm" style={{ background: "#2a1a1a", border: "1px solid #ff606030", color: "#ff8080" }}>{error}</div>}
          {exito && <div className="rounded-xl px-4 py-3 text-sm" style={{ background: "#1a2a1a", border: "1px solid #7ed56f30", color: "#7ed56f" }}>✓ Contraseña actualizada</div>}
          <button type="submit" disabled={guardando} className="btn-game w-full !py-3 disabled:opacity-50">
            {guardando ? "Guardando..." : "Cambiar contraseña"}
          </button>
        </form>
      </div>
    </div>
  );
}

function TabPeligro({ token, inputCls, inputStyle }: { token: string | null; inputCls: string; inputStyle: React.CSSProperties }) {
  const router = useRouter();
  const [texto, setTexto] = useState("");
  const [borrando, setBorrando] = useState(false);
  const [error, setError] = useState("");
  const ok = texto === "BORRAR";

  const handleBorrar = async () => {
    if (!ok || !token) return;
    setBorrando(true); setError("");
    try {
      const res = await fetch("/api/cuenta/borrar", { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json() as { error?: string };
      if (!res.ok || data.error) { setError(data.error ?? "Error al borrar."); return; }
      await getSupabaseBrowser().auth.signOut();
      router.push("/?despedida=1");
    } catch { setError("Error de red."); }
    finally { setBorrando(false); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold" style={{ color: "#ff6060" }}>Zona de peligro</h2>
        <p className="text-sm" style={{ color: "#706a58" }}>Acciones irreversibles</p>
      </div>
      <div className="card-game p-6" style={{ borderColor: "#ff606030" }}>
        <div className="flex items-start gap-3 mb-4">
          <span className="text-2xl">⚠️</span>
          <div>
            <h3 className="font-bold" style={{ color: "#ff8080" }}>Borrar mi cuenta</h3>
            <p className="text-sm mt-1" style={{ color: "#b0a890" }}>
              IRREVERSIBLE. Se borrarán todos tus datos, CVs y cuenta.
            </p>
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1.5" style={{ color: "#b0a890" }}>
            Escribe <code className="px-1.5 py-0.5 rounded text-xs" style={{ background: "#ff606020", color: "#ff8080" }}>BORRAR</code> para confirmar:
          </label>
          <input type="text" value={texto} onChange={e => setTexto(e.target.value)}
            placeholder='Escribe "BORRAR"' className={inputCls} style={inputStyle} />
        </div>
        {error && <div className="rounded-xl px-4 py-3 text-sm mb-4" style={{ background: "#2a1a1a", border: "1px solid #ff606030", color: "#ff8080" }}>{error}</div>}
        <button onClick={handleBorrar} disabled={!ok || borrando}
          className="w-full py-3 text-sm font-bold rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: ok ? "#dc2626" : "#3d3c30", color: ok ? "#fff" : "#706a58" }}>
          {borrando ? "Eliminando..." : "🗑️ Eliminar cuenta permanentemente"}
        </button>
      </div>
    </div>
  );
}
