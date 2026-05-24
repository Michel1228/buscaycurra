/**
 * EURES Job Search — Expansión Estratégica v5
 * 
 * 15 países con las mejores condiciones laborales del mundo.
 * Criterio: salario, emigración española, calidad de vida, idioma accesible.
 * 100-150 keywords por país cubriendo TODOS los sectores.
 * ~1,800 combos totales. Potencial: 1,800 × 40 ofertas = 72,000 por ronda.
 */

export const EURES_COUNTRIES = [
  // ===== TIER 1: INGLÉS + MAYOR EMIGRACIÓN + MEJOR SALARIO =====
  
  { code: "UK", name: "Reino Unido", location: "United Kingdom", keywords: [
    // Hostelería
    "waiter", "bartender", "barista", "chef", "sous chef", "kitchen porter", "dishwasher", "cook",
    "restaurant manager", "hotel receptionist", "housekeeping", "room attendant", "concierge",
    "hospitality", "catering", "hostess", "sommelier", "commis chef", "pastry chef",
    // IT/Tech
    "developer", "software engineer", "frontend", "backend", "fullstack", "devops", "cloud engineer",
    "data scientist", "data analyst", "data engineer", "cyber security", "IT support", "system admin",
    "network engineer", "QA tester", "product manager", "scrum master", "UX designer", "UI designer",
    "mobile developer", "Java developer", "Python developer", "JavaScript developer", "React developer",
    // Sanidad
    "nurse", "registered nurse", "healthcare assistant", "care assistant", "support worker",
    "doctor", "GP", "pharmacist", "physiotherapist", "paramedic", "midwife", "dentist",
    "mental health nurse", "social worker", "occupational therapist", "radiographer",
    // Oficina/Admin
    "administrator", "receptionist", "office manager", "personal assistant", "data entry",
    "customer service", "call centre", "accountant", "bookkeeper", "HR manager", "HR assistant",
    "recruiter", "payroll", "compliance officer", "project manager", "business analyst",
    // Comercio/Ventas
    "sales assistant", "retail", "store manager", "sales representative", "account manager",
    "business development", "estate agent", "cashier", "merchandiser", "visual merchandiser",
    // Logística/Transporte
    "driver", "delivery driver", "HGV driver", "truck driver", "van driver", "courier",
    "warehouse operative", "forklift driver", "pick packer", "supply chain", "logistics coordinator",
    "postman", "train driver", "bus driver", "taxi driver",
    // Construcción/Oficios
    "electrician", "plumber", "carpenter", "bricklayer", "painter decorator", "welder",
    "labourer", "construction worker", "site manager", "quantity surveyor", "scaffolder",
    "roofer", "tiler", "plasterer", "gas engineer", "HVAC technician", "handyman",
    // Industria
    "factory worker", "production operative", "machine operator", "CNC machinist", "assembler",
    "quality control", "packer", "food production", "manufacturing", "maintenance engineer",
    // Educación
    "teacher", "teaching assistant", "lecturer", "tutor", "SEN teacher", "nursery worker",
    // Otros servicios
    "cleaner", "gardener", "security guard", "caretaker", "lifeguard", "fitness instructor",
    "hairdresser", "barber", "beautician", "nail technician", "massage therapist",
    // General
    "part time", "full time", "temporary", "permanent", "weekend", "night shift",
    "remote", "hybrid", "graduate", "apprentice", "trainee", "intern"
  ]},

  { code: "IE", name: "Irlanda", location: "Ireland", keywords: [
    // Hostelería
    "waiter", "bartender", "barista", "chef", "commis chef", "kitchen porter", "accommodation assistant",
    "hotel receptionist", "housekeeping", "restaurant manager", "host", "hospitality",
    // IT/Tech (Dublín es hub tech europeo)
    "developer", "software engineer", "frontend", "backend", "fullstack", "devops", "cloud",
    "data scientist", "data analyst", "cyber security", "IT support", "system administrator",
    "network engineer", "QA engineer", "product manager", "scrum master", "UX designer",
    "Java developer", "Python developer", "JavaScript developer", "React developer", "mobile developer",
    "machine learning", "AI engineer", "site reliability engineer", "technical writer",
    // Sanidad (HSE contrata muchísimo)
    "nurse", "staff nurse", "healthcare assistant", "care assistant", "carer",
    "doctor", "GP", "pharmacist", "physiotherapist", "dentist", "social care worker",
    "home carer", "disability support", "midwife", "radiographer", "speech therapist",
    // Oficina/Finanzas (Dublín = centro financiero)
    "administrator", "receptionist", "office manager", "personal assistant",
    "customer service", "call centre", "accountant", "financial analyst", "fund accountant",
    "compliance", "risk analyst", "HR manager", "recruiter", "payroll specialist",
    "project manager", "business analyst", "data entry", "legal secretary",
    // Comercio
    "sales assistant", "retail", "store manager", "sales executive", "cashier",
    // Logística
    "driver", "delivery driver", "truck driver", "warehouse operative", "forklift",
    "supply chain", "logistics", "van driver",
    // Construcción/Oficios
    "electrician", "plumber", "carpenter", "bricklayer", "painter", "welder",
    "construction worker", "labourer", "site manager", "scaffolder", "roofer",
    // Industria/Farma
    "factory worker", "production operative", "machine operator", "process technician",
    "pharmaceutical operator", "cleanroom operative", "quality control", "manufacturing",
    // Agricultura/Pesca
    "farm worker", "mushroom picker", "meat processor", "fisherman", "general operative",
    // General
    "part time", "full time", "temporary", "permanent", "remote", "graduate", "trainee"
  ]},

  { code: "NL", name: "Países Bajos", location: "Nederland", keywords: [
    "ober", "ontwikkelaar", "verpleegkundige", "administratief", "chauffeur", "verkoper",
    "elektricien", "monteur", "kok", "schoonmaak", "metselaar", "lasser", "loodgieter",
    "kapper", "verzorger", "productiemedewerker", "bezorger", "kassamedewerker",
    "magazijnmedewerker", "receptionist", "vrachtwagenchauffeur", "bouwvakker",
    "teamleider", "manager", "ontwerper", "analist", "leraar", "arts", "apotheker",
    "psycholoog", "advocaat", "architect", "boekhouder", "ict", "technicus", "ingenieur",
    "verkoop", "marketing", "logistiek", "kwaliteit", "beveiliging", "personeelszaken",
    "klantenservice", "callcenter", "bewaker", "tuinman", "schilder", "bakker", "slager",
    "timmerman", "dakdekker", "stukadoor", "tegelzetter", "kraanmachinist", "fysiotherapeut",
    "tandarts", "dierenarts", "accountant", "bankmedewerker", "makelaar", "automonteur",
    "chemicus", "vertaler", "journalist", "grafisch ontwerper", "consultant", "adviseur",
    "specialist", "directeur", "vakkenvuller", "postbode", "schoonmaker", "keukenhulp",
    "afwasser", "koerier", "orderpicker", "servicemonteur", "onderhoudsmonteur",
    "uitzendkracht", "zzp", "freelance", "parttime", "fulltime", "bijbaan",
    "vakantiewerk", "stage", "trainee", "data analist", "business analist",
    "functioneel beheerder", "applicatiebeheerder", "devops engineer", "cloud architect",
    "security officer", "helpdesk", "systeembeheerder", "inpakker", "assemblage",
    "heftruckchauffeur", "reachtruck", "logistiek medewerker", "transportplanner",
    "customer service", "English speaking", "expat", "international", "Spanish speaker"
  ]},

  // ===== TIER 2: SALARIOS MUY ALTOS (idioma local pero merece la pena) =====

  { code: "DE", name: "Alemania", location: "Deutschland", keywords: [
    "kellner", "entwickler", "krankenpfleger", "burokaufmann", "fahrer", "verkaufer",
    "elektriker", "mechaniker", "koch", "reinigung", "maurer", "schweisser", "klempner",
    "friseur", "pfleger", "produktionshelfer", "kurierfahrer", "kassierer", "hilfsarbeiter",
    "lagerist", "rezeptionist", "berufskraftfahrer", "bauhelfer", "schichtleiter",
    "filialleiter", "designer", "analytiker", "lehrer", "arzt", "apotheker", "psychologe",
    "anwalt", "architekt", "buchhalter", "informatiker", "techniker", "ingenieur",
    "vertrieb", "marketing", "logistik", "qualitat", "sicherheit", "personal",
    "kundendienst", "callcenter", "wachmann", "gartner", "maler", "backer", "fleischer",
    "tischler", "dachdecker", "zimmermann", "altenpfleger", "hebamme", "physiotherapeut",
    "zahnarzt", "steuerberater", "bankkaufmann", "immobilienmakler", "kfz-mechatroniker",
    "landwirt", "chemiker", "übersetzer", "journalist", "grafikdesigner",
    "lagerarbeiter", "staplerfahrer", "disponent", "einkaufer", "sachbearbeiter",
    "projektmanager", "teamleiter", "auszubildender", "praktikant", "werkstudent",
    "minijob", "teilzeit", "vollzeit", "homeoffice", "quereinsteiger",
    "it-support", "softwareentwickler", "webentwickler", "systemadministrator",
    "datenbankadministrator", "netzwerktechniker", "devops engineer", "cloud engineer",
    "data scientist", "KI", "maschinelles lernen", "cyber security",
    "industriemechaniker", "anlagenmechaniker", "zerspanungsmechaniker",
    "mechatroniker", "elektroniker", "verfahrensmechaniker", "werkzeugmechaniker",
    "pflegefachkraft", "gesundheitspfleger", "kinderkrankenpfleger",
    "erzieher", "sozialpädagoge", "sozialarbeiter", "pflegehilfskraft",
    "verkauferin", "einzelhandel", "supermarkt", "discounter", "mode", "textil",
    "hotelfachmann", "restaurantfachmann", "systemgastronomie", "spüler",
    "fernbusfahrer", "lieferdienst", "paketzusteller", "lagerhelfer", "kommissionierer"
  ]},

  { code: "CH", name: "Suiza", location: "Schweiz", keywords: [
    "kellner", "entwickler", "krankenpfleger", "burokaufmann", "fahrer", "verkaufer",
    "elektriker", "mechaniker", "koch", "reinigung", "maurer", "schweisser", "klempner",
    "friseur", "pfleger", "produktionshelfer", "kurierfahrer", "kassierer",
    "hilfsarbeiter", "lagerist", "rezeptionist", "berufskraftfahrer", "bauhelfer",
    "schichtleiter", "filialleiter", "designer", "analytiker", "lehrer", "arzt",
    "apotheker", "psychologe", "anwalt", "architekt", "buchhalter", "informatiker",
    "techniker", "ingenieur", "vertrieb", "marketing", "logistik", "qualitat",
    "sicherheit", "personal", "kundendienst", "callcenter", "wachmann", "gartner",
    "maler", "bäcker", "metzger", "schreiner", "physiotherapeut", "zahnarzt",
    "tierarzt", "treuhänder", "banker", "immobilien", "automechaniker", "chemiker",
    "übersetzer", "journalist", "grafiker", "berater", "spezialist",
    "geschäftsführer", "teilzeit", "vollzeit", "wochenende", "nachtschicht",
    "aushilfe", "student", "lehrling", "trainee", "grenzgänger",
    "software engineer", "data scientist", "cloud architect", "devops",
    "pharma", "watchmaker", "private banking", "wealth management", "hotel",
    "tourisme", "serveur", "femme de chambre", "réceptionniste", "concierge",
    "cuisinier", "nettoyage", "vendeur", "manager", "CEO", "CFO", "CTO"
  ]},

  { code: "NO", name: "Noruega", location: "Norge", keywords: [
    "servitor", "utvikler", "sykepleier", "administrativ", "sjafør", "selger",
    "elektriker", "mekaniker", "kokk", "rengjøring", "murer", "sveiser",
    "rørlegger", "frisør", "pleier", "operatør", "bud", "kasserer", "salg",
    "assistent", "lagermedarbeider", "resepsjonist", "lastebilsjafør",
    "bygningsarbeider", "formann", "leder", "designer", "analytiker", "lærer",
    "lege", "farmasøyt", "psykolog", "advokat", "arkitekt", "regnskapsfører",
    "it-tekniker", "tekniker", "ingeniør", "markedsføring", "logistikk",
    "kvalitet", "sikkerhet", "personal", "kundeservice", "callcenter", "vekter",
    "gartner", "maler", "baker", "slakter", "snekker", "fysioterapeut",
    "tannlege", "dyrlege", "bankmann", "eiendomsmegler", "automekaniker",
    "kjemiker", "oversetter", "journalist", "grafiker", "konsulent", "spesialist",
    "direktor", "deltid", "heltid", "helg", "nattevakt", "tilkallingsvikar",
    "student", "laerling", "trainee", "olje", "offshore", "fiskeri",
    "oppdrett", "akvakultur", "maritim", "verft", "skipsbygging",
    "rennhold", "butikkmedarbeider", "hjemmehjelp", "barnehage", "assistent"
  ]},

  // ===== TIER 3: MUCHA EMIGRACIÓN ESPAÑOLA =====

  { code: "FR", name: "Francia", location: "France", keywords: [
    "serveur", "developpeur", "infirmier", "administratif", "chauffeur", "vendeur",
    "electricien", "mecanicien", "cuisinier", "nettoyage", "macon", "soudeur",
    "plombier", "coiffeur", "soignant", "operateur", "livreur", "caissier",
    "commercial", "auxiliaire", "magasinier", "receptionniste", "routier",
    "manoeuvre", "chef equipe", "gerant", "designer", "analyste", "professeur",
    "medecin", "pharmacien", "psychologue", "avocat", "architecte", "comptable",
    "informaticien", "technicien", "ingenieur", "vente", "marketing", "logistique",
    "qualite", "securite", "rh", "service client", "teleconseiller", "vigile",
    "jardinier", "peintre", "boulanger", "patissier", "boucher", "charcutier",
    "menuisier", "couvreur", "plaquiste", "carreleur", "paysagiste", "esthéticienne",
    "aide-soignant", "auxiliaire vie", "assistante maternelle", "agent entretien",
    "employe libre-service", "preparateur commandes", "agent logistique",
    "conducteur bus", "conducteur metro", "deménageur", "manutentionnaire",
    "data engineer", "devops", "cloud", "cybersecurite", "data scientist",
    "product owner", "scrum master", "UX designer", "fullstack", "frontend",
    "CDI", "CDD", "interim", "temps partiel", "alternance", "stage", "saisonnier"
  ]},

  { code: "BE", name: "Bélgica", location: "Belgique", keywords: [
    "serveur", "developpeur", "infirmier", "administratif", "chauffeur", "vendeur",
    "electricien", "mecanicien", "cuisinier", "nettoyage", "macon", "soudeur",
    "plombier", "coiffeur", "soignant", "operateur", "livreur", "caissier",
    "commercial", "auxiliaire", "magasinier", "receptionniste", "routier",
    "manoeuvre", "chef equipe", "gerant", "designer", "analyste", "professeur",
    "medecin", "pharmacien", "psychologue", "avocat", "architecte", "comptable",
    "informaticien", "technicien", "ingenieur", "vente", "marketing", "logistique",
    "qualite", "securite", "rh", "service client", "teleconseiller", "vigile",
    "jardinier", "peintre", "bakker", "slager", "timmerman", "verzorgende",
    "tandarts", "boekhouder", "verkoper", "magazijnier", "schilder", "tuinier",
    "developer", "analist", "technicus", "monteur", "leraar", "verpleegkundige",
    "arts", "dierenarts", "advocaat", "ingenieur", "directeur", "specialist",
    "consultant", "kapper", "schoonmaker", "keukenhulp", "vrachtwagenchauffeur",
    "EU institution", "NATO", "international", "lobbyist", "policy officer",
    "data engineer", "cloud architect", "security officer", "helpdesk",
    "systeembeheerder", "koerier", "heftruck", "inpakker", "productie", "assemblage"
  ]},

  // ===== TIER 4: ANGLOSFERA LEJANA (visas, pero calidad de vida top) =====

  { code: "US", name: "Estados Unidos", location: "United States", keywords: [
    "waiter", "server", "bartender", "barista", "hostess", "busser", "line cook",
    "chef", "kitchen manager", "dishwasher", "hotel front desk", "housekeeping",
    "bellman", "concierge", "valet", "restaurant manager", "catering",
    "developer", "software engineer", "frontend", "backend", "fullstack", "devops",
    "cloud engineer", "data scientist", "data engineer", "data analyst", "machine learning",
    "cyber security", "IT support", "system administrator", "network engineer",
    "product manager", "UX designer", "QA engineer", "mobile developer", "Java", "Python",
    "nurse", "RN", "LPN", "CNA", "medical assistant", "doctor", "physician",
    "pharmacist", "pharmacy tech", "physical therapist", "dental hygienist", "dentist",
    "veterinary technician", "EMT", "paramedic", "caregiver", "home health aide",
    "receptionist", "administrative assistant", "office manager", "executive assistant",
    "data entry", "customer service", "call center", "accountant", "bookkeeper",
    "HR", "recruiter", "payroll", "project manager", "business analyst",
    "sales associate", "retail", "store manager", "cashier", "stocker", "merchandiser",
    "delivery driver", "truck driver", "warehouse", "forklift", "logistics",
    "supply chain", "Amazon", "FedEx", "UPS", "USPS", "mail carrier",
    "electrician", "plumber", "HVAC", "carpenter", "welder", "construction",
    "painter", "roofer", "landscaper", "gardener", "handyman", "maintenance",
    "factory worker", "production", "machine operator", "assembler", "packer",
    "quality control", "manufacturing", "CNC", "machinist",
    "cleaner", "janitor", "house cleaner", "security guard", "lifeguard",
    "fitness instructor", "personal trainer", "cosmetologist", "massage therapist",
    "teacher", "teaching assistant", "substitute teacher", "tutor", "professor",
    "part time", "full time", "remote", "hybrid", "weekend", "overnight", "seasonal", "temporary"
  ]},

  { code: "CA", name: "Canadá", location: "Canada", keywords: [
    "waiter", "developer", "nurse", "administrative", "driver", "sales", "electrician",
    "mechanic", "chef", "cleaner", "construction", "welder", "plumber", "hairdresser",
    "caregiver", "operator", "delivery", "cashier", "assistant", "warehouse", "receptionist",
    "truck driver", "labourer", "supervisor", "manager", "designer", "analyst", "teacher",
    "doctor", "pharmacist", "psychologist", "lawyer", "architect", "accountant",
    "IT", "technician", "engineer", "marketing", "logistics", "security", "HR",
    "customer service", "call centre", "security guard", "gardener", "painter",
    "cook", "dishwasher", "bartender", "barista", "server", "retail", "stocker",
    "data entry", "office assistant", "PSW", "personal support worker",
    "mining", "oil field", "pipeline", "forestry", "fishing", "farm worker",
    "fruit picker", "seasonal", "temporary foreign worker", "work permit",
    "LMIA", "express entry", "provincial nominee", "francophone", "bilingual",
    "early childhood educator", "ECA", "dental assistant", "medical office assistant",
    "insulator", "drywaller", "roofer", "glazier", "ironworker", "sheet metal",
    "sprinkler fitter", "steamfitter", "millwright", "heavy equipment operator"
  ]},

  { code: "AU", name: "Australia", location: "Australia", keywords: [
    "waiter", "developer", "nurse", "admin", "driver", "sales", "electrician", "mechanic",
    "chef", "cleaner", "construction", "welder", "plumber", "hairdresser", "carer",
    "operator", "delivery", "cashier", "assistant", "warehouse", "receptionist",
    "truck driver", "labourer", "supervisor", "manager", "designer", "analyst", "teacher",
    "doctor", "pharmacist", "psychologist", "solicitor", "architect", "accountant",
    "IT", "technician", "engineer", "marketing", "logistics", "security", "HR",
    "customer service", "call centre", "security", "gardener", "painter", "barista",
    "bartender", "kitchen hand", "dishwasher", "retail", "pick packer", "forklift",
    "aged care", "disability support", "childcare", "fruit picking", "farm hand",
    "mining", "FIFO", "hospitality", "tourism", "part time", "full time", "casual",
    "working holiday", "backpacker", "regional", "outback", "fly in fly out",
    "NDIS", "home care", "community support", "youth worker", "counsellor",
    "bricklayer", "carpenter", "joiner", "tiler", "plasterer", "scaffolder",
    "rigger", "diesel mechanic", "auto electrician", "panel beater", "spray painter",
    "concreter", "drainer", "landscaper", "arborist", "greenkeeper"
  ]},

  { code: "SE", name: "Suecia", location: "Sverige", keywords: [
    "servitor", "utvecklare", "sjukskoterska", "administrator", "forare", "saljare",
    "elektriker", "mekaniker", "kock", "stadning", "murare", "svetsare", "rormokare",
    "frisor", "vardare", "operator", "bud", "kassapersonal", "forsaljning",
    "assistent", "lagerarbetare", "receptionist", "lastbilschauffor",
    "byggarbetare", "arbetsledare", "chef", "designer", "analytiker", "larare",
    "lakare", "apotekare", "psykolog", "advokat", "arkitekt", "revisor",
    "it-tekniker", "tekniker", "ingenjor", "marknadsforing", "logistik",
    "kvalitet", "sakerhet", "personal", "kundtjanst", "telefonist", "vakt",
    "tradgardsmastare", "malare", "barnskotare", "forskollarare", "elevassistent",
    "personlig assistent", "lokalvardare", "städare", "fastighetsskotare",
    "montor", "CNC-operator", "svetsare", "plåtslagare", "lackering",
    "systemutvecklare", "mjukvaruutvecklare", "webbutvecklare", "frontend",
    "backend", "fullstack", "devops", "data scientist", "cloud", "AI",
    "tandlakare", "tandskoterska", "veterinar", "biomedicinsk analytiker",
    "skotare", "boendestodjare", "behandlingsassistent", "socialsekreterare",
    "deltid", "heltid", "sommarjobb", "extrajobb", "timanställd", "konsult"
  ]},

  // ===== BASE: España y vecinos =====

  { code: "ES", name: "España", location: "Espana", keywords: [
    "camarero", "programador", "enfermero", "administrativo", "conductor", "dependiente",
    "electricista", "mecanico", "cocinero", "limpieza", "albanil", "soldador",
    "fontanero", "peluquero", "cuidador", "operario", "repartidor", "cajero",
    "vendedor", "auxiliar", "mozo", "camarera", "recepcionista", "chofer", "peon",
    "encargado", "gerente", "diseñador", "analista", "profesor", "medico",
    "farmaceutico", "psicologo", "abogado", "arquitecto", "contable", "informatico",
    "tecnico", "ingeniero", "comercial", "marketing", "logistica", "calidad",
    "prevencion", "rrhh", "atencion cliente", "teleoperador", "vigilante",
    "jardinero", "pintor", "carpintero", "panadero", "carnicero", "pescadero",
    "frutero", "reponedor", "azafata", "azafato", "socorrista", "monitor",
    "entrenador", "fisioterapeuta", "dentista", "veterinario", "opticometrista",
    "podologo", "nutricionista", "terapeuta ocupacional", "logopeda",
    "educador social", "trabajador social", "integrador social", "animador",
    "guia turistico", "recepcionista hotel", "gobernanta", "camarera pisos",
    "ayudante cocina", "jefe cocina", "pizzero", "kebab", "sushi", "cocina",
    "montador", "instalador", "mantenimiento", "jefe obra", "aparejador",
    "delineante", "topografo", "quimico", "biologo", "ambientologo",
    "desarrollador", "frontend", "backend", "fullstack", "devops", "QA",
    "data scientist", "cloud", "ciberseguridad", "scrum master", "product owner",
    "ux", "ui", "community manager", "SEO", "SEM", "traductor", "interprete",
    "teletrabajo", "remoto", "media jornada", "jornada completa", "finde", "turno"
  ]},

  { code: "PT", name: "Portugal", location: "Portugal", keywords: [
    "empregado", "programador", "enfermeiro", "administrativo", "motorista",
    "vendedor", "eletricista", "mecanico", "cozinheiro", "limpeza", "pedreiro",
    "soldador", "canalizador", "cabeleireiro", "cuidador", "operario",
    "entregador", "caixa", "comercial", "auxiliar", "armazem", "rececionista",
    "camionista", "servente", "encarregado", "gerente", "designer", "analista",
    "professor", "medico", "farmaceutico", "psicologo", "advogado", "arquiteto",
    "contabilista", "informatico", "tecnico", "engenheiro", "vendas", "marketing",
    "logistica", "qualidade", "seguranca", "rh", "atendimento", "operador",
    "vigilante", "jardineiro", "pintor", "padeiro", "talhante", "carpinteiro",
    "estucador", "bombeiro", "fisioterapeuta", "dentista", "veterinario",
    "consultor", "especialista", "diretor", "bancario", "seguros", "imobiliario",
    "tradutor", "jornalista", "mecanico automovel", "agricultor", "quimico",
    "biologo", "designer grafico", "pasteleiro", "costureira", "marinheiro",
    "pescador", "motorista pesados", "empregada limpeza", "ama", "babysitter",
    "cozinha", "escritorio", "call center", "telemarketing", "formador",
    "gestor projetos", "auditor", "tesoureiro", "lojista", "repositor",
    "estafeta", "animador", "socorrista", "serralheiro", "vidraceiro",
    "bate-chapas", "eletromecanico", "tecnico frio", "jardineiro paisagista",
    "tratador animais", "inspetor", "chefe cozinha", "subchefe", "bartender",
    "ajudante", "salao", "hoteleiro", "turismo", "call center", "outsourcing"
  ]},

  { code: "IT", name: "Italia", location: "Italia", keywords: [
    "cameriere", "sviluppatore", "infermiere", "amministrativo", "autista",
    "venditore", "elettricista", "meccanico", "cuoco", "pulizie", "muratore",
    "saldatore", "idraulico", "parrucchiere", "badante", "operaio", "corriere",
    "cassiere", "commerciale", "ausiliario", "magazziniere", "receptionist",
    "camionista", "manovale", "caposquadra", "gestore", "designer", "analista",
    "insegnante", "medico", "farmacista", "psicologo", "avvocato", "architetto",
    "contabile", "informatico", "tecnico", "ingegnere", "vendite", "marketing",
    "logistica", "qualita", "sicurezza", "risorse umane", "servizio clienti",
    "centralinista", "guardia", "giardiniere", "pittore", "panettiere", "macellaio",
    "falegname", "estetista", "idraulico", "piastrellista", "cartongessista",
    "ponteggiatore", "gruista", "escavatorista", "autista bus", "tassista",
    "facchino", "portiere", "custode", "bagnino", "animatore turistico",
    "guida turistica", "commesso", "banconista", "gelataio", "pizzaiolo",
    "aiuto cuoco", "lavapiatti", "governante", "cameriera piani",
    "operaio metalmeccanico", "operaio tessile", "operaio alimentare",
    "contoterzista", "bracciante", "raccoglitore", "stagionale",
    "fullstack", "frontend", "backend", "devops", "data scientist", "cyber security",
    "system integrator", "consulente SAP", "ERP", "software house",
    "part time", "full time", "contratto indeterminato", "stagista", "apprendista"
  ]},
];

export function generateEuresCombos(): Array<{ keyword: string; country: string; location: string }> {
  const combos: Array<{ keyword: string; country: string; location: string }> = [];
  for (const country of EURES_COUNTRIES) {
    for (const keyword of country.keywords) {
      combos.push({ keyword, country: country.code, location: country.location });
    }
  }
  return combos;
}
