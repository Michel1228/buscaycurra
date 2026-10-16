/**
 * lib/camara/analizar-foto.ts — De una foto a dónde mandar el currículum.
 *
 * Lo usa /api/gusi/analyze-image (que se encarga de la sesión y del límite de
 * fotos). Está aparte para poder probarlo con muchas fotos sin gastar cupo.
 *
 * QUÉ PUEDE SER LA FOTO (16 oct 2026, después de enseñarlo en el Consorcio
 * EDER): no solo fachadas. Una tarjeta de visita, un nombre escrito a mano en
 * un papel, una pantalla, una furgoneta rotulada, un producto, una caricatura.
 *   - Si se lee un NOMBRE, se busca ese sitio cerca de quien hace la foto (GPS
 *     o la ciudad de su perfil o de su CV): la tarjeta del Consorcio EDER daba
 *     "no lo encuentro" estando a 0 km. Si ahí no hay nada con ese nombre, se
 *     dice y se propone lo más parecido ("Rasta" escrito en un papel → no hay
 *     ninguna "Rasta" en Tudela; ¿es Randstad Tudela?).
 *   - Si es un OBJETO o un DIBUJO, las empresas de ese sector y sus ofertas, DE
 *     MÁS CERCA A MÁS LEJOS, con los kilómetros (una botella de agua → las
 *     embotelladoras y las ofertas de envasado). Antes solo se buscaban
 *     ofertas en la misma ciudad y casi nunca salía nada.
 *
 * Probado el 29 sep 2026 con fotos reales: el reconocimiento acertaba siempre,
 * pero Nike devolvía una tienda de deportes, Font Vella una fuente de Girona y
 * las "ofertas cerca de Tudela" eran de Berlín y Plymouth. Por eso las marcas
 * pasan por lib/camara/ficha-marca.ts y las ofertas se miden en kilómetros
 * dentro del país.
 */
import { getPool } from "@/lib/db";
import { LISTA_PAISES } from "@/lib/paises";
import { buscarTextoSinDetalles, distanciaKm, type SitioBasico } from "@/lib/google-places";
import {
  guardarLoCapturado,
  investigarMarca,
  ofertasDeLaMarca,
  tiendasDeLaMarca,
  type FichaMarca,
  type OfertaMarca,
  type TiendaCerca,
} from "@/lib/camara/ficha-marca";

// ─── Qué hay en la foto ──────────────────────────────────────────────────

export interface LecturaFoto {
  tipo?: "negocio" | "nombre" | "cartel" | "objeto" | "dibujo" | "borrosa" | "nada";
  soporte?: string | null;
  nombre?: string | null;
  nombre_corregido?: string | null;
  ciudad_visible?: string | null;
  direccion_visible?: string | null;
  telefono_visible?: string | null;
  email_visible?: string | null;
  web_visible?: string | null;
  cartel?: string | null;
  objeto?: string | null;
  marca?: string | null;
  confianza_marca?: "alta" | "media" | null;
  pista_marca?: string | null;
  modelo?: string | null;
  sector?: string | null;
  busquedas_empresas?: string[] | null;
  nombres_tipicos?: string[] | null;
  palabras_ofertas?: string[] | null;
  puestos?: string[] | null;
}

// Antes el modelo devolvía texto libre que se recortaba con expresiones
// regulares, y las instrucciones le OBLIGABAN a adivinar una marca. Una marca
// adivinada lleva a mandar el CV a una empresa que no tiene nada que ver.
export const PROMPT_VISION = `Mira esta foto. La hace alguien que busca trabajo: quiere saber qué empresa o qué sector hay detrás de lo que fotografía para mandarle su currículum.

Devuelve SOLO un JSON:
{
  "tipo": "negocio" | "nombre" | "cartel" | "objeto" | "dibujo" | "borrosa" | "nada",
  "soporte": dónde aparece: "fachada", "rotulo", "interior", "tarjeta", "papel", "escrito_a_mano", "pantalla", "vehiculo", "ropa", "producto", "cartel" u "otro",
  "nombre": el nombre de la empresa, negocio, marca o entidad que se LEE o se reconoce, tal cual aparece (si está escrito a mano, como se lee), o null,
  "nombre_corregido": si ese nombre parece una empresa conocida en España mal escrita o escrita al dictado, el nombre correcto (por ejemplo "Rasta" o "Ranstad" → "Randstad", "Adeco" → "Adecco", "Mercadoña" → "Mercadona", "Eroqui" → "Eroski"); si no, null,
  "ciudad_visible": ciudad si aparece escrita, o null,
  "direccion_visible": dirección si aparece escrita, o null,
  "telefono_visible": teléfono si aparece escrito, o null,
  "email_visible": correo electrónico si aparece escrito, o null,
  "web_visible": página web si aparece escrita, o null,
  "cartel": texto literal si es un cartel de "se busca" o "se necesita personal"; si no, null,
  "objeto": qué es el producto u objeto principal (por ejemplo "botella de agua", "zapatilla deportiva", "tractor"); en un dibujo, lo que representa ("cocinero", "enfermera"); o null,
  "marca": la marca del objeto si la reconoces por el logo, el nombre o un diseño característico de esa marca; si no, null,
  "confianza_marca": "alta" si se ve el logo o el nombre escrito, "media" si la reconoces por un diseño característico (las tres bandas de Adidas, el swoosh de Nike, la forma de una botella conocida), o null,
  "pista_marca": en pocas palabras, qué has visto para decir esa marca, o null,
  "modelo": el modelo si se reconoce, o null,
  "sector": el sector laboral en español y corto (por ejemplo "agua embotellada", "trabajo temporal", "hostelería", "conservas vegetales", "maquinaria agrícola"), o null,
  "busquedas_empresas": hasta 3 búsquedas para Google Maps que encuentren EMPRESAS de ese sector donde se puede trabajar (fábricas, plantas, distribuidores, talleres, oficinas), no tiendas que solo lo venden. Por ejemplo, para una botella de agua: ["embotelladora de agua", "planta de envasado de agua mineral", "distribuidora de agua"]. [] si no aplica,
  "nombres_tipicos": hasta 6 palabras que suelen aparecer en el NOMBRE de las empresas de ese sector (para el agua: ["agua", "aguas", "manantial", "fuente", "mineral", "embotelladora"]; para hostelería: ["bar", "restaurante", "cafetería", "hotel", "asador"]). [] si no aplica,
  "palabras_ofertas": hasta 6 palabras que aparecen en los TÍTULOS de las ofertas de empleo de ese sector y casi en ningún otro (para el agua: ["embotellado", "depuradora", "aguas"]; para sanidad: ["enfermero", "enfermera", "celador", "auxiliar de enfermería"]; para hostelería: ["camarero", "cocinero", "hostelería"]). [] si no aplica,
  "puestos": hasta 4 puestos de trabajo PROPIOS de ese sector, en español y cortos, que en el título de una oferta delaten el sector (por ejemplo ["operario de envasado", "carretillero", "repartidor de agua"]; para sanidad ["enfermero", "auxiliar de enfermería", "celador"]). Nada genérico como "administrativo", "técnico de mantenimiento" o "comercial". [] si no aplica
}

Reglas:
- "negocio": la fachada, el rótulo o el interior de un local con su nombre.
- "nombre": un nombre de empresa o entidad que NO está en una fachada: una tarjeta de visita, un papel (impreso o escrito a mano), una pantalla, un folleto, un uniforme, una furgoneta, un sello. Si es un producto con su marca, es "objeto".
- "cartel": un cartel de "se busca", "se necesita personal" u oferta de empleo. Si se ve de qué negocio es, pon también "nombre".
- "objeto": un producto o una cosa (una botella, una herramienta, un tractor, unas verduras).
- Un LUGAR o una escena de trabajo sin nombre (una cocina, el comedor de un restaurante, una habitación de hotel, un almacén, una obra, un campo de cultivo, un taller) es "objeto": en "objeto" pon ese lugar y rellena su sector.
- "dibujo": una caricatura, ilustración o dibujo de una profesión o actividad (un cocinero, una enfermera, un albañil). Pon el sector, las búsquedas y los puestos de esa profesión.
- Rellena "sector", "busquedas_empresas" y "puestos" siempre que sepas a qué se dedica (también para negocios y nombres conocidos).
- NO adivines marcas por el color o por ser "lo típico": una botella azul no es Bezoya por ser azul. Una marca inventada lleva a mandar el currículum a una empresa que no tiene nada que ver. Si no hay logo, nombre ni diseño característico, null.
- "borrosa" si no se distingue nada; "nada" si no hay ni nombre, ni cartel, ni objeto, ni dibujo útil.`;

