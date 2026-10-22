/**
 * lib/cv-generator/cv-template-sencilla.ts — Plantilla "Sencilla" (la recomendada)
 *
 * POR QUÉ (22 oct 2026). En una charla, a Michel le contaron que a los alumnos
 * de los cursos les piden dejar los colores y los adornos y mandar el CV de
 * siempre: blanco y negro, "CURRÍCULUM VITAE" arriba, los datos personales con
 * su etiqueta, la foto al lado y cada apartado con su título subrayado y sus
 * viñetas. No es copiar un modelo concreto: es ese concepto, limpio y ordenado.
 *
 * Mismo contrato que las demás: recibe CVData y emite un HTML A4 autocontenido
 * con .cv-page, @page A4 y escapeHtml. Sin color de acento: el negro es el
 * formato. Los títulos y las etiquetas van solos en su elemento para que
 * localizarCV() los traduzca (lib/cv-generator/idiomas-cv.ts).
 */
import type { CVData } from "./cv-template";
import { escapeHtml } from "./cv-template";

function nivelIdioma(nivel: number): string {
  if (nivel >= 90) return "Nativo";
  if (nivel >= 70) return "Avanzado";
  if (nivel >= 50) return "Intermedio";
  if (nivel >= 30) return "Básico";
  return "Nociones";
}

/** "Etiqueta: valor", solo si hay valor. La etiqueta, sola en su elemento (se traduce). */
const dato = (etiqueta: string, valor: string | undefined) =>
  valor && valor.trim() ? `<p class="dato"><b>${etiqueta}</b>: ${escapeHtml(valor)}</p>` : "";

export function generarCVHTML_Sencilla(data: CVData): string {
  const nombreCompleto = [data.nombre, data.apellidos].filter(Boolean).join(" ");
  const fotoValida = data.fotoUrl && /^(https?:\/\/|data:image\/)/.test(data.fotoUrl);

  const perfilHTML = data.perfilProfesional
    ? `<section><h2>Perfil profesional</h2><p class="perfil">${escapeHtml(data.perfilProfesional).replace(/\n+/g, "<br>")}</p></section>`
    : "";

  const experienciaHTML = data.experiencia?.length
    ? `<section><h2>Experiencia laboral</h2><ul>${data.experiencia.map((e) => {
        const fechas = e.fechas ? `<span class="fecha">[${escapeHtml(e.fechas)}]</span> ` : "";
        const donde = [e.empresa ? `«${escapeHtml(e.empresa)}»` : "", escapeHtml(e.ubicacion)].filter(Boolean).join(", ");
        const tareas = (e.descripcion || []).filter(Boolean);
        return `<li>${fechas}${donde ? `${donde}. ` : ""}<b>${escapeHtml(e.puesto)}</b>.${
          tareas.length ? `<ul class="tareas">${tareas.map((t) => `<li>${escapeHtml(t)}</li>`).join("")}</ul>` : ""
        }</li>`;
      }).join("")}</ul></section>`
    : "";

  const formacionHTML = data.formacion?.length
    ? `<section><h2>Formación</h2><ul>${data.formacion.map((f) => {
        const donde = [f.centro, f.ubicacion].filter(Boolean).map((s) => escapeHtml(s)).join(", ");
        return `<li><b>${escapeHtml(f.titulo)}</b>${donde ? `, ${donde}` : ""}.</li>`;
      }).join("")}</ul></section>`
    : "";

  const idiomasHTML = data.idiomas?.length
    ? `<section><h2>Idiomas</h2><ul class="dos">${data.idiomas.map((i) => `<li>${escapeHtml(i.nombre)}: ${nivelIdioma(i.nivel)}</li>`).join("")}</ul></section>`
    : "";

  const aptitudesHTML = data.aptitudes?.length
    ? `<section><h2>Aptitudes</h2><ul class="dos">${data.aptitudes.map((a) => `<li>${escapeHtml(a)}</li>`).join("")}</ul></section>`
    : "";

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<style>
  @page { size: A4 portrait; margin: 0; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #ffffff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .cv-page {
    max-width: 210mm; min-height: 297mm; margin: 0 auto; padding: 18mm 20mm;
    background: #ffffff; color: #111;
    font-family: Arial, Helvetica, sans-serif; font-size: 11pt; line-height: 1.5;
  }
  .cabecera { display: flex; gap: 22px; align-items: flex-start; }
  .cab-texto { flex: 1; min-width: 0; }
  h1 { margin: 0 0 14px; text-align: center; font-size: 21pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
  .foto { width: 100px; height: 128px; object-fit: cover; border: 1px solid #bbb; flex-shrink: 0; }
  h2 {
    margin: 18px 0 8px; font-size: 11.5pt; font-weight: 700; font-style: italic;
    text-transform: uppercase; text-decoration: underline; text-underline-offset: 3px;
  }
  .cab-texto h2 { margin-top: 0; }
  .dato { margin: 0 0 4px; }
  .perfil { margin: 0; text-align: justify; }
  ul { margin: 0; padding-left: 22px; }
  li { margin-bottom: 6px; }
  .fecha { font-weight: 700; }
  ul.tareas { margin-top: 3px; list-style: circle; }
  ul.tareas li { margin-bottom: 2px; font-size: 10.5pt; }
  /* Idiomas y aptitudes son listas cortas: en dos columnas cabe todo en una hoja. */
  ul.dos { columns: 2; column-gap: 28px; }
  ul.dos li { break-inside: avoid; }
</style>
</head>
<body>
  <div class="cv-page">
    <div class="cabecera">
      <div class="cab-texto">
        <h1>Currículum vitae</h1>
        <h2>Datos personales</h2>
        ${dato("Nombre y apellidos", nombreCompleto || "Tu nombre")}
        ${dato("Profesión", data.subtitulo)}
        ${dato("Localidad", data.ciudad)}
        ${dato("Teléfono", data.telefono)}
        ${dato("Correo electrónico", data.email)}
      </div>
      ${fotoValida ? `<img class="foto" src="${escapeHtml(data.fotoUrl)}" alt="Foto" />` : ""}
    </div>
    ${perfilHTML}
    ${experienciaHTML}
    ${formacionHTML}
    ${idiomasHTML}
    ${aptitudesHTML}
  </div>
</body>
</html>`;
}
