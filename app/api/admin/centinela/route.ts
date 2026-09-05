/**
 * /api/admin/centinela — Comprueba que la aplicación dice la verdad.
 *
 * POR QUÉ EXISTE, SI YA HAY /api/admin/health
 *
 * El de salud comprueba que la base responde y que las claves de API viven. Eso
 * detecta que algo está caído. Pero ninguno de los fallos que de verdad nos han
 * costado usuarios estaba caído: todos devolvían 200 y una pantalla con buena
 * pinta.
 *
 *   Japón con 19 ofertas .................. la base respondía
 *   6 enlaces muertos en la portada ....... devolvía 200
 *   Buscador sin url, fecha ni fuente ..... devolvía 200
 *   El filtro de salario no filtraba ...... devolvía 200
 *   6.820 ofertas gallegas como suecas .... se insertaban sin error
 *   La notificación del envío daba error ... se creaba correctamente
 *
 * Este comprueba RESULTADOS contra los datos de verdad. Cada comprobación viene
 * de un fallo que pasó de verdad, no de una lista imaginada: si alguna vuelve a
 * suceder, esto lo dice antes de que lo note un usuario.
 *
 * Sale una vez al día desde .github/workflows/centinela.yml y avisa en rojo.
 *
 * REGLA AL AÑADIR COMPROBACIONES: cada una tiene que poder fallar. Una que no
 * hayas visto fallar no sirve de nada — es exactamente el error que ya cometimos
 * con el sello, que daba por bueno un fichero roto porque solo comparaba texto.
 */
import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { secretIguales } from "@/lib/secret-compare";
import { LISTA_PAISES } from "@/lib/paises";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

