/**
 * lib/cursos/plazas/fuentes.ts — Plazas de cursos REALES, con fecha y centro,
 * sacadas de los datos abiertos de los servicios públicos de empleo.
 *
 * POR QUÉ ESTAS CINCO Y NO "TODA ESPAÑA". El SEPE no publica sus cursos como
 * datos (su catálogo abierto, mirado el 2026-10-07, solo tiene paro, contratos,
 * demandantes y prestaciones). Lo que hay son algunas comunidades que publican
 * los suyos. Se probaron todas las de datos.gob.es ese día y estas son las que
 * respondían con cursos que todavía no habían empezado:
 *
 *   · Lanbide (Euskadi) ................ 1.489 por empezar
 *   · Consorci Formació Contínua (CAT) .   611 (para gente que trabaja)
 *   · SEF (Región de Murcia) ...........   653
 *   · SOC (Cataluña) ...................   377
 *   · Navarra ..........................    12
 *
 * Descartadas el mismo día: Madrid (7.628 cursos pero SIN fechas y sin tocar
 * desde septiembre de 2025), Andalucía (36, ninguno por empezar), Canarias (un
 * RSS de 30 entradas, muchas para profesores), Castilla-La Mancha (solo un
 * buscador web, no datos).
 *
 * CADA FUENTE ES DISTINTA Y AQUÍ SE NOTA:
 *   · Lanbide va en Windows-1252, envuelto en una llamada JSONP, y fechas
 *     día/mes/año. Leído como UTF-8, "Formación" sale "Formaci�n".
 *   · El SOC da las fechas MES/día/año ("06/29/2026") y en catalán.
 *   · Murcia lo anida todo (municipio.provincia.codigo) y no trae enlace al curso.
 *   · El Consorci y Navarra son CSV con comillas y comas dentro de los campos.
 * Por eso cada una tiene su propio lector, y todas acaban en la misma forma.
 *
 * Los lectores son funciones puras (texto → plazas) para poder probarlas sin
 * red. La descarga va aparte, en descargarFuente().
 */

export type FuentePlaza = "lanbide" | "sef-murcia" | "soc" | "consorci" | "navarra" | "ecyl";

export interface PlazaCurso {
  /** fuente:codigo — único entre todas las fuentes. */
  id: string;
  fuente: FuentePlaza;
  codigo: string;
  titulo: string;
  familia: string | null;
  /** Código INE de provincia, dos cifras ("48" = Bizkaia). */
  provincia: string | null;
  municipio: string | null;
  centro: string | null;
  direccion: string | null;
  telefono: string | null;
  email: string | null;
  web: string | null;
  /** Página oficial donde apuntarse o informarse. Nunca vacío: si la fuente no
   *  da enlace del curso, se pone el buscador oficial de esa comunidad. */
  url: string;
  /** YYYY-MM-DD */
  inicio: string | null;
  fin: string | null;
  horas: number | null;
  modalidad: "presencial" | "online" | "mixta" | null;
  /** Solo si la fuente lo dice. null = no consta (no es lo mismo que "todos"). */
  dirigido: "desempleados" | "ocupados" | "todos" | null;
  certificado: boolean | null;
  estado: string | null;
}

export interface InfoFuente {
  nombre: string;
  comunidad: string;
  /** Lo que se cita como origen en cada plaza (atribución de los datos abiertos). */
  atribucion: string;
  url: string;
  /** Buscador oficial, para cuando la plaza no trae enlace propio. */
  buscador: string;
}

