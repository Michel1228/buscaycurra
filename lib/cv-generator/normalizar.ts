import type { CVData } from "./cv-template";
import { TEMPLATE_IDS } from "./plantillas";

const PLANTILLAS_VALIDAS: string[] = TEMPLATE_IDS;

/**
 * Hasta qué año dura una experiencia, para ordenarlas de la más reciente a la
 * más antigua. "Actualidad", "actualmente", "presente", "hoy" o "ahora" es el
 * trabajo de ahora y va el primero: antes solo se miraba el último número de
 * cuatro cifras, y "2023 - Actualidad" salía DEBAJO de "2019 - 2024" (dos
 * empleos a la vez, normal en hostelería) y "Actualmente" sin año se iba al
 * final (encontrado en la auditoría del 2 oct 2026). Sin ningún año, -1.
 */
function anioFinal(fechas: string): number {
  const f = String(fechas || "");
  if (/actual|presente|hoy|ahora|la fecha|en curso/i.test(f)) return 9999;
  const m = f.match(/(\d{4})/g);
  return m ? parseInt(m[m.length - 1]) : -1;
}

/**
 * Nivel de idioma en tanto por cien. Además del número (el editor guarda
 * "Inglés:70"), entiende el Marco Común Europeo, que es como se escribe en
 * España: "Inglés:B2" se pintaba como un 70 % cualquiera.
 */
function nivelIdioma(texto: string | undefined): number {
  const t = String(texto || "").trim().toUpperCase();
  const MCER: Record<string, number> = { A1: 20, A2: 35, B1: 50, B2: 70, C1: 85, C2: 100 };
  if (MCER[t]) return MCER[t];
  if (/NATIV|BILING/.test(t)) return 100;
  const n = parseInt(t);
  return Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : 70;
}

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
    }))
      // IGUAL QUE LA VISTA PREVIA DEL EDITOR: sin filas vacías y de la más
      // reciente a la más antigua. Antes el CV que recibía la empresa salía en
      // el orden en que se habían escrito y con la fila en blanco que trae el
      // formulario, mientras la persona veía otro orden en su pantalla.
      // Sin puesto pero con empresa o tareas, NO se tira: antes desaparecía del
      // CV sin avisar (auditoría del 2 oct 2026). Se usa la empresa como título.
      .map((e) => (!e.puesto.trim() && e.empresa.trim() ? { ...e, puesto: e.empresa, empresa: "" } : e))
      .filter((e) => e.puesto.trim() || (e.descripcion && e.descripcion.length))
      // Orden estable: las que empatan (o no llevan año) siguen como se escribieron.
      .map((e, i) => ({ e, i }))
      .sort((a, b) => (anioFinal(b.e.fechas) - anioFinal(a.e.fechas)) || (a.i - b.i))
      .map(({ e }) => e);
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
    }))
      // Igual que con las experiencias: sin título pero con centro, se usa el centro.
      .map((f) => (!f.titulo.trim() && f.centro.trim() ? { ...f, titulo: f.centro, centro: "" } : f))
      .filter((f) => f.titulo.trim());
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
        return { nombre: parts[0].trim(), nivel: nivelIdioma(parts[1]) };
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
      const nivel = nivelIdioma(parts[1]);
      return { nombre: parts[0].trim(), nivel };
    });
  }
  // Si la persona no ha puesto idiomas, no se le inventa ninguno. Aquí se
  // añadía "Español 100 %": la vista previa no lo enseñaba, pero el CV que
  // llegaba a la empresa sí. Lo que se envía tiene que ser lo que se ve.

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
