import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getPool } from "@/lib/db";

export const dynamic = "force-dynamic";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

const RESEND_URL = "https://api.resend.com/emails";
const FROM = "Guzzi de BuscayCurra <noreply@buscaycurra.es>";
const APP_URL = "https://buscaycurra.es";

async function enviarEmail(
  email: string,
  nombre: string,
  puesto: string,
  ofertas: Array<{ titulo: string; empresa: string; ubicacion: string }>,
) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const filas = ofertas.map(o => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #2a2a1f;">
        <div style="font-size:15px;font-weight:bold;color:#f0ebe0;">${o.titulo}</div>
        <div style="font-size:13px;color:#7ed56f;margin-top:2px;">${o.empresa}
          <span style="color:#504a3a;font-weight:normal;"> &middot; ${o.ubicacion}</span>
        </div>
      </td>
    </tr>`).join("");

  const html = `
<div style="font-family:-apple-system,Arial,sans-serif;max-width:520px;margin:0 auto;background:#1a1a12;color:#f0ebe0;border-radius:16px;overflow:hidden;">
  <div style="background:linear-gradient(135deg,#0a0f07,#1a1a12);padding:32px;text-align:center;">
    <div style="font-size:52px;line-height:1;">&#x1F40D;</div>
    <h1 style="color:#7ed56f;margin:12px 0 6px;font-size:22px;letter-spacing:-0.5px;">
      Guzzi encontro ${ofertas.length} nuevas ofertas para ti
    </h1>
    <p style="color:#706a58;margin:0;font-size:14px;">
      Hola <strong style="color:#f0ebe0;">${nombre || "campeon"}</strong>,
      hay ofertas nuevas de <strong style="color:#f0c040;">${puesto}</strong> desde ayer.
    </p>
  </div>
  <div style="padding:24px 32px;">
    <table style="width:100%;border-collapse:collapse;">${filas}</table>
    <div style="text-align:center;margin:28px 0 8px;">
      <a href="${APP_URL}/app/gusi"
         style="display:inline-block;background:linear-gradient(135deg,#7ed56f,#5cb848);color:#0a0f07;font-weight:bold;font-size:15px;padding:14px 32px;border-radius:12px;text-decoration:none;">
        Ver todas con Guzzi &#x1F98B;
      </a>
    </div>
  </div>
  <div style="padding:16px 32px 24px;text-align:center;border-top:1px solid #2a2a1f;">
    <p style="font-size:11px;color:#3d3c30;margin:0;">
      BuscayCurra &middot; buscaycurra.es<br>
      Recibes esto porque tienes una busqueda activa de <em>${puesto}</em>
    </p>
  </div>
</div>`;

  await fetch(RESEND_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: FROM,
      to: [email],
      subject: `Guzzi encontro ${ofertas.length} nuevas ofertas de ${puesto}`,
      html,
    }),
  });
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET || "buscaycurra-cron-2025";
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Usuarios activos con busqueda configurada (excluir mariposas)
    const supabase = getSupabase();
    const { data: perfiles } = await supabase
      .from("profiles")
      .select("id, full_name, puesto_objetivo")
      .not("puesto_objetivo", "is", null)
      .neq("puesto_objetivo", "")
      .or("oruga_stage.is.null,oruga_stage.lt.4");

    if (!perfiles?.length) {
      return NextResponse.json({ ok: true, enviados: 0, msg: "Sin usuarios activos" });
    }

    // 2. Mapa de emails via auth admin
    const { data: authData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    const emailMap = new Map(
      (authData?.users || []).map(u => [u.id, u.email as string])
    );

    const pool = getPool();
    let enviados = 0;

    for (const perfil of perfiles) {
      const email = emailMap.get(perfil.id);
      if (!email) continue;

      const puesto = perfil.puesto_objetivo as string;
      const nombre = ((perfil.full_name as string) || "").split(" ")[0];
      const keyword = puesto.split(" ")[0];

      // 3. Ofertas nuevas de las ultimas 24h en BD local
      const { rows } = await pool.query<{
        title: string; company: string; city: string; province: string;
      }>(
        `SELECT title, company, city, province
         FROM "JobListing"
         WHERE "isActive" = true
           AND LOWER(title) LIKE LOWER($1)
           AND scrapedat >= NOW() - INTERVAL '24 hours'
         LIMIT 5`,
        [`%${keyword}%`]
      );

      if (rows.length < 2) continue;

      const ofertas = rows.map(r => ({
        titulo: r.title,
        empresa: r.company || "Ver en oferta",
        ubicacion: r.city || r.province || "Espana",
      }));

      await enviarEmail(email, nombre, puesto, ofertas);
      enviados++;
    }

    return NextResponse.json({ ok: true, enviados, total: perfiles.length });
  } catch (err) {
    console.error("[Retention] Error:", (err as Error).message);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
