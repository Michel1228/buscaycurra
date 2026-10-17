/**
 * lib/guzzi/siguiente-paso.ts — "¿Qué curso me conviene?" contestado con datos.
 *
 * POR QUÉ (17 oct 2026, idea de Michel). Guzzi tiene que tomar la iniciativa:
 * decirle a quien busca trabajo qué curso le falta para lo suyo, o qué curso,
 * sumado a lo que ya tiene, le abre la puerta a más ofertas; enseñarle esas
 * ofertas y negocios de la zona a los que mandar el CV aunque no tengan oferta
 * publicada.
 *
 * TODO SALE DE DATOS. El curso, de su CV o del puesto que nombra, con las
 * mismas reglas estrictas que el aviso por correo (lib/cursos/sugerencia-cv.ts):
 * si el CV ya lo menciona, no se le recomienda. La plaza, de curso_plaza. Las
 * ofertas, un recuento de las que hay ahora en su provincia, el mismo que da el
 * correo. No se promete sueldo: en octubre de 2026 solo 1 de cada 10 ofertas de
 * esos puestos traía salario, y con eso no se puede decir "ganarás más".
 *
 * Además, una pista de una línea al enseñar ofertas (pistaDeCurso): si para
 * ese puesto piden un curso que no está en su CV, se le dice una vez por
 * conversación. No consulta nada: la respuesta completa llega si la pide.
 */
import { cursoParaPuesto, aFormaDeFicha } from "@/lib/cursos/curso-para-puesto";
import { cursosQueEncajan, type CursoQueEncaja, type CvParaSugerir } from "@/lib/cursos/sugerencia-cv";
import { fichasDePlaza, normalizarTitulo } from "@/lib/cursos/plazas/emparejar";
import { PROVINCIAS, nombreProvincia } from "@/lib/cursos/plazas/provincias";
import { fichaEnTexto, provinciaEnTexto } from "@/lib/guzzi/plazas-cursos";

const norm = (t: string) => normalizarTitulo(t).replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
const texto = (v: unknown): string => (typeof v === "string" ? v.trim() : "");

// ─── ¿Lo está pidiendo? ──────────────────────────────────────────────────

const PIDE: RegExp[] = [
  /\b(que|cual|cuales)\s+(curso|cursos|formacion|carnet|carne|titulo|estudios?)\b.*\b(conviene|convendria|recomiendas|recomendarias|aconsejas|deberia|vendria|falta|faltaria|sirve|serviria|hago|haria|saco|sacaria)\b/,
  /\b(recomiendame|aconsejame|sugiereme)\b.*\b(curso|formacion|estudi|carnet|titulo)/,
  /\bque\s+(me\s+)?(falta|faltaria)\s+para\b/,
  /\bque\s+(puedo|deberia|podria)\s+(estudiar|aprender|sacarme|formarme)\b/,
  /\ben\s+que\s+(me\s+)?(puedo\s+|deberia\s+|podria\s+)?formar(me)?\b/,
  /\b(como|que\s+hago\s+para|que\s+necesito\s+para)\s+(puedo\s+|podria\s+)?(conseguir|consigo|consiga|encontrar|encuentro|encuentre|optar\s+a|opto\s+a|aspirar\s+a|tener|tengo)\s+(un\s+|a\s+un\s+)?((trabajo|empleo|puesto|curro)\s+(mejor|de\s+mas|mas\s+estable|mejor\s+pagado)|mejor\s+(trabajo|empleo|puesto|curro))\b/,
  /\b(mejorar|ampliar)\s+(mis\s+)?(opciones|oportunidades|salidas)\b/,
  /\bsiguiente\s+paso\b/,
];

/** "¿Qué curso me conviene?", "¿qué me falta para…?", "¿cómo consigo un trabajo mejor?" */
export function pideSiguientePaso(mensaje: string): boolean {
  // Si nombra un curso ("curso de carretillero en Pamplona") quiere las plazas
  // de ese curso: eso lo contesta lib/guzzi/plazas-cursos.ts.
  if (fichaEnTexto(mensaje)) return false;
  const t = norm(mensaje);
  return PIDE.some((r) => r.test(t));
}

// ─── La pista al enseñar ofertas ─────────────────────────────────────────

const PISTA = "Pregúntame «¿qué curso me conviene para";

/**
 * Lo que se puede decir sin exagerar. La ficha dice qué puestos lo piden y si
 * el curso es obligatorio por ley, pero obligatorio para las tareas que cubre:
 * un mozo de almacén que no lleva la carretilla no necesita el carné.
 */
