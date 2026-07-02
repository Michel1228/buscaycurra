import CentroAyuda from "@/components/CentroAyuda";

/**
 * /app/ayuda — Centro de ayuda dentro de la app (con navegación, requiere sesión).
 * El contenido vive en components/CentroAyuda.tsx, compartido con la página
 * pública /soporte (la Support URL que exige Apple).
 */
export default function AyudaPage() {
  return (
    <div className="min-h-screen pt-16" style={{ background: "#0f1117" }}>
      <CentroAyuda />
    </div>
  );
}
