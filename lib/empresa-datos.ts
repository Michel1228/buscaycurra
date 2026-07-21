/**
 * lib/empresa-datos.ts — Lógica compartida de datos de empresa (Google Places).
 *
 * Antes esta lógica estaba DUPLICADA en /api/company/extract y /api/ett/search,
 * y una tercera copia peor en /api/gusi/analyze-image. Unificada aquí para que
 * los tres den la misma calidad.
 *
 * Punto clave — HONESTIDAD DEL EMAIL:
 *   Los emails tipo `empleo@dominio` son PATRONES INVENTADOS, no direcciones
 *   comprobadas. Antes se devolvían como si fueran reales y el usuario gastaba
 *   sus envíos diarios en direcciones que rebotan. Ahora cada email lleva un
 *   nivel de confianza:
 *     - "alta"  → encontrado de verdad en la web de la empresa
 *     - "media" → patrón generado, pero el dominio SÍ acepta correo (MX válido)
 *     - "baja"  → patrón generado y el dominio no tiene MX (casi seguro rebota)
 */
import { promises as dns } from "dns";
import { extraerInfoEmpresa } from "@/lib/company-extractor";
import { inferirSector, getPlacePhotoUrl, type GooglePlaceResult } from "@/lib/google-places";

export type EmailConfianza = "alta" | "media" | "baja";

export interface EmpresaCompleta {
  nombre: string;
  dominio: string | null;
  urlWeb: string | null;
  emailRrhh: string | null;
  emailContacto: string | null;
  emailsExtraidos: string[];
  emailConfianza: EmailConfianza;
  telefono: string | null;
  paginaEmpleo: string | null;
  descripcion: string | null;
  sector: string | null;
  linkedin: string | null;
  twitter: string | null;
  instagram: string | null;
  fuente: string;
  fotos: string[];
  abiertoAhora: boolean | null;
  horario: string[] | null;
  googleRating?: number | null;
  googleReviews?: number | null;
  googleAddress?: string | null;
  googleMapsUrl?: string | null;
}

export function extraerDominio(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

/** Patrones de email por orden de probabilidad para RRHH. */
export function generarEmails(dominio: string, prioridadRrhh = false): string[] {
  if (!dominio) return [];
  const base = prioridadRrhh
    ? ["rrhh", "seleccion", "empleo", "talento", "jobs", "info", "contacto"]
    : ["empleo", "info", "talento", "seleccion", "jobs", "rrhh", "contacto"];
  return base.map((p) => `${p}@${dominio}`);
}

// ── Verificación MX ───────────────────────────────────────────────────────────
// Comprueba que el DOMINIO puede recibir correo. No garantiza que el buzón
// concreto exista (eso solo se sabe al enviar), pero descarta el caso peor:
// dominios sin servidor de correo, donde el envío rebota siempre.
const cacheMX = new Map<string, { ok: boolean; ts: number }>();
const MX_TTL_MS = 24 * 60 * 60 * 1000; // 24 h

export async function dominioAceptaCorreo(dominio: string): Promise<boolean> {
  if (!dominio) return false;
  const cached = cacheMX.get(dominio);
  if (cached && Date.now() - cached.ts < MX_TTL_MS) return cached.ok;

  let ok = false;
  try {
    const registros = await Promise.race([
      dns.resolveMx(dominio),
      new Promise<never>((_, rej) => setTimeout(() => rej(new Error("timeout")), 4000)),
    ]);
    ok = Array.isArray(registros) && registros.length > 0;
  } catch {
    ok = false;
  }
  cacheMX.set(dominio, { ok, ts: Date.now() });
  return ok;
}

// ── Construcción ──────────────────────────────────────────────────────────────
export function construirEmpresaDesdeGoogle(
  gr: GooglePlaceResult,
  opts: { fuente: string; sector?: string; prioridadRrhh?: boolean }
): EmpresaCompleta {
  const dominio = gr.website ? extraerDominio(gr.website) : "";
  const emailsGenerados = generarEmails(dominio, opts.prioridadRrhh);

  // Las fotos se sirven por nuestro proxy: la URL directa de Google lleva la
  // API key dentro y filtrarla al navegador la dejaría expuesta.
  const fotos = (gr.photos || [])
    .slice(0, 6)
    .map((p) => `/api/company/foto?ref=${encodeURIComponent(p.photo_reference)}`);

  return {
    nombre: gr.name,
    dominio: dominio || null,
    urlWeb: gr.website || null,
    emailRrhh: emailsGenerados[0] || null,
    emailContacto: emailsGenerados.find((e) => e.startsWith("info@") || e.startsWith("contacto@")) || null,
    emailsExtraidos: emailsGenerados,
    emailConfianza: "baja", // se recalcula en enriquecerEmpresas()
    telefono: gr.formatted_phone_number || gr.international_phone_number || null,
    paginaEmpleo: gr.website ? `${gr.website.replace(/\/$/, "")}/empleo` : null,
    descripcion: null,
    sector: opts.sector ?? inferirSector(gr.types || []),
    linkedin: null,
    twitter: null,
    instagram: null,
    fuente: opts.fuente,
    fotos,
    abiertoAhora: gr.opening_hours?.open_now ?? null,
    horario: gr.opening_hours?.weekday_text ?? null,
    googleRating: gr.rating || null,
    googleReviews: gr.user_ratings_total || null,
    googleAddress: gr.formatted_address || null,
    googleMapsUrl: gr.url || null,
  };
}

/**
 * Enriquece en paralelo: intenta sacar el email REAL de la web y, si no lo hay,
 * al menos comprueba por MX si el patrón generado tiene alguna posibilidad.
 */
export async function enriquecerEmpresas(empresas: EmpresaCompleta[]): Promise<void> {
  await Promise.all(
    empresas.map(async (empresa) => {
      if (!empresa.urlWeb || !empresa.dominio) return;
      try {
        const datos = await extraerInfoEmpresa(empresa.urlWeb);
        const emailReal = datos?.emailRrhh && !datos.emailRrhh.includes("www.") ? datos.emailRrhh : null;

        if (emailReal) {
          empresa.emailRrhh = emailReal;
          empresa.emailConfianza = "alta";
          if (!empresa.emailsExtraidos.includes(emailReal)) {
            empresa.emailsExtraidos.unshift(emailReal);
          }
        } else {
          // Sin email real: el patrón solo vale si el dominio recibe correo.
          empresa.emailConfianza = (await dominioAceptaCorreo(empresa.dominio)) ? "media" : "baja";
        }

        if (datos?.paginaEmpleo) empresa.paginaEmpleo = datos.paginaEmpleo;
      } catch {
        try {
          empresa.emailConfianza = (await dominioAceptaCorreo(empresa.dominio)) ? "media" : "baja";
        } catch { /* se queda en baja */ }
      }
    })
  );
}
