/**
 * lib/job-scraper.ts — Módulo de scraping de ofertas de trabajo
 *
 * Busca ofertas en las principales plataformas de empleo españolas:
 * InfoJobs, LinkedIn, Indeed, Tecnoempleo y Computrabajo.
 *
 * En producción, cada función realizaría el scraping real con herramientas
 * como Playwright o Puppeteer. Por ahora devuelve datos de ejemplo
 * para desarrollo y pruebas de integración.
 *
 * Colores de marca: azul #2563EB y naranja #F97316.
 */

import type { OfertaTrabajo } from "./cache/job-cache";

// ─── Función principal de scraping ───────────────────────────────────────────

/**
 * Busca ofertas de trabajo en todas las plataformas disponibles.
 *
 * @param keyword  - Palabra clave de búsqueda (ej: "electricista")
 * @param location - Ubicación (ej: "Madrid")
 * @returns        Array de ofertas de trabajo encontradas
 */
export async function buscarOfertas(
  keyword: string,
  location: string
): Promise<OfertaTrabajo[]> {
  console.log(`🔍 Scraper iniciado: "${keyword}" en "${location}"`);

  // En producción aquí iría el scraping real de cada plataforma.
  // Por ahora generamos datos de ejemplo para desarrollo.
  const ofertas: OfertaTrabajo[] = generarOfertasEjemplo(keyword, location);

  console.log(`✅ Scraper: ${ofertas.length} ofertas encontradas`);
  return ofertas;
}

// ─── Generador de datos de ejemplo ───────────────────────────────────────────

/**
 * Genera un array de ofertas de ejemplo para desarrollo.
 * Se reemplazará por el scraper real en producción.
 */
function generarOfertasEjemplo(keyword: string, location: string): OfertaTrabajo[] {
  const fuentes = ["InfoJobs", "LinkedIn", "Indeed", "Tecnoempleo", "Computrabajo"];
  const modalidades: Array<"presencial" | "remoto" | "hibrido"> = [
    "presencial",
    "remoto",
    "hibrido",
  ];

  return Array.from({ length: 8 }, (_, i) => ({
    id: `oferta-${Date.now()}-${i}`,
    titulo: `${keyword} — Posición ${i + 1}`,
    empresa: `Empresa Ejemplo ${i + 1} S.L.`,
    ubicacion: location || "España",
    descripcion: `Buscamos un profesional con experiencia en ${keyword} para unirse a nuestro equipo. Ofrecemos buen ambiente de trabajo y posibilidades de crecimiento.`,
    url: `https://www.infojobs.net/ejemplo-${i + 1}`,
    fechaPublicacion: new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    salario: i % 3 === 0 ? `${18000 + i * 2000}€ - ${22000 + i * 2000}€/año` : undefined,
    modalidad: modalidades[i % modalidades.length],
    fuente: fuentes[i % fuentes.length],
  }));
}
