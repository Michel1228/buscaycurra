/**
 * /api/gusi/analyze-image — OCR de imagen + Google Places (Gemini Vision)
 *
 * Flujo:
 * 1. Recibe imagen en base64 + ubicación GPS opcional (lat, lng)
 * 2. Gemini Vision (flash-lite) extrae texto y contexto (OCR)
 * 3. Detecta nombre de empresa/objeto/marca en el texto
 * 4. Busca en Google Places con ubicación GPS para precisión milimétrica
 * 5. Devuelve info de empresa + sugerencia de enviar CV
 */

import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageBase64, userId, lat, lng } = body as {
      imageBase64: string;
      userId?: string;
      lat?: number;
      lng?: number;
    };

    if (!imageBase64) {
      return NextResponse.json({ error: "Imagen requerida" }, { status: 400 });
    }

    // Limpiar el prefijo data:image si viene
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    // ─── Paso 1: OCR con GPT-4o Vision ────────────────────────────────
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      return NextResponse.json({ error: "Servicio no disponible" }, { status: 503 });
    }

    const ocrPrompt = `Analiza esta imagen para ayudar a buscar trabajo. Eres un asistente de empleo.

INSTRUCCIONES:
1. PRIMERO: ¿Hay texto visible? Si ves un nombre de tienda/bar/restaurante/empresa, escribe EXACTAMENTE: "NEGOCIO: [nombre]"
2. Si ves un cartel de "se busca" o "se necesita", escribe: "CARTEL: [texto del cartel]"
3. Si NO hay texto de negocio pero sí ves un OBJETO o PRODUCTO reconocible, escribe EXACTAMENTE: "OBJETO: [qué es] | MARCA: [marca si es visible, si no 'generico'] | SECTOR: [sector laboral]"
   Ejemplos:
   - Una botella de agua → "OBJETO: botella de agua | MARCA: generico | SECTOR: bebidas/embotelladoras"
   - Una camiseta con etiqueta de Zara → "OBJETO: camiseta | MARCA: Zara | SECTOR: moda/textil"
   - Una herramienta Milwaukee → "OBJETO: taladro | MARCA: Milwaukee | SECTOR: ferretería/construcción"
   - Un plato de comida → "OBJETO: comida | MARCA: generico | SECTOR: hostelería/restauración"
   - Una zapatilla Nike → "OBJETO: zapatilla | MARCA: Nike | SECTOR: calzado/deportes"
   IMPORTANTE: Si ves un logo o etiqueta de marca (Zara, Nike, Adidas, Mercadona, Carrefour, Lidl, Decathlon, Ikea, etc.), indícala en MARCA. Si no hay marca visible, pon "generico".
4. Si la imagen está demasiado borrosa/oscura para distinguir nada, escribe: "BORROSA"
5. Si no ves ni texto, ni objetos, ni nada útil para buscar trabajo, escribe: "NO_UTIL"

Responde en español. Máximo 2 líneas.`;

    const ocrRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: ocrPrompt },
              { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64Data}` } },
            ],
          },
        ],
        max_tokens: 150,
        temperature: 0.1,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!ocrRes.ok) {
      const errText = await ocrRes.text();
      console.error("GPT-4o Vision error:", ocrRes.status, errText);
      return NextResponse.json(
        { error: "No se pudo leer la imagen. Prueba con más luz o más cerca." },
        { status: 500 }
      );
    }

    const ocrData = await ocrRes.json() as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const ocrText = ocrData.choices?.[0]?.message?.content?.trim() || "";
    console.log("OCR GPT-4o:", ocrText);

    if (!ocrText || ocrText.length < 3) {
      return NextResponse.json({
        reply:
          "🔍 No pude leer texto en la imagen. Prueba a hacer la foto más de cerca al cartel o con mejor luz.",
        action: "ocr_failed",
      });
    }

    // ─── Manejar respuestas especiales del modelo ──────────────────────
    if (ocrText.includes("NO_UTIL")) {
      return NextResponse.json({
        reply:
          "😅 No veo ninguna tienda, cartel de empleo ni objeto que me dé pistas.\n\n📸 **Prueba con:** la fachada de un bar, tienda o empresa. O una foto de algún producto relacionado con el sector donde quieres trabajar (ropa, herramientas, comida...).",
        action: "ocr_not_useful",
      });
    }

    if (ocrText.includes("BORROSA")) {
      return NextResponse.json({
        reply:
          "🔍 La imagen está demasiado borrosa u oscura. Prueba con mejor luz y más cerca.",
        action: "ocr_blurry",
      });
    }

    // ─── Detectar OBJETO → buscar empresas por marca y sector ──
    const objetoMatch = ocrText.match(/OBJETO:\s*(.+?)\s*\|\s*MARCA:\s*(.+?)\s*\|\s*SECTOR:\s*(.+)/i);
    if (objetoMatch) {
      const objeto = objetoMatch[1].trim();
      const marca = objetoMatch[2].trim();
      const sector = objetoMatch[3].trim();
      const tieneMarca = marca.toLowerCase() !== "generico" && marca.length > 1;

      console.log("Objeto:", objeto, "| Marca:", marca, "| Sector:", sector);

      // Nivel 1: Buscar la marca específica + ofertas reales
      if (tieneMarca) {
        const marcaResult = await searchGooglePlaces(marca, lat, lng);
        const ofertasReales = await searchJobsBySector(sector, userId);
        if (marcaResult) {
          const extra = ofertasReales
            || `\n\n💡 Dime tu ciudad y busco todas las ofertas de **${sector}** cerca de ti.`;

          return NextResponse.json({
            reply: `📸 He visto **${objeto}** de **${marca}**\n\n🏢 **${marcaResult.name}**\n📍 ${marcaResult.address}\n${marcaResult.phone ? `📞 ${marcaResult.phone}` : ""}\n${marcaResult.website ? `🌐 ${marcaResult.website}` : ""}${extra}`,
            action: "object_brand_found",
            company: {
              name: marcaResult.name,
              address: marcaResult.address,
              phone: marcaResult.phone,
              email: marcaResult.email,
              website: marcaResult.website,
              mapsUrl: marcaResult.mapsUrl,
              rating: marcaResult.rating,
            },
          });
        }
      }

      // Sin marca o marca no encontrada → buscar ofertas reales
      const ofertasReales2 = await searchJobsBySector(sector, userId);
      if (ofertasReales2) {
        return NextResponse.json({
          reply: `📸 He visto **${objeto}**${tieneMarca ? ` de **${marca}**` : ""} → sector **${sector}**${ofertasReales2}`,
          action: "object_to_sector",
          suggestedSector: sector,
        });
      }
      
      // Sin ofertas en DB → fallback a Google Places
      const sectorResult = await searchGooglePlaces(sector, lat, lng);
      if (sectorResult) {
        return NextResponse.json({
          reply: `📸 He visto **${objeto}** → sector **${sector}**\n\n🏢 **${sectorResult.name}**\n📍 ${sectorResult.address}\n${sectorResult.phone ? `📞 ${sectorResult.phone}` : ""}\n${sectorResult.website ? `🌐 ${sectorResult.website}` : ""}\n\n💡 Dime tu ciudad y busco todas las empresas de **${sector}** cerca de ti.`,
          action: "object_to_sector",
          company: {
            name: sectorResult.name,
            address: sectorResult.address,
            phone: sectorResult.phone,
            email: sectorResult.email,
            website: sectorResult.website,
            mapsUrl: sectorResult.mapsUrl,
            rating: sectorResult.rating,
          },
        });
      }

      return NextResponse.json({
        reply: `📸 He visto **${objeto}**${tieneMarca ? ` de **${marca}**` : ""} → sector **${sector}**\n\n🔍 Dime tu ciudad y busco todas las empresas de **${sector}** cerca de ti para enviarles el CV.`,
        action: "object_to_sector_no_results",
        suggestedSector: sector,
        suggestedBrand: tieneMarca ? marca : undefined,
      });
    }

    // ─── Negocio detectado ────────────────────────────────────────────
    const negocioMatch = ocrText.match(/NEGOCIO:\s*(.+)/i);
    if (negocioMatch) {
      const companyName = negocioMatch[1].trim();
      console.log("Negocio detectado:", companyName);
      const placesResult = await searchGooglePlaces(companyName, lat, lng);
      if (placesResult) {
        return NextResponse.json({
          reply: buildCompanyReply(ocrText, placesResult, companyName),
          action: "company_info",
          company: {
            name: placesResult.name,
            address: placesResult.address,
            phone: placesResult.phone,
            email: placesResult.email,
            website: placesResult.website,
            mapsUrl: placesResult.mapsUrl,
            rating: placesResult.rating,
          },
        });
      }
      return NextResponse.json({
        reply: `📸 He visto **${companyName}** pero no lo encontré en Google Maps. ¿Me dices la ciudad?`,
        action: "business_not_found",
        suggestedCompany: companyName,
      });
    }

    // ─── Cartel de empleo detectado ───────────────────────────────────
    const cartelMatch = ocrText.match(/CARTEL:\s*(.+)/i);
    if (cartelMatch) {
      const cartelText = cartelMatch[1].trim();
      return NextResponse.json({
        reply: `📸 He visto un cartel: **"${cartelText}"**\n\nParece que están buscando a alguien. ¿Quieres que te ayude a enviar el CV? Dime el nombre de la empresa o la dirección y lo gestiono.`,
        action: "job_sign_detected",
        cartelText,
      });
    }

    // ─── Fallback: intentar extraer empresa del texto OCR ─────────────
    const companyName = extractCompanyName(ocrText);
    console.log("Empresa detectada:", companyName);

    // ─── Paso 3: Buscar en Google Places (con ubicación si disponible) ─
    let placesResult: PlacesResult | null = null;
    if (companyName) {
      placesResult = await searchGooglePlaces(companyName, lat, lng);
    }

    // ─── Paso 4: Construir respuesta ────────────────────────────────
    if (placesResult && companyName) {
      return NextResponse.json({
        reply: buildCompanyReply(ocrText, placesResult, companyName),
        action: "company_info",
        company: {
          name: placesResult.name,
          address: placesResult.address,
          phone: placesResult.phone,
          email: placesResult.email,
          website: placesResult.website,
          mapsUrl: placesResult.mapsUrl,
          rating: placesResult.rating,
        },
        ocrText,
      });
    }

    // Sin resultado de Google Places → responder con el OCR básico
    return NextResponse.json({
      reply: `📸 **Texto detectado:** "${ocrText}"\n\n${
        companyName
          ? `Parece que es "${companyName}" pero no lo encontré en Google Maps. ¿Me dices la ciudad y lo busco manualmente?`
          : "No identifiqué una empresa clara. ¿Puedes decirme el nombre y la ciudad?"
      }`,
      action: "ocr_partial",
      ocrText,
      suggestedCompany: companyName,
    });
  } catch (error) {
    console.error("analyze-image error:", error);
    return NextResponse.json(
      { error: "Error al procesar la imagen" },
      { status: 500 }
    );
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────

function extractCompanyName(text: string): string | null {
  const patterns = [
    /(?:bar|restaurante|cafeter[ií]a|hotel|tienda|panader[ií]a|farmacia|cl[ií]nica|taller|peluquer[ií]a)\s+(?:de\s+)?[""]?([A-ZÁÉÍÓÚÜÑ][A-Za-záéíóúüñ\s]{2,40})[""]?(?:,|\.|\n|$)/i,
    /(?:busca|necesita|precisa)\s+\w+(?:\s+\w+){0,5}\s+en\s+[""]?([A-ZÁÉÍÓÚÜÑ][A-Za-záéíóúüñ\s]{2,40})[""]?(?:,|\.|\n|$)/i,
    /([A-ZÁÉÍÓÚÜÑ][A-Za-záéíóúüñ]+(?:\s+[A-ZÁÉÍÓÚÜÑa-záéíóúüñ]+){1,4})/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]?.trim()) {
      const name = match[1].trim();
      const generics = ["se", "necesita", "busca", "precisa", "personal", "urgente"];
      if (!generics.includes(name.toLowerCase())) {
        return name;
      }
    }
  }

  return null;
}

interface PlacesResult {
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  mapsUrl: string;
  rating: number;
}

async function searchJobsBySector(sector: string, userId?: string): Promise<string> {
  try {
    const vpsPassword = process.env.VPS_DB_PASSWORD;
    if (!vpsPassword) return "";

    // 1. Obtener ubicación del perfil del usuario
    let ciudadUsuario = "";
    if (userId) {
      try {
        const sb = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        const { data: profile } = await sb.from("profiles").select("ciudad").eq("id", userId).single();
        ciudadUsuario = profile?.ciudad || "";
      } catch { /* sin perfil, sin problema */ }
    }

    // 2. Buscar ofertas por sector en DB VPS
    const pool = new Pool({
      host: "buscaycurra-db",
      port: 5432,
      database: "buscaycurra",
      user: "buscaycurra",
      password: vpsPassword,
      max: 1,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 10000,
    });

    // Extraer palabras clave del sector
    const keywords = sector.split(/[/,\s]+/).filter(k => k.length > 2).join("|");
    
    const { rows } = await pool.query(
      `SELECT title, company, city, province, country, "sourceUrl", id
       FROM "JobListing"
       WHERE "isActive" = true
         AND (LOWER(title) ~ LOWER($1) OR LOWER(company) ~ LOWER($1))
       ORDER BY 
         CASE WHEN LOWER(city) = LOWER($2) THEN 0 ELSE 1 END,
         "scrapedAt" DESC
       LIMIT 5`,
      [keywords, ciudadUsuario]
    );
    await pool.end();

    if (!rows.length) return "";

    // 3. Formatear ofertas
    const ciudadStr = ciudadUsuario ? ` cerca de **${ciudadUsuario}**` : "";
    let result = `\n\n📋 **${rows.length} ofertas de ${sector}${ciudadStr}:**\n`;
    rows.forEach((r: any, i: number) => {
      const loc = r.city || r.province || "";
      result += `\n${i+1}. **${r.title}** — ${r.company}${loc ? ` · 📍 ${loc}` : ""}`;
    });
    result += `\n\n💡 ¿Quieres que envíe tu CV a estas empresas?`;

    return result;
  } catch (e) {
    console.error("searchJobsBySector error:", e);
    return "";
  }
}

async function searchGooglePlaces(
  companyName: string,
  lat?: number,
  lng?: number
): Promise<PlacesResult | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return null;

  try {
    // Si tenemos ubicación GPS, usar Nearby Search para máxima precisión
    if (lat && lng) {
      const nearbyUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=500&keyword=${encodeURIComponent(companyName)}&key=${apiKey}`;
      const nearbyRes = await fetch(nearbyUrl, { signal: AbortSignal.timeout(8000) });
      const nearbyData = await nearbyRes.json() as {
        results?: Array<{ place_id: string }>;
      };
      if (nearbyData.results?.[0]) {
        return await getPlaceDetails(nearbyData.results[0].place_id, apiKey);
      }
    }

    // Fallback: búsqueda por texto
    const searchUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(companyName)}&inputtype=textquery&fields=place_id&key=${apiKey}`;
    const searchRes = await fetch(searchUrl, { signal: AbortSignal.timeout(8000) });
    const searchData = await searchRes.json() as {
      candidates?: Array<{ place_id: string }>;
    };

    const placeId = searchData.candidates?.[0]?.place_id;
    if (!placeId) return null;

    return await getPlaceDetails(placeId, apiKey);
  } catch {
    return null;
  }
}

async function getPlaceDetails(placeId: string, apiKey: string): Promise<PlacesResult | null> {
  const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,formatted_phone_number,website,rating,url&key=${apiKey}`;
  const detailsRes = await fetch(detailsUrl, { signal: AbortSignal.timeout(8000) });
  const detailsData = await detailsRes.json() as {
    result?: {
      name: string;
      formatted_address: string;
      formatted_phone_number: string;
      website: string;
      rating: number;
      url: string;
    };
  };

  const r = detailsData.result;
  if (!r) return null;

  // Intentar extraer email de la web (opcional, no bloqueante)
  let email = "";
  if (r.website) {
    try {
      const webRes = await fetch(r.website, { signal: AbortSignal.timeout(5000) });
      const html = await webRes.text();
      const emailMatch = html.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z]{2,})/);
      if (emailMatch) email = emailMatch[1];
    } catch {
      // No pasa nada si no podemos sacar el email
    }
  }

  return {
    name: r.name,
    address: r.formatted_address,
    phone: r.formatted_phone_number || "",
    email,
    website: r.website || "",
    mapsUrl: r.url,
    rating: r.rating || 0,
  };
}

function buildCompanyReply(
  ocrText: string,
  company: PlacesResult,
  companyName: string
): string {
  const parts: string[] = [];

  parts.push(`📸 **${company.name}**`);
  if (company.rating) {
    parts.push(`⭐ ${company.rating} · 📍 ${company.address}`);
  } else {
    parts.push(`📍 ${company.address}`);
  }

  if (company.phone) parts.push(`📞 ${company.phone}`);
  if (company.email) parts.push(`✉️ ${company.email}`);
  if (company.website) parts.push(`🌐 ${company.website}`);

  parts.push(""); // línea vacía
  parts.push(`📝 Texto detectado: "${ocrText}"`);
  parts.push(
    `💡 ¿Quieres que te ayude a enviar el CV a esta empresa? Usa el botón "📧 Enviar mi CV" y lo mando ahora.`
  );

  return parts.join("\n");
}
