import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Centro de Ayuda — BuscayCurra",
  description:
    "Encuentra respuesta a tus preguntas sobre BuscayCurra y Guzzi. Ayuda con cuenta, CV, búsqueda de empleo, planes y privacidad.",
  openGraph: {
    title: "Centro de Ayuda — BuscayCurra",
    description:
      "Respuestas a preguntas frecuentes sobre BuscayCurra y el asistente IA Guzzi.",
  },
};

export default function AyudaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
