import type { CVData } from "./cv-template";

export function normalizar(raw: Record<string, unknown>): CVData {
  let aptitudes: string[] = [];
  if (Array.isArray(raw.aptitudes)) {
    aptitudes = raw.aptitudes as string[];
  } else if (typeof raw.aptitudes === "string") {
    aptitudes = raw.aptitudes.split(/[,\n]/).map(s => s.trim()).filter(Boolean);
  }

  let experiencia: CVData["experiencia"] = [];
  if (Array.isArray(raw.experiencia)) {
    experiencia = raw.experiencia as CVData["experiencia"];
  } else if (typeof raw.experiencia === "string" && raw.experiencia.trim()) {
    experiencia = raw.experiencia.split("\n").filter(Boolean).map(line => {
      const m = line.match(/^([\d\s\-–]+)\s*[—–-]\s*(.+?)(?:\s+en\s+(.+?))?(?:\s*\((.+?)\))?$/);
      return m
        ? { fechas: m[1].trim(), puesto: m[2].trim(), empresa: m[3]?.trim() || "", ubicacion: m[4]?.trim() || "" }
        : { fechas: "", puesto: line.trim(), empresa: "", ubicacion: "" };
    });
  }

  let formacion: CVData["formacion"] = [];
  if (Array.isArray(raw.formacion)) {
    formacion = raw.formacion as CVData["formacion"];
  } else if (typeof raw.formacion === "string" && raw.formacion.trim()) {
    formacion = raw.formacion.split("\n").filter(Boolean).map(line => {
      const m = line.match(/^(.+?)\s*[—–-]\s*(.+?)(?:\s*\((.+?)\))?$/);
      return m
        ? { titulo: m[1].trim(), centro: m[2].trim(), ubicacion: m[3]?.trim() || "" }
        : { titulo: line.trim(), centro: "", ubicacion: "" };
    });
  }

  let idiomas: CVData["idiomas"] = [];
  if (Array.isArray(raw.idiomas)) {
    idiomas = raw.idiomas as CVData["idiomas"];
  } else if (typeof raw.idiomas === "string" && raw.idiomas.trim()) {
    idiomas = raw.idiomas.split(/[,\n]/).filter(Boolean).map(l => {
      const parts = l.trim().split(":");
      const nivel = parts[1] ? Math.round(parseInt(parts[1]) / 20) : 3;
      return { nombre: parts[0].trim(), nivel: Math.max(1, Math.min(5, nivel)) };
    });
  } else {
    idiomas = [{ nombre: "Español", nivel: 5 }];
  }

  const contacto = String(raw.contacto || "");
  const partes = contacto.split(",").map(s => s.trim());

  return {
    nombre: String(raw.nombre || raw.full_name || ""),
    apellidos: String(raw.apellidos || ""),
    subtitulo: String(raw.subtitulo || ""),
    telefono: String(raw.telefono || partes[0] || ""),
    email: String(raw.email || partes[1] || ""),
    ciudad: String(raw.ciudad || raw.location || ""),
    fotoUrl: raw.fotoUrl as string | undefined,
    perfilProfesional: String(raw.perfilProfesional || raw.perfil || raw.summary || ""),
    aptitudes,
    idiomas,
    experiencia,
    formacion,
  };
}
