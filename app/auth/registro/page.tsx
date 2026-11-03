"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { NUM_PAISES } from "@/lib/paises";
import Image from "next/image";
import { Globe, Target, Clock, Mail } from "lucide-react";
import { palabraPrincipal } from "@/lib/job-search/puestos-del-cv";
import { destinoSeguro } from "@/lib/auth/destino";
import { sugerenciaCorreo } from "@/lib/auth/sugerencia-correo";
import { llegadaDeEstaVisita, COMO_NOS_CONOCIO } from "@/lib/origen/llegada";
import { plataforma } from "@/lib/utils/platform";

/** La bandeja de entrada de los correos más comunes, para confirmar con un toque. */
function bandejaDe(email: string): { nombre: string; url: string } | null {
  const d = email.trim().toLowerCase().split("@")[1] || "";
  // authuser abre la cuenta de ese correo aunque el móvil tenga varias (u/0 abría
  // la primera), e in:anywhere busca también en spam, que la búsqueda normal no mira.
  if (/^(gmail|googlemail)\.com$/.test(d)) return { nombre: "Gmail", url: `https://mail.google.com/mail/u/?authuser=${encodeURIComponent(email.trim())}#search/in%3Aanywhere+buscaycurra` };
  if (/^(hotmail|outlook|live|msn)\.[a-z.]+$/.test(d)) return { nombre: "Outlook", url: "https://outlook.live.com/mail/0/" };
  if (/^yahoo\.[a-z.]+$/.test(d)) return { nombre: "Yahoo Mail", url: "https://mail.yahoo.com/" };
  if (/^(icloud|me|mac)\.com$/.test(d)) return { nombre: "iCloud Mail", url: "https://www.icloud.com/mail" };
  return null;
}

