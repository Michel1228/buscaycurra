/**
 * lib/guzzi/renovacion.ts — "¿Cómo renuevo el CAP?", "¿cuándo me caduca la TPC?".
 *
 * Se contesta con la ficha de renovación verificada (lib/cursos/tipos.ts) y,
 * si la persona tiene el carné guardado, con SU fecha de caducidad. Antes esto
 * lo contestaba el modelo de memoria, que es justo como se publica un plazo
 * inventado (en la ficha del vigilante ponía que la TIP no caduca, y caduca a
 * los 10 años).
 *
 * Si no se reconoce el carné, devuelve null y sigue el flujo de siempre. El
 * carné de conducir no entra: lo renueva la DGT y no es lo mismo que el CAP.
 */
import { fichasDePlaza } from "@/lib/cursos/plazas/emparejar";
import { tipoPorSlug, tiposConRenovacion } from "@/lib/cursos/tipos";
import { carnesDe, type Carne } from "@/lib/cursos/carnes";

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export function preguntaPorRenovacion(texto: string): boolean {
  const t = norm(texto);
  // Con límite de palabra: "convencer" no es "vence". Y las ofertas caducadas son otra cosa.
  return /\b(renov|renuev|caduc|vencimiento|vence\b|vencid|reciclaj|reciclar)/.test(t) && !/\bofertas?\b/.test(t);
}

/** El carné con renovación que se nombra en el texto, o null. */
export function carneEnTexto(texto: string): string | null {
  const t = norm(texto);
  // El carné de conducir lo renueva la DGT; solo es el CAP si se dice.
  if (/conducir/.test(t) && !/\bcap\b|profesional/.test(t)) return null;
  const conRenovacion = new Set(tiposConRenovacion("ES").map(x => x.slug));
  const ficha = fichasDePlaza(texto).find(s => conRenovacion.has(s));
  if (ficha) return ficha;
  if (/vigilante|\btip\b|seguridad privada/.test(t)) return "vigilante-seguridad";
  if (/soldad/.test(t)) return "soldadura";
  return null;
}

const fechaEs = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

function cuantoQueda(caduca: string): string {
  const dias = Math.round((new Date(`${caduca}T00:00:00Z`).getTime() - new Date(new Date().toISOString().slice(0, 10) + "T00:00:00Z").getTime()) / 86400000);
  if (dias < 0) return "ya ha caducado";
  if (dias > 730) return `te quedan ${Math.floor(dias / 365)} años`;
  if (dias > 60) return `te quedan ${Math.round(dias / 30.44)} meses`;
  return dias === 1 ? "te queda 1 día" : `te quedan ${dias} días`;
}

const nombre = (slug: string) => { const t = tipoPorSlug(slug, "ES"); return t?.renovacion?.que ?? t?.nombre ?? slug; };

export async function respuestaRenovacion(texto: string, userId: string | null): Promise<string | null> {
  if (!preguntaPorRenovacion(texto)) return null;
  const slug = carneEnTexto(texto);
  const mios: Carne[] = userId ? await carnesDe(userId).catch(() => []) : [];

  if (!slug) {
    // "¿Cuándo me caducan los carnés?" sin decir cuál: los suyos, si los tiene guardados.
    if (!/carn|tarjeta|certificad|homolog/.test(norm(texto))) return null;
    if (mios.length) {
      return "📅 **Tus carnés guardados:**\n\n"
        + mios.map(c => `- **${nombre(c.curso_slug)}**: caduca el ${fechaEs(c.caduca_en)} (${cuantoQueda(c.caduca_en)}).`).join("\n")
        + "\n\n👉 [Ver mis carnés](/app/formacion/mis-cursos)";
    }
    return "¿De qué carné me hablas? Tengo los plazos confirmados de estos:\n\n"
      + tiposConRenovacion("ES").map(t => `- **${t.renovacion!.que ?? t.nombre}**: ${t.renovacion!.cada.toLowerCase()}`).join("\n")
      + "\n\n👉 [Ver cómo se renueva cada uno](/app/formacion/renovar)";
  }

  const t = tipoPorSlug(slug, "ES");
  const r = t?.renovacion;
  if (!t || !r) return null;
  const mio = mios.find(c => c.curso_slug === slug);

  return `🔄 **${r.que ?? t.nombre}: se renueva ${r.cada.toLowerCase()}.**\n\n`
    + r.casillas.map(c => `- **${c.titulo}:** ${c.texto}`).join("\n")
    + (r.donde ? `\n\n📍 Dónde: [${r.donde.nombre}](${r.donde.url})` : "")
    + (mio
      ? `\n\n📅 **El tuyo caduca el ${fechaEs(mio.caduca_en)}** (${cuantoQueda(mio.caduca_en)}).`
      : `\n\nSi ya lo tienes, guárdalo con la fecha en que lo sacaste y te aviso antes de que caduque.`)
    + `\n\n👉 [Ver la ficha de renovación](/app/formacion/${slug}#renovacion)`
    + `\n\n_Fuente: [${r.fuentes[0].titulo}](${r.fuentes[0].url})_`;
}
