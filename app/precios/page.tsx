"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import Link from "next/link";
import LogoGusano from "@/components/LogoGusano";

const PLANES = [
  {
    id: "free", nombre: "Gratis", precio: "0€", periodo: "para siempre", emoji: "🥚",
    desc: "Para empezar tu aventura",
    items: [
      { t: "2 CVs enviados por día", ok: true },
      { t: "Buscador básico", ok: true },
      { t: "Mejora CV con IA", ok: true },
      { t: "Historial de envíos", ok: true },
      { t: "IA avanzada", ok: false },
      { t: "Estadísticas", ok: false },
      { t: "Soporte prioritario", ok: false },
    ],
    dest: false, btn: "Empezar gratis", accion: "registro" as const,
  },
  {
    id: "esencial", nombre: "Esencial", precio: "2,99€", periodo: "/mes", emoji: "🌱",
    desc: "Menos que un café al mes",
    items: [
      { t: "60 candidaturas al mes", ok: true },
      { t: "Buscador avanzado", ok: true },
      { t: "Mejora CV con IA", ok: true },
      { t: "Historial de envíos", ok: true },
      { t: "Estadísticas básicas", ok: true },
      { t: "IA avanzada", ok: false },
      { t: "Soporte prioritario", ok: false },
    ],
    dest: false, btn: "Elegir Esencial", accion: "esencial" as const,
  },
  {
    id: "pro", nombre: "Pro", precio: "9,99€", periodo: "/mes", emoji: "🐛",
    desc: "Para profesionales serios",
    items: [
      { t: "10 CVs enviados por día", ok: true },
      { t: "Buscador avanzado", ok: true },
      { t: "IA avanzada (Llama + Gemini)", ok: true },
      { t: "Estadísticas detalladas", ok: true },
      { t: "Soporte prioritario", ok: true },
      { t: "Historial completo", ok: true },
      { t: "Acceso API", ok: false },
    ],
    dest: true, btn: "Elegir Pro", accion: "pro" as const,
  },
  {
    id: "empresa", nombre: "Empresa", precio: "49,99€", periodo: "/mes", emoji: "🏢",
    desc: "Sin límites para equipos",
    items: [
      { t: "Envíos ilimitados", ok: true },
      { t: "Todo lo del Pro", ok: true },
      { t: "Acceso API", ok: true },
      { t: "Dashboard de equipo", ok: true },
      { t: "Soporte 24/7", ok: true },
      { t: "Onboarding personalizado", ok: true },
      { t: "Factura empresarial", ok: true },
    ],
    dest: false, btn: "Elegir Empresa", accion: "empresa" as const,
  },
];

export default function PreciosPage() {
  const router = useRouter();
  const [cargando, setCargando] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handlePlan = async (plan: typeof PLANES[0]) => {
    setError("");
    if (plan.accion === "registro") { router.push("/auth/registro"); return; }
    setCargando(plan.id);
    try {
      const { data: { session } } = await getSupabaseBrowser().auth.getSession();
      if (!session) { router.push("/auth/login"); return; }
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ plan: plan.accion }),
      });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok || data.error) { setError(data.error ?? "Error al iniciar el pago."); return; }
      if (data.url) window.location.href = data.url;
    } catch { setError("Error de red."); }
    finally { setCargando(null); }
  };

  return (
    <div className="min-h-screen px-4 py-16 relative overflow-hidden"
      style={{ background: "linear-gradient(180deg, #0f1a0a, #1a1a12, #15200e)" }}>

      {/* Fondo */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div style={{ position: "absolute", top: "-10%", left: "10%", width: "40%", height: "50%",
          background: "radial-gradient(ellipse, rgba(126,213,111,0.06) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: "0", right: "10%", width: "40%", height: "40%",
          background: "radial-gradient(ellipse, rgba(240,192,64,0.04) 0%, transparent 70%)" }} />
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-14">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <LogoGusano size={36} animated />
            <span className="font-bold" style={{ color: "#7ed56f" }}>BuscayCurra</span>
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold mb-3" style={{ color: "#f0ebe0" }}>
            Planes y precios
          </h1>
          <p className="text-base" style={{ color: "#706a58" }}>
            Sin permanencia. Cancela cuando quieras. Evoluciona a tu ritmo.
          </p>
        </div>

        {error && (
          <div className="max-w-md mx-auto mb-6 rounded-xl px-4 py-3 text-sm"
            style={{ background: "#2a1a1a", border: "1px solid #ff606030", color: "#ff8080" }}>
            {error}
          </div>
        )}

        {/* Grid de planes */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 items-start">
          {PLANES.map((plan) => (
            <div key={plan.id}
              className={`card-game p-7 text-center relative flex flex-col ${plan.dest ? "scale-[1.03]" : ""}`}
              style={plan.dest ? { borderColor: "#7ed56f", boxShadow: "0 0 40px rgba(126,213,111,0.12)" } : {}}>

              {plan.dest && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="badge-game badge-dorado text-[10px]">⭐ Más popular</span>
                </div>
              )}

              <div className="text-4xl mb-3">{plan.emoji}</div>
              <h2 className="text-xl font-bold" style={{ color: "#f0ebe0" }}>{plan.nombre}</h2>
              <p className="text-xs mt-1 mb-4" style={{ color: "#706a58" }}>{plan.desc}</p>

              <div className="mb-5">
                <span className="text-4xl font-black" style={{ color: plan.dest ? "#7ed56f" : "#f0ebe0" }}>
                  {plan.precio}
                </span>
                <span className="text-sm ml-1" style={{ color: "#706a58" }}>{plan.periodo}</span>
              </div>

              <ul className="space-y-2.5 mb-6 text-left flex-1">
                {plan.items.map((item) => (
                  <li key={item.t} className="flex items-start gap-2 text-sm">
                    <span className="mt-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                      style={{
                        background: item.ok ? "rgba(126,213,111,0.15)" : "rgba(80,74,58,0.3)",
                        color: item.ok ? "#7ed56f" : "#504a3a",
                      }}>
                      {item.ok ? "✓" : "✕"}
                    </span>
                    <span style={{ color: item.ok ? "#b0a890" : "#504a3a" }}>{item.t}</span>
                  </li>
                ))}
              </ul>

              <button onClick={() => void handlePlan(plan)} disabled={cargando === plan.id}
                className={plan.dest ? "btn-game w-full" : "btn-game-outline w-full"}
                style={{ opacity: cargando === plan.id ? 0.6 : 1 }}>
                {cargando === plan.id ? "Procesando..." : plan.btn}
              </button>
            </div>
          ))}
        </div>

        <p className="text-center text-xs mt-10" style={{ color: "#504a3a" }}>
          💳 Pago seguro con Stripe · Sin permanencia · Cancela cuando quieras
        </p>

        <div className="text-center mt-6">
          <Link href="/" className="text-sm hover:underline" style={{ color: "#706a58" }}>
            ← Volver a la landing
          </Link>
        </div>
      </div>
    </div>
  );
}