/** Texto útil o null. El modelo a veces devuelve "null" o "desconocido" como texto. */
export function limpio(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  if (!t || ["null", "desconocido", "desconocida", "generico", "genérico", "n/a", "ninguno", "ninguna"].includes(t.toLowerCase())) return null;
  return t;
}

const lista = (v: unknown, max: number): string[] =>
  Array.isArray(v) ? v.map(limpio).filter((x): x is string => !!x).slice(0, max) : [];

/** GPT-4o lee la foto. null si no contesta. */
export async function leerFoto(base64Data: string, openaiKey: string): Promise<LecturaFoto | null> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${openaiKey}` },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [{
        role: "user",
        content: [
          { type: "text", text: PROMPT_VISION },
          { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64Data}` } },
        ],
      }],
      response_format: { type: "json_object" },
      max_tokens: 600,
      temperature: 0,
    }),
    // La app reduce la foto antes de mandarla; se deja margen para las que no.
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) {
    console.error("GPT-4o Vision error:", res.status, (await res.text()).slice(0, 300));
    return null;
  }
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  try {
    return JSON.parse(data.choices?.[0]?.message?.content || "{}") as LecturaFoto;
  } catch {
    return { tipo: "nada" };
  }
}

// ─── Dónde está quien hace la foto ───────────────────────────────────────

export interface ZonaFoto {
  coords: { lat: number; lng: number } | null;
  ciudad: string;
  paisCodigo: string;
  /** Sin GPS, las coordenadas son las de la ciudad (el centro de su término municipal). */
  porGps: boolean;
}

/** GPS primero; si no, la ciudad de su perfil o de su CV. */
export async function situarQuienFotografia(lat?: number, lng?: number, ciudadPerfil?: string): Promise<ZonaFoto> {
  if (typeof lat === "number" && typeof lng === "number") {
    const { situarPorCoordenadasOSM } = await import("@/lib/osm-places");
    const lugar = await situarPorCoordenadasOSM(lat, lng);
    return {
      coords: { lat, lng },
      ciudad: lugar?.ciudad || ciudadPerfil || "",
      paisCodigo: lugar?.paisCodigo || "ES",
      porGps: true,
    };
  }
  if (ciudadPerfil) {
    const { situarZona } = await import("@/lib/google-places");
    const z = await situarZona(ciudadPerfil);
    if (z) return { coords: { lat: z.lat, lng: z.lng }, ciudad: ciudadPerfil, paisCodigo: z.paisCodigo, porGps: false };
  }
  // Sin GPS ni ciudad no se sabe dónde está: se asume España, que es donde está
  // casi todo el que usa la aplicación, y no se dice "cerca de ti".
  return { coords: null, ciudad: "", paisCodigo: "ES", porGps: false };
}

// ─── Respuesta ───────────────────────────────────────────────────────────

/** Una oferta como la pinta el chat (con su botón "Enviar CV"). */
export interface OfertaChat {
  id: string;
  titulo: string;
  empresa: string;
  ubicacion: string;
  salario: string;
  fuente: string;
  match: number;
  url: string;
}

export interface RespuestaFoto {
  reply?: string;
  error?: string;
  status?: number;
  action?: string;
  company?: ReturnType<typeof lugarAEmpresaDelChat> | TiendaCerca["empresa"];
  jobs?: OfertaChat[];
  brand?: FichaMarca;
  suggestedCompany?: string;
  suggestedSector?: string;
  cartelText?: string;
}

/**
 * Todo el camino de una foto ya leída: buscar el nombre cerca, o el sector de
 * más cerca a más lejos, o la marca.
 */
