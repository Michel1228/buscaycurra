/**
 * /cursos/renovar — Índice público de renovaciones: qué carnés caducan y cada
 * cuánto. Lleva a la página de renovación de cada uno.
 */
import type { Metadata } from "next";
import PublicHeader from "@/components/PublicHeader";
import { ListaRenovaciones } from "@/components/cursos/Renovacion";

export const metadata: Metadata = {
  title: "Renovar carnés profesionales: carretilla, CAP, TPC, TIP y soldador | BuscayCurra",
  description:
    "Cada cuánto caduca tu carné y qué hay que hacer para renovarlo: carretillero, plataforma elevadora, TPC, CAP, vigilante y homologación de soldador. Con la fuente oficial.",
  alternates: { canonical: "https://buscaycurra.es/cursos/renovar" },
  openGraph: {
    title: "¿Se te caduca el carné?",
    description: "Cada cuánto caduca y qué hay que hacer para renovarlo, con la fuente oficial de cada dato.",
    url: "https://buscaycurra.es/cursos/renovar",
    locale: "es_ES",
    type: "article",
    siteName: "BuscayCurra",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Renovar carnés profesionales" }],
  },
};

export default function RenovarPublico() {
  return (
    <div className="min-h-screen" style={{ background: "#0f1117", color: "#f1f5f9" }}>
      <PublicHeader />
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
        <ListaRenovaciones base="/cursos" />
      </div>
    </div>
  );
}
