/**
 * POST /api/jobs/jooble — Proxy server-side para Jooble API
 *
 * El cliente llama a este endpoint en lugar de llamar a Jooble directamente,
 * así la API key nunca se expone en el bundle del navegador.
 */

import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const apiKey = process.env.JOOBLE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ jobs: [] }, { status: 200 });
  }

  try {
    const body = await req.json();

    const res = await fetch(`https://jooble.org/api/${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(12000),
    });

    if (!res.ok) return NextResponse.json({ jobs: [] }, { status: 200 });

    const data = await res.json();
    return NextResponse.json({ jobs: data.jobs || [] });
  } catch {
    return NextResponse.json({ jobs: [] }, { status: 200 });
  }
}
