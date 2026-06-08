import { NUM_PAISES } from "@/lib/paises";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `Buscar Empleo — BuscayCurra | Ofertas en ${NUM_PAISES} países`,
  description: `Busca entre ofertas de trabajo en España y ${NUM_PAISES} países. Filtra por puesto, ciudad y salario. Envía tu CV con un clic.`,
  openGraph: {
    title: `Buscar Empleo — Ofertas en ${NUM_PAISES} países`,
    description: "Todas las ofertas de trabajo de España en un solo lugar. Guzzi te ayuda a filtrar y aplicar automáticamente.",
    url: "https://buscaycurra.es/app/buscar",
    type: "website",
  },
};

export default function BuscarLayout({ children }: { children: React.ReactNode }) {
  return children;
}
