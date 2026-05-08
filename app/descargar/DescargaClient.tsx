"use client";

import { useState } from "react";
import Link from "next/link";
import { usePWAInstall } from "@/hooks/usePWAInstall";

const FEATURES = [
  {
    icon: "📧",
    titulo: "CV enviado automáticamente",
    desc: "Dile a Guzzi qué empresa te interesa. Él redacta la carta, adjunta tu CV y lo envía. Sin formularios, sin portales.",
  },
  {
    icon: "🔍",
    titulo: "Búsqueda inteligente",
    desc: "Ofertas de Adzuna, Jooble y más, filtradas por Guzzi según tu perfil. Solo ves lo que de verdad te encaja.",
  },
  {
    icon: "📊",
    titulo: "Seguimiento de candidaturas",
    desc: "Pipeline visual de todo lo que has enviado. Nunca pierdas la pista de dónde estás en cada proceso.",
  },
];

const IOS_STEPS = [
  { num: "1", texto: "Abre esta página en Safari" },
  { num: "2", texto: 'Toca el icono Compartir (□↑) en la barra inferior' },
  { num: "3", texto: 'Selecciona "Añadir a pantalla de inicio"' },
];

export default function DescargaClient() {
  const { install, isIOS, isInstalled, canInstall } = usePWAInstall();
  const [iosModalAbierto, setIosModalAbierto] = useState(false);

  return (
    <div style={{ background: "#0a0c10", minHeight: "100vh", color: "#f1f5f9", fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif" }}>

      {/* ── Hero ── */}
      <section style={{ position: "relative", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px", overflow: "hidden" }}>

        {/* Fondo: glow verde sutil */}
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(34,197,94,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: "30%", left: "50%", transform: "translateX(-50%)", width: "600px", height: "600px", background: "radial-gradient(circle, rgba(34,197,94,0.04) 0%, transparent 70%)", pointerEvents: "none", borderRadius: "50%" }} />

        {/* Logo */}
        <div style={{ position: "absolute", top: "28px", left: "50%", transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "22px" }}>🐛</span>
          <span style={{ fontSize: "16px", fontWeight: 700, color: "#22c55e", letterSpacing: "-0.02em" }}>BuscayCurra</span>
        </div>

        {/* Contenido central */}
        <div style={{ maxWidth: "640px", width: "100%", textAlign: "center", position: "relative", zIndex: 1 }}>

          {/* Badge precio */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: "100px", padding: "6px 14px", marginBottom: "28px" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
            <span style={{ fontSize: "13px", color: "#22c55e", fontWeight: 600 }}>Gratis · Planes desde 2,99 €/mes</span>
          </div>

          <h1 style={{ fontSize: "clamp(36px, 8vw, 64px)", fontWeight: 800, lineHeight: 1.08, letterSpacing: "-0.03em", margin: "0 0 20px", color: "#f8fafc" }}>
            Tu próximo trabajo,<br />
            <span style={{ color: "#22c55e" }}>enviado por Guzzi</span>
          </h1>

          <p style={{ fontSize: "clamp(16px, 2.5vw, 19px)", color: "#94a3b8", lineHeight: 1.65, margin: "0 0 40px", maxWidth: "520px", marginLeft: "auto", marginRight: "auto" }}>
            El asistente IA que redacta y envía tu CV automáticamente.
            Sin formularios. Sin portales. Solo dile a qué empresa y él lo hace.
          </p>

          {/* CTA */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
            {isInstalled ? (
              <Link href="/app/gusi" style={{ display: "inline-flex", alignItems: "center", gap: "10px", background: "linear-gradient(135deg,#22c55e,#16a34a)", color: "#fff", fontWeight: 700, fontSize: "17px", padding: "16px 36px", borderRadius: "14px", textDecoration: "none", boxShadow: "0 8px 32px rgba(34,197,94,0.3)", letterSpacing: "-0.01em" }}>
                Abrir BuscayCurra →
              </Link>
            ) : canInstall ? (
              <button onClick={install} style={{ display: "inline-flex", alignItems: "center", gap: "10px", background: "linear-gradient(135deg,#22c55e,#16a34a)", color: "#fff", fontWeight: 700, fontSize: "17px", padding: "16px 36px", borderRadius: "14px", border: "none", cursor: "pointer", boxShadow: "0 8px 32px rgba(34,197,94,0.3)", letterSpacing: "-0.01em" }}>
                <span style={{ fontSize: "20px" }}>📲</span>
                Instalar gratis
              </button>
            ) : isIOS ? (
              <button onClick={() => setIosModalAbierto(true)} style={{ display: "inline-flex", alignItems: "center", gap: "10px", background: "linear-gradient(135deg,#22c55e,#16a34a)", color: "#fff", fontWeight: 700, fontSize: "17px", padding: "16px 36px", borderRadius: "14px", border: "none", cursor: "pointer", boxShadow: "0 8px 32px rgba(34,197,94,0.3)", letterSpacing: "-0.01em" }}>
                <span style={{ fontSize: "20px" }}>📲</span>
                Instalar en iPhone
              </button>
            ) : (
              <Link href="/auth/registro" style={{ display: "inline-flex", alignItems: "center", gap: "10px", background: "linear-gradient(135deg,#22c55e,#16a34a)", color: "#fff", fontWeight: 700, fontSize: "17px", padding: "16px 36px", borderRadius: "14px", textDecoration: "none", boxShadow: "0 8px 32px rgba(34,197,94,0.3)", letterSpacing: "-0.01em" }}>
                Empezar gratis →
              </Link>
            )}
            <p style={{ fontSize: "13px", color: "#475569", margin: 0 }}>Sin tarjeta. Sin compromisos. Solo resultados.</p>
          </div>

          {/* Stats */}
          <div style={{ display: "flex", justifyContent: "center", gap: "32px", marginTop: "52px", flexWrap: "wrap" }}>
            {[
              { valor: "100%", label: "gratis para empezar" },
              { valor: "2,99€", label: "plan de entrada" },
              { valor: "IA", label: "envía tu CV solo" },
            ].map((s) => (
              <div key={s.label} style={{ textAlign: "center" }}>
                <p style={{ fontSize: "22px", fontWeight: 800, color: "#f1f5f9", margin: "0 0 2px", letterSpacing: "-0.02em" }}>{s.valor}</p>
                <p style={{ fontSize: "12px", color: "#64748b", margin: 0, textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Flecha scroll */}
        <div style={{ position: "absolute", bottom: "32px", left: "50%", transform: "translateX(-50%)", animation: "bounce-arrow 2s infinite", opacity: 0.4 }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round">
            <path d="M5 8l5 5 5-5" />
          </svg>
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{ padding: "80px 24px", maxWidth: "1000px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "56px" }}>
          <h2 style={{ fontSize: "clamp(26px, 5vw, 40px)", fontWeight: 800, letterSpacing: "-0.03em", margin: "0 0 12px", color: "#f1f5f9" }}>
            Todo lo que necesitas para encontrar trabajo
          </h2>
          <p style={{ fontSize: "16px", color: "#64748b", margin: 0 }}>En el bolsillo. Sin esfuerzo extra.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
          {FEATURES.map((f) => (
            <div key={f.titulo} style={{ background: "#111520", border: "1px solid #1e2334", borderRadius: "20px", padding: "32px 28px", transition: "border-color 0.2s" }}>
              <div style={{ width: "48px", height: "48px", background: "rgba(34,197,94,0.1)", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", marginBottom: "20px" }}>
                {f.icon}
              </div>
              <h3 style={{ fontSize: "17px", fontWeight: 700, color: "#f1f5f9", margin: "0 0 10px", letterSpacing: "-0.01em" }}>{f.titulo}</h3>
              <p style={{ fontSize: "14px", color: "#64748b", lineHeight: 1.65, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Precio ── */}
      <section style={{ padding: "0 24px 80px", maxWidth: "560px", margin: "0 auto", textAlign: "center" }}>
        <div style={{ background: "linear-gradient(135deg, #0f1a0f, #111520)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: "24px", padding: "40px 36px" }}>
          <p style={{ fontSize: "13px", fontWeight: 600, color: "#22c55e", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 12px" }}>Empieza por menos de un café</p>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: "6px", marginBottom: "8px" }}>
            <span style={{ fontSize: "52px", fontWeight: 900, color: "#f1f5f9", letterSpacing: "-0.04em" }}>2,99</span>
            <span style={{ fontSize: "22px", fontWeight: 600, color: "#64748b" }}>€/mes</span>
          </div>
          <p style={{ fontSize: "14px", color: "#64748b", margin: "0 0 28px", lineHeight: 1.6 }}>
            Plan Esencial — 60 candidaturas al mes, IA avanzada,<br />buscador completo y más.
          </p>
          <Link href="/precios" style={{ display: "inline-block", background: "linear-gradient(135deg,#22c55e,#16a34a)", color: "#fff", fontWeight: 700, fontSize: "15px", padding: "14px 32px", borderRadius: "12px", textDecoration: "none", letterSpacing: "-0.01em" }}>
            Ver todos los planes →
          </Link>
        </div>
      </section>

      {/* ── Cómo instalar ── */}
      <section style={{ padding: "0 24px 100px", maxWidth: "800px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <h2 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 800, letterSpacing: "-0.03em", margin: "0 0 10px", color: "#f1f5f9" }}>
            Instala en dos pasos
          </h2>
          <p style={{ fontSize: "15px", color: "#64748b", margin: 0 }}>Sin App Store. Sin Google Play. Directo desde el navegador.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>

          {/* Android */}
          <div style={{ background: "#111520", border: "1px solid #1e2334", borderRadius: "20px", padding: "32px 28px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
              <span style={{ fontSize: "26px" }}>🤖</span>
              <span style={{ fontSize: "16px", fontWeight: 700, color: "#f1f5f9" }}>Android (Chrome)</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {[
                "Abre esta página en Chrome",
                'Toca el menú ⋮ arriba a la derecha',
                'Selecciona "Añadir a pantalla de inicio"',
              ].map((paso, i) => (
                <div key={i} style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                  <span style={{ minWidth: "26px", height: "26px", borderRadius: "50%", background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, color: "#22c55e" }}>{i + 1}</span>
                  <span style={{ fontSize: "14px", color: "#94a3b8", lineHeight: 1.55, paddingTop: "2px" }}>{paso}</span>
                </div>
              ))}
            </div>
          </div>

          {/* iOS */}
          <div style={{ background: "#111520", border: "1px solid #1e2334", borderRadius: "20px", padding: "32px 28px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
              <span style={{ fontSize: "26px" }}>🍎</span>
              <span style={{ fontSize: "16px", fontWeight: 700, color: "#f1f5f9" }}>iPhone / iPad (Safari)</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {IOS_STEPS.map((paso, i) => (
                <div key={i} style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                  <span style={{ minWidth: "26px", height: "26px", borderRadius: "50%", background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, color: "#22c55e" }}>{paso.num}</span>
                  <span style={{ fontSize: "14px", color: "#94a3b8", lineHeight: 1.55, paddingTop: "2px" }}>{paso.texto}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: "1px solid #1e2334", padding: "28px 24px", textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "8px" }}>
          <span style={{ fontSize: "18px" }}>🐛</span>
          <span style={{ fontSize: "14px", fontWeight: 700, color: "#22c55e" }}>BuscayCurra</span>
        </div>
        <p style={{ fontSize: "12px", color: "#334155", margin: 0 }}>
          © 2025 BuscayCurra · <Link href="/precios" style={{ color: "#475569", textDecoration: "none" }}>Precios</Link> · <Link href="/auth/login" style={{ color: "#475569", textDecoration: "none" }}>Acceder</Link>
        </p>
      </footer>

      {/* ── Modal iOS ── */}
      {iosModalAbierto && (
        <div
          onClick={() => setIosModalAbierto(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center", padding: "0 16px 16px", backdropFilter: "blur(8px)" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "#161a28", border: "1px solid #2d3142", borderRadius: "24px", padding: "32px 28px", width: "100%", maxWidth: "440px" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#f1f5f9", margin: 0 }}>Instalar en iPhone</h3>
              <button onClick={() => setIosModalAbierto(false)} style={{ background: "none", border: "none", color: "#64748b", fontSize: "22px", cursor: "pointer", lineHeight: 1 }}>×</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {[
                { num: "1", icon: "🧭", texto: "Asegúrate de estar en Safari (no Chrome ni otro navegador)" },
                { num: "2", icon: "□↑", texto: "Toca el icono Compartir en la barra inferior de Safari", mono: true },
                { num: "3", icon: "➕", texto: 'Desplázate y selecciona "Añadir a pantalla de inicio"' },
                { num: "4", icon: "✅", texto: 'Toca "Añadir" arriba a la derecha. ¡Listo!' },
              ].map((paso) => (
                <div key={paso.num} style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                  <span style={{ minWidth: "32px", height: "32px", borderRadius: "50%", background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 700, color: "#22c55e" }}>{paso.num}</span>
                  <div style={{ paddingTop: "4px" }}>
                    <span style={{ fontSize: "15px", color: "#e2e8f0", lineHeight: 1.55 }}>{paso.texto}</span>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setIosModalAbierto(false)}
              style={{ marginTop: "28px", width: "100%", background: "linear-gradient(135deg,#22c55e,#16a34a)", color: "#fff", fontWeight: 700, fontSize: "15px", padding: "14px", borderRadius: "12px", border: "none", cursor: "pointer" }}
            >
              Entendido
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
