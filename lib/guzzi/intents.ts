/**
 * lib/guzzi/intents.ts
 * 🔒 SELLO GUZZI detectIntent + extractJobTerm — BuscayCurra
 * NO TOCAR sin ejecutar tests: sello-verificacion.mjs bloques 1 y 2 (12 tests de regex)
 */

export function detectIntent(text: string, history: Array<{ role: string; text: string }> = []): string {
  const t = text.toLowerCase();
  const tn = t.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (/(mejorar|mejora|optimizar|reescrib).*(cv|curriculum)|(cv|curriculum).*(mejorar|mejorado|profesional|limpio)/.test(t)) return "cv_mejorado";
  if (/(carta.*(recomendaci|presentaci|para\s+\w)|presentaci.*carta)/.test(t)) return "carta_recomendacion";
  if (/(crea|genera|haz|escrib).*(carta|dear family).*(au pair|aupair)/i.test(t) || /carta.*au.?pair/i.test(t) || /dear.?family/i.test(t)) return "carta_au_pair";
  if (/(busco|buscar|busca|necesito|quiero|buscame|búscame|encuentra|encuentrame).*(au pair|aupair|niñera|nanny|canguro|childcare)/i.test(tn)) return "buscar_au_pair";
  if (/(?:busca|busco|info|información|hay|conoces|sabes)\s+(?:el\s+|la\s+|los\s+|las\s+|un\s+|una\s+)?(?:bar\s+|restaurante\s+|tienda\s+|hotel\s+|cafeter[ií]a\s+|empresa\s+|supermercado\s+|taller\s+|panader[ií]a\s+|farmacia\s+|cl[ií]nica\s+|peluquer[ií]a\s+)/i.test(t)) return "info_empresa";
  if (/empresas?\s+(?:de|del?)\s+\w+/i.test(t) && /\s+(?:en|por|cerca)\s+\w+/i.test(t)) return "info_empresa";
  if (/(?:qué|que)\s+(?:empresas?|f[áa]bricas?|negocios?|comercios?|tiendas?)\s+(?:hay|conoces|sabes)\s+(?:en|por|cerca|de)\s+\w+/i.test(t)) return "info_empresa";
  if (/(?:peluquer[ií]a|barber[ií]a|restaurante|bar\b|hotel|cafeter[ií]a|cl[ií]nica|farmacia|panader[ií]a|tienda|taller|supermercado|sal[oó]n|est[eé]tica|gimnasio|lavander[ií]a|fruter[ií]a|carnicer[ií]a|pescader[ií]a)\b.{3,}/i.test(t) && /(?:calle|plaza|avenida|avda|paseo|crta|carretera|c\/)\s/i.test(t)) return "buscar";
  if (/(busco|buscar|necesito|quiero).*(trabajo|empleo|oferta|puesto)|(trabajo|empleo).*(busco|buscar|hay)|(?:^|\s)(busco|busca|me\s+interesa|estoy\s+buscando|necesito\s+trabajo\s+de|quiero\s+trabajar\s+de)\s+(?!que\b|lo\b|la\b|el\b|un\b|una\b)[a-záéíóúüñ]/.test(t)) return "buscar";
  if (/\w{3,}\s+(?:en|por)\s+\w{3,}/.test(t) && !/(carta|entrevista|mejorar|crear|subir|foto|ayuda|hola|gracias|adios|trabajado|trabaj[éeáa]|trabajaba|experiencia|no\s+puedo|cargar\s+peso|espalda|dolor|lesi[oó]n|baja\s+m[ée]dica|salario|sueldo|m[ií]nimo|smi|cu[aá]nto|cuesta|vale|cobra|gana|derecho|paro|sepe|finiquito|vacaciones|despido|indemnizaci[oó]n|mercado\s+laboral|situaci[oó]n\s+laboral|perspectivas\s+laborales|c[oó]mo\s+est[aá]|hay\s+trabajo|posibilidades|emigrar|emigraci[oó]n)/i.test(t)) return "buscar";
  const confirmSend = /^(si|s[ií]i|dale|vale|ok|okey|okay|venga|adelante|perfecto|genial|fenomenal|claro|por\s+supuesto|obvio|pues\s+si|pues\s+venga|hazlo|env[ií]alo|m[aá]ndalo|tira|t[ií]ralo|p[áa]lante|a\s+por\s+ello|me\s+gusta|me\s+apunto|elijo\s+la?\s*\d|la\s+primera|la\s+\d|la\s+opci[oó]n\s+\d|opci[oó]n\s+\d)/i;
  const histText = (history as unknown as Array<{ text: string }>).slice(-4).map((m) => m.text).join(" ");
  if (confirmSend.test(t.trim()) && /bar|restaurante|cafeter[ií]a|negocio\s+local|pequeñ[oa]|Google\s+Maps|plaza\s+nueva|bar\s+diamante|tel[eé]fono\s*\d|948|local\s+pequeñ|🏢|⭐|📍|📞/i.test(histText)) {
    return "send_cv_local_confirm";
  }
  if (/(?:env[ií]a|m[aá]nda|t[ií]ra)\s*(?:se\s*(?:lo|la|los|las|me|te|nos)|lo|la|los|las|le|les|me|te|nos)\b/i.test(t)) return "enviar";
  if (/foto|imagen\s+cv|foto.*cv/.test(t)) return "foto";
  if (/(prep[aá]r|practicar|simul).*(entrevista)|entrevista.*(prep[aá]r|practica)/.test(t)) return "entrevista_prep";
  if (/(crear|hacer|nuevo).*(cv|curriculum)/.test(t)) return "crear_cv";
  if (/(info|informacion|datos|busca|conoce|saber|dime).*(sobre\s+)?(la\s+)?empresa\s+\w|(qué|quien)\s+(es|conoces)\s+\w+\s*(empresa)?/.test(t)) return "info_empresa";
  return "chat";
}

export function extractJobTerm(text: string): string | null {
  const tn = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const patterns = [
    /(?:busco|buscar|necesito|quiero|buscame|búscame)\s+(?:trabajo\s+(?:de|como)\s+)?([\w\sáéíóúüñ]{3,30}?)(?:\s+(?:en|por|cerca|alrededor|zona)\s+|$)/i,
    /(?:busco|buscar|necesito|quiero)\s+(?:un|una)\s+([\w\sáéíóúüñ]{3,30}?)(?:\s+(?:en|por|cerca|alrededor|zona)\s+|$)/i,
    /(?:trabajo|empleo|oferta|puesto)\s+(?:de|como)\s+([\w\sáéíóúüñ]{3,30}?)(?:\s+(?:en|por|cerca)\s+|$)/i,
    /(?:^|\s)([a-záéíóúüñ]{3,20})\s+(?:en|por)\s+[a-záéíóúüñ]{3,}/i,
  ];
  for (const p of patterns) {
    const m = tn.match(p);
    if (m?.[1]) return m[1].trim();
  }
  return null;
}
