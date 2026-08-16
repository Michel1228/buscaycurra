"use client";

/**
 * components/EmpresasDeLaZona.tsx — Los sitios de tu ciudad donde dejar el CV.
 *
 * POR QUÉ EXISTE. Buscar ofertas y buscar empresas eran dos apartados
 * separados, y el usuario tenía que saber por su cuenta que si busca de
 * camarero le interesan los bares de su ciudad. Ahora aparecen debajo de las
 * ofertas, en la misma búsqueda: las ofertas publicadas y, además, los sitios
 * a los que puede escribir aunque no hayan publicado nada.
 *
 * OJO CON EL GASTO, que es lo que decide el diseño de este componente. Los
 * datos vienen de Google Places, que se paga por consulta. Si se cargara solo
 * al buscar, cada búsqueda de la aplicación costaría dinero aunque el usuario
 * ni mire esta parte. Por eso NO se llama a nada hasta que se pulsa el botón:
 * la interfaz está unificada, pero solo se paga cuando alguien lo pide de
 * verdad. Por detrás, /api/empresas/zona ya guarda en caché lo consultado y
 * tiene un tope diario, así que la segunda persona que busque bares en Logroño
 * no vuelve a costar.
 */

import { useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { NOMBRE_SECTOR } from "@/lib/job-search/oficio-a-sector";

interface Empresa {
  placeId?: string;
  nombre: string;
  telefono: string | null;
  emailRrhh: string | null;
  emailContacto: string | null;
  urlWeb: string | null;
  fotos?: string[];
  googleRating?: number | null;
  googleReviews?: number | null;
  googleAddress?: string | null;
  googleMapsUrl?: string | null;
  abiertoAhora?: boolean | null;
}

export default function EmpresasDeLaZona({
  sector, ciudad, oficio,
}: { sector: string; ciudad: string; oficio: string }) {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [cargando, setCargando] = useState(false);
  const [pedido, setPedido] = useState(false);
  const [error, setError] = useState("");

  const info = NOMBRE_SECTOR[sector];
  if (!info || !ciudad) return null;

  async function buscar() {
    setCargando(true);
    setPedido(true);
    setError("");
    try {
      const { data: { session } } = await getSupabaseBrowser().auth.getSession();
      const res = await fetch("/api/empresas/zona", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ ciudad, sector, limite: 12 }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No he podido traer las empresas ahora mismo.");
        return;
      }
      setEmpresas(data.empresas || []);
    } catch {
      setError("No he podido conectar. Inténtalo en un momento.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="card-game p-5 mt-6">
      <div className="flex items-start gap-3 flex-wrap">
        <span className="text-2xl">{info.emoji}</span>
        <div className="flex-1 min-w-[200px]">
          <p className="font-bold text-sm" style={{ color: "#f1f5f9" }}>
            {info.sitios.charAt(0).toUpperCase() + info.sitios.slice(1)} de {ciudad}
          </p>
          <p className="text-xs mt-1" style={{ color: "#94a3b8" }}>
            Sitios donde se busca gente de {oficio} aunque no hayan publicado
            oferta. Con su teléfono y su dirección, para escribirles tú.
          </p>
        </div>
        {!pedido && (
          <button onClick={buscar} className="btn-game text-xs !py-2 !px-4">
            Ver los sitios
          </button>
        )}
      </div>

      {cargando && (
        <p className="text-xs mt-4" style={{ color: "#64748b" }}>
          Buscando en Google Maps…
        </p>
      )}

      {error && (
        <p className="text-xs mt-4" style={{ color: "#ef4444" }}>{error}</p>
      )}

      {!cargando && pedido && !error && empresas.length === 0 && (
        <p className="text-xs mt-4" style={{ color: "#64748b" }}>
          No he encontrado {info.sitios} en {ciudad}. Prueba con la capital de tu provincia.
        </p>
      )}

      {empresas.length > 0 && (
        <div className="grid gap-3 mt-4 sm:grid-cols-2">
          {empresas.map((e, i) => (
            <div key={e.placeId || `${e.nombre}-${i}`} className="rounded-lg overflow-hidden"
              style={{ background: "#1e212b", border: "1px solid #2d3142" }}>
              {/* La foto entra la primera: un bar se reconoce por la foto
                  antes que por el nombre, y da confianza para escribirles. */}
              {e.fotos?.[0] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={e.fotos[0]} alt={e.nombre} loading="lazy"
                  className="w-full h-28 object-cover" />
              )}
              <div className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-xs" style={{ color: "#f1f5f9" }}>{e.nombre}</p>
                  {typeof e.googleRating === "number" && (
                    <span className="text-[10px] whitespace-nowrap" style={{ color: "#f59e0b" }}>
                      ⭐ {e.googleRating}
                      {e.googleReviews ? <span style={{ color: "#64748b" }}> ({e.googleReviews})</span> : null}
                    </span>
                  )}
                </div>
                {e.googleAddress && (
                  <p className="text-[10px] mt-1" style={{ color: "#64748b" }}>📍 {e.googleAddress}</p>
                )}
                {e.abiertoAhora === true && (
                  <p className="text-[10px] mt-1" style={{ color: "#22c55e" }}>● Abierto ahora</p>
                )}
                <div className="flex flex-wrap gap-2 mt-2.5">
                  {e.telefono && (
                    <a href={`tel:${e.telefono}`} className="text-[10px] px-2 py-1 rounded"
                      style={{ background: "#22c55e", color: "#0f1117", fontWeight: 600 }}>
                      📞 Llamar
                    </a>
                  )}
                  {(e.emailRrhh || e.emailContacto) && (
                    <a href={`/app/empresas?empresa=${encodeURIComponent(e.nombre)}&ciudad=${encodeURIComponent(ciudad)}`}
                      className="text-[10px] px-2 py-1 rounded"
                      style={{ background: "#1e212b", color: "#f1f5f9", border: "1px solid #2d3142" }}>
                      ✉️ Enviar mi CV
                    </a>
                  )}
                  {e.googleMapsUrl && (
                    <a href={e.googleMapsUrl} target="_blank" rel="noopener noreferrer"
                      className="text-[10px] px-2 py-1 rounded"
                      style={{ background: "#1e212b", color: "#94a3b8", border: "1px solid #2d3142" }}>
                      Mapa
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
