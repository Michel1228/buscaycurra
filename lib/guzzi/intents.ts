/**
 * lib/guzzi/intents.ts
 * 🔒 SELLO GUZZI detectIntent + extractJobTerm — BuscayCurra
 * NO TOCAR sin ejecutar tests: sello-verificacion.mjs bloques 1 y 2 (12 tests de regex)
 */
import { aceptaEnvioLocal } from "./envio-local";
import { propuestaCorreoPendiente, respuestaAPropuesta, pideEnviarACorreo } from "./envio-correo";

export function detectIntent(text: string, history: Array<{ role: string; text: string }> = []): string {
  const t = text.toLowerCase();
  const tn = t.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  // Mandar el CV a un negocio de la lista: solo si Guzzi lo acaba de proponer
  // y contesta que sí o elige uno. Antes un "vale" o un "ok gracias" con un 📍
  // en el historial mandaba el CV a una empresa que nadie había elegido.
  // Va la primera: es muy estricta y, si no, "mándalo a Delicias" se lo come info_empresa.
  if (aceptaEnvioLocal(text, history)) return "send_cv_local_confirm";

  // ENVIAR EL CV A UN CORREO (envio-correo.ts). Va antes que "carta de
  // presentación": "Mándame mi currículum y carta de presentación a
  // rrhh@sofidel.com" acababa pidiendo empresa y puesto para redactar una
  // carta, y el correo se ignoraba (4 oct 2026). Primero, la respuesta a una
  // propuesta recién hecha; después, pedirlo con el correo delante.
  {
    const propuesta = propuestaCorreoPendiente(history);
    if (propuesta) {
      const r = respuestaAPropuesta(text, propuesta);
      if (r?.tipo === "confirmar") return "enviar_correo_confirmar";
      if (r?.tipo === "cancelar") return "enviar_correo_cancelar";
      if (r?.tipo === "cambiar") return "enviar_correo";
    }
    if (pideEnviarACorreo(text)) return "enviar_correo";
  }

  // LO QUE CUENTA DESPUÉS DE "DIME QUÉ QUIERES PONER Y TE LO REDACTO".
  // Guzzi lo ofrecía y no había nada que lo redactara: la persona obedecía
  // ("carretillero en Logística Ribera, de 2022 a 2025...") y le buscaba
  // CURSOS de carretillero (auditoría del 3 oct 2026; le pasó a Michel el 1
  // oct). Si el último mensaje de Guzzi fue esa oferta y no cambia de tema ni
  // se despide, es el texto para su CV.
  {
    const ultimoDeGuzzi = [...(history || [])].reverse().find((m) => m.role !== "user")?.text || "";
    const ofrecioRedactar = /Abrir el editor de CV|D[ií]melo con tus palabras/.test(ultimoDeGuzzi)
      && [...(history || [])].slice(-2).some((m) => m.role !== "user");
    const cambiaDeTema = /\b(busco|buscar|buscame|ofertas?|vacantes?|quiero\s+trabajar|hola|cursos?|cuanto|salario|sueldo|precio|plan)\b/.test(tn);
    const seDespide = tn.trim().length < 30 && /^(vale|ok|okey|gracias|perfecto|genial|de\s+acuerdo|entendido|no\b|nada|listo|ya\s+esta)/.test(tn.trim());
    const pregunta = /\?|^(como|donde|que|cual|cuando|por\s*que|puedo|se\s+puede|y\s+(como|si|donde))\b/.test(tn.trim());
    if (ofrecioRedactar && !cambiaDeTema && !seDespide && !pregunta && tn.trim().length >= 8) return "redactar_cv";
  }

  // LA CUENTA (no el CV): borrar la cuenta o los datos, darse de baja, la
  // suscripción, la contraseña. "Borrar mis datos" (derecho RGPD) se mandaba al
  // editor del CV, y el resto iba al modelo, que no sabe cómo se hace aquí.
  if ((/(borra|elimina|cierra|cerrar|dar\s+de\s+baja|darme\s+de\s+baja)\w*\s+(?:toda\s+)?(?:mi|la|mis|los)?\s*(cuenta|datos)\b/.test(tn)
        && !/\b(cv|curriculum|curriculo)\b/.test(tn))
      || /\bbaja\s+de\s+(la\s+)?(app|aplicacion|buscaycurra|cuenta)\b/.test(tn)
      || /(cancela|cancelar|anula|anular|cambia|cambiar|bajar|subir|quitar)\w*\s+(?:mi\s+|la\s+|el\s+|de\s+)?(suscripcion|plan\b)/.test(tn)
      || /(cambia|cambiar|olvide|olvidado|recuperar|no\s+recuerdo|restablecer)\w*\s+(?:mi\s+|la\s+)?contrasena/.test(tn)) {
    return "cuenta";
  }
  if (/(mejorar|mejora|optimiz|reescrib).*(cv|curriculum)|(cv|curriculum).*(mejorar|mejorado|profesional|limpio)/.test(t)) return "cv_mejorado";
  // La de au pair va antes que la genérica: "carta para au pair en Alemania"
  // casaba con "carta para X" y Guzzi pedía "nombre de la empresa y puesto"
  // (auditoría del 3 oct 2026). También la familia de acogida.
  if (/(crea|genera|haz|escrib).*(carta|dear family).*(au pair|aupair)/i.test(t) || /carta.*(au.?pair|familia\s+de\s+acogida|host\s+family)/i.test(t) || /dear.?family/i.test(t)) return "carta_au_pair";
  if (/(carta.*(recomendaci|presentaci|para\s+\w)|presentaci.*carta)/.test(t)) return "carta_recomendacion";
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
    const hablaDelParo = /\b(paro|prestaci[oó]n(es)?|desempleo|subsidio)\b/i.test(t)
      || /\bu[12]\b/i.test(t);
    const hablaDeIrse = /(fuera|extranjero|otro\s+pa[ií]s|emigrar|irme|mudarme|me\s+voy|marcharme)/i.test(t)
      || /\b(alemania|francia|italia|portugal|b[eé]lgica|holanda|pa[ií]ses\s+bajos|suiza|austria|irlanda|reino\s+unido|noruega|suecia|dinamarca|finlandia|polonia)\b/i.test(t);
    const esDuda = /(pierdo|perder|puedo|mantener|seguir|llevar|export|c[oó]mo|qu[eé]\s+pasa|necesito|quiero|solicitar|tramitar|pedir|consigo)/i.test(t);
    // Nombrar el U1 o el U2 ya es decir lo que quieres: no hace falta que
    // ademas suene a pregunta. "Necesito el U2 para Holanda" se iba a la
    // busqueda de ofertas porque no llevaba ninguna palabra de duda.
    const nombraElFormulario = /\bu[12]\b/i.test(t);
    if (nombraElFormulario || (hablaDelParo && hablaDeIrse && esDuda)) {
      return "paro_europeo";
    }
  }

  // Los atajos del chat (14 oct 2026). "Quiero enviar mi CV automáticamente a
  // empresas" iba a la charla libre, que no sabía explicarlo, y "¿Cómo mejoro
  // mi foto de CV? Dame prompts para ChatGPT" a la pregunta del CV por países.
  if (/\b(enviar|mandar|envio|env[ií]e)\b.{0,25}\b(cv|curr[ií]culum|curriculum)\b.{0,15}\bautom[aá]tic|\benv[ií]o\s+autom[aá]tico\b/.test(tn)) {
    return "envio_auto_info";
  }
  if (/\bfoto\b/.test(tn) && /\b(prompts?|chatgpt|gemini)\b/.test(tn)) return "foto_prompts";

  // El CV según el país de destino: foto, extensión, datos personales.
  // "Quita mi foto del CV" o "subir foto al CV" no son esa pregunta: son
  // tocar el CV, y sin nombrar un país siguen hacia el editor o la foto.
  const cvConPais = /(cv|curr[ií]culum|curriculum).{0,50}(reino\s+unido|inglaterra|londres|alemania|estados\s+unidos|eeuu|holanda|pa[ií]ses\s+bajos|irlanda|suiza|austria)/i.test(t);
  const tocaLaFoto = /\b(quit|borr|elimin|cambi|actualiz|sub[eiao])\w*/.test(tn);
  if (cvConPais
      || (!tocaLaFoto && (/(foto|fotograf[ií]a).{0,30}(cv|curr[ií]culum|curriculum)/i.test(t)
        || /(cv|curr[ií]culum|curriculum).{0,30}(foto|fotograf[ií]a)/i.test(t)))) {
    return "cv_por_pais";
  }

  // PAPELES PARA TRABAJAR EN OTRO PAÍS. "¿Qué papeles necesito para trabajar en
  // Alemania?" caía en la regla genérica "algo EN algún sitio" y Guzzi buscaba
  // OFERTAS en Alemania (y no encontraba), en vez de contestar la pregunta.
  // Comprobado el 29 sep 2026. La respuesta sale de lib/primeros-pasos.ts, que
  // tiene los documentos con su enlace oficial, y no de la memoria del modelo:
  // el gratuito dijo en una prueba que el carné español de manipulador vale en
  // Alemania, y no vale.
  {
    // "¿Qué necesito para trabajar en Alemania de enfermera?" no nombra ningún
    // papel y acababa en una búsqueda de NEGOCIOS en "Alemania de enfermera"
    // (prueba de flujos del 10 oct 2026). Es la forma más común de preguntarlo.
    const hablaDePapeles = /(papeles|documentos?|documentaci[oó]n|visados?|\bvisa\b|permiso\s+de\s+(trabajo|residencia)|requisitos|tr[aá]mites?|\bnie\b|empadron|seguridad\s+social|homolog)/i.test(tn)
      || /qu[eé]\s+(necesito|necesitas|hace\s+falta|me\s+hace\s+falta|tengo\s+que\s+hacer|se\s+necesita)\s+para\s+(poder\s+)?(trabajar|irme|ir|vivir|emigrar|mudarme)/i.test(tn);
    const nombraPais = /\b(alemania|francia|italia|portugal|b[eé]lgica|holanda|pa[ií]ses\s+bajos|suiza|austria|irlanda|reino\s+unido|inglaterra|londres|noruega|suecia|dinamarca|finlandia|polonia|grecia|chequia|rep[uú]blica\s+checa|hungr[ií]a|ruman[ií]a|estados\s+unidos|eeuu|canad[aá]|australia|nueva\s+zelanda|jap[oó]n|singapur)\b/i.test(tn);
    if (hablaDePapeles && nombraPais) return "papeles_pais";
  }

  // ¿ME COMPENSA IR A TRABAJAR A OTRO SITIO? "¿Me compensa ir a trabajar a
  // Zaragoza desde Tudela?" acababa en charla y el modelo contestaba
  // vaguedades ("depende de varios factores"), cuando la aplicación SÍ sabe
  // calcularlo: kilómetros, minutos y gasóleo al mes con el precio oficial de
  // hoy (lib/guzzi/desplazamiento.ts). Hace falta hablar de coste o distancia Y
  // de un trayecto ("desde X", "de X a Y").
  {
    const hablaDeCoste = /(compensa|merece\s+la\s+pena|cu[aá]nto\s+(?:me\s+)?(?:cuesta|gasto|gastar[ií]a|sale|saldr[ií]a)|gasolina|gasoil|gas[oó]leo|kil[oó]metros|\bkms?\b|desplaz|ir\s+y\s+venir|a\s+diario|todos\s+los\s+d[ií]as)/i.test(tn);
    const hayTrayecto = /\bdesde\s+[a-z]{3,}/i.test(tn) || /\bde\s+[a-z]{3,}(?:\s+[a-z]{3,})?\s+(?:a|hasta)\s+[a-z]{3,}/i.test(tn);
    if (hablaDeCoste && hayTrayecto) return "desplazamiento";
  }

  // "Quiero echar el currículum en La Papelera de Buñuel", "dejar el CV en el
  // Mercadona". Es un envío a UNA empresa concreta; antes la regla genérica
  // "algo EN algún sitio" lo convertía en búsqueda de ofertas en Buñuel. Es
  // justo lo que le pasó a Michel el 22 sep 2026 y seguía pasando el 29.
  if (/(?:echar|echo|dejar|dejo|llevar|llevo|entregar|entrego|presentar|meter)\w*\s+(?:el\s+|mi\s+|un\s+)?(?:cv|curr[ií]culum|curriculum|curr[ií]culo)\s+(?:en|a|al|para)\s+[a-z0-9]/i.test(tn)) {
    return "info_empresa";
  }

  // Sin tildes y con "búscame/encuéntrame": "búscame la peluquería Enjoy
  // Estilistas" se tomaba por una búsqueda de ofertas de peluquería en toda
  // España (16 oct 2026).
  if (/(?:busca(?:me)?|busco|encuentra(?:me)?|localiza(?:me)?|info|informacion|hay|conoces|sabes)\s+(?:el\s+|la\s+|los\s+|las\s+|un\s+|una\s+)?(?:bar\s+|restaurante\s+|tienda\s+|hotel\s+|cafeteria\s+|empresa\s+|supermercado\s+|taller\s+|panaderia\s+|farmacia\s+|clinica\s+|peluqueria\s+|barberia\s+|gimnasio\s+|academia\s+|centro\s+de\s+estetica\s+|estetica\s+)/i.test(tn)) return "info_empresa";
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
  // EDITAR EL CV: cambiar, quitar o añadir datos del currículum.
  //
  // No existía, y estas frases se iban a cualquier otro sitio. "Cambiar mi
  // experiencia de carretillero" acababa en BUSCAR CURSOS —la regla de cursos
  // nombra los carnés, y "carretillero" es uno— y "quiero cambiar el puesto de
  // mi cv" en buscar ofertas, porque lleva "quiero" y "puesto". Michel lo contó
  // el 2 oct 2026: preguntó si podía editar su CV, Guzzi dijo que sí, y al
  // darle los datos se puso a hablar de ofertas de carretillero.
  //
  // Va aquí arriba a propósito: después de "echar el cv en <empresa>" y de
  // "manda mi cv a <empresa>", que son otra cosa, y antes de las reglas de
  // cursos y de búsqueda, que se lo tragaban.
  {
    // Con los pronombres pegados: "añádelo", "ponla", "bórrame", "rehaz". Antes
    // solo casaban los verbos sueltos y "tengo curso de carretillero, añádelo a
    // mi currículum" acababa buscando cursos (auditoría del 3 oct 2026).
    const quiereCambiar = /\b(edit[ao]\w*|modific\w*|cambi[ao]\w*|cambiar\w*|actualiz\w*|corrig\w*|corrij\w*|arregl\w*|quit[ao]\w*|quitar\w*|borr[ao]\w*|borrar\w*|elimin\w*|a[ñn]ad\w*|agreg\w*|pon(lo|la|los|las|le|me)?|pong[oa]\w*|poner\w*|rellen\w*|complet[ao]\w*|completar\w*|retoc\w*|rehacer\w*|rehaz\w*)\b/i.test(tn);
    const nombraElCv = /\b(cv|curriculum|curriculo)\b/i.test(tn);
    // Un apartado SUYO: hace falta porque, dentro de la conversación, la gente
    // ya no repite "cv" ("cambiar mi experiencia de carretillero").
    const nombraUnApartado = /\bmis?\s+(experiencias?|perfil|aptitudes|idiomas|formaci[oó]n|estudios|datos|tel[eé]fono|email|correo|foto|puesto|trabajos?)\b/i.test(tn);
    // "Cambiar DE trabajo" queda fuera: eso es querer otro empleo, no tocar el CV.
    const esCambiarDeTrabajo = /\bcambiar\s+de\s+(trabajo|empleo|curro|sector|aires)\b/i.test(tn);
    // Y la continuación: si acabamos de hablar de editar el CV, "sí, quiero
    // cambiar unos datos" también es esto aunque ya no nombre el currículum.
    const veniamosDelCv = /editor de CV|edita(r|s)?\s+(tu|mi|el)\s+(cv|curr[ií]culum)|\/app\/curriculum/i
      .test((history || []).slice(-3).map((m) => m.text || "").join(" "));
    if (quiereCambiar && !esCambiarDeTrabajo && (nombraElCv || nombraUnApartado || veniamosDelCv)) {
      return "editar_cv";
    }
  }

  // CURSOS — tiene que ir ANTES de las reglas de búsqueda de abajo ("busco X", "algo EN algún
  // sitio" → buscar), que si no se traga "curso de carretillero en Pamplona" y
  // se pone a buscar ofertas de empleo de carretillero en vez de formación.
  //
  // Los carnets cuentan cuando se quieren SACAR: la gente no dice "curso", dice
  // "necesito el de manipulador" o "me piden la carretilla".
  //
  // PERO NO POR LA SOLA PALABRA (auditoría del 3 oct 2026). Antes bastaba con
  // nombrar "carretillero", "carnet" o "manipulador": "ofertas de carretillero
  // en Pamplona", "cuánto cobra un carretillero", "soy carretillero" o "mi
  // carnet de conducir está caducado" acababan en cursos. Ahora hace falta
  // pedir formación, o querer sacar un carnet; y contar lo que uno ya es o ya
  // tiene ("soy...", "tengo el curso de...") no es pedir un curso.
  {
    const pideCurso = /(busco|buscar|busca|quiero|necesito|hay|donde|me\s+interesa|apuntarme|hacer|sacarme|sacar)\W+(?:\w+\W+){0,2}(cursos?|formacion|capacitacion)\b/.test(tn)
      || /\bformarme\b|certificad[oa]s?\s+de\s+profesionalidad|\btpc\b|tarjeta\s+profesional/.test(tn);
    const nombraCurso = /\b(cursos?|formacion|capacitacion)\b/.test(tn);
    const sacarCarnet = /(sacar(me)?|obtener|conseguir|necesito|me\s+piden|piden|donde|como)\W+(?:\w+\W+){0,3}(carnet|carretilla|manipulador|plataforma\s+elevadora)/.test(tn);
    const cuentaLoQueEs = /\b(soy|fui|he\s+sido|era|trabaje|trabajaba|he\s+trabajado|llevo\s+\d+|tengo\s+(?:el|un|los|mi)\s+(?:curso|carnet)|ya\s+(?:hice|tengo|saque)|hice\s+el\s+curso)\b/.test(tn);
    // "Busco trabajo de profesor de cursos de inglés" es buscar empleo, no formarse.
    const hablaDeEmpleo = /\b(trabajo|empleo|ofertas?|puesto|vacantes?|curro)\b/.test(tn);
    if (pideCurso || sacarCarnet || (nombraCurso && !cuentaLoQueEs && !hablaDeEmpleo)) return "buscar_cursos";
  }
  // Antes que las de buscar: "Quiero preparar una entrevista de trabajo" (otro
  // atajo del chat) lleva "quiero" y "trabajo", y se tomaba por una búsqueda.
  if (/(prep[aá]r|practicar|simul).*(entrevista)|entrevista.*(prep[aá]r|practica)/.test(t)) return "entrevista_prep";
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
  // Con artículo también: "vendimia en la Rioja", "trabajo en el Prat". Pedía
  // tres letras justo después de "en" y "la"/"el" tienen dos.
  // Y una palabra corta en medio: "camionero con carnet C en Zaragoza".
  if (/[\wáéíóúüñçàèìòù]{3,}(?:\s+[\wáéíóúüñçàèìòù]{1,2})?\s+(?:en|por)\s+(?:(?:la|el|los|las)\s+)?[\wáéíóúüñçàèìòù]{3,}/i.test(t) && !OTRO_TEMA.test(t)) return "buscar";
  if (/(?:env[ií]a|m[aá]nda|t[ií]ra)\s*(?:se\s*(?:lo|la|los|las|me|te|nos)|lo|la|los|las|le|les|me|te|nos)\b/i.test(t)) return "enviar";
  if (/foto|imagen\s+cv|foto.*cv/.test(t)) return "foto";
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
  // "echar/dejar/llevar el currículum EN la Papelera de Buñuel" también: es como
  // lo dice la gente cuando quiere trabajar en un sitio concreto.
  const m = text.match(
    /(?:env[ií]a\w*|m[aá]nda\w*|escrib\w*|contact\w*|echar|echo|dejar|dejo|llevar|llevo|entregar|entrego|presentar|meter)\s+(?:un\s+|el\s+|mi\s+)?(?:correo|email|e-mail|mail|cv|curr[ií]culum|curriculum|curr[ií]culo|candidatura)?\s*(?:a|al|con|para|en)\s+(?:la\s+|el\s+|los\s+|las\s+)?([A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9&'’.-]+(?:\s+[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9&'’.-]+){0,3})/i
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
