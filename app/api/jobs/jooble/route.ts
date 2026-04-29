/**
 * /api/jobs/jooble — Proxy seguro para Jooble API
 * La API key se lee del servidor, nunca expuesta al cliente.
 * GET/POST: { keywords, location }
 */

import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const JOOBLE_API_KEY = process.env.JOOBLE_API_KEY;

export async function POST(request: NextRequest) {
  if (!JOOBLE_API_KEY) {
    return NextResponse.json({ error: "Jooble no configurado" }, { status: 503 });
  }

  try {
    const body = await request.json() as { keywords?: string; location?: string };
    const keywords = body.keywords || "";
    const location = body.location || "Spain";

    const res = await fetch(`https://jooble.org/api/${JOOBLE_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keywords, location }),
      signal: AbortSignal.timeout(12000),
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Jooble no disponible" }, { status: 502 });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[jobs/jooble] Error:", (error as Error).message);
    return NextResponse.json({ error: "Error al consultar Jooble" }, { status: 500 });
  }
}

// También permitir GET para compatibilidad
export async function GET(request: NextRequest) {
  if (!JOOBLE_API_KEY) {
    return NextResponse.json({ error: "Jooble no configurado" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const keywords = searchParams.get("keywords") || "";
  const location = searchParams.get("location") || "Spain";

  try {
    const res = await fetch(`https://jooble.org/api/${JOOBLE_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keywords, location }),
      signal: AbortSignal.timeout(12000),
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Jooble no disponible" }, { status: 502 });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[jobs/jooble] Error:", (error as Error).message);
    return NextResponse.json({ error: "Error al consultar Jooble" }, { status: 500 });
  }
}