function loQuePiden(nombre: string, obligatorio: boolean): string {
  return obligatorio
    ? `lo piden mucho: **${nombre}** (obligatorio por ley para esas tareas)`
    : `te hace mejor candidato: **${nombre}**`;
}

/** Una línea, o "". Solo si el curso no está en su CV y no se le ha dicho ya. */
export function pistaDeCurso(
  puesto: string,
  cv: CvParaSugerir | null,
  history: Array<{ role: string; text: string }>
): string {
  const tipo = cursoParaPuesto(puesto);
  if (!tipo) return "";
  // Sin CV no se sabe si lo tiene: solo se avisa de lo que pide la ley.
  if (!cv && !tipo.obligatorioLegal) return "";
  if (cv && fichasDePlaza(JSON.stringify(cv)).includes(tipo.slug)) return "";
  if (history.some((h) => h.role === "gusi" && (h.text || "").includes(PISTA) && h.text.includes(tipo.nombre))) return "";
  const p = puesto.trim().toLowerCase();
  return `\n\n💡 Para trabajar de ${p} ${loQuePiden(tipo.nombre, tipo.obligatorioLegal)}${cv ? ", y en tu CV no aparece" : ""}. `
    + `${PISTA} ${p}?» y te digo dónde sacarlo gratis y a cuántas ofertas te abre la puerta.`;
}

// ─── La respuesta completa ───────────────────────────────────────────────

/** Qué buscar en Google Maps para encontrar negocios donde sirve cada curso. */
const NEGOCIOS_DE_FICHA: Record<string, string> = {
  "manipulador-alimentos": "camarero",
  barista: "camarero",
  "ingles-hosteleria": "cocinero",
  carretillero: "carretillero",
  "plataforma-elevadora": "mantenimiento industrial",
  "tpc-construccion": "albañil",
  "atencion-sociosanitaria-instituciones": "residencias de mayores",
  "atencion-sociosanitaria-domicilio": "ayuda a domicilio",
  "limpieza-industrial": "limpiador",
  "excel-ofimatica": "administrativo",
  "atencion-cliente": "dependiente",
  "cap-conductor-profesional": "conductor",
  "gases-fluorados": "climatización",
  "vigilante-seguridad": "seguridad privada",
  soldadura: "soldador",
};

/** Una oferta como la pinta el chat (con su botón "Enviar CV"). */
export interface OfertaDelChat {
  id: string;
  titulo: string;
  empresa: string;
  ubicacion: string;
  salario: string;
  fuente: string;
  url: string;
  match: number;
}

export interface SiguientePaso {
  reply: string;
  jobs: OfertaDelChat[];
  /** Para buscar negocios de la zona en Google Maps (lo hace la ruta del chat). */
  empresas: { busqueda: string; puesto: string; ciudad: string } | null;
}

export const SIN_CV_NI_PUESTO = "Para decirte qué curso te abre más puertas necesito saber de qué has trabajado. "
  + "[Crea o sube tu CV](/app/curriculum) o dímelo aquí, por ejemplo «soy camarera, ¿qué curso me conviene?», "
  + "y te digo qué te falta, dónde sacarlo gratis y a cuántas ofertas te da acceso.";

/** Código de provincia por el código postal (31500 → Navarra). */
export function provinciaPorCodigoPostal(t: string): string | null {
  const m = t.match(/\b(\d{2})\d{3}\b/);
  return m && PROVINCIAS[m[1]] ? m[1] : null;
}

/** Los puestos que ya tiene: los de su experiencia, el título del CV y el que nombra. */
function puestosPropios(cv: CvParaSugerir | null, extra: string): string[] {
  const l = [extra];
  if (cv) {
    l.push(texto(cv.subtitulo), texto(cv.puesto));
    if (Array.isArray(cv.experiencia)) for (const e of cv.experiencia as Record<string, unknown>[]) l.push(texto(e?.puesto));
  }
  return l.filter(Boolean).map((p) => ` ${aFormaDeFicha(norm(p))} `);
}

/** Los puestos que el curso le abre y que no son ya los suyos. */
export function puestosNuevos(curso: Pick<CursoQueEncaja, "puestosQueLoPiden" | "puesto">, cv: CvParaSugerir | null): string[] {
  const propios = puestosPropios(cv, curso.puesto);
  return curso.puestosQueLoPiden.filter((p) => !propios.some((x) => x.includes(` ${norm(p)} `)));
}