export async function responderFoto(
  foto: LecturaFoto,
  ctx: { lat?: number; lng?: number; ciudadUsuario?: string }
): Promise<RespuestaFoto> {
  const { lat, lng } = ctx;
  const ciudadUsuario = ctx.ciudadUsuario || "";
  console.log("[camara] lectura:", JSON.stringify(foto));

  if (foto.tipo === "borrosa") {
    return { reply: "🔍 La imagen está demasiado borrosa u oscura. Prueba con mejor luz y más cerca.", action: "ocr_blurry" };
  }

  // Se lanza ya y se espera donde haga falta: en una foto de marca va a la vez
  // que la investigación de la empresa, que es lo que más tarda.
  const zonaEnCamino = situarQuienFotografia(lat, lng, ciudadUsuario)
    .catch((): ZonaFoto => ({ coords: null, ciudad: "", paisCodigo: "ES", porGps: false }));

  const nombre = limpio(foto.nombre);
  const sector = limpio(foto.sector) || "";
  const cartelTexto = foto.tipo === "cartel" ? limpio(foto.cartel) : null;

  // ─── Un nombre: fachada, tarjeta, papel, pantalla, furgoneta… ──────────
  // Un producto con su marca no entra aquí: va por la ficha de la marca.
  if (nombre && foto.tipo !== "objeto" && foto.tipo !== "dibujo") {
    const zona = await zonaEnCamino;
    const ciudadVisible = limpio(foto.ciudad_visible);
    // "bar la parada tudela" escrito en un papel: la ciudad no es parte del
    // nombre, y dejándola se proponían bares que solo compartían "Tudela".
    const nombreBusqueda = quitarCiudad(nombre, [ciudadVisible, zona.ciudad]);
    const deLaFoto = {
      email: limpio(foto.email_visible),
      telefono: limpio(foto.telefono_visible),
      web: limpio(foto.web_visible),
      direccion: limpio(foto.direccion_visible),
    };

    // Una fachada con GPS: el local de esa misma calle (500 m), que es lo más
    // preciso. Si no, o si no aparece, se busca el nombre por la zona.
    let encontrado: Encontrado | null = null;
    if (foto.tipo === "negocio" && typeof lat === "number" && typeof lng === "number") {
      const enLaCalle = await searchGooglePlaces(nombreBusqueda, lat, lng, ciudadVisible || zona.ciudad, zona.coords, true);
      if (enLaCalle) encontrado = { lugar: enLaCalle, km: 0, via: "exacto", otros: [] };
    }
    const [porZona, ficha] = await Promise.all([
      encontrado ? Promise.resolve(null) : buscarNombreCerca(nombreBusqueda, limpio(foto.nombre_corregido), zona, ciudadVisible, sector),
      // Por si es una cadena: dónde contrata de verdad (en una tienda de Zara,
      // en el portal de Inditex). Para un bar de barrio la ficha sale vacía.
      investigarMarca(limpio(foto.nombre_corregido) || nombreBusqueda, "negocio").catch(() => null),
    ]);
    encontrado = encontrado || porZona;
    // Si la foto trae el correo y lo encontrado no es esa misma empresa, manda
    // la tarjeta: es la empresa que la persona tiene en la mano.
    if (deLaFoto.email && encontrado && encontrado.via !== "exacto") encontrado = null;

    const encabezadoCartel = cartelTexto ? `📸 He visto un cartel: **"${cartelTexto}"**\n\n` : "";
    if (encontrado) {
      const lugar = encontrado.lugar;
      // El correo de la tarjeta lo da la propia empresa: vale más que uno
      // deducido de su web. Solo si es la misma empresa (via "exacto").
      if (encontrado.via === "exacto" && deLaFoto.email && lugar.emailConfianza !== "alta") {
        lugar.email = deLaFoto.email;
        lugar.emailConfianza = "alta";
      }
      if (encontrado.via === "exacto" && !lugar.phone && deLaFoto.telefono) lugar.phone = deLaFoto.telefono;
      if (encontrado.via === "exacto" && !lugar.website && deLaFoto.web) lugar.website = deLaFoto.web;

      let reply = encabezadoCartel + encabezadoNombre(nombre, encontrado, zona) + buildCompanyReply(lugar, encontrado.km, zona);
      if (encontrado.otros.length) {
        reply += `\n\n📍 **También cerca:** ${encontrado.otros.map((o) => { const d = dondeEsta(o.km, o.address, zona); return d ? `${o.name} (${d})` : o.name; }).join(" · ")}`;
      }
      const nombreFicha = limpio(foto.nombre_corregido) || nombre;
      if (ficha?.empresa && ficha.portalEmpleo) {
        reply += `\n\n💼 **${nombreFicha}** es de **${ficha.empresa}**${ficha.grupo ? ` (grupo ${ficha.grupo})` : ""}, que contrata por su portal: ${ficha.portalEmpleo}`;
      }
      if (!zona.coords && !ciudadVisible) {
        reply += `

📍 Si me dices en qué ciudad estás (o la pones en tu perfil), te doy el más cercano a ti.`;
      }
      return { reply, action: "company_info", company: lugarAEmpresaDelChat(lugar) };
    }

    // No está en el mapa. Si la foto trae el correo (una tarjeta), con eso basta
    // para mandar el CV.
    if (deLaFoto.email) {
      const desdeFoto: PlacesResult = {
        name: nombre, address: deLaFoto.direccion || ciudadVisible || "", phone: deLaFoto.telefono || "",
        email: deLaFoto.email, emailConfianza: "alta", website: deLaFoto.web || "", mapsUrl: "", rating: 0,
      };
      return {
        reply: `${encabezadoCartel}📸 He leído **${nombre}**. No lo encuentro en el mapa, pero la foto trae sus datos:\n\n${buildCompanyReply(desdeFoto, null, zona)}`,
        action: "company_info",
        company: lugarAEmpresaDelChat(desdeFoto),
      };
    }

    const donde = ciudadVisible || zona.ciudad;
    let reply = `${encabezadoCartel}📸 He leído **${nombre}**, pero no encuentro ningún sitio con ese nombre${donde ? ` en ${donde} ni cerca` : ""}.`;
    if (ficha?.empresa) {
      reply += `\n\n🏢 **${limpio(foto.nombre_corregido) || nombre}** es de **${ficha.empresa}**${ficha.grupo ? ` (grupo ${ficha.grupo})` : ""}.`;
      if (ficha.portalEmpleo) reply += `\n💼 **Trabaja con ellos:** ${ficha.portalEmpleo} — ahí se presentan las candidaturas`;
      if (ficha.puestosHabituales.length) reply += `\n👔 Suele contratar: ${ficha.puestosHabituales.join(", ")}`;
    } else {
      reply += `\n\nSi sabes dónde está, dímelo así: "búscalo en Pamplona", y lo busco allí.`;
    }
    const bloque = sector ? await bloqueSector(foto, zona) : null;
    if (bloque?.texto) reply += `\n\n${bloque.texto}`;
    return {
      reply,
      action: "business_not_found",
      suggestedCompany: nombre,
      jobs: bloque?.ofertas.length ? bloque.ofertas : undefined,
    };
  }

  // ─── Cartel de "se busca" sin nombre de negocio ─────────────────────────
  if (cartelTexto) {
    const zona = await zonaEnCamino;
    const bloque = sector || lista(foto.puestos, 4).length ? await bloqueSector(foto, zona) : null;
    return {
      reply: `📸 He visto un cartel: **"${cartelTexto}"**\n\nParece que están buscando a alguien. Si me dices el nombre del negocio o la dirección, te ayudo a mandarle el CV.`
        + (bloque?.texto ? `\n\n${bloque.texto}` : ""),
      action: "job_sign_detected",
      cartelText: cartelTexto,
      jobs: bloque?.ofertas.length ? bloque.ofertas : undefined,
    };
  }

  // ─── Producto de una marca: quién lo hace y cómo se trabaja allí ───────
  const marca = limpio(foto.marca);
  const objeto = limpio(foto.objeto) || lista(foto.puestos, 1)[0] || (foto.tipo === "dibujo" ? "una profesión" : "producto");
  if (foto.tipo === "objeto" && marca) {
    const [zona, ficha] = await Promise.all([zonaEnCamino, investigarMarca(marca, objeto)]);
    const nombresEmpresa = [marca, ficha?.empresa, ficha?.grupo].filter((n): n is string => !!n);
    const [ofertas, tiendas, bloque] = await Promise.all([
      ofertasDeLaMarca(nombresEmpresa, zona.paisCodigo),
      // Solo marcas con tiendas: para Font Vella saldrían supermercados.
      ficha?.tieneTiendasPropias && zona.coords
        ? tiendasDeLaMarca(marca, zona.coords)
        : Promise.resolve({ propias: [] as TiendaCerca[], queLaVenden: [] as TiendaCerca[] }),
      // Y el sector, de más cerca a más lejos: para una botella de Font Vella,
      // las embotelladoras que hay cerca, no solo Danone.
      sector ? bloqueSector(foto, zona) : Promise.resolve(null),
    ]);
    const todasLasTiendas = [...tiendas.propias, ...tiendas.queLaVenden];
    if (ficha) await guardarLoCapturado(ficha, sector, todasLasTiendas, zona.ciudad);

    // La tarjeta con "Enviar mi CV" solo si hay a quién mandárselo: la tienda
    // más cercana con correo, o la empresa del sector más cercana con correo.
    const conCorreo = todasLasTiendas.sort((a, b) => a.km - b.km).find((t) => t.empresa.emailRrhh);
    let reply = respuestaMarca({
      objeto, modelo: limpio(foto.modelo), marca,
      confianza: foto.confianza_marca === "media" ? "media" : "alta",
      pista: limpio(foto.pista_marca), ficha, tiendas, ofertas, zona,
    });
    if (bloque?.texto) reply += `\n\n${bloque.texto}`;
    const empresaCard = conCorreo?.empresa || (bloque?.cercana?.email ? lugarAEmpresaDelChat(bloque.cercana) : undefined);
    return {
      reply,
      action: empresaCard ? "company_info" : "object_brand_found",
      company: empresaCard,
      brand: ficha ?? undefined,
      jobs: bloque?.ofertas.length ? bloque.ofertas : undefined,
    };
  }

  // ─── Objeto sin marca, o un dibujo: el sector de más cerca a más lejos ──
  // Sin sector ni nada que buscar (un paisaje), no hay a dónde mandar el CV.
  const hayQueBuscar = !!sector || lista(foto.busquedas_empresas, 3).length > 0 || lista(foto.puestos, 4).length > 0;
  if ((foto.tipo === "objeto" || foto.tipo === "dibujo") && hayQueBuscar) {
    const zona = await zonaEnCamino;
    const bloque = await bloqueSector(foto, zona);
    let reply = foto.tipo === "dibujo"
      ? `🎨 Es un dibujo de **${objeto}**${sector ? `: el sector de **${sector}**` : ""}.`
      : `📸 En la foto hay **${objeto}**${sector ? `, del sector de **${sector}**` : ""}.`;
    if (bloque?.texto) reply += `\n\n${bloque.texto}`;
    else if (sector) reply += `\n\nAhora mismo no encuentro empresas ni ofertas de ese sector${zona.ciudad ? ` cerca de ${zona.ciudad}` : ""}.`;
    if (foto.tipo === "objeto") reply += `\n\n💡 Si haces la foto donde se vea la etiqueta o el logo, te digo también qué empresa lo fabrica.`;
    if (!zona.coords) reply += `\n\n📍 Dime en qué ciudad estás (o pon tu ciudad en el perfil) y te lo ordeno por distancia.`;
    return {
      reply,
      action: bloque?.cercana?.email ? "company_info" : "object_to_sector",
      company: bloque?.cercana?.email ? lugarAEmpresaDelChat(bloque.cercana) : undefined,
      suggestedSector: sector || undefined,
      jobs: bloque?.ofertas.length ? bloque.ofertas : undefined,
    };
  }

  return {
    reply: "😅 No veo ningún nombre de empresa, cartel de empleo, producto ni dibujo que me dé pistas.\n\n📸 **Prueba con:** la fachada de un negocio, una tarjeta de visita, un nombre escrito en un papel o un producto (una botella, una herramienta…).",
    action: "ocr_not_useful",
  };
}

