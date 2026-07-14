/**
 * lib/cv-generator/cv-template-oscura.ts — Plantilla "Oscura"
 *
 * Estilo Canva "Carlos Méndez / Daniel Casanova": cabecera negra a todo el ancho con
 * el nombre en mayúsculas contundentes y la foto circular, más una etiqueta de rol
 * sobre fondo del color de acento. Cuerpo blanco a dos columnas con títulos en barras
 * oscuras. Elegante y con carácter: para asesores, finanzas, seguridad, conductores.
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

export function generarCVHTML_Oscura(data: CVData): string {
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

  const aptitudesHTML = (data.aptitudes || []).map((a) => `<li>${escapeHtml(a)}</li>`).join("");
  const idiomasHTML = (data.idiomas || [])
    .map((i) => `<li>${escapeHtml(i.nombre)}<span class="nivel"> · ${nivelIdioma(i.nivel)}</span></li>`).join("");

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  @page { size: A4 portrait; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #fff; font-family: 'Montserrat', Arial, sans-serif; color: #37393c; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .cv-page { max-width: 210mm; min-height: 297mm; margin: 0 auto; background: #fff; }

  .cabecera { background: #17181c; padding: 34px 40px; display: flex; align-items: center; gap: 26px; }
  .foto-wrap { width: 112px; height: 112px; border-radius: 50%; overflow: hidden; border: 3px solid rgba(255,255,255,0.25); flex-shrink: 0; }
  .foto-wrap img { width: 100%; height: 100%; object-fit: cover; filter: grayscale(25%); }
  .foto-ph { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #2a2c31; color: #9aa0a8; font-size: 44px; font-weight: 700; }
  h1 { font-size: 26px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; color: #fff; line-height: 1.15; }
  .rol { display: inline-block; background: ${accent}; color: #fff; font-size: 10px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; padding: 4px 14px; margin-top: 10px; }
  .contacto-bar { background: #f2f3f4; padding: 9px 40px; font-size: 9.5px; color: #5c6066; letter-spacing: 0.4px; }

  .cuerpo { display: flex; }
  .principal { width: 63%; padding: 26px 26px 30px 40px; }
  .lateral { width: 37%; padding: 26px 30px 30px 22px; }

  .sec { background: #17181c; color: #fff; font-size: 10.5px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; padding: 6px 12px; margin: 18px 0 12px; }
  .sec:first-child { margin-top: 0; }
  .sec-l { border-bottom: 2px solid ${accent}; color: #17181c; font-size: 10.5px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; padding: 6px 0; margin: 18px 0 12px; }
  .sec-l:first-child { margin-top: 0; }
  .perfil { font-size: 10.4px; color: #4a4e53; line-height: 1.6; text-align: justify; }
  .item { margin-bottom: 13px; }
  .item-top { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; }
  .item-titulo { font-size: 11.5px; font-weight: 700; color: #202226; }
  .item-fecha { font-size: 9px; color: ${accent}; font-weight: 600; white-space: nowrap; }
  .item-sub { font-size: 10px; color: #7d8187; font-style: italic; margin-top: 1px; }
  .item ul { padding-left: 15px; margin-top: 4px; }
  .item ul li { font-size: 10px; color: #4a4e53; line-height: 1.55; margin-bottom: 2px; }
  .lateral ul { list-style: none; }
  .lateral ul li { font-size: 10.3px; color: #4a4e53; margin-bottom: 7px; padding-left: 14px; position: relative; line-height: 1.4; }
  .lateral ul li::before { content: ''; position: absolute; left: 0; top: 5px; width: 6px; height: 6px; background: ${accent}; }
  .lateral .nivel { color: #92979e; }

  @media print { html, body { margin: 0 !important; } .cv-page { min-height: unset !important; height: 297mm; } }
</style>
</head>
<body>
  <div class="cv-page">
    <header class="cabecera">
      <div class="foto-wrap">${fotoHTML}</div>
      <div>
        <h1>${escapeHtml([data.nombre, data.apellidos].filter(Boolean).join(" ")) || "Tu Nombre"}</h1>
        ${data.subtitulo ? `<div class="rol">${escapeHtml(data.subtitulo)}</div>` : ""}
      </div>
    </header>
    ${contacto ? `<div class="contacto-bar">${contacto}</div>` : ""}
    <div class="cuerpo">
      <div class="principal">
        ${data.perfilProfesional ? `<div class="sec">Mi perfil</div><p class="perfil">${escapeHtml(data.perfilProfesional)}</p>` : ""}
        ${experienciaHTML ? `<div class="sec">Experiencia</div>${experienciaHTML}` : ""}
        ${formacionHTML ? `<div class="sec">Formación</div>${formacionHTML}` : ""}
      </div>
      <div class="lateral">
        ${aptitudesHTML ? `<div class="sec-l">Aptitudes</div><ul>${aptitudesHTML}</ul>` : ""}
        ${idiomasHTML ? `<div class="sec-l">Idiomas</div><ul>${idiomasHTML}</ul>` : ""}
      </div>
    </div>
  </div>
</body>
</html>`;
}
