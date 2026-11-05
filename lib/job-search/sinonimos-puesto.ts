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
 * repartidor "mensajero". Solo entran palabras que en España no signifiquen
 * otra cosa: "mozo" (camarero en Perú y Argentina) es aquí el mozo de almacén,
 * y "domiciliario" (repartidor en Colombia) sale en "enfermero domiciliario".
 */

/** Puesto en español -> cómo se dice en las ofertas de otros países. */
const SINONIMOS: Record<string, string[]> = {
  // ── Hostelería ──────────────────────────────────────────────────────
  camarero: ["waiter", "waitress", "serveur", "serveuse", "kellner", "cameriere",
             "empregado de mesa", "ober", "servitor", "bartender", "barista", "barman",
             "wait staff", "food service", "runner", "bar staff",
             "servitør", "servitör", "tarjoilija",
             "mesero", "mesera", "garçom", "garçonete", "garzón", "garzona"],
  // OJO: "chef" a secas NO vale. En francés "chef de projet" o "chef de
  // produit" son jefes de proyecto, no cocineros: en París había 2.263 así.
  cocinero: ["cook", "cuisinier", "koch", "cuoco", "cozinheiro", "kok", "kokk",
             "commis", "chef de partie", "chef de cuisine", "sous chef", "head chef",
             "line cook", "chefkoch", "cuisine",
             "cozinheira", "cocinera"],
  ayudante_cocina: ["kitchen assistant", "kitchen porter", "commis de cuisine",
                    "küchenhilfe", "aiuto cuoco", "dishwasher", "plongeur",
             "auxiliar de cozinha", "ayudante de cocina", "auxiliar de cocina"],
  recepcionista: ["receptionist", "réceptionniste", "rezeptionist", "receptionista",
                  "front desk", "front office"],

  // ── Limpieza ────────────────────────────────────────────────────────
  limpieza: ["cleaner", "cleaning", "nettoyage", "agent d'entretien", "reinigung",
             "reinigungskraft", "pulizia", "limpeza", "schoonmaak", "housekeeping",
             "housekeeper", "femme de ménage", "room attendant",
             "intendencia", "auxiliar de limpieza", "faxineira", "faxineiro", "auxiliar de limpeza", "diarista",
             "auxiliar de aseo", "operario de aseo"],
  camarera_piso: ["room attendant", "housekeeping", "femme de chambre",
                  "zimmermädchen", "cameriera ai piani",
             "recamarista", "camareira"],

  // ── Cuidados ────────────────────────────────────────────────────────
  cuidador: ["caregiver", "carer", "care assistant", "aide soignant", "auxiliaire de vie",
             "pflegehelfer", "altenpfleger", "badante", "cuidador", "support worker",
             "healthcare assistant", "personal care",
             "cuidador de idosos", "cuidadora de idosos", "cuidadora"],
  enfermera: ["nurse", "infirmier", "infirmière", "krankenschwester", "krankenpfleger",
              "pflegefachkraft", "infermiere", "enfermeiro", "verpleegkundige",
              "registered nurse", "staff nurse",
              // Nórdicos: en Oslo había 882 "sykepleier" que no se encontraban
              "sykepleier", "sjuksköterska", "sygeplejerske", "sairaanhoitaja",
             "enfermeira", "técnico de enfermagem", "técnica de enfermagem"],
  ninera: ["niñera", "nanny", "babysitter", "au pair", "nounou", "kindermädchen",
           "tata", "childminder", "childcare", "barnepike",
             "nana", "babá"],

  // ── Construcción e industria ────────────────────────────────────────
  // La clave va sin ñ, pero en la base de datos pone "Albañil": se incluyen
  // las dos formas o la búsqueda da cero (95 ofertas invisibles).
  // "builder" se quita: casaba con "Product Builder" y "AI Builder".
  albanil: ["albañil", "bricklayer", "mason", "maçon", "maurer", "muratore",
            "construction worker", "obrero construccion", "peon de obra", "murer",
             "pedreiro", "servente de obras", "servente de pedreiro"],
  electricista: ["electrician", "électricien", "elektriker", "elettricista", "eletricista"],
  fontanero: ["plumber", "plombier", "klempner", "installateur", "idraulico", "canalizador",
             "plomero", "encanador"],
  soldador: ["welder", "soudeur", "schweisser", "schweißer", "saldatore", "soldador"],
  carpintero: ["carpenter", "menuisier", "tischler", "schreiner", "falegname", "joiner",
             "carpinteiro", "marceneiro"],
  pintor: ["painter", "peintre", "maler", "imbianchino", "decorator"],
  operario: ["operator", "production worker", "opérateur", "produktionsmitarbeiter",
             "operaio", "factory worker", "machine operator", "assembler",
             "ayudante general", "auxiliar de produção", "operador de produção", "operário"],
  mecanico: ["mechanic", "mécanicien", "mechaniker", "meccanico", "technician",
             "mecânico"],

  // ── Transporte y almacén ────────────────────────────────────────────
  conductor: ["driver", "chauffeur", "fahrer", "autista", "motorista", "hgv driver",
              "lkw fahrer", "lkw-fahrer", "delivery driver", "truck driver", "van driver",
              "sjåfør", "chaufför", "chauffør", "kuljettaja",
             "chofer", "chófer", "motorista de caminhão"],
  repartidor: ["delivery", "courier", "livreur", "zusteller", "corriere", "rider",
             "entregador", "motoboy", "mensajero", "mensajera"],
  almacen: ["warehouse", "warehouse operative", "magasinier", "lagerarbeiter",
            "magazziniere", "picker", "packer", "forklift",
             "almacenista", "auxiliar de almacén", "estoquista", "almoxarife", "auxiliar de almoxarifado", "conferente",
             "auxiliar de bodega"],

  // ── Comercio y oficina ──────────────────────────────────────────────
  dependiente: ["shop assistant", "retail assistant", "sales assistant", "vendeur",
                "verkäufer", "commesso", "store associate", "cashier",
             "vendedor de piso", "atendente de loja", "vendedor", "vendedora"],
  cajero: ["cashier", "caissier", "kassierer", "cassiere", "checkout",
             "operador de caixa", "operadora de caixa"],
  administrativo: ["administrative assistant", "administrator", "office assistant",
                   "assistant administratif", "sachbearbeiter", "impiegato",
             "auxiliar administrativo", "auxiliar administrativa", "assistente administrativo", "assistente administrativa"],
  seguridad: ["security guard", "agent de sécurité", "sicherheitsmitarbeiter",
              "guardia giurata", "doorman",
             "guardia de seguridad", "vigilante", "porteiro"],

  // ── Otros frecuentes ────────────────────────────────────────────────
  jardinero: ["gardener", "jardinier", "gärtner", "giardiniere", "landscaper",
             "jardineiro"],
  peluquero: ["hairdresser", "coiffeur", "friseur", "parrucchiere", "barber",
             "estilista", "cabeleireiro", "cabeleireira", "barbeiro"],
  profesor: ["teacher", "professeur", "lehrer", "insegnante", "tutor", "instructor",
             "professora"],
  programador: ["developer", "software engineer", "programmer", "développeur",
                "entwickler", "sviluppatore",
             "desenvolvedor", "desenvolvedora"],
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
