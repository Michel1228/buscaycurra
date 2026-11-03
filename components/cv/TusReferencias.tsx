"use client";

/**
 * Tus referencias — cartas de recomendación que confirma quien las firmó
 * (lib/referencias/referencias.ts). Va en el editor del CV, debajo de
 * «Visible para empresas», porque es lo que ven las empresas.
 *
 * Una foto de la carta se pasa a PDF aquí: el almacenamiento de los CV solo
 * admite PDF.
 */
import { useEffect, useState } from "react";
import { fotoParaSubir } from "@/lib/imagen/foto-para-subir";

interface Referencia {
  id: string;
  empresa: string;
  firmante: string;
  cargo: string;
  estado: "pendiente" | "verificada" | "rechazada";
  premiada: boolean;
}

interface Premio { envios: number; cartasConPremio: number; maximo: number }

const ESTADO: Record<Referencia["estado"], { texto: string; color: string }> = {
  pendiente: { texto: "Esperando a que conteste", color: "#f59e0b" },
  verificada: { texto: "✓ Confirmada", color: "#22c55e" },
  rechazada: { texto: "No la ha confirmado", color: "#94a3b8" },
};

/** Una foto, a un PDF de una página con la foto entera. */
async function fotoAPdf(original: File): Promise<File> {
  const foto = await fotoParaSubir(original, 2000, 0.85);
  const url = await new Promise<string>((ok, mal) => {
    const lector = new FileReader();
    lector.onload = () => ok(String(lector.result));
    lector.onerror = () => mal(new Error("No se pudo leer la foto"));
    lector.readAsDataURL(foto);
  });
  const img = await new Promise<HTMLImageElement>((ok, mal) => {
    const i = new Image();
    i.onload = () => ok(i);
    i.onerror = () => mal(new Error("No se pudo abrir la foto"));
    i.src = url;
  });
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ unit: "px", format: [img.naturalWidth, img.naturalHeight], orientation: img.naturalWidth > img.naturalHeight ? "landscape" : "portrait" });
  pdf.addImage(url, foto.type === "image/png" ? "PNG" : "JPEG", 0, 0, img.naturalWidth, img.naturalHeight);
  return new File([pdf.output("blob")], "carta.pdf", { type: "application/pdf" });
}

const vacio = { empresa: "", firmante: "", cargo: "", email: "" };

