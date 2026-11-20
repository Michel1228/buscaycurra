/**
 * lib/cv-generator/descargar-pdf.ts (navegador)
 * Bajarse el CV en PDF, desde donde sea y en el aparato que sea.
 *
 * POR QUÉ ESTÁ AQUÍ Y NO EN CADA PANTALLA. Había dos botones de "descargar" con
 * dos caminos distintos y los dos fallaban en el móvil:
 *
 *   · El del editor abría una página con {"error":"No autorizado"}, porque el
 *     enlace del PDF se abre fuera del WebView y allí no hay sesión.
 *   · El de "CVs guardados" hacía `window.open("")` y escribía el HTML dentro
 *     para lanzar la ventana de imprimir. En el móvil esa ventana no se abre y
 *     el botón no hacía absolutamente nada, sin decir por qué.
 *
 * Ahora los dos pasan por aquí: el servidor monta el PDF con Chromium y, según
 * dónde estemos, se descarga o se abre en el visor del teléfono.
 */
import { isNative as esNativo, plataforma } from "@/lib/utils/platform";

/**
 * EN ANDROID EL PDF TIENE QUE SALIR DE LA APP (20 nov 2026, Michel: "no
 * descarga los currículos"). El registro del servidor lo enseñaba: el PDF se
 * servía, pero a la propia app ("; wv)" en el navegador que lo pedía). El
 * visor interno de Android no sabe enseñar un PDF ni lo pasa a descargas: la
 * pantalla se quedaba igual y no pasaba nada. En el iPhone sí lo enseña.
 *
 * La app de Android abre en Chrome todo enlace cuyo dominio no sea el suyo
 * (Bridge.launchIntent de Capacitor compara el dominio exacto). Con "www."
 * delante, Chrome lo abre, la web lo redirige al dominio de siempre y Chrome
 * enseña o guarda el PDF. No hace falta publicar otra versión de la app.
 */
const DOMINIO_FUERA_DE_LA_APP = "https://www.buscaycurra.es";

/**
 * Devuelve null si ha ido bien, o un texto que explique el fallo para
 * enseñárselo a la persona. Nunca lanza: un botón de descarga que no dice nada
 * es justo lo que había antes.
 */
export async function descargarCVComoPDF(html: string, token: string, nombre = "CV_BuscayCurra"): Promise<string | null> {
  if (!html || html.length < 100) return "Todavía no hay CV que descargar.";

  try {
    // EN EL MÓVIL, por el visor del sistema. Dentro del WebView de la app no
    // funcionan ni el atributo `download` de un enlace ni las URL `blob:`.
    if (esNativo()) {
      const res = await fetch("/api/cv/pdf-template", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ html, paraVisor: true }),
      });
      if (!res.ok) return mensajeDeError(res.status);
      const { id } = await res.json() as { id?: string };
      if (!id) return "No se ha podido preparar el PDF. Inténtalo otra vez.";
      // Fuera del WebView: por eso ese enlace no pide sesión, va firmado por su
      // propio azar (ver app/api/cv/pdf-template).
      const ruta = `/api/cv/pdf-template?id=${encodeURIComponent(id)}`;
      if (plataforma() === "android") {
        window.location.href = `${DOMINIO_FUERA_DE_LA_APP}${ruta}`;
        return null;
      }
      window.open(ruta, "_blank");
      return null;
    }

    const res = await fetch("/api/cv/pdf-template", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ html }),
    });
    if (!res.ok) return mensajeDeError(res.status);

    const url = URL.createObjectURL(await res.blob());
    const a = document.createElement("a");
    a.href = url;
    a.download = `${nombre.replace(/[^\w\s.-]/g, "").trim() || "CV_BuscayCurra"}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // Se espera antes de revocar: en algunos navegadores, revocar de inmediato
    // cancela la descarga que acaba de empezar.
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    return null;
  } catch {
    return "No hay conexión para generar el PDF. Inténtalo en un momento.";
  }
}

function mensajeDeError(status: number): string {
  if (status === 401) return "Se ha cerrado tu sesión. Vuelve a entrar y prueba otra vez.";
  if (status === 503) return "Ahora mismo no podemos generar el PDF. Prueba dentro de un rato.";
  return "No se ha podido generar el PDF. Inténtalo otra vez.";
}
