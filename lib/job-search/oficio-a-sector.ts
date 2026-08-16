/**
 * lib/job-search/oficio-a-sector.ts — De "camarero" a "hostelería".
 *
 * POR QUÉ EXISTE. Buscar ofertas y buscar empresas eran dos apartados
 * separados de la aplicación, y el usuario tenía que saber por su cuenta que
 * si busca de camarero le interesan los bares. Esta tabla es lo que permite
 * juntarlos: buscas "camarero en Logroño" y debajo de las ofertas aparecen los
 * bares y restaurantes de Logroño a los que mandar el CV directamente.
 *
 * Los identificadores de sector son los mismos que usa /api/empresas/zona.
 * Devuelve null cuando el oficio no encaja en ninguno — y entonces
 * sencillamente no se enseña el bloque de empresas, que es mejor que enseñar
 * bares a un programador.
 */

/** Oficios que llevan a cada sector. Se comparan sin acentos. */
const OFICIOS_POR_SECTOR: Record<string, string[]> = {
  hosteleria: [
    "camarero", "camarera", "cocinero", "cocinera", "chef", "ayudante de cocina",
    "pinche", "barman", "barista", "jefe de sala", "maitre", "sumiller",
    "hosteleria", "restaurante", "bar", "cafeteria", "hotel", "recepcionista",
    "friegaplatos", "office", "repostero", "pastelero", "panadero",
    "waiter", "cook", "kellner", "serveur", "cuoco",
  ],
  comercio: [
    "dependiente", "dependienta", "vendedor", "vendedora", "cajero", "cajera",
    "reponedor", "comercial", "tienda", "comercio", "atencion al cliente",
    "shop assistant", "sales assistant", "cashier",
  ],
  belleza: [
    "peluquero", "peluquera", "esteticista", "manicura", "barbero",
    "masajista", "belleza", "estetica", "spa", "hairdresser", "barber",
  ],
  automocion: [
    "mecanico", "mecanica", "chapista", "electromecanico", "taller",
    "automocion", "neumaticos", "planchista", "mechanic",
  ],
  salud: [
    "enfermero", "enfermera", "auxiliar de enfermeria", "fisioterapeuta",
    "cuidador", "cuidadora", "celador", "tcae", "geriatria", "residencia",
    "farmacia", "dentista", "higienista", "nurse", "carer", "caregiver",
  ],
  construccion: [
    "albanil", "albañil", "peon", "encofrador", "ferrallista", "fontanero",
    "electricista", "pintor", "carpintero", "soldador", "obra", "construccion",
    "instalador", "climatizacion", "yesero", "escayolista",
    "bricklayer", "mason", "plumber", "electrician", "welder", "carpenter",
  ],
  logistica: [
    "conductor", "conductora", "chofer", "repartidor", "repartidora",
    "carretillero", "mozo de almacen", "almacen", "transportista", "camionero",
    "logistica", "mensajero", "rider", "driver", "warehouse", "forklift",
  ],
  educacion: [
    "profesor", "profesora", "maestro", "maestra", "monitor", "monitora",
    "educador", "educadora", "guarderia", "academia", "teacher", "tutor",
  ],
  limpieza: [
    "limpieza", "limpiador", "limpiadora", "camarera de piso", "camarero de piso",
    "personal de limpieza", "conserje", "cleaner", "housekeeping",
  ],
};

function normalizar(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
}

/** Etiquetas para hablarle al usuario en su idioma, no en identificadores. */
export const NOMBRE_SECTOR: Record<string, { etiqueta: string; sitios: string; emoji: string }> = {
  hosteleria: { etiqueta: "Hostelería", sitios: "bares, restaurantes y hoteles", emoji: "🍽️" },
  comercio: { etiqueta: "Comercio", sitios: "tiendas y comercios", emoji: "🛍️" },
  belleza: { etiqueta: "Belleza", sitios: "peluquerías y centros de estética", emoji: "💇" },
  automocion: { etiqueta: "Automoción", sitios: "talleres", emoji: "🔧" },
  salud: { etiqueta: "Salud", sitios: "clínicas, residencias y farmacias", emoji: "🏥" },
  construccion: { etiqueta: "Construcción", sitios: "constructoras y empresas de obra", emoji: "🏗️" },
  logistica: { etiqueta: "Transporte", sitios: "empresas de transporte y almacenes", emoji: "🚚" },
  educacion: { etiqueta: "Educación", sitios: "academias y centros educativos", emoji: "📚" },
  limpieza: { etiqueta: "Limpieza", sitios: "empresas de limpieza", emoji: "🧹" },
};

/**
 * ¿A qué tipo de negocio le interesa alguien que busca este oficio?
 *
 * Se compara por palabra completa contra la lista: "camarero de pisos" da
 * limpieza y no hostelería, porque "camarera de piso" es más específico y se
 * comprueba antes por longitud.
 */
export function sectorDeOficio(oficio: string): string | null {
  const o = normalizar(oficio);
  if (!o || o.length < 3) return null;

  let mejor: { sector: string; largo: number } | null = null;

  for (const [sector, oficios] of Object.entries(OFICIOS_POR_SECTOR)) {
    for (const candidato of oficios) {
      const c = normalizar(candidato);
      if (!o.includes(c)) continue;
      // Gana la coincidencia más larga: "camarera de piso" (limpieza) pesa
      // más que "camarera" (hostelería), que es lo correcto.
      if (!mejor || c.length > mejor.largo) mejor = { sector, largo: c.length };
    }
  }
  return mejor ? mejor.sector : null;
}
