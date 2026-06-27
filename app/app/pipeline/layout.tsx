import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pipeline de Candidaturas — BuscayCurra",
  description: "Gestiona tus candidaturas con un pipeline kanban. Arrastra tarjetas entre columnas para seguir el progreso de cada aplicación.",
  openGraph: {
    title: "Pipeline de Candidaturas — BuscayCurra",
    description: "Pipeline kanban para gestionar tus candidaturas de empleo.",
    url: "https://buscaycurra.es/app/pipeline",
    type: "website",
  },
};

export default function PipelineLayout({ children }: { children: React.ReactNode }) {
  return children;
}
