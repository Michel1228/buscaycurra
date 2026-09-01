/**
 * /app/au-pair/derechos — Los mismos derechos, dentro de la aplicación.
 *
 * La versión pública vive en /derechos-au-pair (ver el comentario de allí sobre
 * por qué no se llama /au-pair).
 */
import type { Metadata } from "next";
import DerechosAuPair from "@/components/aupair/Derechos";

export const metadata: Metadata = {
  title: "Tus derechos como au pair | BuscayCurra",
};

export default function DerechosAuPairApp() {
  return (
    <div className="min-h-screen pt-16" style={{ background: "#0f1117", color: "#f1f5f9" }}>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <DerechosAuPair base="/app/au-pair" />
      </div>
    </div>
  );
}
