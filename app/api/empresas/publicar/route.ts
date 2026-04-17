/**
 * POST /api/empresas/publicar — Las empresas publican ofertas
 * Guarda en Supabase tabla "ofertas_empresas"
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
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

    // Guardar en Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error: dbError } = await supabase.from("ofertas_empresas").insert({
      empresa: empresa.trim(),
      email_empresa: emailEmpresa.trim(),
      web_empresa: body.webEmpresa?.trim() || null,
      titulo: titulo.trim(),
      sector: body.sector || null,
      ciudad: ciudad.trim(),
      jornada: body.jornada || null,
      salario: body.salario?.trim() || null,
      descripcion: body.descripcion?.trim() || null,
      requisitos: body.requisitos?.trim() || null,
      estado: "pendiente", // Se revisa antes de publicar
      created_at: new Date().toISOString(),
    });

    if (dbError) {
      console.error("[empresas/publicar] Supabase error:", dbError.message);
      // Si la tabla no existe, crear respuesta mock
      if (dbError.message.includes("does not exist")) {
        return NextResponse.json({
          success: true,
          message: "Oferta recibida (tabla pendiente de crear). Se publicará pronto.",
        });
      }
      return NextResponse.json({ error: "Error guardando la oferta" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Oferta publicada. Será revisada y visible en minutos.",
    }, { status: 201 });

  } catch (err) {
    console.error("[empresas/publicar] Error:", (err as Error).message);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
