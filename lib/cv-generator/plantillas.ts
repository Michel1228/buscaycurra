/**
 * lib/cv-generator/plantillas.ts — Registro de plantillas de CV
 *
 * Punto único para seleccionar la plantilla por `templateId`. Todos los consumidores
 * (editor, descarga PDF, worker de envío) deben usar `generarCV(data)` en vez de
 * llamar a una plantilla concreta, así añadir plantillas nuevas no toca el pipeline.
 */
import type { CVData } from "./cv-template";
import { generarCVHTML } from "./cv-template";
import { generarCVHTML_ATS } from "./cv-template-ats";

export type TemplateId = "clasica" | "ats";

export interface PlantillaInfo {
  id: TemplateId;
  nombre: string;
  descripcion: string;
  generar: (data: CVData) => string;
}

export const PLANTILLAS: Record<TemplateId, PlantillaInfo> = {
  clasica: {
    id: "clasica",
    nombre: "Clásica",
    descripcion: "Dos columnas con foto. Moderna y visual, ideal para hostelería, comercio y cara al cliente.",
    generar: generarCVHTML,
  },
  ats: {
    id: "ats",
    nombre: "Profesional ATS",
    descripcion: "Una columna, texto limpio. Optimizada para pasar los filtros automáticos (ATS) que usan el 90% de empresas.",
    generar: generarCVHTML_ATS,
  },
};

export const LISTA_PLANTILLAS: PlantillaInfo[] = Object.values(PLANTILLAS);

/** Genera el HTML del CV con la plantilla indicada en data.templateId (default: clasica). */
export function generarCV(data: CVData): string {
  const id = (data.templateId as TemplateId) || "clasica";
  const plantilla = PLANTILLAS[id] || PLANTILLAS.clasica;
  return plantilla.generar(data);
}
