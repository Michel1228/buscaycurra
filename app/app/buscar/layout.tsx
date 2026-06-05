import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Buscar Empleo — BuscayCurra | 3.000.000+ ofertas en 21 países",
  description: "Busca entre 3.000.000+ ofertas de trabajo en España y 21 países. Filtra por puesto, ciudad y salario. Envía tu CV con un clic.",
  openGraph: {
    title: "Buscar Empleo — 3.000.000+ ofertas en 21 países",
    description: "Todas las ofertas de trabajo de España en un solo lugar. Guzzi te ayuda a filtrar y aplicar automáticamente.",
    url: "https://buscaycurra.es/app/buscar",
    type: "website",
  },
};

export default function BuscarLayout({ children }: { children: React.ReactNode }) {
  return children;
}
