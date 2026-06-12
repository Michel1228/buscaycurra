import { NextRequest, NextResponse } from "next/server";

// Endpoint que mejora una foto tipo carnet profesional usando IA de OpenAI
// POST multipart/form-data con campo "foto" (archivo de imagen)
// Devuelve { success: true, url: "https://..." } con la foto mejorada

export const runtime = "nodejs";
export const maxDuration = 60; // DALL-E puede tardar hasta 30s

export async function POST(request: NextRequest) {
  try {
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      return NextResponse.json({ error: "OPENAI_API_KEY no configurada" }, { status: 503 });
    }

    const formData = await request.formData();
    const foto = formData.get("foto") as File | null;
    if (!foto) {
      return NextResponse.json({ error: "No se recibió ninguna foto" }, { status: 400 });
    }

    // Validar tipo y tamaño
    if (!foto.type.startsWith("image/")) {
      return NextResponse.json({ error: "El archivo debe ser una imagen (JPG/PNG)" }, { status: 400 });
    }
    if (foto.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "La imagen no puede superar 5 MB" }, { status: 400 });
    }

    // Convertir a base64 para enviar a OpenAI
    const bytes = await foto.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mimeType = foto.type || "image/jpeg";
    const dataUrl = `data:${mimeType};base64,${base64}`;

    // Paso 1: GPT-4o analiza la foto y crea un prompt detallado para DALL-E
    const analysisRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Describe esta foto de una persona en detalle para generar una imagen profesional tipo carnet con DALL-E. La descripción debe preservar fielmente las características del rostro (edad aproximada, color de piel, forma de cara, color de ojos, color y estilo de pelo, rasgos distintivos). La nueva imagen debe tener: fondo blanco liso, camisa blanca formal, encuadre desde los hombros (tamaño carnet), iluminación profesional. Devuelve SOLO la descripción en inglés, sin introducciones ni comentarios adicionales. Máximo 300 caracteres.",
              },
              {
                type: "image_url",
                image_url: { url: dataUrl },
              },
            ],
          },
        ],
        max_tokens: 300,
        temperature: 0.3,
      }),
    });

    if (!analysisRes.ok) {
      const errText = await analysisRes.text();
      console.error("[mejorar-foto] GPT-4o error:", analysisRes.status, errText.substring(0, 200));
      return NextResponse.json({ error: "No se pudo analizar la foto. Intenta con otra imagen." }, { status: 500 });
    }

    const analysisData = await analysisRes.json();
    const description = analysisData.choices?.[0]?.message?.content?.trim();

    if (!description) {
      return NextResponse.json({ error: "No se pudo generar la descripción de la foto." }, { status: 500 });
    }

    console.log("[mejorar-foto] Descripción generada:", description);

    // Paso 2: DALL-E 3 genera la foto profesional
    const dallePrompt = `Professional headshot for a resume/CV: ${description}. Solid white background, white collared shirt, shoulders-up portrait framing, soft professional lighting, neutral expression, 4x5 aspect ratio suitable for a CV photo.`;

    const dalleRes = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: dallePrompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
        response_format: "b64_json",
      }),
    });

    if (!dalleRes.ok) {
      const errText = await dalleRes.text();
      console.error("[mejorar-foto] DALL-E error:", dalleRes.status, errText.substring(0, 200));
      return NextResponse.json({ error: "No se pudo generar la foto mejorada. Inténtalo de nuevo." }, { status: 500 });
    }

    const dalleData = await dalleRes.json();
    const generatedB64 = dalleData.data?.[0]?.b64_json;

    if (!generatedB64) {
      return NextResponse.json({ error: "DALL-E no devolvió una imagen." }, { status: 500 });
    }

    // Paso 3: Subir la imagen generada a Supabase Storage
    const generatedBuffer = Buffer.from(generatedB64, "base64");
    const { createClient } = await import("@supabase/supabase-js");

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      // Sin Supabase, devolvemos la imagen como respuesta directa
      return NextResponse.json({
        success: true,
        base64: generatedB64,
        mimeType: "image/png",
        note: "Imagen generada pero no se pudo guardar en almacenamiento. Usa la imagen en base64.",
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const timestamp = Date.now();
    const filePath = `cv-photos/${timestamp}-mejorada.png`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, generatedBuffer, {
        contentType: "image/png",
        upsert: false,
      });

    if (uploadError) {
      console.error("[mejorar-foto] Error subiendo a Supabase:", uploadError.message);
      // Fallback: devolver base64
      return NextResponse.json({
        success: true,
        base64: generatedB64,
        mimeType: "image/png",
        note: "Imagen generada pero error al guardar. Usa la imagen en base64.",
      });
    }

    // Obtener URL pública
    const { data: publicUrlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      url: publicUrlData.publicUrl,
    });
  } catch (error) {
    console.error("[mejorar-foto] Error:", (error as Error).message);
    return NextResponse.json({ error: "Error interno al procesar la foto." }, { status: 500 });
  }
}
