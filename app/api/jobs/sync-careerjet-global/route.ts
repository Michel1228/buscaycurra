/**
 * /api/jobs/sync-careerjet-global
 * Extrae ofertas de Careerjet para US, UK, AU, CA
 * usando keywords nativas + ciudades por país
 */
import { NextRequest, NextResponse } from "next/server";
import { fetchCareerjetGlobal, upsertJobsForSync } from "@/lib/job-search/sync-worker";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const COUNTRIES: Record<string, { keywords: string[]; cities: string[]; name: string }> = {
  us: {
    name: "Estados Unidos",
    keywords: ["software engineer", "registered nurse", "truck driver", "teacher", "accountant", "electrician", "retail manager", "data analyst", "sales representative", "mechanic", "pharmacist", "physical therapist", "dental hygienist", "web developer", "project manager"],
    cities: ["New York", "Los Angeles", "Chicago", "Houston", "Miami", "Seattle", "Boston", "Atlanta", "Dallas", "Denver", "Austin", "San Francisco", "Phoenix", "Portland", "Nashville"],
  },
  uk: {
    name: "Reino Unido",
    keywords: ["software engineer", "nurse", "teacher", "electrician", "HGV driver", "accountant", "chef", "project manager", "data analyst", "plumber", "care assistant", "sales manager", "web developer", "HR manager", "marketing manager"],
    cities: ["London", "Manchester", "Birmingham", "Leeds", "Glasgow", "Liverpool", "Edinburgh", "Bristol", "Sheffield", "Cardiff", "Newcastle", "Nottingham", "Belfast", "Leicester", "Brighton"],
  },
  au: {
    name: "Australia",
    keywords: ["software engineer", "registered nurse", "electrician", "teacher", "chef", "accountant", "project manager", "data analyst", "diesel mechanic", "truck driver", "aged care worker", "web developer", "retail manager", "mining engineer", "civil engineer"],
    cities: ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide", "Gold Coast", "Canberra", "Newcastle", "Hobart", "Darwin", "Cairns", "Townsville", "Geelong", "Wollongong", "Sunshine Coast"],
  },
  ca: {
    name: "Canadá",
    keywords: ["software engineer", "registered nurse", "electrician", "teacher", "truck driver", "accountant", "chef", "project manager", "data analyst", "heavy duty mechanic", "web developer", "HR manager", "retail manager", "financial analyst", "civil engineer"],
    cities: ["Toronto", "Vancouver", "Montreal", "Calgary", "Edmonton", "Ottawa", "Quebec City", "Winnipeg", "Hamilton", "Kitchener", "London Ontario", "Halifax", "Victoria", "Saskatoon", "Mississauga"],
  },
  de: {
    name: "Alemania",
    keywords: ["Krankenpfleger", "Softwareentwickler", "Elektriker", "Lehrer", "LKW Fahrer", "Buchhalter", "Koch", "Projektmanager", "Datenanalyst", "Klempner", "Altenpfleger", "Verkaufsleiter", "Webentwickler", "Personalmanager", "Maschinenbauingenieur", "Erzieher", "Physiotherapeut", "Arzthelferin", "Lagerarbeiter", "Reinigungskraft"],
    cities: ["Berlin", "Munchen", "Hamburg", "Frankfurt", "Koln", "Stuttgart", "Dusseldorf", "Leipzig", "Dortmund", "Essen", "Bremen", "Dresden", "Hannover", "Nurnberg", "Bonn"],
  },
  fr: {
    name: "Francia",
    keywords: ["infirmier", "developpeur logiciel", "electricien", "enseignant", "chauffeur", "comptable", "chef", "gestionnaire de projet", "analyste de donnees", "plombier", "aide soignant", "directeur commercial", "developpeur web", "responsable RH", "ingenieur mecanique", "educateur", "kinesitherapeute", "assistant medical", "magasinier", "agent entretien"],
    cities: ["Paris", "Lyon", "Marseille", "Toulouse", "Nice", "Nantes", "Strasbourg", "Montpellier", "Bordeaux", "Lille", "Rennes", "Reims", "Grenoble", "Dijon", "Toulon"],
  },
  nl: {
    name: "Países Bajos",
    keywords: ["verpleegkundige", "software ontwikkelaar", "elektricien", "leraar", "vrachtwagenchauffeur", "accountant", "chef kok", "projectmanager", "data analist", "loodgieter", "verzorgende", "sales manager", "web ontwikkelaar", "HR manager", "werktuigbouwkundig ingenieur", "pedagogisch medewerker", "fysiotherapeut", "doktersassistent", "magazijnmedewerker", "schoonmaker"],
    cities: ["Amsterdam", "Rotterdam", "Den Haag", "Utrecht", "Eindhoven", "Groningen", "Tilburg", "Almere", "Breda", "Nijmegen", "Arnhem", "Haarlem", "Enschede", "Maastricht", "Leiden"],
  },
  it: {
    name: "Italia",
    keywords: ["infermiere", "sviluppatore software", "elettricista", "insegnante", "autista", "contabile", "chef", "project manager", "analista dati", "idraulico", "assistente sanitario", "responsabile vendite", "sviluppatore web", "responsabile HR", "ingegnere meccanico", "educatore", "fisioterapista", "assistente medico", "magazziniere", "addetto pulizie"],
    cities: ["Roma", "Milano", "Napoli", "Torino", "Palermo", "Genova", "Bologna", "Firenze", "Catania", "Bari", "Venezia", "Verona", "Messina", "Padova", "Trieste"],
  },
  es: {
    name: "España",
    keywords: ["enfermero", "desarrollador software", "electricista", "profesor", "conductor", "contable", "cocinero", "gestor proyectos", "analista datos", "fontanero", "auxiliar enfermeria", "comercial", "desarrollador web", "responsable RRHH", "ingeniero mecanico", "educador", "fisioterapeuta", "auxiliar administrativo", "mozo almacen", "limpiador"],
    cities: ["Madrid", "Barcelona", "Valencia", "Sevilla", "Zaragoza", "Malaga", "Murcia", "Palma", "Bilbao", "Alicante", "Cordoba", "Valladolid", "Vigo", "Gijon", "Granada"],
  },
  se: {
    name: "Suecia",
    keywords: ["sjukskoterska", "mjukvaruutvecklare", "elektriker", "larare", "lastbilsforare", "revisor", "kock", "projektledare", "dataanalytiker", "rorlaggare", "underskoterska", "saljchef", "webbutvecklare", "HR chef", "maskiningenjor", "forskollarare", "fysioterapeut", "lakarsekreterare", "lagerarbetare", "stadare"],
    cities: ["Stockholm", "Goteborg", "Malmo", "Uppsala", "Linkoping", "Orebro", "Vasteras", "Helsingborg", "Norrkoping", "Jonkoping", "Umea", "Lund", "Boras", "Sundsvall", "Gavle"],
  },
  ch: {
    name: "Suiza",
    keywords: ["Krankenpfleger", "infirmier", "Softwareentwickler", "developpeur logiciel", "Elektriker", "electricien", "Lehrer", "enseignant", "Buchhalter", "comptable", "Koch", "chef", "Projektmanager", "gestionnaire de projet", "Webentwickler"],
    cities: ["Zurich", "Geneve", "Basel", "Bern", "Lausanne", "Winterthur", "Luzern", "St. Gallen", "Lugano", "Biel", "Thun", "Koniz", "La Chaux-de-Fonds", "Fribourg", "Schaffhausen"],
  },
  be: {
    name: "Bélgica",
    keywords: ["verpleegkundige", "infirmier", "software ontwikkelaar", "developpeur logiciel", "elektricien", "electricien", "leraar", "enseignant", "accountant", "comptable", "projectmanager", "gestionnaire de projet", "web ontwikkelaar", "developpeur web", "magazijnmedewerker"],
    cities: ["Brussels", "Antwerpen", "Gent", "Charleroi", "Liege", "Brugge", "Namur", "Leuven", "Mons", "Aalst", "Mechelen", "La Louviere", "Kortrijk", "Hasselt", "Ostend"],
  },
  pt: {
    name: "Portugal",
    keywords: ["enfermeiro", "programador", "eletricista", "professor", "motorista", "contabilista", "cozinheiro", "gestor projeto", "analista dados", "canalizador", "auxiliar enfermagem", "comercial", "programador web", "gestor RH", "engenheiro mecanico", "educador", "fisioterapeuta", "assistente administrativo", "armazem", "empregado limpeza"],
    cities: ["Lisboa", "Porto", "Braga", "Coimbra", "Funchal", "Amadora", "Vila Nova de Gaia", "Setubal", "Aveiro", "Faro", "Evora", "Viseu", "Leiria", "Guimaraes", "Viana do Castelo"],
  },
  ie: {
    name: "Irlanda",
    keywords: ["software engineer", "nurse", "teacher", "electrician", "driver", "accountant", "chef", "project manager", "data analyst", "plumber", "care assistant", "sales manager", "web developer", "HR manager", "marketing manager"],
    cities: ["Dublin", "Cork", "Limerick", "Galway", "Waterford", "Drogheda", "Kilkenny", "Dundalk", "Swords", "Bray", "Navan", "Ennis", "Tralee", "Carlow", "Athlone"],
  },
  no: {
    name: "Noruega",
    keywords: ["sykepleier", "programvareutvikler", "elektriker", "laerer", "lastebilsjafor", "regnskapsforer", "kokk", "prosjektleder", "dataanalytiker", "rorlegger", "helsefagarbeider", "salgsleder", "webutvikler", "HR leder", "maskiningenior", "barnehagelaerer", "fysioterapeut", "legesekretaer", "lagerarbeider", "renholder"],
    cities: ["Oslo", "Bergen", "Trondheim", "Stavanger", "Drammen", "Fredrikstad", "Kristiansand", "Sandnes", "Tromso", "Sarpsborg", "Skien", "Alesund", "Sandefjord", "Haugesund", "Bodo"],
  },
  dk: {
    name: "Dinamarca",
    keywords: ["sygeplejerske", "softwareudvikler", "elektriker", "laerer", "lastbilchauffor", "bogholder", "kok", "projektleder", "dataanalytiker", "VVS montor", "social og sundhedsassistent", "salgschef", "webudvikler", "HR chef", "maskiningenior", "paedagog", "fysioterapeut", "laegesekretaer", "lagermedarbejder", "rengoringsassistent"],
    cities: ["Kobenhavn", "Aarhus", "Odense", "Aalborg", "Esbjerg", "Randers", "Kolding", "Horsens", "Vejle", "Roskilde", "Herning", "Silkeborg", "Naestved", "Frederiksberg", "Viborg"],
  },
  at: {
    name: "Austria",
    keywords: ["Krankenpfleger", "Softwareentwickler", "Elektriker", "Lehrer", "LKW Fahrer", "Buchhalter", "Koch", "Projektmanager", "Datenanalyst", "Installateur", "Altenpfleger", "Verkaufsleiter", "Webentwickler", "Personalmanager", "Maschinenbauingenieur"],
    cities: ["Wien", "Graz", "Linz", "Salzburg", "Innsbruck", "Klagenfurt", "Villach", "Wels", "Sankt Polten", "Dornbirn", "Wiener Neustadt", "Steyr", "Feldkirch", "Bregenz", "Leoben"],
  },
  fi: {
    name: "Finlandia",
    keywords: ["sairaanhoitaja", "ohjelmistokehittaja", "sahkoasentaja", "opettaja", "kuorma-autonkuljettaja", "kirjanpitaja", "kokki", "projektipaallikko", "data analyytikko", "putkimies", "lahihoitaja", "myyntipaallikko", "web kehittaja", "HR paallikko", "koneinsinoori", "lastentarhanopettaja", "fysioterapeutti", "laakarin sihteeri", "varastotyontekija", "siivooja"],
    cities: ["Helsinki", "Espoo", "Tampere", "Vantaa", "Turku", "Oulu", "Jyvaskyla", "Lahti", "Kuopio", "Pori", "Joensuu", "Lappeenranta", "Hameenlinna", "Vaasa", "Rovaniemi"],
  },
  nz: {
    name: "Nueva Zelanda",
    keywords: ["software engineer", "registered nurse", "electrician", "teacher", "truck driver", "accountant", "chef", "project manager", "data analyst", "plumber", "aged care worker", "sales manager", "web developer", "HR manager", "civil engineer"],
    cities: ["Auckland", "Wellington", "Christchurch", "Hamilton", "Tauranga", "Dunedin", "Palmerston North", "Napier", "Nelson", "Rotorua", "New Plymouth", "Whangarei", "Invercargill", "Whanganui", "Gisborne"],
  },
  pl: {
    name: "Polonia",
    keywords: ["pielegniarka", "programista", "elektryk", "nauczyciel", "kierowca", "ksiegowy", "kucharz", "kierownik projektu", "analityk danych", "hydraulik", "opiekun", "kierownik sprzedazy", "web developer", "kierownik HR", "inzynier mechanik", "wychowawca", "fizjoterapeuta", "asystent medyczny", "magazynier", "sprzataczka"],
    cities: ["Warszawa", "Krakow", "Lodz", "Wroclaw", "Poznan", "Gdansk", "Szczecin", "Bydgoszcz", "Lublin", "Bialystok", "Katowice", "Gdynia", "Czestochowa", "Radom", "Torun"],
  },
};

