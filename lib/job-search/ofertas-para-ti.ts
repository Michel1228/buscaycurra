/**
 * lib/job-search/ofertas-para-ti.ts — Las ofertas recomendadas, según el CV.
 *
 * El porqué, en lib/job-search/puestos-del-cv.ts: antes eran las seis más
 * nuevas de la ciudad, de cualquier cosa.
 *
 * Primero se cogen las ofertas vivas de su zona (su ciudad y su provincia) y
 * solo sobre esas se mira el título. Con el patrón sobre todas las de España
 * la consulta tardaba 3,5 s; así, 0,13 s (medido el 17 oct 2026).
 *
 * Si en su zona no hay seis de lo suyo, salen menos. Rellenar con lo más
 * reciente de donde sea es justo lo que metía al profesor en la portada.
 */
import { getPool } from "@/lib/db";
import { patronesDelCv, regexDePatrones, patronDelTitulo, exclusionesDelCv } from "@/lib/job-search/puestos-del-cv";
import { provinciaEnTexto } from "@/lib/guzzi/plazas-cursos";
import { provinciaPorCodigoPostal } from "@/lib/guzzi/siguiente-paso";
import { nombreProvincia } from "@/lib/cursos/plazas/provincias";
import { nombresDeLaZona } from "@/lib/cursos/para-esa-persona";
import { correoCreibleParaOferta } from "@/lib/job-search/correo-oferta";

export interface OfertaParaTi {
  id: string;
  titulo: string;
  empresa: string | null;
  ubicacion: string | null;
  salario: string | null;
  fuente: string | null;
  sector: string | null;
  /** Para la tarjeta con "Enviar CV" del buscador. */
  descripcion: string | null;
  url: string | null;
  fecha: string | null;
  emailEmpresa: string | null;
  emailConfianza: string | null;
}

export async function ofertasParaTi(cv: unknown, ciudadPerfil: string | null | undefined, cuantas = 6): Promise<OfertaParaTi[]> {
  const patrones = patronesDelCv(cv);
  // "camarera de pisos" no es de un camarero de bar (falsos amigos).
  const excluir = exclusionesDelCv(cv, patrones);
  const ciudadCv = cv && typeof cv === "object" && typeof (cv as { ciudad?: unknown }).ciudad === "string"
    ? (cv as { ciudad: string }).ciudad : "";
  const todo = `${ciudadPerfil || ""} ${ciudadCv}`;
  const ciudad = (ciudadPerfil || ciudadCv).split(",")[0].replace(/\d+/g, "").trim();
  if (!patrones.length || !ciudad) return [];

  const pool = getPool();
  const codigo = provinciaEnTexto(todo) || provinciaPorCodigoPostal(todo);
  const provincias = codigo ? nombresDeLaZona(nombreProvincia(codigo) || "") .filter(Boolean) : [];
  if (!provincias.length) {
    // La provincia de su ciudad, por cómo vienen las ofertas de allí
    // ("Cintruénigo, Navarra").
    const { rows } = await pool.query<{ p: string }>(
      `SELECT trim(split_part(city, ',', 2)) AS p FROM "JobListing"
        WHERE "isActive" AND lower(country) = 'es' AND city ILIKE $1
        GROUP BY 1 ORDER BY count(*) DESC LIMIT 1`,
      [`${ciudad},%`]
    );
    if (rows[0]?.p) provincias.push(rows[0].p);
  }
  const enCiudad = [`%${ciudad}%`];
  const enZona = [...enCiudad, ...provincias.map((p) => `%${p}%`)];

  const { rows } = await pool.query<{ id: string; title: string; company: string | null; city: string | null; salary: string | null; sourceName: string | null; sector: string | null;
    descripcion: string | null; sourceUrl: string | null; scrapedAt: Date | null; contactEmail: string | null; contactEmailConfianza: string | null }>(
    `WITH zona AS MATERIALIZED (
       SELECT id, title, company, city, salary, "sourceName", sector, "createdAt",
              left(description, 300) AS descripcion, "sourceUrl", "scrapedAt", "contactEmail", "contactEmailConfianza",
              (city ILIKE ANY($2::text[])) AS en_ciudad
         FROM "JobListing"
        WHERE "isActive" AND lower(country) = 'es' AND ("expiresAt" > NOW() OR "expiresAt" IS NULL)
          AND (city ILIKE ANY($3::text[]) OR province ILIKE ANY($3::text[]))
     )
     SELECT * FROM zona WHERE title ~* $1 AND ($4::text IS NULL OR title !~* $4)
      ORDER BY en_ciudad DESC, "createdAt" DESC
      LIMIT 60`,
    [regexDePatrones(patrones), enCiudad, enZona, excluir]
  );

  // Que no salgan seis de lo mismo: en la primera vuelta, como mucho dos por
  // puesto del CV; luego se completa. Y sin repetir título y empresa.
  const vistas = new Set<string>();
  const porPuesto = new Map<number, number>();
  const elegidas: typeof rows = [];
  const resto: typeof rows = [];
  for (const r of rows) {
    const clave = `${r.title}|${r.company}`.toLowerCase();
    if (vistas.has(clave)) continue;
    vistas.add(clave);
    const k = patronDelTitulo(r.title, patrones);
    const n = porPuesto.get(k) ?? 0;
    if (n < 2 && elegidas.length < cuantas) { porPuesto.set(k, n + 1); elegidas.push(r); } else resto.push(r);
  }
  while (elegidas.length < cuantas && resto.length) elegidas.push(resto.shift()!);

  return elegidas.map((r) => ({
    id: r.id, titulo: r.title, empresa: r.company, ubicacion: r.city,
    salario: r.salary, fuente: r.sourceName, sector: r.sector,
    descripcion: r.descripcion, url: r.sourceUrl, fecha: r.scrapedAt ? new Date(r.scrapedAt).toISOString() : null,
    // Todas son de España (la consulta lo pide): un correo .de o de otra empresa no se da.
    ...(correoCreibleParaOferta(r.contactEmail, r.company, "es", r.contactEmailConfianza)
      ? { emailEmpresa: r.contactEmail, emailConfianza: r.contactEmailConfianza }
      : { emailEmpresa: null, emailConfianza: null }),
  }));
}
