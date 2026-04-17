"use client";

import { useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import Link from "next/link";
import LogoGusano from "@/components/LogoGusano";

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
      router.push("/app");
    } catch {
      setError("Error inesperado. Inténtalo de nuevo.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: "linear-gradient(180deg, #0f1a0a, #1a1a12, #15200e)" }}>
      
      {/* Fondo decorativo */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div style={{ position: "absolute", top: "-20%", left: "-10%", width: "50%", height: "60%",
          background: "radial-gradient(ellipse, rgba(126,213,111,0.06) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: "-10%", right: "-10%", width: "45%", height: "50%",
          background: "radial-gradient(ellipse, rgba(139,111,71,0.06) 0%, transparent 70%)" }} />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo + título */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4 animate-float">
            <LogoGusano size={60} animated />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "#f0ebe0" }}>Bienvenido de vuelta</h1>
          <p className="text-sm mt-1" style={{ color: "#706a58" }}>Sigue tu evolución donde la dejaste</p>
        </div>

        {/* Tarjeta formulario */}
        <div className="card-game p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1.5" style={{ color: "#b0a890" }}>
                Email
              </label>
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com" required autoComplete="email"
                className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 transition"
                style={{
                  background: "#1a1a12", border: "1.5px solid #3d3c30", color: "#f0ebe0",
                  // @ts-expect-error ring color
                  "--tw-ring-color": "#7ed56f",
                }}
              />
            </div>

            {/* Contraseña */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="contrasena" className="text-sm font-medium" style={{ color: "#b0a890" }}>
                  Contraseña
                </label>
                <Link href="/auth/recuperar" className="text-xs font-medium hover:underline" style={{ color: "#7ed56f" }}>
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <input id="contrasena" type="password" value={contrasena} onChange={(e) => setContrasena(e.target.value)}
                placeholder="Tu contraseña" required autoComplete="current-password"
                className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 transition"
                style={{
                  background: "#1a1a12", border: "1.5px solid #3d3c30", color: "#f0ebe0",
                  // @ts-expect-error ring color
                  "--tw-ring-color": "#7ed56f",
                }}
              />
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-xl px-4 py-3 text-sm" style={{ background: "#2a1a1a", border: "1px solid #ff606030", color: "#ff8080" }}>
                {error}
              </div>
            )}

            {/* Botón */}
            <button type="submit" disabled={cargando || !email.trim() || !contrasena}
              className="btn-game w-full !py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed">
              {cargando ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#1a1a12", borderTopColor: "transparent" }} />
                  Entrando...
                </span>
              ) : "🐛 Entrar"}
            </button>
          </form>
        </div>

        {/* Enlace a registro */}
        <p className="text-center text-sm mt-6" style={{ color: "#706a58" }}>
          ¿No tienes cuenta?{" "}
          <Link href="/auth/registro" className="font-semibold hover:underline" style={{ color: "#7ed56f" }}>
            Empieza tu metamorfosis 🌱
          </Link>
        </p>
      </div>
    </div>
  );
}
