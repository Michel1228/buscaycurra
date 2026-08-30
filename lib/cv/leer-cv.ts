/**
 * lib/cv/leer-cv.ts — Leer el CV de un usuario, venga de donde venga.
 *
 * EL CV DE UN USUARIO PUEDE ESTAR EN DOS SITIOS DISTINTOS:
 *
 *   1. `user_cvs.form_data` (JSON)  — lo que guarda Guzzi y el editor nuevo
 *   2. `"CV"` (columnas Prisma)     — lo que guardaba el editor antiguo
 *
 * Ambas viven en la base propia del VPS, NO en Supabase. Esa confusión
 * (buscar el CV en Supabase cuando está en la base propia) es la que rompió el
 * autorrelleno, y es la que muy probablemente tiene roto a skill-gap ahora
 * mismo, que lee de una tabla `cvs` de Supabase que no es ninguna de estas dos.
 *
 * Cada vez que alguien necesita el CV y escribe la consulta por su cuenta, se
 * deja una de las dos tablas y aparece un fallo nuevo. De ahí esta función:
 * un solo sitio donde esté escrito dónde vive de verdad el CV.
 *
 * Devuelve una forma normalizada, para quien solo necesita "los datos de esta
 * persona" y le da igual de qué tabla salieron. Los endpoints con contrato
 * propio hacia el frontend (como /api/gusi/cv) siguen con el suyo.
 */

import { getPool } from "@/lib/db";

export interface ExperienciaCV {
  puesto: string;
  empresa: string;
  fechas: string;
}

export interface CVNormalizado {
  nombre: string;
  apellidos: string;
  email: string;
  telefono: string;
  ciudad: string;
  perfil: string;
  aptitudes: string;
  experiencia: ExperienciaCV[];
  /** De qué tabla salió. Útil para depurar sin tener que mirar la base. */
  origen: "user_cvs" | "CV";
}

/** "Michel Batista González" → { nombre: "Michel", apellidos: "Batista González" } */
function partirNombre(completo: string): { nombre: string; apellidos: string } {
  const partes = String(completo || "").trim().split(/\s+/);
  if (partes.length <= 1) return { nombre: partes[0] || "", apellidos: "" };
  return { nombre: partes[0], apellidos: partes.slice(1).join(" ") };
}

function comoTexto(v: unknown): string {
  if (Array.isArray(v)) return v.map(x => (typeof x === "string" ? x : String(x))).join(", ");
  return v ? String(v) : "";
}

function normalizarExperiencia(v: unknown): ExperienciaCV[] {
  if (!Array.isArray(v)) return [];
  return v.map(e => {
    const o = (e ?? {}) as Record<string, unknown>;
    return {
      // Cada tabla usa sus propios nombres; se aceptan los dos juegos.
      puesto: String(o.puesto || o.position || o.title || ""),
      empresa: String(o.empresa || o.company || ""),
      fechas: String(o.fechas || o.dates || o.period || ""),
    };
  }).filter(e => e.puesto || e.empresa);
}

export async function leerCVUsuario(userId: string): Promise<CVNormalizado | null> {
  const pool = getPool();

  // ── 1. user_cvs — el más habitual hoy ──────────────────────────────────
  try {
    const r = await pool.query<{ form_data: Record<string, unknown> }>(
      `SELECT form_data FROM user_cvs WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 1`,
      [userId]
    );
    const f = r.rows[0]?.form_data;
    if (f && (f.nombre || f.email)) {
      return {
        nombre: String(f.nombre || ""),
        apellidos: String(f.apellidos || ""),
        email: String(f.email || ""),
        telefono: String(f.telefono || ""),
        ciudad: String(f.ciudad || ""),
        perfil: String(f.perfilProfesional || ""),
        aptitudes: comoTexto(f.aptitudes ?? f.habilidades ?? f.skills),
        experiencia: normalizarExperiencia(f.experiencia),
        origen: "user_cvs",
      };
    }
  } catch (e) {
    console.error("[leer-cv] fallo leyendo user_cvs:", (e as Error).message);
  }

  // ── 2. "CV" — el editor antiguo, con columnas en vez de JSON ───────────
  try {
    const r = await pool.query<{
      fullName: string; email: string; phone: string; city: string;
      summary: string; experience: unknown; skills: unknown;
    }>(
      `SELECT "fullName", email, phone, city, summary, experience, skills
         FROM "CV"
        WHERE "userId" = $1 AND "isActive" = true
        ORDER BY "updatedAt" DESC
        LIMIT 1`,
      [userId]
    );
    const c = r.rows[0];
    if (c && (c.fullName || c.email)) {
      const { nombre, apellidos } = partirNombre(c.fullName);
      return {
        nombre, apellidos,
        email: String(c.email || ""),
        telefono: String(c.phone || ""),
        ciudad: String(c.city || ""),
        perfil: String(c.summary || ""),
        aptitudes: comoTexto(c.skills),
        experiencia: normalizarExperiencia(c.experience),
        origen: "CV",
      };
    }
  } catch (e) {
    console.error("[leer-cv] fallo leyendo CV:", (e as Error).message);
  }

  return null;
}
