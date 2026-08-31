/**
 * Arbeitsagentur API — Jobbörse der Bundesagentur für Arbeit (Alemania)
 * API pública sin autenticación. Requiere User-Agent y X-Api-Key específicos.
 * 
 * Documentación: https://rest.arbeitsagentur.de/jobboerse/jobsuche-service/pc/v4/
 * Endpoint: /app/jobs?angebotsart=1&page=1&size=50
 * 
 * Volumen: ~1.2M ofertas activas estimadas (mercado laboral alemán)
 */

import { getPool } from "@/lib/db";

// v6, no v4.
//
// La v4 dejó de responder: devuelve 403 con cuerpo vacío desde el 24 de mayo de
// 2026, que es exactamente la fecha del último alta alemana que teníamos. La
// sincronización seguía ejecutándose y "terminando bien" todos los días, solo
// que sin traer nada, así que nadie se enteró: 147.691 ofertas alemanas
// congeladas durante 99 días, con Alemania entre los primeros destinos de quien
// emigra desde España.
//
// La v6 responde 200 con las mismas cabeceras. Cambia toda la estructura de la
// respuesta (ver AAJob más abajo), no solo la ruta.
const BASE_URL = "https://rest.arbeitsagentur.de/jobboerse/jobsuche-service/pc/v6/jobs";

const HEADERS = {
  "User-Agent": "Jobsuche/2.9.16",
  "X-Api-Key": "jobboerse-jobsuche",
  "Accept": "application/json",
};

interface AAResponse {
  /** En la v4 se llamaba `stellenangebote`. */
  ergebnisliste: AAJob[];
  maxErgebnisse: number;
  page: number;
  size: number;
}

/** Estructura de la v6. Todos los nombres cambiaron respecto a la v4. */
interface AAJob {
  stellenangebotsTitel?: string;
  referenznummer: string;
  firma?: string;
  /** Nombre del oficio, p. ej. "Koch/Köchin". */
  hauptberuf?: string;
  alleBerufe?: string[];
  /** La v6 admite varias ubicaciones por oferta; usamos la primera. */
  stellenlokationen?: Array<{
    adresse?: { plz?: string; ort?: string; region?: string; land?: string };
    breite?: number;
    laenge?: number;
  }>;
  datumErsteVeroeffentlichung?: string;
  aenderungsdatum?: string;
  /** "KEINE_ANGABEN" cuando no dicen sueldo, que es lo habitual. */
  verguetungsangabe?: string;
  arbeitszeitVollzeit?: boolean;
  externeUrl?: string;
}