function RegistroPageInner() {
  const searchParams = useSearchParams();
  const referralCode = useMemo(() => {
    const raw = searchParams.get("ref");
    return raw ? raw.trim().toUpperCase() : null;
  }, [searchParams]);

  // VIENE DE UNA OFERTA (18 oct 2026). De Google llegan unas 80 personas al
  // día a fichas de oferta y se registraban 2 o 3: el registro no decía para
  // qué era y, al confirmar el correo, te dejaba en la portada sin la oferta.
  // Ahora se dice a quién va el CV, se rellenan ciudad y oficio, y el destino
  // se guarda en la cuenta (sirve aunque el correo se abra en otro navegador).
  const ofertaId = useMemo(() => {
    const v = searchParams.get("oferta");
    return v && /^[a-z0-9]{8,40}$/i.test(v) ? v : null;
  }, [searchParams]);
  const desde = useMemo(() => {
    const v = searchParams.get("desde");
    return v && /^[a-z0-9/-]{1,80}$/i.test(v) ? v : null;
  }, [searchParams]);
  // Viene de un botón de la web que lleva dentro de la app ("Buscar ofertas en
  // Suecia"): el middleware le manda aquí con el destino, y vuelve a él.
  const destinoParam = useMemo(() => destinoSeguro(searchParams.get("destino")), [searchParams]);
  const destinoCuenta = ofertaId ? `/app/ofertas/${ofertaId}` : destinoParam;
  const [oferta, setOferta] = useState<{ titulo: string; empresa: string | null; ciudad: string | null } | null>(null);

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [correoAvisado, setCorreoAvisado] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [oficio, setOficio] = useState("");
  const [conocio, setConocio] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [confirmarContrasena, setConfirmarContrasena] = useState("");
  const [verContrasena, setVerContrasena] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [registrado, setRegistrado] = useState(false);
  const [error, setError] = useState("");
  const [reenvio, setReenvio] = useState<"" | "enviando" | "hecho" | "error">("");

  /** Si el email de confirmación se pierde o cae en spam, sin esto el usuario
   *  se quedaba atrapado: el registro no lo reenvía y el login solo dice
   *  "confirma tu email" sin ofrecer ninguna salida. */
  const reenviarConfirmacion = async () => {
    setReenvio("enviando");
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== "undefined" ? window.location.origin : "");
    const { error: rErr } = await getSupabaseBrowser().auth.resend({
      type: "signup",
      email: email.trim(),
      options: { emailRedirectTo: `${siteUrl}/auth/callback` },
    });
    setReenvio(rErr ? "error" : "hecho");
  };

  useEffect(() => {
    if (!ofertaId) return;
    fetch(`/api/ofertas/resumen?id=${encodeURIComponent(ofertaId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((o: { titulo: string; empresa: string | null; ciudad: string | null } | null) => {
        if (!o?.titulo) return;
        setOferta(o);
        if (o.ciudad) setCiudad((c) => c || o.ciudad || "");
        const oficioOferta = palabraPrincipal(o.titulo);
        if (oficioOferta) setOficio((v) => v || oficioOferta);
      })
      .catch(() => { /* sin resumen, el registro sigue igual */ });
  }, [ofertaId]);

  const validar = (): string => {
    if (!nombre.trim()) return "El nombre es obligatorio.";
    if (contrasena.length < 8) return "Mínimo 8 caracteres.";
    if (contrasena !== confirmarContrasena) return "Las contraseñas no coinciden.";
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const err = validar();
    if (err) { setError(err); return; }
    // Con una errata la confirmación no llega nunca y esa persona no se entera
    // (1 nov 2026: gmails.com y gmail.comñ pasaron con la sugerencia a la vista).
    // Se para una sola vez: si el correo está bien, al volver a pulsar sigue.
    const sugerido = sugerenciaCorreo(email);
    if (sugerido && correoAvisado !== email.trim()) {
      setCorreoAvisado(email.trim());
      setError(`¿Tu correo es ${sugerido}? A «${email.trim()}» puede que no te llegue la confirmación. Corrígelo o, si está bien, vuelve a pulsar.`);
      return;
    }
    setCargando(true);
    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== "undefined" ? window.location.origin : "");
      const llegada = llegadaDeEstaVisita();
      const { data, error: sErr } = await getSupabaseBrowser().auth.signUp({
        email: email.trim(),
        password: contrasena,
        options: {
          // El código de referido va también en la cuenta: la bienvenida se hace
          // al confirmar el correo, y entonces el formulario ya no está.
          data: {
            full_name: nombre.trim(), ciudad: ciudad.trim(),
            ...(oficio.trim() ? { oficio: oficio.trim().slice(0, 80) } : {}),
            ...(referralCode ? { ref: referralCode } : {}),
            // A dónde volver al confirmar, y de dónde vino (para medir).
            ...(destinoCuenta ? { destino: destinoCuenta } : {}),
            ...(ofertaId ? { origen: `oferta:${ofertaId}` } : desde ? { origen: `desde:${desde}` } : destinoParam ? { origen: `destino:${destinoParam.split("?")[0]}` } : {}),
            // Por qué canal llegó (23 oct 2026): lo que contesta, de qué web venía
            // y si se registra desde la app o la web (lib/origen/llegada.ts).
            ...(conocio ? { conocio } : {}),
            llego_de: llegada.llegoDe,
            ...(llegada.campana ? { campana: llegada.campana } : {}),
            plataforma: plataforma(),
          },
          emailRedirectTo: `${siteUrl}/auth/callback`,
        },
      });
      if (sErr) {
        if (sErr.message.includes("already registered")) setError("Este email ya está registrado.");
        else if (sErr.message.includes("weak password")) setError("Contraseña demasiado débil.");
        // También es un 429, pero no es el límite por hora: Supabase pide esperar
        // entre dos correos a la misma persona, que ya tiene uno de hace un momento.
        else if (/after \d+ seconds?/i.test(sErr.message)) {
          const segundos = sErr.message.match(/after (\d+) second/i)?.[1];
          setError(`Acabamos de mandarte el correo de confirmación a ${email.trim()}. Míralo también en spam; si no está, vuelve a intentarlo en ${segundos} segundos.`);
        }
        // Supabase limita los correos de confirmación por hora. Antes salía un
        // "No se pudo crear la cuenta." a secas y la persona se iba creyendo que
        // la web no funcionaba (6 oct 2026).
        else if (sErr.status === 429 || /rate limit/i.test(sErr.message)) {
          // Se apunta para que el centinela avise: si pasa, hay que subir el
          // límite en el panel de Supabase (lib/centinela/limites-correo.ts).
          fetch("/api/auth/registro-cortado", { method: "POST", keepalive: true }).catch(() => {});
          setError("Ahora mismo se están registrando muchas personas y no podemos mandarte el correo de confirmación. Vuelve a intentarlo en unos minutos: tus datos no se han perdido.");
        }
        else setError(`No se pudo crear la cuenta: ${sErr.message}. Inténtalo de nuevo en un momento.`);
        return;
      }
      // Con la confirmación por email activada, Supabase NO devuelve error si el
      // email ya existe: responde OK pero con identities vacío. Sin esta
      // comprobación mostrábamos "¡Cuenta creada!" y el email nunca llegaba.
      if (data?.user && data.user.identities?.length === 0) {
        setError("Este email ya está registrado. Entra con tu contraseña o recupérala.");
        return;
      }
      setRegistrado(true);
      window.scrollTo({ top: 0 });
      fetch("/api/auth/welcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), nombre: nombre.trim(), ciudad: ciudad.trim(), oficio: oficio.trim(), userId: data?.user?.id || "", ref: referralCode }),
      }).catch((err) => { console.error('[Registro] Error welcome:', err) });
    } catch {
      setError("Error inesperado. Inténtalo de nuevo.");
    } finally {
      setCargando(false);
    }
  };

  const inputStyle = {
    background: "#0f1117",
    border: "1.5px solid #2d3142",
    color: "#f1f5f9",
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row" style={{ background: "#0f1117" }}>
      {/* Panel marketing — arriba en móvil, izquierda en desktop */}
      <div className={`w-full lg:w-1/2 ${ofertaId || desde || destinoParam || registrado ? "hidden lg:flex" : "flex"} flex-col justify-between px-6 py-8 lg:p-12 relative overflow-hidden`}
        style={{ background: "linear-gradient(135deg, #0a1f0e 0%, #0f1117 60%, #111827 100%)" }}>
        <div className="absolute inset-0 pointer-events-none">
          <div style={{
            position: "absolute", top: "10%", left: "-5%", width: "70%", height: "60%",
            background: "radial-gradient(ellipse, rgba(34,197,94,0.08) 0%, transparent 70%)",
          }} />
        </div>

        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2 mb-6 lg:mb-10">
            <Image src="/icon-192.png" alt="Guzzi" width={28} height={28} style={{ borderRadius: "50%" }} />
            <span className="font-bold text-lg" style={{ color: "#22c55e" }}>BuscayCurra</span>
          </Link>

          <h2 className="text-2xl lg:text-3xl font-bold leading-tight mb-2" style={{ color: "#f1f5f9" }}>
            Deja de enviar CVs<br />
            <span style={{ color: "#22c55e" }}>al vacío.</span>
          </h2>
          <p className="text-sm mb-6" style={{ color: "#64748b" }}>
            {`En 30 segundos tienes cuenta. Guzzi empieza a buscar trabajo por ti en ${NUM_PAISES} países al instante.`}
          </p>

          {/* 3 puntos fuertes */}
          <div className="space-y-3">
            {[
              { icon: "🌍", title: `${NUM_PAISES} países, un solo agente`, desc: "Busca en España o emigra. Guzzi traduce tu CV a 6 idiomas y te explica cómo es el CV en cada país." },
              { icon: "🎯", title: "Una carta para cada empresa", desc: "Guzzi escribe una carta distinta para cada empresa y te dice qué le falta a tu CV para cada oferta." },
              { icon: "⏰", title: "Enviado cuando toca", desc: "Tu candidatura sale en horario laboral, cuando de verdad se leen los correos." },
            ].map(p => (
              <div key={p.title} className="flex items-start gap-3 p-3 rounded-xl"
                style={{ background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.12)" }}>
                <span className="text-lg shrink-0 mt-0.5">{p.icon}</span>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "#f1f5f9" }}>{p.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 hidden lg:block text-xs mt-8" style={{ color: "#2d3142" }}>
          {`© 2026 BuscayCurra · Sin permanencia · ${NUM_PAISES} países · Cancela cuando quieras`}
        </p>
      </div>

      {/* Panel derecho — formulario */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10"
        style={{ background: "#0f1117" }}>
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-xl font-bold" style={{ color: "#f1f5f9" }}>{registrado ? "Te falta un paso" : ofertaId ? "Un paso y mandas tu CV" : "Crea tu cuenta"}</h1>
            <p className="text-xs mt-1" style={{ color: "#64748b" }}>{registrado ? "Sin confirmar tu correo no puedes entrar" : ofertaId ? "Gratis. Se tarda un minuto." : destinoParam ? "Gratis. Al terminar te llevamos a lo que estabas viendo." : "Empieza a buscar trabajo con Guzzi"}</p>
          </div>

          {/* Quien ya tiene cuenta y llega aquí desde otro móvil: entrar está arriba. */}
          {!registrado && (destinoParam || ofertaId) && (
            <p className="text-xs text-center mb-4" style={{ color: "#94a3b8" }}>
              ¿Ya tienes cuenta?{" "}
              <Link href={`/auth/login${destinoCuenta ? `?redirect=${encodeURIComponent(destinoCuenta)}` : ""}`}
                className="font-semibold underline" style={{ color: "#22c55e" }}>Entra aquí</Link>
            </p>
          )}

          {/* Lo que gana quien llega invitado: si no se dice, el enlace no motiva. */}
          {referralCode && !registrado && (
            <div className="rounded-xl p-3 mb-4 text-xs text-center" style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.25)", color: "#f1f5f9" }}>
              Vienes invitado: al confirmar tu correo empiezas con <strong>5 envíos de CV extra</strong>.
            </div>
          )}

          {oferta && !registrado && (
            <div className="rounded-xl p-4 mb-4" style={{ background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.25)" }}>
              <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#22c55e" }}>Vas a enviar tu CV a</p>
              <p className="text-sm font-bold mt-1" style={{ color: "#f1f5f9" }}>{oferta.empresa || oferta.titulo}</p>
              <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>
                {[oferta.empresa ? oferta.titulo : null, oferta.ciudad].filter(Boolean).join(" · ")}
              </p>
              <p className="text-xs mt-2" style={{ color: "#94a3b8" }}>
                Crea tu cuenta y te llevamos a la oferta con la carta preparada por Guzzi.
              </p>
            </div>
          )}

          <div className="card-game p-6">
            {registrado ? (
              <div className="text-center py-4">
                {/* AÚN NO ESTÁ HECHO (20 oct 2026). Salía un check verde diciendo
                    que la cuenta estaba creada y el botón grande llevaba al login:
                    parecía hecho, la gente iba a entrar y le salía un error en rojo. De 206
                    registros, 56 no confirmaron; de los que confirman, 9 de cada 10
                    lo hacen en los 5 primeros minutos. Lo que falta, en grande. */}
                <Mail size={44} className="mx-auto mb-3" style={{ color: "#f59e0b" }} />
                <h2 className="text-lg font-bold mb-2" style={{ color: "#f1f5f9" }}>Confirma tu correo</h2>
                <p className="text-sm mb-5" style={{ color: "#94a3b8" }}>
                  Te hemos mandado un correo a <strong style={{ color: "#f1f5f9" }}>{email}</strong>. Ábrelo y pulsa
                  «Confirmar mi cuenta».
                  {oferta ? ` Te llevará directo a la oferta${oferta.empresa ? ` de ${oferta.empresa}` : ""} para mandar tu CV.` : " Te llevará directo a tu cuenta."}
                </p>
                {bandejaDe(email) && (
                  <a href={bandejaDe(email)!.url} target="_blank" rel="noopener noreferrer"
                    className="btn-game inline-block text-sm px-5 py-2.5 mb-4">
                    Abrir {bandejaDe(email)!.nombre}
                  </a>
                )}
                <p className="text-xs mb-3" style={{ color: "#94a3b8" }}>
                  ¿No lo ves? Mira en <strong style={{ color: "#f1f5f9" }}>Spam</strong> o en <strong style={{ color: "#f1f5f9" }}>Promociones</strong>.
                  Llega de noreply@buscaycurra.es.
                </p>
                <button type="button" onClick={() => { setRegistrado(false); setReenvio(""); setTimeout(() => document.getElementById("email")?.focus(), 50); }}
                  className="text-xs font-semibold underline" style={{ color: "#22c55e" }}>
                  ¿Está mal escrito el correo? Corrígelo
                </button>

                <div className="mt-5 pt-4" style={{ borderTop: "1px solid #2d3142" }}>
                  {reenvio === "hecho" ? (
                    <p className="text-xs" style={{ color: "#22c55e" }}>
                      Te lo hemos reenviado. Mira también la carpeta de spam.
                    </p>
                  ) : (
                    <>
                      <p className="text-xs mb-2" style={{ color: "#64748b" }}>¿No te ha llegado?</p>
                      <button
                        type="button"
                        onClick={reenviarConfirmacion}
                        disabled={reenvio === "enviando"}
                        className="text-xs font-semibold underline disabled:opacity-50"
                        style={{ color: "#22c55e" }}
                      >
                        {reenvio === "enviando" ? "Enviando…" : "Reenviar email de confirmación"}
                      </button>
                      {reenvio === "error" && (
                        <p className="text-xs mt-2" style={{ color: "#ef4444" }}>
                          No se pudo reenviar. Espera un minuto e inténtalo otra vez.
                        </p>
                      )}
                    </>
                  )}
                  <p className="text-xs mt-4" style={{ color: "#64748b" }}>
                    ¿Ya lo has confirmado? <Link href="/auth/login" className="underline" style={{ color: "#94a3b8" }}>Entra aquí</Link>
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div>
                  <label htmlFor="nombre" className="block text-xs font-medium mb-1.5" style={{ color: "#94a3b8" }}>Nombre completo</label>
                  <input id="nombre" type="text" value={nombre} onChange={(e) => setNombre(e.target.value)}
                    placeholder="Tu nombre" required autoComplete="name"
                    className="w-full rounded-lg px-3.5 py-2.5 text-sm" style={inputStyle} />
                </div>

                <div>
                  <label htmlFor="email" className="block text-xs font-medium mb-1.5" style={{ color: "#94a3b8" }}>Email</label>
                  <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com" required autoComplete="email"
                    className="w-full rounded-lg px-3.5 py-2.5 text-sm" style={inputStyle} />
                  {sugerenciaCorreo(email) && (
                    <button type="button" onClick={() => setEmail(sugerenciaCorreo(email)!)}
                      className="text-xs mt-1.5 text-left" style={{ color: "#f59e0b" }}>
                      ¿Querías decir <strong className="underline">{sugerenciaCorreo(email)}</strong>?
                    </button>
                  )}
                </div>

                <div>
                  <label htmlFor="ciudad" className="block text-xs font-medium mb-1.5" style={{ color: "#94a3b8" }}>Ciudad <span style={{ color: "#64748b" }}>(opcional)</span></label>
                  <input id="ciudad" type="text" value={ciudad} onChange={(e) => setCiudad(e.target.value)}
                    placeholder="Ej: Madrid, Barcelona..."
                    autoComplete="off"
                    className="w-full rounded-lg px-3.5 py-2.5 text-sm" style={inputStyle} />
                  <p className="text-[11px] mt-1" style={{ color: "#64748b" }}>Te avisaremos cuando haya ofertas en tu zona</p>
                </div>

                <div>
                  <label htmlFor="oficio" className="block text-xs font-medium mb-1.5" style={{ color: "#94a3b8" }}>¿De qué buscas trabajo? <span style={{ color: "#64748b" }}>(opcional)</span></label>
                  <input id="oficio" type="text" value={oficio} onChange={(e) => setOficio(e.target.value)}
                    placeholder="Ej: camarera, mozo de almacén, cuidador…"
                    maxLength={80} autoComplete="organization-title"
                    className="w-full rounded-lg px-3.5 py-2.5 text-sm" style={inputStyle} />
                  <p className="text-[11px] mt-1" style={{ color: "#64748b" }}>Así Guzzi te dice qué curso te piden y dónde sacarlo gratis</p>
                </div>

                <div>
                  <label htmlFor="contrasena" className="block text-xs font-medium mb-1.5" style={{ color: "#94a3b8" }}>Contraseña</label>
                  <div className="relative">
                    <input id="contrasena" type={verContrasena ? "text" : "password"} value={contrasena} onChange={(e) => setContrasena(e.target.value)}
                      placeholder="Mínimo 8 caracteres" required minLength={8} autoComplete="new-password"
                      className="w-full rounded-lg px-3.5 py-2.5 pr-10 text-sm" style={inputStyle} />
                    <button type="button" onClick={() => setVerContrasena(v => !v)} tabIndex={-1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 hover:opacity-80 transition"
                      style={{ color: "#64748b" }} aria-label={verContrasena ? "Ocultar contraseña" : "Mostrar contraseña"}>
                      {verContrasena ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                          <line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmar" className="block text-xs font-medium mb-1.5" style={{ color: "#94a3b8" }}>Confirmar contraseña</label>
                  <div className="relative">
                    <input id="confirmar" type={verContrasena ? "text" : "password"} value={confirmarContrasena}
                      onChange={(e) => setConfirmarContrasena(e.target.value)}
                      placeholder="Repite la contraseña" required autoComplete="new-password"
                      className="w-full rounded-lg px-3.5 py-2.5 pr-10 text-sm" style={inputStyle} />
                  </div>
                  {confirmarContrasena.length > 0 && (
                    <p className="text-[11px] mt-1" style={{ color: contrasena === confirmarContrasena ? "#22c55e" : "#ef4444" }}>
                      {contrasena === confirmarContrasena ? "Coinciden" : "No coinciden"}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="conocio" className="block text-xs font-medium mb-1.5" style={{ color: "#94a3b8" }}>¿Cómo nos has conocido? <span style={{ color: "#64748b" }}>(opcional)</span></label>
                  <select id="conocio" value={conocio} onChange={(e) => setConocio(e.target.value)}
                    className="w-full rounded-lg px-3.5 py-2.5 text-sm" style={inputStyle}>
                    <option value="">Elige una opción</option>
                    {COMO_NOS_CONOCIO.map(([valor, texto]) => <option key={valor} value={valor}>{texto}</option>)}
                  </select>
                </div>

                {error && (
                  <div className="rounded-lg px-3.5 py-2.5 text-xs" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444" }}>
                    {error}
                  </div>
                )}

                <button type="submit" disabled={cargando}
                  className="btn-game w-full !py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                  {cargando ? "Creando cuenta..." : "Crear cuenta"}
                </button>
                {/* El RGPD obliga a informar al recoger los datos. Las páginas
                    existían, pero el registro no las enlazaba (auditoría del 3 oct 2026). */}
                <p className="text-[11px] text-center leading-relaxed" style={{ color: "#64748b" }}>
                  Al crear la cuenta aceptas las{" "}
                  <Link href="/terminos" className="underline" style={{ color: "#94a3b8" }}>condiciones de uso</Link>{" "}
                  y la{" "}
                  <Link href="/privacidad" className="underline" style={{ color: "#94a3b8" }}>política de privacidad</Link>.
                </p>
              </form>
            )}
          </div>

          {!registrado && (
            <p className="text-center text-xs mt-5" style={{ color: "#64748b" }}>
              ¿Ya tienes cuenta?{" "}
              <Link href={`/auth/login${destinoCuenta ? `?redirect=${encodeURIComponent(destinoCuenta)}` : ""}`} className="font-semibold hover:underline" style={{ color: "#22c55e" }}>Iniciar sesión</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RegistroPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0f1117" }}>
        <div className="animate-spin rounded-full h-8 w-8" style={{ border: "3px solid #2d3142", borderTopColor: "#22c55e" }} />
      </div>
    }>
      <RegistroPageInner />
    </Suspense>
  );
}
