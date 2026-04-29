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
      router.push("/app/gusi");
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
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#0f1117" }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4"
            style={{ background: "linear-gradient(135deg, rgba(34,197,94,0.15), rgba(22,163,74,0.08))", border: "2px solid rgba(34,197,94,0.25)" }}>
            🐛
          </div>
          <h1 className="text-xl font-bold" style={{ color: "#f1f5f9" }}>Bienvenido de vuelta</h1>
          <p className="text-xs mt-1" style={{ color: "#64748b" }}>Sigue tu evolución donde la dejaste</p>
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
  );
}
