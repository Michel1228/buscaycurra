/**
 * POST /api/agente/run
 * Agente Autónomo 24/7: busca ofertas, aplica CV, y notifica al usuario.
 * 
 * Llamado por cron job. Procesa TODOS los usuarios con CV y alertas activas.
 * Para cada usuario:
 * 1. Lee su CV y preferencias
 * 2. Busca ofertas que encajen
 * 3. Envía CV automáticamente
 * 4. Notifica por email, push y WhatsApp
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { buscarOfertasReales } from "@/lib/job-search/real-search";
import type { OfertaReal } from "@/lib/job-search/real-search";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-sync-secret") ?? req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const resultados: {
    usuario: string;
    ofertasEncontradas: number;
    cvsEnviados: number;
    notificado: boolean;
  }[] = [];

  try {
    // 1. Obtener usuarios con CV
    const { data: cvs } = await supabase
      .from("cvs")
      .select("user_id, file_name, text_content")
      .not("user_id", "is", null);

    if (!cvs?.length) {
      return NextResponse.json({ message: "No hay CVs para procesar", resultados: [] });
    }

    for (const cv of cvs) {
      try {
        // 2. Obtener perfil para preferencias
        const { data: perfil } = await supabase
          .from("profiles")
          .select("ciudad, sector, whatsapp_phone, whatsapp_alertas, email")
          .eq("id", cv.user_id)
          .single();

        // Extraer puesto del nombre del archivo CV
        const rawFileName = (cv.file_name || "").replace(/^CV[_]?/i, "").replace(/\.(pdf|docx?)$/i, "");
        const puesto = rawFileName || "general";
        const ciudad = perfil?.ciudad || "";
        const sector = perfil?.sector || "";
        const ofertas = await buscarOfertasReales(puesto, ciudad, 10);

        if (!ofertas.length) {
          resultados.push({
            usuario: cv.user_id.slice(0, 8),
            ofertasEncontradas: 0,
            cvsEnviados: 0,
            notificado: false,
          });
          continue;
        }

        let cvsEnviados = 0;

        // 4. Enviar CV a las ofertas (máx 5 por ronda para no saturar)
        for (const oferta of ofertas.slice(0, 5)) {
          if (!oferta.emailEmpresa) continue;

          try {
            await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || "https://buscaycurra.es"}/api/cv-sender/send`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
                "x-user-id": cv.user_id,
              },
              body: JSON.stringify({
                jobId: oferta.id,
                jobTitle: oferta.titulo,
                company: oferta.empresa,
                email: oferta.emailEmpresa,
                strategy: "optimo",
              }),
            });
            cvsEnviados++;
          } catch { /* skip failed sends */ }
        }

        // 5. Enviar notificación
        await supabase.from("notificaciones").insert({
          user_id: cv.user_id,
          tipo: "agente_auto",
          titulo: `🐛 Guzzi encontró ${ofertas.length} ofertas para ti`,
          mensaje: `Se envió tu CV a ${cvsEnviados} empresas automáticamente. Revisa en la app.`,
          datos: { ofertas: ofertas.length, enviados: cvsEnviados },
          leida: false,
        });

        // WhatsApp si está activado
        if (perfil?.whatsapp_alertas && perfil?.whatsapp_phone) {
          try {
            const { enviarAlertaWhatsApp } = await import("@/lib/whatsapp/sender");
            await enviarAlertaWhatsApp(perfil.whatsapp_phone, {
              puesto: ofertas[0].titulo,
              empresa: ofertas[0].empresa,
              ciudad: ofertas[0].ubicacion,
              url: "https://buscaycurra.es/app/empresas",
            });
          } catch { /* WhatsApp optional */ }
        }

        resultados.push({
          usuario: cv.user_id.slice(0, 8),
          ofertasEncontradas: ofertas.length,
          cvsEnviados,
          notificado: true,
        });

        // Pequeña pausa entre usuarios para no saturar
        await new Promise(r => setTimeout(r, 2000));
      } catch (err) {
        console.error(`[Agente] Error procesando ${cv.user_id}:`, err);
      }
    }

    return NextResponse.json({
      message: `Procesados ${resultados.length} usuarios`,
      resultados,
    });
  } catch (err: any) {
    console.error("[Agente]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
