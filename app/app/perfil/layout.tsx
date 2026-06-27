import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mi Perfil — BuscayCurra",
  description: "Gestiona tu cuenta de BuscayCurra. Actualiza tus datos, plan de suscripción y preferencias.",
  openGraph: {
    title: "Mi Perfil — BuscayCurra",
    description: "Gestiona tu cuenta y suscripción.",
    url: "https://buscaycurra.es/app/perfil",
    type: "website",
  },
};

export default function PerfilLayout({ children }: { children: React.ReactNode }) {
  return children;
}
