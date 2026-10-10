import type { Metadata } from "next";

// El panel de métricas no pinta nada en Google: los datos van detrás de
// /api/admin (401 sin sesión de administrador), pero la página en sí salía
// como "index, follow" con el título de la portada.
export const metadata: Metadata = {
  title: "Panel interno | BuscayCurra",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
