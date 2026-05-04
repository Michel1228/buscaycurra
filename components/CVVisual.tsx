"use client";

export interface CVData {
  nombre?: string;
  apellidos?: string;
  full_name?: string;
  telefono?: string;
  phone?: string;
  email?: string;
  ciudad?: string;
  location?: string;
  perfilProfesional?: string;
  perfil?: string;
  summary?: string;
  fotoUrl?: string;
  aptitudes?: string | string[];
  habilidades?: string | string[];
  skills?: string | string[];
  idiomas?: string | string[] | { nombre: string; nivel?: number }[];
  languages?: string | string[];
  experiencia?: string | { fechas: string; puesto: string; empresa: string; ubicacion?: string; descripcion?: string[] }[];
  experience?: string;
  formacion?: string | { titulo: string; centro: string; ubicacion?: string }[];
  estudios?: string;
  education?: string;
  [key: string]: unknown;
}

interface CVVisualProps {
  data: CVData | null;
}

function parseList(val: string | string[] | undefined): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(v => typeof v === "object" ? (v as { nombre: string }).nombre : String(v)).filter(Boolean);
  const s = String(val);
  return (s.includes(",") ? s.split(",") : s.split("\n"))
    .map(x => x.trim().replace(/^[-•*]\s*/, ""))
    .filter(Boolean);
}

function parseExperiencia(val: CVData["experiencia"]): { fechas: string; puesto: string; empresa: string; ubicacion?: string; descripcion?: string[] }[] {
  if (!val) return [];
  if (Array.isArray(val)) return val as { fechas: string; puesto: string; empresa: string; ubicacion?: string; descripcion?: string[] }[];
  // texto libre: cada bloque separado por líneas en blanco o "---"
  const lineas = String(val).split("\n").map(l => l.trim()).filter(Boolean);
  const resultado: { fechas: string; puesto: string; empresa: string; ubicacion?: string; descripcion?: string[] }[] = [];
  let actual: { fechas: string; puesto: string; empresa: string; ubicacion?: string; descripcion?: string[] } | null = null;
  for (const linea of lineas) {
    const esFecha = /^\d{4}/.test(linea) || /^\d{4}[-–]\d{4}/.test(linea);
    const esPuesto = linea.includes("—") || linea.includes("-") || /en\s+\w/i.test(linea);
    if (esFecha && !actual) {
      actual = { fechas: linea, puesto: "", empresa: "", descripcion: [] };
    } else if (actual && !actual.puesto) {
      // Parsear "Puesto en Empresa (Ubicación)" o "Puesto — Empresa · Ubicación"
      const match = linea.match(/^(.+?)(?:en\s+|—\s*|–\s*)(.+?)(?:\s*[·(](.+)[)·])?$/i);
      if (match) {
        actual.puesto = match[1].trim();
        actual.empresa = match[2].trim();
        actual.ubicacion = match[3]?.trim();
      } else {
        actual.puesto = linea;
      }
    } else if (actual && actual.puesto) {
      if (linea.startsWith("•") || linea.startsWith("-") || linea.startsWith("*")) {
        actual.descripcion!.push(linea.replace(/^[•\-*]\s*/, ""));
      } else if (/^\d{4}/.test(linea)) {
        resultado.push(actual);
        actual = { fechas: linea, puesto: "", empresa: "", descripcion: [] };
      } else if (!actual.empresa) {
        actual.empresa = linea;
      } else {
        actual.descripcion!.push(linea);
      }
    }
  }
  if (actual && actual.puesto) resultado.push(actual);
  // Fallback: si no se pudo parsear, crear entradas simples
  if (resultado.length === 0 && lineas.length > 0) {
    lineas.slice(0, 4).forEach(l => resultado.push({ fechas: "", puesto: l, empresa: "" }));
  }
  return resultado;
}

function parseFormacion(val: CVData["formacion"]): { titulo: string; centro: string; ubicacion?: string }[] {
  if (!val) return [];
  if (Array.isArray(val)) return val as { titulo: string; centro: string; ubicacion?: string }[];
  const lineas = String(val).split("\n").map(l => l.trim()).filter(Boolean);
  return lineas.slice(0, 6).map(l => {
    const partes = l.split(/[·—–-]/);
    return { titulo: partes[0]?.trim() || l, centro: partes[1]?.trim() || "", ubicacion: partes[2]?.trim() };
  });
}

