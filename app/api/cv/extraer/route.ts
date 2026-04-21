/**
 * /api/cv/extraer — Extrae texto de un PDF de CV y lo parsea en campos
 * 
 * POST: Recibe PDF como FormData → extrae texto → usa IA para parsear campos
 * Devuelve: { nombre, apellidos, telefono, email, ciudad, experiencia[], formacion[], aptitudes[], idiomas[] }
 */

import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No se recibió archivo" }, { status: 400 });
    }

    // Read PDF buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Extract text from PDF
    let textoCV = "";
    try {
      // Simple PDF text extraction — find text between BT/ET markers
      // or extract from stream objects
      const str = buffer.toString("latin1");
      
      // Method 1: Extract text objects (works for most PDFs)
      const textMatches = str.match(/\(([^)]+)\)/g) || [];
      const textParts = textMatches
        .map(m => m.slice(1, -1))
        .filter(t => t.length > 1 && !/^[\x00-\x1f]+$/.test(t))
        .map(t => t.replace(/\\n/g, "\n").replace(/\\r/g, ""));
      
      // Method 2: Also try to extract plain text streams
      const streamMatches = str.match(/stream\r?\n([\s\S]*?)\r?\nendstream/g) || [];
      for (const sm of streamMatches) {
        const content = sm.replace(/^stream\r?\n/, "").replace(/\r?\nendstream$/, "");
        // Check if it's readable text
        const readable = content.replace(/[^\x20-\x7E\xC0-\xFF\n]/g, "").trim();
        if (readable.length > 20) textParts.push(readable);
      }

      textoCV = textParts.join(" ").replace(/\s+/g, " ").trim();
      
      // If we got very little text, try UTF-16 decoding
      if (textoCV.length < 50) {
        const utf16text = buffer.toString("utf16le").replace(/[^\x20-\x7E\xC0-\xFF\n]/g, " ").trim();
        if (utf16text.length > textoCV.length) textoCV = utf16text;
      }
      
      console.log(`[CV Extract] Extracted ${textoCV.length} chars from PDF`);
    } catch (e) {
      console.error("[CV Extract] PDF parse error:", (e as Error).message);
      return NextResponse.json({ error: "No se pudo leer el PDF" }, { status: 400 });
    }

    if (!textoCV.trim()) {
      return NextResponse.json({ error: "El PDF no contiene texto legible" }, { status: 400 });
    }

    // Use Groq AI to parse the CV text into structured fields
    const groqKey = process.env.GROQ_API_KEY;
    if (groqKey) {
      try {
        const aiRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${groqKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
              {
                role: "system",
                content: `Eres un extractor de datos de CVs. Extrae los datos del CV y devuelve SOLO un JSON válido con esta estructura exacta:
{
  "nombre": "nombre de pila",
  "apellidos": "apellidos",
  "subtitulo": "puesto o título profesional",
  "telefono": "número de teléfono",
  "email": "email",
  "ciudad": "ciudad, provincia código postal",
  "perfilProfesional": "texto del perfil o resumen profesional",
  "aptitudes": ["aptitud1", "aptitud2", ...],
  "idiomas": [{"nombre": "Español", "nivel": 95}, {"nombre": "Inglés", "nivel": 30}],
  "experiencia": [{"fechas": "Ene 2020 – Dic 2022", "puesto": "Cargo", "empresa": "Empresa", "ubicacion": "Ciudad", "descripcion": ["tarea1", "tarea2"]}],
  "formacion": [{"titulo": "Estudios", "centro": "Centro educativo", "ubicacion": "Ciudad"}]
}
NO incluyas explicaciones, SOLO el JSON.`
              },
              {
                role: "user",
                content: `Extrae los datos de este CV:\n\n${textoCV.slice(0, 4000)}`
              }
            ],
            temperature: 0.1,
            max_tokens: 2000,
          }),
        });

        if (aiRes.ok) {
          const aiData = await aiRes.json();
          const content = aiData.choices?.[0]?.message?.content || "";
          
          // Extract JSON from response
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return NextResponse.json({
              ...parsed,
              textoOriginal: textoCV.slice(0, 2000),
              fuente: "ia",
            });
          }
        }
      } catch (e) {
        console.warn("[CV Extract] AI parse failed:", (e as Error).message);
      }
    }

    // Fallback: basic regex parsing
    const campos = parsearCVBasico(textoCV);
    return NextResponse.json({
      ...campos,
      textoOriginal: textoCV.slice(0, 2000),
      fuente: "regex",
    });

  } catch (err) {
    console.error("[CV Extract] Error:", (err as Error).message);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

function parsearCVBasico(texto: string) {
  const emailMatch = texto.match(/[\w.-]+@[\w.-]+\.\w+/);
  const telefonoMatch = texto.match(/(?:\+34\s?)?(?:6|7|9)\d{2}[\s.-]?\d{3}[\s.-]?\d{3}/);
  const lines = texto.split("\n").map(l => l.trim()).filter(Boolean);

  return {
    nombre: lines[0]?.split(" ")[0] || "",
    apellidos: lines[0]?.split(" ").slice(1).join(" ") || "",
    subtitulo: "",
    telefono: telefonoMatch?.[0] || "",
    email: emailMatch?.[0] || "",
    ciudad: "",
    perfilProfesional: "",
    aptitudes: [] as string[],
    idiomas: [] as { nombre: string; nivel: number }[],
    experiencia: [] as { fechas: string; puesto: string; empresa: string; ubicacion: string; descripcion: string[] }[],
    formacion: [] as { titulo: string; centro: string; ubicacion: string }[],
  };
}
