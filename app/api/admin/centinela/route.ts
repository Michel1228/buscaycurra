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
 * Sale una vez al día desde el crontab del VPS (scripts/vps/centinela.sh), que
 * manda un correo cuando el resultado cambia respecto a la vez anterior, y los
 * lunes mientras sigan los fallos. Se escribió primero como workflow de GitHub y
 * nunca llegó a ejecutarse: GitHub solo lanza calendarios programados desde la
 * rama main, y allí se desactivaron el 5 de julio de 2026.
 *
 * REGLA AL AÑADIR COMPROBACIONES: cada una tiene que poder fallar. Una que no
 * hayas visto fallar no sirve de nada — es exactamente el error que ya cometimos
 * con el sello, que daba por bueno un fichero roto porque solo comparaba texto.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getPool } from "@/lib/db";
import { secretIguales } from "@/lib/secret-compare";
import { LISTA_PAISES } from "@/lib/paises";
import { OFERTAS_ESPANA } from "@/lib/promesas";
// Importacion normal, como en lib/places-quota.ts. Con `await import("ioredis")`
// dentro de la funcion, el paquete compilado devolvia un objeto sin constructor
// ("a is not a constructor") y el control 13 daba fallo aunque Redis estuviera
// perfecto. Lo cazo el propio centinela en su primera ejecucion (22 sep 2026).
import { Redis } from "ioredis";
import { recorridoDeUsuario } from "@/lib/centinela/recorrido";
import { limitesDeCorreo } from "@/lib/centinela/limites-correo";
import { getCvSenderQueue } from "@/lib/cv-sender/queue";
import { salarioMinimoSql, CASOS_SALARIO } from "@/lib/job-search/salario-sql";

const supabaseAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

export const dynamic = "force-dynamic";
export const maxDuration = 240; // el recorrido de usuario genera un PDF y llama a la IA

type Resultado = {
  nombre: string;
  bien: boolean;
  detalle: string;
  /** El fallo real del que nace esta comprobación. */
  nacioDe: string;
};

/**
 * Para las comprobaciones que recorren JobListing entera.
 *
 * El 3 nov 2026 la tabla pasaba de 4,5 millones de filas y recorrerla tardaba
 * unos 20 s. El pool corta a los 15 s, y cuatro controles salían «no se pudo
 * comprobar» sin que pasara nada malo en los datos. SET LOCAL sube el límite
 * solo para esta consulta, como en /api/admin/metricas: es una lectura, una
 * vez al día.
 */
