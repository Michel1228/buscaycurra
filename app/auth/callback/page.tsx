"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { pedirBienvenida } from "@/lib/onboarding/pedir-bienvenida";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [estado, setEstado] = useState<"cargando" | "ok" | "confirmada" | "error">("cargando");
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

        // Error que Supabase manda en el hash (#error=...&error_code=otp_expired)
        const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        if (hash.get("error")) {
          if (!mountedRef.current) return;
          setEstado("error");
          setMensaje(hash.get("error_code") === "otp_expired"
            ? "Este enlace ya ha caducado. Entra con tu correo y contraseña; si no te deja, pide otro correo de confirmación."
            : (hash.get("error_description") || "El enlace de confirmación no es válido o ha expirado."));
          return;
        }

        // Flujo PKCE: ?code=...
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          // EL CLIENTE YA LO HA CANJEADO SOLO. createBrowserClient lee el ?code=
          // al arrancar y lo canjea por su cuenta (detectSessionInUrl), así que
          // este segundo canje falla con el código ya gastado aunque la sesión
          // exista. Se tomaba por un fallo: "entra con tu correo", sin
          // bienvenida, y al pulsar Entrar ya estabas dentro sin escribir la
          // contraseña, así que tampoco la pedía el login. Dos personas en dos
          // días se quedaron así (centinela, 6 oct 2026).
          const yaHaySesion = error ? !!(await supabase.auth.getSession()).data.session : false;
          if (error && !yaHaySesion) {
            // EL CORREO YA ESTÁ CONFIRMADO, aunque aquí no haya sesión.
            //
            // Supabase solo manda aquí con ?code= DESPUÉS de comprobar el enlace
            // y confirmar la cuenta. Lo que falla es canjear el código, porque
            // la otra mitad (el code_verifier) se quedó en el navegador donde la
            // persona se registró. Es el caso normal del móvil: te registras en
            // la app y abres el correo en Gmail, que lo abre en otro navegador.
            // Antes salía "Algo no fue bien: el enlace no es válido", con la
            // cuenta confirmada, y la persona creía que el registro había fallado
            // (comprobado con un registro real el 3 oct 2026).
            if (!mountedRef.current) return;
            setEstado("confirmada");
            return;
          }

        // Flujo implícito: la sesión viene en el hash (#access_token=...). El
        // cliente está en modo PKCE y NO lo recoge solo: había que esperar un
        // segundo y la sesión no llegaba nunca. Se recoge a mano.
        } else if (hash.get("access_token") && hash.get("refresh_token")) {
          const { error } = await supabase.auth.setSession({
            access_token: hash.get("access_token")!,
            refresh_token: hash.get("refresh_token")!,
          });
          // Que el token no se quede en la barra de direcciones ni en el historial.
          window.history.replaceState(null, "", window.location.pathname);
          if (error) {
            if (!mountedRef.current) return;
            setEstado("confirmada");
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

        // Sin nada en la dirección: si ya hay sesión (vuelve a esta página), adelante.
        } else {
          const { data: { session } } = await supabase.auth.getSession();
          if (!mountedRef.current) return;
          if (!session) {
            setEstado("error");
            setMensaje("Este enlace no trae nada que confirmar. Entra con tu correo y contraseña.");
            return;
          }
        }

        // LA BIENVENIDA, AQUÍ: es el primer momento con sesión. El formulario de
        // registro también la pide, pero con la confirmación por correo aún no
        // hay sesión y se quedaba en un 401: sin ficha, sin ciudad, sin alerta y
        // sin correo de bienvenida (29 sep 2026). El servidor la hace una sola
        // vez por cuenta, así que da igual que llegue dos veces.
        const { data: { session: sesion } } = await supabase.auth.getSession();
        pedirBienvenida(sesion?.access_token);

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

          {estado === "confirmada" && (
            <>
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: "rgba(34,197,94,0.15)", border: "2px solid rgba(34,197,94,0.4)" }}>
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <path d="M6 16l7 7 13-13" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2 className="text-lg font-bold mb-2" style={{ color: "#22c55e" }}>¡Correo confirmado!</h2>
              <p className="text-sm mb-5" style={{ color: "#94a3b8" }}>
                Ya está todo listo. Entra con tu correo y la contraseña que elegiste para empezar.
              </p>
              <Link href="/auth/login?confirmada=1" className="btn-game text-sm">
                Entrar
              </Link>
            </>
          )}

          {estado === "error" && (
            <>
              <div className="mb-4 flex justify-center"><AlertTriangle size={44} strokeWidth={1.5} style={{ color: "#f59e0b" }} /></div>
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
