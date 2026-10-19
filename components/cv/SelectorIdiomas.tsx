"use client";

/**
 * components/cv/SelectorIdiomas.tsx — Los idiomas del CV, sin fórmulas.
 *
 * Antes era un campo de texto con el formato "Español:95, Inglés:60" y una
 * nota: "Formato: Idioma:nivel (0-100)". Para quien no está acostumbrado a
 * pantallas (la gente que nos llega de las ONG, por ejemplo) eso es un examen.
 * Ahora es idioma + nivel en palabras, y se guarda en el MISMO texto de antes:
 * lib/cv-generator/normalizar.ts lo sigue leyendo igual y no se rompe ningún
 * CV ya hecho.
 */
import { useEffect, useState } from "react";
import { X } from "lucide-react";

const NIVELES = [
  { valor: 100, etiqueta: "Nativo" },
  { valor: 85, etiqueta: "Muy bien" },
  { valor: 65, etiqueta: "Bien" },
  { valor: 40, etiqueta: "Básico" },
];

interface Fila { idioma: string; nivel: number | null }

/** "Español:95, Inglés" → filas. Lo que no lleva número se queda sin nivel. */
export function leerIdiomas(texto: string): Fila[] {
  return String(texto || "").split(/[,\n]/).map(t => t.trim()).filter(Boolean).map(t => {
    const m = t.match(/^(.+?)\s*:\s*(\d{1,3})\s*$/);
    return m ? { idioma: m[1].trim(), nivel: Math.min(100, Number(m[2])) } : { idioma: t, nivel: null };
  });
}

export function escribirIdiomas(filas: Fila[]): string {
  return filas.filter(f => f.idioma.trim()).map(f => (f.nivel === null ? f.idioma.trim() : `${f.idioma.trim()}:${f.nivel}`)).join(", ");
}

/** El nivel de la lista más cercano al número guardado (95 → "Nativo"). */
const masCercano = (n: number) => NIVELES.reduce((a, b) => (Math.abs(b.valor - n) < Math.abs(a.valor - n) ? b : a)).valor;

export default function SelectorIdiomas({ valor, onChange }: { valor: string; onChange: (v: string) => void }) {
  // Estado propio para que una fila recién añadida, aún vacía, no desaparezca
  // (las filas sin idioma no se guardan en el texto).
  const [filas, setFilas] = useState<Fila[]>(() => leerIdiomas(valor));
  // Si el CV cambia desde fuera (cargar otro CV, subir un PDF), se vuelve a leer.
  useEffect(() => {
    setFilas(actuales => (escribirIdiomas(actuales) === valor ? actuales : leerIdiomas(valor)));
  }, [valor]);
  const cambiar = (nuevas: Fila[]) => { setFilas(nuevas); onChange(escribirIdiomas(nuevas)); };

  return (
    <div className="space-y-2">
      {filas.map((f, i) => (
        <div key={i} className="flex gap-2 items-center">
          <input
            id={`cv-idioma-${i}`}
            aria-label={`Idioma ${i + 1}`}
            value={f.idioma}
            placeholder="Idioma"
            onChange={e => cambiar(filas.map((x, j) => (j === i ? { ...x, idioma: e.target.value } : x)))}
            className="flex-1 min-w-0 px-3 py-2 rounded-lg text-sm"
            style={{ background: "#0f1117", border: "1px solid #2d3142", color: "#f1f5f9" }}
          />
          <select
            id={`cv-idioma-nivel-${i}`}
            aria-label={`Nivel de ${f.idioma || "este idioma"}`}
            value={f.nivel === null ? "" : masCercano(f.nivel)}
            onChange={e => cambiar(filas.map((x, j) => (j === i ? { ...x, nivel: e.target.value ? Number(e.target.value) : null } : x)))}
            className="px-2 py-2 rounded-lg text-sm"
            style={{ background: "#0f1117", border: "1px solid #2d3142", color: "#f1f5f9" }}
          >
            <option value="">Nivel…</option>
            {NIVELES.map(n => <option key={n.valor} value={n.valor}>{n.etiqueta}</option>)}
          </select>
          <button
            type="button"
            onClick={() => cambiar(filas.filter((_, j) => j !== i))}
            aria-label={`Quitar ${f.idioma || "este idioma"}`}
            className="p-1.5 rounded-lg shrink-0"
            style={{ color: "#64748b" }}
          >
            <X size={14} strokeWidth={2} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => cambiar([...filas, { idioma: filas.length ? "" : "Español", nivel: filas.length ? 65 : 100 }])}
        className="text-xs font-medium"
        style={{ color: "#22c55e" }}
      >
        + Añadir idioma
      </button>
    </div>
  );
}
