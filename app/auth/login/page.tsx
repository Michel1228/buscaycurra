"use client";

import { useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [verContrasena, setVerContrasena] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim().includes("@")) {
      setError("Introduce un email válido.");
      return;
    }
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
            Deja de enviar CVs<br />
            <span style={{ color: "#22c55e" }}>al vacío.</span>
          </h2>
          <p className="text-sm mb-6" style={{ color: "#64748b" }}>
            Guzzi es el primer agente IA que busca, adapta y envía candidaturas por ti en 21 países. 24/7. Tú solo vas a la entrevista.
          </p>

          {/* 3 puntos fuertes — siempre visibles */}
          <div className="space-y-3 mb-6">
            {[
              { icon: "🌍", titulo: "21 países, un solo agente", desc: "Busca trabajo en España o emigra. Guzzi habla 12 idiomas y adapta tu CV al formato de cada país." },
              { icon: "🎯", titulo: "CV único para cada oferta", desc: "Cada candidatura se adapta a la empresa. Supera los filtros ATS que descartan al 75% de candidatos." },
              { icon: "⏰", titulo: "Enviado cuando toca", desc: "Tu candidatura llega cuando el reclutador abre el email. La diferencia entre que te lean o te ignoren." },
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
            3.000.000+ ofertas · 21 países · 24/7 trabajando por ti
          </div>
        </div>

        <div className="relative z-10 hidden lg:flex items-center justify-between mt-8">
          <p className="text-xs" style={{ color: "#374151" }}>© 2026 BuscayCurra · Sin permanencia · 21 países</p>
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
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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
                <div className="relative">
                  <input id="contrasena" type={verContrasena ? "text" : "password"} value={contrasena} onChange={(e) => setContrasena(e.target.value)}
                    placeholder="Tu contraseña" required autoComplete="current-password"
                    className="w-full rounded-lg px-3.5 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 transition"
                    style={inputStyle} />
                  <button type="button" onClick={() => setVerContrasena(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition hover:opacity-80"
                    style={{ color: "#64748b" }} tabIndex={-1} aria-label={verContrasena ? "Ocultar contraseña" : "Mostrar contraseña"}>
                    {verContrasena ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
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
