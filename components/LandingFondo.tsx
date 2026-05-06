"use client";

// Partículas del fondo de la landing — cliente para evitar hydration mismatch

const PARTICULAS = [
  { w: 5, h: 5, left: 8,  top: 12, c: 0, op: 0.18, dur: 6.2, delay: 0.4 },
  { w: 3, h: 3, left: 23, top: 35, c: 1, op: 0.22, dur: 5.1, delay: 1.2 },
  { w: 6, h: 6, left: 41, top: 7,  c: 2, op: 0.15, dur: 7.8, delay: 0.0 },
  { w: 4, h: 4, left: 57, top: 55, c: 0, op: 0.20, dur: 4.9, delay: 2.1 },
  { w: 3, h: 3, left: 68, top: 28, c: 1, op: 0.17, dur: 6.5, delay: 0.7 },
  { w: 5, h: 5, left: 79, top: 72, c: 2, op: 0.14, dur: 8.0, delay: 1.8 },
  { w: 4, h: 4, left: 15, top: 81, c: 0, op: 0.19, dur: 5.6, delay: 0.3 },
  { w: 3, h: 3, left: 33, top: 63, c: 1, op: 0.16, dur: 7.2, delay: 2.5 },
  { w: 6, h: 6, left: 88, top: 44, c: 2, op: 0.21, dur: 4.7, delay: 1.0 },
  { w: 4, h: 4, left: 52, top: 90, c: 0, op: 0.13, dur: 6.8, delay: 0.6 },
  { w: 3, h: 3, left: 95, top: 18, c: 1, op: 0.18, dur: 5.3, delay: 1.5 },
  { w: 5, h: 5, left: 4,  top: 95, c: 2, op: 0.15, dur: 7.1, delay: 2.9 },
];

const COLORES = ["#7ed56f", "#f0c040", "#8b6f47"];

export default function LandingFondo() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Gradientes orgánicos */}
      <div style={{
        position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
        background: `
          radial-gradient(ellipse 800px 600px at 15% 20%, rgba(126,213,111,0.08) 0%, transparent 70%),
          radial-gradient(ellipse 600px 800px at 85% 70%, rgba(139,111,71,0.06) 0%, transparent 70%),
          radial-gradient(ellipse 500px 500px at 50% 50%, rgba(240,192,64,0.04) 0%, transparent 60%),
          radial-gradient(ellipse 300px 300px at 70% 30%, rgba(126,213,111,0.05) 0%, transparent 60%)
        `,
      }} />

      {/* SVG ramas decorativas */}
      <svg className="absolute top-0 left-0 w-full h-full opacity-[0.07]" viewBox="0 0 1440 900" preserveAspectRatio="none">
        <path d="M-20 80 Q100 120 200 60 Q300 10 400 50 Q450 70 500 30" stroke="#7ed56f" strokeWidth="2" fill="none" />
        <path d="M200 60 Q180 20 160 -10" stroke="#7ed56f" strokeWidth="1.5" fill="none" />
        <path d="M300 10 Q280 -20 310 -40" stroke="#7ed56f" strokeWidth="1" fill="none" />
        <ellipse cx="170" cy="10" rx="12" ry="6" fill="#7ed56f" transform="rotate(-30 170 10)" />
        <ellipse cx="290" cy="-15" rx="10" ry="5" fill="#5cb848" transform="rotate(-45 290 -15)" />
        <ellipse cx="420" cy="55" rx="11" ry="5" fill="#7ed56f" transform="rotate(15 420 55)" />
        <path d="M1460 750 Q1300 720 1200 780 Q1100 830 1000 800 Q920 780 850 810" stroke="#8b6f47" strokeWidth="2" fill="none" />
        <path d="M1200 780 Q1230 820 1250 860" stroke="#8b6f47" strokeWidth="1.5" fill="none" />
        <ellipse cx="1240" cy="840" rx="12" ry="6" fill="#7ed56f" transform="rotate(40 1240 840)" />
        <ellipse cx="1050" cy="810" rx="10" ry="5" fill="#5cb848" transform="rotate(-20 1050 810)" />
        <path d="M-30 500 Q80 480 150 520 Q220 550 280 510" stroke="#5cb848" strokeWidth="1.5" fill="none" opacity="0.6" />
        <ellipse cx="100" cy="490" rx="9" ry="4" fill="#7ed56f" transform="rotate(10 100 490)" opacity="0.5" />
        <path d="M1460 300 Q1380 320 1320 280 Q1260 250 1200 290" stroke="#8b6f47" strokeWidth="1.5" fill="none" opacity="0.5" />
        <ellipse cx="1350" cy="300" rx="10" ry="5" fill="#5cb848" transform="rotate(-25 1350 300)" opacity="0.4" />
      </svg>

      {/* Partículas flotantes — valores fijos, sin Math.random() */}
      {PARTICULAS.map((p, i) => (
        <div key={i} className="absolute rounded-full"
          style={{
            width: `${p.w}px`,
            height: `${p.h}px`,
            left: `${p.left}%`,
            top: `${p.top}%`,
            background: COLORES[p.c],
            opacity: p.op,
            animation: `float-gentle ${p.dur}s ease-in-out ${p.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}
