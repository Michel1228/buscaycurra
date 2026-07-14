/**
 * lib/cv-generator/cv-template-moderna.ts — Plantilla "Moderna"
 *
 * Dos columnas con la barra lateral teñida del color de acento (rosa, azul, morado…),
 * texto blanco, foto circular y experiencia en formato timeline con puntos. Es la más
 * llamativa/juvenil: pensada para comercio, atención al cliente, peluquería y estética.
 * El color de la barra sale de data.accentColor, así el usuario la personaliza.
 *
 * Contrato estándar: CVData → HTML A4 autocontenido con wrapper .cv-page, @page A4,
 * @media print y paso por escapeHtml / sanitizeColor.
 */
import type { CVData } from "./cv-template";
import { escapeHtml, sanitizeColor } from "./cv-template";

export function generarCVHTML_Moderna(data: CVData): string {
  const accent = sanitizeColor(data.accentColor);
  const inicial = escapeHtml((data.nombre || "?").trim().charAt(0).toUpperCase());

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
    .map((a) => `<span class="chip">${escapeHtml(a)}</span>`).join("");

  const idiomasHTML = (data.idiomas || [])
    .map((i) => `
      <div class="idioma">
        <div class="idioma-nombre">${escapeHtml(i.nombre)}</div>
        <div class="barra"><div class="barra-fill" style="width:${Math.min(100, Math.max(0, i.nivel))}%"></div></div>
      </div>`).join("");

  const experienciaHTML = (data.experiencia || [])
    .map((e) => {
      const bullets = (e.descripcion || []).filter(Boolean);
      return `
      <div class="tl-item">
        <div class="tl-fecha">${escapeHtml(e.fechas)}</div>
        <div class="tl-puesto">${escapeHtml(e.puesto)}</div>
        <div class="tl-empresa">${escapeHtml(e.empresa)}${e.ubicacion ? ` · ${escapeHtml(e.ubicacion)}` : ""}</div>
        ${bullets.length ? `<ul>${bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join("")}</ul>` : ""}
      </div>`;
    }).join("");

  const formacionHTML = (data.formacion || [])
    .map((f) => `
      <div class="tl-item">
        <div class="tl-puesto">${escapeHtml(f.titulo)}</div>
        <div class="tl-empresa">${escapeHtml(f.centro)}${f.ubicacion ? ` · ${escapeHtml(f.ubicacion)}` : ""}</div>
      </div>`).join("");

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<style>
  @page { size: A4 portrait; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #fff; font-family: 'Segoe UI', Roboto, Arial, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .cv-page { max-width: 210mm; min-height: 297mm; margin: 0 auto; display: flex; background: #fff; color: #2b2b2b; }

  /* SIDEBAR de color */
  .side { width: 35%; background: ${accent}; color: #fff; padding: 30px 22px; }
  .foto-wrap { width: 130px; height: 130px; border-radius: 50%; overflow: hidden; margin: 0 auto 18px; border: 4px solid rgba(255,255,255,0.55); }
  .foto-wrap img { width: 100%; height: 100%; object-fit: cover; }
  .foto-ph { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.2); font-size: 54px; font-weight: 700; color: #fff; }
  .side h3 { font-size: 11.5px; text-transform: uppercase; letter-spacing: 1.5px; margin: 22px 0 9px; padding-bottom: 5px; border-bottom: 1px solid rgba(255,255,255,0.4); font-weight: 700; }
  .side h3:first-of-type { margin-top: 6px; }
  .side ul { list-style: none; }
  .side ul li { font-size: 10.5px; margin-bottom: 7px; line-height: 1.4; word-break: break-word; }
  .chip { display: inline-block; background: rgba(255,255,255,0.18); border-radius: 12px; padding: 4px 11px; font-size: 10px; margin: 0 5px 6px 0; }
  .idioma { margin-bottom: 9px; }
  .idioma-nombre { font-size: 10.5px; margin-bottom: 4px; }
  .barra { height: 5px; background: rgba(255,255,255,0.3); border-radius: 3px; overflow: hidden; }
  .barra-fill { height: 100%; background: #fff; border-radius: 3px; }

  /* CONTENIDO */
  .main { width: 65%; padding: 34px 30px; }
  .nombre { font-size: 27px; font-weight: 800; color: #222; line-height: 1.1; }
  .rol { font-size: 13px; color: ${accent}; font-weight: 600; margin-top: 4px; margin-bottom: 20px; }
  .sec-titulo { font-size: 14px; font-weight: 800; color: #222; text-transform: uppercase; letter-spacing: 1px; margin: 20px 0 12px; display: flex; align-items: center; gap: 9px; }
  .sec-titulo::before { content: ''; width: 16px; height: 3px; background: ${accent}; border-radius: 2px; }
  .perfil { font-size: 10.8px; color: #444; line-height: 1.6; }
  .tl { border-left: 2px solid #e6e6e6; padding-left: 18px; }
  .tl-item { position: relative; margin-bottom: 16px; }
  .tl-item::before { content: ''; position: absolute; left: -25px; top: 3px; width: 10px; height: 10px; border-radius: 50%; background: ${accent}; border: 2px solid #fff; }
  .tl-fecha { font-size: 9.5px; color: #999; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
  .tl-puesto { font-size: 12.5px; font-weight: 700; color: #222; margin-top: 1px; }
  .tl-empresa { font-size: 10.5px; color: #777; font-style: italic; margin-bottom: 5px; }
  .tl-item ul { padding-left: 15px; }
  .tl-item ul li { font-size: 10.2px; color: #444; line-height: 1.55; margin-bottom: 2px; }

  @media print { html, body { margin: 0 !important; } .cv-page { min-height: unset !important; height: 297mm; } }
</style>
</head>
<body>
  <div class="cv-page">
    <aside class="side">
      <div class="foto-wrap">${fotoHTML}</div>
      ${contactItems ? `<h3>Contacto</h3><ul>${contactItems}</ul>` : ""}
      ${aptitudesHTML ? `<h3>Aptitudes</h3><div>${aptitudesHTML}</div>` : ""}
      ${idiomasHTML ? `<h3>Idiomas</h3>${idiomasHTML}` : ""}
    </aside>
    <main class="main">
      <div class="nombre">${escapeHtml([data.nombre, data.apellidos].filter(Boolean).join(" ")) || "Tu Nombre"}</div>
      ${data.subtitulo ? `<div class="rol">${escapeHtml(data.subtitulo)}</div>` : ""}
      ${data.perfilProfesional ? `<div class="sec-titulo">Sobre mí</div><p class="perfil">${escapeHtml(data.perfilProfesional)}</p>` : ""}
      ${experienciaHTML ? `<div class="sec-titulo">Experiencia</div><div class="tl">${experienciaHTML}</div>` : ""}
      ${formacionHTML ? `<div class="sec-titulo">Formación</div><div class="tl">${formacionHTML}</div>` : ""}
    </main>
  </div>
</body>
</html>`;
}
