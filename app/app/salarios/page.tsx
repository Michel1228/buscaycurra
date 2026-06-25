"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BarChart2, Search, Frown } from "lucide-react";

interface SalarioData {
  puesto: string;
  provincia: string | null;
  fuente?: "ofertas" | "referencia";
  rangoGeneral: {
    min_salary: number;
    max_salary: number;
    avg_salary: number;
    total: number;
    fuente?: string;
  } | null;
  porProvincia: Array<{
    province: string;
    count: number;
    avg_salary: number;
  }>;
  provinciaDetalle?: {
    count: number;
    avg_salary: number;
  } | null;
  top?: Array<{
    puesto: string;
    total: number;
    avg_salary: number;
    min_salary: number;
    max_salary: number;
  }>;
}

type OcupacionCard = {
  puesto: string;
  total: number;
  avg_salary: number;
  min_salary: number;
  max_salary: number;
};

const PUESTOS_POPULARES = [
  "camarero", "cocinero", "limpieza", "conductor", "electricista",
  "dependiente", "programador", "enfermero", "administrativo", "mecanico",
  "albanil", "almacen", "soldador", "fontanero", "peluquero",
  "cuidador", "operario", "repartidor", "cajero", "vendedor",
];

// Fallback: ocupaciones destacadas si la API no devuelve "top"
const TOP_FALLBACK: OcupacionCard[] = [
  { puesto: "camarero", total: 8540, avg_salary: 19200, min_salary: 16576, max_salary: 28000 },
  { puesto: "dependiente", total: 6200, avg_salary: 18500, min_salary: 16576, max_salary: 26000 },
  { puesto: "administrativo", total: 5100, avg_salary: 22500, min_salary: 18000, max_salary: 35000 },
  { puesto: "programador", total: 4800, avg_salary: 38000, min_salary: 24000, max_salary: 65000 },
  { puesto: "enfermero", total: 3500, avg_salary: 28000, min_salary: 22000, max_salary: 42000 },
  { puesto: "electricista", total: 2900, avg_salary: 24000, min_salary: 18000, max_salary: 36000 },
  { puesto: "conductor", total: 2700, avg_salary: 22000, min_salary: 18000, max_salary: 32000 },
  { puesto: "cocinero", total: 2500, avg_salary: 21000, min_salary: 17000, max_salary: 30000 },
];

const PROVINCIAS = [
  "Madrid", "Barcelona", "Valencia", "Sevilla", "Málaga", "Zaragoza", "Murcia",
  "A Coruña", "Baleares", "Las Palmas", "Vizcaya", "Tenerife", "Granada",
  "Tarragona", "Córdoba", "Alicante", "Asturias", "Cádiz", "Cantabria",
  "Girona", "Guipúzcoa", "Huelva", "Jaén", "León", "Lleida", "Lugo",
  "Navarra", "Ourense", "Pontevedra", "Salamanca", "Segovia", "Toledo",
  "Valladolid", "Zamora", "Álava", "Albacete", "Badajoz", "Burgos",
  "Cáceres", "Castellón", "Ciudad Real", "Cuenca", "Huesca", "Palencia",
  "La Rioja", "Soria", "Teruel", "Ávila", "Almería", "Guadalajara",
];

