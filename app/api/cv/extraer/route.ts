/**
 * /api/cv/extraer — Extrae texto de un PDF y parsea con IA
 * POST: FormData con "file" (PDF) → pdftotext → Groq AI → JSON estructurado
 */

import { NextRequest, NextResponse } from "next/server";
import { execSync } from "child_process";
import { writeFileSync, unlinkSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

export async function POST(request: NextRequest) {
  const tmpFile = join(tmpdir(), `cv-${Date.now()}.pdf`);
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No se recibió archivo" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());

    // ── Extraer texto con pdftotext (poppler-utils) ─────────────────────
    let textoCV = "";
    try {
      writeFileSync(tmpFile, buffer);
      textoCV = execSync(`pdftotext "${tmpFile}" - 2>/dev/null`, { maxBuffer: 2 * 1024 * 1024 }).toString("utf-8").trim();
      console.log(`[CV Extract] pdftotext: ${textoCV.length} chars`);
    } catch (e) {
      console.warn("[CV Extract] pdftotext failed:", (e as Error).message);
      // Fallback: raw text extraction
      textoCV = extractRawText(buffer);
      console.log(`[CV Extract] fallback: ${textoCV.length} chars`);
    } finally {
      try { unlinkSync(tmpFile); } catch { /* ok */ }
    }

    if (textoCV.trim().length < 15) {
      return NextResponse.json({ error: "El PDF no contiene texto legible. Prueba con otro." }, { status: 400 });
    }

    // ── Parsear con Groq AI ─────────────────────────────────────────────
    const groqKey = process.env.GROQ_API_KEY;
    if (groqKey) {
      try {
        const aiRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${groqKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
              {
                role: "system",
                content: `Extrae datos del CV. Devuelve SOLO JSON válido:
{"nombre":"","apellidos":"","subtitulo":"puesto profesional","telefono":"","email":"","ciudad":"ciudad, provincia CP","perfilProfesional":"resumen","aptitudes":["apt1","apt2"],"idiomas":[{"nombre":"Español","nivel":95}],"experiencia":[{"fechas":"Ene 2020 – Dic 2022","puesto":"","empresa":"","ubicacion":"","descripcion":["tarea1","tarea2"]}],"formacion":[{"titulo":"","centro":"","ubicacion":""}]}
Sin explicaciones. SOLO JSON. Campo vacío si no hay dato.`
              },
              { role: "user", content: `CV:\n\n${textoCV.slice(0, 6000)}` }
            ],
            temperature: 0.1,
            max_tokens: 2000,
          }),
        });
        if (aiRes.ok) {
          const aiData = await aiRes.json();
          const content = aiData.choices?.[0]?.message?.content || "";
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return NextResponse.json({ ...parsed, textoOriginal: textoCV.slice(0, 2000), fuente: "ia" });
          }
        }
      } catch (e) {
        console.warn("[CV Extract] AI failed:", (e as Error).message);
      }
    }

    // Fallback: regex
    return NextResponse.json({ ...parsearBasico(textoCV), textoOriginal: textoCV.slice(0, 2000), fuente: "regex" });
  } catch (err) {
    try { unlinkSync(tmpFile); } catch { /* ok */ }
    console.error("[CV Extract]", (err as Error).message);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

function extractRawText(buf: Buffer): string {
  const raw = buf.toString("binary");
  const chunks: string[] = [];
  const allStr = raw.match(/\(([^)]{2,200})\)/g) || [];
  for (const s of allStr) {
    const inner = s.slice(1, -1)
      .replace(/\\n/g, "\n").replace(/\\r/g, "").replace(/\\\(/g, "(").replace(/\\\)/g, ")");
    const clean = inner.replace(/[^\x20-\x7E\xC0-\xFF\n]/g, "");
    if (clean.length > 1) chunks.push(clean);
  }
  return chunks.join(" ").replace(/\s+/g, " ").trim();
}

function parsearBasico(texto: string) {
  const email = texto.match(/[\w.-]+@[\w.-]+\.\w+/)?.[0] || "";
  const tel = texto.match(/(?:\+34\s?)?(?:6|7|9)\d{2}[\s.-]?\d{3}[\s.-]?\d{3}/)?.[0] || "";
  const lines = texto.split(/\n/).map(l => l.trim()).filter(Boolean);
  return {
    nombre: lines[0]?.split(" ")[0] || "", apellidos: lines[0]?.split(" ").slice(1, 3).join(" ") || "",
    subtitulo: "", telefono: tel, email, ciudad: "", perfilProfesional: "",
    aptitudes: [] as string[], idiomas: [] as { nombre: string; nivel: number }[],
    experiencia: [] as { fechas: string; puesto: string; empresa: string; ubicacion: string; descripcion: string[] }[],
    formacion: [] as { titulo: string; centro: string; ubicacion: string }[],
  };
}
