import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/precios", "/empleo", "/aviso-legal", "/privacidad", "/terminos", "/cookies"],
        disallow: ["/app/", "/api/", "/auth/"],
      },
    ],
    sitemap: "https://buscaycurra.es/sitemap.xml",
  };
}
