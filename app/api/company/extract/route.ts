/**
 * POST /api/company/extract
 * 
 * Búsqueda de empresas por nombre usando Google Places API como fuente primaria.
 * 
 * Flujo:
 *   1. Google Places Find Place → candidates (hasta 5)
 *   2. Google Places Details → nombre, web, teléfono, dirección, rating, sector
 *   3. Email: scraping opcional de la web real + patrones generados del dominio
 * 
 * Acepta: { name: "Mercadona" }
 * Opcional: { name: "Mercadona", city: "Valencia" }
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
    `empleo@${dominio}`,
    `info@${dominio}`,
    `talento@${dominio}`,
    `seleccion@${dominio}`,
    `jobs@${dominio}`,
    `rrhh@${dominio}`,
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
    telefono: gr.formatted_phone_number || gr.international_phone_number || null,
    paginaEmpleo: gr.website ? `${gr.website.replace(/\/$/, "")}/empleo` : null,
    descripcion: null,
    sector: inferirSector(gr.types || []),
    linkedin: null,
    twitter: null,
    instagram: null,
    fuente: "google_places",
    googleRating: gr.rating || null,
    googleReviews: gr.user_ratings_total || null,
    googleAddress: gr.formatted_address || null,
    googleMapsUrl: gr.url || null,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { name?: string; url?: string; city?: string };
    const name = body.name?.trim();
    const city = body.city?.trim();

    if (!name) {
      return NextResponse.json(
        { error: "Nombre de empresa requerido. Ej: { \"name\": \"Mercadona\" }" },
        { status: 400 }
      );
    }

    // ── 1. Google Places (fuente ÚNICA de datos de empresa) ────────────────
    if (!process.env.GOOGLE_PLACES_API_KEY) {
      return NextResponse.json(
        { error: "API de Google Places no configurada" },
        { status: 500 }
      );
    }

    console.log(`🗺️ Buscando en Google Places: "${name}"${city ? ` (${city})` : ""}`);
    const places = await buscarEmpresaGooglePlaces(name, city);

    if (!places.length) {
      return NextResponse.json({
        success: true,
        empresas: [],
        mensaje: `No se encontraron resultados para "${name}". Prueba con el nombre completo de la empresa.`,
      });
    }

    // ── 2. Construir resultados ────────────────────────────────────────────
    const empresas: EmpresaCompleta[] = places.map(gr => construirEmpresaDesdeGoogle(gr));

    // ── 3. Enriquecer con emails reales (scraping paralelo, opcional) ──────
    await Promise.all(
      empresas.map(async (empresa, i) => {
        if (!empresa.urlWeb) return;
        try {
          const emailReal = await extraerEmailsDesdeWeb(empresa.urlWeb);
          if (emailReal) {
            empresa.emailRrhh = emailReal;
            if (!empresa.emailsExtraidos.includes(emailReal)) {
              empresa.emailsExtraidos.unshift(emailReal);
            }
          }
        } catch { /* ignorar */ }
      })
    );

    console.log(`✅ ${empresas.length} empresas encontradas: ${empresas.map(e => e.nombre).join(", ")}`);

    return NextResponse.json({ success: true, empresas });
  } catch (error) {
    console.error("[company/extract] Error:", (error as Error).message);
    return NextResponse.json(
      { error: "Error al buscar empresas" },
      { status: 500 }
    );
  }
}
