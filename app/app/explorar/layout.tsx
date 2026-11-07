import { NUM_PAISES } from "@/lib/paises";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ofertas de trabajo — BuscayCurra",
  description: `Busca ofertas en ${NUM_PAISES} países, negocios de tu zona, ETTs, salarios y cursos, y envía tu CV con una carta para cada empresa.`,
};

export default function ExplorarLayout({ children }: { children: React.ReactNode }) {
  return children;
}
