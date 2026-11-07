/**
 * /api/cv/pdf-template — El CV en PDF, generado con Chromium en el servidor.
 *
 * POST  → genera el PDF y lo devuelve. Es lo que usa el navegador de siempre.
 * POST con {paraVisor:true} → lo guarda unos minutos y devuelve un identificador.
 * GET  ?id=…                → sirve ese PDF ya generado, para verlo en pantalla.
 *
 * POR QUÉ HACEN FALTA LAS DOS ÚLTIMAS. En el iPhone no había manera de bajar el
 * CV: la app es un WKWebView y ahí Apple bloquea las dos vías habituales — el
 * atributo `download` de un enlace se ignora, y navegar a una URL `data:` está
 * prohibido desde 2018 por seguridad. Se intentó con las dos y ninguna funciona.
 *
 * Lo que sí funciona es servir el PDF desde una dirección normal y con
 * `Content-Disposition: inline`. Con `attachment`, iOS intenta descargarlo y no
 * puede; con `inline` abre el visor del propio teléfono, y desde ahí el usuario
 * lo guarda en Archivos o lo comparte con el botón de siempre.
 *
 * El PDF se guarda diez minutos en Redis y luego caduca: no es
 * almacenamiento, es un pañuelo de usar y tirar. Lo protege el azar del enlace
 * (ver GET más abajo).
 */
import { NextRequest, NextResponse } from "next/server";
import { generateCVPdf } from "@/lib/cv-generator/generate-pdf";
import { getUserId, correoSinVerificar } from "@/lib/auth-server";
import { Redis } from "ioredis";
import { randomBytes } from "crypto";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Cuánto vive el PDF guardado: lo justo para abrirlo, guardarlo y compartirlo. */
const SEGUNDOS_VIDA = 600;

/**
 * Lo que ve la persona si el enlace falla. Esta dirección se abre en el
 * navegador del teléfono, fuera de la app: un {"error":...} ahí parece que la
 * aplicación se ha roto. Mejor una frase que diga qué hacer.
 */
