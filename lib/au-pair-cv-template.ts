/**
 * lib/au-pair-cv-template.ts — Perfil Au Pair estilo editorial
 *
 * Mismo lenguaje visual que la plantilla "Ejecutiva" del CV (panel pastel, foto en
 * arco, serif elegante, timeline de puntos) pero con las secciones propias de un perfil
 * au pair / live-in nanny: datos, experiencia con niños, aptitudes, idiomas, referencias
 * y la carta "Dear Family". Emite HTML A4 con wrapper .cv-page (para el ajuste a 1 hoja).
 */
import type { AuPairProfile, AuPairReference } from "./au-pair";
import { escapeHtml, sanitizeColor } from "./cv-generator/cv-template";

export function generarAuPairHTML(
  profile: AuPairProfile,
  coverLetter: string,
  accentColor = "#2f6f5e"
): string {
  const accent = sanitizeColor(accentColor);
  const pastel = `linear-gradient(0deg, rgba(255,255,255,0.86), rgba(255,255,255,0.86)), ${accent}`;
  const nombre = escapeHtml(profile.nombre || "Au Pair");
  const inicial = escapeHtml((profile.nombre || "A").trim().charAt(0).toUpperCase());

  const fotos = (profile.photos || []).filter((u) => /^https?:\/\//.test(u));
  const fotoHTML = fotos.length
    ? `<img src="${escapeHtml(fotos[0])}" alt="" />`
    : `<div class="foto-ph">${inicial}</div>`;

  // Datos rápidos (timeline lateral)
  const datos = [
    profile.age ? `${escapeHtml(String(profile.age))} years old` : "",
    [profile.nationality, profile.ciudad].filter(Boolean).map((s) => escapeHtml(s)).join(" · "),
    profile.available_from ? `Available from ${escapeHtml(profile.available_from)}` : "",
    profile.nivel_educativo ? escapeHtml(profile.nivel_educativo) : "",
    profile.duracion_preferida ? `Stay: ${escapeHtml(profile.duracion_preferida)}` : "",
  ].filter(Boolean);
  const datosHTML = datos.length ? `<h3>About</h3><ul>${datos.map((d) => `<li>${d}</li>`).join("")}</ul>` : "";

  const skills: string[] = [];
  if (profile.has_driving_license) skills.push("Driving license");
  if (!profile.fumador) skills.push("Non-smoker");
  if (profile.primeros_auxilios) skills.push("First aid");
  if (profile.sabe_nadar) skills.push("Swimmer");
  const skillsHTML = skills.length
    ? `<h3>Skills</h3><div class="chips">${skills.map((s) => `<span class="chip">${escapeHtml(s)}</span>`).join("")}</div>`
    : "";

  const idiomasHTML = (profile.languages || []).length
    ? `<h3>Languages</h3><ul>${profile.languages.map((l) => `<li>${escapeHtml(l)}</li>`).join("")}</ul>`
    : "";

  const refs = (profile.references_json || []) as AuPairReference[];
  const refsHTML = refs.length
    ? `<h3>References</h3><ul class="refs">${refs.map((r) => `<li><b>${escapeHtml(r.nombre)}</b><br><span>${[r.relacion, r.email, r.telefono].filter(Boolean).map((v) => escapeHtml(String(v))).join(" · ")}</span></li>`).join("")}</ul>`
    : "";

  const galeriaHTML = fotos.length > 1
    ? `<div class="galeria">${fotos.slice(1, 4).map((u) => `<img src="${escapeHtml(u)}" alt="" />`).join("")}</div>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Poppins:wght@300;400;500&display=swap" rel="stylesheet">
<style>
  @page { size: A4 portrait; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #fff; font-family: 'Poppins', Arial, sans-serif; color: #3a3a3a; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .cv-page { max-width: 210mm; min-height: 297mm; margin: 0 auto; display: flex; background: #fff; }

  .panel { width: 35%; background: ${pastel}; padding: 30px 22px 24px; }
  .arco { width: 150px; height: 178px; margin: 0 auto 22px; border-radius: 75px 75px 14px 14px; overflow: hidden; border: 4px solid #fff; box-shadow: 0 3px 12px rgba(0,0,0,0.12); }
  .arco img { width: 100%; height: 100%; object-fit: cover; }
  .foto-ph { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: ${accent}; color: #fff; font-family: 'Cormorant Garamond', serif; font-size: 60px; }
  .panel h3 { font-family: 'Cormorant Garamond', serif; font-size: 16px; font-weight: 700; color: ${accent}; letter-spacing: 1px; margin: 20px 0 9px; position: relative; padding-left: 16px; }
  .panel h3::before { content: ''; position: absolute; left: 0; top: 7px; width: 8px; height: 8px; border-radius: 50%; background: ${accent}; }
  .panel ul { list-style: none; padding-left: 16px; border-left: 1.5px dotted ${accent}; margin-left: 3px; }
  .panel ul li { font-size: 10.3px; color: #57514f; margin-bottom: 8px; line-height: 1.45; word-break: break-word; }
  .panel .refs li b { color: #3d3436; }
  .panel .refs li span { color: #8a8280; }
  .chips { padding-left: 4px; }
  .chip { display: inline-block; background: ${accent}; color: #fff; border-radius: 12px; padding: 3px 10px; font-size: 9.5px; margin: 0 5px 6px 0; }

  .main { width: 65%; padding: 40px 34px 30px; }
  .nombre { font-family: 'Cormorant Garamond', serif; font-size: 38px; font-weight: 600; color: #2c2c2c; line-height: 1; }
  .rol { font-size: 11px; color: #6a6a6a; letter-spacing: 3px; text-transform: uppercase; margin-top: 10px; padding-top: 10px; border-top: 1.5px solid #e6e2e0; display: inline-block; }
  .sec { font-family: 'Cormorant Garamond', serif; font-size: 19px; font-weight: 700; color: ${accent}; margin: 22px 0 8px; }
  .texto { font-size: 10.6px; color: #5b5553; line-height: 1.6; white-space: pre-wrap; }
  .carta { font-family: Georgia, 'Times New Roman', serif; font-size: 11px; color: #4a4446; line-height: 1.7; white-space: pre-wrap; }
  .galeria { display: flex; gap: 8px; margin-top: 14px; }
  .galeria img { width: 33%; height: 90px; object-fit: cover; border-radius: 8px; }

  @media print { html, body { margin: 0 !important; } .cv-page { min-height: unset !important; height: 297mm; } }
</style>
</head>
<body>
  <div class="cv-page">
    <aside class="panel">
      <div class="arco">${fotoHTML}</div>
      ${datosHTML}
      ${skillsHTML}
      ${idiomasHTML}
      ${refsHTML}
    </aside>
    <main class="main">
      <div class="nombre">${nombre}</div>
      <div class="rol">Au Pair · Live-in Nanny</div>
      ${profile.hobbies ? `<div class="sec">About me</div><p class="texto">${escapeHtml(profile.hobbies)}</p>` : ""}
      ${profile.childcare_experience ? `<div class="sec">Childcare experience</div><p class="texto">${escapeHtml(profile.childcare_experience)}</p>` : ""}
      ${profile.dietary_info ? `<div class="sec">Diet</div><p class="texto">${escapeHtml(profile.dietary_info)}</p>` : ""}
      ${coverLetter ? `<div class="sec">Dear Family</div><p class="carta">${escapeHtml(coverLetter)}</p>` : ""}
      ${galeriaHTML}
    </main>
  </div>
</body>
</html>`;
}
