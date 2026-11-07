/**
 * lib/job-search/sinonimos-puesto.ts — El mismo puesto en varios idiomas.
 *
 * POR QUÉ EXISTE: buscar "camarero en París" no devolvía ni un camarero. No es
 * que no haya: es que en Francia las ofertas dicen "serveur", en Alemania
 * "kellner" y en Irlanda "waiter". La búsqueda literal por la palabra española
 * no encuentra nada fuera de España.
 *
 * Antes eso caía en un respaldo que devolvía CUALQUIER oferta de la ciudad
 * (ingenieros, DevOps, recursos humanos...), que es peor que no devolver nada:
 * el usuario pierde la confianza en el buscador.
 *
 * Se cubren los oficios que de verdad busca nuestro público —hostelería,
 * cuidados, limpieza, construcción, transporte— en los idiomas de los países
 * con más ofertas. No pretende ser un diccionario completo.
 *
 * MÉXICO Y BRASIL (nov 2026). El español de México no es el de aquí: allí el
 * camarero es "mesero", el fontanero "plomero" y el peón "ayudante general".
 * Sin esas palabras, un español que buscaba camarero en México no veía las 304
 * ofertas de mesero, y un mexicano que buscaba "mesero" no veía las de España.
 * Lo de Brasil va en portugués de allí ("garçom", "encanador", "faxineira"),
 * que tampoco es el de Portugal. Las palabras salen de los títulos reales de
 * 600 ofertas de cada país mirados el 5 nov 2026.
 *
 * COLOMBIA Y CHILE (5 nov 2026, 800 títulos de Careerjet de cada país): la
 * limpieza es "aseo", el almacén "bodega", el camarero chileno "garzón" y el
 * repartidor "mensajero"; en Perú, el almacén es del "almacenero". Solo entran palabras que en España no signifiquen
 * otra cosa: "mozo" (camarero en Perú y Argentina) es aquí el mozo de almacén,
 * y "domiciliario" (repartidor en Colombia) sale en "enfermero domiciliario".
 *
 * ESLOVAQUIA, ESLOVENIA Y CHIPRE (6 nov 2026). Sus ofertas vienen de EURES en
 * su idioma: Chipre casi todo en griego, Eslovaquia en eslovaco y Eslovenia en
 * esloveno. Van las palabras enteras (masculino, femenino y, en griego, el
 * plural), porque la búsqueda es por palabra completa. El griego le sirve
 * también a Grecia, que no tenía ninguna. En Eslovaquia los títulos llevan el
 * nombre de la ocupación en plural ("Kuchári", "Čašníci", "Vodiči"): por eso
 * van también esos plurales, y "kuchár" encuentra "Kuchári".
 * Fuera a propósito: "sestra" suelta (en eslovaco es también "hermana"),
 * "receptor" (en inglés sale en títulos de farmacia), "referent" (en alemán es
 * otro puesto) y "μηχανικός" suelto (en griego es "ingeniero").
 */

