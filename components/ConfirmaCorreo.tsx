"use client";

/**
 * components/ConfirmaCorreo.tsx — El aviso de "confirma tu correo" dentro de la app.
 *
 * POR QUÉ (7 nov 2026). Se entra sin confirmar el correo, pero para HACER algo
 * (el CV, enviarlo, Guzzi, guardar ofertas...) hay que confirmarlo: lo exige el
 * servidor (lib/auth-server.ts, correoSinVerificar), que contesta 403
 * { error: "confirma_correo" }. Esto solo lo explica, para que se vea bien:
 *
 *  - Un aviso fijo y discreto mientras no esté verificado, con "Reenviar".
 *  - La ventana común (ConfirmaCorreoVentana) que sale sola cuando CUALQUIER
 *    llamada devuelve confirma_correo: se escucha fetch una vez aquí, en el
 *    layout de /app, en vez de tocar cada pantalla.
 *
 * Va en app/app/layout.tsx y en su propio fichero, aparte de la navegación.
 */
import { useCallback, useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { ERROR_CONFIRMA_CORREO, correoVerificado } from "@/lib/auth/correo-verificado";
import ConfirmaCorreoVentana, { type EstadoReenvio } from "@/components/ConfirmaCorreoVentana";

const EVENTO = "bc:confirma-correo";
/** Las de /api/auth/ van solas (la bienvenida al entrar): no son algo que la persona haya pulsado. */
const RUTAS_DE_FONDO = /\/api\/auth\//;

/** Escucha todas las respuestas de fetch y avisa si alguna es confirma_correo. Devuelve cómo quitarlo. */
function escucharFetch(): () => void {
  const original = window.fetch;
  const escuchado: typeof window.fetch = async (entrada, init) => {
    const r = await original(entrada, init);
    if (r.status === 403) {
      const url = typeof entrada === "string" ? entrada : entrada instanceof URL ? entrada.href : entrada.url;
      if (!RUTAS_DE_FONDO.test(url)) {
        r.clone().json()
          .then((d: { error?: string; mensaje?: string }) => {
            if (d?.error === ERROR_CONFIRMA_CORREO) window.dispatchEvent(new CustomEvent(EVENTO, { detail: d.mensaje || "" }));
          })
          .catch(() => { /* no era JSON */ });
      }
    }
    return r;
  };
  window.fetch = escuchado;
  return () => { if (window.fetch === escuchado) window.fetch = original; };
}

async function conSesion(metodo: "GET" | "POST"): Promise<Response | null> {
  const { data: { session } } = await getSupabaseBrowser().auth.getSession();
  if (!session) return null;
  return fetch("/api/auth/verificar-correo", { method: metodo, headers: { Authorization: `Bearer ${session.access_token}` } });
}

export default function ConfirmaCorreo() {
  const [estado, setEstado] = useState<"?" | "verificado" | "pendiente">("?");
  const [email, setEmail] = useState("");
  const [ventana, setVentana] = useState<{ abierta: boolean; mensaje: string }>({ abierta: false, mensaje: "" });
  const [reenvio, setReenvio] = useState<EstadoReenvio>({ tipo: "" });
  const [comprobando, setComprobando] = useState(false);
  const [noConsta, setNoConsta] = useState(false);

  const comprobar = useCallback(async (alEntrar = false): Promise<boolean | null> => {
    try {
      // Al entrar, si la sesión ya lo dice, no hace falta preguntar al servidor.
      if (alEntrar) {
        const { data: { session } } = await getSupabaseBrowser().auth.getSession();
        if (!session) return null;
        if (correoVerificado(session.user)) { setEstado("verificado"); return true; }
      }
      const r = await conSesion("GET");
      if (!r?.ok) return null;
      const d = (await r.json()) as { verificado?: boolean; email?: string };
      if (d.email) setEmail(d.email);
      setEstado(d.verificado ? "verificado" : "pendiente");
      // Que la sesión del navegador lleve ya la marca (app_metadata va en el token).
      if (d.verificado && !alEntrar) void getSupabaseBrowser().auth.refreshSession().catch(() => {});
      return !!d.verificado;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    void comprobar(true);
    const quitar = escucharFetch();
    const abrir = (e: Event) => {
      setEstado("pendiente");
      setNoConsta(false);
      setVentana({ abierta: true, mensaje: (e as CustomEvent<string>).detail || "" });
    };
    window.addEventListener(EVENTO, abrir);
    return () => { quitar(); window.removeEventListener(EVENTO, abrir); };
  }, [comprobar]);

  // Vuelve del correo a esta pestaña: si ya ha confirmado, fuera el aviso.
  useEffect(() => {
    if (estado !== "pendiente") return;
    const alVolver = () => { if (document.visibilityState === "visible") void comprobar(); };
    document.addEventListener("visibilitychange", alVolver);
    return () => document.removeEventListener("visibilitychange", alVolver);
  }, [estado, comprobar]);

  const reenviar = useCallback(async () => {
    setReenvio({ tipo: "enviando" });
    try {
      const r = await conSesion("POST");
      const d = r ? ((await r.json().catch(() => ({}))) as { ok?: boolean; verificado?: boolean; enviadoA?: string; mensaje?: string }) : {};
      if (d.verificado) { setEstado("verificado"); setVentana({ abierta: false, mensaje: "" }); setReenvio({ tipo: "" }); return; }
      if (r?.ok && d.ok) { setReenvio({ tipo: "hecho", texto: d.enviadoA || email }); return; }
      setReenvio({ tipo: "error", texto: d.mensaje || "No se pudo mandar. Prueba dentro de un minuto." });
    } catch {
      setReenvio({ tipo: "error", texto: "No se pudo mandar. Prueba dentro de un minuto." });
    }
  }, [email]);

  const yaConfirmado = useCallback(async () => {
    setComprobando(true);
    const ok = await comprobar();
    setComprobando(false);
    if (ok) { setVentana({ abierta: false, mensaje: "" }); setReenvio({ tipo: "" }); }
    else setNoConsta(true);
  }, [comprobar]);

  if (estado !== "pendiente") return null;

  return (
    <>
      <div className="fixed left-1/2 -translate-x-1/2 z-30 max-w-[94vw]" style={{ top: 62 }} role="status">
        <div className="flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs shadow-lg"
          style={{ background: "rgba(12,15,22,0.94)", border: "1px solid rgba(245,158,11,0.5)", color: "#f1f5f9", boxShadow: "0 10px 30px -12px rgba(245,158,11,0.6)", backdropFilter: "blur(12px)" }}>
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "#f59e0b" }} />
          {reenvio.tipo === "hecho" ? (
            <span>Te lo hemos mandado a <strong>{reenvio.texto}</strong>. Mira también en Spam.</span>
          ) : (
            <>
              <button type="button" onClick={() => { setNoConsta(false); setVentana({ abierta: true, mensaje: "" }); }}
                className="text-left hover:underline">
                Confirma tu correo para usar todo BuscayCurra
              </button>
              <span style={{ color: "#8b98ad" }}>·</span>
              <button type="button" onClick={reenviar} disabled={reenvio.tipo === "enviando"}
                className="font-semibold underline disabled:opacity-50 shrink-0" style={{ color: "#bef264" }}>
                {reenvio.tipo === "enviando" ? "Enviando…" : "Reenviar"}
              </button>
            </>
          )}
        </div>
        {reenvio.tipo === "error" && !ventana.abierta && (
          <p className="mt-1 text-center text-[11px]" style={{ color: "#f59e0b" }}>{reenvio.texto}</p>
        )}
      </div>
      {ventana.abierta && (
        <ConfirmaCorreoVentana
          email={email}
          mensaje={ventana.mensaje}
          reenvio={reenvio}
          comprobando={comprobando}
          noConsta={noConsta}
          onReenviar={reenviar}
          onYaConfirmado={yaConfirmado}
          onCerrar={() => setVentana({ abierta: false, mensaje: "" })}
        />
      )}
    </>
  );
}
