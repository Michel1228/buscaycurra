import dynamic from "next/dynamic";

const GuardadosContent = dynamic(() => import("./Content"), { ssr: false });

export default function GuardadosPage() {
  return <GuardadosContent />;
}
