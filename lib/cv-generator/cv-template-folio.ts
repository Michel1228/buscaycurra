/**
 * lib/cv-generator/cv-template-folio.ts — Plantilla "Folio clásico"
 *
 * El CV de toda la vida: una columna, sobrio, foto pequeña en la esquina superior.
 * Tipografía serif en los títulos (aire formal/tradicional). Pensado para perfiles
 * de administración, banca, jurídico o senior, donde se valora la seriedad.
 *
 * Mismo contrato que las demás plantillas: recibe CVData y emite un documento HTML A4
 * autocontenido con wrapper .cv-page, @page A4 y paso por escapeHtml / sanitizeColor.
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

export function generarCVHTML_Folio(data: CVData): string {
  const accent = sanitizeColor(data.accentColor);
  const nombreCompleto = escapeHtml([data.nombre, data.apellidos].filter(Boolean).join(" ")) || "Tu Nombre";

  const contacto = [data.telefono, data.email, data.ciudad]
    .filter(Boolean).map((c) => escapeHtml(c)).join("&nbsp;&nbsp;·&nbsp;&nbsp;");

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
           const sub = [e.empresa, e.ubicacion].filter(Boolean).map((s) => escapeHtml(s)).join(", ");
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
           const sub = [f.centro, f.ubicacion].filter(Boolean).map((s) => escapeHtml(s)).join(", ");
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
         <p class="lista-inline">${data.aptitudes.map((a) => escapeHtml(a)).join("&nbsp;&nbsp;·&nbsp;&nbsp;")}</p>
       </section>`
    : "";

  const idiomasHTML = (data.idiomas && data.idiomas.length)
    ? `<section class="seccion">
         <h2>Idiomas</h2>
         <p class="lista-inline">${data.idiomas.map((i) => `${escapeHtml(i.nombre)} — ${nivelIdioma(i.nivel)}`).join("&nbsp;&nbsp;·&nbsp;&nbsp;")}</p>
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
    max-width: 210mm; min-height: 297mm; margin: 0 auto; padding: 18mm 18mm;
    background: #ffffff; color: #222;
    font-family: Georgia, "Times New Roman", serif; font-size: 11pt; line-height: 1.45;
  }
  .cabecera { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; padding-bottom: 12px; border-bottom: 2px solid #222; }
  .cab-datos { flex: 1; }
  h1 { margin: 0 0 4px; font-size: 25pt; font-weight: 700; letter-spacing: 0.5px; color: #1a1a1a; }
  .subtitulo { margin: 0 0 10px; font-size: 12.5pt; font-style: italic; color: ${accent}; }
  .contacto { font-size: 10pt; color: #444; font-family: Arial, Helvetica, sans-serif; }
  .foto { width: 92px; height: 108px; object-fit: cover; border: 1px solid #999; flex-shrink: 0; }
  .seccion { margin-top: 18px; }
  .seccion h2 {
    margin: 0 0 8px; font-size: 12pt; font-weight: 700; color: #1a1a1a;
    text-transform: uppercase; letter-spacing: 1.5px; border-bottom: 1px solid ${accent}; padding-bottom: 4px;
  }
  .perfil { margin: 0; text-align: justify; }
  .item { margin-bottom: 12px; }
  .item-top { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; }
  .item-titulo { font-weight: 700; font-size: 11.5pt; }
  .item-fecha { font-size: 9.5pt; color: #555; white-space: nowrap; font-family: Arial, Helvetica, sans-serif; }
  .item-sub { font-size: 10.5pt; color: #555; font-style: italic; margin-top: 1px; }
  ul { margin: 5px 0 0; padding-left: 20px; }
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
