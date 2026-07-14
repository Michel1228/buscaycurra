/**
 * lib/cv-generator/cv-template-elegante.ts — Plantilla "Elegante"
 *
 * Banda superior a todo color con el nombre en grande y la foto circular superpuesta.
 * Cuerpo a dos columnas (principal + lateral estrecho). Aspecto premium y llamativo,
 * pensado para hostelería, ventas, marketing y eventos. Color desde data.accentColor.
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

export function generarCVHTML_Elegante(data: CVData): string {
  const accent = sanitizeColor(data.accentColor);
  const inicial = escapeHtml((data.nombre || "?").trim().charAt(0).toUpperCase());

  const fotoValida = data.fotoUrl && /^(https?:\/\/|data:image\/)/.test(data.fotoUrl);
  const fotoHTML = fotoValida
    ? `<img src="${escapeHtml(data.fotoUrl)}" alt="" />`
    : `<div class="foto-ph">${inicial}</div>`;

  const contacto = [data.telefono, data.email, data.ciudad]
    .filter(Boolean).map((c) => escapeHtml(c)).join("&nbsp;&nbsp;•&nbsp;&nbsp;");

  const experienciaHTML = (data.experiencia || [])
    .map((e) => {
      const bullets = (e.descripcion || []).filter(Boolean);
      return `
      <div class="exp">
        <div class="exp-top">
          <span class="exp-puesto">${escapeHtml(e.puesto)}</span>
          <span class="exp-fecha">${escapeHtml(e.fechas)}</span>
        </div>
        <div class="exp-empresa">${escapeHtml(e.empresa)}${e.ubicacion ? ` · ${escapeHtml(e.ubicacion)}` : ""}</div>
        ${bullets.length ? `<ul>${bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join("")}</ul>` : ""}
      </div>`;
    }).join("");

  const formacionHTML = (data.formacion || [])
    .map((f) => `
      <div class="exp">
        <div class="exp-puesto">${escapeHtml(f.titulo)}</div>
        <div class="exp-empresa">${escapeHtml(f.centro)}${f.ubicacion ? ` · ${escapeHtml(f.ubicacion)}` : ""}</div>
      </div>`).join("");

  const aptitudesHTML = (data.aptitudes || [])
    .map((a) => `<li>${escapeHtml(a)}</li>`).join("");

  const idiomasHTML = (data.idiomas || [])
    .map((i) => `<li><strong>${escapeHtml(i.nombre)}</strong><br><span class="nivel">${nivelIdioma(i.nivel)}</span></li>`).join("");

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<style>
  @page { size: A4 portrait; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #fff; font-family: 'Segoe UI', Roboto, Arial, sans-serif; color: #2b2b2b; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .cv-page { max-width: 210mm; min-height: 297mm; margin: 0 auto; background: #fff; }

  .banner { background: ${accent}; color: #fff; padding: 34px 40px 30px; display: flex; align-items: center; gap: 26px; }
  .banner .foto-wrap { width: 118px; height: 118px; border-radius: 50%; overflow: hidden; border: 4px solid rgba(255,255,255,0.6); flex-shrink: 0; }
  .banner .foto-wrap img { width: 100%; height: 100%; object-fit: cover; }
  .foto-ph { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.2); font-size: 48px; font-weight: 700; }
  .banner h1 { font-size: 30px; font-weight: 800; letter-spacing: 0.5px; line-height: 1.1; }
  .banner .rol { font-size: 14px; font-weight: 500; margin-top: 6px; opacity: 0.95; }

  .contacto-bar { background: #f4f4f6; color: #555; font-size: 10px; text-align: center; padding: 9px 40px; letter-spacing: 0.3px; }

  .cuerpo { display: flex; gap: 0; }
  .principal { width: 64%; padding: 26px 26px 30px 40px; }
  .lateral { width: 36%; padding: 26px 30px 30px 22px; background: #fafafa; }

  .sec { font-size: 13px; font-weight: 800; color: ${accent}; text-transform: uppercase; letter-spacing: 1.2px; margin: 4px 0 12px; }
  .principal .sec:not(:first-child), .lateral .sec:not(:first-child) { margin-top: 22px; }
  .perfil { font-size: 10.6px; color: #444; line-height: 1.6; text-align: justify; }
  .exp { margin-bottom: 15px; }
  .exp-top { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; }
  .exp-puesto { font-size: 12.5px; font-weight: 700; color: #222; }
  .exp-fecha { font-size: 9px; color: #fff; background: ${accent}; padding: 2px 9px; border-radius: 10px; white-space: nowrap; }
  .exp-empresa { font-size: 10.5px; color: #777; font-style: italic; margin: 2px 0 5px; }
  .exp ul { padding-left: 15px; }
  .exp ul li { font-size: 10.2px; color: #444; line-height: 1.55; margin-bottom: 2px; }
  .lateral ul { list-style: none; }
  .lateral ul li { font-size: 10.5px; color: #444; margin-bottom: 7px; line-height: 1.4; }
  .lateral .nivel { color: #888; font-size: 9.5px; }

  @media print { html, body { margin: 0 !important; } .cv-page { min-height: unset !important; height: 297mm; } }
</style>
</head>
<body>
  <div class="cv-page">
    <header class="banner">
      <div class="foto-wrap">${fotoHTML}</div>
      <div>
        <h1>${escapeHtml([data.nombre, data.apellidos].filter(Boolean).join(" ")) || "Tu Nombre"}</h1>
        ${data.subtitulo ? `<div class="rol">${escapeHtml(data.subtitulo)}</div>` : ""}
      </div>
    </header>
    ${contacto ? `<div class="contacto-bar">${contacto}</div>` : ""}
    <div class="cuerpo">
      <div class="principal">
        ${data.perfilProfesional ? `<div class="sec">Perfil</div><p class="perfil">${escapeHtml(data.perfilProfesional)}</p>` : ""}
        ${experienciaHTML ? `<div class="sec">Experiencia</div>${experienciaHTML}` : ""}
        ${formacionHTML ? `<div class="sec">Formación</div>${formacionHTML}` : ""}
      </div>
      <div class="lateral">
        ${aptitudesHTML ? `<div class="sec">Aptitudes</div><ul>${aptitudesHTML}</ul>` : ""}
        ${idiomasHTML ? `<div class="sec">Idiomas</div><ul>${idiomasHTML}</ul>` : ""}
      </div>
    </div>
  </div>
</body>
</html>`;
}
