import Link from "next/link";
import Image from "next/image";
import { Search } from "lucide-react";

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
      style={{ background: "#0f1117" }}
    >
      {/* Guzzi */}
      <div className="mb-6">
        <Image src="/icon-192.png" alt="Guzzi" width={96} height={96} style={{ borderRadius: "50%" }} />
      </div>

      {/* Título */}
      <h1
        className="text-5xl font-bold mb-3"
        style={{ color: "#22c55e" }}
      >
        404
      </h1>
      <p className="text-lg mb-8" style={{ color: "#94a3b8" }}>
        Vaya, esta página no existe o ha sido movida.
      </p>

      {/* Botones */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Link
          href="/"
          className="px-6 py-3 text-sm font-semibold rounded-lg transition hover:opacity-90"
          style={{
            background: "linear-gradient(135deg, #22c55e, #16a34a)",
            color: "#fff",
          }}
        >
          ← Volver al inicio
        </Link>
        <Link
          href="/empleo"
          className="px-6 py-3 text-sm font-medium rounded-lg transition"
          style={{
            color: "#94a3b8",
            border: "1px solid #2d3142",
          }}
        >
          <Search size={14} strokeWidth={2} className="inline mr-1" /> Buscar ofertas
        </Link>
      </div>

      {/* Footer sutil */}
      <p className="mt-12 text-xs" style={{ color: "#475569" }}>
        BuscayCurra &mdash; Agente IA de empleo
      </p>
    </div>
  );
}
