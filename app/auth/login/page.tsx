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
    <div className="min-h-screen flex flex-col lg:flex-row" style={{ background: "#0f1117" }}>

      {/* Panel marketing — arriba en móvil, izquierda en desktop */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between px-6 py-8 lg:p-12 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0a1f0e 0%, #0f1117 60%, #111827 100%)" }}>

        {/* Glow de fondo */}
        <div className="absolute inset-0 pointer-events-none">
          <div style={{
            position: "absolute", top: "10%", left: "-5%", width: "70%", height: "60%",
            background: "radial-gradient(ellipse, rgba(34,197,94,0.08) 0%, transparent 70%)",
          }} />
        </div>

        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2 mb-6 lg:mb-10">
            <span className="text-2xl">🐛</span>
            <span className="font-bold text-lg" style={{ color: "#22c55e" }}>BuscayCurra</span>
          </Link>

          {/* Hero — siempre visible */}
          <h2 className="text-2xl lg:text-3xl font-bold leading-tight mb-2" style={{ color: "#f1f5f9" }}>
            Tu trabajo te está<br />
            <span style={{ color: "#22c55e" }}>esperando.</span>
          </h2>
          <p className="text-sm mb-6" style={{ color: "#64748b" }}>
            Guzzi busca, aplica y hace seguimiento por ti. Tú solo tienes que aparecer a la entrevista.
          </p>

          {/* 3 puntos fuertes — siempre visibles */}
          <div className="space-y-3 mb-6">
            {[
              { icon: "🐛", titulo: "Guzzi aplica por ti", desc: "Envía tu CV a cientos de empresas cada día, sin que tengas que hacer nada." },
              { icon: "🎯", titulo: "CV personalizado por IA", desc: "Cada candidatura se adapta a la oferta. No compites con 2.000 CVs iguales." },
              { icon: "📊", titulo: "Seguimiento en tiempo real", desc: "Ves cuándo leen tu CV y el estado de cada candidatura en tu pipeline." },
            ].map(p => (
              <div key={p.titulo} className="flex items-start gap-3 p-3 rounded-xl"
                style={{ background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.12)" }}>
                <span className="text-xl shrink-0 mt-0.5">{p.icon}</span>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "#f1f5f9" }}>{p.titulo}</p>
                  <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>{p.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Comparativa — solo en desktop */}
          <div className="hidden lg:block rounded-xl overflow-hidden mb-6" style={{ border: "1px solid #252836" }}>
            <div className="px-4 py-2 text-[10px] font-bold grid grid-cols-3 gap-2"
              style={{ background: "#161922", color: "#475569" }}>
              <span></span>
              <span className="text-center">InfoJobs / LinkedIn</span>
              <span className="text-center" style={{ color: "#22c55e" }}>BuscayCurra</span>
            </div>
            {[
              { label: "Tu CV llega", ellos: "Entre 300–2.000 iguales", nosotros: "Primero en la bandeja" },
              { label: "Quién aplica", ellos: "Tú, a mano, uno a uno", nosotros: "Guzzi, automático" },
              { label: "CV adaptado", ellos: "El mismo para todas", nosotros: "IA lo personaliza" },
              { label: "Precio real", ellos: "Gratis (inútil) o 39€/mes", nosotros: "Desde 2,99€/mes" },
            ].map((row, i) => (
              <div key={row.label}
                className="px-4 py-2 grid grid-cols-3 gap-2 text-[11px] items-center"
                style={{ background: i % 2 === 0 ? "#0f1117" : "#0a0c10", borderTop: "1px solid #1a1d27" }}>
                <span style={{ color: "#94a3b8" }}>{row.label}</span>
                <span className="text-center" style={{ color: "#ef4444" }}>✕ {row.ellos}</span>
                <span className="text-center font-semibold" style={{ color: "#22c55e" }}>✓ {row.nosotros}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs" style={{ color: "#475569" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
            +400.000 ofertas activas · Jooble · Careerjet · Adzuna · y más
          </div>
        </div>

        <div className="relative z-10 hidden lg:flex items-center justify-between mt-8">
          <p className="text-xs" style={{ color: "#374151" }}>© 2025 BuscayCurra · Sin permanencia</p>
          <Link href="/empresas" className="text-xs hover:underline" style={{ color: "#475569" }}>
            ¿Eres empresa o recruiter? →
          </Link>
        </div>
      </div>

      {/* Panel derecho — formulario */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10"
        style={{ background: "#0f1117" }}>
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
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