// Offset en memoria
const offsets: Record<string, number> = {};

export async function GET() {
  return NextResponse.json({
    countries: Object.keys(COUNTRIES),
    offsets,
  });
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-sync-secret");
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let body: { country?: string; batchSize?: number } = {};
  try { body = await req.json(); } catch { /* defaults */ }

  const batchSize = Math.min(body.batchSize ?? 10, 20);
  const country = body.country ?? "us";
  const cfg = COUNTRIES[country];
  if (!cfg) return NextResponse.json({ error: "País no soportado: " + country }, { status: 400 });

  const startIdx = offsets[country] || 0;
  let totalFetched = 0;
  let totalInserted = 0;

  for (let i = 0; i < batchSize; i++) {
    const comboIdx = (startIdx + i) % (cfg.keywords.length * cfg.cities.length);
    const kwIdx = comboIdx % cfg.keywords.length;
    const cityIdx = Math.floor(comboIdx / cfg.keywords.length) % cfg.cities.length;
    const kw = cfg.keywords[kwIdx];
    const city = cfg.cities[cityIdx];

    try {
      const jobs = await fetchCareerjetGlobal(kw, city);
      if (jobs.length > 0) {
        const inserted = await upsertJobsForSync(jobs, "OTRO" as any);
        totalInserted += inserted;
        totalFetched += jobs.length;
      }
    } catch { /* skip combo */ }
  }

  offsets[country] = startIdx + batchSize;

  return NextResponse.json({
    country: cfg.name,
    inserted: totalInserted,
    fetched: totalFetched,
    nextOffset: offsets[country],
    totalCombos: cfg.keywords.length * cfg.cities.length,
  });
}
