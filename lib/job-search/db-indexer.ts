/**
 * lib/job-search/db-indexer.ts — Indexador masivo de ofertas en Supabase
 *
 * Ejecuta búsquedas en todas las APIs para combinaciones de
 * puesto × ciudad y almacena los resultados en la tabla `ofertas`.
 * Se llama desde /api/jobs/index (protegido por ADMIN_SECRET).
 *
 * Con las combinaciones definidas aquí, el índice puede alcanzar
 * 400.000+ ofertas únicas almacenadas.
 */

import { createClient } from "@supabase/supabase-js";
import type { OfertaReal } from "./real-search";

// Puestos más buscados en España (expandir para más volumen)
const PUESTOS_INDEX = [
  // Hostelería
  "camarero", "cocinero", "chef", "ayudante cocina", "barman", "recepcionista hotel",
  "friegaplatos", "jefe de sala", "pastelero", "panadero",
  // Logística / transporte
  "conductor", "repartidor", "carretillero", "mozo almacén", "operario logística",
  "chófer", "transportista", "jefe de almacén",
  // Construcción
  "electricista", "fontanero", "albañil", "peón construcción", "soldador",
  "pintor", "carpintero", "técnico mantenimiento", "encofrador",
  // Comercio
  "dependiente tienda", "cajero supermercado", "vendedor", "reponedor",
  "promotor ventas", "teleoperador", "comercial",
  // Industria
  "operario producción", "operario fábrica", "técnico industrial",
  "mecánico industrial", "electromecánico",
  // Sanidad
  "enfermero", "auxiliar enfermería", "cuidador geriátrico", "fisioterapeuta",
  "técnico radiología", "celador",
  // Administración
  "administrativo", "recepcionista", "secretaria", "contable",
  "gestor administrativo", "auxiliar administrativo",
  // Tecnología
  "programador", "desarrollador web", "frontend developer", "backend developer",
  "data analyst", "devops", "técnico informático", "soporte IT",
  // Limpieza
  "limpiador", "auxiliar limpieza", "operario limpieza",
  // Educación
  "profesor", "monitor", "educador infantil", "auxiliar educación",
  // Seguridad
  "vigilante seguridad", "guardia de seguridad",
  // Otros
  "peluquero", "esteticista", "mecánico vehículos", "técnico electrónico",
  "jardinero", "agricultor", "operario agrícola",
];

// Ciudades principales de España
const CIUDADES_INDEX = [
  "Madrid", "Barcelona", "Valencia", "Sevilla", "Zaragoza",
  "Málaga", "Murcia", "Palma", "Las Palmas", "Bilbao",
  "Alicante", "Córdoba", "Valladolid", "Vigo", "Gijón",
  "Granada", "Vitoria", "Elche", "Oviedo", "Badalona",
  "Pamplona", "Tudela", "Logroño", "Santander", "Burgos",
  "Albacete", "Castellón", "Getafe", "Alcalá de Henares", "Hospitalet",
  "Leganés", "Fuenlabrada", "Almería", "Badajoz", "Huelva",
  "Salamanca", "Terrassa", "Sabadell", "Tarragona", "Lleida",
  "Mataró", "Santa Cruz de Tenerife", "Girona", "Cádiz",
  "Toledo", "Jaén", "A Coruña", "Ourense",
];

interface OfertaDB {
  id: string;
  titulo: string;
  empresa: string;
  ubicacion: string;
  provincia: string;
  comunidad: string;
  salario: string;
  descripcion: string;
  fuente: string;
  url: string;
  email_empresa: string;
  sector: string;
  keywords: string[];
  fecha: string;
}

