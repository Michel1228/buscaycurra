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

  // DERECHOS Y TRÁMITES — TAMBIÉN ANTES DE LA REGLA GENÉRICA.
  //
  // Probado contra Guzzi en producción: «estoy cobrando el paro y me quiero ir
  // a Alemania a buscar trabajo, ¿lo pierdo?» se clasificaba como búsqueda de
  // empleo y contestaba «¿qué puesto buscas?». Y «voy a mandar mi CV a una
  // empresa de Londres, ¿le pongo foto?» se clasificaba como búsqueda de
  // empresas y devolvía la ficha de una tienda de Covent Garden.
  //
  // O sea que las instrucciones del prompt sobre el formulario U2 y sobre la
  // foto en el CV no llegaban a usarse NUNCA en esas preguntas: el enrutador
  // contestaba antes de que el modelo las viera. Un prompt puede estar
  // perfecto y no servir de nada si la pregunta no llega hasta él.
  //
  // Las dos frases tienen la forma «algo EN algún sitio», que es justo lo que
  // captura la regla genérica de más abajo. Por eso van aquí arriba.

  // El paro que te llevas fuera: U2, U1, exportar la prestacion.
  //
  // SIN EXIGIR ORDEN. La primera version usaba "cobrar...{0,40}pais", que
  // obliga a que las palabras aparezcan en ese orden y a poca distancia. La
  // frase real que fallo en produccion era "estoy cobrando el paro y me
  // quiero ir a Alemania a buscar trabajo, lo pierdo?": ahi "paro" va antes
  // que "Alemania" y "pierdo" va al final, asi que no casaba ninguna.
  //
  // Ahora son dos condiciones independientes: habla de prestacion Y habla de
  // irse fuera. La gente no ordena las frases como uno espera.
  {
    const hablaDelParo = /(paro|prestaci[oó]n(es)?|desempleo|subsidio)/i.test(t)
      || /u[12]/i.test(t);
    const hablaDeIrse = /(fuera|extranjero|otro\s+pa[ií]s|emigrar|irme|mudarme|me\s+voy|marcharme)/i.test(t)
      || /(alemania|francia|italia|portugal|b[eé]lgica|holanda|pa[ií]ses\s+bajos|suiza|austria|irlanda|reino\s+unido|noruega|suecia|dinamarca|finlandia|polonia)/i.test(t);
    const esDuda = /(pierdo|perder|puedo|mantener|seguir|llevar|export|c[oó]mo|qu[eé]\s+pasa)/i.test(t);
    if (hablaDelParo && (hablaDeIrse || /u[12]/i.test(t)) && esDuda) {
      return "paro_europeo";
    }
  }

  // El CV según el país de destino: foto, extensión, datos personales.
  if (/(foto|fotograf[ií]a).{0,30}(cv|curr[ií]culum|curriculum)/i.test(t)
      || /(cv|curr[ií]culum|curriculum).{0,30}(foto|fotograf[ií]a)/i.test(t)
      || /(cv|curr[ií]culum|curriculum).{0,50}(reino\s+unido|inglaterra|londres|alemania|estados\s+unidos|eeuu|holanda|pa[ií]ses\s+bajos|irlanda|suiza|austria)/i.test(t)) {
    return "cv_por_pais";
  }

  if (/(?:busca|busco|info|información|hay|conoces|sabes)\s+(?:el\s+|la\s+|los\s+|las\s+|un\s+|una\s+)?(?:bar\s+|restaurante\s+|tienda\s+|hotel\s+|cafeter[ií]a\s+|empresa\s+|supermercado\s+|taller\s+|panader[ií]a\s+|farmacia\s+|cl[ií]nica\s+|peluquer[ií]a\s+)/i.test(t)) return "info_empresa";
  if (/empresas?\s+(?:de|del?)\s+\w+/i.test(t) && /\s+(?:en|por|cerca)\s+\w+/i.test(t)) return "info_empresa";
  if (/(?:qué|que)\s+(?:empresas?|f[áa]bricas?|negocios?|comercios?|tiendas?)\s+(?:hay|conoces|sabes)\s+(?:en|por|cerca|de)\s+\w+/i.test(t)) return "info_empresa";
  // "manda un correo al Mercadona de la calle X" / "contacta con Bar Pepe" /
  // "escribe a Leroy Merlin de Tudela". Antes esto caía en "chat" y Guzzi
  // contestaba sin buscar nada: el usuario pedía el email de UNA empresa
  // concreta y no recibía ni los datos ni la opción de enviar el CV.
  // Va ANTES de las reglas de "buscar" (que se lo comían cuando la frase
  // llevaba calle o tipo de negocio) y antes de "enviar", que exige pronombre
  // (mándalo/envíaselo) y no cubre "manda un correo A <empresa>".
  if (/(?:env[ií]a|m[aá]nda|escrib|contact|manda)\w*\s+(?:un\s+|el\s+|mi\s+)?(?:correo|email|e-mail|mail|cv|curr[ií]culum|candidatura)?\s*(?:a|al|con|para)\s+[a-záéíóúüñ0-9]/i.test(tn)) {
    return "info_empresa";
  }
  if (/(?:peluquer[ií]a|barber[ií]a|restaurante|bar\b|hotel|cafeter[ií]a|cl[ií]nica|farmacia|panader[ií]a|tienda|taller|supermercado|sal[oó]n|est[eé]tica|gimnasio|lavander[ií]a|fruter[ií]a|carnicer[ií]a|pescader[ií]a)\b.{3,}/i.test(t) && /(?:calle|plaza|avenida|avda|paseo|crta|carretera|c\/)\s/i.test(t)) return "buscar";
  if (/(busco|buscar|necesito|quiero).*(trabajo|empleo|oferta|puesto)|(trabajo|empleo).*(busco|buscar|hay)|(?:^|\s)(busco|busca|me\s+interesa|estoy\s+buscando|necesito\s+trabajo\s+de|quiero\s+trabajar\s+de)\s+(?!que\b|lo\b|la\b|el\b|un\b|una\b)[a-záéíóúüñ]/.test(t)) return "buscar";
  // "algo EN algún sitio" es una búsqueda, salvo que la frase sea de otro tema.
  //
  // OJO CON LOS LÍMITES DE PALABRA en las exclusiones. Sin ellos, un país se
  // colaba dentro de otra palabra y la frase se iba a charla:
  //   "ofertas en HOLAnda"      -> "hola"        -> lo tomaba por un saludo
  //   "quiero TRABAJAr en ..."  -> "trabaj[éeáa]" -> lo tomaba por experiencia pasada
  // Caso real: un cliente pidió ofertas en Holanda y Guzzi se puso a charlar en
  // vez de buscar, y acabó mencionando sitios de España. Las exclusiones que son
  // palabras sueltas cortas llevan \b; las de varias palabras no lo necesitan.
  const OTRO_TEMA = new RegExp(
    "(\\bcarta\\b|\\bentrevista\\b|\\bmejorar\\b|\\bcrear\\b|\\bsubir\\b|\\bfoto\\b|\\bayuda\\b" +
    "|\\bhola\\b|\\bgracias\\b|\\badios\\b|\\btrabajado\\b|\\btrabaj[éeáa]\\b|\\btrabajaba\\b" +
    "|\\bexperiencia\\b|no\\s+puedo|cargar\\s+peso|\\bespalda\\b|\\bdolor\\b|\\blesi[oó]n\\b" +
    "|baja\\s+m[ée]dica|\\bsalario\\b|\\bsueldo\\b|\\bm[ií]nimo\\b|\\bsmi\\b|\\bcu[aá]nto\\b" +
    "|\\bcuesta\\b|\\bvale\\b|\\bcobra\\b|\\bgana\\b|\\bderecho\\b|\\bparo\\b|\\bsepe\\b" +
    "|\\bfiniquito\\b|\\bvacaciones\\b|\\bdespido\\b|\\bindemnizaci[oó]n\\b|mercado\\s+laboral" +
    "|situaci[oó]n\\s+laboral|perspectivas\\s+laborales|c[oó]mo\\s+est[aá]" +
    "|\\bposibilidades\\b|\\bemigrar\\b|\\bemigraci[oó]n\\b)",
    "i"
  );
  // OJO CON LA Ñ Y LOS ACENTOS: en JavaScript, \w es solo [A-Za-z0-9_], así
  // que "albañil en Manchester" NO casaba aquí — de "albañil" solo quedaba
  // "il" pegado al " en ", y hacen falta tres letras. La frase se tomaba por
  // charla y Guzzi contestaba con la IA en vez de buscar, teniendo 53
  // albañiles en Manchester. Igual habría pasado con "diseño" o "logística".
  // CURSOS — tiene que ir ANTES de la regla genérica de abajo ("algo EN algún
  // sitio" → buscar), que si no se traga "curso de carretillero en Pamplona" y
  // se pone a buscar ofertas de empleo de carretillero en vez de formación.
  //
  // Se nombran también los carnets concretos porque la gente no dice "curso":
  // dice "necesito el de manipulador" o "me piden la carretilla".
  if (/\bcursos?\b|\bformaci[oó]n\b|\bformarme\b|\bcapacitaci[oó]n\b|\bcarn[eé]ts?\b/i.test(t)
      || /manipulador\s+de\s+aliment|\bcarretiller[oa]s?\b|carretilla\s+elevadora|plataforma\s+elevadora/i.test(t)
      || /certificad[oa]s?\s+de\s+profesionalidad|\btpc\b|tarjeta\s+profesional/i.test(t)) {
    return "buscar_cursos";
  }
  if (/[\wáéíóúüñçàèìòù]{3,}\s+(?:en|por)\s+[\wáéíóúüñçàèìòù]{3,}/i.test(t) && !OTRO_TEMA.test(t)) return "buscar";
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