// 24 países con banderas, moneda y GDP per cápita relativo a España
const PAISES: Array<{ code: string; name: string; flag: string; currency: string; gdpFactor: number; regiones: string[] }> = [
  { code: "ES", name: "España", flag: "🇪🇸", currency: "€", gdpFactor: 1.00, regiones: PROVINCIAS },
  { code: "PT", name: "Portugal", flag: "🇵🇹", currency: "€", gdpFactor: 0.72, regiones: [
    "Lisboa", "Oporto", "Braga", "Setúbal", "Aveiro", "Coimbra", "Leiria", "Faro",
    "Viseu", "Évora", "Santarém", "Viana do Castelo", "Vila Real", "Bragança",
    "Guarda", "Castelo Branco", "Portalegre", "Beja",
  ]},
  { code: "US", name: "USA", flag: "🇺🇸", currency: "$", gdpFactor: 2.45, regiones: [
    "California", "Texas", "New York", "Florida", "Illinois", "Pennsylvania", "Ohio",
    "Georgia", "North Carolina", "Michigan", "New Jersey", "Virginia", "Washington",
    "Arizona", "Massachusetts", "Tennessee", "Indiana", "Missouri", "Maryland",
    "Wisconsin", "Colorado", "Minnesota", "South Carolina", "Alabama", "Louisiana",
    "Kentucky", "Oregon", "Oklahoma", "Connecticut", "Utah", "Iowa", "Nevada",
    "Arkansas", "Mississippi", "Kansas", "New Mexico", "Nebraska", "Idaho",
    "West Virginia", "Hawaii", "New Hampshire", "Maine", "Montana", "Rhode Island",
    "Delaware", "South Dakota", "North Dakota", "Alaska", "Vermont", "Wyoming",
  ]},
  { code: "GB", name: "UK", flag: "🇬🇧", currency: "£", gdpFactor: 1.55, regiones: [
    "London", "South East", "North West", "East of England", "West Midlands",
    "South West", "Yorkshire", "Scotland", "East Midlands", "Wales",
    "North East", "Northern Ireland",
  ]},
  { code: "DE", name: "Alemania", flag: "🇩🇪", currency: "€", gdpFactor: 1.62, regiones: [
    "Baviera", "Baden-Wurtemberg", "Renania del Norte", "Baja Sajonia", "Hesse",
    "Berlín", "Sajonia", "Renania-Palatinado", "Hamburgo", "Schleswig-Holstein",
    "Brandeburgo", "Turingia", "Sajonia-Anhalt", "Mecklemburgo", "Sarre", "Bremen",
  ]},
  { code: "FR", name: "Francia", flag: "🇫🇷", currency: "€", gdpFactor: 1.45, regiones: [
    "Île-de-France", "Auvernia-Ródano-Alpes", "Nueva Aquitania", "Occitania",
    "Altos de Francia", "Provenza-Alpes", "Gran Este", "Países del Loira",
    "Bretaña", "Normandía", "Borgoña-Franco Condado", "Centro-Valle de Loira", "Córcega",
  ]},
  { code: "IT", name: "Italia", flag: "🇮🇹", currency: "€", gdpFactor: 1.28, regiones: [
    "Lombardía", "Lacio", "Campania", "Véneto", "Emilia-Romaña", "Sicilia",
    "Piamonte", "Apulia", "Toscana", "Calabria", "Cerdeña", "Liguria",
    "Marcas", "Abruzos", "Friuli-Venecia Julia", "Trentino-Alto Adigio",
    "Umbría", "Basilicata", "Molise", "Valle de Aosta",
  ]},
  { code: "CA", name: "Canadá", flag: "🇨🇦", currency: "C$", gdpFactor: 1.70, regiones: [
    "Ontario", "Quebec", "British Columbia", "Alberta", "Manitoba",
    "Saskatchewan", "Nova Scotia", "New Brunswick", "Newfoundland", "PEI",
    "Northwest Territories", "Yukon", "Nunavut",
  ]},
  { code: "MX", name: "México", flag: "🇲🇽", currency: "MXN", gdpFactor: 0.55, regiones: [
    "CDMX", "Jalisco", "Nuevo León", "Estado de México", "Guanajuato", "Puebla",
    "Veracruz", "Chihuahua", "Baja California", "Sonora", "Coahuila", "Tamaulipas",
    "Michoacán", "Sinaloa", "Querétaro", "Hidalgo", "Yucatán", "Oaxaca",
    "Chiapas", "Guerrero", "San Luis Potosí", "Tabasco", "Durango", "Zacatecas",
    "Aguascalientes", "Morelos", "Quintana Roo", "Nayarit", "Campeche", "Tlaxcala",
    "Colima", "Baja California Sur",
  ]},
  { code: "AR", name: "Argentina", flag: "🇦🇷", currency: "ARS", gdpFactor: 0.50, regiones: [
    "Buenos Aires", "CABA", "Córdoba", "Santa Fe", "Mendoza", "Tucumán",
    "Entre Ríos", "Salta", "Misiones", "Chaco", "Corrientes", "Santiago del Estero",
    "San Juan", "Jujuy", "Río Negro", "Neuquén", "Formosa", "Chubut",
    "San Luis", "Catamarca", "La Rioja", "La Pampa", "Santa Cruz", "Tierra del Fuego",
  ]},
  { code: "CO", name: "Colombia", flag: "🇨🇴", currency: "COP", gdpFactor: 0.38, regiones: [
    "Bogotá", "Antioquia", "Valle del Cauca", "Cundinamarca", "Santander",
    "Atlántico", "Bolívar", "Boyacá", "Tolima", "Norte de Santander",
    "Caldas", "Risaralda", "Nariño", "Huila", "Magdalena", "Cesar",
    "Córdoba", "Meta", "Quindío", "Cauca", "Sucre", "La Guajira",
    "Casanare", "Chocó", "Arauca", "Putumayo", "San Andrés", "Amazonas",
    "Guaviare", "Vichada", "Vaupés", "Guainía",
  ]},
  { code: "CL", name: "Chile", flag: "🇨🇱", currency: "CLP", gdpFactor: 0.58, regiones: [
    "Metropolitana", "Valparaíso", "Biobío", "Maule", "La Araucanía",
    "Los Lagos", "Coquimbo", "O'Higgins", "Antofagasta", "Atacama",
    "Ñuble", "Tarapacá", "Los Ríos", "Magallanes", "Arica y Parinacota", "Aysén",
  ]},
  { code: "PE", name: "Perú", flag: "🇵🇪", currency: "PEN", gdpFactor: 0.35, regiones: [
    "Lima", "Arequipa", "La Libertad", "Piura", "Cusco", "Lambayeque",
    "Junín", "Áncash", "Cajamarca", "Puno", "Ica", "San Martín",
    "Loreto", "Huánuco", "Ayacucho", "Tacna", "Ucayali", "Apurímac",
    "Amazonas", "Huancavelica", "Pasco", "Moquegua", "Madre de Dios", "Tumbes",
  ]},
  { code: "BR", name: "Brasil", flag: "🇧🇷", currency: "R$", gdpFactor: 0.42, regiones: [
    "São Paulo", "Río de Janeiro", "Minas Gerais", "Bahía", "Rio Grande do Sul",
    "Paraná", "Pernambuco", "Ceará", "Pará", "Santa Catarina", "Goiás",
    "Maranhão", "Amazonas", "Espírito Santo", "Paraíba", "Mato Grosso",
    "Rio Grande do Norte", "Alagoas", "Piauí", "Distrito Federal", "Mato Grosso do Sul",
    "Sergipe", "Rondônia", "Tocantins", "Acre", "Amapá", "Roraima",
  ]},
  { code: "NL", name: "Países Bajos", flag: "🇳🇱", currency: "€", gdpFactor: 1.80, regiones: [
    "Holanda Septentrional", "Holanda Meridional", "Brabante Septentrional",
    "Güeldres", "Utrecht", "Overijssel", "Limburgo", "Frisia", "Groninga",
    "Drenthe", "Zelanda", "Flevoland",
  ]},
  { code: "BE", name: "Bélgica", flag: "🇧🇪", currency: "€", gdpFactor: 1.65, regiones: [
    "Flandes", "Valonia", "Bruselas", "Amberes", "Limburgo",
    "Flandes Oriental", "Flandes Occidental", "Brabante Flamenco",
    "Hainaut", "Lieja", "Luxemburgo (BE)",
  ]},
  { code: "CH", name: "Suiza", flag: "🇨🇭", currency: "CHF", gdpFactor: 2.80, regiones: [
    "Zúrich", "Berna", "Vaud", "Argovia", "San Galo", "Ginebra", "Lucerna",
    "Tesino", "Valais", "Friburgo", "Basilea-Ciudad", "Basilea-Campiña",
    "Soleura", "Turgovia", "Grisones", "Neuchâtel", "Schwyz", "Zug",
    "Schaffhausen", "Jura", "Appenzell Exterior", "Appenzell Interior",
    "Nidwalden", "Obwalden", "Uri", "Glaris",
  ]},
  { code: "AT", name: "Austria", flag: "🇦🇹", currency: "€", gdpFactor: 1.70, regiones: [
    "Viena", "Baja Austria", "Alta Austria", "Estiria", "Tirol",
    "Carintia", "Salzburgo", "Vorarlberg", "Burgenland",
  ]},
  { code: "IE", name: "Irlanda", flag: "🇮🇪", currency: "€", gdpFactor: 2.20, regiones: [
    "Dublín", "Cork", "Galway", "Limerick", "Waterford", "Kerry", "Donegal",
    "Mayo", "Wicklow", "Kildare", "Meath", "Tipperary", "Clare", "Wexford",
    "Kilkenny", "Louth", "Offaly", "Cavan", "Westmeath", "Carlow", "Laois",
    "Roscommon", "Monaghan", "Sligo", "Leitrim", "Longford",
  ]},
  { code: "AU", name: "Australia", flag: "🇦🇺", currency: "A$", gdpFactor: 1.95, regiones: [
    "New South Wales", "Victoria", "Queensland", "Western Australia",
    "South Australia", "Tasmania", "Australian Capital Territory", "Northern Territory",
  ]},
  { code: "NZ", name: "Nueva Zelanda", flag: "🇳🇿", currency: "NZ$", gdpFactor: 1.55, regiones: [
    "Auckland", "Wellington", "Canterbury", "Waikato", "Bay of Plenty",
    "Manawatu-Whanganui", "Otago", "Hawke's Bay", "Northland", "Taranaki",
    "Southland", "Nelson", "Marlborough", "West Coast", "Gisborne", "Tasman",
  ]},
  { code: "SE", name: "Suecia", flag: "🇸🇪", currency: "kr", gdpFactor: 1.65, regiones: [
    "Estocolmo", "Västra Götaland", "Escania", "Östergötland", "Jönköping",
    "Upsala", "Halland", "Örebro", "Södermanland", "Dalarna", "Värmland",
    "Västmanland", "Norrbotten", "Gävleborg", "Västerbotten", "Blekinge",
    "Kalmar", "Kronoberg", "Västernorrland", "Jämtland", "Gotland",
  ]},
  { code: "NO", name: "Noruega", flag: "🇳🇴", currency: "kr", gdpFactor: 2.30, regiones: [
    "Oslo", "Viken", "Vestland", "Rogaland", "Trøndelag", "Innlandet",
    "Agder", "Møre og Romsdal", "Troms og Finnmark", "Nordland", "Vestfold og Telemark",
  ]},
  { code: "DK", name: "Dinamarca", flag: "🇩🇰", currency: "kr", gdpFactor: 1.85, regiones: [
    "Hovedstaden", "Midtjylland", "Syddanmark", "Sjælland", "Nordjylland",
  ]},
];

