/**
 * GET /api/company/foto?ref=<photo_reference>
 *
 * Sirve una foto de Google Places SIN exponer la API key.
 * La URL oficial de Places lleva `key=<API_KEY>` dentro, así que si la
 * pintáramos directamente en un <img src> del cliente, la clave quedaría
 * visible en el HTML y cualquiera podría gastarnos la cuota.
 * Aquí la petición sale del servidor y al navegador solo le llegan los bytes.
 */
import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth-server";
import { getPlacePhotoUrl } from "@/lib/google-places";

export const dynamic = "force-dynamic";

// photo_reference de Google: cadena larga en base64url. Acotamos el formato para
// que este endpoint no se pueda usar como proxy genérico hacia otras URLs.
const REF_VALIDA = /^[A-Za-z0-9_\-]{20,600}$/;

export async function GET(request: NextRequest) {
  if (!(await getUserId(request))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const ref = request.nextUrl.searchParams.get("ref") || "";
  if (!REF_VALIDA.test(ref)) {
    return NextResponse.json({ error: "Referencia de foto no válida" }, { status: 400 });
  }

  if (!process.env.GOOGLE_PLACES_API_KEY) {
    return NextResponse.json({ error: "API de Google Places no configurada" }, { status: 503 });
  }

  try {
    const res = await fetch(getPlacePhotoUrl(ref, 640), {
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Foto no disponible" }, { status: 404 });
    }

    const tipo = res.headers.get("content-type") || "";
    if (!tipo.startsWith("image/")) {
      return NextResponse.json({ error: "Respuesta no es una imagen" }, { status: 502 });
    }

    return new NextResponse(await res.arrayBuffer(), {
      headers: {
        "Content-Type": tipo,
        // Las fotos de un local no cambian: cachear fuerte ahorra llamadas de pago.
        "Cache-Control": "private, max-age=86400, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "No se pudo cargar la foto" }, { status: 502 });
  }
}
