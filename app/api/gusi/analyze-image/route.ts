/**
 * /api/gusi/analyze-image — La cámara: de una foto a la empresa y cómo trabajar allí.
 *
 * Flujo:
 * 1. Recibe la imagen (la app ya la reduce a 1280 px) + GPS opcional
 * 2. GPT-4o Vision dice qué hay: fachada de un negocio, cartel de "se busca" o
 *    un producto, y de qué marca SOLO si se ve (antes se le obligaba a adivinar)
 * 3. Se sitúa a quien hace la foto: GPS, o la ciudad de su perfil
 * 4. Fachada → el local en el mapa, con su correo si lo tiene en la web
 *    Producto de marca → lib/camara/ficha-marca.ts: la empresa de verdad (Nike,
 *    Inc.; Aguas Danone para Font Vella), su web y portal de empleo COMPROBADOS,
 *    sus tiendas propias cerca, sus ofertas reales en el país, y queda guardada
 * 5. Si hay a quién mandar el CV, sale la tarjeta con el botón de enviarlo
 *
 * Probado el 29 sep 2026 con fotos reales: el reconocimiento acertaba siempre,
 * pero Nike devolvía una tienda de deportes, Font Vella una fuente de Girona y
 * las "ofertas cerca de Tudela" eran de Berlín y Plymouth.
 */