// Keywords relevantes para el mercado laboral alemán
// 200 keywords cubriendo oficios, profesiones IT, salud, industria, comercio
export const GERMAN_KEYWORDS = [
  // IT & Tech (Alemania tiene déficit enorme de IT)
  "Softwareentwickler", "IT-Spezialist", "Systemadministrator", "DevOps",
  "Frontend-Entwickler", "Backend-Entwickler", "Fullstack-Entwickler",
  "Data Scientist", "IT-Security", "Cloud Engineer", "IT-Consultant",
  "SAP-Berater", "IT-Support", "Netzwerkadministrator", "Webentwickler",
  "Softwareentwicklung", "IT-Administrator", "Anwendungsentwickler",
  "IT-Projektmanager", "Datenbankadministrator",
  "Softwarearchitekt", "IT-Architekt", "Cybersicherheit", "Pentester",
  "IT-Systemelektroniker", "Fachinformatiker", "IT-Koordinator",
  "Java-Entwickler", "Python-Entwickler", "Embedded Systems",
  "IT-Qualitätssicherung", "Scrum Master", "Product Owner",
  "IT-Trainer", "Technischer Redakteur",
  
  // Industria / Ingeniería
  "Ingenieur", "Maschinenbauingenieur", "Elektroingenieur", "Bauingenieur",
  "Mechatroniker", "Elektroniker", "Industriemechaniker", "Zerspanungsmechaniker",
  "Schweißer", "CNC-Fräser", "Produktionsmitarbeiter", "Maschinenführer",
  "Qualitätsmanager", "Techniker", "Instandhalter", "Wartungstechniker",
  "Anlagenführer", "Fertigungsmitarbeiter", "Montagemitarbeiter",
  "Verfahrenstechniker", "Chemikant", "Pharmakant", "Lebensmitteltechniker",
  "Konstrukteur", "Technischer Zeichner", "Werkzeugmechaniker",
  "Anlagenmechaniker", "Betriebstechniker", "Energietechniker",
  
  // Salud / Pflege
  "Krankenpfleger", "Altenpfleger", "Gesundheitspfleger", "Arzthelfer",
  "Pflegefachkraft", "Krankenschwester", "Pflegehelfer", "Medizinische Fachangestellte",
  "Physiotherapeut", "Ergotherapeut", "Zahnmedizinische Fachangestellte",
  "Notfallsanitäter", "Hebamme", "OP-Pfleger",
  "Intensivpfleger", "Anästhesiepfleger", "Kinderkrankenpfleger",
  "Psychotherapeut", "Logopäde", "Diätassistent", "Pharmazeut",
  "Medizintechniker", "Rettungsassistent",
  
  // Logística / Transporte
  "Berufskraftfahrer", "LKW-Fahrer", "Kurierfahrer", "Zusteller",
  "Lagerist", "Fachkraft Lagerlogistik", "Staplerfahrer", "Kommissionierer",
  "Speditionskaufmann", "Logistikmitarbeiter", "Versandmitarbeiter",
  "Paketzusteller", "Postbote", "Güterkraftverkehr", "Disponent",
  "Logistikleiter", "Lagermitarbeiter", "Fahrzeugführer",
  
  // Oficina / Administración
  "Bürokaufmann", "Industriekaufmann", "Kaufmann Büromanagement",
  "Sachbearbeiter", "Personalreferent", "Lohnbuchhalter", "Buchhalter",
  "Steuerfachangestellter", "Bilanzbuchhalter", "Controller",
  "Assistenz", "Sekretär", "Büroassistent", "Kundenberater", "Callcenter",
  "Empfangskraft", "Verwaltungsfachangestellter", "Justiziar",
  "Datenschutzbeauftragter", "Wirtschaftsprüfer", "Steuerberater",
  
  // Comercio / Ventas
  "Verkäufer", "Einzelhandelskaufmann", "Kassierer", "Verkaufsberater",
  "Filialleiter", "Handelsvertreter", "Key Account", "Vertriebsmitarbeiter",
  "Immobilienmakler", "Versicherungsvertreter",
  "Vertriebsleiter", "Verkaufsleiter", "Quereinsteiger Vertrieb",
  "Außendienst", "Kundenbetreuer",
  
  // Gastronomía / Hostelería
  "Koch", "Beikoch", "Servicekraft", "Restaurantfachmann",
  "Hotelfachmann", "Rezeptionist", "Zimmerreinigung", "Küchenhilfe",
  "Barkeeper", "Barista", "Spüler", "Pizzabäcker",
  "Frühstücksservice", "Hotelmanager", "Eventmanager",
  
  // Construcción / Handwerk
  "Maler", "Elektriker", "Installateur", "Tischler",
  "Maurer", "Dachdecker", "Fliesenleger", "Gebäudereiniger",
  "Gärtner", "Landschaftsgärtner", "Zimmerer", "Glaser",
  "Metallbauer", "Straßenbauer", "Gerüstbauer",
  
  // Educación / Soziales
  "Erzieher", "Sozialpädagoge", "Sozialarbeiter", "Lehrer",
  "Kindergärtner", "Pädagoge", "Betreuer",
  "Schulbegleiter", "Integrationshelfer", "Familienhelfer",
  "Heilerziehungspfleger", "Jugendbetreuer",
  
  // Trabajos sin cualificación / Minijobs
  "Reinigungskraft", "Sicherheitsmitarbeiter", "Wachmann",
  "Aushilfe", "Minijob", "Werkstudent", "Praktikant", "Azubi",
  "Quereinsteiger", "Hausmeister", "Gartenhelfer", "Umzugshelfer",
  "Regalauffüller", "Inventurhelfer", "Promoter",
  
  // Homeoffice / Remoto (tendencia fuerte en Alemania)
  "Homeoffice", "Remote", "Telearbeit", "mobiles Arbeiten",
  "remote work", "hybrid", "Teilzeit remote",

  // ─── SEGUNDA OLEADA: 200 keywords adicionales ───
  
  // Más IT & Digital
  "UX-Designer", "UI-Designer", "Android-Entwickler", "iOS-Entwickler",
  "React-Entwickler", "Angular-Entwickler", "Vue-Entwickler", "Node.js-Entwickler",
  "C#-Entwickler", "C++-Entwickler", "PHP-Entwickler", "Ruby-Entwickler",
  "Kotlin-Entwickler", "Swift-Entwickler", "Go-Entwickler", "Rust-Entwickler",
  "Typescript", "Docker", "Kubernetes", "Terraform", "Jenkins",
  "GitLab", "CI/CD", "Microservices", "REST-API", "GraphQL",
  "Machine Learning", "KI-Entwickler", "Data Engineer", "Big Data",
  "Business Intelligence", "ETL-Entwickler", "Data Warehouse",
  "IT-Change-Manager", "IT-Service-Manager", "Agile Coach",
  
  // Más Industria especializada
  "Elektrokonstrukteur", "SPS-Programmierer", "Automatisierungstechniker",
  "Robotik", "Hardwareentwickler", "Embedded Software", "Testingenieur",
  "Validierungsingenieur", "Simulationsingenieur", "Berechnungsingenieur",
  "Prozessingenieur", "Verpackungsingenieur", "Kunststofftechniker",
  "Textiltechniker", "Holztechniker", "Papiertechniker", "Drucker",
  "Galvaniseur", "Oberflächentechniker", "Werkstoffprüfer",
  
  // Más salud especializada
  "Dialysepfleger", "Onkologiepfleger", "Palliativpfleger", "Hospizpfleger",
  "Wundmanager", "Stomapfleger", "Diabetesberater", "Schmerztherapeut",
  "Orthopädietechniker", "Hörgeräteakustiker", "Augenoptiker",
  "Tiermedizinische Fachangestellte", "Operationstechnischer Assistent",
  "Anästhesietechnischer Assistent", "Notarzt", "Betriebsarzt",
  
  // Más logística / Verkehr
  "Busfahrer", "Straßenbahnfahrer", "Lokführer", "Zugbegleiter",
  "Flugbegleiter", "Pilot", "Fluglotse", "Binnenschiffer",
  "Hafenarbeiter", "Kranführer", "Gabelstaplerfahrer",
  "Fachkraft Kurier Express Post", "Zusteller Post", "Paketsortierer",
  
  // Más oficios especializados
  "Steinmetz", "Stuckateur", "Betonbauer", "Kanalbauer",
  "Brunnenbauer", "Ofenbauer", "Rollladenbauer", "Fassadenbauer",
  "Bodenleger", "Parkettleger", "Raumausstatter", "Polsterer",
  "Goldschmied", "Silberschmied", "Uhrmacher", "Klavierbauer",
  "Orgelbauer", "Geigenbauer", "Instrumentenbauer", "Glasbläser",
  
  // Más gastronomía
  "Konditor", "Bäcker", "Fleischer", "Fischwirt",
  "Winzer", "Brauer", "Mälzer", "Destillateur",
  "Diätkoch", "Systemgastronomie", "Catering", "Partyservice",
  
  // Más sector verde / Nachhaltigkeit
  "Umweltingenieur", "Energieberater", "Klimamanager", "Nachhaltigkeitsmanager",
  "Abfallberater", "Gewässerschutz", "Bodenschutz", "Immissionsschutz",
  "Regenerative Energie", "Windkraft", "Solartechnik", "Waermepumpe",
  "Windenergie", "Photovoltaik", "Energiemanager", "Energietechnik",
  
  // Más banca / finanzas
  "Finanzberater", "Vermoegensberater", "Investmentbanker", "Fondsmanager",
  "Risikomanager", "Compliance", "Geldwaesche", "Revisor",
  "Aktuar", "Mathematiker", "Statistiker", "Oekonom",
  
  // Más media / creativo
  "Content Creator", "Social Media", "Videograf", "Fotograf",
  "Redakteur", "Lektor", "Korrektor", "Autor",
  "Sprecher", "Moderator", "Schauspieler", "Regisseur",
  "Musiker", "Komponist", "Tontechniker", "Lichttechniker",
  
  // Más limpieza / Facility
  "Gebaeudemanager", "Hausverwalter", "Hauswirtschaftler",
  "Fensterputzer", "Teppichreiniger", "Desinfektor",
  "Schornsteinfeger", "Kammerjaeger", "Schaedlingsbekaempfer",
  
  // Más seguridad
  "Brandschutz", "Feuerwehrmann", "Rettungsschwimmer",
  "Notfallmanager", "Sanitaeter", "Ersthelfer",
  "Werksschutz", "Objektschutz", "Geldtransport",
  
  // Diverso
  "Archaeologe", "Historiker", "Geograph", "Meteorologe",
  "Geologe", "Astronom", "Physiker", "Mathematiker",
  "Philosoph", "Soziologe", "Politologe", "Theologe",
] as const;

