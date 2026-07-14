/**
 * lib/cv-generator/cv-template-ejecutiva.ts — Plantilla "Ejecutiva" (editorial)
 *
 * Estilo revista/Canva: panel lateral en tono PASTEL del color elegido, foto dentro
 * de un marco en arco (parte superior redondeada), nombre en serif fino y elegante
 * (Cormorant) con el apellido en mayúsculas espaciadas, y línea de tiempo con puntos.
 * Refinada y con mucho aire. Para marketing, comercial, administración, diseño, RRHH.
 *
 * El tono pastel se consigue superponiendo blanco translúcido sobre el color de acento
 * (linear-gradient), así funciona con cualquier color sin cálculos.
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

export function generarCVHTML_Ejecutiva(data: CVData): string {
  const accent = sanitizeColor(data.accentColor);
  const inicial = escapeHtml((data.nombre || "?").trim().charAt(0).toUpperCase());
  const pastel = `linear-gradient(0deg, rgba(255,255,255,0.86), rgba(255,255,255,0.86)), ${accent}`;

  const fotoValida = data.fotoUrl && /^(https?:\/\/|data:image\/)/.test(data.fotoUrl);
  const fotoHTML = fotoValida
    ? `<img src="${escapeHtml(data.fotoUrl)}" alt="" />`
    : `<div class="foto-ph">${inicial}</div>`;

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
        <div class="item-fecha">${escapeHtml(e.fechas)}</div>
        <div class="item-titulo">${escapeHtml(e.puesto)}</div>
        <div class="item-sub">${escapeHtml(e.empresa)}${e.ubicacion ? ` · ${escapeHtml(e.ubicacion)}` : ""}</div>
        ${bullets.length ? `<ul>${bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join("")}</ul>` : ""}
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
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Poppins:wght@300;400;500&display=swap" rel="stylesheet">
<style>
  @page { size: A4 portrait; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #fff; font-family: 'Poppins', Arial, sans-serif; color: #3a3a3a; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .cv-page { max-width: 210mm; min-height: 297mm; margin: 0 auto; display: flex; background: #fff; }

  /* PANEL lateral pastel */
  .panel { width: 35%; background: ${pastel}; padding: 30px 22px 24px; }
  .arco { width: 150px; height: 178px; margin: 0 auto 22px; border-radius: 75px 75px 14px 14px; overflow: hidden; border: 4px solid #fff; box-shadow: 0 3px 12px rgba(0,0,0,0.12); }
  .arco img { width: 100%; height: 100%; object-fit: cover; }
  .foto-ph { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: ${accent}; color: #fff; font-family: 'Cormorant Garamond', serif; font-size: 60px; }
  .panel h3 { font-family: 'Cormorant Garamond', serif; font-size: 16px; font-weight: 700; color: ${accent}; letter-spacing: 1px; margin: 20px 0 9px; position: relative; padding-left: 16px; }
  .panel h3::before { content: ''; position: absolute; left: 0; top: 7px; width: 8px; height: 8px; border-radius: 50%; background: ${accent}; }
  .panel ul { list-style: none; padding-left: 16px; border-left: 1.5px dotted ${accent}; margin-left: 3px; }
  .panel ul li { font-size: 10.3px; color: #57514f; margin-bottom: 8px; line-height: 1.45; word-break: break-word; }
  .panel .nivel { color: #9a9290; }

  /* CONTENIDO */
  .main { width: 65%; padding: 40px 34px 30px; }
  .nombre { font-family: 'Cormorant Garamond', serif; font-size: 38px; font-weight: 600; color: #2c2c2c; line-height: 1; }
  .apellido { font-family: 'Cormorant Garamond', serif; font-size: 30px; font-weight: 700; color: ${accent}; letter-spacing: 3px; text-transform: uppercase; line-height: 1.1; }
  .rol { font-size: 11px; color: #6a6a6a; letter-spacing: 3px; text-transform: uppercase; margin-top: 10px; padding-top: 10px; border-top: 1.5px solid #e6e2e0; display: inline-block; }
  .sec { font-family: 'Cormorant Garamond', serif; font-size: 19px; font-weight: 700; color: ${accent}; margin: 24px 0 10px; letter-spacing: 0.5px; }
  .perfil { font-size: 10.6px; color: #5b5553; line-height: 1.65; }
  .item { margin-bottom: 14px; padding-left: 15px; border-left: 1.5px dotted #ddd6d4; position: relative; }
  .item::before { content: ''; position: absolute; left: -5px; top: 4px; width: 8px; height: 8px; border-radius: 50%; background: ${accent}; }
  .item-fecha { font-size: 9px; color: #9a9290; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 1px; }
  .item-titulo { font-size: 12.5px; font-weight: 600; color: #2f2f2f; }
  .item-sub { font-size: 10.3px; color: #8a8280; font-style: italic; margin-top: 1px; }
  .item ul { padding-left: 15px; margin-top: 4px; }
  .item ul li { font-size: 10.2px; color: #5b5553; line-height: 1.5; margin-bottom: 2px; }

  @media print { html, body { margin: 0 !important; } .cv-page { min-height: unset !important; height: 297mm; } }
</style>
</head>
<body>
  <div class="cv-page">
    <aside class="panel">
      <div class="arco">${fotoHTML}</div>
      ${contactItems ? `<h3>Contacto</h3><ul>${contactItems}</ul>` : ""}
      ${aptitudesHTML ? `<h3>Aptitudes</h3><ul>${aptitudesHTML}</ul>` : ""}
      ${idiomasHTML ? `<h3>Idiomas</h3><ul>${idiomasHTML}</ul>` : ""}
    </aside>
    <main class="main">
      <div class="nombre">${escapeHtml(data.nombre) || "Tu Nombre"}</div>
      ${data.apellidos ? `<div class="apellido">${escapeHtml(data.apellidos)}</div>` : ""}
      ${data.subtitulo ? `<div class="rol">${escapeHtml(data.subtitulo)}</div>` : ""}
      ${data.perfilProfesional ? `<div class="sec">Sobre mí</div><p class="perfil">${escapeHtml(data.perfilProfesional)}</p>` : ""}
      ${experienciaHTML ? `<div class="sec">Experiencia</div>${experienciaHTML}` : ""}
      ${formacionHTML ? `<div class="sec">Formación</div>${formacionHTML}` : ""}
    </main>
  </div>
</body>
</html>`;
}
