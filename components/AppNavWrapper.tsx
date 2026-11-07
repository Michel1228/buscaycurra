"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import GuzziAvatar from "@/components/GuzziAvatar";
import LogoGusano from "@/components/LogoGusano";
import FondoOleaje from "@/components/FondoOleaje";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import NotificationBell from "@/components/NotificationBell";
import { PAISES, LISTA_PAISES } from "@/lib/paises";
import { IDIOMAS, type IdiomaCode } from "@/lib/i18n/translations";
import { useLanguage } from "@/components/LanguageProvider";
import { isNativeIOS } from "@/lib/utils/platform";
import { inicializarRevenueCat } from "@/lib/hooks/useRevenueCat";

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "";

// SEIS SECCIONES, LAS MISMAS EN TODAS PARTES (7 nov 2026, bocetos de Michel).
//
// El menú tenía dieciséis entradas en una sola lista, y cada boceto traía su
// propia barra con nombres distintos. Ahora hay seis secciones fijas —las
// mismas arriba en el ordenador, en la barra de abajo del móvil y al principio
// del menú— y el resto va en "Más".
//
// Cada sección apunta a una pantalla que YA existía:
//  - Inicio → /app/bienvenida. Es el resumen del día, la pantalla a la que uno
//    quiere volver (antes no estaba en ningún menú y se perdía).
//  - Ofertas → /app/buscar. Sigue encendida en /app/empresas: son las dos
//    mitades de "buscar y enviar CV" (antes eran dos entradas separadas y
//    nadie llegaba a la segunda).
//  - Automatizaciones → /app/envios: los envíos programados en la cola, lo
//    enviado y las alertas.
const SECCIONES: { href: string; label: string; icon: string; title: string; tambien?: string[] }[] = [
  { href: "/app/bienvenida", label: "Inicio",      icon: "inicio",      title: "Tu resumen del día" },
  { href: "/app/buscar",     label: "Ofertas",     icon: "ofertas",     title: "Buscar ofertas y empresas a las que enviar tu CV",
    tambien: ["/app/empresas", "/app/ofertas", "/app/guardados"] },
  { href: "/app/curriculum", label: "Mi CV",       icon: "cv",          title: "Mi currículum" },
  { href: "/app/pipeline",   label: "Pipeline",    icon: "pipeline",    title: "Cómo van tus candidaturas" },
  { href: "/app/envios",     label: "Automatizaciones", icon: "automatizaciones", title: "Envíos programados, lo enviado y tus alertas" },
  { href: "/app/entrevistas",label: "Entrevistas", icon: "entrevistas", title: "Simulador de entrevistas" },
];

// Lo demás, en "Más". Guzzi va el primero: también está en el centro de la
// barra de abajo y como botón arriba a la derecha en el ordenador.
const MAS: { href: string; label: string; icon: string; title: string }[] = [
  { href: "/app/gusi",       label: "Guzzi",      icon: "guzzi", title: "Guzzi - Asistente IA" },
  { href: "/app/guardados",  label: "Guardados",  icon: "guardados", title: "Ofertas guardadas" },
  { href: "/app/formacion",  label: "Cursos",     icon: "cursos", title: "Cursos y carnets: cuánto cuestan y dónde sacarlos gratis" },
  { href: "/app/emigrar",    label: "Emigrar",    icon: "emigrar", title: "Guía para emigrar" },
  // Una sola entrada (21 oct 2026): la página tiene dentro las pestañas Au Pair
  // y Live-in Nanny, y la entrada "Live-in Nanny" abría la misma pantalla de Au
  // Pair (la página no lee ?modo=). Dos entradas para lo mismo, una que engañaba.
  { href: "/app/au-pair",    label: "Au Pair y Nanny", icon: "aupair", title: "Perfil y ofertas Au Pair y Live-in Nanny" },
  { href: "/app/salarios",   label: "Salarios",   icon: "salarios", title: "Comparador de salarios" },
  { href: "/app/reviews",    label: "Reviews",    icon: "reviews", title: "Reviews de empresas" },
  { href: "/app/referidos",  label: "Invitar",    icon: "referidos", title: "Invitar amigos" },
  { href: "/app/ayuda",      label: "Ayuda",      icon: "ayuda", title: "Centro de ayuda" },
  { href: "/app/perfil?tab=plan",     label: "Mi Plan",    icon: "plan", title: "Mi plan y cuenta" },
];

