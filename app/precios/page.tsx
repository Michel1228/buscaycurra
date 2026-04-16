/**
 * app/precios/page.tsx — Página pública de planes y precios
 *
 * Muestra tres planes de suscripción:
 *   - Free (0€): funcionalidades básicas
 *   - Pro (9.99€/mes): funcionalidades avanzadas con IA — PLAN DESTACADO
 *   - Empresa (49.99€/mes): plan ilimitado para empresas
 *
 * Colores de marca: azul #2563EB y naranja #F97316.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Caracteristica {
  texto: string;
  incluida: boolean;
}

interface Plan {
  id: string;
  nombre: string;
  precio: string;
  periodo: string;
  descripcion: string;
  caracteristicas: Caracteristica[];
  destacado: boolean;
  botonTexto: string;
  accion: "registro" | "pro" | "empresa";
}

// ─── Datos de los planes ──────────────────────────────────────────────────────

const PLANES: Plan[] = [
  {
    id: "free",
    nombre: "Free",
    precio: "0€",
    periodo: "para siempre",
    descripcion: "Perfecto para empezar tu búsqueda de empleo",
    caracteristicas: [
      { texto: "2 CVs enviados por día", incluida: true },
      { texto: "Buscador básico de ofertas", incluida: true },
      { texto: "Mejora de CV básica con IA", incluida: true },
      { texto: "Historial de envíos", incluida: true },
      { texto: "IA avanzada (Llama + Gemini)", incluida: false },
      { texto: "Estadísticas detalladas", incluida: false },
      { texto: "Soporte prioritario", incluida: false },
      { texto: "Acceso a API", incluida: false },
    ],
    destacado: false,
    botonTexto: "Empezar gratis",
    accion: "registro",
  },
  {
    id: "pro",
    nombre: "Pro",
    precio: "9.99€",
    periodo: "mes",
    descripcion: "Para candidatos serios que quieren destacar",
    caracteristicas: [
      { texto: "10 CVs enviados por día", incluida: true },
      { texto: "Buscador avanzado de ofertas", incluida: true },
      { texto: "IA avanzada (Llama + Gemini)", incluida: true },
      { texto: "Estadísticas detalladas", incluida: true },
      { texto: "Soporte prioritario", incluida: true },
      { texto: "Historial completo", incluida: true },
      { texto: "Envíos ilimitados", incluida: false },
      { texto: "Acceso a API", incluida: false },
    ],
    destacado: true,
    botonTexto: "Elegir Pro",
    accion: "pro",
  },
  {
    id: "empresa",
    nombre: "Empresa",
    precio: "49.99€",
    periodo: "mes",
    descripcion: "Solución completa para equipos y empresas",
    caracteristicas: [
      { texto: "Envíos ilimitados", incluida: true },
      { texto: "Todo lo del plan Pro", incluida: true },
      { texto: "Acceso a API", incluida: true },
      { texto: "Dashboard de equipo", incluida: true },
      { texto: "Soporte dedicado 24/7", incluida: true },
      { texto: "Onboarding personalizado", incluida: true },
      { texto: "SLA garantizado", incluida: true },
      { texto: "Factura empresarial", incluida: true },
    ],
    destacado: false,
    botonTexto: "Elegir Empresa",
    accion: "empresa",
  },
];

// ─── Componente Principal ─────────────────────────────────────────────────────

export default function PreciosPage() {
  const router = useRouter();

  // Estado de carga individual por plan
  const [cargando, setCargando] = useState<string | null>(null);
  const [error, setError] = useState<string>("");

  /**
   * Maneja el clic en el botón de un plan.
   * - Free: redirige al registro
   * - Pro / Empresa: inicia el flujo de pago con Stripe
   */
  const handleElegirPlan = async (plan: Plan) => {
    setError("");

    // Plan gratuito: redirigir al registro
    if (plan.accion === "registro") {
      router.push("/auth/registro");
      return;
    }

    setCargando(plan.id);

    try {
      // Obtener el token de sesión del usuario
      const { data: { session } } = await getSupabaseBrowser().auth.getSession();

      // Si no está autenticado, redirigir al login
      if (!session) {
        router.push("/auth/login");
        return;
      }

      // Llamar a la API de checkout de Stripe
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ plan: plan.accion }),
      });

      const data = await response.json() as { url?: string; error?: string };

      if (!response.ok || data.error) {
        setError(data.error ?? "No se pudo iniciar el pago. Por favor, inténtalo de nuevo.");
        return;
      }

      // Redirigir a la página de pago de Stripe
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setError("Error de red. Por favor, comprueba tu conexión e inténtalo de nuevo.");
    } finally {
      setCargando(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Cabecera ──────────────────────────────────────────────── */}
      <div
        className="text-white py-16 px-4 text-center"
        style={{ background: "linear-gradient(135deg, #2563EB, #1d4ed8)" }}
      >
        <h1 className="text-4xl font-bold mb-3">Planes y precios</h1>
        <p className="text-blue-200 text-lg max-w-xl mx-auto">
          Elige el plan que mejor se adapta a tu búsqueda de empleo.
          Sin permanencia, cancela cuando quieras.
        </p>
      </div>

      {/* ── Error global ──────────────────────────────────────────── */}
      {error && (
        <div className="max-w-4xl mx-auto px-4 mt-6">
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        </div>
      )}

      {/* ── Grid de planes ────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {PLANES.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col ${
                plan.destacado
                  ? "border-2 ring-2 ring-offset-2 relative"
                  : "border border-gray-200"
              }`}
              style={
                plan.destacado
                  ? { borderColor: "#2563EB" }
                  : {}
              }
            >
              {/* Badge "Más popular" para el plan Pro */}
              {plan.destacado && (
                <div
                  className="text-white text-xs font-bold text-center py-1.5 tracking-wide"
                  style={{ backgroundColor: "#2563EB" }}
                >
                  ⭐ Más popular
                </div>
              )}

              {/* Cabecera del plan */}
              <div className="p-6 pb-4">
                <h2 className="text-xl font-bold text-gray-900">{plan.nombre}</h2>
                <p className="text-gray-500 text-sm mt-1">{plan.descripcion}</p>

                {/* Precio */}
                <div className="mt-4 flex items-end gap-1">
                  <span className="text-4xl font-extrabold text-gray-900">
                    {plan.precio}
                  </span>
                  {plan.periodo !== "para siempre" && (
                    <span className="text-gray-500 text-sm mb-1">/{plan.periodo}</span>
                  )}
                  {plan.periodo === "para siempre" && (
                    <span className="text-gray-500 text-sm mb-1">para siempre</span>
                  )}
                </div>
              </div>

              {/* Lista de características */}
              <div className="px-6 pb-6 flex-1">
                <ul className="space-y-2.5">
                  {plan.caracteristicas.map((caracteristica, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-sm">
                      {/* Icono de check o cruz */}
                      <span
                        className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold ${
                          caracteristica.incluida
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        {caracteristica.incluida ? "✓" : "✕"}
                      </span>
                      <span
                        className={
                          caracteristica.incluida ? "text-gray-700" : "text-gray-400"
                        }
                      >
                        {caracteristica.texto}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Botón de acción */}
              <div className="px-6 pb-6">
                <button
                  onClick={() => void handleElegirPlan(plan)}
                  disabled={cargando === plan.id}
                  className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
                    plan.destacado
                      ? "text-white hover:opacity-90 disabled:opacity-60"
                      : "border-2 hover:opacity-80 disabled:opacity-60"
                  }`}
                  style={
                    plan.destacado
                      ? { backgroundColor: "#2563EB", borderColor: "#2563EB" }
                      : plan.id === "empresa"
                      ? { borderColor: "#F97316", color: "#F97316" }
                      : { borderColor: "#6b7280", color: "#6b7280" }
                  }
                >
                  {cargando === plan.id ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                      Procesando...
                    </span>
                  ) : (
                    plan.botonTexto
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* ── Nota de pie de página ────────────────────────────────── */}
        <p className="text-center text-gray-400 text-sm mt-8">
          💳 Pago seguro con Stripe · Sin permanencia · Cancela cuando quieras
        </p>
      </div>
    </div>
  );
}