/** Puesto en español -> cómo se dice en las ofertas de otros países. */
const SINONIMOS: Record<string, string[]> = {
  // ── Hostelería ──────────────────────────────────────────────────────
  camarero: ["waiter", "waitress", "serveur", "serveuse", "kellner", "cameriere",
             "empregado de mesa", "ober", "servitor", "bartender", "barista", "barman",
             "wait staff", "food service", "runner", "bar staff",
             "servitør", "servitör", "tarjoilija",
             "mesero", "mesera", "garçom", "garçonete", "garzón", "garzona",
             "čašník", "čašníčka", "čašníci", "barmanka",
             "natakar", "natakarica",
             "σερβιτόρος", "σερβιτόρα", "σερβιτόροι"],
  // OJO: "chef" a secas NO vale. En francés "chef de projet" o "chef de
  // produit" son jefes de proyecto, no cocineros: en París había 2.263 así.
  cocinero: ["cook", "cuisinier", "koch", "cuoco", "cozinheiro", "kok", "kokk",
             "commis", "chef de partie", "chef de cuisine", "sous chef", "head chef",
             "line cook", "chefkoch", "cuisine",
             "cozinheira", "cocinera",
             "kuchár", "kuchárka", "kuchári",
             "kuhar", "kuharica",
             "μάγειρας", "μάγειρες"],
  ayudante_cocina: ["kitchen assistant", "kitchen porter", "commis de cuisine",
                    "küchenhilfe", "aiuto cuoco", "dishwasher", "plongeur",
             "auxiliar de cozinha", "ayudante de cocina", "auxiliar de cocina",
             "pomocná sila v kuchyni", "pomocný kuchár", "pomocná kuchárka",
             "pomočnik kuharja", "pomočnica kuharja", "pomočnik v kuhinji",
             "βοηθός μάγειρα", "βοηθός κουζίνας", "λαντζιέρης", "λαντζιέρα"],
  recepcionista: ["receptionist", "réceptionniste", "rezeptionist", "receptionista",
                  "front desk", "front office",
             "recepčný", "recepčná",
             "receptorka",
             "υπάλληλος υποδοχής", "ρεσεψιονίστ"],

  // ── Limpieza ────────────────────────────────────────────────────────
  limpieza: ["cleaner", "cleaning", "nettoyage", "agent d'entretien", "reinigung",
             "reinigungskraft", "pulizia", "limpeza", "schoonmaak", "housekeeping",
             "housekeeper", "femme de ménage", "room attendant",
             "intendencia", "auxiliar de limpieza", "faxineira", "faxineiro", "auxiliar de limpeza", "diarista",
             "auxiliar de aseo", "operario de aseo",
             "upratovačka", "upratovačky", "upratovač", "upratovanie",
             "čistilka", "čistilec", "čiščenje",
             "καθαρίστρια", "καθαρίστριες", "καθαριστής", "καθαριότητας"],
  camarera_piso: ["room attendant", "housekeeping", "femme de chambre",
                  "zimmermädchen", "cameriera ai piani",
             "recamarista", "camareira",
             "chyžná",
             "sobarica",
             "καμαριέρα", "καμαριέρες"],

  // ── Cuidados ────────────────────────────────────────────────────────
  cuidador: ["caregiver", "carer", "care assistant", "aide soignant", "auxiliaire de vie",
             "pflegehelfer", "altenpfleger", "badante", "cuidador", "support worker",
             "healthcare assistant", "personal care",
             "cuidador de idosos", "cuidadora de idosos", "cuidadora",
             "opatrovateľ", "opatrovateľka",
             "negovalec", "negovalka", "oskrbovalka",
             "φροντιστής", "φροντίστρια"],
  enfermera: ["nurse", "infirmier", "infirmière", "krankenschwester", "krankenpfleger",
              "pflegefachkraft", "infermiere", "enfermeiro", "verpleegkundige",
              "registered nurse", "staff nurse",
              // Nórdicos: en Oslo había 882 "sykepleier" que no se encontraban
              "sykepleier", "sjuksköterska", "sygeplejerske", "sairaanhoitaja",
             "enfermeira", "técnico de enfermagem", "técnica de enfermagem",
             "zdravotná sestra", "zdravotný brat",
             "medicinska sestra", "zdravstveni tehnik",
             "νοσηλευτής", "νοσηλεύτρια", "νοσοκόμος", "νοσοκόμα"],
  ninera: ["niñera", "nanny", "babysitter", "au pair", "nounou", "kindermädchen",
           "tata", "childminder", "childcare", "barnepike",
             "nana", "babá",
             "pestúnka",
             "varuška",
             "νταντά"],

  // ── Construcción e industria ────────────────────────────────────────
  // La clave va sin ñ, pero en la base de datos pone "Albañil": se incluyen
  // las dos formas o la búsqueda da cero (95 ofertas invisibles).
  // "builder" se quita: casaba con "Product Builder" y "AI Builder".
  albanil: ["albañil", "bricklayer", "mason", "maçon", "maurer", "muratore",
            "construction worker", "obrero construccion", "peon de obra", "murer",
             "pedreiro", "servente de obras", "servente de pedreiro",
             "murár",
             "zidar", "gradbeni delavec",
             "οικοδόμος", "χτίστης", "κτίστης"],
  electricista: ["electrician", "électricien", "elektriker", "elettricista", "eletricista",
             "elektrikár", "elektromontér",
             "električar", "elektroinštalater",
             "ηλεκτρολόγος"],
  fontanero: ["plumber", "plombier", "klempner", "installateur", "idraulico", "canalizador",
             "plomero", "encanador",
             "inštalatér",
             "inštalater",
             "υδραυλικός"],
  soldador: ["welder", "soudeur", "schweisser", "schweißer", "saldatore", "soldador",
             "zvárač",
             "varilec",
             "συγκολλητής", "ηλεκτροσυγκολλητής"],
  carpintero: ["carpenter", "menuisier", "tischler", "schreiner", "falegname", "joiner",
             "carpinteiro", "marceneiro",
             "stolár", "tesár",
             "mizar", "tesar",
             "ξυλουργός", "μαραγκός"],
  pintor: ["painter", "peintre", "maler", "imbianchino", "decorator",
             "maliar",
             "pleskar",
             "ελαιοχρωματιστής", "μπογιατζής"],
  operario: ["operator", "production worker", "opérateur", "produktionsmitarbeiter",
             "operaio", "factory worker", "machine operator", "assembler",
             "ayudante general", "auxiliar de produção", "operador de produção", "operário",
             "operátor", "operátori", "operátor výroby", "robotník",
             "proizvodni delavec", "delavec v proizvodnji",
             "εργάτης", "εργάτρια", "εργάτες", "χειριστής μηχανημάτων"],
  mecanico: ["mechanic", "mécanicien", "mechaniker", "meccanico", "technician",
             "mecânico",
             "mechanik", "automechanik",
             "mehanik", "avtomehanik",
             "μηχανικός αυτοκινήτων", "μηχανοτεχνίτης"],

  // ── Transporte y almacén ────────────────────────────────────────────
  conductor: ["driver", "chauffeur", "fahrer", "autista", "motorista", "hgv driver",
              "lkw fahrer", "lkw-fahrer", "delivery driver", "truck driver", "van driver",
              "sjåfør", "chaufför", "chauffør", "kuljettaja",
             "chofer", "chófer", "motorista de caminhão",
             "vodič", "vodiči", "šofér",
             "voznik", "šofer",
             "οδηγός", "οδηγοί"],
  repartidor: ["delivery", "courier", "livreur", "zusteller", "corriere", "rider",
             "entregador", "motoboy", "mensajero", "mensajera",
             "kuriér", "doručovateľ",
             "dostavljavec", "kurir",
             "διανομέας", "διανομείς", "κούριερ"],
  almacen: ["warehouse", "warehouse operative", "magasinier", "lagerarbeiter",
            "magazziniere", "picker", "packer", "forklift",
             "almacenista", "auxiliar de almacén", "estoquista", "almoxarife", "auxiliar de almoxarifado", "conferente",
             "auxiliar de bodega", "almacenero",
             "skladník", "skladníčka", "vodič vzv",
             "skladiščnik", "skladiščnica", "viličarist",
             "αποθηκάριος", "χειριστής κλαρκ"],

  // ── Comercio y oficina ──────────────────────────────────────────────
  dependiente: ["shop assistant", "retail assistant", "sales assistant", "vendeur",
                "verkäufer", "commesso", "store associate", "cashier",
             "vendedor de piso", "atendente de loja", "vendedor", "vendedora",
             "predavač", "predavačka",
             "prodajalec", "prodajalka",
             "πωλητής", "πωλήτρια", "πωλητές"],
  cajero: ["cashier", "caissier", "kassierer", "cassiere", "checkout",
             "operador de caixa", "operadora de caixa",
             "pokladník", "pokladníčka",
             "blagajnik", "blagajničarka",
             "ταμίας"],
  administrativo: ["administrative assistant", "administrator", "office assistant",
                   "assistant administratif", "sachbearbeiter", "impiegato",
             "auxiliar administrativo", "auxiliar administrativa", "assistente administrativo", "assistente administrativa",
             "administratívny pracovník", "administratívna pracovníčka",
             "administratorka",
             "υπάλληλος γραφείου", "διοικητικός υπάλληλος", "γραμματέας"],
  seguridad: ["security guard", "agent de sécurité", "sicherheitsmitarbeiter",
              "guardia giurata", "doorman",
             "guardia de seguridad", "vigilante", "porteiro",
             "strážnik", "pracovník sbs",
             "varnostnik", "varnostnica",
             "φύλακας", "φύλακες"],

  // ── Otros frecuentes ────────────────────────────────────────────────
  jardinero: ["gardener", "jardinier", "gärtner", "giardiniere", "landscaper",
             "jardineiro",
             "záhradník",
             "vrtnar",
             "κηπουρός"],
  peluquero: ["hairdresser", "coiffeur", "friseur", "parrucchiere", "barber",
             "estilista", "cabeleireiro", "cabeleireira", "barbeiro",
             "kaderník", "kaderníčka",
             "frizer", "frizerka",
             "κομμωτής", "κομμώτρια"],
  profesor: ["teacher", "professeur", "lehrer", "insegnante", "tutor", "instructor",
             "professora",
             "učiteľ", "učiteľka",
             "učitelj", "učiteljica",
             "καθηγητής", "καθηγήτρια", "δάσκαλος", "δασκάλα"],
  programador: ["developer", "software engineer", "programmer", "développeur",
                "entwickler", "sviluppatore",
             "desenvolvedor", "desenvolvedora",
             "programátor",
             "programer", "razvijalec",
             "προγραμματιστής"],
};

