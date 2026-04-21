import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { texto } = await request.json();
    if (!texto?.trim()) return NextResponse.json({ error: "Sin texto" }, { status: 400 });

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "Extrae los datos de un CV y devuelve SOLO JSON valido (sin markdown, sin explicacion) con esta estructura exacta: {\"nombre\":\"\",\"apellidos\":\"\",\"subtitulo\":\"\",\"telefono\":\"\",\"email\":\"\",\"ciudad\":\"\",\"perfilProfesional\":\"\",\"aptitudes\":\"habilidad1, habilidad2\",\"idiomas\":\"Espanol:95, Ingles:30\",\"experiencia\":[{\"fechas\":\"\",\"puesto\":\"\",\"empresa\":\"\",\"ubicacion\":\"\",\"descripcion\":\"tarea1\ntarea2\"}],\"formacion\":[{\"titulo\":\"\",\"centro\":\"\",\"ubicacion\":\"\"}]}. Para idiomas usa nivel 0-100. Campos vacios si no hay dato.",
        },
        { role: "user", content: texto.slice(0, 8000) },
      ],
      temperature: 0.1,
      max_tokens: 2000,
    });

    const raw = (completion.choices[0]?.message?.content || "{}").trim();
    const jsonStr = raw.startsWith("```") ? raw.replace(/```json?\n?/g, "").replace(/```$/g, "").trim() : raw;
    const parsed = JSON.parse(jsonStr);
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json({ error: "No se pudo parsear" }, { status: 500 });
  }
}
