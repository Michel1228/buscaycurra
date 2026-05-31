/**
 * POST /api/company/extract
 * 
 * Extracción COMPLETA de datos de empresa a partir de solo el NOMBRE.
 * 
 * Estrategia multi-fuente:
 *   1. Resolver dominio: name.es, name.com, DuckDuckGo, Wikipedia
 *   2. Scraping web: emails, teléfonos, página empleo (usa company-extractor.ts)
 *   3. DuckDuckGo: descripción, sector, info adicional
 *   4. Social media: detectar LinkedIn, Twitter, Instagram
 *   5. Generación patrones email como fallback
 * 
 * Acepta: { name: "Mercadona" }
 * Opcional: { name: "Mercadona", city: "Valencia" }
 */
import { NextRequest, NextResponse } from "next/server";
import { extraerInfoEmpresa } from "@/lib/company-extractor";
import { buscarEmpresaGooglePlaces, inferirSector, type GooglePlaceResult } from "@/lib/google-places";

export const dynamic = "force-dynamic";

// ─── Tipos ────────────────────────────────────────────────────────────────────

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
  // Google Places extras
  googleRating?: number | null;
  googleReviews?: number | null;
  googleAddress?: string | null;
  googleMapsUrl?: string | null;
}

// ─── Resolvedor de dominio ────────────────────────────────────────────────────

async function findCompanyWebsite(name: string): Promise<{ url: string; fuente: string } | null> {
  const slug = name.toLowerCase()
    .replace(/[^a-z0-9ñ]/g, "")
    .replace(/sa$|sl$|sau$|slu$|sa\.$|sl\.$/, "");

  // 1. Probar combinaciones comunes de dominio (.es primero, prioridad España)
  const candidates = [
    `https://www.${slug}.es`,
    `https://${slug}.es`,
    `https://www.${slug}.com`,
    `https://${slug}.com`,
    `https://www.grupo${slug}.es`,
    `https://www.grupo${slug}.com`,
    `https://www.${slug}.org`,
  ];

  for (const url of candidates) {
    try {
      const res = await fetch(url, {
        method: "HEAD",
        signal: AbortSignal.timeout(4000),
        headers: { "User-Agent": "Mozilla/5.0 (compatible; BuscayCurra/1.0)" },
        redirect: "follow",
      });
      if (res.ok) {
        console.log(`✅ Dominio candidateo: ${url}`);
        return { url, fuente: "dns_guess" };
      }
    } catch { /* probar siguiente */ }
  }

  // 2. DuckDuckGo Instant Answer (gratis, sin API key)
  try {
    const q = encodeURIComponent(`${name} empresa sitio web oficial`);
    const ddgRes = await fetch(
      `https://api.duckduckgo.com/?q=${q}&format=json&no_html=1&skip_disambig=1`,
      { signal: AbortSignal.timeout(6000) }
    );
    if (ddgRes.ok) {
      const data = await ddgRes.json() as {
        AbstractURL?: string;
        AbstractText?: string;
        AbstractSource?: string;
        RelatedTopics?: Array<{ FirstURL?: string; Text?: string }>;
      };

      // AbstractURL es la respuesta oficial
      if (data.AbstractURL) {
        const u = new URL(data.AbstractURL);
        if (!u.hostname.includes("wikipedia")) {
          console.log(`✅ DuckDuckGo Abstract: ${u.origin}`);
          return { url: u.origin, fuente: "duckduckgo_abstract" };
        }
      }

      // Related Topics sin wikipedia
      if (data.RelatedTopics?.length) {
        for (const t of data.RelatedTopics) {
          if (t.FirstURL) {
            const u = new URL(t.FirstURL);
            const h = u.hostname.toLowerCase();
            if (!h.includes("wikipedia") && !h.includes("linkedin") && !h.includes("infojobs")) {
              console.log(`✅ DuckDuckGo Related: ${u.origin}`);
              return { url: u.origin, fuente: "duckduckgo_related" };
            }
          }
        }
      }
    }
  } catch { /* ignorar */ }

  // 3. Fallback: .es (asumimos empresa española)
  const fallback = `https://www.${slug}.es`;
  console.log(`⚠️ Fallback: ${fallback}`);
  return { url: fallback, fuente: "fallback_es" };
}

// ─── Información adicional via DuckDuckGo ─────────────────────────────────────