/**
 * Los puestos nuevos para los que el curso habilita de verdad: los que lleva
 * en el nombre ("Carné de carretillero" → carretillero, para quien es mozo).
 * Que el manipulador de alimentos lo pidan también a los cocineros no
 * convierte a una camarera en cocinera: eso no se le dice.
 */
export function puestosQueAbre(curso: Pick<CursoQueEncaja, "puestosQueLoPiden" | "puesto" | "nombre">, cv: CvParaSugerir | null): string[] {
  const nombre = ` ${norm(curso.nombre)} `;
  return puestosNuevos(curso, cv).filter((p) => nombre.includes(` ${norm(p)} `));
}

/** "BILBAO" → "Bilbao" (algunas plazas llegan en mayúsculas). */
function sinMayusculas(t: string | null): string | null {
  return t && t === t.toUpperCase() ? t.toLowerCase().replace(/(^|[\s-])(\p{L})/gu, (_, a: string, b: string) => a + b.toUpperCase()) : t;
}

/** El curso del puesto que nombra en el mensaje, si no lo tiene ya en su CV. */
function cursoDelMensaje(mensaje: string, cv: CvParaSugerir | null): CursoQueEncaja | null {
  const tipo = cursoParaPuesto(mensaje);
  if (!tipo) return null;
  if (cv && fichasDePlaza(JSON.stringify(cv)).includes(tipo.slug)) return null;
  const m = ` ${aFormaDeFicha(norm(mensaje))} `;
  const puesto = tipo.puestos.find((p) => m.includes(` ${norm(p)} `)) ?? tipo.puestos[0];
  return {
    slug: tipo.slug, nombre: tipo.nombre, obligatorio: tipo.obligatorioLegal, puesto,
    empresa: null, trabajado: false, puestosQueLoPiden: tipo.puestos, viaExperiencia: false,
  };
}

/** Un CV recién creado puede estar vacío: eso no es "tener CV". */
export function cvConContenido(cv: CvParaSugerir | null | undefined): CvParaSugerir | null {
  if (!cv || typeof cv !== "object") return null;
  const algo = Object.values(cv).some((v) => (typeof v === "string" ? v.trim().length > 0
    : Array.isArray(v) && v.some((x) => x && typeof x === "object" && Object.values(x).some((y) => typeof y === "string" && y.trim()))));
  return algo ? cv : null;
}

