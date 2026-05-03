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
        options: { data: { full_name: nombre.trim() } },
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
    <div className="min-h-screen flex items-center justify-center px-4 py-8" style={{ background: "#0f1117" }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4"
            style={{ background: "linear-gradient(135deg, rgba(34,197,94,0.15), rgba(22,163,74,0.08))", border: "2px solid rgba(34,197,94,0.25)" }}>
            🐛
          </div>
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
  );
}
