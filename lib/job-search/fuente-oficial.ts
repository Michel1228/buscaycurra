/**
 * lib/job-search/fuente-oficial.ts — Ofertas de los servicios públicos de empleo.
 *
 * Las de Lanbide y SEF Murcia (lib/job-search/ofertas-publicas.ts) no dicen qué
 * empresa contrata: se solicitan inscribiéndose en la web del servicio. Hasta el
 * 10 oct 2026, "Enviar CV" en una de ellas deducía un correo del enlace
 * (empleo@web.lanbide.eus) y, si la persona aceptaba, el CV se iba a la
 * administración en vez de a la empresa. Aquí se sabe cuáles son, para ofrecer
 * su enlace oficial y para que el servidor no mande CVs a esos dominios.
 *
 * Sin dependencias de servidor: lo usan también componentes de cliente.
 */

export interface ServicioOficial {
  nombre: string;
  corto: string;
}

const SERVICIOS: Record<string, ServicioOficial> = {
  LANBIDE: { nombre: "Lanbide (Servicio Vasco de Empleo)", corto: "Lanbide" },
  SEF_MURCIA: { nombre: "SEF Región de Murcia", corto: "SEF Murcia" },
};

/** Dominios de esos servicios: las ofertas se solicitan en su web, no por correo. */
const DOMINIOS = ["lanbide.eus", "lanbide.euskadi.net", "lanbide.euskadi.eus", "sefcarm.es", "sefoficinavirtual.carm.es", "sefapps.carm.es"];

/** El servicio público que publica la oferta, o null si no es de uno. */
export function servicioOficial(fuente: string | null | undefined): ServicioOficial | null {
  return SERVICIOS[(fuente ?? "").toUpperCase()] ?? null;
}

/** ¿Este correo es de un servicio público de empleo (deducido de su enlace)? */
export function esCorreoDeServicioOficial(email: string): boolean {
  const dominio = (email.split("@")[1] ?? "").trim().toLowerCase();
  return DOMINIOS.some(d => dominio === d || dominio.endsWith("." + d));
}
