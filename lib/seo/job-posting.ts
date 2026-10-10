/**
 * lib/seo/job-posting.ts — Lo que se le dice a Google de cada oferta (JobPosting).
 *
 * POR QUÉ. El 10 oct 2026 Search Console avisó de un problema CRÍTICO en los
 * datos estructurados de ofertas: "Falta el campo name (en hiringOrganization)".
 * Medido ese día: 6.316 ofertas activas de España no tienen empresa real (vacía
 * o con un relleno como "Empresa"), entre ellas las 920 de Lanbide y SEF Murcia,
 * que no dicen quién contrata. La página mandaba esa empresa vacía, y un
 * JobPosting sin empresa no vale para Google Empleo. Inventar una ("Lanbide")
 * sería mentir: Lanbide no contrata. Sin empresa real, no hay JobPosting.
 *
 * Y el país: todas las ofertas se declaraban en España ("ES"), también las de
 * Alemania o Estados Unidos. Ahora va el de la oferta, en el código que pide
 * schema.org (ISO 3166-1: Reino Unido es "GB", no "UK").
 */

/** Textos de relleno que no son una empresa. */
const NO_ES_EMPRESA = new Set([
  "", "empresa", "ver en oferta", "confidencial", "empresa confidencial", "confidential",
  "company", "n/a", "na", "sin especificar", "no especificado", "-", ".",
]);

/** El nombre de la empresa si es de verdad una empresa; si no, null. */
export function empresaParaGoogle(company: string | null | undefined): string | null {
  const c = (company ?? "").trim();
  return NO_ES_EMPRESA.has(c.toLowerCase()) ? null : c;
}

/** País de la oferta en ISO 3166-1 alfa-2. Sin país conocido, null (mejor no decirlo que decir uno falso). */
export function paisISO(country: string | null | undefined): string | null {
  const c = (country ?? "").trim().toUpperCase();
  if (c === "UK") return "GB";
  return /^[A-Z]{2}$/.test(c) ? c : null;
}

export interface OfertaParaGoogle {
  title: string | null;
  description: string | null;
  company: string | null;
  city: string | null;
  province?: string | null;
  country: string | null;
  createdAt: Date | string | null;
  expiresAt?: Date | string | null;
}

/**
 * El JobPosting de una oferta, o null si le falta algo que Google exige
 * (empresa, país, título). Mejor no marcarla que marcarla mal: un JobPosting
 * inválido cuenta como error del sitio entero en Search Console.
 */
export function jobPostingDe(o: OfertaParaGoogle): Record<string, unknown> | null {
  const empresa = empresaParaGoogle(o.company);
  const pais = paisISO(o.country);
  const titulo = (o.title ?? "").trim();
  if (!empresa || !pais || !titulo) return null;

  const fecha = o.createdAt ? new Date(o.createdAt) : null;
  const caduca = o.expiresAt ? new Date(o.expiresAt) : null;

  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: titulo,
    description: o.description?.slice(0, 5000) || titulo,
    datePosted: (fecha && !isNaN(+fecha) ? fecha : new Date()).toISOString(),
    // Google usa validThrough para retirar la oferta de Google Empleo cuando
    // vence. Sin este campo se queda ahí indefinidamente aunque esté cerrada.
    ...(caduca && !isNaN(+caduca) && { validThrough: caduca.toISOString() }),
    hiringOrganization: { "@type": "Organization", name: empresa },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        ...(o.city && { addressLocality: o.city }),
        ...(o.province && { addressRegion: o.province }),
        addressCountry: pais,
      },
    },
  };
}
