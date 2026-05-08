/**
 * Sitemap dinámico para SEO
 * Genera URLs para todas las combinaciones puesto/ciudad
 */

import { MetadataRoute } from "next";
import { getPool } from "@/lib/db";

const PUESTOS_SEO = [
  "camarero", "cocinero", "limpieza", "conductor", "electricista",
  "dependiente", "programador", "enfermero", "administrativo", "mecanico",
  "albanil", "almacen", "soldador", "fontanero", "peluquero",
  "cuidador", "operario", "repartidor", "cajero", "vendedor",
  "auxiliar", "mozo", "camarera", "recepcionista", "chofer",
  "peon", "encargado", "gerente", "diseñador", "analista",
  "comercial", "marketing", "contable", "secretario", "albañil",
];

const CIUDADES_SEO = [
  "madrid", "barcelona", "valencia", "sevilla", "malaga",
  "zaragoza", "murcia", "palma", "las-palmas", "bilbao",
  "alicante", "cordoba", "valladolid", "vigo", "gijon",
  "hospitalet", "vitoria", "la-coruna", "granada", "elche",
  "oviedo", "badalona", "cartagena", "terrassa", "jerez",
  "sabadell", "mostoles", "alcala", "pamplona", "fuenlabrada",
  "tarragona", "leon", "almeria", "burgos", "salamanca",
  "cadiz", "san-sebastian", "toledo", "girona", "logrono",
  "huelva", "badajoz", "tudela", "pamplona", "calahorra",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://buscaycurra.es";

  // URLs estáticas
  const staticUrls: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/precios`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/empleo`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/app/buscar`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/app/gusi`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/aviso-legal`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.2 },
    { url: `${baseUrl}/privacidad`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.2 },
    { url: `${baseUrl}/terminos`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.2 },
    { url: `${baseUrl}/cookies`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.2 },
  ];

  // URLs dinámicas: empleo/puesto/ciudad
  const dynamicUrls: MetadataRoute.Sitemap = [];

  // Solo generar las combinaciones que tienen ofertas reales
  try {
    const pool = getPool();

    // Obtener ciudades que realmente tienen ofertas
    const cityRes = await pool.query(
      `SELECT DISTINCT city FROM "JobListing" WHERE "isActive" = true AND city IS NOT NULL AND city != '' LIMIT 100`
    );
    const ciudadesReales = cityRes.rows.map(r => r.city.toLowerCase().replace(/\s+/g, "-"));

    for (const puesto of PUESTOS_SEO) {
      for (const ciudad of ciudadesReales.slice(0, 30)) {
        dynamicUrls.push({
          url: `${baseUrl}/empleo/${puesto}/${ciudad}`,
          lastModified: new Date(),
          changeFrequency: "daily",
          priority: 0.6,
        });
      }
    }
  } catch (e) {
    console.error("[sitemap] Error:", (e as Error).message);
    // Fallback: generar con ciudades estáticas
    for (const puesto of PUESTOS_SEO.slice(0, 10)) {
      for (const ciudad of CIUDADES_SEO.slice(0, 20)) {
        dynamicUrls.push({
          url: `${baseUrl}/empleo/${puesto}/${ciudad}`,
          lastModified: new Date(),
          changeFrequency: "daily",
          priority: 0.6,
        });
      }
    }
  }

  return [...staticUrls, ...dynamicUrls];
}
