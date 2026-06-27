import { NUM_PAISES } from "@/lib/paises";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `Comparador de Salarios — BuscayCurra | ${NUM_PAISES} países`,
  description: "Compara salarios por puesto, provincia y país. Datos reales del mercado laboral. Toma decisiones informadas sobre tu carrera.",
  openGraph: {
    title: "Comparador de Salarios — BuscayCurra",
    description: "Compara salarios por puesto, provincia y país.",
    url: "https://buscaycurra.es/app/salarios",
    type: "website",
  },
};

export default function SalariosLayout({ children }: { children: React.ReactNode }) {
  return children;
}
