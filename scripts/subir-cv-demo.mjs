/**
 * scripts/subir-cv-demo.mjs
 * Genera un CV PDF mínimo válido y lo sube al Storage del usuario demo.
 * Uso: node scripts/subir-cv-demo.mjs
 */

const SUPABASE_URL  = "https://ojesordjedovnpyxspxi.supabase.co";
const SERVICE_KEY   = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qZXNvcmRqZWRvdm5weXhzcHhpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjM3MDU1NywiZXhwIjoyMDkxOTQ2NTU3fQ.I3xh_dQKpHt14orn7YWqcoFUwDZ4Ebn8IYVujEbJC10";
const DEMO_USER_ID  = "be86ce10-290a-4613-b6a6-25187742a112";

// Genera un PDF mínimo válido (sin librerías externas)
function generarPDF() {
  const nombre   = "Demo BuscayCurra";
  const contacto = "demo@buscaycurra.es | +34 600 123 456";
  const ciudad   = "Madrid, Espana";
  const objetivo = "Candidato de demostración para la plataforma BuscayCurra.";
  const exp1     = "Camarero/a - Hotel Donna Portals SL (2023-2026)";
  const exp2     = "Recepcionista - Hostal Madrid Centro (2021-2023)";
  const habilidades = "Atencion al cliente, trabajo en equipo, idiomas: ES/EN/FR";

  const header = "%PDF-1.4\n";
  const obj1 = "1 0 obj\n<</Type /Catalog /Pages 2 0 R>>\nendobj\n";
  const obj2 = "2 0 obj\n<</Type /Pages /Kids [3 0 R] /Count 1>>\nendobj\n";
  const obj3 = "3 0 obj\n<</Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources<</Font<</F1<</Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold>>/F2<</Type /Font /Subtype /Type1 /BaseFont /Helvetica>>>>>>>\nendobj\n";

  const stream = [
    "BT",
    "/F1 18 Tf",
    "50 800 Td",
    `(${nombre}) Tj`,
    "/F2 10 Tf",
    "0 -20 Td",
    `(${contacto}) Tj`,
    "0 -14 Td",
    `(${ciudad}) Tj`,
    "",
    "/F1 13 Tf",
    "0 -30 Td",
    "(Objetivo) Tj",
    "/F2 10 Tf",
    "0 -16 Td",
    `(${objetivo}) Tj`,
    "",
    "/F1 13 Tf",
    "0 -30 Td",
    "(Experiencia) Tj",
    "/F2 10 Tf",
    "0 -16 Td",
    `(${exp1}) Tj`,
    "0 -14 Td",
    `(${exp2}) Tj`,
    "",
    "/F1 13 Tf",
    "0 -30 Td",
    "(Habilidades) Tj",
    "/F2 10 Tf",
    "0 -16 Td",
    `(${habilidades}) Tj`,
    "ET",
  ].join("\n");

  const streamLength = Buffer.byteLength(stream, "latin1");
  const obj4 = `4 0 obj\n<</Length ${streamLength}>>\nstream\n${stream}\nendstream\nendobj\n`;

  const pad = (n) => String(n).padStart(10, "0");
  const off1 = header.length;
  const off2 = off1 + obj1.length;
  const off3 = off2 + obj2.length;
  const off4 = off3 + obj3.length;
  const xrefPos = off4 + obj4.length;

  const xref = [
    "xref",
    "0 5",
    "0000000000 65535 f ",
    `${pad(off1)} 00000 n `,
    `${pad(off2)} 00000 n `,
    `${pad(off3)} 00000 n `,
    `${pad(off4)} 00000 n `,
    "trailer",
    `<</Size 5 /Root 1 0 R>>`,
    "startxref",
    String(xrefPos),
    "%%EOF",
  ].join("\n");

  return Buffer.from(header + obj1 + obj2 + obj3 + obj4 + xref, "latin1");
}

async function main() {
  const pdfBuffer = generarPDF();
  console.log(`PDF generado: ${pdfBuffer.length} bytes`);

  const rutaArchivo = `${DEMO_USER_ID}/cv.pdf`;

  // Subir a Supabase Storage con PUT
  const uploadUrl = `${SUPABASE_URL}/storage/v1/object/cvs/${rutaArchivo}`;
  const res = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/pdf",
      "x-upsert": "true",
    },
    body: pdfBuffer,
  });

  const responseText = await res.text();
  console.log(`Upload status: ${res.status}`);
  console.log("Response:", responseText);

  if (res.ok) {
    // Actualizar cv_url en profiles
    const patchRes = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${DEMO_USER_ID}`,
      {
        method: "PATCH",
        headers: {
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cv_url: rutaArchivo }),
      }
    );
    console.log(`Profile cv_url update: ${patchRes.status}`);
    console.log("✅ CV subido y perfil actualizado correctamente.");
  } else {
    console.error("❌ Error subiendo el CV");
  }
}

main().catch(console.error);