// ─── "Búscalo" en el chat, después de una foto ───────────────────────────

/**
 * Si lo último que dijo Guzzi fue una foto con un nombre ("He leído **X**…",
 * "He visto **X**…") y ahora la persona dice "búscalo" (o "búscalo en
 * Pamplona"), qué hay que buscar y dónde. Con la tarjeta del Consorcio EDER,
 * el "búscalo" se iba a la charla libre (16 oct 2026).
 */
export function nombreDeLaFotoAnterior(
  mensaje: string,
  history: Array<{ role: string; text: string }> = []
): { nombre: string; ciudad: string | null } | null {
  const t = mensaje.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim().replace(/[.!¡¿?]+/g, "");
  const m = t.match(/^(?:si,?\s+|vale,?\s+|venga,?\s+|pues\s+)?(?:buscal[oa]s?|buscamel[oa]s?|busca(?:lo|la)?\s+(?:eso|esa|ese|esto|esta)|encuentral[oa]|donde esta|buscalo tu)(?:\s+(?:en|por)\s+(.{2,40}))?$/);
  if (!m) return null;
  const ultimo = [...(history || [])].reverse().find((h) => h.role !== "user")?.text || "";
  const leido = ultimo.match(/He (?:leído|visto) \*\*"?([^*"]{2,60})"?\*\*/);
  if (!leido) return null;
  const ciudad = m[1] ? m[1].trim().replace(/\b\w/g, (c) => c.toUpperCase()) : null;
  return { nombre: leido[1].trim(), ciudad };
}

/** El sitio que se llama así, cerca de una ciudad (la que dice, o la suya). */
export async function buscarNegocioPorNombre(nombre: string, ciudad: string): Promise<RespuestaFoto> {
  const zona = await situarQuienFotografia(undefined, undefined, ciudad).catch((): ZonaFoto => ({ coords: null, ciudad, paisCodigo: "ES", porGps: false }));
  const encontrado = await buscarNombreCerca(quitarCiudad(nombre, [ciudad, zona.ciudad]), null, zona, null, "");
  if (!encontrado) {
    return {
      reply: `🔍 He buscado **${nombre}**${zona.ciudad ? ` en ${zona.ciudad} y alrededores` : ""} y no aparece en el mapa. Si sabes en qué ciudad está, dime "búscalo en …" con la ciudad.`,
      action: "business_not_found",
      suggestedCompany: nombre,
    };
  }
  return {
    reply: encabezadoNombre(nombre, encontrado, zona) + buildCompanyReply(encontrado.lugar, encontrado.km, zona)
      + (encontrado.otros.length ? `\n\n📍 **También cerca:** ${encontrado.otros.map((o) => { const d = dondeEsta(o.km, o.address, zona); return d ? `${o.name} (${d})` : o.name; }).join(" · ")}` : ""),
    action: "company_info",
    company: lugarAEmpresaDelChat(encontrado.lugar),
  };
}

