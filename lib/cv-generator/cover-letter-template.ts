/**
 * cover-letter-template.ts — Página A4 de carta de presentación
 * Diseño coordinado con cv-template.ts: sidebar azul #1a2744, acento #3B5FE0
 * Usa prefijo "cl-" en clases para evitar conflictos al combinar con el CV en un solo HTML.
 */

export interface CoverLetterData {
  userName: string;
  userEmail: string;
  userPhone?: string;
  companyName: string;
  coverLetter: string;
  date?: string;
  accent?: string;
}

/** Devuelve el bloque <style> para la carta (sin html/head/body wrapper) */
export function getCoverLetterCSS(accent = "#3B5FE0"): string {
  const sidebarBg = "#1a2744";
  return `
  .cl-page {
    width:794px; height:1123px; max-height:1123px;
    background:#fff;
    display:flex; flex-direction:column;
    overflow:hidden;
  }
  .cl-body { display:flex; flex:1; min-height:0; overflow:hidden; }

  .cl-left {
    width:30%; background:${sidebarBg};
    padding:28px 14px 20px;
    display:flex; flex-direction:column; align-items:center;
    overflow:hidden; flex-shrink:0;
  }
  .cl-avatar {
    width:70px; height:70px; border-radius:50%;
    border:3px solid ${accent};
    background:rgba(255,255,255,0.08);
    display:flex; align-items:center; justify-content:center;
    font-size:22px; font-weight:700; color:#c8d6f0;
    margin-bottom:12px; flex-shrink:0;
    font-family:'Montserrat',sans-serif;
  }
  .cl-name { text-align:center; margin-bottom:16px; }
  .cl-name-first { font-size:13px; font-style:italic; font-weight:400; color:#c8d6f0; line-height:1.3; }
  .cl-name-last  { font-size:13px; font-weight:700; color:#c8d6f0; line-height:1.3; }

  .cl-stitle {
    font-size:9px; font-weight:700; color:${accent};
    text-transform:uppercase; letter-spacing:1.5px;
    align-self:flex-start; margin-bottom:3px;
  }
  .cl-sdiv { width:100%; height:1.5px; background:${accent}; margin-bottom:8px; }

  .cl-contacts { align-self:flex-start; list-style:none; width:100%; margin-bottom:16px; }
  .cl-contacts li {
    font-size:8px; color:#c8d6f0; margin-bottom:6px;
    display:flex; align-items:flex-start; gap:6px; line-height:1.5; word-break:break-all;
  }
  .cl-icon { color:${accent}; flex-shrink:0; }

  .cl-badge {
    margin-top:auto; align-self:flex-start; width:100%;
    padding:10px; border-radius:6px;
    background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1);
  }
  .cl-badge-title { font-size:8px; font-weight:700; color:${accent}; text-transform:uppercase; letter-spacing:1px; margin-bottom:4px; }
  .cl-badge-co    { font-size:10px; color:#c8d6f0; font-weight:600; }

  .cl-right { flex:1; padding:32px 28px 24px; overflow:hidden; display:flex; flex-direction:column; }

  .cl-date { font-size:10px; color:#64748b; margin-bottom:18px; }
  .cl-recipient { font-size:11px; color:#374151; margin-bottom:22px; line-height:1.6; }
  .cl-recipient strong { color:#1a2744; }

  .cl-body-text { flex:1; overflow:hidden; }
  .cl-p { font-size:10.5px; color:#374151; line-height:1.75; margin-bottom:14px; }

  .cl-sign { margin-top:20px; padding-top:14px; border-top:1.5px solid ${accent}; }
  .cl-sign-name { font-size:12px; font-weight:700; color:#1a2744; margin-bottom:4px; }
  .cl-sign-contact { font-size:9px; color:#64748b; }

  .cl-footer {
    background:${sidebarBg}; padding:6px 24px; text-align:center; flex-shrink:0;
  }
  .cl-footer p { font-size:7.5px; color:rgba(200,214,240,0.7); letter-spacing:0.3px; }

  @media print {
    .cl-left   { background:${sidebarBg} !important; }
    .cl-footer { background:${sidebarBg} !important; }
  }`;
}

/** Devuelve el HTML interno de la página de carta (sin html/head/body) */
export function getCoverLetterPageHTML(data: CoverLetterData): string {
  const today = data.date ?? new Date().toLocaleDateString("es-ES", {
    day: "numeric", month: "long", year: "numeric",
  });

  const parrafos = data.coverLetter
    .split("\n")
    .map(l => l.trim())
    .filter(l => l.length > 0)
    .map(l => `<p class="cl-p">${l}</p>`)
    .join("");

  const words = data.userName.trim().split(/\s+/);
  const initials = words.length >= 2
    ? words[0][0].toUpperCase() + words[words.length - 1][0].toUpperCase()
    : words[0][0].toUpperCase();
  const firstName = words.slice(0, -1).join(" ") || data.userName;
  const lastName  = words.length > 1 ? words[words.length - 1] : "";

  return `
<div class="cl-page">
  <div class="cl-body">
    <div class="cl-left">
      <div class="cl-avatar">${initials}</div>
      <div class="cl-name">
        <div class="cl-name-first">${firstName}</div>
        ${lastName ? `<div class="cl-name-last">${lastName}</div>` : ""}
      </div>
      <div class="cl-stitle">Contacto</div>
      <div class="cl-sdiv"></div>
      <ul class="cl-contacts">
        <li><span class="cl-icon">✉</span>${data.userEmail}</li>
        ${data.userPhone ? `<li><span class="cl-icon">☎</span>${data.userPhone}</li>` : ""}
      </ul>
      <div class="cl-badge">
        <div class="cl-badge-title">Carta de presentación</div>
        <div class="cl-badge-co">${data.companyName}</div>
      </div>
    </div>
    <div class="cl-right">
      <div class="cl-date">${today}</div>
      <div class="cl-recipient">
        <strong>A/A: Departamento de Recursos Humanos</strong><br>
        ${data.companyName}
      </div>
      <div class="cl-body-text">${parrafos}</div>
      <div class="cl-sign">
        <div class="cl-sign-name">${data.userName}</div>
        <div class="cl-sign-contact">${data.userEmail}${data.userPhone ? ` · ${data.userPhone}` : ""}</div>
      </div>
    </div>
  </div>
  <div class="cl-footer">
    <p>${data.userName} · ${data.userEmail}${data.userPhone ? ` · ${data.userPhone}` : ""}</p>
  </div>
</div>`;
}

/** Genera el HTML completo standalone de la carta (para previsualización) */
export function generarCartaPresentacionHTML(data: CoverLetterData): string {
  const accent = data.accent ?? "#3B5FE0";
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Carta de presentación — ${data.userName}</title>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;600;700&display=swap" rel="stylesheet">
<style>
  * { margin:0; padding:0; box-sizing:border-box; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  body { font-family:'Montserrat',sans-serif; background:#888; display:flex; justify-content:center; padding:20px; }
  ${getCoverLetterCSS(accent)}
  @page { size:A4 portrait; margin:0; }
  @media print {
    html, body { width:210mm; height:297mm; margin:0; padding:0; background:none; }
    .cl-page { width:210mm !important; height:297mm !important; max-height:297mm !important; box-shadow:none !important; }
  }
</style>
</head>
<body>
${getCoverLetterPageHTML(data)}
</body>
</html>`;
}