/** Quita acentos y pasa a minúsculas, para comparar sin sorpresas. */
function normalizar(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
}

/**
 * Devuelve el término buscado MÁS sus equivalentes en otros idiomas.
 *
 * Siempre incluye lo que escribió el usuario en primer lugar: si busca
 * "waiter" directamente, eso es lo que más le importa.
 */

/** Añade un término en sus dos formas: tal cual y sin acentos. */
function anadirAmbas(destino: Set<string>, valor: string): void {
  const original = valor.toLowerCase().trim();
  if (!original) return;
  destino.add(original);
  const sinAcentos = normalizar(valor);
  if (sinAcentos && sinAcentos !== original) destino.add(sinAcentos);
}

export function expandirPuesto(termino: string): string[] {
  const t = normalizar(termino);
  if (!t) return [];

  // Se devuelven las DOS formas: con acentos y sin ellos.
  //
  // Solo con la normalizada, "albañil" se convertía en "albanil" y la búsqueda
  // daba CERO, porque en la base de datos pone "Albañil" con ñ. Verificado:
  // 95 ofertas con ñ, 0 sin ella. Lo mismo con "niñera" (327 invisibles).
  // Lo natural sería normalizar también la columna con translate(), pero eso
  // impide usar el índice trigram; añadir la variante al término lo conserva.
  const resultado = new Set<string>([t]);
  const original = termino.toLowerCase().trim();
  if (original && original !== t) resultado.add(original);

  for (const [clave, traducciones] of Object.entries(SINONIMOS)) {
    const claveNorm = clave.replace(/_/g, " ");
    // Coincide con la clave en español ("camarero", "camarera piso")
    const coincideClave = t === claveNorm || t.includes(claveNorm) || claveNorm.includes(t);
    // O el usuario ya escribió una de las traducciones ("waiter")
    const coincideTraduccion = traducciones.some(v => normalizar(v) === t);

    if (coincideClave || coincideTraduccion) {
      resultado.add(claveNorm);
      for (const v of traducciones) anadirAmbas(resultado, v);
    }
  }

  // Femenino/masculino y plurales del español: "camarera" -> "camarero".
  //
  // Se comprueba SIEMPRE, no solo cuando no hubo coincidencias. "camarera"
  // encajaba con la clave "camarera_piso" y se quedaba ahí, sin llegar nunca a
  // "camarero" — así que buscar "camarera" no devolvía ni un "waiter".
  const variantes = [
    t.replace(/a$/, "o"), t.replace(/o$/, "a"),
    t.replace(/as$/, "o"), t.replace(/os$/, "o"),
    t.replace(/es$/, ""), t.replace(/s$/, ""),
  ];
  for (const v of variantes) {
    if (v === t || v.length < 4) continue;
    const traducciones = SINONIMOS[v];
    if (traducciones) {
      resultado.add(v);
      for (const tr of traducciones) anadirAmbas(resultado, tr);
    }
  }

  return [...resultado];
}