/** El nombre sin la ciudad pegada al principio o al final ("bar la parada tudela"). */
export function quitarCiudad(nombre: string, ciudades: Array<string | null | undefined>): string {
  let palabras = nombre.split(/\s+/);
  for (const c of ciudades) {
    if (!c) continue;
    const pc = normalizar(c.split(/[,(]/)[0]).split(" ").filter(Boolean);
    if (!pc.length) continue;
    const quita = (desdeFinal: boolean) => {
      const trozo = desdeFinal ? palabras.slice(-pc.length) : palabras.slice(0, pc.length);
      if (normalizar(trozo.join(" ")) === pc.join(" ") && palabras.length > pc.length) {
        palabras = desdeFinal ? palabras.slice(0, -pc.length) : palabras.slice(pc.length);
        // "Bar La Parada de Tudela": fuera también el "de" o "en" que queda colgando.
        if (desdeFinal && /^(de|en|del)$/i.test(palabras[palabras.length - 1] || "") && palabras.length > 1) palabras = palabras.slice(0, -1);
      }
    };
    quita(true);
    quita(false);
  }
  return palabras.join(" ").trim() || nombre;
}

// ─── Buscar un nombre cerca de quien hace la foto ────────────────────────

interface Candidato { place_id: string; name: string; address: string; km: number | null; types: string[] }

interface Encontrado {
  lugar: PlacesResult;
  km: number | null;
  /** exacto: se llama así · corregido: el nombre bien escrito · parecido: lo más parecido cerca · lejos: se llama así pero está lejos */
  via: "exacto" | "corregido" | "parecido" | "lejos";
  /** El nombre bien escrito, si se ha buscado así ("Randstad" por "Rasta"). */
  corregido?: string;
  otros: Array<{ name: string; km: number | null; address: string }>;
}

/** Hasta dónde algo está "cerca" de quien hace la foto. */
const CERCA_KM = 60;

const normalizar = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/**
 * ¿El sitio se llama así, palabra por palabra? "Zara" en "ZARA Gran Vía" sí;
 * "Rasta" en "Oficial Rastas Madrid" no (es otra palabra).
 */
export function coincideFuerte(buscado: string, encontrado: string): boolean {
  const a = ` ${normalizar(buscado)} `;
  const b = ` ${normalizar(encontrado)} `;
  if (a.trim().length < 2 || b.trim().length < 2) return false;
  return b.includes(a) || a.includes(b);
}

/** Parecido entre dos nombres (0 a 1), comparando con la palabra más parecida del sitio. */
export function similitud(buscado: string, encontrado: string): number {
  const bigramas = (s: string) => {
    const t = s.replace(/ /g, "");
    const r: string[] = [];
    for (let i = 0; i < t.length - 1; i++) r.push(t.slice(i, i + 2));
    return r;
  };
  const dice = (x: string, y: string) => {
    const bx = bigramas(x), by = bigramas(y);
    if (!bx.length || !by.length) return 0;
    const resto = [...by];
    let comunes = 0;
    for (const g of bx) {
      const i = resto.indexOf(g);
      if (i >= 0) { comunes++; resto.splice(i, 1); }
    }
    return (2 * comunes) / (bx.length + by.length);
  };
  const a = normalizar(buscado);
  const palabras = normalizar(encontrado).split(" ").filter((p) => p.length >= 3);
  return Math.max(0, ...palabras.map((p) => dice(a, p)));
}

async function candidatosPorTexto(consultas: string[], centro: { lat: number; lng: number } | null): Promise<Candidato[]> {
  const listas = await Promise.all(
    consultas.map((q) => buscarTextoSinDetalles(q, centro ? { ...centro, radioMetros: CERCA_KM * 1000 } : undefined).catch(() => [] as SitioBasico[]))
  );
  const vistos = new Map<string, Candidato>();
  for (const s of listas.flat()) {
    if (vistos.has(s.place_id)) continue;
    vistos.set(s.place_id, {
      place_id: s.place_id,
      name: s.name,
      address: s.formatted_address || "",
      types: s.types || [],
      km: centro && s.lat != null && s.lng != null ? distanciaKm(centro, { lat: s.lat, lng: s.lng }) : null,
    });
  }
  return [...vistos.values()];
}

/**
 * El sitio que se llama como lo que se ha leído, el más cercano. Si cerca no
 * hay ninguno, el nombre bien escrito o lo más parecido; y si tampoco, el que
 * se llama así aunque esté lejos, diciendo a cuántos kilómetros.
 */
export async function buscarNombreCerca(
  nombre: string,
  corregido: string | null,
  zona: ZonaFoto,
  ciudadVisible: string | null,
  sector: string
): Promise<Encontrado | null> {
  // Sin ciudad ni GPS, por lo menos el país: el servidor no está en España y
  // Google buscaba "Randstad" en Clermont-Ferrand (16 oct 2026).
  const ciudadRef = ciudadVisible || zona.ciudad || (zona.coords ? "" : nombrePais(zona.paisCodigo));
  const corr = corregido && normalizar(corregido) !== normalizar(nombre) ? corregido : null;
  const consultas = [
    ciudadRef ? `${nombre} ${ciudadRef}` : nombre,
    zona.coords ? nombre : null,
    corr ? (ciudadRef ? `${corr} ${ciudadRef}` : corr) : (sector ? `${nombre} ${sector}` : null),
  ].filter((q): q is string => !!q);
  const candidatos = await candidatosPorTexto([...new Set(consultas)], zona.coords);

  if (!candidatos.length) {
    // Sin Google (cuota agotada o caído): el respaldo gratuito.
    const osm = await buscarConOSM(corr || nombre, ciudadRef || undefined);
    return osm ? { lugar: osm, km: null, via: corr ? "corregido" : "exacto", otros: [] } : null;
  }

  const porKm = (xs: Candidato[]) => [...xs].sort((a, b) => (a.km ?? 9999) - (b.km ?? 9999));
  // Sin saber dónde está la persona, Google busca en todo el mundo: "Rasta"
  // escrito en un papel dio una tienda de Francia. Se queda en su país.
  if (!zona.coords) {
    const pais = nombrePais(zona.paisCodigo);
    const delPais = candidatos.filter((c) => normalizar(c.address).includes(normalizar(pais)) || (zona.paisCodigo === "ES" && /spain/i.test(c.address)));
    if (delPais.length) candidatos.splice(0, candidatos.length, ...delPais);
  }
  const cerca = (c: Candidato) => c.km === null || c.km <= CERCA_KM;
  // Si la foto dice la ciudad (una tarjeta de Madrid), manda esa ciudad.
  const enCiudadVisible = (c: Candidato) => !ciudadVisible || normalizar(c.address).includes(normalizar(ciudadVisible));

  const fuertes = porKm(candidatos.filter((c) => coincideFuerte(nombre, c.name)));
  const debiles = porKm(candidatos.filter((c) => !coincideFuerte(nombre, c.name) && nombreCoincide(nombre, c.name)));
  const corregidos = corr ? porKm(candidatos.filter((c) => coincideFuerte(corr, c.name))) : [];
  const parecidos = porKm(candidatos.filter((c) => similitud(nombre, c.name) >= 0.5));

  const elegir = (): { c: Candidato; via: Encontrado["via"]; grupo: Candidato[] } | null => {
    // Sin ubicación, "cerca" no significa nada: si el nombre parece mal escrito
    // ("Rasta" → Randstad), manda la corrección.
    if (!zona.coords && !ciudadVisible && corregidos.length) return { c: corregidos[0], via: "corregido", grupo: corregidos };
    const fuerteVisible = fuertes.filter(enCiudadVisible);
    if (ciudadVisible && fuerteVisible.length) return { c: fuerteVisible[0], via: "exacto", grupo: fuerteVisible };
    if (fuertes.some(cerca)) return { c: fuertes.find(cerca)!, via: "exacto", grupo: fuertes };
    if (corregidos.some(cerca)) return { c: corregidos.find(cerca)!, via: "corregido", grupo: corregidos };
    if (debiles.some(cerca)) return { c: debiles.find(cerca)!, via: "parecido", grupo: [] };
    if (parecidos.some(cerca)) return { c: parecidos.find(cerca)!, via: "parecido", grupo: [] };
    // Y no tan lejos que no sirva: con Uber salía un punto de recogida en
    // Barajas, a 241 km. Más allá, mejor la marca y su portal de empleo.
    const deVerdad = fuertes.filter((c) => (c.km === null || c.km <= 150) && (normalizar(c.name).startsWith(normalizar(nombre))
      || normalizar(c.name).split(" ").length <= normalizar(nombre).split(" ").length + 3));
    if (deVerdad.length) return { c: deVerdad[0], via: "lejos", grupo: deVerdad };
    if (corregidos.length) return { c: corregidos[0], via: "corregido", grupo: corregidos };
    return null;
  };
  const elegido = elegir();
  if (!elegido) return null;

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const lugar = apiKey ? await getPlaceDetails(elegido.c.place_id, apiKey) : null;
  if (!lugar) return null;
  return {
    lugar,
    km: elegido.c.km,
    via: elegido.via,
    corregido: elegido.via === "corregido" && corr ? corr : undefined,
    // Si es una cadena, las otras sedes cercanas.
    otros: elegido.grupo.filter((c) => c.place_id !== elegido.c.place_id && cerca(c)).slice(0, 3)
      .map((c) => ({ name: c.name, km: c.km, address: c.address })),
  };
}

/**
 * Dónde está algo respecto a quien hace la foto. Sin GPS, la distancia se mide
 * desde el centro del término municipal y engaña: el Consorcio EDER, en pleno
 * Tudela, salía "a 3 km de ti". Si está en su misma ciudad, se dice así.
 */
function dondeEsta(n: number | null, direccion: string | null | undefined, zona: ZonaFoto): string {
  if (!zona.porGps && zona.ciudad && direccion && ` ${normalizar(direccion)} `.includes(` ${normalizar(zona.ciudad)} `)) {
    return `en ${zona.ciudad}`;
  }
  return km(n);
}

function km(n: number | null): string {
  if (n === null) return "";
  return n < 1 ? "a menos de 1 km" : `a ${Math.round(n)} km`;
}

function encabezadoNombre(leido: string, e: Encontrado, zona: ZonaFoto): string {
  const donde = zona.ciudad ? ` en ${zona.ciudad}` : " cerca de ti";
  if (e.via === "corregido") {
    return `📸 He leído **"${leido}"**: creo que quieres decir **${e.corregido || e.lugar.name}**.\n\n`;
  }
  if (e.via === "parecido") {
    return `📸 He leído **"${leido}"**. No encuentro ningún sitio con ese nombre${donde}; lo más parecido que hay cerca es este (comprueba que sea el que buscas):\n\n`;
  }
  if (e.via === "lejos") {
    return `📸 He leído **"${leido}"**. No hay ninguno${donde}; el más cercano está ${km(e.km)}:\n\n`;
  }
  return "";
}

// ─── El sector, de más cerca a más lejos ─────────────────────────────────

interface EmpresaSector { place_id: string; name: string; address: string; km: number }

/** Lo que no es una empresa del sector aunque Google lo devuelva: tiendas que solo venden. */
const SOLO_VENDEN = new Set(["supermarket", "grocery_or_supermarket", "convenience_store", "department_store", "shopping_mall", "gas_station"]);

/** Hasta dónde se enseñan empresas del sector. */
const SECTOR_MAX_KM = 250;

/** Empresas del sector ordenadas por distancia (las 6 primeras). */
export async function empresasDelSectorCerca(busquedas: string[], zona: ZonaFoto, nombresTipicos: string[] = []): Promise<EmpresaSector[]> {
  if (!zona.coords || !busquedas.length) return [];
  const quiereTiendas = /tienda|supermercado|comercio/i.test(busquedas.join(" "));
  const candidatos = await candidatosPorTexto(busquedas.slice(0, 3), zona.coords);
  // Google mezcla por la zona cosas que no son del sector: con una botella de
  // agua salían una aceitera y un distribuidor cualquiera de Tudela por delante
  // de las embotelladoras de verdad (16 oct 2026). Si hay al menos tres cuyo
  // nombre delata el sector, se enseñan solo esas.
  const raices = raicesDe(nombresTipicos);
  const delSector = (c: Candidato) => raices.length > 0 && raices.some((r) => ` ${normalizar(c.name)}`.includes(` ${r}`));
  const cuantosDelSector = candidatos.filter((c) => c.km !== null && c.km <= SECTOR_MAX_KM && delSector(c)).length;
  const vistos = new Set<string>();
  return candidatos
    .filter((c): c is Candidato & { km: number } => c.km !== null && c.km <= SECTOR_MAX_KM)
    .filter((c) => quiereTiendas || !c.types.some((t) => SOLO_VENDEN.has(t)))
    .filter((c) => cuantosDelSector < 3 || delSector(c))
    .sort((a, b) => a.km - b.km)
    .filter((c) => {
      const clave = normalizar(c.name);
      if (vistos.has(clave)) return false;
      vistos.add(clave);
      return true;
    })
    .slice(0, 6)
    .map((c) => ({ place_id: c.place_id, name: c.name, address: c.address, km: c.km }));
}

/** La raíz de cada palabra con sustancia: "embotelladora" → "embotellad", "aguas" → "agua". */
function raicesDe(palabras: string[]): string[] {
  const r = palabras.join(" ")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .split(/[^a-z]+/)
    .filter((p) => p.length >= 3 && !["del", "las", "los", "una", "con", "para", "por"].includes(p))
    .map((p) => (p.length > 6 ? p.slice(0, p.length - 2) : p.replace(/s$/, "")));
  return [...new Set(r)];
}

/** Palabras que no dicen de qué sector es un puesto. */
const PALABRAS_GENERICAS = new Set([
  "operario", "operaria", "operarios", "tecnico", "tecnica", "auxiliar", "ayudante", "responsable", "encargado",
  "encargada", "empleado", "empleada", "personal", "trabajador", "trabajadora", "oficial", "peon", "jefe", "jefa",
  "mozo", "moza", "especialista", "sector", "empresa", "empresas", "planta", "fabrica", "industria", "servicios",
  "atencion", "cliente", "general", "puesto", "trabajo",
  // Con la caricatura de una enfermera salían ofertas de administrativo y, con
  // un tractor, de mantenimiento de un laboratorio dental (16 oct 2026).
  "administrativo", "administrativa", "administracion", "mantenimiento", "comercial", "gestor", "gestora",
  "coordinador", "coordinadora", "consultor", "consultora", "analista", "director", "directora", "supervisor",
  "supervisora", "produccion", "calidad", "linea", "recursos", "humanos", "vendedor", "vendedora", "tecnicos",
]);

/**
 * Las palabras que identifican el sector en el título de una oferta: "operario
 * de envasado" → "envasad…"; se quita lo que vale para cualquier oficio.
 */
export function terminosDeOfertas(sector: string, puestos: string[]): string[] {
  const palabras = [sector, ...puestos].join(" ")
    .normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .split(/[^a-z]+/)
    .filter((p) => p.length >= 4 && !PALABRAS_GENERICAS.has(p) && !["para", "con", "del", "las", "los", "una"].includes(p));
  // La raíz, para que "envasado" encuentre "envasadora" y "camarero" "camarera".
  const raices = palabras.map((p) => (p.length > 6 ? p.slice(0, p.length - 2) : p));
  return [...new Set(raices)].slice(0, 8);
}

/** Ofertas del sector en el país, ordenadas por kilómetros desde quien hace la foto. */
type OfertaCerca = { id: string; titulo: string; empresa: string; ciudad: string; km: number | null; salario: string | null; fuente: string | null; url: string | null };

/**
 * Ofertas del sector de más cerca a más lejos. Primero se buscan las que
 * nombran el sector en el título ("Técnico de depuradoras de aguas"); si hay
 * menos de tres, se completan con los puestos típicos (carretillero), que
 * valen para cualquier fábrica y solos daban una lista que no era del agua.
 */
export async function ofertasDelSectorCerca(
  terminosSector: string[],
  terminosPuestos: string[],
  zona: ZonaFoto
): Promise<OfertaCerca[]> {
  const propias = await ofertasPorTerminos(terminosSector, zona);
  if (propias.length >= 3) return propias;
  const otras = (await ofertasPorTerminos(terminosPuestos, zona)).filter((o) => o.km === null || o.km <= CERCA_KM);
  const vistas = new Set(propias.map((o) => o.id));
  return [...propias, ...otras.filter((o) => !vistas.has(o.id))]
    .sort((a, b) => (a.km ?? 9999) - (b.km ?? 9999))
    .slice(0, 6);
}

async function ofertasPorTerminos(terminos: string[], zona: ZonaFoto): Promise<OfertaCerca[]> {
  if (!terminos.length) return [];
  // Palabra entera por el principio ("\menvasad"), con lo que quiera detrás.
  const patron = `\\m(${terminos.map((t) => t.replace(/[^a-z]/g, "")).join("|")})`;
  const pais = (zona.paisCodigo || "ES").toLowerCase();
  try {
    const pool = getPool();
    if (zona.coords) {
      const { rows } = await pool.query<{ id: string; title: string; company: string; ciudad: string; km: number; salary: string | null; sourceName: string | null; sourceUrl: string | null }>(
        `SELECT DISTINCT ON (km, lower(j.title), lower(j.company)) j.id, j.title, j.company, split_part(j.city, ',', 1) AS ciudad,
                j.salary, j."sourceName", j."sourceUrl",
                round((2 * 6371 * asin(sqrt(
                  power(sin(radians(co.lat - $3) / 2), 2) +
                  cos(radians($3)) * cos(radians(co.lat)) * power(sin(radians(co.lon - $4) / 2), 2)
                )))::numeric)::int AS km
           FROM "JobListing" j
           JOIN ciudad_coords co ON lower(co.ciudad) = lower(split_part(j.city, ',', 1)) AND co.pais = $5
          WHERE j."isActive" = true AND lower(j.country) = $1 AND j.title ~* $2 AND co.lat IS NOT NULL
          ORDER BY km ASC, lower(j.title), lower(j.company), j."scrapedAt" DESC
          LIMIT 6`,
        [pais, patron, zona.coords.lat, zona.coords.lng, pais.toUpperCase()]
      );
      return rows.map((r) => ({ id: r.id, titulo: r.title, empresa: r.company, ciudad: r.ciudad, km: r.km, salario: r.salary, fuente: r.sourceName, url: r.sourceUrl }));
    }
    // Sin saber dónde está: las más recientes del país, sin decir "cerca".
    const { rows } = await pool.query<{ id: string; title: string; company: string; city: string | null; salary: string | null; sourceName: string | null; sourceUrl: string | null }>(
      `SELECT id, title, company, city, salary, "sourceName", "sourceUrl" FROM "JobListing"
        WHERE "isActive" = true AND lower(country) = $1 AND title ~* $2
        ORDER BY "scrapedAt" DESC LIMIT 6`,
      [pais, patron]
    );
    return rows.map((r) => ({ id: r.id, titulo: r.title, empresa: r.company, ciudad: (r.city || "").split(",")[0], km: null, salario: r.salary, fuente: r.sourceName, url: r.sourceUrl }));
  } catch (e) {
    console.warn("[camara] ofertas del sector:", (e as Error).message);
    return [];
  }
}

/**
 * El bloque del sector: empresas y ofertas de más cerca a más lejos, y los
 * datos de la empresa más cercana (para el botón de "Enviar mi CV").
 */
async function bloqueSector(foto: LecturaFoto, zona: ZonaFoto): Promise<{ texto: string; ofertas: OfertaChat[]; cercana: PlacesResult | null } | null> {
  const sector = limpio(foto.sector) || "";
  const busquedas = lista(foto.busquedas_empresas, 3);
  const puestos = lista(foto.puestos, 4);
  if (!sector && !busquedas.length && !puestos.length) return null;

  const nombresTipicos = lista(foto.nombres_tipicos, 6);
  const [empresas, ofertas] = await Promise.all([
    empresasDelSectorCerca(busquedas.length ? busquedas : (sector ? [sector] : []), zona, nombresTipicos),
    // Las palabras de los títulos del sector, si las hay: buscar "sanidad" en
    // los títulos traía un cocinero "Sanidad" en Madrid antes que las
    // enfermeras de San Adrián (16 oct 2026).
    lista(foto.palabras_ofertas, 6).length
      ? ofertasDelSectorCerca(terminosDeOfertas("", lista(foto.palabras_ofertas, 6)), terminosDeOfertas("", puestos), zona)
      : ofertasDelSectorCerca(terminosDeOfertas(sector, []), terminosDeOfertas("", puestos), zona),
  ]);
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const cercana = empresas[0] && apiKey ? await getPlaceDetails(empresas[0].place_id, apiKey).catch(() => null) : null;

  const l: string[] = [];
  const desde = zona.ciudad ? ` desde ${zona.ciudad}` : "";
  if (empresas.length) {
    l.push(`🏭 **Empresas de ${sector || "este sector"}, de más cerca a más lejos**${desde}:`);
    empresas.forEach((e, i) => {
      const extra = i === 0 && cercana ? [cercana.phone && `📞 ${cercana.phone}`, cercana.website && `🌐 ${cercana.website}`].filter(Boolean).join(" · ") : "";
      l.push(`${i + 1}. **${e.name}** — ${dondeEsta(e.km, e.address, zona)}${e.address ? ` · ${e.address.replace(/, (España|Spain)$/, "")}` : ""}${extra ? `\n   ${extra}` : ""}`);
    });
  }
  if (ofertas.length) {
    if (l.length) l.push("");
    l.push(zona.coords
      ? `📋 **Ofertas de ${sector || "este sector"}, de más cerca a más lejos:**`
      : `📋 **Ofertas de ${sector || "este sector"} en ${nombrePais(zona.paisCodigo)}:**`);
    ofertas.forEach((o, i) => {
      l.push(`${i + 1}. **${o.titulo}** — ${o.empresa || "empresa sin nombre"}${o.ciudad ? ` · 📍 ${o.ciudad}` : ""}${o.km !== null && !dondeEsta(o.km, o.ciudad, zona).startsWith("en ") ? ` (${km(o.km)})` : ""} — [Ver detalles](/app/ofertas/${o.id})`);
    });
  }
  if (!l.length) return { texto: "", ofertas: [], cercana: null };
  if (empresas.length || ofertas.some((o) => o.km !== null)) l.push("\n_Distancias en línea recta, aproximadas._");
  return {
    texto: l.join("\n"),
    ofertas: ofertas.map((o) => ({
      id: `db-${o.id}`, titulo: o.titulo, empresa: o.empresa || "Ver en oferta",
      ubicacion: o.ciudad || nombrePais(zona.paisCodigo), salario: o.salario || "Ver en oferta",
      fuente: o.fuente || "", match: 0, url: o.url || "",
    })),
    cercana,
  };
}

// ─── Marcas ──────────────────────────────────────────────────────────────

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
  ofertas: { enPais: OfertaMarca[]; totalPais: number; totalFuera: number; fallo?: boolean };
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
  } else if (d.ofertas.fallo) {
    l.push(`📋 Ahora mismo no he podido mirar sus ofertas. Prueba en un rato${f?.portalEmpleo ? " o entra en su portal de empleo" : ""}.`);
  } else {
    l.push(`📋 No tenemos ofertas suyas publicadas ahora mismo.`);
  }

  if (f?.empresa) {
    l.push("");
    l.push(`✅ He guardado **${f.empresa}** en el buscador de empresas: ya no hace falta volver a hacer la foto.`);
  }
  return l.join("\n");
}

