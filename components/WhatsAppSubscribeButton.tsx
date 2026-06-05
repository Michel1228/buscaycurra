"use client";

import { useState, useEffect, useRef } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

export default function WhatsAppSubscribeButton() {
  const [estado, setEstado] = useState<"idle" | "cargando" | "activo" | "sin-numero">("idle");
  const [telefono, setTelefono] = useState("");
  const [guardado, setGuardado] = useState(false);
  const telefonoRef = useRef(telefono);
  telefonoRef.current = telefono;

  useEffect(() => {
    cargarEstado();
  }, []);

  async function cargarEstado() {
    try {
      const supabase = getSupabaseBrowser();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: p } = await supabase
        .from("profiles")
        .select("whatsapp_phone, whatsapp_alertas")
        .eq("id", session.user.id)
        .single();

      if (p?.whatsapp_phone) {
        setTelefono(p.whatsapp_phone);
        setEstado(p.whatsapp_alertas ? "activo" : "sin-numero");
      }
    } catch { /* noop */ }
  }

  async function activar() {
    if (estado === "activo") {
      // Desactivar
      setEstado("cargando");
      try {
        const supabase = getSupabaseBrowser();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        await supabase
          .from("profiles")
          .update({ whatsapp_alertas: false })
          .eq("id", session.user.id);

        setEstado("sin-numero");
      } catch { setEstado("activo"); }
      return;
    }

    if (!telefonoRef.current || telefonoRef.current.length < 9) {
      return;
    }

    setEstado("cargando");
    try {
      const supabase = getSupabaseBrowser();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const limpio = telefonoRef.current.replace(/[\s\+\-\(\)]/g, "");

      await supabase
        .from("profiles")
        .update({
          whatsapp_phone: limpio,
          whatsapp_alertas: true,
        })
        .eq("id", session.user.id);

      setGuardado(true);
      setEstado("activo");
      setTimeout(() => setGuardado(false), 2500);
    } catch {
      setEstado("sin-numero");
    }
  }

  return (
    <div className="p-4 rounded-xl space-y-3"
      style={{ background: "#161922", border: "1px solid #2d3142" }}>
      <div className="flex items-center gap-3">
        <span className="text-xl">📱</span>
        <div className="flex-1">
          <p className="text-sm font-medium" style={{ color: "#f1f5f9" }}>
            Alertas por WhatsApp
          </p>
          <p className="text-xs" style={{ color: "#64748b" }}>
            {estado === "activo"
              ? `✅ Activas — recibirás ofertas en ${telefono}`
              : "Recibe ofertas de empleo directamente en WhatsApp."}
          </p>
        </div>
      </div>

      {/* Input de teléfono */}
      <div className="flex items-center gap-2">
        <span className="text-xs px-2 py-1 rounded flex-shrink-0"
          style={{ background: "#0f1117", color: "#94a3b8", border: "1px solid #2d3142" }}>
          +34
        </span>
        <input
          type="tel"
          placeholder="600 123 456"
          value={telefono}
          onChange={e => {
            setTelefono(e.target.value);
            if (estado === "activo") setEstado("sin-numero");
          }}
          className="flex-1 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#22c55e]/30 transition"
          style={{ background: "#0f1117", border: "1px solid #2d3142", color: "#f1f5f9" }}
        />
        <button
          onClick={activar}
          disabled={estado === "cargando" || telefono.length < 9}
          className="text-xs font-semibold px-3 py-2 rounded-lg transition flex-shrink-0 disabled:opacity-40"
          style={{
            background: estado === "activo"
              ? "rgba(239,68,68,0.1)"
              : "rgba(34,197,94,0.12)",
            color: estado === "activo" ? "#ef4444" : "#22c55e",
            border: `1px solid ${estado === "activo" ? "rgba(239,68,68,0.2)" : "rgba(34,197,94,0.2)"}`,
          }}
        >
          {estado === "cargando"
            ? "..."
            : guardado
            ? "✅ Guardado"
            : estado === "activo"
            ? "Desactivar"
            : "Activar"}
        </button>
      </div>
    </div>
  );
}
