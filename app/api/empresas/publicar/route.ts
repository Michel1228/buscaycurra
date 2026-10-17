/**
 * POST /api/empresas/publicar — Las empresas nos mandan una oferta.
 * Se guarda en oferta_empresa (pendiente de revisar) y se avisa al equipo.
 */

import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { sendOfertaEmpresaAvisoEmail } from "@/lib/email/smtp-sender";
import { getUserId } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  // Autenticación obligatoria
  const userId = await getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json() as {
      empresa?: string;
      emailEmpresa?: string;
      webEmpresa?: string;
      titulo?: string;
      sector?: string;
      ciudad?: string;
      jornada?: string;
      salario?: string;
      descripcion?: string;
      requisitos?: string;
    };

    const { empresa, emailEmpresa, titulo, ciudad } = body;

    if (!empresa?.trim() || !emailEmpresa?.trim() || !titulo?.trim() || !ciudad?.trim()) {
      return NextResponse.json({ error: "Campos obligatorios: empresa, email, título, ciudad" }, { status: 400 });
    }

    // Validación de input
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailEmpresa.trim())) {
      return NextResponse.json({ error: "Email de empresa no válido" }, { status: 400 });
    }
    if (empresa.trim().length > 100) {
      return NextResponse.json({ error: "Nombre de empresa demasiado largo (máx 100)" }, { status: 400 });
    }
    if ((body.descripcion || "").length > 5000) {
      return NextResponse.json({ error: "Descripción demasiado larga (máx 5000 caracteres)" }, { status: 400 });
    }
    if (titulo.trim().length > 200) {
      return NextResponse.json({ error: "Título demasiado largo (máx 200)" }, { status: 400 });
    }

    // SE GUARDA EN NUESTRA BASE Y SE AVISA AL EQUIPO (17 oct 2026).
    //
    // Antes se guardaba en la tabla "ofertas_empresas" de Supabase, que no
    // existe: toda empresa que publicaba recibía "Error guardando la oferta".
    // Y la página prometía "publicada en minutos" y que Guzzi la metería en
    // las búsquedas, cosa que nunca hizo. Ahora la oferta queda guardada como
    // pendiente, nos llega un correo con sus datos y se le dice a la empresa
    // lo que de verdad pasa: la revisamos y le contestamos.
    const pool = getPool();
    await pool.query(`
      CREATE TABLE IF NOT EXISTS oferta_empresa (
        id            BIGSERIAL PRIMARY KEY,
        user_id       UUID NOT NULL,
        empresa       TEXT NOT NULL,
        email_empresa TEXT NOT NULL,
        web_empresa   TEXT,
        titulo        TEXT NOT NULL,
        sector        TEXT,
        ciudad        TEXT NOT NULL,
        jornada       TEXT,
        salario       TEXT,
        descripcion   TEXT,
        requisitos    TEXT,
        estado        TEXT NOT NULL DEFAULT 'pendiente',
        creada_en     TIMESTAMPTZ NOT NULL DEFAULT now()
      )`);
    const oferta = {
      empresa: empresa.trim(),
      emailEmpresa: emailEmpresa.trim(),
      webEmpresa: body.webEmpresa?.trim().slice(0, 300) || null,
      titulo: titulo.trim(),
      sector: body.sector?.trim().slice(0, 100) || null,
      ciudad: ciudad.trim().slice(0, 100),
      jornada: body.jornada?.trim().slice(0, 50) || null,
      salario: body.salario?.trim().slice(0, 100) || null,
      descripcion: body.descripcion?.trim() || null,
      requisitos: body.requisitos?.trim().slice(0, 3000) || null,
    };
    const { rows } = await pool.query<{ id: string }>(
      `INSERT INTO oferta_empresa (user_id, empresa, email_empresa, web_empresa, titulo, sector, ciudad, jornada, salario, descripcion, requisitos)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
      [userId, oferta.empresa, oferta.emailEmpresa, oferta.webEmpresa, oferta.titulo, oferta.sector, oferta.ciudad,
        oferta.jornada, oferta.salario, oferta.descripcion, oferta.requisitos]
    );

    // El aviso al equipo. Si no sale, la oferta queda guardada igual.
    const admins = (process.env.ADMIN_EMAILS || process.env.NEXT_PUBLIC_ADMIN_EMAIL || "")
      .split(",").map((e) => e.trim()).filter(Boolean);
    for (const admin of admins) {
      await sendOfertaEmpresaAvisoEmail({ adminEmail: admin, id: rows[0].id, ...oferta })
        .catch((e) => console.error("[empresas/publicar] aviso:", (e as Error).message));
    }

    return NextResponse.json({
      success: true,
      message: `Oferta recibida. La revisamos y te contestamos a ${oferta.emailEmpresa}.`,
    }, { status: 201 });

  } catch (err) {
    console.error("[empresas/publicar] Error:", (err as Error).message);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
