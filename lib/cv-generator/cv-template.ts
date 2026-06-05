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

  const idiomasHTML = idiomas
    .map(i => `
      <div class="idioma-item">
        <div class="idioma-name">${i.nombre}</div>
        <div class="idioma-bar-bg"><div class="idioma-bar-fill" style="width:${i.nivel || 80}%"></div></div>
      </div>`)
    .join("");

  const experienciaHTML = experiencias
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

  const formacionHTML = formaciones
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

  body { font-family:'Montserrat',sans-serif; background:#888; display:flex; justify-content:center; padding:20px; }

  .cv-page {
    width: 794px; min-height: 1123px;
    background: #fff;
    display: flex; flex-direction: column;
    box-shadow: 0 4px 24px rgba(0,0,0,0.25);
  }

  .cv-body { display:flex; flex:1; }

  /* ── SIDEBAR OSCURO ─────────────────────────── */
  .left-col {
    width: 30%; background: ${sidebarBg};
    padding: 20px 14px 16px;
    display: flex; flex-direction: column; align-items: center;
    flex-shrink: 0;
  }

  .photo-wrap {
    width: 100px; height: 100px; border-radius: 50%;
    border: 3px solid ${accent};
    overflow: hidden; margin-bottom: 10px; flex-shrink: 0;
  }

  .name-block { text-align:center; margin-bottom:12px; flex-shrink:0; }
  .name-first  { font-size:14px; font-style:italic; font-weight:400; color:#c8d6f0; line-height:1.2; }
  .name-last   { font-size:14px; font-weight:700;   color:#c8d6f0; line-height:1.3; }
  .name-sub    { font-size:8.5px; color:rgba(200,214,240,0.6); margin-top:4px; }

  .s-title {
    font-size:9.5px; font-weight:700; color:${accent};
    text-transform:uppercase; letter-spacing:1.5px;
    align-self:flex-start; margin-bottom:3px; flex-shrink:0;
  }
  .s-divider { width:100%; height:1.5px; background:${accent}; margin-bottom:7px; }

  .contact-list { align-self:flex-start; list-style:none; margin-bottom:12px; width:100%; }
  .contact-list li { font-size:8.5px; color:#c8d6f0; margin-bottom:4px; display:flex; align-items:flex-start; gap:6px; line-height:1.4; word-break:break-all; }
  .c-icon { color:${accent}; flex-shrink:0; margin-top:1px; }

  .apt-list { align-self:flex-start; display:flex; flex-direction:column; gap:4px; margin-bottom:12px; width:100%; }
  .apt-pill {
    font-size:8px; color:#c8d6f0;
    background:rgba(255,255,255,0.10);
    border-radius:20px; padding:3px 10px;
    display:inline-block; width:fit-content;
    border:1px solid rgba(255,255,255,0.12);
  }

  .idiomas-list { align-self:flex-start; width:100%; margin-bottom:12px; }
  .idioma-item  { margin-bottom:7px; }
  .idioma-name  { font-size:8.5px; color:#c8d6f0; margin-bottom:3px; }
  .idioma-bar-bg   { width:100%; height:3px; background:rgba(255,255,255,0.15); border-radius:2px; }
  .idioma-bar-fill { height:100%; background:${accent}; border-radius:2px; }

  /* ── COLUMNA DERECHA ───────────────────────── */
  .right-col { flex:1; padding:22px 22px 14px 22px; }

  .sec-title {
    font-size:11px; font-weight:700; color:${accent};
    text-transform:uppercase; letter-spacing:1.5px;
    display:flex; align-items:center; gap:8px; margin-bottom:8px;
  }
  .sec-title::after { content:''; flex:1; height:1.5px; background:${accent}; }

  .profile-text { font-size:8.5px; color:#444; line-height:1.6; margin-bottom:12px; }

  .exp-section  { margin-bottom:12px; }
  .exp-entry    { margin-bottom:10px; }
  .date-badge {
    display:inline-block; background:${accent}; color:#fff;
    font-size:7.5px; font-weight:600; padding:2px 10px;
    border-radius:12px; margin-bottom:3px;
  }
  .job-title   { font-size:10px; font-weight:700; color:#1a1a2e; margin-bottom:1px; }
  .job-company { font-size:8.5px; color:#888; font-style:italic; margin-bottom:3px; }
  .job-bullets { list-style:none; padding-left:10px; }
  .job-bullets li {
    font-size:8px; color:#444; line-height:1.5; margin-bottom:1px;
    position:relative; padding-left:9px;
  }
  .job-bullets li::before { content:'●'; color:${accent}; position:absolute; left:0; font-size:5px; top:3px; }

  .edu-section { margin-bottom:10px; }
  .edu-entry   { margin-bottom:7px; }
  .edu-title   { font-size:10px; font-weight:700; color:#1a1a2e; }
  .edu-center  { font-size:8.5px; color:#888; }

  /* ── FOOTER ─────────────────────────────────── */
  .cv-footer {
    background:${sidebarBg}; padding:6px 24px;
    text-align:center; flex-shrink:0;
  }
  .cv-footer p { font-size:7.5px; color:rgba(200,214,240,0.7); letter-spacing:0.3px; }

  /* ── IMPRESIÓN 1 PÁGINA ─────────────────────── */
  @page { size: A4 portrait; margin: 0; }
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

    <!-- SIDEBAR -->
    <div class="left-col">
      <div class="photo-wrap">${fotoSection}</div>

      <div class="name-block">
        <div class="first-name">${escapeHtml(data.nombre)}</div>
        ${data.apellidos ? `<div class="last-name">${escapeHtml(data.apellidos)}</div>` : ""}
        ${data.subtitulo ? `<div class="subtitle">${escapeHtml(data.subtitulo)}</div>` : ""}
      </div>

      ${(data.telefono || data.email || data.ciudad) ? `
      <div class="s-title">Contacto</div>
      <div class="s-divider"></div>
      <ul class="contact-list">
        ${data.telefono ? `<li><span class="c-icon">■</span>${data.telefono}</li>` : ""}
        ${data.email    ? `<li><span class="c-icon">✉</span>${data.email}</li>` : ""}
        ${data.ciudad   ? `<li><span class="c-icon">■</span>${data.ciudad}</li>` : ""}
      </ul>` : ""}

      ${aptitudes.length > 0 ? `
      <div class="s-title">Aptitudes</div>
      <div class="s-divider"></div>
      <div class="apt-list">${aptitudesHTML}</div>` : ""}

      ${idiomas.length > 0 ? `
      <div class="s-title">Idiomas</div>
      <div class="s-divider"></div>
      <div class="idiomas-list">${idiomasHTML}</div>` : ""}
    </div>

    <!-- RIGHT CONTENT -->
    <div class="right-column">
      ${data.perfilProfesional ? `
      <h2 class="section-title">Perfil Profesional</h2>
      <p class="profile-text">${escapeHtml(data.perfilProfesional)}</p>` : ""}

      ${experiencias.length > 0 ? `
      <h2 class="sec-title">Experiencia Laboral</h2>
      <div class="exp-section">${experienciaHTML}</div>` : ""}

      ${formaciones.length > 0 ? `
      <h2 class="sec-title">Formación</h2>
      <div class="edu-section">${formacionHTML}</div>` : ""}
    </div>
  </div>

  <div class="cv-footer">
    <p>${footerParts}</p>
  </div>
</div>
</body>
</html>`;
}