/**
 * Extrae la calle/dirección del mensaje ("en la calle Yanguas y Miranda",
 * "avenida de Zaragoza 12"). Sin esto, buscar "Mercadona Tudela" en Places
 * devolvía CUALQUIERA de los Mercadonas de la ciudad, no el que pedía el
 * usuario. Añadirla a la query desambigua el local exacto.
 */
export function extractAddress(text: string): string | null {
  const m = text.match(
    /\b(?:calle|c\/|avenida|avda\.?|av\.|plaza|pza\.?|paseo|carretera|crta\.?|ctra\.?|ronda|camino|travesia|traves[ií]a)\s+(?:de\s+(?:la\s+|los\s+|las\s+)?)?([\wáéíóúüñ'’.-]+(?:\s+[\wáéíóúüñ'’.-]+){0,4})/i
  );
  if (!m?.[1]) return null;
  // Cortar en conectores que ya no forman parte del nombre de la vía.
  const via = m[0].split(/\s+(?:de\s+)?(?:tudela|pamplona)\b|\s+para\b|\s+y\s+mand|\s+y\s+env/i)[0];
  const limpio = via.replace(/\s+/g, " ").trim();
  return limpio.length >= 6 && limpio.length <= 80 ? limpio : null;
}

/**
 * Nombre de empresa cuando el usuario pide contactarla:
 * "manda un correo al Mercadona de la calle X" → "Mercadona".
 * Complementa a extractCompanyName() de chat/route.ts, que está pensado para
 * frases tipo "info sobre la empresa X" y no cubre estos verbos.
 */
