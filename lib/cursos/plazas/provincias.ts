import { normalizarTitulo } from "@/lib/cursos/plazas/emparejar";
/**
 * lib/cursos/plazas/provincias.ts — Códigos INE de provincia → nombre.
 *
 * Las fuentes dan la provincia de formas distintas (código de municipio de cinco
 * cifras, código de provincia, nombre en catalán); todas se guardan como el
 * código de dos cifras y aquí se le pone nombre para enseñarlo.
 */
export const PROVINCIAS: Record<string, string> = {
  "01": "Álava", "02": "Albacete", "03": "Alicante", "04": "Almería", "05": "Ávila",
  "06": "Badajoz", "07": "Illes Balears", "08": "Barcelona", "09": "Burgos", "10": "Cáceres",
  "11": "Cádiz", "12": "Castellón", "13": "Ciudad Real", "14": "Córdoba", "15": "A Coruña",
  "16": "Cuenca", "17": "Girona", "18": "Granada", "19": "Guadalajara", "20": "Gipuzkoa",
  "21": "Huelva", "22": "Huesca", "23": "Jaén", "24": "León", "25": "Lleida",
  "26": "La Rioja", "27": "Lugo", "28": "Madrid", "29": "Málaga", "30": "Murcia",
  "31": "Navarra", "32": "Ourense", "33": "Asturias", "34": "Palencia", "35": "Las Palmas",
  "36": "Pontevedra", "37": "Salamanca", "38": "Santa Cruz de Tenerife", "39": "Cantabria", "40": "Segovia",
  "41": "Sevilla", "42": "Soria", "43": "Tarragona", "44": "Teruel", "45": "Toledo",
  "46": "Valencia", "47": "Valladolid", "48": "Bizkaia", "49": "Zamora", "50": "Zaragoza",
  "51": "Ceuta", "52": "Melilla",
};

export function nombreProvincia(codigo: string | null | undefined): string | null {
  return codigo ? PROVINCIAS[codigo] ?? null : null;
}

/** Ciudades que la gente nombra en vez de la provincia. */
const CIUDADES: Record<string, string> = {
  bilbao: "48", barakaldo: "48", getxo: "48",
  donostia: "20", "san sebastian": "20", irun: "20", eibar: "20",
  vitoria: "01", gasteiz: "01",
  pamplona: "31", iruna: "31", tudela: "31",
  cartagena: "30", lorca: "30", "molina de segura": "30",
  "l'hospitalet": "08", hospitalet: "08", badalona: "08", terrassa: "08", sabadell: "08", mataro: "08",
  reus: "43", tortosa: "43", lerida: "25", gerona: "17",
  // Capitales de comunidades sin datos: se reconocen para poder decir que ahí
  // no tenemos plazas y dónde mirar, en vez de no contestar nada.
  sevilla: "41", malaga: "29", valencia: "46", alicante: "03", zaragoza: "50",
  valladolid: "47", vigo: "36", gijon: "33", oviedo: "33", santander: "39",
  palma: "07", granada: "18", cordoba: "14", almeria: "04", logrono: "26",
};

/** Código INE de la provincia nombrada en el texto, o null. */
export function provinciaEnTexto(texto: string): string | null {
  const t = ` ${normalizarTitulo(texto).replace(/[^a-z0-9' ]/g, " ")} `;
  const candidatos: [string, string][] = [
    ...Object.entries(CIUDADES),
    ...Object.entries(PROVINCIAS).map(([cod, nombre]) => [normalizarTitulo(nombre), cod] as [string, string]),
  ];
  // Los nombres más largos primero: "molina de segura" antes que "murcia".
  candidatos.sort((a, b) => b[0].length - a[0].length);
  for (const [nombre, cod] of candidatos) {
    if (t.includes(` ${nombre} `)) return cod;
  }
  return null;
}