// ─── El sitio en el mapa ─────────────────────────────────────────────────

/**
 * La tarjeta de "Enviar mi CV" del chat lee los campos de EmpresaCompleta
 * (nombre, emailRrhh, telefono…). La cámara devolvía otros nombres (name,
 * email, phone…), así que la tarjeta nunca aparecía después de una foto.
 */
export function lugarAEmpresaDelChat(p: PlacesResult) {
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

export interface PlacesResult {
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
 * El local de una fachada, con GPS: lo que hay en esa misma calle.
 *
 * OJO — son DOS servicios distintos: leer la imagen es OpenAI GPT-4o Vision;
 * esto solo ubica el negocio. Si Google Places no responde (sin facturación,
 * sin cuota o API legacy retirada), se cae al respaldo GRATUITO de
 * OpenStreetMap para que la foto siga siendo útil.
 */
async function searchGooglePlaces(
  companyName: string,
  lat?: number,
  lng?: number,
  city?: string,
  /** Dónde está la persona (GPS o su ciudad), para elegir el más cercano. */
  cerca?: { lat: number; lng: number } | null,
  /** Solo lo que hay en esa misma calle (500 m). */
  soloEnLaCalle = false
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
        results?: Array<{ place_id: string; name?: string; geometry?: { location?: { lat: number; lng: number } } }>;
      };
      // NO vale el primero de la lista: Google mezcla por parecido, y el 29 sep
      // 2026 una foto de un Zara devolvió el Stradivarius de al lado. En la calle
      // eso es mandar el CV a la tienda equivocada. Tiene que llamarse igual.
      // Y tiene que estar ahí de verdad: con el GPS en Tudela, la búsqueda "a
      // 500 m" devolvió el Zara de Pamplona, a 80 km (16 oct 2026).
      const enLaCalle = (r: { geometry?: { location?: { lat: number; lng: number } } }) =>
        !r.geometry?.location || distanciaKm({ lat, lng }, r.geometry.location) <= 1;
      const bueno = nearbyData.results?.find((r) => nombreCoincide(companyName, r.name || "") && enLaCalle(r));
      if (bueno) return await getPlaceDetails(bueno.place_id, apiKey);
    }
    if (soloEnLaCalle) return null;

    // Fallback: búsqueda por texto con la LISTA entera (hasta 20), quedándose
    // con el que se llame igual y esté más cerca.
    const consulta = cerca ? companyName : (city ? `${companyName} ${city}` : companyName);
    const sitios = await buscarTextoSinDetalles(consulta, cerca ? { ...cerca, radioMetros: 50000 } : undefined);
    const iguales = sitios.filter((s) => nombreCoincide(companyName, s.name));
    if (!iguales.length) return null;

    const conSitio = iguales.filter((s) => s.lat != null && s.lng != null);
    const elegido = cerca && conSitio.length
      ? conSitio.sort((a, b) =>
          distanciaKm(cerca, { lat: a.lat!, lng: a.lng! }) - distanciaKm(cerca, { lat: b.lat!, lng: b.lng! }))[0]
      : iguales[0];

    return await getPlaceDetails(elegido.place_id, apiKey);
  } catch {
    return null;
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
  const a = normalizar(buscado);
  const b = normalizar(encontrado);
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
    const { email, emailConfianza } = await correoDeLaWeb(r.website);
    return {
      name: r.name,
      address: r.formatted_address || "",
      phone: r.formatted_phone_number || "",
      email,
      emailConfianza,
      website: webPropia(r.website),
      mapsUrl: r.url || "",
      rating: 0, // OSM no tiene valoraciones: 0 = "sin dato", no se inventa
    };
  } catch {
    return null;
  }
}