import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { createClient } from "@supabase/supabase-js";
import { planEfectivoDeUsuario } from "@/lib/plan-limits";
import { LISTA_PAISES } from "@/lib/paises";
import {
  guardarLoCapturado,
  investigarMarca,
  ofertasDeLaMarca,
  tiendasDeLaMarca,
  type FichaMarca,
  type OfertaMarca,
  type TiendaCerca,
} from "@/lib/camara/ficha-marca";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // 🔒 Verificar autenticación (NO confiar en userId del body)
  const { getUserId } = await import("@/lib/auth-server");
  const authUserId = await getUserId(req);
  if (!authUserId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { imageBase64, userId: bodyUserId, lat, lng } = body as {
      imageBase64: string;
      userId?: string;
      lat?: number;
      lng?: number;
    };

    // ⚠️ Usar userId autenticado, ignorar el del body
    const userId = authUserId;
    if (bodyUserId && bodyUserId !== authUserId) {
      console.warn(`[Guzzi OCR] ⚠️ userId del body (${bodyUserId}) no coincide con token (${authUserId})`);
    }

    if (!imageBase64) {
      return NextResponse.json({ error: "Imagen requerida" }, { status: 400 });
    }

    // Límite de tamaño: evita que una imagen enorme dispare el coste de GPT-4o
    // Vision o agote memoria. ~8 MB de base64 ≈ 6 MB de imagen, de sobra para una
    // foto de móvil comprimida.
    if (imageBase64.length > 8_000_000) {
      return NextResponse.json(
        { error: "La imagen es demasiado grande. Prueba con una foto de menor resolución." },
        { status: 413 }
      );
    }

    // ─── Verificar límite de cámara según plan ────────────────────────
    if (userId) {
      try {
        const { getPlanLimits } = await import("@/lib/plan-limits");
        const { createClient: createSbClient } = await import("@supabase/supabase-js");
        const sbAdmin = createSbClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        // La suscripcion manda sobre el plan guardado. Esta es la funcion mas
        // cara de la aplicacion —vision de GPT-4o, se paga por cada foto— asi
        // que no puede quedar abierta a quien ha dejado de pagar.
        const plan = await planEfectivoDeUsuario(sbAdmin, userId);
        const limits = getPlanLimits(plan);

        if (limits.camaraMaxUsos >= 999999) {
          // Ilimitado — no hacer nada
        } else {
          // Cuota DIARIA recargable para todos (antes el free usaba "trial" = total de por vida).
          const dateKey = new Date().toISOString().slice(0, 10);
          const sinCuota = plan === "free"
            ? `📸 Has usado tus ${limits.camaraMaxUsos} búsquedas por cámara de hoy. Mañana se recargan. Con Esencial (2,99€/mes) tienes 10/día.`
            : `📸 Límite de ${limits.camaraMaxUsos} fotos/día alcanzado. Mañana se resetea. Sube a Pro para 30/día.`;

          // SUMAR Y COMPROBAR EN LA MISMA OPERACION.
          //
          // Antes se leia el contador, se comparaba y luego se escribia. Entre
          // la lectura y la escritura cabe otra peticion: diez a la vez leen el
          // mismo valor, las diez pasan la comprobacion y las diez gastan una
          // foto. Para alguien del plan gratuito —2 al dia— son diez llamadas a
          // la vision de GPT-4o, que es la mas cara que tenemos y se paga por
          // foto.
          //
          // La funcion de base de datos (migracion 005) suma con un WHERE dentro
          // del ON CONFLICT: si ya no queda cuota no actualiza, no devuelve fila
          // y aqui llega null. No queda hueco entre comprobar y escribir.
          const { data: nuevoUso, error: errRpc } = await sbAdmin.rpc("consumir_uso_camara", {
            p_user_id: userId,
            p_date_key: dateKey,
            p_limite: limits.camaraMaxUsos,
          });

          if (errRpc) {
            // La funcion aun no existe en la base (migracion sin aplicar). Se
            // usa el metodo de antes para no dejar la camara inservible, pero se
            // dice en el log: por esta rama la carrera sigue abierta.
            console.warn("[analyze-image] consumir_uso_camara no disponible, metodo antiguo:", errRpc.message);
            const { data: usage } = await sbAdmin.from("usage_tracking")
              .select("camara_usos").eq("user_id", userId).eq("date_key", dateKey).single();
            const usos = usage?.camara_usos ?? 0;
            if (usos >= limits.camaraMaxUsos) {
              return NextResponse.json({ error: sinCuota }, { status: 429 });
            }
            await sbAdmin.from("usage_tracking").upsert(
              { user_id: userId, date_key: dateKey, week_key: "", camara_usos: usos + 1 },
              { onConflict: "user_id,date_key" }
            );
          } else if (nuevoUso === null) {
            return NextResponse.json({ error: sinCuota }, { status: 429 });
          }
        }
      } catch (errLimite) {
        // FALLA CERRADO a proposito. Antes se permitia igual "por si acaso",
        // pero esto abre GPT-4o Vision (la llamada mas cara de la app, ~1
        // centimo por foto) a barra libre en cuanto Supabase tenga un mal rato.
        // Es preferible pedir al usuario que reintente que regalar la factura.
        console.error("[analyze-image] no se pudo comprobar el limite:", (errLimite as Error).message);
        return NextResponse.json(
          { error: "No he podido comprobar tu límite de fotos ahora mismo. Inténtalo de nuevo en un momento." },
          { status: 503 }
        );
      }
    }

    // Limpiar el prefijo data:image si viene
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    // Obtener ciudad del usuario para búsquedas locales
    let ciudadUsuario = "";
    if (userId) {
      try {
        const sbCiudad = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        const { data: profileCiudad } = await sbCiudad.from("profiles").select("ciudad").eq("id", userId).single();
        ciudadUsuario = profileCiudad?.ciudad || "";
      } catch { /* sin perfil, sin problema */ }
    }

    // ─── Paso 1: qué hay en la foto (GPT-4o Vision) ───────────────────
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      return NextResponse.json({ error: "Servicio no disponible" }, { status: 503 });
    }

    // Antes el modelo devolvía texto libre ("OBJETO: … | MARCA: …") que se
    // recortaba con expresiones regulares, y las instrucciones le OBLIGABAN a
    // adivinar una marca ("NUNCA pongas genérico", "prefiere estimar a
    // rendirte", "botella azul → Bezoya"). Una marca adivinada lleva a mandar el
    // CV a una empresa que no tiene nada que ver. Ahora devuelve JSON y, si no ve
    // la marca, la deja vacía.
    const promptVision = `Mira esta foto. La hace alguien que busca trabajo: quiere saber qué empresa hay detrás de lo que fotografía para mandarle su currículum.

Devuelve SOLO un JSON:
{
  "tipo": "negocio" | "cartel" | "objeto" | "borrosa" | "nada",
  "negocio": nombre del negocio si la foto es una fachada, un rótulo o el interior de un local; si no, null,
  "ciudad_visible": ciudad si aparece escrita en la foto, o null,
  "cartel": texto literal si es un cartel de "se busca" o "se necesita personal"; si no, null,
  "objeto": qué es el producto u objeto principal (por ejemplo "zapatilla deportiva"), o null,
  "marca": la marca del objeto si la reconoces por el logo, el nombre o un diseño característico de esa marca; si no, null,
  "confianza_marca": "alta" si se ve el logo o el nombre escrito, "media" si la reconoces por un diseño característico (las tres bandas de Adidas, el swoosh de Nike, la estrella de Converse, la forma de una botella conocida), o null,
  "pista_marca": en pocas palabras, qué has visto para decir esa marca (por ejemplo "las tres bandas laterales"), o null,
  "modelo": el modelo si se reconoce (por ejemplo "Air Max 90"), o null,
  "sector": el sector laboral que fabrica o vende esto (por ejemplo "calzado deportivo"), o null
}

Reglas:
- Si la foto es de un PRODUCTO, tipo = "objeto" aunque lleve la marca escrita. "negocio" es solo para fachadas, rótulos o locales.
- NO adivines marcas por el color o por ser "lo típico": una botella azul no es Bezoya por ser azul. Una marca inventada lleva a mandar el currículum a una empresa que no tiene nada que ver. Si no hay logo, nombre ni diseño característico, null.
- "borrosa" si no se distingue nada; "nada" si no hay ni negocio, ni cartel, ni producto.`;

    const visionRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${openaiKey}` },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: promptVision },
              { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64Data}` } },
            ],
          },
        ],
        response_format: { type: "json_object" },
        max_tokens: 300,
        temperature: 0,
      }),
      // Una foto de móvil sin reducir tardaba cerca del límite de 15 s. La app ya
      // la reduce antes de mandarla, pero se deja margen para las que no.
      signal: AbortSignal.timeout(25000),
    });

    if (!visionRes.ok) {
      console.error("GPT-4o Vision error:", visionRes.status, (await visionRes.text()).slice(0, 300));
      return NextResponse.json(
        { error: "No se pudo leer la imagen. Prueba con más luz o más cerca." },
        { status: 500 }
      );
    }

    const visionData = (await visionRes.json()) as { choices?: Array<{ message?: { content?: string } }> };
    let foto: LecturaFoto;
    try {
      foto = JSON.parse(visionData.choices?.[0]?.message?.content || "{}") as LecturaFoto;
    } catch {
      foto = { tipo: "nada" };
    }
    console.log("[camara] lectura:", JSON.stringify(foto));

    if (foto.tipo === "borrosa") {
      return NextResponse.json({
        reply: "🔍 La imagen está demasiado borrosa u oscura. Prueba con mejor luz y más cerca.",
        action: "ocr_blurry",
      });
    }

    // ─── Paso 2: dónde está quien hace la foto ────────────────────────
    // GPS del móvil si lo hay; si no, la ciudad de su perfil. Sin esto no se
    // puede decir "cerca de ti" con verdad. Se lanza ya y se espera donde haga
    // falta: en una foto de marca va a la vez que la investigación de la
    // empresa, que es lo que más tarda (la primera versión tardaba 20 s).
    const zonaEnCamino = situarQuienFotografia(lat, lng, ciudadUsuario)
      .catch((): ZonaFoto => ({ coords: null, ciudad: "", paisCodigo: "ES" }));

    // ─── Negocio: fachada, rótulo o local ─────────────────────────────
    if (foto.tipo === "negocio" && limpio(foto.negocio)) {
      const zona = await zonaEnCamino;
      const nombre = limpio(foto.negocio)!;
      const ciudadBusqueda = limpio(foto.ciudad_visible) || zona.ciudad || ciudadUsuario;
      const lugar = await searchGooglePlaces(nombre, lat, lng, ciudadBusqueda);
      if (lugar) {
        return NextResponse.json({
          reply: buildCompanyReply(lugar),
          action: "company_info",
          company: lugarAEmpresaDelChat(lugar),
        });
      }
      return NextResponse.json({
        reply: `📸 He visto **${nombre}** pero no lo encuentro en el mapa. ¿Me dices la ciudad?`,
        action: "business_not_found",
        suggestedCompany: nombre,
      });
    }

    // ─── Cartel de "se busca" ─────────────────────────────────────────
    if (foto.tipo === "cartel" && limpio(foto.cartel)) {
      const cartelText = limpio(foto.cartel)!;
      return NextResponse.json({
        reply: `📸 He visto un cartel: **"${cartelText}"**\n\nParece que están buscando a alguien. ¿Quieres que te ayude a enviar el CV? Dime el nombre de la empresa o la dirección y lo gestiono.`,
        action: "job_sign_detected",
        cartelText,
      });
    }

    // ─── Producto de una marca: quién lo hace y cómo se trabaja allí ───
    const marca = limpio(foto.marca);
    const objeto = limpio(foto.objeto) || "producto";
    const sector = limpio(foto.sector) || "";
    if (foto.tipo === "objeto" && marca) {
      const [zona, ficha] = await Promise.all([zonaEnCamino, investigarMarca(marca, objeto)]);

      const nombresEmpresa = [marca, ficha?.empresa, ficha?.grupo].filter((n): n is string => !!n);
      const [ofertas, tiendas] = await Promise.all([
        ofertasDeLaMarca(nombresEmpresa, zona.paisCodigo),
        // Solo marcas con tiendas: para Font Vella saldrían supermercados.
        ficha?.tieneTiendasPropias && zona.coords
          ? tiendasDeLaMarca(marca, zona.coords)
          : Promise.resolve({ propias: [] as TiendaCerca[], queLaVenden: [] as TiendaCerca[] }),
      ]);

      const todasLasTiendas = [...tiendas.propias, ...tiendas.queLaVenden];
      if (ficha) await guardarLoCapturado(ficha, sector, todasLasTiendas, zona.ciudad);

      // La tarjeta con "Enviar mi CV" solo si hay a quién mandárselo: la tienda
      // más cercana con correo. Un botón que abre un envío sin destinatario no
      // sirve de nada.
      const conCorreo = todasLasTiendas.sort((a, b) => a.km - b.km).find((t) => t.empresa.emailRrhh);

      return NextResponse.json({
        reply: respuestaMarca({
          objeto,
          modelo: limpio(foto.modelo),
          marca,
          confianza: foto.confianza_marca === "media" ? "media" : "alta",
          pista: limpio(foto.pista_marca),
          ficha,
          tiendas,
          ofertas,
          zona,
        }),
        action: conCorreo ? "company_info" : "object_brand_found",
        company: conCorreo?.empresa,
        brand: ficha ?? undefined,
      });
    }

    // ─── Objeto sin marca: el sector, y solo lo que haya cerca ────────
    if (foto.tipo === "objeto") {
      const zona = await zonaEnCamino;
      const ofertasCerca = sector ? await ofertasDelSectorCerca(sector, zona) : [];
      let reply = `📸 He visto **${objeto}**, pero no se ve de qué marca es.`;
      if (sector) reply += ` Es del sector **${sector}**.`;
      if (ofertasCerca.length) {
        reply += `\n\n📋 **Ofertas de ${sector} cerca de ${zona.ciudad || "ti"}:**`;
        ofertasCerca.forEach((o, i) => { reply += `\n${i + 1}. **${o.titulo}** — ${o.empresa}${o.ciudad ? ` · 📍 ${o.ciudad}` : ""}`; });
      } else if (sector) {
        reply += `\n\nAhora mismo no tengo ofertas de ese sector publicadas cerca de ${zona.ciudad || "ti"}.`;
      }
      reply += `\n\n💡 Si haces la foto donde se vea la etiqueta o el logo, te digo qué empresa lo fabrica y cómo trabajar allí. Y en **Empresas → Por zona** tienes todas las de tu ciudad, aunque no tengan ofertas.`;
      return NextResponse.json({ reply, action: "object_to_sector", suggestedSector: sector || undefined });
    }

    return NextResponse.json({
      reply:
        "😅 No veo ninguna tienda, cartel de empleo ni producto que me dé pistas.\n\n📸 **Prueba con:** la fachada de un bar, tienda o empresa, o un producto donde se vea la marca (unas zapatillas, una botella, una herramienta).",
      action: "ocr_not_useful",
    });
  } catch (error) {
    console.error("analyze-image error:", error);
    return NextResponse.json(
      { error: "Error al procesar la imagen" },
      { status: 500 }
    );
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────

interface LecturaFoto {
  tipo?: "negocio" | "cartel" | "objeto" | "borrosa" | "nada";
  negocio?: string | null;
  ciudad_visible?: string | null;
  cartel?: string | null;
  objeto?: string | null;
  marca?: string | null;
  confianza_marca?: "alta" | "media" | null;
  pista_marca?: string | null;
  modelo?: string | null;
  sector?: string | null;
}

/** Texto útil o null. El modelo a veces devuelve "null" o "desconocido" como texto. */
function limpio(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  if (!t || ["null", "desconocido", "desconocida", "generico", "genérico", "n/a"].includes(t.toLowerCase())) return null;
  return t;
}

interface ZonaFoto {
  coords: { lat: number; lng: number } | null;
  ciudad: string;
  paisCodigo: string;
}

/** Dónde está quien hace la foto: GPS primero, la ciudad del perfil después. */
async function situarQuienFotografia(lat?: number, lng?: number, ciudadPerfil?: string): Promise<ZonaFoto> {
  if (typeof lat === "number" && typeof lng === "number") {
    const { situarPorCoordenadasOSM } = await import("@/lib/osm-places");
    const lugar = await situarPorCoordenadasOSM(lat, lng);
    return {
      coords: { lat, lng },
      ciudad: lugar?.ciudad || ciudadPerfil || "",
      paisCodigo: lugar?.paisCodigo || "ES",
    };
  }
  if (ciudadPerfil) {
    const { situarZona } = await import("@/lib/google-places");
    const z = await situarZona(ciudadPerfil);
    if (z) return { coords: { lat: z.lat, lng: z.lng }, ciudad: ciudadPerfil, paisCodigo: z.paisCodigo };
  }
  // Sin GPS ni ciudad no se sabe dónde está: se asume España, que es donde está
  // casi todo el que usa la aplicación, y no se dice "cerca de ti".
  return { coords: null, ciudad: "", paisCodigo: "ES" };
}

function nombrePais(codigo: string): string {
  return LISTA_PAISES.find((p) => p.codigo === codigo.toUpperCase())?.nombre || codigo;
}

function respuestaMarca(d: {
  objeto: string;
  modelo: string | null;
  marca: string;
  /** "media" = reconocida por el diseño, no por un logo o un nombre escrito. */
  confianza: "alta" | "media";
  pista: string | null;
  ficha: FichaMarca | null;
  tiendas: { propias: TiendaCerca[]; queLaVenden: TiendaCerca[] };
  ofertas: { enPais: OfertaMarca[]; totalPais: number; totalFuera: number };
  zona: ZonaFoto;
}): string {
  const l: string[] = [];
  const pais = nombrePais(d.zona.paisCodigo);
  const queEs = `${d.objeto}${d.modelo ? ` ${d.modelo}` : ""}`;
  // Si la marca sale del diseño y no de un logo, se dice así: es lo más
  // probable, no algo que se haya leído.
  l.push(
    d.confianza === "media"
      ? `📸 Parece **${queEs}** de **${d.marca}**${d.pista ? ` (por ${d.pista})` : ""}. Si no lo es, haz la foto donde se vea la etiqueta.`
      : `📸 **${queEs}** de **${d.marca}**`
  );

  const f = d.ficha;
  if (f?.empresa) {
    l.push("");
    l.push(`🏢 La marca es de **${f.empresa}**${f.grupo ? ` (grupo ${f.grupo})` : ""}${f.paisOrigen ? ` · ${f.paisOrigen}` : ""}`);
    if (f.presenciaEspana) l.push(`🇪🇸 En España: ${f.presenciaEspana}`);
    if (f.webOficial) l.push(`🌐 ${f.webOficial}`);
    if (f.portalEmpleo) l.push(`💼 **Trabaja con ellos:** ${f.portalEmpleo} — ahí se presentan las candidaturas`);
    if (f.puestosHabituales.length) l.push(`👔 Suele contratar: ${f.puestosHabituales.join(", ")}`);
  } else {
    l.push("");
    l.push(`🏢 No he podido averiguar con seguridad qué empresa hay detrás de ${d.marca}.`);
  }

  const linea = (t: TiendaCerca, i: number) => {
    const correo = t.empresa.emailRrhh ? ` · ✉️ ${t.empresa.emailRrhh}` : "";
    return `${i + 1}. **${t.empresa.nombre}** — a ${t.km} km${t.empresa.googleAddress ? ` · ${t.empresa.googleAddress}` : ""}${correo}`;
  };
  if (d.tiendas.propias.length) {
    l.push("");
    l.push(`🛍️ **Tiendas de ${d.marca} cerca de ti**`);
    d.tiendas.propias.forEach((t, i) => l.push(linea(t, i)));
  } else if (f?.tieneTiendasPropias && d.zona.coords) {
    l.push("");
    l.push(`🛍️ ${d.marca} no tiene tiendas propias a menos de 60 km de ti.`);
  }
  if (d.tiendas.queLaVenden.length) {
    l.push("");
    // No son de la marca, pero la venden y contratan: también son sitio para el CV.
    l.push(`🏪 **Tiendas cerca que venden ${d.marca}** (también contratan)`);
    d.tiendas.queLaVenden.forEach((t, i) => l.push(linea(t, i)));
  }

  // En las ofertas se nombra el grupo cuando lo hay: las de Font Vella están
  // publicadas a nombre de Danone, y decir "ofertas de Font Vella" confundía.
  const quienOferta = f?.grupo ? `${d.marca} y el grupo ${f.grupo}` : (f?.empresa || d.marca);
  l.push("");
  if (d.ofertas.enPais.length) {
    l.push(`📋 **Ofertas de ${quienOferta} en ${pais} (${d.ofertas.totalPais})**`);
    d.ofertas.enPais.forEach((o, i) => {
      l.push(`${i + 1}. **${o.titulo}** — ${o.empresa}${o.ciudad ? ` · 📍 ${o.ciudad}` : ""}`);
    });
    if (d.ofertas.totalFuera) l.push(`…y ${d.ofertas.totalFuera.toLocaleString("es-ES")} más en otros países.`);
  } else if (d.ofertas.totalFuera) {
    l.push(`📋 Ahora mismo no tiene ofertas publicadas en ${pais}; sí ${d.ofertas.totalFuera.toLocaleString("es-ES")} en otros países.`);
  } else {
    l.push(`📋 No tenemos ofertas suyas publicadas ahora mismo.`);
  }

  if (f?.empresa) {
    l.push("");
    l.push(`✅ He guardado **${f.empresa}** en el buscador de empresas: ya no hace falta volver a hacer la foto.`);
  }
  return l.join("\n");
}

/**
 * Ofertas del sector de un objeto sin marca, SOLO del país y la ciudad de quien
 * hace la foto. Antes se buscaba la palabra en títulos de todo el mundo y se
 * anunciaba "cerca de Tudela" un puesto en Belfast.
 */
async function ofertasDelSectorCerca(
  sector: string,
  zona: ZonaFoto
): Promise<Array<{ titulo: string; empresa: string; ciudad: string }>> {
  if (!zona.ciudad) return [];
  const palabras = sector
    .toLowerCase()
    .split(/[^a-záéíóúüñ]+/i)
    .filter((p) => p.length >= 5)
    .slice(0, 3);
  if (!palabras.length) return [];
  try {
    const { rows } = await getPool().query<{ title: string; company: string; city: string | null }>(
      `SELECT title, company, city FROM "JobListing"
        WHERE "isActive" = true AND country = $1
          AND (city ILIKE $2 OR province ILIKE $2)
          AND title ILIKE ANY($3)
        ORDER BY "scrapedAt" DESC LIMIT 5`,
      [zona.paisCodigo.toLowerCase(), `%${zona.ciudad}%`, palabras.map((p) => `%${p}%`)]
    );
    return rows.map((r) => ({ titulo: r.title, empresa: r.company, ciudad: r.city || "" }));
  } catch (e) {
    console.warn("[camara] ofertas del sector:", (e as Error).message);
    return [];
  }
}

/**
 * La tarjeta de "Enviar mi CV" del chat lee los campos de EmpresaCompleta
 * (nombre, emailRrhh, telefono…). La cámara devolvía otros nombres (name,
 * email, phone…), así que la tarjeta nunca aparecía después de una foto.
 */
function lugarAEmpresaDelChat(p: PlacesResult) {
  return {
    nombre: p.name,
    emailRrhh: p.email || undefined,
    telefono: p.phone || undefined,
    urlWeb: p.website || undefined,
    googleAddress: p.address || undefined,
    googleRating: p.rating || undefined,
    googleMapsUrl: p.mapsUrl || undefined,
  };
}

interface PlacesResult {
  name: string;
  address: string;
  phone: string;
  email: string;
  emailConfianza?: "alta" | "media" | "baja";
  website: string;
  mapsUrl: string;
  rating: number;
}

/**
 * Localiza el negocio que ha reconocido la IA en la foto.
 *
 * OJO — son DOS servicios distintos: leer la imagen es OpenAI GPT-4o Vision
 * (arriba); esto de aquí solo ubica el negocio. Si Google Places no responde
 * (sin facturación, sin cuota o API legacy retirada), se cae al respaldo
 * GRATUITO de OpenStreetMap para que la foto siga siendo útil.
 */
async function searchGooglePlaces(
  companyName: string,
  lat?: number,
  lng?: number,
  city?: string
): Promise<PlacesResult | null> {
  // Pasa por el tope diario compartido (lib/places-quota.ts). Sin esto la
  // llamada se salta el limite y el tope no sirve de nada: fue justo asi como
  // llego una factura de 100 EUR de Google sin tener suscriptores.
  const { consumirCuotaPlaces } = await import("@/lib/places-quota");
  if (!(await consumirCuotaPlaces())) return null;
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return await buscarConOSM(companyName, city);

  try {
    // Si tenemos ubicación GPS, usar Nearby Search para máxima precisión
    if (lat && lng) {
      const nearbyUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=500&keyword=${encodeURIComponent(companyName)}&key=${apiKey}`;
      const nearbyRes = await fetch(nearbyUrl, { signal: AbortSignal.timeout(8000) });
      const nearbyData = await nearbyRes.json() as {
        results?: Array<{ place_id: string; name?: string }>;
      };
      // NO vale el primero de la lista: Google mezcla por parecido, y el 29 sep
      // 2026 una foto de un Zara devolvió el Stradivarius de al lado. En la calle
      // eso es mandar el CV a la tienda equivocada. Tiene que llamarse igual.
      const bueno = nearbyData.results?.find((r) => nombreCoincide(companyName, r.name || ""));
      if (bueno) return await getPlaceDetails(bueno.place_id, apiKey);
    }

    // Fallback: búsqueda por texto, con la ciudad si se sabe (sin ella, "Zara"
    // devolvía la tienda que Google considerase principal, en cualquier sitio).
    const entrada = city ? `${companyName} ${city}` : companyName;
    const searchUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(entrada)}&inputtype=textquery&fields=place_id,name&key=${apiKey}`;
    const searchRes = await fetch(searchUrl, { signal: AbortSignal.timeout(8000) });
    const searchData = await searchRes.json() as {
      candidates?: Array<{ place_id: string; name?: string }>;
    };

    const candidato = searchData.candidates?.find((c) => nombreCoincide(companyName, c.name || ""));
    if (!candidato) return await buscarConOSM(companyName, city);

    return await getPlaceDetails(candidato.place_id, apiKey);
  } catch {
    return await buscarConOSM(companyName, city);
  }
}

/**
 * ¿El sitio encontrado es el negocio de la foto?
 *
 * Coincide si un nombre contiene al otro ("Zara" en "ZARA Gran Vía") o si
 * comparten una palabra con sustancia ("Bar Casa Pepe" y "Casa Pepe"). "Zara" y
 * "Stradivarius" no coinciden, aunque Google los devuelva juntos.
 */
function nombreCoincide(buscado: string, encontrado: string): boolean {
  const norm = (s: string) =>
    s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const a = norm(buscado);
  const b = norm(encontrado);
  if (!a || !b) return false;
  const juntoA = a.replace(/ /g, "");
  const juntoB = b.replace(/ /g, "");
  if (juntoB.includes(juntoA) || juntoA.includes(juntoB)) return true;
  const VACIAS = new Set(["bar", "restaurante", "tienda", "cafeteria", "hotel", "calle", "plaza", "the", "los", "las", "del"]);
  const palabrasB = new Set(b.split(" "));
  return a.split(" ").some((p) => p.length >= 4 && !VACIAS.has(p) && palabrasB.has(p));
}

/**
 * Respaldo gratuito con OpenStreetMap. Da nombre, dirección, teléfono y web
 * (no valoraciones ni fotos, que OSM no tiene). El email se saca luego de la
 * web con el mismo extractor que usa el resto de la app.
 */
async function buscarConOSM(companyName: string, city?: string): Promise<PlacesResult | null> {
  try {
    const { buscarEmpresaOSM } = await import("@/lib/osm-places");
    const rs = await buscarEmpresaOSM(companyName, city);
    const r = rs[0];
    if (!r) return null;

    let email = "";
    let emailConfianza: "alta" | "media" | "baja" = "baja";
    if (r.website) {
      try {
        const { extraerInfoEmpresa } = await import("@/lib/company-extractor");
        const { extraerDominio, generarEmails, dominioAceptaCorreo } = await import("@/lib/empresa-datos");
        const datos = await extraerInfoEmpresa(r.website);
        if (datos?.emailRrhh && !datos.emailRrhh.includes("www.")) {
          email = datos.emailRrhh;
          emailConfianza = "alta";
        } else {
          const dominio = extraerDominio(r.website);
          if (dominio && (await dominioAceptaCorreo(dominio))) {
            email = generarEmails(dominio, true)[0] || "";
            emailConfianza = "media";
          }
        }
      } catch { /* sin email es mejor que uno que rebota */ }
    }

    return {
      name: r.name,
      address: r.formatted_address || "",
      phone: r.formatted_phone_number || "",
      email,
      emailConfianza,
      website: r.website || "",
      mapsUrl: r.url || "",
      rating: 0, // OSM no tiene valoraciones: 0 = "sin dato", no se inventa
    };
  } catch {
    return null;
  }
}

async function getPlaceDetails(placeId: string, apiKey: string): Promise<PlacesResult | null> {
  // Pasa por el tope diario compartido (lib/places-quota.ts). Sin esto la
  // llamada se salta el limite y el tope no sirve de nada: fue justo asi como
  // llego una factura de 100 EUR de Google sin tener suscriptores.
  const { consumirCuotaPlaces } = await import("@/lib/places-quota");
  if (!(await consumirCuotaPlaces())) return null;
  const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,formatted_phone_number,website,rating,url&key=${apiKey}`;
  const detailsRes = await fetch(detailsUrl, { signal: AbortSignal.timeout(8000) });
  const detailsData = await detailsRes.json() as {
    result?: {
      name: string;
      formatted_address: string;
      formatted_phone_number: string;
      website: string;
      rating: number;
      url: string;
    };
  };

  const r = detailsData.result;
  if (!r) return null;

  // Email: usar el extractor bueno (prioriza RRHH, descarta CDNs/noreply y
  // bloquea SSRF). Antes aquí había una regex que cogía el PRIMER email del
  // HTML — a menudo el del diseñador de la web o uno de una librería.
  let email = "";
  let emailConfianza: "alta" | "media" | "baja" = "baja";
  if (r.website) {
    try {
      const { extraerInfoEmpresa } = await import("@/lib/company-extractor");
      const { extraerDominio, generarEmails, dominioAceptaCorreo } = await import("@/lib/empresa-datos");
      const datos = await extraerInfoEmpresa(r.website);

      if (datos?.emailRrhh && !datos.emailRrhh.includes("www.")) {
        email = datos.emailRrhh;
        emailConfianza = "alta";
      } else {
        // Sin email real: proponer patrón solo si el dominio recibe correo.
        const dominio = extraerDominio(r.website);
        if (dominio && (await dominioAceptaCorreo(dominio))) {
          email = generarEmails(dominio, true)[0] || "";
          emailConfianza = "media";
        }
      }
    } catch {
      // Sin email: mejor no dar nada que dar una dirección que rebota.
    }
  }

  return {
    name: r.name,
    address: r.formatted_address,
    phone: r.formatted_phone_number || "",
    email,
    emailConfianza,
    website: r.website || "",
    mapsUrl: r.url,
    rating: r.rating || 0,
  };
}

function buildCompanyReply(company: PlacesResult): string {
  const parts: string[] = [];

  parts.push(`📸 **${company.name}**`);
  if (company.rating) {
    parts.push(`⭐ ${company.rating} · 📍 ${company.address}`);
  } else {
    parts.push(`📍 ${company.address}`);
  }

  if (company.phone) parts.push(`📞 ${company.phone}`);
  if (company.email) {
    // Ser honesto: si el email es un patrón deducido, decirlo. Así el usuario
    // decide si gasta un envío o prefiere llamar por teléfono.
    const sello = company.emailConfianza === "alta" ? " ✅ verificado en su web" : " ⚠️ estimado, puede rebotar";
    parts.push(`✉️ ${company.email}${sello}`);
  }
  if (company.website) parts.push(`🌐 ${company.website}`);

  parts.push(""); // línea vacía
  // Antes se añadía aquí 'Texto detectado: "NEGOCIO: ZARA | CIUDAD: Madrid"',
  // la salida en bruto del modelo, que al usuario no le dice nada.
  parts.push(
    company.email
      ? `💡 Usa el botón "📧 Enviar mi CV" y lo mando ahora.`
      : `💡 No encuentro su correo en la web. Puedes llamar o pasarte por allí con el CV.`
  );

  return parts.join("\n");
}
