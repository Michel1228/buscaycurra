/**
 * lib/origen/nacionalidades.ts — De dónde puede ser quien nos usa.
 *
 * EL FALLO QUE ARREGLA, Y ERA MÍO. Al añadir el campo de nacionalidad reutilicé
 * `LISTA_PAISES`, que es la lista de los 26 países a los que ofrecemos ofertas.
 * Son cosas distintas: eso es a DÓNDE se va, no de DÓNDE se es. El resultado
 * era que un argentino no encontraba Argentina en el desplegable —no está entre
 * los destinos—, así que no podía decirnos su nacionalidad, se quedaba en blanco
 * y le seguíamos enseñando la guía escrita para españoles.
 *
 * Justo la persona por la que se hizo la función era la que no podía usarla.
 *
 * El orden no es alfabético a propósito: primero España, luego el resto de
 * países hispanohablantes —que es de donde viene nuestra gente—, después la
 * Unión Europea y por último el resto. Quien busca lo suyo lo encuentra arriba.
 *
 * Los códigos son ISO 3166-1 alfa-2 y tienen que coincidir con los que usan
 * `LIBRE_CIRCULACION` en lib/origen/movilidad.ts y las listas de acuerdos de
 * lib/destinos/requisitos.ts. Si aquí se escribe un código que allí no existe,
 * la persona queda fuera de todas las comprobaciones sin que nadie se entere:
 * por eso `scripts/comprobar-enlaces-destinos.mjs` los cruza.
 */

export interface Nacionalidad {
  codigo: string;
  nombre: string;
  bandera: string;
  grupo: "hispanohablante" | "ue" | "resto";
}

