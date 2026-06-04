/**
 * POST /api/au-pair/generate-letter
 * Guzzi IA genera una carta "Dear Family" personalizada
 */
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Plantillas de ejemplo por tipo de perfil
const PLANTILLAS = {
  joven_estudiante: `Dear Host Family,

My name is [nombre], I am [edad] years old and I come from Spain. I am writing to express my sincere interest in becoming your au pair.

I am currently a student and I have always felt a special connection with children. I speak [idiomas] and I am very excited to improve my [idioma_destino] while living with your family.

I have experience taking care of my younger cousins (ages 3 and 7), helping them with homework, playing games, and organizing activities. I am a patient, cheerful, and responsible person.

I would love to become part of your family, help with the children, and share my Spanish culture with you. I can also help with light household tasks.

I hope we can get to know each other soon!

Warm regards,
[nombre]`,

  con_experiencia: `Dear Host Family,

My name is [nombre], I am [edad] years old and I am from Spain. I am very excited about the opportunity to become your au pair.

I have [experiencia] of childcare experience. I have worked with children of different ages, from toddlers to school-age kids. I love organizing creative activities, helping with homework, and ensuring a safe and fun environment.

I speak [idiomas] and I am eager to improve my [idioma_destino] during my stay. I also have a driving license, so I can help with school runs and activities.

I am looking for a family that values open communication and mutual respect. I want to become not just a helper, but a real part of your family.

I would love to schedule a video call to get to know you and your children better.

Best wishes,
[nombre]`,

  profesional_cambio: `Dear Host Family,

My name is [nombre], I am [edad] years old, and I come from Spain. I am writing to express my interest in becoming part of your family as an au pair.

After working in [sector] for some time, I have decided to pursue my passion for childcare and cultural exchange. I speak [idiomas] and I am excited to immerse myself in [idioma_destino] culture while caring for your children.

I am a mature, responsible, and caring person. My professional background has taught me organization, patience, and clear communication — skills I believe are essential for being a great au pair.

In my free time, I enjoy [hobbies]. I would love to share these activities with your children while learning about your family traditions.

I am available from [disponible_desde] and I am looking forward to this new chapter. I hope we can connect soon!

Kind regards,
[nombre]`
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      nombre?: string;
      edad?: number;
      nacionalidad?: string;
      idiomas?: string;
      idiomaDestino?: string;
      experiencia?: string;
      sector?: string;
      hobbies?: string;
      disponibleDesde?: string;
      tipoPerfil?: "joven_estudiante" | "con_experiencia" | "profesional_cambio";
    };

    const tipo = body.tipoPerfil || "joven_estudiante";
    let plantilla = PLANTILLAS[tipo];

    // Reemplazar placeholders
    const reemplazos: Record<string, string> = {
      "[nombre]": body.nombre || "Your Name",
      "[edad]": body.edad?.toString() || "18",
      "[idiomas]": body.idiomas || "Spanish and English",
      "[idioma_destino]": body.idiomaDestino || "English",
      "[experiencia]": body.experiencia || "2 years",
      "[sector]": body.sector || "customer service",
      "[hobbies]": body.hobbies || "reading, sports, and music",
      "[disponible_desde]": body.disponibleDesde || "September 2026",
    };

    for (const [key, value] of Object.entries(reemplazos)) {
      plantilla = plantilla.replace(new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
    }

    return NextResponse.json({
      success: true,
      letter: plantilla,
      tipo,
      sugerencias: [
        "✏️ Personaliza los detalles con anécdotas reales sobre ti",
        "📸 Añade de 3 a 6 fotos — las familias miran esto primero",
        "💬 Sé auténtica — las familias detectan cartas genéricas",
        "🔍 Menciona por qué elegiste ese país específicamente",
      ],
    });
  } catch (error) {
    console.error('[au-pair/generate-letter] Error:', (error as Error).message);
    return NextResponse.json(
      { error: 'Error al generar la carta' },
      { status: 500 }
    );
  }
}
