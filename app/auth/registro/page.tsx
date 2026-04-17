"use client";

import { useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import Link from "next/link";
import LogoGusano from "@/components/LogoGusano";

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
        options: { data: { full_name: nombre.trim() } },
      });
      if (sErr) {
        if (sErr.message.includes("already registered")) setError("Este email ya está registrado.");
        else if (sErr.message.includes("weak password")) setError("Contraseña demasiado débil.");
        else setError("No se pudo crear la cuenta.");
        return;
      }
      setRegistrado(true);
    } catch {
      setError("Error inesperado. Inténtalo de nuevo.");
    } finally {
      setCargando(false);
    }
  };

  const inputStyle = {
    background: "#1a1a12",
    border: "1.5px solid #3d3c30",
    color: "#f0ebe0",
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 relative overflow-hidden"
      style={{ background: "linear-gradient(180deg, #0f1a0a, #1a1a12, #15200e)" }}>

      {/* Fondo */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div style={{ position: "absolute", top: "-20%", right: "-10%", width: "50%", height: "60%",
          background: "radial-gradient(ellipse, rgba(126,213,111,0.06) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: "-10%", left: "-10%", width: "45%", height: "50%",
          background: "radial-gradient(ellipse, rgba(240,192,64,0.04) 0%, transparent 70%)" }} />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <LogoGusano size={60} animated />
              {/* Huevo detrás */}
              <div className="absolute -bottom-1 -right-3 text-2xl">🥚</div>
            </div>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "#f0ebe0" }}>Empieza tu metamorfosis</h1>
          <p className="text-sm mt-1" style={{ color: "#706a58" }}>Todo empieza como un huevo 🥚</p>
        </div>

        {/* Tarjeta */}
        <div className="card-game p-8">
          {registrado ? (
            <div className="text-center py-4">
              <div className="text-5xl mb-4 animate-float">🥚</div>
              <h2 className="text-lg font-bold mb-2" style={{ color: "#7ed56f" }}>¡Tu huevo está listo!</h2>
              <p className="text-sm mb-6" style={{ color: "#b0a890" }}>
                Hemos enviado un email a <strong style={{ color: "#f0ebe0" }}>{email}</strong>.
                Confirma tu email para que el huevo empiece a eclosionar 🐛
              </p>
              <Link href="/auth/login" className="btn-game inline-block">
                Ir al login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nombre */}
              <div>
                <label htmlFor="nombre" className="block text-sm font-medium mb-1.5" style={{ color: "#b0a890" }}>
                  Nombre completo
                </label>
                <input id="nombre" type="text" value={nombre} onChange={(e) => setNombre(e.target.value)}
                  placeholder="Tu nombre" required autoComplete="name"
                  className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 transition"
                  style={inputStyle} />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1.5" style={{ color: "#b0a890" }}>
                  Email
                </label>
                <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com" required autoComplete="email"
                  className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 transition"
                  style={inputStyle} />
              </div>

              {/* Contraseña */}
              <div>
                <label htmlFor="contrasena" className="block text-sm font-medium mb-1.5" style={{ color: "#b0a890" }}>
                  Contraseña
                </label>
                <input id="contrasena" type="password" value={contrasena} onChange={(e) => setContrasena(e.target.value)}
                  placeholder="Mínimo 8 caracteres" required minLength={8} autoComplete="new-password"
                  className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 transition"
                  style={inputStyle} />
              </div>

              {/* Confirmar */}
              <div>
                <label htmlFor="confirmar" className="block text-sm font-medium mb-1.5" style={{ color: "#b0a890" }}>
                  Confirmar contraseña
                </label>
                <input id="confirmar" type="password" value={confirmarContrasena}
                  onChange={(e) => setConfirmarContrasena(e.target.value)}
                  placeholder="Repite la contraseña" required autoComplete="new-password"
                  className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 transition"
                  style={inputStyle} />
                {confirmarContrasena.length > 0 && (
                  <p className="text-xs mt-1" style={{ color: contrasena === confirmarContrasena ? "#7ed56f" : "#ff6060" }}>
                    {contrasena === confirmarContrasena ? "✓ Coinciden" : "✗ No coinciden"}
                  </p>
                )}
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-xl px-4 py-3 text-sm" style={{ background: "#2a1a1a", border: "1px solid #ff606030", color: "#ff8080" }}>
                  {error}
                </div>
              )}

              {/* Botón */}
              <button type="submit" disabled={cargando}
                className="btn-game w-full !py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed">
                {cargando ? "Creando tu huevo..." : "🥚 Crear mi cuenta"}
              </button>
            </form>
          )}
        </div>

        {!registrado && (
          <p className="text-center text-sm mt-6" style={{ color: "#706a58" }}>
            ¿Ya tienes cuenta?{" "}
            <Link href="/auth/login" className="font-semibold hover:underline" style={{ color: "#7ed56f" }}>
              Iniciar sesión
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
