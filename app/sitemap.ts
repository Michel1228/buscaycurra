import { MetadataRoute } from "next";
import { LISTA_PAISES } from "@/lib/paises";
import { tiposPorPais } from "@/lib/cursos/tipos";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://buscaycurra.es";

  // Las fichas de curso salen del catálogo: al añadir un tipo nuevo entra solo
  // aquí, sin tener que acordarse de tocar esta lista.
  const paginasCursos: MetadataRoute.Sitemap = tiposPorPais("ES").map(t => ({
    url: `${baseUrl}/cursos/${t.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/precios`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/cursos`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    // Prioridad alta a propósito: "acreditar experiencia laboral" lo busca
    // mucha gente y no hay ningún portal de empleo contándolo bien.
    { url: `${baseUrl}/cursos/acreditar`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    // "derechos au pair" lo busca gente que aun no se ha registrado, muchas
    // veces ya en el pais de acogida y con un problema encima.
    { url: `${baseUrl}/derechos-au-pair`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    // "cobrar el paro en otro pais" lo busca gente que esta decidiendo si se
    // va, antes de registrarse en nada.
    { url: `${baseUrl}/llevarte-el-paro`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    // "se pone foto en el CV en Reino Unido" lo busca muchisima gente.
    { url: `${baseUrl}/cv-por-pais`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    ...paginasCursos,
    { url: `${baseUrl}/trabajar-en`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/empleo`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/empresas`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/sobre-nosotros`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/privacidad`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/terminos`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/aviso-legal`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/cookies`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ];

  // Páginas de país — alta prioridad SEO
  const countryPages: MetadataRoute.Sitemap = LISTA_PAISES.map((pais) => ({
    url: `${baseUrl}/trabajar-en/${pais.codigo.toLowerCase()}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.9,
  }));

  // Páginas de keyword por país (top 5 keywords por país)
  const keywordPages: MetadataRoute.Sitemap = LISTA_PAISES.flatMap((pais) =>
    pais.keywordsLaborales.slice(0, 5).map((kw) => ({
      url: `${baseUrl}/trabajar-en/${pais.codigo.toLowerCase()}/${encodeURIComponent(kw.toLowerCase())}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }))
  );

  return [...staticPages, ...countryPages, ...keywordPages];
}
