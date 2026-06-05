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
        const code       = params.get("code");
        const tokenHash  = params.get("token_hash");
        const type       = params.get("type");
        const errorParam = params.get("error");
        const errorDesc  = params.get("error_description");

        // Supabase puede mandar error explícito en la URL
        if (errorParam) {
          if (!mountedRef.current) return;
          setEstado("error");
          setMensaje(errorDesc || "El enlace de confirmación no es válido o ha expirado.");
          return;
        }

        // Flujo PKCE: ?code=...
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            if (!mountedRef.current) return;
            setEstado("error");
            setMensaje("El enlace de confirmación no es válido o ha expirado.");
            return;
          }

        // Flujo token_hash (Supabase moderno): ?token_hash=...&type=email|signup
        } else if (tokenHash && type) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as "email" | "signup" | "invite" | "magiclink" | "recovery" | "email_change",
          });
          if (error) {
            if (!mountedRef.current) return;
            setEstado("error");
            setMensaje("El enlace de confirmación no es válido o ha expirado.");
            return;
          }

        // Flujo implícito (hash fragment): Supabase lo procesa automáticamente
        } else {
          // Dar tiempo a que Supabase procese el hash fragment
          await new Promise(r => setTimeout(r, 1000));
          if (!mountedRef.current) return;
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            setEstado("error");
            setMensaje("No se pudo confirmar la cuenta. El enlace puede haber expirado. Intenta iniciar sesión directamente.");
            return;
          }
        }

        if (!mountedRef.current) return;
        setEstado("ok");

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
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: "rgba(34,197,94,0.15)", border: "2px solid rgba(34,197,94,0.4)" }}>
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <path d="M6 16l7 7 13-13" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2 className="text-lg font-bold mb-2" style={{ color: "#22c55e" }}>¡Cuenta confirmada!</h2>
              <p className="text-sm mb-1" style={{ color: "#f1f5f9" }}>Ya puedes usar BuscayCurra.</p>
              <p className="text-xs mt-3 animate-pulse" style={{ color: "#64748b" }}>Entrando a tu panel...</p>
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
