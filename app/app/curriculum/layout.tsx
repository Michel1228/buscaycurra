import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mi Currículum — BuscayCurra",
  description: "Crea y gestiona tu CV profesional. La plantilla se actualiza en vivo. Mejora tu CV con IA y descárgalo en PDF.",
  openGraph: {
    title: "Editor de CV — BuscayCurra",
    description: "Editor de CV con IA y previsualización en vivo.",
    url: "https://buscaycurra.es/app/curriculum",
    type: "website",
  },
};

export default function CurriculumLayout({ children }: { children: React.ReactNode }) {
  return children;
}
