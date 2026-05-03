import { NextRequest, NextResponse } from "next/server";
import { sendWelcomeEmail } from "@/lib/email/smtp-sender";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { email, nombre } = await req.json() as { email?: string; nombre?: string };
    if (!email || !nombre) {
      return NextResponse.json({ error: "email y nombre requeridos" }, { status: 400 });
    }
    await sendWelcomeEmail(email, nombre);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
