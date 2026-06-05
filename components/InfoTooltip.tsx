"use client";

import { useState, useRef, useEffect } from "react";

interface InfoTooltipProps {
  text: string;
  position?: "top" | "bottom" | "left" | "right";
}

export default function InfoTooltip({ text, position = "top" }: InfoTooltipProps) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setVisible(false);
      }
    }
    if (visible) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [visible]);

  const posStyles: Record<string, React.CSSProperties> = {
    top: { bottom: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)" },
    bottom: { top: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)" },
    left: { right: "calc(100% + 6px)", top: "50%", transform: "translateY(-50%)" },
    right: { left: "calc(100% + 6px)", top: "50%", transform: "translateY(-50%)" },
  };

  return (
    <div ref={ref} className="relative inline-flex items-center" style={{ lineHeight: 0 }}>
      <button
        type="button"
        onClick={() => setVisible(v => !v)}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        className="inline-flex items-center justify-center rounded-full text-[10px] font-bold transition hover:opacity-80"
        style={{
          width: 16, height: 16,
          background: "rgba(100,116,139,0.15)",
          border: "1px solid rgba(100,116,139,0.3)",
          color: "#64748b",
          cursor: "pointer",
          flexShrink: 0,
        }}
        aria-label="Información"
      >
        ?
      </button>
      {visible && (
        <div
          className="absolute z-50 rounded-lg text-[11px] leading-relaxed"
          style={{
            ...posStyles[position],
            background: "#1e212b",
            border: "1px solid #2d3142",
            color: "#94a3b8",
            padding: "8px 10px",
            width: 200,
            boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
            pointerEvents: "none",
          }}
        >
          {text}
        </div>
      )}
    </div>
  );
}
