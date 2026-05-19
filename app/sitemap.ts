import { MetadataRoute } from "next";

const PUESTOS = [
  "camarero", "cocinero", "limpieza", "conductor", "electricista",
  "dependiente", "programador", "enfermero", "administrativo", "mecanico",
  "albanil", "almacen", "soldador", "fontanero", "peluquero",
  "cuidador", "operario", "repartidor", "cajero", "vendedor",
  "auxiliar", "mozo", "camarera", "recepcionista", "chofer",
  "peon", "encargado", "gerente", "diseñador", "analista",
  "comercial", "marketing", "contable", "secretario", "albañil",
  "desarrollador", "ingeniero", "abogado", "arquitecto", "farmaceutico",
  "fisioterapeuta", "psicologo", "profesor", "periodista", "teleoperador",
  "seguridad", "repartidor", "pintor", "carpintero", "jardinero",
];

const CIUDADES = [
  "madrid", "barcelona", "valencia", "sevilla", "malaga",
  "zaragoza", "murcia", "palma", "las-palmas", "bilbao",
  "alicante", "cordoba", "valladolid", "vigo", "gijon",
  "hospitalet", "vitoria", "la-coruna", "granada", "elche",
  "oviedo", "badalona", "cartagena", "terrassa", "jerez",
  "sabadell", "mostoles", "alcala", "pamplona", "fuenlabrada",
  "almeria", "donostia", "santander", "burgos", "albacete",
  "logrono", "badajoz", "salamanca", "huelva", "tarragona",
  "lleida", "jaen", "caceres", "ourense", "lugo", "ciudad-real",
  "toledo", "cuenca", "zamora", "segovia", "avila", "soria",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://buscaycurra.es";

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/precios`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/auth/registro`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/auth/login`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/empresas`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/aviso-legal`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/privacidad`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/terminos`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/cookies`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ];

  // Generar páginas de empleo (50 puestos × 54 ciudades = 2,700 páginas)
  const empleoPages: MetadataRoute.Sitemap = [];
  for (const puesto of PUESTOS) {
    for (const ciudad of CIUDADES) {
      empleoPages.push({
        url: `${baseUrl}/empleo/${puesto}/${ciudad}`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 0.7,
      });
    }
  }

  return [...staticPages, ...empleoPages];
}