/**
 * Las variantes de un puesto como expresiones regulares de palabra entera
 * (\m…\M) para Postgres, en como mucho `max` expresiones.
 *
 * POR QUÉ (7 nov 2026). Postgres guarda compiladas solo las 32 últimas
 * expresiones regulares (MAX_CACHED_RES en regexp.c). Con una por variante,
 * "camarero" llevaba 44 y "camarera" 61, y al pasar de 32 Postgres recompila
 * cada expresión en cada fila. Medido en producción sobre las mismas 2.000
 * ofertas: 32 expresiones, 0,2 s; 33, 14 s; 44, 52 s. Por eso, desde que el
 * 6 nov entraron el eslovaco, el esloveno y el griego, casi todas las
 * búsquedas de camarero, limpieza, enfermera, conductor o almacén agotaban
 * los 15 s.
 *
 * Se juntan en grupos pequeños: \m(?:waiter|waitress|kellner)\M es lo mismo
 * que las tres por separado unidas con OR. Grupos de 2-4 cuestan lo mismo que
 * sueltas; de 8 o más se vuelven lentas (1,9 s frente a 0,2 en la misma
 * prueba), así que se reparten en `max` grupos como mucho. Hasta 16 variantes
 * sale exactamente lo mismo que antes: una expresión por variante.
 */
