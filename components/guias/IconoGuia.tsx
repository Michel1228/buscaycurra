/**
 * components/guias/IconoGuia.tsx — El dibujo de cada guía.
 *
 * Iconos de lucide, que es lo que usa el resto de páginas públicas (la
 * navegación de la app dibuja los suyos a mano, pero aquí no hace falta).
 */
import { Send, Building2, Search, MessageCircle, FileText, Plane } from "lucide-react";
import type { Guia } from "@/lib/guias/contenido";

const ICONOS = {
  enviar: Send,
  ett: Building2,
  buscar: Search,
  guzzi: MessageCircle,
  cv: FileText,
  emigrar: Plane,
} as const;

export function IconoGuia({ nombre, size = 18 }: { nombre: Guia["icono"]; size?: number }) {
  const Icono = ICONOS[nombre];
  return (
    <span
      className="shrink-0 flex items-center justify-center rounded-lg"
      style={{
        width: size + 16,
        height: size + 16,
        background: "rgba(34,197,94,0.10)",
        color: "#22c55e",
      }}
    >
      <Icono size={size} strokeWidth={1.8} />
    </span>
  );
}
