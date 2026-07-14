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
import { generarCVHTML_Folio } from "./cv-template-folio";
import { generarCVHTML_Moderna } from "./cv-template-moderna";
import { generarCVHTML_Elegante } from "./cv-template-elegante";
import { generarCVHTML_Coqueta } from "./cv-template-coqueta";
import { generarCVHTML_Ejecutiva } from "./cv-template-ejecutiva";

export type TemplateId = "clasica" | "ats" | "folio" | "moderna" | "elegante" | "coqueta" | "ejecutiva";

export interface PlantillaInfo {
  id: TemplateId;
  nombre: string;
  descripcion: string;
  /** Si true, el color de acento influye mucho en el diseño (barra/banner de color). */
  usaColor: boolean;
  generar: (data: CVData) => string;
}

export const PLANTILLAS: Record<TemplateId, PlantillaInfo> = {
  ejecutiva: {
    id: "ejecutiva",
    nombre: "Ejecutiva",
    descripcion: "Estilo revista: foto en arco, nombre en serif elegante y tono pastel. Refinada, para marketing, comercial, administración y diseño.",
    usaColor: true,
    generar: generarCVHTML_Ejecutiva,
  },
  clasica: {
    id: "clasica",
    nombre: "Clásica",
    descripcion: "Dos columnas con foto y sidebar oscuro. Moderna y visual, para hostelería, comercio y cara al cliente.",
    usaColor: false,
    generar: generarCVHTML,
  },
  moderna: {
    id: "moderna",
    nombre: "Moderna",
    descripcion: "Barra lateral de color a tu gusto y línea de tiempo. Llamativa, para comercio, atención al cliente, peluquería y estética.",
    usaColor: true,
    generar: generarCVHTML_Moderna,
  },
  elegante: {
    id: "elegante",
    nombre: "Elegante",
    descripcion: "Banda superior a todo color con la foto destacada. Aspecto premium, para hostelería, ventas, marketing y eventos.",
    usaColor: true,
    generar: generarCVHTML_Elegante,
  },
  coqueta: {
    id: "coqueta",
    nombre: "Coqueta",
    descripcion: "Suave y decorativa, con tipografía elegante y adornos. Para peluquería, estética, spa, floristería y eventos.",
    usaColor: true,
    generar: generarCVHTML_Coqueta,
  },
  folio: {
    id: "folio",
    nombre: "Folio clásico",
    descripcion: "Una columna, sobrio, con la foto en la esquina. El de toda la vida, para administración, banca y perfiles senior.",
    usaColor: false,
    generar: generarCVHTML_Folio,
  },
  ats: {
    id: "ats",
    nombre: "Profesional ATS",
    descripcion: "Una columna, texto limpio. Optimizada para pasar los filtros automáticos (ATS) de las grandes empresas.",
    usaColor: false,
    generar: generarCVHTML_ATS,
  },
};

// Orden de aparición en el selector (visuales primero, ATS al final)
export const LISTA_PLANTILLAS: PlantillaInfo[] = [
  PLANTILLAS.ejecutiva,
  PLANTILLAS.coqueta,
  PLANTILLAS.elegante,
  PLANTILLAS.moderna,
  PLANTILLAS.clasica,
  PLANTILLAS.folio,
  PLANTILLAS.ats,
];

/** Genera el HTML del CV con la plantilla indicada en data.templateId (default: clasica). */
export function generarCV(data: CVData): string {
  const id = (data.templateId as TemplateId) || "clasica";
  const plantilla = PLANTILLAS[id] || PLANTILLAS.clasica;
  return plantilla.generar(data);
}