async function getCompanyInfo(name: string): Promise<{
  descripcion: string | null;
  sector: string | null;
}> {
  try {
    const q = encodeURIComponent(`${name} empresa qué es sector`);
    const res = await fetch(
      `https://api.duckduckgo.com/?q=${q}&format=json&no_html=1`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return { descripcion: null, sector: null };

    const data = await res.json() as {
      AbstractText?: string;
      AbstractSource?: string;
      RelatedTopics?: Array<{ Text?: string }>;
    };

    const descripcion = data.AbstractText || null;

    // Intentar inferir sector del Abstract o RelatedTopics
    let sector: string | null = null;
    const todo = [
      data.AbstractText || "",
      ...(data.RelatedTopics || []).map(t => t.Text || ""),
    ].join(" ").toLowerCase();

    const SECTORES: Record<string, string> = {
      "supermercado|alimentación|distribución alimentaria": "Alimentación / Retail",
      "tecnología|software|informática|desarrollo": "Tecnología / IT",
      "banca|banco|financiero|seguros|aseguradora": "Banca / Seguros",
      "hotel|restaurante|turismo|hostelería": "Hostelería / Turismo",
      "construcción|constructora|obra|inmobiliaria": "Construcción / Inmobiliaria",
      "farmacéutica|farmacia|laboratorio|salud|hospital|sanidad": "Salud / Farmacia",
      "energía|eléctrica|gas|petróleo|renovable": "Energía",
      "telecomunicaciones|telefonía|móvil|internet": "Telecomunicaciones",
      "automoción|coche|vehículo|automóvil": "Automoción",
      "textil|moda|ropa|indumentaria": "Moda / Textil",
      "transporte|logística|mensajería|paquetería": "Transporte / Logística",
      "consultoría|consultora|auditoría|asesoría": "Consultoría",
      "educación|colegio|universidad|formación": "Educación",
      "industrial|fábrica|manufactura|producción": "Industria / Manufactura",
    };

    for (const [patrones, etiqueta] of Object.entries(SECTORES)) {
      const regex = new RegExp(patrones, "i");
      if (regex.test(todo)) {
        sector = etiqueta;
        break;
      }
    }

    return { descripcion, sector };
  } catch {
    return { descripcion: null, sector: null };
  }
}

// ─── Detectar redes sociales ──────────────────────────────────────────────────

async function findSocialMedia(domain: string, name: string): Promise<{
  linkedin: string | null;
  twitter: string | null;
  instagram: string | null;
}> {
  const slug = name.toLowerCase().replace(/[^a-z0-9]/g, "");
  const results: { linkedin: string | null; twitter: string | null; instagram: string | null } = {
    linkedin: null, twitter: null, instagram: null,
  };

  const checks = [
    { key: "linkedin" as const, url: `https://www.linkedin.com/company/${slug}` },
    { key: "twitter" as const, url: `https://twitter.com/${slug}` },
    { key: "instagram" as const, url: `https://www.instagram.com/${slug}` },
  ];

  await Promise.all(
    checks.map(async ({ key, url }) => {
      try {
        const res = await fetch(url, {
          method: "HEAD",
          signal: AbortSignal.timeout(4000),
          headers: { "User-Agent": "Mozilla/5.0 (compatible; BuscayCurra/1.0)" },
        });
        if (res.ok) results[key] = url;
      } catch { /* no existe */ }
    })
  );

  return results;
}

// ─── Clean & deduplicate emails ────────────────────────────────────────────────

function cleanEmails(emails: string[]): string[] {
  const seen = new Set<string>();
  const DOMINIOS_FALSOS = ["example.com", "ejemplo.com", "test.com", "sample.com", "domain.com", "email.com"];
  return emails
    .map(e => e.toLowerCase().trim())
    .filter(e => {
      if (!e.includes("@") || e.length < 6) return false;
      const dominio = e.split("@")[1];
      if (DOMINIOS_FALSOS.some(d => dominio === d || dominio.includes(d))) return false;
      if (seen.has(e)) return false;
      seen.add(e);
      return true;
    });
}

// ─── Handler principal ────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { name?: string; url?: string; city?: string };
    const name = body.name?.trim();
    const city = body.city?.trim();
    let url = body.url?.trim();

    if (!name && !url) {
      return NextResponse.json(
        { error: "Nombre de empresa requerido. Ej: { \"name\": \"Mercadona\" }" },
        { status: 400 }
      );
    }

    // ── 0. Google Places (fuente primaria de datos REALES) ──────────────────
    let googleResult: GooglePlaceResult | null = null;
    if (name && process.env.GOOGLE_PLACES_API_KEY) {
      try {
        console.log(`🗺️ Buscando en Google Places: "${name}"${city ? ` (${city})` : ""}`);
        const places = await buscarEmpresaGooglePlaces(name, city);
        if (places.length > 0) {
          googleResult = places[0]; // Mejor coincidencia
          console.log(`✅ Google Places encontró: ${googleResult.name}`);
        } else {
          console.log(`⚠️ Google Places sin resultados para: "${name}"`);
        }
      } catch (err) {
        console.warn("Google Places falló:", (err as Error).message);
      }
    }

    // ── 1. Resolver dominio ─────────────────────────────────────────────────
    if (!url && name) {
      const found = await findCompanyWebsite(name);
      if (!found) {
        return NextResponse.json({
          error: `No se pudo encontrar la web de "${name}". Prueba con la URL completa.`,
        }, { status: 404 });
      }
      url = found.url;
    }

    if (!url?.startsWith("http")) url = `https://${url}`;
    const parsedUrl = new URL(url);

    // ── 2. Scraping web (email, teléfono, página empleo) ─────────────────────
    console.log(`🔍 Extrayendo datos de: ${parsedUrl.href}`);
    const [datosWeb, infoDDG, socialMedia] = await Promise.all([
      extraerInfoEmpresa(parsedUrl.href).catch(() => null),
      name ? getCompanyInfo(name) : Promise.resolve({ descripcion: null, sector: null }),
      findSocialMedia(parsedUrl.hostname, name || parsedUrl.hostname),
    ]);

    // ── 3. Componer resultado (Google Places como fuente primaria) ──────────
    let empresa: EmpresaCompleta;

    if (googleResult) {
      // Usar Google Places como fuente principal
      // Limpiar dominio para emails
      const dominioGoogle = googleResult.website
        ? new URL(googleResult.website).hostname.replace(/^www\\./, "")
        : parsedUrl.hostname.replace(/^www\\./, "");

      const emailsExtraidos: string[] = [];

      // Generar emails basados en el dominio limpio (NO usar scraped si vienen con www)
      const alternativos = [
        `empleo@${dominioGoogle}`,
        `info@${dominioGoogle}`,
        `talento@${dominioGoogle}`,
        `seleccion@${dominioGoogle}`,
        `jobs@${dominioGoogle}`,
      ];
      alternativos.forEach(alt => {
        if (!emailsExtraidos.includes(alt)) emailsExtraidos.push(alt);
      });
      // Si el scraping encontró email real (no generico rrhh@www), añadirlo también
      if (datosWeb?.emailRrhh && !datosWeb.emailRrhh.includes("www.")) {
        emailsExtraidos.unshift(datosWeb.emailRrhh);
      }

      empresa = {
        nombre: googleResult.name || name || parsedUrl.hostname,
        dominio: dominioGoogle,  // Usar dominio limpio de Google
        urlWeb: googleResult.website || url || parsedUrl.href,
        emailRrhh: (datosWeb?.emailRrhh && !datosWeb.emailRrhh.includes("www.") ? datosWeb.emailRrhh : null) || emailsExtraidos[0] || null,
        emailContacto: emailsExtraidos.find(e => e.includes("info@") || e.includes("contacto@")) || null,
        emailsExtraidos: cleanEmails(emailsExtraidos),
        telefono: googleResult.formatted_phone_number || datosWeb?.telefono || null,
        paginaEmpleo: datosWeb?.paginaEmpleo || null,
        descripcion: infoDDG.descripcion || null,
        sector: inferirSector(googleResult.types || []) || infoDDG.sector || null,
        linkedin: socialMedia.linkedin,
        twitter: socialMedia.twitter,
        instagram: socialMedia.instagram,
        fuente: "google_places",
        googleRating: googleResult.rating || null,
        googleReviews: googleResult.user_ratings_total || null,
        googleAddress: googleResult.formatted_address || null,
        googleMapsUrl: googleResult.url || null,
      };
    } else {
      // Fallback: método actual
      const emailsExtraidos: string[] = [];
      if (datosWeb?.emailRrhh) emailsExtraidos.push(datosWeb.emailRrhh);

      if (!datosWeb?.emailRrhh || datosWeb.emailRrhh.startsWith("rrhh@")) {
        const dominio = parsedUrl.hostname.replace(/^www\\./, "");
        const alternativos = [
          `empleo@${dominio}`,
          `info@${dominio}`,
          `contacto@${dominio}`,
          `talento@${dominio}`,
          `seleccion@${dominio}`,
          `jobs@${dominio}`,
        ];
        for (const alt of alternativos) {
          if (!emailsExtraidos.includes(alt)) emailsExtraidos.push(alt);
        }
      }

      empresa = {
        nombre: datosWeb?.nombre || name || parsedUrl.hostname,
        dominio: parsedUrl.hostname,
        urlWeb: parsedUrl.href,
        emailRrhh: datosWeb?.emailRrhh || emailsExtraidos[0] || null,
        emailContacto: emailsExtraidos.find(e => e.includes("info@") || e.includes("contacto@")) || null,
        emailsExtraidos: cleanEmails(emailsExtraidos),
        telefono: datosWeb?.telefono || null,
        paginaEmpleo: datosWeb?.paginaEmpleo || null,
        descripcion: infoDDG.descripcion || null,
        sector: infoDDG.sector || null,
        linkedin: socialMedia.linkedin,
        twitter: socialMedia.twitter,
        instagram: socialMedia.instagram,
        fuente: "extraccion_completa",
      };
    }

    console.log(`✅ Extracción completa para: ${empresa.nombre}`);

    return NextResponse.json({ success: true, empresa });
  } catch (error) {
    console.error("[company/extract] Error:", (error as Error).message);
    return NextResponse.json(
      { error: `Error: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}