export const NACIONALIDADES: Nacionalidad[] = [
  // España primero: es de donde es la mayoría.
  { codigo: "ES", nombre: "España", bandera: "🇪🇸", grupo: "hispanohablante" },

  // Latinoamérica y Guinea Ecuatorial.
  { codigo: "AR", nombre: "Argentina", bandera: "🇦🇷", grupo: "hispanohablante" },
  { codigo: "BO", nombre: "Bolivia", bandera: "🇧🇴", grupo: "hispanohablante" },
  { codigo: "CL", nombre: "Chile", bandera: "🇨🇱", grupo: "hispanohablante" },
  { codigo: "CO", nombre: "Colombia", bandera: "🇨🇴", grupo: "hispanohablante" },
  { codigo: "CR", nombre: "Costa Rica", bandera: "🇨🇷", grupo: "hispanohablante" },
  { codigo: "CU", nombre: "Cuba", bandera: "🇨🇺", grupo: "hispanohablante" },
  { codigo: "EC", nombre: "Ecuador", bandera: "🇪🇨", grupo: "hispanohablante" },
  { codigo: "SV", nombre: "El Salvador", bandera: "🇸🇻", grupo: "hispanohablante" },
  { codigo: "GQ", nombre: "Guinea Ecuatorial", bandera: "🇬🇶", grupo: "hispanohablante" },
  { codigo: "GT", nombre: "Guatemala", bandera: "🇬🇹", grupo: "hispanohablante" },
  { codigo: "HN", nombre: "Honduras", bandera: "🇭🇳", grupo: "hispanohablante" },
  { codigo: "MX", nombre: "México", bandera: "🇲🇽", grupo: "hispanohablante" },
  { codigo: "NI", nombre: "Nicaragua", bandera: "🇳🇮", grupo: "hispanohablante" },
  { codigo: "PA", nombre: "Panamá", bandera: "🇵🇦", grupo: "hispanohablante" },
  { codigo: "PY", nombre: "Paraguay", bandera: "🇵🇾", grupo: "hispanohablante" },
  { codigo: "PE", nombre: "Perú", bandera: "🇵🇪", grupo: "hispanohablante" },
  { codigo: "PR", nombre: "Puerto Rico", bandera: "🇵🇷", grupo: "hispanohablante" },
  { codigo: "DO", nombre: "República Dominicana", bandera: "🇩🇴", grupo: "hispanohablante" },
  { codigo: "UY", nombre: "Uruguay", bandera: "🇺🇾", grupo: "hispanohablante" },
  { codigo: "VE", nombre: "Venezuela", bandera: "🇻🇪", grupo: "hispanohablante" },
  { codigo: "BR", nombre: "Brasil", bandera: "🇧🇷", grupo: "hispanohablante" },

  // Unión Europea, Espacio Económico Europeo y Suiza: libre circulación.
  { codigo: "DE", nombre: "Alemania", bandera: "🇩🇪", grupo: "ue" },
  { codigo: "AT", nombre: "Austria", bandera: "🇦🇹", grupo: "ue" },
  { codigo: "BE", nombre: "Bélgica", bandera: "🇧🇪", grupo: "ue" },
  { codigo: "BG", nombre: "Bulgaria", bandera: "🇧🇬", grupo: "ue" },
  { codigo: "CY", nombre: "Chipre", bandera: "🇨🇾", grupo: "ue" },
  { codigo: "HR", nombre: "Croacia", bandera: "🇭🇷", grupo: "ue" },
  { codigo: "DK", nombre: "Dinamarca", bandera: "🇩🇰", grupo: "ue" },
  { codigo: "SK", nombre: "Eslovaquia", bandera: "🇸🇰", grupo: "ue" },
  { codigo: "SI", nombre: "Eslovenia", bandera: "🇸🇮", grupo: "ue" },
  { codigo: "EE", nombre: "Estonia", bandera: "🇪🇪", grupo: "ue" },
  { codigo: "FI", nombre: "Finlandia", bandera: "🇫🇮", grupo: "ue" },
  { codigo: "FR", nombre: "Francia", bandera: "🇫🇷", grupo: "ue" },
  { codigo: "GR", nombre: "Grecia", bandera: "🇬🇷", grupo: "ue" },
  { codigo: "HU", nombre: "Hungría", bandera: "🇭🇺", grupo: "ue" },
  { codigo: "IE", nombre: "Irlanda", bandera: "🇮🇪", grupo: "ue" },
  { codigo: "IS", nombre: "Islandia", bandera: "🇮🇸", grupo: "ue" },
  { codigo: "IT", nombre: "Italia", bandera: "🇮🇹", grupo: "ue" },
  { codigo: "LV", nombre: "Letonia", bandera: "🇱🇻", grupo: "ue" },
  { codigo: "LI", nombre: "Liechtenstein", bandera: "🇱🇮", grupo: "ue" },
  { codigo: "LT", nombre: "Lituania", bandera: "🇱🇹", grupo: "ue" },
  { codigo: "LU", nombre: "Luxemburgo", bandera: "🇱🇺", grupo: "ue" },
  { codigo: "MT", nombre: "Malta", bandera: "🇲🇹", grupo: "ue" },
  { codigo: "NO", nombre: "Noruega", bandera: "🇳🇴", grupo: "ue" },
  { codigo: "NL", nombre: "Países Bajos", bandera: "🇳🇱", grupo: "ue" },
  { codigo: "PL", nombre: "Polonia", bandera: "🇵🇱", grupo: "ue" },
  { codigo: "PT", nombre: "Portugal", bandera: "🇵🇹", grupo: "ue" },
  { codigo: "CZ", nombre: "Chequia", bandera: "🇨🇿", grupo: "ue" },
  { codigo: "RO", nombre: "Rumanía", bandera: "🇷🇴", grupo: "ue" },
  { codigo: "SE", nombre: "Suecia", bandera: "🇸🇪", grupo: "ue" },
  { codigo: "CH", nombre: "Suiza", bandera: "🇨🇭", grupo: "ue" },

  // El resto. Están las nacionalidades más presentes en el mercado laboral
  // español y las de los países con acuerdos de movilidad que sí usamos.
  { codigo: "AD", nombre: "Andorra", bandera: "🇦🇩", grupo: "resto" },
  { codigo: "DZ", nombre: "Argelia", bandera: "🇩🇿", grupo: "resto" },
  { codigo: "AU", nombre: "Australia", bandera: "🇦🇺", grupo: "resto" },
  { codigo: "BD", nombre: "Bangladés", bandera: "🇧🇩", grupo: "resto" },
  { codigo: "CA", nombre: "Canadá", bandera: "🇨🇦", grupo: "resto" },
  { codigo: "CN", nombre: "China", bandera: "🇨🇳", grupo: "resto" },
  { codigo: "KR", nombre: "Corea del Sur", bandera: "🇰🇷", grupo: "resto" },
  { codigo: "CI", nombre: "Costa de Marfil", bandera: "🇨🇮", grupo: "resto" },
  { codigo: "EG", nombre: "Egipto", bandera: "🇪🇬", grupo: "resto" },
  { codigo: "US", nombre: "Estados Unidos", bandera: "🇺🇸", grupo: "resto" },
  { codigo: "PH", nombre: "Filipinas", bandera: "🇵🇭", grupo: "resto" },
  { codigo: "GM", nombre: "Gambia", bandera: "🇬🇲", grupo: "resto" },
  { codigo: "GH", nombre: "Ghana", bandera: "🇬🇭", grupo: "resto" },
  { codigo: "GN", nombre: "Guinea", bandera: "🇬🇳", grupo: "resto" },
  { codigo: "HK", nombre: "Hong Kong", bandera: "🇭🇰", grupo: "resto" },
  { codigo: "IN", nombre: "India", bandera: "🇮🇳", grupo: "resto" },
  { codigo: "ID", nombre: "Indonesia", bandera: "🇮🇩", grupo: "resto" },
  { codigo: "IL", nombre: "Israel", bandera: "🇮🇱", grupo: "resto" },
  { codigo: "JP", nombre: "Japón", bandera: "🇯🇵", grupo: "resto" },
  { codigo: "MA", nombre: "Marruecos", bandera: "🇲🇦", grupo: "resto" },
  { codigo: "MR", nombre: "Mauritania", bandera: "🇲🇷", grupo: "resto" },
  { codigo: "MD", nombre: "Moldavia", bandera: "🇲🇩", grupo: "resto" },
  { codigo: "MC", nombre: "Mónaco", bandera: "🇲🇨", grupo: "resto" },
  { codigo: "NG", nombre: "Nigeria", bandera: "🇳🇬", grupo: "resto" },
  { codigo: "NZ", nombre: "Nueva Zelanda", bandera: "🇳🇿", grupo: "resto" },
  { codigo: "PK", nombre: "Pakistán", bandera: "🇵🇰", grupo: "resto" },
  { codigo: "UK", nombre: "Reino Unido", bandera: "🇬🇧", grupo: "resto" },
  { codigo: "RU", nombre: "Rusia", bandera: "🇷🇺", grupo: "resto" },
  { codigo: "SM", nombre: "San Marino", bandera: "🇸🇲", grupo: "resto" },
  { codigo: "SN", nombre: "Senegal", bandera: "🇸🇳", grupo: "resto" },
  { codigo: "RS", nombre: "Serbia", bandera: "🇷🇸", grupo: "resto" },
  { codigo: "SG", nombre: "Singapur", bandera: "🇸🇬", grupo: "resto" },
  { codigo: "TW", nombre: "Taiwán", bandera: "🇹🇼", grupo: "resto" },
  { codigo: "TH", nombre: "Tailandia", bandera: "🇹🇭", grupo: "resto" },
  { codigo: "TR", nombre: "Turquía", bandera: "🇹🇷", grupo: "resto" },
  { codigo: "UA", nombre: "Ucrania", bandera: "🇺🇦", grupo: "resto" },
  { codigo: "VN", nombre: "Vietnam", bandera: "🇻🇳", grupo: "resto" },
];

export const ETIQUETA_GRUPO: Record<Nacionalidad["grupo"], string> = {
  hispanohablante: "España y Latinoamérica",
  ue: "Unión Europea y libre circulación",
  resto: "Resto del mundo",
};

/** Agrupadas, para pintar un desplegable con `<optgroup>`. */
export function nacionalidadesAgrupadas() {
  return (["hispanohablante", "ue", "resto"] as const).map(grupo => ({
    grupo,
    etiqueta: ETIQUETA_GRUPO[grupo],
    paises: NACIONALIDADES.filter(n => n.grupo === grupo),
  }));
}

export function nacionalidadDe(codigo: string | null | undefined): Nacionalidad | undefined {
  if (!codigo) return undefined;
  const c = codigo.toUpperCase().trim();
  return NACIONALIDADES.find(n => n.codigo === (c === "GB" ? "UK" : c));
}
