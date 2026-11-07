"use client";

/**
 * components/ConfirmaCorreoVentana.tsx — La ventana común de "confirma tu correo".
 *
 * Sale sola cuando una acción devuelve confirma_correo (la abre
 * components/ConfirmaCorreo.tsx). Dice qué falta y deja hacerlo desde aquí:
 * reenviar el correo (con tope: uno por minuto, cinco al día) y "Ya lo he
 * confirmado", que vuelve a preguntar al servidor.
 */
import { useEffect } from "react";
import { Mail } from "lucide-react";

export type EstadoReenvio =
  | { tipo: "" }
  | { tipo: "enviando" }
  | { tipo: "hecho"; texto: string }
  | { tipo: "error"; texto: string };

export default function ConfirmaCorreoVentana(props: {
  email: string;
  mensaje: string;
  reenvio: EstadoReenvio;
  comprobando: boolean;
  noConsta: boolean;
  onReenviar: () => void;
  onYaConfirmado: () => void;
  onCerrar: () => void;
}) {
  const { email, mensaje, reenvio, comprobando, noConsta, onReenviar, onYaConfirmado, onCerrar } = props;

  useEffect(() => {
    const alPulsar = (e: KeyboardEvent) => { if (e.key === "Escape") onCerrar(); };
    window.addEventListener("keydown", alPulsar);
    return () => window.removeEventListener("keydown", alPulsar);
  }, [onCerrar]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-5" style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={onCerrar} role="dialog" aria-modal="true" aria-labelledby="confirma-correo-titulo">
      <div className="w-full max-w-sm rounded-2xl p-6 text-center" style={{ background: "#1e212b", border: "1px solid #2d3142" }}
        onClick={(e) => e.stopPropagation()}>
        <Mail size={40} className="mx-auto mb-3" style={{ color: "#f59e0b" }} />
        <h2 id="confirma-correo-titulo" className="text-lg font-bold mb-2" style={{ color: "#f1f5f9" }}>Confirma tu correo</h2>
        <p className="text-sm mb-2" style={{ color: "#94a3b8" }}>
          {mensaje || "Para hacer esto necesitas confirmar tu correo."}
        </p>
        <p className="text-sm mb-5" style={{ color: "#94a3b8" }}>
          {email ? <>El enlace va a <strong style={{ color: "#f1f5f9" }}>{email}</strong>. </> : null}
          Ábrelo y pulsa «Confirmar mi correo». ¿No lo ves? Mira en Spam o en Promociones.
        </p>

        {reenvio.tipo === "hecho" ? (
          <p className="text-xs mb-4" style={{ color: "#22c55e" }}>Te lo hemos mandado a {reenvio.texto}. Llega de noreply@buscaycurra.es.</p>
        ) : (
          <button type="button" onClick={onReenviar} disabled={reenvio.tipo === "enviando"}
            className="btn-game w-full !py-2.5 text-sm mb-3 disabled:opacity-50">
            {reenvio.tipo === "enviando" ? "Enviando…" : "Reenviar el correo"}
          </button>
        )}
        {reenvio.tipo === "error" && <p className="text-xs mb-3" style={{ color: "#f59e0b" }}>{reenvio.texto}</p>}

        <button type="button" onClick={onYaConfirmado} disabled={comprobando}
          className="w-full rounded-lg py-2.5 text-sm font-semibold mb-2 disabled:opacity-50"
          style={{ background: "transparent", border: "1px solid #2d3142", color: "#f1f5f9" }}>
          {comprobando ? "Comprobando…" : "Ya lo he confirmado"}
        </button>
        {noConsta && (
          <p className="text-xs mb-2" style={{ color: "#f59e0b" }}>
            Todavía no nos consta. Abre el enlace del correo y vuelve a pulsar aquí.
          </p>
        )}
        <button type="button" onClick={onCerrar} className="text-xs underline mt-1" style={{ color: "#64748b" }}>
          Ahora no
        </button>
      </div>
    </div>
  );
}