export const FUENTES: Record<FuentePlaza, InfoFuente> = {
  lanbide: {
    nombre: "Lanbide",
    comunidad: "Euskadi",
    atribucion: "Lanbide — Servicio Vasco de Empleo (datos abiertos)",
    url: "https://apps.lanbide.euskadi.net/apps/FR_CURSOS_ODE_JSON?jsonCallBack=nombre",
    buscador: "https://web.lanbide.eus/apps/FR_BUSQUEDA_CURSOS?LG=C&ML=FORMEN1",
  },
  "sef-murcia": {
    nombre: "SEF Murcia",
    comunidad: "Región de Murcia",
    atribucion: "Servicio Regional de Empleo y Formación de la Región de Murcia (datos abiertos)",
    url: "https://sefapps.carm.es/sefApps/rest/cursos/cursos-v2",
    buscador: "https://www.sefcarm.es/web/pagina?IDCONTENIDO=55&IDTIPO=1",
  },
  soc: {
    nombre: "SOC",
    comunidad: "Cataluña",
    atribucion: "Servei Públic d'Ocupació de Catalunya (dades obertes)",
    url: "https://oficinadetreball.gencat.cat/opendata/recursos/ofertaCursos.json",
    buscador: "https://serveiocupacio.gencat.cat/ca/persones/vull-formar-me/cercadors-formacio-especialitats/cercador-integrat",
  },
  consorci: {
    nombre: "Consorci de Formació Contínua",
    comunidad: "Cataluña",
    atribucion: "Consorci per a la Formació Contínua de Catalunya (dades obertes)",
    url: "https://analisi.transparenciacatalunya.cat/api/v3/views/qv5z-dgk3/export.csv?accessType=DOWNLOAD",
    buscador: "https://conforcat.gencat.cat/ca/inici",
  },
  ecyl: {
    nombre: "ECyL",
    comunidad: "Castilla y León",
    atribucion: "Servicio Público de Empleo de Castilla y León (datos abiertos, CC BY 4.0)",
    url: "https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets/formacion-del-ecyl/exports/json",
    buscador: "https://empleocastillayleon.jcyl.es/oficinavirtual/",
  },
  navarra: {
    nombre: "Servicio Navarro de Empleo",
    comunidad: "Navarra",
    atribucion: "Gobierno de Navarra — Servicio Navarro de Empleo (datos abiertos, CC BY 4.0)",
    url: "https://datosabiertos.navarra.es/datastore/dump/67eb396a-8389-405f-a07f-45ec1a1d862f?format=csv&bom=True",
    buscador: "https://www.navarra.es/es/empleo",
  },
};

// ─── Utilidades ─────────────────────────────────────────────────────────────

function limpio(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).replace(/\s+/g, " ").trim();
  if (!s || s === "null" || s === "undefined") return null;
  return s;
}

