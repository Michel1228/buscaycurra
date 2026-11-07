import type { Metadata } from "next";
import Link from "next/link";
import LogoGusano from "@/components/LogoGusano";
import CentroAyuda from "@/components/CentroAyuda";
import PublicFooter from "@/components/PublicFooter";
import FondoOleaje from "@/components/FondoOleaje";

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
    <div className="ui-neon min-h-screen" style={{ background: "transparent" }}>
      {/* El fondo de oleaje de toda la aplicación */}
      <FondoOleaje />
      {/* Cabecera pública mínima con logo y vuelta al inicio */}
      <header
        className="barra-app sticky top-0 z-50"
        style={{ background: "rgba(6,9,11,0.84)", borderBottom: "1px solid rgba(163,230,53,0.12)", backdropFilter: "blur(16px)" }}
      >
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 min-h-[44px]">
            <LogoGusano size={28} />
            <span className="font-extrabold text-[17px] tracking-tight"><span style={{ color: "#f8fafc" }}>Buscay</span><span className="texto-neon">Curra</span></span>
          </Link>
          <Link href="/" className="inline-flex items-center min-h-[44px] text-sm hover:opacity-80 transition" style={{ color: "#a7b3c6" }}>
            ← Volver al inicio
          </Link>
        </div>
      </header>

      <CentroAyuda />
      <PublicFooter />
    </div>
  );
}
