/**
 * SEPE Empléate Scraper
 * Empléate (https://empleate.gob.es) es el portal público de empleo del SEPE.
 * No tiene API pública, pero las ofertas se cargan como JSON embebido en el HTML.
 * 
 * Estrategia: scrapeamos la página de búsqueda que devuelve datos en un <script> tag.
 * Las ofertas del SEPE son gratuitas y públicas — agregarlas es legal.
 * 
 * NOTA: El SEPE puede tener Cloudflare/anti-bot. Si falla, este módulo
 * retorna array vacío sin romper el sync.
 */

const EMPLEATE_URL = "https://empleate.gob.es";

interface SepeOffer {
  id: string;
  titulo: string;
  empresa: string;
  ciudad: string;
  provincia: string;
  descripcion: string;
  url: string;
  fechaPublicacion: string;
  numeroPlazas: number;
  contrato: string;
}

/**
 * Busca ofertas en Empléate por keyword
 */
export async function searchSepe(keyword: string): Promise<SepeOffer[]> {
  try {
    const url = `${EMPLEATE_URL}/buscar-ofertas?keyword=${encodeURIComponent(keyword)}`;
    
    const res = await fetch(url, {
      headers: {
        "User-Agent": "BuscayCurra/2.0 (job-search-aggregator; https://buscaycurra.es)",
        "Accept": "text/html,application/json",
        "Accept-Language": "es-ES,es;q=0.9",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) return [];

    const html = await res.text();

    // Empléate guarda datos en window.__INITIAL_STATE__ o en un <script type="application/json">
    // Buscar el blob JSON en el HTML
    const jsonMatch = html.match(/window\.__INITIAL_STATE__\s*=\s*(\{[^}]*\})/) ||
                      html.match(/<script[^>]*type="application\/json"[^>]*>([^<]+)<\/script>/) ||
                      html.match(/"ofertas"\s*:\s*(\[[^\]]*\])/);

    if (!jsonMatch) return [];

    const data = JSON.parse(jsonMatch[1]);
    const ofertas = data?.ofertas || data?.results || data?.data || [];

    if (!Array.isArray(ofertas)) return [];

    return ofertas.slice(0, 50).map((o: any) => ({
      id: `sepe_${o.id || o.codigo || o.referencia}`,
      titulo: o.titulo || o.denominacion || o.nombre || "",
      empresa: o.empresa || o.entidad || "SEPE Empléate",
      ciudad: o.localidad || o.municipio || "",
      provincia: o.provincia || "",
      descripcion: o.descripcion || o.funciones || o.tareas || "",
      url: o.url || `${EMPLEATE_URL}/oferta/${o.id || ""}`,
      fechaPublicacion: o.fechaPublicacion || o.fecha || "",
      numeroPlazas: o.numeroPlazas || o.plazas || 1,
      contrato: o.tipoContrato || o.contrato || "",
    }));
  } catch {
    return [];
  }
}

/**
 * Keywords optimizadas para Empléate (más genéricas, mejor cobertura)
 */
export const SEPE_KEYWORDS = [
  "camarero", "cocinero", "limpieza", "conductor", "electricista",
  "dependiente", "programador", "enfermero", "administrativo", "mecanico",
  "albañil", "soldador", "fontanero", "cuidador", "operario",
  "repartidor", "cajero", "vendedor", "auxiliar", "mozo",
  "encargado", "gerente", "analista", "diseñador", "profesor",
  "medico", "farmaceutico", "psicologo", "abogado", "arquitecto",
];
