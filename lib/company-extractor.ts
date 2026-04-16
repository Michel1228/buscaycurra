/**
 * lib/company-extractor.ts — Extractor de información de empresas
 *
 * Analiza la web de una empresa para encontrar:
 *   - Nombre de la empresa
 *   - Email de RRHH o contacto
 *   - Teléfono de contacto
 *   - Página de empleo interna
 *
 * En producción usaría Puppeteer/Playwright para hacer scraping real
 * y la IA de Gemini para analizar el HTML y extraer los datos.
 * Por ahora incluye una versión de ejemplo para desarrollo.
 *
 * Colores de marca: azul #2563EB y naranja #F97316.
 */

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface DatosEmpresa {
  nombre: string;
  emailRrhh?: string;
  telefono?: string;
  paginaEmpleo?: string;
}

// ─── Función principal ────────────────────────────────────────────────────────

/**
 * Extrae información de contacto y empleo de la web de una empresa.
 *
 * @param url - URL de la empresa a analizar
 * @returns   Datos extraídos de la empresa
 */
export async function extraerInfoEmpresa(url: string): Promise<DatosEmpresa> {
  console.log(`🏢 Extractor: analizando ${url}`);

  // Extraer nombre de dominio para usarlo como nombre por defecto
  const nombreDesdeUrl = extraerNombreDesdeUrl(url);

  // En producción aquí iría el scraping real con Playwright + Gemini.
  // Por ahora devolvemos datos de ejemplo.
  const datos: DatosEmpresa = {
    nombre: nombreDesdeUrl,
    emailRrhh: `rrhh@${new URL(url).hostname}`,
    telefono: undefined, // Se obtendría del scraping real
    paginaEmpleo: `${url.replace(/\/$/, "")}/empleos`,
  };

  console.log(`✅ Extractor: datos obtenidos para ${datos.nombre}`);
  return datos;
}

// ─── Funciones auxiliares ─────────────────────────────────────────────────────

/**
 * Extrae un nombre legible a partir de la URL de la empresa.
 * Ej: "https://www.acmecorp.com/about" → "Acmecorp"
 */
function extraerNombreDesdeUrl(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    // Eliminar www. y TLD, capitalizar la primera letra
    const nombre = hostname
      .replace(/^www\./, "")
      .split(".")[0]
      .replace(/-/g, " ");
    return nombre.charAt(0).toUpperCase() + nombre.slice(1);
  } catch {
    return "Empresa desconocida";
  }
}
