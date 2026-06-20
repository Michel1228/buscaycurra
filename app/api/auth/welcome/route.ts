import { NextRequest, NextResponse } from "next/server";
import { sendWelcomeEmail } from "@/lib/email/smtp-sender";
import { getPool } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { email, nombre, ciudad, userId } = await req.json() as {
      email?: string; nombre?: string; ciudad?: string; userId?: string;
    };
    if (!email || !nombre) {
      return NextResponse.json({ error: "email y nombre requeridos" }, { status: 400 });
    }

    // 1. Enviar email de bienvenida
    await sendWelcomeEmail(email, nombre);

    // 2. Si hay ciudad y userId, guardar en user_contacts + crear alerta
    if (ciudad && userId) {
      const pool = getPool();
      try {
        // Guardar datos de contacto para futuras notificaciones (email/WhatsApp)
        await pool.query(
          `INSERT INTO user_contacts (user_id, email, full_name, whatsapp_alertas)
           VALUES ($1, $2, $3, false)
           ON CONFLICT (user_id) DO UPDATE SET email = $2, full_name = $3, updated_at = NOW()`,
          [userId, email, nombre]
        );

        // Crear alerta automática para la ciudad
        await pool.query(
          `INSERT INTO job_alerts (user_id, keyword, location, frequency, active)
           VALUES ($1, '', $2, 'daily', true)`,
          [userId, ciudad.trim()]
        );
      } catch (dbErr) {
        console.error("[welcome] Error guardando contactos/alerta:", (dbErr as Error).message);
        // No bloqueamos — el email ya se envió
      }
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
