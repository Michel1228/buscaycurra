import { MetadataRoute } from "next";
import { LISTA_PAISES } from "@/lib/paises";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://buscaycurra.es";

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/precios`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/empleo`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/empresas`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
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
