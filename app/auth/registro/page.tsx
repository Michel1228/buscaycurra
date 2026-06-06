"use client";

import { useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import Link from "next/link";
import Image from "next/image";

export default function RegistroPage() {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [confirmarContrasena, setConfirmarContrasena] = useState("");
  const [verContrasena, setVerContrasena] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [registrado, setRegistrado] = useState(false);
  const [error, setError] = useState("");

  const validar = (): string => {
    if (!nombre.trim()) return "El nombre es obligatorio.";
    if (contrasena.length < 8) return "Mínimo 8 caracteres.";
    if (contrasena !== confirmarContrasena) return "Las contraseñas no coinciden.";
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const err = validar();
    if (err) { setError(err); return; }
    setCargando(true);
    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== "undefined" ? window.location.origin : "");
      const { error: sErr } = await getSupabaseBrowser().auth.signUp({
        email: email.trim(),
        password: contrasena,
        options: {
          data: { full_name: nombre.trim() },
          emailRedirectTo: `${siteUrl}/auth/callback`,
        },
      });
      if (sErr) {
        if (sErr.message.includes("already registered")) setError("Este email ya está registrado.");
        else if (sErr.message.includes("weak password")) setError("Contraseña demasiado débil.");
        else setError("No se pudo crear la cuenta.");
        return;
      }
      setRegistrado(true);
      fetch("/api/auth/welcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), nombre: nombre.trim() }),
      }).catch((err) => { console.error('[Registro] Error welcome email:', err) });
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
        <div className="absolute inset-0 pointer-events-none">
          <div style={{
            position: "absolute", top: "10%", left: "-5%", width: "70%", height: "60%",
            background: "radial-gradient(ellipse, rgba(34,197,94,0.08) 0%, transparent 70%)",
          }} />
        </div>

        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2 mb-6 lg:mb-10">
            <Image src="/icon-192.png" alt="Guzzi" width={28} height={28} style={{ borderRadius: "50%" }} />
            <span className="font-bold text-lg" style={{ color: "#22c55e" }}>BuscayCurra</span>
          </Link>

          <h2 className="text-2xl lg:text-3xl font-bold leading-tight mb-2" style={{ color: "#f1f5f9" }}>
            Deja de enviar CVs<br />
            <span style={{ color: "#22c55e" }}>al vacío.</span>
          </h2>
          <p className="text-sm mb-6" style={{ color: "#64748b" }}>
            En 30 segundos tienes cuenta. Guzzi empieza a buscar trabajo por ti en 20+ países al instante.
          </p>

          {/* 3 puntos fuertes */}
          <div className="space-y-3">
            {[
              { icon: "🌍", title: "20+ países, un solo agente", desc: "Busca en España o emigra. Guzzi habla 12 idiomas y adapta tu CV al formato de cada país." },
              { icon: "🎯", title: "CV único para cada oferta", desc: "Tu CV se adapta a cada empresa. Supera los filtros ATS que descartan al 75% de candidatos." },
              { icon: "⏰", title: "Enviado cuando toca", desc: "Tu candidatura llega cuando el reclutador abre el email. Timing inteligente." },
            ].map(p => (
              <div key={p.title} className="flex items-start gap-3 p-3 rounded-xl"
                style={{ background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.12)" }}>
                <span className="text-xl shrink-0 mt-0.5">{p.icon}</span>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "#f1f5f9" }}>{p.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 hidden lg:block text-xs mt-8" style={{ color: "#374151" }}>
          © 2026 BuscayCurra · Sin permanencia · 20+ países · Cancela cuando quieras
        </p>
      </div>

      {/* Panel derecho — formulario */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10"
        style={{ background: "#0f1117" }}>
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-xl font-bold" style={{ color: "#f1f5f9" }}>Crea tu cuenta</h1>
            <p className="text-xs mt-1" style={{ color: "#64748b" }}>Empieza a buscar trabajo con Guzzi</p>
          </div>

          <div className="card-game p-6">
            {registrado ? (
              <div className="text-center py-4">
                <div className="text-4xl mb-3">✅</div>
                <h2 className="text-base font-bold mb-2" style={{ color: "#22c55e" }}>¡Cuenta creada!</h2>
                <p className="text-xs mb-5" style={{ color: "#94a3b8" }}>
                  Hemos enviado un email a <strong style={{ color: "#f1f5f9" }}>{email}</strong>. Confírmalo para empezar.
                </p>
                <Link href="/auth/login" className="btn-game inline-block text-xs">Ir al login</Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div>
                  <label htmlFor="nombre" className="block text-xs font-medium mb-1.5" style={{ color: "#94a3b8" }}>Nombre completo</label>
                  <input id="nombre" type="text" value={nombre} onChange={(e) => setNombre(e.target.value)}
                    placeholder="Tu nombre" required autoComplete="name"
                    className="w-full rounded-lg px-3.5 py-2.5 text-sm" style={inputStyle} />
                </div>

                <div>
                  <label htmlFor="email" className="block text-xs font-medium mb-1.5" style={{ color: "#94a3b8" }}>Email</label>
                  <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com" required autoComplete="email"
                    className="w-full rounded-lg px-3.5 py-2.5 text-sm" style={inputStyle} />
                </div>

                <div>
                  <label htmlFor="contrasena" className="block text-xs font-medium mb-1.5" style={{ color: "#94a3b8" }}>Contraseña</label>
                  <div className="relative">
                    <input id="contrasena" type={verContrasena ? "text" : "password"} value={contrasena} onChange={(e) => setContrasena(e.target.value)}
                      placeholder="Mínimo 8 caracteres" required minLength={8} autoComplete="new-password"
                      className="w-full rounded-lg px-3.5 py-2.5 pr-10 text-sm" style={inputStyle} />
                    <button type="button" onClick={() => setVerContrasena(v => !v)} tabIndex={-1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 hover:opacity-80 transition"
                      style={{ color: "#64748b" }} aria-label={verContrasena ? "Ocultar contraseña" : "Mostrar contraseña"}>
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

                <div>
                  <label htmlFor="confirmar" className="block text-xs font-medium mb-1.5" style={{ color: "#94a3b8" }}>Confirmar contraseña</label>
                  <div className="relative">
                    <input id="confirmar" type={verContrasena ? "text" : "password"} value={confirmarContrasena}
                      onChange={(e) => setConfirmarContrasena(e.target.value)}
                      placeholder="Repite la contraseña" required autoComplete="new-password"
                      className="w-full rounded-lg px-3.5 py-2.5 pr-10 text-sm" style={inputStyle} />
                  </div>
                  {confirmarContrasena.length > 0 && (
                    <p className="text-[11px] mt-1" style={{ color: contrasena === confirmarContrasena ? "#22c55e" : "#ef4444" }}>
                      {contrasena === confirmarContrasena ? "✓ Coinciden" : "✗ No coinciden"}
                    </p>
                  )}
                </div>

                {error && (
                  <div className="rounded-lg px-3.5 py-2.5 text-xs" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444" }}>
                    {error}
                  </div>
                )}

                <button type="submit" disabled={cargando}
                  className="btn-game w-full !py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                  {cargando ? "Creando cuenta..." : "Crear cuenta"}
                </button>
              </form>
            )}
          </div>

          {!registrado && (
            <p className="text-center text-xs mt-5" style={{ color: "#64748b" }}>
              ¿Ya tienes cuenta?{" "}
              <Link href="/auth/login" className="font-semibold hover:underline" style={{ color: "#22c55e" }}>Iniciar sesión</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
