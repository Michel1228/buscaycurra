import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ofertas Guardadas — BuscayCurra",
  description: "Tus ofertas de trabajo guardadas. Encuentra y gestiona las ofertas que más te interesan.",
  openGraph: {
    title: "Ofertas Guardadas — BuscayCurra",
    description: "Gestiona tus ofertas de trabajo guardadas.",
    url: "https://buscaycurra.es/app/guardados",
    type: "website",
  },
};

export default function GuardadosLayout({ children }: { children: React.ReactNode }) {
  return children;
}