/**
 * El correo de RRHH de su web, con el extractor bueno (prioriza RRHH, descarta
 * CDNs y noreply, bloquea SSRF). Sin correo real, un patrón solo si el dominio
 * recibe correo; y si no, nada: mejor no dar una dirección que rebota.
 */
const PLATAFORMAS = /(^|\.)(google\.[a-z.]+|goo\.gl|g\.page|facebook\.com|fb\.com|fb\.me|instagram\.com|wa\.me|whatsapp\.com|linktr\.ee|booking\.com|tripadvisor\.[a-z.]+|thefork\.[a-z.]+|eltenedor\.es|just-eat\.es|glovoapp\.com|ubereats\.com|youtube\.com|tiktok\.com|twitter\.com|x\.com|linkedin\.com|business\.site|wixsite\.com|blogspot\.com|paginasamarillas\.es)$/i;

function dominioDe(web: string): string {
  try { return new URL(/^https?:/i.test(web) ? web : `https://${web}`).hostname.toLowerCase().replace(/^www\./, ""); } catch { return ""; }
}

/** La web, si es de la empresa. Una búsqueda de Google o una página de Facebook no lo son. */
function webPropia(web?: string | null): string {
  if (!web) return "";
  const d = dominioDe(web);
  if (!d) return "";
  // sites.google.com sí es una web hecha por la empresa; una búsqueda de Google no.
  if (/^google\./.test(d) || d === "goo.gl" || d === "g.page") return "";
  return web;
}

