"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

export default function MariposaPage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fase, setFase] = useState<"oruga" | "crisalida" | "mariposa">("oruga");
  const [nombre, setNombre] = useState("");
  const [fotoUrl, setFotoUrl] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [puesto, setPuesto] = useState("");
  const [totalEnvios, setTotalEnvios] = useState(0);
  const [tarjetaLista, setTarjetaLista] = useState(false);

  useEffect(() => {
    async function cargar() {
      const { data: { user } } = await getSupabaseBrowser().auth.getUser();
      if (!user) { router.push("/auth/login"); return; }

      const [{ data: p }, { count }] = await Promise.all([
        getSupabaseBrowser().from("profiles")
          .select("full_name, avatar_url, empresa_objetivo, puesto_objetivo")
          .eq("id", user.id).single(),
        getSupabaseBrowser().from("cv_sends")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id),
      ]);

      if (p) {
        setNombre((p.full_name as string || "").split(" ")[0]);
        setFotoUrl(p.avatar_url as string || "");
        setEmpresa(p.empresa_objetivo as string || "");
        setPuesto(p.puesto_objetivo as string || "");
      }
      setTotalEnvios(count || 0);

      await getSupabaseBrowser().from("profiles")
        .update({ oruga_stage: 4 }).eq("id", user.id);

      // Secuencia de animación
      setTimeout(() => setFase("crisalida"), 2200);
      setTimeout(() => setFase("mariposa"), 4000);
      setTimeout(() => setTarjetaLista(true), 5000);
    }
    cargar();
  }, [router]);

  const mensajeLogro = totalEnvios >= 10
    ? `Enviaste ${totalEnvios} candidaturas. Solo necesitabas que una dijera sí.`
    : totalEnvios > 0
    ? `A veces el trabajo correcto aparece antes de lo esperado.`
    : `Cada gran historia empieza con el primer paso.`;

  const textoCompartir = `¡Lo conseguí! 🦋${puesto ? ` Ahora soy ${puesto}` : ""}${empresa ? ` en ${empresa}` : ""}.\n\n${totalEnvios >= 10 ? `Envié ${totalEnvios} candidaturas. Solo necesitaba que una dijera sí.` : "A veces el trabajo correcto aparece antes de lo esperado."}\n\nGracias a Guzzi de BuscayCurra 🐛→🦋`;

  const descargarTarjeta = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 1080;
    canvas.height = 1080;

    // Fondo
    const grad = ctx.createLinearGradient(0, 0, 0, 1080);
    grad.addColorStop(0, "#0a0f07");
    grad.addColorStop(0.5, "#1a1a12");
    grad.addColorStop(1, "#0f1a0a");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1080, 1080);

    // Partículas decorativas
    for (let i = 0; i < 60; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * 1080, Math.random() * 1080, Math.random() * 3 + 1, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(126,213,111,${Math.random() * 0.3 + 0.1})`;
      ctx.fill();
    }

    // Círculo central glow
    const glowGrad = ctx.createRadialGradient(540, 430, 0, 540, 430, 280);
    glowGrad.addColorStop(0, "rgba(126,213,111,0.15)");
    glowGrad.addColorStop(1, "rgba(126,213,111,0)");
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(540, 430, 280, 0, Math.PI * 2);
    ctx.fill();

    // Si tiene foto, la cargamos; si no, emoji
    const drawText = () => {
      // Emoji mariposa grande
      ctx.font = "120px serif";
      ctx.textAlign = "center";
      ctx.fillText("🦋", 540, 520);

      // Nombre
      ctx.font = "bold 72px -apple-system, sans-serif";
      ctx.fillStyle = "#7ed56f";
      ctx.fillText(`¡${nombre || "Lo conseguiste"}!`, 540, 630);

      // Puesto y empresa
      if (puesto || empresa) {
        ctx.font = "bold 42px -apple-system, sans-serif";
        ctx.fillStyle = "#f0ebe0";
        ctx.fillText(puesto || "", 540, 700);
        if (empresa) {
          ctx.font = "36px -apple-system, sans-serif";
          ctx.fillStyle = "#706a58";
          ctx.fillText(`en ${empresa}`, 540, 756);
        }
      }

      // Mensaje logro
      ctx.font = "32px -apple-system, sans-serif";
      ctx.fillStyle = "#504a3a";
      const words = mensajeLogro.split(" ");
      let line = "";
      let y = 840;
      for (const word of words) {
        const test = line + word + " ";
        if (ctx.measureText(test).width > 900 && line) {
          ctx.fillText(line.trim(), 540, y);
          line = word + " ";
          y += 44;
        } else { line = test; }
      }
      if (line) ctx.fillText(line.trim(), 540, y);

      // Branding
      ctx.font = "bold 28px -apple-system, sans-serif";
      ctx.fillStyle = "rgba(126,213,111,0.5)";
      ctx.fillText("BuscayCurra · buscaycurra.es", 540, 1020);

      // Descargar
      const link = document.createElement("a");
      link.download = "mi-metamorfosis.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    };

    if (fotoUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(540, 370, 180, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, 360, 190, 360, 360);
        ctx.restore();

        // Borde foto
        ctx.beginPath();
        ctx.arc(540, 370, 182, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(126,213,111,0.6)";
        ctx.lineWidth = 4;
        ctx.stroke();

        drawText();
      };
      img.onerror = drawText;
      img.src = fotoUrl;
    } else {
      drawText();
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden relative"
      style={{ background: "linear-gradient(180deg, #0a0f07 0%, #1a1a12 50%, #0f1a0a 100%)" }}>

      {/* Partículas flotantes */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {[...Array(25)].map((_, i) => (
          <div key={i} className="absolute rounded-full"
            style={{
              width: (Math.random() * 5 + 2) + "px",
              height: (Math.random() * 5 + 2) + "px",
              left: (Math.random() * 100) + "%",
              top: (Math.random() * 100) + "%",
              background: i % 2 === 0 ? "rgba(126,213,111,0.35)" : "rgba(240,192,64,0.25)",
              animation: `rise ${4 + (i % 5)}s ease-in-out infinite`,
              animationDelay: (i * 0.3) + "s",
            }} />
        ))}
      </div>

      <div className="relative z-10 text-center max-w-sm w-full">

        {/* FASE 1 — Oruga */}
        {fase === "oruga" && (
          <div className="flex flex-col items-center gap-6">
            <div style={{ fontSize: "80px", animation: "crawl 1.5s ease-in-out infinite" }}>🐛</div>
            <p className="text-sm" style={{ color: "#504a3a" }}>Algo está a punto de cambiar...</p>
          </div>
        )}

        {/* FASE 2 — Crisálida */}
        {fase === "crisalida" && (
          <div className="flex flex-col items-center gap-6">
            <div style={{ fontSize: "80px", animation: "pulse-glow 0.8s ease-in-out infinite" }}>🌀</div>
            <p className="text-sm" style={{ color: "#7ed56f", animation: "fade-in 0.5s ease" }}>La metamorfosis...</p>
          </div>
        )}

        {/* FASE 3 — Mariposa */}
        {fase === "mariposa" && (
          <div style={{ animation: "emerge 0.8s ease forwards" }}>

            {/* Foto o emoji con alas CSS */}
            <div className="relative flex items-center justify-center mb-6" style={{ height: "160px" }}>
              {/* Alas izquierda */}
              <div className="absolute" style={{
                left: "-40px", top: "20px", width: "80px", height: "80px",
                background: "radial-gradient(ellipse at right, rgba(126,213,111,0.6), rgba(240,192,64,0.3), transparent)",
                borderRadius: "50% 0 50% 50%",
                transform: "rotate(-30deg)",
                animation: "wing 2s ease-in-out infinite",
                filter: "blur(2px)",
              }} />
              {/* Alas derecha */}
              <div className="absolute" style={{
                right: "-40px", top: "20px", width: "80px", height: "80px",
                background: "radial-gradient(ellipse at left, rgba(126,213,111,0.6), rgba(240,192,64,0.3), transparent)",
                borderRadius: "0 50% 50% 50%",
                transform: "rotate(30deg)",
                animation: "wing 2s ease-in-out infinite 0.1s",
                filter: "blur(2px)",
              }} />

              {/* Foto o icono */}
              {fotoUrl ? (
                <img src={fotoUrl} alt={nombre}
                  className="w-28 h-28 rounded-full object-cover relative z-10"
                  style={{
                    border: "3px solid rgba(126,213,111,0.7)",
                    boxShadow: "0 0 40px rgba(126,213,111,0.35), 0 0 80px rgba(126,213,111,0.1)",
                  }} />
              ) : (
                <span className="relative z-10" style={{ fontSize: "90px", animation: "wing 2s ease-in-out infinite" }}>🦋</span>
              )}
            </div>

            {/* Texto */}
            <div style={{ animation: "fade-up 0.6s ease 0.2s both" }}>
              <h1 className="text-3xl font-bold mb-1" style={{ color: "#7ed56f", letterSpacing: "-0.5px" }}>
                ¡{nombre ? `${nombre}, lo conseguiste` : "Lo conseguiste"}! 🦋
              </h1>

              {(puesto || empresa) && (
                <div className="mt-3 mb-4 px-4 py-3 rounded-2xl mx-auto inline-block"
                  style={{ background: "rgba(126,213,111,0.08)", border: "1.5px solid rgba(126,213,111,0.2)" }}>
                  {puesto && <p className="text-base font-bold" style={{ color: "#f0ebe0" }}>{puesto}</p>}
                  {empresa && <p className="text-sm" style={{ color: "#706a58" }}>en {empresa}</p>}
                </div>
              )}

              <p className="text-sm mb-6 px-2 leading-relaxed" style={{ color: "#706a58" }}>
                {mensajeLogro}
              </p>
            </div>

            {/* Tarjeta y compartir */}
            {tarjetaLista && (
              <div className="space-y-2.5" style={{ animation: "fade-up 0.5s ease both" }}>
                <button onClick={descargarTarjeta}
                  className="w-full py-3.5 rounded-2xl text-sm font-bold transition hover:opacity-90 hover:scale-[1.02]"
                  style={{
                    background: "linear-gradient(135deg, rgba(126,213,111,0.2), rgba(240,192,64,0.15))",
                    border: "1.5px solid rgba(126,213,111,0.35)", color: "#7ed56f",
                  }}>
                  📥 Descargar mi tarjeta de logro
                </button>
                <button onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent("https://buscaycurra.es")}&summary=${encodeURIComponent(textoCompartir)}`, "_blank")}
                  className="w-full py-3 rounded-2xl text-sm font-bold transition hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #0a66c2, #084a8e)", color: "white" }}>
                  Compartir en LinkedIn 🦋
                </button>
                <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(textoCompartir + "\n👉 buscaycurra.es")}`, "_blank")}
                  className="w-full py-3 rounded-2xl text-sm font-bold transition hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #25d366, #128c7e)", color: "white" }}>
                  Compartir en WhatsApp
                </button>
                <button onClick={() => router.push("/app/gusi")}
                  className="w-full py-2 text-xs hover:opacity-70 transition"
                  style={{ color: "#3d3c30" }}>
                  Volver a Guzzi
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Canvas oculto para generar imagen */}
      <canvas ref={canvasRef} className="hidden" />

      <style jsx global>{`
        @keyframes crawl {
          0%, 100% { transform: translateX(-8px) rotate(-3deg); }
          50% { transform: translateX(8px) rotate(3deg); }
        }
        @keyframes pulse-glow {
          0%, 100% { transform: scale(1) rotate(0deg); filter: drop-shadow(0 0 10px rgba(126,213,111,0.3)); }
          50% { transform: scale(1.15) rotate(180deg); filter: drop-shadow(0 0 30px rgba(126,213,111,0.7)); }
        }
        @keyframes wing {
          0%, 100% { transform: rotate(-30deg) scaleX(1); opacity: 0.7; }
          50% { transform: rotate(-20deg) scaleX(1.1); opacity: 1; }
        }
        @keyframes emerge {
          from { opacity: 0; transform: scale(0.85) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in {
          from { opacity: 0; } to { opacity: 1; }
        }
        @keyframes rise {
          0% { transform: translateY(0) scale(1); opacity: 0.4; }
          50% { transform: translateY(-40px) scale(1.2); opacity: 0.7; }
          100% { transform: translateY(-80px) scale(0.8); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
