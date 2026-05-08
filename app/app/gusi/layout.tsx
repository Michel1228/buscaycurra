import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Guzzi — Tu asistente IA de empleo | BuscayCurra",
  description: "Habla con Guzzi, el asistente de inteligencia artificial de BuscayCurra. Te ayuda a mejorar tu CV, preparar entrevistas y encontrar trabajo más rápido.",
  openGraph: {
    title: "Guzzi — Asistente IA de empleo",
    description: "El único asistente de empleo con IA que trabaja 24/7 para que tú encuentres trabajo antes. Mejora tu CV, prepara entrevistas y automatiza candidaturas.",
    url: "https://buscaycurra.es/app/gusi",
    type: "website",
  },
};

export default function GusiLayout({ children }: { children: React.ReactNode }) {
  return children;
}
