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
      // Solo lo que existe de verdad: ni API, ni buscador avanzado, ni "IA
      // avanzada" (auditoría del 3 oct 2026).
      ? ["200 CVs enviados por día", "1.500 CVs por semana", "Guzzi sin límite", "Ver candidatos"]
      : planActivo === "Esencial"
      ? ["15 CVs enviados por día", "100 CVs por semana", "Mejora CV con IA", "Carta IA personalizada"]
      : planActivo === "Básico"
      ? ["15 CVs enviados por día", "Mejora CV con IA", "Carta IA personalizada"]
      : ["50 CVs enviados por día", "350 CVs por semana", "Carta IA personalizada", "Soporte prioritario"];

  return (
    <div className="ui-neon min-h-screen flex items-center justify-center px-4 pt-16" style={{ background: "transparent" }}>
      <div className="cristal tono-lima w-full max-w-md p-8 text-center"
        style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), 0 0 0 1px rgba(163,230,53,0.15), 0 24px 60px -30px rgba(163,230,53,0.8)" }}>
        <span className="icono-circulo tono-lima mx-auto mb-6" style={{ width: 84, height: 84 }} aria-hidden="true">
          <PartyPopper size={38} />
        </span>

        <h1 className="text-3xl font-extrabold tracking-tight mb-2" style={{ color: "#f8fafc" }}>¡Pago <span className="texto-neon">completado</span>!</h1>
        <p className="text-sm mb-1" style={{ color: "#cbd5e1" }}>
          Ya tienes el plan <strong style={{ color: "#d9f99d" }}>{planActivo}</strong> activado.
        </p>
        <p className="text-xs mb-6" style={{ color: "#a7b3c6" }}>
          {polling ? "⏳ Verificando tu plan..." : "Tu plan estará activo en unos segundos."}
        </p>

        <div className="rounded-2xl p-4 mb-6 text-left space-y-2"
          style={{ background: "rgba(163,230,53,0.06)", border: "1px solid rgba(163,230,53,0.22)" }}>
          {caracteristicas.map((item) => (
            <p key={item} className="text-sm flex items-center gap-2" style={{ color: "#dbe3ee" }}>
              <Check size={14} strokeWidth={2.5} style={{ color: "#bef264", flexShrink: 0 }} /> {item}
            </p>
          ))}
        </div>

        <button onClick={() => router.push("/app/gusi")}
          className="boton-neon w-full mb-3">
          Ir a Guzzi →
        </button>
        <button onClick={() => router.push("/app/perfil")}
          className="text-sm min-h-[44px] hover:underline" style={{ color: "#a7b3c6" }}>
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
        <div className="animate-spin rounded-full h-10 w-10" style={{ border: "3px solid #2d3142", borderTopColor: "#a3e635" }} />
      </div>
    }>
      <PagoExitosoContenido />
    </Suspense>
  );
}
