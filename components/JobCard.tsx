"use client";

/**
 * components/JobCard.tsx — Tarjeta de oferta de trabajo
 *
 * Muestra la información de una oferta con:
 *   - Título del puesto, empresa y ubicación
 *   - Salario (si está disponible)
 *   - Badge de la fuente (InfoJobs, LinkedIn, etc.)
 *   - Botón "Ver oferta" → abre la URL original en nueva pestaña
 *   - Botón "Enviar CV" naranja → redirige a /app/envios con la empresa
 *
 * Colores de marca: azul #2563EB y naranja #F97316.
 */

import Link from "next/link";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface PropiedadesJobCard {
  id: string;
  titulo: string;
  empresa: string;
  ubicacion: string;
  salario?: string;
  fuente?: string;
  url: string;
  modalidad?: "presencial" | "remoto" | "hibrido";
  descripcion?: string;
}

// ─── Colores por fuente de empleo ─────────────────────────────────────────────
function colorFuente(fuente: string): string {
  const mapa: Record<string, string> = {
    infojobs: "bg-blue-100 text-blue-700",
    linkedin: "bg-sky-100 text-sky-700",
    indeed: "bg-purple-100 text-purple-700",
    tecnoempleo: "bg-green-100 text-green-700",
    computrabajo: "bg-orange-100 text-orange-700",
  };
  return mapa[fuente.toLowerCase()] || "bg-gray-100 text-gray-600";
}

// ─── Componente Principal ─────────────────────────────────────────────────────

export default function JobCard({
  titulo,
  empresa,
  ubicacion,
  salario,
  fuente = "Otro",
  url,
  modalidad,
  descripcion,
}: PropiedadesJobCard) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-4 hover:shadow-md transition">

      {/* ── Cabecera: fuente y modalidad ──────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Badge de fuente */}
        <span
          className={`text-xs font-medium px-2.5 py-1 rounded-full ${colorFuente(fuente)}`}
        >
          {fuente}
        </span>
        {/* Badge de modalidad (si está disponible) */}
        {modalidad && (
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 capitalize">
            {modalidad}
          </span>
        )}
      </div>

      {/* ── Contenido principal ───────────────────────────────────────── */}
      <div>
        <h3 className="font-semibold text-gray-900 text-base leading-snug">{titulo}</h3>
        <p className="text-sm text-gray-600 mt-1">{empresa}</p>
        {/* Ubicación */}
        <div className="flex items-center gap-1 mt-2 text-sm text-gray-500">
          <span>📍</span>
          <span>{ubicacion}</span>
        </div>
        {/* Salario (si existe) */}
        {salario && (
          <div className="flex items-center gap-1 mt-1 text-sm font-medium text-green-700">
            <span>💰</span>
            <span>{salario}</span>
          </div>
        )}
        {/* Descripción corta (si existe) */}
        {descripcion && (
          <p className="text-xs text-gray-400 mt-2 line-clamp-2 leading-relaxed">
            {descripcion}
          </p>
        )}
      </div>

      {/* ── Acciones ──────────────────────────────────────────────────── */}
      <div className="flex gap-2 mt-auto">
        {/* Botón "Ver oferta" — abre la URL en nueva pestaña */}
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 text-center py-2.5 text-sm font-medium rounded-xl border transition hover:bg-gray-50"
          style={{ borderColor: "#2563EB", color: "#2563EB" }}
        >
          Ver oferta
        </a>
        {/* Botón "Enviar CV" — va al módulo de envíos con la empresa precargada */}
        <Link
          href={`/app/envios?empresa=${encodeURIComponent(empresa)}`}
          className="flex-1 text-center py-2.5 text-sm font-medium text-white rounded-xl transition hover:opacity-90"
          style={{ backgroundColor: "#F97316" }}
        >
          Enviar CV
        </Link>
      </div>
    </div>
  );
}