async function fetchAAPI(keyword: string, page: number = 1, size: number = 50): Promise<AAResponse | null> {
  const url = `${BASE_URL}?was=${encodeURIComponent(keyword)}&page=${page}&size=${size}`;
  
  try {
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) {
      console.error(`[Arbeitsagentur] HTTP ${res.status} for "${keyword}" page ${page}`);
      return null;
    }
    const data = await res.json();
    return data as AAResponse;
  } catch (e) {
    console.error(`[Arbeitsagentur] Fetch error for "${keyword}":`, e);
    return null;
  }
}

function mapToDB(job: AAJob) {
  const dir = job.stellenlokationen?.[0]?.adresse;
  const ort = dir?.ort || "Deutschland";
  const plz = dir?.plz || "";
  const region = dir?.region || "";
  const titulo = job.stellenangebotsTitel || job.hauptberuf || "Stellenangebot";
  // "KEINE_ANGABEN" es literalmente "sin datos": no es un sueldo.
  const sueldo =
    job.verguetungsangabe && job.verguetungsangabe !== "KEINE_ANGABEN"
      ? job.verguetungsangabe
      : null;

  return {
    id: `aa_${job.referenznummer}`,
    titulo,
    empresa: job.firma || "Unbekannt",
    ciudad: plz ? `${plz} ${ort}` : ort,
    region,
    pais: "DE",
    sourceUrl:
      job.externeUrl ||
      `https://www.arbeitsagentur.de/jobsuche/jobdetail/${encodeURIComponent(job.referenznummer)}`,
    sourceName: "Arbeitsagentur",
    descripcion: `Beruf: ${job.hauptberuf || titulo}${job.arbeitszeitVollzeit ? " (Vollzeit)" : ""}`,
    salario: sueldo,
    tipo: null,
    sector: "OTRO",
    fechaPublicacion: job.datumErsteVeroeffentlichung
      ? new Date(job.datumErsteVeroeffentlichung)
      : new Date(),
  };
}

