/**
 * /cursos/acreditar — La página pública del PEAC.
 *
 * Está fuera de /app a propósito: es la que tiene que indexar Google. Quien
 * busca "sacarme el título de gerocultor sin estudiar" o "acreditar experiencia
 * laboral" tiene que llegar aquí, no a un directorio de academias.
 */
import type { Metadata } from "next";
import PublicHeader from "@/components/PublicHeader";
import Acreditacion from "@/components/cursos/Acreditacion";

export const metadata: Metadata = {
  title: "Acreditar la experiencia laboral: saca el título sin estudiar | BuscayCurra",
  description:
    "Si llevas años trabajando puedes acreditar oficialmente lo que sabes hacer, gratis y sin volver a clase. Requisitos, papeles y por dónde se empieza en cada comunidad.",
  alternates: { canonical: "https://buscaycurra.es/cursos/acreditar" },
  openGraph: {
    title: "¿Llevas años trabajando y no tienes el título?",
    description:
      "Se puede acreditar oficialmente lo que ya sabes hacer, gratis y sin volver a estudiar. Requisitos y pasos.",
    url: "https://buscaycurra.es/cursos/acreditar",
    locale: "es_ES",
    type: "article",
    siteName: "BuscayCurra",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Acreditar la experiencia laboral" }],
  },
};

export default function AcreditarPublico() {
  return (
    <div className="min-h-screen" style={{ background: "#0f1117", color: "#f1f5f9" }}>
      <PublicHeader />
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
        <Acreditacion base="/cursos" />
      </div>
    </div>
  );
}
