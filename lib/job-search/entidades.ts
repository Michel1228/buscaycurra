/**
 * lib/job-search/entidades.ts
 * Quita las entidades HTML del texto que devuelven las APIs de empleo.
 *
 * POR QUÉ. Careerjet (y alguna otra) manda "&euro;1802 per month" o
 * "Johnson &amp; Johnson", y se guardaba tal cual. La pantalla lo enseñaba
 * literal: a 30 sep 2026 había 68.425 sueldos con "&euro;" y 30.499 con
 * "&pound;" en ofertas vivas, y se veían así en /trabajar-en/es/camarero.
 */

const NOMBRADAS: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  euro: "€", pound: "£", yen: "¥", cent: "¢", copy: "©", reg: "®", deg: "°",
  ndash: "–", mdash: "—", hellip: "…", bull: "•", middot: "·",
  lsquo: "‘", rsquo: "’", ldquo: "“", rdquo: "”", laquo: "«", raquo: "»",
  aacute: "á", eacute: "é", iacute: "í", oacute: "ó", uacute: "ú", ntilde: "ñ",
  Aacute: "Á", Eacute: "É", Iacute: "Í", Oacute: "Ó", Uacute: "Ú", Ntilde: "Ñ",
  agrave: "à", egrave: "è", igrave: "ì", ograve: "ò", ugrave: "ù",
  acirc: "â", ecirc: "ê", icirc: "î", ocirc: "ô", ucirc: "û",
  auml: "ä", euml: "ë", iuml: "ï", ouml: "ö", uuml: "ü", Auml: "Ä", Ouml: "Ö", Uuml: "Ü",
  ccedil: "ç", Ccedil: "Ç", szlig: "ß", aring: "å", Aring: "Å", oslash: "ø", Oslash: "Ø",
  aelig: "æ", AElig: "Æ", iexcl: "¡", iquest: "¿", ordf: "ª", ordm: "º",
};

export function sinEntidades(texto: string | null | undefined): string {
  if (!texto) return texto ?? "";
  if (!texto.includes("&")) return texto;
  return texto.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entera, e: string) => {
    if (e[0] === "#") {
      const n = e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(n) && n > 0 && n < 0x110000 ? String.fromCodePoint(n) : entera;
    }
    // Las que no conocemos se dejan como estaban: mejor eso que borrar texto.
    return NOMBRADAS[e] ?? NOMBRADAS[e.toLowerCase()] ?? entera;
  });
}