function paginaDeAviso(titulo: string, texto: string, status: number): NextResponse {
  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${titulo} — BuscayCurra</title></head>
<body style="margin:0;background:#0f1117;color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
<main style="max-width:460px;margin:0 auto;padding:64px 20px;text-align:center;">
<p style="font-size:40px;margin:0 0 12px;">🐛</p>
<h1 style="font-size:21px;margin:0 0 12px;">${titulo}</h1>
<p style="color:#94a3b8;font-size:15px;line-height:1.6;margin:0;">${texto}</p>
</main></body></html>`;
  return new NextResponse(html, { status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
}

let redis: Redis | null = null;
function getRedis(): Redis | null {
  if (redis) return redis;
  try {
    // Misma configuracion que lib/places-quota.ts, que lleva tiempo
    // funcionando. Con enableOfflineQueue en false fallaba con "Stream isn't
    // writeable": rechazaba la peticion antes de que la conexion estuviera
    // lista, en vez de esperarla.
    redis = new Redis(process.env.REDIS_URL || "redis://buscaycurra-redis:6379", {
      maxRetriesPerRequest: 2,
      connectTimeout: 3000,
      lazyConnect: true,
    });
    redis.on("error", () => { /* sin Redis, quien llama devuelve 503 */ });
    redis.connect().catch(() => { redis = null; });
    return redis;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const sinVerificar = await correoSinVerificar(req);
  if (sinVerificar) return sinVerificar;
  try {
    // Exigir sesión: antes era público → cualquiera podía lanzar Chromium (hasta 60s)
    // renderizando HTML arbitrario con carga de recursos externos (DoS/SSRF).
    const userId = await getUserId(req);
    if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { html, paraVisor } = await req.json() as { html?: string; paraVisor?: boolean };

    if (!html || html.length < 100) {
      return NextResponse.json({ error: "HTML requerido" }, { status: 400 });
    }

    const pdfBuffer = await generateCVPdf(html);

    // Vía del iPhone: se guarda y se devuelve el identificador para abrirlo.
    if (paraVisor) {
      const r = getRedis();
      if (!r) {
        return NextResponse.json({ error: "Visor no disponible ahora mismo" }, { status: 503 });
      }
      // El id del usuario va dentro de la clave: nadie puede recoger el CV de otro.
      const id = `${userId}:${randomBytes(16).toString("hex")}`;
      await r.setex(`cv:pdf:${id}`, SEGUNDOS_VIDA, Buffer.from(pdfBuffer).toString("base64"));
      return NextResponse.json({ id });
    }

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="CV_BuscayCurra.pdf"',
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[pdf-template]", (err as Error).message);
    return NextResponse.json({ error: "Error generando PDF" }, { status: 500 });
  }
}

/**
 * Sirve un PDF ya generado, para verlo en el visor del teléfono.
 *
 * Va con `inline` a propósito, no con `attachment`: es justo lo que permite que
 * iOS lo abra en vez de intentar (y no poder) descargarlo.
 *
 * AQUÍ NO SE PUEDE EXIGIR SESIÓN, y eso era el fallo. Esta dirección la abre
 * `window.open(..., "_blank")`, que en la app nativa sale FUERA del WebView: el
 * navegador del sistema no lleva ni la cabecera de sesión ni las cookies de la
 * aplicación. Resultado, comprobado en producción el 2 oct 2026: la página se
 * abría con {"error":"No autorizado"} y nadie podía bajarse su CV desde el
 * móvil. Michel: "intento descargar, abre una página y da error".
 *
 * Lo que protege el PDF es el propio enlace: lleva 32 caracteres al azar (128
 * bits) que solo conoce quien acaba de generarlo, y caduca a los diez minutos.
 * Adivinarlo no es posible.
 */
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id") || "";
  if (!/^[\w-]+:[a-f0-9]{32}$/.test(id)) {
    return paginaDeAviso("Este enlace no es válido", "Vuelve a la aplicación y pulsa otra vez el botón del PDF.", 400);
  }

  const r = getRedis();
  if (!r) return paginaDeAviso("Ahora mismo no se puede abrir el PDF", "Vuelve a la aplicación y prueba dentro de un momento.", 503);

  const guardado = await r.get(`cv:pdf:${id}`);
  // Cada petición queda anotada: si un teléfono vuelve a enseñar un PDF vacío,
  // aquí se ve quién lo pidió, cuántas veces y si lo encontró.
  console.log(`[pdf-template] GET ${guardado ? "servido" : "NO ENCONTRADO"} · ${(req.headers.get("user-agent") || "").slice(0, 90)}`);
  if (!guardado) {
    return paginaDeAviso("Este PDF ya ha caducado", "Vuelve a la aplicación y pulsa otra vez el botón del PDF: se genera uno nuevo al momento.", 404);
  }

  // NO SE BORRA AL SERVIRLO, y eso era el segundo fallo.
  //
  // Antes era de un solo uso. Pero el teléfono pide el mismo PDF más de una
  // vez: Android le pasa la descarga a su gestor de descargas, que lo vuelve a
  // pedir por su cuenta, y en el iPhone "Guardar en Archivos" o "Compartir"
  // también lo vuelven a pedir. La primera petición lo borraba y la segunda se
  // llevaba un error con nombre de PDF: un "CV_BuscayCurra.pdf" que se abría
  // vacío. Michel, 2 oct 2026: "ahora hay un PDF, pero sale sin datos".
  // Caduca solo a los diez minutos; el azar del enlace sigue siendo lo que lo
  // protege, como cualquier enlace de descarga firmado.

  return new NextResponse(new Uint8Array(Buffer.from(guardado, "base64")), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="CV_BuscayCurra.pdf"',
      "Cache-Control": "no-store",
    },
  });
}
