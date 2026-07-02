import type { Metadata } from "next";
import Link from "next/link";
import LogoGusano from "@/components/LogoGusano";
import CentroAyuda from "@/components/CentroAyuda";

/**
 * /soporte — Página PÚBLICA de soporte (sin autenticación).
 *
 * Es la "Support URL" que Apple exige (Guideline 1.5): debe ser accesible sin
 * login y ofrecer información de contacto y ayuda. El Centro de Ayuda interno
 * (/app/ayuda) está detrás del middleware de auth, por eso Apple no lo veía.
 */
export const metadata: Metadata = {
  title: "Soporte y Ayuda — BuscayCurra",
  description:
    "Centro de soporte de BuscayCurra. Preguntas frecuentes y contacto directo con nuestro equipo: soporte@buscaycurra.es. Respondemos en menos de 24 horas.",
  openGraph: {
    title: "Soporte y Ayuda — BuscayCurra",
    description:
      "¿Necesitas ayuda con BuscayCurra? Preguntas frecuentes y contacto con soporte.",
    url: "https://buscaycurra.es/soporte",
    type: "website",
  },
};

export default function SoportePage() {
  return (
    <div className="min-h-screen" style={{ background: "#0f1117" }}>
      {/* Cabecera pública mínima con logo y vuelta al inicio */}
      <header
        className="sticky top-0 z-50"
        style={{ background: "rgba(15,17,23,0.95)", borderBottom: "1px solid rgba(45,49,66,0.5)", backdropFilter: "blur(16px)" }}
      >
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <LogoGusano size={24} />
            <span className="font-bold text-sm" style={{ color: "#22c55e" }}>BuscayCurra</span>
          </Link>
          <Link href="/" className="text-xs hover:opacity-80 transition" style={{ color: "#94a3b8" }}>
            ← Volver al inicio
          </Link>
        </div>
      </header>

      <CentroAyuda />
    </div>
  );
}