async function correoDeLaWeb(web?: string | null): Promise<{ email: string; emailConfianza: "alta" | "media" | "baja" }> {
  if (!web || PLATAFORMAS.test(dominioDe(web))) return { email: "", emailConfianza: "baja" };
  try {
    const { extraerInfoEmpresa } = await import("@/lib/company-extractor");
    const { extraerDominio, generarEmails, dominioAceptaCorreo } = await import("@/lib/empresa-datos");
    const datos = await extraerInfoEmpresa(web);
    if (datos?.emailRrhh && !datos.emailRrhh.includes("www.")) return { email: datos.emailRrhh, emailConfianza: "alta" };
    const dominio = extraerDominio(web);
    if (dominio && (await dominioAceptaCorreo(dominio))) return { email: generarEmails(dominio, true)[0] || "", emailConfianza: "media" };
  } catch { /* sin email */ }
  return { email: "", emailConfianza: "baja" };
}

async function getPlaceDetails(placeId: string, apiKey: string): Promise<PlacesResult | null> {
  const { consumirCuotaPlaces } = await import("@/lib/places-quota");
  if (!(await consumirCuotaPlaces())) return null;
  const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,formatted_phone_number,website,rating,url&language=es&key=${apiKey}`;
  const detailsRes = await fetch(detailsUrl, { signal: AbortSignal.timeout(8000) });
  const detailsData = await detailsRes.json() as {
    result?: { name: string; formatted_address: string; formatted_phone_number: string; website: string; rating: number; url: string };
  };
  const r = detailsData.result;
  if (!r) return null;
  const { email, emailConfianza } = await correoDeLaWeb(r.website);
  return {
    name: r.name,
    address: r.formatted_address,
    phone: r.formatted_phone_number || "",
    email,
    emailConfianza,
    website: webPropia(r.website),
    mapsUrl: r.url,
    rating: r.rating || 0,
  };
}

function buildCompanyReply(company: PlacesResult, distancia: number | null, zona: ZonaFoto): string {
  const parts: string[] = [];
  const donde = distancia !== null ? dondeEsta(distancia, company.address, zona) : "";
  parts.push(`📸 **${company.name}**${donde.startsWith("en ") ? ` · ${donde}` : distancia !== null && distancia >= 1 ? ` · ${donde} de ti` : ""}`);
  if (company.rating) parts.push(`⭐ ${company.rating} · 📍 ${company.address}`);
  else if (company.address) parts.push(`📍 ${company.address}`);
  if (company.phone) parts.push(`📞 ${company.phone}`);
  if (company.email) {
    // Ser honesto: si el email es un patrón deducido, decirlo. Así el usuario
    // decide si gasta un envío o prefiere llamar por teléfono.
    const sello = company.emailConfianza === "alta" ? " ✅ verificado" : " ⚠️ estimado, puede rebotar";
    parts.push(`✉️ ${company.email}${sello}`);
  }
  if (company.website) parts.push(`🌐 ${company.website}`);
  parts.push("");
  parts.push(
    company.email
      ? `💡 Usa el botón "📧 Enviar mi CV" y lo mando ahora.`
      : `💡 No encuentro su correo. Puedes llamar o pasarte por allí con el CV.`
  );
  return parts.join("\n");
}
