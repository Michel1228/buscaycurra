import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Iniciar sesión — BuscayCurra",
  description:
    "Accede a tu cuenta de BuscayCurra y deja que Guzzi, el agente IA, busque trabajo por ti en 21 países. Inicia sesión para gestionar tus candidaturas automáticas.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
