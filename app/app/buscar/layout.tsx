import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Buscar Empleo — BuscayCurra | 800.000+ ofertas en España",
  description: "Busca entre 800.000+ ofertas de trabajo en España y 20+ países. Filtra por puesto, ciudad y salario. Envía tu CV con un clic.",
  openGraph: {
    title: "Buscar Empleo — 800.000+ ofertas en España",
    description: "Todas las ofertas de trabajo de España en un solo lugar. Guzzi te ayuda a filtrar y aplicar automáticamente.",
    url: "https://buscaycurra.es/app/buscar",
    type: "website",
  },
};

export default function BuscarLayout({ children }: { children: React.ReactNode }) {
  return children;
}
