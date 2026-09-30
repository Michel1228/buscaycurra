/**
 * lib/confirmar-direccion.ts (navegador)
 * Avisa antes de mandar un CV a una dirección que hemos deducido.
 *
 * POR QUÉ. Del 1 al 29 sep 2026 rebotaron 9 de 25 envíos de CV (36 %), casi
 * todos a direcciones deducidas (empleo@, rrhh@, info@ + dominio). La persona
 * creía que su CV había llegado. Y de las ofertas con correo, 1.050.269 tienen
 * uno deducido ("probable") frente a 25.956 verificados (30 sep 2026): es lo
 * normal, así que no se bloquea, pero se dice antes de enviar.
 *
 * Solo pregunta cuando SABEMOS que es deducida: confianza "media" o "baja", o
 * construida en la propia pantalla (empleo@ + dominio de la oferta). Con
 * "alta" o sin dato no se molesta. Quien no quiera que se le pregunte más lo
 * marca una vez y queda guardado en ese dispositivo.
 *
 * La ventana se monta directamente en el documento, así cada pantalla la usa
 * con una línea sin tener que añadir estado propio.
 */

const CLAVE_NO_PREGUNTAR = "bc_no_preguntar_direccion_deducida";

export function esDireccionDeducida(confianza?: string | null, construidaAqui = false): boolean {
  return construidaAqui || confianza === "media" || confianza === "baja";
}

function noPreguntarMas(): boolean {
  try { return localStorage.getItem(CLAVE_NO_PREGUNTAR) === "1"; } catch { return false; }
}

/**
 * true si se puede enviar (dirección confirmada, o la persona acepta).
 * false si la persona cancela.
 */
export function confirmarEnvioADireccion(opciones: {
  email: string;
  empresa?: string;
  confianza?: string | null;
  construidaAqui?: boolean;
}): Promise<boolean> {
  if (typeof document === "undefined") return Promise.resolve(true);
  if (!esDireccionDeducida(opciones.confianza, opciones.construidaAqui)) return Promise.resolve(true);
  if (noPreguntarMas()) return Promise.resolve(true);

  return new Promise((resolver) => {
    const fondo = document.createElement("div");
    fondo.setAttribute("role", "dialog");
    fondo.setAttribute("aria-modal", "true");
    fondo.setAttribute("aria-labelledby", "bc-dir-titulo");
    fondo.style.cssText =
      "position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,0.65);display:flex;align-items:center;justify-content:center;padding:16px;";

    const tarjeta = document.createElement("div");
    tarjeta.style.cssText =
      "width:100%;max-width:380px;background:#1e212b;border:1px solid #2d3142;border-radius:16px;padding:20px;font-family:inherit;box-shadow:0 20px 50px rgba(0,0,0,0.5);";

    const titulo = document.createElement("h2");
    titulo.id = "bc-dir-titulo";
    titulo.textContent = "Este correo no está confirmado";
    titulo.style.cssText = "margin:0 0 10px;color:#f1f5f9;font-size:17px;font-weight:700;";

    const texto = document.createElement("p");
    texto.style.cssText = "margin:0 0 10px;color:#94a3b8;font-size:14px;line-height:1.55;";
    const empresa = opciones.empresa ? `de ${opciones.empresa} ` : "";
    texto.append(`No hemos encontrado el correo ${empresa}publicado. Vamos a probar con `);
    const dir = document.createElement("strong");
    dir.textContent = opciones.email;
    dir.style.cssText = "color:#f1f5f9;overflow-wrap:anywhere;";
    texto.append(dir, ", que es el más habitual, pero puede que no exista.");

    const nota = document.createElement("p");
    nota.textContent = "Si rebota, te avisamos en la campanita y no te gasta ningún envío.";
    nota.style.cssText = "margin:0 0 14px;color:#64748b;font-size:13px;line-height:1.5;";

    const etiqueta = document.createElement("label");
    etiqueta.style.cssText = "display:flex;align-items:center;gap:8px;margin:0 0 16px;color:#94a3b8;font-size:13px;cursor:pointer;";
    const casilla = document.createElement("input");
    casilla.type = "checkbox";
    casilla.style.cssText = "width:16px;height:16px;accent-color:#22c55e;";
    etiqueta.append(casilla, "No volver a preguntarme");

    const botones = document.createElement("div");
    botones.style.cssText = "display:flex;gap:10px;";
    const cancelar = document.createElement("button");
    cancelar.type = "button";
    cancelar.textContent = "Cancelar";
    cancelar.style.cssText =
      "flex:1;padding:11px 12px;border-radius:10px;border:1px solid #2d3142;background:transparent;color:#94a3b8;font-size:14px;font-weight:600;cursor:pointer;";
    const enviar = document.createElement("button");
    enviar.type = "button";
    enviar.textContent = "Enviar igualmente";
    enviar.style.cssText =
      "flex:1;padding:11px 12px;border-radius:10px;border:none;background:#22c55e;color:#0f1117;font-size:14px;font-weight:700;cursor:pointer;";
    botones.append(cancelar, enviar);

    tarjeta.append(titulo, texto, nota, etiqueta, botones);
    fondo.append(tarjeta);

    const cerrar = (respuesta: boolean) => {
      if (respuesta && casilla.checked) {
        try { localStorage.setItem(CLAVE_NO_PREGUNTAR, "1"); } catch { /* sin almacenamiento */ }
      }
      document.removeEventListener("keydown", teclas);
      fondo.remove();
      resolver(respuesta);
    };
    const teclas = (e: KeyboardEvent) => { if (e.key === "Escape") cerrar(false); };

    cancelar.addEventListener("click", () => cerrar(false));
    enviar.addEventListener("click", () => cerrar(true));
    fondo.addEventListener("click", (e) => { if (e.target === fondo) cerrar(false); });
    document.addEventListener("keydown", teclas);

    document.body.append(fondo);
    enviar.focus();
  });
}