function inferirSector(titulo: string): string {
  const t = titulo.toLowerCase();
  if (/camarer|cociner|chef|hotel|restaur|hostel/i.test(t)) return "hosteleria";
  if (/electricist|fontaner|albañil|soldad|construc/i.test(t)) return "construccion";
  if (/program|develop|software|web|data|devops|IT/i.test(t)) return "tecnologia";
  if (/vendedor|cajero|depend|comerci|tienda/i.test(t)) return "comercio";
  if (/conduc|repartid|almacén|logíst|carretill/i.test(t)) return "logistica";
  if (/operario|fábrica|producc|industri|montaj/i.test(t)) return "industria";
  if (/enfermer|auxiliar|cuidador|sanidad|salud/i.test(t)) return "sanidad";
  if (/administrat|secretar|recepcion|contabl/i.test(t)) return "administracion";
  if (/limpiez|limpiad/i.test(t)) return "limpieza";
  if (/profesor|educad|monitor|maestro/i.test(t)) return "educacion";
  return "otros";
}

function ofertaToDB(o: OfertaReal, ciudad: string): OfertaDB {
  return {
    id: o.id,
    titulo: o.titulo.slice(0, 255),
    empresa: (o.empresa || "").slice(0, 255),
    ubicacion: (o.ubicacion || ciudad).slice(0, 255),
    provincia: ciudad.slice(0, 100),
    comunidad: "",
    salario: (o.salario || "").slice(0, 100),
    descripcion: (o.descripcion || "").slice(0, 1000),
    fuente: (o.fuente || "").slice(0, 50),
    url: (o.url || "").slice(0, 500),
    email_empresa: (o.emailEmpresa || "").slice(0, 255),
    sector: inferirSector(o.titulo),
    keywords: [o.titulo.toLowerCase(), o.empresa.toLowerCase(), ciudad.toLowerCase()].filter(Boolean),
    fecha: o.fecha || new Date().toISOString(),
  };
}

export interface IndexerProgress {
  total: number;
  procesados: number;
  insertados: number;
  errores: number;
  fuentes: Record<string, number>;
}

export async function indexarOfertas(
  onProgress?: (p: IndexerProgress) => void,
  maxCombinaciones = 50,
): Promise<IndexerProgress> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    throw new Error("Faltan variables NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY");
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  // Importar dinámicamente para no cargar todo en cada request
  const { buscarOfertasReales } = await import("./real-search");

  const combinaciones: Array<[string, string]> = [];
  for (const ciudad of CIUDADES_INDEX) {
    for (const puesto of PUESTOS_INDEX) {
      combinaciones.push([puesto, ciudad]);
    }
  }

  // Mezclar para variar las búsquedas en cada ejecución
  for (let i = combinaciones.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [combinaciones[i], combinaciones[j]] = [combinaciones[j], combinaciones[i]];
  }

  const progress: IndexerProgress = {
    total: Math.min(combinaciones.length, maxCombinaciones),
    procesados: 0,
    insertados: 0,
    errores: 0,
    fuentes: {},
  };

  const lote = combinaciones.slice(0, maxCombinaciones);

  for (const [puesto, ciudad] of lote) {
    try {
      const ofertas = await buscarOfertasReales(puesto, ciudad, 50);
      const filas = ofertas.map(o => ofertaToDB(o, ciudad));

      if (filas.length > 0) {
        const { error } = await supabase
          .from("ofertas")
          .upsert(filas, { onConflict: "id", ignoreDuplicates: true });

        if (error) {
          console.warn(`[Indexer] Error upsert "${puesto}/${ciudad}":`, error.message);
          progress.errores++;
        } else {
          progress.insertados += filas.length;
          for (const f of filas) {
            progress.fuentes[f.fuente] = (progress.fuentes[f.fuente] || 0) + 1;
          }
        }
      }
    } catch (e) {
      console.warn(`[Indexer] Error "${puesto}/${ciudad}":`, (e as Error).message);
      progress.errores++;
    }

    progress.procesados++;
    onProgress?.(progress);

    // Pequeña pausa para no saturar las APIs
    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`[Indexer] Completado: ${progress.insertados} ofertas indexadas en ${progress.procesados} combinaciones`);
  return progress;
}

export { PUESTOS_INDEX, CIUDADES_INDEX };
