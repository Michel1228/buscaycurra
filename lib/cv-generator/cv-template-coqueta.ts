/**
 * lib/cv-generator/cv-template-coqueta.ts — Plantilla "Coqueta"
 *
 * Estilo suave y decorativo (no un bloque de color plano): fondo lateral crema,
 * tipografía serif elegante (Playfair Display) para el nombre y los títulos, foto
 * circular con doble aro, un adorno floral/curvo en SVG y detalles con puntos.
 * Pensada para peluquería, estética, spa, floristería, repostería y eventos.
 * Usa data.accentColor para teñir adornos y títulos sobre fondo claro (siempre legible).
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

export function generarCVHTML_Coqueta(data: CVData): string {
  const accent = sanitizeColor(data.accentColor);
  const inicial = escapeHtml((data.nombre || "?").trim().charAt(0).toUpperCase());

  const fotoValida = data.fotoUrl && /^(https?:\/\/|data:image\/)/.test(data.fotoUrl);
  const fotoHTML = fotoValida
    ? `<img src="${escapeHtml(data.fotoUrl)}" alt="" />`
    : `<div class="foto-ph">${inicial}</div>`;

  // Adorno floral/curvo en SVG (líneas y hojas en el color de acento)
  const flourish = `<svg class="flourish" viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 20 C 35 4, 55 4, 60 20 C 65 36, 85 36, 110 20" stroke="${accent}" stroke-width="1.4" stroke-linecap="round"/>
    <ellipse cx="60" cy="20" rx="4.5" ry="7" fill="${accent}" opacity="0.85"/>
    <circle cx="10" cy="20" r="2.4" fill="${accent}"/>
    <circle cx="110" cy="20" r="2.4" fill="${accent}"/>
  </svg>`;

  const contactItems = [
    data.telefono ? `<li>${escapeHtml(data.telefono)}</li>` : "",
    data.email ? `<li>${escapeHtml(data.email)}</li>` : "",
    data.ciudad ? `<li>${escapeHtml(data.ciudad)}</li>` : "",
  ].filter(Boolean).join("");

  const aptitudesHTML = (data.aptitudes || [])
    .map((a) => `<li>${escapeHtml(a)}</li>`).join("");

  const idiomasHTML = (data.idiomas || [])
    .map((i) => `<li>${escapeHtml(i.nombre)} <span class="nivel">· ${nivelIdioma(i.nivel)}</span></li>`).join("");

  const experienciaHTML = (data.experiencia || [])
    .map((e) => {
      const bullets = (e.descripcion || []).filter(Boolean);
      return `
      <div class="item">
        <div class="item-top">
          <span class="item-titulo">${escapeHtml(e.puesto)}</span>
          <span class="item-fecha">${escapeHtml(e.fechas)}</span>
        </div>
        <div class="item-sub">${escapeHtml(e.empresa)}${e.ubicacion ? ` · ${escapeHtml(e.ubicacion)}` : ""}</div>
        ${bullets.length ? `<ul class="bullets">${bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join("")}</ul>` : ""}
      </div>`;
    }).join("");

  const formacionHTML = (data.formacion || [])
    .map((f) => `
      <div class="item">
        <div class="item-titulo">${escapeHtml(f.titulo)}</div>
        <div class="item-sub">${escapeHtml(f.centro)}${f.ubicacion ? ` · ${escapeHtml(f.ubicacion)}` : ""}</div>
      </div>`).join("");

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Poppins:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>
  @page { size: A4 portrait; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #fff; font-family: 'Poppins', Arial, sans-serif; color: #3d3436; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .cv-page { max-width: 210mm; min-height: 297mm; margin: 0 auto; display: flex; background: #fff; }

  .side { width: 34%; background: #faf6f4; padding: 28px 22px; text-align: center; }
  .foto-wrap { width: 128px; height: 128px; border-radius: 50%; margin: 4px auto 6px; padding: 5px; border: 1.5px solid ${accent}; }
  .foto-inner { width: 100%; height: 100%; border-radius: 50%; overflow: hidden; border: 3px solid ${accent}; }
  .foto-inner img { width: 100%; height: 100%; object-fit: cover; }
  .foto-ph { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: ${accent}; color: #fff; font-size: 46px; font-family: 'Playfair Display', serif; }
  .flourish { width: 96px; height: 32px; display: block; margin: 8px auto 4px; }
  .side h3 { font-family: 'Playfair Display', serif; font-size: 13px; color: ${accent}; letter-spacing: 1px; margin: 22px 0 10px; }
  .side ul { list-style: none; }
  .side ul li { font-size: 10.5px; color: #6a5f61; margin-bottom: 8px; line-height: 1.45; word-break: break-word; }
  .side .nivel { color: #a99ea0; }

  .main { width: 66%; padding: 34px 32px; }
  .nombre { font-family: 'Playfair Display', serif; font-size: 30px; font-weight: 700; color: #2e2729; line-height: 1.1; }
  .rol { font-size: 12.5px; color: ${accent}; letter-spacing: 2px; text-transform: uppercase; margin-top: 6px; }
  .divisor { display: flex; align-items: center; gap: 8px; margin: 16px 0 4px; }
  .divisor::before, .divisor::after { content: ''; height: 1px; background: #e7dcde; flex: 1; }
  .divisor span { width: 6px; height: 6px; border-radius: 50%; background: ${accent}; }
  .sec { font-family: 'Playfair Display', serif; font-size: 15px; color: ${accent}; margin: 20px 0 10px; }
  .perfil { font-size: 10.6px; color: #5f5557; line-height: 1.65; }
  .item { margin-bottom: 13px; }
  .item-top { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; }
  .item-titulo { font-size: 12px; font-weight: 600; color: #322b2d; }
  .item-fecha { font-size: 9px; color: #fff; background: ${accent}; padding: 2px 9px; border-radius: 10px; white-space: nowrap; }
  .item-sub { font-size: 10.3px; color: #8a8082; font-style: italic; margin-top: 1px; }
  .bullets { padding-left: 14px; margin-top: 4px; }
  .bullets li { font-size: 10.2px; color: #5f5557; line-height: 1.55; margin-bottom: 2px; list-style: none; position: relative; padding-left: 12px; }
  .bullets li::before { content: '❋'; position: absolute; left: 0; color: ${accent}; font-size: 8px; top: 2px; }

  @media print { html, body { margin: 0 !important; } .cv-page { min-height: unset !important; height: 297mm; } }
</style>
</head>
<body>
  <div class="cv-page">
    <aside class="side">
      <div class="foto-wrap"><div class="foto-inner">${fotoHTML}</div></div>
      ${flourish}
      ${contactItems ? `<h3>Contacto</h3><ul>${contactItems}</ul>` : ""}
      ${aptitudesHTML ? `<h3>Aptitudes</h3><ul>${aptitudesHTML}</ul>` : ""}
      ${idiomasHTML ? `<h3>Idiomas</h3><ul>${idiomasHTML}</ul>` : ""}
    </aside>
    <main class="main">
      <div class="nombre">${escapeHtml([data.nombre, data.apellidos].filter(Boolean).join(" ")) || "Tu Nombre"}</div>
      ${data.subtitulo ? `<div class="rol">${escapeHtml(data.subtitulo)}</div>` : ""}
      <div class="divisor"><span></span></div>
      ${data.perfilProfesional ? `<div class="sec">Sobre mí</div><p class="perfil">${escapeHtml(data.perfilProfesional)}</p>` : ""}
      ${experienciaHTML ? `<div class="sec">Experiencia</div>${experienciaHTML}` : ""}
      ${formacionHTML ? `<div class="sec">Formación</div>${formacionHTML}` : ""}
    </main>
  </div>
</body>
</html>`;
}
