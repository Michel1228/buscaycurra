import dynamic from "next/dynamic";

const ReferidosContent = dynamic(() => import("./Content"), { ssr: false });

export default function ReferidosPage() {
  return <ReferidosContent />;
}
