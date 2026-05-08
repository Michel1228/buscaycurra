import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { generarCVHTML, type CVData } from "@/lib/cv-generator/cv-template";

function normalizar(raw: Record<string, unknown>): CVData {
  // Aptitudes: string "a, b, c" → array
  let aptitudes: string[] = [];
  if (Array.isArray(raw.aptitudes)) {
    aptitudes = raw.aptitudes as string[];
  } else if (typeof raw.aptitudes === "string") {
    aptitudes = raw.aptitudes.split(/[,\n]/).map(s => s.trim()).filter(Boolean);
  }

  // Experiencia: string o array
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

  // Formacion: string o array
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

  // Idiomas
  let idiomas: CVData["idiomas"] = [];
  if (Array.isArray(raw.idiomas)) {
    idiomas = raw.idiomas as CVData["idiomas"];
  } else if (typeof raw.idiomas === "string" && raw.idiomas.trim()) {
    idiomas = raw.idiomas.split(/[,\n]/).filter(Boolean).map(l => ({ nombre: l.trim(), nivel: 3 }));
  } else {
    idiomas = [{ nombre: "Español", nivel: 5 }];
  }

  // Contacto: puede venir como "685123456, email@gmail.com"
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

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const userId = searchParams.get("userId");

  if (!userId) {
    return new NextResponse("Falta userId", { status: 400 });
  }

  try {
    const pool = getPool();
    const result = await pool.query(
      `SELECT form_data FROM user_cvs WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0 || !result.rows[0].form_data) {
      return new NextResponse("No hay CV guardado", { status: 404 });
    }

    const raw = typeof result.rows[0].form_data === "string"
      ? JSON.parse(result.rows[0].form_data)
      : result.rows[0].form_data;

    const cvData = normalizar(raw);

    if (!cvData.nombre) {
      return new NextResponse("CV sin nombre", { status: 404 });
    }

    const html = generarCVHTML(cvData);
    const htmlConPrint = html.replace(
      "</head>",
      `<script>window.onload=function(){setTimeout(function(){window.print();},700);}</script></head>`
    );

    return new NextResponse(htmlConPrint, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (err) {
    console.error("[cv/imprimir]", err);
    return new NextResponse("Error interno", { status: 500 });
  }
}
