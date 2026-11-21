import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Alta de empresa — BuscayCurra",
  description: "Da de alta tu empresa, ETT o agencia de colocación para ver a los candidatos de BuscayCurra. Gratis, con verificación del NIF.",
  robots: "noindex",
};

export default function AltaEmpresaLayout({ children }: { children: ReactNode }) {
  return children;
}