function lista(xs: string[]): string {
  return xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} y ${xs[xs.length - 1]}`;
}

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
function fechaLarga(iso: string): string {
  const [, m, d] = iso.split("-").map(Number);
  return `${d} de ${MESES[m - 1]}`;
}

/**
 * La respuesta, o null si no hay curso que recomendar con lo que sabemos (y
 * entonces contesta el modelo, con su CV delante y el tema de cursos).
 */
export async function respuestaSiguientePaso(p: {
  mensaje: string;
  cv: (CvParaSugerir & { ciudad?: unknown }) | null;
  ciudad: string;
}): Promise<SiguientePaso | null> {
  const cv = cvConContenido(p.cv);
  const delMensaje = cursoDelMensaje(p.mensaje, cv);
  const delCv = cursosQueEncajan(cv);
  const curso = delMensaje ?? delCv[0] ?? null;
  if (!curso) return cv ? null : { reply: SIN_CV_NI_PUESTO, jobs: [], empresas: null };
  const otros = delCv.filter((c) => c.slug !== curso.slug).slice(0, 2);

  const ciudadCv = texto(p.cv?.ciudad);
  const provincia = provinciaEnTexto(p.mensaje) || provinciaEnTexto(`${p.ciudad} ${ciudadCv}`)
    || provinciaPorCodigoPostal(`${p.ciudad} ${ciudadCv}`);
  const zona = provincia ? nombreProvincia(provincia) : null;
  const ciudad = (p.ciudad || ciudadCv).split(",")[0].replace(/\d+/g, "").trim();
  const abre = puestosQueAbre(curso, cv);
  const nuevos = puestosNuevos(curso, cv);
  const suyos = curso.puestosQueLoPiden.filter((x) => !nuevos.includes(x));

  const l: string[] = [`🎯 **Tu siguiente paso: ${curso.nombre}**`, ""];
  const puesto = curso.puesto.toLowerCase();
  const visto = delMensaje ? `Para trabajar de ${puesto}`
    : curso.trabajado ? `Veo en tu CV que has trabajado de ${puesto}${curso.empresa ? ` en ${curso.empresa}` : ""}. Para eso`
    : `Tu CV es de ${puesto}. Para eso`;

  if (curso.viaExperiencia) {
    l.push(`Veo en tu CV que has trabajado de ${puesto}${curso.empresa ? ` en ${curso.empresa}` : ""}. Si aún no tienes el certificado oficial de ${curso.nombre}, `
      + "con esa experiencia puedes conseguirlo sin volver a clase: se llama acreditación de competencias y es un procedimiento oficial y gratuito.");
    l.push("", "👉 [Requisitos y pasos para acreditar tu experiencia](/app/formacion/acreditar)");
  } else {
    l.push(`${visto} ${loQuePiden(curso.nombre, curso.obligatorio)}${cv ? ", y en tu CV no aparece" : ""}.`);

    // La plaza gratis: en su provincia, o una online para su provincia.
    const { buscarPlazas } = await import("@/lib/cursos/plazas/db");
    const { plazaParaEsaPersona } = await import("@/lib/cursos/para-esa-persona");
    let plaza: Awaited<ReturnType<typeof buscarPlazas>>["plazas"][number] | null = null;
    if (provincia) {
      try {
        const para = (r: Awaited<ReturnType<typeof buscarPlazas>>) => r.plazas.find((x) => plazaParaEsaPersona(x, provincia)) ?? null;
        plaza = para(await buscarPlazas({ ficha: curso.slug, provincia, limite: 20 }))
          ?? para(await buscarPlazas({ ficha: curso.slug, modalidad: "online", limite: 50 }));
      } catch (e) {
        console.warn("[siguiente-paso] plazas:", (e as Error).message);
      }
    }
    l.push("");
    if (plaza) {
      const lugar = plaza.modalidad === "online" ? "online" : `en ${[sinMayusculas(plaza.municipio), plaza.provincia ? nombreProvincia(plaza.provincia) : null].filter(Boolean).join(", ")}`;
      l.push(`🎓 Hay una plaza gratis ${lugar}: «${plaza.titulo}», empieza el ${fechaLarga(plaza.inicio)}${plaza.horas ? ` (${plaza.horas} h)` : ""}. `
        + `[Ver la plaza y cómo apuntarte](/app/formacion/plazas?ficha=${curso.slug})`);
    } else {
      l.push(`🎓 Dónde sacarlo gratis, lo que dura y lo que piden: [ficha del ${curso.nombre}](/app/formacion/${curso.slug})`);
    }
  }

  // Las ofertas que lo piden, en su provincia.
  let jobs: OfertaDelChat[] = [];
  if (zona && !curso.viaExperiencia) {
    const { ofertasEnZona, ofertasDeEjemplo } = await import("@/lib/cursos/para-esa-persona");
    const [total, ejemplos] = await Promise.all([
      ofertasEnZona(curso.puestosQueLoPiden, zona).catch(() => 0),
      // Primero las que el curso le abre; si no le abre ninguna, las de lo suyo.
      ofertasDeEjemplo(curso.puestosQueLoPiden, zona, abre.length ? abre : suyos, 3).catch(() => []),
    ]);
    jobs = ejemplos.map((o) => ({
      id: `db-${o.id}`, titulo: o.title, empresa: o.company || "Ver en oferta",
      ubicacion: o.city || o.province || zona, salario: o.salary || "Ver en oferta",
      fuente: o.sourceName || "BuscayCurra", url: o.sourceUrl || "", match: 0,
    }));
    if (total > 0) {
      l.push("", `📋 Ahora mismo hay ${total.toLocaleString("es-ES")} ${total === 1 ? "oferta" : "ofertas"} en ${zona} de trabajos que piden este curso.`
        + (abre.length ? ` Con él puedes optar también a las de ${lista(abre.slice(0, 3))}, no solo a las de lo tuyo.` : "")
        + (jobs.length ? ` Te dejo ${jobs.length === 1 ? "una" : jobs.length} aquí abajo.` : ""));
    }
  } else if (!zona && !curso.viaExperiencia) {
    l.push("", "📍 Dime en qué ciudad buscas y te cuento cuántas ofertas lo piden cerca de ti.");
  }

  if (otros.length) {
    l.push("", `También te encaja${otros.length > 1 ? "n" : ""}: ${lista(otros.map((c) => `[${c.nombre}](/app/formacion/${c.slug})`))}.`);
  }

  const busqueda = NEGOCIOS_DE_FICHA[curso.slug];
  return {
    reply: l.join("\n"),
    jobs,
    empresas: busqueda && ciudad ? { busqueda, puesto, ciudad } : null,
  };
}