export default function TusReferencias({ token }: { token: string }) {
  const [refs, setRefs] = useState<Referencia[]>([]);
  const [premio, setPremio] = useState<Premio>({ envios: 5, cartasConPremio: 2, maximo: 3 });
  const [abierto, setAbierto] = useState(false);
  const [datos, setDatos] = useState(vacio);
  const [carta, setCarta] = useState<File | null>(null);
  const [cartaPublica, setCartaPublica] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");

  const auth = { Authorization: `Bearer ${token}` };
  const aplicar = (j: { referencias?: Referencia[]; premio?: Premio }) => {
    if (j.referencias) setRefs(j.referencias);
    if (j.premio) setPremio(j.premio);
  };

  useEffect(() => {
    if (!token) return;
    fetch("/api/referencias", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null)).then((j) => j && aplicar(j)).catch(() => {});
  }, [token]);

  async function pedir() {
    setError(""); setAviso("");
    if (!datos.empresa.trim() || !datos.firmante.trim() || !datos.cargo.trim() || !datos.email.trim()) { setError("Rellena los cuatro datos."); return; }
    if (!carta) { setError("Falta la carta: súbela en PDF o hazle una foto."); return; }
    setEnviando(true);
    try {
      const pdf = carta.type === "application/pdf" ? carta : await fotoAPdf(carta);
      if (pdf.size > 5 * 1024 * 1024) { setError("La carta no puede pasar de 5 MB."); return; }
      const fd = new FormData();
      Object.entries(datos).forEach(([k, v]) => fd.append(k, v.trim()));
      fd.append("cartaPublica", String(cartaPublica));
      fd.append("carta", pdf);
      const res = await fetch("/api/referencias", { method: "POST", headers: auth, body: fd });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) { setError(j.error || "No se pudo pedir. Inténtalo de nuevo."); return; }
      aplicar(j);
      setDatos(vacio); setCarta(null); setCartaPublica(false); setAbierto(false);
      setAviso(`Hemos escrito a ${datos.firmante.trim().split(" ")[0]}. Te avisamos cuando conteste.`);
    } catch {
      setError("No se pudo preparar la carta. Prueba con un PDF o con otra foto.");
    } finally {
      setEnviando(false);
    }
  }

  async function quitar(id: string) {
    setError(""); setAviso("");
    const res = await fetch(`/api/referencias?id=${encodeURIComponent(id)}`, { method: "DELETE", headers: auth });
    const j = await res.json().catch(() => ({}));
    if (res.ok) aplicar(j); else setError(j.error || "No se pudo quitar.");
  }

  const campo = (k: keyof typeof vacio, etiqueta: string, ejemplo: string, tipo = "text") => (
    <label className="block">
      <span className="block text-[11px] font-semibold mb-1" style={{ color: "#94a3b8" }}>{etiqueta}</span>
      <input type={tipo} value={datos[k]} placeholder={ejemplo} maxLength={k === "email" ? 160 : 120}
        onChange={(e) => setDatos({ ...datos, [k]: e.target.value })}
        className="w-full text-sm" />
    </label>
  );

  return (
    <div className="rounded-xl p-5" style={{ background: "#161922", border: "1px solid #2d3142" }}>
      <h2 className="font-semibold text-sm mb-1" style={{ color: "#f1f5f9" }}>Tus referencias</h2>
      <p className="text-xs leading-relaxed mb-3" style={{ color: "#94a3b8" }}>
        ¿Tienes una carta de recomendación de un trabajo? Súbela y escribimos a quien la firmó para que confirme que es suya.
        Cuando lo confirma, las empresas lo ven en tu perfil y sales antes en su búsqueda.
      </p>
      <p className="text-[11px] mb-4 px-3 py-2 rounded-lg" style={{ color: "#22c55e", background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.15)" }}>
        🎁 Te damos {premio.envios} envíos de CV más por cada carta confirmada (hasta {premio.cartasConPremio}).
      </p>

      {refs.length > 0 && (
        <ul className="space-y-2 mb-4">
          {refs.map((r) => (
            <li key={r.id} className="flex items-start justify-between gap-3 p-3 rounded-lg" style={{ background: "#0f1117", border: "1px solid #2d3142" }}>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: "#f1f5f9" }}>{r.empresa}</p>
                <p className="text-[11px] truncate" style={{ color: "#64748b" }}>{r.firmante} · {r.cargo}</p>
                <p className="text-[11px] mt-1 font-semibold" style={{ color: ESTADO[r.estado].color }}>
                  {ESTADO[r.estado].texto}{r.premiada ? ` · +${premio.envios} envíos` : ""}
                </p>
              </div>
              <button onClick={() => void quitar(r.id)} className="text-[11px] flex-shrink-0 hover:opacity-80" style={{ color: "#94a3b8" }}>
                Quitar
              </button>
            </li>
          ))}
        </ul>
      )}

      {aviso && <p className="text-xs mb-3" style={{ color: "#22c55e" }}>{aviso}</p>}
      {error && <p className="text-xs mb-3" style={{ color: "#ef4444" }}>{error}</p>}

      {refs.length >= premio.maximo ? (
        <p className="text-[11px]" style={{ color: "#64748b" }}>Tienes {premio.maximo} cartas, el máximo. Quita una para subir otra.</p>
      ) : !abierto ? (
        <button onClick={() => { setAbierto(true); setAviso(""); }} className="px-4 py-2 text-xs font-semibold rounded-lg"
          style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "#fff" }}>
          + Añadir una carta
        </button>
      ) : (
        <div className="space-y-3">
          {campo("empresa", "Empresa donde trabajaste", "Ej.: Hotel Ribera")}
          {campo("firmante", "Nombre de quien firma la carta", "Ej.: Ana López")}
          {campo("cargo", "Su cargo", "Ej.: Jefa de sala")}
          {campo("email", "Su correo de la empresa", "nombre@empresa.es", "email")}
          <p className="text-[10px] -mt-1" style={{ color: "#64748b" }}>
            Tiene que ser el de la empresa, no un Gmail ni un Hotmail: así sabemos que contesta alguien de allí. Le escribiremos una sola vez.
          </p>
          <label className="block">
            <span className="block text-[11px] font-semibold mb-1" style={{ color: "#94a3b8" }}>La carta (PDF o foto)</span>
            <input type="file" accept="application/pdf,image/*" onChange={(e) => setCarta(e.target.files?.[0] ?? null)} className="text-xs" style={{ color: "#94a3b8" }} />
          </label>
          <label className="flex items-start gap-2 text-[11px] cursor-pointer" style={{ color: "#94a3b8" }}>
            <input type="checkbox" checked={cartaPublica} onChange={(e) => setCartaPublica(e.target.checked)} className="mt-0.5" />
            Dejar que las empresas con Plan Empresa lean la carta. Si no, solo ven que está confirmada, quién la firmó y su cargo.
          </label>
          <div className="flex gap-2 pt-1">
            <button onClick={() => void pedir()} disabled={enviando} className="px-4 py-2 text-xs font-semibold rounded-lg disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "#fff" }}>
              {enviando ? "Pidiendo…" : "Pedir que la confirme"}
            </button>
            <button onClick={() => { setAbierto(false); setError(""); }} className="px-3 py-2 text-xs rounded-lg" style={{ color: "#94a3b8", border: "1px solid #2d3142" }}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