// ─── Estilos internos como constantes para no repetir ─────────────────────────
const ACCENT = "#1e3a6e";
const HEADING_STYLE: React.CSSProperties = {
  fontSize: "10px", fontWeight: 700, color: ACCENT,
  textTransform: "uppercase", letterSpacing: "2px",
  margin: "0 0 8px", fontFamily: "Arial, sans-serif",
};
const SECTION_DIVIDER: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px",
};
const DIVIDER_LINE: React.CSSProperties = {
  flex: 1, height: "1.5px", background: ACCENT,
};

export default function CVVisual({ data }: CVVisualProps) {
  if (!data) return null;

  // Parsear nombre (puede venir como "Michel Batista González" o separado)
  const nombreCompleto = String(data.full_name || data.nombre || "Nombre Apellidos");
  const partes = nombreCompleto.trim().split(" ");
  const primerNombre = partes[0] || "";
  const apellidos = partes.slice(1).join(" ") || data.apellidos || "";

  const telefono = String(data.telefono || data.phone || "");
  const email = String(data.email || "");
  const ciudad = String(data.ciudad || data.location || "");
  const perfil = String(data.perfilProfesional || data.perfil || data.summary || "");
  const fotoUrl = data.fotoUrl || null;

  const aptitudes = parseList(
    (data.aptitudes || data.habilidades || data.skills) as string | string[]
  ).slice(0, 6);

  const idiomasRaw = data.idiomas || data.languages;
  const idiomas = parseList(idiomasRaw as string | string[]);

  const experiencias = parseExperiencia(data.experiencia || data.experience);
  const formaciones = parseFormacion(data.formacion || data.estudios || data.education);

  return (
    <div
      style={{
        width: "100%", background: "#ffffff", color: "#1a1a1a",
        fontFamily: "Arial, sans-serif", fontSize: "11px",
        border: "1px solid #d0d7de", borderRadius: "6px",
        overflow: "hidden", display: "flex", flexDirection: "column",
      }}
    >
      {/* ── CUERPO (2 columnas) ── */}
      <div style={{ display: "flex", flex: 1 }}>

        {/* ── COLUMNA IZQUIERDA ── */}
        <div style={{
          width: "30%", background: "#ffffff", padding: "20px 16px",
          borderRight: "1px solid #e8ecf0", display: "flex",
          flexDirection: "column", alignItems: "center",
        }}>
          {/* Foto circular */}
          <div style={{
            width: "90px", height: "90px", borderRadius: "50%",
            border: `3px solid ${ACCENT}`, overflow: "hidden",
            marginBottom: "10px", flexShrink: 0,
            background: "#f0f4f8", display: "flex",
            alignItems: "center", justifyContent: "center",
          }}>
            {fotoUrl
              ? <img src={fotoUrl} alt="Foto" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <span style={{ fontSize: "28px", opacity: 0.4 }}>👤</span>
            }
          </div>

          {/* Nombre */}
          <div style={{ textAlign: "center", marginBottom: "14px" }}>
            <div style={{ fontSize: "13px", fontStyle: "italic", color: "#555", lineHeight: 1.2 }}>{primerNombre}</div>
            <div style={{ fontSize: "13px", fontWeight: 700, color: ACCENT, lineHeight: 1.3 }}>{apellidos}</div>
          </div>

          {/* CONTACTO */}
          {(telefono || email || ciudad) && (
            <div style={{ alignSelf: "flex-start", width: "100%", marginBottom: "14px" }}>
              <div style={HEADING_STYLE}>Contacto</div>
              <div style={{ height: "1.5px", background: ACCENT, marginBottom: "8px" }} />
              {telefono && (
                <div style={{ display: "flex", gap: "6px", marginBottom: "5px", alignItems: "flex-start" }}>
                  <span style={{ color: ACCENT, fontSize: "9px", marginTop: "1px" }}>■</span>
                  <span style={{ fontSize: "9px", color: "#444", lineHeight: 1.4 }}>{telefono}</span>
                </div>
              )}
              {email && (
                <div style={{ display: "flex", gap: "6px", marginBottom: "5px", alignItems: "flex-start" }}>
                  <span style={{ color: ACCENT, fontSize: "9px", marginTop: "1px" }}>✉</span>
                  <span style={{ fontSize: "9px", color: "#444", lineHeight: 1.4, wordBreak: "break-all" }}>{email}</span>
                </div>
              )}
              {ciudad && (
                <div style={{ display: "flex", gap: "6px", marginBottom: "5px", alignItems: "flex-start" }}>
                  <span style={{ color: ACCENT, fontSize: "9px", marginTop: "1px" }}>■</span>
                  <span style={{ fontSize: "9px", color: "#444", lineHeight: 1.4 }}>{ciudad}</span>
                </div>
              )}
            </div>
          )}

          {/* APTITUDES */}
          {aptitudes.length > 0 && (
            <div style={{ alignSelf: "flex-start", width: "100%", marginBottom: "14px" }}>
              <div style={HEADING_STYLE}>Aptitudes</div>
              <div style={{ height: "1.5px", background: ACCENT, marginBottom: "8px" }} />
              {aptitudes.map((apt, i) => (
                <div key={i} style={{ fontSize: "9px", color: "#555", marginBottom: "5px", lineHeight: 1.4 }}>
                  {apt}
                </div>
              ))}
            </div>
          )}

          {/* IDIOMAS */}
          {idiomas.length > 0 && (
            <div style={{ alignSelf: "flex-start", width: "100%", marginBottom: "14px" }}>
              <div style={HEADING_STYLE}>Idiomas</div>
              <div style={{ height: "1.5px", background: ACCENT, marginBottom: "8px" }} />
              {idiomas.map((lang, i) => (
                <div key={i} style={{ fontSize: "9px", color: "#555", marginBottom: "4px" }}>{lang}</div>
              ))}
            </div>
          )}
        </div>

        {/* ── COLUMNA DERECHA ── */}
        <div style={{ flex: 1, padding: "20px 18px 16px" }}>

          {/* PERFIL PROFESIONAL */}
          {perfil && (
            <div style={{ marginBottom: "16px" }}>
              <div style={SECTION_DIVIDER}>
                <span style={{ ...HEADING_STYLE, margin: 0 }}>Perfil Profesional</span>
                <div style={DIVIDER_LINE} />
              </div>
              <p style={{ fontSize: "9.5px", color: "#444", lineHeight: "1.6", margin: 0 }}>{perfil}</p>
            </div>
          )}

          {/* EXPERIENCIA LABORAL */}
          {experiencias.length > 0 && (
            <div style={{ marginBottom: "16px" }}>
              <div style={SECTION_DIVIDER}>
                <span style={{ ...HEADING_STYLE, margin: 0 }}>Experiencia Laboral</span>
                <div style={DIVIDER_LINE} />
              </div>
              {experiencias.map((exp, i) => (
                <div key={i} style={{ marginBottom: "12px" }}>
                  {exp.fechas && (
                    <div style={{ fontSize: "8.5px", color: "#888", marginBottom: "2px" }}>{exp.fechas}</div>
                  )}
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#222", marginBottom: "2px" }}>{exp.puesto}</div>
                  <div style={{ fontSize: "9.5px", color: "#666", fontStyle: "italic", marginBottom: "4px" }}>
                    {exp.empresa}{exp.ubicacion ? ` · ${exp.ubicacion}` : ""}
                  </div>
                  {(Array.isArray(exp.descripcion) ? exp.descripcion : typeof exp.descripcion === "string" ? exp.descripcion.split("\n").filter(Boolean) : []).map((d, j) => (
                    <div key={j} style={{ display: "flex", gap: "6px", marginBottom: "2px" }}>
                      <span style={{ color: ACCENT, fontSize: "9px", marginTop: "1px" }}>•</span>
                      <span style={{ fontSize: "9px", color: "#444", lineHeight: 1.5 }}>{d}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* FORMACIÓN */}
          {formaciones.length > 0 && (
            <div style={{ marginBottom: "10px" }}>
              <div style={SECTION_DIVIDER}>
                <span style={{ ...HEADING_STYLE, margin: 0 }}>Formación</span>
                <div style={DIVIDER_LINE} />
              </div>
              {formaciones.map((f, i) => (
                <div key={i} style={{ marginBottom: "8px" }}>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#222" }}>{f.titulo}</div>
                  <div style={{ fontSize: "9.5px", color: "#666" }}>
                    {f.centro}{f.ubicacion ? ` · ${f.ubicacion}` : ""}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── FOOTER ── */}
      {(primerNombre || telefono || email || ciudad) && (
        <div style={{
          padding: "6px 20px", background: "#f5f7fa",
          borderTop: "1px solid #e0e4ea", textAlign: "center",
        }}>
          <p style={{ fontSize: "8px", color: "#888", letterSpacing: "0.3px", margin: 0 }}>
            {[primerNombre, apellidos, telefono, email, ciudad].filter(Boolean).join(" · ")}
          </p>
        </div>
      )}
    </div>
  );
}
