import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mis Envíos de CV — BuscayCurra",
  description: "Gestiona el estado de tus envíos de CV. Haz seguimiento de tus candidaturas enviadas a empresas.",
  openGraph: {
    title: "Envíos de CV — BuscayCurra",
    description: "Gestiona y haz seguimiento de tus envíos de CV.",
    url: "https://buscaycurra.es/app/envios",
    type: "website",
  },
};

export default function EnviosLayout({ children }: { children: React.ReactNode }) {
  return children;
}