// La barra de abajo del móvil: cinco huecos. Guzzi en el centro, que es lo
// que más se usa; "Más" abre el menú con el resto.
const BARRA_ABAJO = ["/app/bienvenida", "/app/buscar", "GUZZI", "/app/curriculum", "MAS"] as const;

// Donde la barra de abajo estorba: el chat de Guzzi tiene su propia caja de
// escribir abajo (como WhatsApp dentro de una conversación).
const SIN_BARRA_ABAJO = ["/app/gusi", "/app/admin"];

/** Iconos SVG premium con color — paleta BuscayCurra */
const ICON_COLORS: Record<string, string> = {
  inicio: "#22c55e",
  cursos: "#a855f7",
  buscar: "#22c55e",
  cv: "#f59e0b",
  pipeline: "#3b82f6",
  entrevistas: "#a855f7",
  emigrar: "#06b6d4",
  aupair: "#ec4899",
  salarios: "#f59e0b",
  guardados: "#22c55e",
  reviews: "#fbbf24",
  empresas: "#3b82f6",
  envios: "#06b6d4",
  referidos: "#a855f7",
  ayuda: "#94a3b8",
  plan: "#22c55e",
};
// ICON_COLORS se queda por si algun dia hace falta un acento por seccion, pero
// hoy no lo usa el menu (ver NavIcon).
void ICON_COLORS;

function seccionActiva(pathname: string, s: { href: string; tambien?: string[] }): boolean {
  return [s.href, ...(s.tambien || [])].some((r) => pathname === r || pathname.startsWith(r + "/"));
}

/**
 * POR QUE LOS ICONOS DEL MENU NO SON DE COLORES.
 *
 * Habia diecisiete entradas con nueve colores distintos —Emigrar cian, Au Pair
 * rosa, Salarios naranja, Reviews amarillo— y ademas un glow de neon en cada
 * una. Ninguno de esos colores significaba nada: no encodean categoria, ni
 * estado, ni urgencia. Y como TODOS brillaban, el que estabas mirando no
 * destacaba.
 *
 * El color dice una sola cosa: verde (el lima del diseño de neón desde el
 * 7 nov 2026) si estas en esa seccion, gris si no. El mismo gris que la
 * etiqueta, para que icono y texto vayan juntos.
 */
function NavIcon({ name, size = 22, activo = false }: { name: string; size?: number; activo?: boolean }) {
  const s = size;
  const color = activo ? "#a3e635" : "#94a3b8";

  const base = {
    width: s, height: s, viewBox: "0 0 24 24",
    fill: "none", stroke: color, strokeWidth: "1.8",
    strokeLinecap: "round" as const, strokeLinejoin: "round" as const,
    "aria-hidden": true,
    className: "nav-icon shrink-0",
  };

  switch (name) {
    case "cursos":
      return <svg {...base}><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>;
    case "inicio":
      return <svg {...base}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
    case "ofertas":
      return <svg {...base}><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><path d="M2 13h20"/></svg>;
    case "cv":
      return <svg {...base}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>;
    case "pipeline":
      return <svg {...base}><path d="M3 3v18h18"/><path d="M8 17v-5"/><path d="M13 17V8"/><path d="M18 17v-8"/></svg>;
    case "automatizaciones":
      return <svg {...base}><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>;
    case "entrevistas":
      return <svg {...base}><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>;
    case "emigrar":
      return <svg {...base}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>;
    case "aupair":
      return <svg {...base}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
    case "salarios":
      return <svg {...base}><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/></svg>;
    case "guardados":
      return <svg {...base}><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>;
    case "reviews":
      return <svg {...base} fill={color + "20"}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
    case "referidos":
      return <svg {...base}><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>;
    case "ayuda":
      return <svg {...base}><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
    case "plan":
      return <svg {...base}><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>;
    case "mas":
      return <svg {...base}><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>;
    default:
      return <svg {...base}><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>;
  }
}

