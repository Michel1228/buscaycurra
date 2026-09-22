/**
 * /novedades/rss.xml — El canal de novedades.
 *
 * Sirve para que quien quiera enterarse no dependa de acordarse de entrar, y
 * para que las herramientas de prensa y los agregadores recojan las campañas
 * solos. Se genera del mismo sitio que la web (lib/novedades/contenido.ts), así
 * que no hay forma de que se quede desfasado respecto a las páginas.
 */
import { novedadesOrdenadas } from "@/lib/novedades/contenido";

const BASE = "https://buscaycurra.es";

/** Escapa lo que rompería el XML. Sin esto, un "&" en un título tumba el canal. */
function escapar(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET() {
  const novedades = novedadesOrdenadas();

  const items = novedades
    .map((n) => {
      // Las fechas del RSS van en formato de correo (RFC 822), en GMT.
      const fecha = new Date(`${n.fecha}T09:00:00Z`).toUTCString();
      return `    <item>
      <title>${escapar(n.titulo)}</title>
      <link>${BASE}/novedades/${n.slug}</link>
      <guid isPermaLink="true">${BASE}/novedades/${n.slug}</guid>
      <pubDate>${fecha}</pubDate>
      <description>${escapar(n.resumen)}</description>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Novedades de BuscayCurra</title>
    <link>${BASE}/novedades</link>
    <atom:link href="${BASE}/novedades/rss.xml" rel="self" type="application/rss+xml" />
    <description>Mejoras del producto y campañas de BuscayCurra.</description>
    <language>es-ES</language>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      // Media hora de caché: es contenido que cambia cada pocos días.
      "Cache-Control": "public, max-age=1800",
    },
  });
}
