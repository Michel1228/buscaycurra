/**
 * lib/cv-generator/cv-template.ts — Plantilla HTML profesional de CV
 *
 * Diseño de referencia: CV de Erick De Leon González
 * - Dos columnas: sidebar 30% (gris) + contenido 70% (blanco)
 * - Foto circular con borde azul arriba
 * - Secciones: Contacto, Aptitudes (pills), Idiomas (barras)
 * - Perfil profesional, Experiencia (badges fechas), Formación
 * - Footer oscuro con datos de contacto
 * - Colores: azul #3B5FE0, gris #F0F0F0, oscuro #2B2B3D
 */

export interface CVData {
  nombre: string;
  apellidos?: string;
  subtitulo?: string;
  telefono?: string;
  email?: string;
  ciudad?: string;
  fotoUrl?: string;
  perfilProfesional?: string;
  aptitudes?: string[];
  idiomas?: { nombre: string; nivel: number }[];
  experiencia?: {
    fechas: string;
    puesto: string;
    empresa: string;
    ubicacion?: string;
    descripcion?: string[];
  }[];
  formacion?: {
    titulo: string;
    centro: string;
    ubicacion?: string;
  }[];
  accentColor?: string;
}

// Escapa caracteres HTML especiales para prevenir XSS
function escapeHtml(str: string | undefined | null): string {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Valida que accentColor sea un color CSS seguro (hex o rgb)
function sanitizeColor(color: string | undefined): string {
  if (!color) return "#3B5FE0";
  const hex = /^#[0-9A-Fa-f]{3,8}$/.test(color.trim());
  const rgb = /^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/.test(color.trim());
  return (hex || rgb) ? color.trim() : "#3B5FE0";
}

export function generarCVHTML(data: CVData): string {
  const accent = sanitizeColor(data.accentColor);

  const aptitudesHTML = (data.aptitudes || [])
    .map(a => `<span class="aptitude-pill">${escapeHtml(a)}</span>`)
    .join("\n              ");

  const idiomasHTML = (data.idiomas || [])
    .map(i => `
            <div class="idioma-item">
              <div class="idioma-name">${escapeHtml(i.nombre)}</div>
              <div class="progress-bar-track">
                <div class="progress-bar-fill" style="width: ${Math.min(100, Math.max(0, i.nivel))}%"></div>
              </div>
            </div>`)
    .join("");

  const experienciaHTML = (data.experiencia || [])
    .map(exp => {
      const bullets = (exp.descripcion || [])
        .map(d => `<li>${escapeHtml(d)}</li>`)
        .join("\n                  ");
      return `
              <div class="experience-entry">
                <span class="date-badge">${escapeHtml(exp.fechas)}</span>
                <div class="job-title">${escapeHtml(exp.puesto)}</div>
                <div class="job-company">${escapeHtml(exp.empresa)}${exp.ubicacion ? ` · ${escapeHtml(exp.ubicacion)}` : ""}</div>
                ${bullets ? `<ul class="job-bullets">${bullets}</ul>` : ""}
              </div>`;
    })
    .join("");

  const formacionHTML = (data.formacion || [])
    .map(f => `
              <div class="education-entry">
                <div class="edu-title">${escapeHtml(f.titulo)}</div>
                <div class="edu-center">${escapeHtml(f.centro)}${f.ubicacion ? ` · ${escapeHtml(f.ubicacion)}` : ""}</div>
              </div>`)
    .join("");

  // Validar foto URL — solo https
  const fotoUrlSafe = data.fotoUrl && /^https?:\/\//.test(data.fotoUrl) ? data.fotoUrl : null;
  const fotoSection = fotoUrlSafe
    ? `<img src="${escapeHtml(fotoUrlSafe)}" alt="Foto" />`
    : `<div class="photo-placeholder">📷<br>Foto</div>`;

  const contactItems = [
    data.telefono ? `<li><span class="contact-icon">■</span>${escapeHtml(data.telefono)}</li>` : "",
    data.email ? `<li><span class="contact-icon">✉</span>${escapeHtml(data.email)}</li>` : "",
    data.ciudad ? `<li><span class="contact-icon">■</span>${escapeHtml(data.ciudad)}</li>` : "",
  ].filter(Boolean).join("\n              ");

  const footerParts = [data.nombre, data.apellidos, data.telefono, data.email, data.ciudad]
    .filter(Boolean).map(p => escapeHtml(p)).join(" · ");

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>CV - ${escapeHtml(data.nombre)}${data.apellidos ? " " + escapeHtml(data.apellidos) : ""}</title>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,300;0,400;0,600;0,700;1,400;1,600;1,700&display=swap" rel="stylesheet">
<style>
  @page { size: A4 portrait; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Montserrat', sans-serif; background: #c0c0c0; display: flex; justify-content: center; padding: 20px; }
  .cv-page { width: 794px; min-height: 1123px; background: #fff; display: flex; flex-direction: column; box-shadow: 0 4px 20px rgba(0,0,0,0.15); overflow: hidden; }
  .cv-body { display: flex; flex: 1; }

  /* LEFT COLUMN */
  .left-column { width: 30%; background: #1B2845; padding: 35px 22px 30px; display: flex; flex-direction: column; align-items: center; }
  .photo-wrapper { width: 155px; height: 155px; border-radius: 50%; border: 3px solid ${accent}; overflow: hidden; margin-bottom: 18px; }
  .photo-wrapper img { width: 100%; height: 100%; object-fit: cover; }
  .photo-placeholder { width: 100%; height: 100%; background: rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.5); font-size: 10px; text-align: center; border-radius: 50%; }
  .name-block { text-align: center; margin-bottom: 8px; }
  .name-block .first-name { font-size: 21px; font-style: italic; font-weight: 600; color: #ffffff; line-height: 1.2; }
  .name-block .last-name { font-size: 21px; font-style: italic; font-weight: 700; color: ${accent}; line-height: 1.2; }
  .name-block .subtitle { font-size: 10.5px; color: rgba(255,255,255,0.65); font-weight: 400; margin-top: 6px; }
  .sidebar-section-title { font-size: 12px; font-weight: 700; color: ${accent}; text-transform: uppercase; letter-spacing: 1.5px; align-self: flex-start; margin-top: 22px; margin-bottom: 12px; }
  .contact-list { align-self: flex-start; list-style: none; }
  .contact-list li { font-size: 10px; color: #cdd8e8; margin-bottom: 8px; display: flex; align-items: flex-start; gap: 8px; line-height: 1.4; }
  .contact-icon { color: ${accent}; font-size: 10px; flex-shrink: 0; margin-top: 1px; }
  .aptitudes-list { align-self: flex-start; display: flex; flex-direction: column; gap: 7px; }
  .aptitude-pill { background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.2); border-radius: 18px; padding: 5px 16px; font-size: 10px; color: #e0eaf5; display: inline-block; align-self: flex-start; }
  .idiomas-list { align-self: flex-start; width: 100%; }
  .idioma-item { margin-bottom: 10px; }
  .idioma-name { font-size: 10.5px; color: #cdd8e8; margin-bottom: 5px; }
  .progress-bar-track { width: 100%; height: 5px; background: rgba(255,255,255,0.2); border-radius: 3px; overflow: hidden; }
  .progress-bar-fill { height: 100%; background: ${accent}; border-radius: 3px; }

  /* RIGHT COLUMN */
  .right-column { width: 70%; padding: 38px 32px 30px 35px; }
  .section-title { font-size: 14px; font-weight: 700; color: ${accent}; text-transform: uppercase; letter-spacing: 1.5px; display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
  .section-title::after { content: ''; flex: 1; height: 1.5px; background: ${accent}; }
  .profile-text { font-size: 10.5px; color: #444; line-height: 1.65; margin-bottom: 22px; }
  .experience-section { margin-bottom: 22px; }
  .experience-entry { margin-bottom: 20px; }
  .date-badge { display: inline-block; background: ${accent}; color: #fff; font-size: 9px; font-weight: 600; padding: 4px 14px; border-radius: 14px; margin-bottom: 6px; }
  .job-title { font-size: 13px; font-weight: 700; color: #222; margin-bottom: 3px; }
  .job-company { font-size: 10.5px; color: #777; font-style: italic; margin-bottom: 8px; }
  .job-bullets { list-style: none; padding-left: 15px; }
  .job-bullets li { font-size: 10px; color: #444; line-height: 1.65; margin-bottom: 3px; position: relative; padding-left: 12px; }
  .job-bullets li::before { content: '●'; color: ${accent}; position: absolute; left: 0; font-size: 7px; top: 2px; }
  .education-section { margin-bottom: 20px; }
  .education-entry { margin-bottom: 15px; }
  .edu-title { font-size: 12.5px; font-weight: 700; color: #222; }
  .edu-center { font-size: 10.5px; color: #777; font-weight: 400; }
  .cv-footer { background: #131e35; padding: 12px 30px; text-align: center; }
  .cv-footer p { font-size: 9px; color: #fff; letter-spacing: 0.5px; }

  @media print {
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    html, body { background: none !important; padding: 0 !important; margin: 0 !important; }
    .cv-page { box-shadow: none !important; width: 210mm !important; height: 297mm !important; min-height: unset !important; max-height: 297mm !important; overflow: hidden !important; }
  }
</style>
</head>
<body>
<div class="cv-page">
  <div class="cv-body">
    <!-- LEFT SIDEBAR -->
    <div class="left-column">
      <div class="photo-wrapper">
        ${fotoSection}
      </div>
      <div class="name-block">
        <div class="first-name">${escapeHtml(data.nombre)}</div>
        ${data.apellidos ? `<div class="last-name">${escapeHtml(data.apellidos)}</div>` : ""}
        ${data.subtitulo ? `<div class="subtitle">${escapeHtml(data.subtitulo)}</div>` : ""}
      </div>

      ${contactItems ? `
      <div class="sidebar-section-title">Contacto</div>
      <ul class="contact-list">
        ${contactItems}
      </ul>` : ""}

      ${(data.aptitudes || []).length > 0 ? `
      <div class="sidebar-section-title">Aptitudes</div>
      <div class="aptitudes-list">
        ${aptitudesHTML}
      </div>` : ""}

      ${(data.idiomas || []).length > 0 ? `
      <div class="sidebar-section-title">Idiomas</div>
      <div class="idiomas-list">
        ${idiomasHTML}
      </div>` : ""}
    </div>

    <!-- RIGHT CONTENT -->
    <div class="right-column">
      ${data.perfilProfesional ? `
      <h2 class="section-title">Perfil Profesional</h2>
      <p class="profile-text">${escapeHtml(data.perfilProfesional)}</p>` : ""}

      ${(data.experiencia || []).length > 0 ? `
      <h2 class="section-title">Experiencia Laboral</h2>
      <div class="experience-section">
        ${experienciaHTML}
      </div>` : ""}

      ${(data.formacion || []).length > 0 ? `
      <h2 class="section-title">Formación</h2>
      <div class="education-section">
        ${formacionHTML}
      </div>` : ""}
    </div>
  </div>

  <div class="cv-footer">
    <p>${footerParts}</p>
  </div>
</div>
</body>
</html>`;
}
