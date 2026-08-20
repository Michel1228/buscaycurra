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
 * El PDF se guarda cinco minutos en Redis y se borra al servirlo: no es
 * almacenamiento, es un pañuelo de usar y tirar. Y solo lo puede recoger quien
 * lo generó, porque el identificador lleva dentro el id del usuario.
 */
import { NextRequest, NextResponse } from "next/server";
import { generateCVPdf } from "@/lib/cv-generator/generate-pdf";
import { getUserId } from "@/lib/auth-server";
import { Redis } from "ioredis";
import { randomBytes } from "crypto";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Cuánto vive el PDF guardado. Lo justo para abrirlo. */
const SEGUNDOS_VIDA = 300;

let redis: Redis | null = null;
function getRedis(): Redis | null {
  if (redis) return redis;
  try {
    redis = new Redis(process.env.REDIS_URL || "redis://buscaycurra-redis:6379", {
      maxRetriesPerRequest: 2,
      lazyConnect: false,
      enableOfflineQueue: false,
    });
    redis.on("error", () => { /* sin Redis se sigue por la vía normal */ });
    return redis;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
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
 */
export async function GET(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id") || "";
  // El identificador tiene que empezar por el id de quien pide: así nadie
  // recoge el CV de otro aunque adivine el resto.
  if (!id.startsWith(`${userId}:`) || !/^[\w-]+:[a-f0-9]{32}$/.test(id)) {
    return NextResponse.json({ error: "Identificador no válido" }, { status: 400 });
  }

  const r = getRedis();
  if (!r) return NextResponse.json({ error: "Visor no disponible" }, { status: 503 });

  const guardado = await r.get(`cv:pdf:${id}`);
  if (!guardado) {
    return NextResponse.json({ error: "El PDF ha caducado. Vuelve a generarlo." }, { status: 404 });
  }
  // Un solo uso: se borra al servirlo.
  await r.del(`cv:pdf:${id}`);

  return new NextResponse(new Uint8Array(Buffer.from(guardado, "base64")), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="CV_BuscayCurra.pdf"',
      "Cache-Control": "no-store",
    },
  });
}
