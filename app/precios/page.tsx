"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import Link from "next/link";
import LogoGusano from "@/components/LogoGusano";
import { isNativeIOS } from "@/lib/utils/platform";
import { Bot, Zap, Building2, Sprout, Egg, Star, CreditCard, Check, X, Apple } from "lucide-react";

const PLANES = [
  {
    id: "free", nombre: "Gratis", precio: "0€", periodo: "para siempre", PlanIcon: Egg,
    desc: "Para probar la plataforma",
    badge: "Sin Guzzi ni envíos",
    items: [
      { t: "Guzzi IA", ok: false, highlight: false },
      { t: "0 consultas/día", ok: false, muted: true, highlight: false },
      { t: "0 envíos CV/día", ok: false, muted: true, highlight: false },
      { t: "Buscador básico", ok: true, highlight: false },
      { t: "Carta IA personalizada", ok: false, highlight: false },
      { t: "Códigos promocionales", ok: false, highlight: false },
      { t: "Soporte prioritario", ok: false, highlight: false },
    ],
    dest: false, btn: "Empezar gratis", accion: "registro" as const,
  },
  {
    id: "esencial", nombre: "Esencial", precio: "2,99€", periodo: "/mes", PlanIcon: Sprout,
    desc: "Menos que un café al mes",
    items: [
      { t: "Guzzi GPT-4o-mini", ok: true, highlight: true },
      { t: "20 consultas/día", ok: true, highlight: false },
      { t: "10 envíos CV/día", ok: true, highlight: false },
      { t: "50 envíos CV/semana", ok: true, highlight: false },
      { t: "Carta IA personalizada", ok: true, highlight: false },
      { t: "Códigos promocionales", ok: false, highlight: false },
      { t: "Soporte prioritario", ok: false, highlight: false },
    ],
    dest: false, btn: "Elegir Esencial", accion: "esencial" as const,
  },
  {
    id: "pro", nombre: "Pro", precio: "9,99€", periodo: "/mes", PlanIcon: Zap,
    desc: "Para profesionales serios",
    items: [
      { t: "Guzzi GPT-4o", ok: true, highlight: true },
      { t: "100 consultas/día", ok: true, highlight: false },
      { t: "50 envíos CV/día", ok: true, highlight: false },
      { t: "300 envíos CV/semana", ok: true, highlight: false },
      { t: "Carta IA personalizada", ok: true, highlight: false },
      { t: "Códigos promocionales", ok: true, highlight: false },
      { t: "Soporte prioritario", ok: true, highlight: false },
    ],
    dest: true, btn: "Elegir Pro", accion: "pro" as const,
  },
  {
    id: "empresa", nombre: "Empresa", precio: "49,99€", periodo: "/mes", PlanIcon: Building2,
    desc: "Sin límites para equipos",
    items: [
      { t: "Guzzi GPT-4o", ok: true, highlight: true },
      { t: "Consultas ilimitadas", ok: true, highlight: false },
      { t: "200 envíos CV/día", ok: true, highlight: false },
      { t: "1.000 envíos CV/semana", ok: true, highlight: false },
      { t: "Carta IA personalizada", ok: true, highlight: false },
      { t: "Códigos promocionales", ok: true, highlight: false },
      { t: "Soporte 24/7", ok: true, highlight: false },
    ],
    dest: false, btn: "Elegir Empresa", accion: "empresa" as const,
  },
];

export default function PreciosPage() {
  const router = useRouter();
  const [cargando, setCargando] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [iosNativo, setIosNativo] = useState(false);

  useEffect(() => { setIosNativo(isNativeIOS()); }, []);

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

        {iosNativo && (
          <div className="max-w-md mx-auto mb-8 rounded-xl p-5 text-center"
            style={{ background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.2)" }}>
            <Apple size={28} className="mx-auto mb-2" style={{ color: "#94a3b8" }} />
            <p className="font-semibold text-sm mb-1" style={{ color: "#f1f5f9" }}>
              Suscríbete desde la web
            </p>
            <p className="text-xs" style={{ color: "#64748b" }}>
              Las suscripciones se gestionan en buscaycurra.es desde tu navegador.
              Tu plan estará disponible en la app inmediatamente.
            </p>
          </div>
        )}

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
                  <span className="badge-game badge-dorado text-[10px] flex items-center gap-1"><Star size={10} className="inline" /> Más popular</span>
                </div>
              )}

              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="text-[10px] px-3 py-0.5 rounded-full font-medium"
                    style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" }}>
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="flex justify-center mb-3">
                <plan.PlanIcon size={36} style={{ color: plan.dest ? "#7ed56f" : "#b0a890" }} />
              </div>
              <h2 className="text-xl font-bold" style={{ color: "#f0ebe0" }}>{plan.nombre}</h2>
              <p className="text-xs mt-1 mb-4" style={{ color: "#706a58" }}>{plan.desc}</p>

              <div className="mb-5">
                <span className="text-4xl font-black" style={{ color: plan.dest ? "#7ed56f" : "#f0ebe0" }}>
                  {plan.precio}
                </span>
                <span className="text-sm ml-1" style={{ color: "#706a58" }}>{plan.periodo}</span>
              </div>

              <ul className="space-y-2.5 mb-6 text-left flex-1">
                {plan.items.map((item) => {
                  const itemColor = item.highlight ? "#f0ebe0" : item.ok ? "#b0a890" : "#504a3a";
                  const itemWeight = item.highlight ? 600 : 400;
                  return (
                  <li key={item.t} className="flex items-start gap-2 text-sm">
                    <span className="mt-0.5 w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        background: item.ok ? "rgba(126,213,111,0.15)" : "rgba(80,74,58,0.3)",
                        color: item.ok ? "#7ed56f" : "#504a3a",
                      }}>
                      {item.ok ? <Check size={10} strokeWidth={3} /> : <X size={10} strokeWidth={3} />}
                    </span>
                    <span style={{ color: itemColor, fontWeight: itemWeight }}>{item.t}</span>
                  </li>
                )})}
              </ul>

              {iosNativo ? (
                <p className="text-xs text-center py-2" style={{ color: "#64748b" }}>
                  Disponible en buscaycurra.es
                </p>
              ) : (
                <button onClick={() => void handlePlan(plan)} disabled={cargando === plan.id}
                  className={plan.dest ? "btn-game w-full" : "btn-game-outline w-full"}
                  style={{ opacity: cargando === plan.id ? 0.6 : 1 }}>
                  {cargando === plan.id ? "Procesando..." : plan.btn}
                </button>
              )}
            </div>
          ))}
        </div>

        {!iosNativo && (
          <p className="text-center text-xs mt-10 flex items-center justify-center gap-1.5" style={{ color: "#504a3a" }}>
            <CreditCard size={12} />Pago seguro con Stripe · Sin permanencia · Cancela cuando quieras
          </p>
        )}

        <div className="text-center mt-6">
          <Link href="/" className="text-sm hover:underline" style={{ color: "#706a58" }}>
            ← Volver a la landing
          </Link>
        </div>
      </div>
    </div>
  );
}
