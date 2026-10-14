/**
 * lib/guzzi/entender.ts — Entender lo que pide la persona cuando las reglas no bastan.
 *
 * POR QUÉ (auditoría del 14 oct 2026 sobre 474 mensajes reales). Guzzi decide
 * qué hacer con reglas escritas a mano (lib/guzzi/intents.ts): "busco X en Y".
 * Lo que no encaja en la forma esperada cae donde no toca:
 *   · "Mozo de almacén em Oporto", "Limpieza, hostelería, cuidado de mayores",
 *     "Salamanca" (respondiendo a "¿dónde?") → la charla libre, y el modelo
 *     contestaba "Voy a buscar ofertas… un momento" sin poder buscar nada.
 *   · "Hola, soy un chaval de Murcia y estoy buscando curro en Italia de
 *     fontanero" → buscaba el puesto "soy un chaval de murcia y estoy
 *     buscando".
 *   · "Quiero saber cuántas ofertas tiene la app en Suiza" → el puesto
 *     "saber cuantas ofertas tiene la app", sin resultados,
 *     y respuesta "Basándome en tu CV (último puesto: …)".
 *
 * Aquí, un modelo pequeño y gratuito (Groq, gpt-oss-20b: su cupo es aparte del
 * de la conversación) lee el mensaje y devuelve qué quiere, el puesto, el
 * lugar y el país. Tarda medio segundo. Se usa SOLO cuando las reglas no
 * reconocen el mensaje o sacan un puesto que no lo parece, y se guarda la
 * respuesta un día. Si el modelo no contesta, sigue todo como antes.
 */
import { createHash } from "node:crypto";
import { extractJobTerm } from "@/lib/guzzi/intents";
import { limpiarTerminoBusqueda } from "@/lib/guzzi/paises-detect";

export type AccionEntendida = "buscar_ofertas" | "contar_ofertas" | "enviar_a_ofertas_mostradas" | "otra";
export interface Entendido {
  accion: AccionEntendida;
  puesto: string | null;
  lugar: string | null;
  /** ISO de 2 letras como lo guarda la base de datos ("uk" para Reino Unido). */
  pais: string | null;
}

const ACCIONES = new Set<AccionEntendida>(["buscar_ofertas", "contar_ofertas", "enviar_a_ofertas_mostradas", "otra"]);

const SISTEMA = `Eres el clasificador de BuscayCurra, un buscador de empleo. Lee el ÚLTIMO mensaje de la persona (con el contexto si lo hay) y devuelve SOLO un objeto JSON, sin texto alrededor:
{"accion":"buscar_ofertas"|"contar_ofertas"|"enviar_a_ofertas_mostradas"|"otra","puesto":string|null,"lugar":string|null,"pais":string|null}
- "buscar_ofertas": quiere ver ofertas de trabajo, aunque solo diga un puesto, un sector o un sitio.
- "contar_ofertas": pregunta cuántas ofertas hay (en un sitio o en la aplicación).
- "enviar_a_ofertas_mostradas": quiere mandar su CV a ofertas que ya se le enseñaron ("a todas", "la primera", "esa oferta", "mándales mi CV").
- "otra": cualquier otra cosa (su CV, una entrevista, papeles, cursos, au pair, dudas, saludos, quejas).
- Si el asistente acaba de preguntarle algo para su CV, una carta o una entrevista y el mensaje es la respuesta, es "otra". Si le acaba de preguntar qué puesto o dónde busca, es "buscar_ofertas" y el puesto o el lugar que falte sale del contexto.
- "puesto": el puesto o sector en español, corto y en singular ("camarero", "operario de logística", "limpieza"). Si viene en otro idioma o con faltas, en español correcto. Si no lo dice ni se deduce del contexto, null. No lo inventes.
- "lugar": la ciudad o zona tal como la escribiría un buscador ("Lisboa", "Zaragoza"), o null.
- "pais": código ISO de 2 letras en minúsculas del país de ese lugar ("es", "pt", "ch"...), o null si no hay lugar.`;

const texto = (v: unknown): string | null => {
  if (typeof v !== "string") return null;
  const t = v.replace(/[<>{}]/g, "").replace(/\s+/g, " ").trim();
  return t && t.length <= 60 && !/^(null|ninguno|n\/a)$/i.test(t) ? t : null;
};

/** Lee la respuesta del modelo. Nunca lanza: si no se entiende, null. */
export function parseEntendido(respuesta: string | null | undefined): Entendido | null {
  const m = (respuesta || "").match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    const j = JSON.parse(m[0]) as Record<string, unknown>;
    const accion = j.accion as AccionEntendida;
    if (!ACCIONES.has(accion)) return null;
    let pais = typeof j.pais === "string" ? j.pais.trim().toLowerCase() : null;
    if (pais === "gb") pais = "uk"; // en la base de datos Reino Unido es "uk"
    if (pais && !/^[a-z]{2}$/.test(pais)) pais = null;
    return { accion, puesto: texto(j.puesto), lugar: texto(j.lugar), pais };
  } catch {
    return null;
  }
}

/**
 * Palabras que nunca forman parte de un puesto. Si el puesto que sacan las
 * reglas lleva alguna, las reglas se han tragado la frase entera.
 */