export function extractCompanyFromContact(text: string): string | null {
  const m = text.match(
    /(?:env[ií]a\w*|m[aá]nda\w*|escrib\w*|contact\w*)\s+(?:un\s+|el\s+|mi\s+)?(?:correo|email|e-mail|mail|cv|curr[ií]culum|candidatura)?\s*(?:a|al|con|para)\s+(?:la\s+|el\s+|los\s+|las\s+)?([A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9&'’.-]+(?:\s+[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9&'’.-]+){0,3})/i
  );
  if (!m?.[1]) return null;
  let nombre = m[1].trim();
  // Quitar adjetivos previos ("el nuevo Mercadona" → "Mercadona").
  nombre = nombre.replace(/^(?:nuevo|nueva|nuevos|nuevas)\s+/i, "");
  // Cortar en la coletilla de ubicación: "Mercadona de la calle X" → "Mercadona",
  // "Bar Pepe en la avenida Y" → "Bar Pepe".
  nombre = nombre.replace(
    /\s+(?:de|en|del)\s+(?:la\s+|el\s+|los\s+|las\s+)?(?:calle|c\/|avenida|avda|av|plaza|pza|paseo|carretera|crta|ctra|ronda|camino|travesia|traves[ií]a).*$/i,
    ""
  );
  // "Peluqueria Marisa calle Mayor 5" → sin conector, cortar igualmente.
  nombre = nombre.replace(
    /\s+(?:calle|c\/|avenida|avda|av|plaza|pza|paseo|carretera|crta|ctra|ronda|camino)\b.*$/i,
    ""
  );
  nombre = nombre.replace(/\s+(?:de|en)\s+(?:tudela|pamplona|madrid|barcelona|zaragoza|sevilla|valencia|bilbao|malaga|m[áa]laga)\b.*$/i, "");
  // Restos de conectores sueltos al final ("Bar Pepe en la" → "Bar Pepe").
  // Se repite hasta 3 veces porque pueden encadenarse ("... en la").
  for (let i = 0; i < 3; i++) {
    nombre = nombre.replace(/\s+(?:de|en|del|con|para|la|el|los|las|un|una)$/i, "").trim();
  }
  // Descartar palabras vacías que no son un negocio.
  if (/^(?:ellos|ellas|esa|ese|esta|este|eso|alguien|nadie|ver|saber)$/i.test(nombre)) return null;
  return nombre.length >= 3 && nombre.length <= 60 ? nombre : null;
}

