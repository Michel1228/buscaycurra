import type { Metadata } from "next";
import DescargaClient from "./DescargaClient";

export const metadata: Metadata = {
  title: "Instala BuscayCurra — Busca trabajo con IA",
  description:
    "Guzzi envía tu CV automáticamente a las empresas que te interesan. Instala BuscayCurra gratis y empieza por menos de lo que cuesta un café.",
  openGraph: {
    title: "BuscayCurra — Tu próximo trabajo, enviado por Guzzi",
    description: "El asistente IA que envía tu CV automáticamente. Gratis para siempre, planes desde 2,99 €/mes.",
    url: "https://buscaycurra.es/descargar",
    siteName: "BuscayCurra",
  },
};

export default function DescargaPage() {
  return <DescargaClient />;
}
