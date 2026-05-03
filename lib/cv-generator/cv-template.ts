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
  subtitulo?: string; // "Operario · Atención al Cliente"
  telefono?: string;
  email?: string;
  ciudad?: string;
  fotoUrl?: string;
  perfilProfesional?: string;
  aptitudes?: string[];
  idiomas?: { nombre: string; nivel: number }[]; // nivel 0-100
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
  // Color personalizable
  accentColor?: string; // default #3B5FE0
}

export function generarCVHTML(data: CVData): string {
  const accent = data.accentColor || "#3B5FE0";

  const aptitudesHTML = (data.aptitudes || [])
    .map(a => `<div class="aptitude-item">${a}</div>`)
    .join("\n              ");

  const idiomasHTML = (data.idiomas || [])
    .map(i => `<div class="idioma-item"><div class="idioma-name">${i.nombre}</div></div>`)
    .join("");

  const experienciaHTML = (data.experiencia || [])
    .map(exp => {
      const bullets = (exp.descripcion || [])
        .map(d => `<li>${d}</li>`)
        .join("\n                  ");
      return `
              <div class="experience-entry">
                <span class="date-badge">${exp.fechas}</span>
                <div class="job-title">${exp.puesto}</div>
                <div class="job-company">${exp.empresa}${exp.ubicacion ? ` · ${exp.ubicacion}` : ""}</div>
                ${bullets ? `<ul class="job-bullets">${bullets}</ul>` : ""}
              </div>`;
    })
    .join("");

  const formacionHTML = (data.formacion || [])
    .map(f => `
              <div class="education-entry">
                <div class="edu-title">${f.titulo}</div>
                <div class="edu-center">${f.centro}${f.ubicacion ? ` · ${f.ubicacion}` : ""}</div>
              </div>`)
    .join("");

  const fotoSection = data.fotoUrl
    ? `<img src="${data.fotoUrl}" alt="Foto" />`
    : `<div class="photo-placeholder">📷<br>Foto</div>`;

  const contactItems = [
    data.telefono ? `<li><span class="contact-icon">■</span>${data.telefono}</li>` : "",
    data.email ? `<li><span class="contact-icon">✉</span>${data.email}</li>` : "",
    data.ciudad ? `<li><span class="contact-icon">■</span>${data.ciudad}</li>` : "",
  ].filter(Boolean).join("\n              ");

  const footerParts = [data.nombre, data.apellidos, data.telefono, data.email, data.ciudad]
    .filter(Boolean).join(" · ");

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="light">
<title>CV - ${data.nombre}${data.apellidos ? " " + data.apellidos : ""}</title>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,300;0,400;0,600;0,700;1,400;1,600;1,700&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { font-family: 'Montserrat', sans-serif; background: #c0c0c0; display: flex; justify-content: center; padding: 20px; }
  .cv-page { width: 794px; height: 1123px; max-height: 1123px; background: #fff; display: flex; flex-direction: column; box-shadow: 0 4px 20px rgba(0,0,0,0.15); overflow: hidden; }
  .cv-body { display: flex; flex: 1; min-height: 0; overflow: hidden; }

  /* LEFT COLUMN */
  .left-column { width: 30%; background: #ffffff; padding: 24px 16px 20px; display: flex; flex-direction: column; align-items: center; overflow: hidden; border-right: 1px solid #e0e4ea; }
  .photo-wrapper { width: 110px; height: 110px; border-radius: 50%; border: 3px solid ${accent}; overflow: hidden; margin-bottom: 10px; flex-shrink: 0; background: #f0f4f8; }
  .photo-wrapper img { width: 100%; height: 100%; object-fit: cover; }
  .photo-placeholder { width: 100%; height: 100%; background: #f0f4f8; display: flex; align-items: center; justify-content: center; color: #aaa; font-size: 9px; text-align: center; border-radius: 50%; }
  .name-block { text-align: center; margin-bottom: 12px; flex-shrink: 0; }
  .name-block .first-name { font-size: 14px; font-style: italic; font-weight: 400; color: #666; line-height: 1.2; }
  .name-block .last-name { font-size: 14px; font-weight: 700; color: ${accent}; line-height: 1.3; }
  .name-block .subtitle { font-size: 9px; color: #888; font-weight: 400; margin-top: 4px; }
  .sidebar-section-title { font-size: 10px; font-weight: 700; color: ${accent}; text-transform: uppercase; letter-spacing: 1.5px; align-self: flex-start; margin-top: 0; margin-bottom: 4px; flex-shrink: 0; }
  .sidebar-divider { width: 100%; height: 1.5px; background: ${accent}; margin-bottom: 8px; }
  .contact-list { align-self: flex-start; list-style: none; margin-bottom: 12px; width: 100%; }
  .contact-list li { font-size: 9px; color: #444; margin-bottom: 5px; display: flex; align-items: flex-start; gap: 6px; line-height: 1.3; }
  .contact-icon { color: ${accent}; font-size: 9px; flex-shrink: 0; margin-top: 1px; }
  .aptitudes-list { align-self: flex-start; display: flex; flex-direction: column; gap: 5px; margin-bottom: 12px; width: 100%; }
  .aptitude-item { font-size: 9px; color: #555; line-height: 1.4; }
  .idiomas-list { align-self: flex-start; width: 100%; margin-bottom: 12px; }
  .idioma-item { margin-bottom: 5px; }
  .idioma-name { font-size: 9px; color: #555; }

  /* RIGHT COLUMN */
  .right-column { width: 70%; padding: 28px 26px 20px 28px; overflow: hidden; }
  .section-title { font-size: 12px; font-weight: 700; color: ${accent}; text-transform: uppercase; letter-spacing: 1.5px; display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
  .section-title::after { content: ''; flex: 1; height: 1.5px; background: ${accent}; }
  .profile-text { font-size: 9.5px; color: #444; line-height: 1.55; margin-bottom: 16px; }
  .experience-section { margin-bottom: 16px; }
  .experience-entry { margin-bottom: 13px; }
  .date-badge { display: inline-block; background: ${accent}; color: #fff; font-size: 8px; font-weight: 600; padding: 3px 11px; border-radius: 14px; margin-bottom: 4px; }
  .job-title { font-size: 11px; font-weight: 700; color: #222; margin-bottom: 2px; }
  .job-company { font-size: 9.5px; color: #777; font-style: italic; margin-bottom: 5px; }
  .job-bullets { list-style: none; padding-left: 12px; }
  .job-bullets li { font-size: 9px; color: #444; line-height: 1.5; margin-bottom: 2px; position: relative; padding-left: 10px; }
  .job-bullets li::before { content: '●'; color: ${accent}; position: absolute; left: 0; font-size: 6px; top: 2px; }
  .education-section { margin-bottom: 14px; }
  .education-entry { margin-bottom: 10px; }
  .edu-title { font-size: 11px; font-weight: 700; color: #222; }
  .edu-center { font-size: 9.5px; color: #777; font-weight: 400; }
  .cv-footer { background: #f5f7fa; border-top: 1px solid #e0e4ea; padding: 7px 30px; text-align: center; flex-shrink: 0; }
  .cv-footer p { font-size: 8px; color: #888; letter-spacing: 0.3px; }

  @page { size: A4; margin: 0; }
  @media print {
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
    body { background: none !important; padding: 0 !important; margin: 0 !important; }
    .cv-page { box-shadow: none !important; width: 210mm !important; height: 297mm !important; max-height: 297mm !important; }
    .left-column { background: #ffffff !important; }
    .cv-footer { background: #f5f7fa !important; }
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
        <div class="first-name">${data.nombre}</div>
        ${data.apellidos ? `<div class="last-name">${data.apellidos}</div>` : ""}
        ${data.subtitulo ? `<div class="subtitle">${data.subtitulo}</div>` : ""}
      </div>

      ${contactItems ? `
      <div class="sidebar-section-title">Contacto</div>
      <div class="sidebar-divider"></div>
      <ul class="contact-list">
        ${contactItems}
      </ul>` : ""}

      ${(data.aptitudes || []).length > 0 ? `
      <div class="sidebar-section-title">Aptitudes</div>
      <div class="sidebar-divider"></div>
      <div class="aptitudes-list">
        ${aptitudesHTML}
      </div>` : ""}

      ${(data.idiomas || []).length > 0 ? `
      <div class="sidebar-section-title">Idiomas</div>
      <div class="sidebar-divider"></div>
      <div class="idiomas-list">
        ${idiomasHTML}
      </div>` : ""}
    </div>

    <!-- RIGHT CONTENT -->
    <div class="right-column">
      ${data.perfilProfesional ? `
      <h2 class="section-title">Perfil Profesional</h2>
      <p class="profile-text">${data.perfilProfesional}</p>` : ""}

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
