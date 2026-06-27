import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Invita y Gana — BuscayCurra",
  description: "Invita a tus amigos a BuscayCurra y ganad +10 CVs extra al mes cada uno. Sin límite de invitados.",
  openGraph: {
    title: "Programa de Referidos — BuscayCurra",
    description: "Invita amigos y ganad CVs extra gratis.",
    url: "https://buscaycurra.es/app/referidos",
    type: "website",
  },
};

export default function ReferidosLayout({ children }: { children: React.ReactNode }) {
  return children;
}
