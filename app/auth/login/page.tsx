"use client";

import { useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setCargando(true);
    try {
      const { error: err } = await getSupabaseBrowser().auth.signInWithPassword({
        email: email.trim(),
        password: contrasena,
      });
      if (err) {
        if (err.message.includes("Invalid login")) setError("Email o contraseña incorrectos.");
        else if (err.message.includes("Email not confirmed")) setError("Confirma tu email antes de entrar.");
        else setError("Error al iniciar sesión. Inténtalo de nuevo.");
        return;
      }
      router.push("/app/bienvenida");
    } catch {
      setError("Error inesperado. Inténtalo de nuevo.");
    } finally {
      setCargando(false);
    }
  };

  const inputStyle = {
    background: "#0f1117",
    border: "1.5px solid #2d3142",
    color: "#f1f5f9",
  };

  return (
    <div className="min-h-screen flex" style={{ background: "#0f1117" }}>
      {/* Panel izquierdo — marketing */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0a1f0e 0%, #0f1117 60%, #111827 100%)" }}>
        {/* Glow de fondo */}
        <div className="absolute inset-0 pointer-events-none">
          <div style={{
            position: "absolute", top: "10%", left: "-5%", width: "70%", height: "60%",
            background: "radial-gradient(ellipse, rgba(34,197,94,0.08) 0%, transparent 70%)",
          }} />
        </div>

        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2 mb-16">
            <span className="text-2xl">🐛</span>
            <span className="font-bold text-lg" style={{ color: "#22c55e" }}>BuscayCurra</span>
          </Link>

          <h2 className="text-3xl font-bold leading-tight mb-4" style={{ color: "#f1f5f9" }}>
            Tu próximo trabajo<br />
            <span style={{ color: "#22c55e" }}>te está esperando</span>
          </h2>
          <p className="text-sm mb-10" style={{ color: "#64748b" }}>
            Guzzi busca por ti en más de 400.000 ofertas reales de España.
          </p>

          <div className="space-y-5">
            {[
              { icon: "🔍", title: "Búsqueda inteligente", desc: "Filtra por ciudad, sector y salario en segundos" },
              { icon: "📄", title: "CV optimizado con IA", desc: "Guzzi mejora tu CV para cada oferta automáticamente" },
              { icon: "📬", title: "Envíos masivos", desc: "Aplica a 10 empresas a la vez, sin esfuerzo" },
            ].map((f) => (
              <div key={f.icon} className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                  style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}>
                  {f.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "#f1f5f9" }}>{f.title}</p>
                  <p className="text-xs" style={{ color: "#64748b" }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs" style={{ color: "#374151" }}>
          © 2025 BuscayCurra · Sin permanencia · Cancela cuando quieras
        </p>
      </div>

      {/* Panel derecho — formulario */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12"
        style={{ background: "#0f1117" }}>
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            {/* Logo visible solo en móvil */}
            <div className="lg:hidden w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4"
              style={{ background: "linear-gradient(135deg, rgba(34,197,94,0.15), rgba(22,163,74,0.08))", border: "2px solid rgba(34,197,94,0.25)" }}>
              🐛
            </div>
            <h1 className="text-xl font-bold" style={{ color: "#f1f5f9" }}>Bienvenido de vuelta</h1>
            <p className="text-xs mt-1" style={{ color: "#64748b" }}>Sigue tu búsqueda donde la dejaste</p>
          </div>

          <div className="card-game p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-xs font-medium mb-1.5" style={{ color: "#94a3b8" }}>Email</label>
                <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com" required autoComplete="email"
                  className="w-full rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 transition"
                  style={{ ...inputStyle, outline: "none" }} />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="contrasena" className="text-xs font-medium" style={{ color: "#94a3b8" }}>Contraseña</label>
                  <Link href="/auth/recuperar" className="text-[11px] font-medium hover:underline" style={{ color: "#22c55e" }}>¿Olvidaste?</Link>
                </div>
                <input id="contrasena" type="password" value={contrasena} onChange={(e) => setContrasena(e.target.value)}
                  placeholder="Tu contraseña" required autoComplete="current-password"
                  className="w-full rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 transition"
                  style={inputStyle} />
              </div>

              {error && (
                <div className="rounded-lg px-3.5 py-2.5 text-xs" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444" }}>
                  {error}
                </div>
              )}

              <button type="submit" disabled={cargando || !email.trim() || !contrasena}
                className="btn-game w-full !py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                {cargando ? "Entrando..." : "Entrar"}
              </button>
            </form>
          </div>

          <p className="text-center text-xs mt-5" style={{ color: "#64748b" }}>
            ¿No tienes cuenta?{" "}
            <Link href="/auth/registro" className="font-semibold hover:underline" style={{ color: "#22c55e" }}>Regístrate gratis</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