export const MAX_EXPRESIONES_PUESTO = 16;

export function expresionesDePalabraEntera(variantes: string[], max = MAX_EXPRESIONES_PUESTO): string[] {
  // Se escapa lo que Postgres leería como sintaxis de expresión regular.
  const escapar = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const porGrupo = Math.max(1, Math.ceil(variantes.length / Math.max(1, max)));
  const salida: string[] = [];
  for (let i = 0; i < variantes.length; i += porGrupo) {
    const grupo = variantes.slice(i, i + porGrupo).map(escapar);
    salida.push(grupo.length === 1 ? `\\m${grupo[0]}\\M` : `\\m(?:${grupo.join("|")})\\M`);
  }
  return salida;
}

/** ¿Este título de oferta corresponde de verdad a lo que se buscó? */
export function tituloCoincide(titulo: string, termino: string): boolean {
  const t = normalizar(titulo);
  return expandirPuesto(termino).some(v => t.includes(v));
}

/**
 * Añade entre paréntesis el oficio en español cuando el título viene en otro
 * idioma. "Kellner (m/w/d)" -> "Kellner (m/w/d) · camarero".
 *
 * Se hace con el diccionario, NO con la IA: es instantáneo y gratis. Traducir
 * cada título con un modelo en cada búsqueda añadiría segundos de espera y
 * coste por oferta mostrada, cuando lo único que necesita el usuario es saber
 * de qué es el puesto. Para leer la oferta entera ya está el botón de traducir.
 *
 * Devuelve el título sin tocar si ya se entiende en español.
 */
export function anotarOficio(titulo: string, terminoBuscado: string): string {
  if (!titulo || !terminoBuscado) return titulo;

  const t = normalizar(titulo);
  const buscado = normalizar(terminoBuscado);

  // Si el título ya lleva la palabra en español, no hay nada que aclarar
  if (t.includes(buscado)) return titulo;

  // ¿Coincide por alguno de los equivalentes en otro idioma?
  const coincide = expandirPuesto(terminoBuscado).some(v => v !== buscado && t.includes(v));
  return coincide ? `${titulo} · ${terminoBuscado}` : titulo;
}
