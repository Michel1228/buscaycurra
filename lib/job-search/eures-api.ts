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
    "logistik", "qualitat", "sicherheit", "personal", "kundendienst", "callcenter", "wachmann", "gartner", "maler"
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
    "logistica", "qualidade", "seguranca", "rh", "atendimento", "operador", "vigilante", "jardineiro", "pintor"
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
    "logistiek", "kwaliteit", "beveiliging", "personeelszaken", "klantenservice", "callcenter", "bewaker", "tuinman", "schilder"
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
    "securite", "rh", "service client", "teleconseiller", "vigile", "jardinier", "peintre"
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
    "logistyka", "jakosc", "ochrona", "hr", "obsluga klienta", "telemarketer", "straznik", "ogrodnik", "malarz"
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
    "logistik", "kvalitet", "sikkerhed", "personale", "kundeservice", "callcenter", "vagt", "gartner", "maler"
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
    "logistikk", "kvalitet", "sikkerhet", "personal", "kundeservice", "callcenter", "vekter", "gartner", "maler"
  ]},
  { code: "CH", name: "Suiza", location: "Schweiz", keywords: [
    "kellner", "entwickler", "krankenpfleger", "burokaufmann", "fahrer", "verkaufer", "elektriker", "mechaniker",
    "koch", "reinigung", "maurer", "schweisser", "klempner", "friseur", "pfleger", "produktionshelfer", "kurierfahrer",
    "kassierer", "verkauferin", "hilfsarbeiter", "lagerist", "rezeptionist", "berufskraftfahrer", "bauhelfer",
    "schichtleiter", "filialleiter", "designer", "analytiker", "lehrer", "arzt", "apotheker", "psychologe",
    "anwalt", "architekt", "buchhalter", "informatiker", "techniker", "ingenieur", "vertrieb", "marketing",
    "logistik", "qualitat", "sicherheit", "personal", "kundendienst", "callcenter", "wachmann", "gartner", "maler"
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
