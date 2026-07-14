/**
 * lib/cv-generator/cv-template-minimalista.ts — Plantilla "Minimalista"
 *
 * Blanco puro estilo Canva "Agente comercial foto Simple Blanco": foto circular
 * pequeña, nombre con mucho espaciado de letra, reglas horizontales finas y cuerpo
 * a dos columnas con las etiquetas de sección a la izquierda en mayúsculas pequeñas.
 * Sin bloques de color: el acento solo tiñe detalles finos (líneas y etiquetas).
 *
 * Contrato estándar: CVData → HTML A4 autocontenido con wrapper .cv-page, @page A4,
 * @media print y paso por escapeHtml / sanitizeColor.
 */
import type { CVData } from "./cv-template";
import { escapeHtml, sanitizeColor } from "./cv-template";

function nivelIdioma(nivel: number): string {
  if (nivel >= 90) return "Nativo";
  if (nivel >= 70) return "Avanzado";
  if (nivel >= 50) return "Intermedio";
  if (nivel >= 30) return "Básico";
  return "Nociones";
}

export function generarCVHTML_Minimalista(data: CVData): string {
  const accent = sanitizeColor(data.accentColor);
  const inicial = escapeHtml((data.nombre || "?").trim().charAt(0).toUpperCase());

  const fotoValida = data.fotoUrl && /^(https?:\/\/|data:image\/)/.test(data.fotoUrl);
  const fotoHTML = fotoValida
    ? `<img src="${escapeHtml(data.fotoUrl)}" alt="" />`
    : `<div class="foto-ph">${inicial}</div>`;

  const contacto = [data.telefono, data.email, data.ciudad]
    .filter(Boolean).map((c) => escapeHtml(c)).join("&nbsp;&nbsp;·&nbsp;&nbsp;");

  const fila = (etiqueta: string, contenido: string) => contenido
    ? `<div class="fila"><div class="etiqueta">${etiqueta}</div><div class="contenido">${contenido}</div></div>`
    : "";

  const experienciaHTML = (data.experiencia || [])
    .map((e) => {
      const bullets = (e.descripcion || []).filter(Boolean);
      return `<div class="item">
        <div class="item-top"><span class="item-titulo">${escapeHtml(e.puesto)}</span><span class="item-fecha">${escapeHtml(e.fechas)}</span></div>
        <div class="item-sub">${escapeHtml(e.empresa)}${e.ubicacion ? ` · ${escapeHtml(e.ubicacion)}` : ""}</div>
        ${bullets.length ? `<ul>${bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join("")}</ul>` : ""}
      </div>`;
    }).join("");

  const formacionHTML = (data.formacion || [])
    .map((f) => `<div class="item">
        <div class="item-titulo">${escapeHtml(f.titulo)}</div>
        <div class="item-sub">${escapeHtml(f.centro)}${f.ubicacion ? ` · ${escapeHtml(f.ubicacion)}` : ""}</div>
      </div>`).join("");

  const aptitudesHTML = (data.aptitudes || []).map((a) => escapeHtml(a)).join("&nbsp;&nbsp;·&nbsp;&nbsp;");
  const idiomasHTML = (data.idiomas || []).map((i) => `${escapeHtml(i.nombre)} — ${nivelIdioma(i.nivel)}`).join("&nbsp;&nbsp;·&nbsp;&nbsp;");

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
  @page { size: A4 portrait; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #fff; font-family: 'Montserrat', Arial, sans-serif; color: #33383d; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .cv-page { max-width: 210mm; min-height: 297mm; margin: 0 auto; background: #fff; padding: 16mm 16mm; }

  .cabecera { display: flex; align-items: center; gap: 22px; padding-bottom: 16px; border-bottom: 1px solid #d9dde1; }
  .foto-wrap { width: 86px; height: 86px; border-radius: 50%; overflow: hidden; flex-shrink: 0; border: 1px solid #e2e5e8; }
  .foto-wrap img { width: 100%; height: 100%; object-fit: cover; }
  .foto-ph { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #f1f3f4; color: #9aa1a8; font-size: 34px; font-weight: 300; }
  h1 { font-size: 21pt; font-weight: 600; letter-spacing: 4px; text-transform: uppercase; color: #24282c; line-height: 1.15; }
  .rol { font-size: 9.5pt; letter-spacing: 3.5px; text-transform: uppercase; color: ${accent}; margin-top: 5px; }
  .contacto { font-size: 8.5pt; color: #6b7280; margin-top: 8px; }

  .fila { display: flex; gap: 20px; padding: 14px 0; border-bottom: 1px solid #eceef0; }
  .fila:last-child { border-bottom: none; }
  .etiqueta { width: 26%; font-size: 8.5pt; font-weight: 700; letter-spacing: 2.5px; text-transform: uppercase; color: #24282c; padding-top: 2px; }
  .contenido { width: 74%; font-size: 10pt; line-height: 1.55; color: #4a4f55; }

  .item { margin-bottom: 11px; }
  .item:last-child { margin-bottom: 0; }
  .item-top { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; }
  .item-titulo { font-weight: 600; font-size: 10.5pt; color: #24282c; }
  .item-fecha { font-size: 8.5pt; color: #9aa1a8; white-space: nowrap; }
  .item-sub { font-size: 9.5pt; color: #7b828a; margin-top: 1px; }
  ul { margin: 4px 0 0; padding-left: 16px; }
  li { font-size: 9.5pt; margin-bottom: 2px; }
</style>
</head>
<body>
  <div class="cv-page">
    <header class="cabecera">
      <div class="foto-wrap">${fotoHTML}</div>
      <div>
        <h1>${escapeHtml([data.nombre, data.apellidos].filter(Boolean).join(" ")) || "Tu Nombre"}</h1>
        ${data.subtitulo ? `<div class="rol">${escapeHtml(data.subtitulo)}</div>` : ""}
        ${contacto ? `<div class="contacto">${contacto}</div>` : ""}
      </div>
    </header>
    ${fila("Sobre mí", data.perfilProfesional ? `<span>${escapeHtml(data.perfilProfesional)}</span>` : "")}
    ${fila("Experiencia", experienciaHTML)}
    ${fila("Formación", formacionHTML)}
    ${fila("Habilidades", aptitudesHTML)}
    ${fila("Idiomas", idiomasHTML)}
  </div>
</body>
</html>`;
}