export async function syncArbeitsagentur(
  keywords: readonly string[] = GERMAN_KEYWORDS,
  maxPerKeyword: number = 1000,  // 20 páginas × 50
  batchSize: number = 50
): Promise<{ fetched: number; inserted: number; errors: number }> {
  const pool = getPool();
  let totalFetched = 0;
  let totalInserted = 0;
  let totalErrors = 0;

  console.log(`[Arbeitsagentur] Starting sync with ${keywords.length} keywords, max ${maxPerKeyword} per keyword`);

  for (const keyword of keywords) {
    let keywordFetched = 0;
    let page = 1;
    const maxPages = Math.ceil(maxPerKeyword / batchSize);

    while (page <= maxPages) {
      const data = await fetchAAPI(keyword, page, batchSize);
      
      if (!data || !data.ergebnisliste?.length) break;
      
      const jobs = data.ergebnisliste;
      keywordFetched += jobs.length;
      totalFetched += jobs.length;

      // Batch insert con ON CONFLICT DO NOTHING
      try {
        const mapped = jobs.map(mapToDB);
        
        // Insertar en lotes pequeños para evitar timeouts
        for (let i = 0; i < mapped.length; i += 25) {
          const batch = mapped.slice(i, i + 25);
          const values = batch.map((j, idx) => {
            const base = idx * 7;
            return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7})`;
          }).join(", ");
          
          const params: any[] = [];
          for (const j of batch) {
            params.push(j.id, j.titulo, j.empresa, j.ciudad, j.sourceUrl, j.sourceName, j.sector);
          }

          const query = `
            INSERT INTO "JobListing" ("id", "title", "company", "city", "sourceUrl", "sourceName", "sector")
            VALUES ${values}
            ON CONFLICT ("id") DO NOTHING
          `;
          
          const result = await pool.query(query, params);
          totalInserted += result.rowCount || 0;
        }
      } catch (e) {
        console.error(`[Arbeitsagentur] DB error for keyword "${keyword}" page ${page}:`, e);
        totalErrors++;
      }

      // Si la página vino con menos de batchSize, es la última
      if (jobs.length < batchSize) break;
      
      // Rate limit: pequeño delay entre páginas
      await new Promise(r => setTimeout(r, 200));
      page++;
    }

    // Rate limit entre keywords
    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`[Arbeitsagentur] Sync done: ${totalFetched} fetched, ${totalInserted} inserted, ${totalErrors} errors`);
  return { fetched: totalFetched, inserted: totalInserted, errors: totalErrors };
}
