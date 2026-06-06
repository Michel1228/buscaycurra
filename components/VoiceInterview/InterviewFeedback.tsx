"use client";

import { useEffect, useState } from "react";

interface InterviewFeedbackProps {
  feedback: string;
}

export default function InterviewFeedback({ feedback }: InterviewFeedbackProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (feedback) {
      // Pequeño delay para que se note la animación
      const t = setTimeout(() => setVisible(true), 50);
      return () => clearTimeout(t);
    } else {
      setVisible(false);
    }
  }, [feedback]);

  if (!feedback) return null;

  return (
    <div
      className="rounded-2xl p-4 text-sm whitespace-pre-wrap transition-all duration-300 ease-out"
      style={{
        background: "#0d2818",
        border: "1px solid #065f46",
        color: "#d1fae5",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(8px)",
        maxHeight: visible ? "600px" : "0px",
        overflow: "hidden",
      }}
    >
      {/* Cabecera del feedback */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-base">🤖</span>
        <span className="text-xs font-semibold" style={{ color: "#34d399" }}>
          Feedback de IA
        </span>
      </div>

      {/* Contenido del feedback */}
      <div className="space-y-1.5">
        {feedback.split("\n").map((line, i) => {
          const trimmed = line.trim();
          if (!trimmed) return null;

          // Detectar tipo de línea por prefijo
          const isPositive = trimmed.startsWith("✅");
          const isWarning = trimmed.startsWith("⚠️");
          const isTip = trimmed.startsWith("💡");
          const isScore = trimmed.startsWith("📊");

          let icon = "";
          let color = "#d1fae5";
          if (isPositive) { icon = "✅"; color = "#34d399"; }
          else if (isWarning) { icon = "⚠️"; color = "#fbbf24"; }
          else if (isTip) { icon = "💡"; color = "#60a5fa"; }
          else if (isScore) { icon = "📊"; color = "#c084fc"; }

          return (
            <p
              key={i}
              className="leading-relaxed"
              style={{ color }}
            >
              {trimmed}
            </p>
          );
        })}
      </div>
    </div>
  );
}
