/**
 * POST /api/jobs/jooble — Proxy server-side para Jooble API
 *
 * El cliente llama a este endpoint en lugar de llamar a Jooble directamente,
 * así la API key nunca se expone en el bundle del navegador.
 * Rate limited: 30 peticiones por minuto por IP.
 */

import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Rate limit en memoria: 30 peticiones/min por IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60_000; // 1 min
const RATE_LIMIT_MAX = 30;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  // Rate limit por IP
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
            req.headers.get("x-real-ip") || "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Demasiadas peticiones. Intenta de nuevo en un minuto." },
      { status: 429 }
    );
  }

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
