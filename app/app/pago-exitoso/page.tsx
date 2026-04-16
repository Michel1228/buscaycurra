/**
 * app/app/pago-exitoso/page.tsx — Página de confirmación de pago exitoso
 *
 * Se muestra tras completar el pago con Stripe.
 * Confirma al usuario que su plan ha sido activado correctamente
 * y ofrece un botón para volver al dashboard.
 *
 * Colores de marca: azul #2563EB y naranja #F97316.
 */

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

// ─── Componente interno que usa useSearchParams ───────────────────────────────

function PagoExitosoContenido() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Pequeña animación de entrada
  const [visible, setVisible] = useState(false);
  // Plan activo del usuario (obtenido desde el perfil)
  const [planActivo, setPlanActivo] = useState<string>("Pro");

  useEffect(() => {
    // Activar animación tras montar el componente
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Obtener el plan activo desde el perfil del usuario
  useEffect(() => {
    const obtenerPlan = async () => {
      try {
        const { data: { session } } = await getSupabaseBrowser().auth.getSession();
        if (!session) return;

        const { data: perfil } = await getSupabaseBrowser()
          .from("profiles")
          .select("plan")
          .eq("id", session.user.id)
          .single();

        if (perfil?.plan === "empresa") {
          setPlanActivo("Empresa");
        } else {
          setPlanActivo("Pro");
        }
      } catch {
        // Mantenemos "Pro" como valor por defecto
      }
    };

    void obtenerPlan();
  }, [searchParams]);

  // Características según el plan
  const caracteristicas =
    planActivo === "Empresa"
      ? [
          "✅ Envíos ilimitados de CV",
          "✅ IA avanzada activada",
          "✅ Acceso a API",
          "✅ Soporte dedicado 24/7",
        ]
      : [
          "✅ 10 CVs enviados por día",
          "✅ IA avanzada activada",
          "✅ Estadísticas detalladas",
          "✅ Soporte prioritario",
        ];

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div
        className={`bg-white rounded-2xl shadow-lg p-10 max-w-md w-full text-center transition-all duration-500 ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        {/* Icono de éxito */}
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mx-auto mb-6"
          style={{ backgroundColor: "#dbeafe" }}
        >
          🎉
        </div>

        {/* Título */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          ¡Pago completado!
        </h1>

        {/* Descripción */}
        <p className="text-gray-500 mb-2">
          Ya tienes el plan{" "}
          <strong className="text-gray-700">{planActivo}</strong> activado.
        </p>
        <p className="text-gray-400 text-sm mb-8">
          Disfruta de todas las funcionalidades avanzadas de BuscayCurra.
          Tu plan estará activo en unos segundos.
        </p>

        {/* Características activadas */}
        <div className="bg-blue-50 rounded-xl p-4 mb-8 text-left space-y-2">
          {caracteristicas.map((item) => (
            <p key={item} className="text-sm text-blue-700">
              {item}
            </p>
          ))}
        </div>

        {/* Botón para volver al dashboard */}
        <button
          onClick={() => router.push("/app")}
          className="w-full py-3 rounded-xl font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: "#2563EB" }}
        >
          Ir al dashboard →
        </button>

        {/* Enlace secundario */}
        <button
          onClick={() => router.push("/precios")}
          className="mt-3 text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          Ver detalles del plan
        </button>
      </div>
    </div>
  );
}

// ─── Componente Principal (envuelto en Suspense para useSearchParams) ─────────

export default function PagoExitosoPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div
            className="animate-spin rounded-full h-10 w-10 border-4 border-t-transparent"
            style={{ borderColor: "#2563EB", borderTopColor: "transparent" }}
          />
        </div>
      }
    >
      <PagoExitosoContenido />
    </Suspense>
  );
}
