"use client";

import { useState, useEffect, Suspense, useCallback, useRef } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useRouter, useSearchParams } from "next/navigation";
import JobCard, { type PropiedadesJobCard } from "@/components/JobCard";
import InfoTooltip from "@/components/InfoTooltip";
import CountrySelector from "@/components/CountrySelector";
import { paisDeCiudad } from "@/lib/guzzi/ciudades-pais";
import { PAISES, paisPorNombre, NUM_PAISES } from "@/lib/paises";
import { dondeEstoy, guardarDondeEstoy } from "@/lib/origen/donde-estoy";
import { NACIONALIDADES, nacionalidadDe } from "@/lib/origen/nacionalidades";
import { DATOS } from "@/lib/datos-reales";
import { sectorDeOficio } from "@/lib/job-search/oficio-a-sector";
import EmpresasDeLaZona from "@/components/EmpresasDeLaZona";
import NavTrabajo from "@/components/NavTrabajo";
import Link from "next/link";
import { TrendingUp, Send, Building2, Info, AlertTriangle, MapPin } from "lucide-react";

/** El nombre del pais tal y como lo lee la gente: "Francia", no "FR". */
function nombrePais(codigo: string): string {
  const p = PAISES[codigo];
  return p ? `${p.bandera} ${p.nombre}` : codigo;
}

const opcionesJornada = [
  { valor: "", etiqueta: "Todas" },
  { valor: "completa", etiqueta: "Jornada completa" },
  { valor: "parcial", etiqueta: "Jornada parcial" },
  { valor: "remoto", etiqueta: "Remoto / desde casa" },
];

const opcionesExperiencia = [
  { valor: "", etiqueta: "Cualquier experiencia" },
  { valor: "sin-experiencia", etiqueta: "Sin experiencia" },
  { valor: "1-3", etiqueta: "1 – 3 años" },
  { valor: "3-5", etiqueta: "3 – 5 años" },
  { valor: "5-10", etiqueta: "Más de 5 años" },
];

function BuscarPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlKeyword = searchParams.get("keyword") || searchParams.get("q") || "";
  const urlUbicacion = searchParams.get("location") || searchParams.get("ubicacion") || "";
  const urlCategoria = searchParams.get("categoria") || "";
  // VIENE DE EMIGRAR (21 oct 2026): "Ver todas las ofertas en Australia" trae
  // ?pais=AU. Se rellenaba el "¿Dónde?" con la ciudad del perfil (Tudela) con
  // la bandera de Australia debajo, y se buscaba en Tudela. Ahora el "¿Dónde?"
  // es el país del que vienes y se busca solo.
  const urlPais = (searchParams.get("pais") || "").toUpperCase();
  const paisDeFuera = urlPais && urlPais !== "ES" && PAISES[urlPais] ? urlPais : "";
  const ubicacionInicial = urlUbicacion || (paisDeFuera ? PAISES[paisDeFuera].nombre : "");
  const [keyword, setKeyword] = useState(urlKeyword);
  const [ubicacion, setUbicacion] = useState(ubicacionInicial);
  const [categoria] = useState(urlCategoria); // au_pair | live_in_nanny — viene del URL, no cambia
  const [geoDetected, setGeoDetected] = useState(false);
  const [jornada, setJornada] = useState("");
  const [experiencia, setExperiencia] = useState("");
  // Ofertas para personas con discapacidad: el filtro "PCD" de los portales de Brasil.
  const [inclusiva, setInclusiva] = useState(false);
  const [salarioMin, setSalarioMin] = useState("");
  const [salarioMax, setSalarioMax] = useState("");

  const [ofertas, setOfertas] = useState<PropiedadesJobCard[]>([]);
  const [cargando, setCargando] = useState(false);
  const [cargandoMas, setCargandoMas] = useState(false);
  const [buscado, setBuscado] = useState(false);
  // OFERTAS SEGÚN TU CV, antes de buscar (17 oct 2026). Salen de su CV, nunca
  // al tuntún: sin CV se le pide que lo rellene (/api/ofertas/para-ti).
  const [paraTi, setParaTi] = useState<{ estado: string; ofertas: PropiedadesJobCard[]; puestos: string[] } | null>(null);
  useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await getSupabaseBrowser().auth.getSession();
        if (!session) return;
        const res = await fetch("/api/ofertas/para-ti", { headers: { Authorization: `Bearer ${session.access_token}` } });
        if (res.ok) setParaTi(await res.json());
      } catch { /* sin recomendaciones, el buscador sigue igual */ }
    })();
  }, []);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalResultados, setTotalResultados] = useState(0);
  const [hayMas, setHayMas] = useState(false);
  const [fuenteResultados, setFuenteResultados] = useState<string>("");
  // Explica en pantalla por que ha cambiado el pais de la busqueda.
  const [avisoPais, setAvisoPais] = useState("");
  // Los filtros llevaban "hidden md:block" desde siempre: en el telefono no
  // habia manera de llegar a ellos. En movil se abren con un boton; en
  // escritorio siguen desplegados, como estaban.
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);

  const [mostrarAlertaModal, setMostrarAlertaModal] = useState(false);
  const [alertaCreada, setAlertaCreada] = useState(false);
  const [creandoAlerta, setCreandoAlerta] = useState(false);

  const [paisSeleccionado, setPaisSeleccionado] = useState(() => {
    // Prioridad: URL > el último que eligió > el país donde está > España.
    // Sin lo tercero, alguien de Monterrey que entraba por primera vez veía
    // ofertas de Madrid.
    const urlPais = searchParams.get("pais");
    if (urlPais) return urlPais.toUpperCase();
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("bc_pais");
      if (saved) return saved;
      const aqui = dondeEstoy();
      if (aqui && PAISES[aqui]) return aqui;
    }
    return "ES";
  });
  const paisCambiadoPorUsuario = useRef(false);

  // DÓNDE ESTÁ LA PERSONA (lib/origen/donde-estoy.ts) y su ciudad del perfil.
  // Con eso, "¿dónde quieres trabajar?" se contesta con un toque: en mi
  // ciudad, en todo mi país o en otro país. Nada de formularios.
  const [residencia, setResidencia] = useState<string | null>(null);
  const [ciudadPerfil, setCiudadPerfil] = useState("");
  const [cambiandoResidencia, setCambiandoResidencia] = useState(false);
  useEffect(() => { setResidencia(dondeEstoy()); }, []);
  function cambiarPais(codigo: string) {
    setPaisSeleccionado(codigo);
    paisCambiadoPorUsuario.current = true;
    localStorage.setItem("bc_pais", codigo);
    // Disparar evento para que otros componentes reaccionen
    window.dispatchEvent(new CustomEvent("bc-pais-change", { detail: codigo }));
  }

  /** La bandera elegida a mano. Si el "¿Dónde?" era un país o la ciudad del
   *  perfil puesta sola, cambia con ella: Australia arriba y Tudela abajo no. */
  function elegirPaisAMano(codigo: string) {
    cambiarPais(codigo);
    if (!ubicacion.trim() || geoDetected || paisPorNombre(ubicacion)) {
      setUbicacion(codigo === "ES" ? "" : PAISES[codigo]?.nombre || "");
      setGeoDetected(false);
      setAvisoPais("");
    }
  }

  // Ref para que el auto-fill de ciudad solo ocurra una vez (evita que el campo se reponga al borrarlo)
  const locationFetched = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    async function init() {
      const { data: { user } } = await getSupabaseBrowser().auth.getUser();
      if (!user) { router.push("/auth/login"); return; }

      // En otro dispositivo: lo que eligió en su cuenta vale también aquí.
      const deLaCuenta = String(user.user_metadata?.pais_residencia || "").toUpperCase();
      if (deLaCuenta && !localStorage.getItem("bc_donde_estoy")) {
        try { localStorage.setItem("bc_donde_estoy", deLaCuenta); } catch { /* da igual */ }
        if (mountedRef.current) setResidencia(deLaCuenta);
      }

      // Si la URL ya trae location (aunque sea vacío), respetarlo — no auto-rellenar
      if (locationFetched.current || searchParams.has("location") || searchParams.has("ubicacion")) return;
      locationFetched.current = true;

      // Viene a mirar otro país: su ciudad de aquí no pinta nada allí.
      if (paisDeFuera) return;
      const { data: perfil } = await getSupabaseBrowser().from("profiles")
        .select("ciudad").eq("id", user.id).single();
      if (perfil?.ciudad) {
        if (!mountedRef.current) return;
        setCiudadPerfil(perfil.ciudad);
        setUbicacion(perfil.ciudad);
        setGeoDetected(true);
        return;
      }

      // Aquí se pedía el GPS al abrir el buscador y se preguntaba el nombre de
      // la ciudad a OpenStreetMap. No funcionaba: la política de permisos
      // bloqueaba el GPS y la CSP la petición a OpenStreetMap. Pedir la
      // ubicación nada más abrir, sin que la persona haya hecho nada, tampoco
      // es buena idea: se usa la ciudad del perfil y ya.
    }
    init();
    return () => { mountedRef.current = false; };
  }, [router, searchParams]);

  // Auto-disparar búsqueda al entrar desde una página SEO con params pre-rellenados
  // (o desde Emigrar con el país). Los valores van en la llamada: con el submit
  // del formulario se buscaba con lo que hubiera en los campos en ese momento,
  // y si la ciudad del perfil llegaba antes, se buscaba en Tudela.
  const autoSearched = useRef(false);
  useEffect(() => {
    if (autoSearched.current) return;
    if (urlKeyword || ubicacionInicial) {
      autoSearched.current = true;
      // Pequeño delay para que el usuario esté autenticado y el DOM listo
      const t = setTimeout(() => { void buscar(undefined, { keyword: urlKeyword, ubicacion: ubicacionInicial }); }, 300);
      return () => clearTimeout(t);
    }
  }, [urlKeyword, ubicacionInicial]);

  async function buscarJoobleCliente(kw: string, loc: string): Promise<PropiedadesJobCard[]> {
    // Solo buscar en Jooble si hay keyword, no para búsquedas solo por ciudad
    if (!kw.trim()) return [];
    try {
      const res = await fetch("/api/jobs/jooble", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywords: kw, location: loc }),
        signal: AbortSignal.timeout(12000),
      });
      if (!res.ok) return [];
      const data = await res.json();
      const jobs = data.jobs || [];
      return jobs.slice(0, 20).map((j: Record<string, string>, i: number) => ({
        id: `jooble-${Date.now()}-${i}`,
        titulo: j.title || kw,
        empresa: j.company || "Ver en oferta",
        ubicacion: j.location || loc,
        salario: j.salary || "Ver en oferta",
        descripcion: (j.snippet || j.title || "").replace(/<[^>]+>/g, "").slice(0, 200),
        fuente: "Jooble",
        url: j.link || `https://es.jooble.org/SearchResult?ukw=${encodeURIComponent(kw)}&loc=${encodeURIComponent(loc)}`,
        fecha: j.updated || new Date().toISOString(),
        distancia: "Tu ciudad",
      }));
    } catch {
      return [];
    }
  }

  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // ── Infinite Scroll via IntersectionObserver ──
  useEffect(() => {
    if (!hayMas || cargando || cargandoMas) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hayMas && !cargandoMas) {
          cargarMas();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hayMas, cargando, cargandoMas, ofertas.length]);


  // Calcula match % entre keyword del usuario y título/descripción de la oferta
  function calcularMatch(titulo: string, descripcion?: string): number {
    if (!keyword.trim()) return 0;
    const kw = keyword.toLowerCase().split(/\s+/);
    const texto = ((titulo || "") + " " + (descripcion || "")).toLowerCase();
    let hits = 0;
    for (const w of kw) {
      if (w.length > 2 && texto.includes(w)) hits++;
    }
    return kw.length > 0 ? Math.min(99, Math.round((hits / kw.length) * 100)) : 0;
  }

  // Lista de ciudades españolas conocidas para extraer del keyword
  const CIUDADES_CONOCIDAS = new Set([
    "madrid", "barcelona", "valencia", "sevilla", "zaragoza", "málaga", "malaga",
    "murcia", "palma", "bilbao", "alicante", "córdoba", "cordoba", "valladolid",
    "vigo", "gijón", "gijon", "granada", "a coruña", "la coruña", "coruña",
    "coruna", "vitoria", "gasteiz", "oviedo", "santander", "pamplona", "burgos",
    "salamanca", "toledo", "cádiz", "cadiz", "jaén", "jaen", "almería", "almeria",
    "huelva", "cáceres", "caceres", "badajoz", "león", "leon", "zamora", "segovia",
    "ávila", "avila", "soria", "guadalajara", "cuenca", "ciudad real", "albacete",
    "teruel", "huesca", "logroño", "logrono", "lugo", "ourense", "pontevedra",
    "donostia", "san sebastián", "san sebastian", "londres", "london", "paris",
    "parís", "berlin", "berlín", "roma", "dublin", "dublín", "lisboa", "amsterdam",
    "bruselas", "viena", "estocolmo", "copenhague", "oslo", "helsinki", "nueva york",
    "new york", "los angeles", "chicago", "miami", "toronto", "sydney", "melbourne"
  ]);
  
  /** Las casillas de "¿Dónde quieres trabajar?": un toque y busca. */
  function trabajarEn(donde: "ciudad" | "pais") {
    if (!residencia || !PAISES[residencia]) return;
    const sitio = donde === "ciudad" ? ciudadPerfil : PAISES[residencia].nombre;
    if (!sitio) return;
    if (residencia !== paisSeleccionado) cambiarPais(residencia);
    setUbicacion(sitio);
    setGeoDetected(donde === "ciudad");
    void buscar(undefined, { keyword, ubicacion: sitio, pais: residencia });
  }

  function cambiarResidencia(codigo: string) {
    setCambiandoResidencia(false);
    if (!codigo) return;
    setResidencia(codigo);
    void guardarDondeEstoy(codigo);
    // Si está en un país donde hay ofertas, se busca ahí desde ya.
    if (PAISES[codigo]) elegirPaisAMano(codigo);
  }

  async function buscar(e?: React.FormEvent, valores?: { keyword: string; ubicacion: string; pais?: string }) {
    if (e) e.preventDefault();
    
    // Extraer ciudad del keyword si el usuario escribió "trabajo ciudad"
    let finalKeyword = (valores?.keyword ?? keyword).trim();
    let finalUbicacion = (valores?.ubicacion ?? ubicacion).trim();
    // Solo un país en "¿Qué?" ("Japón"): es el sitio, no el trabajo.
    if (finalKeyword && !finalUbicacion && paisPorNombre(finalKeyword)) {
      finalUbicacion = PAISES[paisPorNombre(finalKeyword)!].nombre;
      finalKeyword = "";
      setKeyword("");
      setUbicacion(finalUbicacion);
    }
    
    if (finalKeyword && !finalUbicacion) {
      const words = finalKeyword.split(/\s+/);
      // Buscar palabras que sean ciudades conocidas al final o principio del keyword
      for (let i = words.length - 1; i >= 0; i--) {
        const candidate = words.slice(i).join(" ").toLowerCase();
        if (CIUDADES_CONOCIDAS.has(candidate)) {
          finalKeyword = words.slice(0, i).join(" ");
          finalUbicacion = words.slice(i).join(" ");
          break;
        }
      }
      // Intentar con palabra individual si no encontró frase
      if (!finalUbicacion && words.length >= 2) {
        const lastWord = words[words.length - 1].toLowerCase();
        if (CIUDADES_CONOCIDAS.has(lastWord) || lastWord.length > 4) {
          // Si la última palabra parece una ciudad (larga o conocida)
          for (const w of words) {
            if (CIUDADES_CONOCIDAS.has(w.toLowerCase())) {
              finalKeyword = words.filter(x => x.toLowerCase() !== w.toLowerCase()).join(" ");
              finalUbicacion = w;
              break;
            }
          }
        }
      }
      if (finalUbicacion) {
        setKeyword(finalKeyword);
        setUbicacion(finalUbicacion);
      }
    }
    
    if (!finalKeyword && !finalUbicacion) return;

    // LA CIUDAD MANDA SOBRE LA BANDERA.
    //
    // El selector de país recuerda el último que usaste, así que se quedaba en
    // España mientras escribías "París" en el "¿Dónde?". Resultado: cero
    // ofertas y ni una pista de por qué — la bandera está en otra esquina de
    // la pantalla y nadie la relaciona. Si la ciudad que escribes está en otro
    // país, se cambia sola y se dice. Nunca se bloquea la búsqueda por esto.
    let paisParaBuscar = valores?.pais ?? paisSeleccionado;
    setAvisoPais("");
    // Un país entero en "¿Dónde?": la bandera pasa a ese país (la API busca en todo él).
    const paisEscrito = paisPorNombre(finalUbicacion);
    if (paisEscrito) {
      paisParaBuscar = paisEscrito;
      if (paisEscrito !== paisParaBuscar) cambiarPais(paisEscrito);
    } else if (finalUbicacion) {
      const paisDeLaCiudad = paisDeCiudad(finalUbicacion, paisParaBuscar);
      if (paisDeLaCiudad && paisDeLaCiudad !== paisParaBuscar) {
        paisParaBuscar = paisDeLaCiudad;
        cambiarPais(paisDeLaCiudad);
        setAvisoPais(
          `${finalUbicacion.charAt(0).toUpperCase() + finalUbicacion.slice(1)} está en ${nombrePais(paisDeLaCiudad)}, así que he cambiado ahí la búsqueda.`
        );
      }
    }

    setCargando(true);
    setError("");
    setBuscado(true);

    try {
      const params = new URLSearchParams();
      if (finalKeyword) params.set("keyword", finalKeyword);
      if (finalUbicacion) params.set("location", finalUbicacion);
      // Au Pair / Live-in Nanny: no filtrar por país si el usuario no lo cambió explícitamente
      // (ES tiene pocas ofertas au pair; la mayoría están en UK/US/etc)
      if (paisParaBuscar && !(categoria && !paisCambiadoPorUsuario.current && paisParaBuscar === "ES")) {
        params.set("country", paisParaBuscar);
      }
      if (categoria) params.set("categoria", categoria);
      if (jornada) params.set("jornada", jornada);
      if (experiencia) params.set("experiencia", experiencia);
      if (inclusiva) params.set("inclusiva", "1");
      if (salarioMin) params.set("salarioMin", salarioMin);
      if (salarioMax) params.set("salarioMax", salarioMax);

      // Saltarse Jooble si hay categoría — Jooble no filtra por au_pair/live_in_nanny.
      // Y fuera de España también: es el Jooble español y mezclaba ofertas de aquí.
      const jooblePromise = categoria || paisParaBuscar !== "ES" ? Promise.resolve([]) : buscarJoobleCliente(finalKeyword, finalUbicacion);

      const [serverRes, joobleRes] = await Promise.allSettled([
        fetch(`/api/jobs/search?${params.toString()}`, { signal: AbortSignal.timeout(15000) })
          .then(r => r.ok ? r.json() : { ofertas: [] })
          .catch(() => ({ ofertas: [] })),
        jooblePromise,
      ]);

      const serverOfertas = serverRes.status === "fulfilled" ? (serverRes.value.ofertas || []) : [];
      const joobleOfertas = joobleRes.status === "fulfilled" ? joobleRes.value : [];
      const serverTotal = serverRes.status === "fulfilled" ? (serverRes.value.total || 0) : 0;
      const serverHasMore = serverRes.status === "fulfilled" ? (serverRes.value.hasMore || false) : false;
      
      console.log(`[Buscar] Server: ${serverOfertas.length} ofertas, total: ${serverTotal}, hasMore: ${serverHasMore}`);

      // Priorizar ofertas de la BD (más completas) sobre Jooble
      const seen = new Set<string>();
      const todas: PropiedadesJobCard[] = [];
      
      // Primero las de la base de datos
      for (const o of serverOfertas) {
        const key = `${(o.titulo || "").toLowerCase().replace(/\s+/g, "")}-${(o.empresa || "").toLowerCase().replace(/\s+/g, "")}`;
        if (!seen.has(key)) {
          seen.add(key);
          todas.push(o);
        }
      }
      
      // Luego las de Jooble si no están duplicadas
      for (const o of joobleOfertas) {
        const key = `${(o.titulo || "").toLowerCase().replace(/\s+/g, "")}-${(o.empresa || "").toLowerCase().replace(/\s+/g, "")}`;
        if (!seen.has(key)) {
          seen.add(key);
          todas.push(o);
        }
      }

      const conMatch = todas.map(o => ({ ...o, match: calcularMatch(o.titulo || "", o.descripcion) }));
      setOfertas(conMatch);
      setCurrentPage(1);
      const source = serverRes.status === "fulfilled" ? (serverRes.value.source || "") : "";
      setFuenteResultados(source);
      setTotalResultados(serverTotal > 0 ? serverTotal : todas.length);
      setHayMas(serverHasMore);
      console.log(`[Buscar] Final: ${todas.length} ofertas, hayMas: ${serverHasMore}, total: ${serverTotal}`);
    } catch (err) {
      setError((err as Error).message || "Error al buscar ofertas");
      setOfertas([]);
    } finally {
      setCargando(false);
    }
  }

  async function cargarMas() {
    if (cargandoMas || !hayMas) return;
    setCargandoMas(true);
    try {
      const nextPage = currentPage + 1;
      const params = new URLSearchParams();
      if (keyword.trim()) params.set("keyword", keyword.trim());
      if (ubicacion.trim()) params.set("location", ubicacion.trim());
      // Au Pair / Live-in Nanny: no filtrar por país si el usuario no lo cambió explícitamente
      if (paisSeleccionado && !(categoria && !paisCambiadoPorUsuario.current && paisSeleccionado === "ES")) {
        params.set("country", paisSeleccionado);
      }
      if (categoria) params.set("categoria", categoria);
      if (jornada) params.set("jornada", jornada);
      if (experiencia) params.set("experiencia", experiencia);
      if (inclusiva) params.set("inclusiva", "1");
      if (salarioMin) params.set("salarioMin", salarioMin);
      if (salarioMax) params.set("salarioMax", salarioMax);
      params.set("page", String(nextPage));
      const res = await fetch(`/api/jobs/search?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        const nuevas = data.ofertas || [];
        const seen = new Set(ofertas.map(o => o.id));
        const sinDuplicados = nuevas.filter((o: {id: string}) => !seen.has(o.id));
        const conMatchNuevas = sinDuplicados.map((o: PropiedadesJobCard) => ({ ...o, match: calcularMatch(o.titulo || "", o.descripcion) }));
        setOfertas(prev => [...prev, ...conMatchNuevas]);
        setCurrentPage(nextPage);
        setHayMas(data.hasMore || false);
        setTotalResultados(data.total || totalResultados);
        setFuenteResultados(data.source || fuenteResultados);
      }
    } catch (err) { console.error("Error cargarMas:", err); }
    finally { setCargandoMas(false); }
  }



  const esEnTiempoReal = fuenteResultados.startsWith("live-api");
  // En un país grande sin palabra ni ciudad la API cuenta hasta 10.000 y para.
  const totalEsMinimo = fuenteResultados === "database-pais";

  // Qué casilla de "¿Dónde quieres trabajar?" está puesta ahora.
  const enMiCiudad = !!residencia && paisSeleccionado === residencia && !!ciudadPerfil
    && ubicacion.trim().toLowerCase() === ciudadPerfil.trim().toLowerCase();
  const enMiPais = !!residencia && paisSeleccionado === residencia
    && (!ubicacion.trim() || paisPorNombre(ubicacion) === residencia);
  const fichaResidencia = nacionalidadDe(residencia);
  const nombreResidencia = residencia
    ? `${PAISES[residencia]?.bandera ?? fichaResidencia?.bandera ?? ""} ${PAISES[residencia]?.nombre ?? fichaResidencia?.nombre ?? residencia}`.trim()
    : "";

  return (
    <div className="min-h-screen pt-16" style={{ background: "#0f1117" }}>

      {/* Cabecera de búsqueda */}
      {/* ACABADO SUAVE, NO BLOQUE MACIZO.
          Esto era un rectangulo de verde #22c55e a pantalla completa, que en
          una aplicacion oscura pega un golpe de color y obliga a poner el texto
          en blanco y los campos en blanco translucido. Michel pidio el acabado
          de la tarjeta de "microfono bloqueado": fondo tenido al 6%, borde al
          18% y esquinas redondeadas. Se lee mejor y el verde vuelve a ser un
          acento en vez de una pared. */}
      <div className="py-6 px-4 mx-3 mt-3 rounded-2xl"
           style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.18)", color: "#f1f5f9" }}>
        <div className="max-w-4xl mx-auto">
          {/* El titulo dice las DOS cosas que se hacen aquí. Poniendo solo
              "Buscar ofertas", la mitad de enviar el CV a la empresa —que es
              lo que nos diferencia— no se intuía por ninguna parte. */}
          <h1 className="text-xl font-bold" style={{ color: "#22c55e" }}>Buscar trabajo y enviar tu CV</h1>
          <p className="text-xs mb-4 mt-1" style={{ color: "#94a3b8" }}>
            Las ofertas publicadas y, además, las empresas de tu zona a las que
            escribir aunque no hayan publicado nada.
          </p>
          <form onSubmit={buscar} className="flex flex-col sm:flex-row gap-2">
            <label className="sr-only" htmlFor="buscar-keyword">Palabra clave</label>
            <input id="buscar-keyword" type="text" value={keyword} onChange={(e) => setKeyword(e.target.value)}
              placeholder="¿Qué trabajo buscas?" className="flex-1 px-4 py-2.5 rounded-lg text-sm"
              style={{ background: "#161922", border: "1px solid #2d3142", color: "#f1f5f9" }} />
            <div className="relative w-full sm:w-56">
              <label className="sr-only" htmlFor="buscar-ubicacion">Ubicación</label>
              <input id="buscar-ubicacion" type="text" value={ubicacion} onChange={(e) => { setUbicacion(e.target.value); setGeoDetected(false); setAvisoPais(""); }}
                placeholder="¿Dónde? (o déjalo vacío)" className="w-full px-4 py-2.5 rounded-lg text-sm"
                style={{ background: "#161922", border: "1px solid #2d3142", color: "#f1f5f9" }} />
              {/* El aviso de autorrelleno era un "Auto" de 10 px que nadie
                  veía: la gente buscaba sin darse cuenta de que el campo
                  llevaba su ciudad puesta. Ahora se ve y se quita de un clic. */}
              {geoDetected && ubicacion && (
                <button type="button"
                  onClick={() => { setUbicacion(""); setGeoDetected(false); }}
                  title="Quitar mi ciudad y buscar en todas partes"
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded text-[10px] font-semibold hover:opacity-80"
                  style={{ background: "#0f1117", color: "#94a3b8", border: "1px solid #2d3142" }}>
                  tu ciudad
                </button>
              )}
            </div>
            <button type="submit" disabled={cargando}
              className="px-6 py-2.5 font-semibold rounded-lg text-sm transition disabled:opacity-50"
              style={{ background: "#22c55e", color: "#0f1117" }}>
              {cargando ? "Buscando..." : "Buscar"}
            </button>
          </form>

          {/* El país va aquí, pegado a los campos y con su etiqueta.
              Suelto abajo a la derecha, nadie lo relacionaba con el "¿Dónde?":
              escribías "París" con la bandera en España, salían cero ofertas y
              no había forma de saber por qué. */}
          {/* ¿DÓNDE QUIERES TRABAJAR? Tres respuestas y un toque cada una: en
              tu ciudad, en todo tu país o en otro país. Lo que en otros
              portales es un formulario, aquí son tres casillas. */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-[11px]" style={{ color: "#94a3b8" }}>¿Dónde quieres trabajar?</span>
            {residencia && PAISES[residencia] && ciudadPerfil && (
              <button type="button" onClick={() => trabajarEn("ciudad")} disabled={cargando}
                aria-pressed={enMiCiudad}
                className="px-2.5 py-1 rounded-full text-xs font-semibold hover:opacity-90 disabled:opacity-50"
                style={enMiCiudad ? { background: "#22c55e", color: "#0f1117", border: "1px solid #22c55e" } : { background: "#161922", color: "#f1f5f9", border: "1px solid #2d3142" }}>
                <MapPin size={12} strokeWidth={2.2} className="inline -mt-0.5 mr-1" />En {ciudadPerfil}
              </button>
            )}
            {residencia && PAISES[residencia] && (
              <button type="button" onClick={() => trabajarEn("pais")} disabled={cargando}
                aria-pressed={enMiPais}
                className="px-2.5 py-1 rounded-full text-xs font-semibold hover:opacity-90 disabled:opacity-50"
                style={enMiPais ? { background: "#22c55e", color: "#0f1117", border: "1px solid #22c55e" } : { background: "#161922", color: "#f1f5f9", border: "1px solid #2d3142" }}>
                {PAISES[residencia].bandera} En todo {PAISES[residencia].nombre}
              </button>
            )}
            <span className="text-[11px]" style={{ color: "#94a3b8" }}>
              {residencia && PAISES[residencia] ? "o en otro país:" : "Buscando en:"}
            </span>
            <CountrySelector paisActual={paisSeleccionado} onCambiarPais={elegirPaisAMano} variant="buscar" />
          </div>

          {/* Dónde está ahora. Se detecta solo; si no acierta, se cambia aquí. */}
          <div className="mt-1.5 text-[11px] flex flex-wrap items-center gap-1.5" style={{ color: "#64748b" }}>
            {cambiandoResidencia ? (
              <>
                <label htmlFor="donde-estoy">¿En qué país estás ahora?</label>
                <select id="donde-estoy" autoFocus defaultValue={residencia || ""} onChange={(e) => cambiarResidencia(e.target.value)}
                  className="text-xs px-2 py-1 rounded" style={{ background: "#161922", border: "1px solid #2d3142", color: "#f1f5f9" }}>
                  <option value="">Elige…</option>
                  {NACIONALIDADES.map(n => <option key={n.codigo} value={n.codigo}>{n.bandera} {n.nombre}</option>)}
                </select>
                <button type="button" onClick={() => setCambiandoResidencia(false)} className="underline">cancelar</button>
              </>
            ) : (
              <>
                <span>{residencia ? <>Estás en {nombreResidencia}</> : <>No sabemos en qué país estás</>}</span>
                <button type="button" onClick={() => setCambiandoResidencia(true)} className="underline hover:opacity-80" style={{ color: "#94a3b8" }}>
                  {residencia ? "cambiar" : "dínoslo"}
                </button>
                <span className="opacity-75">· Si escribes una ciudad de otro país, cambio la búsqueda yo.</span>
              </>
            )}
          </div>
          {residencia && !PAISES[residencia] && (
            <p className="mt-2 text-xs px-3 py-2 rounded-lg" style={{ background: "#161922", border: "1px solid #2d3142", color: "#94a3b8" }}>
              Todavía no tenemos ofertas de {nombreResidencia}. Las estamos preparando; mientras, puedes
              buscar en los {NUM_PAISES} países donde sí hay: elige uno arriba.
            </p>
          )}

          {avisoPais && (
            <div className="mt-2 px-3 py-2 rounded-lg text-xs flex items-start gap-2"
              style={{ background: "#161922", border: "1px solid #2d3142", color: "#94a3b8" }}>
              <Info size={14} strokeWidth={2} className="shrink-0 mt-0.5" />
              <span>{avisoPais}</span>
            </div>
          )}
        </div>
      </div>

      {/* Franja SEO: por qué BuscayCurra */}
      <div className="border-b" style={{ background: "#111827", borderColor: "#1e212b" }}>
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap items-center gap-4 md:gap-8">
          <div className="flex items-center gap-2.5">
            <TrendingUp size={18} strokeWidth={1.9} className="shrink-0" style={{ color: "#94a3b8" }} />
            <div>
              {/* Decia "2.400+ personas ya encontraron trabajo" habiendo 51
                  usuarios. Esto esta contado contra la base de datos. */}
              <p className="text-xs font-bold" style={{ color: "#f1f5f9" }}>{DATOS.ofertasNuevasDiaTexto} ofertas nuevas al día</p>
              <p className="text-[10px]" style={{ color: "#64748b" }}>{Math.floor(DATOS.ofertasNuevasDia / 1440)} cada minuto, de medio mundo</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <Send size={18} strokeWidth={1.9} className="shrink-0" style={{ color: "#22c55e" }} />
            <div>
              {/* Aquí había una cifra sin ninguna fuente detrás: fuera (auditoría del 19 oct 2026). */}
              <p className="text-xs font-bold" style={{ color: "#22c55e" }}>Tu CV, directo a la empresa</p>
              <p className="text-[10px]" style={{ color: "#64748b" }}>por correo y con una carta escrita para cada una</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <Building2 size={18} strokeWidth={1.9} className="shrink-0" style={{ color: "#94a3b8" }} />
            <div>
              <p className="text-xs font-bold" style={{ color: "#f1f5f9" }}>Contacto directo con la empresa</p>
              <p className="text-[10px]" style={{ color: "#64748b" }}>sin esperar a que alguien en un portal te encuentre</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row gap-4 md:gap-6">

          {/* La columna de la izquierda: primero DONDE estas y que mas hay, y
              debajo los filtros de esta seccion.

              OJO CON EL MOVIL. Este bloque llevaba "hidden md:block", que lo
              esconde en pantallas pequenas. Valia mientras solo eran filtros,
              pero al meter aqui la barra de secciones el telefono se quedo sin
              ninguna forma de llegar a enviar el CV, a las ETTs o a los
              negocios de la zona: la barra estaba oculta y la entrada del menu
              ya no existia. La navegacion NO puede esconderse en movil; los
              filtros si, que es donde estaban antes. */}
          <aside className="md:w-56 md:shrink-0">
            <div className="md:sticky md:top-20 space-y-4">
              <NavTrabajo activa="ofertas" paginaActual="buscar" onCambiar={() => {}} />

            <button onClick={() => setFiltrosAbiertos(v => !v)}
              className="md:hidden w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium"
              style={{ background: "#1e212b", border: "1px solid #2d3142", color: "#94a3b8" }}>
              <span>Filtros{(jornada || experiencia || inclusiva || salarioMin || salarioMax) ? " · activos" : ""}</span>
              <span>{filtrosAbiertos ? "▲" : "▼"}</span>
            </button>

            <div className={`card-game p-4 ${filtrosAbiertos ? "block" : "hidden"} md:block`}>
              <div className="hidden md:flex items-center gap-2 mb-4">
                <h2 className="font-semibold text-sm" style={{ color: "#f1f5f9" }}>Filtros</h2>
                <InfoTooltip text="Refina tu búsqueda por tipo de jornada, experiencia y rango salarial. Los filtros se aplican sobre los resultados actuales." position="right" />
              </div>
              <div className="mb-4">
                <label htmlFor="filtro-jornada" className="block text-xs mb-1.5" style={{ color: "#94a3b8" }}>Tipo de jornada</label>
                <select id="filtro-jornada" value={jornada} onChange={(e) => setJornada(e.target.value)} className="w-full text-sm">
                  {opcionesJornada.map(op => <option key={op.valor} value={op.valor}>{op.etiqueta}</option>)}
                </select>
              </div>
              <div className="mb-4">
                <label htmlFor="filtro-experiencia" className="block text-xs mb-1.5" style={{ color: "#94a3b8" }}>Experiencia</label>
                <select id="filtro-experiencia" value={experiencia} onChange={(e) => setExperiencia(e.target.value)} className="w-full text-sm">
                  {opcionesExperiencia.map(op => <option key={op.valor} value={op.valor}>{op.etiqueta}</option>)}
                </select>
              </div>
              {/* Como las "vagas PCD" de los portales de Brasil: ofertas que dicen
                  ser para personas con discapacidad. Hoy se reconoce en español
                  y portugués (lib/job-search/filtros.ts). */}
              <label className="mb-4 flex items-start gap-2 text-xs cursor-pointer" style={{ color: "#94a3b8" }}>
                <input type="checkbox" checked={inclusiva} onChange={(e) => setInclusiva(e.target.checked)} className="mt-0.5" />
                <span>Para personas con discapacidad <span style={{ color: "#64748b" }}>(ofertas en español y portugués)</span></span>
              </label>
              <div className="mb-4">
                <label htmlFor="filtro-salario" className="block text-xs mb-1.5" style={{ color: "#94a3b8" }}>Salario mínimo ({PAISES[paisSeleccionado]?.simboloMoneda ?? "€"}/año)</label>
                <input id="filtro-salario" type="number" value={salarioMin} onChange={(e) => setSalarioMin(e.target.value)}
                  placeholder="Ej: 20000" className="w-full text-sm" />
              </div>
              <div className="mb-4">
                <label htmlFor="filtro-salario-max" className="block text-xs mb-1.5" style={{ color: "#94a3b8" }}>Salario máximo ({PAISES[paisSeleccionado]?.simboloMoneda ?? "€"}/año)</label>
                <input id="filtro-salario-max" type="number" value={salarioMax} onChange={(e) => setSalarioMax(e.target.value)}
                  placeholder="Ej: 50000" className="w-full text-sm" />
              </div>
              <button onClick={() => buscar()} className="btn-game w-full text-xs py-2">Aplicar filtros</button>
            </div>
            </div>
          </aside>

          {/* Resultados */}
          <div className="flex-1 min-w-0">
            {cargando && (
              <div className="grid sm:grid-cols-2 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="card-game p-4 animate-pulse">
                    <div className="h-3 rounded w-1/4 mb-3" style={{ background: "#252836" }} />
                    <div className="h-4 rounded w-3/4 mb-2" style={{ background: "#252836" }} />
                    <div className="h-3 rounded w-1/2 mb-2" style={{ background: "#252836" }} />
                    <div className="h-3 rounded w-1/3 mb-4" style={{ background: "#252836" }} />
                    <div className="flex gap-2">
                      <div className="flex-1 h-9 rounded-lg" style={{ background: "#252836" }} />
                      <div className="flex-1 h-9 rounded-lg" style={{ background: "#252836" }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!cargando && error && (
              <div className="rounded-xl px-4 py-3 text-sm flex items-start gap-2" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444" }}>
                <AlertTriangle size={15} strokeWidth={2} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {!cargando && !buscado && paraTi?.estado === "ok" && paraTi.ofertas.length > 0 && (
              <div>
                <div className="mb-3">
                  <h2 className="text-sm font-bold" style={{ color: "#f1f5f9" }}>Ofertas según tu CV</h2>
                  <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>
                    De lo que has trabajado ({paraTi.puestos.join(", ").toLowerCase()}), primero las de tu zona.
                  </p>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  {paraTi.ofertas.map((o) => <JobCard key={o.id} {...o} />)}
                </div>
              </div>
            )}
            {!cargando && !buscado && paraTi?.estado === "sin-cv" && (
              <div className="card-game p-6 text-center">
                <p className="text-sm font-semibold" style={{ color: "#f1f5f9" }}>Aquí te saldrán ofertas de lo tuyo</p>
                <p className="text-xs mt-1 mb-4" style={{ color: "#94a3b8" }}>
                  Pon en tu CV de qué has trabajado y te enseñamos ofertas que encajan, cerca de ti. Nada al azar.
                </p>
                <Link href="/app/curriculum" className="btn-game text-xs px-4 py-2 inline-block">Rellenar mi CV</Link>
              </div>
            )}
            {!cargando && !buscado && paraTi?.estado === "sin-ofertas" && (
              <div className="card-game p-6 text-center">
                <p className="text-sm font-semibold" style={{ color: "#f1f5f9" }}>Ahora no hay ofertas de lo tuyo en tu zona</p>
                <p className="text-xs mt-1" style={{ color: "#94a3b8" }}>
                  Busca arriba con otra ciudad o crea una alerta y te avisamos en cuanto salga una.
                </p>
              </div>
            )}

            {!cargando && !error && buscado && ofertas.length === 0 && (
              /* "Prueba con otras palabras clave" no ayuda a nadie: el motivo
                 casi siempre es la ciudad o un filtro puesto, y arreglarlo son
                 dos clics. Se dice qué se buscó exactamente y se ofrece la
                 salida, en vez de dejar al usuario adivinando. */
              <div className="card-game p-8 text-center">
                <p className="text-4xl mb-3"></p>
                <p className="font-semibold text-sm" style={{ color: "#f1f5f9" }}>
                  Sin ofertas de {keyword ? <>«{keyword}»</> : "eso"}
                  {ubicacion ? <> en {ubicacion}</> : null} ({nombrePais(paisSeleccionado)})
                </p>
                <p className="text-xs mt-2" style={{ color: "#94a3b8" }}>Prueba a quitar algo de la búsqueda:</p>
                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                  {ubicacion && (
                    <button onClick={() => { setUbicacion(""); setGeoDetected(false); setTimeout(() => buscar(), 0); }}
                      className="px-3 py-2 rounded-lg text-xs font-semibold"
                      style={{ background: "#22c55e", color: "#0f1117" }}>
                      Buscar en todo el país
                    </button>
                  )}
                  {(jornada || experiencia || inclusiva || salarioMin || salarioMax) && (
                    <button onClick={() => { setJornada(""); setExperiencia(""); setInclusiva(false); setSalarioMin(""); setSalarioMax(""); setTimeout(() => buscar(), 0); }}
                      className="px-3 py-2 rounded-lg text-xs font-semibold"
                      style={{ background: "#1e212b", color: "#f1f5f9", border: "1px solid #2d3142" }}>
                      Quitar los filtros
                    </button>
                  )}
                  <button onClick={() => router.push(`/app/gusi?q=${encodeURIComponent(`${keyword} en ${ubicacion}`.trim())}`)}
                    className="px-3 py-2 rounded-lg text-xs font-semibold"
                    style={{ background: "#1e212b", color: "#f1f5f9", border: "1px solid #2d3142" }}>
                    Que lo busque Guzzi
                  </button>
                </div>
              </div>
            )}


            {!cargando && ofertas.length > 0 && (
              <>
                <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <p className="text-xs" style={{ color: "#64748b" }}>
                      {esEnTiempoReal ? `${ofertas.length} ofertas` : `${ofertas.length} de ${totalEsMinimo ? "más de " : ""}${(totalResultados > ofertas.length ? totalResultados : ofertas.length).toLocaleString("es-ES")} ofertas`}
                    </p>
                    {esEnTiempoReal && <p className="text-[10px]" style={{ color: "#6b7280" }}>Resultados en tiempo real</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setMostrarAlertaModal(true)}
                        className="text-[11px] px-3 py-1.5 rounded-lg font-medium transition"
                        style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", color: "#22c55e" }}>Alerta
                      </button>
                      <InfoTooltip text="Te avisamos por email cuando salgan nuevas ofertas que coincidan con esta búsqueda. Puedes elegir frecuencia diaria o semanal." position="bottom" />
                    </div>
                    <a href="/app/guardados"
                      className="text-[11px] px-3 py-1.5 rounded-lg font-medium transition"
                      style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444" }}>
                      Guardados
                    </a>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  {ofertas.map(oferta => <JobCard key={oferta.id} {...oferta} />)}
                </div>
                
                {hayMas && (
                  <div className="flex flex-col items-center mt-6 gap-2">
                    {/* Sentinel para IntersectionObserver — dispara cargarMas() */}
                    <div ref={sentinelRef} className="w-full h-1" />
                    {cargandoMas && (
                      <div className="flex items-center gap-2 py-4">
                        <div className="animate-spin rounded-full h-5 w-5 border-2" style={{ borderColor: "#2d3142", borderTopColor: "#22c55e" }} />
                        <span className="text-xs" style={{ color: "#64748b" }}>Cargando más ofertas...</span>
                      </div>
                    )}
                    <p className="text-[10px]" style={{ color: "#6b7280" }}>
                      Mostrando {ofertas.length.toLocaleString("es-ES")} de {totalEsMinimo ? "más de " : ""}{totalResultados.toLocaleString("es-ES")} ofertas
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Las empresas de la zona, en la misma pantalla que las ofertas.
                Antes eran dos apartados distintos del menu y habia que saber
                por tu cuenta que si buscas de camarero te interesan los bares.
                Solo aparece si el oficio encaja en un sector con negocios de
                calle: a un programador no se le ensenan bares. */}
            {!cargando && buscado && ubicacion && !paisPorNombre(ubicacion) && keyword && sectorDeOficio(keyword) && (
              <EmpresasDeLaZona
                sector={sectorDeOficio(keyword) as string}
                ciudad={ubicacion}
                oficio={keyword}
              />
            )}
          </div>
        </div>
      </div>

      {/* Modal alerta */}
      {mostrarAlertaModal && (
        <AlertaModal keyword={keyword} location={ubicacion}
          onClose={() => setMostrarAlertaModal(false)} onCreada={() => setAlertaCreada(true)} />
      )}

      {alertaCreada && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-xl text-xs font-medium"
          style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)", color: "#22c55e" }}>
          Alerta creada. Te avisaremos de nuevas ofertas.
        </div>
      )}
    </div>
  );
}

function AlertaModal({ keyword, location, onClose, onCreada }: {
  keyword: string; location: string; onClose: () => void; onCreada: () => void;
}) {
  const [freq, setFreq] = useState<"daily" | "weekly">("daily");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function crear() {
    setLoading(true);
    setError("");
    try {
      const session = (await getSupabaseBrowser().auth.getSession()).data.session;
      if (!session) { setError("Debes iniciar sesión"); return; }
      const res = await fetch("/api/jobs/alertas", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ keyword, location, frequency: freq }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data as { error?: string }).error || "Error al crear alerta");
        return;
      }
      onCreada(); onClose();
    } catch { setError("Error de red"); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }} onClick={onClose}>
      <div className="w-full max-w-sm rounded-xl p-5 space-y-4" style={{ background: "#1e212b", border: "1px solid #2d3142" }} onClick={e => e.stopPropagation()}>
        <h3 className="font-semibold text-sm" style={{ color: "#f1f5f9" }}>Crear alerta de empleo</h3>
        <p className="text-xs" style={{ color: "#64748b" }}>Te avisaremos cuando haya nuevas ofertas para:</p>
        <div className="p-2.5 rounded-lg" style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)" }}>
          <p className="text-xs font-medium" style={{ color: "#22c55e" }}>{keyword || "Cualquier puesto"} {location ? `en ${location}` : ""}</p>
        </div>
        <div>
          <label className="text-[11px] block mb-1.5" style={{ color: "#94a3b8" }}>Frecuencia</label>
          <div className="flex gap-2">
            {(["daily", "weekly"] as const).map(f => (
              <button key={f} onClick={() => setFreq(f)}
                className="flex-1 py-2 rounded-lg text-[11px] font-medium transition"
                style={{
                  background: freq === f ? "rgba(34,197,94,0.12)" : "#2d3142",
                  border: freq === f ? "1px solid rgba(34,197,94,0.3)" : "1px solid #2d3142",
                  color: freq === f ? "#22c55e" : "#64748b",
                }}>
                {f === "daily" ? "Diaria" : "Semanal"}
              </button>
            ))}
          </div>
        </div>
        {error && <p className="text-[11px]" style={{ color: "#ef4444" }}>{error}</p>}
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-[11px] rounded-lg" style={{ border: "1px solid #2d3142", color: "#94a3b8" }}>Cancelar</button>
          <button onClick={crear} disabled={loading} className="btn-game px-5 py-2 text-[11px] disabled:opacity-50">{loading ? "Creando..." : "Crear"}</button>
        </div>
      </div>
    </div>
  );
}

export default function BuscarPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8" style={{ border: "3px solid #2d3142", borderTopColor: "#22c55e" }} />
      </div>
    }>
      <BuscarPageInner />
    </Suspense>
  );
}
