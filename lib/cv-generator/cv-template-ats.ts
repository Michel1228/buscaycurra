/**
 * lib/cv-generator/cv-template-ats.ts — Plantilla "Profesional ATS"
 *
 * CV de UNA sola columna, texto plano y fuente de sistema, diseñado para pasar los
 * filtros automáticos (ATS) que usa el ~90% de empresas medianas/grandes en España.
 * Las plantillas de 1 columna parsean al 93-96% frente al 60-75% de las de sidebar.
 *
 * Mismo contrato que la plantilla clásica: recibe CVData, emite un documento HTML A4
 * autocontenido con wrapper .cv-page (necesario para el PDF combinado CV+carta),
 * @page A4 y @media print, y pasa todos los campos por escapeHtml / sanitizeColor.
 */
import type { CVData } from "./cv-template";
import { escapeHtml, sanitizeColor } from "./cv-template";

// Nivel 0-100 → etiqueta legible (ATS entiende texto, no barras)
function nivelIdioma(nivel: number): string {
  if (nivel >= 90) return "Nativo";
  if (nivel >= 70) return "Avanzado";
  if (nivel >= 50) return "Intermedio";
  if (nivel >= 30) return "Básico";
  return "Nociones";
}

export function generarCVHTML_ATS(data: CVData): string {
  const accent = sanitizeColor(data.accentColor);
  const nombreCompleto = escapeHtml([data.nombre, data.apellidos].filter(Boolean).join(" ")) || "Tu Nombre";

  const contacto = [data.telefono, data.email, data.ciudad]
    .filter(Boolean)
    .map((c) => escapeHtml(c))
    .join("&nbsp;&nbsp;•&nbsp;&nbsp;");

  const fotoValida = data.fotoUrl && /^(https?:\/\/|data:image\/)/.test(data.fotoUrl);
  const fotoHTML = fotoValida
    ? `<img class="foto" src="${escapeHtml(data.fotoUrl)}" alt="" />`
    : "";

  const perfilHTML = data.perfilProfesional
    ? `<section class="seccion">
         <h2>Perfil profesional</h2>
         <p class="perfil">${escapeHtml(data.perfilProfesional)}</p>
       </section>`
    : "";

  const experienciaHTML = (data.experiencia && data.experiencia.length)
    ? `<section class="seccion">
         <h2>Experiencia laboral</h2>
         ${data.experiencia.map((e) => {
           const sub = [e.empresa, e.ubicacion].filter(Boolean).map((s) => escapeHtml(s)).join(" · ");
           const bullets = (e.descripcion || []).filter(Boolean);
           return `<div class="item">
             <div class="item-top">
               <span class="item-titulo">${escapeHtml(e.puesto)}</span>
               <span class="item-fecha">${escapeHtml(e.fechas)}</span>
             </div>
             ${sub ? `<div class="item-sub">${sub}</div>` : ""}
             ${bullets.length ? `<ul>${bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join("")}</ul>` : ""}
           </div>`;
         }).join("")}
       </section>`
    : "";

  const formacionHTML = (data.formacion && data.formacion.length)
    ? `<section class="seccion">
         <h2>Formación</h2>
         ${data.formacion.map((f) => {
           const sub = [f.centro, f.ubicacion].filter(Boolean).map((s) => escapeHtml(s)).join(" · ");
           return `<div class="item">
             <div class="item-titulo">${escapeHtml(f.titulo)}</div>
             ${sub ? `<div class="item-sub">${sub}</div>` : ""}
           </div>`;
         }).join("")}
       </section>`
    : "";

  const aptitudesHTML = (data.aptitudes && data.aptitudes.length)
    ? `<section class="seccion">
         <h2>Aptitudes</h2>
         <p class="lista-inline">${data.aptitudes.map((a) => escapeHtml(a)).join("&nbsp;&nbsp;•&nbsp;&nbsp;")}</p>
       </section>`
    : "";

  const idiomasHTML = (data.idiomas && data.idiomas.length)
    ? `<section class="seccion">
         <h2>Idiomas</h2>
         <p class="lista-inline">${data.idiomas.map((i) => `${escapeHtml(i.nombre)} (${nivelIdioma(i.nivel)})`).join("&nbsp;&nbsp;•&nbsp;&nbsp;")}</p>
       </section>`
    : "";

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<style>
  @page { size: A4 portrait; margin: 0; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #ffffff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .cv-page {
    max-width: 210mm; min-height: 297mm; margin: 0 auto; padding: 16mm 16mm;
    background: #ffffff; color: #1a1a1a;
    font-family: Arial, Helvetica, "Liberation Sans", sans-serif; font-size: 11pt; line-height: 1.4;
  }
  .cabecera { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; border-bottom: 2px solid ${accent}; padding-bottom: 12px; }
  .cab-datos { flex: 1; }
  h1 { margin: 0 0 2px; font-size: 24pt; font-weight: 700; color: ${accent}; letter-spacing: 0.3px; }
  .subtitulo { margin: 0 0 8px; font-size: 12.5pt; color: #333; font-weight: 600; }
  .contacto { font-size: 10pt; color: #444; }
  .foto { width: 78px; height: 78px; border-radius: 6px; object-fit: cover; border: 1px solid #ddd; flex-shrink: 0; }
  .seccion { margin-top: 16px; }
  .seccion h2 {
    margin: 0 0 8px; font-size: 11.5pt; font-weight: 700; color: ${accent};
    text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #d8d8d8; padding-bottom: 3px;
  }
  .perfil { margin: 0; text-align: justify; }
  .item { margin-bottom: 11px; }
  .item-top { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; }
  .item-titulo { font-weight: 700; font-size: 11pt; }
  .item-fecha { font-size: 9.5pt; color: #666; white-space: nowrap; }
  .item-sub { font-size: 10pt; color: #555; font-style: italic; margin-top: 1px; }
  ul { margin: 4px 0 0; padding-left: 18px; }
  li { margin-bottom: 2px; }
  .lista-inline { margin: 0; }
</style>
</head>
<body>
  <div class="cv-page">
    <header class="cabecera">
      <div class="cab-datos">
        <h1>${nombreCompleto}</h1>
        ${data.subtitulo ? `<p class="subtitulo">${escapeHtml(data.subtitulo)}</p>` : ""}
        ${contacto ? `<div class="contacto">${contacto}</div>` : ""}
      </div>
      ${fotoHTML}
    </header>
    ${perfilHTML}
    ${experienciaHTML}
    ${formacionHTML}
    ${aptitudesHTML}
    ${idiomasHTML}
  </div>
</body>
</html>`;
}
