import dynamic from "next/dynamic";

// Sin SSR — evita errores de hidratación por HTML inválido que el navegador reescribe
const BienvenidaClient = dynamic(() => import("./BienvenidaClient"), { ssr: false });

export default function BienvenidaPage() {
  return <BienvenidaClient />;
}
