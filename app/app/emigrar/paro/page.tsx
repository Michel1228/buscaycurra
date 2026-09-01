/**
 * /app/emigrar/paro — Lo mismo, dentro de la aplicación.
 * La versión pública está en /llevarte-el-paro.
 */
import type { Metadata } from "next";
import ParoEuropeo from "@/components/emigrar/ParoEuropeo";

export const metadata: Metadata = {
  title: "Llevarte el paro | BuscayCurra",
};

export default function ParoApp() {
  return (
    <div className="min-h-screen pt-16" style={{ background: "#0f1117", color: "#f1f5f9" }}>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <ParoEuropeo base="/app/emigrar" />
      </div>
    </div>
  );
}