const NO_ES_PUESTO = /\b(soy|eres|estoy|esta|estamos|buscando|buscar|busco|quiero|quisiera|necesito|saber|cuenta|cuantas|cuantos|aplicacion|app|hola|buenas|gracias|me|mi|mis|tu|te|que|he|has|ha|trabajado|encuentro|podrias|puedes|enviame|mandame|envia|manda|cv|curriculum|anuncios?|ver|todas|todos|primera|ultima|oferta|ofertas|esa|ese|esta|este|algo|donde|cual|como|porque|pero|y\s+tambien|vivo|digas|dime|ahora|estudie|diploma|grado|bachillerato|master|espana|convierte|pdf|descarga\w*)\b/;

/** ¿El puesto que han sacado las reglas parece de verdad un puesto? */
export function puestoDudoso(puesto: string | null | undefined): boolean {
  if (!puesto) return true;
  const p = puesto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  return p.split(/\s+/).length > 4 || NO_ES_PUESTO.test(p);
}

/** Mensajes cortos que no piden nada: no merece la pena preguntar al modelo. */
export function esCharlaCorta(mensaje: string): boolean {
  const t = mensaje.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[¡!¿?.,]/g, "").trim();
  return t.length < 2 || /^(ok|okey|vale|si|no|gracias|muchas gracias|hola|buenas|adios|perfecto|genial|de acuerdo|entendido|vale gracias|ok gracias|sim|obrigado|thanks|hello|hi)$/.test(t);
}

/**
 * ¿Pide mandar el CV a ofertas que Guzzi ya le ha enseñado? Solo cuenta si en
 * la conversación hay ofertas: "a todas" sin nada antes no se refiere a nada.
 * Antes "manda mi CV a todas" buscaba en Google Places una empresa llamada
 * "Todas" y devolvía un sitio de Rajastán (India).
 */
export function refiereAOfertasMostradas(mensaje: string, history: Array<{ role: string; text: string; jobs?: unknown[] }> = []): boolean {
  const t = mensaje.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  // Una lista de ofertas de verdad: las tarjetas (`jobs`) o el texto con que
  // las presenta Guzzi ("🔍 **5 ofertas** de…", "🥇"). La palabra "ofertas"
  // sola no vale: sale hasta en el saludo.
  const habiaOfertas = (history || []).slice(-6).some((m) => m.role !== "user"
    && ((Array.isArray(m.jobs) && m.jobs.length > 0) || /🥇|\*\*\d[\d.]* ofertas?\*\*/.test(m.text || "")));
  if (!habiaOfertas) return false;
  return /\ba\s+todas\b|\btodas\s+las\s+ofertas\b|\bla\s+(primera|segunda|tercera|cuarta|quinta|ultima)\b|\bla\s+\d{1,2}\b|\bla\s+(oferta\s+)?(numero|n[ºo°]\.?)\s*\d|\b(las|los)\s+(ofertas|trabajos|empleos)\s+que\s+me\s+(has|habias|diste|dijiste|mandaste|ensenaste|pasaste)|\bmandales\b|\benvialas\b|\bmandalas\b|\b(esa|esta)\s+oferta\b|^\s*postular\s*$/.test(t);
}

/** ¿Hay que preguntar al modelo qué quiere decir este mensaje? */
export function hayQueEntender(intent: string, mensaje: string): boolean {
  if (intent === "chat") return !esCharlaCorta(mensaje);
  if (intent === "buscar") return puestoDudoso(limpiarTerminoBusqueda(extractJobTerm(mensaje)));
  return false;
}

/** El modelo lee el mensaje. null si no contesta a tiempo o no se entiende lo que dice. */
export async function entenderMensaje(
  mensaje: string,
  history: Array<{ role: string; text: string }> = []
): Promise<Entendido | null> {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;
  // El contexto: lo último que dijo Guzzi, para entender "Valladolid" cuando
  // acaba de preguntar "¿en qué ciudad?".
  const ultimoDeGuzzi = [...(history || [])].reverse().find((m) => m.role !== "user")?.text || "";
  const contexto = ultimoDeGuzzi ? `Contexto (lo último que dijo el asistente):\n${ultimoDeGuzzi.slice(0, 400)}\n\n` : "";
  const entrada = `${contexto}Mensaje: ${mensaje.slice(0, 600)}`;

  const clave = "guzzi:entender:" + createHash("sha1").update(entrada).digest("hex");
  const { get: cacheGet, set: cacheSet } = await import("@/lib/cache/redis-client");
  const guardado = await cacheGet(clave).catch(() => null);
  if (guardado) {
    const e = parseEntendido(guardado);
    if (e) return e;
  }

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b",
        reasoning_effort: "low",
        temperature: 0,
        max_tokens: 400,
        messages: [{ role: "system", content: SISTEMA }, { role: "user", content: entrada }],
      }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      console.warn("[Guzzi/entender] HTTP", res.status);
      return null;
    }
    const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
    const crudo = data.choices?.[0]?.message?.content || "";
    const e = parseEntendido(crudo);
    if (e) await cacheSet(clave, JSON.stringify(e), 24 * 3600).catch(() => false);
    return e;
  } catch (err) {
    console.warn("[Guzzi/entender]", (err as Error).message);
    return null;
  }
}
