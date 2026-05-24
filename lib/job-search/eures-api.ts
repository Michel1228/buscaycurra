/**
 * EURES Job Search — Expansión Europea MASIVA v3
 * 
 * 15 países × 50 keywords cada uno = 750 combos
 * Careerjet da ~20 ofertas por keyword. Con page=1+2 = ~40 por keyword.
 * Potencial: 750 × 40 = 30,000 ofertas por ronda completa.
 * A 3 rondas/día = 90,000 ofertas/día. En 33 días = 3M.
 */

export const EURES_COUNTRIES = [
  { code: "ES", name: "España", location: "Espana", keywords: [
    "camarero", "programador", "enfermero", "administrativo", "conductor", "dependiente", "electricista", "mecanico",
    "cocinero", "limpieza", "albanil", "soldador", "fontanero", "peluquero", "cuidador", "operario", "repartidor",
    "cajero", "vendedor", "auxiliar", "mozo", "camarera", "recepcionista", "chofer", "peon", "encargado", "gerente",
    "diseñador", "analista", "profesor", "medico", "farmaceutico", "psicologo", "abogado", "arquitecto", "contable",
    "informatico", "tecnico", "ingeniero", "comercial", "marketing", "logistica", "calidad", "prevencion", "rrhh",
    "atencion cliente", "teleoperador", "vigilante", "jardinero", "pintor"
  ]},
  { code: "DE", name: "Alemania", location: "Deutschland", keywords: [
    "kellner", "entwickler", "krankenpfleger", "burokaufmann", "fahrer", "verkaufer", "elektriker", "mechaniker",
    "koch", "reinigung", "maurer", "schweisser", "klempner", "friseur", "pfleger", "produktionshelfer", "kurierfahrer",
    "kassierer", "verkauferin", "hilfsarbeiter", "lagerist", "rezeptionist", "berufskraftfahrer", "bauhelfer",
    "schichtleiter", "filialleiter", "designer", "analytiker", "lehrer", "arzt", "apotheker", "psychologe",
    "anwalt", "architekt", "buchhalter", "informatiker", "techniker", "ingenieur", "vertrieb", "marketing",
    "logistik", "qualitat", "sicherheit", "personal", "kundendienst", "callcenter", "wachmann", "gartner", "maler",
    "backer", "fleischer", "tischler", "dachdecker", "zimmermann", "altenpfleger", "hebamme", "physiotherapeut",
    "zahnarzt", "steuerberater", "bankkaufmann", "immobilienmakler", "kfz-mechatroniker", "landwirt", "chemiker",
    "übersetzer", "journalist", "grafikdesigner", "lagerarbeiter", "staplerfahrer", "disponent", "einkaufer",
    "sachbearbeiter", "projektmanager", "teamleiter", "auszubildender", "praktikant", "werkstudent", "minijob",
    "teilzeit", "vollzeit", "homeoffice"
  ]},
  { code: "FR", name: "Francia", location: "France", keywords: [
    "serveur", "developpeur", "infirmier", "administratif", "chauffeur", "vendeur", "electricien", "mecanicien",
    "cuisinier", "nettoyage", "macon", "soudeur", "plombier", "coiffeur", "soignant", "operateur", "livreur",
    "caissier", "commercial", "auxiliaire", "magasinier", "receptionniste", "routier", "manoeuvre", "chef equipe",
    "gerant", "designer", "analyste", "professeur", "medecin", "pharmacien", "psychologue", "avocat", "architecte",
    "comptable", "informaticien", "technicien", "ingenieur", "vente", "marketing", "logistique", "qualite",
    "securite", "rh", "service client", "teleconseiller", "vigile", "jardinier", "peintre"
  ]},
  { code: "PT", name: "Portugal", location: "Portugal", keywords: [
    "empregado", "programador", "enfermeiro", "administrativo", "motorista", "vendedor", "eletricista", "mecanico",
    "cozinheiro", "limpeza", "pedreiro", "soldador", "canalizador", "cabeleireiro", "cuidador", "operario",
    "entregador", "caixa", "comercial", "auxiliar", "armazem", "rececionista", "camionista", "servente",
    "encarregado", "gerente", "designer", "analista", "professor", "medico", "farmaceutico", "psicologo",
    "advogado", "arquiteto", "contabilista", "informatico", "tecnico", "engenheiro", "vendas", "marketing",
    "logistica", "qualidade", "seguranca", "rh", "atendimento", "operador", "vigilante", "jardineiro", "pintor",
    "padeiro", "talhante", "carpinteiro", "estucador", "bombeiro", "fisioterapeuta", "dentista", "veterinario",
    "consultor", "especialista", "diretor", "bancario", "seguros", "imobiliario", "tradutor", "jornalista",
    "mecanico automovel", "agricultor", "quimico", "biologo", "designer grafico", "pasteleiro", "costureira",
    "marinheiro", "pescador", "motorista pesados", "empregada limpeza", "ama", "babysitter",
    "cozinha", "escritorio", "call center", "telemarketing", "formador", "gestor projetos",
    "auditor", "tesoureiro", "lojista", "repositor", "estafeta", "animador", "socorrista",
    "canalizador", "serralheiro", "vidraceiro", "bate-chapas", "eletromecanico", "tecnico frio",
    "jardineiro paisagista", "tratador animais", "inspetor", "chefe cozinha", "subchefe",
    "bartender", "ajudante", "salao", "hoteleiro", "turismo"
  ]},
  { code: "IT", name: "Italia", location: "Italia", keywords: [
    "cameriere", "sviluppatore", "infermiere", "amministrativo", "autista", "venditore", "elettricista", "meccanico",
    "cuoco", "pulizie", "muratore", "saldatore", "idraulico", "parrucchiere", "badante", "operaio", "corriere",
    "cassiere", "commerciale", "ausiliario", "magazziniere", "receptionist", "camionista", "manovale", "caposquadra",
    "gestore", "designer", "analista", "insegnante", "medico", "farmacista", "psicologo", "avvocato", "architetto",
    "contabile", "informatico", "tecnico", "ingegnere", "vendite", "marketing", "logistica", "qualita",
    "sicurezza", "risorse umane", "servizio clienti", "centralinista", "guardia", "giardiniere", "pittore"
  ]},
  { code: "NL", name: "Países Bajos", location: "Nederland", keywords: [
    "ober", "ontwikkelaar", "verpleegkundige", "administratief", "chauffeur", "verkoper", "elektricien", "monteur",
    "kok", "schoonmaak", "metselaar", "lasser", "loodgieter", "kapper", "verzorger", "productiemedewerker",
    "bezorger", "kassamedewerker", "verkoper", "hulpkracht", "magazijnmedewerker", "receptionist", "vrachtwagenchauffeur",
    "bouwvakker", "teamleider", "manager", "ontwerper", "analist", "leraar", "arts", "apotheker", "psycholoog",
    "advocaat", "architect", "boekhouder", "ict", "technicus", "ingenieur", "verkoop", "marketing",
    "logistiek", "kwaliteit", "beveiliging", "personeelszaken", "klantenservice", "callcenter", "bewaker", "tuinman", "schilder",
    "bakker", "slager", "timmerman", "dakdekker", "stukadoor", "tegelzetter", "kraanmachinist", "fysiotherapeut",
    "tandarts", "dierenarts", "belastingadviseur", "accountant", "bankmedewerker", "makelaar", "automonteur",
    "chemicus", "vertaler", "journalist", "grafisch ontwerper", "consultant", "adviseur", "specialist", "directeur",
    "vakkenvuller", "postbode", "callcenter medewerker", "schoonmaker", "keukenhulp", "afwasser",
    "bezorger fiets", "koerier", "orderpicker", "productiemanager", "kwaliteitscontroleur",
    "servicemonteur", "onderhoudsmonteur", "calculator", "werkvoorbereider", "uitzendkracht",
    "zzp", "freelance", "parttime", "fulltime", "bijbaan", "vakantiewerk", "stage", "trainee",
    "data analist", "business analist", "functioneel beheerder", "applicatiebeheerder"
  ]},
  { code: "IE", name: "Irlanda", location: "Ireland", keywords: [
    "waiter", "developer", "nurse", "administrator", "driver", "sales", "electrician", "mechanic", "chef", "cleaner",
    "bricklayer", "welder", "plumber", "hairdresser", "carer", "operator", "delivery", "cashier", "assistant",
    "warehouse", "receptionist", "truck driver", "labourer", "supervisor", "manager", "designer", "analyst",
    "teacher", "doctor", "pharmacist", "psychologist", "solicitor", "architect", "accountant", "IT technician",
    "engineer", "sales representative", "marketing", "logistics", "quality", "security", "HR", "customer service",
    "call centre", "security guard", "gardener", "painter", "butcher", "baker"
  ]},
  { code: "BE", name: "Bélgica", location: "Belgique", keywords: [
    "serveur", "developpeur", "infirmier", "administratif", "chauffeur", "vendeur", "electricien", "mecanicien",
    "cuisinier", "nettoyage", "macon", "soudeur", "plombier", "coiffeur", "soignant", "operateur", "livreur",
    "caissier", "commercial", "auxiliaire", "magasinier", "receptionniste", "routier", "manoeuvre", "chef equipe",
    "gerant", "designer", "analyste", "professeur", "medecin", "pharmacien", "psychologue", "avocat", "architecte",
    "comptable", "informaticien", "technicien", "ingenieur", "vente", "marketing", "logistique", "qualite",
    "securite", "rh", "service client", "teleconseiller", "vigile", "jardinier", "peintre",
    "bakker", "slager", "timmerman", "verzorgende", "tandarts", "boekhouder", "verkoper", "magazijnier",
    "schilder", "tuinier", "developer", "analist", "technicus", "monteur", "leraar", "verpleegkundige",
    "arts", "dierenarts", "advocaat", "ingenieur", "directeur", "specialist", "consultant", "kapper",
    "productieleider", "kwaliteitsingenieur", "biomedicus", "apotheker", "dokter", "chirurg",
    "hr-manager", "payroll", "recruiter", "facility", "inkoper", "supply chain",
    "data engineer", "cloud architect", "security officer", "helpdesk", "systeembeheerder",
    "koerier", "vrachtwagen", "heftruck", "inpakker", "productie", "assemblage"
  ]},
  { code: "AT", name: "Austria", location: "Osterreich", keywords: [
    "kellner", "entwickler", "krankenpfleger", "burokaufmann", "fahrer", "verkaufer", "elektriker", "mechaniker",
    "koch", "reinigung", "maurer", "schweisser", "klempner", "friseur", "pfleger", "produktionshelfer", "kurierfahrer",
    "kassierer", "verkauferin", "hilfsarbeiter", "lagerist", "rezeptionist", "berufskraftfahrer", "bauhelfer",
    "schichtleiter", "filialleiter", "designer", "analytiker", "lehrer", "arzt", "apotheker", "psychologe",
    "anwalt", "architekt", "buchhalter", "informatiker", "techniker", "ingenieur", "vertrieb", "marketing",
    "logistik", "qualitat", "sicherheit", "personal", "kundendienst", "callcenter", "wachmann", "gartner", "maler"
  ]},
  { code: "PL", name: "Polonia", location: "Polska", keywords: [
    "kelner", "programista", "pielegniarka", "administracyjny", "kierowca", "sprzedawca", "elektryk", "mechanik",
    "kucharz", "sprzatanie", "murarz", "spawacz", "hydraulik", "fryzjer", "opiekun", "operator", "dostawca",
    "kasjer", "handlowiec", "pomocnik", "magazynier", "recepcjonista", "kierowca ciezarowki", "robotnik",
    "brygadzista", "kierownik", "projektant", "analityk", "nauczyciel", "lekarz", "farmaceuta", "psycholog",
    "prawnik", "architekt", "ksiegowy", "informatyk", "technik", "inzynier", "sprzedaz", "marketing",
    "logistyka", "jakosc", "ochrona", "hr", "obsluga klienta", "telemarketer", "straznik", "ogrodnik", "malarz",
    "piekarz", "rzeznik", "stolarz", "dekarz", "tynkarz", "glazurnik", "fizjoterapeuta",
    "dentysta", "weterynarz", "ksiegowa", "bankowiec", "posrednik", "mechanik samochodowy",
    "chemik", "tlumacz", "dziennikarz", "grafik", "konsultant", "specjalista", "dyrektor",
    "sprzedawca detaliczny", "listonosz", "sprzataczka", "pomoc kuchenna",
    "dostawca jedzenia", "kurier", "magazynier wysoki", "kierowca autobusu"
  ]},
  { code: "SE", name: "Suecia", location: "Sverige", keywords: [
    "servitor", "utvecklare", "sjukskoterska", "administrator", "forare", "saljare", "elektriker", "mekaniker",
    "kock", "stadning", "murare", "svetsare", "rormokare", "frisor", "vardare", "operator", "bud",
    "kassapersonal", "forsaljning", "assistent", "lagerarbetare", "receptionist", "lastbilschauffor", "byggarbetare",
    "arbetsledare", "chef", "designer", "analytiker", "larare", "lakare", "apotekare", "psykolog",
    "advokat", "arkitekt", "revisor", "it-tekniker", "tekniker", "ingenjor", "forsaljning", "marknadsforing",
    "logistik", "kvalitet", "sakerhet", "personal", "kundtjanst", "telefonist", "vakt", "tradgardsmastare", "malare"
  ]},
  { code: "DK", name: "Dinamarca", location: "Danmark", keywords: [
    "tjener", "udvikler", "sygeplejerske", "administrativ", "chauffør", "sælger", "elektriker", "mekaniker",
    "kok", "rengøring", "murer", "svejser", "blikkenslager", "frisør", "plejer", "operatør", "bud",
    "kasserer", "salg", "assistent", "lagermedarbejder", "receptionist", "lastbilchauffør", "bygningsarbejder",
    "formand", "leder", "designer", "analytiker", "lærer", "læge", "farmaceut", "psykolog",
    "advokat", "arkitekt", "bogholder", "it-supporter", "tekniker", "ingeniør", "salg", "marketing",
    "logistik", "kvalitet", "sikkerhed", "personale", "kundeservice", "callcenter", "vagt", "gartner", "maler",
    "bager", "slagter", "snedker", "fysioterapeut", "tandlaege", "dyrlaege",
    "revisor", "bankmand", "ejendomsmaegler", "automekaniker", "kemiker", "oversaetter",
    "journalist", "grafiker", "konsulent", "specialist", "direktor", "deltid", "fuldtid",
    "weekend", "nattevagt", "afloser", "vikar", "studentermedhjaelper", "praktikant"
  ]},
  { code: "FI", name: "Finlandia", location: "Suomi", keywords: [
    "tarjoilija", "kehittaja", "sairaanhoitaja", "hallinnollinen", "kuljettaja", "myyja", "sahkoasentaja", "mekaanikko",
    "kokki", "siivous", "muurari", "hitsaaja", "putkimies", "kampaaja", "hoitaja", "operaattori", "lahetti",
    "kassa", "myynti", "avustaja", "varastotyontekija", "vastaanottovirkailija", "kuorma-autonkuljettaja", "rakennustyolainen",
    "tyonjohtaja", "paallikko", "suunnittelija", "analyytikko", "opettaja", "laakari", "farmaseutti", "psykologi",
    "asianajaja", "arkkitehti", "kirjanpitaja", "it-tuki", "teknikko", "insinoori", "myynti", "markkinointi",
    "logistiikka", "laatu", "turvallisuus", "henkilosto", "asiakaspalvelu", "puhelinmyyja", "vartija", "puutarhuri", "maalari"
  ]},
  { code: "NO", name: "Noruega", location: "Norge", keywords: [
    "servitor", "utvikler", "sykepleier", "administrativ", "sjafør", "selger", "elektriker", "mekaniker",
    "kokk", "rengjøring", "murer", "sveiser", "rørlegger", "frisør", "pleier", "operatør", "bud",
    "kasserer", "salg", "assistent", "lagermedarbeider", "resepsjonist", "lastebilsjafør", "bygningsarbeider",
    "formann", "leder", "designer", "analytiker", "lærer", "lege", "farmasøyt", "psykolog",
    "advokat", "arkitekt", "regnskapsfører", "it-tekniker", "tekniker", "ingeniør", "salg", "markedsføring",
    "logistikk", "kvalitet", "sikkerhet", "personal", "kundeservice", "callcenter", "vekter", "gartner", "maler",
    "baker", "slakter", "snekker", "fysioterapeut", "tannlege", "dyrlege",
    "regnskapsforer", "bankmann", "eiendomsmegler", "automekaniker", "kjemiker", "oversetter",
    "journalist", "grafiker", "konsulent", "spesialist", "direktor", "deltid", "heltid",
    "helg", "nattevakt", "tilkallingsvikar", "student", "laerling", "trainee"
  ]},
  { code: "CH", name: "Suiza", location: "Schweiz", keywords: [
    "kellner", "entwickler", "krankenpfleger", "burokaufmann", "fahrer", "verkaufer", "elektriker", "mechaniker",
    "koch", "reinigung", "maurer", "schweisser", "klempner", "friseur", "pfleger", "produktionshelfer", "kurierfahrer",
    "kassierer", "verkauferin", "hilfsarbeiter", "lagerist", "rezeptionist", "berufskraftfahrer", "bauhelfer",
    "schichtleiter", "filialleiter", "designer", "analytiker", "lehrer", "arzt", "apotheker", "psychologe",
    "anwalt", "architekt", "buchhalter", "informatiker", "techniker", "ingenieur", "vertrieb", "marketing",
    "logistik", "qualitat", "sicherheit", "personal", "kundendienst", "callcenter", "wachmann", "gartner", "maler",
    "bäcker", "metzger", "schreiner", "physiotherapeut", "zahnarzt", "tierarzt",
    "treuhänder", "banker", "immobilien", "automechaniker", "chemiker", "übersetzer",
    "journalist", "grafiker", "berater", "spezialist", "geschäftsführer", "teilzeit", "vollzeit",
    "wochenende", "nachtschicht", "aushilfe", "student", "lehrling", "trainee", "grenzgänger"
  ]},
  { code: "UK", name: "Reino Unido", location: "United Kingdom", keywords: [
    "waiter", "developer", "nurse", "administrator", "driver", "sales", "electrician", "mechanic",
    "chef", "cleaner", "bricklayer", "welder", "plumber", "hairdresser", "carer", "operator",
    "delivery", "cashier", "assistant", "warehouse", "receptionist", "truck driver", "labourer",
    "supervisor", "manager", "designer", "analyst", "teacher", "doctor", "pharmacist",
    "psychologist", "solicitor", "architect", "accountant", "IT", "technician", "engineer",
    "marketing", "logistics", "security", "HR", "customer service", "call centre", "security guard",
    "gardener", "painter", "butcher", "baker", "carpenter", "train driver", "pilot", "paramedic",
    "firefighter", "police", "care assistant", "support worker", "retail", "bartender",
    "barista", "kitchen porter", "dishwasher", "postman", "courier", "forklift", "packer",
    "stacker", "picker", "packer", "food production", "factory", "machinist", "cnc",
    "part time", "full time", "temporary", "permanent", "weekend", "night shift"
  ]},
  { code: "CZ", name: "República Checa", location: "Cesko", keywords: [
    "cisnik", "vyvojar", "zdravotni sestra", "administrativni", "ridic", "prodejce", "elektrikar",
    "mechanik", "kuchar", "uklid", "zednik", "svarec", "instalater", "kadernik", "pecovatel",
    "operator", "dorucovatel", "pokladni", "asistent", "skladnik", "recep\u010dn\u00ed",
    "ridic kamionu", "stavebni delnik", "mistr", "manazer", "designer", "analytik",
    "ucitel", "lekar", "farmaceut", "psycholog", "pravnik", "architekt", "ucetni",
    "it technik", "technik", "inzenyr", "prodej", "marketing", "logistika", "kvalita",
    "bezpecnost", "personalni", "zakaznicky servis", "call centrum", "stra\u017en\u00fd",
    "zahradnik", "malir", "pekar", "reznik", "truhlar", "fyzioterapeut", "zubar",
    "veterinar", "bankovni", "realitni", "automechanik", "chemik", "prekladatel",
    "novinar", "grafik", "konzultant", "specialista", "reditel", "brigada", "plny uvazek"
  ]},
  { code: "RO", name: "Rumanía", location: "Romania", keywords: [
    "ospatar", "programator", "asistent medical", "administrativ", "sofer", "vanzator",
    "electrician", "mecanic", "bucatar", "curatenie", "zidar", "sudor", "instalator",
    "frizer", "ingrijitor", "operator", "curier", "casier", "asistent", "depozit",
    "receptionist", "sofer camion", "muncitor", "sef echipa", "manager", "designer",
    "analist", "profesor", "medic", "farmacist", "psiholog", "avocat", "arhitect",
    "contabil", "it", "tehnician", "inginer", "vanzari", "marketing", "logistica",
    "calitate", "securitate", "resurse umane", "serviciu clienti", "call center",
    "paznic", "gradinar", "zugrav", "brutar", "macelar", "tamplar", "fizioterapeut",
    "dentist", "veterinar", "bancar", "imobiliar", "mecanic auto", "chimist",
    "traducator", "jurnalist", "grafician", "consultant", "specialist", "director"
  ]},
  { code: "HU", name: "Hungría", location: "Magyarorszag", keywords: [
    "pincer", "fejleszto", "apolo", "adminisztrator", "sofor", "elado", "villanyszerelo",
    "szerelo", "szakacs", "takaritas", "komuves", "hegeszto", "vizszerelo", "fodrasz",
    "gondozo", "operator", "futar", "penztaros", "asszisztens", "raktaros", "recepcios",
    "kamionsofor", "epitomunkas", "muszakvezeto", "menedzser", "designer", "elemzo",
    "tanar", "orvos", "gyogyszeresz", "pszichologus", "ugyved", "epitesz", "konyvelo",
    "informatikus", "technikus", "mernok", "ertekesites", "marketing", "logisztika",
    "minoseg", "biztonsag", "szemelyzet", "ugyfelszolgalat", "call center", "biztonsagi or",
    "kertesz", "festö", "pek", "hentes", "asztalos", "fizioterapeuta", "fogorvos",
    "allatorvos", "banki", "ingatlanos", "autoszerelo", "vegyesz", "fordito",
    "ujsagiro", "grafikus", "tanacsado", "specialista", "igazgato"
  ]},
  { code: "GR", name: "Grecia", location: "Ellada", keywords: [
    "servitoros", "programmatistis", "nosileftis", "dioikitikos", "odigos", "politis",
    "ilektrologos", "michanikos", "mageiras", "katharismos", "ktistis", "sygkollitis",
    "ydravlikos", "kommotis", "frontistis", "cheiristis", "dianomeas", "tamias",
    "voithos", "apothikarios", "ypodochi", "odigos fortigou", "ergatis", "epistatis",
    "manager", "schediastis", "analytis", "daskalos", "giatros", "farmakopoios",
    "psychologos", "dikigoros", "architektonas", "logistis", "technikos", "michanikos",
    "poliseis", "marketing", "logistiki", "poiotita", "asfaleia", "prosopiko",
    "exypiretisi pelaton", "tilefoniko kentro", "fylakas", "kipouros", "elaiourgos"
  ]},
  { code: "US", name: "Estados Unidos", location: "United States", keywords: [
    "waiter", "developer", "nurse", "administrative", "driver", "sales", "electrician",
    "mechanic", "chef", "cleaning", "construction", "welder", "plumber", "hairdresser",
    "caregiver", "operator", "delivery", "cashier", "assistant", "warehouse", "receptionist",
    "truck driver", "laborer", "supervisor", "manager", "designer", "analyst", "teacher",
    "doctor", "pharmacist", "psychologist", "lawyer", "architect", "accountant",
    "IT", "technician", "engineer", "sales", "marketing", "logistics", "quality",
    "security", "HR", "customer service", "call center", "security guard", "gardener",
    "painter", "cook", "dishwasher", "bartender", "barista", "hostess", "server",
    "retail", "stocker", "merchandiser", "data entry", "reception", "office assistant",
    "part time", "full time", "remote", "weekend", "overnight", "seasonal"
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
    "data entry", "office assistant", "personal support worker", "PSW", "mining",
    "oil field", "pipeline", "forestry", "fishing", "farm worker", "fruit picker"
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
    "aged care", "disability", "childcare", "fruit picking", "farm hand", "mining",
    "FIFO", "hospitality", "tourism", "part time", "full time", "casual"
  ]},
  { code: "BR", name: "Brasil", location: "Brasil", keywords: [
    "garcom", "programador", "enfermeiro", "administrativo", "motorista", "vendedor",
    "eletricista", "mecanico", "cozinheiro", "limpeza", "pedreiro", "soldador",
    "encanador", "cabeleireiro", "cuidador", "operador", "entregador", "caixa",
    "assistente", "almoxarifado", "recepcionista", "caminhoneiro", "servente",
    "supervisor", "gerente", "designer", "analista", "professor", "medico",
    "farmaceutico", "psicologo", "advogado", "arquiteto", "contador", "ti",
    "tecnico", "engenheiro", "vendas", "marketing", "logistica", "qualidade",
    "seguranca", "rh", "atendimento", "call center", "vigilante", "jardineiro",
    "pintor", "padeiro", "acougueiro", "carpinteiro", "fisioterapeuta", "dentista",
    "veterinario", "bancario", "corretor", "mecanico auto", "quimico", "tradutor",
    "jornalista", "designer grafico", "consultor", "especialista", "diretor"
  ]},
  { code: "MX", name: "México", location: "Mexico", keywords: [
    "mesero", "programador", "enfermero", "administrativo", "chofer", "vendedor",
    "electricista", "mecanico", "cocinero", "limpieza", "albañil", "soldador",
    "plomero", "estilista", "cuidador", "operador", "repartidor", "cajero",
    "asistente", "almacen", "recepcionista", "trailero", "peon", "supervisor",
    "gerente", "diseñador", "analista", "profesor", "medico", "farmaceutico",
    "psicologo", "abogado", "arquitecto", "contador", "informatica", "tecnico",
    "ingeniero", "ventas", "marketing", "logistica", "calidad", "seguridad",
    "recursos humanos", "atencion cliente", "call center", "vigilante", "jardinero",
    "pintor", "panadero", "carnicero", "carpintero", "fisioterapeuta", "dentista",
    "veterinario", "bancario", "agente seguros", "mecanico automotriz", "quimico",
    "traductor", "periodista", "diseñador grafico", "consultor", "especialista", "director"
  ]},
  { code: "ZA", name: "Sudáfrica", location: "South Africa", keywords: [
    "waiter", "developer", "nurse", "admin", "driver", "sales", "electrician", "mechanic",
    "chef", "cleaner", "builder", "welder", "plumber", "hairdresser", "caregiver",
    "operator", "delivery", "cashier", "assistant", "warehouse", "receptionist",
    "truck driver", "labourer", "supervisor", "manager", "designer", "analyst", "teacher",
    "doctor", "pharmacist", "psychologist", "attorney", "architect", "accountant",
    "IT", "technician", "engineer", "marketing", "logistics", "security", "HR",
    "customer service", "call centre", "security guard", "gardener", "painter",
    "mining", "farm worker", "domestic worker", "artisan", "fitter", "turner",
    "boilermaker", "millwright", "rigger", "scaffolder", "safety officer"
  ]},
  { code: "AE", name: "Emiratos Árabes", location: "United Arab Emirates", keywords: [
    "waiter", "developer", "nurse", "administrator", "driver", "sales", "electrician",
    "mechanic", "chef", "cleaner", "mason", "welder", "plumber", "barber", "caregiver",
    "operator", "delivery", "cashier", "assistant", "storekeeper", "receptionist",
    "driver", "labourer", "supervisor", "manager", "designer", "analyst", "teacher",
    "doctor", "pharmacist", "psychologist", "lawyer", "architect", "accountant",
    "IT", "technician", "engineer", "marketing", "logistics", "security", "HR",
    "customer service", "call centre", "security guard", "gardener", "painter",
    "cook", "steward", "housekeeping", "bellboy", "concierge", "lifeguard",
    "AC technician", "HVAC", "electrician", "pipe fitter", "ductman", "foreman",
    "safety officer", "HSE", "crane operator", "heavy driver", "light driver"
  ]},
  { code: "IN", name: "India", location: "India", keywords: [
    "developer", "nurse", "administrator", "driver", "sales", "electrician", "mechanic",
    "chef", "cleaner", "mason", "welder", "plumber", "barber", "caregiver",
    "operator", "delivery", "cashier", "assistant", "warehouse", "receptionist",
    "driver", "labourer", "supervisor", "manager", "designer", "analyst", "teacher",
    "doctor", "pharmacist", "psychologist", "lawyer", "architect", "accountant",
    "IT", "technician", "engineer", "marketing", "logistics", "security", "HR",
    "customer service", "call centre", "security guard", "gardener", "painter",
    "cook", "waiter", "housekeeping", "data entry", "BPO", "KPO", "back office",
    "field executive", "delivery boy", "helper", "office boy", "peon", "attendant"
  ]},
  { code: "SG", name: "Singapur", location: "Singapore", keywords: [
    "waiter", "developer", "nurse", "administrator", "driver", "sales", "electrician",
    "mechanic", "chef", "cleaner", "construction", "welder", "plumber", "hairdresser",
    "caregiver", "operator", "delivery", "cashier", "assistant", "warehouse", "receptionist",
    "driver", "worker", "supervisor", "manager", "designer", "analyst", "teacher",
    "doctor", "pharmacist", "psychologist", "lawyer", "architect", "accountant",
    "IT", "technician", "engineer", "marketing", "logistics", "security", "HR",
    "customer service", "call centre", "security officer", "gardener", "painter",
    "cook", "steward", "housekeeping", "bellman", "concierge", "technician",
    "barista", "bartender", "captain", "supervisor", "executive", "officer"
  ]},
  { code: "JP", name: "Japón", location: "Japan", keywords: [
    "developer", "nurse", "administrator", "driver", "sales", "electrician", "mechanic",
    "chef", "cleaner", "construction", "welder", "plumber", "hairdresser", "caregiver",
    "operator", "delivery", "cashier", "assistant", "warehouse", "receptionist",
    "teacher", "doctor", "pharmacist", "psychologist", "lawyer", "architect", "accountant",
    "IT", "technician", "engineer", "marketing", "logistics", "security", "HR",
    "customer service", "call centre", "security guard", "gardener", "painter",
    "cook", "waiter", "factory", "manufacturing", "technician", "translator",
    "interpreter", "hotel", "tourism", "agriculture", "fishing", "construction"
  ]},
  { code: "KR", name: "Corea del Sur", location: "South Korea", keywords: [
    "developer", "nurse", "administrator", "driver", "sales", "electrician", "mechanic",
    "chef", "cleaner", "construction", "welder", "plumber", "hairdresser", "caregiver",
    "operator", "delivery", "cashier", "assistant", "warehouse", "receptionist",
    "teacher", "doctor", "pharmacist", "psychologist", "lawyer", "architect", "accountant",
    "IT", "technician", "engineer", "marketing", "logistics", "security", "HR",
    "customer service", "call centre", "security guard", "gardener", "painter",
    "cook", "waiter", "factory", "manufacturing", "English teacher", "translator",
    "hotel", "tourism", "shipbuilding", "semiconductor", "auto parts"
  ]},
  { code: "TR", name: "Turquía", location: "Turkiye", keywords: [
    "garson", "gelistirici", "hemsire", "idari", "sofor", "satici", "elektrikci",
    "tamirci", "asci", "temizlik", "duvarci", "kaynakci", "tesisatci", "kuafr",
    "bakici", "operator", "kurye", "kasiyer", "asistan", "depocu", "resepsiyonist",
    "kamyon sofor", "insaat iscisi", "ustabasi", "yonetici", "tasarimci", "analist",
    "ogretmen", "doktor", "eczaci", "psikolog", "avukat", "mimar", "muhasebeci",
    "bilisim", "teknisyen", "muhendis", "satis", "pazarlama", "lojistik", "kalite",
    "guvenlik", "insan kaynaklari", "musteri hizmetleri", "cagri merkezi",
    "guvenlik gorevlisi", "bahcivan", "boyaci", "firinci", "kasap", "marangoz"
  ]},
  { code: "EG", name: "Egipto", location: "Egypt", keywords: [
    "developer", "nurse", "administrator", "driver", "sales", "electrician", "mechanic",
    "chef", "cleaner", "construction", "welder", "plumber", "hairdresser", "caregiver",
    "operator", "delivery", "cashier", "assistant", "warehouse", "receptionist",
    "teacher", "doctor", "pharmacist", "psychologist", "lawyer", "architect", "accountant",
    "IT", "technician", "engineer", "marketing", "logistics", "security", "HR",
    "customer service", "call centre", "security guard", "gardener", "painter",
    "cook", "waiter", "housekeeping", "tourism", "hospitality", "diving", "marine"
  ]},
  { code: "CL", name: "Chile", location: "Chile", keywords: [
    "garzon", "programador", "enfermero", "administrativo", "conductor", "vendedor",
    "electricista", "mecanico", "cocinero", "aseo", "albañil", "soldador", "gasfiter",
    "peluquero", "cuidador", "operador", "repartidor", "cajero", "asistente", "bodega",
    "recepcionista", "camionero", "jornal", "supervisor", "gerente", "diseñador",
    "analista", "profesor", "medico", "farmaceutico", "psicologo", "abogado",
    "arquitecto", "contador", "informatica", "tecnico", "ingeniero", "ventas",
    "marketing", "logistica", "calidad", "seguridad", "rrhh", "atencion cliente",
    "call center", "guardia", "jardinero", "pintor", "mineria", "construccion",
    "agricola", "pesquero", "forestal", "portuario", "bodeguero", "chofer"
  ]},
  { code: "CO", name: "Colombia", location: "Colombia", keywords: [
    "mesero", "programador", "enfermero", "administrativo", "conductor", "vendedor",
    "electricista", "mecanico", "cocinero", "aseo", "albañil", "soldador", "plomero",
    "peluquero", "cuidador", "operador", "domiciliario", "cajero", "auxiliar",
    "bodega", "recepcionista", "camionero", "obrero", "supervisor", "gerente",
    "diseñador", "analista", "profesor", "medico", "farmaceutico", "psicologo",
    "abogado", "arquitecto", "contador", "sistemas", "tecnico", "ingeniero",
    "ventas", "marketing", "logistica", "calidad", "seguridad", "gestion humana",
    "servicio cliente", "call center", "vigilante", "jardinero", "pintor",
    "minero", "petrolero", "agro", "cafetero", "florero", "bananero", "palmero"
  ]},
  { code: "AR", name: "Argentina", location: "Argentina", keywords: [
    "mozo", "programador", "enfermero", "administrativo", "chofer", "vendedor",
    "electricista", "mecanico", "cocinero", "limpieza", "albañil", "soldador",
    "plomero", "peluquero", "cuidador", "operario", "cadete", "cajero", "asistente",
    "deposito", "recepcionista", "camionero", "peon", "supervisor", "gerente",
    "diseñador", "analista", "profesor", "medico", "farmaceutico", "psicologo",
    "abogado", "arquitecto", "contador", "sistemas", "tecnico", "ingeniero",
    "ventas", "marketing", "logistica", "calidad", "seguridad", "rrhh",
    "atencion al cliente", "call center", "vigilador", "jardinero", "pintor",
    "gastronomico", "hotelero", "turismo", "petrolero", "agropecuario", "pesquero"
  ]},
  { code: "PE", name: "Perú", location: "Peru", keywords: [
    "mozo", "programador", "enfermero", "administrativo", "chofer", "vendedor",
    "electricista", "mecanico", "cocinero", "limpieza", "albañil", "soldador",
    "gasfitero", "peluquero", "cuidador", "operario", "repartidor", "cajero",
    "asistente", "almacen", "recepcionista", "camionero", "obrero", "supervisor",
    "gerente", "diseñador", "analista", "profesor", "medico", "farmaceutico",
    "psicologo", "abogado", "arquitecto", "contador", "sistemas", "tecnico",
    "ingeniero", "ventas", "marketing", "logistica", "calidad", "seguridad",
    "rrhh", "atencion cliente", "call center", "vigilante", "jardinero", "pintor",
    "minero", "pesquero", "agroindustrial", "textil", "gastronomico", "hotelero"
  ]},
  { code: "EC", name: "Ecuador", location: "Ecuador", keywords: [
    "mesero", "programador", "enfermero", "administrativo", "chofer", "vendedor",
    "electricista", "mecanico", "cocinero", "limpieza", "albañil", "soldador",
    "plomero", "peluquero", "cuidador", "operador", "mensajero", "cajero",
    "asistente", "bodega", "recepcionista", "camionero", "obrero", "supervisor",
    "gerente", "diseñador", "analista", "profesor", "medico", "farmaceutico",
    "psicologo", "abogado", "arquitecto", "contador", "sistemas", "tecnico",
    "ingeniero", "ventas", "marketing", "logistica", "calidad", "seguridad",
    "talento humano", "atencion cliente", "call center", "guardia", "jardinero",
    "pintor", "bananero", "camaronero", "floricola", "petrolero", "turismo"
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
