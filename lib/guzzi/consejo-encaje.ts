/**
 * lib/guzzi/consejo-encaje.ts — «Encajas aquí por esto» y «te daría ventaja esto».
 *
 * POR QUÉ (3 nov 2026, idea de Michel). Guzzi decía qué empresa había en la foto
 * y qué ofertas tenía, pero no qué tenía que ver con quien la hacía. LinkedIn pone
 * en cada oferta lo que cumples, lo que te falta y un curso para lo que falta; con
 * la foto de un negocio no lo hace nadie.
 *
 * Sin IA y sin servidor: se comparan los puestos de ese negocio (o el título de la
 * oferta) con los puestos de su CV, y se mira qué curso piden para esos puestos que
 * su CV no nombre. Todo sale del CV y de las fichas de cursos; nada se adorna. Los
 * cursos, con la regla estricta de lib/cursos/curso-para-puesto.ts: solo el que
 * piden para ese puesto, nunca uno que no hace falta.
 */
import { patronesDelCv, patronDelTitulo } from "@/lib/job-search/puestos-del-cv";
import { cursoParaPuesto } from "@/lib/cursos/curso-para-puesto";
import { fichasDePlaza } from "@/lib/cursos/plazas/emparejar";

export interface Encaje {
  /** Puestos de aquí que ya ha trabajado: el de aquí, el suyo tal cual y dónde. */
  encaja: { puesto: string; suyo: string; empresa: string | null }[];
  /** Un curso que piden para alguno de estos puestos y que su CV no nombra. */
  curso: { slug: string; nombre: string; obligatorio: boolean; para: string } | null;
}

const texto = (v: unknown): string => (typeof v === "string" ? v.trim() : "");

/** Lo que ha hecho, con dónde: cada experiencia y el título del CV. */
function suyos(cv: Record<string, unknown>): { suyo: string; empresa: string | null }[] {
  const salida: { suyo: string; empresa: string | null }[] = [];
  if (Array.isArray(cv.experiencia)) {
    for (const e of cv.experiencia as Record<string, unknown>[]) {
      const p = texto(e?.puesto);
      if (p) salida.push({ suyo: p, empresa: texto(e?.empresa) || null });
    }
  }
  const titulo = texto(cv.subtitulo) || texto(cv.puesto);
  if (titulo) salida.push({ suyo: titulo, empresa: null });
  return salida;
}

/** ¿Es el mismo oficio? En las dos direcciones: "reponedor" y "Reponedora de lineales". */
function mismoOficio(a: string, b: string): boolean {
  const ra = patronesDelCv({ subtitulo: a }, 3);
  const rb = patronesDelCv({ subtitulo: b }, 3);
  return (ra.length > 0 && patronDelTitulo(b, ra) >= 0) || (rb.length > 0 && patronDelTitulo(a, rb) >= 0);
}

export function encajeConPuestos(cv: unknown, puestos: string[], pais = "ES"): Encaje | null {
  if (!cv || typeof cv !== "object") return null;
  const c = cv as Record<string, unknown>;
  const lista = [...new Set(puestos.map((p) => p.trim()).filter((p) => p.length >= 3))].slice(0, 4);
  if (!lista.length) return null;

  const loHecho = suyos(c);
  const encaja: Encaje["encaja"] = [];
  for (const puesto of lista) {
    const m = loHecho.find((s) => mismoOficio(puesto, s.suyo));
    if (m && !encaja.some((e) => e.suyo === m.suyo)) encaja.push({ puesto, ...m });
  }

  // El curso: el obligatorio por ley primero, y nunca uno que su CV ya nombra.
  const yaLoTiene = new Set(fichasDePlaza(JSON.stringify(c)));
  let curso: Encaje["curso"] = null;
  for (const puesto of lista) {
    const tipo = cursoParaPuesto(puesto, pais);
    if (!tipo || yaLoTiene.has(tipo.slug)) continue;
    if (!curso || (tipo.obligatorioLegal && !curso.obligatorio)) {
      curso = { slug: tipo.slug, nombre: tipo.nombre, obligatorio: tipo.obligatorioLegal, para: puesto };
    }
  }
  return { encaja, curso };
}

/**
 * Las líneas para el chat. Sin CV: que lo suba para poder decírselo. Con CV y sin
 * nada en común, lo que suelen pedir aquí, sin inventarle experiencia.
 */
export function textoEncaje(e: Encaje | null, puestos: string[], hayCv: boolean): string {
  const lista = [...new Set(puestos.map((p) => p.trim().toLowerCase()).filter((p) => p.length >= 3))].slice(0, 3);
  if (!hayCv) {
    return lista.length ? `📄 Aquí suelen buscar **${lista.join(", ")}**. Si subes tu CV, te digo si encajas y qué te daría ventaja.` : "";
  }
  if (!e) return "";
  const lineas: string[] = [];
  if (e.encaja.length) {
    const [a, b] = e.encaja;
    const dondeA = a.empresa ? ` en ${a.empresa}` : "";
    lineas.push(`✅ **Encajas aquí:** has trabajado de ${a.suyo.toLowerCase()}${dondeA}${b ? ` y de ${b.suyo.toLowerCase()}` : ""}, y aquí buscan ${a.puesto.toLowerCase()}. Destácalo en tu CV y nómbralo al presentarte.`);
  } else if (lista.length) {
    lineas.push(`💡 Aquí suelen buscar **${lista.join(", ")}**, y en tu CV no aparece. Si lo has hecho alguna vez, aunque fuera poco tiempo, añádelo antes de mandarlo.`);
  }
  if (e.curso) {
    const porque = `lo piden para ${e.curso.para.toLowerCase()}${e.curso.obligatorio ? " (es un curso obligatorio por ley)" : ""}`;
    lineas.push(`🎓 **Te daría ventaja:** ${e.curso.nombre}: ${porque} y tu CV no lo nombra. Si ya lo tienes, ponlo en tu CV. [Dónde sacarlo](/cursos/${e.curso.slug})`);
  }
  return lineas.join("\n");
}