export default function AppNavWrapper() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [esAdmin, setEsAdmin] = useState(false);
  const [userId, setUserId] = useState("");
  const [userInicial, setUserInicial] = useState("");
  const [paisSeleccionado, setPaisSeleccionado] = useState("ES");
  const { lang, t, setLang } = useLanguage();
  const navLabel = (key: string) => t(key);

  const enApp = pathname.startsWith("/app");
  const conBarraAbajo = enApp && !SIN_BARRA_ABAJO.some((r) => pathname === r || pathname.startsWith(r + "/"));

  // FIX: Forzar scroll al top al montar — evita que la nav quede oculta en móviles
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Al cambiar de pantalla, el menú se cierra (se puede navegar con la barra
  // de abajo sin cerrarlo antes).
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  // CON EL MENU ABIERTO, EL FONDO NO SE MUEVE.
  //
  // Sin esto, al arrastrar dentro del menu para llegar abajo se desplazaba
  // tambien la pagina de detras, y el menu —que va posicionado sobre ella— se
  // iba de sitio mientras lo mirabas. De ahi la sensacion de que "se desliza
  // solo para abajo" y de que no da tiempo a pulsar lo ultimo.
  useEffect(() => {
    if (!mobileOpen) return;
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Escape cierra el menú también con el teclado (antes solo con el ratón).
    const alTeclear = (e: KeyboardEvent) => { if (e.key === "Escape") setMobileOpen(false); };
    document.addEventListener("keydown", alTeclear);
    return () => {
      document.body.style.overflow = antes;
      document.removeEventListener("keydown", alTeclear);
    };
  }, [mobileOpen]);

  // La barra de abajo ocupa sitio: el body deja ese hueco al final (globals.css,
  // "con-barra-inferior") para que no tape lo último de cada pantalla.
  useEffect(() => {
    document.body.classList.toggle("con-barra-inferior", conBarraAbajo);
    return () => document.body.classList.remove("con-barra-inferior");
  }, [conBarraAbajo]);

  // Cargar país guardado
  useEffect(() => {
    const saved = localStorage.getItem("bc_pais");
    if (saved) setPaisSeleccionado(saved);
  }, []);

  function cambiarPais(codigo: string) {
    setPaisSeleccionado(codigo);
    localStorage.setItem("bc_pais", codigo);
    // Auto-ajustar idioma al del país seleccionado
    const idiomaPais = PAISES[codigo]?.idioma;
    if (idiomaPais && IDIOMAS.some(i => i.code === idiomaPais)) {
      setLang(idiomaPais as IdiomaCode);
    }
  }

  async function cerrarSesion() {
    await getSupabaseBrowser().auth.signOut();
    router.push("/auth/login");
  }

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      setEsAdmin(user.email === ADMIN_EMAIL);
      setUserId(user.id);

      // Inicializar RevenueCat (compras In-App) una sola vez por sesión en iOS nativo.
      // Es el primer punto común por el que pasa cualquier usuario autenticado.
      if (isNativeIOS()) {
        void inicializarRevenueCat(user.id);
      }

      // Intentar sacar inicial del nombre real del perfil, no del email
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      if (profile?.full_name) {
        setUserInicial(profile.full_name.trim()[0].toUpperCase());
      } else if (user.user_metadata?.full_name) {
        setUserInicial(user.user_metadata.full_name.trim()[0].toUpperCase());
      } else if (user.email) {
        setUserInicial(user.email[0].toUpperCase());
      }
    });
  }, []);

  // Solo mostrar nav en rutas /app/*
  if (!enApp) return null;

  const enGuzzi = pathname === "/app/gusi";

  return (
    <>
      <FondoOleaje />

      <nav
        className="barra-app fixed top-0 left-0 right-0 z-50"
        aria-label="Principal"
        style={{
          background: "rgba(6,9,11,0.84)",
          borderBottom: "1px solid rgba(163,230,53,0.12)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          height: "56px",
        }}
      >
        <div className="h-full max-w-7xl mx-auto pl-3 pr-2 sm:px-4 flex items-center gap-1">
          {/* La marca, que lleva a Inicio (como en cualquier aplicación).
              Es también la vuelta a casa visible sin abrir nada en las
              pantallas sin barra de abajo, como el chat de Guzzi. */}
          <Link href="/app/bienvenida" className="flex items-center gap-2 min-h-[44px] pr-2 rounded-xl" aria-label="BuscayCurra, ir a Inicio"
            aria-current={pathname === "/app/bienvenida" ? "page" : undefined}>
            <LogoGusano size={30} />
            <span className="font-extrabold text-[17px] tracking-tight leading-none" aria-hidden="true">
              <span style={{ color: "#f8fafc" }}>Buscay</span><span className="texto-neon">Curra</span>
            </span>
          </Link>

          <span className="hidden lg:block h-6 w-px mx-2" style={{ background: "rgba(148,163,184,0.2)" }} aria-hidden="true" />

          {/* Las seis secciones, en el ordenador. */}
          <div className="hidden lg:flex items-center gap-1 flex-1 min-w-0">
            {SECCIONES.map((s) => {
              const activo = seccionActiva(pathname, s);
              return (
                <Link
                  key={s.href}
                  href={s.href}
                  title={s.title}
                  aria-current={activo ? "page" : undefined}
                  className="flex items-center gap-2 h-10 px-3 xl:px-3.5 rounded-full text-[14px] font-medium whitespace-nowrap transition-colors"
                  style={{
                    color: activo ? "#ecfccb" : "#a7b3c6",
                    background: activo ? "rgba(163,230,53,0.12)" : "transparent",
                    border: `1px solid ${activo ? "rgba(163,230,53,0.45)" : "transparent"}`,
                    boxShadow: activo ? "0 0 18px -6px rgba(163,230,53,0.7)" : "none",
                  }}
                >
                  <span className="hidden xl:inline-flex"><NavIcon name={s.icon} size={18} activo={activo} /></span>
                  {navLabel(s.label)}
                </Link>
              );
            })}
          </div>
          <div className="flex-1 lg:hidden" />

          {/* Guzzi, a mano desde cualquier pantalla del ordenador. En el móvil
              está en el centro de la barra de abajo. */}
          <Link
            href="/app/gusi"
            className="hidden lg:inline-flex items-center gap-2 h-10 pl-1 pr-3.5 mr-1 rounded-full text-[14px] font-semibold"
            style={{
              color: enGuzzi ? "#0b1406" : "#ecfccb",
              background: enGuzzi ? "linear-gradient(180deg,#d9f99d,#a3e635)" : "rgba(163,230,53,0.08)",
              border: "1px solid rgba(163,230,53,0.4)",
            }}
            aria-current={enGuzzi ? "page" : undefined}
          >
            <GuzziAvatar size={30} />
            Guzzi
          </Link>

          {/* Campana de notificaciones */}
          <NotificationBell userId={userId} />

          {/* Avatar de perfil */}
          <Link
            href="/app/perfil"
            className="flex items-center justify-center w-11 h-11 rounded-full"
            title="Mi perfil"
            aria-label="Mi perfil"
          >
            <span className="flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold"
              style={{ background: "rgba(163,230,53,0.12)", border: "1.5px solid rgba(163,230,53,0.45)", color: "#d9f99d" }}>
              {userInicial || (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              )}
            </span>
          </Link>

          {/* Botón de menú. En el móvil, cuando hay barra de abajo, el menú se
              abre con su "Más" y este sobra; donde no la hay (el chat), sigue. */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className={`${conBarraAbajo ? "hidden lg:flex" : "flex"} items-center justify-center w-11 h-11 rounded-full`}
            style={{ color: mobileOpen ? "#d9f99d" : "#94a3b8" }}
            aria-label="Menú"
            aria-expanded={mobileOpen}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <line x1="3" y1="5" x2="17" y2="5" />
              <line x1="3" y1="10" x2="17" y2="10" />
              <line x1="3" y1="15" x2="17" y2="15" />
            </svg>
          </button>
        </div>
      </nav>

      {/* Menu overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40"
          style={{ background: "rgba(0,0,0,0.55)" }}
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="menu-movil cristal absolute top-[60px] left-3 right-3 lg:left-auto lg:right-4 lg:w-[400px] p-3 overflow-y-auto"
            // La altura va en globals.css (.menu-movil), NO aqui. En un objeto
            // de JavaScript no se pueden poner dos veces la misma propiedad para
            // hacer respaldo: la segunda pisa a la primera y ya esta. Si el
            // navegador no entiende dvh, se quedaria SIN altura maxima. En CSS
            // si funciona el respaldo, declarando vh y luego dvh.
            style={{ background: "rgba(10,13,19,0.97)" }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Menú"
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] px-2 pt-1 pb-2" style={{ color: "var(--texto-tenue)" }}>Secciones</p>
            <div className="grid grid-cols-2 gap-1.5">
              {SECCIONES.map((s) => {
                const activo = seccionActiva(pathname, s);
                return (
                  <Link
                    key={s.href}
                    href={s.href}
                    onClick={() => setMobileOpen(false)}
                    aria-current={activo ? "page" : undefined}
                    className="flex items-center gap-2.5 px-3 min-h-[48px] rounded-xl text-[14px] font-medium"
                    style={{
                      background: activo ? "rgba(163,230,53,0.1)" : "rgba(255,255,255,0.03)",
                      border: `1px solid ${activo ? "rgba(163,230,53,0.4)" : "rgba(148,163,184,0.12)"}`,
                      color: activo ? "#ecfccb" : "#dbe3ee",
                    }}
                  >
                    <NavIcon name={s.icon} size={20} activo={activo} />
                    <span className="truncate">{navLabel(s.label)}</span>
                  </Link>
                );
              })}
            </div>

            <p className="text-[11px] font-bold uppercase tracking-[0.16em] px-2 pt-4 pb-1" style={{ color: "var(--texto-tenue)" }}>Más</p>
            {MAS.map((item) => {
              const activo =
                pathname === item.href ||
                (item.href !== "/app" && pathname.startsWith(item.href + "/"));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.title}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-3 min-h-[44px] rounded-xl text-sm transition"
                  style={{
                    background: activo ? "rgba(163,230,53,0.08)" : "transparent",
                    color: activo ? "#ecfccb" : "#a7b3c6",
                  }}
                >
                  {item.href === "/app/gusi" ? (
                    <GuzziAvatar size={22} />
                  ) : (
                    <NavIcon name={item.icon} size={20} activo={activo} />
                  )}
                  <span>{navLabel(item.label)}</span>
                </Link>
              );
            })}
            {esAdmin && (
              <Link href="/app/admin" onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3 min-h-[44px] rounded-xl text-sm transition"
                style={{ background: pathname === "/app/admin" ? "rgba(245,158,11,0.08)" : "transparent", color: "#f59e0b" }}>
                <NavIcon name="reviews" size={20} activo={pathname.startsWith("/app/reviews")} />
                <span>Admin</span>
              </Link>
            )}

            <div style={{ height: "1px", background: "rgba(148,163,184,0.14)", margin: "10px 0" }} />

            {/* Región e idioma */}
            <div className="mb-2">
              <p className="text-[11px] uppercase tracking-wider px-2 mb-1.5 flex items-center gap-1.5" style={{ color: "var(--texto-tenue)" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#a3e635" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                Región e idioma
              </p>
              <div className="flex gap-2">
                <div className="flex-1">
                  <select
                    value={paisSeleccionado}
                    onChange={(e) => cambiarPais(e.target.value)}
                    aria-label="País"
                    className="w-full px-2.5 py-2 rounded-lg text-xs appearance-none cursor-pointer"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "#e2e8f0",
                    }}
                  >
                    {LISTA_PAISES.map((p) => (
                      <option key={p.codigo} value={p.codigo} style={{ background: "#1e212b" }}>
                        {p.bandera} {p.nombre} ({p.simboloMoneda})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <select
                    value={lang}
                    onChange={(e) => {
                      const code = e.target.value as IdiomaCode;
                      setLang(code);
                    }}
                    aria-label="Idioma"
                    className="w-full px-2.5 py-2 rounded-lg text-xs appearance-none cursor-pointer"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "#e2e8f0",
                    }}
                  >
                    {IDIOMAS.map((idioma) => (
                      <option key={idioma.code} value={idioma.code} style={{ background: "#1e212b" }}>
                        {idioma.flag} {idioma.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div style={{ height: "1px", background: "rgba(148,163,184,0.14)", margin: "6px 0" }} />
            {/* Acceso a la descarga: en iPhone lleva a la App Store y en
                Android a instalarla desde el navegador (mismas funciones,
                mientras no esté en Google Play). */}
            <Link href="/descargar" onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-3 min-h-[44px] rounded-xl text-sm transition"
              style={{ color: "#a7b3c6" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                <line x1="12" y1="18" x2="12.01" y2="18"/>
              </svg>
              <span>Descargar app</span>
            </Link>
            <button
              onClick={() => { setMobileOpen(false); cerrarSesion(); }}
              className="w-full flex items-center gap-3 px-3 min-h-[44px] rounded-xl text-sm transition"
              style={{ color: "#f87171" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              <span>Cerrar sesión</span>
            </button>
          </div>
        </div>
      )}

      {/* Barra de abajo del móvil: Inicio, Ofertas, Guzzi, Mi CV y Más. Va por
          encima del menú (z-50) para poder cerrarlo con el mismo "Más". */}
      {conBarraAbajo && (
        <nav
          className="barra-app lg:hidden fixed bottom-0 left-0 right-0 z-50"
          aria-label="Secciones"
          style={{
            height: "calc(64px + env(safe-area-inset-bottom, 0px))",
            paddingBottom: "env(safe-area-inset-bottom, 0px)",
            background: "rgba(6,9,11,0.9)",
            borderTop: "1px solid rgba(163,230,53,0.14)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
          }}
        >
          <ul className="h-16 grid grid-cols-5">
            {BARRA_ABAJO.map((hueco) => {
              if (hueco === "GUZZI") {
                return (
                  <li key={hueco} className="flex justify-center">
                    <Link href="/app/gusi" className="flex flex-col items-center justify-end gap-0.5 pb-1.5 min-w-[64px]" aria-label="Hablar con Guzzi">
                      <span className="guzzi-aro inline-flex -mt-5" style={{ padding: 2 }}>
                        <span className="block overflow-hidden rounded-full" style={{ width: 44, height: 44, background: "#f6efd8" }}>
                          <GuzziAvatar size={44} className="scale-[1.2]" />
                        </span>
                      </span>
                      <span className="text-[11px] font-semibold" style={{ color: "#d9f99d" }}>Guzzi</span>
                    </Link>
                  </li>
                );
              }
              if (hueco === "MAS") {
                return (
                  <li key={hueco}>
                    <button
                      type="button"
                      onClick={() => setMobileOpen((v) => !v)}
                      aria-expanded={mobileOpen}
                      className="w-full h-full flex flex-col items-center justify-center gap-1"
                    >
                      <NavIcon name="mas" size={22} activo={mobileOpen} />
                      <span className="text-[11px] font-medium" style={{ color: mobileOpen ? "#d9f99d" : "#a7b3c6" }}>Más</span>
                    </button>
                  </li>
                );
              }
              const s = SECCIONES.find((x) => x.href === hueco)!;
              const activo = !mobileOpen && seccionActiva(pathname, s);
              return (
                <li key={hueco}>
                  <Link
                    href={s.href}
                    aria-current={activo ? "page" : undefined}
                    className="relative w-full h-full flex flex-col items-center justify-center gap-1"
                  >
                    {activo && <span className="absolute top-0 h-[3px] w-8 rounded-b-full" style={{ background: "#a3e635", boxShadow: "0 0 12px rgba(163,230,53,0.9)" }} aria-hidden="true" />}
                    <NavIcon name={s.icon} size={22} activo={activo} />
                    <span className="text-[11px] font-medium" style={{ color: activo ? "#d9f99d" : "#a7b3c6" }}>{navLabel(s.label)}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </>
  );
}
