/**
 * lib/cursos/sugerencia-cv.ts — Qué curso encaja con lo que dice tu CV.
 *
 * POR QUÉ (12 oct 2026, idea de Michel). Quien sube su CV ya nos ha contado en
 * qué ha trabajado. Si ha sido camarera y en su CV no aparece el manipulador de
 * alimentos, que es obligatorio para ese puesto, se lo decimos en cuanto haya
 * una plaza gratis cerca: "Veo en tu CV que has trabajado de camarera…".
 *
 * LA MISMA REGLA ESTRICTA QUE EL CORREO DE OFERTAS (lib/cursos/curso-para-puesto.ts):
 * solo cuenta un puesto que ES el de la ficha o lo contiene entero. "Conductor"
 * a secas no dispara el CAP: un taxista no lo necesita. Recomendar un curso que
 * no hace falta le cuesta a la persona tiempo o dinero.
 *
 * NO SE RECOMIENDA LO QUE YA TIENE. Si el CV menciona el curso en cualquier
 * parte (formación, aptitudes o tareas), se da por sabido. Se prefiere callar
 * a sugerirle a alguien el carné de carretillero que ya usa a diario.
 *
 * A QUIEN YA TRABAJA DE ELLO, EL TÍTULO POR EXPERIENCIA. En la primera prueba
 * (12 oct 2026) se le sugería el curso de soldadura a un oficial soldador. Si
 * el curso se puede acreditar con experiencia (PEAC) y la persona ha trabajado
 * de eso, lo útil es decirle que con su experiencia puede sacarse el
 * certificado oficial sin volver a clase. Ahí solo cuenta como "ya lo tiene"
 * si el certificado sale en su formación: trabajar de gerocultora no quiere
 * decir tener el título.
 *
 * Sin dependencias de servidor: se prueba en el sello con CVs inventados.
 */
import { cursoParaPuesto } from "@/lib/cursos/curso-para-puesto";
import { fichasDePlaza } from "@/lib/cursos/plazas/emparejar";

/** Lo que se lee del CV (user_cvs.form_data). Todo opcional: cada CV es de su padre y de su madre. */
export interface CvParaSugerir {
  subtitulo?: unknown;
  puesto?: unknown;
  experiencia?: unknown;
  formacion?: unknown;
  aptitudes?: unknown;
  habilidades?: unknown;
  perfil?: unknown;
  perfilProfesional?: unknown;
}

export interface CursoQueEncaja {
  slug: string;
  nombre: string;
  obligatorio: boolean;
  /** El puesto tal como lo escribió la persona ("Camarera de sala"). */
  puesto: string;
  /** Dónde, si salió de la experiencia. */
  empresa: string | null;
  /** true si lo ha trabajado; false si solo es el título de su CV. */
  trabajado: boolean;
  /** Los puestos que piden el curso, para contar ofertas. */
  puestosQueLoPiden: string[];
  /** Ha trabajado de ello y el curso se acredita con experiencia (PEAC). */
  viaExperiencia: boolean;
}

const texto = (v: unknown): string => (typeof v === "string" ? v.trim() : "");

