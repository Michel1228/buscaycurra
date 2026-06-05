"use client";

import { useState } from "react";
import LogoGusano from "./LogoGusano";

interface LogoGuzziProps {
  size?: number;
  animated?: boolean;
  className?: string;
}

export default function LogoGuzzi({ size = 40, animated = false, className = "" }: LogoGuzziProps) {
  const [imgError, setImgError] = useState(false);

  if (imgError) {
    return <LogoGusano size={size} animated={animated} className={className} />;
  }

  return (
    <img
      src="/guzzi.png"
      alt="GUZZI — Mascota de BuscayCurra"
      width={size}
      height={size}
      onError={() => setImgError(true)}
      className={`object-contain ${animated ? "animate-float" : ""} ${className}`}
      style={{ imageRendering: "crisp-edges" }}
    />
  );
}
