/**
 * GET /api/salarios/calculadora?bruto=30000&pais=ES
 * Calculadora de sueldo neto para 15 países europeos.
 * Datos fiscales actualizados 2025-2026.
 */

import { NextRequest, NextResponse } from "next/server";

// Trampos IRPF 2025 España (simplificado)
const TRAMOS_ES = [
  { min: 0, max: 12450, rate: 0.19 },
  { min: 12450, max: 20200, rate: 0.24 },
  { min: 20200, max: 35200, rate: 0.30 },
  { min: 35200, max: 60000, rate: 0.37 },
  { min: 60000, max: 300000, rate: 0.45 },
  { min: 300000, max: Infinity, rate: 0.47 },
];

// Tablas simplificadas para otros países (tramo único medio)
const TAX_RATES: Record<string, { rate: number; socialSecurity: number; currency: string; name: string }> = {
  // Tasas efectivas medias (2025-2026). IRPF + Seguridad Social del TRABAJADOR.
  ES: { rate: 0.24, socialSecurity: 0.0635, currency: "€", name: "España" },
  DE: { rate: 0.22, socialSecurity: 0.20, currency: "€", name: "Alemania" },
  FR: { rate: 0.22, socialSecurity: 0.20, currency: "€", name: "Francia" },
  IT: { rate: 0.25, socialSecurity: 0.10, currency: "€", name: "Italia" },
  PT: { rate: 0.20, socialSecurity: 0.11, currency: "€", name: "Portugal" },
  NL: { rate: 0.26, socialSecurity: 0.15, currency: "€", name: "Países Bajos" },
  IE: { rate: 0.23, socialSecurity: 0.04, currency: "€", name: "Irlanda" },
  BE: { rate: 0.30, socialSecurity: 0.13, currency: "€", name: "Bélgica" },
  AT: { rate: 0.26, socialSecurity: 0.18, currency: "€", name: "Austria" },
  PL: { rate: 0.12, socialSecurity: 0.23, currency: "zł", name: "Polonia" },
  SE: { rate: 0.30, socialSecurity: 0.00, currency: "kr", name: "Suecia" },
  DK: { rate: 0.38, socialSecurity: 0.08, currency: "kr", name: "Dinamarca" },
  FI: { rate: 0.24, socialSecurity: 0.10, currency: "€", name: "Finlandia" },
  NO: { rate: 0.24, socialSecurity: 0.08, currency: "kr", name: "Noruega" },
  CH: { rate: 0.15, socialSecurity: 0.12, currency: "CHF", name: "Suiza" },
};

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const bruto = parseFloat(searchParams.get("bruto") || "0");
  const pais = (searchParams.get("pais") || "ES").toUpperCase();

  if (!bruto || bruto <= 0) {
    return NextResponse.json({ error: "Parámetro 'bruto' requerido (ej: 30000)" }, { status: 400 });
  }

  const tax = TAX_RATES[pais] || TAX_RATES.ES;

  // Calcular IRPF progresivo (ES) o simplificado (resto)
  let irpf = 0;
  if (pais === "ES") {
    let restante = bruto;
    for (const tramo of TRAMOS_ES) {
      const base = Math.min(restante, tramo.max - tramo.min);
      irpf += base * tramo.rate;
      restante -= base;
      if (restante <= 0) break;
    }
  } else {
    irpf = bruto * tax.rate;
  }

  const seguridadSocial = bruto * tax.socialSecurity;
  const netoAnual = bruto - irpf - seguridadSocial;
  const netoMensual = netoAnual / 12;
  const neto12Pagas = (bruto - irpf - seguridadSocial) / 12;
  const neto14Pagas = (bruto - irpf - seguridadSocial) / 14;

  return NextResponse.json({
    pais: tax.name,
    moneda: tax.currency,
    brutoAnual: Math.round(bruto),
    brutoMensual: Math.round(bruto / 12),
    irpfAnual: Math.round(irpf),
    irpfPct: Math.round((irpf / bruto) * 100),
    seguridadSocial: Math.round(seguridadSocial),
    netoAnual: Math.round(netoAnual),
    netoMensual12Pagas: Math.round(neto12Pagas),
    netoMensual14Pagas: pais === "ES" ? Math.round(neto14Pagas) : null,
    retencionEfectiva: Math.round(((irpf + seguridadSocial) / bruto) * 100),
  });
}
