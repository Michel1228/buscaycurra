import type { CVData } from "./cv-template";
import { TEMPLATE_IDS } from "./plantillas";

const PLANTILLAS_VALIDAS: string[] = TEMPLATE_IDS;

export function normalizar(raw: Record<string, unknown>): CVData {
  let aptitudes: string[] = [];
  if (Array.isArray(raw.aptitudes)) {
    aptitudes = raw.aptitudes as string[];
  } else if (typeof raw.aptitudes === "string") {
    aptitudes = raw.aptitudes.split(/[,\n]/).map(s => s.trim()).filter(Boolean);
  }

  let experiencia: CVData["experiencia"] = [];
  if (Array.isArray(raw.experiencia)) {
    // El editor autoguarda descripcion como TEXTO multilínea; las plantillas esperan
    // un array de viñetas. Sin esta conversión, generarCV lanzaba
    // "(e.descripcion || []).filter is not a function" y el worker caía en silencio
    // al CV subido antiguo (el email salía SIN la plantilla elegida).
    experiencia = (raw.experiencia as Record<string, unknown>[]).map((e) => ({
      fechas: String(e.fechas || ""),
      puesto: String(e.puesto || ""),
      empresa: String(e.empresa || ""),
      ubicacion: e.ubicacion ? String(e.ubicacion) : undefined,
      descripcion: Array.isArray(e.descripcion)
        ? (e.descripcion as unknown[]).map(String).filter(Boolean)
        : typeof e.descripcion === "string" && e.descripcion.trim()
          ? e.descripcion.split("\n").map((s) => s.trim().replace(/^[-•]\s*/, "")).filter(Boolean)
          : undefined,
    }));
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
    formacion = (raw.formacion as Record<string, unknown>[]).map((f) => ({
      titulo: String(f.titulo || ""),
      centro: String(f.centro || ""),
      ubicacion: f.ubicacion ? String(f.ubicacion) : undefined,
    })).filter((f) => f.titulo);
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
    idiomas = (raw.idiomas as unknown[]).map((i) => {
      if (typeof i === "string") {
        const parts = i.split(":");
        return { nombre: parts[0].trim(), nivel: parts[1] ? Math.min(100, Math.max(0, parseInt(parts[1]) || 70)) : 70 };
      }
      const o = i as Record<string, unknown>;
      return { nombre: String(o.nombre || ""), nivel: Math.min(100, Math.max(0, Number(o.nivel) || 70)) };
    }).filter((i) => i.nombre);
  } else if (typeof raw.idiomas === "string" && raw.idiomas.trim()) {
    // El editor guarda "Idioma:nivel" con nivel 0-100, y la plantilla usa width:{nivel}%.
    // Antes se dividía /20 (escala 1-5) → las barras salían casi vacías en el PDF enviado
    // (lo que veía el usuario en la preview no coincidía con lo que se mandaba).
    idiomas = raw.idiomas.split(/[,\n]/).filter(Boolean).map(l => {
      const parts = l.trim().split(":");
      const nivel = parts[1] ? Math.min(100, Math.max(0, parseInt(parts[1]) || 70)) : 70;
      return { nombre: parts[0].trim(), nivel };
    });
  } else {
    idiomas = [{ nombre: "Español", nivel: 100 }];
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
    templateId: typeof raw.templateId === "string" && PLANTILLAS_VALIDAS.includes(raw.templateId) ? raw.templateId : "clasica",
    accentColor: typeof raw.accentColor === "string" ? raw.accentColor : undefined,
    perfilProfesional: String(raw.perfilProfesional || raw.perfil || raw.summary || ""),
    aptitudes,
    idiomas,
    experiencia,
    formacion,
  };
}
