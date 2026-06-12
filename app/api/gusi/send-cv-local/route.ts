/**
 * POST /api/gusi/send-cv-local
 * 
 * Envía un CV real (PDF con plantilla + foto + carta) a un negocio local.
 * Flujo: Google Places info → adaptar CV → generar PDF → enviar email (Resend)
 * 
 * Body: { userId, companyName, companyPhone?, companyEmail?, puesto, adaptedCv, coverLetter }
 * Responde: { success, pdfUrl, sentVia, message }
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY no configurada");
  return new Resend(key);
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const body = await request.json();
    const { userId, companyName, companyPhone, companyEmail, puesto, adaptedCv, coverLetter } = body;

    if (!userId || !companyName) {
      return NextResponse.json({ error: "userId y companyName requeridos" }, { status: 400 });
    }

    // 1. Obtener datos del usuario: perfil + CV + foto
    const { data: profile } = await supabase
      .from("profiles")
      .select("nombre, apellidos, email, telefono, ciudad, avatar_url")
      .eq("id", userId)
      .single();

    const { data: cvs } = await supabase
      .from("user_cvs")
      .select("form_data, nombre")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1);

    const cvData = (cvs?.[0]?.form_data as Record<string, unknown>) || {};
    const userNombre = (profile?.nombre || cvData?.nombre || "Candidato/a") as string;
    const userApellidos = (profile?.apellidos || cvData?.apellidos || "") as string;
    const userEmail = (profile?.email || cvData?.email || "") as string;
    const userTelefono = (profile?.telefono || cvData?.telefono || "") as string;
    const userCiudad = (profile?.ciudad || cvData?.ciudad || "") as string;
    const fotoUrl = (profile?.avatar_url || cvData?.fotoUrl || "") as string;

    // 2. Generar PDF con la plantilla
    const plantillaHTML = generarPlantillaPDF({
      nombre: userNombre + " " + userApellidos,
      email: userEmail,
      telefono: userTelefono,
      ciudad: userCiudad,
      fotoUrl,
      puestoAdaptado: puesto || companyName,
      cartaPresentacion: coverLetter || adaptedCv || "",
      empresaNombre: companyName,
      experiencia: adaptedCv || "",
      habilidades: "Trabajo en equipo · Aprendizaje rápido · Proactividad · Adaptabilidad · Resistencia física",
    });

    // 3. Subir PDF a Supabase Storage
    const pdfFilename = `cv-${userId.slice(0,8)}-${companyName.replace(/\s+/g, "-").toLowerCase()}-${Date.now()}.html`;
    const { error: uploadError } = await supabase.storage
      .from("profiles")
      .upload(`cv-sends/${pdfFilename}`, Buffer.from(plantillaHTML, "utf-8"), {
        contentType: "text/html",
        upsert: true,
      });

    let pdfUrl = "";
    if (!uploadError) {
      const { data: urlData } = supabase.storage.from("profiles").getPublicUrl(`cv-sends/${pdfFilename}`);
      pdfUrl = urlData.publicUrl;
    }

    // 4. Enviar por email (Resend) si tenemos email de la empresa
    let sentVia = "ninguno";
    let sendError = "";

    if (companyEmail) {
      try {
        const resend = getResend();
        const subject = `Candidatura — ${puesto || "Candidatura espontánea"} — ${userNombre} ${userApellidos}`;
        const emailHTML = generarEmailHTML({
          nombre: userNombre + " " + userApellidos,
          empresa: companyName,
          puesto: puesto || "",
          carta: coverLetter || "",
          pdfUrl,
          ciudad: userCiudad,
          telefono: userTelefono,
          email: userEmail,
        });

        await resend.emails.send({
          from: "BuscayCurra <envios@buscaycurra.es>",
          to: [companyEmail],
          subject,
          html: emailHTML,
        });
        sentVia = "email";
      } catch (e) {
        sendError = (e as Error).message;
        console.error("[send-cv-local] Resend error:", sendError);
      }
    }

    // 5. Registrar en cv_sends
    await supabase.from("cv_sends").insert({
      user_id: userId,
      company_name: companyName,
      company_email: companyEmail || companyPhone || "",
      job_title: puesto || "Candidatura espontánea",
      status: sentVia === "email" ? "enviado" : "pendiente",
      sent_at: sentVia === "email" ? new Date().toISOString() : null,
    });

    // 6. Notificar por WhatsApp al usuario que tiene el PDF listo
    if (process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_ACCESS_TOKEN && userTelefono) {
      try {
        const waPhone = userTelefono.replace(/^\+?34/, "").replace(/[\s\-]/g, "");
        const waTo = `+34${waPhone}`;
        await fetch(`https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: waTo,
            type: "template",
            template: {
              name: "buscaycurra_alerta_en",
              language: { code: "es" },
              components: [{
                type: "body",
                parameters: [
                  { type: "text", text: userNombre.split(" ")[0] },
                  { type: "text", text: puesto || companyName },
                  { type: "text", text: companyName },
                  { type: "text", text: pdfUrl || "https://buscaycurra.es/app/envios" },
                ],
              }],
            },
          }),
        });
      } catch (e) {
        console.error("[send-cv-local] WhatsApp error:", (e as Error).message);
      }
    }

    return NextResponse.json({
      success: true,
      pdfUrl,
      sentVia,
      message: sentVia === "email"
        ? `✅ CV enviado por email a ${companyName}`
        : `📄 CV generado para ${companyName}. ${pdfUrl ? "Descárgalo aquí para entregarlo en persona. " : ""}${sendError ? `No se pudo enviar por email: ${sendError}` : "No se encontró email de la empresa."}`,
    });
  } catch (error) {
    console.error("[send-cv-local] Error:", (error as Error).message);
    return NextResponse.json({ error: "Error interno al enviar CV" }, { status: 500 });
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generarPlantillaPDF(data: {
  nombre: string;
  email: string;
  telefono: string;
  ciudad: string;
  fotoUrl: string;
  puestoAdaptado: string;
  cartaPresentacion: string;
  empresaNombre: string;
  experiencia: string;
  habilidades: string;
}): string {
  const fotoHTML = data.fotoUrl
    ? `<img src="${data.fotoUrl}" alt="Foto" style="width:100px;height:100px;border-radius:50%;object-fit:cover;border:3px solid #22c55e;" />`
    : `<div style="width:100px;height:100px;border-radius:50%;background:#e5e7eb;display:flex;align-items:center;justify-content:center;font-size:40px;color:#9ca3af;border:3px solid #d1d5db;">👤</div>`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>CV — ${data.nombre}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; background: #f8fafc; color: #1e293b; line-height: 1.6; max-width: 210mm; margin: 0 auto; }
  .header { background: linear-gradient(135deg, #22c55e, #16a34a); color: white; padding: 30px 40px; display: flex; align-items: center; gap: 24px; }
  .header h1 { font-size: 24px; margin-bottom: 4px; }
  .header .subtitle { font-size: 14px; opacity: 0.9; }
  .header .contact { font-size: 11px; margin-top: 8px; opacity: 0.85; }
  .section { padding: 24px 40px; border-bottom: 1px solid #e2e8f0; }
  .section:last-child { border-bottom: none; }
  .section h2 { font-size: 13px; text-transform: uppercase; letter-spacing: 2px; color: #22c55e; margin-bottom: 12px; }
  .card { background: white; border-radius: 8px; padding: 16px; margin-bottom: 12px; border: 1px solid #e2e8f0; }
  .card h3 { font-size: 14px; color: #1e293b; margin-bottom: 2px; }
  .card .meta { font-size: 11px; color: #64748b; margin-bottom: 8px; }
  .card p { font-size: 12px; color: #475569; }
  .skills { display: flex; flex-wrap: wrap; gap: 8px; }
  .skill { font-size: 11px; background: #f0fdf4; color: #16a34a; padding: 4px 12px; border-radius: 20px; border: 1px solid #bbf7d0; }
  .cover-letter { white-space: pre-wrap; font-size: 12px; color: #475569; line-height: 1.8; }
  .footer { text-align: center; padding: 16px 40px; font-size: 9px; color: #94a3b8; }
  @media print { body { background: white; } }
</style>
</head>
<body>
  <div class="header">
    ${fotoHTML}
    <div>
      <h1>${data.nombre}</h1>
      <div class="subtitle">${data.puestoAdaptado}</div>
      <div class="contact">
        ${data.email ? `📧 ${data.email}` : ""} ${data.telefono ? `· 📞 ${data.telefono}` : ""} ${data.ciudad ? `· 📍 ${data.ciudad}` : ""}
      </div>
    </div>
  </div>

  <div class="section">
    <h2>💌 Carta de Presentación — ${data.empresaNombre}</h2>
    <div class="cover-letter">${data.cartaPresentacion}</div>
  </div>

  <div class="section">
    <h2>📋 Perfil Profesional</h2>
    <div class="card">
      <p>${data.experiencia.replace(/\n/g, "<br>")}</p>
    </div>
  </div>

  <div class="section">
    <h2>✅ Habilidades</h2>
    <div class="skills">
      ${data.habilidades.split("·").map(h => `<span class="skill">${h.trim()}</span>`).join("")}
    </div>
  </div>

  <div class="footer">
    CV generado por BuscayCurra · https://buscaycurra.es · ${new Date().toLocaleDateString("es-ES")}
  </div>
</body>
</html>`;
}

function generarEmailHTML(data: {
  nombre: string;
  empresa: string;
  puesto: string;
  carta: string;
  pdfUrl: string;
  ciudad: string;
  telefono: string;
  email: string;
}): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1e293b;">
  <div style="background:linear-gradient(135deg,#22c55e,#16a34a);padding:24px;text-align:center;">
    <h1 style="color:white;margin:0;font-size:20px;">🐛 BuscayCurra</h1>
    <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:13px;">Candidatura de ${data.nombre}</p>
  </div>
  <div style="padding:24px;background:#f8fafc;">
    <p style="font-size:14px;">Hola, equipo de <strong>${data.empresa}</strong>:</p>
    <div style="background:white;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin:16px 0;white-space:pre-wrap;font-size:13px;line-height:1.8;color:#475569;">
${data.carta}
    </div>
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:16px 0;">
      <p style="font-size:12px;color:#16a34a;margin:0;">
        📎 CV completo disponible online<br>
        📞 ${data.telefono} · 📧 ${data.email} · 📍 ${data.ciudad}
      </p>
    </div>
    ${data.pdfUrl ? `<p style="font-size:12px;color:#64748b;text-align:center;"><a href="${data.pdfUrl}" style="color:#22c55e;">Ver CV en formato profesional →</a></p>` : ""}
  </div>
  <div style="text-align:center;padding:16px;font-size:10px;color:#94a3b8;">
    Enviado por BuscayCurra · El asistente IA que busca trabajo por ti
  </div>
</body>
</html>`;
}
