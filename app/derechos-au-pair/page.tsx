/**
 * /derechos-au-pair — La página pública de derechos de au pair.
 *
 * POR QUÉ ESTE NOMBRE Y NO /au-pair. Porque ya existe /app/au-pair, y tener a
 * la vez /au-pair y /app/au-pair es exactamente la colisión que nos tumbó las
 * páginas de cursos: el build del servidor escribió una encima de la otra y
 * /cursos salió en producción sin cabecera y sin JSON-LD. Mientras la ruta
 * pública no comparta nombre con una de dentro, no puede pasar.
 *
 * Es pública a propósito: "derechos au pair" lo busca gente que todavía no se
 * ha registrado, y muchas veces desde el país de acogida y con prisa.
 */
import type { Metadata } from "next";
import PublicHeader from "@/components/PublicHeader";
import DerechosAuPair from "@/components/aupair/Derechos";

export const metadata: Metadata = {
  title: "Derechos de una au pair: horas, contrato y cuándo es un trabajo | BuscayCurra",
  description:
    "Cinco horas al día, un día libre entero y contrato por escrito. Lo que dice el Acuerdo Europeo, en qué países vale, y cómo saber si lo que te piden ya no es ser au pair sino un empleo.",
  alternates: { canonical: "https://buscaycurra.es/derechos-au-pair" },
  openGraph: {
    title: "¿Lo que te están pidiendo sigue siendo ser au pair?",
    description:
      "Cinco horas al día, un día libre entero y contrato por escrito. Si es jornada completa, ya no es un intercambio: es un trabajo, y se paga.",
    url: "https://buscaycurra.es/derechos-au-pair",
    locale: "es_ES",
    type: "article",
    siteName: "BuscayCurra",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Derechos de una au pair" }],
  },
};

export default function DerechosAuPairPublico() {
  return (
    <div className="min-h-screen" style={{ background: "#0f1117", color: "#f1f5f9" }}>
      <PublicHeader />
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
        <DerechosAuPair base="/app/au-pair" />
      </div>
    </div>
  );
}
