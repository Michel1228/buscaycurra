/**
 * lib/cv-generator/cv-template-firma.ts — Plantilla "Firma"
 *
 * Estilo Canva "Sandra Haro / Estela Domínguez": el nombre va en caligrafía script
 * grande (Great Vibes) como una firma, con el apellido en mayúsculas finas espaciadas.
 * Lateral crema muy suave con foto circular grande y cuerpo limpio. El acento tiñe
 * la firma, las etiquetas y detalles finos. Para comercial, marketing, moda, eventos.
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

export function generarCVHTML_Firma(data: CVData): string {
  const accent = sanitizeColor(data.accentColor);
  const pastel = `linear-gradient(0deg, rgba(255,255,255,0.92), rgba(255,255,255,0.92)), ${accent}`;
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

  const aptitudesHTML = (data.aptitudes || []).map((a) => `<li>${escapeHtml(a)}</li>`).join("");
  const idiomasHTML = (data.idiomas || [])
    .map((i) => `<li>${escapeHtml(i.nombre)} <span class="nivel">· ${nivelIdioma(i.nivel)}</span></li>`).join("");

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

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Great+Vibes&family=Poppins:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>
  @page { size: A4 portrait; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #fff; font-family: 'Poppins', Arial, sans-serif; color: #3d3a38; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .cv-page { max-width: 210mm; min-height: 297mm; margin: 0 auto; display: flex; background: #fff; }

  .side { width: 34%; background: ${pastel}; padding: 34px 22px; text-align: center; }
  .foto-wrap { width: 140px; height: 140px; border-radius: 50%; overflow: hidden; margin: 0 auto 20px; border: 5px solid #fff; box-shadow: 0 3px 12px rgba(0,0,0,0.1); }
  .foto-wrap img { width: 100%; height: 100%; object-fit: cover; }
  .foto-ph { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: ${accent}; color: #fff; font-size: 52px; font-family: 'Great Vibes', cursive; }
  .side h3 { font-size: 10.5px; font-weight: 600; letter-spacing: 2.5px; text-transform: uppercase; color: ${accent}; margin: 22px 0 10px; }
  .side h3::after { content: ''; display: block; width: 28px; height: 1.5px; background: ${accent}; margin: 6px auto 0; }
  .side ul { list-style: none; }
  .side ul li { font-size: 10.3px; color: #5d5854; margin-bottom: 8px; line-height: 1.45; word-break: break-word; }
  .side .nivel { color: #a09892; }

  .main { width: 66%; padding: 42px 34px 30px; }
  .firma { font-family: 'Great Vibes', cursive; font-size: 46px; color: ${accent}; line-height: 1; }
  .apellido { font-size: 15px; font-weight: 500; letter-spacing: 6px; text-transform: uppercase; color: #3a3734; margin-top: 6px; }
  .rol { font-size: 10px; letter-spacing: 3px; text-transform: uppercase; color: #8d8680; margin-top: 10px; padding-bottom: 14px; border-bottom: 1px solid #eae5e0; }
  .sec { font-size: 12px; font-weight: 600; letter-spacing: 2.5px; text-transform: uppercase; color: #3a3734; margin: 22px 0 10px; display: flex; align-items: center; gap: 10px; }
  .sec::after { content: ''; flex: 1; height: 1px; background: #eae5e0; }
  .perfil { font-size: 10.5px; color: #5d5854; line-height: 1.65; }
  .item { margin-bottom: 13px; }
  .item-top { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; }
  .item-titulo { font-size: 11.5px; font-weight: 600; color: #33302d; }
  .item-fecha { font-size: 9px; color: ${accent}; font-weight: 500; white-space: nowrap; }
  .item-sub { font-size: 10px; color: #8d8680; font-style: italic; margin-top: 1px; }
  .item ul { padding-left: 15px; margin-top: 4px; }
  .item ul li { font-size: 10px; color: #5d5854; line-height: 1.55; margin-bottom: 2px; }

  @media print { html, body { margin: 0 !important; } .cv-page { min-height: unset !important; height: 297mm; } }
</style>
</head>
<body>
  <div class="cv-page">
    <aside class="side">
      <div class="foto-wrap">${fotoHTML}</div>
      ${contactItems ? `<h3>Contacto</h3><ul>${contactItems}</ul>` : ""}
      ${aptitudesHTML ? `<h3>Aptitudes</h3><ul>${aptitudesHTML}</ul>` : ""}
      ${idiomasHTML ? `<h3>Idiomas</h3><ul>${idiomasHTML}</ul>` : ""}
    </aside>
    <main class="main">
      <div class="firma">${escapeHtml(data.nombre) || "Tu Nombre"}</div>
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
