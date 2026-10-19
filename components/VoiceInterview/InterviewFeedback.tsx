"use client";

import type { PartesFeedback } from "@/lib/entrevistas/feedback";

interface InterviewFeedbackProps {
  feedback: string;
  /** Las tres casillas. Si no vienen (formato roto o respuesta antigua), se enseña el texto. */
  partes?: PartesFeedback | null;
}

/**
 * Lo que contesta el entrevistador, en casillas cortas: lo que ha salido bien,
 * un detalle que pulir y cómo decirlo. Sin nota: es un ensayo, no un examen.
 */
export default function InterviewFeedback({ feedback, partes }: InterviewFeedbackProps) {
  if (!feedback) return null;

  if (!partes) {
    return (
      <div className="rounded-2xl p-4 text-sm whitespace-pre-wrap leading-relaxed"
           style={{ background: "#1e212b", border: "1px solid #2d3142", color: "#cbd5e1" }}>
        {feedback}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
      <div className="rounded-xl p-3.5" style={{ background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.25)" }}>
        <p className="text-[10px] uppercase tracking-wide font-semibold mb-1" style={{ color: "#22c55e" }}>Lo que te ha salido bien</p>
        <p className="text-sm leading-relaxed" style={{ color: "#e2e8f0" }}>{partes.bien}</p>
      </div>
      <div className="rounded-xl p-3.5" style={{ background: "#1e212b", border: "1px solid #2d3142" }}>
        <p className="text-[10px] uppercase tracking-wide font-semibold mb-1" style={{ color: "#f59e0b" }}>Un detalle</p>
        <p className="text-sm leading-relaxed" style={{ color: "#e2e8f0" }}>{partes.pulir}</p>
      </div>
      <div className="sm:col-span-2 rounded-xl p-3.5" style={{ background: "#1e212b", border: "1px solid #2d3142" }}>
        <p className="text-[10px] uppercase tracking-wide font-semibold mb-1" style={{ color: "#64748b" }}>Podrías decirlo así</p>
        <p className="text-sm leading-relaxed italic" style={{ color: "#e2e8f0" }}>«{partes.diloAsi}»</p>
      </div>
    </div>
  );
}
