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
