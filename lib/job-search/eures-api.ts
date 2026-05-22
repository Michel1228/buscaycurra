/**
 * EURES Job Search — Expansión Europea v2
 * 
 * La API oficial EURES requiere OAuth2 EU Login (no público).
 * En su lugar, usamos Careerjet con ubicaciones europeas.
 * Careerjet opera en 90+ países y YA tenemos la API key funcionando.
 * 
 * Cada "país" se mapea a búsquedas de Careerjet con location=[país].
 * Las keywords están traducidas a los idiomas locales.
 */

export const EURES_COUNTRIES = [
  { code: "ES", name: "España", location: "Espana", keywords: ["camarero", "programador", "enfermero", "administrativo", "conductor", "dependiente", "electricista", "mecanico", "cocinero", "limpieza"] },
  { code: "DE", name: "Alemania", location: "Deutschland", keywords: ["kellner", "entwickler", "krankenpfleger", "burokaufmann", "fahrer", "verkaufer", "elektriker", "mechaniker", "koch", "reinigung"] },
  { code: "FR", name: "Francia", location: "France", keywords: ["serveur", "developpeur", "infirmier", "administratif", "chauffeur", "vendeur", "electricien", "mecanicien", "cuisinier", "nettoyage"] },
  { code: "PT", name: "Portugal", location: "Portugal", keywords: ["empregado", "programador", "enfermeiro", "administrativo", "motorista", "vendedor", "eletricista", "mecanico", "cozinheiro", "limpeza"] },
  { code: "IT", name: "Italia", location: "Italia", keywords: ["cameriere", "sviluppatore", "infermiere", "amministrativo", "autista", "venditore", "elettricista", "meccanico", "cuoco", "pulizie"] },
  { code: "NL", name: "Países Bajos", location: "Nederland", keywords: ["ober", "ontwikkelaar", "verpleegkundige", "administratief", "chauffeur", "verkoper", "elektricien", "monteur", "kok", "schoonmaak"] },
  { code: "IE", name: "Irlanda", location: "Ireland", keywords: ["waiter", "developer", "nurse", "administrator", "driver", "sales", "electrician", "mechanic", "chef", "cleaner"] },
  { code: "BE", name: "Bélgica", location: "Belgique", keywords: ["serveur", "developpeur", "infirmier", "administratif", "chauffeur", "vendeur", "electricien", "mecanicien", "cuisinier", "nettoyage"] },
  { code: "AT", name: "Austria", location: "Osterreich", keywords: ["kellner", "entwickler", "krankenpfleger", "burokaufmann", "fahrer", "verkaufer", "elektriker", "mechaniker", "koch", "reinigung"] },
  { code: "PL", name: "Polonia", location: "Polska", keywords: ["kelner", "programista", "pielegniarka", "administracyjny", "kierowca", "sprzedawca", "elektryk", "mechanik", "kucharz", "sprzatanie"] },
  { code: "SE", name: "Suecia", location: "Sverige", keywords: ["servitor", "utvecklare", "sjukskoterska", "administrator", "forare", "saljare", "elektriker", "mekaniker", "kock", "stadning"] },
  { code: "CH", name: "Suiza", location: "Schweiz", keywords: ["kellner", "entwickler", "krankenpfleger", "burokaufmann", "fahrer", "verkaufer", "elektriker", "mechaniker", "koch", "reinigung"] },
  { code: "NO", name: "Noruega", location: "Norge", keywords: ["servitor", "utvikler", "sykepleier", "administrativ", "sjafør", "selger", "elektriker", "mekaniker", "kokk", "rengjøring"] },
  { code: "DK", name: "Dinamarca", location: "Danmark", keywords: ["tjener", "udvikler", "sygeplejerske", "administrativ", "chauffør", "sælger", "elektriker", "mekaniker", "kok", "rengøring"] },
  { code: "FI", name: "Finlandia", location: "Suomi", keywords: ["tarjoilija", "kehittaja", "sairaanhoitaja", "hallinnollinen", "kuljettaja", "myyja", "sahkoasentaja", "mekaanikko", "kokki", "siivous"] },
];

/**
 * Genera combos para sync masivo EURES (vía Careerjet): país × keyword
 * Total: 15 países × 10 keywords = 150 combos
 */
export function generateEuresCombos(): Array<{ keyword: string; country: string; location: string }> {
  const combos: Array<{ keyword: string; country: string; location: string }> = [];
  for (const country of EURES_COUNTRIES) {
    for (const keyword of country.keywords) {
      combos.push({ keyword, country: country.code, location: country.location });
    }
  }
  return combos;
}
