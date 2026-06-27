import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bienvenido a BuscayCurra | Tu asistente de empleo IA",
  description: "Empieza a buscar trabajo con Guzzi, el asistente de IA que trabaja 24/7 por ti.",
  openGraph: {
    title: "Bienvenido — BuscayCurra",
    description: "Empieza tu búsqueda de empleo con IA.",
    url: "https://buscaycurra.es/app/bienvenida",
    type: "website",
  },
};

export default function BienvenidaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
