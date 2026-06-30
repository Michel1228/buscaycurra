"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useRef, Suspense } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { PartyPopper, Check } from "lucide-react";

const planNames: Record<string, string> = {
  empresa: "Empresa",
  pro: "Pro",
  esencial: "Esencial",
  basico: "Básico",
};

function PagoExitosoContenido() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [planActivo, setPlanActivo] = useState<string>("Pro");
  const [polling, setPolling] = useState(true);
  const pollingRef = useRef(false);

  useEffect(() => {
    if (pollingRef.current) return;
    pollingRef.current = true;

    let attempts = 0;
    const maxAttempts = 10;

    const poll = async () => {
      try {
        const { data: { session } } = await getSupabaseBrowser().auth.getSession();
        if (!session) { setPolling(false); return; }
        const { data: perfil } = await getSupabaseBrowser()
          .from("profiles").select("plan").eq("id", session.user.id).single();

        if (perfil?.plan && perfil.plan !== "free") {
          setPlanActivo(planNames[perfil.plan] || "Pro");
          setPolling(false);
          return;
        }
      } catch { /* retry */ }

      attempts++;
      if (attempts >= maxAttempts) {
        setPolling(false);
        return;
      }

      // Exponential backoff: 1s, 2s, 4s, 8s, 16s, 30s cap
      const delay = Math.min(1000 * Math.pow(2, attempts - 1), 30000);
      setTimeout(poll, delay);
    };

    // First attempt after a short initial delay (Stripe webhook needs ~2s)
    setTimeout(poll, 2000);
  }, [searchParams]);

  const caracteristicas =
    planActivo === "Empresa"
      ? ["Envíos ilimitados de CV", "IA avanzada activada", "Acceso a API", "Soporte dedicado 24/7"]
      : planActivo === "Esencial"
      ? ["15 CVs enviados por día", "100 CVs por semana", "Mejora CV con IA", "Buscador avanzado"]
      : planActivo === "Básico"
      ? ["15 CVs enviados por día", "Buscador avanzado", "Mejora CV con IA"]
      : ["50 CVs enviados por día", "350 CVs por semana", "IA avanzada activada", "Soporte prioritario"];

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-16" style={{ background: "#0f1117" }}>
      <div className="w-full max-w-md rounded-2xl p-8 text-center" style={{ background: "#161922", border: "1px solid #2d3142" }}>
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ background: "rgba(34,197,94,0.1)", border: "2px solid rgba(34,197,94,0.2)" }}>
          <PartyPopper size={40} style={{ color: "#22c55e" }} />
        </div>

        <h1 className="text-2xl font-bold mb-2" style={{ color: "#f1f5f9" }}>¡Pago completado!</h1>
        <p className="text-sm mb-1" style={{ color: "#94a3b8" }}>
          Ya tienes el plan <strong style={{ color: "#22c55e" }}>{planActivo}</strong> activado.
        </p>
        <p className="text-xs mb-6" style={{ color: "#64748b" }}>
          {polling ? "⏳ Verificando tu plan..." : "Tu plan estará activo en unos segundos."}
        </p>

        <div className="rounded-xl p-4 mb-6 text-left space-y-2"
          style={{ background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.15)" }}>
          {caracteristicas.map((item) => (
            <p key={item} className="text-sm flex items-center gap-2" style={{ color: "#94a3b8" }}>
              <Check size={14} strokeWidth={2.5} style={{ color: "#22c55e", flexShrink: 0 }} /> {item}
            </p>
          ))}
        </div>

        <button onClick={() => router.push("/app/gusi")}
          className="btn-game w-full py-3 text-sm font-semibold mb-3">
          Ir a Guzzi →
        </button>
        <button onClick={() => router.push("/app/perfil")}
          className="text-xs hover:underline" style={{ color: "#64748b" }}>
          Ver mi plan en el perfil
        </button>
      </div>
    </div>
  );
}

export default function PagoExitosoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0f1117" }}>
        <div className="animate-spin rounded-full h-10 w-10" style={{ border: "3px solid #2d3142", borderTopColor: "#22c55e" }} />
      </div>
    }>
      <PagoExitosoContenido />
    </Suspense>
  );
}
