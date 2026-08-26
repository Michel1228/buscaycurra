/**
 * lib/descargas-tiendas.ts — Descargas de la app en App Store y Google Play.
 *
 * Las tiendas NO dan esto en tiempo real: Apple publica el informe de un día
 * cuando ese día ya ha cerrado (24-48 h de retraso) y Google Play igual. Así
 * que "en vivo" aquí significa "lo más reciente que las tiendas dejan ver",
 * no el segundo actual. El contador de usuarios registrados sí es instantáneo,
 * porque sale de nuestra propia base de datos.
 */

import crypto from "crypto";
import { gunzipSync } from "zlib";

export interface DescargasTienda {
  configurado: boolean;
  total: number;
  ultimoDia: number;
  fechaUltimoDia: string | null;
  porDia: Record<string, number>;
  /** Por qué no hay datos, cuando configurado es false o algo falló. */
  aviso?: string;
}

const vacio = (aviso: string): DescargasTienda => ({
  configurado: false, total: 0, ultimoDia: 0, fechaUltimoDia: null, porDia: {}, aviso,
});

// ─── Caché ────────────────────────────────────────────────────────────────
// El informe de un día pasado ya no cambia, así que se guarda para siempre y
// solo se piden a Apple los días que faltan. Sin esto, dejar el panel abierto
// dispararía decenas de llamadas por hora para recalcular siempre lo mismo.
const cacheDias = new Map<string, number>();

function hoyISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function diasEntre(desde: string, hasta: string): string[] {
  const salida: string[] = [];
  const d = new Date(`${desde}T00:00:00Z`);
  const fin = new Date(`${hasta}T00:00:00Z`);
  while (d <= fin) {
    salida.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return salida;
}

// ─── Apple (App Store Connect) ────────────────────────────────────────────

function jwtApple(issuerId: string, keyId: string, clavePrivada: string): string {
  const cabecera = { alg: "ES256", kid: keyId, typ: "JWT" };
  const ahora = Math.floor(Date.now() / 1000);
  const cuerpo = { iss: issuerId, iat: ahora, exp: ahora + 900, aud: "appstoreconnect-v1" };
  const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const sinFirma = `${b64(cabecera)}.${b64(cuerpo)}`;
  const firma = crypto.sign("sha256", Buffer.from(sinFirma), {
    key: clavePrivada,
    dsaEncoding: "ieee-p1363",
  });
  return `${sinFirma}.${firma.toString("base64url")}`;
}

/**
 * Descargas de un día concreto. Apple devuelve un TSV comprimido con una fila
 * por producto y país. Las primeras descargas son las que llevan un "Product
 * Type Identifier" que empieza por 1 (1F iPhone, 1T iPad...); las que empiezan
 * por 7 son actualizaciones y no cuentan como descarga nueva.
 */
async function descargasAppleDia(jwt: string, vendorNumber: string, fecha: string): Promise<number | null> {
  const url = new URL("https://api.appstoreconnect.apple.com/v1/salesReports");
  url.searchParams.set("filter[frequency]", "DAILY");
  url.searchParams.set("filter[reportType]", "SALES");
  url.searchParams.set("filter[reportSubType]", "SUMMARY");
  url.searchParams.set("filter[reportDate]", fecha);
  url.searchParams.set("filter[vendorNumber]", vendorNumber);

  const r = await fetch(url, {
    headers: { Authorization: `Bearer ${jwt}`, Accept: "application/a-gzip" },
    signal: AbortSignal.timeout(20000),
  });

  // 404 = ese día no tiene informe (aún no cerrado, o no hubo ninguna venta).
  // Es lo normal para el día de hoy y el de ayer, no es un error.
  if (r.status === 404) return 0;
  if (!r.ok) throw new Error(`Apple HTTP ${r.status}`);

  const tsv = gunzipSync(Buffer.from(await r.arrayBuffer())).toString("utf8");
  const lineas = tsv.split("\n").filter(Boolean);
  if (lineas.length < 2) return 0;

  const cabeceras = lineas[0].split("\t");
  const iTipo = cabeceras.indexOf("Product Type Identifier");
  const iUnidades = cabeceras.indexOf("Units");
  if (iTipo === -1 || iUnidades === -1) return 0;

  let total = 0;
  for (const linea of lineas.slice(1)) {
    const cols = linea.split("\t");
    if (cols[iTipo]?.startsWith("1")) {
      total += parseInt(cols[iUnidades] || "0", 10) || 0;
    }
  }
  return total;
}

export async function descargasApple(): Promise<DescargasTienda> {
  const issuerId = process.env.APPLE_ISSUER_ID;
  const keyId = process.env.APPLE_KEY_ID;
  const clavePrivada = process.env.APPLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const vendorNumber = process.env.APPLE_VENDOR_NUMBER;
  const desde = process.env.APPLE_DESDE || "2026-08-01";

  if (!issuerId || !keyId || !clavePrivada) {
    return vacio("Faltan APPLE_ISSUER_ID / APPLE_KEY_ID / APPLE_PRIVATE_KEY");
  }
  if (!vendorNumber) {
    return vacio("Falta APPLE_VENDOR_NUMBER (está en App Store Connect → Pagos e informes financieros)");
  }

  try {
    const jwt = jwtApple(issuerId, keyId, clavePrivada);
    const porDia: Record<string, number> = {};

    // Solo se piden los días que no estén ya cacheados. El de hoy nunca se
    // cachea: su informe todavía no ha cerrado y cambiaría.
    for (const dia of diasEntre(desde, hoyISO())) {
      const clave = `apple:${dia}`;
      if (cacheDias.has(clave)) {
        porDia[dia] = cacheDias.get(clave)!;
        continue;
      }
      const n = await descargasAppleDia(jwt, vendorNumber, dia);
      if (n === null) continue;
      porDia[dia] = n;
      if (dia !== hoyISO()) cacheDias.set(clave, n);
    }

    const dias = Object.keys(porDia).sort();
    const conDatos = dias.filter(d => porDia[d] > 0);
    const ultimo = conDatos[conDatos.length - 1] || null;

    return {
      configurado: true,
      total: Object.values(porDia).reduce((s, n) => s + n, 0),
      ultimoDia: ultimo ? porDia[ultimo] : 0,
      fechaUltimoDia: ultimo,
      porDia,
    };
  } catch (e) {
    return vacio(`Apple: ${(e as Error).message}`);
  }
}

// ─── Google Play ──────────────────────────────────────────────────────────

/**
 * Google Play no expone las instalaciones por API: la API de Google Play
 * Developer sirve para publicar versiones, no para leer estadísticas. La única
 * vía automatizable es el bucket de Cloud Storage donde Play Console deja los
 * informes en CSV, y para eso hace falta una cuenta de servicio con permiso de
 * lectura sobre ese bucket. Mientras no exista, se dice claramente en vez de
 * pintar un cero que parecería un dato real.
 */
export async function descargasGooglePlay(): Promise<DescargasTienda> {
  if (!process.env.GOOGLE_PLAY_BUCKET || !process.env.GOOGLE_PLAY_SA_JSON) {
    return vacio("Sin configurar: falta la cuenta de servicio y el bucket de informes de Play Console");
  }
  return vacio("Configurado pero sin implementar todavía");
}
