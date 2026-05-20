"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import Link from "next/link";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [estado, setEstado] = useState<"cargando" | "ok" | "error">("cargando");
  const [mensaje, setMensaje] = useState("");
  const mountedRef = useRef(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    mountedRef.current = true;
    async function handleCallback() {
      try {
        const supabase = getSupabaseBrowser();

        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            if (!mountedRef.current) return;
            setEstado("error");
            setMensaje("El enlace de confirmación no es válido o ha expirado.");
            return;
          }
        } else {
          const { data: { session }, error } = await supabase.auth.getSession();
          if (error || !session) {
            await new Promise(r => setTimeout(r, 1500));
            if (!mountedRef.current) return;
            const { data: { session: session2 } } = await supabase.auth.getSession();
            if (!session2) {
              if (!mountedRef.current) return;
              setEstado("error");
              setMensaje("No se pudo confirmar la cuenta. Intenta iniciar sesión directamente.");
              return;
            }
          }
        }

        if (!mountedRef.current) return;
        setEstado("ok");
        setMensaje("¡Cuenta confirmada! Redirigiendo...");

        timerRef.current = setTimeout(() => {
          if (mountedRef.current) router.push("/app/bienvenida");
        }, 2000);

      } catch {
        if (mountedRef.current) {
          setEstado("error");
          setMensaje("Error al confirmar la cuenta. Por favor, intenta de nuevo.");
        }
      }
    }

    handleCallback();
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#0f1117" }}>
      <div className="w-full max-w-sm px-6">
        <div className="card-game p-8 text-center">
          {estado === "cargando" && (
            <>
              <div className="w-12 h-12 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-4"
                style={{ borderColor: "#22c55e", borderTopColor: "transparent" }} />
              <h2 className="text-base font-bold mb-2" style={{ color: "#f1f5f9" }}>Confirmando tu cuenta...</h2>
              <p className="text-xs" style={{ color: "#64748b" }}>Un momento, por favor.</p>
            </>
          )}

          {estado === "ok" && (
            <>
              <div className="text-5xl mb-4">✅</div>
              <h2 className="text-lg font-bold mb-2" style={{ color: "#22c55e" }}>¡Registro completado!</h2>
              <p className="text-sm mb-1" style={{ color: "#f1f5f9" }}>Usuario registrado con éxito.</p>
              <p className="text-xs" style={{ color: "#64748b" }}>Bienvenido/a a BuscayCurra 🐛</p>
              <p className="text-xs mt-3" style={{ color: "#64748b" }}>Redirigiendo al panel...</p>
            </>
          )}

          {estado === "error" && (
            <>
              <div className="text-4xl mb-4">⚠️</div>
              <h2 className="text-base font-bold mb-2" style={{ color: "#f1f5f9" }}>Algo no fue bien</h2>
              <p className="text-sm mb-5" style={{ color: "#94a3b8" }}>{mensaje}</p>
              <Link href="/auth/login" className="btn-game text-sm">
                Ir al login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