export function extractJobTerm(text: string): string | null {
  const tn = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const patterns = [
    // El rodeo con el que habla la gente de verdad: "quiero trabajar DE
    // camarero", "busco empleos DE limpieza", "quiero currar DE cocinero".
    // Con solo "trabajo de" se colaba el verbo dentro del puesto y se buscaba
    // "trabajar de camarero", que no existe en ningún título de oferta.
    // El conector es "de|como" a propósito: con "en" se tragaría la ciudad
    // ("quiero trabajar en Madrid" daría el puesto "madrid").
    /(?:busco|buscar|necesito|quiero|buscame|búscame)\s+(?:(?:trabajos?|trabajar|currar|curro|empleos?|ofertas?|puestos?|vacantes?)\s+(?:de|como)\s+)?([\w\sáéíóúüñ]{3,30}?)(?:\s+(?:en|por|cerca|alrededor|zona)\s+|$)/i,
    /(?:busco|buscar|necesito|quiero)\s+(?:un|una)\s+([\w\sáéíóúüñ]{3,30}?)(?:\s+(?:en|por|cerca|alrededor|zona)\s+|$)/i,
    // El plural importa: con "oferta" a secas, "ofertas de albañil en
    // Manchester" no casaba aquí, caía en el patrón genérico de abajo y se
    // buscaba el puesto "ofertas de albanil" — cero resultados teniendo 53
    // albañiles en Manchester.
    /(?:trabajos?|empleos?|ofertas?|puestos?|vacantes?)\s+(?:de|como|para)\s+([\w\sáéíóúüñ]{3,30}?)(?:\s+(?:en|por|cerca)\s+|$)/i,
    /(?:^|\s)([a-záéíóúüñ][\sa-záéíóúüñ]+?)\s+(?:en|por)\s+[a-záéíóúüñ]{3,}/i,
  ];
  for (const p of patterns) {
    const m = tn.match(p);
    if (m?.[1]) return m[1].trim();
  }
  return null;
}