type Resultado = {
  nombre: string;
  bien: boolean;
  detalle: string;
  /** El fallo real del que nace esta comprobación. */
  nacioDe: string;
};

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-admin-secret");
  if (!secretIguales(secret, process.env.ADMIN_SECRET)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const pool = getPool();
  const r: Resultado[] = [];
  const anota = (nombre: string, bien: boolean, detalle: string, nacioDe: string) =>
    r.push({ nombre, bien, detalle, nacioDe });

  // ── 1. Ningún país de la aplicación está vacío ─────────────────────────────
  // Japón llegó a tener 19 ofertas porque no estaba en ningún calendario. Quien
  // lo elegía abría la aplicación y no había nada, sin ningún aviso.
  try {
    const codigos = LISTA_PAISES.map(p => p.codigo.toLowerCase());
    // Sin lower() en la columna. `country` ya se guarda en minusculas, y
    // envolverla en una funcion impide usar el indice: la primera vez que corrio
    // esto, la consulta murio por statement timeout recorriendo 2,1 millones de
    // filas. Un centinela que no puede mirar no es un aprobado, asi que se
    // apunta como fallo — pero mejor que pueda mirar.
    const { rows } = await pool.query(
      `SELECT country AS pais, count(*)::int AS n
         FROM "JobListing" WHERE "isActive" AND country = ANY($1::text[])
        GROUP BY 1`,
      [codigos]
    );
    const porPais = new Map(rows.map((x: { pais: string; n: number }) => [x.pais, x.n]));
    const UMBRAL = 500;
    const flacos = codigos
      .map(c => ({ c, n: porPais.get(c) ?? 0 }))
      .filter(x => x.n < UMBRAL);
    anota(
      "ningun pais de la app esta vacio",
      flacos.length === 0,
      flacos.length
        ? `por debajo de ${UMBRAL}: ${flacos.map(x => `${x.c}=${x.n}`).join(", ")}`
        : `los ${codigos.length} paises pasan de ${UMBRAL} ofertas`,
      "Japon tenia 19 ofertas: no estaba en ningun calendario"
    );
  } catch (e) {
    anota("ningun pais de la app esta vacio", false, `no se pudo comprobar: ${(e as Error).message}`, "");
  }

  // ── 2. Las fuentes que aportaban siguen aportando ──────────────────────────
  // Una fuente estuvo 74 días devolviendo cero y nadie se enteró, porque el
  // registro decía "8.034 nuevas" contando refrescos como altas.
  try {
    // Siete dias, no tres. Las fuentes por ciudad (EURES_MAD, EURES_LON...)
    // rotan despacio y pueden pasar varios dias sin tocarles el turno: con tres
    // dias el centinela gritaba por fuentes que estaban bien. Siete separa
    // "rota despacio" de "esta muerta" — y sigue cazando de sobra los 74 dias
    // que estuvo callada una fuente sin que nadie se enterara.
    const { rows } = await pool.query(
      `SELECT "sourceName" AS fuente,
              (now()::date - max("createdAt")::date)::int AS dias_callada,
              count(*) FILTER (WHERE "isActive")::int AS vivas
         FROM "JobListing"
        GROUP BY 1 HAVING count(*) FILTER (WHERE "isActive") > 5000
        ORDER BY 2 DESC`
    );
    const mudas = rows.filter((x: { dias_callada: number }) => x.dias_callada > 7);
    anota(
      "las fuentes grandes siguen trayendo ofertas",
      mudas.length === 0,
      mudas.length
        ? `calladas mas de 7 dias: ${mudas.map((x: { fuente: string; dias_callada: number; vivas: number }) => `${x.fuente} (${x.dias_callada}d, ${x.vivas} vivas)`).join(", ")}`
        : `las ${rows.length} fuentes grandes han insertado algo en 7 dias`,
      "una fuente estuvo 74 dias devolviendo cero sin que nada avisara"
    );
  } catch (e) {
    anota("las fuentes grandes siguen trayendo ofertas", false, `no se pudo comprobar: ${(e as Error).message}`, "");
  }

  // ── 3. La bandera de la oferta coincide con su fuente ──────────────────────
  // ADZUNA_ES tenía 6.820 ofertas de A Coruña y Toledo marcadas como suecas:
  // el sincronizador caía a España ante un país que Adzuna no cubre.
  try {
    const { rows } = await pool.query(
      `SELECT "sourceName" AS fuente, country, count(*)::int AS n
         FROM "JobListing"
        WHERE "isActive" AND "sourceName" LIKE 'ADZUNA[_]%'
          AND lower(country) <> lower(right("sourceName", 2))
        GROUP BY 1, 2 ORDER BY 3 DESC LIMIT 5`
    );
    const total = rows.reduce((s: number, x: { n: number }) => s + x.n, 0);
    anota(
      "la bandera de la oferta coincide con su fuente",
      total === 0,
      total === 0
        ? "ninguna oferta de Adzuna lleva un pais distinto al de su fuente"
        : `${total} descuadradas: ${rows.map((x: { fuente: string; country: string; n: number }) => `${x.fuente}→${x.country} (${x.n})`).join(", ")}`,
      "6.820 ofertas de A Coruña y Toledo estaban guardadas como suecas"
    );
  } catch (e) {
    anota("la bandera de la oferta coincide con su fuente", false, `no se pudo comprobar: ${(e as Error).message}`, "");
  }

  // ── 4. Las ofertas no se quedan eternas ────────────────────────────────────
  // Ninguna oferta caducaba nunca: llegó a haber un 7,1% con más de dos meses.
  try {
    const { rows } = await pool.query(
      `SELECT round(100.0 * count(*) FILTER (WHERE "scrapedAt" < now() - interval '60 days')
                    / greatest(count(*), 1), 2)::float AS pct
         FROM "JobListing" WHERE "isActive"`
    );
    const pct = rows[0]?.pct ?? 0;
    anota(
      "las ofertas caducan",
      pct < 3,
      `${pct}% de las vivas tienen mas de 60 dias (limite 3%)`,
      "las ofertas no caducaban nunca: se llego al 7,1%"
    );
  } catch (e) {
    anota("las ofertas caducan", false, `no se pudo comprobar: ${(e as Error).message}`, "");
  }

  // ── 5. Sigue habiendo email al que enviar ──────────────────────────────────
  // Sin email de contacto no hay envío, que es lo único que de verdad hace la
  // aplicación. Si esto se desploma, los envíos se paran sin dar la cara.
  try {
    const { rows } = await pool.query(
      `SELECT round(100.0 * count(*) FILTER (WHERE "contactEmail" IS NOT NULL)
                    / greatest(count(*), 1), 1)::float AS pct
         FROM "JobListing" WHERE "isActive"`
    );
    const pct = rows[0]?.pct ?? 0;
    anota(
      "las ofertas traen email de contacto",
      pct > 50,
      `${pct}% de las vivas tienen email (limite 50%)`,
      "sin email no hay envio, y el envio es lo que hace la aplicacion"
    );
  } catch (e) {
    anota("las ofertas traen email de contacto", false, `no se pudo comprobar: ${(e as Error).message}`, "");
  }

  // ── 6. El buscador devuelve ofertas completas ──────────────────────────────
  // El SELECT pedía "sourceUrl" entrecomillado y el mapeo lo leía en minúsculas,
  // así que url, fecha y fuente llegaban vacías en TODAS las ofertas.
  try {
    const { rows } = await pool.query(
      `SELECT id, "sourceUrl" AS sourceurl, "sourceName" AS sourcename, "scrapedAt" AS scrapedat
         FROM "JobListing" WHERE "isActive" ORDER BY "createdAt" DESC LIMIT 20`
    );
    const incompletas = rows.filter(
      (x: Record<string, unknown>) => !x.sourceurl || !x.sourcename || !x.scrapedat
    );
    anota(
      "las ofertas salen con enlace, fuente y fecha",
      incompletas.length === 0,
      `${rows.length - incompletas.length} de ${rows.length} completas`,
      "url, fecha y fuente llegaban vacias en TODAS las ofertas del buscador"
    );
  } catch (e) {
    anota("las ofertas salen con enlace, fuente y fecha", false, `no se pudo comprobar: ${(e as Error).message}`, "");
  }

  // ── 7. El filtro de salario filtra de verdad ───────────────────────────────
  // Borraba lo que no fuera dígito y pegaba el resto: "30000 - 30000" daba
  // 3000030000, que pasa cualquier filtro. El filtro devolvía de todo.
  try {
    const SQL_MIN = `NULLIF(substring(
      regexp_replace(regexp_replace(salary, '([0-9])[.,]([0-9]{3})', '\\1\\2', 'g'),
                     '([0-9])[.,]([0-9]{3})', '\\1\\2', 'g')
      from '[0-9]+'), '')::bigint`;
    const { rows } = await pool.query(
      `SELECT count(*) FILTER (WHERE salary ~ '[0-9]')::int AS con_numero,
              count(*) FILTER (WHERE salary ~ '[0-9]' AND ${SQL_MIN} >= 200000)::int AS absurdas
         FROM (SELECT salary FROM "JobListing" WHERE "isActive" AND salary ~ '[0-9]' LIMIT 20000) t`
    );
    const { con_numero: conNumero, absurdas } = rows[0] || { con_numero: 0, absurdas: 0 };
    // Sueldos de más de 200.000 los hay, pero son rarísimos. Si son más del 5%
    // es que los números vuelven a estar pegados.
    const pct = conNumero ? (100 * absurdas) / conNumero : 0;
    anota(
      "el filtro de salario no pega los numeros del rango",
      pct < 5,
      `${absurdas} de ${conNumero} pasan de 200.000 (${pct.toFixed(1)}%, limite 5%)`,
      '"30000 - 30000" se convertia en 3000030000 y pasaba cualquier filtro'
    );
  } catch (e) {
    anota("el filtro de salario no pega los numeros del rango", false, `no se pudo comprobar: ${(e as Error).message}`, "");
  }

  const fallos = r.filter(x => !x.bien);
  return NextResponse.json(
    {
      ok: fallos.length === 0,
      cuando: new Date().toISOString(),
      pasan: r.length - fallos.length,
      fallan: fallos.length,
      comprobaciones: r,
    },
    { status: fallos.length ? 500 : 200 }
  );
}