/** Cursos que encajan con el CV, los obligatorios por ley primero. */
export function cursosQueEncajan(cv: CvParaSugerir | null | undefined): CursoQueEncaja[] {
  if (!cv || typeof cv !== "object") return [];
  // Lo que ya tiene: el curso nombrado en cualquier parte del CV, o, para la
  // vía de la experiencia, en su formación y aptitudes.
  const yaLoTiene = new Set(fichasDePlaza(JSON.stringify(cv)));
  const enSuFormacion = new Set(fichasDePlaza(JSON.stringify([cv.formacion, cv.aptitudes, cv.habilidades])));

  const candidatos: { puesto: string; empresa: string | null; trabajado: boolean }[] = [];
  if (Array.isArray(cv.experiencia)) {
    for (const e of cv.experiencia as Record<string, unknown>[]) {
      const puesto = texto(e?.puesto);
      if (puesto) candidatos.push({ puesto, empresa: texto(e?.empresa) || null, trabajado: true });
    }
  }
  for (const p of [cv.subtitulo, cv.puesto]) {
    const puesto = texto(p);
    if (puesto) candidatos.push({ puesto, empresa: null, trabajado: false });
  }

  const vistos = new Set<string>();
  const salida: CursoQueEncaja[] = [];
  for (const c of candidatos) {
    const tipo = cursoParaPuesto(c.puesto);
    if (!tipo || vistos.has(tipo.slug)) continue;
    const viaExperiencia = c.trabajado && tipo.acreditablePorExperiencia === true;
    if (viaExperiencia ? enSuFormacion.has(tipo.slug) : yaLoTiene.has(tipo.slug)) continue;
    vistos.add(tipo.slug);
    salida.push({
      slug: tipo.slug,
      nombre: tipo.nombre,
      obligatorio: tipo.obligatorioLegal,
      puesto: c.puesto,
      empresa: c.empresa,
      trabajado: c.trabajado,
      puestosQueLoPiden: tipo.puestos,
      viaExperiencia,
    });
  }
  return salida.sort((a, b) => Number(b.obligatorio) - Number(a.obligatorio));
}

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
function fechaLarga(iso: string): string {
  const [, m, d] = iso.split("-").map(Number);
  return `${d} de ${MESES[m - 1]}`;
}

export interface PlazaParaAviso {
  titulo: string;
  municipio: string | null;
  provincia: string | null;
  inicio: string;
  horas: number | null;
  modalidad: string | null;
}

/**
 * El aviso, con la razón a la vista: qué hemos visto en su CV, qué le falta,
 * dónde sacarlo y para cuántas ofertas le sirve. Todo dato sale de su CV, de
 * la plaza o de un recuento; nada se adorna.
 */
export function textoSugerencia(
  c: CursoQueEncaja,
  plaza: PlazaParaAviso | null,
  ofertas: { total: number; zona: string } | null
): { titulo: string; mensaje: string } {
  const puesto = c.puesto.toLowerCase();
  if (c.viaExperiencia) {
    return {
      titulo: `Tu experiencia puede valer un título oficial: ${c.nombre}`,
      mensaje: `Veo en tu CV que has trabajado de ${puesto}${c.empresa ? ` en ${c.empresa}` : ""}. `
        + `Si aún no tienes el certificado oficial de ${c.nombre}, con esa experiencia puedes conseguirlo sin volver a clase: `
        + `se llama acreditación de competencias y es un procedimiento oficial. Te contamos los requisitos y los pasos.`,
    };
  }
  const visto = c.trabajado
    ? `Veo en tu CV que has trabajado de ${puesto}${c.empresa ? ` en ${c.empresa}` : ""}.`
    : `Tu CV es de ${puesto}.`;
  const falta = c.obligatorio
    ? `Para ese trabajo es obligatorio el curso de ${c.nombre} y en tu CV no aparece.`
    : `Para ese trabajo piden mucho el curso de ${c.nombre} y en tu CV no aparece.`;
  let donde: string;
  if (plaza) {
    const lugar = plaza.modalidad === "online" ? "online" : `en ${[plaza.municipio, plaza.provincia].filter(Boolean).join(", ")}`;
    donde = `Hay una plaza gratis ${lugar}: «${plaza.titulo}», empieza el ${fechaLarga(plaza.inicio)}${plaza.horas ? ` (${plaza.horas} h)` : ""}.`;
  } else {
    donde = "En la ficha del curso tienes dónde sacarlo gratis.";
  }
  const suma = ofertas && ofertas.total > 0
    ? ` Ahora mismo hay ${ofertas.total.toLocaleString("es-ES")} ofertas en ${ofertas.zona} de trabajos que piden este curso.`
    : "";
  return {
    titulo: `Un curso que encaja con tu CV: ${c.nombre}`,
    mensaje: `${visto} ${falta} ${donde}${suma}`,
  };
}
