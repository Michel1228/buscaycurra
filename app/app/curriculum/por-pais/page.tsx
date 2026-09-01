/**
 * /app/curriculum/por-pais — Lo mismo, dentro de la aplicación.
 * La versión pública está en /cv-por-pais.
 */
import type { Metadata } from "next";
import CVPorPais from "@/components/cv/PorPais";

export const metadata: Metadata = {
  title: "Tu CV según el país | BuscayCurra",
};

export default function CVPorPaisApp() {
  return (
    <div className="min-h-screen pt-16" style={{ background: "#0f1117", color: "#f1f5f9" }}>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <CVPorPais base="/app/curriculum" />
      </div>
    </div>
  );
}
