import type { Metadata } from "next";

// La página es de cliente y no puede declarar su título: heredaba el de la
// portada y Google veía dos páginas con el mismo (auditoría del 22 oct 2026).
export const metadata: Metadata = {
  title: "Política de cookies — BuscayCurra",
  description: "Qué cookies usa BuscayCurra: solo las necesarias para la sesión y los pagos, sin seguimiento ni publicidad.",
};

export default function CookiesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
