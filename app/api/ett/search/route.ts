/**
 * POST /api/ett/search
 * 
 * Busca ETTs (Empresas de Trabajo Temporal) por ciudad usando Google Places.
 * 
 * Flujo:
 *   1. Google Places Find Place → candidates buscando "ETT" + "agencia empleo" + ciudad
 *   2. Google Places Details → nombre, web, teléfono, dirección, rating
 *   3. Email: generado del dominio + scraping opcional de la web
 * 
 * Acepta: { city: "Madrid" }
 * 
 * Devuelve: { success: true, empresas: EmpresaCompleta[] }
 */
import { NextRequest, NextResponse } from "next/server";
import { buscarEmpresaGooglePlaces, inferirSector, type GooglePlaceResult } from "@/lib/google-places";
import { extraerInfoEmpresa } from "@/lib/company-extractor";

export const dynamic = "force-dynamic";

interface EmpresaCompleta {
  nombre: string;
  dominio: string | null;
  urlWeb: string | null;
  emailRrhh: string | null;
  emailContacto: string | null;
  emailsExtraidos: string[];
  emailConfianza: "alta" | "baja";
  telefono: string | null;
  paginaEmpleo: string | null;
  descripcion: string | null;
  sector: string | null;
  linkedin: string | null;
  twitter: string | null;
  instagram: string | null;
  fuente: string;
  googleRating?: number | null;
  googleReviews?: number | null;
  googleAddress?: string | null;
  googleMapsUrl?: string | null;
}

function extraerDominio(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function generarEmails(dominio: string): string[] {
  if (!dominio) return [];
  return [
    `rrhh@${dominio}`,
    `seleccion@${dominio}`,
    `empleo@${dominio}`,
    `talento@${dominio}`,
    `jobs@${dominio}`,
    `info@${dominio}`,
    `contacto@${dominio}`,
  ];
}

async function extraerEmailsDesdeWeb(websiteUrl: string): Promise<string | null> {
  try {
    const datos = await extraerInfoEmpresa(websiteUrl);
    if (datos?.emailRrhh && !datos.emailRrhh.includes("www.")) {
      return datos.emailRrhh;
    }
  } catch { /* ignorar */ }
  return null;
}

function construirEmpresaDesdeGoogle(gr: GooglePlaceResult): EmpresaCompleta {
  const dominio = gr.website ? extraerDominio(gr.website) : "";
  const emailsGenerados = generarEmails(dominio);

  return {
    nombre: gr.name,
    dominio: dominio || null,
    urlWeb: gr.website || null,
    emailRrhh: emailsGenerados[0] || null,
    emailContacto: emailsGenerados.find(e => e.includes("info@") || e.includes("contacto@")) || null,
    emailsExtraidos: emailsGenerados,
    emailConfianza: "baja",
    telefono: gr.formatted_phone_number || gr.international_phone_number || null,
    paginaEmpleo: gr.website ? `${gr.website.replace(/\/$/, "")}/empleo` : null,
    descripcion: null,
    sector: "ETT / Recursos Humanos",
    linkedin: null,
    twitter: null,
    instagram: null,
    fuente: "google_places_ett",
    googleRating: gr.rating || null,
    googleReviews: gr.user_ratings_total || null,
    googleAddress: gr.formatted_address || null,
    googleMapsUrl: gr.url || null,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { city?: string };
    const city = body.city?.trim();

    if (!city || city.length < 2) {
      return NextResponse.json(
        { error: "Ciudad requerida. Ej: { \"city\": \"Madrid\" }" },
        { status: 400 }
      );
    }

    if (!process.env.GOOGLE_PLACES_API_KEY) {
      return NextResponse.json(
        { error: "API de Google Places no configurada" },
        { status: 500 }
      );
    }

    // ── 1. Buscar ETTs en Google Places ─────────────────────────────────
    // Buscamos con varias queries para maximizar resultados
    console.log(`🏢 Buscando ETTs en: "${city}"`);

    const queries = [
      `ETT ${city}`,
      `agencia empleo temporal ${city}`,
      `empresa trabajo temporal ${city}`,
    ];

    const allPlacesMap = new Map<string, GooglePlaceResult>();

    for (const query of queries) {
      try {
        const results = await buscarEmpresaGooglePlaces(query);
        for (const place of results) {
          if (!allPlacesMap.has(place.place_id)) {
            allPlacesMap.set(place.place_id, place);
          }
        }
      } catch { /* seguir con siguiente query */ }
    }

    const places = Array.from(allPlacesMap.values());

    if (!places.length) {
      return NextResponse.json({
        success: true,
        empresas: [],
        mensaje: `No se encontraron ETTs en "${city}". Prueba con otra ciudad.`,
      });
    }

    // ── 2. Construir resultados ────────────────────────────────────────
    const empresas: EmpresaCompleta[] = places.map(gr => construirEmpresaDesdeGoogle(gr));

    // ── 3. Enriquecer con emails reales (scraping paralelo) ───────────
    await Promise.all(
      empresas.map(async (empresa) => {
        if (!empresa.urlWeb) return;
        try {
          const emailReal = await extraerEmailsDesdeWeb(empresa.urlWeb);
          if (emailReal) {
            empresa.emailRrhh = emailReal;
            empresa.emailConfianza = "alta";
            if (!empresa.emailsExtraidos.includes(emailReal)) {
              empresa.emailsExtraidos.unshift(emailReal);
            }
          }
        } catch { /* ignorar */ }
      })
    );

    console.log(`✅ ${empresas.length} ETTs encontradas en ${city}: ${empresas.map(e => e.nombre).join(", ")}`);

    return NextResponse.json({ success: true, empresas });
  } catch (error) {
    console.error("[ett/search] Error:", (error as Error).message);
    return NextResponse.json(
      { error: "Error al buscar ETTs" },
      { status: 500 }
    );
  }
}