async function consultaLarga(sql: string, params?: unknown[]) {
  const cliente = await getPool().connect();
  try {
    await cliente.query("BEGIN");
    await cliente.query("SET LOCAL statement_timeout = 60000");
    const res = await cliente.query(sql, params);
    await cliente.query("COMMIT");
    return res;
  } catch (e) {
    await cliente.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    cliente.release();
  }
}

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
    const { rows } = await consultaLarga(
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
    // Siete dias, no tres: una fuente puede pasar varios dias sin turno. Siete
    // separa "rota despacio" de "esta muerta" y sigue cazando de sobra los 74
    // dias que estuvo callada una fuente sin que nadie se enterara.
    //
    // DOS TRAMPAS DE NOMBRE que daban falsas alarmas todos los dias:
    //
    //  - "EURES_MAD", "EURES_SEA"... NO son EURES: son Careerjet, que guarda la
    //    fuente como EURES_ + tres letras de la ciudad (error historico,
    //    explicado en sync-worker.ts). Por ciudad, cada una espera semanas su
    //    turno en la rotacion, asi que se juzgan juntas: si la familia entera
    //    ha insertado algo, Careerjet funciona.
    //
    //  - "careerjet_US", "careerjet_UK"... (minusculas) son nombres RETIRADOS
    //    de una version antigua. El codigo actual ya no escribe con ellos, se
    //    van vaciando solos al caducar, y no volveran a tener altas nunca.
    //
    // Se usa LIKE y no expresiones regulares: la consulta recorre la tabla
    // entera y con el VPS al 85% de robo de CPU conviene la comparacion barata.
    const { rows } = await consultaLarga(
      `WITH f AS (
         SELECT CASE WHEN "sourceName" LIKE 'EURES!_%' ESCAPE '!'
                     THEN 'Careerjet (EURES_ciudad)' ELSE "sourceName" END AS fuente,
                "createdAt", "isActive"
           FROM "JobListing"
          WHERE "sourceName" NOT LIKE 'careerjet!_%' ESCAPE '!'
       )
       SELECT fuente,
              (now()::date - max("createdAt")::date)::int AS dias_callada,
              count(*) FILTER (WHERE "isActive")::int AS vivas
         FROM f
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

  // España es lo que más importa y la comprobación de arriba no lo veía: el barrido
  // de Adzuna falló 5 de 13 noches (503 al empezar por España) y, como otra tarea
  // mete unas pocas, la fuente nunca llegaba a estar 7 días callada.
  try {
    const { rows } = await pool.query(
      `SELECT count(*)::int AS n FROM "JobListing"
        WHERE "sourceName" = 'ADZUNA_ES' AND "createdAt" > now() - interval '48 hours'`
    );
    anota(
      "el barrido de Adzuna trae ofertas de España",
      rows[0].n >= 500,
      `${rows[0].n} ofertas nuevas de Adzuna España en 48 horas (lo normal son unas 3.000 al día)`,
      "1 nov 2026: España se quedó 5 de 13 noches sin barrido sin que nada avisara"
    );
  } catch (e) {
    anota("el barrido de Adzuna trae ofertas de España", false, `no se pudo comprobar: ${(e as Error).message}`, "");
  }

  // ── 3. La bandera de la oferta coincide con su fuente ──────────────────────
  // ADZUNA_ES tenía 6.820 ofertas de A Coruña y Toledo marcadas como suecas:
  // el sincronizador caía a España ante un país que Adzuna no cubre.
  //
  // Hasta el 4 nov 2026 ponía LIKE 'ADZUNA[_]%', que es de SQL Server: en
  // Postgres los corchetes no son especiales, no casaba con ninguna fuente y el
  // control salía bien siempre. Con el patrón bueno había 1.336 descuadradas:
  // 1.178 de Australia marcadas como de EE. UU., 142 de España como suecas y
  // 16 de Francia como de EE. UU.
  try {
    const { rows } = await consultaLarga(
      `SELECT "sourceName" AS fuente, country, count(*)::int AS n
         FROM "JobListing"
        WHERE "isActive" AND "sourceName" LIKE 'ADZUNA!_%' ESCAPE '!'
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
    const { rows } = await consultaLarga(
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
    // Sobre una MUESTRA del 2%, no sobre los 2,3 millones de filas: el 23 sep
    // 2026 la consulta entera empezo a pasarse del tiempo maximo con la base
    // ocupada sincronizando, y un control que no puede mirar es un fallo mas.
    // Para saber si el porcentaje ronda el 75% o se ha desplomado por debajo del
    // 50%, con unas 47.000 filas sobra.
    const { rows } = await pool.query(
      `SELECT round(100.0 * count(*) FILTER (WHERE "contactEmail" IS NOT NULL)
                    / greatest(count(*), 1), 1)::float AS pct
         FROM "JobListing" TABLESAMPLE SYSTEM (2) WHERE "isActive"`
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
  //
  // SE PRUEBA LA FÓRMULA DEL FILTRO, NO LOS DATOS. Hasta el 6 oct 2026 se
  // contaban las ofertas con más de 200.000 y se avisaba si pasaban del 5%. Pero
  // esos sueldos son reales en su moneda (dólares de EE. UU., rupias, złotys,
  // yenes) y bastaba con que la muestra trajera más ofertas de EE. UU. para dar
  // una falsa alarma. Ahora se pasan por la MISMA fórmula que usa el buscador
  // rangos con el resultado conocido.
  try {
    const { rows } = await pool.query(
      `SELECT t.texto, ${salarioMinimoSql("t.texto")} AS minimo
         FROM unnest($1::text[]) AS t(texto)`,
      [CASOS_SALARIO.map(([texto]) => texto)]
    );
    const mal = CASOS_SALARIO.filter(([texto, esperado]) =>
      Number(rows.find((r: { texto: string }) => r.texto === texto)?.minimo) !== esperado);
    anota(
      "el filtro de salario no pega los numeros del rango",
      mal.length === 0,
      mal.length ? `mal: ${mal.map(([t]) => `«${t}»`).join(", ")}` : `${CASOS_SALARIO.length} rangos de prueba dan su mínimo`,
      '"30000 - 30000" se convertia en 3000030000 y pasaba cualquier filtro'
    );
  } catch (e) {
    anota("el filtro de salario no pega los numeros del rango", false, `no se pudo comprobar: ${(e as Error).message}`, "");
  }

  // ══ ENVIOS ═════════════════════════════════════════════════════════════════
  //
  // Es lo unico que de verdad hace la aplicacion. Un envio que falla en
  // silencio es un usuario que cree que ha echado el curriculum y no lo ha
  // echado, y no se entera nunca.
  const sb = supabaseAdmin();

  // ── 8. Ningun envio se queda colgado ───────────────────────────────────────
  // Los envios que reventaban se quedaban en "pendiente" para siempre, gastando
  // cuota del usuario sin haber enviado nada. Hay un rescate al arrancar el
  // worker; esto comprueba que sigue haciendo su trabajo.
  //
  // UN ENVÍO PROGRAMADO NO ESTÁ COLGADO. Con la estrategia "óptimo" un CV
  // pedido un sábado de madrugada sale el lunes a las 9: lleva más de 6 horas
  // "pendiente" porque tiene que ser así. El 3 oct 2026 este control dio esa
  // falsa alarma. Ahora solo cuenta como colgado el envío que NO tiene su
  // trabajo esperando en la cola (mismo usuario y misma dirección).
  try {
    const hace6h = new Date(Date.now() - 6 * 3600e3).toISOString();
    const { data: viejos, error } = await sb
      .from("cv_sends")
      .select("user_id, company_email")
      .in("status", ["pendiente", "procesando"])
      .lt("created_at", hace6h)
      .limit(500);
    if (error) throw new Error(error.message);
    const enCola = new Set<string>();
    if (viejos?.length) {
      const trabajos = await getCvSenderQueue().getJobs(["waiting", "delayed", "active", "prioritized"], 0, 500);
      for (const t of trabajos) enCola.add(`${t.data?.userId}|${String(t.data?.companyEmail || "").toLowerCase()}`);
    }
    const colgados = (viejos || []).filter((v) => !enCola.has(`${v.user_id}|${String(v.company_email || "").toLowerCase()}`)).length;
    anota(
      "ningun envio se queda colgado",
      colgados === 0,
      `${colgados} envios llevan mas de 6 horas sin resolverse y sin trabajo en la cola` +
        ((viejos?.length || 0) > colgados ? ` (${(viejos?.length || 0) - colgados} programados para más tarde, bien)` : ""),
      "los envios que reventaban se quedaban pendientes para siempre, gastando cuota"
    );
  } catch (e) {
    anota("ningun envio se queda colgado", false, `no se pudo comprobar: ${(e as Error).message}`, "");
  }

  // ── 9. Los envios no se estan cayendo en masa ──────────────────────────────
  // Solo los ultimos 7 dias: interesa saber si algo se ha roto AHORA, no
  // arrastrar el historico. Ahora mismo el fallo historico es del 2,5%.
  try {
    const hace7d = new Date(Date.now() - 7 * 86400e3).toISOString();
    const pedir = (extra?: (q: any) => any) => {
      let q = sb.from("cv_sends").select("id", { count: "exact", head: true }).gte("created_at", hace7d);
      return extra ? extra(q) : q;
    };
    const [{ count: total }, { count: fallidos }] = await Promise.all([
      pedir(),
      pedir(q => q.eq("status", "fallido")),
    ]);
    const pct = total ? (100 * (fallidos ?? 0)) / total : 0;
    // Con pocos envios el porcentaje salta mucho, asi que por debajo de 10 no
    // se juzga: dos fallos de tres serian un 66% que no significa nada.
    anota(
      "los envios no se estan cayendo en masa",
      (total ?? 0) < 10 || pct < 25,
      `${fallidos ?? 0} fallidos de ${total ?? 0} en 7 dias (${pct.toFixed(1)}%, limite 25%)`,
      "un CV que reventaba al enviarse no dejaba rastro y encima gastaba cuota"
    );
  } catch (e) {
    anota("los envios no se estan cayendo en masa", false, `no se pudo comprobar: ${(e as Error).message}`, "");
  }

  // ══ CURRICULUMS ════════════════════════════════════════════════════════════

  // ── 10. Los CV que se guardan tienen contenido ─────────────────────────────
  // Hay tres caminos por los que el CV llegaba a guardarse con casi nada: en
  // produccion aparecieron filas que solo tenian el email. Se mira lo guardado
  // en los ultimos 30 dias, no el historico: interesa saber si SIGUE pasando.
  try {
    const { rows } = await pool.query(
      `SELECT count(*)::int AS total,
              count(*) FILTER (WHERE html IS NULL OR length(html) < 200)::int AS vacios
         FROM user_cvs WHERE created_at > now() - interval '30 days'`
    );
    const { total, vacios } = rows[0] || { total: 0, vacios: 0 };
    const pct = total ? (100 * vacios) / total : 0;
    anota(
      "los CV que se guardan tienen contenido",
      total < 5 || pct < 20,
      `${vacios} de ${total} guardados en 30 dias estan practicamente vacios (${pct.toFixed(0)}%, limite 20%)`,
      "aparecieron CV guardados en produccion que solo tenian el email"
    );
  } catch (e) {
    anota("los CV que se guardan tienen contenido", false, `no se pudo comprobar: ${(e as Error).message}`, "");
  }

  // ══ DINERO ═════════════════════════════════════════════════════════════════

  // ── 11. Todo plan de pago viene de un pago ─────────────────────────────────
  // Hay tres cuentas con plan "empresa" (49,99 €/mes) sin identificador de
  // Stripe: se pusieron a mano. Mientras sean las de prueba no pasa nada, pero
  // si aparecen mas es que algo esta regalando planes.
  try {
    const { data, error } = await sb
      .from("profiles")
      .select("plan, stripe_customer_id, email")
      .neq("plan", "free");
    if (error) throw new Error(error.message);
    // Las cuentas de prueba (@resend.dev, del kit de auditoría y del recorrido
    // diario) se crean con el plan que haga falta probar: no son planes regalados.
    // Una de ellas dio una falsa alarma el 3 oct 2026.
    const sinPago = (data || []).filter((p: { stripe_customer_id: string | null; email: string | null }) =>
      !p.stripe_customer_id && !/@resend\.dev$/i.test(p.email || ""));
    const CONOCIDAS = 3;  // las de prueba que ya existian el 5 de septiembre
    anota(
      "todo plan de pago viene de un pago",
      sinPago.length <= CONOCIDAS,
      `${sinPago.length} cuentas con plan de pago y sin Stripe (conocidas: ${CONOCIDAS})`,
      "el webhook de Stripe no escribia el plan al renovar la suscripcion"
    );
  } catch (e) {
    anota("todo plan de pago viene de un pago", false, `no se pudo comprobar: ${(e as Error).message}`, "");
  }

  // ══ NOTIFICACIONES ═════════════════════════════════════════════════════════

  // ── 12. Las notificaciones no llevan a ofertas que no existen ──────────────
  // El worker guardaba el identificador de la COLA donde se esperaba el de una
  // oferta, y la notificacion de "CV enviado" acababa en "Oferta no encontrada"
  // en 76 de cada 78 casos.
  try {
    const hace30d = new Date(Date.now() - 30 * 86400e3).toISOString();
    const { data, error } = await sb
      .from("notificaciones")
      .select("datos")
      .gte("created_at", hace30d)
      .limit(500);
    if (error) throw new Error(error.message);
    const ids = (data || [])
      .map((n: { datos: Record<string, unknown> | null }) => n.datos?.job_id ?? n.datos?.jobId)
      .filter((x: unknown): x is string => typeof x === "string" && x.length > 0);
    let rotos = 0;
    if (ids.length) {
      const { rows } = await pool.query(
        `SELECT id FROM "JobListing" WHERE id = ANY($1::text[])`,
        [[...new Set(ids)]]
      );
      const existen = new Set(rows.map((x: { id: string }) => x.id));
      rotos = [...new Set(ids)].filter(id => !existen.has(id)).length;
    }
    // Que una oferta enlazada desaparezca es NORMAL: caducan y las empresas
    // cierran sus procesos. Se retiraron 195.217 de golpe. Exigir cero seria
    // gritar todos los dias por algo sano, y una alarma que siempre suena se
    // acaba ignorando.
    //
    // El fallo que hay que cazar era de otra magnitud: 76 de cada 78, el 97%,
    // porque se enlazaba un identificador que no era de ninguna oferta. Con el
    // 20% se pilla aquello de sobra y la caducidad normal no molesta.
    const unicos = new Set(ids).size;
    const pct = unicos ? (100 * rotos) / unicos : 0;
    anota(
      "las notificaciones no llevan a ofertas que no existen",
      pct < 20,
      ids.length
        ? `${rotos} de ${unicos} ofertas enlazadas ya no existen (${pct.toFixed(0)}%, limite 20%)`
        : "ninguna notificacion reciente enlaza una oferta",
      'la notificacion de "CV enviado" daba error en 76 de cada 78 casos'
    );
  } catch (e) {
    anota("las notificaciones no llevan a ofertas que no existen", false, `no se pudo comprobar: ${(e as Error).message}`, "");
  }

  // ── 15. Lo que prometemos por ahi fuera sigue siendo verdad ────────────────
  // El correo de bienvenida decia "mas de 148.000 ofertas activas en España".
  // El 23 sep 2026 habia 38.576: el numero se escribio a mano cuando era cierto
  // y se quedo ahi mientras la realidad cambiaba. Lo recibia cada persona que se
  // registraba. Ahora la cifra vive en lib/promesas.ts y esto la comprueba.
  try {
    const { rows } = await getPool().query<{ n: string }>(
      `SELECT count(*)::text AS n FROM "JobListing"
        WHERE "isActive" = true AND lower(country) = 'es'`
    );
    const reales = parseInt(rows[0]?.n || "0", 10);
    anota(
      "lo que prometemos por correo sigue siendo verdad",
      reales >= OFERTAS_ESPANA,
      `prometemos ${OFERTAS_ESPANA.toLocaleString("es-ES")} ofertas en España y hay ${reales.toLocaleString("es-ES")}`,
      'el correo de bienvenida prometia 148.000 ofertas en España cuando habia 38.576'
    );
  } catch (e) {
    anota("lo que prometemos por correo sigue siendo verdad", false, `no se pudo comprobar: ${(e as Error).message}`, "");
  }

  // ── 14. Ninguna oferta esta fechada en el futuro ───────────────────────────
  // El 22 sep 2026 habia 5.511 ofertas fechadas hasta el 9 de diciembre, todas
  // de la misma fuente (DEVITJOBS), porque su feed venia asi y se guardaba tal
  // cual. Como el buscador ordena por fecha, esas se ponian siempre las primeras
  // y tapaban al resto. Nada fallaba: simplemente salian las ofertas que no eran.
  try {
    const { rows } = await getPool().query<{ n: string; fuente: string | null }>(
      `SELECT count(*)::text AS n, max("sourceName") AS fuente
         FROM "JobListing"
        WHERE "isActive" = true AND "createdAt" > now() + interval '1 day'`
    );
    const futuras = parseInt(rows[0]?.n || "0", 10);
    anota(
      "ninguna oferta esta fechada en el futuro",
      futuras === 0,
      futuras === 0
        ? "ninguna oferta viva tiene fecha posterior a hoy"
        : `${futuras} ofertas fechadas en el futuro (por ejemplo ${rows[0]?.fuente})`,
      "5.511 ofertas fechadas hasta diciembre se ponian las primeras en el buscador"
    );
  } catch (e) {
    anota("ninguna oferta esta fechada en el futuro", false, `no se pudo comprobar: ${(e as Error).message}`, "");
  }

  // ══ INFRAESTRUCTURA ═══════════════════════════════════════════════════════

  // ── 13. La aplicacion llega a Redis ────────────────────────────────────────
  // El 22 sep 2026 la aplicacion perdio Redis sin que nada lo dijera. Easypanel
  // recreo su contenedor y le dio otra IP; la aplicacion vivia en otra red de
  // Docker y lo encontraba por una linea fija en /etc/hosts del servidor, que
  // siguio apuntando a la IP vieja. Cayeron a la vez la cola de envios de CV, la
  // busqueda de empresas y de ETTs (el tope de Google Places falla cerrado sin
  // Redis, asi que todo acababa en OpenStreetMap) y los limites anti-abuso.
  // Ninguna pantalla daba error: solo resultados vacios.
  try {
    const redis = new Redis(process.env.REDIS_URL || "redis://buscaycurra-redis:6379", {
      maxRetriesPerRequest: 1,
      connectTimeout: 3000,
      lazyConnect: true,
    });
    redis.on("error", () => { /* el resultado se anota abajo */ });
    let respuesta = "";
    try {
      await redis.connect();
      respuesta = await redis.ping();
    } finally {
      redis.disconnect();
    }
    anota(
      "la aplicacion llega a Redis",
      respuesta === "PONG",
      respuesta === "PONG" ? "PING -> PONG" : `respuesta inesperada: ${respuesta}`,
      "el 22 sep 2026 la app perdio Redis: sin envios de CV ni busqueda de empresas"
    );
  } catch (e) {
    anota(
      "la aplicacion llega a Redis",
      false,
      `no conecta: ${(e as Error).message}`,
      "el 22 sep 2026 la app perdio Redis: sin envios de CV ni busqueda de empresas"
    );
  }

  // ── 22. Guzzi contesta con la IA, no con textos enlatados ──────────────────
  // 14 oct 2026: las instrucciones de Guzzi no cabían en el plan gratuito de
  // Groq (413 en TODAS las conversaciones gratuitas) y todo dependía del
  // respaldo de pago; si ese fallaba, salía un texto enlatado. Solo quedaba en
  // el registro del contenedor. El chat lo cuenta ahora por día en Redis.
  try {
    const { mget } = await import("@/lib/cache/redis-client");
    const dias = [1, 0].map((d) => new Date(Date.now() - d * 86400000).toISOString().slice(0, 10));
    const tipos = ["sin-ia", "groq-413", "respaldo-openai", "luna-fallo"];
    const valores = await mget(dias.flatMap((d) => tipos.map((t) => `guzzi:fallo:${t}:${d}`)));
    const suma = (t: string) => dias.reduce((n, _, i) => n + (parseInt(valores[i * tipos.length + tipos.indexOf(t)] || "0", 10) || 0), 0);
    const sinIA = suma("sin-ia"), demasiadoGrande = suma("groq-413"), respaldo = suma("respaldo-openai"), lunaFallo = suma("luna-fallo");
    // Desde el 16 oct 2026 el modelo principal es gpt-5.6-luna (OpenAI): si
    // falla mucho (sin saldo, caído), contesta Groq y baja la calidad.
    anota(
      "Guzzi contesta con la IA, no con textos enlatados",
      sinIA === 0 && demasiadoGrande === 0 && lunaFallo <= 10,
      `ayer y hoy: ${sinIA} respuestas enlatadas (sin ninguna IA), ${lunaFallo} fallos del modelo principal (gpt-5.6-luna), ${demasiadoGrande} rechazos de Groq por tamaño, ${respaldo} respuestas de gpt-4o-mini`,
      "14 oct 2026: las instrucciones de Guzzi no cabían en el Groq gratis y todo salía del respaldo de pago"
    );
  } catch (e) {
    anota("Guzzi contesta con la IA, no con textos enlatados", false, `no se pudo leer: ${(e as Error).message}`,
      "14 oct 2026: las instrucciones de Guzzi no cabían en el Groq gratis");
  }

  // ── 16-21. Recorrido de usuario: los caminos que se rompieron esta semana ──
  // Ver lib/centinela/recorrido.ts.
  await recorridoDeUsuario(anota);

  // ── Límites de correo de Resend y Supabase: avisar antes de llegar ──
  // Ver lib/centinela/limites-correo.ts.
  await limitesDeCorreo(anota);

  // ── Plazas de cursos: que sigan llegando cada día ──
  // Las trae el crontab del servidor (scripts/vps/sync-plazas-cursos.sh). Si
  // el cron se pierde o una fuente cambia de formato, las plazas se quedan
  // viejas sin que nadie lo note: las fichas seguirían enseñando cursos cada
  // vez más escasos y, con el tiempo, ninguno.
  try {
    const { resumenPlazas } = await import("@/lib/cursos/plazas/db");
    const { porEmpezar, fuentes } = await resumenPlazas();
    const horas = (iso: string | null) => (iso ? (Date.now() - new Date(iso).getTime()) / 3600000 : Infinity);
    const viejas = fuentes.filter(f => horas(f.ultimaVez) > 72).map(f => f.fuente);
    anota(
      "las plazas de cursos se actualizan cada día",
      porEmpezar > 0 && viejas.length === 0,
      porEmpezar === 0
        ? "no hay ninguna plaza de curso por empezar: la sincronización no ha llegado a funcionar o se ha parado"
        : viejas.length
          ? `${viejas.join(", ")} lleva(n) más de 3 días sin actualizarse (${porEmpezar} plazas por empezar en total)`
          : `${porEmpezar} plazas por empezar, todas las fuentes al día`,
      "el 8 oct 2026 se añadieron las plazas reales de Lanbide, SEF Murcia, SOC, Consorci y Navarra"
    );
  } catch (e) {
    anota("las plazas de cursos se actualizan cada día", false, `no se pudo leer curso_plaza: ${(e as Error).message}`,
      "el 8 oct 2026 se añadieron las plazas reales de cursos");
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
