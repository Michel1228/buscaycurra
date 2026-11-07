/**
 * app/app/layout.tsx — Lo común a todas las pantallas de la app (/app/*).
 *
 * De momento solo el aviso de "confirma tu correo" y su ventana (7 nov 2026):
 * se entra sin confirmar, y para hacer algo el servidor pide el correo
 * verificado. La navegación va aparte, en el layout raíz (AppNavWrapper).
 */
import ConfirmaCorreo from "@/components/ConfirmaCorreo";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ConfirmaCorreo />
    </>
  );
}
