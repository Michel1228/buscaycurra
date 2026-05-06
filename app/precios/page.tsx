"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import Link from "next/link";
import LogoGusano from "@/components/LogoGusano";

const PLANES = [
  {
    id: "free", nombre: "Gratis", precio: "0€", periodo: "para siempre", emoji: "🥚",
    desc: "Para empezar sin riesgo",
    items: [
      { t: "3 CVs enviados por día", ok: true },
      { t: "Buscador de ofertas básico", ok: true },
      { t: "Creación CV con IA", ok: true },
      { t: "Plantilla profesional", ok: true },
      { t: "Carta de presentación IA", ok: false },
      { t: "Estadísticas de envíos", ok: false },
      { t: "Soporte prioritario", ok: false },
    ],
    dest: false, btn: "Empezar gratis", accion: "registro" as const,
    badge: null,
  },
  {
    id: "basico", nombre: "Básico", precio: "2,99€", periodo: "/mes", emoji: "🐛",
    desc: "Lo esencial para buscar trabajo",
    items: [
      { t: "15 CVs enviados por día", ok: true },
      { t: "Buscador avanzado", ok: true },
      { t: "IA avanzada para CV", ok: true },
      { t: "Carta de presentación IA", ok: true },
      { t: "Historial de envíos", ok: true },
      { t: "Estadísticas básicas", ok: false },
      { t: "Soporte prioritario", ok: false },
    ],
    dest: false, btn: "Elegir Básico", accion: "basico" as const,
    badge: null,
  },
  {
    id: "pro", nombre: "Pro", precio: "9,99€", periodo: "/mes", emoji: "🦋",
    desc: "Para encontrar trabajo rápido",
    items: [
      { t: "50 CVs enviados por día", ok: true },
      { t: "Todo lo del Básico", ok: true },
      { t: "IA avanzada (Llama + Gemini)", ok: true },
      { t: "Estadísticas detalladas", ok: true },
      { t: "ATS Score (compatibilidad)", ok: true },
      { t: "Soporte prioritario", ok: true },
      { t: "Historial completo", ok: true },
    ],
    dest: true, btn: "7 días gratis → Luego 9,99€/mes", accion: "pro" as const,
    badge: "⭐ Más popular",
  },
  {
    id: "empresa", nombre: "Empresa", precio: "49,99€", periodo: "/mes", emoji: "🏢",
    desc: "Para equipos y pymes",
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
    badge: null,
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

      <div className="fixed inset-0 pointer-events-none z-0">
        <div style={{ position: "absolute", top: "-10%", left: "10%", width: "40%", height: "50%",
          background: "radial-gradient(ellipse, rgba(126,213,111,0.06) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: "0", right: "10%", width: "40%", height: "40%",
          background: "radial-gradient(ellipse, rgba(240,192,64,0.04) 0%, transparent 70%)" }} />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <LogoGusano size={36} animated />
            <span className="font-bold" style={{ color: "#7ed56f" }}>BuscayCurra</span>
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold mb-3" style={{ color: "#f0ebe0" }}>
            Planes y precios
          </h1>
          <p className="text-base mb-2" style={{ color: "#706a58" }}>
            Sin permanencia · Cancela cuando quieras · Evoluciona a tu ritmo
          </p>

          {/* Comparativa vs InfoJobs */}
          <div className="inline-flex items-center gap-3 mt-4 px-5 py-2.5 rounded-2xl text-sm"
            style={{ background: "rgba(126,213,111,0.08)", border: "1px solid rgba(126,213,111,0.2)" }}>
            <span style={{ color: "#706a58" }}>💡 InfoJobs cobra</span>
            <span className="font-bold line-through" style={{ color: "#ef4444" }}>€369 por una oferta</span>
            <span style={{ color: "#706a58" }}>·</span>
            <span className="font-bold" style={{ color: "#7ed56f" }}>Nosotros: 50 envíos/día por €9,99/mes</span>
          </div>
        </div>

        {error && (
          <div className="max-w-md mx-auto mb-6 rounded-xl px-4 py-3 text-sm"
            style={{ background: "#2a1a1a", border: "1px solid #ff606030", color: "#ff8080" }}>
            {error}
          </div>
        )}

        {/* Grid de planes */}
        <div className="grid md:grid-cols-4 gap-4 items-start">
          {PLANES.map((plan) => (
            <div key={plan.id}
              className={`card-game p-6 text-center relative flex flex-col ${plan.dest ? "scale-[1.03]" : ""}`}
              style={plan.dest ? { borderColor: "#7ed56f", boxShadow: "0 0 40px rgba(126,213,111,0.15)" } : {}}>

              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <span className="badge-game badge-dorado text-[10px] px-3 py-1">{plan.badge}</span>
                </div>
              )}

              <div className="text-3xl mb-2">{plan.emoji}</div>
              <h2 className="text-lg font-bold" style={{ color: "#f0ebe0" }}>{plan.nombre}</h2>
              <p className="text-xs mt-0.5 mb-4" style={{ color: "#706a58" }}>{plan.desc}</p>

              <div className="mb-5">
                <span className="text-3xl font-black" style={{ color: plan.dest ? "#7ed56f" : "#f0ebe0" }}>
                  {plan.precio}
                </span>
                <span className="text-xs ml-1" style={{ color: "#706a58" }}>{plan.periodo}</span>
              </div>

              <ul className="space-y-2 mb-5 text-left flex-1">
                {plan.items.map((item) => (
                  <li key={item.t} className="flex items-start gap-2 text-xs">
                    <span className="mt-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0"
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
                className={plan.dest ? "btn-game w-full text-sm py-2.5" : "btn-game-outline w-full text-sm py-2.5"}
                style={{ opacity: cargando === plan.id ? 0.6 : 1 }}>
                {cargando === plan.id ? "Procesando..." : plan.btn}
              </button>

              {plan.id === "pro" && (
                <p className="text-[10px] mt-2" style={{ color: "#506a40" }}>
                  Sin tarjeta en los primeros 7 días
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Social proof */}
        <div className="mt-10 grid md:grid-cols-3 gap-4 text-center">
          {[
            { num: "400k+", label: "Ofertas indexadas en España" },
            { num: "0€", label: "Para empezar hoy mismo" },
            { num: "vs €369", label: "Lo que cobra InfoJobs por oferta" },
          ].map((s) => (
            <div key={s.num} className="p-4 rounded-2xl" style={{ background: "rgba(126,213,111,0.04)", border: "1px solid rgba(126,213,111,0.08)" }}>
              <div className="text-2xl font-black" style={{ color: "#7ed56f" }}>{s.num}</div>
              <div className="text-xs mt-1" style={{ color: "#706a58" }}>{s.label}</div>
            </div>
          ))}
        </div>

        <p className="text-center text-xs mt-8" style={{ color: "#504a3a" }}>
          💳 Pago seguro con Stripe · Sin permanencia · Cancela cuando quieras
        </p>

        <div className="text-center mt-4">
          <Link href="/" className="text-sm hover:underline" style={{ color: "#706a58" }}>
            ← Volver a la landing
          </Link>
        </div>
      </div>
    </div>
  );
}
