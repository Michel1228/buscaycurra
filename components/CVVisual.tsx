"use client";

interface CVData {
  nombre?: string;
  full_name?: string;
  telefono?: string;
  phone?: string;
  email?: string;
  ciudad?: string;
  location?: string;
  perfil?: string;
  perfilProfesional?: string;
  summary?: string;
  experiencia?: string;
  experience?: string;
  formacion?: string;
  estudios?: string;
  education?: string;
  aptitudes?: string;
  habilidades?: string;
  skills?: string;
  idiomas?: string;
  languages?: string;
  [key: string]: unknown;
}

interface CVVisualProps {
  data: CVData | null;
}

export default function CVVisual({ data }: CVVisualProps) {
  if (!data) return null;

  const nombre = String(data.nombre || data.full_name || "Nombre Apellidos");
  const telefono = String(data.telefono || data.phone || "");
  const email = String(data.email || "");
  const ciudad = String(data.ciudad || data.location || "");
  const perfil = String(data.perfil || data.perfilProfesional || data.summary || "");
  const experienciaRaw = String(data.experiencia || data.experience || "");
  const formacion = String(data.formacion || data.estudios || data.education || "");
  const aptitudesRaw = String(data.aptitudes || data.habilidades || data.skills || "");
  const idiomasRaw = String(data.idiomas || data.languages || "Español (nativo)");

  const aptitudes = aptitudesRaw
    ? (aptitudesRaw.includes(",") ? aptitudesRaw.split(",") : aptitudesRaw.split("\n"))
        .map((a) => a.trim().replace(/^[-•]\s*/, ""))
        .filter(Boolean)
        .slice(0, 6)
    : [];

  const idiomas = idiomasRaw
    ? (idiomasRaw.includes(",") ? idiomasRaw.split(",") : idiomasRaw.split("\n"))
        .map((l) => l.trim().replace(/^[-•]\s*/, ""))
        .filter(Boolean)
    : [];

  const experiencias = experienciaRaw
    ? experienciaRaw.split("\n").filter((l) => l.trim()).slice(0, 6)
    : [];

  const formaciones = formacion
    ? formacion.split("\n").filter((l) => l.trim()).slice(0, 4)
    : [];

  return (
    <div
      className="w-full rounded-xl overflow-hidden text-sm"
      style={{ background: "#fff", color: "#1a1a1a", fontFamily: "Arial, sans-serif", border: "1px solid #e2e8f0" }}
    >
      {/* Cabecera */}
      <div style={{ background: "#1a1a2e", color: "#fff", padding: "20px 24px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: "700", margin: 0, letterSpacing: "-0.5px" }}>{nombre}</h1>
        <div style={{ marginTop: "8px", fontSize: "12px", color: "#94a3b8", display: "flex", flexWrap: "wrap", gap: "12px" }}>
          {telefono && <span>📞 {telefono}</span>}
          {email && <span>✉ {email}</span>}
          {ciudad && <span>📍 {ciudad}</span>}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 0 }}>
        {/* Columna izquierda */}
        <div style={{ background: "#f8fafc", padding: "20px 18px", borderRight: "1px solid #e2e8f0" }}>

          {aptitudes.length > 0 && (
            <div style={{ marginBottom: "20px" }}>
              <h3 style={{ fontSize: "11px", fontWeight: "700", color: "#22c55e", textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 10px" }}>
                Aptitudes
              </h3>
              {aptitudes.map((apt, i) => (
                <div key={i} style={{ fontSize: "12px", padding: "4px 8px", marginBottom: "4px", background: "#fff", borderRadius: "4px", border: "1px solid #e2e8f0", color: "#374151" }}>
                  {apt}
                </div>
              ))}
            </div>
          )}

          {idiomas.length > 0 && (
            <div style={{ marginBottom: "20px" }}>
              <h3 style={{ fontSize: "11px", fontWeight: "700", color: "#22c55e", textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 10px" }}>
                Idiomas
              </h3>
              {idiomas.map((lang, i) => (
                <div key={i} style={{ fontSize: "12px", color: "#374151", marginBottom: "4px" }}>
                  {lang}
                </div>
              ))}
            </div>
          )}

          {formaciones.length > 0 && (
            <div>
              <h3 style={{ fontSize: "11px", fontWeight: "700", color: "#22c55e", textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 10px" }}>
                Formación
              </h3>
              {formaciones.map((f, i) => (
                <div key={i} style={{ fontSize: "12px", color: "#374151", marginBottom: "6px" }}>
                  {f}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Columna derecha */}
        <div style={{ padding: "20px 20px" }}>
          {perfil && (
            <div style={{ marginBottom: "20px" }}>
              <h3 style={{ fontSize: "11px", fontWeight: "700", color: "#22c55e", textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 10px" }}>
                Perfil Profesional
              </h3>
              <p style={{ fontSize: "12px", color: "#374151", lineHeight: "1.6", margin: 0 }}>{perfil}</p>
            </div>
          )}

          {experiencias.length > 0 && (
            <div>
              <h3 style={{ fontSize: "11px", fontWeight: "700", color: "#22c55e", textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 10px" }}>
                Experiencia Laboral
              </h3>
              {experiencias.map((exp, i) => (
                <div key={i} style={{ fontSize: "12px", color: "#374151", marginBottom: "6px", paddingLeft: "8px", borderLeft: "2px solid #22c55e" }}>
                  {exp}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
