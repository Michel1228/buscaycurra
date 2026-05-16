"use client";

import { useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import Link from "next/link";

export default function RegistroPage() {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [confirmarContrasena, setConfirmarContrasena] = useState("");
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
      const { error: sErr } = await getSupabaseBrowser().auth.signUp({
        email: email.trim(),
        password: contrasena,
        options: {
          data: { full_name: nombre.trim() },
          emailRedirectTo: "https://buscaycurra.es/auth/callback",
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
      }).catch(() => {});
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
            <span className="text-2xl">🐛</span>
            <span className="font-bold text-lg" style={{ color: "#22c55e" }}>BuscayCurra</span>
          </Link>

          <h2 className="text-2xl lg:text-3xl font-bold leading-tight mb-2" style={{ color: "#f1f5f9" }}>
            Tu trabajo te está<br />
            <span style={{ color: "#22c55e" }}>esperando.</span>
          </h2>
          <p className="text-sm mb-6" style={{ color: "#64748b" }}>
            En 30 segundos tienes cuenta. Guzzi empieza a buscar trabajo por ti al instante.
          </p>

          {/* 3 puntos fuertes */}
          <div className="space-y-3">
            {[
              { icon: "🐛", title: "Guzzi aplica por ti", desc: "Envía tu CV a cientos de empresas cada día, automáticamente." },
              { icon: "🎯", title: "CV personalizado por IA", desc: "Cada candidatura adaptada a la oferta. No compites con 2.000 iguales." },
              { icon: "📊", title: "Seguimiento en tiempo real", desc: "Pipeline visual con el estado de cada candidatura." },
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
          © 2025 BuscayCurra · Sin permanencia · Cancela cuando quieras
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
                  <input id="contrasena" type="password" value={contrasena} onChange={(e) => setContrasena(e.target.value)}
                    placeholder="Mínimo 8 caracteres" required minLength={8} autoComplete="new-password"
                    className="w-full rounded-lg px-3.5 py-2.5 text-sm" style={inputStyle} />
                </div>

                <div>
                  <label htmlFor="confirmar" className="block text-xs font-medium mb-1.5" style={{ color: "#94a3b8" }}>Confirmar contraseña</label>
                  <input id="confirmar" type="password" value={confirmarContrasena}
                    onChange={(e) => setConfirmarContrasena(e.target.value)}
                    placeholder="Repite la contraseña" required autoComplete="new-password"
                    className="w-full rounded-lg px-3.5 py-2.5 text-sm" style={inputStyle} />
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