export default function SalariosPage() {
  const router = useRouter();
  const [puesto, setPuesto] = useState("");
  const [provincia, setProvincia] = useState("");
  const [country, setCountry] = useState(PAISES[0]);
  const [data, setData] = useState<SalarioData | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [topCargando, setTopCargando] = useState(true);
  const [topOcupaciones, setTopOcupaciones] = useState<OcupacionCard[]>([]);

  // Precargar top ocupaciones al montar — NUNCA mostrar resultados hasta que el usuario busque
  useEffect(() => {
    async function cargarTop() {
      try {
        const res = await fetch("/api/salarios");
        if (res.ok) {
          const d = await res.json() as SalarioData;
          if (d.top && d.top.length > 0) {
            setTopOcupaciones(d.top as OcupacionCard[]);
          }
        }
      } catch (e) {
        console.error("Error cargando top:", e);
      } finally {
        setTopCargando(false);
      }
    }
    cargarTop();
  }, []);

  async function buscar(puestoOverride?: string) {
    const textoBuscar = (puestoOverride ?? puesto).trim();
    if (!textoBuscar) return;
    setLoading(true);
    setHasSearched(true);
    setData(null);
    try {
      const params = new URLSearchParams();
      params.set("puesto", textoBuscar);
      if (provincia) params.set("provincia", provincia);
      if (country.code !== "ES") params.set("pais", country.code);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      const res = await fetch(`/api/salarios?${params.toString()}`, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const d = await res.json() as SalarioData;
        setData(d);
      } else {
        console.error("Error API salarios:", res.status);
      }
    } catch (e: any) {
      if (e.name === "AbortError") {
        console.warn("Timeout en búsqueda de salarios");
      } else {
        console.error("Error:", e);
      }
    } finally {
      setLoading(false);
    }
  }

  function formatMoney(val: number | null): string {
    if (!val) return "N/D";
    return val >= 1000 ? `${(val / 1000).toFixed(1)}k €` : `${Math.round(val)} €`;
  }

  const isSpain = country.code === "ES";

  return (
    <div className="min-h-screen pt-16" style={{ background: "#0f1117" }}>
      <div className="py-8 px-4" style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.08), rgba(34,197,94,0.05))" }}>
        <div className="max-w-3xl mx-auto">
          <h1 className="text-xl font-bold" style={{ color: "#f1f5f9" }}>Comparador de salarios</h1>
          <p className="text-xs mt-1" style={{ color: "#64748b" }}>Descubre cuánto se cobra en tu sector con datos reales del mercado</p>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* Top ocupaciones precargadas — siempre visibles (fallback si la API no devuelve top) */}
        {!topCargando && (
          (() => {
            const cards = topOcupaciones.length >= 5 ? topOcupaciones : TOP_FALLBACK;
            return (
              <div className="mb-6">
                <h2 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: "#f1f5f9" }}><BarChart2 size={14} strokeWidth={1.8} />Salarios más buscados</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {cards.slice(0, 8).map(o => (
                    <button
                      key={o.puesto}
                      onClick={() => { setPuesto(o.puesto); void buscar(o.puesto); }}
                      className="card-game p-3 text-left transition hover:scale-[1.02] cursor-pointer"
                    >
                      <p className="text-xs font-semibold capitalize truncate" style={{ color: "#f1f5f9" }}>{o.puesto}</p>
                      <p className="text-lg font-bold mt-1" style={{ color: "#22c55e" }}>{formatMoney(o.avg_salary)}</p>
                      <div className="flex gap-2 mt-1">
                        <span className="text-[10px]" style={{ color: "#ef4444" }}>↓{formatMoney(o.min_salary)}</span>
                        <span className="text-[10px]" style={{ color: "#3b82f6" }}>↑{formatMoney(o.max_salary)}</span>
                      </div>
                      <p className="text-[10px] mt-1" style={{ color: "#475569" }}>{o.total.toLocaleString("es-ES")} ofertas</p>
                    </button>
                  ))}
                </div>
              </div>
            );
          })()
        )}

        {/* Buscador */}
        <div className="card-game p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Selector de país */}
            <div className="sm:w-40">
              <label className="text-[11px] block mb-1" style={{ color: "#94a3b8" }}>País</label>
              <select
                value={country.code}
                onChange={e => {
                  const found = PAISES.find(p => p.code === e.target.value);
                  if (found) {
                    setCountry(found);
                    setProvincia("");
                  }
                }}
                className="w-full text-sm"
              >
                {PAISES.map(p => (
                  <option key={p.code} value={p.code}>{p.flag} {p.name}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-[11px] block mb-1" style={{ color: "#94a3b8" }}>Puesto</label>
              <input type="text" value={puesto} onChange={e => setPuesto(e.target.value)}
                placeholder="Ej: camarero, electricista..." className="w-full text-sm" list="puestos-list" />
              <datalist id="puestos-list">
                {PUESTOS_POPULARES.map(p => <option key={p} value={p} />)}
              </datalist>
            </div>
            <div className="sm:w-44">
              <label className="text-[11px] block mb-1" style={{ color: "#94a3b8" }}>
                {isSpain ? "Provincia" : country.name === "USA" ? "Estado" : country.name === "UK" ? "Región" : "Región"}
              </label>
              <select value={provincia} onChange={e => setProvincia(e.target.value)} className="w-full text-sm">
                <option value="">Todas</option>
                {country.regiones.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <button onClick={() => void buscar()} disabled={loading} className="btn-game w-full sm:w-auto px-5 py-2 text-xs disabled:opacity-50">
                {loading ? "Buscando..." : "Comparar"}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 mt-3">
            {PUESTOS_POPULARES.slice(0, 8).map(p => (
              <button key={p} onClick={() => { setPuesto(p); void buscar(p); }}
                className="px-2 py-0.5 rounded-md text-[10px] transition hover:opacity-80"
                style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.15)", color: "#22c55e" }}>
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Estado vacío inicial: sin búsqueda aún */}
        {!hasSearched && (
          <div className="card-game p-8 text-center">
            <div className="flex justify-center mb-3"><Search size={40} strokeWidth={1.2} style={{ color: "#94a3b8" }} /></div>
            <p className="text-sm font-semibold" style={{ color: "#f1f5f9" }}>Selecciona una ocupación o escribe un puesto</p>
            <p className="text-xs mt-1" style={{ color: "#64748b" }}>Te mostraremos el rango salarial, media y desglose por provincia</p>
          </div>
        )}

        {/* Sin resultados después de buscar */}
        {hasSearched && !data?.rangoGeneral && !loading && (
          <div className="card-game p-8 text-center">
            <div className="flex justify-center mb-3"><Frown size={40} strokeWidth={1.2} style={{ color: "#94a3b8" }} /></div>
            <p className="text-sm font-semibold" style={{ color: "#f1f5f9" }}>Sin datos para "{puesto}"</p>
            <p className="text-xs mt-1" style={{ color: "#64748b" }}>Prueba con otro puesto o revisa la ortografía</p>
          </div>
        )}

        {/* Loading skeleton durante búsqueda */}
        {loading && (
          <div className="card-game p-8 text-center">
            <p className="text-lg" style={{ color: "#22c55e" }}>⏳ Buscando datos salariales...</p>
            <p className="text-xs mt-1" style={{ color: "#64748b" }}>Consultando {puesto}{provincia ? ` en ${provincia}` : ` en ${country.name}`}</p>
          </div>
        )}

        {/* Resultados de la búsqueda */}
        {hasSearched && data?.rangoGeneral && !loading && (
          <div className="space-y-4">
            {data.fuente === "referencia" && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-[11px]"
                style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.15)", color: "#f59e0b" }}>
                <span>ℹ️</span>
                <span>Datos de referencia del mercado laboral {country.name} 2026. Se actualizarán cuando haya más ofertas activas con salario visible.</span>
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                data.fuente === "ofertas"
                  ? { label: "Ofertas", valor: (data.rangoGeneral?.total || 0), color: "#22c55e", badge: "Ofertas reales" }
                  : { label: "Nacional", valor: formatMoney(data.rangoGeneral?.avg_salary), color: "#22c55e", badge: "INE 2026" },
                { label: "Medio", valor: formatMoney(data.rangoGeneral?.avg_salary), color: "#f59e0b" },
                { label: "Mínimo", valor: formatMoney(data.rangoGeneral?.min_salary), color: "#ef4444" },
                { label: "Máximo", valor: formatMoney(data.rangoGeneral?.max_salary), color: "#3b82f6" },
              ].map((s, i) => (
                <div key={s.label} className="card-game p-3 text-center relative">
                  <p className="text-lg font-bold" style={{ color: s.color }}>{s.valor}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: "#64748b" }}>{s.label}</p>
                  {"badge" in s && (
                    <span className="absolute top-1 right-1 text-[8px] px-1 py-0.5 rounded" style={{
                      background: data.fuente === "ofertas" ? "rgba(34,197,94,0.12)" : "rgba(59,130,246,0.12)",
                      color: data.fuente === "ofertas" ? "#22c55e" : "#3b82f6",
                    }}>
                      {s.badge}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Indicador cuando es referencia: mostrar que provincia se ignora */}
            {data.fuente === "referencia" && provincia && isSpain && (
              <p className="text-[10px] text-center" style={{ color: "#64748b" }}>
                {country.flag} Datos nacionales de referencia — el desglose por provincia usa índices INE, no ofertas filtradas por "{provincia}"
              </p>
            )}

            {data.porProvincia.length > 0 && (
              <div className="card-game p-4">
                <h2 className="font-semibold text-sm mb-3 flex items-center gap-2" style={{ color: "#f1f5f9" }}>
                  Por {isSpain ? "provincia" : "región"}
                  <span className="text-[9px] px-1.5 py-0.5 rounded" style={{
                    background: data.fuente === "ofertas" ? "rgba(34,197,94,0.12)" : "rgba(59,130,246,0.12)",
                    color: data.fuente === "ofertas" ? "#22c55e" : "#3b82f6",
                  }}>
                    {data.fuente === "ofertas" ? "Ofertas reales" : "INE 2026"}
                  </span>
                </h2>
                <div className="space-y-2">
                  {data.porProvincia.slice(0, 10).map(p => {
                    const valores = data.porProvincia.map(x => x.avg_salary || 0);
                    const maxAvg = Math.max(...valores, 1);
                    const pct = maxAvg > 0 ? ((p.avg_salary || 0) / maxAvg) * 100 : 0;
                    return (
                      <div key={p.province} className="flex items-center gap-2">
                        <span className="text-[11px] w-24 truncate" style={{ color: "#94a3b8" }}>{p.province}</span>
                        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "#252836" }}>
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "linear-gradient(90deg, #22c55e, #16a34a)" }} />
                        </div>
                        <span className="text-[11px] font-semibold w-14 text-right" style={{ color: "#f1f5f9" }}>{formatMoney(p.avg_salary)}</span>
                        <span className="text-[10px] w-8 text-right" style={{ color: "#475569" }}>{p.count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="card-game p-4 flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-sm" style={{ color: "#f1f5f9" }}>¿Buscas trabajo de {data.puesto}?</p>
                <p className="text-[11px]" style={{ color: "#64748b" }}>Guzzi puede enviar tu CV automáticamente</p>
              </div>
              <button onClick={() => router.push(`/app/buscar?keyword=${encodeURIComponent(data.puesto)}${data.provincia ? `&location=${encodeURIComponent(data.provincia)}` : ""}`)}
                className="btn-game text-xs whitespace-nowrap">Buscar →</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