function entero(v: unknown): number | null {
  const s = limpio(v);
  if (!s) return null;
  const n = parseInt(s.replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Fecha a YYYY-MM-DD. `orden` dice cómo viene: "dma" (día/mes/año, España) o
 * "mda" (mes/día/año, el SOC). Se valida que exista de verdad: "31/02/2026" o
 * un mes 13 no pasan, en vez de convertirse en marzo sin avisar.
 */
export function fecha(v: unknown, orden: "dma" | "mda" | "amd" = "dma"): string | null {
  const s = limpio(v);
  if (!s) return null;
  const m = s.match(/(\d{1,4})[/.-](\d{1,2})[/.-](\d{1,4})/);
  if (!m) return null;
  let d: number, mes: number, a: number;
  if (orden === "amd" || m[1].length === 4) { a = +m[1]; mes = +m[2]; d = +m[3]; }
  else if (orden === "mda") { mes = +m[1]; d = +m[2]; a = +m[3]; }
  else { d = +m[1]; mes = +m[2]; a = +m[3]; }
  if (a < 2000 || a > 2100 || mes < 1 || mes > 12 || d < 1 || d > 31) return null;
  const f = new Date(Date.UTC(a, mes - 1, d));
  if (f.getUTCMonth() !== mes - 1) return null;
  return f.toISOString().slice(0, 10);
}

/** Provincia a partir de un código de municipio INE (5 cifras) o de la provincia. */
function provinciaDeMunicipio(cod: unknown): string | null {
  const s = limpio(cod);
  if (!s) return null;
  const d = s.replace(/\D/g, "");
  if (d.length >= 4) return d.padStart(5, "0").slice(0, 2);
  if (d.length >= 1 && d.length <= 2) return d.padStart(2, "0");
  return null;
}

const PROVINCIA_CATALANA: Record<string, string> = {
  BARCELONA: "08", GIRONA: "17", GERONA: "17", LLEIDA: "25", LERIDA: "25", "LLEIDA ": "25", TARRAGONA: "43",
};

function sinTildes(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function modalidadDe(v: unknown): PlazaCurso["modalidad"] {
  const s = sinTildes((limpio(v) ?? "").toLowerCase());
  if (!s) return null;
  if (/mixt|semipresencial/.test(s)) return "mixta";
  if (/tele|online|on-line|distancia|virtual|en linia|en linea/.test(s)) return "online";
  if (/presencial/.test(s)) return "presencial";
  return null;
}

/** Teléfono: solo dígitos y +, y al menos 9 cifras; si no, null. */
function telefono(v: unknown): string | null {
  const s = limpio(v);
  if (!s) return null;
  const t = s.replace(/[^\d+]/g, "");
  return t.replace(/\D/g, "").length >= 9 ? t : null;
}

function email(v: unknown): string | null {
  const s = limpio(v);
  if (!s) return null;
  const m = s.match(/[^\s@,;]+@[^\s@,;]+\.[a-z]{2,}/i);
  return m ? m[0].toLowerCase() : null;
}

/** Web: solo si de verdad parece una web (el SOC mete correos en ese campo). */
function web(v: unknown): string | null {
  const s = limpio(v);
  if (!s || s.includes("@")) return null;
  if (!/^[\w.-]+\.[a-z]{2,}/i.test(s.replace(/^https?:\/\//i, ""))) return null;
  return /^https?:\/\//i.test(s) ? s : `https://${s}`;
}

/** Títulos en MAYÚSCULAS a frase normal, respetando siglas y códigos. */
export function tituloLegible(t: string): string {
  let s = t.replace(/\s+/g, " ").trim().replace(/\.$/, "");
  // El SOC publica unidades sueltas como ": B_EOCJ0109_MF1360_Prevenció bàsica…".
  // Se deja el nombre delante y los códigos entre paréntesis, al final.
  const unidad = s.match(/^[:\s]*[A-Z]_([A-Z]{4}\d{4})_(MF\d{4}(?:_\d)?)_(.+)$/);
  if (unidad) s = `${unidad[3].trim()} (${unidad[1]} · ${unidad[2]})`;
  s = s.replace(/^[:\s]+/, "");
  // La proporción de mayúsculas se mide ANTES del paréntesis: en "INGLÉS B1
  // (SSCE03 - Especialidad completa)" la coletilla en minúsculas no debe
  // impedir que el nombre se pase a frase normal.
  const cabeza = s.split("(")[0];
  const letras = cabeza.replace(/[^A-Za-zÀ-ÿ]/g, "");
  const mayus = letras.replace(/[^A-ZÀ-Þ]/g, "").length;
  if (letras.length === 0 || mayus / letras.length < 0.7) return s;
  // Solo se pasa a frase la cabeza; el paréntesis (códigos como SSCE03 o
  // COML0008) se deja tal cual, que es como lo reconoce quien lo busca.
  const resto = s.slice(cabeza.length);
  const minus = cabeza.toLocaleLowerCase("es");
  const frase = minus.charAt(0).toLocaleUpperCase("es") + minus.slice(1)
    .replace(/\b(prl|tic|ia|pemp|cap|tpc|haccp|appcc|b1|b2|a1|a2|c1|ue|sap|erp|crm|pyme|pymes|ii|iii)\b/g, c => c.toUpperCase())
    .replace(/\b(excel|word|office|microsoft|google|linkedin|power bi|autocad|python|java)\b/g, c =>
      c.split(" ").map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(" "));
  return (frase + resto).replace(/\s+/g, " ").trim();
}

/** CSV con comillas dobles, comas dentro de campos y saltos de línea dentro de comillas. */
export function leerCsv(texto: string): Record<string, string>[] {
  const t = texto.replace(/^﻿/, "");
  const filas: string[][] = [];
  let campo = "", fila: string[] = [], dentro = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (dentro) {
      if (c === '"' && t[i + 1] === '"') { campo += '"'; i++; }
      else if (c === '"') dentro = false;
      else campo += c;
    } else if (c === '"') dentro = true;
    else if (c === ",") { fila.push(campo); campo = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && t[i + 1] === "\n") i++;
      fila.push(campo); campo = "";
      if (fila.some(x => x !== "")) filas.push(fila);
      fila = [];
    } else campo += c;
  }
  if (campo !== "" || fila.length) { fila.push(campo); if (fila.some(x => x !== "")) filas.push(fila); }
  if (filas.length < 2) return [];
  const cab = filas[0].map(h => h.trim());
  return filas.slice(1).map(f => Object.fromEntries(cab.map((h, i) => [h, f[i] ?? ""])));
}

// ─── Lectores, uno por fuente ───────────────────────────────────────────────

/** Lanbide: JSONP `nombre([...])` en Windows-1252 (llega ya decodificado a texto). */
export function leerLanbide(texto: string): PlazaCurso[] {
  const json = texto.trim().replace(/^[\w$]+\(/, "").replace(/\);?\s*$/, "");
  const filas = JSON.parse(json) as Record<string, string>[];
  const MODALIDAD: Record<string, PlazaCurso["modalidad"]> = { "1": "presencial", "2": "online", "3": "mixta" };
  return filas.flatMap(r => {
    const codigo = limpio(r.codigo);
    const titulo = limpio(r.titulo);
    if (!codigo || !titulo) return [];
    return [{
      id: `lanbide:${codigo}`,
      fuente: "lanbide" as const,
      codigo,
      titulo: tituloLegible(titulo),
      familia: null,
      provincia: provinciaDeMunicipio(r.codprov),
      municipio: limpio(r.municipio),
      centro: limpio(r.centro),
      direccion: null,
      telefono: null,
      email: null,
      web: null,
      url: limpio(r.url)?.startsWith("http") ? limpio(r.url)! : FUENTES.lanbide.buscador,
      inicio: fecha(r.f_inicio, "dma"),
      fin: fecha(r.f_fin, "dma"),
      horas: entero(r.horas),
      modalidad: MODALIDAD[r.modalidad] ?? null,
      // El campo "colectivo" (01, 02, 04) no está documentado en la ficha de
      // datos abiertos. No se traduce a "desempleados"/"ocupados" a ojo.
      dirigido: null,
      certificado: /especialidad completa/i.test(titulo) && /\b[A-Z]{4}\d{4}\b/.test(titulo) ? true : null,
      estado: null,
    }];
  });
}

/** SEF Murcia: JSON anidado, fechas día/mes/año. */
export function leerMurcia(texto: string): PlazaCurso[] {
  const filas = JSON.parse(texto) as any[];
  return filas.flatMap(r => {
    const codigo = limpio(r.id) ?? limpio(r.expediente);
    const titulo = limpio(r.denominacion);
    if (!codigo || !titulo) return [];
    const centro = r.domicilioCentro ?? {};
    const programa = sinTildes((limpio(r.programaTxt) ?? "").toLowerCase());
    const dir = [centro?.tipoVia?.vdenomina, centro?.vnombrevia, centro?.nnu1].map(limpio).filter(Boolean).join(" ");
    return [{
      id: `sef-murcia:${codigo}`,
      fuente: "sef-murcia" as const,
      codigo,
      titulo: tituloLegible(titulo),
      familia: limpio(r.familiaProfesional?.denominacion),
      provincia: provinciaDeMunicipio(r.municipio?.provincia?.codigo ?? r.municipio?.codigo),
      municipio: limpio(r.municipio?.municipio),
      centro: limpio(r.centroImparticion) ?? limpio(r.entidadTxt),
      direccion: dir || null,
      telefono: telefono(centro?.vtlfijo) ?? telefono(centro?.vtlmovil) ?? telefono(r.domicilioEntidad?.vtlfijo),
      email: email(r.emailEntidad),
      web: null,
      url: FUENTES["sef-murcia"].buscador,
      inicio: fecha(r.fechaInicio, "dma"),
      fin: fecha(r.fechaFin, "dma"),
      horas: entero(r.duracion),
      modalidad: modalidadDe(r.modalidad?.denominacion),
      dirigido: programa === "desempleados" ? "desempleados" : programa === "ocupados" ? "ocupados" : null,
      certificado: r.certificadoProf === true ? true : r.certificadoProf === false ? false : null,
      estado: null,
    }];
  });
}

/** SOC: JSON plano, en catalán, fechas MES/día/año. */
export function leerSoc(texto: string): PlazaCurso[] {
  const filas = JSON.parse(texto) as Record<string, string>[];
  return filas.flatMap(r => {
    const codigo = limpio(r.curs) ?? limpio(r.identificador_curs);
    const titulo = limpio(r.especialitat_formativa);
    if (!codigo || !titulo) return [];
    const prov = sinTildes((limpio(r.provincia_especialitat) ?? "").toUpperCase());
    return [{
      id: `soc:${codigo}`,
      fuente: "soc" as const,
      codigo,
      titulo: tituloLegible(titulo),
      familia: null,
      provincia: PROVINCIA_CATALANA[prov] ?? null,
      municipio: limpio(r.municipi_especialitat),
      centro: limpio(r.nom_centre),
      direccion: limpio(r.adreca_curs) ?? limpio(r.adreca_centre),
      telefono: telefono(r.telefon_centre),
      email: email(r.web_centre),
      web: web(r.web_centre),
      url: FUENTES.soc.buscador,
      inicio: fecha(r.data_inici, "mda"),
      fin: fecha(r.data_fi, "mda"),
      horas: entero(r.hores),
      modalidad: modalidadDe(r.modalitat),
      // "Formació ocupacional" es la de personas en paro (lo dice el propio SOC).
      dirigido: /ocupacional/i.test(r.tipus ?? "") ? "desempleados" : null,
      certificado: null,
      estado: limpio(r.estat_curs),
    }];
  });
}

/** Consorci per a la Formació Contínua: CSV, fechas día/mes/año, para gente que trabaja. */
export function leerConsorci(texto: string): PlazaCurso[] {
  return leerCsv(texto).flatMap(r => {
    // IDENTIFICADOR + grupo no basta: el mismo grupo sale varias veces con
    // distinta fecha de inicio (80 casos el 2026-10-07). La fecha entra en la clave.
    const codigo = limpio(r.IDENTIFICADOR)
      ? [limpio(r.IDENTIFICADOR), limpio(r.NUM_GRUP), fecha(r.DATA_INICI, "dma")].filter(Boolean).join("-")
      : null;
    const titulo = limpio(r.DENOMINACIO);
    if (!codigo || !titulo) return [];
    return [{
      id: `consorci:${codigo}`,
      fuente: "consorci" as const,
      codigo,
      titulo: tituloLegible(titulo),
      familia: limpio(r.FAMILIA_PROFESSIONAL),
      provincia: provinciaDeMunicipio(r.CODI_MUNICIPI),
      municipio: limpio(r.NOM_MUNICIPI),
      centro: limpio(r["NOM_ENTITAT_FORMACIÓ"]) ?? limpio(r.NOM_ENTITAT_FORMACIO),
      direccion: null,
      telefono: telefono(r["TELÈFON"] ?? r.TELEFON),
      email: email(r.EMAIL),
      web: web(r.WEB),
      url: web(r.WEB) ?? FUENTES.consorci.buscador,
      inicio: fecha(r.DATA_INICI, "dma"),
      fin: fecha(r.DATA_FINAL, "dma"),
      horas: entero(r.HORES),
      modalidad: modalidadDe(r.MODALITAT),
      dirigido: "ocupados",
      certificado: null,
      estado: null,
    }];
  });
}

/** Navarra: CSV con BOM, fechas día/mes/año (o año-mes-día según el volcado). */
export function leerNavarra(texto: string): PlazaCurso[] {
  return leerCsv(texto).flatMap(r => {
    const codigo = limpio(r.CODIGO) ?? limpio(r._id);
    const titulo = limpio(r["TITULO DEL CURSO"]);
    if (!codigo || !titulo) return [];
    // Vienen como 1/0 (comprobado el 2026-10-07); se acepta también Sí/No por si cambian.
    const des = /^(1|s|true)/i.test(r.DESEMPLEADOS ?? ""), ocu = /^(1|s|true)/i.test(r.OCUPADOS ?? "");
    const enlace = limpio(r.ENLACE);
    return [{
      id: `navarra:${codigo}`,
      fuente: "navarra" as const,
      codigo,
      titulo: tituloLegible(titulo),
      familia: limpio(r.FAMILIA),
      provincia: "31",
      municipio: limpio(r["LOCALIDAD DE IMPARTICION"]),
      centro: limpio(r["CENTRO DE IMPARTICION"]) ?? limpio(r.ORGANIZADOR),
      direccion: null,
      telefono: telefono(r.TELEFONO_CONTACTO),
      email: null,
      web: null,
      url: enlace && /^https?:\/\//i.test(enlace) ? enlace : FUENTES.navarra.buscador,
      inicio: fecha(r["FECHA DE INICIO"], "dma"),
      fin: fecha(r["FECHA DE FIN"], "dma"),
      horas: entero(r["DURACION (HORAS)"]),
      modalidad: modalidadDe(r["DESCRIPCION MODALIDAD"] ?? r.MODALIDAD),
      dirigido: des && ocu ? "todos" : des ? "desempleados" : ocu ? "ocupados" : null,
      certificado: null,
      estado: null,
    }];
  });
}

/**
 * Texto con las tildes rotas desde el origen ("FACTURACIÃ\u0093N"): UTF-8 que
 * alguien leyó como Latin-1 y volvió a guardar. Solo se toca si tiene esa
 * huella; aplicarlo a un texto bien escrito lo estropearía.
 */
export function arreglarTildes(s: string | null | undefined): string | null {
  if (!s) return s ?? null;
  if (!/[ÃÂ][\u0080-¿]/.test(s)) return s;
  const arreglado = Buffer.from(s, "latin1").toString("utf8");
  return arreglado.includes("�") ? s : arreglado;
}

const MESES_ES: Record<string, number> = {
  enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6, julio: 7, agosto: 8,
  septiembre: 9, setiembre: 9, octubre: 10, noviembre: 11, diciembre: 12,
};

/** "desde el 11 de septiembre de 2023 (previsto) hasta el 02 de octubre de 2023" */
function fechaEnTexto(texto: string | null, palabra: "desde" | "hasta"): string | null {
  const m = (texto ?? "").toLowerCase().match(new RegExp(`${palabra} el (\\d{1,2}) de ([a-záéíóú]+) de (\\d{4})`));
  if (!m || !MESES_ES[m[2]]) return null;
  return fecha(`${m[1]}/${MESES_ES[m[2]]}/${m[3]}`, "dma");
}

/**
 * ECyL (Castilla y León): JSON de su portal de datos abiertos (CC BY 4.0).
 *   · Tildes rotas en parte de los registros (164 de 437 el 2026-10-08).
 *   · La fecha a veces solo viene en texto ("desde el 11 de septiembre…").
 *   · El enlace de cada curso apunta a gestorcontenidos.jcyl.es, que no existe
 *     desde fuera; la misma ruta en empleo.jcyl.es abre la ficha pública.
 *   · Las que empiezan por "PNL" son prácticas no laborales en empresas, no
 *     cursos: enseñarlas como "plaza de curso" sería engañar.
 */
export function leerEcyl(texto: string): PlazaCurso[] {
  const filas = JSON.parse(texto) as Record<string, any>[];
  return filas.flatMap(r => {
    const codigo = limpio(r.identificador);
    const titulo = arreglarTildes(limpio(r.titulo));
    if (!codigo || !titulo || /^pnl\b/i.test(titulo)) return [];
    const lugar = arreglarTildes(limpio(r.lugar_de_celebracion)) ?? "";
    const colectivos = ([] as string[]).concat(r.colectivo_destinatario ?? []).join(" ").toLowerCase();
    const des = /desemplead/.test(colectivos), ocu = /ocupad|trabajador/.test(colectivos);
    const enlace = limpio(r.enlace_al_contenido)?.replace(/^https?:\/\/gestorcontenidos\.jcyl\.es\//, "https://empleo.jcyl.es/");
    const programa = arreglarTildes(limpio(r.programadeformacion)) ?? "";
    return [{
      id: `ecyl:${codigo}`,
      fuente: "ecyl" as const,
      codigo,
      titulo: tituloLegible(titulo),
      familia: arreglarTildes(limpio(r.materia)),
      provincia: provinciaDeMunicipio(r.codigo_localidad),
      municipio: arreglarTildes(limpio(r.localidad_)),
      centro: limpio(lugar.split(",")[0]),
      direccion: limpio(lugar.replace(/,?\s*Tfno:.*$/i, "").split(",").slice(1).join(",")),
      telefono: telefono((lugar.match(/Tfno:\s*([\d\s]+)/i) || [])[1]),
      email: null,
      web: null,
      url: enlace && /^https:\/\/empleo\.jcyl\.es\//.test(enlace) ? enlace : FUENTES.ecyl.buscador,
      inicio: fecha(r.fecha_de_inicio, "amd") ?? fechaEnTexto(r.fechas_de_desarrollo, "desde"),
      fin: fecha(r.fecha_de_finalizacion, "amd") ?? fechaEnTexto(r.fechas_de_desarrollo, "hasta"),
      horas: entero(r.duracion),
      modalidad: modalidadDe(arreglarTildes(limpio(r.tipo_formacion))),
      dirigido: des && ocu ? "todos" : des ? "desempleados" : ocu ? "ocupados" : null,
      certificado: /certificado de profesionalidad/i.test(programa) ? true : null,
      estado: null,
    }];
  });
}

const LECTORES: Record<FuentePlaza, (texto: string) => PlazaCurso[]> = {
  lanbide: leerLanbide,
  "sef-murcia": leerMurcia,
  soc: leerSoc,
  consorci: leerConsorci,
  navarra: leerNavarra,
  ecyl: leerEcyl,
};

/**
 * Descarga y lee una fuente. Lanzar error si falla: quien llama decide qué
 * hacer, y lo que NO debe hacer es borrar las plazas de esa fuente porque un
 * día no respondió.
 */
export async function descargarFuente(fuente: FuentePlaza): Promise<PlazaCurso[]> {
  const res = await fetch(FUENTES[fuente].url, {
    headers: { "User-Agent": "BuscayCurra/1.0 (+https://buscaycurra.es; datos abiertos de formacion)" },
    redirect: "follow",
    signal: AbortSignal.timeout(90_000),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`${fuente}: HTTP ${res.status}`);
  const plazas = LECTORES[fuente](decodificar(new Uint8Array(await res.arrayBuffer())));
  if (plazas.length === 0) throw new Error(`${fuente}: respondió pero sin ninguna plaza legible`);
  return sinRepetidos(plazas);
}

/**
 * Texto a partir de los bytes, sin fiarse de lo que declare el servidor. Lanbide
 * dice Windows-1252 y lo cumple; el SOC no dice nada y TAMBIÉN va en
 * Windows-1252 ("ESTÈTIQUES" leído como UTF-8 sale "EST�TIQUES"). Así que se
 * intenta UTF-8 estricto y, si algún byte no cuadra, Windows-1252.
 */
export function decodificar(bytes: Uint8Array): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return new TextDecoder("windows-1252").decode(bytes);
  }
}

/**
 * Una plaza por id. El SOC publica algunos cursos dos veces, idénticos salvo el
 * título en mayúsculas o no (61 el 2026-10-07); sin esto salen repetidos en la
 * lista y el upsert falla por meter el mismo id dos veces en la misma tanda.
 */
export function sinRepetidos(plazas: PlazaCurso[]): PlazaCurso[] {
  const vistos = new Map<string, PlazaCurso>();
  for (const p of plazas) if (!vistos.has(p.id)) vistos.set(p.id, p);
  return [...vistos.values()];
}

export const TODAS_LAS_FUENTES = Object.keys(FUENTES) as FuentePlaza[];
