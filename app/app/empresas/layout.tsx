import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Enviar CV a empresas sin oferta — BuscayCurra",
  description:
    "Envía tu CV directamente a cualquier empresa sin esperar a que publiquen una oferta. Escribe el nombre de la empresa y nosotros encontramos su email de RRHH, web y datos de contacto. Tú tomas la iniciativa.",
  openGraph: {
    title: "Envía tu CV a cualquier empresa — BuscayCurra",
    description:
      "Sin esperar ofertas. Escribe el nombre y enviamos tu CV directamente a RRHH.",
  },
};

export default function EmpresasLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
