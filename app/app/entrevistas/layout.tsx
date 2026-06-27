import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Entrevistas — BuscayCurra",
  description: "Gestiona tus entrevistas de trabajo. Prepara cada entrevista con la ayuda de Guzzi.",
  openGraph: {
    title: "Entrevistas — BuscayCurra",
    description: "Gestiona y prepara tus entrevistas de trabajo.",
    url: "https://buscaycurra.es/app/entrevistas",
    type: "website",
  },
};

export default function EntrevistasLayout({ children }: { children: React.ReactNode }) {
  return children;
}
