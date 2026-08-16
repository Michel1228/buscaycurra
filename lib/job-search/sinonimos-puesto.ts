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
 */

/** Puesto en español -> cómo se dice en las ofertas de otros países. */
const SINONIMOS: Record<string, string[]> = {
  // ── Hostelería ──────────────────────────────────────────────────────
  camarero: ["waiter", "waitress", "serveur", "serveuse", "kellner", "cameriere",
             "empregado de mesa", "ober", "servitor", "bartender", "barista", "barman",
             "wait staff", "food service", "runner", "bar staff"],
  cocinero: ["cook", "chef", "cuisinier", "koch", "cuoco", "cozinheiro", "kok",
             "commis", "chef de partie", "kitchen", "line cook"],
  ayudante_cocina: ["kitchen assistant", "kitchen porter", "commis de cuisine",
                    "küchenhilfe", "aiuto cuoco", "dishwasher", "plongeur"],
  recepcionista: ["receptionist", "réceptionniste", "rezeptionist", "receptionista",
                  "front desk", "front office"],

  // ── Limpieza ────────────────────────────────────────────────────────
  limpieza: ["cleaner", "cleaning", "nettoyage", "agent d'entretien", "reinigung",
             "reinigungskraft", "pulizia", "limpeza", "schoonmaak", "housekeeping",
             "housekeeper", "femme de ménage", "room attendant"],
  camarera_piso: ["room attendant", "housekeeping", "femme de chambre",
                  "zimmermädchen", "cameriera ai piani"],

  // ── Cuidados ────────────────────────────────────────────────────────
  cuidador: ["caregiver", "carer", "care assistant", "aide soignant", "auxiliaire de vie",
             "pflegehelfer", "altenpfleger", "badante", "cuidador", "support worker",
             "healthcare assistant", "personal care"],
  enfermera: ["nurse", "infirmier", "infirmière", "krankenschwester", "krankenpfleger",
              "pflegefachkraft", "infermiere", "enfermeiro", "verpleegkundige",
              "registered nurse", "staff nurse"],
  ninera: ["nanny", "babysitter", "au pair", "nounou", "kindermädchen", "tata",
           "childminder", "childcare"],

  // ── Construcción e industria ────────────────────────────────────────
  albanil: ["bricklayer", "mason", "maçon", "maurer", "muratore", "construction worker",
            "labourer", "builder"],
  electricista: ["electrician", "électricien", "elektriker", "elettricista", "eletricista"],
  fontanero: ["plumber", "plombier", "klempner", "installateur", "idraulico", "canalizador"],
  soldador: ["welder", "soudeur", "schweisser", "schweißer", "saldatore", "soldador"],
  carpintero: ["carpenter", "menuisier", "tischler", "schreiner", "falegname", "joiner"],
  pintor: ["painter", "peintre", "maler", "imbianchino", "decorator"],
  operario: ["operator", "production worker", "opérateur", "produktionsmitarbeiter",
             "operaio", "factory worker", "machine operator", "assembler"],
  mecanico: ["mechanic", "mécanicien", "mechaniker", "meccanico", "technician"],

  // ── Transporte y almacén ────────────────────────────────────────────
  conductor: ["driver", "chauffeur", "fahrer", "autista", "motorista", "hgv driver",
              "lkw fahrer", "delivery driver", "truck driver", "van driver"],
  repartidor: ["delivery", "courier", "livreur", "zusteller", "corriere", "rider"],
  almacen: ["warehouse", "warehouse operative", "magasinier", "lagerarbeiter",
            "magazziniere", "picker", "packer", "forklift"],

  // ── Comercio y oficina ──────────────────────────────────────────────
  dependiente: ["shop assistant", "retail assistant", "sales assistant", "vendeur",
                "verkäufer", "commesso", "store associate", "cashier"],
  cajero: ["cashier", "caissier", "kassierer", "cassiere", "checkout"],
  administrativo: ["administrative assistant", "administrator", "office assistant",
                   "assistant administratif", "sachbearbeiter", "impiegato"],
  seguridad: ["security guard", "agent de sécurité", "sicherheitsmitarbeiter",
              "guardia giurata", "doorman"],

  // ── Otros frecuentes ────────────────────────────────────────────────
  jardinero: ["gardener", "jardinier", "gärtner", "giardiniere", "landscaper"],
  peluquero: ["hairdresser", "coiffeur", "friseur", "parrucchiere", "barber"],
  profesor: ["teacher", "professeur", "lehrer", "insegnante", "tutor", "instructor"],
  programador: ["developer", "software engineer", "programmer", "développeur",
                "entwickler", "sviluppatore"],
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
export function expandirPuesto(termino: string): string[] {
  const t = normalizar(termino);
  if (!t) return [];

  const resultado = new Set<string>([t]);

  for (const [clave, traducciones] of Object.entries(SINONIMOS)) {
    const claveNorm = clave.replace(/_/g, " ");
    // Coincide con la clave en español ("camarero", "camarera piso")
    const coincideClave = t === claveNorm || t.includes(claveNorm) || claveNorm.includes(t);
    // O el usuario ya escribió una de las traducciones ("waiter")
    const coincideTraduccion = traducciones.some(v => normalizar(v) === t);

    if (coincideClave || coincideTraduccion) {
      resultado.add(claveNorm);
      for (const v of traducciones) resultado.add(normalizar(v));
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
      for (const tr of traducciones) resultado.add(normalizar(tr));
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
